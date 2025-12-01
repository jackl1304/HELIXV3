/**
 * DETAILLIERTE DATEN-PRÜFUNG
 *
 * Prüft:
 * 1. DB Schema vs Tatsächliche Spalten
 * 2. Datenqualität: Pflichtfelder, Nulls, Defaults
 * 3. Kategorien-Mapping
 * 4. Frontend-Kompatibilität
 */

import 'dotenv/config';
import { getScriptDb } from './script-db.js';

interface DataQualityReport {
  tableName: string;
  totalRecords: number;
  issues: string[];
  recommendations: string[];
}

async function checkRegulatoryUpdates(sql: any): Promise<DataQualityReport> {
  console.log('\n🔍 PRÜFUNG: regulatory_updates Tabelle\n');

  const issues: string[] = [];
  const recommendations: string[] = [];

  // 1. Gesamtanzahl
  const totalResult = await sql`SELECT COUNT(*) as count FROM regulatory_updates`;
  const total = parseInt(totalResult[0].count);
  console.log(`📦 Gesamtanzahl: ${total} Einträge`);

  // 2. Pflichtfelder-Check
  console.log('\n📋 Pflichtfelder-Analyse:');

  const titleNull = await sql`SELECT COUNT(*) as count FROM regulatory_updates WHERE title IS NULL OR title = ''`;
  const titleNullCount = parseInt(titleNull[0].count);
  if (titleNullCount > 0) {
    issues.push(`${titleNullCount} Einträge ohne Titel`);
    console.log(`   ❌ ${titleNullCount} Einträge ohne Titel`);
  } else {
    console.log(`   ✅ Alle Einträge haben Titel`);
  }

  const hashNull = await sql`SELECT COUNT(*) as count FROM regulatory_updates WHERE hashed_title IS NULL`;
  const hashNullCount = parseInt(hashNull[0].count);
  if (hashNullCount > 0) {
    issues.push(`${hashNullCount} Einträge ohne hashedTitle`);
    console.log(`   ❌ ${hashNullCount} Einträge ohne hashedTitle`);
    recommendations.push('Führe aus: npx tsx scripts/add-missing-hashes.ts');
  } else {
    console.log(`   ✅ Alle Einträge haben hashedTitle`);
  }

  const sourceNull = await sql`SELECT COUNT(*) as count FROM regulatory_updates WHERE source_id IS NULL`;
  const sourceNullCount = parseInt(sourceNull[0].count);
  if (sourceNullCount > 0) {
    issues.push(`${sourceNullCount} Einträge ohne source_id`);
    console.log(`   ⚠️  ${sourceNullCount} Einträge ohne source_id (Erlaubt, aber nicht ideal)`);
  } else {
    console.log(`   ✅ Alle Einträge haben source_id`);
  }

  // 3. Kategorien-Verteilung
  console.log('\n📊 Kategorien-Verteilung:');

  const types = await sql`
    SELECT type, COUNT(*) as count
    FROM regulatory_updates
    WHERE type IS NOT NULL
    GROUP BY type
    ORDER BY count DESC
  `;

  if (types.length === 0) {
    issues.push('Keine Typen definiert');
    console.log('   ❌ Keine Typen definiert');
  } else {
    types.forEach((t: any) => {
      console.log(`   - ${t.type}: ${t.count} Einträge`);
    });
  }

  // 4. Quellen-Verteilung
  console.log('\n🌐 Quellen-Verteilung:');

  const sources = await sql`
    SELECT source_id, COUNT(*) as count
    FROM regulatory_updates
    WHERE source_id IS NOT NULL
    GROUP BY source_id
    ORDER BY count DESC
    LIMIT 10
  `;

  sources.forEach((s: any) => {
    console.log(`   - ${s.source_id}: ${s.count} Einträge`);
  });

  // 5. Datums-Check
  console.log('\n📅 Datums-Felder:');

  const publishedDateResult = await sql`SELECT COUNT(*) as count FROM regulatory_updates WHERE published_date IS NOT NULL`;
  const publishedCount = parseInt(publishedDateResult[0].count);
  const publishedPercentage = ((publishedCount / total) * 100).toFixed(1);
  console.log(`   - published_date: ${publishedCount} (${publishedPercentage}%)`);

  const effectiveDateResult = await sql`SELECT COUNT(*) as count FROM regulatory_updates WHERE effective_date IS NOT NULL`;
  const effectiveCount = parseInt(effectiveDateResult[0].count);
  const effectivePercentage = ((effectiveCount / total) * 100).toFixed(1);
  console.log(`   - effective_date: ${effectiveCount} (${effectivePercentage}%)`);

  const createdAtResult = await sql`SELECT COUNT(*) as count FROM regulatory_updates WHERE created_at IS NOT NULL`;
  const createdCount = parseInt(createdAtResult[0].count);
  const createdPercentage = ((createdCount / total) * 100).toFixed(1);
  console.log(`   - created_at: ${createdCount} (${createdPercentage}%)`);


  // 6. FDA-spezifische Felder
  console.log('\n🏛️  FDA-spezifische Daten:');

  const fdaKnumber = await sql`SELECT COUNT(*) as count FROM regulatory_updates WHERE fda_k_number IS NOT NULL`;
  const fdaCount = parseInt(fdaKnumber[0].count);
  console.log(`   - FDA K-Number: ${fdaCount} Einträge`);

  // 7. Duplikat-Check via Hash
  console.log('\n🔄 Duplikat-Check:');

  const duplicates = await sql`
    SELECT hashed_title, COUNT(*) as count
    FROM regulatory_updates
    WHERE hashed_title IS NOT NULL
    GROUP BY hashed_title
    HAVING COUNT(*) > 1
  `;

  if (duplicates.length > 0) {
    issues.push(`${duplicates.length} Duplikat-Gruppen gefunden`);
    console.log(`   ❌ ${duplicates.length} Duplikat-Gruppen gefunden`);
    recommendations.push('Führe aus: npx tsx scripts/remove-duplicates.ts');
  } else {
    console.log(`   ✅ Keine Duplikate gefunden`);
  }

  return {
    tableName: 'regulatory_updates',
    totalRecords: total,
    issues,
    recommendations
  };
}

async function checkDataSources(sql: any): Promise<DataQualityReport> {
  console.log('\n🔍 PRÜFUNG: data_sources Tabelle\n');

  const issues: string[] = [];
  const recommendations: string[] = [];

  // 1. Gesamtanzahl
  const totalResult = await sql`SELECT COUNT(*) as count FROM data_sources`;
  const total = parseInt(totalResult[0].count);
  console.log(`📦 Gesamtanzahl: ${total} Quellen`);

  // 2. Aktive vs Inaktive
  const activeResult = await sql`SELECT COUNT(*) as count FROM data_sources WHERE is_active = true`;
  const active = parseInt(activeResult[0].count);
  console.log(`   ✅ Aktiv: ${active}`);
  console.log(`   ⏸️  Inaktiv: ${total - active}`);

  // 3. Typen-Verteilung
  console.log('\n📊 Typen-Verteilung:');

  const types = await sql`
    SELECT type, COUNT(*) as count
    FROM data_sources
    WHERE type IS NOT NULL
    GROUP BY type
    ORDER BY count DESC
  `;

  types.forEach((t: any) => {
    console.log(`   - ${t.type}: ${t.count} Quellen`);
  });

  // 4. Länder-Verteilung
  console.log('\n🌍 Länder-Verteilung:');

  const countries = await sql`
    SELECT country, COUNT(*) as count
    FROM data_sources
    WHERE country IS NOT NULL
    GROUP BY country
    ORDER BY count DESC
    LIMIT 10
  `;

  countries.forEach((c: any) => {
    console.log(`   - ${c.country}: ${c.count} Quellen`);
  });

  // 5. API Endpoint Check
  const apiEndpointNull = await sql`SELECT COUNT(*) as count FROM data_sources WHERE api_endpoint IS NULL`;
  const apiNull = parseInt(apiEndpointNull[0].count);
  console.log(`\n🔗 API Endpoints: ${total - apiNull} von ${total} haben Endpoints`);

  if (total === 0) {
    issues.push('Keine data_sources vorhanden');
    recommendations.push('Führe aus: npx tsx scripts/fix-data-sources.ts');
  }

  return {
    tableName: 'data_sources',
    totalRecords: total,
    issues,
    recommendations
  };
}

async function checkFrontendCompatibility(sql: any) {
  console.log('\n🎨 FRONTEND-KOMPATIBILITÄT\n');

  // Prüfe JOIN-Kompatibilität
  console.log('📋 Prüfe JOIN regulatory_updates ↔ data_sources:');

  const joinResult = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(ds.name) as with_source
    FROM regulatory_updates ru
    LEFT JOIN data_sources ds ON ru.source_id = ds.id
  `;

  const total = parseInt(joinResult[0].total);
  const withSource = parseInt(joinResult[0].with_source);
  const percentage = ((withSource / total) * 100).toFixed(1);

  console.log(`   - Gesamt: ${total} Einträge`);
  console.log(`   - Mit verknüpfter Quelle: ${withSource} (${percentage}%)`);
  console.log(`   - Ohne Quelle: ${total - withSource}`);

  if (withSource / total < 0.9) {
    console.log(`   ⚠️  Nur ${percentage}% haben verknüpfte Quellen`);
  } else {
    console.log(`   ✅ ${percentage}% haben verknüpfte Quellen`);
  }

  // Prüfe API Response Format
  console.log('\n📡 API Response Format:');

  const sampleResult = await sql`
    SELECT
      ru.*,
      ds.name as source_name,
      ds.url as source_url
    FROM regulatory_updates ru
    LEFT JOIN data_sources ds ON ru.source_id = ds.id
    LIMIT 1
  `;

  if (sampleResult.length > 0) {
    const sample = sampleResult[0];
    console.log('   Beispiel-Felder:');
    console.log(`   - id: ${sample.id}`);
    console.log(`   - title: ${sample.title?.substring(0, 50)}...`);
    console.log(`   - source_name: ${sample.source_name || 'NULL'}`);
    console.log(`   - source_id: ${sample.source_id || 'NULL'}`);
    console.log(`   - published_date: ${sample.published_date || 'NULL'}`);
    console.log(`   - created_at: ${sample.created_at}`);

    // Validiere Pflichtfelder für Frontend
    const requiredForFrontend = ['id', 'title'];
    const missing = requiredForFrontend.filter(f => !sample[f]);

    if (missing.length > 0) {
      console.log(`   ❌ Fehlende Pflichtfelder: ${missing.join(', ')}`);
    } else {
      console.log(`   ✅ Alle Frontend-Pflichtfelder vorhanden`);
    }
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔬 HELIX V3 - DETAILLIERTE DATEN-QUALITÄT PRÜFUNG');
  console.log('═══════════════════════════════════════════════════════');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL fehlt');
    process.exit(1);
  }

  const { sql, db, driver } = getScriptDb();
  console.log(`\n[DB] Verwende driver: ${driver}\n`);

  // Prüfungen durchführen
  const regulatoryReport = await checkRegulatoryUpdates(sql);
  const sourcesReport = await checkDataSources(sql);
  await checkFrontendCompatibility(sql);

  // Finale Zusammenfassung
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 ZUSAMMENFASSUNG');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`✅ regulatory_updates: ${regulatoryReport.totalRecords} Einträge`);
  if (regulatoryReport.issues.length > 0) {
    console.log(`   ⚠️  ${regulatoryReport.issues.length} Problem(e):`);
    regulatoryReport.issues.forEach(i => console.log(`      - ${i}`));
  }

  console.log(`\n✅ data_sources: ${sourcesReport.totalRecords} Quellen`);
  if (sourcesReport.issues.length > 0) {
    console.log(`   ⚠️  ${sourcesReport.issues.length} Problem(e):`);
    sourcesReport.issues.forEach(i => console.log(`      - ${i}`));
  }

  // Empfehlungen
  const allRecommendations = [
    ...regulatoryReport.recommendations,
    ...sourcesReport.recommendations
  ];

  if (allRecommendations.length > 0) {
    console.log('\n💡 EMPFEHLUNGEN:');
    allRecommendations.forEach(r => console.log(`   ${r}`));
  }

  console.log('\n✅ Prüfung abgeschlossen\n');

  process.exit(0);
}

main();
