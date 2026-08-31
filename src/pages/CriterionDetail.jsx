import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { criterionAPI, analyticsAPI } from '../services/api';
import ShapVisualizer from '../components/ShapVisualizer';
import { Layers, FileCheck2, AlertCircle, Lightbulb, Loader2, Sparkles } from 'lucide-react';

const CriterionDetail = () => {
  const { code } = useParams();
  const [detail, setDetail] = useState(null);
  const [shapData, setShapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const subCriteriaTitles = {
    "1.1": "Curriculum Design and Development",
    "1.2": "Academic Flexibility",
    "1.3": "Curriculum Enrichment",
    "1.4": "Feedback System"
  };

  const benchmarks = {
    "1.1": ["Programme Outcomes (PO)", "Programme Specific Outcomes (PSO)", "Course Outcomes (CO)", "Curriculum Revision Minutes", "Industry-Oriented Curriculum", "Skill Development Initiatives"],
    "1.2": ["Open Electives", "Minor Programmes", "Honours Programmes", "Credit Transfer", "MOOCs / SWAYAM", "Value-Added Learning Flexibility"],
    "1.3": ["Value-Added Courses", "Certificate Programmes", "Environmental Studies", "Human Values", "Professional Ethics", "Skill Development Workshops"],
    "1.4": ["Student Feedback", "Faculty Feedback", "Alumni Feedback", "Employer Feedback", "Feedback Analysis Reports", "Action Taken Reports (ATR)"]
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [detRes, shapRes] = await Promise.all([
        criterionAPI.getSubDetail(code),
        analyticsAPI.getShapExplanation(code)
      ]);
      setDetail(detRes.data);
      setShapData(shapRes.data);
    } catch (err) {
      console.error(`Failed to fetch detail for ${code}:`, err);
      setError(`Failed to load Sub-Criterion ${code} details.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [code]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm text-slate-600 font-medium">Loading Sub-Criterion {code} Details...</p>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="max-w-md w-full p-6 rounded-3xl bg-amber-50 border border-amber-200 text-center space-y-4 shadow-lg">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
          <h3 className="text-lg font-bold text-amber-900">Sub-Criterion {code} Data Unavailable</h3>
          <p className="text-xs text-amber-700 font-medium">{error || "Unable to load sub-criterion details."}</p>
          <button
            onClick={fetchData}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all cursor-pointer shadow-md inline-flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Retry Loading Sub-Criterion {code}</span>
          </button>
        </div>
      </div>
    );
  }

  const analysis = detail?.analysis;
  const gaps = detail?.gaps || [];
  const recommendations = detail?.recommendations || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50/40 to-white glass-panel border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
              NAAC Sub-Criterion {code}
            </span>
            <span className="text-xs text-slate-500 font-medium">Curricular Aspects</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">
            {subCriteriaTitles[code] || `Sub-Criterion ${code}`}
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl font-medium">
            {analysis?.summary || `Detailed readiness assessment and evidence verification for Sub-Criterion ${code}.`}
          </p>
        </div>

        {/* Score Badge */}
        {analysis && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center min-w-[180px] shadow-sm">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Readiness Score</span>
            <div className="text-3xl font-black text-blue-700 mt-1">{analysis.score.toFixed(1)}%</div>
            <p className="text-xs text-slate-600 font-medium mt-1">{analysis.cgpa_equivalent.toFixed(2)} CGPA</p>
            <span className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {analysis.readiness_level}
            </span>
          </div>
        )}
      </div>

      {/* Mandatory Evidence Benchmarks Checklist */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-200 bg-white shadow-xs space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-emerald-600" />
          Mandatory NAAC Sub-Criterion {code} Evidence Benchmarks
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {benchmarks[code]?.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center space-x-2 text-slate-800 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-Criterion 1.4 Special Feedback Lifecycle Flow Diagram */}
      {code === "1.4" && (
        <div className="p-6 rounded-3xl glass-panel border border-blue-200 bg-blue-50/40 space-y-4">
          <h3 className="text-base font-bold text-blue-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Sub-Criterion 1.4 Stakeholder Feedback & Continuous Improvement Lifecycle
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 text-center text-xs font-bold">
            <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-xs">
              <span className="text-blue-600 block text-base font-black mb-0.5">1</span>
              <span>Feedback Collected</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-xs">
              <span className="text-blue-600 block text-base font-black mb-0.5">2</span>
              <span>Feedback Analyzed</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-xs">
              <span className="text-blue-600 block text-base font-black mb-0.5">3</span>
              <span>Issues Identified</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-xs">
              <span className="text-blue-600 block text-base font-black mb-0.5">4</span>
              <span>Action Taken</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-xs">
              <span className="text-blue-600 block text-base font-black mb-0.5">5</span>
              <span>Action Taken Report (ATR)</span>
            </div>
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs">
              <span className="text-white block text-base font-black mb-0.5">6</span>
              <span>Continuous Improvement</span>
            </div>
          </div>
        </div>
      )}

      {/* SHAP Explainable AI Feature Importance Visualizer */}
      <ShapVisualizer shapData={shapData} />

      {/* Gaps & Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identified Gaps */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-200 bg-white shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Identified Evidence Gaps ({gaps.length})
          </h3>
          {gaps.length === 0 ? (
            <p className="text-xs text-slate-500">No active gaps identified for Sub-Criterion {code}.</p>
          ) : (
            <div className="space-y-3">
              {gaps.map((gap) => (
                <div key={gap.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{gap.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      {gap.severity}
                    </span>
                  </div>
                  <p className="text-slate-700">{gap.description}</p>
                  {gap.missing_evidence && (
                    <p className="text-rose-700 font-bold"><strong>Missing Evidence:</strong> {gap.missing_evidence}</p>
                  )}
                  {gap.recommended_action && (
                    <p className="text-blue-700 font-bold"><strong>Action:</strong> {gap.recommended_action}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Recommendations */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-200 bg-white shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            Recommendations & Action Items ({recommendations.length})
          </h3>
          {recommendations.length === 0 ? (
            <p className="text-xs text-slate-500">No active recommendations for Sub-Criterion {code}.</p>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div key={rec.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{rec.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      {rec.priority} Priority
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-normal">{rec.recommendation_text}</p>
                  {rec.action_items && (
                    <ul className="list-disc list-inside text-slate-600 pt-1 space-y-1">
                      {rec.action_items.map((act, i) => (
                        <li key={i}>{act}</li>
                      ))}
                    </ul>
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

export default CriterionDetail;
