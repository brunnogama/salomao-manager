import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, ChevronRight, CheckCircle2, AlertCircle, FileText, Loader2, ArrowLeft, Trash2, Plus, ExternalLink, ZoomIn, ZoomOut, X, Star } from 'lucide-react';
import { SearchableSelect } from '../components/crm/SearchableSelect';

interface Collaborator {
  id: string;
  name: string;
}

interface ExtractedData {
  numero_recibo: string;
  fornecedor_nome: string;
  fornecedor_cnpj: string;
  data_despesa: string;
  valor: number;
  valorString?: string;
  descricao: string;
}

interface PublicReembolsoProps {
  isModal?: boolean;
  onClose?: () => void;
}

const normalizeString = (str: string) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, '');
};

export default function PublicReembolso({ isModal = false, onClose }: PublicReembolsoProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [selectedColab, setSelectedColab] = useState('');
  const [reembolsavelCliente, setReembolsavelCliente] = useState(false);
  const [clienteNome, setClienteNome] = useState('');
  const [clientsList, setClientsList] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publicFileUrl, setPublicFileUrl] = useState('');
  const [showFavModal, setShowFavModal] = useState(false);
  
  const [imgScale, setImgScale] = useState(1);
  const handleZoomIn = () => setImgScale(s => Math.min(s + 0.5, 4));
  const handleZoomOut = () => setImgScale(s => Math.max(s - 0.5, 0.5));

  const [extractedData, setExtractedData] = useState<ExtractedData[]>([{
    numero_recibo: '',
    fornecedor_nome: '',
    fornecedor_cnpj: '',
    data_despesa: '',
    valor: 0,
    valorString: '0,00',
    descricao: ''
  }]);

  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchCollaborators();
    fetchClients();

    const lastColab = localStorage.getItem('salomao_reembolso_last_colab');
    if (lastColab) {
      setSelectedColab(lastColab);
    }

    if (!isModal) {
      const hasSeenFavModal = localStorage.getItem('salomao_reembolso_fav_modal');
      if (!hasSeenFavModal) {
        setShowFavModal(true);
        localStorage.setItem('salomao_reembolso_fav_modal', 'true');
      }
    }
  }, [isModal]);

  const fetchCollaborators = async () => {
    try {
      const allNamesMap = new Map<string, Collaborator>();

      const safeFetch = async (table: string) => {
        // Tenta com status = 'active' ou 'Ativo'
        const { data, error } = await supabase.from(table).select('id, name').in('status', ['active', 'Ativo']);
        if (error) {
          // Se falhar (provavelmente a coluna status não existe), busca tudo
          const fallback = await supabase.from(table).select('id, name');
          return fallback.data || [];
        }
        return data || [];
      };

      const [colabs, partes] = await Promise.all([
        safeFetch('collaborators'),
        safeFetch('partners')
      ]);

      const addToList = (list: any[]) => {
        list.forEach(item => {
          if (item?.name) {
            const key = item.name.trim().toLowerCase();
            if (!allNamesMap.has(key)) {
              allNamesMap.set(key, { id: item.id, name: item.name.trim() });
            }
          }
        });
      };

      addToList(colabs);
      addToList(partes);

      const sortedList = Array.from(allNamesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      setCollaborators(sortedList);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadAndExtract = async () => {
    if (!selectedColab) {
      setFormError('Por favor, selecione seu nome.');
      return;
    }
    if (!file) {
      setFormError('Por favor, anexe o recibo.');
      return;
    }

    setFormError('');
    setIsUploading(true);

    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `recibos/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('gastos_reembolsos')
        .upload(filePath, file);

      if (uploadError) {
        // Fallback in case bucket doesn't exist yet for testing without breaking flow
        console.error('Upload falhou. Verifique se o bucket gastos_reembolsos existe e tem políticas públicas.', uploadError);
        alert('Erro no upload. Para testar sem o bucket, mockaremos os dados.');
      }

      // We get public URL (or construct it if upload failed for UI mock)
      const { data: publicUrlData } = supabase.storage.from('gastos_reembolsos').getPublicUrl(filePath);
      const fileUrl = publicUrlData.publicUrl;
      setPublicFileUrl(fileUrl);
      
      setIsUploading(false);
      setIsExtracting(true);

      // 2. Call Make.com Webhook if configured
      const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_REEMBOLSO_EXTRACT || 'https://hook.us2.make.com/8e7s11ns13rgpffbtyduy5kt93zzrf53';
      
      if (webhookUrl && webhookUrl !== 'SUA_URL_DO_MAKE_AQUI') {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_url: fileUrl, colaborador_id: selectedColab })
        });
        
        if (response.ok) {
          let makeData: any = {};
          try {
            const rawText = await response.text();
            makeData = JSON.parse(rawText);
          } catch(e) {
            console.warn("Webhook do Make não retornou um JSON válido (talvez esteja retornando 'Accepted').", e);
          }

          // Assume the make webhook returns these fields
          // Transform response in array in case Make returns single object
          const dataArray = Array.isArray(makeData) ? makeData : [makeData];

          const formattedData = dataArray.map((item: any) => {
            const valNum = parseFloat(item.valor) || 0;
            return {
              numero_recibo: item.numero_recibo || '',
              fornecedor_nome: item.fornecedor_nome || '',
              fornecedor_cnpj: item.fornecedor_cnpj || '',
              data_despesa: item.data_despesa || '',
              valor: valNum,
              valorString: valNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
              descricao: item.descricao || ''
            };
          });

          setExtractedData(formattedData.length > 0 ? formattedData : [{
            numero_recibo: '',
            fornecedor_nome: '',
            fornecedor_cnpj: '',
            data_despesa: '',
            valor: 0,
            valorString: '0,00',
            descricao: ''
          }]);
        } else {
          console.warn('Webhook do Make retornou erro de status. Ignorando Extração de IA.');
          setExtractedData([{
            numero_recibo: '',
            fornecedor_nome: '',
            fornecedor_cnpj: '',
            data_despesa: '',
            valor: 0,
            valorString: '0,00',
            descricao: ''
          }]);
        }
      } else {
        // Mocking extraction delay for demonstration
        await new Promise(resolve => setTimeout(resolve, 2000));
        setExtractedData([{
          numero_recibo: 'MOCK-12345',
          fornecedor_nome: 'Fornecedor Exemplo Ltda',
          fornecedor_cnpj: '00.000.000/0001-00',
          data_despesa: new Date().toISOString().split('T')[0],
          valor: 150.00,
          valorString: '150,00',
          descricao: 'Despesa mockada para teste porque o Webhook não está configurado.'
        }]);
      }

      setIsExtracting(false);
      setStep(2);
      
    } catch (err: any) {
      console.error(err);
      setFormError('Erro ao processar o recibo. ' + (err.message || ''));
      setIsUploading(false);
      setIsExtracting(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = extractedData.map(item => ({
        colaborador_id: selectedColab,
        reembolsavel_cliente: reembolsavelCliente,
        cliente_nome: reembolsavelCliente ? clienteNome : null,
        recibo_url: publicFileUrl,
        numero_recibo: item.numero_recibo,
        fornecedor_nome: item.fornecedor_nome,
        fornecedor_cnpj: item.fornecedor_cnpj,
        data_despesa: item.data_despesa,
        valor: item.valor,
        descricao: item.descricao
      }));

      const { error } = await supabase.from('reembolsos').insert(payload);

      if (error) {
        throw error;
      }

      setStep(3);
    } catch (err: any) {
      console.error('Erro ao enviar reembolso', err);
      alert('Houve um erro ao enviar seu reembolso: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateItem = (index: number, field: keyof ExtractedData, value: any) => {
    const newData = [...extractedData];
    newData[index] = { ...newData[index], [field]: value };
    setExtractedData(newData);
  };

  const handleRemoveItem = (index: number) => {
    setExtractedData(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleAddItem = () => {
    setExtractedData(prev => [...prev, {
      numero_recibo: '',
      fornecedor_nome: '',
      fornecedor_cnpj: '',
      data_despesa: '',
      valor: 0,
      valorString: '0,00',
      descricao: ''
    }]);
  };

  return (
    <div className={`${isModal ? 'w-full' : 'min-h-screen items-center justify-center p-4 bg-gray-50'} flex flex-col transition-all duration-300`}>
      <div className={`w-full transition-all duration-500 mx-auto ${step === 2 ? 'max-w-6xl' : 'max-w-xl'} ${isModal ? '' : ''}`}>
        
        {/* Header Branding */}
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

        {/* Form Container */}
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

          {/* Progress Bar */}
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
                  }}
                  options={collaborators.map(c => ({ id: c.id, name: c.name }))}
                  placeholder="Selecione seu nome..."
                  className="bg-gray-50 rounded-xl"
                  disableFormatting
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Recibo (PDF ou Imagem)</label>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:bg-gray-50 transition-colors text-center cursor-pointer group relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-blue-50 text-[#1e3a8a] rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      {file ? <FileText className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                    </div>
                    {file ? (
                      <span className="font-medium text-[#112240]">{file.name}</span>
                    ) : (
                      <>
                        <span className="font-medium text-[#112240]">Clique ou arraste um arquivo</span>
                        <span className="text-xs text-gray-500 mt-1">Imagens (JPG, PNG) ou PDF</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="reembolsavel"
                    checked={reembolsavelCliente}
                    onChange={(e) => setReembolsavelCliente(e.target.checked)}
                    className="w-5 h-5 rounded text-[#1e3a8a] focus:ring-[#1e3a8a]"
                  />
                  <label htmlFor="reembolsavel" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                    Despesa é reembolsável pelo cliente?
                  </label>
                </div>
                
                {reembolsavelCliente && (
                  <div className="pl-8 animate-in slide-in-from-top-2 fade-in duration-200">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Nome do Cliente</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={clienteNome}
                        onFocus={() => setShowAutocomplete(true)}
                        onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                        onChange={(e) => {
                          const words = e.target.value.toLowerCase().split(' ');
                          const formatted = words.map((word) => {
                            if (['de', 'da', 'do', 'das', 'dos', 'e', 'em'].includes(word)) return word;
                            return word.charAt(0).toUpperCase() + word.slice(1);
                          }).join(' ');
                          setClienteNome(formatted);
                          setShowAutocomplete(true);
                        }}
                        placeholder="Ex: João da Silva..."
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium shadow-sm"
                      />
                      {showAutocomplete && clienteNome.trim().length > 0 && (
                        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-gray-100">
                          {clientsList
                            .filter(c => normalizeString(c).includes(normalizeString(clienteNome)) && normalizeString(c) !== normalizeString(clienteNome))
                            .map((c, i) => (
                              <li 
                                key={i} 
                                className="p-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors"
                                onClick={() => {
                                  setClienteNome(c);
                                  setShowAutocomplete(false);
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
              </div>

              <button
                onClick={handleUploadAndExtract}
                disabled={isUploading || isExtracting}
                className="w-full py-4 bg-[#112240] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1e3a8a] transition-all disabled:opacity-70"
              >
                {isExtracting ? (
                   <><Loader2 className="w-5 h-5 animate-spin" /> A IA está analisando seu recibo...</>
                ) : isUploading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Enviando arquivo...</>
                ) : (
                  <>Continuar <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* Esquerda: Visualizador PDF */}
              <div className="hidden lg:flex flex-col bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-inner h-[70vh]">
                <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-bold text-[#112240] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" /> Arquivo Original
                  </h3>
                  <div className="flex items-center gap-2">
                    {!publicFileUrl?.toLowerCase().split('?')[0].endsWith('.pdf') && (
                      <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
                        <button type="button" onClick={handleZoomOut} className="p-1 hover:bg-white rounded text-gray-600 shadow-sm" title="Diminuir Zoom"><ZoomOut className="w-4 h-4" /></button>
                        <button type="button" onClick={handleZoomIn} className="p-1 hover:bg-white rounded text-gray-600 shadow-sm" title="Aumentar Zoom"><ZoomIn className="w-4 h-4" /></button>
                      </div>
                    )}
                    <a href={publicFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors">
                       Visualizar <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden p-0 relative bg-gray-200/50">
                  {publicFileUrl?.toLowerCase().split('?')[0].endsWith('.pdf') ? (
                    <iframe src={`${publicFileUrl}#view=FitH`} className="absolute inset-0 w-full h-full" title="Visualizador" />
                  ) : (
                    <div className="overflow-auto w-full h-full p-4 flex items-center justify-center">
                      <img 
                        src={publicFileUrl} 
                        alt="Comprovante" 
                        style={{ transform: `scale(${imgScale})`, transition: 'transform 0.2s', transformOrigin: 'center' }}
                        className="max-w-full rounded-xl shadow-sm border border-gray-200" 
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Direita: Formulários e Blocos */}
              <div className="space-y-4 h-auto lg:h-[70vh] lg:overflow-y-auto lg:pr-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                
                <div className="flex items-center gap-3 mb-1">
                  <button onClick={() => setStep(1)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
                     <ArrowLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <h2 className="text-lg font-bold text-[#112240]">Confira os dados extraídos</h2>
                </div>
                
                {!isModal && (
                  <div className="bg-blue-50 p-3 rounded-xl text-sm text-[#1e3a8a] flex gap-2 items-center border border-blue-100 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <p className="whitespace-nowrap font-medium">Por favor, confira e corrija se necessário antes de enviar.</p>
                  </div>
                )}

              {extractedData.map((item, index) => (
                <div key={index} className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm relative space-y-4">
                  
                  <div className="flex justify-between items-center mb-2 pb-3 border-b border-gray-100">
                    <h3 className="font-bold text-[#112240] flex items-center gap-2">
                       <FileText className="w-5 h-5 text-blue-600" /> Recibo #{index + 1}
                    </h3>
                    {extractedData.length > 1 && (
                      <button 
                         onClick={() => handleRemoveItem(index)}
                         className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-bold text-xs flex items-center gap-1.5"
                         title="Descartar recibo"
                       >
                         <Trash2 className="w-4 h-4" /> Descartar
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Número do Recibo</label>
                      <input
                        type="text"
                        value={item.numero_recibo}
                        onChange={(e) => handleUpdateItem(index, 'numero_recibo', e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Data</label>
                      <input
                        type="date"
                        value={item.data_despesa}
                        onChange={(e) => handleUpdateItem(index, 'data_despesa', e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fornecedor (Nome)</label>
                      <input
                        type="text"
                        value={item.fornecedor_nome}
                        onChange={(e) => handleUpdateItem(index, 'fornecedor_nome', e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">CNPJ</label>
                      <input
                        type="text"
                        value={item.fornecedor_cnpj}
                        onChange={(e) => handleUpdateItem(index, 'fornecedor_cnpj', e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Descrição</label>
                      <textarea
                        value={item.descricao}
                        onChange={(e) => handleUpdateItem(index, 'descricao', e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium resize-none h-20"
                      />
                    </div>
                    <div className="col-span-2 bg-[#112240] p-4 rounded-xl flex items-center justify-between mt-2">
                      <span className="text-gray-300 font-medium">Valor Total</span>
                      <div className="flex items-center">
                        <span className="text-gray-400 font-bold mr-2">R$</span>
                        <input
                          type="text"
                          value={item.valorString !== undefined ? item.valorString : item.valor.toFixed(2).replace('.', ',')}
                          onChange={(e) => {
                             const valStr = e.target.value.replace(/[^0-9.,]/g, '');
                             handleUpdateItem(index, 'valorString', valStr);
                             const parsed = parseFloat(valStr.replace(',', '.')) || 0;
                             handleUpdateItem(index, 'valor', parsed);
                          }}
                          onBlur={() => {
                             handleUpdateItem(index, 'valorString', item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
                          }}
                          className="bg-transparent text-white text-xl font-black text-right outline-none w-32"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex-1 py-4 border-2 border-dashed border-blue-200 text-blue-600 font-bold rounded-xl hover:bg-blue-50/50 hover:border-blue-300 transition-colors flex items-center justify-center gap-2"
                >
                   <Plus className="w-5 h-5" /> Adicionar mais um recibo
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-[#1e3a8a] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 hover:bg-[#152e72] transition-all disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</>
                  ) : (
                    <>Confirmar e Enviar <ChevronRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>

              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-black text-[#112240] mb-2">Reembolso Solicitado!</h2>
              <p className="text-gray-500 max-w-sm mb-8">
                Sua solicitação foi enviada para o departamento financeiro. Você receberá uma notificação quando for processada.
              </p>
              <button
                onClick={() => {
                  if (isModal && onClose) onClose();
                  else window.location.reload();
                }}
                className="py-3 px-8 bg-gray-100 text-[#112240] hover:bg-gray-200 rounded-xl font-bold text-sm transition-colors"
              >
                {isModal ? 'Fechar Janela e Atualizar a Tabela' : 'Enviar nova solicitação'}
              </button>
            </div>
          )}

        </div>
      </div>
      
      {/* Modal de Favoritos */}
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
    </div>
  );
}
