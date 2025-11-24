/**
 * EMA News / Guidance Import (Scraping)
 * Quelle (Beispiel): https://www.ema.europa.eu/en/news
 * ZIEL: Extrahiert Titel, Datum und Link und legt Einträge als regulatory_updates (type=guidance, category=ema_news) an.
 * HINWEIS: Struktur der EMA Seite kann sich ändern. Selektoren ggf. anpassen.
 * Nutzung:
 *   npx tsx scripts/import-ema-news.ts --limit=15
 */
import 'dotenv/config';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import crypto from 'node:crypto';
import { regulatoryUpdates } from '../shared/schema.js';
import { getScriptDb } from './script-db';

interface NewsItem {
  title: string;
  url: string;
  date: string | null;
  summary?: string | null;
  contentType?: string | null;
  categories: string[];
  page: number;
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

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'HelixRegBot/1.0 (+https://helix-reg-intelligence.internal)',
      'Accept': 'text/html,application/xhtml+xml'
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} für ${url}`);
  return await res.text();
}

function normalizeUrl(href: string | undefined): string | null {
  if (!href) return null;
  if (href.startsWith('http')) return href;
  return `https://www.ema.europa.eu${href}`;
}

function extractNews(html: string, page: number): NewsItem[] {
  const $ = cheerio.load(html);
  const items: NewsItem[] = [];
  // Primärer Selektor für Listenkarten
  $('article.node.ema-news').each((_, el) => {
    const card = $(el);
    const anchor = card.find('.teaser-title a').first();
    const title = anchor.text().trim();
    const url = normalizeUrl(anchor.attr('href'));
    if (!title || !url) return;

    const dateText = card.find('.metadata .metadata-item').first().text().trim() || null;
    const timeNode = card.find('time').first();
    const isoDate = timeNode.attr('datetime')?.trim() || dateText;

    const summary = card.find('.card-text p, .ema-news__field-ema-summary p').first().text().trim() || null;
    const badges = card.find('.card-badge-wrapper .label').map((_, badge) => $(badge).text().trim()).get();
    const contentType = card.find('.bundle-name .label').first().text().trim() || null;

    items.push({
      title,
      url,
      date: isoDate || null,
      summary,
      contentType,
      categories: badges.filter(Boolean),
      page,
    });
  });
  return items;
}

async function main() {
  const opts = parseArgs();
  const limit = parseInt(opts.limit || '20', 10);
  const pages = Math.max(1, parseInt(opts.pages || '3', 10));
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL nicht gesetzt');
    process.exit(1);
  }
  const { sql, db, driver } = getScriptDb();
  console.log(`[DB] import-ema-news using driver=${driver}`);

  const baseUrl = 'https://www.ema.europa.eu/en/news';
  const collected: NewsItem[] = [];

  for (let page = 0; page < pages; page++) {
    const pageUrl = page === 0 ? baseUrl : `${baseUrl}?page=${page}`;
    console.log(`🔍 Lade EMA News Seite ${page + 1}: ${pageUrl}`);
    let html: string;
    try {
      html = await fetchPage(pageUrl);
    } catch (e: any) {
      console.error(`❌ Fehler beim Abruf Seite ${page + 1}:`, e.message);
      if (collected.length === 0) process.exit(1);
      break;
    }
    const pageItems = extractNews(html, page);
    for (const item of pageItems) {
      if (collected.find((n) => n.url === item.url)) continue;
      collected.push(item);
      if (collected.length >= limit) break;
    }
    if (collected.length >= limit) break;
  }

  console.log(`📦 Extrahiert: ${collected.length} Einträge`);

  let inserted = 0;
  for (const n of collected.slice(0, limit)) {
    try {
      const hashedTitle = crypto.createHash('sha256').update(n.title.toLowerCase()).digest('hex');
      // Duplicate Prüfen: hashedTitle + publishedDate
      const existing = await sql`SELECT id FROM regulatory_updates WHERE hashed_title=${hashedTitle} AND source_url=${n.url}`;
      if (existing.length) {
        console.log(`⏭️ Duplikat übersprungen: ${n.title}`);
        continue;
      }
      await db.insert(regulatoryUpdates).values({
        title: n.title,
        hashedTitle,
        description: n.summary ?? n.title,
        type: 'guidance',
        category: 'ema_news',
        jurisdiction: 'EU',
        sourceUrl: n.url,
        publishedDate: n.date ? new Date(n.date) : null,
        effectiveDate: n.date ? new Date(n.date) : null,
        priority: 2,
        riskLevel: 'low',
        actionRequired: false,
        actionType: 'monitoring',
        language: 'en',
        tags: Array.from(new Set(['ema','news', ...(n.categories ?? [])].map((t) => t.toLowerCase().replace(/\s+/g, '_')))),
        authorityVerified: true,
        authorityRecommendations: null,
        costDataAvailable: false,
        metadata: {
          rawDate: n.date,
          summary: n.summary,
          contentType: n.contentType,
          categories: n.categories,
          page: n.page,
        }
      });
      inserted++;
    } catch (e: any) {
      console.error(`⚠️ Fehler Insert EMA News: ${n.title} -> ${e.message}`);
    }
  }
  console.log(`✅ Fertig. Neu eingefügt: ${inserted}`);
}

main().catch(e => {
  console.error('💥 Unerwarteter Fehler:', e);
  process.exit(1);
});
