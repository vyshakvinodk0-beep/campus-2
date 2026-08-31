import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { 
  ShieldCheck, Mail, Lock, AlertCircle, ChevronDown, ChevronUp, Loader2, KeyRound, 
  Send, Eye, EyeOff, UserPlus, User, ArrowRight, FileText, BarChart3, Users, Sparkles,
  CheckCircle2, Shield
} from 'lucide-react';

const Login = () => {
  const { user, loading: authLoading, login, googleOAuth, googleRegister, verifyAndLoginOtp } = useAuth();
  const navigate = useNavigate();

  // Primary Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDemoOptions, setShowDemoOptions] = useState(false);

  // Authentication Method Toggle: 'password' | 'otp'
  const [authMethod, setAuthMethod] = useState('password');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSentState, setOtpSentState] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState(null);
  const [otpError, setOtpError] = useState(null);

  // Timers for OTP
  const [expiryTimeLeft, setExpiryTimeLeft] = useState(0);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);

  // Google OAuth States
  const [googleLoading, setGoogleLoading] = useState(false);
  const [unregisteredGoogleUser, setUnregisteredGoogleUser] = useState(null);

  // Password Renewal Modal States
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState('request');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState(null);

  // Load Google GIS script dynamically if client ID is set
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (googleClientId && !window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    let timer;
    if (expiryTimeLeft > 0) {
      timer = setInterval(() => setExpiryTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [expiryTimeLeft]);

  useEffect(() => {
    let timer;
    if (cooldownTimeLeft > 0) {
      timer = setInterval(() => setCooldownTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownTimeLeft]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F0F6FE] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-600 font-medium">Loading CampusInsight AI...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    if (!cleanEmail || !cleanPassword) {
      setError("Please enter your email or phone number and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(cleanEmail, cleanPassword);
      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401 || err.response?.data?.detail?.includes('credentials')) {
        setError("Email/phone or password is incorrect. Please check or use demo accounts.");
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError("Network connection issue. Please verify your server connection and try again.");
      } else {
        setError(err.response?.data?.detail || "Sign in failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendStandaloneOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = (otpEmail || email).trim();
    if (!cleanEmail) {
      setOtpError("Please enter your email address.");
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    setOtpMessage(null);
    try {
      const res = await authAPI.sendOtp(cleanEmail, 'login');
      setOtpSentState(true);
      setExpiryTimeLeft(900);
      setCooldownTimeLeft(30);
      const code = res.data?.debug_otp;
      if (code) {
        setOtpInput(code);
      }
      setOtpMessage(res.data?.message || `🔑 Verification code dispatched to ${cleanEmail}. (Code: ${code || '123456'})`);
    } catch (err) {
      console.error(err);
      setOtpError(err.response?.data?.detail || "Unable to send verification code. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyStandaloneOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = (otpEmail || email).trim();
    const cleanOtp = otpInput.trim();
    if (!cleanEmail || !cleanOtp) {
      setOtpError("Please enter your 6-digit verification code.");
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    setOtpMessage(null);
    try {
      await verifyAndLoginOtp(cleanEmail, cleanOtp, 'login');
      navigate('/');
    } catch (err) {
      console.error(err);
      setOtpError(err.response?.data?.detail || "Invalid or expired OTP. Please enter 123456 or request a new code.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Official Google OAuth Flow Initiation
  const handleGoogleSignIn = async (directAccount = null) => {
    setError(null);
    setUnregisteredGoogleUser(null);
    setGoogleLoading(true);

    try {
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      // 1. Standard Google Identity Services GIS Flow if script & client ID present
      if (window.google?.accounts?.id && googleClientId && googleClientId !== 'your_google_client_id.apps.googleusercontent.com') {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (response.credential) {
              await processGoogleAuthResponse({ token: response.credential });
            }
          }
        });
        window.google.accounts.id.prompt();
        setGoogleLoading(false);
        return;
      }

      // 2. Direct account provided (e.g. via test option or prompt)
      if (directAccount) {
        await processGoogleAuthResponse(typeof directAccount === 'string' ? { email: directAccount } : directAccount);
        return;
      }

      // 3. Fallback for development / test mode without active Google client secret
      const defaultEmail = email.trim() || 'vyshakvinodk0@gmail.com';
      const promptEmail = window.prompt("Google OAuth 2.0 Sign In:\n\nEnter your Google account email address:", defaultEmail);
      if (!promptEmail || !promptEmail.trim()) {
        setGoogleLoading(false);
        return;
      }

      await processGoogleAuthResponse({ email: promptEmail.trim().toLowerCase() });
    } catch (err) {
      console.error("Google OAuth Error:", err);
      setError(err.response?.data?.detail || err.message || "Google authentication failed.");
      setGoogleLoading(false);
    }
  };

  const processGoogleAuthResponse = async (payload) => {
    setGoogleLoading(true);
    try {
      const res = await googleOAuth(payload);
      if (res && res.access_token) {
        navigate('/');
      } else if (res && res.is_registered) {
        navigate('/');
      } else if (res && !res.is_registered) {
        await googleRegister(res.google_email || res.email, res.google_name || res.full_name, 'Computer Science & Engineering');
        navigate('/');
      }
    } catch (err) {
      console.error("Backend Google OAuth verification error:", err);
      setError(err.response?.data?.detail || "Google OAuth verification failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCreateFacultyAccount = async () => {
    if (!unregisteredGoogleUser) return;
    setGoogleLoading(true);
    setError(null);
    try {
      await googleRegister(unregisteredGoogleUser.email, unregisteredGoogleUser.full_name, 'Computer Science & Engineering');
      navigate('/');
    } catch (err) {
      console.error("Google Registration Error:", err);
      setError(err.response?.data?.detail || "Failed to register account.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const openResetModal = (prefillEmail = '') => {
    setResetEmail(prefillEmail || email || '');
    setResetOtp('');
    setNewPassword('');
    setResetMessage(null);
    setResetStep('request');
    setIsResetModalOpen(true);
  };

  const handleRequestReset = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = resetEmail.trim();
    if (!cleanEmail) {
      setResetMessage("Please enter your registered email address.");
      return;
    }
    setResetLoading(true);
    setResetMessage(null);
    try {
      const res = await authAPI.requestPasswordReset(cleanEmail);
      setResetStep('verify');
      if (res.data?.debug_otp) {
        setResetOtp(res.data.debug_otp);
      }
      setResetMessage(res.data?.message || `🔑 Security renewal code dispatched to ${cleanEmail}.`);
    } catch (err) {
      console.error(err);
      setResetMessage(err.response?.data?.detail || "Failed to send reset code.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleCompleteReset = async (e) => {
    e.preventDefault();
    const cleanEmail = resetEmail.trim();
    const cleanOtp = resetOtp.trim();
    const cleanPassword = newPassword.trim();
    if (!cleanOtp || !cleanPassword) {
      setResetMessage("Please enter both the OTP code and your new password.");
      return;
    }
    setResetLoading(true);
    setResetMessage(null);
    try {
      await authAPI.resetPassword(cleanEmail, cleanOtp, cleanPassword);
      setIsResetModalOpen(false);
      setEmail(cleanEmail);
      setPassword(cleanPassword);
      await login(cleanEmail, cleanPassword);
      navigate('/');
    } catch (err) {
      console.error(err);
      setResetMessage(err.response?.data?.detail || "Failed to reset password.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setLoading(true);
    setError(null);
    try {
      await login(demoEmail, 'password123');
      navigate('/');
    } catch (err) {
      console.error("Quick demo login error:", err);
      setError("Sign in error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#EBF3FC] flex items-center justify-center p-3 sm:p-6 md:p-8 font-sans">
      {/* Outer Card Container */}
      <div className="w-full max-w-6xl bg-gradient-to-br from-white via-[#F4F9FF] to-[#E9F3FF] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-white/80 p-6 sm:p-10 lg:p-12 relative overflow-hidden flex flex-col lg:flex-row items-stretch justify-between gap-8 lg:gap-12">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: HERO, VALUE PROPOSITIONS & VECTOR ILLUSTRATION */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col justify-between space-y-8 relative z-10">
          
          {/* Logo & Portal Title */}
          <div className="flex items-center space-x-3.5">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 p-0.5 shadow-md shadow-blue-500/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                {/* Wreath & Mortarboard Custom SVG Icon */}
                <svg className="w-7 h-7" viewBox="0 0 48 48" fill="none">
                  {/* Graduation Cap */}
                  <path d="M24 10L6 19L24 28L42 19L24 10Z" fill="#1D4ED8" />
                  <path d="M12 22.5V31.5C12 35 17.5 38 24 38C30.5 38 36 35 36 31.5V22.5" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M40 20.5V29C40 29 39 31 38 31" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
                  {/* Laurel Wreath Accents */}
                  <path d="M8 29C6 33 8 38 12 40" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M40 29C42 33 40 38 36 40" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="24" cy="24" r="3" fill="#38BDF8" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                CampusInsight AI
              </h2>
              <p className="text-xs font-semibold text-blue-600 tracking-wide mt-1">
                NAAC Accreditation Portal
              </p>
            </div>
          </div>

          {/* Main Headline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-slate-900 tracking-tight leading-[1.15]">
              Intelligent Insights.<br />
              <span className="text-blue-600">Stronger</span> Institutions.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-lg">
              AI-powered analysis and evidence management to simplify NAAC accreditation and drive institutional excellence.
            </p>
          </div>

          {/* Feature List (4 items) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5 max-w-lg">
            
            {/* 1. AI-Powered Analysis */}
            <div className="flex items-center space-x-3.5 p-2 rounded-2xl transition-all">
              <div className="w-11 h-11 rounded-2xl bg-blue-100/80 border border-blue-200/60 flex items-center justify-center text-blue-600 shrink-0 shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  AI-Powered Analysis
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Intelligent evaluation and gap identification
                </p>
              </div>
            </div>

            {/* 2. Evidence Management */}
            <div className="flex items-center space-x-3.5 p-2 rounded-2xl transition-all">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100/80 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  Evidence Management
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Organize, validate and track all evidence
                </p>
              </div>
            </div>

            {/* 3. Real-time Insights */}
            <div className="flex items-center space-x-3.5 p-2 rounded-2xl transition-all">
              <div className="w-11 h-11 rounded-2xl bg-indigo-100/80 border border-indigo-200/60 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  Real-time Insights
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Actionable dashboards and reports
                </p>
              </div>
            </div>

            {/* 4. Secure & Role-based */}
            <div className="flex items-center space-x-3.5 p-2 rounded-2xl transition-all">
              <div className="w-11 h-11 rounded-2xl bg-amber-100/80 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0 shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  Secure &amp; Role-based
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Role-based access for secure collaboration
                </p>
              </div>
            </div>

          </div>

          {/* Bottom Trust Badge */}
          <div className="pt-2">
            <div className="inline-flex items-center space-x-2.5 px-4 py-2.5 rounded-full bg-white/90 border border-slate-200/80 shadow-xs text-xs font-semibold text-slate-700">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>
                Trusted by Institutions. Driven by <strong className="text-blue-600 font-bold">Intelligence.</strong>
              </span>
            </div>
          </div>

          {/* Artistic Vector Background Artwork (Campus Building + AI Constellation) */}
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-90 hidden lg:block w-[420px] h-[360px] overflow-hidden -z-0">
            <svg viewBox="0 0 400 340" fill="none" className="w-full h-full">
              {/* Dotted Constellation Lines */}
              <path d="M190 60 C 230 40, 280 80, 260 140" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M260 140 C 240 180, 160 170, 150 190" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M260 140 C 310 160, 330 190, 320 220" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="4 4" />

              {/* Glowing Constellation Node Icons */}
              {/* Node 1: Document */}
              <g transform="translate(170, 45)">
                <circle cx="15" cy="15" r="14" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="1.5" />
                <path d="M11 9H17L20 12V21H11V9Z" stroke="#3B82F6" strokeWidth="1.2" fill="none" />
                <line x1="13" y1="14" x2="18" y2="14" stroke="#93C5FD" strokeWidth="1.2" />
                <line x1="13" y1="17" x2="18" y2="17" stroke="#93C5FD" strokeWidth="1.2" />
              </g>

              {/* Node 2: AI Brain */}
              <g transform="translate(235, 115)">
                <circle cx="22" cy="22" r="22" fill="#FFFFFF" stroke="#60A5FA" strokeWidth="1.5" />
                <path d="M16 16C14 18 14 26 16 28M28 16C30 18 30 26 28 28M22 14V30M16 22H28" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="16" cy="18" r="1.5" fill="#3B82F6" />
                <circle cx="28" cy="18" r="1.5" fill="#3B82F6" />
                <circle cx="22" cy="22" r="2" fill="#2563EB" />
              </g>

              {/* Node 3: Check Shield */}
              <g transform="translate(135, 175)">
                <circle cx="14" cy="14" r="14" fill="#FFFFFF" stroke="#5EEAD4" strokeWidth="1.5" />
                <path d="M14 8L9 10.5V15C9 18 11.5 20.5 14 21.5C16.5 20.5 19 18 19 15V10.5L14 8Z" stroke="#0D9488" strokeWidth="1.3" fill="none" />
                <path d="M12 14.5L13.5 16L16.5 13" stroke="#0D9488" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              {/* Node 4: Charts */}
              <g transform="translate(300, 205)">
                <circle cx="14" cy="14" r="14" fill="#FFFFFF" stroke="#C4B5FD" strokeWidth="1.5" />
                <rect x="9" y="16" width="2" height="6" fill="#7C3AED" rx="0.5" />
                <rect x="13" y="13" width="2" height="9" fill="#7C3AED" rx="0.5" />
                <rect x="17" y="10" width="2" height="12" fill="#7C3AED" rx="0.5" />
              </g>

              {/* Layered Hills & Campus Landscape */}
              <path d="M50 340 C 120 280, 240 270, 400 320 L 400 340 Z" fill="#BFDBFE" opacity="0.6" />
              <path d="M0 340 C 100 290, 200 300, 380 340 Z" fill="#93C5FD" opacity="0.4" />

              {/* Soft Trees */}
              <circle cx="110" cy="285" r="18" fill="#60A5FA" opacity="0.7" />
              <circle cx="130" cy="280" r="22" fill="#3B82F6" opacity="0.6" />
              <circle cx="150" cy="290" r="16" fill="#60A5FA" opacity="0.7" />
              <circle cx="340" cy="285" r="20" fill="#60A5FA" opacity="0.7" />
              <circle cx="365" cy="290" r="16" fill="#3B82F6" opacity="0.6" />

              {/* Classical University Building */}
              <g transform="translate(170, 200)">
                {/* Roof & Pediment */}
                <polygon points="60,35 15,60 105,60" fill="#3B82F6" />
                <rect x="56" y="18" width="8" height="18" fill="#1E40AF" />
                {/* Flag */}
                <line x1="60" y1="18" x2="60" y2="4" stroke="#1E40AF" strokeWidth="1.5" />
                <polygon points="60,4 72,9 60,14" fill="#2563EB" />

                {/* Building Base & Columns */}
                <rect x="20" y="60" width="80" height="60" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="1" />
                {/* 4 Classical Columns */}
                <rect x="26" y="65" width="6" height="50" fill="#DBEAFE" rx="1" />
                <rect x="42" y="65" width="6" height="50" fill="#DBEAFE" rx="1" />
                <rect x="72" y="65" width="6" height="50" fill="#DBEAFE" rx="1" />
                <rect x="88" y="65" width="6" height="50" fill="#DBEAFE" rx="1" />

                {/* Main Door */}
                <path d="M54 85 C 54 80, 66 80, 66 85 V 120 H 54 Z" fill="#1D4ED8" />

                {/* Pediment Arch Window */}
                <circle cx="60" cy="50" r="4" fill="#DBEAFE" />
              </g>

              {/* Winding Campus Pathway */}
              <path d="M230 320 C 225 300, 235 285, 230 270 C 228 265, 226 260, 226 260 L 234 260 C 234 260, 238 265, 240 270 C 248 290, 255 305, 270 340 Z" fill="#FFFFFF" opacity="0.9" />
            </svg>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: SLEEK DARK NAVY LOGIN CARD */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-[420px] shrink-0 bg-[#0B1528] rounded-[2rem] p-7 sm:p-9 text-white shadow-2xl border border-slate-800/80 flex flex-col justify-between space-y-6 relative z-20">
          
          {/* Card Header */}
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-[26px] font-black text-white tracking-tight flex items-center gap-2">
              <span>Welcome Back!</span>
              <span className="text-xl">👋</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Sign in to continue to CampusInsight AI
            </p>
          </div>

          {/* Alerts & Notifications */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium space-y-1">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Unregistered Google User Notice */}
          {unregisteredGoogleUser && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2.5">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-200">Google account not registered yet.</p>
                  <p className="text-[11px] text-amber-300/80 font-mono mt-0.5">{unregisteredGoogleUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCreateFacultyAccount}
                disabled={googleLoading}
                className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {googleLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create Faculty Account</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* AUTHENTICATION METHOD 1: PASSWORD LOGIN */}
          {authMethod === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              
              {/* Email / Phone Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Email or phone number
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter email or phone number"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#121E36] border border-slate-700/70 text-white placeholder:text-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#121E36] border border-slate-700/70 text-white placeholder:text-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center space-x-2 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-[#121E36] border-slate-700 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                    Remember me
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => openResetModal(email)}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Primary Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 active:from-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-1"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* AUTHENTICATION METHOD 2: OTP EMAIL LOGIN */}
          {authMethod === 'otp' && (
            <div className="space-y-4">
              {otpMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{otpMessage}</span>
                </div>
              )}

              {otpError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{otpError}</span>
                </div>
              )}

              {!otpSentState ? (
                <form onSubmit={handleSendStandaloneOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300">
                      Institutional Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="user@institution.edu or name@gmail.com"
                        value={otpEmail || email}
                        onChange={(e) => {
                          setOtpEmail(e.target.value);
                          setEmail(e.target.value);
                        }}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#121E36] border border-slate-700/70 text-white placeholder:text-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {otpLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send 6-Digit OTP Code</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyStandaloneOtp} className="space-y-4">
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs space-y-1">
                    <div className="flex items-center justify-between text-blue-200 font-bold">
                      <span className="truncate">To: {(otpEmail || email)}</span>
                      {expiryTimeLeft > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-mono font-bold shrink-0">
                          ⏱️ {formatTimer(expiryTimeLeft)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate-300">6-Digit Security OTP</label>
                      <button
                        type="button"
                        onClick={handleSendStandaloneOtp}
                        disabled={otpLoading || cooldownTimeLeft > 0}
                        className="text-[11px] font-bold text-blue-400 hover:underline disabled:text-slate-600"
                      >
                        {cooldownTimeLeft > 0 ? `Resend in ${cooldownTimeLeft}s` : 'Resend Code'}
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full py-3 px-4 text-center font-mono text-xl tracking-[0.5em] font-bold rounded-xl bg-[#121E36] border border-slate-700/70 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSentState(false);
                        setOtpInput('');
                        setOtpError(null);
                        setOtpMessage(null);
                      }}
                      className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={otpLoading || otpInput.length !== 6}
                      className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      {otpLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Verify &amp; Sign In</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Divider: OR */}
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-[#0B1528] px-3 font-semibold text-slate-500">OR</span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={() => handleGoogleSignIn()}
            disabled={googleLoading}
            className="w-full py-3 px-4 rounded-xl bg-[#121E36] hover:bg-[#182744] active:bg-[#1e3054] text-slate-200 font-semibold text-xs border border-slate-700/80 transition-all flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <>
                <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {/* Switch Auth Method Link */}
          <div className="text-center pt-0.5">
            <button
              type="button"
              onClick={() => {
                setAuthMethod(authMethod === 'password' ? 'otp' : 'password');
                setError(null);
              }}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
            >
              {authMethod === 'password' ? (
                <>
                  <Mail className="w-3.5 h-3.5" />
                  <span>Switch to Email OTP Sign In</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Switch to Password Sign In</span>
                </>
              )}
            </button>
          </div>

          {/* Collapsible Demo Accounts Section */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <button
              type="button"
              onClick={() => setShowDemoOptions(!showDemoOptions)}
              className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
            >
              <span>DEMO ACCOUNTS</span>
              {showDemoOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
            </button>

            {showDemoOptions && (
              <div className="space-y-2 pt-1 animate-fadeIn">
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button 
                    type="button" 
                    onClick={() => handleQuickDemo('admin@campusinsight.edu')} 
                    className="p-2 rounded-xl bg-[#121E36] hover:bg-purple-950/40 text-purple-300 border border-purple-900/30 text-left transition-colors cursor-pointer"
                  >
                    🔑 System Admin
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleQuickDemo('principal@campusinsight.edu')} 
                    className="p-2 rounded-xl bg-[#121E36] hover:bg-amber-950/40 text-amber-300 border border-amber-900/30 text-left transition-colors cursor-pointer"
                  >
                    🏛️ Principal / IQAC
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleQuickDemo('hod.cse@campusinsight.edu')} 
                    className="p-2 rounded-xl bg-[#121E36] hover:bg-blue-950/40 text-blue-300 border border-blue-900/30 text-left transition-colors cursor-pointer"
                  >
                    🎓 HOD (CSE)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleQuickDemo('faculty@campusinsight.edu')} 
                    className="p-2 rounded-xl bg-[#121E36] hover:bg-emerald-950/40 text-emerald-300 border border-emerald-900/30 text-left transition-colors cursor-pointer"
                  >
                    👨‍🏫 Faculty
                  </button>
                </div>

                {/* Quick Google Test Account Selector */}
                <div className="p-2 bg-[#121E36]/70 rounded-xl border border-slate-700/50 text-[10.5px] space-y-1 mt-1">
                  <span className="font-semibold text-slate-400 block">Google OAuth Test Accounts:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button type="button" onClick={() => handleGoogleSignIn('faculty@campusinsight.edu')} className="p-1 bg-[#1A2846] hover:bg-emerald-900/30 text-emerald-300 rounded font-medium text-left">
                      Google: Faculty
                    </button>
                    <button type="button" onClick={() => handleGoogleSignIn('hod.cse@campusinsight.edu')} className="p-1 bg-[#1A2846] hover:bg-blue-900/30 text-blue-300 rounded font-medium text-left">
                      Google: HOD
                    </button>
                    <button type="button" onClick={() => handleGoogleSignIn('principal@campusinsight.edu')} className="p-1 bg-[#1A2846] hover:bg-amber-900/30 text-amber-300 rounded font-medium text-left">
                      Google: Principal
                    </button>
                    <button type="button" onClick={() => handleGoogleSignIn('admin@campusinsight.edu')} className="p-1 bg-[#1A2846] hover:bg-purple-900/30 text-purple-300 rounded font-medium text-left">
                      Google: Admin
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Signup Link */}
          <div className="text-center text-xs text-slate-400 font-normal pt-1">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 font-bold hover:underline">
              Sign up
            </Link>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* PASSWORD RESET MODAL */}
      {/* ========================================================================= */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-7 space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-slate-900">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base">Renew / Reset Password</h3>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {resetMessage && (
              <div className={`p-3 rounded-xl text-xs font-medium border flex items-center space-x-2 ${
                resetMessage.includes('successful') || resetMessage.includes('dispatched') || resetMessage.includes('sent')
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetMessage}</span>
              </div>
            )}

            {resetStep === 'request' ? (
              <form onSubmit={handleRequestReset} className="space-y-4 text-xs">
                <p className="text-slate-600">
                  Enter your registered institutional email address to send a 6-digit Security Renewal OTP code.
                </p>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Registered Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="user@institution.edu or name@gmail.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                  >
                    {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Send Renewal OTP</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCompleteReset} className="space-y-4 text-xs">
                <p className="text-slate-600">
                  Enter the 6-digit Security OTP sent to <b>{resetEmail}</b>, then enter your new password.
                </p>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">6-Digit Security OTP Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 849201"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 tracking-widest text-center text-sm focus:outline-none focus:border-blue-500 bg-blue-50/50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new strong password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setResetStep('request')}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Resend Code
                  </button>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsResetModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                    >
                      {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                      <span>Renew Password</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
