import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function testEndpoints() {
  // Get a real regulatory update ID
  const updates = await sql(`
    SELECT id, title FROM regulatory_updates
    LIMIT 1
  `);

  if (updates.length === 0) {
    console.log('❌ No regulatory updates found');
    process.exit(1);
  }

  const updateId = updates[0].id;
  console.log(`✅ Testing with regulatory update: ${updates[0].title}`);
  console.log(`📍 Update ID: ${updateId}\n`);

  // Test 1: Create evaluation
  console.log('🧪 Test 1: POST /api/regulatory-updates/:id/evaluation');
  const evalPayload = {
    status: 'in_progress',
    authoritySources: [
      {
        name: 'FDA CFR Title 21',
        citation: '21 CFR 820.30',
        url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfcfr/CFRSearch.cfm?fr=820.30',
        verifiedAt: new Date().toISOString()
      }
    ],
    requiredActions: [
      {
        action: 'Update Design Control Procedures',
        deadline: '2026-03-01',
        responsible: 'Quality Manager'
      }
    ],
    timelineMonths: 6
  };

  const createRes = await fetch(`http://localhost:5000/api/regulatory-updates/${updateId}/evaluation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(evalPayload)
  });

  if (!createRes.ok) {
    const error = await createRes.text();
    console.log(`❌ Create failed: ${createRes.status}`, error);
  } else {
    const created = await createRes.json();
    console.log(`✅ Created evaluation:`, created.id);
  }

  // Test 2: Get evaluation
  console.log('\n🧪 Test 2: GET /api/regulatory-updates/:id/evaluation');
  const getRes = await fetch(`http://localhost:5000/api/regulatory-updates/${updateId}/evaluation`);

  if (!getRes.ok) {
    console.log(`❌ Get failed: ${getRes.status}`);
  } else {
    const evaluation = await getRes.json();
    console.log(`✅ Retrieved evaluation:`, {
      status: evaluation.status,
      sourcesCount: evaluation.authoritySources?.length || 0,
      actionsCount: evaluation.requiredActions?.length || 0,
      timeline: `${evaluation.timelineMonths} months`
    });
  }

  // Test 3: Create cost item
  console.log('\n🧪 Test 3: POST /api/cost-items');
  const costPayload = {
    name: 'FDA 510(k) Submission Fee',
    description: 'Standard 510(k) premarket notification submission fee',
    jurisdiction: 'US',
    feeType: 'submission',
    amountMinorUnit: 1749900,
    currency: 'USD',
    validFrom: '2024-10-01',
    verificationStatus: 'verified',
    sourceUrl: 'https://www.fda.gov/medical-devices/premarket-submissions/510k-clearances'
  };

  const costRes = await fetch('http://localhost:5000/api/cost-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(costPayload)
  });

  if (!costRes.ok) {
    const error = await costRes.text();
    console.log(`❌ Cost item failed: ${costRes.status}`, error);
  } else {
    const cost = await costRes.json();
    console.log(`✅ Created cost item:`, cost.id, `($${cost.amountMinorUnit / 100})`);
  }

  // Test 4: Get cost items filtered
  console.log('\n🧪 Test 4: GET /api/cost-items?jurisdiction=US&feeType=submission');
  const getCostsRes = await fetch('http://localhost:5000/api/cost-items?jurisdiction=US&feeType=submission');

  if (!getCostsRes.ok) {
    console.log(`❌ Get costs failed: ${getCostsRes.status}`);
  } else {
    const costs = await getCostsRes.json();
    console.log(`✅ Retrieved ${costs.length} cost items`);
    if (costs.length > 0) {
      console.log(`   First item: ${costs[0].name} - $${costs[0].amountMinorUnit / 100}`);
    }
  }

  // Test 5: Create normative action
  console.log('\n🧪 Test 5: POST /api/regulatory-updates/:id/actions');
  const actionPayload = {
    actionCode: 'DESIGN-CTRL-001',
    title: 'Implement Design Controls per 21 CFR 820.30',
    description: 'Establish documented design control procedures',
    clauseReference: '§820.30',
    authority: 'FDA',
    requiredDocuments: [
      {
        name: 'Design Control SOP',
        description: 'Standard Operating Procedure for Design Controls',
        mandatory: true
      }
    ],
    estimatedEffortHours: 80,
    dependencies: {
      prerequisites: ['QUALITY-SYSTEM-001'],
      followUps: ['DESIGN-CTRL-002']
    }
  };

  const actionRes = await fetch(`http://localhost:5000/api/regulatory-updates/${updateId}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(actionPayload)
  });

  if (!actionRes.ok) {
    const error = await actionRes.text();
    console.log(`❌ Action failed: ${actionRes.status}`, error);
  } else {
    const action = await actionRes.json();
    console.log(`✅ Created action:`, action.actionCode, `(${action.estimatedEffortHours}h)`);
  }

  // Test 6: Get actions filtered
  console.log('\n🧪 Test 6: GET /api/regulatory-updates/:id/actions?clauseRef=§820');
  const getActionsRes = await fetch(`http://localhost:5000/api/regulatory-updates/${updateId}/actions?clauseRef=§820`);

  if (!getActionsRes.ok) {
    console.log(`❌ Get actions failed: ${getActionsRes.status}`);
  } else {
    const actions = await getActionsRes.json();
    console.log(`✅ Retrieved ${actions.length} actions for clause §820`);
    if (actions.length > 0) {
      console.log(`   First action: ${actions[0].actionCode} - ${actions[0].title}`);
    }
  }

  console.log('\n🎉 All endpoint tests completed!');
}

testEndpoints().catch(e => console.error('💥 Test error:', e));
