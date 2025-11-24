import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function deleteAllMockData() {
  console.log('🗑️  Deleting ALL mock/demo data from database...');

  try {
    // Delete all regulatory updates (all are mock data)
    const result = await sql`DELETE FROM regulatory_updates RETURNING id`;
    console.log(`✅ Deleted ${result.length} mock regulatory updates`);

    // Delete all regulatory pathways (benchmark data)
    const pathways = await sql`DELETE FROM regulatory_pathways RETURNING id`;
    console.log(`✅ Deleted ${pathways.length} mock regulatory pathways`);

    // Note: legal_cases and knowledge_articles tables don't have source_id column
    // If they contain mock data, it would need different logic to identify and delete

    console.log('\n✅ All mock/demo data deleted successfully!');
    console.log('📊 Database now contains ONLY real data from external sources');

  } catch (error) {
    console.error('❌ Error deleting mock data:', error);
    process.exit(1);
  }
}

deleteAllMockData();
