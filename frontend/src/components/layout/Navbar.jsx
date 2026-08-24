import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Badge } from "../common/Badge";
import {
  GraduationCap,
  LogOut,
  LogIn,
  User,
  Shield,
  Menu,
  Sparkles,
  Search,
} from "lucide-react";

export const Navbar = ({ onToggleSidebar, onNavigateAuth, onSelectTab, onOpenSearch }) => {
  const { user, role, isAuthenticated, logout } = useAuth();
  const toast = useToast();

  const handleLogout = () => {
    logout();
    toast.info("You have been signed out.");
  };

  const getRoleBadgeVariant = (userRole) => {
    switch (userRole) {
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
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-800/80 px-5 sm:px-8 lg:px-10 py-4 flex items-center justify-between shadow-xl">
      {/* Left: Mobile Toggle & Brand */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2.5 -ml-2 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                EduVerse
              </span>
              <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                EMS
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-400 font-medium leading-tight mt-0.5">
              Educational & Exam Management System
            </p>
          </div>
        </div>
      </div>

      {/* Right: User State & Quick Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick Search Spotlight Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs sm:text-sm font-semibold transition-all group hover:border-indigo-500/40 shadow-sm"
          title="Quick Search (Ctrl + K)"
        >
          <Search className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Search Everything</span>
          <kbd className="hidden sm:inline-flex items-center text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono font-bold">
            Ctrl + K
          </kbd>
        </button>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            {/* User Profile Pill (Clickable) */}
            <button
              onClick={() => onSelectTab && onSelectTab("settings")}
              className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/30 transition-all text-left group shadow-sm"
              title="View Account Settings"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-xs font-black uppercase group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                {user.username ? user.username.charAt(0) : "U"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-indigo-300 transition-colors leading-tight">
                  {user.username}
                </p>
                <p className="text-[11px] text-slate-400 leading-none truncate max-w-[140px] mt-0.5">
                  {user.email}
                </p>
              </div>
              <Badge variant={getRoleBadgeVariant(role)} size="sm" className="capitalize">
                {role}
              </Badge>
            </button>

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all flex items-center gap-1.5 text-xs sm:text-sm font-semibold"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden md:inline">Sign out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onNavigateAuth}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
