import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { FolderOpen, FileText, Download, Search, HardDrive, Clock, FileCheck, Hash, Shield } from 'lucide-react';
import { maskHon } from '../utils/masks';
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

interface GEDProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function GED({ userName, onModuleHome, onLogout }: GEDProps) {
  // --- ROLE STATE ---
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);

  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<GEDDocument[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Ref para o container principal de arquivos
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUserRole();
    fetchDocuments();
  }, []);

  // Efeito para rolar para o topo quando a pasta (ou busca) mudar
  useEffect(() => {
    if (mainContentRef.current) {
        // Força o scroll para o topo instantaneamente
        mainContentRef.current.scrollTop = 0;
    }
  }, [selectedFolder, searchTerm]);

  // --- ROLE CHECK ---
  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        if (profile) {
            setUserRole(profile.role as 'admin' | 'editor' | 'viewer');
        }
    }
  };

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
            // Gera o ID visual baseado no seq_id do banco
            display_id: doc.contract?.seq_id ? String(doc.contract.seq_id).padStart(6, '0') : '-'
        }
      }));

      // 2. Recuperar metadados (tamanho) do Storage se não existir no banco
      // Agrupamos por contract_id (pasta no storage) para evitar chamadas excessivas
      const uniqueContractIds = Array.from(new Set(formattedDocs.map(d => d.contract?.id).filter(Boolean)));
      
      const sizesMap = new Map<string, number>();

      // Buscamos a lista de arquivos de cada pasta de contrato para pegar o metadata.size
      await Promise.all(uniqueContractIds.map(async (contractId) => {
        // Assume bucket 'contract-documents' baseado na lógica de upload
        const { data: files } = await supabase.storage.from('contract-documents').list(contractId);
        
        if (files) {
            files.forEach(f => {
                // O path no banco é "contract_id/nome_do_arquivo"
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
    // Tenta baixar do bucket correto. Se 'ged' falhar, tenta 'contract-documents'
    let { data } = await supabase.storage.from('contract-documents').createSignedUrl(path, 60);
    
    if (!data?.signedUrl) {
          // Fallback para bucket 'ged' caso seja legado
          const res = await supabase.storage.from('ged').createSignedUrl(path, 60);
          data = res.data;
    }

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    } else {
        alert('Erro ao gerar link de download. Arquivo não encontrado no Storage.');
    }
  };

  // Função para formatar bytes
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Filtragem
  const filteredDocs = documents.filter(doc => {
    const matchesFolder = selectedFolder ? doc.client_name === selectedFolder : true;
    const matchesSearch = searchTerm 
      ? doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        doc.hon_number_ref?.includes(searchTerm) ||
        doc.contract?.display_id?.includes(searchTerm)
      : true;
    return matchesFolder && matchesSearch;
  });

  // Cálculo do tamanho total
  const totalSize = filteredDocs.reduce((acc, doc) => acc + (doc.file_size || 0), 0);

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in duration-500 bg-gray-50/50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-sm font-black text-[#0a192f] uppercase tracking-[0.3em] flex items-center gap-3">
            <FolderOpen className="w-6 h-6 text-amber-500" /> GED - Acervo Digital
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gestão eletrônica de documentos e custódia de arquivos.</p>
            {/* Badge de Perfil */}
            {userRole && (
                <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase border flex items-center gap-1.5 ${
                    userRole === 'admin' 
                        ? 'bg-purple-50 text-purple-700 border-purple-100' 
                        : userRole === 'editor' 
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : 'bg-gray-50 text-gray-500 border-gray-100'
                }`}>
                    <Shield className="w-3 h-3" />
                    {userRole === 'admin' ? 'Administrador' : userRole === 'editor' ? 'Editor' : 'Visualizador'}
                </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* SIDEBAR: DIRETÓRIOS (CLIENTES) */}
        <div className="w-64 bg-white rounded-[2rem] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-[#0a192f]">
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center">
              <HardDrive className="w-4 h-4 mr-2 text-amber-500" /> Diretórios
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`w-full flex items-center px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!selectedFolder ? 'bg-[#0a192f] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <FolderOpen className="w-4 h-4 mr-3 shrink-0" />
              Geral
            </button>
            {folders.map(folder => (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`w-full flex items-center px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${selectedFolder === folder ? 'bg-[#0a192f] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <FolderOpen className={`w-4 h-4 mr-3 shrink-0 ${selectedFolder === folder ? 'text-amber-500' : 'text-amber-500/50'}`} />
                <span className="truncate text-left">{folder}</span>
              </button>
            ))}
          </div>
        </div>

        {/* MAIN: ARQUIVOS */}
        <div className="flex-1 flex flex-col bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          {/* Toolbar */}
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
            <h3 className="text-[10px] font-black text-[#0a192f] uppercase tracking-widest flex items-center">
              {selectedFolder ? <><FolderOpen className="w-5 h-5 mr-3 text-amber-500 shrink-0" /> {selectedFolder}</> : 'Todos os Documentos'}
              <span className="ml-3 bg-gray-100 text-[#0a192f] text-[9px] font-black px-2 py-0.5 rounded-lg border border-gray-200">{filteredDocs.length}</span>
              <span className="ml-2 text-[9px] text-gray-300 font-bold uppercase tracking-tighter">({formatBytes(totalSize)})</span>
            </h3>
            <div className="relative w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
              <input 
                type="text" 
                placeholder="BUSCAR ARQUIVO, ID OU HON..." 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-[#0a192f] transition-all text-[#0a192f] placeholder:text-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* File Grid */}
          <div ref={mainContentRef} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-full gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a192f]"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acessando Storage...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
               <EmptyState 
                  icon={FolderOpen}
                  title="Acervo Vazio"
                  description={
                      searchTerm 
                      ? "Nenhum arquivo corresponde aos critérios de busca informados." 
                      : selectedFolder 
                        ? "Este diretório de cliente não possui arquivos vinculados." 
                        : "O repositório GED está sincronizado, mas não há documentos registrados."
                  }
                  className="h-full justify-center"
               />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDocs.map((doc) => (
                  <div key={doc.id} className="group relative bg-white border border-gray-100 rounded-[1.5rem] p-5 hover:border-amber-200 hover:shadow-xl transition-all overflow-hidden">
                    
                    {/* Header: Icon & Type */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-red-50 text-red-500 p-3 rounded-2xl">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {doc.file_type === 'contract' ? (
                            <span className="bg-emerald-50 text-emerald-700 text-[8px] uppercase font-black px-2 py-1 rounded-lg border border-emerald-100 flex items-center tracking-widest">
                            <FileCheck className="w-3 h-3 mr-1" /> Contrato
                            </span>
                        ) : (
                            <span className="bg-blue-50 text-blue-700 text-[8px] uppercase font-black px-2 py-1 rounded-lg border border-blue-100 tracking-widest">
                            Proposta
                            </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mb-6">
                      <h4 className="text-xs font-black text-[#0a192f] uppercase tracking-tight truncate mb-1" title={doc.file_name}>
                        {doc.file_name}
                      </h4>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">{doc.client_name}</p>
                    </div>

                    {/* Footer Info */}
                    <div className="space-y-3 pt-4 border-t border-gray-50">
                      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-tighter text-gray-300">
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1.5 text-amber-500" /> {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}</span>
                        <span>{formatBytes(doc.file_size || 0)}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        {doc.contract?.display_id && (
                             <div className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-[9px] font-black text-[#0a192f] tracking-widest truncate flex items-center">
                                <Hash className="w-3 h-3 mr-1 text-amber-500" /> {doc.contract.display_id}
                             </div>
                        )}
                        {doc.hon_number_ref && (
                            <div className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-[9px] font-black text-[#0a192f] tracking-widest truncate">
                            HON: {maskHon(doc.hon_number_ref)}
                            </div>
                        )}
                      </div>
                    </div>

                    {/* Action: Download (Overlay) */}
                    <div className="absolute inset-0 bg-[#0a192f]/90 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                      <button 
                        onClick={() => handleDownload(doc.file_path)}
                        className="bg-white text-[#0a192f] px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all active:scale-95 flex items-center border border-white/20"
                      >
                        <Download className="w-4 h-4 mr-2 text-amber-500" /> Baixar PDF
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