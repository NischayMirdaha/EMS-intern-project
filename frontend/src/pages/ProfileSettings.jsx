import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authApi } from "../api/services";
import { Badge } from "../components/common/Badge";
import { EmptyState } from "../components/common/EmptyState";
import {
  User,
  Shield,
  KeyRound,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Sparkles,
  Layers,
  FileText,
  CalendarDays,
  Activity,
  LogIn,
} from "lucide-react";

export const ProfileSettings = ({ onNavigate, onNavigateAuth }) => {
  const { user, role, isAuthenticated } = useAuth();
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isAuthenticated) {
    return (
      <div className="py-12 max-w-xl mx-auto animate-in fade-in duration-200">
        <EmptyState
          icon={Shield}
          title="Authentication Required"
          description="You are currently browsing as a guest. Please sign in to access your account profile, manage credentials, and view system security settings."
          actionLabel="Sign In Now"
          onAction={onNavigateAuth || (() => onNavigate("auth"))}
        />
      </div>
    );
  }

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("All password fields are required.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        toast.success("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to change password.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getRoleVariant = (r) => {
    switch (r) {
      case "teacher":
        return "primary";
      case "admin":
        return "purple";
      case "student":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-100 tracking-tight">
            Account & Security Settings
          </h1>
          <Badge variant="primary" size="lg">
            <Shield className="w-4 h-4" />
            Security Center
          </Badge>
        </div>
        <p className="text-sm sm:text-base text-slate-300 mt-2 font-medium">
          Manage your personal credentials, view system permissions, and update your security settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column (5 cols): Profile Info Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-7 rounded-3xl border border-slate-800/80 shadow-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-2xl font-black uppercase shadow-xl shadow-indigo-600/30">
                {user?.username ? user.username.charAt(0) : "U"}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">
                  {user?.username || "EduVerse User"}
                </h3>
                <p className="text-xs text-slate-400">{user?.email || "No email available"}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge variant={getRoleVariant(role)} size="sm" className="capitalize">
                    {role || "User"}
                  </Badge>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-3 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  Account ID
                </span>
                <span className="font-mono font-bold text-slate-200">#{user?.id || 1}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  Primary Email
                </span>
                <span className="font-medium text-slate-200 truncate max-w-[170px]">
                  {user?.email || "demo@gmail.com"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Member Since
                </span>
                <span className="font-medium text-slate-200">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "July 2026"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  System Status
                </span>
                <span className="text-emerald-400 font-semibold">Active & Operational</span>
              </div>
            </div>
          </div>

          {/* Role Permissions Card */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 shadow-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Your Role Permissions ({role})</span>
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>View real-time Class & Section Counts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Create, edit, and delete Classes & Sections</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Schedule & manage examination timelines</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Upload & inspect Cloudinary PDF question papers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Change Password Form */}
        <div className="md:col-span-7">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-400" />
                <span>Change Password</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your current password to authorize setting a new password.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Current Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  New Password <span className="text-rose-400">*</span>
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
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Confirm New Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    minLength={6}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
