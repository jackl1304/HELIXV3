/**
 * WHO Guidance / News Import (RSS / HTML Fallback)
 * Primär: https://www.who.int/rss-feeds (Beispiel: news releases)
 */
import 'dotenv/config';
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';
import crypto from 'node:crypto';
import { regulatoryUpdates } from '../shared/schema.js';
import { getScriptDb } from './script-db';

// Kandidaten-Feeds (WHO hat verschiedene Pfade; einige liefern 404 je nach Region)
const FEEDS = [
  'https://www.who.int/feeds/entity/mediacentre/news/en/rss.xml',
  'https://www.who.int/feeds/entity/media-centre/news/en/rss.xml',
  'https://www.who.int/feeds/entity/csr/don/en/rss.xml', // Disease Outbreak News
  'https://www.who.int/feeds/entity/health-topics/en/rss.xml'
];

async function fetchFirstValidFeed(): Promise<{ xml: string; url: string }> {
  for (const url of FEEDS) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'HelixRegBot/1.0' }});
      if (!res.ok) { continue; }
      const text = await res.text();
      if (text.includes('<rss')) return { xml: text, url };
    } catch { /* ignore */ }
  }
  throw new Error('Kein WHO RSS Feed erreichbar (alle Kandidaten fehlgeschlagen)');
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL fehlt');
  const { xml, url } = await fetchFirstValidFeed();
  const parsed = await parseStringPromise(xml);
  const items = parsed?.rss?.channel?.[0]?.item || [];
  const { sql, db, driver } = getScriptDb();
  console.log(`[DB] import-who-guidance using driver=${driver}`);
  let inserted = 0;
  for (const it of items.slice(0, 40)) {
    const title: string = it.title?.[0]?.trim();
    const link: string = it.link?.[0];
    const pubDate: string = it.pubDate?.[0];
    if (!title || !link) continue;
    const hashedTitle = crypto.createHash('sha256').update(title.toLowerCase()).digest('hex');
    const dup = await sql`SELECT id FROM regulatory_updates WHERE hashed_title=${hashedTitle} AND source_url=${link}`;
    if (dup.length) continue;
    try {
      await db.insert(regulatoryUpdates).values({
        title,
        hashedTitle,
        description: title,
        type: 'guidance',
        category: 'who_news',
        jurisdiction: 'GLOBAL',
        sourceUrl: link,
        publishedDate: pubDate ? new Date(pubDate) : null,
        effectiveDate: pubDate ? new Date(pubDate) : null,
        priority: 2,
        riskLevel: 'low',
        actionRequired: false,
        actionType: 'monitoring',
        language: 'en',
        tags: ['who','global'],
        authorityVerified: true,
        authorityRecommendations: null,
        costDataAvailable: false,
        metadata: { feedTried: FEEDS, feedUsed: url }
      });
      inserted++;
    } catch (e: any) {
      console.error('WHO Insert Fehler:', e.message);
    }
  }
  console.log('WHO neu eingefügt:', inserted);
}
main().catch(e => { console.error(e); process.exit(1); });
