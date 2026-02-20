import { useState } from 'react';
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
        <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl h-[85vh] flex overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 relative">

                {/* Left Sidebar */}
                <div className="w-64 bg-white border-r border-gray-100 flex flex-col py-8 px-5 shrink-0 overflow-y-auto">
                    <div className="mb-8 px-2">
                        <div className={`w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center mb-4 ${statusExpired ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-black text-[#0a192f] tracking-tight leading-tight">
                            Detalhes da Certidão
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusExpired
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : 'bg-green-100 text-green-700 border-green-200'
                                }`}>
                                {statusExpired ? 'Vencida' : 'Ativa'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1 w-full flex-1">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-left relative group ${activeTab === 'info'
                                ? 'text-[#1e3a8a] bg-blue-50 font-bold shadow-sm'
                                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                                }`}
                        >
                            <div className={`p-1 rounded-lg transition-colors ${activeTab === 'info' ? 'text-[#1e3a8a]' : 'text-gray-300 group-hover:text-gray-500'}`}>
                                <Info className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] uppercase tracking-[0.1em] font-bold">Informações</span>
                            {activeTab === 'info' && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[#1e3a8a] rounded-r-full" />}
                        </button>

                        <button
                            onClick={() => setActiveTab('ged')}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-left relative group ${activeTab === 'ged'
                                ? 'text-[#1e3a8a] bg-blue-50 font-bold shadow-sm'
                                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                                }`}
                        >
                            <div className={`p-1 rounded-lg transition-colors ${activeTab === 'ged' ? 'text-[#1e3a8a]' : 'text-gray-300 group-hover:text-gray-500'}`}>
                                <Database className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] uppercase tracking-[0.1em] font-bold">GED</span>
                            {activeTab === 'ged' && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[#1e3a8a] rounded-r-full" />}
                        </button>
                    </div>

                    <div className="mt-auto pt-6 border-t border-gray-100">
                        <button onClick={onClose} className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-red-500 hover:bg-red-50 p-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">
                            <X className="w-4 h-4" /> Fechar
                        </button>
                    </div>
                </div>

                {/* Right Content */}
                <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50">
                    {/* Header bar within content area */}
                    <div className="px-10 py-6 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 leading-tight">
                                {getCertName(certificate)}
                            </h3>
                            <p className="text-[10px] font-mono text-gray-400 mt-1 uppercase tracking-widest">Órgão: {getAgencyName(certificate)}</p>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                        {activeTab === 'info' ? (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Building2 className="w-3.5 h-3.5" /> Órgão Emissor
                                        </label>
                                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                            <p className="text-sm font-bold text-gray-800">
                                                {getAgencyName(certificate)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5" /> Unidade / Local
                                        </label>
                                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                            <p className="text-sm font-bold text-gray-800">
                                                {certificate.location || '-'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <FileText className="w-3.5 h-3.5" /> CNPJ Associado
                                        </label>
                                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                            <p className="text-sm font-mono font-bold text-gray-800">
                                                {certificate.cnpj || 'Não informado'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5" /> Emissão
                                            </label>
                                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                                <p className="text-sm font-black text-gray-800">
                                                    {formatDate(certificate.issue_date)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5" /> Vencimento
                                            </label>
                                            <div className={`p-4 rounded-2xl border shadow-sm ${statusExpired
                                                ? 'bg-red-50 text-red-700 border-red-100'
                                                : 'bg-white text-gray-800 border-gray-100'
                                                }`}>
                                                <p className="text-sm font-black">
                                                    {formatDate(certificate.due_date)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {certificate.observations && (
                                    <div className="space-y-3 pt-6 border-t border-gray-100">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <FileText className="w-3.5 h-3.5" /> Observações Internas
                                        </label>
                                        <div className="bg-amber-50/40 p-5 rounded-3xl border border-amber-100/50">
                                            <p className="text-sm text-amber-900 leading-relaxed italic">
                                                {certificate.observations}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 min-h-[400px]">
                                {certificate.file_url ? (
                                    <div className="w-full max-w-lg bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl flex flex-col items-center text-center">
                                        <div className="w-20 h-20 bg-blue-50 text-[#1e3a8a] rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                                            <Paperclip className="w-10 h-10" />
                                        </div>
                                        <h4 className="text-lg font-black text-gray-900 mb-2 truncate w-full px-4">
                                            {certificate.file_name || 'Documento Digitalizado'}
                                        </h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">
                                            Acesso rápido ao GED
                                        </p>

                                        <div className="flex flex-col w-full gap-4">
                                            <button
                                                onClick={handleDownload}
                                                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#1e3a8a] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-xl hover:bg-[#112240] transition-all active:scale-95"
                                            >
                                                <Download className="w-5 h-5" /> Baixar Documento
                                            </button>
                                            {certificate.file_url && (
                                                <a
                                                    href={supabase.storage.from('certificate-documents').getPublicUrl(certificate.file_url).data.publicUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                                                >
                                                    <ExternalLink className="w-5 h-5" /> Visualizar em Nova Aba
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white/50 p-16 rounded-[3rem] border border-gray-100 flex flex-col items-center text-center shadow-sm">
                                        <div className="w-20 h-20 bg-gray-100 text-gray-300 rounded-[2rem] flex items-center justify-center mb-6">
                                            <Database className="w-10 h-10 opacity-30" />
                                        </div>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Vazio</p>
                                        <p className="text-[11px] text-gray-300 mt-2 font-medium italic">Esta certidão não possui arquivos anexados ao sistema.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-10 py-6 border-t border-gray-100 bg-white/80 backdrop-blur-sm flex justify-end shrink-0">
                        <button
                            onClick={onClose}
                            className="px-10 py-3.5 bg-white border border-gray-200 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:bg-gray-50 hover:text-gray-700 transition-all active:scale-95"
                        >
                            Fechar Detalhes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
