import React, { useState } from 'react';
import { 
  Bot, CheckCircle2, Play, RefreshCw, Cpu, Layers, ShieldCheck, 
  Search, AlertTriangle, Sparkles, ChevronRight 
} from 'lucide-react';

const AgentPipelineVisualizer = ({ onRetryAgent }) => {
  const [activeStep, setActiveStep] = useState(null);

  const agents = [
    {
      step: 1,
      name: 'Scope Isolator',
      role: 'Boundary Enforcer',
      description: 'Filters out Criterion 2-7 pages, isolating pure Criterion 1 curricular content with strict zero-leakage boundaries.',
      status: 'Verified',
      icon: ShieldCheck,
      color: 'blue'
    },
    {
      step: 2,
      name: 'OCR & PDF Engine',
      role: 'Text & Layout Extraction',
      description: 'Extracts exact page-by-page text buffers, structural tables, and BoS minute timestamps.',
      status: 'Verified',
      icon: Cpu,
      color: 'indigo'
    },
    {
      step: 3,
      name: 'Semantic Retriever',
      role: 'FAISS Chunk Retrieval',
      description: 'Semantic vector search grounded in NAAC SSR benchmark criteria and syllabus keywords.',
      status: 'Verified',
      icon: Search,
      color: 'purple'
    },
    {
      step: 4,
      name: 'Grounded Verifier',
      role: 'Evidence Cross-Examiner',
      description: 'Verifies claims strictly against source PDF page numbers; rejects hallucinated or unverified data.',
      status: 'Verified',
      icon: Bot,
      color: 'emerald'
    },
    {
      step: 5,
      name: 'Gap & ATR Engine',
      role: 'Action Planner',
      description: 'Maps missing evidence items directly to specific actionable institutional recommendations.',
      status: 'Verified',
      icon: AlertTriangle,
      color: 'amber'
    },
    {
      step: 6,
      name: 'Deterministic Scorer',
      role: 'SHAP Feature Attributor',
      description: 'Calculates mathematical readiness index & SHAP explainable AI attribution vectors.',
      status: 'Verified',
      icon: Sparkles,
      color: 'rose'
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
              6-Stage Agentic Verification Architecture
            </h3>
            <p className="text-xs text-slate-500">
              Multi-agent pipeline ensuring 100% grounded, zero-hallucination NAAC Criterion 1 analytics.
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {agents.map((ag) => {
          const Icon = ag.icon;
          const isExpanded = activeStep === ag.step;

          return (
            <div
              key={ag.step}
              onClick={() => setActiveStep(isExpanded ? null : ag.step)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative ${
                isExpanded
                  ? 'border-blue-500 bg-blue-50/30 shadow-xs ring-1 ring-blue-500/20'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center font-black text-xs shadow-2xs">
                    {ag.step}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs">{ag.name}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">{ag.role}</p>
                  </div>
                </div>

                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  {ag.status}
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                {ag.description}
              </p>

              <div className="flex items-center justify-between text-[10px] text-blue-600 font-bold pt-1">
                <span>{isExpanded ? 'Hide Specs' : 'Inspect Agent Specs'}</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentPipelineVisualizer;
