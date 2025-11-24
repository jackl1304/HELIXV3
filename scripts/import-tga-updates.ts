/**
 * TGA (Australia) Updates (Stub)
 * Beispiel: https://www.tga.gov.au/news
 */
import 'dotenv/config';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import crypto from 'node:crypto';
import { regulatoryUpdates } from '../shared/schema.js';
import { getScriptDb } from './script-db';

const URL = 'https://www.tga.gov.au/news';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL fehlt');
  const html = await (await fetch(URL)).text();
  const $ = cheerio.load(html);
  const { sql, db, driver } = getScriptDb();
  console.log(`[DB] import-tga-updates using driver=${driver}`);
  let inserted = 0;
  const articles = $('article').slice(0, 25).toArray();
  for (const el of articles) {
    const title = $(el).find('h2 a').text().trim();
    const href = $(el).find('h2 a').attr('href');
    const date = $(el).find('time').attr('datetime') || null;
    if (!title || !href) continue;
    const link = href.startsWith('http') ? href : 'https://www.tga.gov.au' + href;
    const hashedTitle = crypto.createHash('sha256').update(title.toLowerCase()).digest('hex');
    const dup = await sql`SELECT id FROM regulatory_updates WHERE hashed_title=${hashedTitle} AND source_url=${link}`;
    if (dup.length) continue;
    try {
      await db.insert(regulatoryUpdates).values({
        title,
        hashedTitle,
        description: title,
        type: 'guidance',
        category: 'tga_update',
        jurisdiction: 'AU',
        sourceUrl: link,
        publishedDate: date ? new Date(date) : null,
        effectiveDate: date ? new Date(date) : null,
        language: 'en',
        priority: 2,
        riskLevel: 'low',
        actionRequired: false,
        actionType: 'monitoring',
        tags: ['tga','au'],
        authorityVerified: true,
        authorityRecommendations: null,
        costDataAvailable: false,
        metadata: { sourcePage: URL }
      });
      inserted++;
    } catch (e:any) {
      console.error('TGA Insert Fehler:', e.message);
    }
  }
  console.log('TGA neu eingefügt:', inserted);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
