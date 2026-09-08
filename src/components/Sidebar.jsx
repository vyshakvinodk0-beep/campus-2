import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Table, Files, AlertTriangle, Inbox, 
  FileText, ShieldCheck, Users, Sparkles, BookOpen, Layers, 
  HelpCircle, CheckCircle2, ChevronRight 
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();

  const navItems = [
    { to: '/', label: 'Overview Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/evidence-matrix', label: 'Evidence Matrix', icon: Table },
    { to: '/documents', label: 'Documents & OCR', icon: Files },
    { to: '/gaps-recommendations', label: 'Gap Analysis & SHAP', icon: AlertTriangle },
    { to: '/inbox', label: 'Accreditation Inbox', icon: Inbox },
    { to: '/reports', label: 'Reports & Exports', icon: FileText },
    { to: '/trust-center', label: 'Trust & Quality Gate', icon: ShieldCheck },
  ];

  if (user?.role === 'Administrator') {
    navItems.push({ to: '/manage-users', label: 'User Governance', icon: Users });
  }

  const subCriteria = [
    { code: '1.1', title: '1.1 Curriculum Design' },
    { code: '1.2', title: '1.2 Academic Flexibility' },
    { code: '1.3', title: '1.3 Curriculum Enrichment' },
    { code: '1.4', title: '1.4 Feedback System' },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex font-sans">
      <div className="space-y-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Sub-Criteria Shortcuts */}
        <div className="space-y-1 pt-2 border-t border-slate-100">
          <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Sub-Criteria Scope</span>
            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
              100 Pts
            </span>
          </div>
          {subCriteria.map((sc) => (
            <NavLink
              key={sc.code}
              to={`/sub-criterion/${sc.code}`}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <span className="truncate">{sc.title}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </NavLink>
          ))}
        </div>
      </div>

      {/* Footer / System Status & Role Banner */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        {/* Active Role Indicator Card */}
        <div className="p-2.5 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200/80 text-[11px] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs shadow-2xs shrink-0">
            {user?.role === 'Administrator' ? '🔑' : user?.role === 'Principal' ? '🏛️' : user?.role === 'HOD' ? '🎓' : '👨‍🏫'}
          </div>
          <div className="overflow-hidden">
            <div className="text-[10px] uppercase font-bold text-slate-400 leading-tight">Active View</div>
            <div className="text-xs font-black text-slate-800 truncate">
              {user?.role === 'Administrator' 
                ? 'System Admin' 
                : user?.role === 'Principal'
                ? 'Principal / IQAC' 
                : user?.role === 'HOD'
                ? 'HOD (CSE Dept)'
                : 'Faculty Member'}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">Criterion 1 Scope</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
              100% Ready
            </span>
          </div>
          <div className="text-slate-500 space-y-0.5 text-[10px]">
            <p>• Weightage: <strong>100 / 1000 Pts</strong></p>
            <p>• Grade Tier: <strong>A++ (3.76 - 4.00)</strong></p>
            <p>• Quality Gate: <strong>12/12 Passed</strong></p>
          </div>
        </div>

        <div className="text-[10px] text-center text-slate-400 font-medium">
          CampusInsight AI v2.4 • NAAC Criterion 1
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
