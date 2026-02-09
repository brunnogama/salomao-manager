import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string; // Tornamos opcional e explícito
  message?: string;     // Mantemos compatibilidade caso usado em outro lugar
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const desc = description || message; // Usa description ou message

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[1.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
        
        <div className="p-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className={`p-4 rounded-2xl flex-shrink-0 shadow-sm ${
              variant === 'danger' ? 'bg-red-50 text-red-600' : 
              variant === 'warning' ? 'bg-amber-50 text-amber-600' : 
              'bg-blue-50 text-blue-600'
            }`}>
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-[0.2em]">{title}</h3>
              {desc && (
                <p className="text-xs font-bold text-gray-400 uppercase leading-relaxed tracking-wider">
                  {desc}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50/80 px-8 py-5 flex flex-col sm:flex-row justify-center gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow-sm order-2 sm:order-1"
          >
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-8 py-2.5 text-[10px] font-black uppercase tracking-widest text-white rounded-xl transition-all shadow-lg active:scale-95 order-1 sm:order-2 ${
              variant === 'danger' 
                ? 'bg-red-600 hover:bg-red-700' 
                : variant === 'warning'
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-[#0a192f] hover:bg-slate-800'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}