import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = Date.now() + Math.random().toString(36).substring(2, 9);
      const newToast = { id, message, type };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  const toast = {
    success: (msg, dur) => showToast(msg, "success", dur),
    error: (msg, dur) => showToast(msg, "error", dur),
    warning: (msg, dur) => showToast(msg, "warning", dur),
    info: (msg, dur) => showToast(msg, "info", dur),
    dismiss: removeToast,
  };

  const getToastIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-indigo-500 shrink-0" />;
    }
  };

  const getToastStyles = (type) => {
    switch (type) {
      case "success":
        return "bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-900/20";
      case "error":
        return "bg-rose-950/90 border-rose-500/40 text-rose-100 shadow-rose-900/20";
      case "warning":
        return "bg-amber-950/90 border-amber-500/40 text-amber-100 shadow-amber-900/20";
      default:
        return "bg-slate-900/95 border-indigo-500/40 text-slate-100 shadow-indigo-900/20";
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 transform translate-y-0 opacity-100 animate-in fade-in slide-in-from-bottom-5 ${getToastStyles(
              item.type
            )}`}
          >
            {getToastIcon(item.type)}
            <div className="flex-1 text-sm font-medium leading-relaxed pr-2">
              {item.message}
            </div>
            <button
              onClick={() => removeToast(item.id)}
              className="text-slate-400 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded-lg hover:bg-white/10"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
