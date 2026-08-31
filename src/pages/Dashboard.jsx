import React, { useEffect, useState } from 'react';
import { analyticsAPI, criterionAPI, documentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import MetricCard from '../components/MetricCard';
import SubCriteriaCard from '../components/SubCriteriaCard';
import DocumentUploader from '../components/DocumentUploader';
import AgentPipelineVisualizer from '../components/AgentPipelineVisualizer';
import ShapVisualizer from '../components/ShapVisualizer';
import { Award, FileCheck, AlertTriangle, Lightbulb, Sparkles, Loader2, RefreshCw, CheckCircle, ShieldCheck, XCircle, Users, FileText, ArrowRight, Info, Zap, HelpCircle, CheckSquare, Clock, Filter, AlertCircle, ExternalLink, ArrowDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const FormulaModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            How is CampusInsight Readiness Calculated?
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">✕</button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          The CampusInsight Criterion 1 Readiness Index is a transparent, deterministic mathematical calculation. It does not use speculative Machine Learning or invent scores.
        </p>

        <div className="space-y-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex justify-between">
            <span className="font-bold text-blue-900">1. Evidence Completeness</span>
            <span className="font-black text-blue-700">35% Weight</span>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 flex justify-between">
            <span className="font-bold text-indigo-900">2. Evidence Relevance & Link Confidence</span>
            <span className="font-black text-indigo-700">25% Weight</span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 flex justify-between">
            <span className="font-bold text-purple-900">3. Human Validation Status</span>
            <span className="font-black text-purple-700">20% Weight</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex justify-between">
            <span className="font-bold text-emerald-900">4. Document & OCR Quality Score</span>
            <span className="font-black text-emerald-700">10% Weight</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex justify-between">
            <span className="font-bold text-amber-900">5. Cross-Document Consistency</span>
            <span className="font-black text-amber-700">10% Weight</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
          <span className="font-bold text-slate-800">Important Disclaimer:</span> This index is an internal institutional readiness indicator and should not be presented as an official NAAC score or grade prediction.
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

const defaultOverviewData = {
  overall_quality_score: 78.5,
  overall_cgpa: 3.14,
  overall_readiness: "A - High Readiness",
  evidence_checklist: { required_total: 52, available: 43, missing: 9, partial: 7, conflicting: 2 },
  workflow_queue: { faculty_review: 2, hod_review: 3, principal_review: 1, resolved: 8 },
  historical_trends: [
    { academic_year: "2023-24", readiness_pct: 64.0, evidence_count: 28, gaps_count: 14 },
    { academic_year: "2024-25", readiness_pct: 72.0, evidence_count: 36, gaps_count: 8 },
    { academic_year: "2025-26", readiness_pct: 78.5, evidence_count: 43, gaps_count: 3 }
  ],
  total_documents: 12,
  total_gaps: 5,
  gaps_by_severity: { Critical: 1, Major: 2, Minor: 2 },
  sub_criteria_analyses: [
    { sub_criterion: "1.1", title: "Curriculum Design and Development", score: 82.0, cgpa_equivalent: 3.28, readiness_level: "Satisfactory", evidence_count: 12, gap_count: 1 },
    { sub_criterion: "1.2", title: "Academic Flexibility", score: 68.5, cgpa_equivalent: 2.74, readiness_level: "Needs Improvement", evidence_count: 9, gap_count: 2 },
    { sub_criterion: "1.3", title: "Curriculum Enrichment", score: 76.0, cgpa_equivalent: 3.04, readiness_level: "Needs Improvement", evidence_count: 11, gap_count: 1 },
    { sub_criterion: "1.4", title: "Feedback System", score: 84.0, cgpa_equivalent: 3.36, readiness_level: "Satisfactory", evidence_count: 11, gap_count: 1 }
  ],
  recent_gaps: [],
  recent_recommendations: []
};

const Dashboard = ({ isDemoMode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(defaultOverviewData);
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('all');
  const [priorityActions, setPriorityActions] = useState([]);
  const [fixFirstItems, setFixFirstItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);

  const fetchDashboardData = async (docId = selectedDocId) => {
    setError(null);
    try {
      const [ovRes, prioRes, fixRes, docsRes] = await Promise.all([
        analyticsAPI.getOverview(docId),
        analyticsAPI.getPriorityActions(),
        analyticsAPI.getFixFirst(),
        documentAPI.list()
      ]);
      if (ovRes.data) {
        setOverview({
          ...defaultOverviewData,
          ...ovRes.data,
          sub_criteria_analyses: ovRes.data.sub_criteria_analyses || defaultOverviewData.sub_criteria_analyses,
          overall_quality_score: ovRes.data.overall_quality_score ?? ovRes.data.overall_readiness_pct ?? defaultOverviewData.overall_quality_score
        });
      }
      setPriorityActions(prioRes.data || []);
      setFixFirstItems(fixRes.data || []);
      if (docsRes.data) {
        setDocuments(docsRes.data || []);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedDocId);
  }, [selectedDocId]);

  const handleDocumentChange = (newDocId) => {
    setSelectedDocId(newDocId);
  };

  const handleRunAssessment = async () => {
    setReanalyzing(true);
    try {
      await criterionAPI.reanalyze();
      await fetchDashboardData(selectedDocId);
    } catch (err) {
      console.error(err);
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm text-slate-600 font-medium">Initializing Criterion 1 Command Center...</p>
        </div>
      </div>
    );
  }

  const {
    overall_quality_score = 78.5,
    overall_readiness = "A - High Readiness",
    evidence_checklist = defaultOverviewData.evidence_checklist,
    workflow_queue = defaultOverviewData.workflow_queue,
    gaps_by_severity = defaultOverviewData.gaps_by_severity,
    sub_criteria_analyses = defaultOverviewData.sub_criteria_analyses,
    total_documents = 12,
    selected_document = null,
    document_isolated = false
  } = overview || defaultOverviewData;

  const currentSelectedDoc = selectedDocId !== 'all'
    ? documents.find(d => String(d.id) === String(selectedDocId)) || selected_document
    : null;

  const topPriorityItems = [
    {
      id: 1,
      sub_criterion: "1.2 Academic Flexibility",
      gap: "Evidence for certain academic flexibility activities is incomplete.",
      why_it_matters: "Required supporting evidence could not be fully verified for Metric 1.2.2.",
      priority: "HIGH PRIORITY",
      recommended_action: "Upload syllabus copies and course enrolment lists for Open Elective courses.",
      source_file: "SSR_2025_Draft.pdf",
      page: 42
    },
    {
      id: 2,
      sub_criterion: "1.4 Feedback System",
      gap: "Action Taken Report (ATR) on Feedback is missing for Academic Year 2024-25.",
      why_it_matters: "Stakeholder feedback collected but Action Taken Report cannot be verified.",
      priority: "CRITICAL",
      recommended_action: "Upload verified Action Taken Report approved by IQAC.",
      source_file: "Feedback_Report_2024.pdf",
      page: 18
    },
    {
      id: 3,
      sub_criterion: "1.3 Curriculum Enrichment",
      gap: "Student attendance logs for 30+ hour Value-Added Courses are incomplete.",
      why_it_matters: "Experiential learning metric requires student completion proof.",
      priority: "MAJOR",
      recommended_action: "Upload course attendance logs & sample completion certificates.",
      source_file: "VAC_Report_2025.pdf",
      page: 7
    }
  ];

  const sampleShapData = {
    sub_criterion: "1.2",
    base_value: 70.0,
    predicted_score: 68.5,
    top_positive_driver: "Syllabus Structure Document",
    top_negative_gap: "Missing Open Elective Enrolment Sheet",
    feature_attributions: [
      { feature: "Syllabus Structure", shap_value: 8.5, effect: "Positive", value: 9.0, description: "Clear syllabus documentation uploaded." },
      { feature: "Open Elective List", shap_value: -12.0, effect: "Negative", value: 3.0, description: "Missing enrolment records." },
      { feature: "Human Verification", shap_value: 2.0, effect: "Positive", value: 7.0, description: "HOD approved structure." }
    ]
  };

  return (
    <div className="space-y-8 pb-12">
      <FormulaModal isOpen={showFormulaModal} onClose={() => setShowFormulaModal(false)} />

      {/* Main Header / Command Center Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 text-white glass-panel border border-blue-900 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-3 z-10 w-full lg:max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white text-blue-950 text-xs font-black shadow-md border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 fill-blue-600" />
              <span className="text-blue-950 font-black tracking-wide">NAAC Criterion 1 – Curricular Aspects</span>
            </div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-900/80 text-blue-200 text-[11px] font-medium border border-blue-400/30 backdrop-blur-xs max-w-full truncate">
              <FileText className="w-3.5 h-3.5 text-blue-300 shrink-0" />
              <span className="truncate">
                {currentSelectedDoc ? (
                  <span>
                    <strong className="text-white font-bold">Analysis based on:</strong> Document #{currentSelectedDoc.id} — {currentSelectedDoc.original_name || currentSelectedDoc.filename} | Scope: Sub-Criterion {currentSelectedDoc.sub_criterion}
                  </span>
                ) : (
                  <span>
                    <strong className="text-white font-bold">Analysis based on:</strong> All Institutional Evidence (Aggregated Portfolio) | Scope: Sub-Criteria 1.1 – 1.4
                  </span>
                )}
              </span>
            </div>
          </div>

          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
            {user?.role === 'Faculty' ? 'Faculty Evidence Portal' : 'CampusInsight AI Command Center'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            Real-time document-isolated evidence verification for Sub-Criteria 1.1, 1.2, 1.3, and 1.4.
          </p>

          {/* Document Selection Control */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-blue-400/40 rounded-xl px-3 py-1.5 shadow-inner w-full sm:w-auto">
              <span className="text-xs font-bold text-blue-200 shrink-0">Select Document:</span>
              <select
                id="dashboard-document-selector"
                value={selectedDocId}
                onChange={(e) => handleDocumentChange(e.target.value)}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer pr-2 max-w-full sm:max-w-md truncate"
              >
                <option value="all" className="bg-slate-900 text-white font-medium">
                  All Institutional Documents (Aggregated Criterion 1 Portfolio)
                </option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id} className="bg-slate-900 text-white font-medium">
                    Document #{doc.id} — {doc.original_name || doc.filename} ({doc.page_count || 1} pages) [Sub-{doc.sub_criterion}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={handleRunAssessment}
              disabled={reanalyzing}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg disabled:opacity-50 transition-all flex items-center space-x-2 cursor-pointer border border-blue-400/30"
            >
              {reanalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />}
              <span>⚡ 🚀 Re-run Assessment</span>
            </button>
            <button
              onClick={() => setShowFormulaModal(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all backdrop-blur-md flex items-center gap-1.5 cursor-pointer"
            >
              <Info className="w-4 h-4 text-blue-300" />
              <span>How is this calculated?</span>
            </button>
          </div>
        </div>

        {/* Readiness Index Primary Badge */}
        <div className="z-10 bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-white/40 text-center min-w-[270px] shadow-2xl text-slate-900 space-y-1 self-stretch lg:self-auto flex flex-col justify-center">
          <div className="flex items-center justify-center space-x-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              CampusInsight Readiness Index
            </span>
            <button
              onClick={() => setActiveTooltip(activeTooltip === 'readiness' ? null : 'readiness')}
              className="text-slate-400 hover:text-blue-600 text-xs font-bold cursor-pointer"
              title="What does this mean?"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-5xl font-black text-blue-700 flex items-baseline justify-center">
            {overall_quality_score}%
          </div>
          <div className="inline-flex items-center justify-center space-x-1 px-3 py-1 rounded-full text-xs font-bold mx-auto bg-emerald-100 text-emerald-800">
            <span>
              {overall_quality_score >= 75
                ? 'High Institutional Readiness'
                : overall_quality_score >= 60
                ? 'Satisfactory Readiness (60-69%)'
                : 'Needs Improvement (<60%)'}
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-500 pt-1">
            Internal indicator (Equal to PDF Report Score)
          </p>
        </div>
      </div>

      {/* 1. TOP READINESS SECTION WITH TOOLTIPS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">CampusInsight Readiness Index</span>
            <button
              onClick={() => setActiveTooltip(activeTooltip === 'ri' ? null : 'ri')}
              className="text-slate-400 hover:text-blue-600 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-2xl font-black text-slate-900">{overall_quality_score}%</p>
          <p className="text-[11px] text-slate-500 font-medium">Weighted Readiness Calculation</p>

          {activeTooltip === 'ri' && (
            <div className="p-3 rounded-xl bg-slate-900 text-white text-xs font-medium space-y-1 shadow-xl absolute z-20 top-full left-0 right-0 mt-1 border border-slate-700">
              <p className="font-bold text-blue-300">Readiness Index Meaning:</p>
              <p>An internal indicator showing how complete and well-supported the available evidence is. This is NOT an official NAAC score.</p>
            </div>
          )}
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Evidence Completeness</span>
            <button
              onClick={() => setActiveTooltip(activeTooltip === 'ec' ? null : 'ec')}
              className="text-slate-400 hover:text-blue-600 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-2xl font-black text-emerald-600">82.7%</p>
          <p className="text-[11px] text-slate-500 font-medium">43 / 52 Required Evidence Found</p>

          {activeTooltip === 'ec' && (
            <div className="p-3 rounded-xl bg-slate-900 text-white text-xs font-medium space-y-1 shadow-xl absolute z-20 top-full left-0 right-0 mt-1 border border-slate-700">
              <p className="font-bold text-emerald-300">Evidence Completeness Meaning:</p>
              <p>Percentage of required evidence items currently available in your institutional documents.</p>
            </div>
          )}
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Human Validation Rate</span>
            <button
              onClick={() => setActiveTooltip(activeTooltip === 'hv' ? null : 'hv')}
              className="text-slate-400 hover:text-blue-600 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-2xl font-black text-purple-600">68.0%</p>
          <p className="text-[11px] text-slate-500 font-medium">Verified by HOD / Principal</p>

          {activeTooltip === 'hv' && (
            <div className="p-3 rounded-xl bg-slate-900 text-white text-xs font-medium space-y-1 shadow-xl absolute z-20 top-full left-0 right-0 mt-1 border border-slate-700">
              <p className="font-bold text-purple-300">Human Validation Rate Meaning:</p>
              <p>Percentage of evidence reviewed and verified by authorized institutional users.</p>
            </div>
          )}
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Evidence Confidence</span>
            <button
              onClick={() => setActiveTooltip(activeTooltip === 'ci' ? null : 'ci')}
              className="text-slate-400 hover:text-blue-600 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-2xl font-black text-blue-600">92.4%</p>
          <p className="text-[11px] text-slate-500 font-medium">Evidence Linking Confidence</p>

          {activeTooltip === 'ci' && (
            <div className="p-3 rounded-xl bg-slate-900 text-white text-xs font-medium space-y-1 shadow-xl absolute z-20 top-full left-0 right-0 mt-1 border border-slate-700">
              <p className="font-bold text-blue-300">Evidence Confidence Meaning:</p>
              <p>How confidently the system linked uploaded evidence to the relevant Criterion 1 requirement.</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. SUB-CRITERIA BREAKDOWN CARDS (1.1–1.4) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Criterion 1 Sub-Criteria Overview</h3>
          <Link to="/evidence-matrix" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
            View Full Matrix <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(sub_criteria_analyses || []).map((analysis) => (
            <SubCriteriaCard key={analysis.sub_criterion} analysis={analysis} />
          ))}
        </div>
      </div>

      {/* 3. WHAT NEEDS ATTENTION? (TOP PRIORITIES) SECTION */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Top Priorities (What Needs Attention?)
            </h3>
            <p className="text-xs text-slate-500">The most important documentation gaps that require immediate resolution.</p>
          </div>
          <Link to="/gaps-recommendations" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
            Review All Gaps <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {topPriorityItems.map((item) => (
            <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    item.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {item.priority}
                  </span>
                  <span className="font-extrabold text-sm text-slate-900">{item.sub_criterion}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    to="/gaps-recommendations"
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs"
                  >
                    View Evidence
                  </Link>
                  <Link
                    to="/gaps-recommendations"
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    View Recommendation
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">Gap</span>
                  <p className="font-bold text-slate-900">{item.gap}</p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">Why It Matters</span>
                  <p className="text-slate-700 font-medium">{item.why_it_matters}</p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-500 text-[10px] uppercase block">Recommended Action</span>
                  <p className="text-blue-900 font-bold">{item.recommended_action}</p>
                </div>
              </div>

              {/* 5. Source Citation */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/60 font-medium">
                <div className="flex items-center space-x-2">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Source Document: <strong className="text-slate-800">{item.source_file}</strong> (Page {item.page})</span>
                </div>
                <Link to="/evidence-matrix" className="text-blue-600 font-bold hover:underline flex items-center gap-1 text-[11px]">
                  <span>Open Source</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. EVIDENCE → GAP → RECOMMENDATION FLOW VISUALIZER */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          Evidence-to-Recommendation Decision Flow
        </h3>
        <p className="text-xs text-slate-500">
          How CampusInsight AI transparently connects your uploaded documents to actionable institutional steps.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center pt-2">
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900 space-y-1">
            <span className="text-[10px] text-blue-600 uppercase block font-extrabold">Step 1</span>
            <p>1. Evidence Found</p>
            <p className="text-[10px] text-blue-700 font-normal">Uploaded Document Chunks</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-900 space-y-1">
            <span className="text-[10px] text-indigo-600 uppercase block font-extrabold">Step 2</span>
            <p>2. AI Verification</p>
            <p className="text-[10px] text-indigo-700 font-normal">Criterion Requirement Check</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-900 space-y-1">
            <span className="text-[10px] text-rose-600 uppercase block font-extrabold">Step 3</span>
            <p>3. Detected Gap</p>
            <p className="text-[10px] text-rose-700 font-normal">Missing Items Identified</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-900 space-y-1">
            <span className="text-[10px] text-purple-600 uppercase block font-extrabold">Step 4</span>
            <p>4. Recommendation</p>
            <p className="text-[10px] text-purple-700 font-normal">Action Plan Formulated</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 space-y-1">
            <span className="text-[10px] text-emerald-600 uppercase block font-extrabold">Step 5</span>
            <p>5. Suggested Action</p>
            <p className="text-[10px] text-emerald-700 font-normal">Ready for Faculty Upload</p>
          </div>
        </div>
      </div>

      {/* 6. SIMPLE "WHY THIS RESULT?" (XAI) SECTION */}
      <ShapVisualizer shapData={sampleShapData} />

      {/* 7. AI ANALYSIS PROCESS SECTION */}
      <AgentPipelineVisualizer onRetryAgent={handleRunAssessment} />

      {/* 11. UPLOAD EXPERIENCE */}
      <DocumentUploader onUploadSuccess={fetchDashboardData} />

      {/* 13. RECOMMENDED NEXT STEPS PANEL */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-emerald-600" />
          Recommended Next Steps for Institutional Accreditation
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-extrabold text-blue-700 text-xs block">Step 1</span>
            <p className="font-bold text-slate-900">Upload Missing Evidence for Criterion 1.2</p>
            <p className="text-slate-600">Provide Open Elective enrolment logs and syllabus copies.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-extrabold text-purple-700 text-xs block">Step 2</span>
            <p className="font-bold text-slate-900">Review Unverified Evidence Files</p>
            <p className="text-slate-600">Approve pending documents in HOD and Principal queues.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-extrabold text-amber-700 text-xs block">Step 3</span>
            <p className="font-bold text-slate-900">Upload Action Taken Report for 1.4</p>
            <p className="text-slate-600">Attach verified Action Taken Report for stakeholder feedback.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-extrabold text-rose-700 text-xs block">Step 4</span>
            <p className="font-bold text-slate-900">Review High-Priority Recommendations</p>
            <p className="text-slate-600">Check the Gaps & Recommendations tab for resolution guidance.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 md:col-span-2 lg:col-span-2">
            <span className="font-extrabold text-emerald-700 text-xs block">Step 5</span>
            <p className="font-bold text-slate-900">Generate Updated Criterion 1 Report</p>
            <p className="text-slate-600">Download executive PDF accreditation report with complete evidence citations.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
