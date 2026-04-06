import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { FileText, CheckCircle, Search, Plus, Trash2, X, Eye, FileSignature, Loader2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import { Contract, Partner, ContractProcess, TimelineEvent, Analyst, Collaborator } from '../../../types/controladoria';
import { ContractFormModal } from '../contracts/ContractFormModal';
import { generateProposalDocx } from '../../../utils/docxGenerator';
import { maskMoney, maskCNPJ } from '../utils/masks';
import { CustomSelect } from '../ui/CustomSelect';
import { safeParseFloat } from '../utils/contractHelpers';
import { moedaPorExtenso, percentualPorExtenso, currencyToWordsEnglish } from '../../../utils/extenso';

const toTitleCase = (str: string) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

interface FeeClause {
  value: string;
  description: string;
  type: 'currency' | 'percent'; // Added type
}

// Fixed Dictionary for Partner Locations validation
const PARTNER_LOCATIONS: Record<string, string[]> = {
  "Bernardo Safady Kaiuca": ["Rio de Janeiro", "Vitória"],
  "Eduardo Oliveira Machado de Souz Abrahão": ["Rio de Janeiro", "São Paulo", "Salvador"],
  "Livia Sanches Sancio": ["Rio de Janeiro", "Vitória"],
  "Luis Felipe Salomão Filho": ["Rio de Janeiro", "São Paulo", "Brasília", "Vitória", "Florianópolis"],
  "Marcus Lívio Gomes": ["Brasília", "Vitória", "Florianópolis", "Belém"],
  "Paulo Cesar Salomão Filho": ["Rio de Janeiro", "Vitória", "Salvador"],
  "Pedro Neiva de Santana Neto": ["São Paulo", "Brasília", "Florianópolis"],
  "Rodrigo Figueiredo da Silva Cotta": ["Rio de Janeiro", "São Paulo", "Brasília", "Vitória", "Florianópolis"],
  "Rodrigo Moraes Mendonça Raposo": ["Rio de Janeiro", "São Paulo", "Brasília", "Vitória", "Florianópolis"],
  "Rodrigo Cunha Mello Salomão": ["Rio de Janeiro", "São Paulo", "Brasília", "Vitória", "Florianópolis"],
};

export function Proposals() {
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [clientOptions, setClientOptions] = useState<{ label: string; value: string }[]>([]);
  const [locationOptions, setLocationOptions] = useState<{ label: string; value: string }[]>([]);

  // Form State
  const [proposalData, setProposalData] = useState({
    clientName: '',
    cnpj: '',
    // partner_id: '', // REMOVED
    // partner_name: '', // REMOVED
    selectedPartners: [] as (Partner & { collaboratorData?: Collaborator })[], // New: Multiple Partners
    reference: '', // Referência da Proposta (Top)
    object: '', // Objeto da Disputa (Clause 1.1)
    contractLocation: '', // New: Location
    isPerson: false, // New: Person Type Toggle

    // New Structure for multiple clauses with types
    pro_labore_clauses: [{ value: '', description: '', type: 'currency' }] as FeeClause[],
    final_success_fee_clauses: [{ value: '', description: '', type: 'currency' }] as FeeClause[],
    intermediate_fee_clauses: [{ value: '', description: '', type: 'currency' }] as FeeClause[],

    // Specific to Marcus Livio Mode
    endereco: '',
    responsaveis: '',
    honorariosText: '',
  });

  const [proposalMode, setProposalMode] = useState<'default' | 'marcus_livio'>('default');
  const [selectedTechs, setSelectedTechs] = useState<string[]>(['Rafael Goulart']);
  const [isEditingBody, setIsEditingBody] = useState(false);
  const [customBodyText, setCustomBodyText] = useState("");
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');

  // Modal State (for after generation)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setCaseSaved] = useState(false);
  const caseSavedRef = useRef(false);
  const [contractFormData, setContractFormData] = useState<Contract>({} as Contract);
  const [processes, setProcesses] = useState<ContractProcess[]>([]);
  const [currentProcess, setCurrentProcess] = useState<ContractProcess>({ process_number: '' });
  const [editingProcessIndex] = useState<number | null>(null);
  const [newIntermediateFee, setNewIntermediateFee] = useState('');
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>([]);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);

  const addIntermediateFee = () => {
    if (!newIntermediateFee) return;
    setContractFormData((prev: Contract) => ({
      ...prev,
      intermediate_fees: [...(prev.intermediate_fees || []), newIntermediateFee]
    }));
    setNewIntermediateFee('');
  };

  const removeIntermediateFee = (idx: number) => {
    setContractFormData((prev: Contract) => ({
      ...prev,
      intermediate_fees: prev.intermediate_fees?.filter((_, i) => i !== idx)
    }));
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [safeAreaHeight, setSafeAreaHeight] = useState(0);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculatePages = () => {
      if (previewContentRef.current && previewContainerRef.current) {
        const containerHeight = previewContainerRef.current.offsetHeight;
        const containerWidth = previewContainerRef.current.offsetWidth;
        // In CSS, padding percentages are relative to the width of the containing block
        // Align with CSS: pt-[13%] and pb-[11%] of the container width
        const headerPadding = containerWidth * 0.13;
        const footerPadding = containerWidth * 0.11;

        // We also have a pt-4 (16px) on the clipper
        const clipperPaddingTop = 16;

        const calculatedSafeHeight = containerHeight - headerPadding - footerPadding - clipperPaddingTop;

        const contentHeight = previewContentRef.current.scrollHeight;
        if (calculatedSafeHeight > 0) {
          // Standardized line height is 20px (leading-5)
          const lineHeight = 20;
          // Ensure safe area is a multiple of line height to prevent cutting lines
          const shiftUnit = Math.floor(calculatedSafeHeight / lineHeight) * lineHeight;

          setSafeAreaHeight(shiftUnit);
          const pages = Math.ceil(contentHeight / shiftUnit);
          setTotalPages(pages > 0 ? pages : 1);
        }
      }
    };

    const timeoutId = setTimeout(calculatePages, 500); // Increased timeout to ensure style stability
    return () => clearTimeout(timeoutId);
  }, [proposalData, customBodyText, isEditingBody, partners]);

  const jumpToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < totalPages) {
      setCurrentPage(pageIndex);
    }
  };

  const jumpToFieldPage = (fieldName: string) => {
    if (fieldName === 'final_success_fee_clauses') {
      jumpToPage(totalPages - 1);
    } else if (fieldName === 'intermediate_fee_clauses') {
      jumpToPage(Math.min(1, totalPages - 1));
    } else if (fieldName === 'pro_labore_clauses' || fieldName === 'object') {
      // Pro-labore is usually end of p1 or start of p2
      if (totalPages > 1) jumpToPage(1);
      else jumpToPage(0);
    } else {
      jumpToPage(0);
    }
  };

  // Fetch Inputs
  useEffect(() => {
    fetchPartners();
    fetchClients();
    fetchLocations();
  }, []);

  const fetchPartners = async () => {
    const { data } = await supabase.from('partners').select('*').order('name');
    if (data) setPartners(data);
    const { data: analystsData } = await supabase.from('analysts').select('*').eq('active', true).order('name');
    if (analystsData) setAnalysts(analystsData as Analyst[]);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, name, cnpj').order('name');
    if (data) {
      // Agrupar por CNPJ: clientes com mesmo CNPJ aparecem apenas uma vez
      const cnpjMap = new Map<string, any>();
      const noCnpjClients: any[] = [];
      const seenNames = new Set<string>();

      data.forEach(c => {
        const cnpjClean = c.cnpj?.replace(/\D/g, '') || '';
        if (cnpjClean.length > 0) {
          // Agrupar por CNPJ — manter o primeiro encontrado
          if (!cnpjMap.has(cnpjClean)) {
            cnpjMap.set(cnpjClean, c);
          }
        } else {
          // Sem CNPJ — deduplicar por nome
          if (!seenNames.has(c.name)) {
            seenNames.add(c.name);
            noCnpjClients.push(c);
          }
        }
      });

      const uniqueClients = [...cnpjMap.values(), ...noCnpjClients];

      // Store JSON in value to easily retrieve name and cnpj when selected
      setClientOptions(uniqueClients.map(c => ({
        label: c.cnpj ? `${c.name} - ${maskCNPJ(c.cnpj)}` : c.name,
        value: JSON.stringify({ name: c.name, cnpj: c.cnpj, id: c.id })
      })));
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase.from('office_locations').select('city').order('city');
      if (error) {
        console.error("Erro ao buscar office_locations:", error);
      }

      let uniqueCities: string[] = [];
      if (data && data.length > 0) {
        uniqueCities = Array.from(new Set(data.map((loc: any) => loc.city))).filter(Boolean);
      } else {
        // Fallback static locations if DB is empty
        uniqueCities = ["Rio de Janeiro", "São Paulo", "Brasília", "Vitória", "Salvador", "Florianópolis", "Belém", "Curitiba", "Porto Alegre", "Belo Horizonte"];
      }

      setLocationOptions(uniqueCities.map(city => ({ label: city, value: city })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'cnpj') {
      setProposalData(prev => ({ ...prev, [name]: maskCNPJ(value) }));
    } else if (name === 'isPerson') {
      // Checkbox handling
      const checked = (e.target as HTMLInputElement).checked;
      setProposalData(prev => {
        const newCnpj = checked && prev.cnpj ? prev.cnpj.replace(/\D/g, '').substring(0, 11) : prev.cnpj;
        return {
          ...prev,
          isPerson: checked,
          cnpj: newCnpj ? maskCNPJ(newCnpj) : ''
        };
      });
    } else {
      setProposalData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePartnerAdd = async (partnerId: string) => {
    if (!partnerId) return;

    // Check if already selected
    if (proposalData.selectedPartners.find(p => p.id === partnerId)) {
      return toast.error("Este sócio já foi adicionado.");
    }

    const partner = partners.find(p => p.id === partnerId);
    if (!partner) return;

    // Fetch details from Collaborators
    let collaboratorData: Collaborator | undefined;

    // Attempt 1: Search by name (Assuming exact match or close enough)
    // We should probably rely on a linked ID if it existed, but name is what we have typically
    const { data: collabDataRaw } = await supabase
      .from('collaborators')
      .select('*, oab_number(*)')
      .ilike('name', partner.name)
      .eq('status', 'active') // Only active ones?
      .maybeSingle();

    let collabData = collabDataRaw;
    if (collabDataRaw) {
      collabData = {
        ...collabDataRaw,
        oabs: collabDataRaw.oab_number?.map((o: any) => ({
          id: o.id,
          numero: o.numero,
          uf: o.uf,
          tipo: o.tipo,
          validade: o.validade
        })) || []
      };
    }

    if (collabData) {
      collaboratorData = collabData as Collaborator;
    } else {
      // Fallback: If partner table has info (it usually doesn't have details like OAB/Civil Status fully populated in types but let's check runtime)
      // For now, if not found, we just use partner data.
      toast.warning(`Dados detalhados não encontrados em Integrantes para ${partner.name}.`);
    }

    setProposalData(prev => ({
      ...prev,
      selectedPartners: [...prev.selectedPartners, { ...partner, collaboratorData }]
    }));
  };

  const handlePartnerRemove = (index: number) => {
    setProposalData(prev => ({
      ...prev,
      selectedPartners: prev.selectedPartners.filter((_, i) => i !== index)
    }));
  };

  // Helper to update clauses
  const updateClause = (
    type: 'pro_labore_clauses' | 'final_success_fee_clauses' | 'intermediate_fee_clauses',
    index: number,
    field: 'value' | 'description' | 'type',
    value: string
  ) => {
    setProposalData(prev => {
      const newClauses = [...prev[type]];
      if (field === 'type') {
        newClauses[index].type = value as 'currency' | 'percent';
        newClauses[index].value = ''; // Reset value on type change to avoid mask confusion
      } else if (field === 'value') {
        const currentType = newClauses[index].type;
        if (currentType === 'currency') {
          newClauses[index][field] = maskMoney(value, language);
        } else {
          newClauses[index][field] = value;
        }
      } else {
        newClauses[index][field] = value;
      }
      return { ...prev, [type]: newClauses };
    });
  };

  const addClause = (type: 'pro_labore_clauses' | 'final_success_fee_clauses' | 'intermediate_fee_clauses') => {
    setProposalData(prev => ({
      ...prev,
      [type]: [...prev[type], {
        value: '',
        description: '',
        type: 'currency' // Default to currency, user can toggle
      }]
    }));
  };

  const removeClause = (type: 'pro_labore_clauses' | 'final_success_fee_clauses' | 'intermediate_fee_clauses', index: number) => {
    setProposalData(prev => {
      // Allow removing all if needed, but maybe keep 1 for UX? 
      // User requested distinct sections, so maybe empty sections are allowed?
      // Let's keep at least one empty row to be safe and visible.
      if (prev[type].length <= 1) {
        // If it's the last one, just clear it instead of removing
        const newClauses = [...prev[type]];
        newClauses[0] = { ...newClauses[0], value: '', description: '' };
        return { ...prev, [type]: newClauses };
      }
      return {
        ...prev,
        [type]: prev[type].filter((_, i) => i !== index)
      };
    });
  };

  const handleClientNameChange = async (val: string) => {
    try {
      // Try parsing if it's the JSON string from dropdown
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === 'object') {
        setProposalData(prev => ({
          ...prev,
          clientName: parsed.name,
          cnpj: parsed.cnpj ? maskCNPJ(parsed.cnpj) : ''
        }));
        return;
      }
    } catch {
      // It's a custom string typed by the user
      setProposalData(prev => ({ ...prev, clientName: val }));

      // Try to find CNPJ if existing client typed exactly
      if (val) {
        const { data } = await supabase.from('clients').select('cnpj').eq('name', val).maybeSingle();
        if (data && data.cnpj) {
          setProposalData(prev => ({ ...prev, cnpj: maskCNPJ(data.cnpj) }));
        }
      }
    }
  };

  const handleCNPJSearch = async () => {
    if (!proposalData.cnpj) return;
    const cnpjLimpo = proposalData.cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) return toast.error('CNPJ inválido. Digite 14 dígitos.');

    const toastId = toast.loading('Buscando dados da empresa...');
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!response.ok) throw new Error('CNPJ não encontrado na Receita Federal');
      const data = await response.json();

      const razaoSocial = toTitleCase(data.razao_social || data.nome_fantasia || '');

      setProposalData(prev => ({
        ...prev,
        clientName: razaoSocial,
        cnpj: maskCNPJ(cnpjLimpo)
      }));
      toast.success('Dados encontrados!', { id: toastId });
    } catch (error: any) {
      toast.error(`Erro na busca: ${error.message}`, { id: toastId });
    }
  };

  const getContractDataFromForm = (partnersToUse = proposalData.selectedPartners) => {
    const proLaboreMain = proposalData.pro_labore_clauses[0];
    const proLaboreExtras = proposalData.pro_labore_clauses.slice(1).map(c => c.value);
    const proLaboreExtrasClauses = proposalData.pro_labore_clauses.slice(1).map(c => c.description);

    const firstCurrencySuccess = proposalData.final_success_fee_clauses.find(c => c.type === 'currency');
    const firstPercentSuccess = proposalData.final_success_fee_clauses.find(c => c.type === 'percent');

    const successExtras = proposalData.final_success_fee_clauses.filter(c => c !== firstCurrencySuccess && c !== firstPercentSuccess);

    const currencyExtras = successExtras.filter(c => c.type === 'currency');
    const percentExtras = successExtras.filter(c => c.type === 'percent');

    const intermediateValues = proposalData.intermediate_fee_clauses.map(c => c.value).filter(Boolean);
    const intermediateClauses = proposalData.intermediate_fee_clauses.map(c => c.description).filter(Boolean);

    const primaryPartner = partnersToUse[0];

    const newContract: any = {
      client_name: proposalData.clientName,
      cnpj: proposalData.cnpj,
      partner_id: primaryPartner?.id,
      status: 'draft',
      proposal_date: new Date().toISOString(),
      reference: proposalData.reference,
      observations: proposalData.object,

      pro_labore: proLaboreMain.value,
      pro_labore_clause: proLaboreMain.description,
      pro_labore_extras: proLaboreExtras.length ? proLaboreExtras : null,
      pro_labore_extras_clauses: proLaboreExtrasClauses.length ? proLaboreExtrasClauses : null,

      final_success_fee: firstCurrencySuccess ? firstCurrencySuccess.value : null,
      final_success_fee_clause: firstCurrencySuccess?.description || null,

      final_success_percent: firstPercentSuccess?.value || null,
      final_success_percent_clause: firstPercentSuccess?.description || null,

      final_success_extras: currencyExtras.length ? currencyExtras.map(c => c.value) : null,
      final_success_extras_clauses: currencyExtras.length ? currencyExtras.map(c => c.description) : null,

      percent_extras: percentExtras.length ? percentExtras.map(c => c.value) : null,
      percent_extras_clauses: percentExtras.length ? percentExtras.map(c => c.description) : null,

      intermediate_fees: intermediateValues.length ? intermediateValues : null,
      intermediate_fees_clauses: intermediateClauses.length ? intermediateClauses : null,

      has_legal_process: false,
      uf: proposalData.contractLocation || 'RJ',
    };

    Object.keys(newContract).forEach(k => {
      if (newContract[k] === null || newContract[k] === undefined || newContract[k] === "") {
        delete newContract[k];
      }
    });

    return {
      contractData: newContract,
      primaryPartner,
      proLaboreExtras,
      proLaboreExtrasClauses,
      currencyExtras,
      percentExtras,
      intermediateValues,
      intermediateClauses
    };
  };

  const prepareFullContractData = (contractData: any, primaryPartner: any, proposalCode: string, currencyExtras: FeeClause[], percentExtras: FeeClause[], intermediateValues: string[], intermediateClauses: string[], proLaboreExtras: string[], proLaboreExtrasClauses: string[]) => {
    return {
      ...contractData,
      partner_name: primaryPartner.name,
      proposal_code: proposalCode,

      partners_data: proposalData.selectedPartners.map(p => {
        let oabNumero = (p.collaboratorData as any)?.oab_numero || p.oab_number || 'XXXXXX';
        let oabUf = (p.collaboratorData as any)?.oab_uf || p.oab_state || 'RJ';

        if (proposalData.contractLocation && p.collaboratorData?.oabs && p.collaboratorData.oabs.length > 0) {
          const cityToUf: Record<string, string> = {
            "Rio de Janeiro": "RJ", "São Paulo": "SP", "Brasília": "DF",
            "Vitória": "ES", "Salvador": "BA", "Florianópolis": "SC",
            "Belém": "PA", "Curitiba": "PR", "Belo Horizonte": "MG", "Porto Alegre": "RS"
          };
          const targetUf = cityToUf[proposalData.contractLocation] || proposalData.contractLocation;

          const matchingOab = p.collaboratorData.oabs.find((o: any) => o.uf === targetUf && o.tipo !== 'Inativa');
          if (matchingOab) {
            oabNumero = matchingOab.numero;
            oabUf = matchingOab.uf;
          } else {
            const principalOab = p.collaboratorData.oabs.find((o: any) => o.tipo === 'Principal') || p.collaboratorData.oabs[0];
            if (principalOab) {
              oabNumero = principalOab.numero;
              oabUf = principalOab.uf;
            }
          }
        }

        return {
          name: p.name,
          civil_status: p.collaboratorData?.civil_status || 'casado(a)',
          nacionalidade: p.collaboratorData?.nacionalidade || 'brasileiro(a)',
          oab_numero: oabNumero,
          oab_uf: oabUf,
          cpf: p.collaboratorData?.cpf || p.cpf || 'XXX.XXX.XXX-XX',
          gender: p.collaboratorData?.gender || p.gender || 'M',
        };
      }),

      location: proposalData.contractLocation,
      reference: proposalData.reference,

      pro_labore_extras: proLaboreExtras,
      pro_labore_extras_clauses: proLaboreExtrasClauses,

      final_success_extras: currencyExtras.length ? currencyExtras.map(c => c.value) : undefined,
      final_success_extras_clauses: currencyExtras.length ? currencyExtras.map(c => c.description) : undefined,

      percent_extras: percentExtras.length ? percentExtras.map(c => c.value) : undefined,
      percent_extras_clauses: percentExtras.length ? percentExtras.map(c => c.description) : undefined,

      intermediate_fees: intermediateValues,
      intermediate_fees_clauses: intermediateClauses,

      full_success_clauses: proposalData.final_success_fee_clauses,
      custom_body_text: customBodyText || (language === 'en' ? generateEnglishBodyText() : generateDefaultBodyText()),
      language: language,
    };
  };

  const generateEnglishBodyText = () => {
    const todayStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    
    let text = `<<RIGHT>>${proposalData.contractLocation || '[Cidade]'}, ${todayStr}\n\n`;
    text += `**TO**\n**${proposalData.clientName ? proposalData.clientName.toUpperCase() : '[NOME DA EMPRESA]'}**\n\n`;
    text += `**Ref:** ${proposalData.reference || '[REFERÊNCIA DA PROPOSTA]'}\n\n`;
    text += `Dear Sirs,\n\n`;

    text += `It is with great honor that **SALOMÃO ADVOGADOS**, herein duly represented by its partners `;

    if (proposalData.selectedPartners.length > 0) {
      const partnersList = proposalData.selectedPartners.map((p, idx) => {
        const data = p.collaboratorData;
        const gender = data?.gender || p.gender || 'M';
        const isFem = ['F', 'Feminino', 'Female'].includes(gender);

        let oab = (data as any)?.oab_numero || p.oab_number || 'XXXXXX';
        let oabUf = (data as any)?.oab_uf || p.oab_state || 'RJ';

        if (proposalData.contractLocation && data?.oabs && data.oabs.length > 0) {
          const cityToUf: Record<string, string> = {
            "Rio de Janeiro": "RJ", "São Paulo": "SP", "Brasília": "DF",
            "Vitória": "ES", "Salvador": "BA", "Florianópolis": "SC",
            "Belém": "PA", "Curitiba": "PR", "Belo Horizonte": "MG", "Porto Alegre": "RS"
          };
          const targetUf = cityToUf[proposalData.contractLocation] || proposalData.contractLocation;

          const matchingOab = data.oabs.find((o: any) => o.uf === targetUf && o.tipo !== 'Inativa');
          if (matchingOab) {
            oab = matchingOab.numero;
            oabUf = matchingOab.uf;
          } else {
            const principalOab = data.oabs.find((o: any) => o.tipo === 'Principal') || data.oabs[0];
            if (principalOab) {
              oab = principalOab.numero;
              oabUf = principalOab.uf;
            }
          }
        }

        const cpf = data?.cpf || p.cpf || 'XXX.XXX.XXX-XX';
        const civilEn = data?.civil_status ? (data.civil_status.toLowerCase().includes('casad') ? 'married' : 'single') : 'married';
        const natEn = data?.nacionalidade ? (data.nacionalidade.toLowerCase().includes('brasil') ? 'Brazilian' : data.nacionalidade) : 'Brazilian';
        
        const lawyerStr = isFem ? 'lawyer' : 'lawyer';

        let prefix = "";
        if (proposalData.selectedPartners.length > 1 && idx === proposalData.selectedPartners.length - 1) {
          prefix = " and ";
        } else if (idx > 0) {
          prefix = ", ";
        }

        return `${prefix}**${p.name.toUpperCase()}**, ${natEn}, ${civilEn}, ${lawyerStr}, enrolled with the Brazilian Bar Association (OAB/${oabUf}) under No. ${oab}, bearer of the Individual Taxpayers' Registry (CPF/MF) No. ${cpf}`;
      }).join('');

      text += partnersList;
    } else {
      text += `**[dados do sócio em ingês]**`;
    }

    text += ` (hereinafter referred to as the “Firm” or the “Contracted Party”), hereby submits this proposal for legal fees and provision of legal services under the following terms.\n\n`;

    text += `**1. OBJECT AND SCOPE OF THE SERVICES:**\n\n`;
    text += `1.1. The scope of this Agreement is to provide Client with legal service, to be carried out by Salomão Advogados ("Firm"), with the purpose of legal representation of the interests of **${proposalData.clientName || '[NOME DO CLIENTE]'}** (“Client” or the “Contracting Party”) **${proposalData.object || '[objeto da proposta]'}**.\n\n`;
    text += `1.2. In addition to the analysis of the case and definition of the legal strategy, the scope of professional services comprises the complete analysis of the documents and information sent by the Client, drafting of extrajudicial notices, preparation and filing of procedural documents, case monitoring, presentation of oral arguments, chambers meeting (despacho), as well as all related acts necessary to safeguard the Client’s interests in the lawsuits.\n\n`;
    text += `1.3. The services proposed herein include participation in meetings with the Client whenever necessary for understandings, clarifications and discussion of strategies, always aiming at the best possible performance of the Firm in defense of the Client's interests.\n\n`;
    text += `1.4. The scope of services also includes legal advice and representation in negotiations with the opposing party aimed at reaching an amicable resolution to the dispute.\n\n`;
    text += `1.5. The services proposed herein do not include general advice or other advice that does not have a correlation with the subject matter of this proposal.\n\n`;

    text += `**2. FEES AND METHOD OF PAYMENT:**\n\n`;
    text += `2.1. Considering the complexity and strategic relevance of the case, as well as the particularities of the case as to the procedural phases involved, we propose the following fee structure:\n\n`;

    const formatValueWithExtensoEn = (val: string, type: 'currency' | 'percent') => {
      if (!val) return '';
      const numStr = val.replace(/[R$\s.%A-Za-z]/g, '').replace(',', '.');
      const num = parseFloat(numStr);
      if (isNaN(num)) return type === 'percent' ? `${val}%` : val;
      if (type === 'currency') {
        const valFormatted = val.replace(/[^0-9,.]/g, '').trim(); // Remove symbols (R$, U$$)
        return `U$$ ${valFormatted} (${currencyToWordsEnglish(num)})`;
      } else {
        return `${val}%`; // Percents in English usually stay numerical, or spelled out. Template implies just values. 
        // We'll leave it as format requested.
      }
    };

    let clauseIndex = 2;
    proposalData.pro_labore_clauses.forEach((c) => {
      if (c.value) {
        const ext = formatValueWithExtensoEn(c.value, 'currency');
        // Based on template, we'll try to insert the value generic pro-labore clause as requested.
        text += `2.${clauseIndex}. Pro-labore fixed fee on the amount of ${ext}, ${c.description || 'to be paid within 30 (thirty) days from the date of execution of this instrument.'}\n\n`;
        // The user provided a complex mix for pro-labore in the template. If there's more than one, we'll just stack them.
        clauseIndex++;
      }
    });

    proposalData.intermediate_fee_clauses.forEach((c) => {
      if (c.value) {
        const ext = formatValueWithExtensoEn(c.value, 'currency');
        text += `2.${clauseIndex}. Intermediate success fee on the amount of ${ext}, ${c.description || '[descrição]'}.\n\n`;
        clauseIndex++;
      }
    });

    proposalData.final_success_fee_clauses.forEach((c) => {
      if (c.value) {
        const typeToUse = c.type === 'currency' ? 'currency' : 'percent';
        const ext = formatValueWithExtensoEn(c.value, typeToUse);
        text += `2.${clauseIndex}. Success Fees on the amount of ${ext} ${c.description || 'on the economic benefit obtained by the Client'}.\n\n`;
        clauseIndex++;
      }
    });

    text += `2.${clauseIndex}. The final success fees shall be fully due and payable by the Client in the event of a settlement or unjustified termination of this Agreement.\n\n`;
    text += `2.${clauseIndex + 1}. The Client acknowledges that, pursuant to applicable Brazilian law, the prevailing party in judicial proceedings may be awarded attorneys’ fees by the court, payable by the losing party (“Court-Awarded Fees” or “Honorários de Sucumbência”). Any such Court-Awarded Fees shall belong exclusively to the Firm’s attorneys and shall be received directly by them, in accordance with applicable law. These amounts shall not offset, reduce, replace, or otherwise impact the contractual fees agreed upon in this engagement, which remain due and payable in full irrespective of any court-awarded amounts.\n\n`;
    text += `2.${clauseIndex + 2}. In the event of: (a) withdrawal and/or waiver resulting in the termination of the legal discussions; (b) subsequent loss of the subject matter; (c) dismissal of the Firm’s professionals without cause; and/or (d) assignments and/or transactions involving the Client’s rights and/or the Firm’s interests, the Parties hereby agree, in good faith and in accordance with applicable law, that all amounts set forth in this Agreement, without exception, shall become fully and automatically due and payable, regardless of whether the success events occur after the Firm’s disengagement and irrespective of the content of any judicial decisions rendered, in recognition by the Client that the strategy designed and implemented by the Firm was decisive in achieving a favorable outcome. Such amounts shall be paid within fifteen (15) days following the occurrence of any of the aforementioned events\n\n`;

    text += `**3. GENERAL CONDITIONS:**\n\n`;
    text += `3.1. The lawyer fees do not include expenses related to the case, such as judicial and extrajudicial costs, airfare, accommodation, and other expenses borne by the Client. These expenses may be advanced by the Firm and reimbursed by the Client. In the event that we engage other professionals, experts, inspectors, translators, or other service providers on behalf of the Client and with prior approval from Client, such engagement will be made in the capacity of the Client's agents, and Client will be responsible for the payment of the lawyer fees of the aforementioned.\n\n`;
    text += `3.2. Late payment of fees will subject Client to the payment of a late payment penalty of 10% (ten percent), interest on late payment of 1% (one percent) per month and monetary adjustment for the positive variation of the IPCA. In the event of the need for judicial collection, fees will also be due at the rate of 20% (twenty percent) of the updated value of the debt.\n\n`;
    text += `3.3. The amounts set forth in this proposal, including any cap on success fees, shall be adjusted for inflation based on the positive variation of the IPCA index from the present date until their effective settlement.\n\n`;
    text += `3.4. This proposal has been prepared based on the information provided by the Client (or by a person designated by the Client) and within a short timeframe, seeking to ensure the best cost-benefit outcome for the Client. Should any discrepancy arise, during the course of the proceedings, between such information and the documents contained in the case file, or should the scope originally considered be expanded, the fees may be revised in order to restore the economic and financial balance of the engagement, which may be formalized through an addendum to this contract or by any other formal request submitted by the Firm.\n\n`;
    text += `3.5. The retention of the Firm for the specific matter now agreed upon shall not, by itself, preclude the Firm from representing other clients in unrelated matters, even where such clients’ interests may potentially be adverse to those of the Client, provided that: (i) there is no direct adversity in any proceeding or matter in which the Firm represents the Client; (ii) no confidential information of the Client is used or put at risk; and (iii) appropriate ethical barriers (Chinese walls) and team segregation are implemented, where applicable.\n\n`;
    text += `3.6. This proposal constitutes a binding agreement between the parties with respect to the subject matter herein and may only be amended or replaced by written authorization from both parties. In the event of any inconsistency between the provisions of this instrument and those of any other agreement submitted by the Client, including any subsequent agreement, the provisions of this instrument shall prevail.\n\n`;
    text += `3.7. The acceptance in relation to this contract may be given expressly or tacitly, in the latter case it will take place from the beginning of the provision of services by the Contracted Party.\n\n`;
    text += `3.8. In any case, the Contracted Party’s liability shall be limited to the amounts received by them. The court-awarded attorneys’ fees shall be exclusively owed to the Firm.\n\n`;
    text += `3.9. Upon express authorization of the Client, the Contracted Party may appoint other lawyers to act in said claim at no additional cost to the Client.\n\n`;
    text += `3.10. This proposal obliges the heirs and successors of the parties to faithfully fulfill their obligations.\n\n`;
    text += `3.11. The Firm adopts appropriate measures, in accordance with the good practices of the legislation, to prevent any fraudulent activity by itself, its lawyers, interns, and/or by any suppliers, agents, contractors, subcontractors and/or employees\n\n`;
    text += `3.12. The parties undertake to comply with all applicable legislation on information security, privacy and data protection, including the Federal Constitution, the Consumer Protection Code, the Civil Code, the Civil Rights Framework for the Internet (Federal Law No. 12,965/2014), its regulatory decree (Decree 8,771/2016), the General Data Protection Law (Federal Law No. 13,709/2018), and other sectoral or general rules on the subject, committing to process only the data mentioned and/or in the forms set forth herein upon express instructions from the data controller (the party that determines the purposes and means of processing personal data); or with due legal basis, without transferring them to any third party, except as expressly authorized by this or another instrument that binds them.\n\n`;
    text += `3.13. The parties agree to treat and maintain any and all information (written or verbal) as confidential, being prohibited, by action or omission, the disclosure of any information, documents among others, obtained in the negotiations and/or in the execution of the Agreement, without the prior and express consent of the other party. This rule does not cover information that is in the public domain, nor does it prevent the mention of the Contracting Party as a client of the Firm.\n\n`;
    text += `3.14. The parties elect the jurisdiction of the District of the Capital of the City of Rio de Janeiro to settle all controversies arising from this instrument, with express waiver of any other.\n\n`;
    text += `The Client and the Law Firm agree that this proposal may be executed digitally by all of its signatories. To this end, services widely available in the market will be used to ensure the security of the digital signature through certification systems capable of validating the authenticity of the electronic signature and certifying its integrity, via a digital certificate issued under the ICP-Brazil standard, which authorizes its digital signature through digital platforms.\n\n`;
    text += `Finally, we thank you for the opportunity to present this proposal and remain at your disposal for any further clarification. If accepted, kindly sign below and return an executed original copy to our Firm.\n\n`;

    text += `<<CENTER>>Cordially\n\n\n`;

    if (proposalData.selectedPartners.length > 0) {
      text += proposalData.selectedPartners.map(p => {
        return `<<CENTER>>____________________________________\n<<CENTER>>**${p.name.toUpperCase()}**\n<<CENTER>>**SALOMÃO ADVOGADOS**`;
      }).join('\n\n\n');
    } else {
      text += `<<CENTER>>____________________________________\n<<CENTER>>**[NOME DO SÓCIO]**\n<<CENTER>>**SALOMÃO ADVOGADOS**`;
    }

    text += `\n\n\n<<CENTER>>____________________________________\n<<CENTER>>**${proposalData.clientName ? proposalData.clientName.toUpperCase() : '[NOME DO CLIENTE]'}**`;
    text += `\n\n\n<<LEFT>>According to: ___/___/___`;
    text += `\n<<LEFT>>Witness 01:`;
    text += `\n<<LEFT>>Witness 02:`;

    return text;
  };

  const generateDefaultBodyText = () => {
    const todayStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const location = proposalData.contractLocation || '[Cidade]';

    let text = `<<RIGHT>>${location}, ${todayStr}.\n\n`;
    text += `**A**\n**${proposalData.clientName ? proposalData.clientName.toUpperCase() : '[NOME DA EMPRESA CLIENTE]'}**\n`;
    if (!proposalData.isPerson) {
      text += `**${proposalData.cnpj || '[CNPJ da empresa cliente]'}**\n`;
    }
    text += `\n`;
    text += `**Ref:** ${proposalData.reference || '[incluir referência da proposta]'}\n`;
    text += `**Cód.:** [código proposta]\n\n`;
    text += `Prezados,\n\n`;

    text += `É com grande honra que **SALOMÃO ADVOGADOS**, neste ato representado, respectivamente, por seus sócios `;

    if (proposalData.selectedPartners.length > 0) {
      const partnersList = proposalData.selectedPartners.map((p, idx) => {
        const data = p.collaboratorData;
        const gender = data?.gender || p.gender || 'M';
        const isFem = ['F', 'Feminino', 'Female'].includes(gender);

        let oab = (data as any)?.oab_numero || p.oab_number || 'XXXXXX';
        let oabUf = (data as any)?.oab_uf || p.oab_state || 'RJ';

        if (proposalData.contractLocation && data?.oabs && data.oabs.length > 0) {
          const cityToUf: Record<string, string> = {
            "Rio de Janeiro": "RJ", "São Paulo": "SP", "Brasília": "DF",
            "Vitória": "ES", "Salvador": "BA", "Florianópolis": "SC",
            "Belém": "PA", "Curitiba": "PR", "Belo Horizonte": "MG", "Porto Alegre": "RS"
          };
          const targetUf = cityToUf[proposalData.contractLocation] || proposalData.contractLocation;

          const matchingOab = data.oabs.find((o: any) => o.uf === targetUf && o.tipo !== 'Inativa');
          if (matchingOab) {
            oab = matchingOab.numero;
            oabUf = matchingOab.uf;
          } else {
            const principalOab = data.oabs.find((o: any) => o.tipo === 'Principal') || data.oabs[0];
            if (principalOab) {
              oab = principalOab.numero;
              oabUf = principalOab.uf;
            }
          }
        }

        const cpf = data?.cpf || p.cpf || 'XXX.XXX.XXX-XX';
        const civil = data?.civil_status ? data.civil_status.toLowerCase() : 'casado';
        const nacionalidade = data?.nacionalidade ? data.nacionalidade.toLowerCase() : 'brasileiro';

        const textNacionalidade = isFem && nacionalidade.includes('brasileir') ? 'brasileira' : nacionalidade;
        const textCivil = isFem && civil.includes('casad') ? 'casada' : (isFem && civil.includes('solteir') ? 'solteira' : civil);
        const textAdvogado = isFem ? 'advogada' : 'advogado';
        const textInscrito = isFem ? 'inscrita' : 'inscrito';
        const textPortador = isFem ? 'portadora' : 'portador';

        let prefix = "";
        if (proposalData.selectedPartners.length > 1 && idx === proposalData.selectedPartners.length - 1) {
          prefix = " e ";
        } else if (idx > 0) {
          prefix = ", ";
        }

        return `${prefix}**${p.name.toUpperCase()}**, ${textNacionalidade}, ${textCivil}, ${textAdvogado}, ${textInscrito} na OAB/${oabUf} sob o nº ${oab}, ${textPortador} do CPF/MF nº ${cpf}`;
      }).join('');

      text += partnersList;
    } else {
      text += `**[NOME DO SÓCIO]**`;
    }

    text += `, vem formular a presente proposta de honorários.\n\n`;

    text += `**1. OBJETO E ESCOPO DO SERVIÇO:**\n\n`;
    text += `1.1. O objeto da presente proposta é a assessoria jurídica a ser realizada pelos advogados que compõem Salomão Advogados (“Escritório”), com vistas à representação judicial em favor do Cliente **${proposalData.clientName || '[NOME DA EMPRESA CLIENTE]'}** (“Cliente” ou “Contratante”) **${proposalData.object || '[incluir objeto da disputa]'}**.\n\n`;
    text += `1.2. Os serviços previstos nesta proposta abrangem a defesa dos interesses do Contratante em toda e qualquer discussão relacionada ao tema tratado.\n\n`;
    text += `1.3. Além da análise do caso e definição da estratégia jurídica, o escopo dos serviços profissionais compreende a análise completa dos documentos e informações enviadas pelo Cliente, elaboração das peças processuais, acompanhamento processual, realização de sustentações orais, despachos, bem como todos os atos conexos necessários a atender os interesses do Cliente nos referidos processos.\n\n`;
    text += `1.4. Os serviços aqui propostos compreendem a participação em reuniões com o Cliente sempre que necessário para entendimentos, esclarecimentos e discussão de estratégias, sempre objetivando a melhor atuação possível do Escritório em defesa dos interesses do Cliente.\n\n`;
    text += `1.5. Também está incluída a assessoria jurídica na interlocução com a contraparte, para fins de autocomposição.\n\n`;
    text += `1.6. Os serviços aqui propostos não incluem consultoria geral ou outra que não possua correlação com o objeto da proposta.\n\n`;
    text += `**2. HONORÁRIOS E FORMA DE PAGAMENTO:**\n\n`;
    text += `2.1. Considerando as particularidades do caso, propomos honorários da seguinte forma:\n\n`;

    const formatValueWithExtenso = (val: string, type: 'currency' | 'percent') => {
      if (!val) return '';
      const numStr = val.replace(/[R$\s.%]/g, '').replace(',', '.');
      const num = parseFloat(numStr);
      if (isNaN(num)) return type === 'percent' ? `${val}%` : val;
      if (type === 'currency') {
        const valFormatted = val.includes('R$') ? val : `R$ ${val}`;
        return `${valFormatted} (${moedaPorExtenso(num)})`;
      } else {
        return `${val}% (${percentualPorExtenso(num)})`;
      }
    };

    let clauseIndex = 2;
    proposalData.pro_labore_clauses.forEach((c) => {
      if (c.value) {
        const ext = formatValueWithExtenso(c.value, 'currency');
        text += `2.${clauseIndex}. Honorários pró-labore de ${ext}, ${c.description || 'para engajamento no caso'}.\n\n`;
        clauseIndex++;
      }
    });

    proposalData.intermediate_fee_clauses.forEach((c) => {
      if (c.value) {
        const ext = formatValueWithExtenso(c.value, 'currency');
        text += `2.${clauseIndex}. Êxito intermediário de ${ext}, ${c.description || '[descrição]'}.\n\n`;
        clauseIndex++;
      }
    });

    proposalData.final_success_fee_clauses.forEach((c) => {
      if (c.value) {
        const typeToUse = c.type === 'currency' ? 'currency' : 'percent';
        const ext = formatValueWithExtenso(c.value, typeToUse);
        text += `2.${clauseIndex}. Honorários finais de êxito de ${ext}, ${c.description || '[descrição]'}.\n\n`;
        clauseIndex++;
      }
    });

    text += `2.${clauseIndex}. Os honorários de êxito serão integralmente devidos pelo Cliente em caso de transação ou rescisão imotivada do presente contrato.\n\n`;
    text += `2.${clauseIndex + 1}. Nos casos de (a) desistência e/ou renúncia que encerrem as discussões travadas; (b) perda superveniente de seu objeto; (c) destituição dos profissionais do ESCRITÓRIO sem culpa dos mesmos; e/ou (d) cessões e/ou operações envolvendo direitos do Contratante e/ou os interesses do ESCRITÓRIO, as Partes decidem, de boa-fé e na melhor forma de Direito, que todos os valores contemplados nesse Contrato, sem exceção, serão integralmente e automaticamente devidos, mesmo se e independentemente se os eventos de êxito ocorrerem após o desligamento do ESCRITÓRIO e independentemente do teor de quaisquer Decisões Judiciais que sejam proferidas, em reconhecimento, pelo Cliente, de que a estratégia desenhada e executada pelo ESCRITÓRIO afigurou-se determinante à obtenção do sucesso em seu favor. Esses valores serão pagos em até 10 (dez) dias após a ocorrência de quaisquer desses eventos.\n\n`;

    text += `**3. CONDIÇÕES GERAIS:**\n\n`;
    text += `3.1. Não estão incluídas nos honorários as despesas relacionadas ao caso, tais como aquelas com custas judiciais, extrajudiciais, passagens aéreas e hospedagens, dentre outras próprias da(o) Cliente. As despesas poderão ser adiantadas pelo Escritório e submetidas à reembolso pela(o) Cliente. Caso venhamos a contratar outros profissionais, peritos, vistoriadores, tradutores ou demais prestadores de serviços em nome da(o) Cliente e sob prévia aprovação de V.Sa., tal contratação será feita na qualidade de mandatários da(o) Cliente ficando V.Sas. desde já responsável pelo pagamento dos honorários dos profissionais supramencionados.\n\n`;
    text += `3.2. O atraso no pagamento dos honorários sujeitará o Cliente ao pagamento de multa de mora de 10% (dez por cento), juros de mora de 1% (um por cento) ao mês e correção monetária pela variação positiva do IPCA. Na hipótese de necessidade de cobrança judicial, serão devidos também honorários à razão de 20% (vinte por cento) do valor atualizado do débito.\n\n`;
    text += `3.3. Os valores previstos na presente proposta, incluindo eventual limite sobre os honorários de êxito, deverão ser corrigidos monetariamente pela variação positiva do IPCA desde a presente data até sua efetiva liquidação.\n\n`;
    text += `3.4. Os valores devidos a título de honorários são líquidos de tributos, independentemente de alterações legislativas futuras.\n\n`;
    text += `3.5. Esta proposta foi formulada com base nas informações fornecidas pelo Cliente (ou por pessoa por ele indicada) e em prazo exíguo, buscando o melhor custo-benefício ao Cliente. Verificando-se, no decorrer do processo, divergência entre tais informações e os documentos constantes dos autos, ou a ampliação do escopo originalmente considerado, os honorários poderão ser revistos para recompor o equilíbrio econômico-financeiro, o que poderá ser feito mediante aditivo contratual ou qualquer outra solicitação formal a ser apresentado pelo Escritório.\n\n`;
    text += `3.6. A contratação do Escritório para a especialidade ora pactuada não caracteriza, por si só, impedimento para que o Escritório atue em assuntos não relacionados de outro cliente, mesmo quando os interesses do outro cliente possam ser eventualmente adversos ao Cliente, desde que: (i) não haja adversidade direta em processo ou procedimento no qual o Escritório represente o Cliente; (ii) não se utilize, nem se ponha em risco, informação confidencial do Cliente; e (iii) sejam observadas barreiras éticas (Chinese wall) e segregação de equipes, quando cabível.\n\n`;
    text += `3.7. Esta proposta constitui-se em contrato entre as partes com respeito ao assunto objeto desta, podendo ser modificada ou substituída somente mediante autorização por escrito de ambas as partes envolvidas. Em caso de divergência das cláusulas do presente instrumento em relação a outro contrato enviado pelo Cliente, ainda que posterior, prevalecerão as do presente instrumento.\n\n`;
    text += `3.8. O aceite em relação a presente contratação poderá se dar de forma expressa ou tácita, sendo que neste último caso se dará a partir do início da prestação de serviços pelos Contratados.\n\n`;
    text += `3.9. Em qualquer caso, a responsabilidade dos Contratados será limitada aos valores efetivamente recebidos por este. Os honorários de sucumbência serão devidos exclusivamente ao Escritório.\n\n`;
    text += `3.10. Mediante expressa autorização da(o) Cliente, os Contratados poderão indicar outros advogados para atuar na referida demanda, cujos custos da contratação serão de responsabilidade d(ao) Cliente.\n\n`;
    text += `3.11. Esta proposta obriga os herdeiros e sucessores das Partes para o fiel cumprimento de suas obrigações.\n\n`;
    text += `3.12. O Escritório contratado adota as medidas adequadas, de acordo com as boas práticas da legislação, para impedir qualquer atividade fraudulenta por si, seus advogados, estagiários, e/ou por quaisquer fornecedores, agentes, contratadas, subcontratadas e/ou os empregados.\n\n`;
    text += `3.13. As partes se comprometem a cumprir toda a legislação aplicável sobre segurança da informação, privacidade e proteção de dados, inclusive a Constituição Federal, o Código de Defesa do Consumidor, o Código Civil, o Marco Civil da Internet (Lei Federal n. 12.965/2014), seu decreto regulamentador (Decreto 8.771/2016), a Lei Geral de Proteção de Dados (Lei Federal n. 13.709/2018), e demais normas setoriais ou gerais sobre o tema, se comprometendo a tratar apenas os dados mencionados e/ou nas formas dispostas neste instrumento mediante instruções expressas do controlador de dados (parte que determina as finalidades e os meios de tratamento de dados pessoais); ou com o devido embasamento legal, sem transferi-los a qualquer terceiro, exceto se expressamente autorizado por este ou outro instrumento que as vincule.\n\n`;
    text += `3.14. As partes concordam em tratar e manter todas e quaisquer informações (escritas ou verbais) como confidenciais, ficando vedado, por ação ou omissão, a revelação de quaisquer informações, documentos entre outros, obtidos nas tratativas e/ou na execução do Contrato, sem prévio e expresso consentimento da outra parte. Tal regra não abrange as informações que se encontram em domínio público nem impede a menção da(o) Contratante como cliente do Escritório.\n\n`;
    text += `3.15. As partes elegem o foro da Comarca da Capital da Cidade do Rio de Janeiro para dirimir todas as controvérsias oriundas do presente instrumento, com renúncia expressa a qualquer outro.\n\n`;
    text += `O Cliente e o Escritório concordam que esta proposta poderá ser firmada de maneira digital por todos os seus signatários. Para este fim, serão utilizados serviços disponíveis no mercado e amplamente utilizados que possibilitam a segurança de assinatura digital por meio de sistemas de certificação capazes de validar a autoria de assinatura eletrônica, bem como de certificar sua integridade, através de certificado digital emitido no padrão ICP-Brasil, autorizando, inclusive, a sua assinatura digital por meio de plataformas digitais.\n\n`;

    text += `<<CENTER>>Cordialmente,\n\n\n`;

    if (proposalData.selectedPartners.length > 0) {
      text += proposalData.selectedPartners.map(p => {
        return `<<CENTER>>____________________________________\n<<CENTER>>**${p.name.toUpperCase()}**\n<<CENTER>>**SALOMÃO ADVOGADOS**`;
      }).join('\n\n\n');
    } else {
      text += `<<CENTER>>____________________________________\n<<CENTER>>**[NOME DO SÓCIO]**\n<<CENTER>>**SALOMÃO ADVOGADOS**`;
    }

    text += `\n\n\n<<CENTER>>____________________________________\n<<CENTER>>**${proposalData.clientName ? proposalData.clientName.toUpperCase() : '[CLIENTE]'}**`;
    text += `\n\n\n<<LEFT>>De acordo em: ___/___/___`;

    return text;
  };

  const generateMarcusLivioBodyText = () => {
    const todayStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const location = proposalData.contractLocation || '[local]';

    let text = `<<RIGHT>>${location}, ${todayStr}\n\n`;
    text += `**À**\n**${proposalData.clientName ? proposalData.clientName.toUpperCase() : '[Cliente]'}**\n`;
    if (proposalData.endereco) {
      text += `**${proposalData.endereco}**\n`;
    }
    text += `\n**Ref.:** ${proposalData.reference || '[Referência]'}\n`;
    text += `**Cód.:** [código proposta]\n\n`;
    if (proposalData.responsaveis) {
      text += `**A/C:**\n**${proposalData.responsaveis}**\n\n`;
    }

    text += `Prezados Senhores,\n\n`;
    text += `É com grande honra que SALOMÃO ADVOGADOS, neste ato representado por seu sócio Marcus Lívio Gomes (“Escritório” ou “Contratado”), vem formular a presente proposta de honorários e prestação de serviços advocatícios, nos seguintes termos.\n\n`;

    text += `**1. O ESCRITÓRIO**\n\n`;
    text += `Constituído por mais de 90 advogados e com escritórios no Rio de Janeiro, em São Paulo, Brasília e Vitória, o SALOMÃO ADVOGADOS é especializado em diversos ramos do Direito, destacando-se por sua atuação em demandas estratégicas nos Tribunais do país, inclusive nas Cortes Superiores.\n\n`;
    text += `Com uma equipe altamente qualificada, o Escritório vem sendo reconhecido por diversas organizações e diretórios jurídicos de grande prestígio, tanto nacionais quanto internacionais:\n\n`;

    text += `<<IMAGE:PROP_LIVIO>>\n\n`;

    text += `**2. OS RESPONSÁVEIS TÉCNICOS**\n\n`;
    
    const techsNames = [];
    if (selectedTechs.includes('Guilherme Alves de Lima')) techsNames.push('Guilherme Alves de Lima');
    if (selectedTechs.includes('Rafael Goulart')) techsNames.push('Rafael Goulart');

    let techIntro = `O sócio Marcus Lívio Gomes será o responsável técnico pela condução da demanda de interesse da Empresa, possuindo a seguinte qualificação:`;
    if (techsNames.length === 1) {
      techIntro = `O sócio Marcus Lívio Gomes e o advogado ${techsNames[0]} serão os responsáveis técnicos pela condução da demanda de interesse da Empresa, possuindo a seguinte qualificação:`;
    } else if (techsNames.length === 2) {
      techIntro = `O sócio Marcus Lívio Gomes e os advogados ${techsNames[0]} e ${techsNames[1]} serão os responsáveis técnicos pela condução da demanda de interesse da Empresa, possuindo a seguinte qualificação:`;
    }
    
    text += `${techIntro}\n\n`;

    text += `**Marcus Lívio** é Doutor e Mestre em Direito Tributário pela Universidade Complutense de Madrid, Espanha, e atualmente é Pesquisador Visitante na Universidade de Londres (Institute of Advanced Legal Studies – IALS).\n\n`;
    text += `É Professor Titular de Direito Financeiro e Tributário nos programas de graduação e pós-graduação stricto sensu em Direito Tributário da Universidade do Estado do Rio de Janeiro (UERJ), desde 2013.\n`;
    text += `Coordenou o Diagnóstico do Contencioso Judicial Tributário Brasileiro, uma iniciativa pioneira do Conselho Nacional de Justiça (CNJ), enquanto Secretário Especial de Programas e Projetos na gestão do Ministro Luiz Fux.\n\n`;
    text += `Foi o relator da Comissão de Juristas para a Reforma do Processo Tributário do Senado Federal, presidida pela Ministra Regina Helena Costa, criada pelo Senador Rodrigo Pacheco, então Presidente do Senado Federal, e o Ministro Luiz Fux, então Presidente do STF.\n`;
    text += `É Juiz Federal aposentado do Tribunal Regional Federal da 2ª Região, onde foi Coordenador da Comissão de Direito Tributário da Escola da Magistratura Federal do TRF2.\n`;
    text += `Foi também Coordenador e Docente da Comissão de Direito Tributário da Escola da Magistratura do Tribunal de Justiça do Rio de Janeiro.\n`;
    text += `É membro da Associação Brasileira de Direito Financeiro (ABDF), do Instituto Latino-Americano de Direito Tributário (ILADT) e da International Fiscal Association (IFA).\n`;
    text += `Reconhecido pela Análise Advocacia 2025 entre os advogados mais admirados na categoria Abrangente.\n\n`;

    if (selectedTechs.includes('Guilherme Alves de Lima')) {
      text += `**Guilherme Alves de Lima** é especialista e Mestrando em Direito Tributário, atua assessorando clientes nacionais e estrangeiros em assuntos consultivos e contenciosos. Seu trabalho envolve (i) a análise de assuntos relacionados à Reforma Tributária, na interpretação das novas normas e na adaptação de modelos de negócios, (ii) a estruturação de cadeias de importação, industrialização, comercialização e prestação de serviços, com vistas a identificar e mitigar riscos e analisar a tributação incidente, (iii) a análise de regimes especiais (aduaneiros ou tributários), benefícios fiscais e tratamentos tributários diferenciados, (iv) a análise tributária em reorganizações societárias, e (v) a atuação em processos administrativos municipais, estaduais e federais. Tem experiência nos setores de petróleo e gás, energia elétrica, financeiro, farmacêutico, aeronáutico, de bebidas e varejo.\n\n`;
    }

    if (selectedTechs.includes('Rafael Goulart')) {
      text += `**Rafael Goulart** é graduado em Direito pela Universidade Candido Mendes – Centro/RJ (UCAM/RJ). Cursou a Especialização em Direito Tributário e Financeiro da Universidade Federal Fluminense (UFF). Integrou a Comissão Especial de Assuntos Tributários (CEAT) e a Comissão de Assuntos da Justiça Federal (CAJF), ambas da OAB-RJ, assim como foi professor da Escola Superior da Advocacia (ESA).\n`;
      text += `Apontado pela Chambers and Partners, ITR (International Tax Review), Leaders League, Latin Lawyer e Análise Advocacia como um dos advogados mais admirados do Brasil na área tributária.\n\n`;
    }

    text += `**3. OBJETO E ESCOPO DO SERVIÇO**\n\n`;
    text += `${proposalData.object || '[objeto]'}\n\n`;

    text += `**4. HONORÁRIOS**\n\n`;
    text += `${proposalData.honorariosText || '[honorários]'}\n\n`;

    text += `**5. CONDIÇÕES GERAIS**\n\n`;
    text += `Não estão incluídas nos honorários as despesas relacionadas ao caso, tais como aquelas com custas judiciais, extrajudiciais, passagens aéreas e eventuais hospedagens, dentre outras próprias dos Clientes. As despesas poderão ser adiantadas pelo Escritório e submetidas à reembolso pelos Clientes. Caso venhamos a contratar outros profissionais, peritos, vistoriadores, tradutores ou demais prestadores de serviços em nome dos Clientes e sob prévia aprovação de V.Sa., tal contratação será feita na qualidade de mandatários dos Cliente ficando V.Sas. desde já responsável pelo pagamento dos honorários dos profissionais supramencionados.\n`;
    text += `O atraso no pagamento dos honorários sujeitará os Clientes ao pagamento de multa de mora de 10% (dez por cento), juros de mora de 1% (um por cento) ao mês e correção monetária pela variação positiva do IPCA, INPC ou IGPM, a maior dentre elas. Na hipótese de necessidade de cobrança judicial, serão devidos também honorários à razão de 20% (vinte por cento) do valor atualizado do débito.\n`;
    text += `Os valores previstos na presente proposta são líquidos de tributos e deverão ser corrigidos monetariamente pela variação positiva do IPCA, INPC ou IGPM, a maior dentre elas, desde a presente data até sua efetiva liquidação, com exceção da primeira parcela de engajamento, a qual não sofrerá correção. Na falta dos índices supracitados, incidirá o maior índice oficial que o substituir.\n`;
    text += `Esta proposta constitui-se em contrato entre as partes com respeito ao assunto objeto desta, podendo ser modificada ou substituída somente mediante autorização por escrito de ambas as partes envolvidas. Em caso de divergência das cláusulas do presente instrumento em relação a outro contrato enviado pelos Clientes, ainda que posterior, prevalecerão as do presente instrumento.\n`;
    text += `O aceite em relação a presente contratação poderá se dar de forma expressa ou tácita, sendo que neste último caso se dará a partir do início da prestação de serviços pelo Contratado.\n`;
    text += `Em qualquer caso, a responsabilidade do Contratado será limitada aos valores efetivamente recebidos por este.\n`;
    text += `Mediante expressa autorização dos Clientes, o Contratado poderá indicar outros advogados para atuar na referida demanda sem custo adicional aos Clientes.\n`;
    text += `Esta proposta obriga os herdeiros e sucessores das partes para o fiel cumprimento de suas obrigações.\n`;
    text += `A presente proposta possui o prazo de validade de 30 dias, contados de sua emissão.\n`;
    text += `O Escritório Contratado adota as medidas adequadas, de acordo com as boas práticas da legislação, para impedir qualquer atividade fraudulenta por si, seus advogados, estagiários, e/ou por quaisquer fornecedores, agentes, contratadas, subcontratadas e/ou os empregados.\n`;
    text += `As partes se comprometem a cumprir toda a legislação aplicável sobre segurança da informação, privacidade e proteção de dados, inclusive a Constituição Federal, o Código de Defesa do Consumidor, o Código Civil, o Marco Civil da Internet (Lei Federal n. 12.965/14), seu decreto regulamentador (Decreto 8.771/2016), a Lei Geral de Proteção de Dados (Lei Federal n. 13.709/2018), e demais normas setoriais ou gerais sobre o tema, se comprometendo a tratar apenas os dados mencionados e/ou nas formas dispostas neste instrumento mediante instruções expressas do controlador de dados (parte que determina as finalidades e os meios de tratamento de dados pessoais); ou com o devido embasamento legal, sem transferi-los a qualquer terceiro, exceto se expressamente autorizado por este ou outro instrumento que as vincule.\n`;
    text += `As partes concordam em tratar todas e quaisquer informações como confidenciais, ficando vedado, por ação ou omissão, a revelação de quaisquer informações, documentos entre outros, obtidos nas tratativas e/ou na execução do Contrato, sem prévio e expresso consentimento da outra parte. Tal regra não abrange as informações que se encontram em domínio público nem impede a menção da Contratante como cliente do Escritório.\n`;
    text += `As partes elegem o foro da Comarca da Capital da Cidade do Rio de Janeiro para dirimir todas as controvérsias oriundas do presente instrumento, com renúncia expressa a qualquer outro.\n`;
    text += `Por fim, agradecemos a oportunidade de apresentar a presente proposta de prestação de serviços e permanecemos à disposição para demais esclarecimentos e considerações necessárias. Caso a presente proposta seja aceita, pedimos o obséquio de ser assinada no campo abaixo e remetida para nosso Escritório na via original.\n`;
    text += `Os Clientes e o Escritório concordam que esta proposta poderá ser firmada de maneira digital por todos os seus signatários. Para este fim, serão utilizados serviços disponíveis no mercado e amplamente utilizados que possibilitam a segurança de assinatura digital por meio de sistemas de certificação capazes de validar a autoria de assinatura eletrônica, bem como de certificar sua integridade, através de certificado digital emitido no padrão ICP-Brasil, autorizando, inclusive, a sua assinatura digital por meio de plataformas digitais.\n\n`;

    text += `<<CENTER>>Cordialmente,\n\n\n`;
    text += `<<CENTER>>**SALOMÃO ADVOGADOS**\n<<CENTER>>Marcus Lívio Gomes\n\n\n`;
    text += `<<CENTER>>**${proposalData.clientName ? proposalData.clientName.toUpperCase() : '[Cliente]'}**\n\n\n`;
    text += `<<LEFT>>De acordo em: ___/___/___\n\n`;
    text += `<<LEFT>>Testemunha 01:\n\n`;
    text += `<<LEFT>>Testemunha 02:\n`;

    return text;
  };

  const handleGenerateProposal = async () => {
    if (!proposalData.clientName) return toast.error("Preencha o Nome do Cliente");
    if (proposalData.selectedPartners.length === 0) return toast.error("Selecione pelo menos um Sócio");

    setLoading(true);
    const toastId = toast.loading("Gerando proposta e documentos...");

    try {
      // 1. Create Contract Record
      const {
        contractData: newContract,
        primaryPartner,
        currencyExtras,
        percentExtras,
        intermediateValues,
        intermediateClauses,
        proLaboreExtras,
        proLaboreExtrasClauses
      } = getContractDataFromForm();



      const { data: existingClient } = await supabase.from('clients').select('id').eq('name', proposalData.clientName).maybeSingle();
      if (existingClient) {
        newContract.client_id = existingClient.id;
      } else if (proposalData.cnpj) {
        const { data: clientByCnpj } = await supabase.from('clients').select('id').eq('cnpj', proposalData.cnpj.replace(/\D/g, '')).maybeSingle();
        if (clientByCnpj) newContract.client_id = clientByCnpj.id;
      }

      const { data: insertedContract, error: insertError } = await supabase
        .from('contracts')
        .insert(newContract)
        .select()
        .single();

      if (insertError) {
        console.error("Insert Error Payload:", newContract); // For debugging
        throw insertError;
      }

      // 2. Generate Proposal Code
      const proposalCode = `PROP - ${String(insertedContract.seq_id).padStart(6, '0')}.1`;

      // Update contract with code
      await supabase
        .from('contracts')
        .update({ proposal_code: proposalCode })
        .eq('id', insertedContract.id);

      // 3. Generate DOCX
      // Prepare full data object for generator
      const fullContractData: any = prepareFullContractData(
        newContract,
        primaryPartner,
        proposalCode,
        currencyExtras,
        percentExtras,
        intermediateValues,
        intermediateClauses,
        proLaboreExtras,
        proLaboreExtrasClauses
      );

      // FORCE update of body text if not explicitly customized, so latest form values are compiled
      // This needs to be done *before* generating the DOCX, and `generateDefaultBodyText` relies on `proposalData`
      // which might be cleared later.
      if (!isEditingBody && !customBodyText) {
        let generatedText = '';
        if (proposalMode === 'marcus_livio') {
            generatedText = generateMarcusLivioBodyText();
        } else {
            generatedText = language === 'en' ? generateEnglishBodyText() : generateDefaultBodyText();
        }
        fullContractData.custom_body_text = generatedText;
      }

      const docBlob = await generateProposalDocx(fullContractData, proposalCode);
      const fileName = `Proposta_${proposalData.clientName.replace(/[^a-z0-9]/gi, '_')}_${proposalCode}.docx`;

      // 4. Upload DOCX
      const filePath = `${insertedContract.id}/${Date.now()}_${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('ged-documentos')
        .upload(filePath, docBlob, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

      if (uploadError) throw uploadError;

      // 5. Register Document
      const { data: docData, error: docError } = await supabase
        .from('contract_documents')
        .insert({
          contract_id: insertedContract.id,
          file_name: fileName,
          file_path: filePath,
          file_type: 'proposal',
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single();

      if (docError) throw docError;

      // 6. Download for User
      saveAs(docBlob, fileName);

      toast.success("Proposta gerada com sucesso!", { id: toastId });

      // 7. Open Modal
      setContractFormData({
        ...insertedContract,
        display_id: String(insertedContract.seq_id).padStart(6, '0'),
        partner_name: primaryPartner.name,
        proposal_code: proposalCode,
        documents: [docData],
        // Reset honorariums to blank for manual entry as requested
        pro_labore: null,
        pro_labore_clause: null,
        pro_labore_extras: null,
        pro_labore_extras_clauses: null,
        final_success_fee: null,
        final_success_fee_clause: null,
        final_success_percent: null,
        final_success_percent_clause: null,
        final_success_extras: null,
        final_success_extras_clauses: null,
        percent_extras: null,
        percent_extras_clauses: null,
        intermediate_fees: null,
        intermediate_fees_clauses: null,
      });
      setProcesses([]);
      setTimelineData([]);
      setCaseSaved(false);
      caseSavedRef.current = false;
      setIsModalOpen(true);

    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao gerar proposta: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProposalOnly = async () => {
    if (!proposalData.clientName) return toast.error("Preencha o Nome do Cliente");
    if (proposalData.selectedPartners.length === 0) return toast.error("Selecione pelo menos um Sócio");

    setLoading(true);
    const toastId = toast.loading("Gerando arquivo da proposta...");

    try {
      const {
        contractData,
        primaryPartner,
        currencyExtras,
        percentExtras,
        intermediateValues,
        intermediateClauses,
        proLaboreExtras,
        proLaboreExtrasClauses
      } = getContractDataFromForm();

      const proposalCode = "RASCUNHO";

      const fullContractData: any = prepareFullContractData(
        contractData,
        primaryPartner,
        proposalCode,
        currencyExtras,
        percentExtras,
        intermediateValues,
        intermediateClauses,
        proLaboreExtras,
        proLaboreExtrasClauses
      );

      // FORCE update of body text if not explicitly customized, so latest form values are compiled
      // This needs to be done *before* generating the DOCX, and `generateDefaultBodyText` relies on `proposalData`
      // which might be cleared later.
      if (!isEditingBody && !customBodyText) {
        let generatedText = '';
        if (proposalMode === 'marcus_livio') {
            generatedText = generateMarcusLivioBodyText();
        } else {
            generatedText = language === 'en' ? generateEnglishBodyText() : generateDefaultBodyText();
        }
        fullContractData.custom_body_text = generatedText;
      }

      const docBlob = await generateProposalDocx(fullContractData, proposalCode);
      const fileName = `Proposta_${proposalData.clientName.replace(/[^a-z0-9]/gi, '_')}_${proposalCode}.docx`;

      saveAs(docBlob, fileName);
      toast.success("Arquivo gerado com sucesso!", { id: toastId });

    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao gerar arquivo: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Helpers for Mock Preview

  const renderPreviewContent = () => (
    <div className="w-full h-full pb-5">
      {(customBodyText || (proposalMode === 'marcus_livio' ? generateMarcusLivioBodyText() : (language === 'en' ? generateEnglishBodyText() : generateDefaultBodyText()))).split('\n').map((paragraph, idx) => {
        if (!paragraph.trim()) {
          return <div key={idx} className="h-4"></div>;
        }

        let alignClass = "text-justify";
        let pText = paragraph;

        if (pText.startsWith('<<RIGHT>>')) {
          alignClass = "text-right";
          pText = pText.replace('<<RIGHT>>', '');
        } else if (pText.startsWith('<<CENTER>>')) {
          alignClass = "text-center";
          pText = pText.replace('<<CENTER>>', '');
        } else if (pText.startsWith('<<LEFT>>')) {
          alignClass = "text-left";
          pText = pText.replace('<<LEFT>>', '');
        }

        if (pText.trim() === '<<IMAGE:PROP_LIVIO>>') {
          return (
            <div key={idx} className="flex justify-center my-4">
              <img 
                src="/prop-livio.png" 
                alt="Logos" 
                className="max-h-20 object-contain" 
                onError={(e) => { 
                    if (e.currentTarget.src.endsWith('.png')) {
                        e.currentTarget.src = '/prop-livio.jpg';
                    } else {
                        e.currentTarget.style.display = 'none'; 
                    }
                }} 
              />
            </div>
          );
        }

        // Component for highlighted and bold text
        const renderFormattedText = (text: string) => {
          const boldParts = text.split(/(\*\*.*?\*\*)/g);
          return boldParts.map((bPart, bIdx) => {
            if (bPart.startsWith('**') && bPart.endsWith('**')) {
              const innerText = bPart.slice(2, -2);
              const hiParts = innerText.split(/(\[.*?\])/g);
              return <span key={bIdx} className="font-bold">
                {hiParts.map((hi, i) => hi.startsWith('[') && hi.endsWith(']') ? <span key={`${bIdx}-${i}`} className="bg-yellow-200/50 px-1">{hi}</span> : hi)}
              </span>;
            }
            const hiParts = bPart.split(/(\[.*?\])/g);
            return <React.Fragment key={bIdx}>
              {hiParts.map((hi, i) => hi.startsWith('[') && hi.endsWith(']') ? <span key={`${bIdx}-${i}`} className="bg-yellow-200/50 px-1 font-bold">{hi}</span> : hi)}
            </React.Fragment>;
          });
        };

        return (
          <p key={idx} className={`${alignClass} mb-2`}>
            {renderFormattedText(pText)}
          </p>
        );
      })}
    </div>
  );

  // Render Clause Input Helper
  const renderClauseInputs = (
    title: string,
    type: 'pro_labore_clauses' | 'final_success_fee_clauses' | 'intermediate_fee_clauses',
    valuePlaceholder: string,
    descPlaceholder: string,
    showTypeToggle: boolean = false
  ) => (
    <div className="mb-4">
      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{title}</label>
      {proposalData[type].map((clause, index) => (
        <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2 items-start sm:items-center">

          {/* Value Input Group */}
          <div className="w-full sm:w-1/3 relative flex flex-col gap-1">
            <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50/50 focus-within:border-[#1e3a8a] transition-all overflow-hidden">
              {showTypeToggle && (
                <button
                  onClick={() => {
                    const newType = clause.type === 'currency' ? 'percent' : 'currency';
                    updateClause(type, index, 'type', newType);

                    if (clause.value) {
                      if (newType === 'percent') {
                        // Converter Moeda pra Porcentagem
                        const numbersOnly = clause.value.replace(/[^\d,]/g, '').split(',')[0] || '';
                        if (numbersOnly) updateClause(type, index, 'value', `${numbersOnly}%`);
                      } else {
                        // Converter Porcentagem para Moeda Formato Simples (limpa o % e devolve a mascara nativa ou deixa cru para o formata no blur)
                        const numbersOnly = clause.value.replace(/[^\d]/g, '');
                        if (numbersOnly) updateClause(type, index, 'value', language === 'en' ? `U$$ ${numbersOnly},00` : `R$ ${numbersOnly},00`);
                      }
                    }
                  }}
                  className={`px-3 py-3.5 text-xs font-bold border-r border-gray-200 hover:bg-gray-100 transition-colors ${clause.type === 'percent' ? 'text-blue-600' : 'text-green-600'}`}
                  title={clause.type === 'currency' ? 'Mudar para %' : (language === 'en' ? 'Mudar para U$$' : 'Mudar para R$')}
                >
                  {clause.type === 'currency' ? (language === 'en' ? 'U$$' : 'R$') : '%'}
                </button>
              )}
              <input
                type="text"
                value={clause.value}
                onChange={(e) => updateClause(type, index, 'value', e.target.value)}
                onFocus={() => jumpToFieldPage(type)}
                placeholder={showTypeToggle ? (clause.type === 'currency' ? valuePlaceholder : '0%') : valuePlaceholder}
                className={`w-full p-3.5 text-sm font-bold text-gray-700 outline-none bg-transparent ${!showTypeToggle ? 'pl-4' : ''}`}
              />
            </div>
          </div>

          <div className="w-full sm:w-2/3 flex gap-2">
            <input
              type="text"
              value={clause.description}
              onChange={(e) => updateClause(type, index, 'description', e.target.value)}
              onFocus={() => jumpToFieldPage(type)}
              placeholder={descPlaceholder}
              className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:border-[#1e3a8a] outline-none bg-gray-50/50 transition-all shadow-sm"
            />
            {index === 0 ? (
              <button
                onClick={() => addClause(type)}
                className="p-3.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shrink-0"
                title="Adicionar Cláusula"
              >
                <Plus className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => removeClause(type, index)}
                className="p-3.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shrink-0"
                title="Remover Cláusula"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // Cancel Confirmation State
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCloseModalAttempt = () => {
    if (!caseSavedRef.current) {
      setShowCancelConfirm(true);
    } else {
      setIsModalOpen(false);
    }
  };

  const handleOnSave = () => {
    setCaseSaved(true);
    caseSavedRef.current = true;
    setIsModalOpen(false);
    setShowCancelConfirm(false);
  };

  const handleConfirmCancel = async () => {
    if (!contractFormData.id) {
      setIsModalOpen(false);
      setShowCancelConfirm(false);
      return;
    }

    const toastId = toast.loading('Cancelando criação do caso...');
    try {
      const { error } = await supabase.from('contracts').delete().eq('id', contractFormData.id);
      if (error) throw error;

      toast.success('Criação do caso cancelada.', { id: toastId });
      setIsModalOpen(false);
      setShowCancelConfirm(false);
      setContractFormData({} as Contract);
    } catch (error: any) {
      toast.error(`Erro ao cancelar: ${error.message}`, { id: toastId });
    }
  };

  const handleAbortCancel = () => {
    setShowCancelConfirm(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6">

      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-2.5 sm:p-3 shadow-lg shrink-0">
            <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Propostas</h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">Gerador de Propostas e Minutas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Language + Marcus Lívio Toggle */}
          <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => {
                setProposalMode('default');
                setLanguage('pt');
                setProposalData(prev => ({
                  ...prev,
                  pro_labore_clauses: prev.pro_labore_clauses.map(c => c.type === 'currency' && c.value ? { ...c, value: maskMoney(c.value, 'pt') } : c),
                  intermediate_fee_clauses: prev.intermediate_fee_clauses.map(c => c.type === 'currency' && c.value ? { ...c, value: maskMoney(c.value, 'pt') } : c),
                  final_success_fee_clauses: prev.final_success_fee_clauses.map(c => c.type === 'currency' && c.value ? { ...c, value: maskMoney(c.value, 'pt') } : c)
                }));
                if (!isEditingBody) setCustomBodyText("");
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                language === 'pt' && proposalMode === 'default'
                  ? 'bg-white text-[#1e3a8a] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Português
            </button>
            <button
              type="button"
              onClick={() => {
                setProposalMode('default');
                setLanguage('en');
                setProposalData(prev => ({
                  ...prev,
                  pro_labore_clauses: prev.pro_labore_clauses.map(c => c.type === 'currency' && c.value ? { ...c, value: maskMoney(c.value, 'en') } : c),
                  intermediate_fee_clauses: prev.intermediate_fee_clauses.map(c => c.type === 'currency' && c.value ? { ...c, value: maskMoney(c.value, 'en') } : c),
                  final_success_fee_clauses: prev.final_success_fee_clauses.map(c => c.type === 'currency' && c.value ? { ...c, value: maskMoney(c.value, 'en') } : c)
                }));
                if (!isEditingBody) setCustomBodyText("");
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                language === 'en' && proposalMode === 'default'
                  ? 'bg-white text-[#1e3a8a] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Inglês
            </button>
            <button
              type="button"
              onClick={() => {
                setProposalMode('marcus_livio');
                setLanguage('pt');
                if (!isEditingBody) setCustomBodyText("");
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                proposalMode === 'marcus_livio'
                  ? 'bg-white text-[#1e3a8a] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Marcus Lívio
            </button>
          </div>

          {/* Editar */}
          <button
            onClick={() => {
              if (!isEditingBody && !customBodyText) {
                let generatedText = '';
                if (proposalMode === 'marcus_livio') {
                    generatedText = generateMarcusLivioBodyText();
                } else {
                    generatedText = language === 'en' ? generateEnglishBodyText() : generateDefaultBodyText();
                }
                setCustomBodyText(generatedText);
              }
              setIsEditingBody(true);
            }}
            className="flex items-center justify-center w-10 h-10 bg-[#1e3a8a] text-white rounded-full hover:bg-[#112240] transition-all shadow-lg shadow-blue-500/30 active:scale-95"
            title="Abrir Modo de Edição"
          >
            <FileSignature className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conteúdo da página */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 items-start">

        {/* ESQUERDA: Formulário */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1 bg-[#1e3a8a]"></div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[12px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-[#1e3a8a]" /> Dados da Proposta
            </h2>
            <button
              onClick={() => {
                setProposalData({
                  clientName: '',
                  cnpj: '',
                  selectedPartners: [],
                  reference: '',
                  object: '',
                  contractLocation: '',
                  isPerson: false,
                  pro_labore_clauses: [{ value: '', description: '', type: 'currency' }],
                  final_success_fee_clauses: [{ value: '', description: '', type: 'currency' }],
                  intermediate_fee_clauses: [{ value: '', description: '', type: 'currency' }],
                  endereco: '',
                  responsaveis: '',
                  honorariosText: '',
                });
                setSelectedTechs([]);
                setCustomBodyText('');
                setIsEditingBody(false);
                toast.success('Formulário limpo com sucesso!');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
              title="Limpar formulário"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar Dados
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <CustomSelect
                label="Cliente [Nome da Empresa]"
                value={proposalData.clientName}
                onChange={handleClientNameChange}
                options={clientOptions}
                placeholder="Selecione ou digite o nome"
                onFocus={() => jumpToFieldPage('clientName')}
                allowCustomValue={true}
              />
            </div>

            {language === 'pt' && (
              <div>
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    {proposalData.isPerson ? 'CPF [do Cliente]' : 'CNPJ [da Empresa Cliente]'}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        name="isPerson"
                        checked={proposalData.isPerson}
                        onChange={handleChange}
                        className="peer h-3 w-3 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm transition-all checked:bg-[#1e3a8a] checked:border-[#1e3a8a] hover:border-[#1e3a8a]"
                      />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-[#1e3a8a] transition-colors select-none">Pessoa Física?</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="cnpj"
                    value={proposalData.cnpj}
                    onChange={handleChange}
                    maxLength={proposalData.isPerson ? 14 : 18}
                    placeholder={proposalData.isPerson ? '000.000.000-00' : '00.000.000/0000-00'}
                    onFocus={() => jumpToFieldPage('cnpj')}
                    className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:border-[#1e3a8a] outline-none bg-gray-50/50 transition-all"
                  />
                  <button
                    onClick={handleCNPJSearch}
                    disabled={!proposalData.cnpj || proposalData.isPerson}
                    className="p-3.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                    title="Buscar CNPJ"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}



            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Local do Contrato</label>
              <CustomSelect
                label="" // Empty label as we have the header above
                value={proposalData.contractLocation}
                onChange={(val) => setProposalData(prev => ({ ...prev, contractLocation: val }))}
                options={locationOptions}
                allowCustomValue={true}
                onFocus={() => jumpToFieldPage('contractLocation')}
                placeholder="Selecione ou digite a cidade"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Sócios Responsáveis</label>

              <div className="space-y-2 mb-3">
                {proposalData.selectedPartners.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-blue-900">{p.name}</span>
                      {!p.collaboratorData && (
                        <span className="text-[10px] text-orange-500 font-medium">
                          Não há OAB desse local cadastrado para o Sócio escolhido
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handlePartnerRemove(idx)}
                      className="p-1 hover:bg-red-100 rounded-full text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <CustomSelect
                  value=""
                  onChange={(val) => handlePartnerAdd(val)}
                  options={partners.filter(p => !proposalData.selectedPartners.some(sp => sp.id === p.id)).map(p => ({ label: p.name, value: p.id }))}
                  onFocus={() => jumpToFieldPage('partners')}
                  placeholder="+ Adicionar um sócio..."
                  className="w-full"
                />
              </div>

              {/* Warnings for Validation */}
              {(() => {
                const warnings = proposalData.selectedPartners.flatMap(p => {
                  const msgs: string[] = [];
                  if (!proposalData.contractLocation) return msgs;

                  const allowedLocations = PARTNER_LOCATIONS[p.name];
                  if (allowedLocations && !allowedLocations.includes(proposalData.contractLocation)) {
                    msgs.push(`O sócio ${p.name} não compõe o contrato social de ${proposalData.contractLocation}. Ele pertence a: ${allowedLocations.join(', ')}.`);
                  }

                  if (p.collaboratorData?.oabs && p.collaboratorData.oabs.length > 0) {
                    const cityToUf: Record<string, string> = {
                      "Rio de Janeiro": "RJ", "São Paulo": "SP", "Brasília": "DF",
                      "Vitória": "ES", "Salvador": "BA", "Florianópolis": "SC",
                      "Belém": "PA", "Curitiba": "PR", "Belo Horizonte": "MG", "Porto Alegre": "RS"
                    };
                    const targetUf = cityToUf[proposalData.contractLocation] || proposalData.contractLocation;
                    const hasLocalOab = p.collaboratorData.oabs.some((o: any) => o.uf === targetUf && o.tipo !== 'Inativa');

                    if (!hasLocalOab) {
                      msgs.push(`O sócio ${p.name} não possui OAB ativa para ${proposalData.contractLocation} (${targetUf}). A OAB principal será utilizada na proposta.`);
                    }
                  } else if (p.collaboratorData) {
                    // Sem registros de OAB no perfil do integrante mas tem dados de colaborador
                    // Não é um erro gravíssimo, mas ele vai pegar a principal
                    // Silenciando se quiser apenas "não tem a OAB desse local"
                  }

                  return msgs;
                }).filter(Boolean);

                if (warnings.length > 0) {
                  return (
                    <div className="mt-3 space-y-2">
                      {warnings.map((msg, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">
                          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                          <p className="text-xs font-medium leading-relaxed">{msg}</p>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Referência da Proposta</label>
              <input
                type="text"
                name="reference"
                value={proposalData.reference}
                onChange={handleChange}
                placeholder="Ex: Contrato de Honorários..."
                onFocus={() => jumpToFieldPage('reference')}
                className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:border-[#1e3a8a] outline-none bg-gray-50/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Objeto da Proposta</label>
              <textarea
                name="object"
                value={proposalData.object}
                onChange={handleChange}
                rows={3}
                placeholder="Ex: Assessoria Jurídica na ação..."
                onFocus={() => jumpToPage(0)}
                className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:border-[#1e3a8a] outline-none resize-none bg-gray-50/50 transition-all"
              />
            </div>

            {/* Fields conditionally rendered for Marcus Livio Mode */}
            {proposalMode === 'marcus_livio' && (
              <>
                <div className="mb-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Responsáveis Técnicos Adicionais</label>
                  <div className="flex gap-4 p-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedTechs.includes('Guilherme Alves de Lima')} 
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTechs(prev => [...prev, 'Guilherme Alves de Lima']);
                          else setSelectedTechs(prev => prev.filter(t => t !== 'Guilherme Alves de Lima'));
                        }} 
                        className="w-4 h-4 text-[#1e3a8a] rounded border-gray-300 focus:ring-[#1e3a8a]"
                      />
                      Guilherme Alves de Lima
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedTechs.includes('Rafael Goulart')} 
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTechs(prev => [...prev, 'Rafael Goulart']);
                          else setSelectedTechs(prev => prev.filter(t => t !== 'Rafael Goulart'));
                        }} 
                        className="w-4 h-4 text-[#1e3a8a] rounded border-gray-300 focus:ring-[#1e3a8a]"
                      />
                      Rafael Goulart
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Endereço do Cliente</label>
                  <input
                    type="text"
                    name="endereco"
                    value={proposalData.endereco}
                    onChange={handleChange}
                    placeholder="Ex: Av. Rio Branco, 1..."
                    onFocus={() => jumpToFieldPage('endereco')}
                    className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:border-[#1e3a8a] outline-none bg-gray-50/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">A/C Responsáveis</label>
                  <input
                    type="text"
                    name="responsaveis"
                    value={proposalData.responsaveis}
                    onChange={handleChange}
                    placeholder="Ex: João Silva e Maria Costa..."
                    onFocus={() => jumpToFieldPage('responsaveis')}
                    className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:border-[#1e3a8a] outline-none bg-gray-50/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Honorários (Texto Livre)</label>
                  <textarea
                    name="honorariosText"
                    value={proposalData.honorariosText}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Ex: Honorários fixos de R$ 10.000,00 mensais..."
                    onFocus={() => jumpToFieldPage('honorariosText')}
                    className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:border-[#1e3a8a] outline-none resize-none bg-gray-50/50 transition-all"
                  />
                </div>
              </>
            )}

            {/* Default Proposal Clauses */}
            {proposalMode !== 'marcus_livio' && (
              <>
                {renderClauseInputs("Pró-Labore & Condições", "pro_labore_clauses", "R$ 0,00", "Descrição do pró-labore...", true)}
                {renderClauseInputs("Êxito Intermediário", "intermediate_fee_clauses", "R$ 0,00", "Descrição do êxito...", true)}
                {renderClauseInputs("Êxito Final (R$ ou %)", "final_success_fee_clauses", "Valor", "Descrição do êxito...", true)}
              </>
            )}

          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3 sm:gap-0">
            <button
              onClick={handleGenerateProposalOnly}
              disabled={loading}
              className="w-full sm:w-auto sm:mr-3 bg-white border-2 border-[#1e3a8a] text-[#1e3a8a] text-[10px] uppercase font-black tracking-widest px-6 py-4 rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4 mr-2" />
              Gerar Apenas Arquivo
            </button>
            <button
              onClick={handleGenerateProposal}
              disabled={loading}
              className="w-full sm:w-auto bg-[#1e3a8a] hover:bg-[#112240] text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Gerar Proposta & Criar Caso
            </button>
          </div>
        </div>

        {/* DIREITA: Preview Visual */}
        <div className="flex flex-col gap-4">

          <div className="bg-white p-4 sm:p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center relative min-h-[500px] sm:min-h-[900px] w-full">
          <p className="absolute top-4 right-6 text-[9px] font-black text-gray-300 uppercase tracking-widest hidden sm:flex items-center gap-1 z-20">
            <Eye className="w-3 h-3" /> Visualização em Tempo Real
          </p>

          <div className="flex flex-col items-center w-full mt-4 flex-1">
            <div className="flex items-center justify-between w-full gap-4 flex-1">

              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="p-3 bg-gray-50 text-[#1e3a8a] rounded-full shadow-md hover:bg-gray-200 disabled:opacity-30 transition-all border border-gray-100 shrink-0"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Page Slider Container */}
              <div className="w-full max-w-[850px] overflow-hidden flex justify-center flex-1">
                <div
                  className="flex transition-transform duration-500 ease-in-out w-full"
                  style={{ transform: `translateX(-${currentPage * 100}%)` }}
                >
                  {Array.from({ length: totalPages }).map((_, pageIdx) => (
                    <div
                      key={pageIdx}
                      className="w-full shrink-0 flex justify-center"
                    >
                      {/* A4 Page Simulation */}
                      <div
                        className="w-full max-w-[850px] aspect-[21/29.7] bg-white shadow-2xl border border-gray-100 overflow-hidden relative"
                      >
                        {/* Header */}
                        <div className="absolute top-0 left-0 w-full pt-8 flex justify-center">
                          <img src="/logo-salomao.png" className="h-10 object-contain" alt="Logo" />
                        </div>

                        {/* Footer */}
                        <div className="absolute bottom-0 left-0 w-full pb-8 px-12 flex justify-between items-end">
                          <img src="/rodape1.png" className="h-6 object-contain" alt="Rodapé 1" />
                          <img src="/rodape2.png" className="h-6 object-contain" alt="Rodapé 2" />
                        </div>

                        {/* Safe Area Container - Header/Footer Protection */}
                        <div className="absolute inset-0 flex flex-col pt-[13%] pb-[11%]">
                          {/* Content Clipper */}
                          <div
                            className="overflow-hidden px-[12.1%] pt-4"
                            style={{ height: safeAreaHeight ? `${safeAreaHeight + 16}px` : 'auto' }}
                          >
                            <div
                              style={{
                                transform: `translateY(-${pageIdx * safeAreaHeight}px)`,
                                height: 'fit-content'
                              }}
                            >
                              {/* The Content itself */}
                              <div className="text-left text-[#0a192f] text-[10px] leading-5 select-none h-fit">
                                {renderPreviewContent()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
                className="p-3 bg-gray-50 text-[#1e3a8a] rounded-full shadow-md hover:bg-gray-200 disabled:opacity-30 transition-all border border-gray-100 shrink-0"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="mt-8 mb-4 text-[11px] font-black text-gray-500 uppercase tracking-widest bg-gray-50 px-5 py-2.5 rounded-xl border border-gray-100 shadow-sm text-center w-full max-w-[200px]">
              Página {currentPage + 1} de {totalPages}
            </div>
          </div>

          <div
            className="absolute opacity-0 pointer-events-none bg-white overflow-hidden"
            style={{
              width: previewContainerRef.current?.offsetWidth ? `${previewContainerRef.current.offsetWidth}px` : '850px',
              padding: 'calc(13% + 1rem) 12.1% 11% 12.1%'
            }}
          >
            <div ref={previewContentRef}>
              <div className="text-left text-[#0a192f] text-[10px] leading-5">
                {renderPreviewContent()}
              </div>
            </div>
          </div>
          <div ref={previewContainerRef} className="w-full max-w-[850px] aspect-[21/29.7] absolute opacity-0 pointer-events-none"></div>
        </div>
      </div>
    </div>

      {/* Hidden Modal to open after generation */}
      {
        isModalOpen && (
          <ContractFormModal
            isOpen={isModalOpen}
            onClose={handleCloseModalAttempt}
            formData={contractFormData}
            setFormData={setContractFormData}
            onSave={handleOnSave}
            loading={false}
            isEditing={true} // So it allows editing immediately
            partners={partners}
            onOpenPartnerManager={() => { }}
            analysts={analysts}
            onOpenAnalystManager={() => { }}
            onCNPJSearch={() => { }}
            processes={processes}
            currentProcess={currentProcess}
            setCurrentProcess={setCurrentProcess}
            editingProcessIndex={editingProcessIndex}
            handleProcessAction={() => { }}
            editProcess={() => { }}
            removeProcess={() => { }}
            newIntermediateFee={newIntermediateFee}
            setNewIntermediateFee={setNewIntermediateFee}
            addIntermediateFee={addIntermediateFee}
            removeIntermediateFee={removeIntermediateFee}
            timelineData={timelineData}
            getStatusColor={() => ''}
            getStatusLabel={() => ''}
          />
        )
      }

      {/* Confirmation Modal */}
      {
        showCancelConfirm && (
          <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200 border border-gray-100">
              <div className="flex flex-col items-center text-center">
                <div className="bg-red-50 p-3 rounded-full mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-black text-gray-800 mb-2">Cancelar criação do caso?</h3>
                <p className="text-sm text-gray-500 mb-6 font-medium leading-relaxed">
                  Se você sair agora, o caso recém criado será excluído e todos os dados gerados (incluindo a proposta) serão perdidos permanentemente.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={handleAbortCancel}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors"
                  >
                    Não, continuar editando
                  </button>
                  <button
                    onClick={handleConfirmCancel}
                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-xs uppercase tracking-wider hover:bg-red-600 shadow-lg shadow-red-200 transition-all hover:scale-[1.02]"
                  >
                    Sim, cancelar e excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
      {/* Editor Modal */}
      {
        isEditingBody && (
          <div className="fixed inset-0 bg-[#0a192f]/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-black text-[#0a192f] flex items-center gap-2">
                    <FileSignature className="w-6 h-6 text-[#1e3a8a]" />
                    Editor Avançado da Proposta
                  </h3>
                  <p className="text-xs font-semibold text-gray-500 mt-1">Edite livremente todo o documento. Utilize tags especiais como <strong>&lt;&lt;CENTER&gt;&gt;</strong>, <strong>&lt;&lt;RIGHT&gt;&gt;</strong> ou <strong>&lt;&lt;LEFT&gt;&gt;</strong> no início das linhas para alinhamento, e asteriscos duplos (<strong>**texto**</strong>) para negrito.</p>
                </div>
                <button
                  onClick={() => setIsEditingBody(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 p-6 bg-gray-100 overflow-hidden flex flex-col">
                <textarea
                  value={customBodyText}
                  onChange={(e) => setCustomBodyText(e.target.value)}
                  className="w-full flex-1 p-8 text-sm text-gray-800 bg-white border border-gray-200 shadow-inner rounded-xl outline-none focus:border-[#1e3a8a] focus:ring-4 focus:ring-blue-500/10 transition-all resize-none font-mono leading-relaxed"
                  placeholder="Edite o corpo da proposta aqui..."
                />
              </div>

              <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3">
                <button
                  onClick={() => setIsEditingBody(false)}
                  className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setIsEditingBody(false)}
                  className="px-8 py-3 rounded-xl bg-[#1e3a8a] text-white font-black text-xs uppercase tracking-wider hover:bg-[#112240] shadow-lg flex items-center gap-2 transition-all active:scale-95"
                >
                  <CheckCircle className="w-4 h-4" />
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
}
