/**
 * Umfassendes Enrichment für ALLE Kategorien
 * Lädt Detailseiten für jeden Eintrag mit sourceUrl und ergänzt Content
 */
import 'dotenv/config';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { regulatoryUpdates } from '../shared/schema.js';
import { sql as raw } from 'drizzle-orm';

interface RegRow {
  id: string;
  sourceUrl: string | null;
  description: string | null;
  content: string | null;
  category: string | null;
}

const MAX_CONTENT_LEN = 2000;
const BATCH_SIZE = 50;
const REQUEST_DELAY = 1000; // 1 Sekunde zwischen Requests

function cleanText(t: string): string {
  return t.replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim();
}

async function fetchHtml(url: string, category: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000 as any
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text.length > 200 ? text : null;
  } catch (e: any) {
    console.error(`  ⚠️ Fetch Fehler [${category}]: ${e.message}`);
    return null;
  }
}

function extractContent(html: string, url: string, category: string): { description: string; content: string } | null {
  const $ = cheerio.load(html);

  // Entferne Skripte, Styles, Navigation
  $('script, style, nav, header, footer, aside, .navigation, .menu, .sidebar').remove();

  const paragraphs: string[] = [];

  // Primäre Content-Selektoren je nach Quelle
  const selectors = [
    'article p',
    'main p',
    '.content p',
    '.article-body p',
    '.post-content p',
    '.entry-content p',
    'div[role="main"] p',
    '#content p',
    'p'
  ];

  for (const selector of selectors) {
    $(selector).each((_, el) => {
      const text = cleanText($(el).text());
      if (text.length >= 50 && !text.startsWith('Cookie') && !text.includes('JavaScript')) {
        paragraphs.push(text);
      }
    });
    if (paragraphs.length >= 5) break;
  }

  if (!paragraphs.length) return null;

  const description = paragraphs[0].slice(0, 350);
  let content = paragraphs.slice(0, 12).join(' ');
  if (content.length > MAX_CONTENT_LEN) {
    content = content.slice(0, MAX_CONTENT_LEN) + '…';
  }

  return { description, content };
}

async function enrichBatch(rows: RegRow[], sql: any, db: any): Promise<{ updated: number; skipped: number }> {
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.sourceUrl || !row.sourceUrl.startsWith('http')) {
      skipped++;
      continue;
    }

    console.log(`  🔍 [${row.category}] ${row.sourceUrl.slice(0, 60)}...`);

    const html = await fetchHtml(row.sourceUrl, row.category || 'unknown');
    if (!html) {
      skipped++;
      continue;
    }

    const extracted = extractContent(html, row.sourceUrl, row.category || 'unknown');
    if (!extracted) {
      skipped++;
      continue;
    }

    try {
      await db.update(regulatoryUpdates)
        .set({
          description: !row.description || row.description.length < 50 ? extracted.description : row.description,
          content: extracted.content,
          authorityVerified: true,
        })
        .where(raw`id = ${row.id}`);

      updated++;
      console.log(`    ✓ Aktualisiert (${extracted.content.length} chars)`);
    } catch (e: any) {
      console.error(`    ⚠️ Update Fehler: ${e.message}`);
      skipped++;
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, REQUEST_DELAY));
  }

  return { updated, skipped };
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL fehlt');
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log('═══════════════════════════════════════════════════');
  console.log('  Umfassendes Enrichment für ALLE Kategorien');
  console.log('═══════════════════════════════════════════════════\n');

  // Hole alle Einträge ohne Content aber mit sourceUrl
  const rawRows = await sql`
    SELECT id, source_url as "sourceUrl", description, content, category
    FROM regulatory_updates
    WHERE (content IS NULL OR content = '')
    AND source_url IS NOT NULL
    AND source_url LIKE 'http%'
    ORDER BY created_at DESC
    LIMIT ${BATCH_SIZE * 10}
  `;

  const rows: RegRow[] = rawRows.map((r: any) => ({
    id: r.id,
    sourceUrl: r.sourceUrl,
    description: r.description,
    content: r.content,
    category: r.category
  }));

  if (!rows.length) {
    console.log('ℹ️ Keine Einträge zum Anreichern gefunden (alle haben entweder Content oder keine sourceUrl).\n');
    return;
  }

  console.log(`📦 Gefunden: ${rows.length} Einträge zum Anreichern\n`);

  // Verarbeite in Batches
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, Math.min(i + BATCH_SIZE, rows.length));
    console.log(`\n📋 Batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} Einträge):`);

    const { updated, skipped } = await enrichBatch(batch, sql, db);
    totalUpdated += updated;
    totalSkipped += skipped;

    console.log(`  Batch-Ergebnis: ${updated} aktualisiert, ${skipped} übersprungen`);
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`✅ Enrichment abgeschlossen`);
  console.log(`   Aktualisiert: ${totalUpdated}`);
  console.log(`   Übersprungen: ${totalSkipped}`);
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(e => { console.error('💥 Fatal:', e); process.exit(1); });
