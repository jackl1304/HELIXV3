#!/usr/bin/env tsx
/**
 * Quick Patents Table Checker
 * Validates patents table existence and structure
 */

import { db } from '../server/storage';
import { patents } from '../shared/schema';
import { sql } from 'drizzle-orm';

async function checkPatentsTable() {
  console.log('🔍 Checking patents table...\n');

  try {
    // Check if table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'patents'
      ) as exists
    `);

    const exists = tableCheck.rows[0]?.exists;
    console.log(`✓ Table exists: ${exists}`);

    if (!exists) {
      console.log('\n⚠️  Patents table MISSING - run migration!');
      return false;
    }

    // Get row count
    const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM patents`);
    const count = countResult.rows[0]?.count || 0;
    console.log(`✓ Total patents: ${count}`);

    // Get sample record
    if (count > 0) {
      const sample = await db.execute(sql`SELECT * FROM patents LIMIT 1`);
      console.log(`✓ Sample record available`);
      console.log(`  - Fields: ${Object.keys(sample.rows[0] || {}).length}`);
    }

    console.log('\n✅ Patents table OK\n');
    return true;

  } catch (error: any) {
    console.error('\n❌ Error checking patents table:', error.message);
    return false;
  }
}

checkPatentsTable()
  .then(ok => process.exit(ok ? 0 : 1))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
