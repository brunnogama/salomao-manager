import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  ShieldCheck,
  Globe,
  AlertCircle,
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
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Novos estados para Cliente e Honorários
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  
  const [honorarios, setHonorarios] = useState<any[]>([]);
  const [selectedHonorario, setSelectedHonorario] = useState<any | null>(null);
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
    
    // Fetch honorários pendentes desse cliente
    try {
      await supabase
        .from('financial_installments')
        .select(`
          *,
          contract:contracts!title (id, hon_number, client_id, client_name)
        `)
        .eq('status', 'pending')
        .eq('contract.client_id', client.id);
        
      // Workaround para Supabase JS se a relação contract:contracts der problema:
      // Pode ser necessário fazer fetch simples e filtrar ou testar
      // Se a query acima falhar devido ao alias ou fk, usaremos abordagem segura:
    } catch(e) {}

    // Safe Query (alternativa robusta)
    try {
      // Primeiro buscando os contratos do cliente
      const orConditions: string[] = [];
      if (client.id) orConditions.push(`client_id.eq.${client.id}`);
      if (client.cnpj) orConditions.push(`cnpj.eq.${client.cnpj}`);
      if (client.name) orConditions.push(`client_name.ilike.%${client.name.trim()}%`);
      
      const { data: clientContracts } = await supabase
        .from('contracts')
        .select('id, hon_number, display_id, seq_id, reference')
        .or(orConditions.join(','));
      if (clientContracts && clientContracts.length > 0) {
        const contractIds = clientContracts.map(c => c.id);
        const { data: hons } = await supabase
          .from('financial_installments')
          .select('*')
          .in('contract_id', contractIds)
          .eq('status', 'pending');
        
        if (hons) {
          // Atrela o hon_number visualmente
          const honsMapeados = hons.map((h: any) => ({
            ...h,
            contract: clientContracts.find(c => c.id === h.contract_id)
          }));
          setHonorarios(honsMapeados);
        } else {
          setHonorarios([]);
        }
      } else {
        setHonorarios([]);
      }
    } catch (e) {
      console.error(e);
      setHonorarios([]);
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
    if (!file && selectedCity === 'Rio de Janeiro') {
      toast.warning("Certificado Obrigatório", { 
        description: "Por favor, selecione o certificado .pfx para o Rio de Janeiro." 
      });
      return;
    }
    
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
      
      if (file) {
        formData.append('certificado', file);
      }

      const response = await fetch('http://localhost:5000/assinar-nota', {
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
        toast.success("Sucesso", {
          description: "Nota assinada e enviada com sucesso!"
        });
        console.log("XML de Retorno:", data.xml);
      } else {
        toast.dismiss(loadingToast);
        toast.error("Erro na emissão", {
          description: data.erro || "Falha desconhecida"
        });
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
            <span className="text-xl font-black text-[#1e3a8a]">{maskMoney(valorNF.toFixed(2))}</span>
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
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-100 space-y-4">
            <h2 className="font-black text-lg flex items-center gap-2 text-[#0a192f] uppercase tracking-wide text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Certificado (A1)
            </h2>

            <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-[#1e3a8a] hover:bg-gray-50/50 transition-all group overflow-hidden">
              <input
                type="file"
                accept=".pfx,.p12"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="space-y-2 relative z-0">
                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-50 transition-colors shadow-sm">
                  <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#1e3a8a]" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-[#0a192f] truncate px-2">
                    {file ? file.name : "Selecionar .pfx"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-amber-50/50 border border-amber-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-[9px] font-black text-amber-900 uppercase tracking-widest">Segurança Local</p>
                <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                  Senha no `.env`.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Console Central (2 Colunas): Honorários Pendentes e Discriminação */}
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
              ) : honorarios.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-700">
                    Nenhum honorário pendente de faturamento encontrado para este cliente.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {honorarios.map(hon => {
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