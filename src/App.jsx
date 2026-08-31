import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import RagSearchModal from './components/RagSearchModal';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EvidenceMatrixPage from './pages/EvidenceMatrixPage';
import CriterionDetail from './pages/CriterionDetail';
import DocumentsPage from './pages/DocumentsPage';
import GapAnalysisPage from './pages/GapAnalysisPage';
import ReportsPage from './pages/ReportsPage';
import UserManagementPage from './pages/UserManagementPage';

import AccreditationInboxPage from './pages/AccreditationInboxPage';
import TrustCenterPage from './pages/TrustCenterPage';

import ErrorBoundary from './components/ErrorBoundary';

const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-medium">
        Loading CampusInsight AI...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {isDemoMode && (
        <div className="bg-amber-500 text-slate-950 font-black text-xs py-1.5 px-4 text-center tracking-wider uppercase shadow-inner flex items-center justify-center gap-2">
          <span>⚠️ DEMO DATA – NOT REAL INSTITUTIONAL EVIDENCE</span>
        </div>
      )}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        isDemoMode={isDemoMode}
        onToggleDemoMode={() => setIsDemoMode(!isDemoMode)}
      />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard isDemoMode={isDemoMode} />} />
              <Route path="/evidence-matrix" element={<EvidenceMatrixPage isDemoMode={isDemoMode} />} />
              <Route path="/sub-criterion/:code" element={<CriterionDetail isDemoMode={isDemoMode} />} />
              <Route path="/documents" element={<DocumentsPage isDemoMode={isDemoMode} />} />
              <Route path="/gaps-recommendations" element={<GapAnalysisPage isDemoMode={isDemoMode} />} />
              <Route path="/inbox" element={<AccreditationInboxPage />} />
              <Route path="/trust-center" element={<TrustCenterPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/manage-users" element={<UserManagementPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
      <RagSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
