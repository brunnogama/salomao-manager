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
  CheckCircle,
  Loader2,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { SearchableSelect } from '../../crm/SearchableSelect';
import { ClientFormModal } from '../../controladoria/clients/ClientFormModal';
import { DraftContractModal } from './DraftContractModal';
import { EmissaoNFStatusModal, NFStatus } from './EmissaoNFStatusModal';
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

const OFFICE_DATA: Record<string, { cnpj: string; im: string; endereco: string; uf: string }> = {
  'Rio de Janeiro': { cnpj: '33.333.333/0001-33', im: '123456-7', endereco: 'Avenida Rio Branco, 1 - Centro - CEP: 20000-000', uf: 'RJ' },
  'São Paulo': { cnpj: '33.333.333/0002-44', im: '123456-8', endereco: 'Avenida Paulista, 1000 - Bela Vista - CEP: 01310-100', uf: 'SP' },
  'Belém': { cnpj: '33.333.333/0003-55', im: '123456-9', endereco: 'Avenida Presidente Vargas, 10 - Centro - CEP: 66010-000', uf: 'PA' },
  'Brasília': { cnpj: '33.333.333/0004-66', im: '123456-0', endereco: 'SCS Quadra 1 Bloco A - Asa Sul - CEP: 70301-000', uf: 'DF' },
  'Florianópolis': { cnpj: '33.333.333/0005-77', im: '123456-1', endereco: 'Rua Felipe Schmidt, 50 - Centro - CEP: 88010-000', uf: 'SC' },
  'Vitória': { cnpj: '33.333.333/0006-88', im: '123456-2', endereco: 'Avenida Nossa Senhora da Penha, 500 - Praia do Canto - CEP: 29055-130', uf: 'ES' },
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
  const [clientEmail, setClientEmail] = useState('');
  
  // Taxas e Impostos
  const [irpj, setIrpj] = useState<number>(0);
  const [pis, setPis] = useState<number>(0);
  const [cofins, setCofins] = useState<number>(0);
  const [csll, setCsll] = useState<number>(0);

  // Novos campos NF Emitida
  const [dataEmissao, setDataEmissao] = useState<string>(new Date().toISOString().split('T')[0]);
  const [vencimento, setVencimento] = useState<string>('');
  const [nfNumber, setNfNumber] = useState<string>('');

  // Novo estado da Modal de Emissão
  const [emissaoStatus, setEmissaoStatus] = useState<{
    isOpen: boolean;
    status: NFStatus;
    errorDetails: { message: string; traceback?: string } | null;
  }>({
    isOpen: false,
    status: 'idle',
    errorDetails: null
  });

  // Novos campos para Configuração e Tributação
  const [valorLiquidoState, setValorLiquidoState] = useState<number>(0);
  type TipoClienteType = 'PJ' | 'PF' | 'Condominio' | 'Exterior' | 'Fundos' | 'Outros';
  const [tipoCliente, setTipoCliente] = useState<TipoClienteType>('PJ');
  const [impostosAtivos, setImpostosAtivos] = useState({ irpj: true, pis: true, cofins: true, csll: true });
  type GrossUpType = 'nenhum' | 'retencoes' | 'total';
  const [grossUpMode, setGrossUpMode] = useState<GrossUpType>('nenhum');
  const [originalAmount, setOriginalAmount] = useState<number>(0);

  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const clientDropdownRef = useRef<HTMLDivElement>(null);
  
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isDraftContractModalOpen, setIsDraftContractModalOpen] = useState(false);

  const [prestadorDetails, setPrestadorDetails] = useState<{cnpj: string, im: string, razao_social: string, fantasia: string, endereco: string, municipio: string, uf: string} | null>(null);
  const [isFetchingPrestador, setIsFetchingPrestador] = useState(false);

  // Fetch Cities and CNPJ on Mount/City Change
  useEffect(() => {
    const fetchPrestadorInfo = async () => {
      setIsFetchingPrestador(true);
      try {
        let cnpjFromDB = '';
        const { data: locs } = await supabase.from('office_locations').select('name, cnpj').eq('active', true);
        
        if (locs) {
          // Busca o loca cujo nome tenha a sigla ou a cidade
          const sigla = getSiglaByCity(selectedCity);
          const matched = locs.find((loc: any) => loc.name.includes(sigla) || loc.name.toLowerCase().includes(selectedCity.toLowerCase()));
          if (matched && matched.cnpj) {
            cnpjFromDB = matched.cnpj;
          }
        }

        const fallback = OFFICE_DATA[selectedCity] || OFFICE_DATA['Rio de Janeiro'];
        const cnpjToUse = cnpjFromDB || fallback?.cnpj || '';
        const imToUse = fallback?.im || 'Não Cadastrado';

        if (cnpjToUse) {
          const cleanCnpj = cnpjToUse.replace(/\D/g, '');
          const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
          if (res.ok) {
            const data = await res.json();
            
            // Format logradouro to avoid "undefined" strings
            const comp = data.complemento ? ' - ' + data.complemento : '';
            const endCompleto = `${data.descricao_tipo_de_logradouro || ''} ${data.logradouro || ''}, ${data.numero || 'SN'}${comp} - ${data.bairro || ''} - CEP: ${data.cep || ''}`.trim();

            setPrestadorDetails({
              cnpj: cnpjToUse,
              im: imToUse,
              razao_social: data.razao_social || 'SALOMÃO ADVOGADOS ASSOCIADOS',
              fantasia: data.nome_fantasia || 'SALOMÃO ADVOGADOS',
              endereco: endCompleto,
              municipio: data.municipio || selectedCity,
              uf: data.uf || getSiglaByCity(selectedCity)
            });
            return;
          }
        }
        
        // Se a API falhar ou não achar CNPJ
        setPrestadorDetails({
          cnpj: cnpjToUse || 'Sem Cadastro',
          im: imToUse,
          razao_social: 'SALOMÃO ADVOGADOS ASSOCIADOS',
          fantasia: 'SALOMÃO ADVOGADOS',
          endereco: fallback?.endereco || 'Endereço não cadastrado',
          municipio: selectedCity,
          uf: fallback?.uf || getSiglaByCity(selectedCity)
        });

      } catch (err) {
        console.error('Erro ao buscar dados online da BrasilAPI:', err);
        const fallback = OFFICE_DATA[selectedCity] || OFFICE_DATA['Rio de Janeiro'];
        setPrestadorDetails({
          cnpj: fallback?.cnpj || '...',
          im: fallback?.im || '...',
          razao_social: 'SALOMÃO ADVOGADOS ASSOCIADOS',
          fantasia: 'SALOMÃO ADVOGADOS',
          endereco: fallback?.endereco || 'Endereço Indisponível (Sem Conexão)',
          municipio: selectedCity,
          uf: fallback?.uf || getSiglaByCity(selectedCity)
        });
      } finally {
        setIsFetchingPrestador(false);
      }
    };
    fetchPrestadorInfo();
  }, [selectedCity]);

  const cities = [
    'Belém', 'Brasília', 'Florianópolis', 'Rio de Janeiro', 'Salvador', 'São Paulo', 'Vitória'
  ];

  const getSiglaByCity = (city: string) => {
    const map: Record<string, string> = {
      'Belém': 'PA',
      'Brasília': 'DF',
      'Florianópolis': 'SC',
      'Rio de Janeiro': 'RJ',
      'São Paulo': 'SP',
      'Vitória': 'ES',
      'Salvador': 'BA'
    };
    return map[city] || '';
  };

  // Fetch Clients
  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase.from('clients').select('id, name, cnpj, email').order('name');
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
    setClientEmail(client.email || '');
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

  const ALIQUOTAS = { irpj: 0.015, pis: 0.0065, cofins: 0.03, csll: 0.01 };
  
  const applyTaxesAndLiquido = (base: number, configAtivos: { irpj: boolean, pis: boolean, cofins: boolean, csll: boolean }) => {
    setValorNF(base);
    const iIRPJ = configAtivos.irpj ? base * ALIQUOTAS.irpj : 0;
    const iPIS = configAtivos.pis ? base * ALIQUOTAS.pis : 0;
    const iCOFINS = configAtivos.cofins ? base * ALIQUOTAS.cofins : 0;
    const iCSLL = configAtivos.csll ? base * ALIQUOTAS.csll : 0;
    
    setIrpj(iIRPJ);
    setPis(iPIS);
    setCofins(iCOFINS);
    setCsll(iCSLL);
    
    setValorLiquidoState(base - iIRPJ - iPIS - iCOFINS - iCSLL);
  };

  const handleApplyGrossUp = (mode: GrossUpType, currentBase: number, config: typeof impostosAtivos) => {
    let newBase = currentBase;
    if (mode === 'retencoes') newBase = currentBase / 0.9385;
    else if (mode === 'total') newBase = currentBase / 0.8438;
    applyTaxesAndLiquido(newBase, config);
  };

  const handleGrossUpChange = (mode: GrossUpType) => {
    setGrossUpMode(mode);
    handleApplyGrossUp(mode, originalAmount, impostosAtivos);
  };

  const handleChangeTipoCliente = (tipo: TipoClienteType) => {
    setTipoCliente(tipo);
    const TYPE_TAX_CONFIG: Record<TipoClienteType, typeof impostosAtivos> = {
      'PJ': { irpj: true, pis: true, cofins: true, csll: true },
      'PF': { irpj: false, pis: false, cofins: false, csll: false },
      'Condominio': { irpj: false, pis: true, cofins: true, csll: true },
      'Exterior': { irpj: false, pis: false, cofins: false, csll: false },
      'Fundos': { irpj: false, pis: false, cofins: false, csll: false },
      'Outros': { irpj: false, pis: false, cofins: false, csll: false }
    };
    const config = typeof TYPE_TAX_CONFIG[tipo] !== "undefined" ? TYPE_TAX_CONFIG[tipo] : { irpj: true, pis: true, cofins: true, csll: true };
    setImpostosAtivos(config);
    handleApplyGrossUp(grossUpMode, originalAmount, config);
  };

  const handleToggleImposto = (imp: keyof typeof impostosAtivos) => {
    const newConfig = { ...impostosAtivos, [imp]: !impostosAtivos[imp] };
    setImpostosAtivos(newConfig);
    handleApplyGrossUp(grossUpMode, originalAmount, newConfig);
  };

  const handleSelectHonorario = (hon: any) => {
    setSelectedHonorario(hon);
    const amt = Number(hon.amount || 0);
    setOriginalAmount(amt);
    setGrossUpMode('nenhum');
    setVencimento(hon.due_date ? hon.due_date.split('T')[0] : '');
    
    let guessedTipo: TipoClienteType = 'PJ';
    if (selectedClient?.cnpj) {
       const cleanC = selectedClient.cnpj.replace(/\D/g, '');
       if (cleanC.length === 11) guessedTipo = 'PF';
    } else if (selectedClient?.name && selectedClient.name.toLowerCase().includes('condominio')) {
       guessedTipo = 'Condominio';
    }
    
    setTipoCliente(guessedTipo);
    const TYPE_TAX_CONFIG: Record<string, typeof impostosAtivos> = {
      'PJ': { irpj: true, pis: true, cofins: true, csll: true },
      'PF': { irpj: false, pis: false, cofins: false, csll: false },
      'Condominio': { irpj: false, pis: true, cofins: true, csll: true },
      'Exterior': { irpj: false, pis: false, cofins: false, csll: false },
      'Fundos': { irpj: false, pis: false, cofins: false, csll: false },
      'Outros': { irpj: false, pis: false, cofins: false, csll: false }
    };
    const config = TYPE_TAX_CONFIG[guessedTipo] || { irpj: true, pis: true, cofins: true, csll: true };
    setImpostosAtivos(config);
    handleApplyGrossUp('nenhum', amt, config);

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
    setEmissaoStatus({ isOpen: true, status: 'preparing', errorDetails: null });

    try {
      await new Promise(r => setTimeout(r, 800)); // Simulando "Preparando Lote RPS..."
      setEmissaoStatus(prev => ({ ...prev, status: 'transmitting' }));

      const formData = new FormData();
      formData.append('cidade', selectedCity);

      // Dados do escritório selecionado dinamicamente
      const finalPrestadorCNPJ = prestadorDetails?.cnpj || '';
      const finalPrestadorIM = prestadorDetails?.im || '';

      formData.append('prestador', JSON.stringify({ cnpj: finalPrestadorCNPJ, im: finalPrestadorIM }));
      formData.append('tomador', JSON.stringify({ 
        cnpj: selectedClient.cnpj || "", 
        nome: selectedClient.name,
        email: clientEmail
      }));
      formData.append('servico', JSON.stringify({
        valor: valorNF || 0,
        discriminacao: discriminacao
      }));

      const apiUrl = import.meta.env.VITE_SIGNATURE_API || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/assinar-nota`, {
        method: 'POST',
        body: formData
      });

      setEmissaoStatus(prev => ({ ...prev, status: 'processing' }));
      await new Promise(r => setTimeout(r, 600));

      const textResponse = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        console.error("Failed to parse json:", textResponse);
        data = { erro: "Invalid JSON response from server" };
      }

      if (response.ok) {
        
        let locId: number | null = null;
        try {
          const sigla = getSiglaByCity(selectedCity);
          const { data: locs } = await supabase.from('locations').select('id, name');
          if (locs) {
            const matched = locs.find((l: any) => l.name.includes(sigla) || l.name.toLowerCase().includes(selectedCity.toLowerCase()));
            if (matched) locId = matched.id;
          }
        } catch (e) {
          console.error("Erro buscar local:", e);
        }
        
        await supabase.from('financial_installments').update({
          status: 'nf_emitida',
          nf_issue_date: dataEmissao || null,
          due_date: vencimento || null,
          nf_location: locId,
          nf_nature: discriminacao,
          nf_value: valorNF,
          tax_irpj: irpj,
          tax_pis: pis,
          tax_cofins: cofins,
          tax_csll: csll,
          net_value: valorLiquidoState,
          nf_number: nfNumber || null
        }).eq('id', selectedHonorario.id);

        setEmissaoStatus({ isOpen: true, status: 'success', errorDetails: null });
        
        setHonorarios(prev => prev.filter(h => h.id !== selectedHonorario.id));
        setSelectedHonorario(null);

        console.log("RPS Assinado (XML):", data.xml);
      } else {
        setEmissaoStatus({ 
          isOpen: true, 
          status: 'error', 
          errorDetails: { message: data.erro || "Falha desconhecida", traceback: data.traceback } 
        });
        if (data.traceback) {
          console.error("🐍 PYTHON STACK TRACE DA ASSINATURA:\n", data.traceback);
        }
      }
    } catch (error) {
      console.error("Erro ao conectar com o serviço de assinatura:", error);
      setEmissaoStatus({ 
        isOpen: true, 
        status: 'error', 
        errorDetails: { message: "Serviço Indisponível", traceback: "O serviço de assinatura está offline. Certifique-se que o script Python está a correr." } 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const honorariosSorted = honorarios.filter(h => h.contract?.id === selectedContract?.id).sort((a, b) => {
    const order = ['pro_labore', 'intermediate_fee', 'fixed_monthly_fee', 'success_fee', 'final_success_fee', 'other_fees'];
    let iA = order.indexOf(a.type);
    let iB = order.indexOf(b.type);
    if (iA === -1) iA = 99;
    if (iB === -1) iB = 99;
    return iA - iB;
  });

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6 min-h-[calc(100vh-60px)]">
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

        <div className="flex items-center gap-4 shrink-0 w-full md:w-auto mt-2 md:mt-0 justify-end flex-wrap">
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">Cidade de Emissão:</label>
            <div className="relative group">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1e3a8a]/50" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-48 sm:w-56 appearance-none bg-gray-50 border border-gray-200 text-[#1e3a8a] text-sm font-bold rounded-lg pl-9 pr-8 py-2.5 outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-50 transition-all cursor-pointer shadow-sm hover:border-[#1e3a8a]/50"
              >
                <option value="" disabled>Selecione a cidade</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1e3a8a]/50 pointer-events-none group-hover:text-[#1e3a8a]" />
            </div>
          </div>

          <button
            onClick={handleEmitirNota}
            disabled={isUploading}
            title="Transmitir Nota"
            className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 active:scale-95 ${
              isUploading || !selectedClient || !selectedHonorario 
                ? 'bg-gray-300 text-white cursor-not-allowed hidden' 
                : 'bg-gradient-to-br from-[#1e3a8a] to-[#0a192f] text-white hover:shadow-xl hover:-translate-y-0.5 ring-4 ring-white'
            }`}
          >
            {isUploading ? <Clock className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -ml-0.5" />}
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full flex-1">
        
        {/* PAINEL ESQUERDO: CLIENTE E HONORÁRIOS */}
        <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-6 h-full min-h-[600px]">
          {/* CLIENT SELECT */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-100 shrink-0 relative z-30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-lg flex items-center gap-2 text-[#0a192f] uppercase tracking-wide text-sm">
                <Building2 className="w-5 h-5 text-[#1e3a8a]" /> Tomador (Cliente)
              </h2>
              <button
                onClick={() => setIsClientModalOpen(true)}
                className="w-7 h-7 flex items-center justify-center bg-[#1e3a8a] text-white rounded-full hover:bg-[#112240] transition-colors shadow-sm"
                title="Novo Cliente"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

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
                    {filteredClients.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-sm text-gray-500 mb-3">Nenhum cliente encontrado.</p>
                        <button
                          onClick={(e) => {
                             e.stopPropagation();
                             setIsClientModalOpen(true);
                             setIsClientDropdownOpen(false);
                          }}
                          className="w-full py-2 bg-[#dcfce7] hover:bg-[#bbf7d0] text-[#166534] rounded-lg font-bold text-[11px] uppercase tracking-widest transition-colors"
                        >
                          + Confirmar e Adicionar Novo
                        </button>
                      </div>
                    ) : (
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
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* VÍNCULO FINANCEIRO PENDENTE */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-100 flex-1 flex flex-col overflow-hidden relative z-20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-lg flex items-center gap-2 text-[#0a192f] uppercase tracking-wide text-sm shrink-0">
                <Coins className="w-5 h-5 text-amber-500" /> Vínculo Financeiro Pendente
              </h2>
              {selectedClient && (
                <button
                  onClick={() => setIsDraftContractModalOpen(true)}
                  className="w-7 h-7 flex items-center justify-center bg-[#1e3a8a] text-white rounded-full hover:bg-[#112240] transition-colors shadow-sm"
                  title="Novo Contrato (Rascunho)"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-2">
              {!selectedClient ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">
                    Selecione um cliente para exibir os honorários pendentes.
                  </p>
                </div>
              ) : availableContracts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-700 mb-4">
                    Nenhum honorário pendente encontrado para este cliente.
                  </p>
                  <button
                    onClick={() => setIsDraftContractModalOpen(true)}
                    className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#112240] text-white rounded-lg font-bold text-[11px] uppercase tracking-widest transition-colors flex items-center gap-2 shadow-sm focus:ring-2 focus:ring-[#1e3a8a]/50"
                  >
                    <Plus className="w-3 h-3" /> Cadastrar Contrato
                  </button>
                </div>
              ) : availableContracts.length > 1 && !selectedContract ? (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                     <p className="text-sm font-semibold text-amber-800">
                        Este cliente possui honorários em múltiplos contratos. Selecione:
                     </p>
                  </div>
                  <div className="flex flex-col gap-3">
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
                          HON: {contract.hon_number || 'S/N'}
                        </span>
                        <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 self-start px-2 py-1 rounded-md">
                          {honorarios.filter(h => h.contract?.id === contract.id).length} Honorários pendentes
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300 flex flex-col h-full">
                  <div className="flex flex-col p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm shrink-0 gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Contrato Selecionado</span>
                      <span className="text-sm font-black text-[#1e3a8a]">{selectedContract?.reference || 'Sem referência'}</span>
                      <span className="text-xs font-semibold text-gray-500 mt-0.5">HON: {selectedContract?.hon_number || 'S/N'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                       {getPdfUrl(selectedContract?.documents) && (
                         <button
                           onClick={() => window.open(getPdfUrl(selectedContract?.documents) || undefined, '_blank')}
                           className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 shadow-sm rounded-lg text-[10px] uppercase font-black tracking-widest transition-all"
                         >
                           <FileText className="w-3 h-3" /> Ver Contrato
                         </button>
                       )}
                       {availableContracts.length > 1 && (
                         <button
                           onClick={() => { setSelectedContract(null); setSelectedHonorario(null); setValorNF(0); }}
                           className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm rounded-lg text-[10px] uppercase font-black tracking-widest transition-all"
                         >
                           Trocar
                         </button>
                       )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {honorariosSorted.map(hon => {
                      const isSelected = selectedHonorario?.id === hon.id;
                      return (
                        <div
                          key={hon.id}
                          onClick={() => handleSelectHonorario(hon)}
                          className={`p-4 rounded-xl cursor-pointer transition-all border group relative overflow-hidden flex flex-col ${
                            isSelected ? 'bg-blue-50/80 border-[#1e3a8a] ring-1 ring-[#1e3a8a]' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }`}
                        >
                          {isSelected && <div className="absolute top-0 left-0 w-1 h-full bg-[#1e3a8a]" />}
                          <div className="flex justify-between items-center mb-3 gap-2">
                            <span className={`text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded-md ${isSelected ? 'bg-[#1e3a8a] text-white' : 'bg-gray-100 text-gray-600'}`}>
                              {formatTypeText(hon.type)}
                            </span>
                            <span className={`text-base font-black truncate flex-1 text-right ${isSelected ? 'text-[#1e3a8a]' : 'text-gray-900'}`}>
                              {maskMoney(Number(hon.amount || 0).toFixed(2))}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold text-gray-600 flex items-center justify-between">
                              <span className="text-gray-400">Parcela:</span>
                              <span>{hon.installment_number} de {hon.total_installments}</span>
                            </p>
                            {hon.due_date && (
                              <p className="text-[11px] font-semibold text-gray-600 flex items-center justify-between">
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
        </div>

        {/* PAINEL DIREITO: SIMULADOR DE NOTA FISCAL */}
        <div className="lg:col-span-2 relative min-h-[1000px] bg-white border-[3px] border-gray-800 flex flex-col outline outline-4 outline-transparent shadow-2xl shadow-gray-400/30 font-sans text-gray-900 overflow-hidden shrink-0 mt-4 lg:mt-0 lg:ml-2">
            
            {/* Watermark */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.02] rotate-[-45deg] z-0">
              <span className="text-[120px] font-black tracking-[0.3em] uppercase">SIMULAÇÃO</span>
            </div>

            {/* HEADER NF */}
            <div className="flex border-b-[3px] border-gray-800 relative z-10 shrink-0 bg-white">
              <div className="w-24 sm:w-32 flex items-center justify-center border-r-[3px] border-gray-800 p-2 sm:p-4 shrink-0">
                <Globe className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300" strokeWidth={1.5} />
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center p-2 hidden sm:flex">
                <h2 className="font-black text-[11px] sm:text-[13px] uppercase tracking-wide">Prefeitura da Cidade do {selectedCity}</h2>
                <h3 className="font-bold text-[9px] sm:text-[11px] uppercase mb-1">Secretaria Municipal de Fazenda</h3>
                <h1 className="font-black text-sm sm:text-lg uppercase tracking-wide mt-1">Nota Fiscal de Serviços Eletrônica</h1>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center p-2 sm:hidden">
                <h1 className="font-black text-sm uppercase tracking-wide leading-tight">NFS-e<br/>{selectedCity}</h1>
              </div>
              <div className="w-32 sm:w-44 border-l-[3px] border-gray-800 flex flex-col text-[9px] sm:text-[10px] shrink-0">
                <div className="border-b-[3px] border-gray-800 p-1 flex flex-col flex-1 justify-center bg-gray-50">
                  <span className="font-semibold px-1">Número da Nota</span>
                  <span className="font-black text-sm sm:text-base text-center">00000000</span>
                </div>
                <div className="border-b-[3px] border-gray-800 p-1 flex flex-col flex-1 justify-center">
                  <span className="font-semibold px-1">Data e Hora</span>
                  <span className="font-black text-center">{new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="p-1 flex flex-col flex-1 justify-center bg-gray-50">
                  <span className="font-semibold px-1">Código Verificação</span>
                  <span className="font-black text-center text-xs tracking-widest text-[#1e3a8a]">ABCD-1234</span>
                </div>
              </div>
            </div>

            {/* PRESTADOR */}
            <div className="border-b-[3px] border-gray-800 flex flex-col relative z-10 shrink-0 bg-white">
              <div className="bg-gray-200 text-center font-black uppercase text-[10px] sm:text-[11px] py-1 border-b border-gray-400">
                Prestador de Serviços
              </div>
              <div className="flex flex-col p-2 sm:p-3 text-[9px] sm:text-[11px] space-y-1.5 leading-tight">
                {isFetchingPrestador ? (
                  <div className="flex items-center justify-center py-2">
                     <Loader2 className="w-4 h-4 animate-spin text-[#1e3a8a] mr-2" />
                     <span className="font-bold text-gray-500 uppercase tracking-widest text-[9px]">Sincronizando CNPJ com BrasilAPI...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between flex-wrap gap-2">
                      <div><strong>CPF/CNPJ:</strong> {prestadorDetails?.cnpj || ''}</div>
                      <div><strong>Inscrição Municipal:</strong> {prestadorDetails?.im || ''}</div>
                      <div><strong>Inscrição Estadual:</strong> ISENTO</div>
                    </div>
                    <div><strong>Nome/Razão Social:</strong> {prestadorDetails?.razao_social || ''} <span className="font-medium text-gray-500 ml-1">({prestadorDetails?.fantasia || ''})</span></div>
                    <div className="flex justify-between flex-wrap gap-2">
                      <div className="truncate pr-2"><strong>Endereço:</strong> {prestadorDetails?.endereco || ''}</div>
                      <div><strong>Município:</strong> {prestadorDetails?.municipio || ''} - {prestadorDetails?.uf || ''}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* TOMADOR */}
            <div className="border-b-[3px] border-gray-800 flex flex-col relative z-10 shrink-0 bg-white">
              <div className="bg-gray-200 text-center font-black uppercase text-[10px] sm:text-[11px] py-1 border-b border-gray-400">
                Tomador de Serviços
              </div>
              <div className="flex flex-col p-2 sm:p-3 text-[9px] sm:text-[11px] space-y-1.5 leading-tight min-h-[70px]">
                {selectedClient ? (
                  <>
                    <div className="flex justify-between flex-wrap gap-2">
                      <div><strong>CPF/CNPJ:</strong> {maskCNPJ(selectedClient.cnpj || '') || 'Não Informado'}</div>
                      <div><strong>Inscrição Municipal:</strong> ----</div>
                      <div><strong>Inscrição Estadual:</strong> ----</div>
                    </div>
                    <div><strong>Nome/Razão Social:</strong> <span className="font-bold">{selectedClient.name}</span></div>
                    <div className="flex justify-between flex-wrap gap-2 text-gray-600">
                      <div><strong>Endereço:</strong> Conforme Cadastro Vínculado</div>
                      <div><strong>Município:</strong> Brasil</div>
                    </div>
                    <div className="mt-1 flex items-center gap-2 border-t border-gray-200 pt-1.5">
                      <strong>E-mail para NFS-e:</strong> 
                      <input 
                        type="email" 
                        value={clientEmail} 
                        onChange={e => setClientEmail(e.target.value)} 
                        placeholder="cliente@email.com"
                        className="bg-gray-100 px-2 py-0.5 rounded text-[10px] sm:text-[11px] flex-1 outline-none focus:ring-1 focus:ring-[#1e3a8a] text-gray-800 font-semibold"
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 italic text-center mt-3 font-medium flex items-center justify-center gap-2">
                    <Search className="w-3 h-3" /> Selecione um cliente à esquerda para auto-preencher os dados do tomador.
                  </div>
                )}
              </div>
            </div>

            {/* DISCRIMINAÇÃO */}
            <div className="border-b-[3px] border-gray-800 flex flex-col flex-1 relative z-10 bg-white min-h-[250px] sm:min-h-[300px]">
               <div className="bg-gray-200 text-center font-black uppercase text-[10px] sm:text-[11px] py-1 border-b border-gray-400 shrink-0 flex items-center justify-center gap-2">
                  Discriminação dos Serviços
                  {selectedHonorario && <span className="text-[8px] bg-green-200 text-green-800 font-bold px-1.5 py-0.5 rounded-sm">AUTOMÁTICO</span>}
               </div>
               <div className="flex-1 flex p-1 relative">
                 <textarea
                    value={discriminacao}
                    onChange={(e) => setDiscriminacao(e.target.value)}
                    disabled={!selectedClient}
                    spellCheck={false}
                    className="w-full h-full resize-none outline-none bg-transparent text-[11px] sm:text-[13px] font-mono leading-relaxed p-2 sm:p-3 focus:ring-inset focus:ring-2 focus:ring-[#1e3a8a]/20 disabled:text-gray-500 custom-scrollbar"
                 />
                 {!selectedClient && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <span className="text-xs text-gray-300 font-bold uppercase tracking-widest rotate-[-10deg]">AGUARDANDO CLIENTE</span>
                    </div>
                 )}
               </div>
            </div>

            {/* CONFIGURAÇÕES DE TRIBUTAÇÃO */}
            <div className="border-b-[3px] border-gray-800 flex flex-col relative z-20 bg-white text-[10px] sm:text-[11px] shrink-0">
              <div className="bg-gradient-to-r from-gray-200 to-gray-300 text-center font-black uppercase text-[10px] sm:text-[11px] py-1 border-b border-gray-400 text-gray-800 tracking-wider">
                Detalhamento Tributário e Gross Up
              </div>
              <div className="flex flex-col sm:flex-row border-b border-gray-300">
                <div className="p-2 sm:p-3 flex-1 flex flex-col gap-2 bg-[#f8fbff] sm:border-r border-b sm:border-b-0 border-gray-300">
                  <label className="font-bold text-[#1e3a8a] uppercase tracking-wide flex items-center gap-1"><Coins className="w-3.5 h-3.5"/> Categoria do Cliente:</label>
                  <select
                     value={tipoCliente}
                     onChange={(e) => handleChangeTipoCliente(e.target.value as TipoClienteType)}
                     className="w-full bg-white border border-blue-200 text-[#1e3a8a] font-black rounded-lg p-2 outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] shadow-sm appearance-none cursor-pointer"
                  >
                     <option value="PJ">PJ (Pessoa Jurídica)</option>
                     <option value="PF">PF (Pessoa Física)</option>
                     <option value="Condominio">Condomínio</option>
                     <option value="Exterior">Exterior</option>
                     <option value="Fundos">Fundos</option>
                     <option value="Outros">Outros</option>
                  </select>
                </div>
                <div className="p-2 sm:p-3 flex-1 flex flex-col gap-2 bg-purple-50">
                  <label className="font-bold text-purple-800 uppercase tracking-wide flex items-center gap-1"><Plus className="w-3.5 h-3.5"/> Gross Up (Adicional):</label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-1 font-semibold text-purple-900 bg-white p-2 rounded-lg border border-purple-100 shadow-sm">
                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-purple-700 transition-colors">
                      <input type="radio" name="grossup" checked={grossUpMode === 'nenhum'} onChange={() => handleGrossUpChange('nenhum')} className="w-3.5 h-3.5 accent-purple-600" /> Nenhuma
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-purple-700 transition-colors">
                      <input type="radio" name="grossup" checked={grossUpMode === 'retencoes'} onChange={() => handleGrossUpChange('retencoes')} className="w-3.5 h-3.5 accent-purple-600" /> +6,15% (Ret.)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-purple-700 transition-colors">
                      <input type="radio" name="grossup" checked={grossUpMode === 'total'} onChange={() => handleGrossUpChange('total')} className="w-3.5 h-3.5 accent-purple-600" /> +15,62% (Total)
                    </label>
                  </div>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-white flex flex-col">
                 <span className="font-bold text-gray-700 uppercase tracking-wide mb-2">Impostos Retidos na Fonte:</span>
                 <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {(['irpj', 'pis', 'cofins', 'csll'] as const).map(imp => {
                       const labels: any = { irpj: 'IRRF (1,50%)', pis: 'PIS (0,65%)', cofins: 'COFINS (3,00%)', csll: 'CSLL (1,00%)' };
                       const isChecked = impostosAtivos[imp];
                       return (
                         <label key={imp} className={`flex items-center gap-2 font-bold select-none p-1.5 rounded-lg border transition-all ${tipoCliente === 'Outros' ? 'cursor-pointer hover:bg-gray-50 border-gray-200' : 'cursor-default border-transparent'} ${isChecked ? 'text-[#1e3a8a] bg-blue-50/50 border-blue-100' : 'text-gray-400'}`}>
                           <input 
                             type="checkbox" 
                             checked={isChecked} 
                             onChange={() => handleToggleImposto(imp)}
                             disabled={tipoCliente !== 'Outros'}
                             className={`w-4 h-4 rounded border-gray-300 focus:ring-0 ${isChecked ? 'accent-[#1e3a8a] text-[#1e3a8a]' : 'opacity-40'} disabled:cursor-default`}
                           />
                           {labels[imp]}
                         </label>
                       )
                    })}
                 </div>
                 {tipoCliente === 'Outros' && <span className="text-[9px] font-bold text-amber-600 mt-2 bg-amber-50 self-start px-2 py-0.5 rounded">* Marque manualmente os impostos que serão cobrados neste cenário.</span>}
              </div>
            </div>

            {/* VALOR DA NOTA E IMPOSTOS */}
            <div className="flex flex-col shrink-0 relative z-10 bg-white">
               {/* MAIN VALOR */}
               <div className="border-b-[3px] border-gray-800 flex items-stretch h-14 sm:h-16">
                 <div className="bg-gray-200 flex items-center justify-center font-black uppercase text-[11px] sm:text-[13px] px-4 sm:px-8 border-r border-gray-400 shrink-0">
                    Valor da Nota
                 </div>
                 <div className="flex-1 flex items-center px-4 sm:px-6 relative group bg-[#f8fbff]">
                    <span className="font-bold text-gray-500 mr-2 text-sm sm:text-base">R$</span>
                    <input
                      type="text"
                      className="w-full bg-transparent text-xl sm:text-2xl font-black outline-none text-[#1e3a8a]"
                      value={valorNF || valorNF === 0 ? maskMoney((valorNF * 100).toFixed(0)) : ''}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        const val = Number(rawValue) / 100;
                        setValorNF(val);
                        setOriginalAmount(val);
                        setGrossUpMode('nenhum');
                        applyTaxesAndLiquido(val, impostosAtivos);
                      }}
                      placeholder="0,00"
                    />
                 </div>
               </div>

               {/* MULTIPLE IMPOSTOS */}
               <div className="flex divide-x divide-gray-400 bg-gray-50 text-[10px] sm:text-[11px] h-14">
                  <div className="flex-1 flex flex-col hover:bg-gray-100 transition-colors">
                     <span className="font-semibold px-2 py-0.5 border-b border-gray-300 text-center">IRPJ (R$)</span>
                     <input type="text" className="w-full h-full px-2 bg-transparent font-black outline-none text-center text-gray-800" 
                         value={irpj || irpj === 0 ? maskMoney((irpj * 100).toFixed(0)) : ''}
                        onChange={(e) => { const raw = e.target.value.replace(/\D/g,''); const r=Number(raw)/100; setIrpj(r); setValorLiquidoState(valorNF - r - pis - cofins - csll); }} 
                        placeholder="0,00" />
                  </div>
                  <div className="flex-1 flex flex-col hover:bg-gray-100 transition-colors">
                     <span className="font-semibold px-2 py-0.5 border-b border-gray-300 text-center">PIS (R$)</span>
                     <input type="text" className="w-full h-full px-2 bg-transparent font-black outline-none text-center text-gray-800" 
                         value={pis || pis === 0 ? maskMoney((pis * 100).toFixed(0)) : ''}
                        onChange={(e) => { const raw = e.target.value.replace(/\D/g,''); const r=Number(raw)/100; setPis(r); setValorLiquidoState(valorNF - irpj - r - cofins - csll); }} 
                        placeholder="0,00" />
                  </div>
                  <div className="flex-1 flex flex-col hover:bg-gray-100 transition-colors">
                     <span className="font-semibold px-2 py-0.5 border-b border-gray-300 text-center">COFINS (R$)</span>
                     <input type="text" className="w-full h-full px-2 bg-transparent font-black outline-none text-center text-gray-800" 
                         value={cofins || cofins === 0 ? maskMoney((cofins * 100).toFixed(0)) : ''}
                        onChange={(e) => { const raw = e.target.value.replace(/\D/g,''); const r=Number(raw)/100; setCofins(r); setValorLiquidoState(valorNF - irpj - pis - r - csll); }} 
                        placeholder="0,00" />
                  </div>
                  <div className="flex-1 flex flex-col hover:bg-gray-100 transition-colors">
                     <span className="font-semibold px-2 py-0.5 border-b border-gray-300 text-center">CSLL (R$)</span>
                     <input type="text" className="w-full h-full px-2 bg-transparent font-black outline-none text-center text-gray-800" 
                         value={csll || csll === 0 ? maskMoney((csll * 100).toFixed(0)) : ''}
                        onChange={(e) => { const raw = e.target.value.replace(/\D/g,''); const r=Number(raw)/100; setCsll(r); setValorLiquidoState(valorNF - irpj - pis - cofins - r); }} 
                        placeholder="0,00" />
                  </div>
               </div>

               {/* VALOR LÍQUIDO */}
               <div className="flex border-b-[3px] border-gray-800 h-14 sm:h-16">
                  <div className="bg-gray-200 flex items-center justify-center font-black uppercase text-[11px] sm:text-[13px] px-4 sm:px-8 border-r border-gray-400 shrink-0">
                     Valor Líquido
                  </div>
                  <div className="flex-1 flex items-center px-4 sm:px-6 relative group bg-emerald-50">
                     <span className="font-bold text-gray-500 mr-2 text-sm sm:text-base">R$</span>
                     <input
                       type="text"
                       className="w-full bg-transparent text-xl sm:text-2xl font-black outline-none text-emerald-700 hover:bg-emerald-100/50 focus:bg-emerald-100 transition-colors rounded px-1"
                       value={valorLiquidoState || valorLiquidoState === 0 ? maskMoney((valorLiquidoState * 100).toFixed(0)) : ''}
                       onChange={(e) => {
                         const rawValue = e.target.value.replace(/\D/g, '');
                         setValorLiquidoState(Number(rawValue) / 100);
                       }}
                       placeholder="0,00"
                     />
                  </div>
               </div>

               {/* DADOS ADICIONAIS NF */}
               <div className="flex divide-x divide-gray-400 bg-white text-[10px] sm:text-[11px] h-14 border-b-[3px] border-gray-800">
                  <div className="flex-1 flex flex-col hover:bg-gray-50 transition-colors">
                     <span className="font-semibold px-2 py-0.5 border-b border-gray-300 text-center">Data Emissão</span>
                     <input type="date" className="w-full h-full px-2 bg-transparent font-black outline-none text-center text-[#1e3a8a] text-[12px]" 
                        value={dataEmissao}
                        onChange={e => setDataEmissao(e.target.value)} 
                     />
                  </div>
                  <div className="flex-1 flex flex-col hover:bg-gray-50 transition-colors">
                     <span className="font-semibold px-2 py-0.5 border-b border-gray-300 text-center">Vencimento</span>
                     <input type="date" className="w-full h-full px-2 bg-transparent font-black outline-none text-center text-[#1e3a8a] text-[12px]" 
                        value={vencimento}
                        onChange={e => setVencimento(e.target.value)} 
                     />
                  </div>
                  <div className="flex-[2] flex flex-col hover:bg-gray-50 transition-colors">
                     <span className="font-semibold px-2 py-0.5 border-b border-gray-300 text-center">NF (Opcional)</span>
                     <input type="text" className="w-full h-full px-2 bg-transparent font-black outline-none text-center text-[#1e3a8a] text-[12px]" 
                        value={nfNumber}
                        onChange={e => setNfNumber(e.target.value)}
                        placeholder="Nº da Nota Fiscal Emitida (Ex: 00000000)" 
                     />
                  </div>
               </div>
               
               <div className="flex flex-col text-[9px] sm:text-[10px] p-2 sm:p-3 bg-white space-y-0.5">
                  <strong className="text-black mb-1">OUTRAS INFORMAÇÕES / DEDUÇÕES</strong>
                  <span className="text-gray-700">- Documento referencial gerado eletronicamente via Integração Salomão Manager.</span>
                  <span className="text-gray-700">- Tributação conforme legislação vigente do município emissor na data atual.</span>
               </div>
            </div>

        </div>
      </div>

      <ClientFormModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={(savedClient) => {
          if (savedClient) {
            const fetchClients = async () => {
              const { data } = await supabase.from('clients').select('id, name, cnpj, email').order('name');
              if (data) {
                 setClients(data);
                 const matching = data.find(c => c.id === savedClient.id) || savedClient;
                 handleSelectClient(matching);
              }
            };
            fetchClients();
          }
        }}
      />
      
      <DraftContractModal
        isOpen={isDraftContractModalOpen}
        onClose={() => setIsDraftContractModalOpen(false)}
        client={selectedClient}
        onSave={() => handleSelectClient(selectedClient)}
      />

      <EmissaoNFStatusModal 
        isOpen={emissaoStatus.isOpen}
        status={emissaoStatus.status}
        errorDetails={emissaoStatus.errorDetails}
        onClose={() => setEmissaoStatus(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default EmissaoNF;
