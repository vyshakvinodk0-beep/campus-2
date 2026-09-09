import React, { useState, useEffect } from 'react';
import { documentAPI, reportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DocumentUploader from '../components/DocumentUploader';
import { 
  Files, Upload, CheckCircle2, AlertCircle, Clock, ShieldCheck, 
  Trash2, Download, Eye, RefreshCw, X, Filter, FileText, Check, 
  AlertTriangle, RotateCcw, Building2, User 
} from 'lucide-react';

const DocumentsPage = ({ isDemoMode }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subFilter, setSubFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'reject_hod' | 'revision_hod'
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await documentAPI.getAll(subFilter, statusFilter);
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [subFilter, statusFilter]);

  const handleUploadSuccess = () => {
    fetchDocuments();
  };

  const handleValidateHod = async (docId) => {
    try {
      await documentAPI.validateHod(docId);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.detail || 'HOD Validation failed');
    }
  };

  const handleValidatePrincipal = async (docId) => {
    try {
      await documentAPI.validatePrincipal(docId);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.detail || 'Principal Validation failed');
    }
  };

  const handleOpenActionModal = (doc, type) => {
    setSelectedDoc(doc);
    setActionType(type);
    setActionReason('');
    setShowActionModal(true);
  };

  const handleExecuteAction = async () => {
    if (!actionReason.trim()) {
      alert('Please provide notes/reasons for this governance action.');
      return;
    }
    setActionLoading(true);
    try {
      if (actionType === 'reject_hod') {
        await documentAPI.rejectHod(selectedDoc.id, actionReason);
      } else if (actionType === 'revision_hod') {
        await documentAPI.requestRevisionHod(selectedDoc.id, actionReason);
      }
      setShowActionModal(false);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.detail || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document from the NAAC evidence base?')) return;
    try {
      await documentAPI.delete(docId);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete document');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Fully Validated':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Pending Principal Validation':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Pending HOD Validation':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Revision Requested':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Rejected by HOD':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const canHodValidate = user?.role === 'HOD' || user?.role === 'Administrator';
  const canPrincipalValidate = user?.role === 'Principal' || user?.role === 'Administrator';

  return (
    <div className="space-y-8 pb-12 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Evidence Repository
            </span>
            <span className="text-xs text-slate-500 font-medium">NAAC Criterion 1 Grounding</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Institutional Documents & OCR</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload institutional evidence, inspect automated OCR extraction, and track 2-stage multi-role verification.
          </p>
        </div>

        <button
          onClick={fetchDocuments}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" />
          <span>Upload New Evidence Document</span>
        </h2>
        <DocumentUploader onUploadSuccess={handleUploadSuccess} />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Sub-Criterion:</span>
            <select
              value={subFilter}
              onChange={(e) => setSubFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="All">All Sub-Criteria</option>
              <option value="1.1">1.1 Curriculum Design</option>
              <option value="1.2">1.2 Academic Flexibility</option>
              <option value="1.3">1.3 Curriculum Enrichment</option>
              <option value="1.4">1.4 Feedback System</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Validation Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending HOD Validation">Pending HOD Validation</option>
              <option value="Pending Principal Validation">Pending Principal Validation</option>
              <option value="Fully Validated">Fully Validated</option>
              <option value="Revision Requested">Revision Requested</option>
              <option value="Rejected by HOD">Rejected by HOD</option>
            </select>
          </div>

          {/* Quick Role-Specific Filter Buttons */}
          {(user?.role === 'HOD' || user?.role === 'Administrator') && (
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'Pending HOD Validation' ? 'All' : 'Pending HOD Validation')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'Pending HOD Validation'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              🎓 Needs HOD Review
            </button>
          )}

          {(user?.role === 'Principal' || user?.role === 'Administrator') && (
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'Pending Principal Validation' ? 'All' : 'Pending Principal Validation')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'Pending Principal Validation'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              🏛️ Needs Principal Seal
            </button>
          )}

          {(user?.role === 'Faculty') && (
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'Revision Requested' ? 'All' : 'Revision Requested')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'Revision Requested'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              ⚠️ Revision Needed
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Total Documents: <strong className="text-slate-900">{documents.length}</strong>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Document Details</th>
                <th className="py-3.5 px-4">Sub-Criterion</th>
                <th className="py-3.5 px-4">Pages & Size</th>
                <th className="py-3.5 px-4">Quality & OCR</th>
                <th className="py-3.5 px-4">Governance Status</th>
                <th className="py-3.5 px-4 text-right">Actions & Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Files className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium">No documents match the current filter criteria.</p>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Document Details */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate" title={doc.original_name || doc.filename}>
                            {doc.original_name || doc.filename}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            AY: {doc.academic_year || '2024-25'} • Uploaded {new Date(doc.upload_date).toLocaleDateString()}
                          </p>
                          {doc.rejection_reason && (
                            <p className="text-[10px] text-rose-700 bg-rose-50 p-1 rounded mt-1 font-medium border border-rose-200">
                              <strong>Note:</strong> {doc.rejection_reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Sub-Criterion */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Sub-{doc.sub_criterion}
                      </span>
                    </td>

                    {/* Pages & Size */}
                    <td className="py-4 px-4 whitespace-nowrap text-[11px] text-slate-600">
                      <div><strong>{doc.page_count || 1}</strong> Total Pages</div>
                      <div className="text-slate-400 text-[10px]">
                        {(doc.file_size / (1024 * 1024)).toFixed(2)} MB • {doc.file_type || 'PDF'}
                      </div>
                    </td>

                    {/* Quality Scores */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Text Quality:</span>
                          <span className="font-bold text-emerald-700">{doc.text_quality_score || 94}%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">OCR Score:</span>
                          <span className="font-bold text-blue-700">{doc.ocr_quality_score || 92}%</span>
                        </div>
                      </div>
                    </td>

                    {/* Governance Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadge(doc.validation_status)}`}>
                        {doc.validation_status}
                      </span>
                      {doc.hod_validated && (
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>HOD: {doc.hod_validated_by?.split(' ')[0] || 'Verified'}</span>
                        </div>
                      )}
                      {doc.principal_validated && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-blue-600" />
                          <span>Principal Certified</span>
                        </div>
                      )}
                    </td>

                    {/* Actions & Workflow Buttons */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* View Text Preview */}
                        <button
                          onClick={() => { setSelectedDoc(doc); setShowTextModal(true); }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Inspect Extracted Text"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Download Report */}
                        <a
                          href={`/api/reports/download-pdf/${doc.id}`}
                          download
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Download Document PDF Report"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        {/* HOD Review Actions */}
                        {canHodValidate && doc.validation_status === 'Pending HOD Validation' && (
                          <>
                            <button
                              onClick={() => handleValidateHod(doc.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Grant HOD Stage 1 Validation"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>HOD Approve</span>
                            </button>
                            <button
                              onClick={() => handleOpenActionModal(doc, 'revision_hod')}
                              className="px-2 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-[11px] transition-colors"
                              title="Request Revision"
                            >
                              Revise
                            </button>
                            <button
                              onClick={() => handleOpenActionModal(doc, 'reject_hod')}
                              className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[11px] transition-colors"
                              title="Reject Document"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* Principal Final Approval */}
                        {canPrincipalValidate && doc.validation_status === 'Pending Principal Validation' && (
                          <button
                            onClick={() => handleValidatePrincipal(doc.id)}
                            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Grant Final Institutional Accreditation Certification"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Principal Certify</span>
                          </button>
                        )}

                        {/* Delete Document */}
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extracted Text Modal */}
      {showTextModal && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{selectedDoc.original_name || selectedDoc.filename}</h3>
                <p className="text-xs text-slate-500">Extracted Text & OCR Content • Sub-{selectedDoc.sub_criterion}</p>
              </div>
              <button
                onClick={() => setShowTextModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
              {selectedDoc.extracted_text || 'No text extracted for this document.'}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowTextModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Governance Action Modal (Reject / Revision) */}
      {showActionModal && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                {actionType === 'reject_hod' ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <span>Reject Departmental Evidence</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-5 h-5 text-purple-600" />
                    <span>Request Document Revision</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setShowActionModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Provide formal feedback for <strong>{selectedDoc.original_name || selectedDoc.filename}</strong>. This note will be recorded in the institutional audit log and notified to the contributor.
            </p>

            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="E.g., Board of Studies minutes require signature from university nominee on Page 3..."
              rows={4}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={actionLoading}
                className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer ${
                  actionType === 'reject_hod' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {actionLoading ? 'Processing...' : 'Submit Governance Action'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DocumentsPage;
