import React from 'react';
import { X, Briefcase, Banknote, Calendar, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { formatMoney } from './dashboardHelpers';

interface PartnerDetailModalProps {
    partner: any;
    onClose: () => void;
}

export function PartnerDetailModal({ partner, onClose }: PartnerDetailModalProps) {
    if (!partner) return null;

    const totalSocio = (partner.pl || 0) + (partner.exito || 0) + (partner.fixo || 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

                {/* Header - Perfil do Sócio */}
                <div className="bg-[#0a192f] p-6 text-white relative flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-6">
                        {partner.photo_url ? (
                            <img
                                src={partner.photo_url}
                                alt={partner.name}
                                className="w-24 h-24 rounded-full object-cover border-4 border-white/20 shadow-lg"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-blue-600/30 border-4 border-white/20 flex items-center justify-center text-4xl font-bold shadow-lg text-white">
                                {partner.name ? partner.name.substring(0, 2).toUpperCase() : 'NA'}
                            </div>
                        )}
                        <div>
                            <h2 className="text-3xl font-black tracking-tight mb-2">{partner.name}</h2>
                            <div className="flex items-center gap-4 text-white/70 text-sm font-medium">
                                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                                    <Briefcase className="w-4 h-4" />
                                    <span>{partner.total} Contratos no Total</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>{partner.active} Ativos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Corpo do Modal - Scrollable */}
                <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-gray-50/50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Lado Esquerdo: Resumo Financeiro */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Banknote className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-800">Visão Financeira</h3>
                                </div>

                                <div className="mb-8">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total de Honorários (Ativos)</p>
                                    <p className="text-4xl font-black text-[#1e3a8a] tracking-tight">{formatMoney(totalSocio)}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/50 border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Pró-labore</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-base font-black text-gray-800">{formatMoney(partner.pl || 0)}</span>
                                            {totalSocio > 0 && <span className="text-[10px] font-semibold text-gray-400">{Math.round(((partner.pl || 0) / totalSocio) * 100)}% do total</span>}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/50 border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Êxito</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-base font-black text-gray-800">{formatMoney(partner.exito || 0)}</span>
                                            {totalSocio > 0 && <span className="text-[10px] font-semibold text-gray-400">{Math.round(((partner.exito || 0) / totalSocio) * 100)}% do total</span>}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/50 border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Fixo Mensal</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-base font-black text-gray-800">{formatMoney(partner.fixo || 0)}</span>
                                            {totalSocio > 0 && <span className="text-[10px] font-semibold text-gray-400">{Math.round(((partner.fixo || 0) / totalSocio) * 100)}% do total</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lado Direito: Pipeline e Conversão */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm h-full flex flex-col">
                                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-800">Pipeline de Contratos</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                        <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-wider mb-1">Em Análise</p>
                                        <p className="text-3xl font-black text-amber-600">{partner.analysis}</p>
                                    </div>

                                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                        <p className="text-[10px] font-bold text-blue-600/70 uppercase tracking-wider mb-1">Em Proposta</p>
                                        <p className="text-3xl font-black text-blue-600">{partner.proposal}</p>
                                    </div>

                                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                        <p className="text-[10px] font-bold text-green-600/70 uppercase tracking-wider mb-1">Fechados (Ativos)</p>
                                        <p className="text-3xl font-black text-green-600">{partner.active}</p>
                                    </div>

                                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                                        <p className="text-[10px] font-bold text-red-600/70 uppercase tracking-wider mb-1">Rejeitados/Perdas</p>
                                        <p className="text-3xl font-black text-red-600">{partner.rejected}</p>
                                    </div>
                                </div>

                                {/* Taxa de Conversão Simples */}
                                <div className="mt-auto pt-6 border-t border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Performance (Fechamentos / Total) *</p>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                                                style={{
                                                    width: partner.total > 0 ? `${Math.min(100, (partner.active / partner.total) * 100)}%` : '0%'
                                                }}
                                            ></div>
                                        </div>
                                        <span className="text-lg font-black text-gray-800">
                                            {partner.total > 0 ? Math.round((partner.active / partner.total) * 100) : 0}%
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-gray-400 mt-2">* Considera todos os status no denominador, não apenas propostas enviadas.</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
