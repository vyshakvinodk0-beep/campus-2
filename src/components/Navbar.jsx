import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { 
  Search, ShieldCheck, LogOut, User, Sparkles, Building2, 
  ChevronDown, CheckCircle2, Shield, Layers, FlaskConical, RotateCcw, Info, Check 
} from 'lucide-react';

const Navbar = ({ onOpenSearch, isDemoMode, onToggleDemoMode }) => {
  const { 
    user, 
    logout, 
    switchRole, 
    isSimulating, 
    exitSimulation, 
    sandboxEnabled, 
    toggleSandbox 
  } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [showSandboxTooltip, setShowSandboxTooltip] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRoleSwitch = async (targetRole) => {
    try {
      setSwitchingRole(true);
      await switchRole(targetRole);
    } catch (err) {
      console.error('Role switch error:', err);
    } finally {
      setSwitchingRole(false);
      setShowUserMenu(false);
    }
  };

  const handleExitSimulation = async () => {
    try {
      setSwitchingRole(true);
      await exitSimulation();
    } catch (err) {
      console.error('Exit simulation error:', err);
    } finally {
      setSwitchingRole(false);
      setShowUserMenu(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Administrator':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Principal':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'HOD':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const isSandboxActive = sandboxEnabled || isSimulating || isDemoMode || user?.role === 'Administrator';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 p-0.5 shadow-md shadow-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 48 48" fill="none">
                  <path d="M24 10L6 19L24 28L42 19L24 10Z" fill="#1D4ED8" />
                  <path d="M12 22.5V31.5C12 35 17.5 38 24 38C30.5 38 36 35 36 31.5V22.5" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="24" cy="24" r="3" fill="#38BDF8" />
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900 tracking-tight leading-none">
                  CampusInsight AI
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Criterion 1
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 block leading-tight mt-0.5">
                NAAC Curricular Aspects Intelligence
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search Bar Trigger */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-400 hover:text-slate-600 text-xs font-medium flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span>Search evidence, metrics, documents, RAG query...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-500 shadow-2xs">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Simulation Banner, Quality Gate Pill, Notifications & User Info */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
          {/* Active Simulation Pill */}
          {isSimulating && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-300 rounded-2xl text-xs font-bold text-amber-900 shadow-2xs animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Previewing: <strong className="text-amber-950 font-black">{user?.role}</strong></span>
              <button
                onClick={handleExitSimulation}
                disabled={switchingRole}
                className="ml-1 px-2 py-0.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 text-[10px] font-black transition-colors cursor-pointer disabled:opacity-50"
                title="Exit simulation and return to your authentic account"
              >
                Exit Preview
              </button>
            </div>
          )}

          {/* Quick Role Persona Switcher Pill (Desktop - Visible in Sandbox or for Admin) */}
          {isSandboxActive && (
            <div className="hidden xl:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 text-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 px-1.5 tracking-wider flex items-center gap-1">
                <FlaskConical className="w-3 h-3 text-indigo-500" />
                <span>Persona</span>
              </span>
              {[
                { id: 'Administrator', label: 'Admin', icon: '🔑', activeBg: 'bg-purple-600 text-white' },
                { id: 'Principal', label: 'Principal', icon: '🏛️', activeBg: 'bg-amber-600 text-white' },
                { id: 'HOD', label: 'HOD', icon: '🎓', activeBg: 'bg-blue-600 text-white' },
                { id: 'Faculty', label: 'Faculty', icon: '👨‍🏫', activeBg: 'bg-emerald-600 text-white' }
              ].map((roleItem) => {
                const isActive = user?.role === roleItem.id;
                return (
                  <button
                    key={roleItem.id}
                    type="button"
                    disabled={switchingRole}
                    onClick={() => handleRoleSwitch(roleItem.id)}
                    className={`px-2 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                      isActive
                        ? `${roleItem.activeBg} shadow-xs`
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                    }`}
                    title={`Simulate ${roleItem.id} workflow view`}
                  >
                    <span className="text-[10px]">{roleItem.icon}</span>
                    <span>{roleItem.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search Trigger for Mobile */}
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 md:hidden border border-slate-200"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Quality Gate Status Badge */}
          <Link
            to="/trust-center"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold hover:bg-emerald-100 transition-colors shadow-2xs"
            title="12/12 AI Quality Gate Checks Passed"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>12/12 Quality Gate</span>
          </Link>

          {/* Notification Bell */}
          <NotificationBell />

          {/* User Profile / Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center gap-2.5 p-1.5 pr-2.5 rounded-2xl border transition-all cursor-pointer ${
                isSimulating 
                  ? 'bg-amber-50/80 border-amber-300 hover:bg-amber-100/80'
                  : 'hover:bg-slate-100 border-transparent hover:border-slate-200'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs text-white ${
                user?.role === 'Administrator' ? 'bg-gradient-to-tr from-purple-600 to-indigo-600' :
                user?.role === 'Principal' ? 'bg-gradient-to-tr from-amber-600 to-orange-600' :
                user?.role === 'HOD' ? 'bg-gradient-to-tr from-blue-600 to-sky-600' :
                'bg-gradient-to-tr from-emerald-600 to-teal-600'
              }`}>
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1">
                  <span>{user?.full_name || 'Faculty Member'}</span>
                  {isSimulating && (
                    <span className="px-1 py-0.2 rounded text-[9px] font-extrabold bg-amber-200 text-amber-900">
                      Sim
                    </span>
                  )}
                </div>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border ${getRoleBadgeColor(user?.role)}`}>
                  {user?.role || 'Faculty'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl border border-slate-200 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* User Profile Info Card */}
                <div className="px-3 py-2.5 bg-slate-50/80 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold text-slate-900 truncate">{user?.full_name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${getRoleBadgeColor(user?.role)}`}>
                      {user?.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    Department: <strong className="text-slate-700">{user?.department || 'CSE'}</strong>
                  </p>
                </div>

                {/* Exit Simulation Banner if currently simulating */}
                {isSimulating && (
                  <div className="mt-2 p-2 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Role Preview Active
                      </span>
                      <button
                        onClick={handleExitSimulation}
                        disabled={switchingRole}
                        className="px-2.5 py-1 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 text-[10px] font-black transition-all cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Exit Preview</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Evaluator Persona Sandbox Section */}
                <div className="my-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-[11px] font-black text-slate-800">
                        Evaluator Sandbox
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSandboxTooltip(!showSandboxTooltip)}
                        className="text-slate-400 hover:text-blue-600 transition-colors"
                        title="Why is this switcher here?"
                      >
                        <Info className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSandbox(!isSandboxActive)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                        isSandboxActive 
                          ? 'bg-blue-600 text-white shadow-2xs' 
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {isSandboxActive ? 'Active' : 'Enable'}
                    </button>
                  </div>

                  {showSandboxTooltip && (
                    <div className="p-2 rounded-xl bg-slate-900 text-white text-[10px] leading-relaxed shadow-lg">
                      <p className="font-bold text-blue-300 mb-0.5">Why does this option exist?</p>
                      <p>
                        This Evaluator Sandbox lets accreditation committees and administrators preview the distinct views and permissions for <strong>Faculty, HOD, Principal, and Administrator</strong> without re-entering credentials.
                      </p>
                    </div>
                  )}

                  {/* Switcher Grid: only shown when Sandbox is active or when Admin */}
                  {isSandboxActive && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] font-bold">
                      {[
                        { id: 'Administrator', label: 'Admin', icon: '🔑', desc: 'System & Audit', activeBg: 'bg-purple-100 text-purple-900 border-purple-300' },
                        { id: 'Principal', label: 'Principal', icon: '🏛️', desc: 'SSR Sign-off', activeBg: 'bg-amber-100 text-amber-900 border-amber-300' },
                        { id: 'HOD', label: 'HOD', icon: '🎓', desc: 'BoS Review', activeBg: 'bg-blue-100 text-blue-900 border-blue-300' },
                        { id: 'Faculty', label: 'Faculty', icon: '👨‍🏫', desc: 'Evidence Upload', activeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300' }
                      ].map((item) => {
                        const isCurrent = user?.role === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            disabled={switchingRole}
                            onClick={() => handleRoleSwitch(item.id)}
                            className={`p-2 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between ${
                              isCurrent
                                ? `${item.activeBg} font-black shadow-2xs`
                                : 'bg-white border-slate-200/80 text-slate-700 hover:border-blue-300 hover:bg-blue-50/30'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs">{item.icon}</span>
                              {isCurrent && <Check className="w-3 h-3 text-blue-600" />}
                            </div>
                            <span className="truncate mt-1 text-[11px]">{item.label}</span>
                            <span className="text-[9px] font-normal text-slate-500 truncate">{item.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <div className="py-1 space-y-0.5">
                  <Link
                    to="/trust-center"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>Trust & Quality Gate</span>
                  </Link>

                  {user?.role === 'Administrator' && (
                    <Link
                      to="/manage-users"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <User className="w-4 h-4 text-purple-600" />
                      <span>Manage Users</span>
                    </Link>
                  )}
                </div>

                <div className="pt-1.5 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
