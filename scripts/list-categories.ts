/**
 * Listet alle Kategorien auf
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL fehlt');
  const sql = neon(process.env.DATABASE_URL);
  const categories = await sql`SELECT DISTINCT category FROM regulatory_updates WHERE category IS NOT NULL ORDER BY category`;
  console.log('Kategorien:', categories.map((c: any) => c.category).join(', '));

  const types = await sql`SELECT DISTINCT type FROM regulatory_updates WHERE type IS NOT NULL ORDER BY type`;
  console.log('Types:', types.map((t: any) => t.type).join(', '));
}
main().catch(e => { console.error(e); process.exit(1); });
