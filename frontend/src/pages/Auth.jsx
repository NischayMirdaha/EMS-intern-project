import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  Shield,
  KeyRound,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  School,
} from "lucide-react";

export const Auth = ({ onSuccess, onCancel }) => {
  const { login, register, verifyRegistrationOtp, verifyOtp, forgotPassword, resetPassword } =
    useAuth();
  const toast = useToast();

  // Mode: 'login' | 'register' | 'verify-otp' | 'forgot-password' | 'reset-password'
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Form Fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [adminSecret, setAdminSecret] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Quick-fill demo credentials
  const handleQuickFillTeacher = () => {
    setEmail("1nother1ccount@gmail.com");
    setPassword("Teacher@123");
    setMode("login");
    setErrorMessage("");
    toast.info("Teacher credentials filled.");
  };

  const handleQuickFillStudent = () => {
    setEmail("ram@gmail.com");
    setPassword("User@1234");
    setMode("login");
    setErrorMessage("");
    toast.info("User credentials filled.");
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      if (mode === "login") {
        const res = await login(email.trim(), password);
        if (res.success) {
          toast.success(`Welcome back, ${res.user?.username || "User"}!`);
          if (onSuccess) onSuccess();
        }
      } else if (mode === "register") {
        const payload = {
          username: username.trim(),
          email: email.trim(),
          password,
          role,
          ...(adminSecret ? { adminSecret } : {}),
        };
        const res = await register(payload);
        if (res.success) {
          toast.success("Registration initiated. Please enter the OTP sent to your email.");
          setMode("verify-otp");
        }
      } else if (mode === "verify-otp") {
        const res = await verifyRegistrationOtp(email.trim(), otp.trim());
        if (res.success) {
          toast.success("Account verified and signed in successfully!");
          if (onSuccess) onSuccess();
        }
      } else if (mode === "forgot-password") {
        const res = await forgotPassword(email.trim());
        if (res.success) {
          toast.success("Password reset OTP sent to your email.");
          setMode("reset-password");
        }
      } else if (mode === "reset-password") {
        // First verify the OTP
        const otpRes = await verifyOtp(email.trim(), otp.trim());
        if (otpRes.success) {
          const resetRes = await resetPassword(email.trim(), newPassword);
          if (resetRes.success) {
            toast.success("Password reset successfully! Please log in.");
            setMode("login");
            setPassword(newPassword);
          }
        }
      }
    } catch (error) {
      console.error("Auth Error:", error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Authentication failed. Please check your credentials.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Glow Accent */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-indigo-600/30">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            {mode === "login" && "Welcome to EduVerse"}
            {mode === "register" && "Create an Account"}
            {mode === "verify-otp" && "Verify Your Email"}
            {mode === "forgot-password" && "Reset Password"}
            {mode === "reset-password" && "Enter New Password"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {mode === "login" && "Sign in to access your classes, exams, and question papers."}
            {mode === "register" && "Join the EduVerse School & Exam Management System."}
            {mode === "verify-otp" && `Enter the 6-digit code sent to ${email}.`}
            {mode === "forgot-password" && "Enter your registered email to receive a reset code."}
            {mode === "reset-password" && "Enter the 6-digit OTP and choose a strong new password."}
          </p>
        </div>

        {/* Demo Fast-Fill Bar (Available in Login mode) */}
        {mode === "login" && (
          <div className="mb-5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick Demo Logins:</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleQuickFillTeacher}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all text-center"
              >
                Teacher Account
              </button>
              <button
                type="button"
                onClick={handleQuickFillStudent}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all text-center"
              >
                User Account
              </button>
            </div>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username (Register mode) */}
          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Full Name / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Ram Sharma"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Email (Login, Register, Forgot Password, Reset Password) */}
          {mode !== "verify-otp" && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@school.edu"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Role Selector (Register mode) */}
          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Account Role
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="user">Student / General User</option>
                  <option value="teacher">Teacher (Class & Question Papers)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>
          )}

          {/* Password (Login, Register) */}
          {(mode === "login" || mode === "register") && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot-password");
                      setErrorMessage("");
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* OTP Code (Verify OTP & Reset Password) */}
          {(mode === "verify-otp" || mode === "reset-password") && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                6-Digit Verification Code (OTP)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono tracking-widest rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-center text-lg"
                />
              </div>
            </div>
          )}

          {/* New Password (Reset Password mode) */}
          {mode === "reset-password" && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  minLength={6}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>
                  {mode === "login" && "Sign In"}
                  {mode === "register" && "Create Account"}
                  {mode === "verify-otp" && "Verify Code"}
                  {mode === "forgot-password" && "Send Reset Code"}
                  {mode === "reset-password" && "Reset Password & Login"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Bottom Switch Links */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          {mode === "login" ? (
            <p>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMessage("");
                }}
                className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 transition-colors ml-1"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage("");
                }}
                className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 transition-colors ml-1"
              >
                Sign In
              </button>
            </p>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Portal</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
