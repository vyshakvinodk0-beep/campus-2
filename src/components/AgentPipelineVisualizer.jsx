import React, { useState } from 'react';
import { 
  Bot, CheckCircle2, Play, RefreshCw, Cpu, Layers, ShieldCheck, 
  Search, AlertTriangle, Sparkles, ChevronRight, FileText, CheckCheck,
  Scale, FileCheck, ShieldAlert
} from 'lucide-react';

const AgentPipelineVisualizer = ({ onRetryAgent }) => {
  const [activeStep, setActiveStep] = useState(null);

  const agents = [
    {
      step: 1,
      name: 'Document Intake & Classifier',
      role: 'Type & Relevance Identifier',
      description: 'Identifies document type (SSR, AQAR, Syllabus, BOS Minutes, Feedback, ATR) and classifies relevance (Supported vs Unsupported).',
      status: 'Verified',
      icon: FileText,
      color: 'blue',
      outputs: 'Document Class, Relevance Status (Highly / Partially / Not Relevant)'
    },
    {
      step: 2,
      name: 'Quality & OCR Decision Agent',
      role: 'Scan / Vector Processor',
      description: 'Determines whether PDF is digital text, scanned image, or hybrid, and selectively schedules OCR only where needed.',
      status: 'Verified',
      icon: Cpu,
      color: 'indigo',
      outputs: 'Processing Mode (Digital vs Selective OCR), Density & Readability Scores'
    },
    {
      step: 3,
      name: 'Relevance & Smart Page Selector',
      role: 'Boundary & Scope Isolator',
      description: 'Isolates Criterion 1 pages (1.1, 1.2, 1.3, 1.4) and safely skips non-Criterion 1 content (e.g. Criteria 2–7).',
      status: 'Verified',
      icon: ShieldCheck,
      color: 'purple',
      outputs: 'Analyzed Pages vs Ignored Pages, Scope Isolation Verification'
    },
    {
      step: 4,
      name: 'Grounded Evidence Extractor',
      role: 'Traceability & Snippet Engine',
      description: 'Extracts exact page-level evidence snippets with document provenance, distinguishing Institutional Claims from Verified Artifacts.',
      status: 'Verified',
      icon: Bot,
      color: 'emerald',
      outputs: 'Exact Page Citations, Claim Status vs Supporting Artifact Status'
    },
    {
      step: 5,
      name: 'NAAC Metric Mapping Agent',
      role: 'Criterion 1 Taxonomy Mapper',
      description: 'Maps extracted evidence items strictly to NAAC Criterion 1 sub-criteria (1.1.1, 1.1.2, 1.1.3, 1.2.1, 1.2.2, 1.3.1, 1.3.2, 1.4.1, 1.4.2).',
      status: 'Verified',
      icon: Search,
      color: 'sky',
      outputs: 'Dynamic Metric Alignment, Denominator Normalization'
    },
    {
      step: 6,
      name: 'Consistency & Conflict Agent',
      role: 'Cross-Page Auditor',
      description: 'Audits conflicting statements, date discrepancies, credit mismatches, and revision percentage conflicts across sections.',
      status: 'Verified',
      icon: ShieldAlert,
      color: 'rose',
      outputs: 'Verified Conflicts List, Discrepancy Severity Flagging'
    },
    {
      step: 7,
      name: 'Deduplicated Gap Analysis Agent',
      role: 'Missing Artifact Identifier',
      description: 'Identifies missing evidence checkpoints and deduplicates overlapping gaps per metric.',
      status: 'Verified',
      icon: AlertTriangle,
      color: 'amber',
      outputs: 'Severity-Ranked Deduplicated Gaps, Missing Artifact List'
    },
    {
      step: 8,
      name: 'Actionable Recommendation & ATR Agent',
      role: 'Action Taken Planner',
      description: 'Translates each identified gap into a practical Action Taken Report recommendation with target metric alignment.',
      status: 'Verified',
      icon: Sparkles,
      color: 'violet',
      outputs: 'Originating Metric-Linked ATRs, Institutional Action Steps'
    },
    {
      step: 9,
      name: 'Deterministic Scoring & XAI Agent',
      role: 'Formula & SHAP Calculator',
      description: 'Applies 5-factor mathematical formula (Completeness, Relevance, Governance, Quality, Consistency) and SHAP explainability attribution.',
      status: 'Verified',
      icon: Scale,
      color: 'teal',
      outputs: 'Readiness %, Dynamic Evaluated Denominator, SHAP Contributions'
    },
    {
      step: 10,
      name: 'Report Validation & Quality Gate',
      role: '12-Point Gatekeeper',
      description: 'Executes the 12-section master report synthesis and validates 12 mandatory quality gates before release.',
      status: 'Verified',
      icon: FileCheck,
      color: 'green',
      outputs: '12-Section Master Report, 12-Check Quality Gate Audit'
    }
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              10-Agent Master Document Analysis & Recommendation Engine
            </h3>
            <p className="text-xs text-slate-500">
              Multi-agent architecture ensuring grounded, zero-hallucination NAAC Criterion 1 quality analytics.
            </p>
          </div>
        </div>

        {onRetryAgent && (
          <button
            onClick={onRetryAgent}
            className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-execute Pipeline</span>
          </button>
        )}
      </div>

      {/* Pipeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
        {agents.map((ag) => {
          const Icon = ag.icon;
          const isExpanded = activeStep === ag.step;

          return (
            <div
              key={ag.step}
              onClick={() => setActiveStep(isExpanded ? null : ag.step)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 relative ${
                isExpanded
                  ? 'border-blue-500 bg-blue-50/30 shadow-xs ring-1 ring-blue-500/20'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-blue-600 flex items-center justify-center font-black text-[11px] shadow-2xs">
                    {ag.step}
                  </div>
                  <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {ag.status}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-xs line-clamp-1">{ag.name}</h4>
                <p className="text-[10px] text-slate-500 font-medium">{ag.role}</p>
              </div>

              <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                {ag.description}
              </p>

              {isExpanded && ag.outputs && (
                <div className="p-2 rounded-xl bg-white border border-blue-200 text-[10px] text-blue-900 font-medium">
                  <strong>Outputs:</strong> {ag.outputs}
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-blue-600 font-bold pt-0.5">
                <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentPipelineVisualizer;
