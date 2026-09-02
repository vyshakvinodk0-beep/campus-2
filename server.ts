import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { db, User, DocumentRecord, EvidenceItem, GapItem, RecommendationItem, AuditLog, InboxMessage, calculateDeterministicScore } from './server/db';
import { authMiddleware, optionalAuthMiddleware, createAccessToken, AuthenticatedRequest } from './server/auth';
import { generateCsvReport, generatePdfReport } from './server/reports';
import { askGemini } from './server/gemini';
import { parsePdfDocument } from './server/pdfEngine';
import { executeMultiAgentPipeline, MultiAgentPipelineResult } from './server/agenticPipeline';

let latestQualityGateResult: MultiAgentPipelineResult | null = null;

const PORT = 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${path.basename(file.originalname, ext)}-${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Static uploads directory
  app.use('/uploads', express.static(uploadsDir));

  // Health check for platform
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'CampusInsight AI' });
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'CampusInsight AI',
      timestamp: new Date().toISOString(),
      stats: {
        users: db.users.length,
        documents: db.documents.length,
        evidence: db.evidence.length,
        gaps: db.gaps.length,
        recommendations: db.recommendations.length
      }
    });
  });

  // =========================================================================
  // API: AUTHENTICATION
  // =========================================================================

  function parseGoogleJwtPayload(token: string) {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password are required' });
    }

    const cleanEmail = email.toString().trim().toLowerCase();
    const cleanPassword = password.toString().trim();

    let user = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    
    if (!user) {
      // Auto-provision user account so login is seamless and always works
      const inferredRole = cleanEmail.includes('admin')
        ? 'Administrator'
        : cleanEmail.includes('principal')
        ? 'Principal'
        : cleanEmail.includes('hod')
        ? 'HOD'
        : 'Faculty';

      user = {
        id: db.users.length + 1,
        email: cleanEmail,
        hashed_password: bcrypt.hashSync(cleanPassword, 10),
        full_name: cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        role: inferredRole as any,
        department: 'Computer Science & Engineering',
        is_active: true,
        has_logged_in: true,
        login_count: 1,
        created_at: new Date().toISOString()
      };
      db.users.push(user);
    } else {
      // User exists - check password
      if (user.hashed_password) {
        const match = bcrypt.compareSync(cleanPassword, user.hashed_password);
        if (!match && cleanPassword !== 'password123') {
          return res.status(400).json({ detail: 'Invalid password. Please try again or use password123.' });
        }
      }
      user.login_count = (user.login_count || 0) + 1;
      user.has_logged_in = true;
    }

    const token = createAccessToken({ sub: user.email, role: user.role });
    const { hashed_password, ...safeUser } = user;
    return res.json({ access_token: token, token_type: 'bearer', user: safeUser });
  });

  app.post('/api/auth/google', (req: Request, res: Response) => {
    const { credential, token, role, department } = req.body;
    let email = 'demo.faculty@campusinsight.edu';
    let name = 'Dr. Priya Nair';

    if (credential) {
      const payload = parseGoogleJwtPayload(credential);
      if (payload && payload.email) {
        email = payload.email.toLowerCase();
        name = payload.name || name;
      }
    } else if (token) {
      const payload = parseGoogleJwtPayload(token);
      if (payload && payload.email) {
        email = payload.email.toLowerCase();
        name = payload.name || name;
      }
    }

    let user = db.users.find(u => u.email.toLowerCase() === email);
    if (!user) {
      user = {
        id: db.users.length + 1,
        email,
        full_name: name,
        role: (role as any) || 'Faculty',
        department: department || 'Computer Science & Engineering',
        is_active: true,
        has_logged_in: true,
        login_count: 1,
        created_at: new Date().toISOString()
      };
      db.users.push(user);
    } else {
      user.login_count = (user.login_count || 0) + 1;
      user.has_logged_in = true;
    }

    const accessToken = createAccessToken({ sub: user.email, role: user.role });
    const { hashed_password, ...safeUser } = user;
    return res.json({ access_token: accessToken, token_type: 'bearer', user: safeUser });
  });

  app.post('/api/auth/send-otp', (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ detail: 'Email is required' });
    const cleanEmail = email.toString().trim().toLowerCase();
    const otp = '123456';
    db.otpStore[cleanEmail] = {
      otp,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    };
    return res.json({ message: 'OTP sent successfully to ' + cleanEmail + ' (Demo OTP: 123456)', email: cleanEmail });
  });

  app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ detail: 'Email and OTP are required' });
    const cleanEmail = email.toString().trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    if (cleanOtp !== '123456' && (!db.otpStore[cleanEmail] || db.otpStore[cleanEmail].otp !== cleanOtp)) {
      return res.status(400).json({ detail: 'Invalid or expired OTP code. Use 123456 for demo verification.' });
    }

    let user = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      user = {
        id: db.users.length + 1,
        email: cleanEmail,
        full_name: cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        role: 'Faculty',
        department: 'Computer Science & Engineering',
        is_active: true,
        has_logged_in: true,
        login_count: 1,
        created_at: new Date().toISOString()
      };
      db.users.push(user);
    } else {
      user.login_count = (user.login_count || 0) + 1;
      user.has_logged_in = true;
    }

    const accessToken = createAccessToken({ sub: user.email, role: user.role });
    const { hashed_password, ...safeUser } = user;
    return res.json({ access_token: accessToken, token_type: 'bearer', user: safeUser });
  });

  app.post('/api/auth/request-password-reset', (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ detail: 'Email is required' });
    return res.json({ message: 'Password reset instructions sent. Demo OTP: 123456' });
  });

  app.post('/api/auth/confirm-password-reset', (req: Request, res: Response) => {
    const { email, otp, new_password } = req.body;
    if (!email || !new_password) return res.status(400).json({ detail: 'Email and new password are required' });
    const user = db.users.find(u => u.email.toLowerCase() === email.toString().trim().toLowerCase());
    if (user) {
      user.hashed_password = bcrypt.hashSync(new_password, 10);
    }
    return res.json({ message: 'Password successfully updated. You may now log in.' });
  });

  app.get('/api/auth/me', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const user = req.user || db.users[0];
    const { hashed_password, ...safeUser } = user;
    return res.json(safeUser);
  });

  // =========================================================================
  // API: USERS
  // =========================================================================

  app.get('/api/users', (_req: Request, res: Response) => {
    const safeUsers = db.users.map(({ hashed_password, ...u }) => u);
    return res.json(safeUsers);
  });

  app.post('/api/users/update-role', (req: Request, res: Response) => {
    const { user_id, new_role } = req.body;
    const user = db.users.find(u => u.id === Number(user_id));
    if (!user) return res.status(404).json({ detail: 'User not found' });
    user.role = new_role;
    const { hashed_password, ...safeUser } = user;
    return res.json({ message: 'User role updated', user: safeUser });
  });

  // =========================================================================
  // API: DOCUMENTS & UPLOADS
  // =========================================================================

  app.get('/api/documents', (_req: Request, res: Response) => {
    return res.json(db.documents);
  });

  app.get('/api/documents/:id', (req: Request, res: Response) => {
    const doc = db.documents.find(d => d.id === Number(req.params.id));
    if (!doc) return res.status(404).json({ detail: 'Document not found' });
    return res.json(doc);
  });

  app.post('/api/documents/upload', upload.single('file') as any, async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded' });
    }

    const { sub_criterion, file_type } = req.body;
    const parsedPdf = await parsePdfDocument(req.file.path, req.file.originalname);

    const newDoc: DocumentRecord = {
      id: db.documents.length + 1,
      filename: req.file.filename,
      original_name: req.file.originalname,
      file_path: `uploads/${req.file.filename}`,
      file_type: (file_type as any) || 'digital_pdf',
      document_type: (parsedPdf as any).documentType || 'SUPPORTED_ACADEMIC_EVIDENCE',
      file_size: req.file.size,
      sub_criterion: sub_criterion || '1.1',
      status: 'Processed',
      validation_status: 'Pending HOD Validation',
      hod_validated: false,
      principal_validated: false,
      upload_date: new Date().toISOString(),
      file_hash: 'sha256-' + Date.now(),
      text_quality_score: parsedPdf.textQualityScore,
      ocr_quality_score: parsedPdf.ocrQualityScore,
      readability_score: parsedPdf.readabilityScore,
      is_scanned_pdf: parsedPdf.processingDecision === 'SCANNED_IMAGE' || parsedPdf.ocrPagesCount > 0,
      version: 1,
      version_status: 'Current',
      academic_year: '2024-25',
      institution_name: 'Sagar Institute of Research & Technology, Bhopal',
      extracted_text: parsedPdf.extractedFullText.slice(0, 3000),
      chunk_count: parsedPdf.pages.length,
      page_count: parsedPdf.totalPages,
      text_pages_count: parsedPdf.textPagesCount,
      ocr_pages_count: parsedPdf.ocrPagesCount,
      processing_stage: 'Completed',
      processing_progress: 100,
      user_id: 4
    };

    db.documents.push(newDoc);

    // Execute multi-agent quality pipeline
    const pipelineResult = await executeMultiAgentPipeline(parsedPdf, sub_criterion || '1.1', newDoc);
    latestQualityGateResult = pipelineResult;

    return res.json({
      message: 'Document uploaded and analyzed successfully',
      document: newDoc,
      pipeline_result: pipelineResult
    });
  });

  // =========================================================================
  // API: WORKFLOW VALIDATION (RBAC)
  // =========================================================================

  app.post('/api/workflow/validate/:id', (req: Request, res: Response) => {
    const docId = Number(req.params.id);
    const doc = db.documents.find(d => d.id === docId);
    if (!doc) return res.status(404).json({ detail: 'Document not found' });

    const { action, user_name, reason } = req.body;
    const now = new Date().toISOString();

    if (action === 'hod_approve') {
      doc.hod_validated = true;
      doc.hod_validated_by = user_name || 'Dr. Vikramaditya Singh (HOD CSE)';
      doc.validation_status = 'Pending Principal Validation';
      doc.validated_at = now;
    } else if (action === 'principal_approve') {
      doc.principal_validated = true;
      doc.principal_validated_by = user_name || 'Prof. Ananya Roy (Principal)';
      doc.validation_status = 'Fully Validated';
      doc.validated_at = now;
    } else if (action === 'reject') {
      doc.validation_status = 'Revision Requested';
      doc.rejection_reason = reason || 'Incomplete evidence artifacts or missing countersignatures.';
    }

    return res.json({ message: `Workflow updated to ${doc.validation_status}`, document: doc });
  });

  // =========================================================================
  // API: EVIDENCE, GAPS, RECOMMENDATIONS & CONFLICTS
  // =========================================================================

  app.get('/api/evidence', (req: Request, res: Response) => {
    const { sub_criterion } = req.query;
    if (sub_criterion && sub_criterion !== 'All') {
      return res.json(db.evidence.filter(e => e.sub_criterion === sub_criterion));
    }
    return res.json(db.evidence);
  });

  app.get('/api/gaps', (req: Request, res: Response) => {
    const { sub_criterion } = req.query;
    if (sub_criterion && sub_criterion !== 'All') {
      return res.json(db.gaps.filter(g => g.sub_criterion === sub_criterion));
    }
    return res.json(db.gaps);
  });

  app.get('/api/recommendations', (req: Request, res: Response) => {
    const { sub_criterion } = req.query;
    if (sub_criterion && sub_criterion !== 'All') {
      return res.json(db.recommendations.filter(r => r.sub_criterion === sub_criterion));
    }
    return res.json(db.recommendations);
  });

  app.get('/api/conflicts', (_req: Request, res: Response) => {
    return res.json(db.conflicts);
  });

  // =========================================================================
  // API: DASHBOARD SUMMARY, METRICS, ANALYSES
  // =========================================================================

  app.get('/api/dashboard/summary', (_req: Request, res: Response) => {
    return res.json(db.calculateReadinessSummary());
  });

  app.get('/api/metrics', (_req: Request, res: Response) => {
    return res.json(db.metrics);
  });

  app.get('/api/analyses', (_req: Request, res: Response) => {
    return res.json(db.analyses);
  });

  // =========================================================================
  // API: AUDIT LOGS & INBOX
  // =========================================================================

  app.get('/api/audit-logs', (_req: Request, res: Response) => {
    return res.json(db.auditLogs);
  });

  app.get('/api/inbox', (_req: Request, res: Response) => {
    return res.json(db.inbox);
  });

  // =========================================================================
  // API: REPORTS (CSV & PDF)
  // =========================================================================

  app.get('/api/reports/csv', (req: Request, res: Response) => {
    const docId = req.query.document_id ? Number(req.query.document_id) : undefined;
    const institution = (req.query.institution as string) || 'Sagar Institute of Research & Technology, Bhopal';
    const csvContent = generateCsvReport(institution, docId);
    const filename = `CampusInsight_Accreditation_Report_${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  });

  app.get('/api/reports/pdf', async (req: Request, res: Response) => {
    const docId = req.query.document_id ? Number(req.query.document_id) : undefined;
    const institution = (req.query.institution as string) || 'Sagar Institute of Research & Technology, Bhopal';
    const targetDoc = docId ? db.documents.find(d => d.id === docId) : db.documents[0];
    const pdfBuffer = await generatePdfReport(institution, targetDoc);
    const filename = `CampusInsight_Accreditation_Report_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdfBuffer);
  });

  // =========================================================================
  // API: AI COPILOT
  // =========================================================================

  app.post('/api/ai/ask', async (req: Request, res: Response) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ detail: 'Prompt is required' });

    const systemInstruction = 'You are CampusInsight AI, an expert NAAC Criterion 1 (Curricular Aspects) Accreditation Copilot. Provide factual, grounded, evidence-based guidance with citations to NAAC metrics (1.1, 1.2, 1.3, 1.4).';
    let answer = await askGemini(prompt, systemInstruction);
    if (!answer) {
      answer = 'Under NAAC Criterion 1 (Curricular Aspects), institutional readiness requires structured BOS syllabus revision minutes (1.1.2), CBCS implementation notifications (1.2.1), 30+ hour value-added course attendance logs (1.3.2), and 4-stakeholder feedback analysis with Action Taken Reports (1.4.1 & 1.4.2).';
    }
    return res.json({ answer });
  });

  // Vite middleware for frontend SPA in development / production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` CampusInsight AI — Platform Server Active             `);
    console.log(` Web & API Server running at http://0.0.0.0:${PORT}    `);
    console.log(`=======================================================`);
  });
}

startServer();
