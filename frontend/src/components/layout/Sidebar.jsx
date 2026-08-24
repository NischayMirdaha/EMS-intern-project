import React from "react";
import {
  LayoutDashboard,
  Layers,
  CalendarDays,
  FileText,
  Sparkles,
  X,
  BookOpen,
  Shield,
} from "lucide-react";

export const Sidebar = ({ activeTab, onSelectTab, isOpen, onClose }) => {
  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Overview & Analytics",
    },
    {
      id: "classes",
      label: "Classes & Sections",
      icon: Layers,
      description: "Class & Section Count Manager",
      highlight: true,
    },
    {
      id: "exams",
      label: "Exams",
      icon: CalendarDays,
      description: "Schedules & Status",
    },
    {
      id: "question-papers",
      label: "Question Papers",
      icon: FileText,
      description: "Upload & PDF Repository",
    },
    {
      id: "settings",
      label: "Account & Security",
      icon: Shield,
      description: "Profile & Change Password",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-80 glass-panel border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-base text-slate-100 leading-tight">EMS Portal</h1>
              <p className="text-xs text-slate-400 font-medium">Main Navigation</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-3.5 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-all duration-200 group relative ${
                  isActive
                    ? "bg-indigo-600 text-white font-bold shadow-xl shadow-indigo-600/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/70 font-semibold"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold truncate">{item.label}</span>
                    {item.highlight && (
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        }`}
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        Main
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs truncate mt-0.5 font-normal ${
                      isActive ? "text-indigo-100" : "text-slate-400"
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-4 border border-slate-800/80 m-4 rounded-2xl bg-slate-900/60 shadow-md">
          <div className="flex items-center gap-2 text-xs text-slate-200 font-bold mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>EduVerse System Active</span>
          </div>
          <p className="text-[11px] text-slate-400">
            PostgreSQL & Express Endpoints Connected
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
