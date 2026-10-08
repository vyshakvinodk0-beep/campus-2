#!/usr/bin/env python3
"""
Evidence Registry & Hard Verification Gate
CampusInsight AI - Deterministic Evidence Integrity Firewall (Python Engine)
"""

import sys
import json
import re
from typing import Dict, Any, List, Optional, Tuple

class HardVerifiedGate:
    """
    Hard Verification Gate
    The LLM must NEVER have final authority over evidence verification.
    Deterministic rules strictly govern whether any evidence can be marked VERIFIED.
    """

    @staticmethod
    def evaluate(item: Dict[str, Any]) -> Dict[str, Any]:
        reasons: List[str] = []

        # Rule 1: Demonstration / Synthetic Document Gate
        if item.get("authenticity_status") == "DEMONSTRATION":
            reasons.append("Document identified as demonstration/synthetic content. Demonstration documents cannot produce VERIFIED evidence.")
            return {"final_status": "DEMONSTRATION_ONLY", "reasons": reasons, "passes_gate": False}

        # Rule 2: Physical Artifact Existence
        if not item.get("artifact_found", False):
            reasons.append("No concrete documentary artifact was found in the text (institutional claim only or empty source).")
            return {"final_status": "NOT_VERIFIED", "reasons": reasons, "passes_gate": False}

        # Rule 3: Artifact Identifiability (specific meeting date, resolution number, circular ID, etc.)
        if not item.get("artifact_identifiable", False):
            reasons.append("Artifact lacks concrete identifiers (no dates, reference numbers, or official identifiers).")
            return {"final_status": "NOT_VERIFIED", "reasons": reasons, "passes_gate": False}

        # Rule 4: Source Page Traceability
        page_number = item.get("page_number")
        if not item.get("exact_page_exists", False) or page_number is None or (isinstance(page_number, (int, float)) and page_number <= 0):
            reasons.append("Missing exact 1-indexed source page reference.")
            return {"final_status": "NOT_VERIFIED", "reasons": reasons, "passes_gate": False}

        # Rule 5: Extracted Content Grounding
        extracted_text = (item.get("extracted_text") or "").strip()
        if len(extracted_text) == 0:
            reasons.append("Extracted snippet is empty; evidence cannot be verified without verbatim text.")
            return {"final_status": "NOT_VERIFIED", "reasons": reasons, "passes_gate": False}

        # Rule 6: Source Supports Claim
        if not item.get("source_supports_claim", False):
            reasons.append("Extracted source content does not substantiate the institutional claim.")
            return {"final_status": "NOT_VERIFIED", "reasons": reasons, "passes_gate": False}

        # Rule 7: Metric Relevance Link
        if not item.get("metric_link_exists", False):
            reasons.append("Documentary artifact is not directly mapped to the NAAC metric requirement.")
            return {"final_status": "NOT_VERIFIED", "reasons": reasons, "passes_gate": False}

        # Rule 8: Conflict Gate
        if item.get("conflict_detected", False):
            reasons.append("Active unresolved conflict detected against other submitted institutional records.")
            return {"final_status": "CONFLICTING", "reasons": reasons, "passes_gate": False}

        # Rule 9: Strength Assessment
        strength = item.get("evidence_strength", 0) or 0
        if strength <= 1:
            reasons.append(f"Evidence strength is too low ({strength}/5). Insufficient documentary weight.")
            return {"final_status": "NOT_VERIFIED", "reasons": reasons, "passes_gate": False}

        if strength in (2, 3):
            reasons.append(f"Evidence strength is moderate ({strength}/5). Only partial verification granted.")
            return {"final_status": "PARTIALLY_VERIFIED", "reasons": reasons, "passes_gate": False}

        # Passed all rigorous checks:
        reasons.append("All deterministic verification criteria satisfied: concrete artifact identified, exact page traced, verbatim source grounded, metric link confirmed.")
        return {"final_status": "VERIFIED", "reasons": reasons, "passes_gate": True}


class ConsistencyValidator:
    """
    Consistency Validator
    Cross-checks reports and registry data to ensure strict mathematical and logical integrity.
    """

    @staticmethod
    def check(registry: List[Dict[str, Any]], completeness_score: float, gaps_count: int) -> Dict[str, Any]:
        errors: List[str] = []

        verified_items = [i for i in registry if i.get("backend_verified_status") == "VERIFIED"]

        # Check 1: Verified items must have positive page numbers and extracted text
        for item in verified_items:
            page = item.get("page_number")
            if page is None or (isinstance(page, (int, float)) and page <= 0):
                errors.append(f"Integrity error: Metric {item.get('metric_id')} is marked VERIFIED but has invalid page number ({page}).")

            text = (item.get("extracted_text") or "").strip()
            if len(text) == 0:
                errors.append(f"Integrity error: Metric {item.get('metric_id')} is marked VERIFIED but extracted_text is empty.")

            if item.get("authenticity_status") == "DEMONSTRATION":
                errors.append(f"Integrity error: Metric {item.get('metric_id')} is marked VERIFIED but document is DEMONSTRATION.")

        # Check 2: If completeness is 0 and gaps exist, documents to collect must be required
        if completeness_score == 0 and gaps_count == 0 and len(registry) > 0:
            errors.append("Integrity warning: Completeness is 0% but zero gaps were recorded.")

        return {
            "valid": len(errors) == 0,
            "errors": errors
        }


IDENTIFIER_PATTERN = re.compile(
    r"\b(19\d\d|20\d\d|resolution|circular|no\.|dated|minutes|meeting|ref|response|\d+(?:\.\d+)?%|\d+\s+students|\d+\s+courses|department|affiliated|university|syllabus|curricul|program|assessment)\b",
    re.IGNORECASE
)


def build_registry_from_pipeline(
    evidence_list: List[Dict[str, Any]],
    is_demo: bool,
    document_id: Any,
    document_name: str
) -> List[Dict[str, Any]]:
    """
    Transforms pipeline evidence items into canonical EvidenceRegistryItem records
    and runs each through the HardVerifiedGate.
    """
    result: List[Dict[str, Any]] = []

    for index, ev in enumerate(evidence_list):
        evidence_id = ev.get("evidence_id") or f"EV-{document_id}-{ev.get('metric_id')}-{index + 1}"
        page_num = ev.get("source_page")
        has_valid_page = page_num is not None and isinstance(page_num, (int, float)) and page_num > 0
        snippet = ev.get("evidence_snippet") or ""
        has_snippet = len(snippet.strip()) > 0

        has_claim = ev.get("claim_status") == "FOUND"
        is_artifact_verified = ev.get("claim_vs_artifact_status") == "ARTIFACT_VERIFIED" or ev.get("supporting_doc_status") == "VERIFIED"
        artifact_found = not is_demo and is_artifact_verified and has_snippet

        has_concrete_identifier = bool(IDENTIFIER_PATTERN.search(snippet))
        artifact_identifiable = artifact_found and (has_concrete_identifier or len(snippet) >= 40)

        source_supports_claim = has_snippet and len(snippet) > 20 and has_claim
        metric_link_exists = bool(ev.get("metric_id"))

        partial_item = {
            "evidence_id": evidence_id,
            "document_id": document_id,
            "document_name": document_name,
            "page_number": page_num,
            "metric_id": ev.get("metric_id"),
            "sub_criterion": ev.get("sub_criterion"),
            "checkpoint_id": ev.get("checkpoint_id"),
            "checkpoint_name": ev.get("checkpoint_name"),
            "ai_verification_status": ev.get("ai_verification_status"),
            "artifact_type": ev.get("evidence_type") or "Unknown Artifact",
            "expected_artifact": f"Mandatory NAAC documentation for metric {ev.get('metric_id')}",
            "found_artifact": (ev.get("evidence_type") or "Documentary Evidence") if artifact_found else "EVIDENCE_NOT_FOUND",
            "claim_text": ev.get("claim") or "No explicit claim extracted",
            "extracted_text": snippet,
            "artifact_found": artifact_found,
            "artifact_identifiable": artifact_identifiable,
            "source_supports_claim": source_supports_claim,
            "authenticity_status": "DEMONSTRATION" if is_demo else "GENUINE",
            "exact_page_exists": has_valid_page,
            "metric_link_exists": metric_link_exists,
            "conflict_detected": False,
            "confidence": 0 if is_demo else (ev.get("confidence") or 0),
            "llm_proposed_status": ev.get("evidence_status") or "NOT_VERIFIED",
            "evidence_strength": 0 if is_demo else (ev.get("evidence_strength") or 0),
            "provenance_type": "UNGROUNDED" if is_demo else ("PRIMARY_ARTIFACT" if artifact_found else ("INSTITUTIONAL_CLAIM" if has_claim else "UNGROUNDED")),
            "verification_notes": ev.get("verification_notes") or ""
        }

        gate_eval = HardVerifiedGate.evaluate(partial_item)

        reasons_list = [ev.get("verification_notes")] + gate_eval.get("reasons", [])
        combined_notes = " | ".join([r for r in reasons_list if r])

        full_item = {
            **partial_item,
            "backend_verified_status": gate_eval["final_status"],
            "human_verification_required": gate_eval["final_status"] not in ("VERIFIED", "DEMONSTRATION_ONLY"),
            "verification_notes": combined_notes
        }

        result.append(full_item)

    return result


def main():
    """CLI & IPC entry point for Node.js backend integration or manual terminal testing"""
    if len(sys.argv) > 1:
        mode = sys.argv[1]

        # Read JSON payload either from argument or stdin
        payload_raw = sys.argv[2] if len(sys.argv) > 2 else sys.stdin.read()
        try:
            payload = json.loads(payload_raw) if payload_raw.strip() else {}
        except Exception as e:
            print(json.dumps({"error": f"Invalid JSON payload: {str(e)}"}))
            sys.exit(1)

        if mode == "--evaluate":
            result = HardVerifiedGate.evaluate(payload)
            print(json.dumps(result))
            return

        elif mode == "--batch-evaluate":
            items = payload if isinstance(payload, list) else payload.get("items", [])
            results = [HardVerifiedGate.evaluate(item) for item in items]
            print(json.dumps(results))
            return

        elif mode == "--validate":
            registry = payload.get("registry", [])
            completeness = payload.get("completeness_score", 0.0)
            gaps = payload.get("gaps_count", 0)
            result = ConsistencyValidator.check(registry, completeness, gaps)
            print(json.dumps(result))
            return

        elif mode == "--build-pipeline":
            evidence_list = payload.get("evidence_list", [])
            is_demo = payload.get("is_demo", False)
            document_id = payload.get("document_id", 1)
            document_name = payload.get("document_name", "document.pdf")
            result = build_registry_from_pipeline(evidence_list, is_demo, document_id, document_name)
            print(json.dumps(result))
            return

    # Default interactive diagnostic output when run standalone
    print("=================================================================")
    print(" CAMPUSINSIGHT AI — EVIDENCE INTEGRITY FIREWALL (PYTHON ENGINE)")
    print("=================================================================\n")
    sample_item = {
        "metric_id": "1.1.2",
        "artifact_found": True,
        "artifact_identifiable": True,
        "exact_page_exists": True,
        "page_number": 4,
        "extracted_text": "Board of Studies meeting held on May 14, 2024. Resolution No. 2: Approved 24.3% syllabus revision.",
        "authenticity_status": "GENUINE",
        "evidence_strength": 5,
        "source_supports_claim": True,
        "metric_link_exists": True,
        "conflict_detected": False
    }
    result = HardVerifiedGate.evaluate(sample_item)
    print(f"[TEST EVALUATION] Metric: {sample_item['metric_id']}")
    print(f"Status:     {result['final_status']}")
    print(f"Passes Gate: {result['passes_gate']}")
    print(f"Reason:     {result['reasons'][0]}\n")
    print("Python Evidence Integrity Gate is active and operational.")


if __name__ == "__main__":
    main()
