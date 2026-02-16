import React from 'react';
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

    const { iconBg, iconColor, buttonBg, Icon } = getVariantStyles();

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col items-center text-center p-6">

                <div className={`p-3 rounded-full mb-4 ${iconBg}`}>
                    <Icon className={`w-8 h-8 ${iconColor}`} />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>

                {description && (
                    <p className="text-sm text-gray-500 leading-relaxed mb-6">
                        {description}
                    </p>
                )}

                <button
                    onClick={onClose}
                    className={`w-full px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonBg}`}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    );
}
