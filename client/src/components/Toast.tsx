import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-2.5 max-w-md w-full sm:w-auto px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-2xl border-2 border-black bg-black text-white text-xs sm:text-sm animate-fade-in"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-sky-400 shrink-0" />
            )}
            <span className="font-semibold text-xs sm:text-sm text-white leading-tight break-words">
              {toast.message}
            </span>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
            title="Dismiss notification"
          >
            <X className="w-4 h-4 text-zinc-400 hover:text-white" />
          </button>
        </div>
      ))}
    </div>
  );
};

