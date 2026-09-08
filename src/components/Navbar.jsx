import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { 
  Search, ShieldCheck, LogOut, User, Sparkles, Building2, 
  ChevronDown, CheckCircle2, Shield, Layers 
} from 'lucide-react';

const Navbar = ({ onOpenSearch, isDemoMode, onToggleDemoMode }) => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

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

        {/* Right: Quality Gate Pill, Notifications & User Info */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick Role Persona Switcher Pill (Desktop) */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 text-xs">
            <span className="text-[10px] font-black uppercase text-slate-400 px-1.5 tracking-wider">Role</span>
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
                  title={`Switch active persona to ${roleItem.id}`}
                >
                  <span className="text-[10px]">{roleItem.icon}</span>
                  <span>{roleItem.label}</span>
                </button>
              );
            })}
          </div>

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
              className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-2xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {user?.full_name || 'Faculty Member'}
                </div>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border ${getRoleBadgeColor(user?.role)}`}>
                  {user?.role || 'Faculty'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400 font-medium">{user?.department}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getRoleBadgeColor(user?.role)}`}>
                      {user?.role}
                    </span>
                  </div>
                </div>

                {/* Quick Persona Switcher inside Dropdown */}
                <div className="p-2 my-1 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Switch Role Persona
                    </span>
                    <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1 rounded border border-blue-200">
                      Demo
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-bold">
                    <button
                      type="button"
                      disabled={switchingRole}
                      onClick={() => handleRoleSwitch('Administrator')}
                      className={`p-1.5 rounded-lg text-left transition-all cursor-pointer flex items-center gap-1.5 ${
                        user?.role === 'Administrator'
                          ? 'bg-purple-100 text-purple-900 font-black border border-purple-300'
                          : 'text-slate-700 hover:bg-white'
                      }`}
                    >
                      <span className="text-xs">🔑</span>
                      <span className="truncate">Admin</span>
                    </button>
                    <button
                      type="button"
                      disabled={switchingRole}
                      onClick={() => handleRoleSwitch('Principal')}
                      className={`p-1.5 rounded-lg text-left transition-all cursor-pointer flex items-center gap-1.5 ${
                        user?.role === 'Principal'
                          ? 'bg-amber-100 text-amber-900 font-black border border-amber-300'
                          : 'text-slate-700 hover:bg-white'
                      }`}
                    >
                      <span className="text-xs">🏛️</span>
                      <span className="truncate">Principal</span>
                    </button>
                    <button
                      type="button"
                      disabled={switchingRole}
                      onClick={() => handleRoleSwitch('HOD')}
                      className={`p-1.5 rounded-lg text-left transition-all cursor-pointer flex items-center gap-1.5 ${
                        user?.role === 'HOD'
                          ? 'bg-blue-100 text-blue-900 font-black border border-blue-300'
                          : 'text-slate-700 hover:bg-white'
                      }`}
                    >
                      <span className="text-xs">🎓</span>
                      <span className="truncate">HOD</span>
                    </button>
                    <button
                      type="button"
                      disabled={switchingRole}
                      onClick={() => handleRoleSwitch('Faculty')}
                      className={`p-1.5 rounded-lg text-left transition-all cursor-pointer flex items-center gap-1.5 ${
                        user?.role === 'Faculty'
                          ? 'bg-emerald-100 text-emerald-900 font-black border border-emerald-300'
                          : 'text-slate-700 hover:bg-white'
                      }`}
                    >
                      <span className="text-xs">👨‍🏫</span>
                      <span className="truncate">Faculty</span>
                    </button>
                  </div>
                </div>
                
                <div className="py-1">
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

                <div className="pt-1 border-t border-slate-100">
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
