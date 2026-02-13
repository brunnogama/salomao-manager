import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

export interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    confirmText?: string;
}

export function SuccessModal({
    isOpen,
    onClose,
    title,
    description,
    confirmText = 'OK'
}: SuccessModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col items-center text-center p-6">

                <div className="p-3 bg-emerald-100 rounded-full mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>

                {description && (
                    <p className="text-sm text-gray-500 leading-relaxed mb-6">
                        {description}
                    </p>
                )}

                <button
                    onClick={onClose}
                    className="w-full px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                    {confirmText}
                </button>
            </div>
        </div>
    );
}
