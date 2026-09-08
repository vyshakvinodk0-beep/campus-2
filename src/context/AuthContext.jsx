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

  const switchRole = async (targetRole) => {
    const roleEmailMap = {
      'Administrator': 'admin@campusinsight.edu',
      'Admin': 'admin@campusinsight.edu',
      'Principal': 'principal@campusinsight.edu',
      'HOD': 'hod.cse@campusinsight.edu',
      'Faculty': 'faculty@campusinsight.edu'
    };
    const email = roleEmailMap[targetRole] || 'faculty@campusinsight.edu';
    return await login(email, 'password123');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem('logged_out', 'true');
    setUser(null);
  };


  return (
    <AuthContext.Provider value={{ user, loading, login, googleOAuth, googleRegister, googleLogin, register, verifyAndLoginOtp, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );

};

export const useAuth = () => useContext(AuthContext);
