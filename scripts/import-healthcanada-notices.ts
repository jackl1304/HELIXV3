/**
 * Health Canada Health Product & Drug Recalls (HEALTH category)
 * API: https://healthycanadians.gc.ca/recall-alert-rappel-avis/api/recent/en?t={count}&cat=3
 * cat=3 = Health Products (Drugs, Devices); HEALTH in response
 */
import 'dotenv/config';
import fetch from 'node-fetch';
import crypto from 'node:crypto';
import { regulatoryUpdates } from '../shared/schema.js';
import { getScriptDb } from './script-db';

interface HCResult {
  recallId: string;
  title: string;
  category: string[];
  date_published: number;
  url: string;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: Record<string,string> = {};
  for (const a of args) {
    const [k,v] = a.replace(/^--/,'').split('=');
    if (k) opts[k] = v ?? 'true';
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  const limit = parseInt(opts.limit || '30', 10);
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL fehlt');
  const { sql, db, driver } = getScriptDb();
  console.log(`[DB] import-healthcanada-notices using driver=${driver}`);

  // API für HEALTH category (cat=3 = Health Products)
  const url = `https://healthycanadians.gc.ca/recall-alert-rappel-avis/api/recent/en?t=${limit}&cat=3`;
  console.log(`🔍 Lade Health Canada Health Product Recalls: ${url}`);
  const res = await fetch(url, { headers: { 'User-Agent': 'HelixRegBot/1.0' }});
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: { results: { HEALTH: HCResult[] }} = await res.json() as any;
  const items = json.results?.HEALTH || [];
  console.log(`📦 Empfangen: ${items.length} Einträge`);

  let inserted = 0;
  for (const item of items.slice(0, limit)) {
    const title = item.title;
    const link = `https://healthycanadians.gc.ca${item.url}`;
    const datePublished = new Date(item.date_published * 1000);
    const hashedTitle = crypto.createHash('sha256').update(title.toLowerCase()).digest('hex');
    const dup = await sql`SELECT id FROM regulatory_updates WHERE hashed_title=${hashedTitle} AND source_url=${link}`;
    if (dup.length) {
      console.log(`⏭️ Duplikat übersprungen: ${title.slice(0,60)}`);
      continue;
    }
    try {
      await db.insert(regulatoryUpdates).values({
        title,
        hashedTitle,
        description: title,
        type: 'regulation',
        category: 'health_canada_recall',
        jurisdiction: 'CA',
        sourceUrl: link,
        publishedDate: datePublished,
        effectiveDate: datePublished,
        language: 'en',
        priority: 3,
        riskLevel: 'medium',
        actionRequired: true,
        actionType: 'immediate',
        tags: ['health_canada','ca','recall','health_product'],
        authorityVerified: true,
        authorityRecommendations: null,
        costDataAvailable: false,
        metadata: { recallId: item.recallId, categories: item.category, apiUrl: url }
      });
      inserted++;
    } catch (e:any) {
      console.error(`Health Canada Insert Fehler: ${title.slice(0,60)} -> ${e.message}`);
    }
  }
  console.log(`✅ Health Canada neu eingefügt: ${inserted}`);
}
main().catch(e => { console.error(e); process.exit(1); });
