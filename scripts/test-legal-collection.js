import { legalCaseCollector } from '../server/services/legalCaseCollector.js';

console.log('🔍 Testing Legal Case Collection...\n');

async function testCollection() {
  try {
    const result = await legalCaseCollector.collectAllLegalCases();

    console.log('\n✅ Collection Complete!');
    console.log(`   Total Collected: ${result.totalCollected}`);
    console.log(`   Total Stored: ${result.totalStored}`);

    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors: ${result.errors.length}`);
      result.errors.forEach(err => console.log(`   - ${err}`));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testCollection();
