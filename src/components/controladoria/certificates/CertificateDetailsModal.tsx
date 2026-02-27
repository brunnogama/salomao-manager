import { useState, useEffect } from 'react';
import { FileText, Database, Calendar, Building2, MapPin, Info, Edit, Download, ExternalLink, ShieldCheck, Trash2, Paperclip } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { useEscKey } from '../../../hooks/useEscKey';

interface CertificateDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    certificate: any | null;
    nameDict: Record<string, string>;
    agencyDict: Record<string, string>;
    onEdit?: (cert: any) => void;
}

export function CertificateDetailsModal({
    isOpen,
    onClose,
    certificate,
    nameDict,
    agencyDict,
    onEdit
}: CertificateDetailsModalProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'ged'>('info');
    const [relatedFiles, setRelatedFiles] = useState<any[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    useEffect(() => {
        if (isOpen && certificate) {
            fetchRelatedFiles();
        }
    }, [isOpen, certificate]);

    useEscKey(isOpen, onClose);

    const fetchRelatedFiles = async () => {
        if (!certificate) return;
        setLoadingFiles(true);
        try {
            let query = supabase
                .from('certificates')
                .select('*')
                .eq('name', certificate.name)
                .not('file_url', 'is', null)
                .order('due_date', { ascending: false });

            if (certificate.location) {
                query = query.eq('location', certificate.location);
            } else {
                query = query.filter('location', 'is', null);
            }

            const { data, error } = await query;

            if (error) throw error;
            setRelatedFiles(data || []);
        } catch (error: any) {
            console.error('Erro ao buscar arquivos:', error);
        } finally {
            setLoadingFiles(false);
        }
    };

    if (!isOpen || !certificate) return null;

    const getCertName = (c: any) => {
        let name = nameDict[c.name] || c.name || 'Certidão';
        if (name === 'Contrato Social' && c.alteration) {
            name = `${name} - ${c.alteration}`;
        }
        return name;
    };
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

    const handleDownload = async (file: any) => {
        if (!file.file_url) return;
        const toastId = toast.loading('Preparando download...');
        try {
            const { data, error } = await supabase.storage.from('ged-documentos').download(file.file_url);
            if (error) throw error;
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.file_name || `certidao_${file.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Download concluído', { id: toastId });
        } catch (error: any) {
            toast.error('Erro ao baixar documento: ' + error.message, { id: toastId });
        }
    };

    const handleDeleteFile = async (id: string, fileUrl: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este arquivo? Isso removerá o registro da certidão correspondente.')) return;

        const toastId = toast.loading('Excluindo arquivo...');
        try {
            // Se tiver URL do arquivo, tenta excluir do storage primeiro
            if (fileUrl) {
                const { error: storageError } = await supabase.storage
                    .from('ged-documentos')
                    .remove([fileUrl]);
                if (storageError) console.error('Erro ao remover do storage:', storageError);
            }

            const { error } = await supabase.from('certificates').delete().eq('id', id);
            if (error) throw error;

            toast.success('Arquivo excluído com sucesso!', { id: toastId });
            fetchRelatedFiles();
        } catch (error: any) {
            toast.error('Erro ao excluir: ' + error.message, { id: toastId });
        }
    };

    const statusExpired = isExpired(certificate.due_date) && getCertName(certificate) !== 'Comprovante de Inscrição e de Situação Cadastral';

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
                        {/* Botão de fechar removido conforme solicitação */}
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
                            <div className="flex items-center gap-3 mt-1">
                                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Órgão: {getAgencyName(certificate)}</p>
                                {certificate.cnpj && (
                                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest border-l border-gray-100 pl-3">CNPJ: {certificate.cnpj}</span>
                                )}
                            </div>
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
                                                {getCertName(certificate) === 'Comprovante de Inscrição e de Situação Cadastral' && (
                                                    <p className="text-[8px] font-black text-green-600 mt-1 uppercase tracking-tighter">
                                                        Isento de Vencimento
                                                    </p>
                                                )}
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
                                            <p className="text-sm text-amber-900 leading-relaxed italic whitespace-pre-wrap">
                                                {certificate.observations}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {(nameDict[certificate.name] || certificate.name) === 'Contrato Social' && certificate.contract_partners && certificate.contract_partners.length > 0 && (
                                    <div className="space-y-6 pt-6 border-t border-gray-100">
                                        <h4 className="text-sm font-black text-[#0a192f] uppercase tracking-widest flex items-center gap-2">
                                            Sócios no Contrato Social
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            {certificate.contract_partners.map((partner: any, idx: number) => (
                                                <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-[#1e3a8a]" />
                                                    <h5 className="text-sm font-bold text-gray-900 mb-4">{partner.name || partner.collaborator_id}</h5>

                                                    {partner.oabs && partner.oabs.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {partner.oabs.map((oab: any, oIndex: number) => (
                                                                <div key={oIndex} className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg">
                                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${oab.tipo === 'Principal' ? 'bg-[#1e3a8a] text-white' : 'bg-gray-300 text-gray-700'}`}>
                                                                        {oab.tipo}
                                                                    </span>
                                                                    <span className="text-xs font-mono font-medium text-gray-700">OAB: {oab.numero || '-'}</span>
                                                                    <span className="text-xs font-bold text-gray-500 border-l border-gray-200 pl-3">UF: {oab.uf || '-'}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-400 italic">Nenhuma OAB cadastrada.</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                        <Database className="w-4 h-4 text-blue-600" /> Histórico de Arquivos
                                    </h4>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-lg">
                                        {relatedFiles.length} {relatedFiles.length === 1 ? 'arquivo' : 'arquivos'}
                                    </span>
                                </div>

                                {loadingFiles ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Carregando arquivos...</p>
                                    </div>
                                ) : relatedFiles.length > 0 ? (
                                    <div className="space-y-3">
                                        {relatedFiles.map((file, index) => {
                                            const fileExpired = isExpired(file.due_date) && getCertName(file) !== 'Comprovante de Inscrição e de Situação Cadastral';
                                            const isCurrentRevision = index === 0 && !fileExpired;

                                            return (
                                                <div
                                                    key={file.id}
                                                    className={`bg-white rounded-[1.5rem] p-5 border transition-all hover:shadow-md flex items-center gap-5 ${isCurrentRevision
                                                        ? 'border-green-200 bg-green-50/20 shadow-sm'
                                                        : 'border-gray-100'
                                                        }`}
                                                >
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${fileExpired ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        <Paperclip className="w-5 h-5" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h5 className="text-sm font-bold text-gray-900 truncate">
                                                                {file.file_name || 'Certidão Digitalizada'}
                                                            </h5>
                                                            {isCurrentRevision && (
                                                                <span className="text-[8px] font-black text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full uppercase tracking-tighter border border-green-200">
                                                                    Atual
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="w-3 h-3 text-gray-400" />
                                                                <span className={`text-[10px] font-bold ${fileExpired ? 'text-red-500' : 'text-gray-500'}`}>
                                                                    Expira em: {formatDate(file.due_date)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 border-l border-gray-100 pl-4">
                                                                <span className="text-[10px] font-mono text-gray-300">
                                                                    ID: {file.id.slice(0, 8)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleDownload(file)}
                                                            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors bg-white border border-gray-100 shadow-sm"
                                                            title="Baixar"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                        <a
                                                            href={supabase.storage.from('ged-documentos').getPublicUrl(file.file_url).data.publicUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors bg-white border border-gray-100 shadow-sm"
                                                            title="Visualizar"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                        <button
                                                            onClick={() => handleDeleteFile(file.id, file.file_url)}
                                                            className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors bg-white border border-gray-100 shadow-sm"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-white/50 p-16 rounded-[3rem] border border-gray-100 flex flex-col items-center text-center shadow-sm">
                                        <div className="w-20 h-20 bg-gray-100 text-gray-300 rounded-[2rem] flex items-center justify-center mb-6">
                                            <Database className="w-10 h-10 opacity-30" />
                                        </div>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Vazio</p>
                                        <p className="text-[11px] text-gray-300 mt-2 font-medium italic">Nenhum arquivo encontrado para esta certidão.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-10 py-6 border-t border-gray-100 bg-white/80 backdrop-blur-sm flex justify-end gap-3 shrink-0">
                        {onEdit && (
                            <button
                                onClick={() => onEdit(certificate)}
                                className="px-6 py-3.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:bg-amber-100 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Edit className="w-4 h-4" /> Editar
                            </button>
                        )}
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
