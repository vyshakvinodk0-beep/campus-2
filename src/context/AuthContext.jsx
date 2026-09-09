import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const isExplicitLoggedOut = sessionStorage.getItem('logged_out') === 'true';
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
        } catch (err) {
          console.warn("Stored session expired or invalid. Resetting session token.");
          localStorage.removeItem('token');
          if (!isExplicitLoggedOut) {
            try {
              const res = await authAPI.login('vyshakvinodk0@gmail.com', 'password123');
              localStorage.setItem('token', res.data.access_token);
              setUser(res.data.user);
            } catch (loginErr) {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } else if (!isExplicitLoggedOut) {
        // Auto-seed initial admin session so the application is immediately ready without 401 walls
        try {
          const res = await authAPI.login('vyshakvinodk0@gmail.com', 'password123');
          localStorage.setItem('token', res.data.access_token);
          setUser(res.data.user);
        } catch (loginErr) {
          try {
            const fallbackRes = await authAPI.login('admin@campusinsight.edu', 'password123');
            localStorage.setItem('token', fallbackRes.data.access_token);
            setUser(fallbackRes.data.user);
          } catch (e) {
            setUser(null);
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (emailOrUser, passwordOrToken) => {
    sessionStorage.removeItem('logged_out');
    // If called as login(userObj, token) from registration or external flows
    if (typeof emailOrUser === 'object' && emailOrUser !== null) {
      if (passwordOrToken) {
        localStorage.setItem('token', passwordOrToken);
      }
      setUser(emailOrUser);
      return emailOrUser;
    }

    const res = await authAPI.login(emailOrUser, passwordOrToken);
    localStorage.setItem('token', res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    localStorage.setItem('token', res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  };

  const googleOAuth = async (payload) => {
    const res = await authAPI.googleOAuth(payload);
    if (res.data && res.data.is_registered && res.data.access_token) {
      localStorage.setItem('token', res.data.access_token);
      setUser(res.data.user);
    }
    return res.data;
  };

  const googleRegister = async (email, fullName, department = 'Computer Science & Engineering', token = null) => {
    const res = await authAPI.googleRegister(email, fullName, department, token);
    if (res.data && res.data.access_token) {
      localStorage.setItem('token', res.data.access_token);
      setUser(res.data.user);
    }
    return res.data.user;
  };

  const googleLogin = async (email, fullName, role = 'Faculty', department = 'Computer Science & Engineering', token = null) => {
    const res = await authAPI.googleLogin(email, fullName, role, department, token);
    localStorage.setItem('token', res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  };


  const verifyAndLoginOtp = async (email, otp, purpose = 'verification') => {
    const res = await authAPI.verifyOtp(email, otp, purpose);
    if (res.data && res.data.access_token) {
      localStorage.setItem('token', res.data.access_token);
      setUser(res.data.user);
    }
    return res.data;
  };

  const [isSimulating, setIsSimulating] = useState(() => {
    return !!localStorage.getItem('sim_original_token');
  });
  const [sandboxEnabled, setSandboxEnabled] = useState(() => {
    return localStorage.getItem('eval_sandbox_enabled') === 'true';
  });

  const toggleSandbox = (enabled) => {
    const nextVal = typeof enabled === 'boolean' ? enabled : !sandboxEnabled;
    setSandboxEnabled(nextVal);
    localStorage.setItem('eval_sandbox_enabled', String(nextVal));
  };

  const switchRole = async (targetRole) => {
    const roleEmailMap = {
      'Administrator': 'admin@campusinsight.edu',
      'Admin': 'admin@campusinsight.edu',
      'Principal': 'principal@campusinsight.edu',
      'HOD': 'hod.cse@campusinsight.edu',
      'Faculty': 'vyshakvinodk0@gmail.com'
    };
    const email = roleEmailMap[targetRole] || 'vyshakvinodk0@gmail.com';

    // If starting a simulation, save original token and identity
    const currentToken = localStorage.getItem('token');
    if (!isSimulating && currentToken) {
      localStorage.setItem('sim_original_token', currentToken);
      if (user) {
        localStorage.setItem('sim_original_user', JSON.stringify(user));
      }
      setIsSimulating(true);
    }

    return await login(email, 'password123');
  };

  const exitSimulation = async () => {
    const originalToken = localStorage.getItem('sim_original_token');
    const originalUserStr = localStorage.getItem('sim_original_user');
    
    localStorage.removeItem('sim_original_token');
    localStorage.removeItem('sim_original_user');
    setIsSimulating(false);

    if (originalToken && originalUserStr) {
      try {
        localStorage.setItem('token', originalToken);
        const parsed = JSON.parse(originalUserStr);
        setUser(parsed);
        const res = await authAPI.getMe();
        if (res.data) setUser(res.data);
        return;
      } catch (err) {
        console.warn('Failed restoring original session from token:', err);
      }
    }

    // Default fallback: login as original primary admin
    try {
      const res = await authAPI.login('vyshakvinodk0@gmail.com', 'password123');
      localStorage.setItem('token', res.data.access_token);
      setUser(res.data.user);
    } catch (e) {
      // Re-fetch me
      try {
        const meRes = await authAPI.getMe();
        setUser(meRes.data);
      } catch {
        setUser(null);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('sim_original_token');
    localStorage.removeItem('sim_original_user');
    setIsSimulating(false);
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem('logged_out', 'true');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      googleOAuth, 
      googleRegister, 
      googleLogin, 
      register, 
      verifyAndLoginOtp, 
      logout, 
      switchRole,
      isSimulating,
      exitSimulation,
      sandboxEnabled,
      toggleSandbox
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
