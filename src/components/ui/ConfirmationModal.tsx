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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full shrink-0 ${styles.iconBg}`}>
                            <AlertTriangle className={`w-6 h-6 ${styles.iconColor}`} />
                        </div>
                        <div className="flex-1 pt-1">
                            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">
                                {title}
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                {description}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all focus:ring-2 focus:ring-gray-200 outline-none"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-all focus:ring-4 outline-none ${styles.confirmBtn}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
