import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

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
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 px-4.5 py-3.5 rounded-2xl shadow-2xl border border-zinc-800 bg-black text-white text-sm animate-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-white shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4.5 h-4.5 text-white shrink-0" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-white shrink-0" />
            )}
            <span className="font-semibold text-sm leading-snug text-white">{toast.message}</span>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

