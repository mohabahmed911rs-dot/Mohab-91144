import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ClearConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ClearConfirmModal: React.FC<ClearConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-modal-title"
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
        <div className="w-11 h-11 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
        </div>
        <h3 id="clear-modal-title" className="text-base font-extrabold text-slate-900 mb-1.5">
          مسح جميع البيانات؟
        </h3>
        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          سيتم تفريغ جميع الحقول لتبدأ من جديد. يمكنك دائماً إعادة تعبئة البيانات التجريبية بضغطة زر.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer"
          >
            نعم، مسح الكل
          </button>
        </div>
      </div>
    </div>
  );
};
