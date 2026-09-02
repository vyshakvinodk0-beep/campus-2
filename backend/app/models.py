from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

class User(BaseModel):
    id: int
    email: str
    hashed_password: Optional[str] = None
    full_name: str
    role: str = "Faculty"
    department: str = "Computer Science & Engineering"
    is_active: bool = True
    has_logged_in: bool = True
    login_count: int = 1
    created_at: str

class UserCreate(BaseModel):
    email: str
    password: Optional[str] = "password123"
    full_name: str
    role: str = "Faculty"
    department: Optional[str] = "Computer Science & Engineering"

class UserLogin(BaseModel):
    email: str
    password: str

class GoogleOAuthPayload(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    token: Optional[str] = None
    credential: Optional[str] = None
    role: Optional[str] = "Faculty"
    department: Optional[str] = "Computer Science & Engineering"

class SendOtpRequest(BaseModel):
    email: str
    purpose: Optional[str] = "login"

class VerifyOtpRequest(BaseModel):
    email: str
    otp: str

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    email: str
    otp: str
    new_password: str

class UpdateRoleRequest(BaseModel):
    user_id: int
    new_role: str

class DocumentRecord(BaseModel):
    id: int
    filename: str
    original_name: str
    file_path: str
    file_type: str = "digital_pdf"
    document_type: str = "SUPPORTED_ACADEMIC_EVIDENCE"
    file_size: int = 0
    sub_criterion: str = "1.1"
    status: str = "Processed"
    validation_status: str = "Pending HOD Validation"
    hod_validated: bool = False
    hod_validated_by: Optional[str] = None
    principal_validated: bool = False
    principal_validated_by: Optional[str] = None
    validated_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    upload_date: str
    file_hash: str
    text_quality_score: float = 94.0
    ocr_quality_score: float = 90.0
    readability_score: float = 92.0
    is_scanned_pdf: bool = False
    version: int = 1
    version_status: str = "Current"
    academic_year: str = "2024-25"
    institution_name: str = "Sagar Institute of Research & Technology, Bhopal"
    extracted_text: str = ""
    chunk_count: int = 4
    page_count: int = 8
    text_pages_count: int = 8
    ocr_pages_count: int = 0
    processing_stage: str = "Completed"
    processing_progress: int = 100
    user_id: Optional[int] = 4
    relevance: Optional[str] = "HIGHLY_RELEVANT"
    relevance_reason: Optional[str] = None
    processing_decision: Optional[str] = "DIGITAL_TEXT"
    final_recommendation_status: Optional[str] = "PARTIALLY READY"

class GroundedEvidence(BaseModel):
    evidence_id: str
    criterion: str = "1"
    sub_criterion: str
    metric_id: str
    metric_name: str
    requirement_description: str
    required_evidence_type: str
    claim: str
    source_document: str
    source_page: Optional[int] = None
    evidence_snippet: str
    evidence_type: str
    evidence_status: str
    evidence_strength: int = 0
    claim_status: str
    supporting_doc_status: str
    claim_vs_artifact_status: str
    human_verification_status: str
    confidence: Optional[float] = None
    is_demo_synthetic: bool = False
    citation_validated: bool = False
    verification_notes: str = ""
    score_contribution: int = 0

class EvidenceItem(BaseModel):
    id: int
    document_id: int
    sub_criterion: str
    metric_id: str
    evidence_text: str
    page_number: Optional[int] = None
    confidence: Optional[float] = None
    relevance_status: str = "Relevant"
    evidence_status: Optional[str] = None
    evidence_strength: Optional[int] = None
    claim_status: Optional[str] = None
    supporting_doc_status: Optional[str] = None
    source_filename: Optional[str] = None
    verification_notes: Optional[str] = None
    human_verification_status: Optional[str] = None

class GapItem(BaseModel):
    id: int
    sub_criterion: str
    metric_id: Optional[str] = None
    title: str
    description: str
    severity: str
    status: str = "Open"
    missing_evidence: str
    recommended_action: str
    evidence_status: Optional[str] = None
    claim_status: Optional[str] = None
    supporting_doc_status: Optional[str] = None
    why_flagged_reason: Optional[str] = None
    priority_reason: Optional[str] = None
    source_document_id: Optional[int] = None
    source_page_numbers: Optional[str] = None
    created_at: str
    deduplication_fingerprint: Optional[str] = None
    why_it_matters: Optional[str] = None
    how_to_verify: Optional[str] = None
    documents_to_produce: Optional[str] = None

class RecommendationItem(BaseModel):
    id: int
    sub_criterion: str
    metric_id: Optional[str] = None
    category: str = "Criterion 1 Governance"
    title: str
    recommendation_text: str
    priority: str
    evidence_status: Optional[str] = None
    claim_status: Optional[str] = None
    supporting_doc_status: Optional[str] = None
    required_document: str
    responsible_role: str
    timeframe: str
    why_flagged_reason: Optional[str] = None
    priority_reason: Optional[str] = None
    source_document_id: Optional[int] = None
    source_page_numbers: Optional[str] = None
    shap_explanation_json: Optional[Dict[str, Any]] = None
    action_items: Optional[List[str]] = None
    created_at: str
    deduplication_fingerprint: Optional[str] = None
    what_is_missing: Optional[str] = None
    why_it_matters: Optional[str] = None
    what_institution_should_do: Optional[str] = None
    expected_document: Optional[str] = None
    how_to_verify: Optional[str] = None
    supported_metric: Optional[str] = None
    verification_requirement: Optional[str] = None

class DocumentConflict(BaseModel):
    id: int
    sub_criterion: str
    metric_id: str
    conflict_title: str
    description: str
    conflicting_documents: str
    discrepancy_details: str
    status: str = "Open"
    severity: str = "High"
    created_at: str

class AuditLog(BaseModel):
    id: int
    timestamp: str
    user_id: int
    user_name: str
    user_role: str
    user_email: str
    action: str
    action_type: str
    target_type: str
    target_id: str
    target_resource: str
    details: str

class InboxMessage(BaseModel):
    id: int
    sender_name: str
    sender_user_id: int
    recipient_user_id: Optional[int] = None
    recipient_email: Optional[str] = None
    recipient_role: Optional[str] = None
    category: str = "Direct"
    subject: str
    body: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    is_read: bool = False
    created_at: str

class MetricItem(BaseModel):
    id: int
    sub_criterion: str
    metric_id: str
    name: str
    description: str
    weightage: int
    status: str
    human_validation_status: str
    last_evaluated: str
    override_reason: Optional[str] = None
    evidence_count: int = 0
    gap_count: int = 0

class AnalysisOverview(BaseModel):
    id: int
    sub_criterion: str
    title: str
    score: float
    status: str
    evidence_count: int
    gap_count: int
    recommendation_count: int
    weight: int
    key_metrics: List[str]
