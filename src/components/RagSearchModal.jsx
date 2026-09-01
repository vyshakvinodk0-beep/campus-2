import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI, searchAPI } from '../services/api';
import { 
  Search, X, Sparkles, FileText, Table, AlertTriangle, Lightbulb, 
  Loader2, ArrowRight, BookOpen, Layers, ShieldCheck, History 
} from 'lucide-react';

const RagSearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'ai'
  const [searchResults, setSearchResults] = useState(null);
  const [aiAnswer, setAiAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSearchResults(null);
      setAiAnswer(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via parent
          const event = new CustomEvent('open-rag-search');
          window.dispatchEvent(event);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      if (activeTab === 'search') {
        const res = await searchAPI.globalSearch(query.trim());
        setSearchResults(res.data?.results || {});
      } else {
        const res = await documentAPI.ragQuery(query.trim());
        setAiAnswer(res.data);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <form onSubmit={handleSearch} className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={activeTab === 'search' ? "Search metrics, documents, evidence, gaps..." : "Ask AI: 'What evidence is missing for PO-CO attainment in 1.1?'"}
              className="w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
            />
          </form>
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSearchResults(null); setAiAnswer(null); }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Esc
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold">
          <button
            onClick={() => { setActiveTab('search'); if (query.trim()) handleSearch(); }}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'search' ? 'bg-white text-blue-600 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Keyword & Metadata Search</span>
          </button>
          <button
            onClick={() => { setActiveTab('ai'); if (query.trim()) handleSearch(); }}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ai' ? 'bg-white text-purple-600 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>RAG AI Assistant Query</span>
          </button>
        </div>

        {/* Search Results / Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {loading && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-slate-500 font-medium">
                {activeTab === 'search' ? 'Searching institutional index...' : 'Retrieving evidence chunks & synthesizing AI answer...'}
              </p>
            </div>
          )}

          {!loading && !searchResults && !aiAnswer && (
            <div className="py-10 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-600 font-medium">Type a search query or question to get started</p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setQuery('CO-PO Attainment'); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-medium"
                >
                  CO-PO Attainment
                </button>
                <button
                  type="button"
                  onClick={() => { setQuery('BOS Revision Minutes'); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-medium"
                >
                  BOS Revision Minutes
                </button>
                <button
                  type="button"
                  onClick={() => { setQuery('Feedback System 1.4'); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-medium"
                >
                  Feedback System 1.4
                </button>
              </div>
            </div>
          )}

          {/* Keyword Search Results */}
          {!loading && searchResults && (
            <div className="space-y-4">
              {/* Documents */}
              {searchResults.documents?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Documents ({searchResults.documents.length})
                  </span>
                  <div className="space-y-1.5">
                    {searchResults.documents.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => handleNavigate('/documents')}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="font-bold text-slate-900">{doc.title}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-mono">
                            Sub-{doc.sub_criterion}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">{doc.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics */}
              {searchResults.metrics?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Metrics ({searchResults.metrics.length})
                  </span>
                  <div className="space-y-1.5">
                    {searchResults.metrics.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleNavigate('/evidence-matrix')}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Table className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-slate-900">[{m.metric_id}] {m.name}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {m.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gaps */}
              {searchResults.gaps?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Identified Gaps ({searchResults.gaps.length})
                  </span>
                  <div className="space-y-1.5">
                    {searchResults.gaps.map((g) => (
                      <div
                        key={g.id}
                        onClick={() => handleNavigate('/gaps-recommendations')}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span className="font-bold text-slate-900">{g.title}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-mono">
                            Sub-{g.sub_criterion}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-700">{g.severity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No results message */}
              {(!searchResults.documents?.length && !searchResults.metrics?.length && !searchResults.gaps?.length) && (
                <p className="text-center text-slate-500 py-6">No matching items found for "{query}"</p>
              )}
            </div>
          )}

          {/* RAG AI Assistant Answer */}
          {!loading && aiAnswer && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-purple-900 font-bold">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Grounded AI Analysis Answer:</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                  {aiAnswer.answer}
                </p>
              </div>

              {/* Sources & Citations */}
              {aiAnswer.sources?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Grounded Document Citations ({aiAnswer.sources.length})
                  </span>
                  <div className="space-y-1.5">
                    {aiAnswer.sources.map((src, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{src.filename}</span>
                          <span className="text-[10px] font-mono text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            Page {src.page_number}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 italic">"{src.snippet}..."</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Press <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">Enter</kbd> to search</span>
          <span className="flex items-center gap-1 font-semibold text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% Evidence-Grounded Results
          </span>
        </div>

      </div>
    </div>
  );
};

export default RagSearchModal;
