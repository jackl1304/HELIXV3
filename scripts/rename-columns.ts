/**
 * Führt Column-Renames durch - prüft vorher ob Spalten existieren
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL nicht gesetzt');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  // Check if old columns exist
  const checkColumns = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'regulatory_updates'
    AND column_name IN ('ai_key_points', 'ai_impacts', 'ai_recommendations')
  `;

  const existingColumns = await sql(checkColumns);
  console.log(`📊 Gefundene Spalten:`, existingColumns.map((r: any) => r.column_name));

  const renames = [
    { old: 'ai_key_points', new: 'key_points' },
    { old: 'ai_impacts', new: 'impacts' },
    { old: 'ai_recommendations', new: 'recommendations' }
  ];

  for (const { old, new: newName } of renames) {
    const exists = existingColumns.some((r: any) => r.column_name === old);

    if (exists) {
      try {
        await sql(`ALTER TABLE regulatory_updates RENAME COLUMN ${old} TO ${newName}`);
        console.log(`✅ Renamed: ${old} → ${newName}`);
      } catch (e: any) {
        console.error(`❌ Fehler bei ${old}:`, e.message);
      }
    } else {
      console.log(`⏭️  Skip: ${old} (existiert nicht)`);
    }
  }

  console.log('🏁 Column-Renames abgeschlossen');
}

main().catch(e => {
  console.error('💥 Fehler:', e);
  process.exit(1);
});
