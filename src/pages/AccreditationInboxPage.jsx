import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inboxAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Inbox, Mail, CheckCircle2, AlertCircle, ArrowRight, Clock, 
  Send, RefreshCw, Filter, Shield, FileText, Check, Plus, X 
} from 'lucide-react';

const AccreditationInboxPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeData, setComposeData] = useState({
    recipient_role: 'HOD',
    category: 'Approval',
    subject: '',
    body: ''
  });
  const [sending, setSending] = useState(false);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const res = await inboxAPI.getInbox();
      setMessages(res.data || []);
    } catch (err) {
      console.error('Failed to fetch inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await inboxAPI.markRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!composeData.subject.trim() || !composeData.body.trim()) return;
    setSending(true);
    try {
      await inboxAPI.sendMessage(composeData);
      setShowComposeModal(false);
      setComposeData({ recipient_role: 'HOD', category: 'Approval', subject: '', body: '' });
      fetchInbox();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to dispatch task');
    } finally {
      setSending(false);
    }
  };

  const filteredMessages = filterCategory === 'All'
    ? messages
    : messages.filter(m => m.category === filterCategory);

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'Approval':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Alert':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Task':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Governance & Workflow
            </span>
            <span className="text-xs text-slate-500 font-medium">Task & Review Center</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Accreditation Inbox & Tasks</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-specific workflow queue, evidence approval alerts, and institutional accreditation notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowComposeModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Dispatch Task</span>
          </button>
          <button
            onClick={fetchInbox}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            title="Refresh Inbox"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold">
        {['All', 'Approval', 'Task', 'Alert', 'Governance'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              filterCategory === cat
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {cat} {cat === 'All' ? `(${messages.length})` : ''}
          </button>
        ))}
      </div>

      {/* Message List */}
      <div className="space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-2 shadow-xs">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">Your Accreditation Inbox is Clear</p>
            <p className="text-xs text-slate-500">No pending workflow messages in this category.</p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`p-5 rounded-2xl bg-white border transition-all shadow-xs space-y-3 ${
                msg.is_read ? 'border-slate-200' : 'border-blue-300 bg-blue-50/20'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadge(msg.category)}`}>
                    {msg.category}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-sm">{msg.subject}</h3>
                  {!msg.is_read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  )}
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[11px] font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(msg.created_at).toLocaleDateString()}
                  </span>
                  <span>From: <strong className="text-slate-700">{msg.sender_name}</strong></span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {msg.body}
              </p>

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-slate-500 font-medium">
                  Target Recipient: <span className="font-bold text-slate-800">{msg.recipient_role}</span>
                </div>
                <div className="flex items-center gap-2">
                  {!msg.is_read && (
                    <button
                      onClick={() => handleMarkRead(msg.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Read</span>
                    </button>
                  )}
                  {msg.target_type === 'Document' && (
                    <button
                      onClick={() => navigate('/documents')}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                    >
                      <span>Review Document</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dispatch Task Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                <span>Dispatch Workflow Task / Notice</span>
              </h3>
              <button onClick={() => setShowComposeModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Recipient Role</label>
                  <select
                    value={composeData.recipient_role}
                    onChange={(e) => setComposeData({ ...composeData, recipient_role: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-medium bg-white focus:outline-none"
                  >
                    <option value="Faculty">Faculty Members</option>
                    <option value="HOD">Head of Department (HOD)</option>
                    <option value="Principal">Principal</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={composeData.category}
                    onChange={(e) => setComposeData({ ...composeData, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-medium bg-white focus:outline-none"
                  >
                    <option value="Approval">Approval Request</option>
                    <option value="Task">Action Task</option>
                    <option value="Alert">Alert</option>
                    <option value="Governance">Governance Notice</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  placeholder="E.g. Upload BOS Minutes for Academic Year 2024-25"
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Instructions & Context</label>
                <textarea
                  required
                  rows={4}
                  value={composeData.body}
                  onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                  placeholder="Provide precise requirements for the evidence upload or validation..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {sending ? 'Dispatching...' : 'Dispatch Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AccreditationInboxPage;
