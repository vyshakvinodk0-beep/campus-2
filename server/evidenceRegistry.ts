/**
 * Evidence Registry & Hard Verification Gate
 * CampusInsight AI - Deterministic Evidence Integrity Firewall
 */

export interface NumberProvenance {
  metric_id: string;
  field_name: string;
  raw_value: number | string;
  source_document: string;
  source_page: number;
  extracted_context: string;
  is_calculated: boolean;
  calculation_formula?: string;
  verification_status: 'SOURCE_VERIFIED' | 'UNVERIFIED' | 'CALCULATED_FROM_VERIFIED';
}

export type BackendVerifiedStatus = 
  | 'VERIFIED' 
  | 'PARTIALLY_VERIFIED' 
  | 'NOT_VERIFIED' 
  | 'MISSING' 
  | 'CONFLICTING' 
  | 'DEMONSTRATION_ONLY';

export interface EvidenceRegistryItem {
  evidence_id: string;
  document_id: number | string;
  document_name: string;
  page_number: number | null;
  metric_id: string;
  sub_criterion?: string;
  artifact_type: string;
  expected_artifact: string;
  found_artifact: string;
  claim_text: string;
  extracted_text: string;
  artifact_found: boolean;
  artifact_identifiable: boolean;
  source_supports_claim: boolean;
  authenticity_status: 'GENUINE' | 'DEMONSTRATION' | 'UNKNOWN';
  exact_page_exists: boolean;
  metric_link_exists: boolean;
  conflict_detected: boolean;
  duplicate_of?: string;
  confidence: number | null;
  llm_proposed_status: string;
  backend_verified_status: BackendVerifiedStatus;
  human_verification_required: boolean;
  evidence_strength: number; // 0 to 5
  provenance_type: 'PRIMARY_ARTIFACT' | 'SECONDARY_REFERENCE' | 'INSTITUTIONAL_CLAIM' | 'UNGROUNDED';
  verification_notes?: string;
}

export interface GateEvaluationResult {
  final_status: BackendVerifiedStatus;
  reasons: string[];
  passes_gate: boolean;
}

/**
 * Hard Verification Gate
 * The LLM must NEVER have final authority over evidence verification.
 * Deterministic rules strictly govern whether any evidence can be marked VERIFIED.
 */
export class HardVerifiedGate {
  public static evaluate(item: Partial<EvidenceRegistryItem>): GateEvaluationResult {
    const reasons: string[] = [];

    // Rule 1: Demonstration / Synthetic Document Gate
    if (item.authenticity_status === 'DEMONSTRATION') {
      reasons.push('Document identified as demonstration/synthetic content. Demonstration documents cannot produce VERIFIED evidence.');
      return { final_status: 'DEMONSTRATION_ONLY', reasons, passes_gate: false };
    }

    // Rule 2: Physical Artifact Existence
    if (!item.artifact_found) {
      reasons.push('No concrete documentary artifact was found in the text (institutional claim only or empty source).');
      return { final_status: 'NOT_VERIFIED', reasons, passes_gate: false };
    }

    // Rule 3: Artifact Identifiability (specific meeting date, resolution number, circular ID, etc.)
    if (!item.artifact_identifiable) {
      reasons.push('Artifact lacks concrete identifiers (no dates, reference numbers, or official identifiers).');
      return { final_status: 'NOT_VERIFIED', reasons, passes_gate: false };
    }

    // Rule 4: Source Page Traceability
    if (!item.exact_page_exists || item.page_number === null || item.page_number === undefined || item.page_number <= 0) {
      reasons.push('Missing exact 1-indexed source page reference.');
      return { final_status: 'NOT_VERIFIED', reasons, passes_gate: false };
    }

    // Rule 5: Extracted Content Grounding
    if (!item.extracted_text || item.extracted_text.trim().length === 0) {
      reasons.push('Extracted snippet is empty; evidence cannot be verified without verbatim text.');
      return { final_status: 'NOT_VERIFIED', reasons, passes_gate: false };
    }

    // Rule 6: Source Supports Claim
    if (!item.source_supports_claim) {
      reasons.push('Extracted source content does not substantiate the institutional claim.');
      return { final_status: 'NOT_VERIFIED', reasons, passes_gate: false };
    }

    // Rule 7: Metric Relevance Link
    if (!item.metric_link_exists) {
      reasons.push('Documentary artifact is not directly mapped to the NAAC metric requirement.');
      return { final_status: 'NOT_VERIFIED', reasons, passes_gate: false };
    }

    // Rule 8: Conflict Gate
    if (item.conflict_detected) {
      reasons.push('Active unresolved conflict detected against other submitted institutional records.');
      return { final_status: 'CONFLICTING', reasons, passes_gate: false };
    }

    // Rule 9: Strength Assessment
    const strength = item.evidence_strength ?? 0;
    if (strength <= 1) {
      reasons.push(`Evidence strength is too low (${strength}/5). Insufficient documentary weight.`);
      return { final_status: 'NOT_VERIFIED', reasons, passes_gate: false };
    }

    if (strength === 2 || strength === 3) {
      reasons.push(`Evidence strength is moderate (${strength}/5). Only partial verification granted.`);
      return { final_status: 'PARTIALLY_VERIFIED', reasons, passes_gate: false };
    }

    // Passed all rigorous checks:
    reasons.push('All deterministic verification criteria satisfied: concrete artifact identified, exact page traced, verbatim source grounded, metric link confirmed.');
    return { final_status: 'VERIFIED', reasons, passes_gate: true };
  }
}

/**
 * Consistency Validator
 * Cross-checks reports and registry data to ensure strict mathematical and logical integrity.
 */
export class ConsistencyValidator {
  public static check(registry: EvidenceRegistryItem[], completenessScore: number, gapsCount: number): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const verifiedItems = registry.filter(i => i.backend_verified_status === 'VERIFIED');
    
    // Check 1: Verified items must have positive page numbers and extracted text
    for (const item of verifiedItems) {
      if (!item.page_number || item.page_number <= 0) {
        errors.push(`Integrity error: Metric ${item.metric_id} is marked VERIFIED but has invalid page number (${item.page_number}).`);
      }
      if (!item.extracted_text || item.extracted_text.trim().length === 0) {
        errors.push(`Integrity error: Metric ${item.metric_id} is marked VERIFIED but extracted_text is empty.`);
      }
      if (item.authenticity_status === 'DEMONSTRATION') {
        errors.push(`Integrity error: Metric ${item.metric_id} is marked VERIFIED but document is DEMONSTRATION.`);
      }
    }

    // Check 2: If completeness is 0 and gaps exist, documents to collect must be required
    if (completenessScore === 0 && gapsCount === 0 && registry.length > 0) {
      errors.push('Integrity warning: Completeness is 0% but zero gaps were recorded.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Transforms pipeline evidence items into canonical EvidenceRegistryItem records
 * and runs each through the HardVerifiedGate.
 */
export function buildRegistryFromPipeline(
  evidenceList: Array<{
    evidence_id?: string;
    metric_id: string;
    sub_criterion?: string;
    claim?: string;
    source_document?: string;
    source_page?: number | null;
    evidence_snippet?: string;
    evidence_type?: string;
    evidence_status?: string;
    evidence_strength?: number;
    claim_status?: string;
    supporting_doc_status?: string;
    claim_vs_artifact_status?: string;
    human_verification_status?: string;
    confidence?: number | null;
    is_demo_synthetic?: boolean;
    verification_notes?: string;
  }>,
  isDemo: boolean,
  documentId: number | string,
  documentName: string
): EvidenceRegistryItem[] {
  return evidenceList.map((ev, index) => {
    const evidenceId = ev.evidence_id || `EV-${documentId}-${ev.metric_id}-${index + 1}`;
    const pageNum = ev.source_page ?? null;
    const hasValidPage = pageNum !== null && pageNum > 0;
    const snippet = ev.evidence_snippet || '';
    const hasSnippet = snippet.trim().length > 0;
    
    // Determine artifact presence and identifiability
    const hasClaim = ev.claim_status === 'FOUND';
    const isArtifactVerified = ev.claim_vs_artifact_status === 'ARTIFACT_VERIFIED' || ev.supporting_doc_status === 'VERIFIED';
    const artifactFound = !isDemo && isArtifactVerified && hasSnippet;
    
    // Check for specific identifiable patterns (dates, references, minutes, notifications)
    const hasConcreteIdentifier = /\b(19\d\d|20\d\d|resolution|circular|no\.|dated|minutes|meeting|ref)\b/i.test(snippet);
    const artifactIdentifiable = artifactFound && hasConcreteIdentifier;

    const sourceSupportsClaim = hasSnippet && snippet.length > 20 && hasClaim;
    const metricLinkExists = Boolean(ev.metric_id);

    const partialItem: Partial<EvidenceRegistryItem> = {
      evidence_id: evidenceId,
      document_id: documentId,
      document_name: documentName,
      page_number: pageNum,
      metric_id: ev.metric_id,
      sub_criterion: ev.sub_criterion,
      artifact_type: ev.evidence_type || 'Unknown Artifact',
      expected_artifact: `Mandatory NAAC documentation for metric ${ev.metric_id}`,
      found_artifact: artifactFound ? (ev.evidence_type || 'Documentary Evidence') : 'EVIDENCE_NOT_FOUND',
      claim_text: ev.claim || 'No explicit claim extracted',
      extracted_text: snippet,
      artifact_found: artifactFound,
      artifact_identifiable: artifactIdentifiable,
      source_supports_claim: sourceSupportsClaim,
      authenticity_status: isDemo ? 'DEMONSTRATION' : 'GENUINE',
      exact_page_exists: hasValidPage,
      metric_link_exists: metricLinkExists,
      conflict_detected: false,
      confidence: isDemo ? 0 : (ev.confidence ?? 0),
      llm_proposed_status: ev.evidence_status || 'NOT_VERIFIED',
      evidence_strength: isDemo ? 0 : (ev.evidence_strength ?? 0),
      provenance_type: isDemo 
        ? 'UNGROUNDED' 
        : (artifactFound ? 'PRIMARY_ARTIFACT' : (hasClaim ? 'INSTITUTIONAL_CLAIM' : 'UNGROUNDED')),
      verification_notes: ev.verification_notes || ''
    };

    const gateEval = HardVerifiedGate.evaluate(partialItem);

    const fullItem: EvidenceRegistryItem = {
      ...partialItem as any,
      backend_verified_status: gateEval.final_status,
      human_verification_required: gateEval.final_status !== 'VERIFIED' && gateEval.final_status !== 'DEMONSTRATION_ONLY',
      verification_notes: [ev.verification_notes, ...gateEval.reasons].filter(Boolean).join(' | ')
    };

    return fullItem;
  });
}
