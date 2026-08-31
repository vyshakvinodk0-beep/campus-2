import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, AlertCircle, Clock, ArrowRight, ShieldCheck, X, Check, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const LoginAttentionModal = ({ popupData, onClose }) => {
  const navigate = useNavigate();
  if (!popupData || !popupData.show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-100 text-amber-700">🔔</span>
            {popupData.title || "Actions Require Your Attention"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 font-medium">
          {popupData.summary}
        </p>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Later
          </button>
          <button
            onClick={() => {
              onClose();
              navigate(popupData.action_url || '/documents');
            }}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>{popupData.action_text || "Review Now"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState({ unread_count: 0, action_required: [], recent_activity: [], system_alerts: [], login_popup: null });
  const [showPopup, setShowPopup] = useState(false);
  const panelRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getNotifications();
      if (res.data) {
        setData({
          unread_count: res.data.unread_count || 0,
          action_required: res.data.action_required || [],
          recent_activity: res.data.recent_activity || [],
          system_alerts: res.data.system_alerts || [],
          login_popup: res.data.login_popup || null
        });
      }
      if (res.data?.login_popup?.show) {
        // Show login attention popup once per session if pending tasks exist
        const hasSeenPopup = sessionStorage.getItem(`seen_login_popup_${user?.id}`);
        if (!hasSeenPopup) {
          setShowPopup(true);
          sessionStorage.setItem(`seen_login_popup_${user?.id}`, 'true');
        }
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [user]);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setData(prev => ({
        ...prev,
        unread_count: 0,
        action_required: (prev.action_required || []).map(item => ({ ...item, is_read: true })),
        system_alerts: (prev.system_alerts || []).map(item => ({ ...item, is_read: true }))
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleActionClick = (url) => {
    setIsOpen(false);
    navigate(url || '/documents');
  };

  return (
    <>
      <div className="relative" ref={panelRef}>
        {/* BELL TRIGGER BUTTON */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 cursor-pointer flex items-center justify-center"
          title="Role Notifications & Action Alerts"
        >
          <Bell className="w-5 h-5 text-slate-700" />
          {data.unread_count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 min-w-[18px] h-[18px] rounded-full bg-rose-600 text-white font-extrabold text-[10px] flex items-center justify-center shadow-md animate-pulse">
              {data.unread_count}
            </span>
          )}
        </button>

        {/* NOTIFICATION PANEL */}
        {isOpen && (
          <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-2xl z-50 overflow-hidden text-xs">
            
            {/* Panel Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-400" />
                <h3 className="font-extrabold text-sm">Notifications & Action Alerts</h3>
                {data.unread_count > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[10px]">
                    {data.unread_count} new
                  </span>
                )}
              </div>
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-purple-300 hover:text-white font-semibold transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
              
              {/* SECTION 1 — ACTION REQUIRED */}
              <div className="p-3 bg-amber-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[10px] uppercase tracking-wider text-amber-900 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    ACTION REQUIRED ({data.action_required.length})
                  </span>
                </div>

                {data.action_required.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic p-2 bg-white rounded-xl border border-amber-100">
                    ✓ No pending tasks require your action right now.
                  </p>
                ) : (
                  data.action_required.map(item => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-white border border-amber-200 shadow-xs space-y-1.5 transition-all hover:border-amber-400"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase ${
                          item.priority === 'URGENT' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {item.priority}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {item.sub_criterion ? `Sub-${item.sub_criterion}` : 'Criterion 1'}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                      <p className="text-[11px] text-slate-600 leading-snug">{item.message}</p>

                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => handleActionClick(item.action_url)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 transition-all shadow-xs"
                        >
                          <span>{item.action_text || 'Take Action'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* SECTION 2 — SYSTEM ALERTS */}
              {data.system_alerts.length > 0 && (
                <div className="p-3 bg-slate-50 space-y-2">
                  <span className="font-extrabold text-[10px] uppercase tracking-wider text-purple-900 block">
                    SYSTEM & GOVERNANCE ALERTS
                  </span>
                  {data.system_alerts.map(item => (
                    <div key={item.id} className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] space-y-1">
                      <p className="font-bold text-slate-900">{item.title}</p>
                      <p className="text-slate-600">{item.message}</p>
                      <button
                        onClick={() => handleActionClick(item.action_url)}
                        className="text-purple-700 hover:text-purple-900 font-bold text-[10px] flex items-center gap-1 mt-1"
                      >
                        <span>{item.action_text}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* SECTION 3 — RECENT ACTIVITY */}
              <div className="p-3 space-y-2">
                <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-500 block">
                  RECENT ACTIVITY
                </span>
                {data.recent_activity.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No recent system activity recorded.</p>
                ) : (
                  data.recent_activity.map(item => (
                    <div key={item.id} className="p-2 rounded-xl hover:bg-slate-50 text-[11px] space-y-0.5">
                      <p className="font-bold text-slate-800">{item.title}</p>
                      <p className="text-slate-500 text-[10px]">{item.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LOGIN ATTENTION POPUP */}
      {showPopup && data.login_popup && (
        <LoginAttentionModal
          popupData={data.login_popup}
          onClose={() => setShowPopup(false)}
        />
      )}
    </>
  );
};

export default NotificationBell;
