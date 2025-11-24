import { sanitizeText, sanitizeObjectDeep } from '../../client/src/lib/neutralTerms';
import { insertRegulatoryUpdateEvaluationSchema, insertCostItemSchema, insertNormativeActionSchema } from '../../shared/schema';

function assert(condition: any, message: string) {
  if (!condition) {
    console.error('❌ Test failed:', message);
    process.exitCode = 1;
  } else {
    console.log('✅', message);
  }
}

// Sanitization tests (ohne KI-Begriffe – nur verbleibende Modell-Terminologie)
const original = 'AI Insights verbessern Machine Learning Workflows';
const sanitized = sanitizeText(original);
assert(!/AI Insights|Machine Learning/.test(sanitized), 'sanitizeText ersetzt AI & ML Begriffe');

const nested = { a: 'AI Insights', deep: { b: 'Machine Learning', arr: ['AI-based Tool', 'Predictive AI'] } };
const nestedSan = sanitizeObjectDeep(nested);
assert(nestedSan.a === 'Insights', 'sanitizeObjectDeep ersetzt AI Insights');
assert(nestedSan.deep.b === 'Algorithmus-Auswertung', 'sanitizeObjectDeep ersetzt Machine Learning');
assert(nestedSan.deep.arr[0] === 'software-based Tool', 'sanitizeObjectDeep ersetzt AI-based');
assert(nestedSan.deep.arr[1] === 'Predictive Model', 'sanitizeObjectDeep ersetzt Predictive AI');

// Validation tests
const evalPayload = {
  regulatoryUpdateId: 'reg-123',
  tenantId: 'tenant-1',
  obligationSummary: 'Kurzfassung behördlicher Pflichten',
  requiredActions: [{ code: 'ACT1', description: 'Dokument prüfen' }],
  authoritySources: [{ name: 'FDA', citation: '510(k) Guidance 2024', url: 'https://fda.gov/doc', verifiedAt: new Date().toISOString() }]
};
const evalParse = insertRegulatoryUpdateEvaluationSchema.safeParse(evalPayload);
assert(evalParse.success, 'Evaluation Schema akzeptiert gültige Payload');

const badCostItem = { tenantId: 't1', jurisdiction: 'US', authorityRef: 'FDA', feeType: 'application', description: 'Antragsgebühr', amountMinorUnit: -10, currency: 'USD', sourceUrl: 'https://fda.gov' };
const costParseBad = insertCostItemSchema.safeParse(badCostItem);
assert(!costParseBad.success, 'Cost Item Schema lehnt negative amountMinorUnit ab');

const goodCostItem = { tenantId: 't1', jurisdiction: 'US', authorityRef: 'FDA', feeType: 'application', description: 'Antragsgebühr', amountMinorUnit: 250000, currency: 'USD', sourceUrl: 'https://fda.gov', verificationStatus: 'verified' };
const costParseGood = insertCostItemSchema.safeParse(goodCostItem);
assert(costParseGood.success, 'Cost Item Schema akzeptiert korrekte Payload');

const actionPayload = { tenantId: 't1', regulatoryUpdateId: 'reg-123', clauseRef: '§4.2', actionCode: 'DOC_UPLOAD', actionDescription: 'Validiertes Dokument hochladen', estimatedEffortHours: 6 };
const actionParse = insertNormativeActionSchema.safeParse(actionPayload);
assert(actionParse.success, 'Normative Action Schema akzeptiert Payload');

process.on('beforeExit', (code) => {
  if (code === 0) {
    console.log('\n🎉 Alle Tests erfolgreich.');
  } else {
    console.error('\n⚠️ Fehler in Tests.');
  }
});
