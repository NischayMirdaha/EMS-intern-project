import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import Modal from "./Modal";

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  loading = false,
  danger = true,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-xl border shrink-0 ${
            danger
              ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
              : "bg-amber-500/10 border-amber-500/30 text-amber-400"
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <p className="text-sm text-slate-300 leading-relaxed pt-1">{message}</p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800 mt-6">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-sm font-medium text-slate-300 transition-colors disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50 ${
            danger
              ? "bg-rose-600 hover:bg-rose-500 shadow-rose-900/30"
              : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/30"
          }`}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
