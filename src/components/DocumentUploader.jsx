import React, { useState, useEffect } from 'react';
import { documentAPI, reportAPI } from '../services/api';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, Download, Layers, Cpu } from 'lucide-react';

const DocumentUploader = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [subCriterion, setSubCriterion] = useState('1.1');
  const [uploading, setUploading] = useState(false);
  const [activeDocStatus, setActiveDocStatus] = useState(null);
  const [message, setMessage] = useState(null);
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [error, setError] = useState(null);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [duplicatePrompt, setDuplicatePrompt] = useState(null);

  // Poll processing status if activeDocStatus is in progress
  useEffect(() => {
    let timer;
    const docId = activeDocStatus?.id;
    const isValidId = docId != null && docId !== 'undefined' && docId !== '';
    const isStillProcessing = activeDocStatus &&
      activeDocStatus.status !== 'Processed' &&
      activeDocStatus.processing_stage !== 'Completed' &&
      activeDocStatus.processing_stage !== 'Failed' &&
      activeDocStatus.status !== 'Failed';

    if (isValidId && isStillProcessing) {
      let failCount = 0;
      timer = setInterval(async () => {
        try {
          const res = await documentAPI.getStatus(docId);
          const updated = res.data;
          if (!updated) return;
          setActiveDocStatus(updated);

          if (updated.processing_stage === 'Completed' || updated.status === 'Processed') {
            setMessage(`Successfully processed '${updated.filename || activeDocStatus.filename}' (${updated.page_count || 1} pages). ${updated.text_pages_count || 1} Text pages, ${updated.ocr_pages_count || 0} OCR pages. Indexed into FAISS vector store.`);
            setError(null); // Clear any stale error when processing succeeds
            setUploadedDoc(updated);
            if (onUploadSuccess) onUploadSuccess(updated);
            clearInterval(timer);
          } else if (updated.status === 'Failed' || updated.processing_stage === 'Failed') {
            setError(`Document processing error: ${updated.rejection_reason || 'Pipeline failed'}`);
            setMessage(null); // Clear success message if processing failed
            clearInterval(timer);
          }
        } catch (err) {
          failCount++;
          if (failCount > 3) {
            clearInterval(timer);
          }
        }
      }, 1500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeDocStatus?.id, activeDocStatus?.status, activeDocStatus?.processing_stage]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
      setUploadedDoc(null);
      setError(null);
      setDuplicatePrompt(null);
      setActiveDocStatus(null);
    }
  };

  const handleRetryDownload = () => {
    setError(null);
    handleDownloadUploadedDocReport();
  };

  const handleUpload = async (e, forceDuplicate = false) => {
    if (e) e.preventDefault();
    if (!file) {
      setError('Please select an institutional document file to upload.');
      return;
    }

    setUploading(true);
    setMessage(null);
    setUploadedDoc(null);
    setError(null);
    setDuplicatePrompt(null);
    setActiveDocStatus(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sub_criterion', subCriterion);
    if (forceDuplicate) {
      formData.append('force_duplicate', 'true');
    }

    try {
      const res = await documentAPI.upload(formData);
      const newDoc = res.data?.document || res.data;
      setUploadedDoc(newDoc);
      const isAlreadyProcessed = newDoc.status === 'Processed' || newDoc.processing_stage === 'Completed';

      setActiveDocStatus({
        id: newDoc.id,
        filename: newDoc.original_name || newDoc.filename,
        status: newDoc.status || (isAlreadyProcessed ? 'Processed' : 'Processing'),
        processing_stage: newDoc.processing_stage || (isAlreadyProcessed ? 'Completed' : 'Queued'),
        processing_progress: newDoc.processing_progress || (isAlreadyProcessed ? 100 : 5.0),
        current_page_processing: 0,
        page_count: newDoc.page_count || 1,
        text_pages_count: newDoc.text_pages_count || 0,
        ocr_pages_count: newDoc.ocr_pages_count || 0
      });

      if (isAlreadyProcessed) {
        setMessage(`Successfully processed '${newDoc.original_name || newDoc.filename || file.name}' (${newDoc.page_count || 1} pages). ${newDoc.text_pages_count || 1} Text pages, ${newDoc.ocr_pages_count || 0} OCR pages. Indexed into FAISS vector store.`);
        setError(null);
        if (onUploadSuccess) onUploadSuccess(newDoc);
      }
      setFile(null);
    } catch (err) {
      console.error("Upload error details:", err);
      const detail = err.response?.data?.detail;
      const status = err.response?.status;

      if (status === 409 || (typeof detail === 'object' && detail?.is_duplicate)) {
        setDuplicatePrompt({
          isDuplicate: true,
          existingFilename: detail?.existing_filename || file.name,
          existingDocId: detail?.existing_doc_id,
          message: detail?.message || `Exact duplicate file detected! Content is identical to existing document '${detail?.existing_filename || file.name}'. Do you still want to submit this file again as a new entry?`
        });
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Document upload request timed out. Please try uploading again.');
      } else if (Array.isArray(detail)) {
        const msgs = detail.map(d => d.msg || JSON.stringify(d)).join('. ');
        setError(`Validation Error: ${msgs}`);
      } else if (typeof detail === 'string') {
        setError(detail);
      } else if (detail && typeof detail === 'object' && detail.message) {
        setError(detail.message);
      } else if (err.response?.data && typeof err.response.data === 'string') {
        setError(err.response.data);
      } else {
        setError(err.message || 'Failed to process document. Please verify file content and try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadUploadedDocReport = async () => {
    if (!uploadedDoc || !uploadedDoc.id) return;
    setDownloadingReport(true);
    try {
      const response = await reportAPI.downloadPdf("CampusInsight AI", uploadedDoc.id);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CampusInsight_Report_Doc_${uploadedDoc.id}_${(uploadedDoc.original_name || 'document').replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download PDF report for uploaded document:", err);
      let errMsg = "Unable to generate PDF report for uploaded document.";
      if (err.response && err.response.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.detail) errMsg = json.detail;
        } catch (e) {}
      } else if (err.response?.data?.detail) {
        errMsg = err.response.data.detail;
      }
      setError(errMsg);
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl glass-panel border border-slate-200 bg-white shadow-xs space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-700">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-slate-900">Upload Institutional Evidence Document (0–600 Pages)</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Supported formats: PDF (up to 600 pages), DOCX, Scanned PDFs, Hybrid Text/Image PDFs, PNG/JPG images.
          </p>
        </div>

        {/* Upload Step Flow Badge */}
        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <span className={activeDocStatus?.processing_stage === 'Queued' ? 'text-blue-600 font-extrabold' : 'text-slate-600'}>1. Validation</span>
          <span>→</span>
          <span className={activeDocStatus?.processing_stage?.includes('Text') || activeDocStatus?.processing_stage?.includes('OCR') ? 'text-indigo-600 font-extrabold' : 'text-slate-600'}>2. Selective OCR</span>
          <span>→</span>
          <span className={activeDocStatus?.processing_stage === 'FAISS Indexing' ? 'text-purple-600 font-extrabold' : 'text-slate-600'}>3. FAISS Index</span>
          <span>→</span>
          <span className={activeDocStatus?.processing_stage === 'AI Analysis' ? 'text-amber-600 font-extrabold' : 'text-slate-600'}>4. 6-Agent AI</span>
          <span>→</span>
          <span className={activeDocStatus?.processing_stage === 'Completed' ? 'text-emerald-600 font-extrabold' : 'text-slate-600'}>5. Ready</span>
        </div>
      </div>

      {/* "What can I upload?" Institutional Guidance Box */}
      <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-slate-700 space-y-2">
        <span className="font-extrabold text-blue-950 uppercase tracking-wider block">
          📋 Supported Accreditation Documents (0 to 600+ Pages)
        </span>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 font-medium">
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" /> SSR & AQAR Reports (0–600 pgs)</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Syllabus & Course Outlines</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" /> BOS Meeting Minutes</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Feedback Analysis Reports</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Action Taken Reports (ATRs)</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Scanned & Hybrid Documents</div>
        </div>
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Select Sub-Criterion Scope
            </label>
            <select
              value={subCriterion}
              onChange={(e) => setSubCriterion(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
            >
              <option value="1.1">1.1 Curriculum Design and Development (PO, PSO, CO, Syllabus Revision)</option>
              <option value="1.2">1.2 Academic Flexibility (Open Electives, CBCS, MOOCs, Credit Transfer)</option>
              <option value="1.3">1.3 Curriculum Enrichment (Value-Added Courses, Ethics, Seminars)</option>
              <option value="1.4">1.4 Feedback System (Student, Faculty, Alumni, Employer, ATR)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Document File (PDF / DOCX / Image up to ~600 pages)
            </label>
            <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-2.5 bg-slate-50 hover:bg-blue-50/50 text-center transition-all cursor-pointer">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.bmp,.tiff"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center justify-center space-x-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                <span className="text-xs text-slate-700 font-medium truncate max-w-[200px]">
                  {file ? file.name : 'Choose file or drag here'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading || !file || (activeDocStatus && activeDocStatus.processing_stage !== 'Completed' && activeDocStatus.processing_stage !== 'Failed')}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all cursor-pointer"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Initializing Incremental Pipeline & Detecting Document Pages...</span>
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              <span>Upload Document & Start Incremental Pipeline</span>
            </>
          )}
        </button>
      </form>

      {/* Live Processing Card & Progress Bar */}
      {activeDocStatus && activeDocStatus.processing_stage !== 'Completed' && activeDocStatus.processing_stage !== 'Failed' && (
        <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-xl border border-slate-800 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              <div>
                <h4 className="font-bold text-sm text-slate-100">Processing Document...</h4>
                <p className="text-[11px] text-slate-400 truncate max-w-xs">{activeDocStatus.filename}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 font-mono text-xs text-blue-300">
              <Cpu className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>Page {activeDocStatus.current_page_processing || 1} / {activeDocStatus.page_count || 1}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Stage: <strong className="text-white">{activeDocStatus.processing_stage}</strong>
              </span>
              <span>{Math.round(activeDocStatus.processing_progress || 0)}%</span>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700 p-0.5">
              <div
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${Math.max(4, Math.min(100, activeDocStatus.processing_progress || 0))}%` }}
              ></div>
            </div>
          </div>

          {/* Sub-details: Selective OCR notice & Page type counts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400">PDF Validation:</span> <span className="text-emerald-400 font-bold">✓ Pass</span>
            </div>
            <div>
              <span className="text-slate-400">Text Pages:</span> <span className="text-blue-300 font-bold">{activeDocStatus.text_pages_count}</span>
            </div>
            <div>
              <span className="text-slate-400">OCR Pages:</span> <span className="text-amber-300 font-bold">{activeDocStatus.ocr_pages_count}</span>
            </div>
          </div>

          {activeDocStatus.processing_stage?.includes('OCR') && (
            <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs font-semibold flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Running Selective Tesseract OCR — Page {activeDocStatus.current_page_processing || 1}</span>
            </div>
          )}
        </div>
      )}

      {message && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium space-y-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{message}</span>
          </div>
          {uploadedDoc && (
            <div className="pt-1 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleDownloadUploadedDocReport}
                disabled={downloadingReport}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {downloadingReport ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Download PDF Report for Document #{uploadedDoc.id}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {duplicatePrompt && (
        <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3 shadow-md">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-amber-900">⚠️ Duplicate Document Detected</h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">{duplicatePrompt.message}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 justify-end">
            <button
              type="button"
              onClick={() => setDuplicatePrompt(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              Cancel Upload
            </button>
            <button
              type="button"
              onClick={(e) => handleUpload(e, true)}
              disabled={uploading}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              <span>Yes, Submit Duplicate Document</span>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start justify-between gap-2">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
          {uploadedDoc && error.toLowerCase().includes('pdf report') && (
            <button
              type="button"
              onClick={handleRetryDownload}
              disabled={downloadingReport}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {downloadingReport ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;
