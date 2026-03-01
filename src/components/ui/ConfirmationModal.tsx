import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'success' | 'warning';
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'warning'
}: ConfirmationModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const getVariantStyles = () => {
        switch (variant) {
            case 'danger':
                return {
                    iconBg: 'bg-red-50',
                    iconColor: 'text-red-500',
                    confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-200'
                };
            case 'success':
                return {
                    iconBg: 'bg-green-50',
                    iconColor: 'text-green-500',
                    confirmBtn: 'bg-green-600 hover:bg-green-700 focus:ring-green-200'
                };
            default:
                return {
                    iconBg: 'bg-amber-50',
                    iconColor: 'text-amber-500',
                    confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-200'
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 bg-gradient-to-r from-[#112240] to-[#1e3a8a] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <AlertTriangle className="h-5 w-5" />
                        <h3 className="font-black text-base tracking-tight">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 text-center flex flex-col items-center">
                    <div className={`p-4 rounded-full mb-4 ${styles.iconBg}`}>
                        <AlertTriangle className={`w-10 h-10 ${styles.iconColor}`} />
                    </div>

                    <p className="text-sm font-medium text-gray-600 leading-relaxed mb-6">
                        {description}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white rounded-xl transition-all shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.confirmBtn}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
