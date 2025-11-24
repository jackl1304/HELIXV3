import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function checkLegalCases() {
  try {
    console.log('Checking legal_cases table...\n');

    const count = await sql`SELECT COUNT(*) as count FROM legal_cases`;
    console.log(`Total legal cases: ${count[0].count}`);

    if (count[0].count > 0) {
      const samples = await sql`SELECT title, court, jurisdiction, decision_date FROM legal_cases LIMIT 5`;
      console.log('\nSample cases:');
      samples.forEach((c, i) => {
        console.log(`${i + 1}. ${c.title}`);
        console.log(`   Court: ${c.court}, Jurisdiction: ${c.jurisdiction}`);
        console.log(`   Decision Date: ${c.decision_date}\n`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkLegalCases();
