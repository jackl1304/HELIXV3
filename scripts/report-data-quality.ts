/**
 * Datenqualitäts-Report für Regulatory Updates
 * Prüft: Beschreibung, Content, Authority-Flags, Quellen-Links
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL fehlt');
  const sql = neon(process.env.DATABASE_URL);

  console.log('═══════════════════════════════════════════════════');
  console.log('  REGULATORY UPDATES - Datenqualitäts-Report');
  console.log('═══════════════════════════════════════════════════\n');

  // Gesamtzahl
  const [total] = await sql`SELECT COUNT(*) as count FROM regulatory_updates`;
  console.log(`📊 Gesamt Einträge: ${total.count}\n`);

  // Authority Verified
  const [verified] = await sql`SELECT COUNT(*) as count FROM regulatory_updates WHERE authority_verified = true`;
  console.log(`✓ Authority Verified: ${verified.count} (${((verified.count / total.count) * 100).toFixed(1)}%)`);

  // Cost Data Available
  const [withCost] = await sql`SELECT COUNT(*) as count FROM regulatory_updates WHERE cost_data_available = true`;
  console.log(`💰 Cost Data Available: ${withCost.count} (${((withCost.count / total.count) * 100).toFixed(1)}%)`);

  // Content vorhanden
  const [withContent] = await sql`SELECT COUNT(*) as count FROM regulatory_updates WHERE content IS NOT NULL AND content != ''`;
  console.log(`📄 Content vorhanden: ${withContent.count} (${((withContent.count / total.count) * 100).toFixed(1)}%)`);

  // Description vorhanden
  const [withDesc] = await sql`SELECT COUNT(*) as count FROM regulatory_updates WHERE description IS NOT NULL AND description != ''`;
  console.log(`📝 Description vorhanden: ${withDesc.count} (${((withDesc.count / total.count) * 100).toFixed(1)}%)`);

  // Source URL vorhanden
  const [withUrl] = await sql`SELECT COUNT(*) as count FROM regulatory_updates WHERE source_url IS NOT NULL AND source_url != ''`;
  console.log(`🔗 Source URL vorhanden: ${withUrl.count} (${((withUrl.count / total.count) * 100).toFixed(1)}%)`);

  // Action Type gesetzt
  const [withAction] = await sql`SELECT COUNT(*) as count FROM regulatory_updates WHERE action_type IS NOT NULL`;
  console.log(`⚡ Action Type gesetzt: ${withAction.count} (${((withAction.count / total.count) * 100).toFixed(1)}%)`);

  // Authority Recommendations vorhanden
  const [withRec] = await sql`SELECT COUNT(*) as count FROM regulatory_updates WHERE authority_recommendations IS NOT NULL AND authority_recommendations != ''`;
  console.log(`📋 Authority Recommendations: ${withRec.count} (${((withRec.count / total.count) * 100).toFixed(1)}%)\n`);

  // Kategorie-Breakdown
  console.log('═══════════════════════════════════════════════════');
  console.log('  Kategorien (Top 10)');
  console.log('═══════════════════════════════════════════════════');
  const cats = await sql`SELECT category, COUNT(*) as count FROM regulatory_updates WHERE category IS NOT NULL GROUP BY category ORDER BY count DESC LIMIT 10`;
  cats.forEach((c: any) => console.log(`  ${c.category}: ${c.count}`));

  // Jurisdictions
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Jurisdiktionen');
  console.log('═══════════════════════════════════════════════════');
  const juris = await sql`SELECT jurisdiction, COUNT(*) as count FROM regulatory_updates WHERE jurisdiction IS NOT NULL GROUP BY jurisdiction ORDER BY count DESC`;
  juris.forEach((j: any) => console.log(`  ${j.jurisdiction}: ${j.count}`));

  // Action Types
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Action Types');
  console.log('═══════════════════════════════════════════════════');
  const actions = await sql`SELECT action_type, COUNT(*) as count FROM regulatory_updates WHERE action_type IS NOT NULL GROUP BY action_type ORDER BY count DESC`;
  actions.forEach((a: any) => console.log(`  ${a.action_type}: ${a.count}`));

  // Neueste 5 Einträge mit vollem Content
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Neueste 5 Einträge (mit Content)');
  console.log('═══════════════════════════════════════════════════');
  const recent = await sql`SELECT title, category, jurisdiction, LENGTH(content) as content_len, authority_verified FROM regulatory_updates WHERE content IS NOT NULL AND content != '' ORDER BY created_at DESC LIMIT 5`;
  recent.forEach((r: any, i: number) => {
    console.log(`${i+1}. [${r.category}] ${r.title.slice(0, 60)}...`);
    console.log(`   Jurisdiction: ${r.jurisdiction} | Content: ${r.content_len} chars | Verified: ${r.authority_verified ? '✓' : '✗'}`);
  });

  console.log('\n═══════════════════════════════════════════════════\n');
}

main().catch(e => { console.error('💥 Fehler:', e); process.exit(1); });
