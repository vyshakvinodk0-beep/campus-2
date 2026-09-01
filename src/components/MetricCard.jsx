import React from 'react';
import { HelpCircle } from 'lucide-react';

const MetricCard = ({ title, value, subtitle, color = 'blue', tooltip, icon: Icon }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  const getColorClasses = () => {
    switch (color) {
      case 'emerald':
      case 'green':
        return 'text-emerald-600';
      case 'purple':
        return 'text-purple-600';
      case 'indigo':
        return 'text-indigo-600';
      case 'amber':
        return 'text-amber-600';
      case 'rose':
      case 'red':
        return 'text-rose-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 relative transition-all hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        {tooltip && (
          <button
            type="button"
            onClick={() => setShowTooltip(!showTooltip)}
            className="text-slate-400 hover:text-blue-600 cursor-pointer"
            title="Info"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <p className={`text-2xl font-black ${getColorClasses()}`}>{value}</p>
        {Icon && <Icon className={`w-5 h-5 opacity-40 ${getColorClasses()}`} />}
      </div>

      {subtitle && (
        <p className="text-[11px] text-slate-500 font-medium">{subtitle}</p>
      )}

      {showTooltip && tooltip && (
        <div className="p-3 rounded-xl bg-slate-900 text-white text-xs font-medium space-y-1 shadow-xl absolute z-30 top-full left-0 right-0 mt-1 border border-slate-700">
          <p className="font-bold text-blue-300">{title}</p>
          <p>{tooltip}</p>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
