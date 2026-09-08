import React, { useEffect, useState } from 'react';
import { metricsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Table, FileText, CheckCircle2, AlertTriangle, XCircle, Search,
  Eye, Filter, Layers, RefreshCw, ShieldAlert, ArrowRight, BookOpen, UserCheck
} from 'lucide-react';

const EvidenceMatrixPage = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [selectedSub, setSelectedSub] = useState('All');
  const [loading, setLoading] = useState(true);

  // Selected Metric Detail Modal State
  const [activeMetric, setActiveMetric] = useState(null);
  const [metricDetail, setMetricDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Override State
  const [overrideStatus, setOverrideStatus] = useState('Complete');
  const [overrideReason, setOverrideReason] = useState('');
  const [submittingOverride, setSubmittingOverride] = useState(false);

  // Missing Evidence Scanner Modal State
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);
  const [missingChecklist, setMissingChecklist] = useState([]);
  const [loadingMissing, setLoadingMissing] = useState(false);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const res = await metricsAPI.getEvidenceMatrix(selectedSub);
      setMetrics(res.data || []);
    } catch (err) {
      console.error('Failed to load Evidence Matrix:', err);
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, [selectedSub]);

  const handleOpenMetricDetail = async (metricItem) => {
    setActiveMetric(metricItem);
    setOverrideStatus(metricItem.status);
    setOverrideReason(metricItem.override_reason || '');
    setLoadingDetail(true);
    try {
      const res = await metricsAPI.getMetricDetail(metricItem.metric_id);
      setMetricDetail(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      alert("Please provide an override reason for audit logging.");
      return;
    }

    setSubmittingOverride(true);
    try {
      await metricsAPI.overrideMetricStatus(activeMetric.metric_id, overrideStatus, overrideReason);
      alert(`Metric ${activeMetric.metric_id} status updated to '${overrideStatus}' and logged in Audit Trail.`);
      handleOpenMetricDetail(activeMetric);
      fetchMatrix();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to submit override");
    } finally {
      setSubmittingOverride(false);
    }
  };

  const handleRunMissingScanner = async () => {
    setIsMissingModalOpen(true);
    setLoadingMissing(true);
    try {
      const res = await metricsAPI.findMissingEvidence();
      setMissingChecklist(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMissing(false);
    }
  };

  const [statusFilter, setStatusFilter] = useState('All');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Complete':
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            ✓ Verified
          </span>
        );
      case 'Partial':
      case 'Needs Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            ⚠ Needs Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            ✕ Missing
          </span>
        );
    }
  };

  const filteredMetrics = metrics.filter((row) => {
    if (statusFilter === 'Verified') return row.status === 'Complete';
    if (statusFilter === 'Needs Review') return row.status === 'Partial';
    if (statusFilter === 'Missing') return row.status === 'Missing' || row.status === 'Incomplete';
    if (statusFilter === 'High Priority') return row.completeness_score < 70;
    return true;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white text-blue-950 text-xs font-black shadow-md border-2 border-blue-300 mb-2">
            <Layers className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-blue-950 font-black tracking-wide">NAAC Criterion 1 Evidence Matrix</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Criterion 1 Metric Evidence Matrix & Page Citations
          </h1>
          <p className="text-xs text-blue-200/90 mt-1 max-w-2xl font-medium">
            Granular evidence tracking for metrics 1.1.1 through 1.4.2. Verify required vs available document checklists, inspect page-level citations, and execute human overrides.
          </p>
        </div>

        <button
          onClick={handleRunMissingScanner}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all shrink-0"
        >
          <Search className="w-4 h-4" /> Find Missing Evidence
        </button>
      </div>

      {/* Sub-Criteria Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { code: '1.1', title: '1.1 Curriculum Design', count: '1.1.1, 1.1.2', score: 85 },
          { code: '1.2', title: '1.2 Academic Flexibility', count: '1.2.1, 1.2.2', score: 78 },
          { code: '1.3', title: '1.3 Curriculum Enrichment', count: '1.3.1, 1.3.2', score: 92 },
          { code: '1.4', title: '1.4 Feedback System', count: '1.4.1, 1.4.2', score: 74 },
        ].map((sub) => (
          <div
            key={sub.code}
            onClick={() => setSelectedSub(selectedSub === sub.code ? 'All' : sub.code)}
            className={`p-4 rounded-2xl glass-panel border transition-all cursor-pointer ${
              selectedSub === sub.code
                ? 'bg-blue-50/90 border-blue-400 shadow-md ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">{sub.code}</span>
              <span className="text-xs font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                {sub.score}% Complete
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mt-1">{sub.title}</h4>
            <p className="text-[11px] text-slate-500 mt-1">Metrics: {sub.count}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Sub-Criterion:</span>
          {['All', '1.1', '1.2', '1.3', '1.4'].map((code) => (
            <button
              key={code}
              onClick={() => setSelectedSub(code)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedSub === code
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {code === 'All' ? 'All (1.1-1.4)' : `Sub-${code}`}
            </button>
          ))}
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          {['All', 'Verified', 'Needs Review', 'Missing', 'High Priority'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === st ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Evidence Matrix Table */}
      <div className="glass-panel bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            Loading NAAC Criterion 1 Evidence Matrix...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Metric ID</th>
                  <th className="px-6 py-4">Metric Name & Requirement</th>
                  <th className="px-6 py-4">Required Evidence</th>
                  <th className="px-6 py-4">Completeness %</th>
                  <th className="px-6 py-4">Evidence Status</th>
                  <th className="px-6 py-4">Confidence</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMetrics.map((row) => (
                  <tr key={row.metric_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {row.metric_id}
                    </td>
                    <td className="px-6 py-4 max-w-sm">
                      <div className="font-bold text-slate-900">{row.name}</div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{row.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {(row.required_evidence || []).slice(0, 2).map((item, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /> {item}
                          </span>
                        ))}
                        {(row.required_evidence?.length || 0) > 2 && (
                          <span className="text-[10px] text-slate-500 font-semibold">+ {row.required_evidence.length - 2} more items</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-700">{row.completeness_score}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              row.completeness_score >= 85 ? 'bg-emerald-500' : row.completeness_score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${row.completeness_score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-semibold text-slate-600">
                      {row.ai_confidence}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleOpenMetricDetail(row)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 rounded-xl text-xs font-bold transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Citations
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Metric Detail & Page Citations Modal */}
      {activeMetric && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                  Metric {activeMetric.metric_id} ({activeMetric.sub_criterion})
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">{activeMetric.name}</h2>
                <p className="text-xs text-slate-500 mt-1">{activeMetric.description}</p>
              </div>
              <button
                onClick={() => setActiveMetric(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {loadingDetail ? (
              <div className="p-8 text-center text-slate-500 text-sm">Loading page citations...</div>
            ) : (
              <div className="space-y-6">
                {/* Required vs Available Evidence Checklists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-600" /> Required NAAC Evidence
                    </h4>
                    <ul className="space-y-1.5 text-xs">
                      {activeMetric.required_evidence.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> Missing / Incomplete Items
                    </h4>
                    {activeMetric.missing_evidence?.length > 0 ? (
                      <ul className="space-y-1.5 text-xs">
                        {activeMetric.missing_evidence.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-rose-700 font-medium">
                            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-emerald-700 font-semibold bg-emerald-50 p-2 rounded border border-emerald-200">
                        ✓ All required evidence items are verified in uploaded documentation.
                      </p>
                    )}
                  </div>
                </div>

                {/* Page-Level Evidence Citations */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" /> Traceable Page-Level Evidence Citations
                  </h3>

                  {metricDetail?.evidence_citations?.length > 0 ? (
                    <div className="space-y-3">
                      {metricDetail.evidence_citations.map((cite) => (
                        <div key={cite.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-slate-500" /> {cite.document_name}
                            </span>
                            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              Page {cite.page_number}
                            </span>
                          </div>

                          <blockquote className="text-xs italic text-slate-700 bg-slate-50 p-2.5 rounded-xl border-l-2 border-blue-500">
                            "{cite.evidence_text}"
                          </blockquote>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                            <span>Confidence: <strong className="text-slate-800">{cite.confidence}%</strong></span>
                            <span className="text-emerald-700 font-semibold">{cite.verification_notes}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl">
                      No explicit page citations linked yet for Metric {activeMetric.metric_id}.
                    </div>
                  )}
                </div>

                {/* Human-in-the-Loop Override Controls */}
                {['HOD', 'Principal', 'Administrator'].includes(user?.role) ? (
                  <form onSubmit={handleOverrideSubmit} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-purple-600" /> Human Validation & AI Status Override
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Override AI evaluation for Metric {activeMetric.metric_id}. A mandatory override reason will be recorded in the institutional audit trail as <strong>{user?.role}</strong> ({user?.full_name}).
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Set New Status</label>
                        <select
                          value={overrideStatus}
                          onChange={(e) => setOverrideStatus(e.target.value)}
                          className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-300 bg-white"
                        >
                          <option value="Complete">Complete (100%)</option>
                          <option value="Partial">Partial</option>
                          <option value="Missing">Missing (0%)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Override Reason (Audit Log)</label>
                        <input
                          type="text"
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          placeholder="e.g. Physical register contains supporting evidence."
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingOverride}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      {submittingOverride ? 'Saving Override...' : 'Submit Human Override'}
                    </button>
                  </form>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span>Human Validation & Audit Protocol</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      As a <strong>Faculty Member</strong>, you can inspect verified citations, completeness scores, and document sources. Statutory overrides and formal sign-offs are reserved for Department HOD, Institutional Principal, or Administrator.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Missing Evidence Scanner Modal */}
      {isMissingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" /> Missing NAAC Evidence Scanner Results
              </h3>
              <button onClick={() => setIsMissingModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            {loadingMissing ? (
              <div className="p-8 text-center text-slate-500 text-xs">Scanning Criterion 1 metrics for missing evidence...</div>
            ) : (
              <div className="space-y-3">
                {missingChecklist.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        Metric {item.metric_id} ({item.priority} Priority)
                      </span>
                      <span className="text-slate-600 font-medium">Assigned: {item.assigned_to}</span>
                    </div>
                    <p className="font-bold text-slate-900">{item.metric_name}</p>
                    <p className="text-slate-600">{item.recommended_action}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceMatrixPage;
