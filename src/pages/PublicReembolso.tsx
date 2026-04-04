import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, ChevronRight, CheckCircle2, AlertCircle, FileText, Loader2, Trash2, X, Star, ZoomIn } from 'lucide-react';
import { SearchableSelect } from '../components/crm/SearchableSelect';
import { convertPdfToTallImage } from '../utils/pdfToImage';

interface Collaborator {
  id: string;
  name: string;
  email?: string;
  leader_id?: string;
}

interface PublicReembolsoProps {
  isModal?: boolean;
  onClose?: () => void;
}

const normalizeString = (str: string) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, '');
};

interface FileConfig {
  reembolsavelCliente: boolean;
  clienteNome: string;
  observacao: string;
  thumbFile?: File;
  previewUrl?: string;
  isProcessing?: boolean;
}

export default function PublicReembolso({ isModal = false, onClose }: PublicReembolsoProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [selectedColab, setSelectedColab] = useState('');
  const [authorizers, setAuthorizers] = useState<Collaborator[]>([]);
  const [selectedAuthorizer, setSelectedAuthorizer] = useState('');
  const [clientsList, setClientsList] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState<number | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fileConfigs, setFileConfigs] = useState<FileConfig[]>([]);
  const [zoomImageURL, setZoomImageURL] = useState<string | null>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFavModal, setShowFavModal] = useState(false);

  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchCollaborators();
    fetchClients();

    const lastColab = localStorage.getItem('salomao_reembolso_last_colab');
    if (lastColab) {
      setSelectedColab(lastColab);
    }

    const lastAuth = localStorage.getItem('salomao_reembolso_last_authorizer');
    if (lastAuth) {
      setSelectedAuthorizer(lastAuth);
    }

    if (!isModal) {
      const hasSeenFavModal = localStorage.getItem('salomao_reembolso_fav_modal');
      if (!hasSeenFavModal) {
        setShowFavModal(true);
        localStorage.setItem('salomao_reembolso_fav_modal', 'true');
      }
    }
  }, [isModal]);

  useEffect(() => {
    if (collaborators.length > 0 && selectedColab) {
      const colab = collaborators.find(c => String(c.id) === String(selectedColab));
      if (colab?.leader_id) {
        setSelectedAuthorizer(String(colab.leader_id));
      }
    }
  }, [selectedColab, collaborators]);

  const fetchCollaborators = async () => {
    try {
      const getColabs = async () => {
        let { data, error } = await supabase.from('collaborators').select('id, name, leader_id, leader_ids, email').in('status', ['active', 'Ativo']);
        if (error || !data || data.length === 0) {
          const res = await supabase.from('collaborators').select('id, name, leader_id, leader_ids, email');
          data = res.data;
        }
        return data || [];
      };

      const getParts = async () => {
        let { data, error } = await supabase.from('partners').select('id, name, email').in('status', ['active', 'Ativo']);
        if (error || !data || data.length === 0) {
          const res = await supabase.from('partners').select('id, name, email');
          data = res.data;
        }
        return data || [];
      };

      const getTLs = async () => {
        const { data } = await supabase.from('team_leader').select('collaborator_id');
        return data || [];
      };

      const [colabsList, partsList, tls] = await Promise.all([getColabs(), getParts(), getTLs()]);
      const tlSet = new Set(tls.map((t: any) => String(t.collaborator_id)));

      colabsList.forEach((c: any) => {
        if (c.leader_id) {
          tlSet.add(String(c.leader_id));
        }
        if (c.leader_ids && Array.isArray(c.leader_ids)) {
          c.leader_ids.forEach((id: string) => tlSet.add(String(id)));
        }
      });

      const idToNameMap = new Map<string, string>();
      colabsList.forEach((c: any) => {
        if (c?.name) idToNameMap.set(String(c.id), c.name.trim());
      });
      partsList.forEach((p: any) => {
        if (p?.name) idToNameMap.set(String(p.id), p.name.trim());
      });

      const authMap = new Map<string, Collaborator>();
      partsList.forEach((p: any) => {
        if (p?.name && !authMap.has(p.name.trim().toLowerCase())) {
          authMap.set(p.name.trim().toLowerCase(), { id: p.id, name: p.name.trim(), email: p.email });
        }
      });
      colabsList.forEach((c: any) => {
        if (tlSet.has(String(c.id)) && c?.name && !authMap.has(c.name.trim().toLowerCase())) {
          authMap.set(c.name.trim().toLowerCase(), { id: c.id, name: c.name.trim(), email: c.email });
        }
      });

      const sortedAuth = Array.from(authMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      setAuthorizers(sortedAuth);

      const allNamesMap = new Map<string, Collaborator>();
      colabsList.forEach((c: any) => {
        if (c?.name && !allNamesMap.has(c.name.trim().toLowerCase())) {
          let primaryLeader = c.leader_id || (c.leader_ids && c.leader_ids.length > 0 ? c.leader_ids[0] : null);
          
          if (primaryLeader) {
             const leaderName = idToNameMap.get(String(primaryLeader));
             if (leaderName) {
                const authorizerMatch = authMap.get(leaderName.toLowerCase());
                if (authorizerMatch) {
                   primaryLeader = authorizerMatch.id;
                }
             }
          }
          
          allNamesMap.set(c.name.trim().toLowerCase(), { id: c.id, name: c.name.trim(), leader_id: primaryLeader, email: c.email });
        }
      });
      partsList.forEach((p: any) => {
        if (p?.name && !allNamesMap.has(p.name.trim().toLowerCase())) {
          allNamesMap.set(p.name.trim().toLowerCase(), { id: p.id, name: p.name.trim(), email: p.email });
        }
      });

      const sortedColabs = Array.from(allNamesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      setCollaborators(sortedColabs);

    } catch (err) {
      console.error('Erro ao buscar integrantes', err);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from('clients').select('name');
      if (error) throw error;
      if (data) {
        const uniqueNames = Array.from(new Set(data.map(c => c.name).filter(Boolean))).sort();
        setClientsList(uniqueNames);
      }
    } catch (err) {
      console.error('Erro ao buscar clientes', err);
    }
  };

  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsProcessingFiles(true);
      const addedFiles = Array.from(e.target.files);
      const newConfigs: FileConfig[] = [];

      for (const file of addedFiles) {
        let thumbFile = undefined;
        let previewUrl = undefined;
        
        if (file.type.startsWith('image/')) {
           previewUrl = URL.createObjectURL(file);
        }
        
        if (file.type === 'application/pdf') {
          try {
            thumbFile = await convertPdfToTallImage(file);
          } catch (err) {
            console.error(`Erro ao gerar miniatura do PDF ${file.name}:`, err);
          }
        }
        if (thumbFile) {
          previewUrl = URL.createObjectURL(thumbFile);
        }

        newConfigs.push({
          reembolsavelCliente: false,
          clienteNome: '',
          observacao: '',
          thumbFile,
          previewUrl
        });
      }

      setFiles(prev => [...prev, ...addedFiles]);
      setFileConfigs(prev => [...prev, ...newConfigs]);
      setIsProcessingFiles(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    const configLine = fileConfigs[index];
    if (configLine && configLine.previewUrl) {
      URL.revokeObjectURL(configLine.previewUrl);
    }
    
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFileConfigs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitBatch = async () => {
    if (!selectedColab) {
      setFormError('Por favor, selecione seu nome.');
      return;
    }
    if (files.length === 0) {
      setFormError('Por favor, anexe no mínimo um recibo.');
      return;
    }

    for (let i = 0; i < files.length; i++) {
      if (files[i].type === 'application/pdf' && !fileConfigs[i]?.thumbFile) {
        setFormError(`O PDF "${files[i].name}" não pôde ser convertido automaticamente. Por favor, tire um "print screen" do recibo e envie como imagem.`);
        return;
      }
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      const payloadArray: any[] = [];
      const publicUrls: string[] = [];
      const publicThumbUrls: (string | null)[] = [];

      for (let idx = 0; idx < files.length; idx++) {
        const file = files[idx];
        const config = fileConfigs[idx] || { reembolsavelCliente: false, clienteNome: '', observacao: '' };

        const fileExt = file.name.split('.').pop();
        const baseId = crypto.randomUUID();
        const fileName = `${baseId}.${fileExt}`;
        const filePath = `recibos/${fileName}`;

        await supabase.storage.from('gastos_reembolsos').upload(filePath, file);

        const { data: publicUrlData } = supabase.storage.from('gastos_reembolsos').getPublicUrl(filePath);
        const fileUrl = publicUrlData.publicUrl;

        publicUrls.push(fileUrl);

        let thumbUrl = null;
        if (config.thumbFile) {
          const thumbFileName = `${baseId}_thumb.jpg`;
          const thumbFilePath = `recibos/${thumbFileName}`;
          await supabase.storage.from('gastos_reembolsos').upload(thumbFilePath, config.thumbFile);

          const { data: thumbData } = supabase.storage.from('gastos_reembolsos').getPublicUrl(thumbFilePath);
          thumbUrl = thumbData.publicUrl;
        }
        publicThumbUrls.push(thumbUrl);

        payloadArray.push({
          colaborador_id: selectedColab,
          autorizador_id: selectedAuthorizer || null,
          reembolsavel_cliente: config.reembolsavelCliente,
          cliente_nome: config.reembolsavelCliente ? config.clienteNome : null,
          recibo_url: fileUrl,
          numero_recibo: '',
          fornecedor_nome: '',
          fornecedor_cnpj: '',
          data_despesa: null,
          valor: 0,
          descricao: '',
          status: selectedAuthorizer ? 'pendente_autorizacao' : 'pendente'
        });
      }

      const { data: insertedRows, error } = await supabase.from('reembolsos').insert(payloadArray).select();
      if (error) throw error;

      try {
        const webhookUrl = "https://hook.us2.make.com/ek933ugsc18euo3uwv9eha6mgk8ngvws";
        const solicitanteObj = collaborators.find(c => String(c.id) === String(selectedColab));
        let autorizadorObj = null;
        if (selectedAuthorizer) {
          autorizadorObj = authorizers.find(a => String(a.id) === String(selectedAuthorizer));
        }

        if (insertedRows && insertedRows.length > 0) {
          for (let i = 0; i < insertedRows.length; i++) {
            const r = insertedRows[i];
            const config = fileConfigs[i] || { reembolsavelCliente: false, clienteNome: '', observacao: '' };
            const tUrl = publicThumbUrls[i];

            const payloadMake = {
              evento: selectedAuthorizer ? "solicitacao_autorizacao" : "novo_reembolso_direto",
              reembolso: {
                id: r.id,
                status_banco: selectedAuthorizer ? "pendente_autorizacao" : "pendente",
                autorizador_id_banco: selectedAuthorizer || null,
                colaborador_id_banco: selectedColab,
                valor: "0,00",
                descricao: config.observacao || "Aguardando Apuração",
                fornecedor: "Não processado pela IA",
                link_autorizacao: `https://salomao-manager.pages.dev/reembolso/autorizar/${r.id}`,
                recibo_url: tUrl || r.recibo_url,
                recibo_original_url: r.recibo_url,
                recibo_thumb_url: tUrl || r.recibo_url,
                reembolsavel_cliente: config.reembolsavelCliente ? "Sim" : "Não",
                cliente_nome: config.clienteNome || "-",
                observacao: config.observacao || "-"
              },
              solicitante: {
                id: solicitanteObj?.id || '',
                nome: solicitanteObj?.name || 'Membro do time',
                email: solicitanteObj?.email || ''
              },
              autorizador: autorizadorObj ? {
                id: autorizadorObj.id,
                nome: autorizadorObj.name,
                email: autorizadorObj.email || ''
              } : null
            };

            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payloadMake)
            }).catch(e => console.error("Falha silenciosa ao chamar Make:", e));
          }
        }
      } catch (webhookErr) {
        console.error("Erro no fluxo do disparo Make:", webhookErr);
      }

      setStep(2);
    } catch (err: any) {
      console.error('Erro ao enviar lote de reembolsos', err);
      setFormError('Houve um erro ao enviar seus recibos. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${isModal ? 'w-full' : 'min-h-screen items-center justify-center p-4 bg-gray-50'} flex flex-col transition-all duration-300`}>
      <div className={`w-full transition-all duration-500 mx-auto ${step === 2 ? 'max-w-6xl' : 'max-w-xl'} ${isModal ? '' : ''}`}>

        {!isModal && (
          <div className="text-center mb-4">
            <div className="flex justify-center mb-4">
              <img
                src="/logo-salomao.png"
                alt="Salomão"
                className="h-12 md:h-16 w-auto object-contain drop-shadow-sm transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-[#112240]">Solicitação de Reembolso</h1>
            <p className="text-sm md:text-base text-gray-500 mt-1">Envie seu comprovante para o financeiro.</p>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 md:p-6 relative overflow-hidden">

          {isModal && (
            <>
              <div className="text-center mb-6 mt-2">
                <h1 className="text-2xl font-black text-[#112240]">Nova Solicitação Manual</h1>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 z-50 bg-gray-50 p-2.5 rounded-full shadow-sm border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all opacity-70 hover:opacity-100 hidden sm:flex"
                  title="Fechar Janela (ESC)"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              )}
            </>
          )}

          <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-[#1e3a8a] to-[#d4af37] transition-all duration-500"
              style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
            />
          </div>

          {formError && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {formError}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Solicitante:</label>
                <SearchableSelect
                  value={selectedColab}
                  onChange={(val) => {
                    setSelectedColab(val);
                    localStorage.setItem('salomao_reembolso_last_colab', val);
                    const colab = collaborators.find(c => String(c.id) === String(val));
                    if (colab?.leader_id) {
                      setSelectedAuthorizer(String(colab.leader_id));
                      localStorage.setItem('salomao_reembolso_last_authorizer', String(colab.leader_id));
                    } else {
                      setSelectedAuthorizer('');
                      localStorage.removeItem('salomao_reembolso_last_authorizer');
                    }
                  }}
                  options={collaborators.map(c => ({ id: c.id, name: c.name }))}
                  placeholder="Selecione seu nome..."
                  className="bg-gray-50 rounded-xl"
                  disableFormatting
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Requer autorização de:</label>
                <SearchableSelect
                  value={selectedAuthorizer}
                  onChange={(val) => {
                    setSelectedAuthorizer(val);
                    if (val) {
                      localStorage.setItem('salomao_reembolso_last_authorizer', val);
                    } else {
                      localStorage.removeItem('salomao_reembolso_last_authorizer');
                    }
                  }}
                  options={authorizers.map(a => ({ id: a.id, name: a.name }))}
                  placeholder="Escolha o líder direto ou sócio..."
                  className="bg-gray-50 rounded-xl"
                  disableFormatting
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Recibos (PDF ou Imagem)</label>
                <div className={`border-2 border-dashed rounded-2xl p-8 transition-colors text-center relative ${isProcessingFiles ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200 hover:bg-gray-50 cursor-pointer'}`}>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    disabled={isProcessingFiles}
                    className={`absolute inset-0 w-full h-full opacity-0 ${isProcessingFiles ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  />
                  <div className="flex flex-col items-center pointer-events-none">
                    {isProcessingFiles ? (
                      <>
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-3 shadow-inner">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                        <span className="font-bold text-amber-700 mb-1">Costurando Páginas do PDF...</span>
                        <span className="text-xs font-semibold text-amber-600">O sistema está lendo o PDF e ajustando para enviar sem erros. Pode levar alguns segundos.</span>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-blue-50 text-[#1e3a8a] rounded-full flex items-center justify-center mb-3">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="font-medium text-[#112240]">Clique ou arraste arquivos para enviar</span>
                        <span className="text-xs text-gray-500 mt-1">Imagens (JPG, PNG) ou PDFs simultâneos</span>
                      </>
                    )}
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="mt-4 flex flex-col gap-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{files.length} arquivo(s) selecionado(s):</p>
                    {files.map((f, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] relative group overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                         
                         <div className="w-full md:w-32 h-36 md:h-auto min-h-[140px] bg-slate-50 rounded-[1rem] border border-slate-200/60 overflow-hidden flex flex-col items-center justify-center shrink-0 shadow-inner mt-6 md:mt-0 relative group/img">
                            {fileConfigs[idx]?.previewUrl ? (
                               <>
                                 <img 
                                   src={fileConfigs[idx].previewUrl} 
                                   alt={f.name} 
                                   className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105 cursor-zoom-in" 
                                   onClick={() => setZoomImageURL(fileConfigs[idx]?.previewUrl || null)}
                                 />
                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                                    <ZoomIn className="w-6 h-6 text-white drop-shadow-md" />
                                 </div>
                               </>
                            ) : (
                               <>
                                 <FileText className="w-8 h-8 text-slate-300 mb-2" />
                                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center px-2">Anexo sem Previa</span>
                               </>
                            )}
                         </div>

                         <div className="flex-1 flex flex-col py-1">
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-sm font-black text-[#112240] truncate pr-8 tracking-tight" title={f.name}>
                                {f.name}
                              </span>
                              <button onClick={() => handleRemoveFile(idx)} className="p-2 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-xl transition-colors absolute top-3 right-3" title="Remover Arquivo">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center gap-3 bg-blue-50/40 p-3 rounded-xl border border-blue-50">
                                <input
                                  type="checkbox"
                                  id={`reembolsavel-${idx}`}
                                  checked={fileConfigs[idx]?.reembolsavelCliente || false}
                                  onChange={(e) => {
                                    const newConfigs = [...fileConfigs];
                                    newConfigs[idx].reembolsavelCliente = e.target.checked;
                                    setFileConfigs(newConfigs);
                                  }}
                                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 border-gray-300 transition-all cursor-pointer"
                                />
                                <label htmlFor={`reembolsavel-${idx}`} className="text-xs font-bold text-blue-900 cursor-pointer select-none">
                                  Cobrar do Cliente faturável?
                                </label>
                              </div>

                              {fileConfigs[idx]?.reembolsavelCliente && (
                                <div className="animate-in slide-in-from-top-1 fade-in duration-200">
                                  <div className="flex items-center justify-between mb-1.5 ml-1">
                                    <label className="text-[10px] font-bold text-blue-800 uppercase tracking-widest block">Qual Cliente?</label>
                                    {idx > 0 && fileConfigs[0]?.reembolsavelCliente && fileConfigs[0]?.clienteNome && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newConfigs = [...fileConfigs];
                                          newConfigs[idx].clienteNome = fileConfigs[0].clienteNome;
                                          setFileConfigs(newConfigs);
                                        }}
                                        className="text-[10px] font-bold text-blue-600 hover:text-blue-900 underline decoration-blue-200 underline-offset-2 transition-colors"
                                      >
                                        Copiar do 1º Recibo
                                      </button>
                                    )}
                                  </div>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={fileConfigs[idx]?.clienteNome || ''}
                                      onFocus={() => setShowAutocomplete(idx)}
                                      onBlur={() => setTimeout(() => setShowAutocomplete(null), 200)}
                                      onChange={(e) => {
                                        const words = e.target.value.toLowerCase().split(' ');
                                        const formatted = words.map((word) => {
                                          if (['de', 'da', 'do', 'das', 'dos', 'e', 'em'].includes(word)) return word;
                                          return word.charAt(0).toUpperCase() + word.slice(1);
                                        }).join(' ');

                                        const newConfigs = [...fileConfigs];
                                        newConfigs[idx].clienteNome = formatted;
                                        setFileConfigs(newConfigs);
                                        setShowAutocomplete(idx);
                                      }}
                                      placeholder="Ex: Salomão Advogados..."
                                      className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    />
                                    {showAutocomplete === idx && fileConfigs[idx]?.clienteNome.trim().length > 0 && (
                                      <ul className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] max-h-48 overflow-y-auto custom-scrollbar p-1">
                                        {clientsList
                                          .filter(c => normalizeString(c).includes(normalizeString(fileConfigs[idx].clienteNome)) && normalizeString(c) !== normalizeString(fileConfigs[idx].clienteNome))
                                          .map((c, i) => (
                                            <li
                                              key={i}
                                              className="px-4 py-2.5 m-0.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-blue-50/80 hover:text-blue-700 cursor-pointer transition-colors"
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                const newConfigs = [...fileConfigs];
                                                newConfigs[idx].clienteNome = c;
                                                setFileConfigs(newConfigs);
                                                setShowAutocomplete(null);
                                              }}
                                            >
                                              {c}
                                            </li>
                                          ))}
                                      </ul>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="pt-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1 block">Breve Observação (Opcional)</label>
                                <textarea
                                  rows={1}
                                  placeholder="Detalhes para a liderança..."
                                  value={fileConfigs[idx]?.observacao || ''}
                                  onChange={(e) => {
                                    const newConfigs = [...fileConfigs];
                                    newConfigs[idx].observacao = e.target.value;
                                    setFileConfigs(newConfigs);
                                  }}
                                  className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-none min-h-[46px]"
                                />
                              </div>
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmitBatch}
                disabled={isSubmitting || files.length === 0}
                className="w-full py-4 bg-[#112240] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1e3a8a] transition-all disabled:opacity-70"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Salvando recibos no banco...</>
                ) : (
                  <>Enviar Solicitação <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="py-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-black text-[#112240] mb-2">Reembolso Solicitado!</h2>
              <p className="text-gray-500 max-w-sm mb-8">
                Foram enviados {files.length} recibos com sucesso.
                Eles aguardarão autorização ou seguirão para leitura automática do financeiro.
              </p>
              <button
                onClick={() => {
                  if (isModal && onClose) onClose();
                  else window.location.reload();
                }}
                className="py-3 px-8 bg-gray-100 text-[#112240] hover:bg-gray-200 rounded-xl font-bold text-sm transition-colors"
              >
                {isModal ? 'Fechar Janela' : 'Enviar nova solicitação'}
              </button>
            </div>
          )}

        </div>
      </div>

      {showFavModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#112240]/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center border border-gray-100">
            <div className="w-16 h-16 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-5 border border-yellow-100 shadow-inner">
              <Star className="w-8 h-8 fill-yellow-400 text-yellow-500" />
            </div>
            <h2 className="text-xl font-black text-[#112240] mb-3">Acesso Rápido</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Para facilitar seus próximos reembolsos, salve esta página nos favoritos do seu navegador pressionando as teclas <strong className="text-[#112240] bg-gray-100 px-1.5 py-0.5 rounded">Ctrl+D</strong> (ou Cmd+D), ou clique na estrela na barra de endereços.
            </p>
            <button
              onClick={() => setShowFavModal(false)}
              className="w-full py-3.5 bg-[#112240] text-white rounded-xl font-bold hover:bg-[#1e3a8a] shadow-lg shadow-blue-900/20 transition-all active:scale-95"
            >
              Entendi!
            </button>
          </div>
        </div>
      )}

      {zoomImageURL && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setZoomImageURL(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button 
              className="absolute -top-12 right-0 md:-right-12 text-white/70 hover:text-white p-2 transition-colors bg-black/20 hover:bg-black/40 rounded-full"
              onClick={() => setZoomImageURL(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <img 
              src={zoomImageURL} 
              alt="Visualização Ampliada" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
