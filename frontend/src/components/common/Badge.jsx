import React from "react";

export const Badge = ({ children, variant = "default", size = "md", className = "" }) => {
  const variantStyles = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    primary: "bg-indigo-950/80 text-indigo-300 border-indigo-500/30",
    success: "bg-emerald-950/80 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-950/80 text-amber-300 border-amber-500/30",
    danger: "bg-rose-950/80 text-rose-300 border-rose-500/30",
    info: "bg-cyan-950/80 text-cyan-300 border-cyan-500/30",
    purple: "bg-purple-950/80 text-purple-300 border-purple-500/30",
  };

  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-xs font-semibold",
    md: "px-3.5 py-1 text-xs sm:text-sm font-semibold",
    lg: "px-4 py-1.5 text-sm sm:text-base font-bold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${
        variantStyles[variant] || variantStyles.default
      } ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
