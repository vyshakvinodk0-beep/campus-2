import os
import datetime
import hashlib
import tempfile
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, FileResponse

from backend.app.models import (
    User, UserCreate, UserLogin, GoogleOAuthPayload, SendOtpRequest, VerifyOtpRequest,
    PasswordResetRequest, PasswordResetConfirm, UpdateRoleRequest, DocumentRecord,
    EvidenceItem, GapItem, RecommendationItem, DocumentConflict, AuditLog, InboxMessage, MetricItem
)
from backend.app.db import db, calculate_deterministic_score
from backend.app.auth import create_access_token, get_current_user, get_current_user_optional
from backend.app.pdf_engine import extract_pdf_metadata_and_text
from backend.app.gemini_service import ask_gemini
from backend.app.agentic_pipeline import execute_multi_agent_pipeline
from backend.app.reports import generate_csv_report, generate_pdf_report

app = FastAPI(
    title="CampusInsight AI — Python FastAPI Backend",
    description="Agentic AI Platform for Institutional Quality Analytics and Accreditation Decision Support",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root and Health check endpoints
@app.get("/")
def read_root():
    return {"status": "ok", "service": "CampusInsight AI Python FastAPI Backend"}

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CampusInsight AI",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "stats": {
            "users": len(db.users),
            "documents": len(db.documents),
            "evidence": len(db.evidence),
            "gaps": len(db.gaps),
            "recommendations": len(db.recommendations)
        }
    }

# =========================================================================
# 1. AUTHENTICATION & RBAC ENDPOINTS
# =========================================================================

@app.post("/api/auth/login")
def login(payload: UserLogin):
    email = payload.email.strip().lower()
    password = payload.password.strip()

    user = next((u for u in db.users if u.email.lower() == email), None)
    if not user:
        # Auto-provision user account
        inferred_role = "Administrator" if "admin" in email else ("Principal" if "principal" in email else ("HOD" if "hod" in email else "Faculty"))
        user = User(
            id=len(db.users) + 1,
            email=email,
            hashed_password=password,
            full_name=email.split("@")[0].replace(".", " ").title(),
            role=inferred_role,
            department="Computer Science & Engineering",
            is_active=True,
            has_logged_in=True,
            login_count=1,
            created_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
        )
        db.users.push(user) if hasattr(db.users, "push") else db.users.append(user)
    else:
        user.login_count += 1
        user.has_logged_in = True

    token = create_access_token({"id": user.id, "email": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.model_dump()
    }

@app.post("/api/auth/google")
def google_auth(payload: GoogleOAuthPayload):
    email = (payload.email or "google.user@campusinsight.edu").strip().lower()
    name = payload.name or email.split("@")[0].replace(".", " ").title()

    user = next((u for u in db.users if u.email.lower() == email), None)
    if not user:
        user = User(
            id=len(db.users) + 1,
            email=email,
            full_name=name,
            role=payload.role or "Faculty",
            department=payload.department or "Computer Science & Engineering",
            is_active=True,
            has_logged_in=True,
            login_count=1,
            created_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
        )
        db.users.append(user)
    else:
        user.login_count += 1

    token = create_access_token({"id": user.id, "email": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.model_dump()
    }

@app.post("/api/auth/send-otp")
def send_otp(payload: SendOtpRequest):
    email = payload.email.strip().lower()
    otp = "123456" # Standard demo OTP
    db.otpStore[email] = {
        "otp": otp,
        "expires_at": datetime.datetime.now() + datetime.timedelta(minutes=15)
    }
    return {"message": "OTP sent successfully (Use 123456 for demo)", "email": email}

@app.post("/api/auth/verify-otp")
def verify_otp(payload: VerifyOtpRequest):
    email = payload.email.strip().lower()
    otp = payload.otp.strip()

    if otp != "123456" and email in db.otpStore and db.otpStore[email]["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user = next((u for u in db.users if u.email.lower() == email), None)
    if not user:
        user = User(
            id=len(db.users) + 1,
            email=email,
            full_name=email.split("@")[0].replace(".", " ").title(),
            role="Faculty",
            department="Computer Science & Engineering",
            is_active=True,
            has_logged_in=True,
            login_count=1,
            created_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
        )
        db.users.append(user)

    token = create_access_token({"id": user.id, "email": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.model_dump()
    }

@app.post("/api/auth/request-password-reset")
def req_password_reset(payload: PasswordResetRequest):
    return {"message": "Password reset OTP sent to registered email", "email": payload.email}

@app.post("/api/auth/confirm-password-reset")
def confirm_password_reset(payload: PasswordResetConfirm):
    user = next((u for u in db.users if u.email.lower() == payload.email.lower()), None)
    if user:
        user.hashed_password = payload.new_password
    return {"message": "Password successfully updated. You may now log in."}

@app.get("/api/auth/me")
def get_me(user: User = Depends(get_current_user)):
    return user.model_dump()

# =========================================================================
# 2. USERS & ROLES MANAGEMENT
# =========================================================================

@app.get("/api/users")
def get_all_users():
    return [u.model_dump() for u in db.users]

@app.post("/api/users/update-role")
def update_user_role(payload: UpdateRoleRequest):
    user = next((u for u in db.users if u.id == payload.user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = payload.new_role
    return {"message": "Role successfully updated", "user": user.model_dump()}

# =========================================================================
# 3. DOCUMENTS & UPLOADS
# =========================================================================

@app.get("/api/documents")
def get_documents():
    return [d.model_dump() for d in db.documents]

@app.get("/api/documents/{doc_id}")
def get_document(doc_id: int):
    doc = next((d for d in db.documents if d.id == doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc.model_dump()

@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    sub_criterion: str = Form("1.1"),
    file_type: str = Form("digital_pdf")
):
    uploads_dir = os.path.join(os.getcwd(), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

    filename = f"{int(datetime.datetime.now().timestamp())}_{file.filename}"
    file_path = os.path.join(uploads_dir, filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    # Parse with PDF engine
    pdf_info = extract_pdf_metadata_and_text(file_path)

    new_doc = DocumentRecord(
        id=len(db.documents) + 1,
        filename=filename,
        original_name=file.filename or "Uploaded_Document.pdf",
        file_path=file_path,
        file_type=file_type,
        document_type="SUPPORTED_SSR" if "ssr" in (file.filename or "").lower() else "SUPPORTED_ACADEMIC_EVIDENCE",
        file_size=len(contents),
        sub_criterion=sub_criterion,
        status="Processed",
        validation_status="Pending HOD Validation",
        hod_validated=False,
        principal_validated=False,
        upload_date=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        file_hash=pdf_info["file_hash"],
        text_quality_score=pdf_info["text_quality_score"],
        ocr_quality_score=pdf_info["ocr_quality_score"],
        readability_score=pdf_info["readability_score"],
        is_scanned_pdf=pdf_info["is_scanned"],
        version=1,
        version_status="Current",
        academic_year="2024-25",
        institution_name="Sagar Institute of Research & Technology, Bhopal",
        extracted_text=pdf_info["extracted_text"][:2000],
        chunk_count=len(pdf_info["chunks"]),
        page_count=pdf_info["page_count"],
        text_pages_count=pdf_info["text_pages_count"],
        ocr_pages_count=pdf_info["ocr_pages_count"],
        processing_stage="Completed",
        processing_progress=100,
        user_id=4
    )
    db.documents.append(new_doc)

    # Execute multi-agent quality pipeline
    pipeline_res = execute_multi_agent_pipeline(new_doc, pdf_info)

    return {
        "message": "Document successfully uploaded and analyzed",
        "document": new_doc.model_dump(),
        "pipeline_result": pipeline_res
    }

# =========================================================================
# 4. WORKFLOW VALIDATION & SIGN-OFF (RBAC)
# =========================================================================

@app.post("/api/workflow/validate/{doc_id}")
def validate_document(doc_id: int, payload: Dict[str, Any] = {}):
    doc = next((d for d in db.documents if d.id == doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    action = payload.get("action", "hod_approve")
    role = payload.get("role", "HOD")
    user_name = payload.get("user_name", "Authorized Officer")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    if action == "hod_approve":
        doc.hod_validated = True
        doc.hod_validated_by = user_name
        doc.validation_status = "Pending Principal Validation"
        doc.validated_at = now_iso
    elif action == "principal_approve":
        doc.principal_validated = True
        doc.principal_validated_by = user_name
        doc.validation_status = "Fully Validated"
        doc.validated_at = now_iso
    elif action == "reject":
        doc.validation_status = "Revision Requested"
        doc.rejection_reason = payload.get("reason", "Incomplete sign-offs")

    return {
        "message": f"Workflow updated: {doc.validation_status}",
        "document": doc.model_dump()
    }

# =========================================================================
# 5. EVIDENCE, GAPS, RECOMMENDATIONS & CONFLICTS
# =========================================================================

@app.get("/api/evidence")
def get_evidence(sub_criterion: Optional[str] = None):
    if sub_criterion and sub_criterion != "All":
        return [e.model_dump() for e in db.evidence if e.sub_criterion == sub_criterion]
    return [e.model_dump() for e in db.evidence]

@app.get("/api/gaps")
def get_gaps(sub_criterion: Optional[str] = None):
    if sub_criterion and sub_criterion != "All":
        return [g.model_dump() for g in db.gaps if g.sub_criterion == sub_criterion]
    return [g.model_dump() for g in db.gaps]

@app.get("/api/recommendations")
def get_recommendations(sub_criterion: Optional[str] = None):
    if sub_criterion and sub_criterion != "All":
        return [r.model_dump() for r in db.recommendations if r.sub_criterion == sub_criterion]
    return [r.model_dump() for r in db.recommendations]

@app.get("/api/conflicts")
def get_conflicts():
    return [c.model_dump() for c in db.conflicts]

# =========================================================================
# 6. ANALYTICS & DASHBOARD SUMMARY
# =========================================================================

@app.get("/api/dashboard/summary")
def get_dashboard_summary():
    return db.calculate_readiness_summary()

@app.get("/api/metrics")
def get_metrics():
    return [m.model_dump() for m in db.metrics]

@app.get("/api/analyses")
def get_analyses():
    return [a.model_dump() for a in db.analyses]

# =========================================================================
# 7. AUDIT LOGS & INBOX
# =========================================================================

@app.get("/api/audit-logs")
def get_audit_logs():
    return [l.model_dump() for l in db.auditLogs]

@app.get("/api/inbox")
def get_inbox():
    return [m.model_dump() for m in db.inbox]

# =========================================================================
# 8. ACCREDITATION REPORTS (CSV & PDF)
# =========================================================================

@app.get("/api/reports/csv")
def download_csv_report(document_id: Optional[int] = None, institution: str = "Sagar Institute of Research & Technology, Bhopal"):
    csv_content = generate_csv_report(institution, document_id)
    filename = f"CampusInsight_Accreditation_Report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@app.get("/api/reports/pdf")
def download_pdf_report(document_id: Optional[int] = None, institution: str = "Sagar Institute of Research & Technology, Bhopal"):
    target_doc = next((d for d in db.documents if d.id == document_id), None) if document_id else (db.documents[0] if db.documents else None)
    pdf_bytes = generate_pdf_report(institution, target_doc)
    filename = f"CampusInsight_Accreditation_Report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

# =========================================================================
# 9. AI COPILOT / GEMINI Q&A
# =========================================================================

@app.post("/api/ai/ask")
def ask_ai(payload: Dict[str, Any]):
    prompt = payload.get("prompt", "")
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    
    system_instruction = (
        "You are CampusInsight AI, an expert NAAC Criterion 1 (Curricular Aspects) Accreditation Copilot. "
        "Provide factual, grounded, evidence-based guidance with citations to NAAC metrics (1.1, 1.2, 1.3, 1.4)."
    )
    answer = ask_gemini(prompt, system_instruction)
    if not answer:
        answer = (
            "Under NAAC Criterion 1 (Curricular Aspects), institutional readiness requires structured BOS syllabus revision minutes (1.1.2), "
            "CBCS implementation notifications (1.2.1), 30+ hour value-added course attendance logs (1.3.2), "
            "and 4-stakeholder feedback analysis with Action Taken Reports (1.4.1 & 1.4.2)."
        )
    return {"answer": answer}
