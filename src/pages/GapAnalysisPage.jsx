import React, { useEffect, useState } from 'react';
import { criterionAPI, analyticsAPI } from '../services/api';
import ShapVisualizer from '../components/ShapVisualizer';
import { AlertTriangle, Lightbulb, Filter, Loader2, ShieldCheck, CheckCircle2, FileText, Info } from 'lucide-react';

const GapAnalysisPage = () => {
  const [gaps, setGaps] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedSub, setSelectedSub] = useState('1.1');
  const [shapData, setShapData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [gapsRes, recsRes, shapRes] = await Promise.all([
          criterionAPI.getGaps(selectedSub),
          criterionAPI.getRecommendations(selectedSub),
          analyticsAPI.getShapExplanation(selectedSub)
        ]);
        setGaps(gapsRes.data || []);
        setRecommendations(recsRes.data || []);
        setShapData(shapRes.data);
      } catch (err) {
        console.error(err);
        setGaps([]);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedSub]);

  const handleStatusChange = async (gapId, newStatus) => {
    try {
      await criterionAPI.updateGapStatus(gapId, newStatus);
      setGaps((prev) =>
        prev.map((g) => (g.id === gapId ? { ...g, status: newStatus } : g))
      );
    } catch (err) {
      console.error('Failed to update gap status', err);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            Gap Analysis & SHAP Explainable AI
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Strict evidence-grounded gap detection, claim vs supporting document verification, and feature attributions.
          </p>
        </div>

        {/* Sub-criterion selector */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={selectedSub}
            onChange={(e) => setSelectedSub(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-semibold focus:outline-none shadow-xs cursor-pointer"
          >
            <option value="1.1">1.1 Curriculum Design</option>
            <option value="1.2">1.2 Academic Flexibility</option>
            <option value="1.3">1.3 Curriculum Enrichment</option>
            <option value="1.4">1.4 Feedback System</option>
          </select>
        </div>
      </div>

      {/* SHAP Visualizer */}
      <ShapVisualizer shapData={shapData} />

      {/* Gaps & Recommendations Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Gaps */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Evidence-Grounded Gaps & Verifications
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              Faculty Explainability View
            </span>
          </div>

          {loading ? (
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
          ) : gaps.length === 0 ? (
            <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-semibold">
              ✓ No open gaps for Sub-Criterion {selectedSub}. All required evidence items are verified!
            </p>
          ) : (
            <div className="space-y-4">
              {gaps.map((g) => (
                <div key={g.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2">
                    <div>
                      <span className="font-mono text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 mr-2">
                        Sub-{g.sub_criterion}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{g.title}</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        g.severity === 'High' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {g.severity} Severity
                      </span>
                      <select
                        value={g.status || 'Open'}
                        onChange={(e) => handleStatusChange(g.id, e.target.value)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border focus:outline-none cursor-pointer ${
                          g.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          g.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          'bg-amber-50 text-amber-900 border-amber-300'
                        }`}
                      >
                        <option value="Open">Status: Open</option>
                        <option value="In Progress">Status: In Progress</option>
                        <option value="Resolved">Status: Resolved</option>
                      </select>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                    <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                      Claim Status: {g.claim_status || 'FOUND'}
                    </span>
                    <span className="bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                      Supporting Doc Status: {g.supporting_doc_status || 'NOT_VERIFIED'}
                    </span>
                    {g.source_page_numbers && (
                      <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 font-mono">
                        Page(s): {g.source_page_numbers}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-slate-700 leading-relaxed font-normal">{g.description}</p>

                  {/* Why Flagged (Faculty Explainability) */}
                  {g.why_flagged_reason && (
                    <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200/80">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                        💡 Why Flagged (Evidence Grounding Reasoning):
                      </span>
                      <p className="text-slate-600 leading-relaxed">{g.why_flagged_reason}</p>
                    </div>
                  )}

                  {/* Missing Evidence Required */}
                  {g.missing_evidence && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                      <span className="font-bold block text-[11px]">📄 Required Supporting Document:</span>
                      <span className="font-semibold">{g.missing_evidence}</span>
                    </div>
                  )}

                  {/* Faculty Recommended Action */}
                  {g.recommended_action && (
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                      <span className="font-bold block text-[11px]">🎯 Action Step for Faculty:</span>
                      <span className="font-medium">{g.recommended_action}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Agentic AI Recommendations */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-200 bg-white shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            Evidence-Backed Recommendations
          </h3>
          {loading ? (
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
          ) : recommendations.length === 0 ? (
            <p className="text-xs text-slate-500">No active recommendations for Sub-Criterion {selectedSub}.</p>
          ) : (
            <div className="space-y-3">
              {recommendations.map((r) => (
                <div key={r.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">[{r.sub_criterion}] {r.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      {r.priority} Priority
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-600">
                    <span className="bg-slate-200/60 px-2 py-0.5 rounded">
                      Role: {r.responsible_role || 'Faculty / HOD'}
                    </span>
                    {r.source_page_numbers && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-mono">
                        Source Page: {r.source_page_numbers}
                      </span>
                    )}
                  </div>

                  <p className="text-slate-700 leading-relaxed font-normal whitespace-pre-line">{r.recommendation_text}</p>
                  
                  {r.required_document && (
                    <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900">
                      <span className="font-bold block text-[10px] uppercase">Required Document:</span>
                      <span>{r.required_document}</span>
                    </div>
                  )}

                  {r.action_items && (
                    <div className="pt-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Action Items:</span>
                      <ul className="list-disc list-inside text-slate-700 space-y-1">
                        {r.action_items.map((act, idx) => (
                          <li key={idx}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GapAnalysisPage;
