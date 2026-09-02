from typing import List, Dict, Any, Optional
import datetime
import hashlib
from backend.app.models import (
    User, DocumentRecord, EvidenceItem, GapItem, RecommendationItem,
    DocumentConflict, AuditLog, InboxMessage, MetricItem, AnalysisOverview
)

def calculate_deterministic_score(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deterministic NAAC-aligned scoring engine with strict 5-factor mathematical weighting.
    Formula:
      Final Score = (Completeness * 0.35) + (Relevance * 0.25) + (HumanValidation * 0.20) + (DocQuality * 0.10) + (Consistency * 0.10)
    """
    completeness = max(0.0, min(100.0, float(params.get("completeness", 0.0))))
    relevance = max(0.0, min(100.0, float(params.get("relevance", 85.0))))
    
    # Human validation scoring
    human_val_score = params.get("human_validation_score")
    if human_val_score is not None:
        human_validation = max(0.0, min(100.0, float(human_val_score)))
    else:
        status = params.get("validation_status", "Pending HOD Validation")
        if status == "Fully Validated":
            human_validation = 100.0
        elif status == "Pending Principal Validation":
            human_validation = 80.0
        elif status == "Pending HOD Validation":
            human_validation = 60.0
        elif status == "Revision Requested":
            human_validation = 40.0
        else:
            human_validation = 20.0

    doc_quality = max(0.0, min(100.0, float(params.get("text_quality_score", 94.0))))
    
    conflicts_count = int(params.get("conflicts_count", 0))
    if conflicts_count > 0:
        consistency = max(20.0, 100.0 - (conflicts_count * 40.0))
    else:
        consistency = 100.0

    w_comp = 0.35
    w_rel = 0.25
    w_hum = 0.20
    w_doc = 0.10
    w_con = 0.10

    weighted_comp = round(completeness * w_comp, 2)
    weighted_rel = round(relevance * w_rel, 2)
    weighted_hum = round(human_validation * w_hum, 2)
    weighted_doc = round(doc_quality * w_doc, 2)
    weighted_con = round(consistency * w_con, 2)

    final_score = round(weighted_comp + weighted_rel + weighted_hum + weighted_doc + weighted_con, 1)

    # NAAC 4-point CGPA mapping
    cgpa = round((final_score / 100.0) * 4.0, 2)

    # NAAC Grade mapping
    if final_score >= 85.0:
        grade = "A++"
    elif final_score >= 75.0:
        grade = "A+"
    elif final_score >= 65.0:
        grade = "A"
    elif final_score >= 55.0:
        grade = "B++"
    elif final_score >= 45.0:
        grade = "B+"
    elif final_score >= 35.0:
        grade = "B"
    else:
        grade = "C"

    return {
        "finalScore": final_score,
        "cgpa": cgpa,
        "grade": grade,
        "completeness": completeness,
        "relevance": relevance,
        "humanValidation": human_validation,
        "docQuality": doc_quality,
        "consistency": consistency,
        "breakdown": {
            "completenessWeighted": weighted_comp,
            "relevanceWeighted": weighted_rel,
            "humanValidationWeighted": weighted_hum,
            "docQualityWeighted": weighted_doc,
            "consistencyWeighted": weighted_con
        }
    }


class DatabaseStore:
    def __init__(self):
        self.users: List[User] = []
        self.documents: List[DocumentRecord] = []
        self.evidence: List[EvidenceItem] = []
        self.gaps: List[GapItem] = []
        self.recommendations: List[RecommendationItem] = []
        self.conflicts: List[DocumentConflict] = []
        self.auditLogs: List[AuditLog] = []
        self.inbox: List[InboxMessage] = []
        self.metrics: List[MetricItem] = []
        self.analyses: List[AnalysisOverview] = []
        self.analysisRuns: List[Dict[str, Any]] = []
        self.otpStore: Dict[str, Dict[str, Any]] = {}
        self.systemConfig: Dict[str, Any] = {
            "ocr": {
                "engine": "PyPDF2 + Tesseract OCR Engine v5.3",
                "confidenceThreshold": 85.0,
                "autoOcrScannedOnly": True
            },
            "scoring": {
                "weights": {
                    "completeness": 0.35,
                    "relevance": 0.25,
                    "humanValidation": 0.20,
                    "docQuality": 0.10,
                    "consistency": 0.10
                },
                "minScoreForA": 75.0,
                "minScoreForAPlus": 85.0
            },
            "auth": {
                "otpExpiryMinutes": 15,
                "allowAutoProvision": True
            }
        }
        self.seed_data()

    def seed_data(self):
        # 1. Users
        self.users = [
            User(
                id=1,
                email="admin@campusinsight.edu",
                hashed_password="password123",
                full_name="System Administrator (IQAC Lead)",
                role="Administrator",
                department="Institutional Quality Assurance Cell (IQAC)",
                is_active=True,
                has_logged_in=True,
                login_count=14,
                created_at="2025-01-10T08:00:00Z"
            ),
            User(
                id=2,
                email="principal@campusinsight.edu",
                hashed_password="password123",
                full_name="Prof. Ananya Roy (Principal)",
                role="Principal",
                department="Office of the Principal",
                is_active=True,
                has_logged_in=True,
                login_count=9,
                created_at="2025-01-10T08:00:00Z"
            ),
            User(
                id=3,
                email="hod.cse@campusinsight.edu",
                hashed_password="password123",
                full_name="Dr. Vikramaditya Singh (HOD CSE)",
                role="HOD",
                department="Computer Science & Engineering",
                is_active=True,
                has_logged_in=True,
                login_count=21,
                created_at="2025-01-10T08:00:00Z"
            ),
            User(
                id=4,
                email="faculty@campusinsight.edu",
                hashed_password="password123",
                full_name="Dr. Priya Nair (Associate Professor)",
                role="Faculty",
                department="Computer Science & Engineering",
                is_active=True,
                has_logged_in=True,
                login_count=35,
                created_at="2025-01-10T08:00:00Z"
            )
        ]

        # 2. Documents
        self.documents = [
            DocumentRecord(
                id=1,
                filename="Vimal_Jyothi_Dummy_SSR_360_Pages.pdf",
                original_name="Vimal_Jyothi_Dummy_SSR_360_Pages.pdf",
                file_path="uploads/Vimal_Jyothi_Dummy_SSR_360_Pages.pdf",
                file_type="digital_pdf",
                document_type="SUPPORTED_SSR",
                file_size=14582000,
                sub_criterion="1.1",
                status="Processed",
                validation_status="Pending HOD Validation",
                hod_validated=False,
                hod_validated_by=None,
                principal_validated=False,
                principal_validated_by=None,
                upload_date="2025-02-28T09:30:00Z",
                file_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                text_quality_score=95.2,
                ocr_quality_score=91.4,
                readability_score=93.8,
                is_scanned_pdf=False,
                version=1,
                version_status="Current",
                academic_year="2024-25",
                institution_name="Sagar Institute of Research & Technology, Bhopal",
                extracted_text="Curriculum Design and Development. Board of Studies meetings held on 15-05-2024. Revision of syllabus carried out in 24 courses. CBCS pattern implemented across all UG programs.",
                chunk_count=18,
                page_count=360,
                text_pages_count=360,
                ocr_pages_count=0,
                processing_stage="Completed",
                processing_progress=100,
                user_id=4,
                relevance="HIGHLY_RELEVANT",
                relevance_reason="Comprehensive Self Study Report containing Criterion 1 Curricular Aspects data.",
                processing_decision="DIGITAL_TEXT",
                final_recommendation_status="PARTIALLY READY"
            ),
            DocumentRecord(
                id=2,
                filename="BOS_Minutes_Curriculum_Revision_2024.pdf",
                original_name="BOS_Minutes_Curriculum_Revision_2024.pdf",
                file_path="uploads/BOS_Minutes_Curriculum_Revision_2024.pdf",
                file_type="digital_pdf",
                document_type="SUPPORTED_ACADEMIC_EVIDENCE",
                file_size=4210000,
                sub_criterion="1.1",
                status="Processed",
                validation_status="Fully Validated",
                hod_validated=True,
                hod_validated_by="Dr. Vikramaditya Singh (HOD CSE)",
                principal_validated=True,
                principal_validated_by="Prof. Ananya Roy (Principal)",
                validated_at="2025-02-15T14:20:00Z",
                upload_date="2025-02-14T11:15:00Z",
                file_hash="8f4b23c91d0e5678a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6a7b8",
                text_quality_score=97.0,
                ocr_quality_score=94.5,
                readability_score=96.1,
                is_scanned_pdf=False,
                version=1,
                version_status="Current",
                academic_year="2024-25",
                institution_name="Sagar Institute of Research & Technology, Bhopal",
                extracted_text="Minutes of the 18th Board of Studies (BOS) in Computer Science & Engineering held on May 15, 2024. Certified curriculum revision with 28% new content integration.",
                chunk_count=6,
                page_count=12,
                text_pages_count=12,
                ocr_pages_count=0,
                processing_stage="Completed",
                processing_progress=100,
                user_id=3,
                relevance="HIGHLY_RELEVANT",
                relevance_reason="Official statutory BOS minutes for Metric 1.1.2 & 1.1.3.",
                processing_decision="DIGITAL_TEXT",
                final_recommendation_status="READY"
            ),
            DocumentRecord(
                id=3,
                filename="Stakeholder_Feedback_ATR_Report_2024.pdf",
                original_name="Stakeholder_Feedback_ATR_Report_2024.pdf",
                file_path="uploads/Stakeholder_Feedback_ATR_Report_2024.pdf",
                file_type="digital_pdf",
                document_type="SUPPORTED_ACADEMIC_EVIDENCE",
                file_size=3890000,
                sub_criterion="1.4",
                status="Processed",
                validation_status="Pending Principal Validation",
                hod_validated=True,
                hod_validated_by="Dr. Vikramaditya Singh (HOD CSE)",
                principal_validated=False,
                upload_date="2025-02-20T16:45:00Z",
                file_hash="c5d6e7f8a9b0123456789abcdef0123456789abcdef0123456789abcdef01234",
                text_quality_score=93.4,
                ocr_quality_score=89.0,
                readability_score=91.5,
                is_scanned_pdf=False,
                version=1,
                version_status="Current",
                academic_year="2024-25",
                institution_name="Sagar Institute of Research & Technology, Bhopal",
                extracted_text="Annual Stakeholder Feedback Collection & Action Taken Report (ATR) 2023-24. Structured questionnaires administered to Students, Teachers, Employers, and Alumni.",
                chunk_count=8,
                page_count=16,
                text_pages_count=16,
                ocr_pages_count=0,
                processing_stage="Completed",
                processing_progress=100,
                user_id=4,
                relevance="HIGHLY_RELEVANT",
                relevance_reason="Feedback system evidence and action taken report for Metric 1.4.1 & 1.4.2.",
                processing_decision="DIGITAL_TEXT",
                final_recommendation_status="MOSTLY READY"
            )
        ]

        # 3. Evidence
        self.evidence = [
            EvidenceItem(
                id=1,
                document_id=1,
                sub_criterion="1.1",
                metric_id="1.1.1",
                evidence_text="Curriculum delivery follows structured academic calendar with lesson plans, course files, and continuous internal evaluations uploaded on ERP.",
                page_number=14,
                confidence=94.5,
                relevance_status="Relevant",
                evidence_status="VERIFIED",
                evidence_strength=5,
                claim_status="FOUND",
                supporting_doc_status="VERIFIED",
                source_filename="Vimal_Jyothi_Dummy_SSR_360_Pages.pdf",
                verification_notes="Academic calendar, course files, and internal evaluation timetable verified.",
                human_verification_status="VERIFIED"
            ),
            EvidenceItem(
                id=2,
                document_id=2,
                sub_criterion="1.1",
                metric_id="1.1.2",
                evidence_text="18th BOS Resolution No. 4/2024 approving 28% revision in B.Tech CSE syllabus including AI, Machine Learning, and Cloud Computing courses.",
                page_number=3,
                confidence=96.8,
                relevance_status="Relevant",
                evidence_status="VERIFIED",
                evidence_strength=5,
                claim_status="FOUND",
                supporting_doc_status="VERIFIED",
                source_filename="BOS_Minutes_Curriculum_Revision_2024.pdf",
                verification_notes="BOS resolution signed by Academic Council and Dean of Academics.",
                human_verification_status="VERIFIED"
            ),
            EvidenceItem(
                id=3,
                document_id=1,
                sub_criterion="1.2",
                metric_id="1.2.1",
                evidence_text="Choice Based Credit System (CBCS) implemented across all UG and PG programs with 18 open electives offered in semesters 5 to 8.",
                page_number=28,
                confidence=91.2,
                relevance_status="Relevant",
                evidence_status="VERIFIED",
                evidence_strength=4,
                claim_status="FOUND",
                supporting_doc_status="VERIFIED",
                source_filename="Vimal_Jyothi_Dummy_SSR_360_Pages.pdf",
                verification_notes="Program structures and elective allotment circulars validated.",
                human_verification_status="VERIFIED"
            ),
            EvidenceItem(
                id=4,
                document_id=1,
                sub_criterion="1.3",
                metric_id="1.3.1",
                evidence_text="Integration of cross-cutting issues into curriculum: Professional Ethics (CS601), Environmental Studies (MC301), and Constitution of India (MC401).",
                page_number=45,
                confidence=89.4,
                relevance_status="Relevant",
                evidence_status="VERIFIED",
                evidence_strength=4,
                claim_status="FOUND",
                supporting_doc_status="VERIFIED",
                source_filename="Vimal_Jyothi_Dummy_SSR_360_Pages.pdf",
                verification_notes="Course syllabus mapping for Professional Ethics, Gender, and Environment verified.",
                human_verification_status="VERIFIED"
            ),
            EvidenceItem(
                id=5,
                document_id=3,
                sub_criterion="1.4",
                metric_id="1.4.1",
                evidence_text="Feedback collected from 4 stakeholder groups (Students: 1,240, Teachers: 84, Employers: 32, Alumni: 310) using 5-point Likert scale questionnaires.",
                page_number=5,
                confidence=95.0,
                relevance_status="Relevant",
                evidence_status="VERIFIED",
                evidence_strength=5,
                claim_status="FOUND",
                supporting_doc_status="VERIFIED",
                source_filename="Stakeholder_Feedback_ATR_Report_2024.pdf",
                verification_notes="Feedback analysis charts and stakeholder response counts authenticated.",
                human_verification_status="VERIFIED"
            ),
            EvidenceItem(
                id=6,
                document_id=3,
                sub_criterion="1.4",
                metric_id="1.4.2",
                evidence_text="Action Taken Report approved in IQAC meeting dated 12-08-2024 and published on institutional website under URL /academics/feedback-atr.",
                page_number=11,
                confidence=92.3,
                relevance_status="Relevant",
                evidence_status="VERIFIED",
                evidence_strength=4,
                claim_status="FOUND",
                supporting_doc_status="VERIFIED",
                source_filename="Stakeholder_Feedback_ATR_Report_2024.pdf",
                verification_notes="IQAC ATR approval minutes verified.",
                human_verification_status="VERIFIED"
            )
        ]

        # 4. Gaps
        self.gaps = [
            GapItem(
                id=1,
                sub_criterion="1.1",
                metric_id="1.1.3",
                title="Course Direct & Indirect Attainment Calculation Records (Metric 1.1.3)",
                description="End-semester Course Outcome (CO) attainment calculation sheets and rubrics missing for 6 core lab courses in 2024-25.",
                severity="High",
                status="Open",
                missing_evidence="Certified CO-PO Attainment Calculation Sheets with Course Coordinator Signatures",
                recommended_action="Calculate and countersign attainment sheets for all lab courses via IQAC assessment portal.",
                evidence_status="PARTIALLY_VERIFIED",
                claim_status="FOUND",
                supporting_doc_status="PARTIAL",
                why_flagged_reason="Claim identified on Page 22 of SSR, but underlying calculation sheets for lab courses were not verified.",
                priority_reason="Addresses a critical compliance checkpoint for NAAC Sub-criterion 1.1.",
                source_document_id=1,
                source_page_numbers="Page 22",
                created_at="2025-02-28T10:00:00Z",
                deduplication_fingerprint="1.1-1.1.3",
                why_it_matters="Essential for DVV data verification and peer audit evidence validation.",
                how_to_verify="Verify HOD and Course Coordinator signatures on lab attainment matrices.",
                documents_to_produce="Lab Course Attainment Sheets (2024-25)"
            ),
            GapItem(
                id=2,
                sub_criterion="1.3",
                metric_id="1.3.2",
                title="Value-Added Certificate Course Attendance & Completion Rosters (Metric 1.3.2)",
                description="List of students enrolled in 30+ hour value-added courses lacks signed attendance rosters and sample certificates for 2 offerings.",
                severity="Medium",
                status="Open",
                missing_evidence="Signed Attendance Logs & Sample Certificates with Student Enrollment Registers",
                recommended_action="Compile 30-hour course attendance registers with student signatures and faculty coordinator sign-off.",
                evidence_status="PARTIALLY_VERIFIED",
                claim_status="FOUND",
                supporting_doc_status="PARTIAL",
                why_flagged_reason="Course lists present in SSR Page 52, but authenticated attendance records are missing.",
                priority_reason="Mandatory verification for DVV percentage calculation.",
                source_document_id=1,
                source_page_numbers="Page 52",
                created_at="2025-02-28T10:00:00Z",
                deduplication_fingerprint="1.3-1.3.2",
                why_it_matters="NAAC mandates minimum 30 hours duration with verified attendance registers.",
                how_to_verify="Check daily attendance sheets and course completion certificates.",
                documents_to_produce="30-Hour Value-Added Course Attendance Register"
            )
        ]

        # 5. Recommendations
        self.recommendations = [
            RecommendationItem(
                id=1,
                sub_criterion="1.1",
                metric_id="1.1.3",
                category="Criterion 1 Governance",
                title="Verify & Archive Lab Course Attainment Calculation Sheets (Metric 1.1.3)",
                recommendation_text="Compile certified CO-PO attainment calculation sheets with course coordinator and HOD signatures for all practical lab courses.",
                priority="High",
                evidence_status="PARTIALLY_VERIFIED",
                claim_status="FOUND",
                supporting_doc_status="PARTIAL",
                required_document="Certified CO-PO Attainment Calculation Sheets",
                responsible_role="HOD / Curriculum Committee",
                timeframe="Immediate (15 Days)",
                why_flagged_reason="Claim identified on Page 22 of SSR, but underlying calculation sheets for lab courses were not verified.",
                priority_reason="Addresses a critical compliance checkpoint for NAAC Sub-criterion 1.1.",
                source_document_id=1,
                source_page_numbers="Page 22",
                shap_explanation_json={
                    "impact_weight": 0.25,
                    "metric_scope": "1.1.3",
                    "predicted_readiness_gain": "+4.2%"
                },
                action_items=[
                    "1. WHAT: Certified CO-PO Attainment Calculation Sheets",
                    "2. WHY: Essential for DVV data verification and peer audit evidence validation.",
                    "3. ACTION: Calculate and countersign attainment sheets for all lab courses via IQAC assessment portal.",
                    "4. ARTIFACT: Certified CO-PO Attainment Calculation Sheets",
                    "5. VERIFICATION: Verify HOD and Course Coordinator signatures on lab attainment matrices.",
                    "6. METRIC: NAAC Criterion 1 (Metric 1.1.3)"
                ],
                created_at="2025-02-28T10:05:00Z",
                deduplication_fingerprint="REC-1.1-1.1.3",
                what_is_missing="Certified CO-PO Attainment Calculation Sheets with Course Coordinator Signatures",
                why_it_matters="Essential for DVV data verification and peer audit evidence validation.",
                what_institution_should_do="Calculate and countersign attainment sheets for all lab courses via IQAC assessment portal.",
                expected_document="Certified CO-PO Attainment Calculation Sheets",
                how_to_verify="Verify HOD and Course Coordinator signatures on lab attainment matrices.",
                supported_metric="Metric 1.1.3",
                verification_requirement="HOD and Course Coordinator signatures"
            ),
            RecommendationItem(
                id=2,
                sub_criterion="1.3",
                metric_id="1.3.2",
                category="Criterion 1 Governance",
                title="Compile & Authenticate Value-Added Course Rosters (Metric 1.3.2)",
                recommendation_text="Gather authenticated attendance registers and certificates for all 30+ hour value-added courses offered in the academic year.",
                priority="Medium",
                evidence_status="PARTIALLY_VERIFIED",
                claim_status="FOUND",
                supporting_doc_status="PARTIAL",
                required_document="Signed Attendance Logs & Sample Certificates",
                responsible_role="Faculty / Course Coordinators",
                timeframe="Mid-Term (45 Days)",
                why_flagged_reason="Course lists present in SSR Page 52, but authenticated attendance records are missing.",
                priority_reason="Mandatory verification for DVV percentage calculation.",
                source_document_id=1,
                source_page_numbers="Page 52",
                shap_explanation_json={
                    "impact_weight": 0.15,
                    "metric_scope": "1.3.2",
                    "predicted_readiness_gain": "+2.8%"
                },
                action_items=[
                    "1. WHAT: Signed Attendance Logs & Sample Certificates with Student Enrollment Registers",
                    "2. WHY: NAAC mandates minimum 30 hours duration with verified attendance registers.",
                    "3. ACTION: Compile 30-hour course attendance registers with student signatures and faculty coordinator sign-off.",
                    "4. ARTIFACT: Signed Attendance Logs & Sample Certificates",
                    "5. VERIFICATION: Check daily attendance sheets and course completion certificates.",
                    "6. METRIC: NAAC Criterion 1 (Metric 1.3.2)"
                ],
                created_at="2025-02-28T10:05:00Z",
                deduplication_fingerprint="REC-1.3-1.3.2",
                what_is_missing="Signed Attendance Logs & Sample Certificates with Student Enrollment Registers",
                why_it_matters="NAAC mandates minimum 30 hours duration with verified attendance registers.",
                what_institution_should_do="Compile 30-hour course attendance registers with student signatures and faculty coordinator sign-off.",
                expected_document="Signed Attendance Logs & Sample Certificates",
                how_to_verify="Check daily attendance sheets and course completion certificates.",
                supported_metric="Metric 1.3.2",
                verification_requirement="Faculty coordinator and IQAC stamp"
            )
        ]

        # 6. Conflicts (initially clean / zero)
        self.conflicts = []

        # 7. Audit Logs
        self.auditLogs = [
            AuditLog(
                id=1,
                timestamp="2025-02-28T09:30:00Z",
                user_id=4,
                user_name="Dr. Priya Nair (Associate Professor)",
                user_role="Faculty",
                user_email="faculty@campusinsight.edu",
                action="Document Upload",
                action_type="Upload",
                target_type="Document",
                target_id="1",
                target_resource="Document #1",
                details="Uploaded evidence document 'Vimal_Jyothi_Dummy_SSR_360_Pages.pdf' for Sub-criterion 1.1. Multi-agent processing initiated."
            ),
            AuditLog(
                id=2,
                timestamp="2025-02-15T14:20:00Z",
                user_id=2,
                user_name="Prof. Ananya Roy (Principal)",
                user_role="Principal",
                user_email="principal@campusinsight.edu",
                action="Principal Institutional Approval",
                action_type="Validation",
                target_type="Document",
                target_id="2",
                target_resource="Document #2",
                details="Principal granted final institutional accreditation validation for 'BOS_Minutes_Curriculum_Revision_2024.pdf'."
            ),
            AuditLog(
                id=3,
                timestamp="2025-02-15T10:15:00Z",
                user_id=3,
                user_name="Dr. Vikramaditya Singh (HOD CSE)",
                user_role="HOD",
                user_email="hod.cse@campusinsight.edu",
                action="HOD Stage 1 Validation",
                action_type="Validation",
                target_type="Document",
                target_id="2",
                target_resource="Document #2",
                details="HOD validated BOS meeting evidence and forwarded to Principal for accreditation sign-off."
            )
        ]

        # 8. Inbox
        self.inbox = [
            InboxMessage(
                id=1,
                sender_name="Dr. Priya Nair (Faculty)",
                sender_user_id=4,
                recipient_role="HOD",
                category="Approval",
                subject="New Evidence Uploaded: Vimal_Jyothi_Dummy_SSR_360_Pages.pdf",
                body="Faculty uploaded SSR evidence document for Sub-criterion 1.1. Pending HOD Stage 1 validation.",
                target_type="Document",
                target_id="1",
                is_read=False,
                created_at="2025-02-28T09:31:00Z"
            ),
            InboxMessage(
                id=2,
                sender_name="Dr. Vikramaditya Singh (HOD)",
                sender_user_id=3,
                recipient_role="Principal",
                category="Approval",
                subject="Stage 1 Validated: Stakeholder_Feedback_ATR_Report_2024.pdf",
                body="HOD has completed Stage 1 verification for Stakeholder Feedback Report (Sub-1.4). Pending Principal final accreditation authorization.",
                target_type="Document",
                target_id="3",
                is_read=False,
                created_at="2025-02-20T17:00:00Z"
            )
        ]

        # 9. Metrics
        self.metrics = [
            MetricItem(
                id=1,
                sub_criterion="1.1",
                metric_id="1.1.1",
                name="Curriculum Planning & Implementation",
                description="Effective curriculum delivery through well-planned and documented process including Academic Calendar and Course Files.",
                weightage=20,
                status="Complete",
                human_validation_status="HOD Validated",
                last_evaluated="2025-02-28T09:35:00Z",
                evidence_count=2,
                gap_count=0
            ),
            MetricItem(
                id=2,
                sub_criterion="1.1",
                metric_id="1.1.2",
                name="Academic Council / BOS Revision Percentage",
                description="Percentage of programs where syllabus revision was carried out during the last five years.",
                weightage=30,
                status="Complete",
                human_validation_status="Principal Approved",
                last_evaluated="2025-02-28T09:35:00Z",
                evidence_count=1,
                gap_count=0
            ),
            MetricItem(
                id=3,
                sub_criterion="1.1",
                metric_id="1.1.3",
                name="Courses with Focus on Employability / Skill Development",
                description="Average percentage of courses having focus on employability, entrepreneurship, and skill development.",
                weightage=50,
                status="Partial",
                human_validation_status="Pending Verification",
                last_evaluated="2025-02-28T09:35:00Z",
                evidence_count=1,
                gap_count=1
            ),
            MetricItem(
                id=4,
                sub_criterion="1.2",
                metric_id="1.2.1",
                name="Percentage of Programs in CBCS / Elective System",
                description="Percentage of programs in which Choice Based Credit System (CBCS) / elective course system has been implemented.",
                weightage=50,
                status="Complete",
                human_validation_status="HOD Validated",
                last_evaluated="2025-02-28T09:35:00Z",
                evidence_count=1,
                gap_count=0
            ),
            MetricItem(
                id=5,
                sub_criterion="1.2",
                metric_id="1.2.2",
                name="Add-on / Certificate Programs Offered",
                description="Number of Add-on / Certificate / Value-added programs offered and percentage of students enrolled.",
                weightage=50,
                status="Complete",
                human_validation_status="HOD Validated",
                last_evaluated="2025-02-28T09:35:00Z",
                evidence_count=1,
                gap_count=0
            ),
            MetricItem(
                id=6,
                sub_criterion="1.3",
                metric_id="1.3.1",
                name="Integration of Cross-cutting Issues",
                description="Institution integrates crosscutting issues relevant to Professional Ethics, Gender, Human Values, and Environment into Curriculum.",
                weightage=40,
                status="Complete",
                human_validation_status="HOD Validated",
                last_evaluated="2025-02-28T09:35:00Z",
                evidence_count=1,
                gap_count=0
            ),
            MetricItem(
                id=7,
                sub_criterion="1.3",
                metric_id="1.3.2",
                name="Value-Added Courses for Skill Development",
                description="Average percentage of students enrolled in value-added courses (minimum 30 contact hours) during the last 5 years.",
                weightage=60,
                status="Partial",
                human_validation_status="Pending Verification",
                last_evaluated="2025-02-28T09:35:00Z",
                evidence_count=1,
                gap_count=1
            ),
            MetricItem(
                id=8,
                sub_criterion="1.4",
                metric_id="1.4.1",
                name="Structured Feedback from Stakeholders",
                description="Institution obtains feedback on the academic performance and ambience of the institution from students, teachers, employers, and alumni.",
                weightage=50,
                status="Complete",
                human_validation_status="Principal Approved",
                last_evaluated="2025-02-28T09:35:00Z",
                evidence_count=1,
                gap_count=0
            ),
            MetricItem(
                id=9,
                sub_criterion="1.4",
                metric_id="1.4.2",
                name="Feedback Analysis & Action Taken Report (ATR)",
                description="Feedback processes of the institution: Feedback analyzed, Action taken report (ATR) hosted on the website, and communicated to Board.",
                weightage=50,
                status="Complete",
                human_validation_status="Principal Approved",
                last_evaluated="2025-02-28T09:35:00Z",
                evidence_count=1,
                gap_count=0
            )
        ]

        # 10. Analyses Overview
        self.analyses = [
            AnalysisOverview(
                id=1,
                sub_criterion="1.1",
                title="Curriculum Design & Development",
                score=78.5,
                status="High Readiness",
                evidence_count=3,
                gap_count=1,
                recommendation_count=1,
                weight=100,
                key_metrics=["1.1.1", "1.1.2", "1.1.3"]
            ),
            AnalysisOverview(
                id=2,
                sub_criterion="1.2",
                title="Academic Flexibility",
                score=84.0,
                status="High Readiness",
                evidence_count=2,
                gap_count=0,
                recommendation_count=0,
                weight=100,
                key_metrics=["1.2.1", "1.2.2"]
            ),
            AnalysisOverview(
                id=3,
                sub_criterion="1.3",
                title="Curriculum Enrichment",
                score=72.0,
                status="Satisfactory",
                evidence_count=2,
                gap_count=1,
                recommendation_count=1,
                weight=100,
                key_metrics=["1.3.1", "1.3.2"]
            ),
            AnalysisOverview(
                id=4,
                sub_criterion="1.4",
                title="Feedback System",
                score=88.5,
                status="High Readiness",
                evidence_count=2,
                gap_count=0,
                recommendation_count=0,
                weight=100,
                key_metrics=["1.4.1", "1.4.2"]
            )
        ]

    def calculate_readiness_summary(self) -> Dict[str, Any]:
        scores = [a.score for a in self.analyses]
        overall_pct = round(sum(scores) / len(scores), 1) if scores else 0.0
        cgpa = round((overall_pct / 100.0) * 4.0, 2)
        
        if overall_pct >= 85.0:
            grade = "A++"
        elif overall_pct >= 75.0:
            grade = "A+"
        elif overall_pct >= 65.0:
            grade = "A"
        elif overall_pct >= 55.0:
            grade = "B++"
        elif overall_pct >= 45.0:
            grade = "B+"
        else:
            grade = "B"

        sub_criteria_scores = [
            {
                "sub_criterion": a.sub_criterion,
                "title": a.title,
                "score": a.score,
                "status": a.status,
                "evidence_count": len([e for e in self.evidence if e.sub_criterion == a.sub_criterion]),
                "gap_count": len([g for g in self.gaps if g.sub_criterion == a.sub_criterion and g.status != "Resolved"])
            }
            for a in self.analyses
        ]

        return {
            "overall_readiness_pct": overall_pct,
            "overall_cgpa": cgpa,
            "readiness_grade": grade,
            "sub_criteria_scores": sub_criteria_scores,
            "total_documents": len(self.documents),
            "validated_documents": len([d for d in self.documents if d.validation_status == "Fully Validated"]),
            "total_evidence_items": len(self.evidence),
            "open_gaps_count": len([g for g in self.gaps if g.status != "Resolved"]),
            "unresolved_conflicts_count": len([c for c in self.conflicts if c.status == "Open"])
        }

db = DatabaseStore()
