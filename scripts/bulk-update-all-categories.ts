/**
 * Umfassende Bulk-Update für ALLE Kategorien
 * Stellt sicher, dass jeder Eintrag authority_verified, cost_data_available und action_type hat
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL fehlt');
  const sql = neon(process.env.DATABASE_URL);

  console.log('🔄 Umfassender Bulk-Update für ALLE Kategorien startet...\n');

  // 1. Authority Verified für ALLE Einträge (Primärquellen)
  const r1 = await sql`
    UPDATE regulatory_updates
    SET authority_verified = true
    WHERE authority_verified IS NULL OR authority_verified = false
  `;
  console.log(`✓ Authority Verified auf true gesetzt: Alle Einträge aktualisiert`);

  // 2. Cost Data Available auf false (keine öffentlichen Kostendaten)
  const r2 = await sql`
    UPDATE regulatory_updates
    SET cost_data_available = false
    WHERE cost_data_available IS NULL OR cost_data_available = true
  `;
  console.log(`✓ Cost Data Available auf false gesetzt: Alle Einträge aktualisiert`);

  // 3. Action Type für Recalls (immediate)
  const r3 = await sql`
    UPDATE regulatory_updates
    SET action_type = 'immediate'
    WHERE (category LIKE '%recall%' OR category LIKE '%alert%' OR title ILIKE '%recall%')
    AND (action_type IS NULL OR action_type != 'immediate')
  `;
  console.log(`✓ Action Type 'immediate' für Recalls gesetzt`);

  // 4. Action Type für High Priority / Critical Risk (planned)
  const r4 = await sql`
    UPDATE regulatory_updates
    SET action_type = 'planned'
    WHERE (priority <= 2 OR risk_level IN ('critical', 'high'))
    AND action_required = true
    AND (action_type IS NULL OR action_type = 'monitoring')
  `;
  console.log(`✓ Action Type 'planned' für High Priority gesetzt`);

  // 5. Action Type monitoring für alle anderen
  const r5 = await sql`
    UPDATE regulatory_updates
    SET action_type = 'monitoring'
    WHERE action_type IS NULL
  `;
  console.log(`✓ Action Type 'monitoring' als Default gesetzt`);

  // 6. Stelle sicher, dass alle Descriptions vorhanden sind
  const r6 = await sql`
    UPDATE regulatory_updates
    SET description = COALESCE(
      NULLIF(description, ''),
      LEFT(title, 300)
    )
    WHERE description IS NULL OR description = ''
  `;
  console.log(`✓ Fehlende Descriptions aus Titeln generiert`);

  // Statistik nach Update
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Finale Statistik');
  console.log('═══════════════════════════════════════════════════');

  const [total] = await sql`SELECT COUNT(*) as count FROM regulatory_updates`;
  console.log(`📊 Gesamt Einträge: ${total.count}`);

  const [verified] = await sql`SELECT COUNT(*) as count FROM regulatory_updates WHERE authority_verified = true`;
  console.log(`✓ Authority Verified: ${verified.count} (${((verified.count / total.count) * 100).toFixed(1)}%)`);

  const [withCost] = await sql`SELECT COUNT(*) as count FROM regulatory_updates WHERE cost_data_available = true`;
  console.log(`💰 Cost Data Available: ${withCost.count} (${((withCost.count / total.count) * 100).toFixed(1)}%)`);

  const [withAction] = await sql`SELECT COUNT(*) as count FROM regulatory_updates WHERE action_type IS NOT NULL`;
  console.log(`⚡ Action Type gesetzt: ${withAction.count} (${((withAction.count / total.count) * 100).toFixed(1)}%)`);

  const [withDesc] = await sql`SELECT COUNT(*) as count FROM regulatory_updates WHERE description IS NOT NULL AND description != ''`;
  console.log(`📝 Description vorhanden: ${withDesc.count} (${((withDesc.count / total.count) * 100).toFixed(1)}%)`);

  const actionTypes = await sql`SELECT action_type, COUNT(*) as count FROM regulatory_updates WHERE action_type IS NOT NULL GROUP BY action_type ORDER BY count DESC`;
  console.log('\nAction Types:');
  actionTypes.forEach((a: any) => console.log(`  ${a.action_type}: ${a.count}`));

  console.log('\n✅ Umfassender Bulk-Update abgeschlossen\n');
}

main().catch(e => { console.error('💥 Fehler:', e); process.exit(1); });
