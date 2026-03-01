import React, { useEffect } from 'react';
import { CheckCircle2, X, AlertCircle, Info } from 'lucide-react';

export interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    confirmText?: string;
    variant?: 'success' | 'error' | 'info' | 'warning';
}

export function AlertModal({
    isOpen,
    onClose,
    title,
    description,
    confirmText = 'OK',
    variant = 'success'
}: AlertModalProps) {
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
            case 'error':
                return {
                    iconBg: 'bg-red-100',
                    iconColor: 'text-red-600',
                    buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
                    Icon: AlertCircle
                };
            case 'warning':
                return {
                    iconBg: 'bg-yellow-100',
                    iconColor: 'text-yellow-600',
                    buttonBg: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
                    Icon: AlertCircle
                };
            case 'info':
                return {
                    iconBg: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                    buttonBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
                    Icon: Info
                };
            default: // success
                return {
                    iconBg: 'bg-emerald-100',
                    iconColor: 'text-emerald-600',
                    buttonBg: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
                    Icon: CheckCircle2
                };
        }
    };

    const { iconBg, iconColor, Icon } = getVariantStyles();

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 bg-gradient-to-r from-[#112240] to-[#1e3a8a] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <Icon className="h-5 w-5" />
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
                    <div className={`p-4 rounded-full mb-4 ${iconBg}`}>
                        <Icon className={`w-10 h-10 ${iconColor}`} />
                    </div>

                    {description && (
                        <p className="text-sm font-medium text-gray-600 leading-relaxed mb-6">
                            {description}
                        </p>
                    )}

                    <button
                        onClick={onClose}
                        className={`w-full px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white rounded-xl transition-all shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2 bg-gradient-to-r from-[#1e3a8a] to-[#112240] hover:shadow-lg`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
