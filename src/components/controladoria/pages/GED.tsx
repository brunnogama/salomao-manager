import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  FolderOpen, FileText, Download, Search, HardDrive, Clock, FileCheck, Hash
} from 'lucide-react';

// ROTA CORRIGIDA: Saindo de /pages e entrando em /utils (dentro de controladoria)
import { maskHon } from '../utils/masks';

// ROTA CORRIGIDA: Saindo de /pages e entrando em /ui (dentro de controladoria)
import { EmptyState } from '../ui/EmptyState';

interface GEDDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: 'proposal' | 'contract';
  file_size?: number;
  uploaded_at: string;
  hon_number_ref?: string;
  contract: {
    id: string;
    seq_id?: number; // Campo do banco
    status: string;
    display_id?: string; // Formatado para UI
    clients: {
      name: string;
    } | null;
  };
  client_name: string;
}

export function GED() {


  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<GEDDocument[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Ref para o container principal de arquivos
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

    fetchDocuments();
  }, []);

  // Efeito para rolar para o topo quando a pasta (ou busca) mudar
  useEffect(() => {
    if (mainContentRef.current) {
      // Força o scroll para o topo instantaneamente
      mainContentRef.current.scrollTop = 0;
    }
  }, [selectedFolder, searchTerm]);



  const fetchDocuments = async () => {
    setLoading(true);

    // 1. Buscamos os documentos do banco trazendo o seq_id do contrato
    const { data, error } = await supabase
      .from('contract_documents')
      .select(`
        *,
        contract:contracts (
          id,
          seq_id,
          status,
          clients (name)
        )
      `)
      .order('uploaded_at', { ascending: false });

    if (!error && data) {
      let formattedDocs: GEDDocument[] = data.map((doc: any) => ({
        ...doc,
        client_name: doc.contract?.clients?.name || 'Sem Cliente',
        contract: {
          ...doc.contract,
          display_id: doc.contract?.seq_id ? String(doc.contract.seq_id).padStart(6, '0') : '-'
        }
      }));

      // 2. Recuperar metadados (tamanho) do Storage se não existir no banco
      const uniqueContractIds = Array.from(new Set(formattedDocs.map(d => d.contract?.id).filter(Boolean)));

      const sizesMap = new Map<string, number>();

      await Promise.all(uniqueContractIds.map(async (contractId) => {
        const { data: files } = await supabase.storage.from('contract-documents').list(contractId);

        if (files) {
          files.forEach(f => {
            const fullPath = `${contractId}/${f.name}`;
            if (f.metadata && f.metadata.size) {
              sizesMap.set(fullPath, f.metadata.size);
            }
          });
        }
      }));

      // 3. Mesclar tamanhos recuperados
      formattedDocs = formattedDocs.map(doc => ({
        ...doc,
        file_size: doc.file_size || sizesMap.get(doc.file_path) || 0
      }));

      setDocuments(formattedDocs);

      // Extrair lista única de clientes (pastas)
      const uniqueClients = Array.from(new Set(formattedDocs.map((d: any) => d.client_name))) as string[];
      setFolders(uniqueClients.sort());
    }
    setLoading(false);
  };

  const handleDownload = async (path: string) => {
    let { data } = await supabase.storage.from('contract-documents').createSignedUrl(path, 60);

    if (!data?.signedUrl) {
      const res = await supabase.storage.from('ged').createSignedUrl(path, 60);
      data = res.data;
    }

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    } else {
      alert('Erro ao gerar link de download. Arquivo não encontrado no Storage.');
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const filteredDocs = documents.filter(doc => {
    const matchesFolder = selectedFolder ? doc.client_name === selectedFolder : true;
    const matchesSearch = searchTerm
      ? doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.hon_number_ref?.includes(searchTerm) ||
      doc.contract?.display_id?.includes(searchTerm)
      : true;
    return matchesFolder && matchesSearch;
  });

  const totalSize = filteredDocs.reduce((acc, doc) => acc + (doc.file_size || 0), 0);

  return (
    <div className="flex flex-col h-screen bg-gray-50 p-6 space-y-6 overflow-hidden">

      {/* 1. Header - Salomão Design System */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-3 shadow-lg">
            <FolderOpen className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">GED</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Gestão Eletrônica de Documentos</p>
          </div>
        </div>


      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">

        {/* Sidebar de Diretórios */}
        <div className="w-64 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
              <HardDrive className="w-4 h-4 mr-2" /> Diretórios
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`w-full flex items-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!selectedFolder ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <FolderOpen className="w-4 h-4 mr-2 shrink-0" />
              Todos os Arquivos
            </button>
            <div className="h-px bg-gray-100 my-2"></div>
            {folders.map(folder => (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`w-full flex items-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${selectedFolder === folder ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <FolderOpen className={`w-4 h-4 mr-2 shrink-0 ${selectedFolder === folder ? 'text-white' : 'text-[#1e3a8a]'}`} />
                <span className="truncate text-left">{folder}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Listagem de Arquivos */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <h3 className="text-xs font-black text-[#0a192f] uppercase tracking-widest flex items-center">
                {selectedFolder ? <><FolderOpen className="w-4 h-4 mr-2 text-[#1e3a8a]" /> {selectedFolder}</> : 'Todos os Documentos'}
              </h3>
              <div className="flex items-center gap-2">
                <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">{filteredDocs.length} itens</span>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">({formatBytes(totalSize)})</span>
              </div>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar arquivo, ID ou HON..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-[#1e3a8a] transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div ref={mainContentRef} className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#1e3a8a]" />
                <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando repositório...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="Nenhum arquivo encontrado"
                description={
                  searchTerm
                    ? "Não encontramos arquivos com este nome. Tente outra busca."
                    : selectedFolder
                      ? "Esta pasta está vazia."
                      : "O GED ainda não possui documentos."
                }
                className="h-full justify-center"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDocs.map((doc) => (
                  <div key={doc.id} className="group relative bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-all overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-1 bg-[#1e3a8a] opacity-0 group-hover:opacity-100 transition-all"></div>

                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-red-50 text-red-600 p-2.5 rounded-xl">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {doc.file_type === 'contract' ? (
                          <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-emerald-100 flex items-center">
                            <FileCheck className="w-3 h-3 mr-1" /> Contrato
                          </span>
                        ) : (
                          <span className="bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-blue-100">
                            Proposta
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-xs font-black text-[#0a192f] truncate mb-1 uppercase tracking-tight" title={doc.file_name}>
                        {doc.file_name}
                      </h4>
                      <p className="text-[10px] font-bold text-gray-400 truncate uppercase tracking-widest">{doc.client_name}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}</span>
                        <span>{formatBytes(doc.file_size || 0)}</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {doc.contract?.display_id && (
                          <div className="bg-blue-50 border border-blue-100 rounded-lg px-2 py-1 text-[9px] font-black text-blue-600 truncate flex items-center uppercase tracking-widest">
                            <Hash className="w-3 h-3 mr-1" /> {doc.contract.display_id}
                          </div>
                        )}
                        {doc.hon_number_ref && (
                          <div className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-[9px] font-black text-gray-500 truncate uppercase tracking-widest">
                            HON: {maskHon(doc.hon_number_ref)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-[#0a192f]/90 rounded-2xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                      <button
                        onClick={() => handleDownload(doc.file_path)}
                        className="bg-white text-[#0a192f] px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all flex items-center active:scale-95"
                      >
                        <Download className="w-4 h-4 mr-2" /> Baixar PDF
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);