/**
 * FDA 510(k) Import Script (Real Data)
 * Ruft echte Datensätze von der openFDA API ab und speichert sie in der Tabelle regulatory_updates.
 * Voraussetzungen:
 *  - Environment Variable DATABASE_URL (Postgres / Neon)
 *  - Tabelle regulatory_updates existiert (Drizzle Schema)
 * Nutzung:
 *  npx tsx scripts/import-fda-510k.ts --limit=25 --since=2024-01-01
 */
import 'dotenv/config';
import crypto from 'node:crypto';
import fetch from 'node-fetch';
import { regulatoryUpdates } from '../shared/schema.js';
import { getScriptDb } from './script-db';

interface FdaRecord {
  k_number: string;
  applicant: string;
  device_name: string;
  decision_date: string;
  decision_code?: string;
  device_class?: string;
  regulation_number?: string;
  product_code?: string;
  advisory_committee?: string;
  contact?: string;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: Record<string, string> = {};
  for (const arg of args) {
    const [k, v] = arg.replace(/^--/, '').split('=');
    if (k) opts[k] = v ?? 'true';
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  const limit = parseInt(opts.limit || '25', 10);
  const since = opts.since; // YYYY-MM-DD

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL fehlt. Bitte setzen.');
    process.exit(1);
  }

  const { sql, db, driver } = getScriptDb();
  console.log(`[DB] import-fda-510k using driver=${driver}`);

  // Query zusammenbauen
  // openFDA erlaubt Search über decision_date:[START+TO+NOW]
  let url = `https://api.fda.gov/device/510k.json?limit=${limit}`;
  if (since) {
    url += `&search=decision_date:[${since}+TO+NOW]`;
  }

  console.log(`🔍 Hole 510(k) Daten von: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`❌ API Fehler: ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const json: any = await res.json();
  const records: FdaRecord[] = json.results ?? [];

  if (!records.length) {
    console.log('ℹ️ Keine Ergebnisse erhalten.');
    return;
  }

  console.log(`📦 Empfangen: ${records.length} Datensätze`);

  let inserted = 0;
  for (const r of records) {
    try {
      // Validierung: K-Number und Device Name müssen existieren
      if (!r.k_number || !r.device_name) {
        console.warn(`⏭️ Überspringe ungültigen Eintrag (kein K-Number oder Device Name)`);
        continue;
      }

      const title = `FDA 510(k): ${r.device_name}`;
      const hashedTitle = crypto.createHash('sha256').update(title.toLowerCase()).digest('hex');

      // Schätzung riskLevel und priority:
      const deviceClass = (r.device_class || '').toUpperCase();
      let riskLevel = 'low';
      let priority = 2;
      if (deviceClass === 'III') { riskLevel = 'high'; priority = 5; }
      else if (deviceClass === 'II') { riskLevel = 'medium'; priority = 3; }

      // Sichere Date-Konvertierung
      let decisionDate: Date | null = null;
      if (r.decision_date) {
        try {
          decisionDate = new Date(r.decision_date);
          if (isNaN(decisionDate.getTime())) decisionDate = null;
        } catch {
          decisionDate = null;
        }
      }

      // Duplicate Check mit K-Number als Hauptkriterium
      const existing = await sql`SELECT id FROM regulatory_updates WHERE fda_k_number = ${r.k_number}`;
      if (existing.length) {
        console.log(`⏭️ Überspringe Duplikat ${r.k_number}`);
        continue;
      }

      await db.insert(regulatoryUpdates).values({
        title,
        hashedTitle,
        description: r.device_name || 'FDA 510(k) Medical Device',
        type: 'approval',
        category: '510k',
        jurisdiction: 'US',
        publishedDate: decisionDate,
        effectiveDate: decisionDate,
        priority,
        riskLevel,
        actionRequired: false,
        actionType: 'monitoring',
        sourceUrl: `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=${r.k_number}`,
        fdaKNumber: r.k_number,
        fdaApplicant: r.applicant || 'Unknown Applicant',
        fdaDeviceClass: r.device_class,
        fdaRegulationNumber: r.regulation_number,
        fdaProductCode: r.product_code,
        fdaDecisionDate: decisionDate,
        language: 'en',
        tags: ['fda','510k'],
        authorityVerified: true,
        authorityRecommendations: null,
        costDataAvailable: false,
        metadata: {
          advisory_committee: r.advisory_committee,
          contact: r.contact,
          decision_code: r.decision_code
        }
      });
      inserted++;
      console.log(`✅ Eingefügt: ${r.k_number}`);
    } catch (e: any) {
      console.error(`⚠️ Fehler beim Insert für ${r.k_number}:`, e.message || e);
      if (e.stack) console.error(e.stack);
    }
  }

  console.log(`✅ Fertig. Neu eingefügt: ${inserted}`);
}

main().catch(err => {
  console.error('💥 Unerwarteter Fehler:', err);
  process.exit(1);
});
