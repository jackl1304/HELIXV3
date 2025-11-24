import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL fehlt');
  const sql = neon(process.env.DATABASE_URL);
  const total = await sql`SELECT count(*) FROM regulatory_updates`;
  const byCat = await sql`SELECT category, count(*) FROM regulatory_updates GROUP BY category ORDER BY count DESC`;
  const recent = await sql`SELECT title, category, published_date FROM regulatory_updates ORDER BY created_at DESC LIMIT 10`;
  console.log('Gesamt:', total[0].count);
  console.log('Kategorie Counts:');
  for (const row of byCat) console.log(` - ${row.category || 'NULL'}: ${row.count}`);
  console.log('Letzte 10:');
  for (const r of recent) console.log(` * [${r.category}] ${r.title} (${r.published_date || 'kein Datum'})`);
}
main().catch(e => { console.error(e); process.exit(1); });
