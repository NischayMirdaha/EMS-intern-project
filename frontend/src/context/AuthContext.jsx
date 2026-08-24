import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../api/services";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("ems_token"));
  const [loading, setLoading] = useState(true);

  // Initialize auth state by verifying existing token
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("ems_token");
      const storedUser = localStorage.getItem("ems_user");

      if (storedToken) {
        try {
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          const response = await authApi.getMe();
          if (response.success && response.user) {
            setUser(response.user);
            localStorage.setItem("ems_user", JSON.stringify(response.user));
          }
        } catch (error) {
          console.warn("Session check failed or expired:", error.message);
          localStorage.removeItem("ems_token");
          localStorage.removeItem("ems_user");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem("ems_token", res.token);
      localStorage.setItem("ems_user", JSON.stringify(res.user));
    }
    return res;
  };

  // Register handler
  const register = async (userData) => {
    return await authApi.register(userData);
  };

  // Verify Registration OTP handler
  const verifyRegistrationOtp = async (email, otp) => {
    const res = await authApi.verifyRegistrationOtp({ email, otp });
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem("ems_token", res.token);
      localStorage.setItem("ems_user", JSON.stringify(res.user));
    }
    return res;
  };

  // General Verify OTP handler
  const verifyOtp = async (email, otp) => {
    const res = await authApi.verifyOtp({ email, otp });
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem("ems_token", res.token);
      localStorage.setItem("ems_user", JSON.stringify(res.user));
    }
    return res;
  };

  // Forgot password
  const forgotPassword = async (email) => {
    return await authApi.forgotPassword({ email });
  };

  // Reset password
  const resetPassword = async (email, password) => {
    return await authApi.resetPassword({ email, password });
  };

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem("ems_token");
    localStorage.removeItem("ems_user");
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    role: user?.role || "guest",
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    register,
    verifyRegistrationOtp,
    verifyOtp,
    forgotPassword,
    resetPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
