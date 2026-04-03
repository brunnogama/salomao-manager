import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Globe,
  Send,
  CheckCircle2,
  Clock,
  Search,
  ChevronDown,
  Building2,
  Coins,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { SearchableSelect } from '../../crm/SearchableSelect';
import { supabase } from '../../../lib/supabase';
import { maskCNPJ, maskMoney } from '../../controladoria/utils/masks';

const formatTypeText = (typeStr: string) => {
  const map: Record<string, string> = {
    'pro_labore': 'Pró-labore',
    'success_fee': 'Êxito',
    'final_success_fee': 'Êxito Final',
    'intermediate_fee': 'Êxito Intermediário',
    'fixed_monthly_fee': 'Fixo Mensal',
    'other_fees': 'Outros Honorários'
  };
  return map[typeStr] || typeStr;
};

const EmissaoNF = () => {
  const [selectedCity, setSelectedCity] = useState('Rio de Janeiro');

  const [isUploading, setIsUploading] = useState(false);

  // Novos estados para Cliente e Honorários
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  
  const [honorarios, setHonorarios] = useState<any[]>([]);
  const [selectedHonorario, setSelectedHonorario] = useState<any | null>(null);
  const [availableContracts, setAvailableContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [discriminacao, setDiscriminacao] = useState("Honorários Advocatícios");
  const [valorNF, setValorNF] = useState<number>(0);

  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  const cities = [
    'Belém', 'Brasília', 'Florianópolis', 'Rio de Janeiro', 'São Paulo', 'Vitória'
  ];

  // Fetch Clients
  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase.from('clients').select('id, name, cnpj').order('name');
      if (data) setClients(data);
    };
    fetchClients();
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setIsClientDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredClients = clients.filter(c => 
    (c.name || '').toLowerCase().includes(clientSearch.toLowerCase()) || 
    (c.cnpj && c.cnpj.includes(clientSearch))
  );

  const handleSelectClient = async (client: any) => {
    setSelectedClient(client);
    setIsClientDropdownOpen(false);
    setClientSearch('');
    setSelectedHonorario(null);
    setValorNF(0);
    setAvailableContracts([]);
    setSelectedContract(null);
    
    // Buscar os honorários pendentes (filtra em JavaScript para igualar ao Controle Financeiro e evitar quebras de caractere)
    try {
      const { data: installmentsData } = await supabase
        .from('financial_installments')
        .select(`
          *,
          contract:contracts (
            id, hon_number, seq_id, reference, client_id, client_name, cnpj,
            documents:contract_documents ( id, file_path, file_type )
          )
        `)
        .eq('status', 'pending');

      if (installmentsData) {
        const clientNameClean = (client.name || '').toLowerCase().trim();
        const clientCnpjClean = (client.cnpj || '').replace(/\D/g, '');
        
        const filteredHons = installmentsData.filter((i: any) => {
          if (!i.contract) return false;
          const cName = (i.contract.client_name || '').toLowerCase();
          const cCnpj = (i.contract.cnpj || '').replace(/\D/g, '');
          
          if (client.id && i.contract.client_id === client.id) return true;
          if (client.cnpj && cCnpj === clientCnpjClean) return true;
          if (client.name && cName.includes(clientNameClean)) return true;
          return false;
        });

        const honsMapeados = filteredHons.map((i: any) => ({
          ...i,
          contract: {
            ...i.contract,
            display_id: i.contract.seq_id ? String(i.contract.seq_id).padStart(6, '0') : (i.contract.display_id || '-')
          }
        }));
        
        const uniqueContractsMap = new Map();
        honsMapeados.forEach((hon: any) => {
          if (hon.contract) {
            uniqueContractsMap.set(hon.contract.id, hon.contract);
          }
        });
        const uniqueContracts = Array.from(uniqueContractsMap.values());
        
        setAvailableContracts(uniqueContracts);
        setHonorarios(honsMapeados);

        if (uniqueContracts.length === 1) {
          setSelectedContract(uniqueContracts[0]);
        }
      } else {
        setHonorarios([]);
        setAvailableContracts([]);
      }
    } catch (e) {
      console.error(e);
      setHonorarios([]);
      setAvailableContracts([]);
    }
  };

  const handleAddClient = async () => {
    const isCnpj = clientSearch.replace(/\D/g, '').length >= 14;
    let fallbackName = isCnpj ? '' : clientSearch;
    let fallbackCnpj = isCnpj ? clientSearch : '';
    
    const promptName = window.prompt("Nome do Cliente:", fallbackName);
    if (!promptName) return;
    const promptCnpj = window.prompt("CNPJ do Cliente (Opcional):", fallbackCnpj);
    
    try {
      const { data, error } = await supabase.from('clients').insert({ name: promptName, cnpj: promptCnpj?.replace(/\D/g, '') || null }).select().single();
      if (data) {
        setClients(prev => [...prev, data]);
        handleSelectClient(data);
        toast.success("Cliente criado com sucesso!");
      } else if (error) {
        toast.error("Erro ao criar cliente", { description: error.message });
      }
    } catch (e: any) {
      toast.error("Erro inesperado", { description: e.message });
    }
  };

  const getPdfUrl = (documents: any) => {
    if (!documents || !Array.isArray(documents) || documents.length === 0) return null;
    let doc = documents.find((d: any) => d.file_type === 'contract');
    if (!doc) doc = documents[0];
    if (doc && doc.file_path) {
      const { data } = supabase.storage.from('ged-documentos').getPublicUrl(doc.file_path);
      return data?.publicUrl;
    }
    return null;
  };

  const handleSelectHonorario = (hon: any) => {
    setSelectedHonorario(hon);
    setValorNF(hon.amount || 0);
    
    const texto = `Referente aos honorários de ${formatTypeText(hon.type)}
ID do contrato: ${hon.contract?.display_id || hon.contract?.seq_id || 'N/A'}
Número HON: ${hon.contract?.hon_number || 'N/A'}
Cláusula: ${hon.clause || ''}
Parcela: ${hon.installment_number}/${hon.total_installments}
Referência: ${hon.contract?.reference || 'N/A'}`;
    
    setDiscriminacao(texto);
  };

  // Função para processar a emissão (chamada ao serviço Python)
  const handleEmitirNota = async () => {

    
    if (!selectedClient) {
      toast.warning("Cliente não selecionado", { description: "Selecione um cliente para emitir a NF." });
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading("Transmitindo nota...");

    try {
      const formData = new FormData();
      formData.append('cidade', selectedCity);
      
      // O CNPJ do prestador (escritório) e IM podem vir de config local. 
      // Mas podemos enviar o CNPJ do cliente/tomador tbm
      formData.append('prestador', JSON.stringify({ cnpj: "00.000.000/0001-00", im: "123456" }));
      formData.append('tomador', JSON.stringify({ cnpj: selectedClient.cnpj || "", nome: selectedClient.name }));
      formData.append('servico', JSON.stringify({ 
        valor: valorNF || 0, 
        discriminacao: discriminacao 
      }));
      
      const apiUrl = import.meta.env.VITE_SIGNATURE_API || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/assinar-nota`, {
        method: 'POST',
        body: formData
      });

      const textResponse = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        console.error("Failed to parse json:", textResponse);
        data = { erro: "Invalid JSON response from server" };
      }

      if (response.ok) {
        toast.dismiss(loadingToast);
        toast.success("Nota Fiscal Assinada com Sucesso!");
        console.log("RPS Assinado (XML):", data.xml);
        // Em um cenário real, aqui viria o envio para a Prefeitura
      } else {
        toast.dismiss(loadingToast);
        toast.error("Erro na emissão", {
          description: data.erro || "Falha desconhecida"
        });
        if (data.traceback) {
          console.error("🐍 PYTHON STACK TRACE DA ASSINATURA:\n", data.traceback);
        }
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Erro ao conectar com o serviço de assinatura:", error);
      toast.error("Serviço Indisponível", {
        description: "O serviço de assinatura está offline. Certifique-se que o script Python está a correr."
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6 min-h-screen">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Emissão de NF
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Gestão centralizada de faturação para múltiplas capitais
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0 justify-end flex-wrap">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Total</span>
            <div className="relative group flex items-center">
              <span className="absolute left-2 text-sm font-bold text-[#1e3a8a]/50">R$</span>
              <input
                type="text"
                value={valorNF || valorNF === 0 ? maskMoney((valorNF * 100).toFixed(0)) : ''}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, '');
                  setValorNF(Number(rawValue) / 100);
                }}
                className="w-48 bg-transparent text-xl font-black text-[#1e3a8a] outline-none text-right placeholder-[#1e3a8a]/30 pl-8 pr-1 py-1 border-b-2 border-transparent hover:border-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-colors"
                placeholder="0,00"
              />
            </div>
          </div>
          <button
            onClick={handleEmitirNota}
            disabled={isUploading}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 ${isUploading || !selectedClient || !selectedHonorario ? 'bg-gray-300 text-white cursor-not-allowed hidden' : 'bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white hover:shadow-xl'
              }`}
          >
            {isUploading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isUploading ? 'PROCESSANDO' : 'TRANSMITIR NOTA'}
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
        {/* Painel Esquerdo: Cliente e Informações da NF */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-100 space-y-5">
            <h2 className="font-black text-lg flex items-center gap-2 text-[#0a192f] uppercase tracking-wide text-sm">
              <Building2 className="w-5 h-5 text-[#1e3a8a]" /> Tomador (Cliente)
            </h2>
            
            {/* Custom Client Select (Design Elegante) */}
            <div className="relative" ref={clientDropdownRef}>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Selecione o Cliente</label>
              <div 
                onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                className={`w-full bg-gray-50 border ${isClientDropdownOpen ? 'border-[#1e3a8a] ring-2 ring-blue-100' : 'border-gray-200'} rounded-xl p-3 flex flex-col justify-center cursor-pointer hover:border-[#1e3a8a] transition-all`}
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex flex-col truncate">
                    <span className={`text-sm font-bold truncate ${selectedClient ? 'text-gray-900' : 'text-gray-400'}`}>
                      {selectedClient ? selectedClient.name : 'Buscar cliente...'}
                    </span>
                    {selectedClient && selectedClient.cnpj && (
                      <span className="text-[11px] font-semibold text-gray-500 mt-0.5">CNPJ: {maskCNPJ(selectedClient.cnpj)}</span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isClientDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Dropdown Menu */}
              {isClientDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2 bg-gray-50 border-b border-gray-100 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Nome ou CNPJ..." 
                      className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm font-medium outline-none focus:border-[#1e3a8a]"
                      value={clientSearch}
                      onChange={e => setClientSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="max-h-[250px] overflow-y-auto p-2">
                    {filteredClients.length > 0 ? (
                      filteredClients.map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => handleSelectClient(c)}
                          className="w-full text-left p-2.5 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors flex flex-col"
                        >
                          <span className="text-sm font-bold text-gray-800">{c.name}</span>
                          {c.cnpj ? (
                            <span className="text-[11px] font-semibold text-gray-500 mt-0.5">{maskCNPJ(c.cnpj)}</span>
                          ) : (
                            <span className="text-[11px] font-medium text-gray-400 mt-0.5 italic">Sem CNPJ vinculado</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center space-y-3">
                        <p className="text-xs text-gray-500 font-medium">Nenhum cliente encontrado.</p>
                        {clientSearch.trim().length > 1 && (
                          <button 
                            onClick={handleAddClient}
                            className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 py-2 rounded-lg text-xs font-bold transition-colors"
                          >
                            + Confirmar e Adicionar Novo
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Configuração Regional Mantida */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-100 space-y-4">
            <h2 className="font-black text-lg flex items-center gap-2 text-[#0a192f] uppercase tracking-wide text-sm">
              <Globe className="w-5 h-5 text-[#1e3a8a]" /> Configuração Regional
            </h2>
            <div className="space-y-2">
              <SearchableSelect
                label="CIDADE DE EMISSÃO"
                placeholder="Selecione a cidade"
                value={selectedCity}
                onChange={setSelectedCity}
                options={cities.map(city => ({ id: city, name: city }))}
                className="w-full"
                align="left"
              />
            </div>
            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                Conexão direta com a prefeitura de <strong className="font-bold text-[#1e3a8a]">{selectedCity}</strong> via Web Service.
                <span className="block mt-1 font-black uppercase text-[10px] tracking-wider">VPN Não Necessária</span>
              </p>
            </div>
          </div>
          
          {/* Painel do Certificado Movido para a Lateral */}
        {/* Console Central (2 Colunas): Honorários Pendentes e Discriminação */}
        </div>
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 flex flex-col h-full">
          {/* Section: Vinculação de Honorário */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-100 space-y-5 flex-1 max-h-[400px] flex flex-col">
            <h2 className="font-black text-lg flex items-center gap-2 text-[#0a192f] uppercase tracking-wide text-sm shrink-0">
              <Coins className="w-5 h-5 text-amber-500" /> Vínculo Financeiro Pendente
            </h2>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-2">
              {!selectedClient ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">
                    Selecione um cliente para visualizar os honorários na fila de faturamento.
                  </p>
                </div>
              ) : availableContracts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-700">
                    Nenhum honorário pendente de faturamento encontrado para este cliente.
                  </p>
                </div>
              ) : availableContracts.length > 1 && !selectedContract ? (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-sm font-semibold text-amber-800">
                      Este cliente possui honorários pendentes em mais de um contrato. Selecione o contrato desejado:
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableContracts.map(contract => (
                      <div 
                        key={contract.id}
                        onClick={() => setSelectedContract(contract)}
                        className="p-4 rounded-xl cursor-pointer transition-all border bg-white border-gray-200 hover:border-[#1e3a8a] hover:shadow-md flex flex-col gap-2"
                      >
                         <span className="text-sm font-black text-[#1e3a8a] break-words">
                           {contract.reference || 'Sem referência'}
                         </span>
                         <span className="text-xs text-gray-500 font-semibold">
                           Contrato HON: {contract.hon_number || 'S/N'}
                         </span>
                         <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 self-start px-2 py-1 rounded-md">
                           {honorarios.filter(h => h.contract?.id === contract.id).length} Honorários pendentes
                         </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                   <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm flex-wrap gap-3">
                     <div className="flex flex-col">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Contrato Selecionado</span>
                       <span className="text-sm font-black text-[#1e3a8a]">{selectedContract?.reference || 'Sem referência'}</span>
                       <span className="text-xs font-semibold text-gray-500 mt-0.5">HON: {selectedContract?.hon_number || 'S/N'}</span>
                     </div>
                     <div className="flex items-center gap-2">
                       {getPdfUrl(selectedContract?.documents) && (
                         <button 
                           onClick={() => window.open(getPdfUrl(selectedContract?.documents) || undefined, '_blank')}
                           className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 shadow-md hover:shadow-lg rounded-lg text-[10px] uppercase font-black tracking-[0.1em] transition-all active:scale-95"
                         >
                           <FileText className="w-3.5 h-3.5" />
                           Ver Contrato
                         </button>
                       )}
                       {availableContracts.length > 1 && (
                         <button 
                           onClick={() => { setSelectedContract(null); setSelectedHonorario(null); setValorNF(0); }}
                           className="flex items-center gap-1.5 px-4 py-2 bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md rounded-lg text-[10px] uppercase font-black tracking-[0.1em] transition-all active:scale-95"
                         >
                           Trocar
                         </button>
                       )}
                     </div>
                   </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {honorarios.filter(h => h.contract?.id === selectedContract?.id).map(hon => {
                      const isSelected = selectedHonorario?.id === hon.id;
                      return (
                        <div 
                          key={hon.id}
                          onClick={() => handleSelectHonorario(hon)}
                          className={`p-4 rounded-xl cursor-pointer transition-all border group relative overflow-hidden ${
                            isSelected ? 'bg-blue-50/80 border-[#1e3a8a] ring-1 ring-[#1e3a8a]' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }`}
                        >
                          {isSelected && <div className="absolute top-0 left-0 w-1 h-full bg-[#1e3a8a]" />}
                          <div className="flex justify-between items-start mb-3">
                            <span className={`text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded-md ${isSelected ? 'bg-[#1e3a8a] text-white' : 'bg-gray-100 text-gray-600'}`}>
                              {formatTypeText(hon.type)}
                            </span>
                            <span className={`text-lg font-black ${isSelected ? 'text-[#1e3a8a]' : 'text-gray-900'}`}>
                              {maskMoney(Number(hon.amount || 0).toFixed(2))}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-600 flex items-center justify-between">
                              <span className="text-gray-400">Contrato:</span> 
                              <span>{hon.contract?.hon_number || 'S/N'}</span>
                            </p>
                            <p className="text-xs font-semibold text-gray-600 flex items-center justify-between">
                              <span className="text-gray-400">Parcela:</span> 
                              <span>{hon.installment_number} de {hon.total_installments}</span>
                            </p>
                            {hon.due_date && (
                              <p className="text-xs font-semibold text-gray-600 flex items-center justify-between">
                                <span className="text-gray-400">Vencimento:</span> 
                                <span>{new Date(hon.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Corpo da NF */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-100 flex-1 flex flex-col min-h-[300px]">
            <div className="flex justify-between items-center mb-4 shrink-0">
               <h2 className="font-black text-lg flex items-center gap-2 text-[#0a192f] uppercase tracking-wide text-sm">
                <FileText className="w-5 h-5 text-emerald-600" /> Corpo da Nota Fiscal (Discriminação)
               </h2>
               {selectedHonorario && (
                 <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">Mapeamento Automático</span>
               )}
            </div>

            <textarea
              value={discriminacao}
              onChange={(e) => setDiscriminacao(e.target.value)}
              disabled={!selectedClient}
              placeholder="A discriminação dos serviços será preenchida aqui..."
              className={`w-full flex-1 min-h-[200px] p-4 rounded-xl text-sm font-medium border custom-scrollbar transition-all outline-none resize-none
                ${selectedClient ? 'bg-gray-50 border-gray-200 focus:border-[#1e3a8a] focus:bg-white focus:ring-4 focus:ring-blue-50' : 'bg-gray-100/50 border-dashed border-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            />
            
            <p className="text-[10px] text-gray-400 font-medium mt-3 italic text-right">
              Este texto será injetado no XML oficial transmitido para a prefeitura.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EmissaoNF;