import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex gap-4 items-start">
        <div className="p-2.5 rounded-2xl shrink-0 bg-zinc-100 text-black border border-zinc-200">
          <AlertTriangle className="w-5 h-5 text-black" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-zinc-600 leading-relaxed font-normal">{message}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-xl hover:bg-zinc-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-5 py-2 text-sm font-bold text-white bg-black rounded-xl hover:bg-zinc-800 shadow-btn-3d transition-colors"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

