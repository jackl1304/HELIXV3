import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config();

const sql = neon(process.env.DATABASE_URL);

async function enableVectorExtension() {
  try {
    console.log('Enabling pgvector extension...');
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
    console.log('✅ pgvector extension enabled successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error enabling pgvector extension:', error);
    process.exit(1);
  }
}

enableVectorExtension();
