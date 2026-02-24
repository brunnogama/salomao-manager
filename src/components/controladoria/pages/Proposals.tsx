import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { FileText, CheckCircle, Search, Plus, Trash2, X, Eye, FileSignature, Loader2, AlertTriangle, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import { Contract, Partner, ContractProcess, TimelineEvent, Analyst, Collaborator } from '../../../types/controladoria';
import { ContractFormModal } from '../contracts/ContractFormModal';
import { generateProposalDocx } from '../../../utils/docxGenerator';
import { maskMoney, maskCNPJ } from '../utils/masks';
import { moedaPorExtenso, percentualPorExtenso } from '../../../utils/extenso';
import { CustomSelect } from '../ui/CustomSelect';
import { safeParseFloat } from '../utils/contractHelpers';

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
  });

  const [isEditingBody, setIsEditingBody] = useState(false);
  const [customBodyText, setCustomBodyText] = useState("");

  // Modal State (for after generation)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contractFormData, setContractFormData] = useState<Contract>({} as Contract);
  const [processes, setProcesses] = useState<ContractProcess[]>([]);
  const [currentProcess, setCurrentProcess] = useState<ContractProcess>({ process_number: '' });
  const [editingProcessIndex] = useState<number | null>(null);
  const [newIntermediateFee, setNewIntermediateFee] = useState('');
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>([]);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);

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
        const headerHeight = containerWidth * 0.18;
        const footerHeight = containerWidth * 0.16;
        const calculatedSafeHeight = containerHeight - headerHeight - footerHeight;

        const contentHeight = previewContentRef.current.scrollHeight;
        if (calculatedSafeHeight > 0) {
          setSafeAreaHeight(calculatedSafeHeight);
          const pages = Math.ceil(contentHeight / calculatedSafeHeight);
          setTotalPages(pages > 0 ? pages : 1);
        }
      }
    };

    const timeoutId = setTimeout(calculatePages, 300);
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
    const { data } = await supabase.from('clients').select('name, cnpj').order('name');
    if (data) {
      setClientOptions(data.map(c => ({ label: c.name, value: c.name }))); // Value is name for the proposal
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase.from('office_locations').select('name').order('name');
      if (error) {
        console.error("Erro ao buscar office_locations:", error);
      }

      let uniqueCities: string[] = [];
      if (data && data.length > 0) {
        uniqueCities = Array.from(new Set(data.map((loc: any) => loc.name))).filter(Boolean);
      } else {
        // Fallback to partner locations if table is empty or misses name
        uniqueCities = Array.from(new Set(Object.values(PARTNER_LOCATIONS).flat())).sort();
      }

      setLocationOptions(uniqueCities.map((city: string) => ({ label: city, value: city })));
    } catch (e) {
      console.error(e);
      const uniqueCities = Array.from(new Set(Object.values(PARTNER_LOCATIONS).flat())).sort();
      setLocationOptions(uniqueCities.map((city: string) => ({ label: city, value: city })));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'cnpj') {
      setProposalData(prev => ({ ...prev, [name]: maskCNPJ(value) }));
    } else if (name === 'isPerson') {
      // Checkbox handling
      const checked = (e.target as HTMLInputElement).checked;
      setProposalData(prev => ({
        ...prev,
        isPerson: checked,
        cnpj: checked ? '' : prev.cnpj // Clear CNPJ if person, or keep? User said disable. Let's clear to avoid confusion.
      }));
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
    const { data: collabData } = await supabase
      .from('collaborators')
      .select('*')
      .ilike('name', partner.name)
      .eq('status', 'active') // Only active ones?
      .maybeSingle();

    if (collabData) {
      collaboratorData = collabData as Collaborator;
    } else {
      // Fallback: If partner table has info (it usually doesn't have details like OAB/Civil Status fully populated in types but let's check runtime)
      // For now, if not found, we just use partner data.
      toast.warning(`Dados detalhados não encontrados em Colaboradores para ${partner.name}.`);
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
          newClauses[index][field] = maskMoney(value);
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

  const handleClientNameChange = async (name: string) => {
    setProposalData(prev => ({ ...prev, clientName: name }));
    // Try to find CNPJ if existing client selected
    if (name) {
      const { data } = await supabase.from('clients').select('cnpj').eq('name', name).maybeSingle();
      if (data && data.cnpj) {
        setProposalData(prev => ({ ...prev, cnpj: maskCNPJ(data.cnpj) }));
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
      status: 'proposal',
      proposal_date: new Date().toISOString(),
      reference: proposalData.reference,
      observations: proposalData.object,

      pro_labore: safeParseFloat(proLaboreMain.value),
      pro_labore_clause: proLaboreMain.description,
      pro_labore_extras: proLaboreExtras.length ? proLaboreExtras.map(v => safeParseFloat(v)) : null,
      pro_labore_extras_clauses: proLaboreExtrasClauses.length ? proLaboreExtrasClauses : null,

      final_success_fee: firstCurrencySuccess ? safeParseFloat(firstCurrencySuccess.value) : null,
      final_success_fee_clause: firstCurrencySuccess?.description || null,

      final_success_percent: firstPercentSuccess?.value || null,
      final_success_percent_clause: firstPercentSuccess?.description || null,

      final_success_extras: currencyExtras.length ? currencyExtras.map(c => safeParseFloat(c.value)) : null,
      final_success_extras_clauses: currencyExtras.length ? currencyExtras.map(c => c.description) : null,

      percent_extras: percentExtras.length ? percentExtras.map(c => safeParseFloat(c.value)) : null,
      percent_extras_clauses: percentExtras.length ? percentExtras.map(c => c.description) : null,

      intermediate_fees: intermediateValues.length ? intermediateValues.map(v => safeParseFloat(v)) : null,
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

      partners_data: proposalData.selectedPartners.map(p => ({
        name: p.name,
        civil_status: p.collaboratorData?.civil_status || 'casado(a)',
        nacionalidade: p.collaboratorData?.nacionalidade || 'brasileiro(a)',
        oab_numero: p.collaboratorData?.oab_numero || p.oab_number || 'XXXXXX',
        oab_uf: p.collaboratorData?.oab_uf || p.oab_state || 'RJ',
        cpf: p.collaboratorData?.cpf || p.cpf || 'XXX.XXX.XXX-XX',
        gender: p.collaboratorData?.gender || p.gender || 'M',
      })),

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
      custom_body_text: customBodyText || generateDefaultBodyText(),
    };
  };

  const generateDefaultBodyText = () => {
    let text = `1. OBJETO E ESCOPO DO SERVIÇO:\n\n`;
    text += `1.1. O objeto da presente proposta é a assessoria jurídica a ser realizada pelos advogados que compõem Salomão Advogados (“Escritório”), com vistas à representação judicial em favor do Cliente ${proposalData.clientName || '[NOME DA EMPRESA CLIENTE]'} (“Cliente” ou “Contratante”) no ${proposalData.object || '[incluir objeto da disputa]'}.\n\n`;
    text += `1.2. Os serviços previstos nesta proposta abrangem a defesa dos interesses do Contratante em toda e qualquer discussão relacionada ao tema tratado.\n\n`;
    text += `1.3. Além da análise do caso e definição da estratégia jurídica, o escopo dos serviços profissionais compreende a análise completa dos documentos e informações enviadas pelo Cliente, elaboração das peças processuais, acompanhamento processual, realização de sustentações orais, despachos, bem como todos os atos conexos necessários a atender os interesses do Cliente nos referidos processos.\n\n`;
    text += `1.4. Os serviços aqui propostos compreende a participação em reuniões com o Cliente sempre que necessário para entendimentos, esclarecimentos e discussão de estratégias, sempre objetivando a melhor atuação possível do Escritório em defesa dos interesses do Cliente.\n\n`;
    text += `1.5. Também está incluída a assessoria jurídica na interlocução com a contraparte, para fins de autocomposição.\n\n`;
    text += `1.6. Os serviços aqui propostos não incluem consultoria geral ou outra que não possua correlação com o objeto da proposta.\n\n`;
    text += `2. HONORÁRIOS E FORMA DE PAGAMENTO:\n\n`;
    text += `2.1. Considerando as particularidades do caso, propomos honorários da seguinte forma:\n\n`;

    let clauseIndex = 2;
    proposalData.pro_labore_clauses.forEach((c) => {
      text += `2.${clauseIndex}. Honorários pró-labore de ${c.value || '[valor]'}, ${c.description || 'para engajamento no caso'}\n\n`;
      clauseIndex++;
    });

    proposalData.intermediate_fee_clauses.forEach((c) => {
      if (c.value) {
        text += `2.${clauseIndex}. Êxito intermediário: ${c.value || '[valor]'}, ${c.description || '[descrição]'}\n\n`;
        clauseIndex++;
      }
    });

    proposalData.final_success_fee_clauses.forEach((c) => {
      if (c.value) {
        const valText = c.type === 'currency' ? c.value : `${c.value}%`;
        text += `2.${clauseIndex}. Honorários finais de êxito de ${valText}, ${c.description || '[descrição]'}\n\n`;
        clauseIndex++;
      }
    });

    text += `2.${clauseIndex}. Os honorários de êxito serão integralmente devidos pelo Cliente em caso de transação ou rescisão imotivada do presente contrato.\n\n`;
    text += `2.${clauseIndex + 1}. Nos casos de (a) desistência e/ou renúncia que encerrem as discussões travadas; (b) perda superveniente de seu objeto; (c) destituição dos profissionais do ESCRITÓRIO sem culpa dos mesmos; e/ou (d) cessões e/ou operações envolvendo direitos do Contratante e/ou os interesses do ESCRITÓRIO, as Partes decidem, de boa-fé e na melhor forma de Direito, que todos os valores contemplados nesse Contrato, sem exceção, serão integralmente e automaticamente devidos, mesmo se e independentemente se os eventos de êxito ocorrerem após o desligamento do ESCRITÓRIO e independentemente do teor de quaisquer Decisões Judiciais que sejam proferidas, em reconhecimento, pelo Cliente, de que a estratégia desenhada e executada pelo ESCRITÓRIO afigurou-se determinante à obtenção do sucesso em seu favor. Esses valores serão pagos em até 10 (dez) dias após a ocorrência de quaisquer desses eventos.\n\n`;

    text += `3. CONDIÇÕES GERAIS:\n\n`;
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

    return text;
  };

  const handleGenerateProposal = async () => {
    if (!proposalData.clientName) return toast.error("Preencha o Nome do Cliente");
    if (proposalData.selectedPartners.length === 0) return toast.error("Selecione pelo menos um Sócio");

    setLoading(true);
    const toastId = toast.loading("Gerando proposta e documentos...");

    try {
      // 1. Create Contract Record

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
      // 3. Generate DOCX
      // Prepare full data object for generator
      const fullContractData: any = prepareFullContractData(
        insertedContract,
        primaryPartner,
        proposalCode,
        currencyExtras,
        percentExtras,
        intermediateValues,
        intermediateClauses,
        proLaboreExtras,
        proLaboreExtrasClauses
      );

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
  const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  const renderPreviewContent = () => (
    <div className="pt-4">
      {/* Date */}
      <div className="text-right mb-6">
        <span className="bg-yellow-200/50 px-1">{proposalData.contractLocation || '[Cidade]'}, {today}</span>.
      </div>

      {/* Addressee */}
      <div className="mb-6 font-bold">
        <p>AO <span className="bg-yellow-200/50 px-1 uppercase">{proposalData.clientName || '[NOME DA EMPRESA CLIENTE]'}</span></p>
        {!proposalData.isPerson && (
          <p className="mt-1"><span className="bg-yellow-200/50 px-1">{proposalData.cnpj || '[CNPJ da empresa cliente]'}</span></p>
        )}
      </div>

      {/* Ref */}
      <div className="mb-4">
        <p><strong>Ref:</strong> <span className="bg-yellow-200/50 px-1">{proposalData.reference || '[incluir referência da proposta]'}</span></p>
        <p><strong>Cód.:</strong> <span className="bg-yellow-200/50 px-1">[código proposta]</span></p>
      </div>

      <p className="mb-4">Prezados,</p>

      <p className="text-justify mb-4">
        É com grande honra que <strong>SALOMÃO ADVOGADOS</strong>, neste ato representado, respectivamente, por seus sócios
        {proposalData.selectedPartners.length > 0 ? (
          proposalData.selectedPartners.map((p, idx) => (
            <span key={p.id}>
              {idx > 0 && ", e "}
              <span className="bg-yellow-200/50 px-1 font-bold ml-1">{p.name}</span>
              {(() => {
                const data = p.collaboratorData;
                const gender = data?.gender || p.gender || 'M';
                const isFem = ['F', 'Feminino', 'Female'].includes(gender);

                const oab = data?.oab_numero || p.oab_number || 'XXXXXX';
                const oabUf = data?.oab_uf || p.oab_state || 'RJ';
                const cpf = data?.cpf || p.cpf || 'XXX.XXX.XXX-XX';

                const civil = data?.civil_status ? data.civil_status.toLowerCase() : 'casado';
                const nacionalidade = data?.nacionalidade ? data.nacionalidade.toLowerCase() : 'brasileiro';

                // Inflections
                const textNacionalidade = isFem && nacionalidade.includes('brasileir') ? 'brasileira' : nacionalidade;
                const textCivil = isFem && civil.includes('casad') ? 'casada' : (isFem && civil.includes('solteir') ? 'solteira' : civil);
                const textAdvogado = isFem ? 'advogada' : 'advogado';
                const textInscrito = isFem ? 'inscrita' : 'inscrito';
                const textPortador = isFem ? 'portadora' : 'portador';

                return `, ${textNacionalidade}, ${textCivil}, ${textAdvogado}, ${textInscrito} na OAB/${oabUf} sob o nº ${oab}, ${textPortador} do CPF/MF nº ${cpf}`;
              })()}
            </span>
          ))
        ) : (
          <span className="bg-yellow-200/50 px-1 font-bold ml-1">[incluir nome do sócio]</span>
        )}
        , vem formular a presente proposta de honorários...
      </p>

      <div className="mb-4 space-y-4 text-justify whitespace-pre-line leading-relaxed pb-8">
        {(customBodyText || generateDefaultBodyText()).split('\n\n').map((paragraph, idx) => {
          const isHeading = /^\d+\.\s*[A-ZÀ-Ú\s]+:$/.test(paragraph);

          return (
            <p key={idx} className={isHeading ? 'font-bold mt-4' : ''}>
              {paragraph}
            </p>
          )
        })}
      </div>

      {/* Signatures */}
      <div className="text-center mt-12 space-y-8 pb-16">
        <div>
          <p className="mb-2">Cordialmente,</p>
          {proposalData.selectedPartners.length > 0 ? proposalData.selectedPartners.map(p => (
            <p key={p.id} className="bg-yellow-200/50 px-1 font-bold block">{p.name}</p>
          )) : (
            <p className="bg-yellow-200/50 px-1 font-bold inline-block">[Incluir nome do sócio]</p>
          )}
          <p className="font-bold">SALOMÃO ADVOGADOS</p>
        </div>

        <div>
          <p className="bg-yellow-200/50 px-1 font-bold inline-block uppercase">{proposalData.clientName || '[CLIENTE]'}</p>
        </div>

        <div className="text-left mt-8">
          <p>De acordo em: ___/___/___</p>
        </div>
      </div>
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
                        if (numbersOnly) updateClause(type, index, 'value', `R$ ${numbersOnly},00`);
                      }
                    }
                  }}
                  className={`px-3 py-3.5 text-xs font-bold border-r border-gray-200 hover:bg-gray-100 transition-colors ${clause.type === 'percent' ? 'text-blue-600' : 'text-green-600'}`}
                  title={clause.type === 'currency' ? 'Mudar para %' : 'Mudar para R$'}
                >
                  {clause.type === 'currency' ? 'R$' : '%'}
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
    setShowCancelConfirm(true);
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
        <button
          onClick={() => {
            if (!isEditingBody && !customBodyText) {
              setCustomBodyText(generateDefaultBodyText());
            }
            setIsEditingBody(true);
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all bg-[#1e3a8a] text-white hover:bg-[#112240] shadow-lg active:scale-95"
        >
          <FileSignature className="w-4 h-4" /> Abrir Modo de Edição
        </button>
      </div>

      {/* Conteúdo da página */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 items-start">

        {/* ESQUERDA: Formulário */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1 bg-[#1e3a8a]"></div>

          <h2 className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-[#1e3a8a]" /> Dados da Proposta
          </h2>

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

            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">CNPJ [da Empresa Cliente]</label>
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
                  placeholder="00.000.000/0000-00"
                  disabled={proposalData.isPerson}
                  onFocus={() => jumpToFieldPage('cnpj')}
                  className={`w-full border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:border-[#1e3a8a] outline-none bg-gray-50/50 transition-all ${proposalData.isPerson ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
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

            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Sócios Responsáveis</label>

              <div className="space-y-2 mb-3">
                {proposalData.selectedPartners.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-blue-900">{p.name}</span>
                      <span className="text-[10px] text-gray-500">
                        {p.collaboratorData ? 'Dados em Colaboradores: OK' : 'Sem dados em Colaboradores (usando básico)'}
                      </span>
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
                const warnings = proposalData.selectedPartners.map(p => {
                  if (!proposalData.contractLocation) return null;
                  const allowedLocations = PARTNER_LOCATIONS[p.name];
                  if (allowedLocations && !allowedLocations.includes(proposalData.contractLocation)) {
                    return `O sócio ${p.name} não compõe o contrato social de ${proposalData.contractLocation}. Ele pertence a: ${allowedLocations.join(', ')}.`;
                  }
                  return null;
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

            {/* Fields Refactored */}
            {/* Fields Refactored */}
            {renderClauseInputs("Pró-Labore & Condições", "pro_labore_clauses", "R$ 0,00", "Descrição do pró-labore...", true)}
            {renderClauseInputs("Êxito Intermediário", "intermediate_fee_clauses", "R$ 0,00", "Descrição do êxito...", true)}

            {/* Unified Success Fees */}
            {renderClauseInputs("Êxito Final (R$ ou %)", "final_success_fee_clauses", "Valor", "Descrição do êxito...", true)}

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
              <div className="w-full max-w-[700px] overflow-hidden flex justify-center flex-1">
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
                        className="w-full max-w-[700px] aspect-[21/29.7] bg-white shadow-2xl border border-gray-100 overflow-hidden relative"
                        style={{
                          backgroundImage: "url('/papel-timbrado.png')",
                          backgroundSize: '100% 100%',
                          backgroundRepeat: 'no-repeat'
                        }}
                      >
                        {/* Safe Area Container - Header/Footer Protection */}
                        <div className="absolute inset-0 flex flex-col pt-[18%] pb-[16%]">
                          {/* Content Clipper */}
                          <div className="flex-1 overflow-hidden px-12 md:px-16">
                            <div
                              style={{
                                transform: `translateY(-${pageIdx * safeAreaHeight}px)`,
                                height: 'fit-content'
                              }}
                            >
                              {/* The Content itself */}
                              <div className="text-left text-[#0a192f] text-[10px] leading-relaxed select-none h-fit pt-4">
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

          {/* Hidden measuring content */}
          <div
            className="absolute opacity-0 pointer-events-none bg-white shadow-2xl border border-gray-100 overflow-hidden"
            style={{ width: '700px', padding: '18% 4rem 16% 4rem' }}
          >
            <div ref={previewContentRef}>
              <div className="text-left text-[#0a192f] text-[10px] leading-relaxed">
                {renderPreviewContent()}
              </div>
            </div>
            <div ref={previewContainerRef} className="aspect-[21/29.7] w-full absolute inset-0 -z-10"></div>
          </div>
        </div>
      </div>

      {/* Hidden Modal to open after generation */}
      {isModalOpen && (
        <ContractFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModalAttempt}
          formData={contractFormData}
          setFormData={setContractFormData}
          onSave={() => { }}
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
          addIntermediateFee={() => { }}
          removeIntermediateFee={() => { }}
          timelineData={timelineData}
          getStatusColor={() => ''}
          getStatusLabel={() => ''}
        />
      )}

      {/* Confirmation Modal */}
      {showCancelConfirm && (
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
      )}
      {/* Editor Modal */}
      {isEditingBody && (
        <div className="fixed inset-0 bg-[#0a192f]/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h3 className="text-xl font-black text-[#0a192f] flex items-center gap-2">
                  <FileSignature className="w-6 h-6 text-[#1e3a8a]" />
                  Editor Avançado da Proposta
                </h3>
                <p className="text-xs font-semibold text-gray-500 mt-1">Edite livremente o conteúdo da proposta. Deixe linhas em branco para separar os parágrafos.</p>
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
      )}

    </div>
  );
}
