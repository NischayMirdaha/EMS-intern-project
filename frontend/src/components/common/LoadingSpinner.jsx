import React from "react";
import { Loader2 } from "lucide-react";

export const LoadingSpinner = ({ size = "md", text = "Loading..." }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-3">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} animate-spin text-indigo-500`} />
      {text && <p className="text-sm font-medium text-slate-400">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
