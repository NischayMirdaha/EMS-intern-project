import React from "react";

export const StatCard = ({ title, value, subtitle, icon: Icon, color = "indigo", trend }) => {
  const colorMap = {
    indigo: {
      bg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
      glow: "from-indigo-500/20 to-transparent",
      value: "text-indigo-100",
    },
    emerald: {
      bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      glow: "from-emerald-500/20 to-transparent",
      value: "text-emerald-100",
    },
    cyan: {
      bg: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
      glow: "from-cyan-500/20 to-transparent",
      value: "text-cyan-100",
    },
    purple: {
      bg: "bg-purple-500/10 border-purple-500/20 text-purple-400",
      glow: "from-purple-500/20 to-transparent",
      value: "text-purple-100",
    },
    amber: {
      bg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      glow: "from-amber-500/20 to-transparent",
      value: "text-amber-100",
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className="relative overflow-hidden rounded-3xl glass-card p-6 sm:p-7 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-indigo-500/10 group">
      {/* Background Gradient Glow */}
      <div
        className={`absolute -top-12 -right-12 w-36 h-36 bg-gradient-to-b ${scheme.glow} rounded-full blur-2xl opacity-60 pointer-events-none group-hover:opacity-100 transition-opacity`}
      />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            {title}
          </p>
          <h3 className={`text-3xl sm:text-4xl lg:text-5xl font-black ${scheme.value} tracking-tight`}>
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-400 mt-2 font-medium">
              {subtitle}
            </p>
          )}
          {trend && (
            <p className="text-xs sm:text-sm text-emerald-400 font-semibold mt-1.5">
              {trend}
            </p>
          )}
        </div>

        {Icon && (
          <div className={`p-3.5 sm:p-4 rounded-2xl border ${scheme.bg} shrink-0`}>
            <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
