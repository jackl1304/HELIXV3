import { patentCollector } from '../server/services/patentCollector.js';

console.log('🔍 Testing Patent Collection...');

async function run() {
  try {
    const result = await patentCollector.collectAllPatents();
    console.log('\n✅ Patent Collection Complete!');
    console.log(`   Total Collected: ${result.totalCollected}`);
    console.log(`   Total Stored: ${result.totalStored}`);
    if (result.errors.length) {
      console.log(`\n⚠️ Errors: ${result.errors.length}`);
      result.errors.forEach(e => console.log('   - ' + e));
    }
    process.exit(0);
  } catch (e) {
    console.error('❌ Patent collection error:', e);
    process.exit(1);
  }
}

run();
