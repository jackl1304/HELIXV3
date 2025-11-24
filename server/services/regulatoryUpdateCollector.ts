import axios from 'axios';
import * as cheerio from 'cheerio';
// Removed direct AI provider naming for neutrality
import OpenAI from 'openai';
import { db } from '../storage'; // reuse connection (side-effect import ok)
import { regulatoryUpdates } from '../../shared/schema';

/**
 * Lightweight automation for regulatory updates.
 * Strategy:
 *  - Config list of sources (id, name, type, fetchFn)
 *  - Each fetchFn returns array of normalized update objects
 *  - Dedup: title + sourceId + publishedDate
 *  - Storage via direct SQL (fallback if insert fails)
 *  - Basic retry/backoff for transient 5xx/429
 */

export interface RawUpdate {
  title: string;
  description?: string;
  documentUrl?: string;
  sourceUrl?: string; // Canonical landing page for the update
  publishedDate?: string; // ISO
  type?: string; // guidance, regulation, alert
  jurisdiction?: string;
  sourceId: string;
  tags?: string[];
  riskScore?: number;
  keyPoints?: string[];
}

interface SourceConfig {
  id: string;
  name: string;
  type: string; // guidance, regulation, alert
  region?: string;
  fetchFn: () => Promise<RawUpdate[]>;
  enabled?: boolean;
  maxItems?: number;
}

// Environment toggles
const AUTO_ENABLED = process.env.REG_AUTO_ENABLED === 'true';
const MAX_ITEMS_GLOBAL = parseInt(process.env.REG_MAX_ITEMS || '50', 10);
const EMBED_ENABLED = process.env.REG_EMBED_ENABLED === 'true';
const EMBEDDING_KEY = process.env.OPENAI_API_KEY;
const embedClient = EMBEDDING_KEY ? new OpenAI({ apiKey: EMBEDDING_KEY }) : null; // usage rein auf Embedding-Funktion reduziert

// Laufzeit-Statistiken
export const regAutomationRunStats: {
  lastRunAt?: string;
  durationSec?: number;
  collected?: number;
  stored?: number;
  errors?: string[];
} = {};

// Simple delay
function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function httpGet(url: string, attempts = 3, baseDelay = 1000): Promise<any> {
  for (let i = 0; i < attempts; i++) {
    try {
      return (await axios.get(url, { timeout: 15000 })).data;
    } catch (err: any) {
      if (i === attempts - 1) throw err;
      const status = err.response?.status;
      if (status && [400, 404].includes(status)) throw err; // don't retry permanent errors
      await delay(baseDelay * (i + 1));
    }
  }
}

// ---------------------------
// Source Fetch Implementations
// ---------------------------

// 1. FDA Device Enforcement (JSON API via openFDA)
async function fetchFdaEnforcement(): Promise<RawUpdate[]> {
  try {
    // openFDA endpoint (simplified) - limited sample size
    const limit = 20;
    const url = `https://api.fda.gov/device/enforcement.json?search=reason_for_recall:%22device%22&limit=${limit}`;
    const data = await httpGet(url);
    const results = data?.results || [];
    return results.map((r: any) => ({
      title: r.product_description?.slice(0, 180) || 'FDA Device Enforcement',
      description: `${r.reason_for_recall || 'Recall'} - Classification: ${r.classification || 'N/A'}`,
      documentUrl: r.more_code_info || 'https://www.fda.gov/medical-devices',
      sourceUrl: 'https://www.fda.gov/medical-devices',
      publishedDate: r.report_date || new Date().toISOString(),
      type: 'alert',
      jurisdiction: 'US',
      sourceId: 'fda_enforcement',
      tags: ['recall','enforcement','post-market']
    }));
  } catch (e: unknown) {
    const msg = (e as any)?.message || String(e);
    console.warn('[REG] FDA enforcement fetch failed:', msg);
    return [];
  }
}

// 2. MDCG Guidance (HTML parsing)
async function fetchMdcgGuidance(): Promise<RawUpdate[]> {
  const baseUrl = 'https://health.ec.europa.eu/mdcg_en';
  try {
    const html = await (await axios.get(baseUrl, { timeout: 20000 })).data;
    const $ = cheerio.load(html);
    const updates: RawUpdate[] = [];
    // Heuristik: Links mit 'MDCG' + PDF oder detail page
    $('a').each((_: number, el: any) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');
      if (!text || !href) return;
      const isGuidance = /MDCG\s?20\d{2}|MDCG Guidance/i.test(text);
      const isPdf = href.endsWith('.pdf');
      if (isGuidance) {
        const absolute = href.startsWith('http') ? href : new URL(href, baseUrl).toString();
        updates.push({
          title: text.slice(0, 240),
          description: 'MDCG Guidance Dokument (automatisch extrahiert)',
          documentUrl: absolute,
          publishedDate: new Date().toISOString(), // Keine Datumsangabe direkt – später erweitern
          type: 'guidance',
          jurisdiction: 'EU',
          sourceId: 'mdcg_guidance',
          tags: ['mdcg','guidance'].concat(isPdf ? ['pdf'] : [])
        });
      }
    });
    if (updates.length === 0) {
      // Fallback Stub
      return [{
        title: 'MDCG Guidance (Fallback Stub)',
        description: 'Keine Links extrahiert – Parsen verfeinern.',
        documentUrl: baseUrl,
        sourceUrl: baseUrl,
        publishedDate: new Date().toISOString(),
        type: 'guidance',
        jurisdiction: 'EU',
        sourceId: 'mdcg_guidance',
        tags: ['mdcg','guidance','fallback']
      }];
    }
    return updates.slice(0, 25); // Begrenzung
  } catch (e: unknown) {
    const msg = (e as any)?.message || String(e);
    console.warn('[REG] MDCG guidance parse failed:', msg);
    return [{
      title: 'MDCG Guidance (Error Stub)',
      description: 'Fehler beim Abruf – Details im Log.',
      documentUrl: baseUrl,
      sourceUrl: baseUrl,
      publishedDate: new Date().toISOString(),
      type: 'guidance',
      jurisdiction: 'EU',
      sourceId: 'mdcg_guidance',
      tags: ['mdcg','guidance','error']
    }];
  }
}

// 3. MHRA Safety Alerts (HTML parsing)
async function fetchMhraAlerts(): Promise<RawUpdate[]> {
  const baseUrl = 'https://www.gov.uk/government/collections/device-alerts';
  try {
    const html = await (await axios.get(baseUrl, { timeout: 20000 })).data;
    const $ = cheerio.load(html);
    const updates: RawUpdate[] = [];
    $('a').each((_: number, el: any) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');
      if (!text || !href) return;
      if (/alert|safety|field safety/i.test(text) && text.length > 10) {
        const absolute = href.startsWith('http') ? href : new URL(href, baseUrl).toString();
        updates.push({
          title: text.slice(0, 220),
          description: 'MHRA Safety / Device Alert (automatisch extrahiert)',
          documentUrl: absolute,
          sourceUrl: baseUrl,
          publishedDate: new Date().toISOString(),
          type: 'alert',
          jurisdiction: 'UK',
          sourceId: 'mhra_alerts',
          tags: ['mhra','alert','safety']
        });
      }
    });
    if (updates.length === 0) {
      return [{
        title: 'MHRA Safety Alert (Fallback Stub)',
        description: 'Keine Alerts extrahiert – Parsen verfeinern.',
        documentUrl: baseUrl,
        sourceUrl: baseUrl,
        publishedDate: new Date().toISOString(),
        type: 'alert',
        jurisdiction: 'UK',
        sourceId: 'mhra_alerts',
        tags: ['mhra','alert','fallback']
      }];
    }
    return updates.slice(0, 30);
  } catch (e: unknown) {
    const msg = (e as any)?.message || String(e);
    console.warn('[REG] MHRA alerts parse failed:', msg);
    return [{
      title: 'MHRA Safety Alert (Error Stub)',
      description: 'Fehler beim Abruf – Details im Log.',
      documentUrl: baseUrl,
      sourceUrl: baseUrl,
      publishedDate: new Date().toISOString(),
      type: 'alert',
      jurisdiction: 'UK',
      sourceId: 'mhra_alerts',
      tags: ['mhra','alert','error']
    }];
  }
}

// Source configuration list
export const REG_SOURCES: SourceConfig[] = [
  { id: 'fda_enforcement', name: 'FDA Device Enforcement', type: 'alert', region: 'US', fetchFn: fetchFdaEnforcement, enabled: true, maxItems: 25 },
  { id: 'mdcg_guidance', name: 'MDCG Guidance', type: 'guidance', region: 'EU', fetchFn: fetchMdcgGuidance, enabled: true, maxItems: 5 },
  { id: 'mhra_alerts', name: 'MHRA Alerts', type: 'alert', region: 'UK', fetchFn: fetchMhraAlerts, enabled: true, maxItems: 5 }
];

// ---------------------------
// Deduplication Helper
// ---------------------------
function normalizeTitleForHash(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ') // non-alphanumerics to space
    .replace(/\s+/g, ' ') // collapse spaces
    .trim();
}

async function isDuplicate(update: RawUpdate): Promise<boolean> {
  try {
    const titleNorm = update.title.trim();
    const sourceId = update.sourceId;
    const published = update.publishedDate ? update.publishedDate.split('T')[0] : null;
    const hashed = normalizeTitleForHash(update.title);
    const sql = (db as any).query ? (db as any) : null; // drizzle instance
    if (!sql) return false; // If not available, skip dedup check

    const result = await (db as any).execute({
      sql: `SELECT id FROM regulatory_updates WHERE source_id = $1 AND (title = $2 OR hashed_title = $4) AND DATE(published_date) = $3 LIMIT 1`,
      params: [sourceId, titleNorm, published, hashed]
    });
    return Array.isArray(result) && result.length > 0;
  } catch (e: unknown) {
    const msg = (e as any)?.message || String(e);
    console.warn('[REG] Dedup check failed, assume not duplicate:', msg);
    return false;
  }
}

// ---------------------------
// Storage Insert
// ---------------------------
async function storeUpdate(update: RawUpdate, embedding: number[] | null) {
  try {
    const tagsArray = update.tags && update.tags.length > 0 ? `{${update.tags.map(t => `"${t.replace(/"/g,'\\"')}"`).join(',')}}` : null;
    const publishedDate = update.publishedDate ? update.publishedDate.split('T')[0] : null;
    const keyPointsArray = update.keyPoints && update.keyPoints.length > 0 ? `{${update.keyPoints.map((t: string) => `"${t.replace(/"/g,'\\"')}"`).join(',')}}` : null;
    const hashedTitle = normalizeTitleForHash(update.title);
    const embeddingLiteral = embedding ? '[' + embedding.join(',') + ']' : null;
    // Using raw neon sql via db (assuming drizzle neon-http binding). Fallback generation if fails.
    const result = await (db as any).execute({
      sql: `INSERT INTO regulatory_updates (id, source_id, title, hashed_title, description, document_url, type, jurisdiction, tags, published_date, risk_score, key_points, embedding, created_at, updated_at)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()) RETURNING id`,
      params: [
        update.sourceId,
        update.title,
        hashedTitle,
        update.description || null,
        update.documentUrl || null,
        update.type || 'regulation',
        update.jurisdiction || null,
        tagsArray,
        publishedDate,
        update.riskScore || 0,
        keyPointsArray,
        embeddingLiteral
      ]
    });
    return result?.[0]?.id || null;
  } catch (e: unknown) {
    const msg = (e as any)?.message || String(e);
    console.error('[REG] Store update failed – returning mock object:', msg);
    return null;
  }
}

// ---------------------------
// Main Automation Runner
// ---------------------------
export async function runRegulatoryAutomation(options: { dryRun?: boolean } = {}) {
  if (!AUTO_ENABLED && !options.dryRun) {
    console.log('[REG] Automation disabled (set REG_AUTO_ENABLED=true to enable). Running only if dryRun.');
    if (!options.dryRun) return { disabled: true };
  }

  const start = Date.now();
  let collected: RawUpdate[] = [];
  let stored = 0;
  const errors: string[] = [];

  for (const source of REG_SOURCES) {
    if (!source.enabled) continue;
    try {
      console.log(`[REG] Fetching ${source.id} ...`);
      const items = await source.fetchFn();
      const limited = source.maxItems ? items.slice(0, source.maxItems) : items;
      collected = collected.concat(limited);
      console.log(`[REG] ${source.id} fetched ${limited.length} items.`);
    } catch (e: any) {
      console.error(`[REG] Source ${source.id} failed:`, e.message);
      errors.push(`${source.id}: ${e.message}`);
    }
  }

  // Global cap
  if (collected.length > MAX_ITEMS_GLOBAL) {
    collected = collected.slice(0, MAX_ITEMS_GLOBAL);
  }

  // Store with dedup
  for (const update of collected) {
    if (await isDuplicate(update)) {
      continue;
    }
    if (!options.dryRun) {
      // Classification vor Speicherung
      const classified = applyClassification(update);
      // Datum fallback extrahieren
      if (!classified.publishedDate) {
        classified.publishedDate = extractDateFromTitle(classified.title);
      }
      const embedding = EMBED_ENABLED && embedClient ? await embedTextSafe(classified) : null;
      const id = await storeUpdate(classified, embedding);
      if (id) stored++;
    }
  }

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`[REG] Automation complete: ${collected.length} collected, ${stored} stored in ${duration}s`);
  regAutomationRunStats.lastRunAt = new Date().toISOString();
  regAutomationRunStats.durationSec = parseFloat(duration);
  regAutomationRunStats.collected = collected.length;
  regAutomationRunStats.stored = stored;
  regAutomationRunStats.errors = errors;
  return { collected: collected.length, stored, errors, duration, dryRun: !!options.dryRun };
}

// ---------------------------
// Classification Logic (simple heuristic until NLP added)
// ---------------------------
function applyClassification(update: RawUpdate): RawUpdate {
  const text = `${update.title} ${update.description || ''}`.toLowerCase();
  let score = 10; // baseline
  const keyPoints: string[] = [];

  const boosts: Array<[RegExp, number, string]> = [
    [/class i/i, 30, 'Critical Recall'],
    [/recall|enforcement|field safety/i, 25, 'Field Safety / Enforcement'],
    [/guidance|mdcg|update/i, 15, 'Guidance Impact'],
    [/software|algorithm|ml|sa md/i, 12, 'Software/Algorithm'],
    [/cyber|security|vulnerability/i, 20, 'Cybersecurity Risk'],
    [/clinical|evaluation|evidence/i, 10, 'Clinical Impact'],
    [/risk|hazard|serious/i, 18, 'Risk Signal'],
  ];

  for (const [regex, boost, label] of boosts) {
    if (regex.test(text)) {
      score += boost;
      keyPoints.push(label);
    }
  }

  // Cap score
  if (score > 100) score = 100;
  // Deduplicate key points
  const uniquePoints = [...new Set(keyPoints)];

  return { ...update, riskScore: score, keyPoints: uniquePoints };
}

// ---------------------------
// Date Extraction (simple heuristic)
// ---------------------------
function extractDateFromTitle(title: string): string | undefined {
  const yearMatch = title.match(/20\d{2}/);
  if (!yearMatch) return undefined;
  const year = yearMatch[0];
  // Try month detection
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', sept: '09', oct: '10', nov: '11', dec: '12'
  };
  const lower = title.toLowerCase();
  let month = '01';
  for (const key of Object.keys(monthMap)) {
    if (lower.includes(key)) { month = monthMap[key]; break; }
  }
  return `${year}-${month}-01T00:00:00.000Z`;
}

// ---------------------------
// Embedding Helper
// ---------------------------
async function embedTextSafe(update: RawUpdate): Promise<number[] | null> {
  try {
    if (!embedClient) return null;
    const input = `${update.title}\n\n${update.description || ''}`;
    const resp = await embedClient.embeddings.create({ model: 'text-embedding-3-small', input });
    const vector = resp.data?.[0]?.embedding;
    return Array.isArray(vector) ? vector : null;
  } catch (e: unknown) {
    const msg = (e as any)?.message || String(e);
    console.warn('[REG] Embedding failed:', msg);
    return null;
  }
}

// Convenience CLI trigger when executed directly
// Note: ES modules don't have require.main === module
// Use: node --loader tsx server/services/regulatoryUpdateCollector.ts --dry
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const dry = process.argv.includes('--dry');
    const result = await runRegulatoryAutomation({ dryRun: dry });
    console.log('[REG RESULT]', result);
  })();
}
