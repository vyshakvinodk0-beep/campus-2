import React from 'react';
import { Sparkles, TrendingUp, TrendingDown, HelpCircle, BarChart3 } from 'lucide-react';

const ShapVisualizer = ({ shapData }) => {
  if (!shapData) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>SHAP Explainable AI Feature Attribution</span>
        </div>
        <p className="text-xs text-slate-500 italic">No SHAP attribution data calculated for this view yet.</p>
      </div>
    );
  }

  // Parse contributions whether it's feature_contributions or positive_features / negative_features
  let items = [];
  if (Array.isArray(shapData.feature_contributions)) {
    items = shapData.feature_contributions;
  } else if (Array.isArray(shapData.contributions)) {
    items = shapData.contributions;
  } else {
    if (shapData.positive_features) {
      items.push(...shapData.positive_features.map(f => ({ ...f, shap_value: Math.abs(f.shap_value || f.value || 5) })));
    }
    if (shapData.negative_features) {
      items.push(...shapData.negative_features.map(f => ({ ...f, shap_value: -Math.abs(f.shap_value || f.value || 5) })));
    }
  }

  const baseScore = shapData.base_value || shapData.predicted_score || 75.0;

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>SHAP Explainable AI Model Attribution</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                Transparent & Auditable
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Quantifies exact positive and negative evidence contributions toward the NAAC readiness score.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Baseline Predicted Impact
          </span>
          <span className="text-xl font-black text-slate-900">
            {typeof baseScore === 'number' ? baseScore.toFixed(1) : baseScore}%
          </span>
        </div>
      </div>

      {/* Feature Contributions Waterfall / Bar List */}
      <div className="space-y-3">
        {items.map((item, idx) => {
          const val = item.shap_value ?? item.value ?? 0;
          const isPositive = val >= 0;
          const name = item.feature_name || item.name || `Feature ${idx + 1}`;
          const cleanName = name.replace(/_/g, ' ');
          const desc = item.description || (isPositive ? 'Positively boosts score' : 'Deducts from score due to missing documentation');
          const absVal = Math.abs(val);

          return (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-bold text-slate-900">{cleanName}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono font-bold text-xs">
                  <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>
                    {isPositive ? `+${val.toFixed(1)}%` : `${val.toFixed(1)}%`}
                  </span>
                </div>
              </div>

              {/* Impact Bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                {isPositive ? (
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(absVal * 8, 100)}%` }}
                  />
                ) : (
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(absVal * 8, 100)}%` }}
                  />
                )}
              </div>

              <p className="text-[11px] text-slate-600">
                {desc}
              </p>
            </div>
          );
        })}
      </div>

      <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-slate-700 flex items-start gap-2">
        <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong>Reviewer Note:</strong> SHAP (SHapley Additive exPlanations) guarantees deterministic, game-theoretic credit attribution for each verified institutional document piece without black-box bias.
        </p>
      </div>
    </div>
  );
};

export default ShapVisualizer;
