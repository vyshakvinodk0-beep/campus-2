import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
        } catch (err) {
          console.warn("Stored session expired or invalid. Resetting session token.");
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
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

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
  };


  return (
    <AuthContext.Provider value={{ user, loading, login, googleOAuth, googleRegister, googleLogin, register, verifyAndLoginOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );

};

export const useAuth = () => useContext(AuthContext);
