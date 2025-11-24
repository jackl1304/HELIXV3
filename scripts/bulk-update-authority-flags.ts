/**
 * Bulk-Update bestehender Einträge mit neuen Spalten
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL fehlt');
  const sql = neon(process.env.DATABASE_URL);

  console.log('🔄 Bulk-Update startet...\n');

  // Authority Verified für alle bekannten Kategorien
  const r1 = await sql`UPDATE regulatory_updates SET authority_verified = true, cost_data_available = false WHERE category IN ('general', 'regulation', '510k', 'ema_news', 'pmda_announcement', 'mhra_update', 'health_canada_recall', 'tga_update', 'who_news')`;
  console.log(`✓ Authority Verified gesetzt: ${r1.length || r1.count || 'N/A'} rows`);

  // Action Type monitoring für nicht-recalls
  const r2 = await sql`UPDATE regulatory_updates SET action_type = 'monitoring' WHERE action_type IS NULL AND category NOT IN ('health_canada_recall')`;
  console.log(`✓ Action Type 'monitoring' gesetzt: ${r2.length || r2.count || 'N/A'} rows`);

  // Action Type immediate für recalls
  const r3 = await sql`UPDATE regulatory_updates SET action_type = 'immediate' WHERE category = 'health_canada_recall' AND action_type IS NULL`;
  console.log(`✓ Action Type 'immediate' gesetzt: ${r3.length || r3.count || 'N/A'} rows`);

  console.log('\n✅ Bulk-Update abgeschlossen');
}

main().catch(e => { console.error('💥 Fehler:', e); process.exit(1); });
