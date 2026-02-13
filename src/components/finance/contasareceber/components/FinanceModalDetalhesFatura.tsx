import React from 'react';
import { X, Calendar, DollarSign, Mail, User, FileText, CheckCircle2, Clock, AlertCircle, Phone, Paperclip } from 'lucide-react';
import { Fatura } from '../hooks/useFinanceContasReceber';

interface FinanceModalDetalhesFaturaProps {
    isOpen: boolean;
    onClose: () => void;
    fatura: Fatura | null;
}

export function FinanceModalDetalhesFatura({ isOpen, onClose, fatura }: FinanceModalDetalhesFaturaProps) {
    if (!isOpen || !fatura) return null;

    const dataEnvio = new Date(fatura.data_envio);
    const dataResposta = new Date(dataEnvio);
    dataResposta.setDate(dataResposta.getDate() + 2);
    const prazoFatal = new Date(dataEnvio);
    prazoFatal.setDate(prazoFatal.getDate() + 4);

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'aguardando_resposta':
                return { bg: 'bg-blue-500', text: 'text-blue-700', label: 'Aguardando Resposta' };
            case 'radar':
                return { bg: 'bg-amber-500', text: 'text-amber-700', label: 'No Radar' };
            case 'contato_direto':
                return { bg: 'bg-red-500', text: 'text-red-700', label: 'Contato Direto' };
            case 'pago':
                return { bg: 'bg-emerald-500', text: 'text-emerald-700', label: 'Pago/Recebido' };
            default:
                return { bg: 'bg-gray-400', text: 'text-gray-700', label: 'Enviado' };
        }
    };

    const statusInfo = getStatusInfo(fatura.status);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* HEADER */}
                <div className="bg-gray-50 border-b border-gray-100 p-6 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white ${statusInfo.bg}`}>
                                {statusInfo.label}
                            </div>
                            <span className="text-xs font-bold text-gray-400">#{fatura.id.slice(0, 8)}</span>
                        </div>
                        <h2 className="text-2xl font-black text-[#0a192f]">{fatura.assunto}</h2>
                        <p className="text-sm font-medium text-gray-500 mt-1">Detalhes completos da fatura enviada.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">

                    {/* INFO PRINCIPAL */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Cliente</label>
                                <div className="flex items-center gap-2 text-[#0a192f] font-bold">
                                    <User className="h-4 w-4 text-[#1e3a8a]" />
                                    {fatura.cliente_nome}
                                </div>
                                <div className="text-xs text-gray-500 ml-6">{fatura.cliente_email}</div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Valor</label>
                                <div className="flex items-center gap-2 text-[#1e3a8a] text-xl font-black">
                                    <DollarSign className="h-5 w-5" />
                                    {Number(fatura.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-500">Enviado em:</span>
                                <span className="text-sm font-bold text-[#0a192f]">{dataEnvio.toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-blue-500">Resposta Esperada:</span>
                                <span className="text-sm font-bold text-blue-700">{dataResposta.toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-gray-200 pt-2 mt-2">
                                <span className="text-xs font-bold text-red-500 uppercase">Prazo Fatal:</span>
                                <span className="text-sm font-black text-red-700">{prazoFatal.toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>
                    </div>

                    {/* MENSAGEM */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Mensagem Enviada</label>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-600 italic whitespace-pre-wrap">
                            "{fatura.corpo || 'Sem mensagem adicional.'}"
                        </div>
                    </div>

                    {/* ANEXOS */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Anexos ({fatura.arquivos_urls?.length || 0})</label>
                        {fatura.arquivos_urls && fatura.arquivos_urls.length > 0 ? (
                            <div className="grid gap-2">
                                {fatura.arquivos_urls.map((url, idx) => (
                                    <a
                                        key={idx}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-[#1e3a8a] hover:shadow-md transition-all group"
                                    >
                                        <div className="p-2 bg-blue-50 text-[#1e3a8a] rounded-lg group-hover:bg-[#1e3a8a] group-hover:text-white transition-colors">
                                            <Paperclip className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-gray-700 group-hover:text-[#1e3a8a]">Documento Anexo {idx + 1}</div>
                                            <div className="text-[10px] text-gray-400">Clique para visualizar</div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-400 italic">Nenhum anexo disponível.</div>
                        )}
                    </div>

                </div>

                {/* FOOTER */}
                <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-gray-50 transition-all">
                        Fechar
                    </button>
                </div>

            </div>
        </div>
    );
}
