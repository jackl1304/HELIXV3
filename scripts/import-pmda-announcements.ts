/**
 * PMDA (Japan) Announcements (English site) Stub
 * Beispiel: https://www.pmda.go.jp/english/ (Struktur kann variieren)
 */
import 'dotenv/config';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import crypto from 'node:crypto';
import { regulatoryUpdates } from '../shared/schema.js';
import { getScriptDb } from './script-db';

const URL = 'https://www.pmda.go.jp/english/';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL fehlt');
  const html = await (await fetch(URL)).text();
  const $ = cheerio.load(html);
  const { sql, db, driver } = getScriptDb();
  console.log(`[DB] import-pmda-announcements using driver=${driver}`);
  let inserted = 0;
  const links = $('a').slice(0, 40).toArray();
  for (const el of links) {
    const title = $(el).text().trim();
    const href = $(el).attr('href');
    if (!title || !href || title.length < 20) continue;
    const link = href.startsWith('http') ? href : 'https://www.pmda.go.jp' + href;
    const hashedTitle = crypto.createHash('sha256').update(title.toLowerCase()).digest('hex');
    const dup = await sql`SELECT id FROM regulatory_updates WHERE hashed_title=${hashedTitle} AND source_url=${link}`;
    if (dup.length) continue;
    try {
      await db.insert(regulatoryUpdates).values({
        title,
        hashedTitle,
        description: title,
        type: 'regulation',
        category: 'pmda_announcement',
        jurisdiction: 'JP',
        sourceUrl: link,
        language: 'en',
        priority: 2,
        riskLevel: 'low',
        actionRequired: false,
        actionType: 'monitoring',
        tags: ['pmda','jp'],
        authorityVerified: true,
        authorityRecommendations: null,
        costDataAvailable: false,
        metadata: { sourcePage: URL }
      });
      inserted++;
    } catch (e:any) {
      console.error('PMDA Insert Fehler:', e.message);
    }
  }
  console.log('PMDA neu eingefügt:', inserted);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
