#!/usr/bin/env python3
"""
CampusInsight AI - Python Deterministic Regression Test Suite
Evidence Integrity & Anti-Hallucination Verification Suite
"""

import sys
from evidence_registry import HardVerifiedGate, ConsistencyValidator, build_registry_from_pipeline
from analytics_engine import ShapAnalyticsEngine

passed_count = 0
total_count = 0

def assert_test(condition: bool, test_name: str, failure_details: str = ""):
    global passed_count, total_count
    total_count += 1
    if condition:
        print(f"[PASS] Test {total_count}: {test_name}")
        passed_count += 1
    else:
        print(f"[FAIL] Test {total_count}: {test_name}")
        if failure_details:
            print(f"       Details: {failure_details}")

def main():
    print("===============================================================")
    print(" CAMPUSINSIGHT AI — PYTHON REGRESSION TEST SUITE")
    print(" Evidence Integrity & Deterministic Verification Gateway")
    print("===============================================================\n")

    # Test 1: Empty document / no matches
    item1 = {
        "metric_id": "1.1.1",
        "artifact_found": False,
        "exact_page_exists": False,
        "page_number": None,
        "extracted_text": "",
        "authenticity_status": "GENUINE",
        "evidence_strength": 0
    }
    eval1 = HardVerifiedGate.evaluate(item1)
    assert_test(
        eval1["final_status"] == "NOT_VERIFIED" and not eval1["passes_gate"],
        "Empty document / no matches yields NOT_VERIFIED",
        f"Got: {eval1['final_status']}, passes_gate: {eval1['passes_gate']}"
    )

    # Test 2: Demo / synthetic document
    item2 = {
        "metric_id": "1.1.2",
        "artifact_found": True,
        "artifact_identifiable": True,
        "exact_page_exists": True,
        "page_number": 4,
        "extracted_text": "Board of Studies meeting held on May 14, 2024. Resolution 1: Revised 24.3% of core syllabus.",
        "authenticity_status": "DEMONSTRATION",
        "evidence_strength": 5,
        "source_supports_claim": True,
        "metric_link_exists": True
    }
    eval2 = HardVerifiedGate.evaluate(item2)
    assert_test(
        eval2["final_status"] == "DEMONSTRATION_ONLY" and not eval2["passes_gate"],
        "Demonstration document cannot produce VERIFIED evidence (returns DEMONSTRATION_ONLY)",
        f"Got: {eval2['final_status']}"
    )

    # Test 3: Institutional claim without concrete documentary artifact
    item3 = {
        "metric_id": "1.1.1",
        "artifact_found": False,
        "artifact_identifiable": False,
        "exact_page_exists": True,
        "page_number": 2,
        "extracted_text": "The institution has updated its curriculum to align with PO-CO outcomes across all programs.",
        "authenticity_status": "GENUINE",
        "evidence_strength": 2,
        "source_supports_claim": True,
        "metric_link_exists": True
    }
    eval3 = HardVerifiedGate.evaluate(item3)
    assert_test(
        eval3["final_status"] == "NOT_VERIFIED" and not eval3["passes_gate"],
        "Institutional claim without documentary artifact returns NOT_VERIFIED",
        f"Got: {eval3['final_status']}"
    )

    # Test 4: Missing or invalid source page number
    item4 = {
        "metric_id": "1.2.1",
        "artifact_found": True,
        "artifact_identifiable": True,
        "exact_page_exists": False,
        "page_number": None,
        "extracted_text": "Academic Council notification AC/2024/01 dated 12-06-2024 approving CBCS elective regulations.",
        "authenticity_status": "GENUINE",
        "evidence_strength": 4,
        "source_supports_claim": True,
        "metric_link_exists": True
    }
    eval4 = HardVerifiedGate.evaluate(item4)
    assert_test(
        eval4["final_status"] == "NOT_VERIFIED" and not eval4["passes_gate"],
        "Missing page number returns NOT_VERIFIED",
        f"Got: {eval4['final_status']}"
    )

    # Test 5: Fully grounded, verified artifact with dates and resolution
    item5 = {
        "metric_id": "1.1.2",
        "artifact_found": True,
        "artifact_identifiable": True,
        "exact_page_exists": True,
        "page_number": 4,
        "extracted_text": "Board of Studies meeting held on May 14, 2024. Resolution No. 2: Approved comparative syllabus delta matrix showing 24.3% revision.",
        "authenticity_status": "GENUINE",
        "evidence_strength": 5,
        "source_supports_claim": True,
        "metric_link_exists": True,
        "conflict_detected": False
    }
    eval5 = HardVerifiedGate.evaluate(item5)
    assert_test(
        eval5["final_status"] == "VERIFIED" and eval5["passes_gate"],
        "Grounded genuine artifact with resolution and valid page passes gate as VERIFIED",
        f"Got: {eval5['final_status']}"
    )

    # Test 6: Contradictory evidence (conflict flagged)
    item6 = {
        "metric_id": "1.1.2",
        "artifact_found": True,
        "artifact_identifiable": True,
        "exact_page_exists": True,
        "page_number": 5,
        "extracted_text": "Official notice states no revision was carried out during academic year 2023-24.",
        "authenticity_status": "GENUINE",
        "evidence_strength": 4,
        "source_supports_claim": True,
        "metric_link_exists": True,
        "conflict_detected": True
    }
    eval6 = HardVerifiedGate.evaluate(item6)
    assert_test(
        eval6["final_status"] == "CONFLICTING" and not eval6["passes_gate"],
        "Conflicting evidence is flagged as CONFLICTING and blocked from VERIFIED",
        f"Got: {eval6['final_status']}"
    )

    # Test 7: Weak evidence (strength <= 1)
    item7 = {
        "metric_id": "1.3.1",
        "artifact_found": True,
        "artifact_identifiable": True,
        "exact_page_exists": True,
        "page_number": 3,
        "extracted_text": "Brief casual mention of environmental studies seminar in department newsletter dated 2024.",
        "authenticity_status": "GENUINE",
        "evidence_strength": 1,
        "source_supports_claim": True,
        "metric_link_exists": True
    }
    eval7 = HardVerifiedGate.evaluate(item7)
    assert_test(
        eval7["final_status"] == "NOT_VERIFIED" and not eval7["passes_gate"],
        "Weak evidence (strength <= 1) returns NOT_VERIFIED",
        f"Got: {eval7['final_status']}"
    )

    # Test 8: Moderate evidence (strength = 2 or 3)
    item8 = {
        "metric_id": "1.3.2",
        "artifact_found": True,
        "artifact_identifiable": True,
        "exact_page_exists": True,
        "page_number": 6,
        "extracted_text": "Circular dated 10-01-2024 listing value-added course offerings, but attendance register is pending signature.",
        "authenticity_status": "GENUINE",
        "evidence_strength": 3,
        "source_supports_claim": True,
        "metric_link_exists": True
    }
    eval8 = HardVerifiedGate.evaluate(item8)
    assert_test(
        eval8["final_status"] == "PARTIALLY_VERIFIED" and not eval8["passes_gate"],
        "Moderate evidence (strength 2-3) returns PARTIALLY_VERIFIED",
        f"Got: {eval8['final_status']}"
    )

    # Test 9: ConsistencyValidator detects invalid page on VERIFIED item
    bad_registry_item = {
        "evidence_id": "EV-TEST-1",
        "document_id": 1,
        "document_name": "test.pdf",
        "page_number": 0,  # Invalid
        "metric_id": "1.1.1",
        "extracted_text": "Extracted text",
        "authenticity_status": "GENUINE",
        "backend_verified_status": "VERIFIED"
    }
    validator_check = ConsistencyValidator.check([bad_registry_item], 50.0, 1)
    assert_test(
        not validator_check["valid"] and len(validator_check["errors"]) > 0,
        "ConsistencyValidator catches invalid page on VERIFIED item",
        f"Expected errors, got: {validator_check['errors']}"
    )

    # Test 10: ConsistencyValidator catches empty text on VERIFIED item
    bad_registry_item2 = {
        "evidence_id": "EV-TEST-2",
        "document_id": 1,
        "document_name": "test.pdf",
        "page_number": 3,
        "metric_id": "1.1.2",
        "extracted_text": "   ",  # Blank
        "authenticity_status": "GENUINE",
        "backend_verified_status": "VERIFIED"
    }
    validator_check2 = ConsistencyValidator.check([bad_registry_item2], 50.0, 1)
    assert_test(
        not validator_check2["valid"] and any("extracted_text is empty" in e for e in validator_check2["errors"]),
        "ConsistencyValidator catches empty extracted_text on VERIFIED item",
        f"Expected errors, got: {validator_check2['errors']}"
    )

    # Test 11: Explainable AI SHAP engine decomposes positive and negative drivers
    shap_res = ShapAnalyticsEngine.get_explanation("1.1")
    assert_test(
        shap_res["sub_criterion"] == "1.1" and len(shap_res["feature_contributions"]) >= 3 and shap_res["predicted_score"] > 80.0,
        "SHAP Analytics engine computes positive and negative feature attributions for 1.1",
        f"Got predicted: {shap_res.get('predicted_score')}, features: {len(shap_res.get('feature_contributions', []))}"
    )

    # Test 12: build_registry_from_pipeline transforms raw pipeline evidence
    pipeline_evidence = [{
        "metric_id": "1.1.2",
        "sub_criterion": "1.1",
        "claim": "Revised syllabus by 24%",
        "source_page": 4,
        "evidence_snippet": "Resolution No. 2 dated 14-05-2024: Approved syllabus revision.",
        "claim_status": "FOUND",
        "supporting_doc_status": "VERIFIED",
        "confidence": 95,
        "evidence_strength": 5
    }]
    reg_items = build_registry_from_pipeline(pipeline_evidence, False, 101, "syllabus_bos.pdf")
    assert_test(
        len(reg_items) == 1 and reg_items[0]["backend_verified_status"] == "VERIFIED",
        "build_registry_from_pipeline correctly transforms raw pipeline data and passes verification",
        f"Got status: {reg_items[0]['backend_verified_status'] if reg_items else 'None'}"
    )

    print("\n===============================================================")
    print(f" RESULT: {passed_count}/{total_count} tests passed.")
    print("===============================================================")

    if passed_count == total_count:
        print("ALL PYTHON REGRESSION TESTS PASSED CLEANLY.\n")
        sys.exit(0)
    else:
        print("SOME PYTHON REGRESSION TESTS FAILED.\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
