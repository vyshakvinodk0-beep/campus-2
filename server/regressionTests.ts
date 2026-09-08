/**
 * CampusInsight AI - 10 Deterministic Regression Tests
 * Evidence Integrity & Anti-Hallucination Verification Suite
 */

import { HardVerifiedGate, ConsistencyValidator, EvidenceRegistryItem } from './evidenceRegistry';
import { calculateDeterministicScore } from './db';

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  totalCount++;
  if (condition) {
    console.log(`[PASS] Test ${totalCount}: ${testName}`);
    passedCount++;
  } else {
    console.error(`[FAIL] Test ${totalCount}: ${testName}`);
    if (failureDetails) {
      console.error(`       Details: ${failureDetails}`);
    }
  }
}

console.log('===============================================================');
console.log(' CAMPUSINSIGHT AI — DETERMINISTIC REGRESSION TEST SUITE');
console.log('===============================================================\n');

// -----------------------------------------------------------------
// Test 1: Empty document / no matches
// -----------------------------------------------------------------
const item1: Partial<EvidenceRegistryItem> = {
  metric_id: '1.1.1',
  artifact_found: false,
  exact_page_exists: false,
  page_number: null,
  extracted_text: '',
  authenticity_status: 'GENUINE',
  evidence_strength: 0
};
const eval1 = HardVerifiedGate.evaluate(item1);
assert(
  eval1.final_status === 'NOT_VERIFIED' && !eval1.passes_gate,
  'Empty document / no matches yields NOT_VERIFIED',
  `Got: ${eval1.final_status}, passes_gate: ${eval1.passes_gate}`
);

// -----------------------------------------------------------------
// Test 2: Demo / synthetic document
// -----------------------------------------------------------------
const item2: Partial<EvidenceRegistryItem> = {
  metric_id: '1.1.2',
  artifact_found: true,
  artifact_identifiable: true,
  exact_page_exists: true,
  page_number: 4,
  extracted_text: 'Board of Studies meeting held on May 14, 2024. Resolution 1: Revised 24.3% of core syllabus.',
  authenticity_status: 'DEMONSTRATION',
  evidence_strength: 5,
  source_supports_claim: true,
  metric_link_exists: true
};
const eval2 = HardVerifiedGate.evaluate(item2);
assert(
  eval2.final_status === 'DEMONSTRATION_ONLY' && !eval2.passes_gate,
  'Demonstration document cannot produce VERIFIED evidence (returns DEMONSTRATION_ONLY)',
  `Got: ${eval2.final_status}`
);

// -----------------------------------------------------------------
// Test 3: Institutional claim without concrete documentary artifact
// -----------------------------------------------------------------
const item3: Partial<EvidenceRegistryItem> = {
  metric_id: '1.1.1',
  artifact_found: false,
  artifact_identifiable: false,
  exact_page_exists: true,
  page_number: 2,
  extracted_text: 'The institution has updated its curriculum to align with PO-CO outcomes across all programs.',
  authenticity_status: 'GENUINE',
  evidence_strength: 2,
  source_supports_claim: true,
  metric_link_exists: true
};
const eval3 = HardVerifiedGate.evaluate(item3);
assert(
  eval3.final_status === 'NOT_VERIFIED' && !eval3.passes_gate,
  'Institutional claim without documentary artifact returns NOT_VERIFIED',
  `Got: ${eval3.final_status}`
);

// -----------------------------------------------------------------
// Test 4: Missing or invalid source page number
// -----------------------------------------------------------------
const item4: Partial<EvidenceRegistryItem> = {
  metric_id: '1.2.1',
  artifact_found: true,
  artifact_identifiable: true,
  exact_page_exists: false,
  page_number: null,
  extracted_text: 'Academic Council notification AC/2024/01 dated 12-06-2024 approving CBCS elective regulations.',
  authenticity_status: 'GENUINE',
  evidence_strength: 4,
  source_supports_claim: true,
  metric_link_exists: true
};
const eval4 = HardVerifiedGate.evaluate(item4);
assert(
  eval4.final_status === 'NOT_VERIFIED' && !eval4.passes_gate,
  'Missing page number returns NOT_VERIFIED',
  `Got: ${eval4.final_status}`
);

// -----------------------------------------------------------------
// Test 5: Fully grounded, verified artifact with dates and resolution
// -----------------------------------------------------------------
const item5: Partial<EvidenceRegistryItem> = {
  metric_id: '1.1.2',
  artifact_found: true,
  artifact_identifiable: true,
  exact_page_exists: true,
  page_number: 4,
  extracted_text: 'Board of Studies meeting held on May 14, 2024. Resolution No. 2: Approved comparative syllabus delta matrix showing 24.3% revision.',
  authenticity_status: 'GENUINE',
  evidence_strength: 5,
  source_supports_claim: true,
  metric_link_exists: true,
  conflict_detected: false
};
const eval5 = HardVerifiedGate.evaluate(item5);
assert(
  eval5.final_status === 'VERIFIED' && eval5.passes_gate,
  'Grounded genuine artifact with resolution and valid page passes gate as VERIFIED',
  `Got: ${eval5.final_status}`
);

// -----------------------------------------------------------------
// Test 6: Contradictory evidence (conflict flagged)
// -----------------------------------------------------------------
const item6: Partial<EvidenceRegistryItem> = {
  metric_id: '1.1.2',
  artifact_found: true,
  artifact_identifiable: true,
  exact_page_exists: true,
  page_number: 5,
  extracted_text: 'Official notice states no revision was carried out during academic year 2023-24.',
  authenticity_status: 'GENUINE',
  evidence_strength: 4,
  source_supports_claim: true,
  metric_link_exists: true,
  conflict_detected: true
};
const eval6 = HardVerifiedGate.evaluate(item6);
assert(
  eval6.final_status === 'CONFLICTING' && !eval6.passes_gate,
  'Conflicting evidence is flagged as CONFLICTING and blocked from VERIFIED',
  `Got: ${eval6.final_status}`
);

// -----------------------------------------------------------------
// Test 7: Weak evidence (strength <= 1)
// -----------------------------------------------------------------
const item7: Partial<EvidenceRegistryItem> = {
  metric_id: '1.3.1',
  artifact_found: true,
  artifact_identifiable: true,
  exact_page_exists: true,
  page_number: 3,
  extracted_text: 'Brief casual mention of environmental studies seminar in department newsletter dated 2024.',
  authenticity_status: 'GENUINE',
  evidence_strength: 1,
  source_supports_claim: true,
  metric_link_exists: true
};
const eval7 = HardVerifiedGate.evaluate(item7);
assert(
  eval7.final_status === 'NOT_VERIFIED' && !eval7.passes_gate,
  'Weak evidence (strength <= 1) returns NOT_VERIFIED',
  `Got: ${eval7.final_status}`
);

// -----------------------------------------------------------------
// Test 8: Moderate evidence (strength = 2 or 3)
// -----------------------------------------------------------------
const item8: Partial<EvidenceRegistryItem> = {
  metric_id: '1.3.2',
  artifact_found: true,
  artifact_identifiable: true,
  exact_page_exists: true,
  page_number: 6,
  extracted_text: 'Circular dated 10-01-2024 listing value-added course offerings, but attendance register is pending signature.',
  authenticity_status: 'GENUINE',
  evidence_strength: 3,
  source_supports_claim: true,
  metric_link_exists: true
};
const eval8 = HardVerifiedGate.evaluate(item8);
assert(
  eval8.final_status === 'PARTIALLY_VERIFIED' && !eval8.passes_gate,
  'Moderate evidence (strength 2-3) returns PARTIALLY_VERIFIED',
  `Got: ${eval8.final_status}`
);

// -----------------------------------------------------------------
// Test 9: ConsistencyValidator detects invalid page on VERIFIED item
// -----------------------------------------------------------------
const badRegistryItem: EvidenceRegistryItem = {
  evidence_id: 'EV-TEST-1',
  document_id: 1,
  document_name: 'test.pdf',
  page_number: 0, // Invalid!
  metric_id: '1.1.1',
  artifact_type: 'BOS Minutes',
  expected_artifact: 'BOS Minutes',
  found_artifact: 'BOS Minutes',
  claim_text: 'Claim',
  extracted_text: 'Extracted text',
  artifact_found: true,
  artifact_identifiable: true,
  source_supports_claim: true,
  authenticity_status: 'GENUINE',
  exact_page_exists: false,
  metric_link_exists: true,
  conflict_detected: false,
  confidence: 90,
  llm_proposed_status: 'VERIFIED',
  backend_verified_status: 'VERIFIED', // Improperly marked VERIFIED with invalid page 0
  human_verification_required: false,
  evidence_strength: 5,
  provenance_type: 'PRIMARY_ARTIFACT'
};
const validatorCheck = ConsistencyValidator.check([badRegistryItem], 50, 1);
assert(
  !validatorCheck.valid && validatorCheck.errors.length > 0,
  'ConsistencyValidator catches invalid page on VERIFIED item',
  `Expected errors, got: ${JSON.stringify(validatorCheck.errors)}`
);

// -----------------------------------------------------------------
// Test 10: Score calculation default params return 0.0, NOT 82.0
// -----------------------------------------------------------------
const emptyScoreBreakdown = calculateDeterministicScore({});
assert(
  emptyScoreBreakdown.completeness === 0.0 && emptyScoreBreakdown.relevance === 0.0 && emptyScoreBreakdown.finalScore === 0.0,
  'calculateDeterministicScore({}) defaults to 0.0 completeness and 0.0 final score',
  `Got completeness: ${emptyScoreBreakdown.completeness}, relevance: ${emptyScoreBreakdown.relevance}, finalScore: ${emptyScoreBreakdown.finalScore}`
);

console.log('\n===============================================================');
console.log(` RESULT: ${passedCount}/${totalCount} tests passed.`);
console.log('===============================================================');

if (passedCount === totalCount) {
  console.log('ALL REGRESSION TESTS PASSED CLEANLY.');
  process.exit(0);
} else {
  console.error('SOME REGRESSION TESTS FAILED.');
  process.exit(1);
}
