import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';

const SubCriteriaCard = ({ analysis }) => {
  if (!analysis) return null;

  const {
    sub_criterion = '1.1',
    title = 'Curricular Planning & Implementation',
    score = 75,
    readiness_score = 75,
    status = 'On Track',
    summary = 'Curricular aspects documentation verified with syllabus revision records.',
    metrics_count = 3,
    verified_count = 2,
    gap_count = 1
  } = analysis;

  const currentScore = readiness_score || score;

  const getScoreColor = (val) => {
    if (val >= 75) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (val >= 60) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (val >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const getProgressColor = (val) => {
    if (val >= 75) return 'bg-emerald-600';
    if (val >= 60) return 'bg-blue-600';
    if (val >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3.5 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
            Sub-{sub_criterion}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getScoreColor(currentScore)}`}>
            {currentScore}% Readiness
          </span>
        </div>

        <h4 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-1">
          {title}
        </h4>

        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {summary}
        </p>
      </div>

      <div className="space-y-3 pt-1 border-t border-slate-100">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
            <span>Verified Progress</span>
            <span className="font-bold text-slate-800">{verified_count} / {metrics_count || 4} Metrics</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(currentScore)}`}
              style={{ width: `${Math.min(100, Math.max(5, currentScore))}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            {gap_count > 0 ? (
              <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold text-[10px]">
                <AlertTriangle className="w-3 h-3" />
                {gap_count} Gap{gap_count > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[10px]">
                <CheckCircle2 className="w-3 h-3" />
                Complete
              </span>
            )}
          </div>

          <Link
            to={`/criterion/${sub_criterion}`}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
          >
            <span>Deep Dive</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubCriteriaCard;
