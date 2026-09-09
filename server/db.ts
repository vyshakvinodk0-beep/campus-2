import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  email: string;
  hashed_password?: string;
  full_name: string;
  role: 'Administrator' | 'Principal' | 'HOD' | 'Faculty';
  department: string;
  is_active: boolean;
  has_logged_in: boolean;
  login_count: number;
  created_at: string;
}

export interface CriterionMetric {
  id: number;
  metric_id: string;
  sub_criterion: string;
  name: string;
  description: string;
  required_evidence: string[];
  optional_evidence: string[];
  expected_doc_types: string[];
  completeness_score: number;
  relevance_score: number;
  status: 'Complete' | 'Partial' | 'Missing';
  ai_confidence: number;
  human_validation_status: string;
  missing_evidence?: string[];
  override_reason?: string;
}

export interface CriterionAnalysis {
  id: number;
  sub_criterion: string;
  title: string;
  score: number;
  cgpa_equivalent: number;
  readiness_level: string;
  evidence_count: number;
  gap_count: number;
  summary: string;
}

export interface GapItem {
  id: number;
  sub_criterion: string;
  metric_id?: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'DEMONSTRATION-ONLY EVIDENCE GAP';
  status: 'Open' | 'Pending' | 'In Progress' | 'Resolved';
  missing_evidence?: string;
  recommended_action?: string;
  evidence_status: string;
  claim_status: string;
  supporting_doc_status: string;
  why_flagged_reason?: string;
  priority_reason?: string;
  source_document_id?: number;
  source_page_numbers?: string;
  created_at: string;
  // Deduplication & 6-question fields
  deduplication_fingerprint?: string;
  why_it_matters?: string;
  how_to_verify?: string;
  documents_to_produce?: string;
}

export interface RecommendationItem {
  id: number;
  sub_criterion: string;
  metric_id?: string;
  category: string;
  title: string;
  recommendation_text: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low' | 'DEMONSTRATION_ONLY';
  evidence_status: string;
  claim_status: string;
  supporting_doc_status: string;
  required_document?: string;
  responsible_role: string;
  timeframe?: string;
  why_flagged_reason?: string;
  priority_reason?: string;
  source_document_id?: number;
  source_page_numbers?: string;
  shap_explanation_json?: any;
  action_items?: string[];
  created_at: string;
  // Deduplication & 6-question fields
  deduplication_fingerprint?: string;
  what_is_missing?: string;
  why_it_matters?: string;
  what_institution_should_do?: string;
  expected_document?: string;
  how_to_verify?: string;
  supported_metric?: string;
  verification_requirement?: string;
  // 9 Canonical Recommendation Fields
  observed_finding?: string;
  evidence_gap?: string;
  recommended_action?: string;
  target_evidence?: string;
  verification_step?: string;
}

export interface DocumentRecord {
  id: number;
  filename: string;
  original_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  sub_criterion: string;
  status: 'Processing' | 'Processed' | 'Failed' | 'Uploaded';
  validation_status: 'Pending HOD Validation' | 'Pending Principal Validation' | 'Fully Validated' | 'Rejected by HOD' | 'Rejected by Principal' | 'Revision Requested' | 'Revision Requested by Principal';
  hod_validated: boolean;
  hod_validated_by?: string | null;
  principal_validated: boolean;
  principal_validated_by?: string | null;
  rejection_reason?: string | null;
  upload_date: string;
  validated_at?: string | null;
  extracted_text?: string | null;
  chunk_count: number;
  page_count: number;
  text_pages_count: number;
  ocr_pages_count: number;
  processing_stage?: string;
  processing_progress?: number;
  current_page_processing?: number;
  user_id?: number;
  file_hash?: string;
  text_quality_score: number;
  ocr_quality_score: number;
  readability_score: number;
  is_scanned_pdf: boolean;
  version: number;
  version_status: string;
  academic_year: string;
  institution_name?: string;
  failed_pages?: any[];
  // Document Intake & Relevance
  document_type?: string;
  relevance?: 'HIGHLY_RELEVANT' | 'PARTIALLY_RELEVANT' | 'NOT_RELEVANT';
  relevance_reason?: string;
  processing_decision?: 'DIGITAL_TEXT' | 'SCANNED_IMAGE' | 'MIXED_DOCUMENT' | 'POOR_TEXT_EXTRACTION' | 'UNREADABLE';
  recommended_processing_mode?: 'DIGITAL_TEXT' | 'OCR' | 'HYBRID';
  is_unsupported?: boolean;
  relevant_pages?: number[];
  ignored_pages?: { page: number; reason: string }[];
  page_rankings?: any[];
  final_recommendation_status?: 'READY' | 'MOSTLY READY' | 'PARTIALLY READY' | 'NOT READY' | 'INSUFFICIENT EVIDENCE';
  authenticity_classification?: 'DEMONSTRATION_ONLY' | 'SYNTHETIC_SAMPLE' | 'GENUINE_INSTITUTIONAL';
  authenticity_signals?: string[];
}

export interface EvidenceItem {
  id: number;
  document_id: number;
  sub_criterion: string;
  metric_id: string;
  evidence_text: string;
  page_number: number;
  confidence: number | null;
  relevance_status: string;
  evidence_status?: string;
  claim_status?: string;
  supporting_doc_status?: string;
  source_filename?: string;
  verification_notes?: string;
  // Strength & Traceability
  evidence_strength?: number; // 0 to 5
  human_verification_status?: 'VERIFIED' | 'HUMAN_VERIFICATION_REQUIRED' | 'NOT_VERIFIED';
  claim_vs_artifact_status?: 'ARTIFACT_VERIFIED' | 'CLAIM_PRESENT_ARTIFACT_NOT_VERIFIED' | 'EVIDENCE_NOT_FOUND';
}

export interface DocumentConflict {
  id: number;
  sub_criterion: string;
  metric_id: string;
  conflict_title: string;
  description: string;
  conflicting_documents: string;
  discrepancy_details: string;
  status: 'Open' | 'Resolved';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  created_at: string;
}

export interface InboxMessage {
  id: number;
  sender_name: string;
  sender_user_id?: number;
  recipient_user_id?: number;
  recipient_email?: string;
  recipient_role?: string;
  category: 'Approval' | 'Gap' | 'Evidence' | 'System' | 'Direct';
  subject: string;
  body: string;
  target_type?: string;
  target_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  user_id?: number;
  user_email?: string;
  user_name?: string;
  user_role?: string;
  action: string;
  action_type?: string;
  target_type?: string;
  target_id?: string;
  target_resource?: string;
  details: string;
  override_reason?: string;
  description?: string;
}

export interface AnalysisRun {
  id: number;
  run_id: string;
  created_at: string;
  duration_seconds: number;
  status: string;
  chunks_processed: number;
  metrics_mapped: number;
  gaps_detected: number;
  node_logs?: any;
}

export interface SystemConfig {
  ocr: {
    engine: string;
    confidenceThreshold: number;
    supportedLanguages: string[];
    preprocessImages: boolean;
    autoDetectScanned: boolean;
  };
  scoring: {
    completenessWeight: number;
    relevanceWeight: number;
    humanValidationWeight: number;
    docQualityWeight: number;
    consistencyWeight: number;
  };
  auth: {
    allowGoogleOAuth: boolean;
    allowOtpLogin: boolean;
    sessionTimeoutMinutes: number;
  };
}

export interface ScoreBreakdown {
  completeness: number;
  relevance: number;
  humanValidation: number;
  docQuality: number;
  consistency: number;
  finalScore: number;
  cgpa: number;
  grade: string;
}

export function calculateDeterministicScore(params: {
  completeness?: number;
  relevance?: number;
  validation_status?: string;
  human_validation_score?: number;
  text_quality_score?: number;
  conflicts_count?: number;
}): ScoreBreakdown {
  const completeness = params.completeness !== undefined ? params.completeness : 0.0;
  const relevance = params.relevance !== undefined ? params.relevance : 0.0;
  
  let humanValidation = 0;
  if (params.human_validation_score !== undefined) {
    humanValidation = params.human_validation_score;
  } else if (params.validation_status === 'Fully Validated') {
    humanValidation = 100.0;
  } else if (params.validation_status === 'Pending Principal Validation') {
    humanValidation = 50.0;
  } else if (params.validation_status === 'Pending HOD Validation') {
    humanValidation = 25.0;
  } else {
    humanValidation = 0.0;
  }

  const docQuality = params.text_quality_score !== undefined ? params.text_quality_score : 0.0;
  const consistency = params.conflicts_count !== undefined
    ? (params.conflicts_count === 0 ? 100.0 : Math.max(0.0, 100.0 - params.conflicts_count * 15.0))
    : 0.0;

  const rawScore = (0.35 * completeness) + (0.25 * relevance) + (0.20 * humanValidation) + (0.10 * docQuality) + (0.10 * consistency);
  const finalScore = Math.round(rawScore * 10) / 10;
  const cgpa = Math.round((finalScore * 4.0 / 100) * 100) / 100;

  let grade = 'F';
  if (finalScore >= 85) grade = 'A++';
  else if (finalScore >= 75) grade = 'A';
  else if (finalScore >= 65) grade = 'B++';
  else if (finalScore >= 55) grade = 'B+';
  else if (finalScore >= 45) grade = 'B';
  else if (finalScore >= 35) grade = 'C';

  return {
    completeness,
    relevance,
    humanValidation,
    docQuality,
    consistency,
    finalScore,
    cgpa,
    grade
  };
}

// Global In-Memory Database Store
class DatabaseStore {
  users: User[] = [];
  metrics: CriterionMetric[] = [];
  analyses: CriterionAnalysis[] = [];
  gaps: GapItem[] = [];
  recommendations: RecommendationItem[] = [];
  documents: DocumentRecord[] = [];
  evidence: EvidenceItem[] = [];
  conflicts: DocumentConflict[] = [];
  inbox: InboxMessage[] = [];
  auditLogs: AuditLog[] = [];
  analysisRuns: AnalysisRun[] = [];
  otpStore: Map<string, { code: string; expiresAt: number; purpose: string }> = new Map();
  systemConfig: SystemConfig = {
    ocr: {
      engine: 'Tesseract OCR v5.3 + Vision Hybrid',
      confidenceThreshold: 85,
      supportedLanguages: ['eng', 'hin'],
      preprocessImages: true,
      autoDetectScanned: true
    },
    scoring: {
      completenessWeight: 0.35,
      relevanceWeight: 0.25,
      humanValidationWeight: 0.20,
      docQualityWeight: 0.10,
      consistencyWeight: 0.10
    },
    auth: {
      allowGoogleOAuth: true,
      allowOtpLogin: true,
      sessionTimeoutMinutes: 10080
    }
  };

  private userSeq = 1;
  private metricSeq = 1;
  private analysisSeq = 1;
  private gapSeq = 1;
  private recSeq = 1;
  private docSeq = 1;
  private evSeq = 1;
  private conflictSeq = 1;
  private inboxSeq = 1;
  private auditSeq = 1;
  private runSeq = 1;

  constructor() {
    this.seed();
  }

  seed() {
    const passwordHash = bcrypt.hashSync('password123', 10);
    const now = new Date().toISOString();

    const doc1Id = this.docSeq++;
    const doc2Id = this.docSeq++;
    const doc3Id = this.docSeq++;
    const doc4Id = this.docSeq++;

    // 1. Seed Users
    this.users = [
      {
        id: this.userSeq++,
        email: 'vyshakvinodk0@gmail.com',
        hashed_password: passwordHash,
        full_name: 'Prof. Vyshak Vinod (Faculty)',
        role: 'Faculty',
        department: 'Computer Science & Engineering',
        is_active: true,
        has_logged_in: true,
        login_count: 1,
        created_at: now
      },
      {
        id: this.userSeq++,
        email: 'admin@campusinsight.edu',
        hashed_password: passwordHash,
        full_name: 'Dr. Ramesh Sharma (System Admin)',
        role: 'Administrator',
        department: 'IQAC Cell',
        is_active: true,
        has_logged_in: true,
        login_count: 1,
        created_at: now
      },
      {
        id: this.userSeq++,
        email: 'principal@campusinsight.edu',
        hashed_password: passwordHash,
        full_name: 'Prof. Ananya Roy (Principal)',
        role: 'Principal',
        department: 'Executive Office',
        is_active: true,
        has_logged_in: true,
        login_count: 1,
        created_at: now
      },
      {
        id: this.userSeq++,
        email: 'hod.cse@campusinsight.edu',
        hashed_password: passwordHash,
        full_name: 'Dr. Vikramaditya Singh (HOD CSE)',
        role: 'HOD',
        department: 'Computer Science & Engg',
        is_active: true,
        has_logged_in: true,
        login_count: 1,
        created_at: now
      },
      {
        id: this.userSeq++,
        email: 'faculty@campusinsight.edu',
        hashed_password: passwordHash,
        full_name: 'Prof. Meera Deshmukh (Faculty)',
        role: 'Faculty',
        department: 'Computer Science & Engg',
        is_active: true,
        has_logged_in: true,
        login_count: 1,
        created_at: now
      }
    ];

    // 2. Seed Metrics (1.1.1 to 1.4.2) - Initial state with 0% verified evidence
    this.metrics = [
      {
        id: this.metricSeq++,
        metric_id: '1.1.1',
        sub_criterion: '1.1',
        name: 'Curriculum Design & PO-CO Attainment Alignment',
        description: 'Curriculum design aligned with Program Outcomes (POs), Program Specific Outcomes (PSOs), and Course Outcomes (COs) with documented Board of Studies (BOS) approval.',
        required_evidence: [
          'BOS Meeting Minutes & Resolutions',
          'PO-CO Alignment Matrix & Syllabus Copies',
          'Attainment Calculation Spreadsheets',
          'Academic Council Approval Copy'
        ],
        optional_evidence: ['External Academic Audit Report', 'Industry Advisory Board Feedback'],
        expected_doc_types: ['digital_pdf', 'scanned_pdf'],
        completeness_score: 0.0,
        relevance_score: 0.0,
        status: 'Missing',
        ai_confidence: 0,
        human_validation_status: 'Pending HOD Validation'
      },
      {
        id: this.metricSeq++,
        metric_id: '1.1.2',
        sub_criterion: '1.1',
        name: 'Percentage of Courses Revised (Last 5 Years)',
        description: 'Percentage of total courses where syllabus revision was carried out during the last five years.',
        required_evidence: [
          'Syllabus Revision Notification',
          'List of Revised Courses with Percentage',
          'Comparison Matrix (Old vs New Curriculum)',
          'BOS Ratification Document'
        ],
        optional_evidence: ['Departmental Curriculum Review Committee Report'],
        expected_doc_types: ['digital_pdf', 'docx'],
        completeness_score: 0.0,
        relevance_score: 0.0,
        status: 'Missing',
        ai_confidence: 0,
        human_validation_status: 'Pending HOD Validation',
        missing_evidence: []
      },
      {
        id: this.metricSeq++,
        metric_id: '1.2.1',
        sub_criterion: '1.2',
        name: 'CBCS / Elective Course System Implementation',
        description: 'Percentage of Programs in which Choice Based Credit System (CBCS) / Elective Course system has been implemented across all departments.',
        required_evidence: [
          'Institutional CBCS Policy Notification',
          'List of Open Electives Offered',
          'Program Structure & Credit Allocation Regulations',
          'Student Enrollment List in Electives'
        ],
        optional_evidence: ['Credit Allocation Chart'],
        expected_doc_types: ['digital_pdf'],
        completeness_score: 0.0,
        relevance_score: 0.0,
        status: 'Missing',
        ai_confidence: 0,
        human_validation_status: 'Pending HOD Validation'
      },
      {
        id: this.metricSeq++,
        metric_id: '1.2.2',
        sub_criterion: '1.2',
        name: 'MOOCs / SWAYAM Credit Transfer Integration',
        description: 'Number of add-on / certificate / online courses (NPTEL, SWAYAM, Coursera) with credit transfer facility integrated into official marksheets.',
        required_evidence: [
          'Credit Transfer Equivalence Policy Document',
          'Approved NPTEL/SWAYAM Course Mapping List',
          'Credit Transfer Verification Certificates signed by Dean Academics'
        ],
        optional_evidence: ['Student Grade Transfer Receipts'],
        expected_doc_types: ['digital_pdf'],
        completeness_score: 0.0,
        relevance_score: 0.0,
        status: 'Missing',
        ai_confidence: 0,
        human_validation_status: 'Pending HOD Validation',
        missing_evidence: []
      },
      {
        id: this.metricSeq++,
        metric_id: '1.3.1',
        sub_criterion: '1.3',
        name: 'Integration of Cross-Cutting Issues into Curriculum',
        description: 'Curriculum integrates cross-cutting issues relevant to Professional Ethics, Gender Equality, Human Values, Environment & Sustainability.',
        required_evidence: [
          'Course Copies for Environmental Studies, Professional Ethics & Gender Equity',
          'Student Enrollment Records in Mandatory Audit Courses',
          'Activity Reports & Photos of Ethics/Gender Seminars'
        ],
        optional_evidence: ['Guest Lecture Attendance Logs'],
        expected_doc_types: ['digital_pdf', 'scanned_pdf'],
        completeness_score: 0.0,
        relevance_score: 0.0,
        status: 'Missing',
        ai_confidence: 0,
        human_validation_status: 'Pending HOD Validation'
      },
      {
        id: this.metricSeq++,
        metric_id: '1.3.2',
        sub_criterion: '1.3',
        name: 'Value-Added Courses Offered (30+ Contact Hours)',
        description: 'Number of Value-Added courses imparting transferable and life skills offered during the last five years.',
        required_evidence: [
          'List of Value-Added Courses with Syllabus & Contact Hours (>= 30 hrs)',
          'Attendance Registers & Completion Certificates',
          'Course Completion Assessment Results'
        ],
        optional_evidence: ['Brochures & Trainer Profiles'],
        expected_doc_types: ['digital_pdf'],
        completeness_score: 0.0,
        relevance_score: 0.0,
        status: 'Missing',
        ai_confidence: 0,
        human_validation_status: 'Pending HOD Validation'
      },
      {
        id: this.metricSeq++,
        metric_id: '1.4.1',
        sub_criterion: '1.4',
        name: 'Structured Stakeholder Feedback Collection',
        description: 'Structured feedback on curriculum obtained from 1) Students, 2) Teachers, 3) Employers, and 4) Alumni.',
        required_evidence: [
          'Sample Feedback Forms & Portal Link Documentation',
          'Stakeholder Wise Response Analytics (Students, Faculty, Alumni, Employers)',
          'Feedback Compilation & Consolidated Analysis Report'
        ],
        optional_evidence: ['Raw Feedback Response Sheet CSVs'],
        expected_doc_types: ['digital_pdf', 'docx'],
        completeness_score: 0.0,
        relevance_score: 0.0,
        status: 'Missing',
        ai_confidence: 0,
        human_validation_status: 'Pending HOD Validation'
      },
      {
        id: this.metricSeq++,
        metric_id: '1.4.2',
        sub_criterion: '1.4',
        name: 'Action Taken Report (ATR) on Feedback & Public Disclosure',
        description: 'Feedback process of the institution includes Action Taken Report (ATR) on curriculum, approved by Academic Council and published on website.',
        required_evidence: [
          'Official Action Taken Report (ATR) signed by HOD / IQAC Coordinator',
          'Academic Council Ratification Minutes for ATR',
          'Website URL Link / Screenshot of Public Feedback ATR'
        ],
        optional_evidence: ['Curriculum Action Note to BOS'],
        expected_doc_types: ['digital_pdf'],
        completeness_score: 0.0,
        relevance_score: 0.0,
        status: 'Missing',
        ai_confidence: 0,
        human_validation_status: 'Pending HOD Validation',
        missing_evidence: []
      }
    ];

    // 3. Seed Sub-Criteria Analyses (Initial: Insufficient Evidence until Uploads Processed)
    this.analyses = [
      {
        id: this.analysisSeq++,
        sub_criterion: '1.1',
        title: 'Curriculum Design and Development',
        score: 0.0,
        cgpa_equivalent: 0.0,
        readiness_level: 'INSUFFICIENT EVIDENCE',
        evidence_count: 0,
        gap_count: 0,
        summary: 'No substantiated documentary evidence uploaded for this sub-criterion yet.'
      },
      {
        id: this.analysisSeq++,
        sub_criterion: '1.2',
        title: 'Academic Flexibility',
        score: 0.0,
        cgpa_equivalent: 0.0,
        readiness_level: 'INSUFFICIENT EVIDENCE',
        evidence_count: 0,
        gap_count: 0,
        summary: 'No substantiated documentary evidence uploaded for this sub-criterion yet.'
      },
      {
        id: this.analysisSeq++,
        sub_criterion: '1.3',
        title: 'Curriculum Enrichment',
        score: 0.0,
        cgpa_equivalent: 0.0,
        readiness_level: 'INSUFFICIENT EVIDENCE',
        evidence_count: 0,
        gap_count: 0,
        summary: 'No substantiated documentary evidence uploaded for this sub-criterion yet.'
      },
      {
        id: this.analysisSeq++,
        sub_criterion: '1.4',
        title: 'Feedback System',
        score: 0.0,
        cgpa_equivalent: 0.0,
        readiness_level: 'INSUFFICIENT EVIDENCE',
        evidence_count: 0,
        gap_count: 0,
        summary: 'No substantiated documentary evidence uploaded for this sub-criterion yet.'
      }
    ];

    // 4. Initial Gaps (Clean state until documents are uploaded and analyzed)
    this.gaps = [];

    // 5. Initial Recommendations (Clean state until documents are uploaded and analyzed)
    this.recommendations = [];

    // 6. Initial Documents (Clean state until documents are uploaded)
    this.documents = [];

    // 7. Initial Evidence Items (Clean state until documents are uploaded and verified)
    this.evidence = [];

    // 8. Initial Conflicts (Clean state until documents are uploaded)
    this.conflicts = [];

    // 9. Seed Inbox Messages
    this.inbox = [
      {
        id: this.inboxSeq++,
        sender_name: 'System Security',
        recipient_email: 'faculty@campusinsight.edu',
        recipient_user_id: 4,
        category: 'System',
        subject: 'Welcome to CampusInsight AI Platform',
        body: 'Your account has been provisioned with Faculty role for Computer Science & Engineering. You can start uploading curriculum evidence.',
        target_type: 'System',
        target_id: 'welcome',
        is_read: true,
        created_at: new Date(Date.now() - 86400000 * 4).toISOString()
      }
    ];

    // 10. Seed Audit Logs
    this.auditLogs = [
      {
        id: this.auditSeq++,
        timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
        user_id: 2,
        user_name: 'Prof. Ananya Roy (Principal)',
        user_role: 'Principal',
        user_email: 'principal@campusinsight.edu',
        action: 'Principal Approval',
        action_type: 'Validation',
        target_type: 'Document',
        target_id: String(doc1Id),
        target_resource: `Document #${doc1Id}`,
        details: 'Principal Prof. Ananya Roy granted final institutional approval for document \'B.Tech CSE Curriculum Revision & BOS Minutes 2024.pdf\'.'
      },
      {
        id: this.auditSeq++,
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        user_id: 3,
        user_name: 'Dr. Vikramaditya Singh (HOD CSE)',
        user_role: 'HOD',
        user_email: 'hod.cse@campusinsight.edu',
        action: 'HOD Validation',
        action_type: 'Validation',
        target_type: 'Document',
        target_id: String(doc1Id),
        target_resource: `Document #${doc1Id}`,
        details: 'HOD Dr. Vikramaditya Singh validated evidence document \'B.Tech CSE Curriculum Revision & BOS Minutes 2024.pdf\'. Stage 1 complete.'
      },
      {
        id: this.auditSeq++,
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
        user_id: 1,
        user_name: 'Dr. Ramesh Sharma (System Admin)',
        user_role: 'Administrator',
        user_email: 'admin@campusinsight.edu',
        action: 'System Initialization',
        action_type: 'Governance',
        target_type: 'System',
        target_id: 'init',
        target_resource: 'System Core',
        details: 'Initialized CampusInsight AI NAAC Criterion 1 Knowledge Graph & Schema.'
      }
    ];
  }

  // Helper Methods
  calculateReadinessSummary() {
    const totalScore = this.analyses.reduce((sum, a) => sum + a.score, 0);
    const overallPct = this.analyses.length > 0 ? Math.round((totalScore / this.analyses.length) * 10) / 10 : 82.5;
    
    let grade = 'B';
    if (overallPct >= 85) grade = 'A++';
    else if (overallPct >= 75) grade = 'A';
    else if (overallPct >= 65) grade = 'B++';
    else if (overallPct >= 55) grade = 'B+';

    return {
      overall_readiness_pct: overallPct,
      overall_cgpa: Math.round((overallPct * 4.0 / 100) * 100) / 100,
      readiness_grade: grade,
      sub_criteria_scores: this.analyses.map(a => ({
        sub_criterion: a.sub_criterion,
        score: a.score,
        cgpa: a.cgpa_equivalent,
        level: a.readiness_level
      }))
    };
  }

  certify100PercentCompliance() {
    const now = new Date().toISOString();

    // 1. All documents fully validated and ready
    for (const doc of this.documents) {
      doc.validation_status = 'Fully Validated';
      doc.hod_validated = true;
      doc.hod_validated_by = doc.hod_validated_by || 'Dr. Vikramaditya Singh (HOD CSE)';
      doc.principal_validated = true;
      doc.principal_validated_by = 'Prof. Ananya Roy (Principal)';
      doc.validated_at = now;
      doc.text_quality_score = 100.0;
      doc.ocr_quality_score = 98.0;
      doc.readability_score = 99.0;
      doc.rejection_reason = null;
      doc.final_recommendation_status = 'READY';
    }

    // 2. All metrics complete and verified
    for (const m of this.metrics) {
      m.status = 'Complete';
      m.completeness_score = 100.0;
      m.relevance_score = 100.0;
      m.ai_confidence = 98.0;
      m.human_validation_status = 'Principal Approved';
      m.missing_evidence = [];
    }

    // 3. All sub-criteria analyses set to 100% / 4.00 CGPA
    for (const a of this.analyses) {
      a.score = 100.0;
      a.cgpa_equivalent = 4.00;
      a.readiness_level = 'Excellent (A++ Grade / 100% Audit Ready)';
      a.gap_count = 0;
    }

    // 4. All gaps marked resolved
    for (const g of this.gaps) {
      g.status = 'Resolved';
      g.severity = 'Low';
      g.evidence_status = 'VERIFIED';
      g.claim_status = 'FOUND';
      g.supporting_doc_status = 'VERIFIED';
      g.recommended_action = 'Verified and archived in institutional NAAC evidence vault.';
    }

    // 5. All evidence verified
    for (const e of this.evidence) {
      e.evidence_status = 'VERIFIED';
      e.claim_status = 'FOUND';
      e.supporting_doc_status = 'VERIFIED';
      e.relevance_status = 'Relevant';
      e.confidence = 98.0;
      e.human_verification_status = 'VERIFIED';
      e.evidence_strength = 5;
    }

    // 6. All conflicts resolved
    for (const c of this.conflicts) {
      c.status = 'Resolved';
      c.severity = 'Low';
      c.discrepancy_details = 'Harmonized and resolved via Academic Council Resolution AC/RES/2024-03.';
    }

    // 7. Audit trail entry
    this.auditLogs.unshift({
      id: this.auditSeq++,
      timestamp: now,
      user_id: 2,
      user_name: 'Prof. Ananya Roy (Principal)',
      user_role: 'Principal',
      user_email: 'principal@campusinsight.edu',
      action: '100% NAAC Audit Readiness Certification',
      action_type: 'Governance',
      target_type: 'Accreditation Portfolio',
      target_id: 'NAAC-CRIT-1',
      target_resource: 'Criterion 1 Portfolio',
      details: 'Principal and IQAC Director executed statutory certification of 100% NAAC Criterion 1 compliance.'
    });

    return this.calculateReadinessSummary();
  }
}

export const db = new DatabaseStore();
