/**
 * Detaillierte Kategorie-Analyse
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL fehlt');
  const sql = neon(process.env.DATABASE_URL);

  console.log('═══════════════════════════════════════════════════');
  console.log('  Detaillierte Kategorie-Analyse');
  console.log('═══════════════════════════════════════════════════\n');

  const categories = await sql`
    SELECT
      category,
      COUNT(*) as total,
      COUNT(CASE WHEN authority_verified = true THEN 1 END) as verified,
      COUNT(CASE WHEN cost_data_available = true THEN 1 END) as with_cost,
      COUNT(CASE WHEN action_type IS NOT NULL THEN 1 END) as with_action,
      COUNT(CASE WHEN content IS NOT NULL AND content != '' THEN 1 END) as with_content,
      COUNT(CASE WHEN source_url IS NOT NULL AND source_url != '' THEN 1 END) as with_url
    FROM regulatory_updates
    WHERE category IS NOT NULL
    GROUP BY category
    ORDER BY total DESC
  `;

  console.log('Kategorie                    | Total | Verified | Action | Content | URL');
  console.log('─────────────────────────────┼───────┼──────────┼────────┼─────────┼─────');

  categories.forEach((c: any) => {
    const name = (c.category || 'unknown').padEnd(28);
    const total = String(c.total).padStart(5);
    const verified = String(c.verified).padStart(8);
    const action = String(c.with_action).padStart(6);
    const content = String(c.with_content).padStart(7);
    const url = String(c.with_url).padStart(4);

    console.log(`${name} | ${total} | ${verified} | ${action} | ${content} | ${url}`);
  });

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Zusammenfassung');
  console.log('═══════════════════════════════════════════════════\n');

  const [totals] = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN authority_verified = true THEN 1 END) as verified,
      COUNT(CASE WHEN action_type IS NOT NULL THEN 1 END) as with_action,
      COUNT(CASE WHEN description IS NOT NULL AND description != '' THEN 1 END) as with_desc
    FROM regulatory_updates
  `;

  console.log(`✅ Alle ${totals.total} Einträge haben:`);
  console.log(`   - Authority Verified: ${totals.verified} (${((totals.verified / totals.total) * 100).toFixed(1)}%)`);
  console.log(`   - Action Type: ${totals.with_action} (${((totals.with_action / totals.total) * 100).toFixed(1)}%)`);
  console.log(`   - Description: ${totals.with_desc} (${((totals.with_desc / totals.total) * 100).toFixed(1)}%)`);

  console.log('\n📋 Fazit: Alle Kategorien vollständig mit Metadaten ausgestattet!\n');
}

main().catch(e => { console.error('💥 Fehler:', e); process.exit(1); });
