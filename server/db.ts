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
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
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
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
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
  const completeness = params.completeness !== undefined ? params.completeness : 82.0;
  const relevance = params.relevance !== undefined ? params.relevance : 90.0;
  
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

  const docQuality = params.text_quality_score !== undefined ? params.text_quality_score : 95.0;
  const consistency = (params.conflicts_count || 0) === 0 ? 95.0 : Math.max(50.0, 95.0 - (params.conflicts_count || 0) * 15.0);

  const rawScore = (0.35 * completeness) + (0.25 * relevance) + (0.20 * humanValidation) + (0.10 * docQuality) + (0.10 * consistency);
  const finalScore = Math.round(rawScore * 10) / 10;
  const cgpa = Math.round((finalScore * 4.0 / 100) * 100) / 100;

  let grade = 'B';
  if (finalScore >= 85) grade = 'A++';
  else if (finalScore >= 75) grade = 'A';
  else if (finalScore >= 65) grade = 'B++';
  else if (finalScore >= 55) grade = 'B+';

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

    // 2. Seed Metrics (1.1.1 to 1.4.2)
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
        completeness_score: 92.0,
        relevance_score: 95.0,
        status: 'Complete',
        ai_confidence: 94.0,
        human_validation_status: 'HOD Approved'
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
        completeness_score: 78.0,
        relevance_score: 88.0,
        status: 'Partial',
        ai_confidence: 90.0,
        human_validation_status: 'Faculty Verified',
        missing_evidence: ['Detailed Course-by-Course Comparison Matrix 2023-24']
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
        completeness_score: 90.0,
        relevance_score: 92.0,
        status: 'Complete',
        ai_confidence: 93.0,
        human_validation_status: 'HOD Approved'
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
        completeness_score: 65.0,
        relevance_score: 85.0,
        status: 'Partial',
        ai_confidence: 88.0,
        human_validation_status: 'Pending Validation',
        missing_evidence: ['Signed Credit Transfer Verification Certificates by Dean Academics']
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
        completeness_score: 95.0,
        relevance_score: 98.0,
        status: 'Complete',
        ai_confidence: 96.0,
        human_validation_status: 'Principal Approved'
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
        completeness_score: 88.0,
        relevance_score: 90.0,
        status: 'Complete',
        ai_confidence: 92.0,
        human_validation_status: 'HOD Approved'
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
        completeness_score: 85.0,
        relevance_score: 89.0,
        status: 'Complete',
        ai_confidence: 91.0,
        human_validation_status: 'Faculty Verified'
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
        completeness_score: 60.0,
        relevance_score: 82.0,
        status: 'Partial',
        ai_confidence: 86.0,
        human_validation_status: 'Pending Validation',
        missing_evidence: ['Academic Council Signature Page on Action Taken Report (ATR) 2024']
      }
    ];

    // 3. Seed Sub-Criteria Analyses
    this.analyses = [
      {
        id: this.analysisSeq++,
        sub_criterion: '1.1',
        title: 'Curriculum Design and Development',
        score: 51.5,
        cgpa_equivalent: 2.06,
        readiness_level: 'Developing (B Grade)',
        evidence_count: 3,
        gap_count: 3,
        summary: 'Evaluated Sub-criterion 1.1 (Metrics 1.1.1, 1.1.2, 1.1.3). Curricular planning claim identified on Page 2 (Metric 1.1.1, verification required). Missing comparative syllabus delta tables (1.1.2) and employability mapping matrices (1.1.3).'
      },
      {
        id: this.analysisSeq++,
        sub_criterion: '1.2',
        title: 'Academic Flexibility',
        score: 78.0,
        cgpa_equivalent: 3.12,
        readiness_level: 'Good (A Grade)',
        evidence_count: 6,
        gap_count: 1,
        summary: 'Choice Based Credit System (CBCS) implemented across 100% of B.Tech programmes. Credit transfer policy for MOOCs/SWAYAM courses integrated.'
      },
      {
        id: this.analysisSeq++,
        sub_criterion: '1.3',
        title: 'Curriculum Enrichment',
        score: 92.0,
        cgpa_equivalent: 3.68,
        readiness_level: 'Excellent (A++ Grade)',
        evidence_count: 12,
        gap_count: 0,
        summary: 'Integrates courses on Professional Ethics, Gender Equality, Environmental Studies, and Human Values. 14 Value-Added skill programs completed in 2024-25.'
      },
      {
        id: this.analysisSeq++,
        sub_criterion: '1.4',
        title: 'Feedback System',
        score: 74.0,
        cgpa_equivalent: 2.96,
        readiness_level: 'Satisfactory (B++ Grade)',
        evidence_count: 5,
        gap_count: 2,
        summary: 'Feedback collected from Students, Faculty, Alumni, and Employers. Feedback analysis report present; Action Taken Report (ATR) pending Academic Council signature.'
      }
    ];

    // 4. Seed Gaps
    this.gaps = [
      {
        id: this.gapSeq++,
        sub_criterion: '1.1',
        metric_id: '1.1.1',
        title: 'Curricular Planning, Implementation & Articulation Matrix (Metric 1.1.1)',
        description: 'The SSR narrative claims effective curriculum planning and PO-CO alignment. The underlying approved/signed CO-PO-PSO articulation matrix and academic calendar adherence records require verification as supporting evidence for peer-team audit readiness.',
        severity: 'Medium',
        status: 'Open',
        source_document_id: doc1Id,
        source_page_numbers: '2',
        missing_evidence: 'Approved/Signed Department CO-PO-PSO Articulation Matrix & Academic Calendar Adherence Records',
        recommended_action: 'Verify and upload the approved/signed CO-PO-PSO articulation matrix and academic calendar adherence records if already available in the department vault; otherwise retrieve and countersign from records.',
        evidence_status: 'PARTIALLY_VERIFIED',
        claim_status: 'FOUND',
        supporting_doc_status: 'NOT_VERIFIED',
        why_flagged_reason: 'SSR narrative claims PO-CO alignment and structured academic planning. Underlying approved articulation matrix and calendar adherence records require verification.',
        priority_reason: 'Institutional claim identified in SSR text, but supporting physical artifact requires verification for 100% audit readiness.',
        created_at: now
      },
      {
        id: this.gapSeq++,
        sub_criterion: '1.1',
        metric_id: '1.1.2',
        title: 'Programme Syllabus Revision Records & Comparative Delta (Metric 1.1.2)',
        description: 'Syllabus revision percentage is claimed in SSR narrative, but comparative old vs new syllabus delta matrices and Academic Council approval notifications are missing from uploaded text.',
        severity: 'High',
        status: 'Open',
        source_document_id: doc1Id,
        source_page_numbers: 'Not Found',
        missing_evidence: 'Comparative Course Delta Matrices (Old vs New) & Academic Council Approval Notices',
        recommended_action: 'Prepare structured old vs new curriculum comparison tables highlighting modified course content percentages and secure Academic Council gazette notifications.',
        evidence_status: 'EVIDENCE_NOT_FOUND',
        claim_status: 'NOT_FOUND',
        supporting_doc_status: 'MISSING',
        why_flagged_reason: 'Programme syllabus revision claimed, but documentary delta tables and formal approval notifications are missing from source document.',
        priority_reason: 'Mandatory NAAC Metric 1.1.2 quantitative proof for syllabus revision percentage.',
        created_at: now
      },
      {
        id: this.gapSeq++,
        sub_criterion: '1.1',
        metric_id: '1.1.3',
        title: 'Course Syllabi Focusing on Employability / Skill Development (Metric 1.1.3)',
        description: 'Focus on employability, entrepreneurship, and skill development claimed, but course syllabi with highlighted units and mapping matrices are missing from uploaded text.',
        severity: 'High',
        status: 'Open',
        source_document_id: doc1Id,
        source_page_numbers: 'Not Found',
        missing_evidence: 'Course Syllabi with Highlighted Skill Units & Mapping Matrices',
        recommended_action: 'Map all course catalog offerings against NSDC/AICTE skill development categories with syllabus-level unit highlighting and secure BOS/Academic Council endorsement.',
        evidence_status: 'EVIDENCE_NOT_FOUND',
        claim_status: 'NOT_FOUND',
        supporting_doc_status: 'MISSING',
        why_flagged_reason: 'Employability and skill development course focus missing highlighted syllabus-level documentation.',
        priority_reason: 'Mandatory NAAC Metric 1.1.3 course mapping and syllabus highlighting requirement.',
        created_at: now
      },
      {
        id: this.gapSeq++,
        sub_criterion: '1.2',
        metric_id: '1.2.2',
        title: 'BOS Resolution Verification for Elective Courses (Metric 1.2.2)',
        description: 'The SSR references Choice Based Credit System (CBCS) and elective options. Departmental Board of Studies (BOS) resolutions for elective course codes should be verified as supporting evidence.',
        severity: 'Medium',
        status: 'Open',
        missing_evidence: 'Verified BOS Resolutions & Student Elective Enrollment Lists',
        recommended_action: 'Verify that approved Board of Studies (BOS) minutes confirming elective course offerings are available in the institutional evidence repository.',
        evidence_status: 'PARTIALLY_VERIFIED',
        claim_status: 'FOUND',
        supporting_doc_status: 'NOT_VERIFIED',
        why_flagged_reason: 'CBCS/Elective structure reported in document. Specific signed BOS resolution minutes pending independent verification.',
        priority_reason: 'The institutional practice is reported, but supporting documentation requires verification to confirm elective course approvals.',
        created_at: now
      },
      {
        id: this.gapSeq++,
        sub_criterion: '1.4',
        metric_id: '1.4.2',
        title: 'Action Taken Report (ATR) Approval Verification (Metric 1.4.2)',
        description: 'Stakeholder feedback collection and website disclosure are documented in the SSR. The signed Action Taken Report (ATR) ratified by the Academic Council should be verified.',
        severity: 'High',
        status: 'Open',
        missing_evidence: 'Signed 4-Stakeholder Action Taken Report (ATR) & Website Link',
        recommended_action: 'Verify that the signed 4-stakeholder Action Taken Report (ATR) and active website URL are available in the institutional evidence repository.',
        evidence_status: 'PARTIALLY_VERIFIED',
        claim_status: 'FOUND',
        supporting_doc_status: 'NOT_VERIFIED',
        why_flagged_reason: '4-stakeholder feedback collection system active. Signed ATR document with Academic Council minute approval recommended for audit readiness.',
        priority_reason: 'Mandatory NAAC requirement for 1.4.1 and 1.4.2 audit verification.',
        created_at: now
      }
    ];

    // 5. Seed Recommendations
    this.recommendations = [
      {
        id: this.recSeq++,
        sub_criterion: '1.1',
        metric_id: '1.1.1',
        source_document_id: doc1Id,
        category: 'EVIDENCE_BASED',
        title: 'Verify Curricular Planning Documentation & Articulation Matrix (Metric 1.1.1)',
        recommendation_text: 'Verify and upload the approved/signed CO-PO-PSO articulation matrix and academic calendar adherence records if already available in the department vault; otherwise retrieve and countersign from records.',
        priority: 'Medium',
        evidence_status: 'PARTIALLY_VERIFIED',
        claim_status: 'FOUND',
        supporting_doc_status: 'NOT_VERIFIED',
        required_document: 'Approved/Signed Department CO-PO-PSO Articulation Matrix & Academic Calendar Adherence Records',
        responsible_role: 'Faculty / Course Coordinators',
        why_flagged_reason: 'SSR explicitly reports CO-PO-PSO mapping and curricular planning. Verification of signed underlying matrix recommended for peer-team audit readiness.',
        priority_reason: 'Institutional claim identified in text, but supporting documentation requires verification for 100% audit readiness.',
        shap_explanation_json: {
          sub_criterion: '1.1',
          predicted_score: 51.5,
          feature_contributions: [
            { feature_name: 'Metric_1.1.1_Claim_Found', shap_value: 12.0, description: 'Narrative curricular planning claim identified on Page 2' },
            { feature_name: 'Metric_1.1.1_Unverified_Artifact_Penalty', shap_value: -8.0, description: 'Pending signed articulation matrix verification' },
            { feature_name: 'Metric_1.1.2_Missing_Evidence_Penalty', shap_value: -15.0, description: 'Missing old vs new comparative syllabus delta matrices' },
            { feature_name: 'Metric_1.1.3_Missing_Evidence_Penalty', shap_value: -15.0, description: 'Missing course syllabi highlighting skill development units' }
          ]
        },
        action_items: [
          'Verify and upload approved/signed CO-PO-PSO articulation matrix if already available in department vault.',
          'Compile academic calendar adherence and curricular planning delivery logs signed by HOD.'
        ],
        created_at: now
      },
      {
        id: this.recSeq++,
        sub_criterion: '1.1',
        metric_id: '1.1.2',
        source_document_id: doc1Id,
        category: 'EVIDENCE_BASED',
        title: 'Compile Old vs New Syllabus Revision Delta Matrices (Metric 1.1.2)',
        recommendation_text: 'Prepare structured old vs new curriculum comparison tables highlighting modified course content percentages and secure Academic Council gazette notifications.',
        priority: 'High',
        evidence_status: 'EVIDENCE_NOT_FOUND',
        claim_status: 'NOT_FOUND',
        supporting_doc_status: 'MISSING',
        required_document: 'Comparative Course Delta Matrices (Old vs New) & Academic Council Approval Notices',
        responsible_role: 'HOD / Curriculum Committee',
        why_flagged_reason: 'Mandatory NAAC Metric 1.1.2 syllabus revision percentage proof missing from uploaded text.',
        priority_reason: 'High priority quantitative audit compliance for programme syllabus revision.',
        shap_explanation_json: {
          sub_criterion: '1.1',
          predicted_score: 51.5,
          feature_contributions: [
            { feature_name: 'Missing_Old_Vs_New_Delta_Penalty', shap_value: -15.0, description: 'Absence of syllabus comparison tables' }
          ]
        },
        action_items: [
          'Construct detailed course-by-course old vs new syllabus comparison tables highlighting content revision percentages.',
          'Attach Academic Council approval notifications and Board of Studies resolution dates.'
        ],
        created_at: now
      },
      {
        id: this.recSeq++,
        sub_criterion: '1.1',
        metric_id: '1.1.3',
        source_document_id: doc1Id,
        category: 'EVIDENCE_BASED',
        title: 'Map Course Syllabi to Employability / Skill Development Modules (Metric 1.1.3)',
        recommendation_text: 'Map all course catalog offerings against NSDC/AICTE skill development categories with syllabus-level unit highlighting and secure BOS/Academic Council endorsement.',
        priority: 'High',
        evidence_status: 'EVIDENCE_NOT_FOUND',
        claim_status: 'NOT_FOUND',
        supporting_doc_status: 'MISSING',
        required_document: 'Course Syllabi with Highlighted Skill Units & Mapping Matrices',
        responsible_role: 'Department NAAC Coordinator',
        why_flagged_reason: 'Mandatory NAAC Metric 1.1.3 course mapping and syllabus unit highlighting requirement.',
        priority_reason: 'High priority evidence gap for courses focusing on employability and entrepreneurship.',
        shap_explanation_json: {
          sub_criterion: '1.1',
          predicted_score: 51.5,
          feature_contributions: [
            { feature_name: 'Missing_Skill_Mapping_Penalty', shap_value: -15.0, description: 'Absence of highlighted syllabi and skill mapping matrices' }
          ]
        },
        action_items: [
          'Highlight specific units focusing on employability, entrepreneurship, and skill development across all course syllabi.',
          'Generate consolidated department mapping matrix endorsed by Academic Council.'
        ],
        created_at: now
      },
      {
        id: this.recSeq++,
        sub_criterion: '1.4',
        metric_id: '1.4.2',
        category: 'EVIDENCE_BASED',
        title: 'Recommendation: Action Taken Report (ATR) Approval Verification (Metric 1.4.2)',
        recommendation_text: 'Verify that the signed 4-stakeholder Action Taken Report (ATR) and active website URL are available in the institutional evidence repository.',
        priority: 'High',
        evidence_status: 'PARTIALLY_VERIFIED',
        claim_status: 'FOUND',
        supporting_doc_status: 'NOT_VERIFIED',
        required_document: 'Signed 4-Stakeholder Action Taken Report (ATR)',
        responsible_role: 'IQAC Director / Principal / HOD',
        why_flagged_reason: 'Stakeholder feedback collected but signed ATR requires Academic Council verification.',
        priority_reason: 'Mandatory NAAC requirement for 1.4.1 and 1.4.2 audit verification.',
        shap_explanation_json: {
          sub_criterion: '1.4',
          predicted_score: 74.0,
          feature_contributions: [
            { feature_name: 'Stakeholder_Feedback_Coverage', shap_value: 9.5, description: '94% students and 98% faculty participation' },
            { feature_name: 'ATR_Action_Taken_Completeness', shap_value: 6.0, description: 'Action Taken Report drafted' },
            { feature_name: 'Unratified_ATR_Penalty', shap_value: -8.0, description: 'Pending Academic Council minutes signature' }
          ]
        },
        action_items: [
          'Schedule Academic Council meeting for ATR approval.',
          'Publish ATR on institutional website public portal as mandated by NAAC.'
        ],
        created_at: now
      }
    ];

    // 6. Seed Documents
    this.documents = [
      {
        id: doc1Id,
        filename: 'BTech_CSE_Curriculum_Revision_2024.pdf',
        original_name: 'B.Tech CSE Curriculum Revision & BOS Minutes 2024.pdf',
        file_path: 'uploads/Dummy_NAAC_SSR_Criterion_1(1).pdf',
        file_type: 'digital_pdf',
        file_size: 245000,
        sub_criterion: '1.1',
        status: 'Processed',
        validation_status: 'Fully Validated',
        hod_validated: true,
        hod_validated_by: 'Dr. Vikramaditya Singh (HOD CSE)',
        principal_validated: true,
        principal_validated_by: 'Prof. Ananya Roy (Principal)',
        rejection_reason: null,
        upload_date: new Date(Date.now() - 86400000 * 3).toISOString(),
        validated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        file_hash: 'a1b2c3d4e5f67890123456789abcdef0',
        text_quality_score: 98.0,
        ocr_quality_score: 95.0,
        readability_score: 96.0,
        is_scanned_pdf: false,
        version: 1,
        version_status: 'Current',
        academic_year: '2024-25',
        institution_name: 'Sagar Institute of Research & Technology, Bhopal',
        extracted_text: `B.Tech Computer Science and Engineering Curriculum Revision 2024.
Board of Studies (BOS) Meeting held on May 14, 2024.
Resolution 1: Revised 24% of core curriculum content including Artificial Intelligence, Cloud Computing, and Agentic AI.
Resolution 2: Formulated explicit Course Outcomes (CO) aligned to NBA/NAAC Programme Outcomes (PO1 to PO12) and PSOs.
Skill development initiatives and industry-oriented laboratory experiments incorporated into 5th and 6th semester schemes.`,
        chunk_count: 3,
        page_count: 14,
        text_pages_count: 14,
        ocr_pages_count: 0,
        processing_stage: 'Completed',
        processing_progress: 100,
        user_id: 4
      },
      {
        id: doc2Id,
        filename: 'Academic_Flexibility_CBCS_MOOCs_Policy.pdf',
        original_name: 'Institutional Choice Based Credit System (CBCS) & MOOC Credit Transfer Policy.pdf',
        file_path: 'uploads/First_Review.pdf',
        file_type: 'digital_pdf',
        file_size: 182000,
        sub_criterion: '1.2',
        status: 'Processed',
        validation_status: 'Fully Validated',
        hod_validated: true,
        hod_validated_by: 'Dr. Vikramaditya Singh (HOD CSE)',
        principal_validated: true,
        principal_validated_by: 'Prof. Ananya Roy (Principal)',
        rejection_reason: null,
        upload_date: new Date(Date.now() - 86400000 * 2).toISOString(),
        validated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        file_hash: 'b2c3d4e5f67890123456789abcdef0a1',
        text_quality_score: 96.0,
        ocr_quality_score: 92.0,
        readability_score: 94.0,
        is_scanned_pdf: false,
        version: 1,
        version_status: 'Current',
        academic_year: '2024-25',
        institution_name: 'Sagar Institute of Research & Technology, Bhopal',
        extracted_text: `Institutional Policy on Academic Flexibility and Choice Based Credit System (CBCS).
Students may register for up to 18 credits of Open Electives, Minor Degree Programmes in Data Science, and Honours Degree in Cyber Security.
Credit Transfer: Up to 20% of total degree credits permitted via NPTEL / SWAYAM / Coursera online learning platforms.
Value-added learning flexibility enables multidisciplinary credit transfer across engineering departments.`,
        chunk_count: 2,
        page_count: 8,
        text_pages_count: 8,
        ocr_pages_count: 0,
        processing_stage: 'Completed',
        processing_progress: 100,
        user_id: 4
      },
      {
        id: doc3Id,
        filename: 'Value_Added_Courses_Report_2024.pdf',
        original_name: 'Report on Value-Added Certificate Courses & Human Values Integration 2024.pdf',
        file_path: 'uploads/Dummy_NAAC_SSR_Criterion_1(1).pdf',
        file_type: 'digital_pdf',
        file_size: 310000,
        sub_criterion: '1.3',
        status: 'Processed',
        validation_status: 'Pending Principal Validation',
        hod_validated: true,
        hod_validated_by: 'Dr. Vikramaditya Singh (HOD CSE)',
        principal_validated: false,
        principal_validated_by: null,
        rejection_reason: null,
        upload_date: new Date(Date.now() - 86400000 * 1).toISOString(),
        validated_at: new Date(Date.now() - 43200000).toISOString(),
        file_hash: 'c3d4e5f67890123456789abcdef0a1b2',
        text_quality_score: 94.0,
        ocr_quality_score: 90.0,
        readability_score: 91.0,
        is_scanned_pdf: false,
        version: 1,
        version_status: 'Current',
        academic_year: '2024-25',
        institution_name: 'Sagar Institute of Research & Technology, Bhopal',
        extracted_text: `Curriculum Enrichment Report 2024-2025.
Offered 14 Value-Added Certificate Programmes (30+ contact hours each) covering Full-Stack Web Development, Ethics in AI, and Environmental Sustainability.
Mandatory audit courses on Professional Ethics, Gender Equity, and Environmental Studies completed by 1,240 undergraduate students.
Workshops and hands-on seminars conducted in collaboration with industry partners.`,
        chunk_count: 3,
        page_count: 12,
        text_pages_count: 12,
        ocr_pages_count: 0,
        processing_stage: 'Completed',
        processing_progress: 100,
        user_id: 4
      },
      {
        id: doc4Id,
        filename: 'Stakeholder_Feedback_Analysis_ATR_2024.pdf',
        original_name: 'Stakeholder Feedback Analysis Report & Action Taken Report (ATR) 2024.pdf',
        file_path: 'uploads/First_Review.pdf',
        file_type: 'digital_pdf',
        file_size: 195000,
        sub_criterion: '1.4',
        status: 'Processed',
        validation_status: 'Pending HOD Validation',
        hod_validated: false,
        hod_validated_by: null,
        principal_validated: false,
        principal_validated_by: null,
        rejection_reason: null,
        upload_date: new Date().toISOString(),
        file_hash: 'd4e5f67890123456789abcdef0a1b2c3',
        text_quality_score: 91.0,
        ocr_quality_score: 88.0,
        readability_score: 90.0,
        is_scanned_pdf: false,
        version: 1,
        version_status: 'Current',
        academic_year: '2024-25',
        institution_name: 'Sagar Institute of Research & Technology, Bhopal',
        extracted_text: `NAAC Criterion 1.4 Feedback Analysis and Action Taken Report (ATR) 2024.
Feedback collected online from Students (94% response rate), Faculty (98%), Alumni (76%), and Industry Employers (82%).
Key Feedback Findings: Employers requested inclusion of DevOps and GenAI frameworks in curriculum.
Action Taken Report (ATR): Introduced elective course CSE-402 Agentic AI and Cloud DevOps in 7th semester.`,
        chunk_count: 2,
        page_count: 6,
        text_pages_count: 6,
        ocr_pages_count: 0,
        processing_stage: 'Completed',
        processing_progress: 100,
        user_id: 4
      }
    ];

    // 7. Seed Evidence Items
    this.evidence = [
      {
        id: this.evSeq++,
        document_id: doc1Id,
        metric_id: '1.1.1',
        sub_criterion: '1.1',
        evidence_text: 'Resolution 2: Formulated explicit Course Outcomes (CO) aligned to NBA/NAAC Programme Outcomes (PO1 to PO12) and PSOs.',
        page_number: 2,
        confidence: 88.0,
        relevance_status: 'Relevant',
        evidence_status: 'VERIFICATION_REQUIRED',
        claim_status: 'FOUND',
        supporting_doc_status: 'NOT_VERIFIED',
        source_filename: 'B.Tech CSE Curriculum Revision & BOS Minutes 2024.pdf',
        verification_notes: 'Narrative claim identified in text; signed CO-PO-PSO articulation matrix is pending verification in repository.'
      },
      {
        id: this.evSeq++,
        document_id: doc1Id,
        metric_id: '1.1.2',
        sub_criterion: '1.1',
        evidence_text: 'EVIDENCE NOT FOUND: No comparative old vs new syllabus revision delta matrix or Academic Council approval notification found.',
        page_number: null,
        confidence: null,
        relevance_status: 'Non-Relevant',
        evidence_status: 'EVIDENCE_NOT_FOUND',
        claim_status: 'NOT_FOUND',
        supporting_doc_status: 'MISSING',
        source_filename: 'B.Tech CSE Curriculum Revision & BOS Minutes 2024.pdf',
        verification_notes: 'No comparative old vs new syllabus revision delta matrix found in uploaded text.'
      },
      {
        id: this.evSeq++,
        document_id: doc1Id,
        metric_id: '1.1.3',
        sub_criterion: '1.1',
        evidence_text: 'EVIDENCE NOT FOUND: Direct course outcome attainment calculation spreadsheets and employability mapping matrices not detected.',
        page_number: null,
        confidence: null,
        relevance_status: 'Non-Relevant',
        evidence_status: 'EVIDENCE_NOT_FOUND',
        claim_status: 'NOT_FOUND',
        supporting_doc_status: 'MISSING',
        source_filename: 'B.Tech CSE Curriculum Revision & BOS Minutes 2024.pdf',
        verification_notes: 'No direct employability/skill course mapping matrices found in uploaded text.'
      },
      {
        id: this.evSeq++,
        document_id: doc2Id,
        metric_id: '1.2.1',
        sub_criterion: '1.2',
        evidence_text: 'Students may register for up to 18 credits of Open Electives, Minor Degree Programmes in Data Science, and Honours Degree in Cyber Security.',
        page_number: 1,
        confidence: 94.0,
        relevance_status: 'Relevant',
        evidence_status: 'FOUND',
        claim_status: 'FOUND',
        supporting_doc_status: 'VERIFIED',
        source_filename: 'Institutional Choice Based Credit System (CBCS) & MOOC Credit Transfer Policy.pdf',
        verification_notes: 'CBCS Policy verified'
      },
      {
        id: this.evSeq++,
        document_id: doc2Id,
        metric_id: '1.2.2',
        sub_criterion: '1.2',
        evidence_text: 'Credit Transfer: Up to 20% of total degree credits permitted via NPTEL / SWAYAM / Coursera online learning platforms.',
        page_number: 3,
        confidence: 88.0,
        relevance_status: 'Partial',
        evidence_status: 'FOUND',
        claim_status: 'FOUND',
        supporting_doc_status: 'NOT_VERIFIED',
        source_filename: 'Institutional Choice Based Credit System (CBCS) & MOOC Credit Transfer Policy.pdf',
        verification_notes: 'Missing Dean Academics signature page'
      },
      {
        id: this.evSeq++,
        document_id: doc3Id,
        metric_id: '1.3.1',
        sub_criterion: '1.3',
        evidence_text: 'Mandatory audit courses on Professional Ethics, Gender Equity, and Environmental Studies completed by 1,240 undergraduate students.',
        page_number: 5,
        confidence: 98.0,
        relevance_status: 'Relevant',
        evidence_status: 'FOUND',
        claim_status: 'FOUND',
        supporting_doc_status: 'VERIFIED',
        source_filename: 'Report on Value-Added Certificate Courses & Human Values Integration 2024.pdf',
        verification_notes: 'Complete attendance records uploaded'
      },
      {
        id: this.evSeq++,
        document_id: doc3Id,
        metric_id: '1.3.2',
        sub_criterion: '1.3',
        evidence_text: 'Offered 14 Value-Added Certificate Programmes (30+ contact hours each) covering Full-Stack Web Development and Ethics in AI.',
        page_number: 2,
        confidence: 92.0,
        relevance_status: 'Relevant',
        evidence_status: 'FOUND',
        claim_status: 'FOUND',
        supporting_doc_status: 'VERIFIED',
        source_filename: 'Report on Value-Added Certificate Courses & Human Values Integration 2024.pdf',
        verification_notes: '30+ contact hours syllabus verified'
      },
      {
        id: this.evSeq++,
        document_id: doc4Id,
        metric_id: '1.4.1',
        sub_criterion: '1.4',
        evidence_text: 'Feedback collected online from Students (94% response rate), Faculty (98%), Alumni (76%), and Industry Employers (82%).',
        page_number: 1,
        confidence: 91.0,
        relevance_status: 'Relevant',
        evidence_status: 'FOUND',
        claim_status: 'FOUND',
        supporting_doc_status: 'VERIFIED',
        source_filename: 'Stakeholder Feedback Analysis Report & Action Taken Report (ATR) 2024.pdf',
        verification_notes: 'All 4 stakeholder categories present'
      },
      {
        id: this.evSeq++,
        document_id: doc4Id,
        metric_id: '1.4.2',
        sub_criterion: '1.4',
        evidence_text: 'Action Taken Report (ATR): Introduced elective course CSE-402 Agentic AI and Cloud DevOps in 7th semester based on employer feedback.',
        page_number: 3,
        confidence: 86.0,
        relevance_status: 'Partial',
        evidence_status: 'FOUND',
        claim_status: 'FOUND',
        supporting_doc_status: 'NOT_VERIFIED',
        source_filename: 'Stakeholder Feedback Analysis Report & Action Taken Report (ATR) 2024.pdf',
        verification_notes: 'Pending Academic Council ratification'
      }
    ];

    // 8. Seed Conflicts
    this.conflicts = [
      {
        id: this.conflictSeq++,
        sub_criterion: '1.1',
        metric_id: '1.1.2',
        conflict_title: 'Syllabus Revision Percentage Discrepancy',
        description: 'BOS Minutes state 24% revision whereas Departmental Summary mentions 20%.',
        conflicting_documents: 'BTech_CSE_Curriculum_Revision_2024.pdf vs Annual_Review.pdf',
        discrepancy_details: 'Difference of 4% across Elective and Core modules.',
        status: 'Open',
        severity: 'Medium',
        created_at: now
      },
      {
        id: this.conflictSeq++,
        sub_criterion: '1.4',
        metric_id: '1.4.2',
        conflict_title: 'ATR Date Inconsistency',
        description: 'Action Taken Report date does not align with Academic Council schedule.',
        conflicting_documents: 'Stakeholder_Feedback_Analysis_ATR_2024.pdf',
        discrepancy_details: 'Meeting scheduled for August but ATR cited in July.',
        status: 'Open',
        severity: 'Medium',
        created_at: now
      }
    ];

    // 9. Seed Inbox Messages
    this.inbox = [
      {
        id: this.inboxSeq++,
        sender_name: 'Prof. Meera Deshmukh (Faculty)',
        sender_user_id: 4,
        recipient_role: 'HOD',
        category: 'Approval',
        subject: 'New Evidence Document Uploaded for Sub-1.4',
        body: 'Faculty member Prof. Meera Deshmukh uploaded \'Stakeholder Feedback Analysis Report & Action Taken Report (ATR) 2024.pdf\' (6 pages). Background AI analysis completed.',
        target_type: 'Document',
        target_id: String(doc4Id),
        is_read: false,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: this.inboxSeq++,
        sender_name: 'Dr. Vikramaditya Singh (HOD CSE)',
        sender_user_id: 3,
        recipient_role: 'Principal',
        category: 'Approval',
        subject: 'Stage 1 Validated: Report on Value-Added Certificate Courses',
        body: 'HOD Dr. Vikramaditya Singh validated \'Report on Value-Added Certificate Courses & Human Values Integration 2024.pdf\' for Sub-1.3. Pending final Principal approval.',
        target_type: 'Document',
        target_id: String(doc3Id),
        is_read: false,
        created_at: new Date(Date.now() - 3600000 * 12).toISOString()
      },
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
}

export const db = new DatabaseStore();
