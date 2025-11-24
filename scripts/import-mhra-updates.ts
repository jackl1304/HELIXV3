/**
 * MHRA (UK) Medicines & Healthcare Updates (HTML Scrape Stub)
 * Beispielseite: https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency
 */
import 'dotenv/config';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import crypto from 'node:crypto';
import { regulatoryUpdates } from '../shared/schema.js';
import { getScriptDb } from './script-db';

const BASE = 'https://www.gov.uk';
const URL = BASE + '/government/organisations/medicines-and-healthcare-products-regulatory-agency';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL fehlt');
  const html = await (await fetch(URL)).text();
  const $ = cheerio.load(html);
  const blocks = $('section .gem-c-document-list__item');
  const { sql, db, driver } = getScriptDb();
  console.log(`[DB] import-mhra-updates using driver=${driver}`);
  let inserted = 0;
  const items = blocks.slice(0, 20).toArray();
  for (const el of items) {
    const titleEl = $(el).find('.gem-c-document-list__item-title a');
    const title = titleEl.text().trim();
    const href = titleEl.attr('href');
    const date = $(el).find('time').attr('datetime') || null;
    if (!title || !href) continue;
    const link = href.startsWith('http') ? href : BASE + href;
    const hashedTitle = crypto.createHash('sha256').update(title.toLowerCase()).digest('hex');
    const dup = await sql`SELECT id FROM regulatory_updates WHERE hashed_title=${hashedTitle} AND source_url=${link}`;
    if (dup.length) continue;
    try {
      await db.insert(regulatoryUpdates).values({
        title,
        hashedTitle,
        description: title,
        type: 'regulation',
        category: 'mhra_update',
        jurisdiction: 'UK',
        sourceUrl: link,
        publishedDate: date ? new Date(date) : null,
        effectiveDate: date ? new Date(date) : null,
        priority: 3,
        riskLevel: 'medium',
        actionRequired: false,
        actionType: 'monitoring',
        language: 'en',
        tags: ['mhra','uk'],
        authorityVerified: true,
        authorityRecommendations: null,
        costDataAvailable: false,
        metadata: { sourcePage: URL }
      });
      inserted++;
    } catch (e:any) {
      console.error('MHRA Insert Fehler:', e.message);
    }
  }
  console.log('MHRA neu eingefügt:', inserted);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
