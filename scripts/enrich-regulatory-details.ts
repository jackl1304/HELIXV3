/**
 * Enrichment Script: Ergänzt fehlende content / description Felder
 * - Lädt HTML der sourceUrl
 * - Extrahiert ersten sinnvollen Absatz (<p>) als description (falls leer)
 * - Extrahiert bis zu ~1500 Zeichen Fließtext als content
 * - Setzt authorityVerified=true (Primärquelle) falls erfolgreich
 * - KI-Felder werden NICHT gefüllt
 */
import 'dotenv/config';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { regulatoryUpdates } from '../shared/schema.js';
import { sql as raw } from 'drizzle-orm';

interface RegRow { id: string; sourceUrl: string | null; description: string | null; content: string | null; authorityVerified: boolean | null; }

const BATCH_LIMIT = 100;
const MAX_CONTENT_LEN = 1500;

function cleanText(t: string): string {
  return t.replace(/\s+/g, ' ').trim();
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'HelixRegEnrich/1.0' }, timeout: 20000 as any });
    if (!res.ok) return null;
    const text = await res.text();
    return text.length > 200 ? text : null;
  } catch { return null; }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL fehlt');
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  // Kandidaten: keine content UND authorityVerified false
  // Raw query ohne generisches Typargument; manuelles Casting
  const rawRows = await sql`SELECT id, source_url as "sourceUrl", description, content, authority_verified as "authorityVerified" FROM regulatory_updates WHERE (content IS NULL OR content = '') AND source_url IS NOT NULL LIMIT ${BATCH_LIMIT}`;
  const rows: RegRow[] = rawRows.map((r: any) => ({
    id: r.id,
    sourceUrl: r.sourceUrl,
    description: r.description,
    content: r.content,
    authorityVerified: r.authorityVerified
  }));
  if (!rows.length) {
    console.log('ℹ️ Keine zu bereichernden Einträge gefunden.');
    return;
  }
  console.log(`🔍 Enrichment startet für ${rows.length} Einträge ...`);

  let updated = 0; let skipped = 0;
  for (const row of rows) {
    if (!row.sourceUrl) { skipped++; continue; }
    const html = await fetchHtml(row.sourceUrl);
    if (!html) { skipped++; continue; }
    const $ = cheerio.load(html);

    // Absatzkandidaten sammeln
    const paragraphs: string[] = [];
    $('p').each((_, el) => {
      const text = cleanText($(el).text());
      if (text.length >= 40) paragraphs.push(text);
    });
    if (!paragraphs.length) { skipped++; continue; }

    const primary = paragraphs[0];
    let merged = paragraphs.slice(0, 10).join(' '); // max 10 Absätze
    if (merged.length > MAX_CONTENT_LEN) merged = merged.slice(0, MAX_CONTENT_LEN) + '…';

    try {
      await db.update(regulatoryUpdates)
        .set({
          description: !row.description || row.description.trim() === '' ? primary.slice(0, 300) : row.description,
          content: merged,
          authorityVerified: true,
          costDataAvailable: false,
        })
        .where(raw`id = ${row.id}`);
      updated++;
    } catch (e:any) {
      console.error('⚠️ Update Fehler', row.id, e.message);
      skipped++;
    }
  }

  console.log(`✅ Enrichment fertig. Aktualisiert: ${updated}, Übersprungen: ${skipped}`);
}

main().catch(e => { console.error('💥 Fatal:', e); process.exit(1); });
