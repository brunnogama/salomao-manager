import React, { useState } from 'react';
import { X, FileText, Database, Calendar, Building2, MapPin, Info, Paperclip, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface CertificateDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    certificate: any | null;
    nameDict: Record<string, string>;
    agencyDict: Record<string, string>;
}

export function CertificateDetailsModal({
    isOpen,
    onClose,
    certificate,
    nameDict,
    agencyDict
}: CertificateDetailsModalProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'ged'>('info');

    if (!isOpen || !certificate) return null;

    const getCertName = (c: any) => nameDict[c.name] || c.name || 'Certidão';
    const getAgencyName = (c: any) => agencyDict[c.agency] || c.agency || 'Não informado';

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        if (dateStr.includes('-')) {
            const [year, month, day] = dateStr.split('T')[0].split('-');
            return `${day}/${month}/${year}`;
        }
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const isExpired = (dueDate: string) => {
        if (!dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let dDate;
        if (dueDate.includes('-')) {
            const [year, month, day] = dueDate.split('T')[0].split('-').map(Number);
            dDate = new Date(year, month - 1, day);
        } else {
            dDate = new Date(dueDate);
        }
        return dDate < today;
    };

    const handleDownload = async () => {
        if (!certificate.file_url) return;
        try {
            const { data, error } = await supabase.storage.from('certificate-documents').download(certificate.file_url);
            if (error) throw error;
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = certificate.file_name || `certidao_${certificate.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error: any) {
            alert('Erro ao baixar documento: ' + error.message);
        }
    };

    const statusExpired = isExpired(certificate.due_date);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 overflow-hidden">

                {/* Header */}
                <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-start shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl shadow-sm ${statusExpired ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-tight">
                                {getCertName(certificate)}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusExpired
                                        ? 'bg-red-100 text-red-700 border-red-200'
                                        : 'bg-green-100 text-green-700 border-green-200'
                                    }`}>
                                    {statusExpired ? 'Vencida' : 'Ativa'}
                                </span>
                                <span className="text-[10px] font-mono text-gray-400">ID: {certificate.id?.slice(0, 8)}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white border border-gray-200 text-gray-400 rounded-xl hover:bg-gray-50 hover:text-gray-600 transition-colors shadow-sm"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-6 pt-4 bg-white border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'info'
                                ? 'border-[#1e3a8a] text-[#1e3a8a]'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <Info className="w-3.5 h-3.5" />
                        Informações
                    </button>
                    <button
                        onClick={() => setActiveTab('ged')}
                        className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'ged'
                                ? 'border-[#1e3a8a] text-[#1e3a8a]'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <Database className="w-3.5 h-3.5" />
                        GED
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'info' ? (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Building2 className="w-3 h-3" /> Órgão Emissor
                                    </label>
                                    <p className="text-sm font-bold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100 italic">
                                        {getAgencyName(certificate)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <MapPin className="w-3 h-3" /> Unidade / Local
                                    </label>
                                    <p className="text-sm font-bold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100 italic">
                                        {certificate.location || '-'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <FileText className="w-3 h-3" /> CNPJ Associado
                                    </label>
                                    <p className="text-sm font-mono font-bold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        {certificate.cnpj || 'Não informado'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-1">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" /> Emissão
                                        </label>
                                        <p className="text-sm font-black text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            {formatDate(certificate.issue_date)}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" /> Vencimento
                                        </label>
                                        <p className={`text-sm font-black p-3 rounded-xl border ${statusExpired
                                                ? 'bg-red-50 text-red-700 border-red-100'
                                                : 'bg-gray-50 text-gray-800 border-gray-100'
                                            }`}>
                                            {formatDate(certificate.due_date)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {certificate.observations && (
                                <div className="space-y-2 pt-4 border-t border-gray-100">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <FileText className="w-3 h-3" /> Observações Internas
                                    </label>
                                    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
                                        <p className="text-xs text-amber-900 leading-relaxed italic">
                                            {certificate.observations}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 min-h-[300px]">
                            {certificate.file_url ? (
                                <div className="w-full max-w-md bg-gray-50 rounded-3xl p-8 border-2 border-dashed border-gray-200 flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                                        <Paperclip className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-sm font-black text-gray-900 mb-1 truncate w-full px-4">
                                        {certificate.file_name || 'Documento Digitalizado'}
                                    </h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                                        Arquivo pronto para visualização
                                    </p>

                                    <div className="flex flex-col w-full gap-3">
                                        <button
                                            onClick={handleDownload}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#1e3a8a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-xl hover:bg-[#112240] transition-all active:scale-95"
                                        >
                                            <Download className="w-4 h-4" /> Download do Arquivo
                                        </button>
                                        {certificate.file_url && (
                                            <a
                                                href={supabase.storage.from('certificate-documents').getPublicUrl(certificate.file_url).data.publicUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
                                            >
                                                <ExternalLink className="w-4 h-4" /> Visualizar em Nova Aba
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-12 rounded-3xl border border-gray-100 flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-gray-200 text-gray-400 rounded-3xl flex items-center justify-center mb-4">
                                        <Database className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nenhum documento anexado</p>
                                    <p className="text-[10px] text-gray-300 mt-1 italic">Esta certidão não possui arquivo no GED.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:bg-gray-50 transition-all active:scale-95"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
