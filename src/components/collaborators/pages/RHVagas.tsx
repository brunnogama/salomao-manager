import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../../lib/supabase'
import { Vaga } from '../../../types/controladoria'
import {
  Briefcase,
  Plus,
  Users,
  Clock,
  CheckCircle2,
  Edit2,
  AlertCircle,
  X,
  User,
  Building2,
  Trash2,
  Sparkles,
  UserX,
  Share2,
  ThumbsUp,
  ThumbsDown,
  GraduationCap,
  CalendarDays,
  Scale,
  Monitor,
  Calculator,
  Landmark,
  Coffee,
  Folder,
  Globe,
  UsersRound,
  ChartPie,
  Package,
  Baby,
  Mail,
  Car,
  Send,
  Headset,
  NotebookTabs,
  HelpCircle
} from 'lucide-react'
// date-fns importado acima do componente junto com as funções utilitárias
import { FilterSelect } from '../../controladoria/ui/FilterSelect'
import { FilterBar, FilterCategory } from '../components/FilterBar'
import { VagaFormModal } from '../components/VagaFormModal'
import { CandidatoFormModal } from '../components/CandidatoFormModal'
import { VagasSelectionModal, VagasCreationType } from '../components/VagasSelectionModal'
import { formatDateToDisplay, toTitleCase } from '../utils/colaboradoresUtils'
import { AlertModal } from '../../../components/ui/AlertModal'
import { isValid, addDays, getDay, isSameDay } from 'date-fns'

// ==== FUNÇÕES UTILITÁRIAS PURAS (fora do componente para evitar recriação a cada render) ====

const extractTags = (perfilStr?: string): string[] => {
  if (!perfilStr) return [];
  return perfilStr
    .split('\n')
    .map(t => t.trim())
    .filter(t => t.length > 0);
};

const calculateMatchScore = (sourceTags: string[], targetTags: string[]) => {
  if (sourceTags.length === 0 || targetTags.length === 0) return { score: 0, matches: 0, matchedTags: [] as string[] };

  const sourceLower = sourceTags.map(t => t.toLowerCase());
  const targetLower = targetTags.map(t => t.toLowerCase());

  const matched = targetLower.filter(t => sourceLower.includes(t));
  const score = Math.round((matched.length / sourceTags.length) * 100);

  return {
    score: score > 100 ? 100 : score,
    matches: matched.length,
    matchedTags: matched
  };
};

const getFeriados = (year: number): Date[] => {
  const fixed = [
    new Date(year, 0, 1),
    new Date(year, 0, 20),
    new Date(year, 3, 21),
    new Date(year, 3, 23),
    new Date(year, 4, 1),
    new Date(year, 8, 7),
    new Date(year, 9, 12),
    new Date(year, 10, 2),
    new Date(year, 10, 15),
    new Date(year, 10, 20),
    new Date(year, 11, 25),
  ];

  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(year, month, day);

  const carnavalTuesday = addDays(easter, -47);
  const carnavalMonday = addDays(easter, -48);
  const sextaSanta = addDays(easter, -2);
  const corpusChristi = addDays(easter, 60);

  return [...fixed, carnavalMonday, carnavalTuesday, sextaSanta, corpusChristi];
};

const isFeriado = (date: Date, feriadosCache: Record<number, Date[]>): boolean => {
  const year = date.getFullYear();
  if (!feriadosCache[year]) {
    feriadosCache[year] = getFeriados(year);
  }
  return feriadosCache[year].some(feriado => isSameDay(date, feriado));
};

const countBusinessDays = (start: Date, end: Date): number => {
  let count = 0;
  let current = new Date(start);
  const feriadosCache: Record<number, Date[]> = {};

  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  if (current > endDate) return 0;

  while (current < endDate) {
    const dayOfWeek = getDay(current);

    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isFeriado(current, feriadosCache)) {
      count++;
    }
    current = addDays(current, 1);
  }

  return count;
};

const calculateTempoAberto = (data_abertura?: string, data_fechamento?: string) => {
  if (!data_abertura) return '-'

  try {
    const [year, month, day] = data_abertura.split('-').map(Number)
    const startDate = new Date(year, month - 1, day)

    let endDate = new Date()
    if (data_fechamento) {
      const [eYear, eMonth, eDay] = data_fechamento.split('-').map(Number)
      endDate = new Date(eYear, eMonth - 1, eDay)
    }

    if (!isValid(startDate) || !isValid(endDate)) return '-'

    const days = countBusinessDays(startDate, endDate);

    if (days === 0 && isSameDay(startDate, endDate)) return 'Hoje';
    if (days < 0) return '-';

    return `${days} ${days === 1 ? 'dia útil' : 'dias úteis'}`;
  } catch (e) {
    return '-'
  }
};

// ==== FIM FUNÇÕES UTILITÁRIAS ====

const getRoleAppearance = (roleName: string, atuacaoStr?: string, areaStr?: string) => {
  if (!roleName || roleName === '-' || roleName === 'Sem cargo' || roleName === 'Cargo não definido' || roleName.includes('Não localizado')) {
    return { Icon: HelpCircle, colorClass: 'bg-red-600 text-white border-red-500 shadow-md shadow-red-200/50' };
  }

  const norm = ((roleName || '') + ' ' + (atuacaoStr || '')).toLowerCase();
  
  let Icon = Briefcase;
  let colorClass = 'bg-slate-500 text-white border-slate-400 shadow-md shadow-slate-200/50';

  if (norm.includes('gerente de rh') || norm.includes('gerente recursos humanos')) {
    Icon = UsersRound;
  }
  else if (norm.includes('controller')) {
    Icon = ChartPie;
  }
  else if (norm.includes('gerente de operações') || norm.includes('gerente de operacoes')) {
    Icon = Package;
  }
  else if (norm.includes('jovem aprendiz')) {
    Icon = Baby;
  }
  else if (norm.includes('mensageiro')) {
    Icon = Mail;
  }
  else if (norm.includes('motorista')) {
    Icon = Car;
  }
  else if (norm.includes('portador')) {
    Icon = Send;
  }
  else if (norm.includes('recepcionista') || norm.includes('recepção') || norm.includes('telefonista') || norm.includes('atendente')) {
    Icon = Headset;
  }
  else if (norm.includes('secretária') || norm.includes('secretaria')) {
    Icon = NotebookTabs;
  }
  else if (norm.includes('advogad') || norm.includes('paralegal') || norm.includes('jurídic') || norm.includes('juridic') || norm.includes('sócio') || norm.includes('socio')) {
    Icon = Scale;
  }
  else if (norm.includes('estagiário') || norm.includes('estagiario') || norm.includes('trainee')) {
    Icon = GraduationCap;
  }
  else if (norm.includes('ti ') || norm.includes('tecnologia') || norm.startsWith('ti') || norm.includes('dados') || norm.includes('desenvolvedor') || norm.includes('dev') || norm.includes('suporte')) {
    Icon = Monitor;
  }
  else if (norm.includes('fiscal') || norm.includes('tributário') || norm.includes('tributario') || norm.includes('imposto')) {
    Icon = Calculator;
  }
  else if (norm.includes('financeiro') || norm.includes('faturamento') || norm.includes('cobrança') || norm.includes('contabil') || norm.includes('contábil')) {
    Icon = Landmark;
  }
  else if (norm.includes('rh') || norm.includes('gente') || norm.includes('departamento pessoal') || norm.includes('dp') || norm.includes('recrutamento')) {
    Icon = Users;
  }
  else if (norm.includes('copeira') || norm.includes('limpeza') || norm.includes('serviços gerais')) {
    Icon = Coffee;
  }
  else if (norm.includes('arquivo') || norm.includes('administrativo') || norm.includes('auxiliar') || norm.includes('assistente')) {
    Icon = Folder;
  }
  else if (norm.includes('marketing') || norm.includes('comunicação') || norm.includes('designer')) {
    Icon = Globe;
  }
  
  const areaNorm = (areaStr || '').toLowerCase();
  // Using exact UI as requested:
  // Administrativa uses the amber scheme from CANDIDATO modal.
  // Juridica uses the dark blue scheme from VAGA modal.
  if (areaNorm.includes('jurídica') || areaNorm.includes('juridica')) {
    colorClass = 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-lg group-hover:shadow-blue-300/50';
  } else if (areaNorm.includes('administrativa') || areaNorm.includes('administrativo')) {
    colorClass = 'bg-amber-600 text-white border-amber-600 shadow-lg group-hover:shadow-amber-300/50';
  }

  return { Icon, colorClass };
}

export function RHVagas() {
  const [searchTerm, setSearchTerm] = useState('')
  const [vagas, setVagas] = useState<Vaga[]>([])
  const [candidatos, setCandidatos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'abertas' | 'talentos' | 'fechadas' | 'reprovados' | 'ats'>('abertas')


  // Alert Modal State
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    description: '',
    variant: 'info'
  });

  const showAlert = (title: string, description: string, variant: 'success' | 'error' | 'info' = 'info') => {
    setAlertConfig({ isOpen: true, title, description, variant });
  };

  // Filtros
  const [filterLider, setFilterLider] = useState('')
  const [filterPartner, setFilterPartner] = useState('')
  const [filterLocal, setFilterLocal] = useState('')
  const [filterCargo, setFilterCargo] = useState('')
  const [filterArea, setFilterArea] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFaculdades, setFilterFaculdades] = useState<string[]>([])
  const [filterPeriodos, setFilterPeriodos] = useState<string[]>([])
  const [filterTurnos, setFilterTurnos] = useState<string[]>([])

  // Opções de Filtro
  const [liderOptions, setLiderOptions] = useState<{ value: string; label: string }[]>([])
  const [partnerOptions, setPartnerOptions] = useState<{ value: string; label: string }[]>([])
  const [locationOptions, setLocationOptions] = useState<{ value: string; label: string }[]>([])
  const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([])
  const [faculdadesOptions, setFaculdadesOptions] = useState<{ value: string; label: string }[]>([])
  
  const periodosGlobais = [
    '1º Período', '2º Período', '3º Período', '4º Período', '5º Período',
    '6º Período', '7º Período', '8º Período', '9º Período', '10º Período'
  ].map(p => ({ value: p, label: p }))

  const turnosGlobais = [
    { value: 'Manhã', label: 'Manhã' },
    { value: 'Tarde', label: 'Tarde' },
    { value: 'Noite', label: 'Noite' }
  ]

  // Categorias de filtro para a FilterBar (montadas dinamicamente por tab)
  const filterCategories = useMemo((): FilterCategory[] => {
    const cats: FilterCategory[] = [];

    // Líder e Sócio apenas para tabs de vagas
    if (activeTab !== 'talentos' && activeTab !== 'reprovados') {
      cats.push({
        key: 'lider',
        label: 'Líder',
        icon: User,
        type: 'single',
        options: liderOptions,
        value: filterLider,
        onChange: setFilterLider,
      });
      cats.push({
        key: 'partner',
        label: 'Sócio',
        icon: Users,
        type: 'single',
        options: partnerOptions,
        value: filterPartner,
        onChange: setFilterPartner,
      });
    }

    cats.push({
      key: 'area',
      label: 'Área',
      icon: Briefcase,
      type: 'single',
      options: [{ value: 'Administrativa', label: 'Administrativa' }, { value: 'Jurídica', label: 'Jurídica' }],
      value: filterArea,
      onChange: setFilterArea,
    });

    // Faculdades, Período e Turno apenas para tabs de candidatos
    if (activeTab === 'talentos' || activeTab === 'reprovados') {
      cats.push({
        key: 'faculdades',
        label: 'Faculdades',
        icon: GraduationCap,
        type: 'multi',
        options: faculdadesOptions,
        value: filterFaculdades,
        onChange: setFilterFaculdades,
      });
      cats.push({
        key: 'periodos',
        label: 'Período',
        icon: CalendarDays,
        type: 'multi',
        options: periodosGlobais,
        value: filterPeriodos,
        onChange: setFilterPeriodos,
      });
      cats.push({
        key: 'turnos',
        label: 'Turno',
        icon: Clock,
        type: 'multi',
        options: turnosGlobais,
        value: filterTurnos,
        onChange: setFilterTurnos,
      });
    }

    cats.push({
      key: 'cargo',
      label: 'Cargo',
      icon: Briefcase,
      type: 'single',
      options: roleOptions,
      value: filterCargo,
      onChange: setFilterCargo,
    });

    cats.push({
      key: 'local',
      label: 'Local',
      icon: Building2,
      type: 'single',
      options: locationOptions,
      value: filterLocal,
      onChange: setFilterLocal,
    });

    // Status apenas para tabs de vagas abertas/fechadas
    if (activeTab === 'abertas' || activeTab === 'fechadas') {
      cats.push({
        key: 'status',
        label: 'Status',
        icon: AlertCircle,
        type: 'single',
        options: [
          { value: 'Aberta', label: 'Aberta' },
          { value: 'Congelada', label: 'Congelada' },
          { value: 'Aguardando Autorização', label: 'Aguardando Autorização' },
          { value: 'Fechada', label: 'Fechada' },
        ],
        value: filterStatus,
        onChange: setFilterStatus,
      });
    }

    return cats;
  }, [activeTab, filterLider, filterPartner, filterArea, filterFaculdades, filterPeriodos, filterTurnos, filterCargo, filterLocal, filterStatus, liderOptions, partnerOptions, faculdadesOptions, roleOptions, locationOptions, periodosGlobais, turnosGlobais]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false)
  const [isCandidatoModalOpen, setIsCandidatoModalOpen] = useState(false)
  const [isCandidatoViewModalOpen, setIsCandidatoViewModalOpen] = useState(false)
  const [selectedVagaId, setSelectedVagaId] = useState<string | null>(null)
  const [selectedCandidatoId, setSelectedCandidatoId] = useState<string | null>(null)
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [editInitialTab, setEditInitialTab] = useState(1)
  const [candidatoEditInitialTab, setCandidatoEditInitialTab] = useState(1)

  useEffect(() => {
    setSelectedCandidates([])
  }, [activeTab])

  const handleShareSelected = async () => {
    if (selectedCandidates.length === 0) return;

    // Registrar histórico
    try {
      const historyRows = selectedCandidates.map(id => ({
        candidato_id: id,
        tipo: 'Envio para Análise',
        data_registro: new Date().toISOString(),
        descricao: 'Perfil público compartilhado com o Líder para avaliação.',
      }));
      await supabase.from('candidato_historico').insert(historyRows);
    } catch (err) {
      console.error('Erro ao registrar histórico de compartilhamento:', err);
    }

    // Get profiles and build email body
    const candsToShare = candidatos.filter(c => selectedCandidates.includes(c.id));

    const linksInfo = candsToShare.map(c => {
      const slugFallback = c.slug || (c.nome ? c.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : c.id);
      return `Candidato: ${c.nome}\nCargo: ${roleOptions.find(r => String(r.value) === String(c.role))?.label || c.role || '-'}\nAcesse o perfil completo: ${window.location.origin}/candidato/perfil/${slugFallback}`;
    }).join('\n\n');

    const htmlCards = candsToShare.map(c => {
      const slugFallback = c.slug || (c.nome ? c.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : c.id);
      const url = `${window.location.origin}/candidato/perfil/${slugFallback}`;
      const cargo = roleOptions.find(r => String(r.value) === String(c.role))?.label || c.role || '-';
      
      return `
        <div style="font-family: Arial, sans-serif; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; max-width: 500px; background-color: #f8fafc;">
          <h3 style="margin: 0 0 8px 0; color: #1e3a8a; font-size: 18px;">${c.nome}</h3>
          <p style="margin: 0 0 8px 0; color: #475569; font-size: 14px;"><strong>Cargo/Área:</strong> ${cargo}</p>
          <p style="margin: 0; font-size: 14px;"><strong>Perfil Completo:</strong> <a href="${url}" style="color: #1e3a8a; text-decoration: underline;">${url}</a></p>
        </div>
      `;
    }).join('');

    const textBody = `Olá,\n\nSegue abaixo os perfis dos talentos para sua avaliação:\n\n${linksInfo}\n\nAtenciosamente,\nEquipe de RH`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #334155;">
        <p>Olá,</p>
        <p>Segue abaixo os perfis dos talentos para sua avaliação:</p>
        ${htmlCards}
        <p>Atenciosamente,<br><strong>Equipe de RH</strong></p>
      </div>
    `;

    const subject = encodeURIComponent(`Perfis de Talentos para Avaliação`);

    try {
      const htmlBlob = new Blob([htmlBody], { type: 'text/html' });
      const textBlob = new Blob([textBody], { type: 'text/plain' });
      const clipboardItem = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob
      });
      
      await navigator.clipboard.write([clipboardItem]);
      
      showAlert('Copiado com Sucesso! ✨', 'Os perfis foram copiados com um layout elegante para e-mail. Um rascunho será aberto, basta colar (Ctrl+V) no corpo do e-mail!', 'success');
      
      window.open(`mailto:?subject=${subject}`, '_blank');
    } catch (err) {
      console.error('Erro ao copiar HTML para clipboard:', err);
      const body = encodeURIComponent(textBody);
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    }
  }

  const [pendingRemoveFeedback, setPendingRemoveFeedback] = useState<{ id: string, name: string } | null>(null);

  const handleRemoveFeedback = (candidatoId: string, nome: string) => {
    setPendingRemoveFeedback({ id: candidatoId, name: nome });
  }

  const confirmRemoveFeedback = async () => {
    if (!pendingRemoveFeedback) return;

    try {
      // 1. Apagar campos do perfil
      const { error } = await supabase.from('candidatos').update({
        avaliacao_lider: null,
        obs_lider: null,
        data_avaliacao: null
      }).eq('id', pendingRemoveFeedback.id);

      if (error) throw error;

      // 2. Registrar no histórico que foi removido
      await supabase.from('candidato_historico').insert({
        candidato_id: pendingRemoveFeedback.id,
        tipo: 'Avaliação Removida',
        data_registro: new Date().toISOString(),
        descricao: 'A badge de avaliação do líder foi removida/arquivada pelo avaliador do RH.',
      });

      // 3. Update state local
      setCandidatos(prev => prev.map(c => c.id === pendingRemoveFeedback.id ? { ...c, avaliacao_lider: null, obs_lider: null, data_avaliacao: null } : c));

    } catch (err) {
      console.error('Erro ao remover badge:', err);
      showAlert('Erro', 'Não foi possível remover a badge de avaliação.', 'error');
    } finally {
      setPendingRemoveFeedback(null);
    }
  }

  // Match System State
  const [matchMode, setMatchMode] = useState<'vaga' | 'candidato'>('vaga')
  const [selectedMatchVagaId, setSelectedMatchVagaId] = useState<string | null>(null)
  const [selectedMatchCandidatoId, setSelectedMatchCandidatoId] = useState<string | null>(null)
  const [isAiMatching, setIsAiMatching] = useState(false)
  const [aiMatchResults, setAiMatchResults] = useState<Record<string, { score: number, justificativa?: string, matchesTags?: string[], gaps?: string[] }>>({})
  const [atsMatchArea, setAtsMatchArea] = useState<'Administrativa' | 'Jurídica' | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([fetchVagas(), fetchCandidatos(), fetchFilterOptions()])
    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError('Não foi possível carregar as informações.')
    } finally {
      setLoading(false)
    }
  }

  const fetchFilterOptions = async () => {
    const [rolesRes, locsRes, partnersRes, leadersRes, instRes] = await Promise.all([
      supabase.from('roles').select('id, name').order('name'),
      supabase.from('locations').select('id, name').order('name'),
      supabase.from('partners').select('id, name').order('name'),
      supabase.from('collaborators').select('id, name').order('name'),
      supabase.rpc('get_education_institutions')
    ]);
    if (rolesRes.data) setRoleOptions(rolesRes.data.map(r => ({ value: String(r.id), label: r.name })));
    if (locsRes.data) setLocationOptions(locsRes.data.map(l => ({ value: String(l.id), label: l.name })));
    if (partnersRes.data) setPartnerOptions(partnersRes.data.map(p => ({ value: String(p.id), label: p.name })));
    if (leadersRes.data) setLiderOptions(leadersRes.data.map(c => ({ value: String(c.id), label: c.name })));
    if (instRes.data) setFaculdadesOptions((instRes.data as any[]).map(i => ({ value: i.name, label: i.name })));
  }

  const fetchVagas = async () => {
    const { data, error: dbError } = await supabase
      .from('vagas')
      .select(`
        *,
        role:role_id (id, name),
        location:location_id (id, name),
        partner:partner_id (id, name),
        leader:leader_id (id, name),
        candidato_aprovado:candidato_aprovado_id (nome),
        hiring_reason:hiring_reason_id (id, name)
      `)
      .order('created_at', { ascending: false })

    if (dbError) throw dbError
    setVagas(data || [])
  }

  const fetchCandidatos = async () => {
    // Buscar candidatos
    const { data: candData, error: dbError } = await supabase
      .from('candidatos')
      .select(`
        *,
        candidato_historico ( tipo, data_registro, entrevista_data )
      `)
      .order('created_at', { ascending: false })

    if (dbError) throw dbError

    // Buscar IDs de candidatos que já estão na tabela de colaboradores
    const { data: colabLinks } = await supabase
      .from('collaborators')
      .select('candidato_id')
      .not('candidato_id', 'is', null)

    const contratadosIds = new Set(colabLinks?.map(cl => cl.candidato_id).filter(Boolean))

    // Filtrar candidatos que já são integrantees
    let talentosAbertos = (candData || []).filter(c => !contratadosIds.has(c.id))

    // Ordenar: candidatos recém-avaliados pelo líder (data_avaliacao) no topo
    talentosAbertos = talentosAbertos.sort((a, b) => {
      // Se A tem avaliação e B não, A vem primeiro
      if (a.data_avaliacao && !b.data_avaliacao) return -1;
      // Se B tem avaliação e A não, B vem primeiro
      if (!a.data_avaliacao && b.data_avaliacao) return 1;

      // Se ambos têm, ordenar pela data de avaliação (mais recente primeiro)
      if (a.data_avaliacao && b.data_avaliacao) {
        return new Date(b.data_avaliacao).getTime() - new Date(a.data_avaliacao).getTime();
      }

      // Se nenhum tem (ou como fallback), manter ordem original por data de criação descrescente
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setCandidatos(talentosAbertos)
  }

  // ==== MATCH SYSTEM LOGIC ====

  const handleRunAiMatch = async (vagaId: string, candidatoId: string) => {
    setIsAiMatching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `https://iewevhdtwlviudetxgax.supabase.co/functions/v1/match-ats-ia`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            vagaId,
            candidatoId
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro desconhecido na IA');
      }

      if (result.success && result.data) {
        // Armazena no state usando uma key mista para cachear na sessão
        const matchKey = `${vagaId}_${candidatoId}`;
        setAiMatchResults(prev => ({
          ...prev,
          [matchKey]: {
            score: result.data.score || 0,
            justificativa: result.data.justificativa,
            matchesTags: result.data.matchesTags || [],
            gaps: result.data.gaps || []
          }
        }));
      }
    } catch (e: any) {
      showAlert('Erro', 'Erro ao processar Match via IA: ' + e.message, 'error');
    } finally {
      setIsAiMatching(false);
    }
  };

  // State derivado: Vaga Ativa no Match e lista de Candidatos Ordenada
  const activeMatchVaga = vagas.find(v => v.id === selectedMatchVagaId);
  const matchedCandidatos = useMemo(() => {
    if (!activeMatchVaga || matchMode !== 'vaga') return [];
    const vagaTags = extractTags(activeMatchVaga.perfil);

    return candidatos
      .filter(c => !activeMatchVaga.area || String(c.area) === String(activeMatchVaga.area)) // STRICT AREA MATCH
      .map(c => {
        const candidatoTags = extractTags(c.perfil);
        const match = calculateMatchScore(vagaTags, candidatoTags);

        // Lógica de Relevância Inteligente (Boosts)
        let relevanceScore = match.score;

        // Se o perfil do candidato não tem tags que coincidem com a vaga, a aderência é zero.
        if (match.matches > 0 && candidatoTags.length > 0) {
          // 1. Boost por Área (Ex: Jurídico com Jurídico)
          const sameArea = String(c.area) === String(activeMatchVaga.area);
          if (sameArea && c.area) relevanceScore += 50;

          // 2. Boost por Cargo
          // ID idêntico
          const sameRoleId = String(c.role) === String(activeMatchVaga.role_id);
          if (sameRoleId) relevanceScore += 30;
          else {
            // Similaridade de nome (ex: Paralegal vs Advogado)
            const candRoleName = (roleOptions.find(r => String(r.value) === String(c.role))?.label || '').toLowerCase();
            const vagaRoleName = (activeMatchVaga.role?.name || '').toLowerCase();

            if (candRoleName && vagaRoleName) {
              const commonKeywords = ['advogado', 'paralegal', 'estagiario', 'juridico', 'administrativo', 'recepcionista', 'auxiliar'];
              const hasCommonKeyword = commonKeywords.some(key => candRoleName.includes(key) && vagaRoleName.includes(key));
              if (hasCommonKeyword) relevanceScore += 15;
            }
          }
        } else {
          relevanceScore = 0;
        }

        // Cap relevance score at 100%
        relevanceScore = Math.min(relevanceScore, 100);

        return {
          candidato: c,
          score: relevanceScore, // Score turbinado (capped a 100%)
          baseScore: match.score, // Mantemos o original para referência se necessário
          matches: match.matches,
          totalTags: vagaTags.length,
          matchedTags: match.matchedTags,
          candidatoTags
        };
      }).sort((a, b) => b.score - a.score);
  }, [activeMatchVaga, matchMode, candidatos, roleOptions]);

  const activeMatchCandidato = candidatos.find(c => c.id === selectedMatchCandidatoId);
  const matchedVagas = useMemo(() => {
    if (!activeMatchCandidato || matchMode !== 'candidato') return [];
    const candidatoTags = extractTags(activeMatchCandidato.perfil);

    return vagas
      .filter(v => v.status === 'Aberta' || v.status === 'Aguardando Autorização') // Apenas ativas
      .filter(v => !activeMatchCandidato.area || String(v.area) === String(activeMatchCandidato.area)) // STRICT AREA MATCH
      .map(v => {
        const vagaTags = extractTags(v.perfil);
        const match = calculateMatchScore(candidatoTags, vagaTags); // Queremos saber o quanto a vaga atende aos requisitos/skills do candidato (invertido)

        // Aplica boosters parecidos
        let score = match.score;
        if (match.matches > 0 && vagaTags.length > 0) {
          if (v.area && String(v.area) === String(activeMatchCandidato?.area)) {
            score += 50;
          }
        } else {
          score = 0;
        }

        // Cap relevance score at 100%
        score = Math.min(score, 100);

        return {
          vaga: v,
          score: score, // Use the newly calculated score
          matches: match.matches,
          totalTags: candidatoTags.length > 0 ? candidatoTags.length : vagaTags.length, // Tratamento para não quebrar a UI
          matchedTags: match.matchedTags,
          vagaTags
        };
      }).sort((a, b) => b.score - a.score);
  }, [activeMatchCandidato, matchMode, vagas]);
  // ============================

  const handleOpenSelectionModal = () => {
    setIsSelectionModalOpen(true)
  }

  const [candidatoInitialData, setCandidatoInitialData] = useState<any>(null)
  const [candidatoInitialFile, setCandidatoInitialFile] = useState<File | null>(null)

  const handleSelection = (tipo: VagasCreationType) => {
    setIsSelectionModalOpen(false)
    if (tipo === 'vaga') {
      handleOpenModal()
    } else if (tipo === 'candidato') {
      setSelectedCandidatoId(null)
      setCandidatoInitialData(null)
      setCandidatoInitialFile(null)
      setIsCandidatoModalOpen(true)
    } else if (typeof tipo === 'object' && tipo.type === 'candidato_ia') {
      setSelectedCandidatoId(null)
      setCandidatoInitialData(tipo.data)
      setCandidatoInitialFile(tipo.file)
      setIsCandidatoModalOpen(true)
    }
  }

  const handleOpenModal = (id?: string, initialTab?: number) => {
    setSelectedVagaId(id || null)
    setIsModalOpen(true)
    setIsViewModalOpen(false)
    setEditInitialTab(initialTab || 1)
  }

  const handleOpenViewModal = (id: string) => {
    setSelectedVagaId(id)
    setIsViewModalOpen(true)
    setIsModalOpen(false)
  }

  const handleOpenCandidatoModal = (id: string, initialTab?: number) => {
    setSelectedCandidatoId(id)
    setCandidatoEditInitialTab(initialTab || 1)
    setIsCandidatoModalOpen(true)
  }

  const handleOpenCandidatoViewModal = (id: string) => {
    setSelectedCandidatoId(id)
    setIsCandidatoViewModalOpen(true)
  }

  const handleCloseCandidatoViewModal = () => {
    setIsCandidatoViewModalOpen(false)
    setSelectedCandidatoId(null)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedVagaId(null)
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setSelectedVagaId(null)
  }

  const handleCloseCandidatoModal = () => {
    setIsCandidatoModalOpen(false)
    setSelectedCandidatoId(null)
    setCandidatoInitialData(null)
    setCandidatoInitialFile(null)
  }

  const [pendingDeleteVaga, setPendingDeleteVaga] = useState<{ id: string } | null>(null)
  const [pendingDeleteCandidato, setPendingDeleteCandidato] = useState<{ id: string } | null>(null)

  const handleDeleteVaga = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPendingDeleteVaga({ id })
  }

  const confirmDeleteVaga = async () => {
    if (!pendingDeleteVaga) return
    try {
      const { error } = await supabase.from('vagas').delete().eq('id', pendingDeleteVaga.id)
      if (error) throw error
      fetchVagas()
    } catch (err) {
      console.error('Erro ao excluir vaga:', err)
      showAlert('Erro', 'Não foi possível excluir a vaga. Verifique se existem talentos vinculados.', 'error')
    } finally {
      setPendingDeleteVaga(null)
    }
  }

  const handleDeleteCandidato = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPendingDeleteCandidato({ id })
  }

  const confirmDeleteCandidato = async () => {
    if (!pendingDeleteCandidato) return
    try {
      const { error } = await supabase.from('candidatos').delete().eq('id', pendingDeleteCandidato.id)
      if (error) throw error
      fetchCandidatos()
    } catch (err) {
      console.error('Erro ao excluir candidato:', err)
      showAlert('Erro', 'Não foi possível excluir o candidato. Verifique os vínculos.', 'error')
    } finally {
      setPendingDeleteCandidato(null)
    }
  }



  const filteredVagas = useMemo(() => vagas.filter(v => {
    const term = searchTerm.toLowerCase()
    const matchSearch = (
      v.vaga_id_text?.toLowerCase().includes(term) ||
      v.role?.name?.toLowerCase().includes(term) ||
      v.area?.toLowerCase().includes(term) ||
      v.location?.name?.toLowerCase().includes(term) ||
      v.partner?.name?.toLowerCase().includes(term) ||
      v.leader?.name?.toLowerCase().includes(term)
    )

    const matchLider = filterLider ? String(v.leader_id) === filterLider : true
    const matchPartner = filterPartner ? String(v.partner_id) === filterPartner : true
    const matchLocal = filterLocal ? String(v.location_id) === filterLocal : true
    const matchCargo = filterCargo ? String(v.role_id) === filterCargo : true
    const matchArea = filterArea ? String(v.area) === filterArea : true
    const matchStatus = filterStatus ? v.status === filterStatus : true

    return matchSearch && matchLider && matchPartner && matchLocal && matchCargo && matchArea && matchStatus
  }).sort((a, b) => {
    const nameA = a.role?.name || ''
    const nameB = b.role?.name || ''
    return nameA.localeCompare(nameB)
  }), [vagas, searchTerm, filterLider, filterPartner, filterLocal, filterCargo, filterArea, filterStatus])

  const filteredCandidatos = useMemo(() => candidatos.filter(c => {
    const term = searchTerm.toLowerCase()
    const matchSearch = c.nome?.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term)

    // Convert text fields or IDs exactly the way they are stored. 
    // Usually 'role' and 'local' on candidato are string IDs in the form, but let's compare as strings.
    const matchLocal = filterLocal ? String(c.local) === filterLocal : true
    const matchCargo = filterCargo ? String(c.role) === filterCargo : true
    const matchArea = filterArea ? String(c.area) === filterArea : true
    // For Reprovados, we might want to also filter by Partner/Leader if those applied to the Vaga they were rejected from, 
    // but the Candidato record doesn't store this. The user specifically asked to hide Lider/Socio from Talentos previously, 
    // and requested "os mesmos campos de buscas e filtros que tem em vagas fechadas". Let's hide Lider/Socio in Reprovados 
    // to keep it consistent with what can actually be filtered on a Candidate.

    // We already hid Lider and Socio for Talentos, and we hid them for Reprovados in the UI earlier. 
    // The filter variables used here are Local, Cargo, and Area.

    // Parsing seguro do Histórico de Educação (pode vir como string JSON do Supabase)
    let eduHistory: any[] = [];
    if (typeof c.education_history === 'string') {
      try { eduHistory = JSON.parse(c.education_history); } catch (e) {}
    } else if (Array.isArray(c.education_history)) {
      eduHistory = c.education_history;
    }

    // Novos Filtros (Faculdade, Período e Turno)
    const matchFaculdade = filterFaculdades.length > 0 
      ? eduHistory.some((edu: any) => filterFaculdades.includes(edu.instituicao))
      : true;

    const matchPeriodo = filterPeriodos.length > 0 
      ? eduHistory.some((edu: any) => filterPeriodos.includes(edu.semestre))
      : true;

    const matchTurno = filterTurnos.length > 0
      ? eduHistory.some((edu: any) => filterTurnos.includes(edu.turno))
      : true;

    return matchSearch && matchLocal && matchCargo && matchArea && matchFaculdade && matchPeriodo && matchTurno
  }).sort((a, b) => {
    // Priority: Candidatos com avaliação do lider recente vêm em primeiro
    if (a.data_avaliacao && !b.data_avaliacao) return -1;
    if (!a.data_avaliacao && b.data_avaliacao) return 1;
    if (a.data_avaliacao && b.data_avaliacao) {
      return new Date(b.data_avaliacao).getTime() - new Date(a.data_avaliacao).getTime();
    }

    // Fallback: Ordem alfabética
    const nameA = a.nome || ''
    const nameB = b.nome || ''
    return nameA.localeCompare(nameB)
  }), [candidatos, searchTerm, filterLocal, filterCargo, filterArea, filterFaculdades, filterPeriodos, filterTurnos])

  const countAbertas = filteredVagas.filter(v => v.status === 'Aberta').length;
  const countFechadas = filteredVagas.filter(v => v.status === 'Fechada').length;
  const countTalentos = filteredCandidatos.filter((c: any) => !(c.status_selecao && c.status_selecao.startsWith('Reprovado'))).length;
  const countReprovados = filteredCandidatos.filter((c: any) => c.status_selecao?.startsWith('Reprovado')).length;


  // Contagem de filtros ativos para badge do botão colapsável
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterArea) count++;
    if (filterCargo) count++;
    if (filterLocal) count++;
    if (activeTab !== 'talentos' && activeTab !== 'reprovados') {
      if (filterLider) count++;
      if (filterPartner) count++;
    }
    if (activeTab === 'abertas' || activeTab === 'fechadas') {
      if (filterStatus) count++;
    }
    if (activeTab === 'talentos' || activeTab === 'reprovados') {
      if (filterFaculdades.length > 0) count++;
      if (filterPeriodos.length > 0) count++;
      if (filterTurnos.length > 0) count++;
    }
    return count;
  }, [filterArea, filterCargo, filterLocal, filterLider, filterPartner, filterStatus, filterFaculdades, filterPeriodos, filterTurnos, activeTab]);

  // Helper: gera a lista de chips de filtros ativos
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    if (filterArea) chips.push({ key: 'area', label: `Área: ${filterArea}`, onClear: () => setFilterArea('') });
    if (filterCargo) {
      const cargoLabel = roleOptions.find(r => r.value === filterCargo)?.label || filterCargo;
      chips.push({ key: 'cargo', label: `Cargo: ${cargoLabel}`, onClear: () => setFilterCargo('') });
    }
    if (filterLocal) {
      const localLabel = locationOptions.find(l => l.value === filterLocal)?.label || filterLocal;
      chips.push({ key: 'local', label: `Local: ${localLabel}`, onClear: () => setFilterLocal('') });
    }
    if (activeTab !== 'talentos' && activeTab !== 'reprovados') {
      if (filterLider) {
        const liderLabel = liderOptions.find(l => l.value === filterLider)?.label || filterLider;
        chips.push({ key: 'lider', label: `Líder: ${liderLabel}`, onClear: () => setFilterLider('') });
      }
      if (filterPartner) {
        const partnerLabel = partnerOptions.find(p => p.value === filterPartner)?.label || filterPartner;
        chips.push({ key: 'partner', label: `Sócio: ${partnerLabel}`, onClear: () => setFilterPartner('') });
      }
    }
    if ((activeTab === 'abertas' || activeTab === 'fechadas') && filterStatus) {
      chips.push({ key: 'status', label: `Status: ${filterStatus}`, onClear: () => setFilterStatus('') });
    }
    if (activeTab === 'talentos' || activeTab === 'reprovados') {
      if (filterFaculdades.length > 0) chips.push({ key: 'faculdades', label: `Faculdades (${filterFaculdades.length})`, onClear: () => setFilterFaculdades([]) });
      if (filterPeriodos.length > 0) chips.push({ key: 'periodos', label: `Período (${filterPeriodos.length})`, onClear: () => setFilterPeriodos([]) });
      if (filterTurnos.length > 0) chips.push({ key: 'turnos', label: `Turno (${filterTurnos.length})`, onClear: () => setFilterTurnos([]) });
    }
    return chips;
  }, [filterArea, filterCargo, filterLocal, filterLider, filterPartner, filterStatus, filterFaculdades, filterPeriodos, filterTurnos, activeTab, roleOptions, locationOptions, liderOptions, partnerOptions]);

  const clearAllFilters = () => {
    setFilterLider('');
    setFilterPartner('');
    setFilterLocal('');
    setFilterCargo('');
    setFilterArea('');
    setFilterStatus('');
    setFilterFaculdades([]);
    setFilterPeriodos([]);
    setFilterTurnos([]);
  };

  return (
    <div className="flex flex-col min-h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6 pb-24">

      {/* PAGE HEADER COMPLETO - Título + Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-500">
        {/* Left: Título e Ícone */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <Briefcase className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
                Recrutamento & Seleção
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Gestão de vagas abertas, candidatos e processos seletivos
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto justify-end mt-2 md:mt-0 custom-scrollbar">
          <div className="flex items-center bg-gray-100/80 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setActiveTab('abertas')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'abertas' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Briefcase className="h-4 w-4" /> Vagas Abertas
              <span className={`min-w-[20px] text-center px-1.5 py-0.5 rounded-full text-[10px] font-black transition-colors ${activeTab === 'abertas' ? 'bg-blue-50 text-blue-700' : 'bg-gray-200/60 text-gray-500'}`}>
                {countAbertas}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('talentos')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'talentos' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Users className="h-4 w-4" /> Talentos
              <span className={`min-w-[20px] text-center px-1.5 py-0.5 rounded-full text-[10px] font-black transition-colors ${activeTab === 'talentos' ? 'bg-blue-50 text-blue-700' : 'bg-gray-200/60 text-gray-500'}`}>
                {countTalentos}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('fechadas')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'fechadas' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <CheckCircle2 className="h-4 w-4" /> Vagas Fechadas
              <span className={`min-w-[20px] text-center px-1.5 py-0.5 rounded-full text-[10px] font-black transition-colors ${activeTab === 'fechadas' ? 'bg-blue-50 text-blue-700' : 'bg-gray-200/60 text-gray-500'}`}>
                {countFechadas}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('reprovados')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'reprovados' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500 hover:text-red-700'}`}
            >
              <UserX className="h-4 w-4" /> Reprovados
              <span className={`min-w-[20px] text-center px-1.5 py-0.5 rounded-full text-[10px] font-black transition-colors ${activeTab === 'reprovados' ? 'bg-red-50 text-red-600' : 'bg-gray-200/60 text-gray-500'}`}>
                {countReprovados}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3 border-l border-gray-100 pl-4 ml-2">
            <button
              onClick={() => setActiveTab('ats')}
              className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all shrink-0 overflow-hidden
                ${activeTab === 'ats'
                  ? 'bg-gradient-to-r from-blue-700 to-[#112240] text-white shadow-lg shadow-blue-500/40 ring-2 ring-blue-400/60 ring-offset-1'
                  : 'bg-gradient-to-r from-blue-600 to-[#1e3a8a] text-white shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-[#112240]'}
              `}
              title="Match Inteligente (ATS)"
            >
              <Sparkles className="h-5 w-5 relative z-10" />
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            </button>
            <button
              onClick={handleOpenSelectionModal}
              className="flex items-center justify-center w-10 h-10 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 shrink-0"
              title="Adicionar Novo"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {
        activeTab !== 'ats' && (
          <>
            {/* KPI Cards + Filter Bar */}
            <div className="flex flex-col lg:flex-row items-stretch gap-4">
              {/* Card de KPI da tab ativa */}
              <div className="flex items-stretch shrink-0">
                {activeTab === 'abertas' && (
                  <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Briefcase className="h-5 w-5 text-[#1e3a8a]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none">Abertas</span>
                      <span className="text-xl font-black text-[#0a192f] leading-tight">{countAbertas}</span>
                    </div>
                  </div>
                )}
                {activeTab === 'talentos' && (
                  <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Users className="h-5 w-5 text-[#1e3a8a]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none">Talentos</span>
                      <span className="text-xl font-black text-[#0a192f] leading-tight">{countTalentos}</span>
                    </div>
                  </div>
                )}
                {activeTab === 'fechadas' && (
                  <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none">Fechadas</span>
                      <span className="text-xl font-black text-[#0a192f] leading-tight">{countFechadas}</span>
                    </div>
                  </div>
                )}
                {activeTab === 'reprovados' && (
                  <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                    <div className="p-2 rounded-lg bg-red-50">
                      <UserX className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none">Reprovados</span>
                      <span className="text-xl font-black text-[#0a192f] leading-tight">{countReprovados}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Filter Bar */}
              <div className="flex-1">
                <FilterBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  categories={filterCategories}
                  activeFilterChips={activeFilterChips}
                  activeFilterCount={activeFilterCount}
                  onClearAll={clearAllFilters}
                />
              </div>
            </div>
          </>
        )
      }

      {/* ATS MATCH TAB */}
      {
        activeTab === 'ats' && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-100 pb-4 mb-6 gap-4 shrink-0">
              <div>
                <h2 className="text-xl font-black text-[#1e3a8a] tracking-tight">Match Inteligente (ATS)</h2>
                <p className="text-xs font-semibold text-gray-500 mt-1">Encontre a aderência perfeita cruzando perfis e vagas</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                {/* Filtros de Área (Pré-Match) */}
                <div className="flex bg-gray-50 p-1 rounded-xl w-full sm:w-auto border border-gray-100">
                  <button
                    onClick={() => {
                      setAtsMatchArea(atsMatchArea === 'Administrativa' ? null : 'Administrativa')
                      // Clear selected vacancy/candidate when switching areas to avoid bugs
                      setSelectedMatchVagaId(null)
                      setSelectedMatchCandidatoId(null)
                    }}
                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${atsMatchArea === 'Administrativa' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'}`}
                    title="Filtrar por Administrativa"
                  >
                    <Building2 className="h-3.5 w-3.5" /> Admin
                  </button>
                  <div className="w-px bg-gray-200 mx-1"></div>
                  <button
                    onClick={() => {
                      setAtsMatchArea(atsMatchArea === 'Jurídica' ? null : 'Jurídica')
                      // Clear selected vacancy/candidate when switching areas to avoid bugs
                      setSelectedMatchVagaId(null)
                      setSelectedMatchCandidatoId(null)
                    }}
                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${atsMatchArea === 'Jurídica' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
                    title="Filtrar por Jurídica"
                  >
                    <Briefcase className="h-3.5 w-3.5" /> Jurídico
                  </button>
                </div>

                {/* Modo de Match */}
                <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
                  <button
                    onClick={() => setMatchMode('vaga')}
                    className={`flex-1 sm:flex-none px-6 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 whitespace-nowrap ${matchMode === 'vaga' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Briefcase className="h-4 w-4" /> Por Vaga
                  </button>
                  <button
                    onClick={() => setMatchMode('candidato')}
                    className={`flex-1 sm:flex-none px-6 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 whitespace-nowrap ${matchMode === 'candidato' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <User className="h-4 w-4" /> Por Candidato
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 pr-2">
              {matchMode === 'vaga' ? (
                // VISÃO POR VAGA
                <div className="space-y-6">
                  <div className="bg-blue-50/50 p-4 sm:p-6 rounded-2xl border border-blue-100">
                    <h3 className="text-sm font-bold text-[#0a192f] mb-3">1. Selecione a Vaga Alvo</h3>
                    <div className="w-full sm:max-w-md">
                      <FilterSelect
                        placeholder="Buscar vaga"
                        value={selectedMatchVagaId || ''}
                        onChange={setSelectedMatchVagaId}
                        options={[
                          { value: '', label: 'Selecione uma vaga em aberto...' },
                          ...vagas
                            .filter(v => v.status === 'Aberta' || v.status === 'Aguardando Autorização')
                            .filter(v => atsMatchArea ? String(v.area) === atsMatchArea : true)
                            .sort((a, b) => (a.vaga_id_text || '').localeCompare(b.vaga_id_text || ''))
                            .map(v => ({
                              value: String(v.id),
                              label: `${v.vaga_id_text} - ${v.role?.name || 'Sem cargo'} (${v.location?.name || 'Sem local'})`
                            }))
                        ]}
                        icon={Briefcase}
                      />
                    </div>

                    {selectedMatchVagaId && (
                      <div className="mt-4 animate-in slide-in-from-top-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-800/60 mb-2">Tags Exigidas pela Vaga</p>
                        {activeMatchVaga && extractTags(activeMatchVaga.perfil).length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {extractTags(activeMatchVaga.perfil).map((tag, i) => (
                              <span key={i} className="px-2.5 py-1 bg-white text-blue-700 border border-blue-200 rounded-lg text-xs font-bold shadow-sm">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-blue-600/60 font-medium italic">Esta vaga não possui tags de perfil registradas. O match não será preciso.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedMatchVagaId && (
                    <div>
                      <h3 className="text-sm font-bold text-[#0a192f] mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" /> Talentos Compatíveis Ordenados
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {matchedCandidatos.map((m) => {
                          const aiData = aiMatchResults[`${selectedMatchVagaId}_${m.candidato.id}`];
                          const isLoading = isAiMatching; // Simplified for MVP

                          // Mix fallback (local tags) com inteligência artificial se existir
                          const displayScore = aiData ? aiData.score : m.score;
                          const scoreColor = displayScore >= 80 ? 'text-green-600 bg-green-50 border-green-200' :
                            displayScore >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-rose-600 bg-rose-50 border-rose-200';
                          const barColor = displayScore >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                            displayScore >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-rose-400 to-rose-500';

                          return (
                            <div key={m.candidato.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group/card" onClick={() => handleOpenCandidatoViewModal(m.candidato.id)}>
                              <div className="flex items-start gap-4">
                                {/* Avatar Block */}
                                <div className="flex-shrink-0 h-14 w-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-white shadow flex items-center justify-center">
                                  <span className="text-xl font-black text-blue-700">{m.candidato.nome.charAt(0)}</span>
                                </div>

                                {/* Info Block */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                  <div className="flex items-center gap-3">
                                    <h4 className="text-sm font-bold text-[#0a192f] truncate group-hover/card:text-blue-600 transition-colors">
                                      {m.candidato.nome}
                                    </h4>
                                    {m.matchedTags.length > 0 && (
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm border
                                      ${m.candidato.area === 'Administrativa' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                          m.candidato.area === 'Jurídica' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                            'bg-blue-50 text-blue-600 border-blue-200'}`
                                      }>
                                        🔥 {m.matchedTags.length} Match{m.matchedTags.length > 1 ? 'es' : ''}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-500 truncate mb-1">{m.candidato.email}</p>
                                  <p className="text-xs font-semibold text-gray-700 bg-gray-50 inline-flex px-2 py-0.5 rounded border border-gray-100 w-max">
                                    {roleOptions.find(r => String(r.value) === String(m.candidato.role))?.label || m.candidato.role || 'Sem cargo atual'}
                                  </p>
                                </div>

                                {/* Action Block - Run AI */}
                                {!aiData && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleRunAiMatch(selectedMatchVagaId!, m.candidato.id); }}
                                    disabled={isLoading}
                                    className="flex-shrink-0 p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors group relative"
                                    title="Analisar profundamente com IA"
                                  >
                                    <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                  </button>
                                )}
                              </div>

                              {/* Score Bar */}
                              <div className="mt-4 pt-4 border-t border-gray-50">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Aderência Global</span>
                                  <span className={`px-2 py-0.5 rounded-lg text-xs font-black border ${scoreColor}`}>
                                    {displayScore}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                                  <div className={`h-full rounded-full ${barColor} shadow-sm transition-all duration-1000`} style={{ width: `${displayScore}%` }}></div>
                                </div>
                              </div>

                              {/* AI / Tags Block */}
                              {aiData ? (
                                <div className="mt-4 bg-gray-50/50 p-3 rounded-xl border border-blue-100/50">
                                  <p className="text-xs text-gray-700 font-medium italic leading-relaxed mb-3">
                                    "{aiData.justificativa}"
                                  </p>
                                  {aiData.gaps && aiData.gaps.length > 0 && (
                                    <div className="mb-2">
                                      <p className="text-[9px] font-black tracking-widest uppercase text-rose-500 mb-1">⚠️ Gaps Encontrados</p>
                                      <div className="flex flex-wrap gap-1">
                                        {aiData.gaps.map((gap, i) => <span key={`gap-${i}`} className="text-[9px] px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-100">{gap}</span>)}
                                      </div>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-[9px] font-black tracking-widest uppercase text-green-600 mb-1">✓ Pontos Fortes</p>
                                    <div className="flex flex-wrap gap-1">
                                      {aiData.matchesTags?.map((tag, i) => <span key={`tag-${i}`} className="text-[9px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-100">{tag}</span>)}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-4 flex flex-wrap gap-1.5">
                                  {m.candidatoTags.map((tag, i) => {
                                    const isMatch = m.matchedTags.includes(tag.toLowerCase());
                                    return (
                                      <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-tight border ${isMatch ? 'bg-green-50 text-green-700 border-green-200 shadow-sm shadow-green-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                        {tag}
                                      </span>
                                    );
                                  })}
                                  {m.candidatoTags.length === 0 && <span className="text-[10px] text-gray-400 italic">Preencha o perfil para calcular localmente.</span>}
                                </div>
                              )}

                            </div>
                          )
                        })}
                        {matchedCandidatos.length === 0 && (
                          <div className="col-span-1 lg:col-span-2 p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                            <p className="text-sm font-semibold text-gray-500">Nenhum candidato na base.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // VISÃO POR CANDIDATO
                <div className="space-y-6">
                  <div className="bg-emerald-50/50 p-4 sm:p-6 rounded-2xl border border-emerald-100">
                    <h3 className="text-sm font-bold text-[#0a192f] mb-3">1. Selecione o Talento</h3>
                    <div className="w-full sm:max-w-md">
                      <FilterSelect
                        placeholder="Buscar candidato"
                        value={selectedMatchCandidatoId || ''}
                        onChange={setSelectedMatchCandidatoId}
                        options={[
                          { value: '', label: 'Selecione um candidato...' },
                          ...candidatos
                            .filter(c => atsMatchArea ? String(c.area) === atsMatchArea : true)
                            .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
                            .map(c => ({
                              value: String(c.id),
                              label: `${c.nome} (${roleOptions.find(r => String(r.value) === String(c.role))?.label || c.role || 'Sem cargo'})`
                            }))
                        ]}
                        icon={Users}
                      />
                    </div>

                    {selectedMatchCandidatoId && (
                      <>
                        <div className="bg-emerald-50/50 p-4 sm:p-6 rounded-2xl border border-emerald-100 flex items-center justify-between gap-4 cursor-pointer hover:bg-emerald-100/50 transition-colors mt-6" onClick={() => handleOpenCandidatoViewModal(selectedMatchCandidatoId!)}>
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 h-14 w-14 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 border-2 border-white shadow flex items-center justify-center">
                              <span className="text-xl font-black text-emerald-700">{activeMatchCandidato?.nome?.charAt(0)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-[#0a192f] truncate group-hover/card:text-emerald-600 transition-colors">
                                {activeMatchCandidato?.nome}
                              </h4>
                              <p className="text-[10px] text-gray-500 truncate mb-1">{activeMatchCandidato?.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 animate-in slide-in-from-top-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800/60 mb-2">Habilidades (Tags) do Candidato</p>
                          {activeMatchCandidato && extractTags(activeMatchCandidato.perfil).length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {extractTags(activeMatchCandidato.perfil).map((tag, i) => (
                                <span key={i} className="px-2.5 py-1 bg-white text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold shadow-sm">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-emerald-600/60 font-medium italic">Este candidato não possui tags de perfil registradas. Preencha no cadastro para utilizar o match.</p>
                          )}
                        </div>

                        <div className="mt-8">
                          <h3 className="text-sm font-bold text-[#0a192f] mb-3 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-emerald-600" /> Vagas Abertas Compatíveis
                          </h3>
                          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full min-w-max text-left border-collapse">
                              <thead className="bg-[#059669]">
                                <tr>
                                  <th className="px-4 py-3 text-[10px] font-black text-white uppercase tracking-wider rounded-tl-xl w-48">Aderência (Match)</th>
                                  <th className="px-3 py-3 text-[10px] font-black text-white uppercase tracking-wider min-w-[200px]">Vaga</th>
                                  <th className="px-3 py-3 text-[10px] font-black text-white uppercase tracking-wider min-w-[150px]">Líder / Sócio</th>
                                  <th className="px-3 py-3 text-[10px] font-black text-white uppercase tracking-wider rounded-tr-xl">Tags da Vaga (Highlight do Match)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {matchedVagas.map((m) => (
                                  <tr key={m.vaga.id} onClick={() => handleOpenViewModal(m.vaga.id)} className="hover:bg-emerald-50/40 cursor-pointer transition-colors">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                          <span className={`text-sm font-black ${m.score >= 80 ? 'text-green-600' : m.score >= 50 ? 'text-amber-500' : 'text-gray-400'}`}>
                                            {m.score}%
                                          </span>
                                          <span className="text-[10px] font-bold text-gray-500">{m.matches} de {m.totalTags}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                          <div
                                            className={`h-full rounded-full ${m.score >= 80 ? 'bg-green-500' : m.score >= 50 ? 'bg-amber-400' : 'bg-gray-300'}`}
                                            style={{ width: `${m.score}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-3 py-4">
                                      <div className="flex items-center gap-2">
                                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[9px] font-black tracking-widest uppercase">{m.vaga.vaga_id_text}</span>
                                        <p className="font-bold text-sm text-[#0a192f] truncate">{m.vaga.role?.name || 'Sem cargo'}</p>
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-1">{m.vaga.location?.name || 'Local não informado'}</p>
                                    </td>
                                    <td className="px-3 py-4 text-xs font-semibold text-gray-700">
                                      <p className="flex items-center gap-2">
                                        {m.vaga.leader?.name || '-'}
                                        {m.matchedTags.length > 0 && (
                                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm border
                                          ${m.vaga.area === 'Administrativa' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                              m.vaga.area === 'Jurídica' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                'bg-blue-50 text-blue-600 border-blue-200'}`
                                          }>
                                            🔥 {m.matchedTags.length} Match{m.matchedTags.length > 1 ? 'es' : ''}
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-[10px] text-gray-500">{m.vaga.partner?.name || '-'}</p>
                                    </td>
                                    <td className="px-3 py-4">
                                      <div className="flex flex-wrap gap-1.5">
                                        {m.vagaTags.map((tag, i) => {
                                          const isMatch = m.matchedTags.includes(tag.toLowerCase());
                                          return (
                                            <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${isMatch ? 'bg-green-50 text-green-700 border-green-200 shadow-sm shadow-green-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                              {tag}
                                            </span>
                                          );
                                        })}
                                        {m.vagaTags.length === 0 && <span className="text-xs text-gray-400 italic">Sem tags registradas</span>}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                                {matchedVagas.length === 0 && (
                                  <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-sm font-semibold text-gray-500">
                                      Nenhuma vaga avaliada ou lista vazia.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* LISTA DE VAGAS / CANDIDATOS */}
      {
        activeTab !== 'ats' && (
          <div className="flex-1 flex flex-col min-h-0">
            {loading ? (
              <div className="flex justify-center items-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center border border-red-100 shadow-sm">
                <AlertCircle className="h-8 w-8 text-red-500 mb-3" />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            ) : (activeTab === 'abertas' || activeTab === 'fechadas') && filteredVagas.filter(v => activeTab === 'fechadas' ? v.status === 'Fechada' : (v.status === 'Aberta' || v.status === 'Congelada' || v.status === 'Aguardando Autorização')).length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-16 flex flex-col items-center justify-center text-center">
                  <div className="p-4 rounded-full bg-blue-50 mb-4">
                    <Briefcase className="h-12 w-12 text-[#1e3a8a] opacity-20" />
                  </div>
                  <h2 className="text-xl font-black text-[#0a192f]">Nenhuma vaga {activeTab === 'fechadas' ? 'fechada' : 'aberta'} encontrada</h2>
                  <p className="text-gray-500 max-w-sm mt-2">
                    {searchTerm ? 'Tente ajustar os termos da sua busca.' : activeTab === 'abertas' ? 'Clique no botão acima para abrir nova vaga.' : ''}
                  </p>
                </div>
              </div>
            ) : (activeTab === 'talentos' || activeTab === 'reprovados') && (activeTab === 'talentos' ? filteredCandidatos.filter((c: any) => c.status_selecao !== 'Reprovado') : filteredCandidatos.filter((c: any) => c.status_selecao === 'Reprovado')).length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-16 flex flex-col items-center justify-center text-center">
                  <div className="p-4 rounded-full bg-blue-50 mb-4">
                    <Users className="h-12 w-12 text-[#1e3a8a] opacity-20" />
                  </div>
                  <h2 className="text-xl font-black text-[#0a192f]">Nenhum candidato {activeTab === 'reprovados' ? 'reprovado ' : ''}encontrado</h2>
                  <p className="text-gray-500 max-w-sm mt-2">
                    {searchTerm ? 'Tente ajustar os termos da sua busca.' : 'Nenhum registro para exibir nesta aba.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-[400px]">
                {(activeTab === 'talentos' || activeTab === 'reprovados') && selectedCandidates.length > 0 && (
                  <div className="bg-blue-50 px-5 py-3 flex items-center justify-between border border-blue-100 rounded-t-xl shrink-0">
                    <span className="text-sm font-bold text-[#1e3a8a]">{selectedCandidates.length} candidato(s) selecionado(s)</span>
                    <button onClick={handleShareSelected} className="flex items-center gap-2 bg-[#1e3a8a] text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-[#112240] transition-colors shadow-sm">
                      <Share2 className="w-4 h-4" /> Compartilhar Perfis
                    </button>
                  </div>
                )}
                <div className={`bg-white shadow-sm border border-gray-100 flex-1 flex flex-col overflow-x-auto ${(activeTab === 'talentos' || activeTab === 'reprovados') && selectedCandidates.length > 0 ? 'rounded-b-xl border-t-0' : 'rounded-xl'}`}>
                  {activeTab === 'talentos' || activeTab === 'reprovados' ? (
                    <table className="w-full min-w-max text-left border-collapse">
                      <thead className="bg-[#1e3a8a]">
                        <tr>
                          <th className="px-4 py-3 w-10 rounded-tl-xl text-center">
                            <input
                              type="checkbox"
                              className="rounded border-white/30 bg-white/10 text-blue-500 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                              checked={selectedCandidates.length > 0 && selectedCandidates.length === (activeTab === 'talentos' ? filteredCandidatos.filter((c: any) => c.status_selecao !== 'Reprovado') : filteredCandidatos.filter((c: any) => c.status_selecao === 'Reprovado')).length}
                              onChange={(e) => {
                                const list = activeTab === 'talentos' ? filteredCandidatos.filter((c: any) => c.status_selecao !== 'Reprovado') : filteredCandidatos.filter((c: any) => c.status_selecao === 'Reprovado');
                                if (e.target.checked) setSelectedCandidates(list.map((c: any) => c.id));
                                else setSelectedCandidates([]);
                              }}
                            />
                          </th>
                          <th className="px-2 py-3 text-[10px] font-black text-white uppercase tracking-wider w-32 whitespace-nowrap text-left">ID</th>
                          <th className="px-3 py-3 text-[10px] font-black text-white uppercase tracking-wider min-w-[200px] whitespace-nowrap text-left">Nome</th>
                          <th className="px-3 py-3 text-[10px] font-black text-white uppercase tracking-wider min-w-[150px] whitespace-nowrap text-left">Cargo Pretendido</th>
                          <th className="px-3 py-3 text-[10px] font-black text-white uppercase tracking-wider min-w-[120px] whitespace-nowrap text-left">Local</th>
                          <th className="px-3 py-3 text-[10px] font-black text-white uppercase tracking-wider w-24 whitespace-nowrap text-center">Entrevistado?</th>
                          <th className="px-3 py-3 text-[10px] font-black text-white uppercase tracking-wider min-w-[120px] whitespace-nowrap text-center">Data da entrevista</th>
                          <th className="px-3 py-3 text-[10px] font-black text-white uppercase tracking-wider text-right rounded-tr-xl w-16 whitespace-nowrap">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(activeTab === 'talentos' ? filteredCandidatos.filter((c: any) => c.status_selecao !== 'Reprovado') : filteredCandidatos.filter((c: any) => c.status_selecao === 'Reprovado')).map((c: any) => {
                          const hasHistoricInterview = c.candidato_historico?.some((h: any) => h.tipo === 'Entrevista');
                          const hasInterview = hasHistoricInterview || !!c.entrevista_dados?.data_entrevista;

                          const interviewDates = c.candidato_historico
                            ?.filter((h: any) => h.tipo === 'Entrevista')
                            .map((h: any) => h.entrevista_data || h.data_registro || null)
                            .filter(Boolean)
                            .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime()) || [];

                          if (c.entrevista_dados?.data_entrevista) {
                            interviewDates.push(c.entrevista_dados.data_entrevista);
                            interviewDates.sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
                          }

                          const lastInterviewDateRaw = interviewDates.length > 0 ? interviewDates[0] : null;


                          // Ocultar se já for colaborador (estamos em uma página de recrutamento/vagas ativos)
                          // Nota: Precisamos carregar a lista de IDs de candidatos que já são integrantees se quisermos ser precisos,
                          // ou checar se existe um colaborador vinculado via query mais robusta. 
                          // Para o MVP solicitado: "Quando o candidato é aprovado, pode retirar da lista de talentos"
                          // Vou assumir que se ele está marcado como "Aprovado" ou vinculado a uma vaga fechada, ou se já existe na tabela de collaborators.
                          // Vou precisar atualizar a query inicial de fetchCandidatos para trazer essa info.

                          const roleName = roleOptions.find(r => String(r.value) === String(c.role))?.label || c.role || '-';
                          const localName = locationOptions.find(l => String(l.value) === String(c.local))?.label || c.local || '-';
                          const appearance = getRoleAppearance(roleName, '', c.area);
                          const IconComponent = appearance.Icon;

                          return (
                            <tr key={c.id} onClick={() => handleOpenCandidatoViewModal(c.id)} className={`hover:bg-blue-50/50 cursor-pointer transition-colors group ${activeTab === 'reprovados' ? 'bg-red-50/30' : ''} ${selectedCandidates.includes(c.id) ? 'bg-blue-50/80' : ''}`}>
                              <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-[#1e3a8a] focus:ring-[#1e3a8a] h-4 w-4 cursor-pointer"
                                  checked={selectedCandidates.includes(c.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedCandidates(prev => [...prev, c.id]);
                                    else setSelectedCandidates(prev => prev.filter(id => id !== c.id));
                                  }}
                                />
                              </td>
                              <td className="px-2 py-4 whitespace-nowrap text-left">
                                <span className="inline-flex items-center justify-center px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-black tracking-widest uppercase">{c.candidato_id_text || 'Sem ID'}</span>
                              </td>
                              <td className="px-3 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`flex-shrink-0 h-10 w-10 md:h-12 md:w-12 rounded-full overflow-hidden flex items-center justify-center border-2 border-white shadow-sm transition-all ${appearance.colorClass}`}>
                                    <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-white stroke-[2.5px] drop-shadow-sm" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-sm text-[#0a192f] truncate w-full max-w-[250px]">{toTitleCase(c.nome)}</p>
                                    {(c.email || c.telefone) && (
                                      <p className="text-[10px] text-gray-500 truncate w-full max-w-[250px]">{c.email || c.telefone}</p>
                                    )}
                                    {activeTab === 'reprovados' && c.motivo_reprovacao && (
                                      <p className="text-[10px] text-red-600 font-bold mt-1 bg-red-100 p-1 rounded inline-block">Motivo: {c.motivo_reprovacao}</p>
                                    )}
                                    {c.perfil && c.perfil.split('\n').filter((l: string) => l.trim()).length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        <span className="px-1.5 py-0.5 bg-blue-50/50 text-blue-600 border border-blue-100/50 rounded text-[8px] font-bold uppercase tracking-wider">
                                          {c.perfil.split('\n').filter((l: string) => l.trim()).length} tag{c.perfil.split('\n').filter((l: string) => l.trim()).length !== 1 ? 's' : ''}
                                        </span>
                                      </div>
                                    )}
                                    {/* Indicador de Avaliação do Líder */}
                                    {c.avaliacao_lider && (
                                      <div className={`mt-2 mb-1 inline-flex items-center gap-1 group/badge px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border transition-colors ${c.avaliacao_lider === 'Recomendado'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-red-50 text-red-700 border-red-200'
                                        }`} title={c.obs_lider ? `Observações do Líder:\n${c.obs_lider}` : 'Avaliado pelo Líder via link seguro'}>
                                        {c.avaliacao_lider === 'Recomendado' ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                                        Líder: {c.avaliacao_lider}
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleRemoveFeedback(c.id, c.nome); }}
                                          className={`ml-1 hover:text-red-500 transition-colors opacity-0 group-hover/badge:opacity-100 ${c.avaliacao_lider === 'Recomendado' ? 'text-emerald-400' : 'text-red-400'}`}
                                          title="Ocultar Avaliação do Líder"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">
                                {roleName}
                              </td>
                              <td className="px-3 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">
                                {localName}
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                {hasInterview ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border bg-green-50 text-green-700 border-green-200">
                                    <CheckCircle2 className="w-3 h-3" /> Sim
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border bg-gray-50 text-gray-600 border-gray-200">
                                    Não
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap text-center">
                                {lastInterviewDateRaw ? formatDateToDisplay(lastInterviewDateRaw) : '-'}
                              </td>
                              <td className="px-3 py-3 text-right whitespace-nowrap">
                                <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={async (e) => {
                                      e.stopPropagation();
                                      const slugFallback = c.slug || (c.nome ? c.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : c.id);
                                      const profileUrl = `${window.location.origin}/candidato/perfil/${slugFallback}`;
                                      const cargo = roleOptions.find(r => String(r.value) === String(c.role))?.label || c.role || '-';
                                      
                                      const htmlCard = `
                                        <div style="font-family: Arial, sans-serif; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; max-width: 500px; background-color: #f8fafc;">
                                          <h3 style="margin: 0 0 8px 0; color: #1e3a8a; font-size: 18px;">${c.nome}</h3>
                                          <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px;"><strong>Cargo/Área:</strong> ${cargo}</p>
                                          <table border="0" cellspacing="0" cellpadding="0" style="margin-top: 12px;">
                                            <tr>
                                              <td align="center" style="border-radius: 6px;" bgcolor="#1e3a8a">
                                                <a href="${profileUrl}" target="_blank" style="font-size: 14px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 6px; padding: 10px 16px; border: 1px solid #1e3a8a; display: inline-block; font-weight: bold;">
                                                  Acessar Perfil Completo
                                                </a>
                                              </td>
                                            </tr>
                                          </table>
                                        </div>
                                      `;
                                      const htmlBody = `
                                        <div style="font-family: Arial, sans-serif; color: #334155;">
                                          <p>Olá,</p>
                                          <p>Segue abaixo o perfil do talento para sua avaliação:</p>
                                          ${htmlCard}
                                          <p>Atenciosamente,<br><strong>Equipe de RH</strong></p>
                                        </div>
                                      `;
                                      const textBody = `Olá,\n\nSegue o link para o perfil consolidado do(a) candidato(a) ${c.nome}:\n\n${profileUrl}\n\nAtenciosamente,\nEquipe de RH`;
                                      
                                      const subject = encodeURIComponent(`Perfil de Candidato - ${c.nome}`);
                                      
                                      try {
                                        const htmlBlob = new Blob([htmlBody], { type: 'text/html' });
                                        const textBlob = new Blob([textBody], { type: 'text/plain' });
                                        const clipboardItem = new ClipboardItem({
                                          'text/html': htmlBlob,
                                          'text/plain': textBlob
                                        });
                                        await navigator.clipboard.write([clipboardItem]);
                                        showAlert('Copiado com Sucesso! ✨', 'O perfil foi copiado com um layout elegante para e-mail. Um rascunho será aberto, basta colar (Ctrl+V) no corpo do e-mail!', 'success');
                                        
                                        window.open(`mailto:?subject=${subject}`, '_blank');
                                      } catch (err) {
                                        console.error('Erro ao copiar HTML para clipboard:', err);
                                        const body = encodeURIComponent(textBody);
                                        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                                      }
                                    }} 
                                    className="p-1.5 text-emerald-600 text-xs hover:bg-emerald-50 rounded-xl transition-all hover:scale-110 active:scale-95"
                                    title="Compartilhar Perfil Público"
                                  >
                                    <Share2 className="h-4 w-4" />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleOpenCandidatoModal(c.id); }} className="p-1.5 text-[#1e3a8a] text-xs hover:bg-[#1e3a8a]/10 rounded-xl transition-all hover:scale-110 active:scale-95"><Edit2 className="h-4 w-4" /></button>
                                  <button onClick={(e) => handleDeleteCandidato(c.id, e)} className="p-1.5 text-red-600 text-xs hover:bg-red-50 rounded-xl transition-all hover:scale-110 active:scale-95"><Trash2 className="h-4 w-4" /></button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full min-w-max text-left border-collapse">
                      <thead className="bg-[#1e3a8a]">
                        <tr>
                          <th className="px-3 py-3 text-[10px] font-black text-white uppercase tracking-wider rounded-tl-xl w-20 whitespace-nowrap">ID</th>
                          <th className="px-3 py-3 text-[10px] font-black text-white uppercase tracking-wider min-w-[200px] whitespace-nowrap">Vaga (Cargo)</th>
                          <th className="px-3 py-3 text-[10px] font-black text-white uppercase tracking-wider min-w-[120px] whitespace-nowrap">Atuação</th>
                          <th className="px-3 py-3 text-[10px] font-black text-white uppercase tracking-wider w-24 whitespace-nowrap">Abertura</th>
                          <th className="px-3 py-3 text-[10px] font-black text-white uppercase tracking-wider w-28 whitespace-nowrap">SLA / Aberto</th>
                          <th className="px-3 py-3 text-[10px] font-black text-white uppercase tracking-wider w-24 whitespace-nowrap">{activeTab === 'fechadas' ? 'Fechamento' : 'Prazo'}</th>
                          {activeTab === 'fechadas' && <th className="px-3 py-3 text-[10px] font-black text-white uppercase tracking-wider min-w-[150px] whitespace-nowrap">Candidato Aprovado</th>}
                          <th className="px-3 py-3 text-[10px] font-black text-white uppercase tracking-wider min-w-[100px] whitespace-nowrap">Local</th>
                          <th className="px-3 py-3 text-[10px] font-black text-white uppercase tracking-wider min-w-[140px] whitespace-nowrap">Líder Direto</th>
                          <th className="px-3 py-3 text-[10px] font-black text-white uppercase tracking-wider w-28 whitespace-nowrap">Status</th>
                          <th className="px-3 py-3 text-[10px] font-black text-white uppercase tracking-wider text-right rounded-tr-xl w-16 whitespace-nowrap">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredVagas.filter(v => activeTab === 'fechadas' ? v.status === 'Fechada' : (v.status === 'Aberta' || v.status === 'Congelada' || v.status === 'Aguardando Autorização')).sort((a, b) => {
                          if (activeTab === 'abertas') {
                            const order: Record<string, number> = { 'Aberta': 0, 'Aguardando Autorização': 1, 'Congelada': 2 };
                            return (order[a.status] ?? 3) - (order[b.status] ?? 3);
                          }
                          return 0;
                        }).map(vaga => (
                          <tr key={vaga.id} onClick={() => handleOpenViewModal(vaga.id)} className="hover:bg-blue-50/50 cursor-pointer transition-colors group">
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-black tracking-widest uppercase">{vaga.vaga_id_text || 'Sem ID'}</span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                {(() => {
                                  const atuacaoStr = typeof vaga.atuacao === 'string' ? vaga.atuacao : (vaga.atuacao?.name || '');
                                  const appearance = getRoleAppearance(vaga.role?.name || '', atuacaoStr, vaga.area);
                                  const IconComponent = appearance.Icon;
                                  
                                  const isAberta = vaga.status === 'Aberta';
                                  const colorClass = isAberta ? appearance.colorClass : 'bg-gray-50 text-gray-400 border-gray-200';
                                  
                                  return (
                                    <div className={`flex-shrink-0 h-10 w-10 md:h-12 md:w-12 rounded-2xl overflow-hidden flex items-center justify-center border shadow-sm ring-2 ring-white ${colorClass}`}>
                                      <IconComponent className="w-5 h-5 stroke-[2.5px] drop-shadow-sm" />
                                    </div>
                                  );
                                })()}
                                <div className="flex flex-col gap-1.5 max-w-[200px]">
                                  <div className="flex items-center gap-2 truncate">
                                    <p className={`font-bold text-[13px] truncate ${vaga.sigilosa ? 'text-red-600' : 'text-[#0a192f]'}`}>{vaga.role?.name || 'Cargo não definido'}</p>
                                    {vaga.sigilosa && (
                                      <span className="text-[8px] shrink-0 bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded uppercase font-black tracking-widest">Sigilosa</span>
                                    )}
                                  </div>
                                  {vaga.perfil && vaga.perfil.split('\n').filter((l: string) => l.trim()).length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      <span className="px-1.5 py-0.5 bg-green-50/50 text-green-700 border border-green-200/50 rounded text-[8px] font-bold uppercase tracking-wider">
                                        {vaga.perfil.split('\n').filter((l: string) => l.trim()).length} tag{vaga.perfil.split('\n').filter((l: string) => l.trim()).length !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-xs font-medium text-gray-700 whitespace-nowrap">
                              {/* TODO: check if atuacao_id should be string or not, if not wait, it's atuacao?.name */}
                              {typeof vaga.atuacao === 'string' ? vaga.atuacao : (vaga.atuacao?.name || '-')}
                            </td>
                            <td className="px-3 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">
                              {vaga.data_abertura ? new Date(vaga.data_abertura).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}
                            </td>
                            <td className="px-3 py-3 text-xs font-semibold text-[#1e3a8a] whitespace-nowrap">
                              <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 w-max shrink-0">
                                <Clock className="w-3.5 h-3.5 text-blue-500" />
                                {calculateTempoAberto(vaga.data_abertura, vaga.status === 'Fechada' ? vaga.data_fechamento : undefined)}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">
                              {activeTab === 'fechadas'
                                ? (vaga.data_fechamento ? new Date(vaga.data_fechamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-')
                                : (vaga.data_prazo ? new Date(vaga.data_prazo).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-')
                              }
                            </td>
                            {activeTab === 'fechadas' && (
                              <td className="px-3 py-3 text-xs font-bold text-[#1e3a8a] whitespace-nowrap">
                                {(vaga as any).candidato_aprovado?.nome || '-'}
                              </td>
                            )}
                            <td className="px-3 py-3 text-xs font-medium text-gray-700 whitespace-nowrap">
                              {vaga.location?.name || '-'}
                            </td>
                            <td className="px-3 py-3 text-xs font-medium text-gray-700 whitespace-nowrap">
                              <div className="max-w-[140px] truncate">
                                {vaga.leader?.name || '-'}
                              </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border ${vaga.status === 'Aberta' ? 'bg-green-50 text-green-700 border-green-200' : vaga.status === 'Congelada' ? 'bg-amber-50 text-amber-700 border-amber-200' : vaga.status === 'Aguardando Autorização' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                {vaga.status}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right whitespace-nowrap">
                              <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); handleOpenModal(vaga.id) }} className="p-1.5 text-[#1e3a8a] text-xs hover:bg-[#1e3a8a]/10 rounded-xl transition-all hover:scale-110 active:scale-95"><Edit2 className="h-4 w-4" /></button>
                                <button onClick={(e) => handleDeleteVaga(vaga.id, e)} className="p-1.5 text-red-600 text-xs hover:bg-red-50 rounded-xl transition-all hover:scale-110 active:scale-95"><Trash2 className="h-4 w-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )
            }
          </div>
        )
      }

      <VagaFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        vagaId={selectedVagaId}
        initialTab={editInitialTab}
        onSuccess={() => {
          fetchVagas();
          fetchCandidatos();
        }}
      />

      <VagaFormModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        vagaId={selectedVagaId}
        viewMode={true}
        onEdit={(id: string, tab?: number) => {
          handleCloseViewModal()
          handleOpenModal(id, tab)
        }}
      />

      <CandidatoFormModal
        isOpen={isCandidatoModalOpen}
        onClose={handleCloseCandidatoModal}
        candidatoId={selectedCandidatoId}
        initialData={candidatoInitialData}
        initialFile={candidatoInitialFile}
        initialTab={candidatoEditInitialTab}
        onSave={() => {
          fetchVagas();
          fetchCandidatos();
        }}
      />

      <CandidatoFormModal
        isOpen={isCandidatoViewModalOpen}
        onClose={handleCloseCandidatoViewModal}
        candidatoId={selectedCandidatoId}
        viewMode={true}
        onEdit={(id, tab) => handleOpenCandidatoModal(id, tab)}
        onSave={() => {
          fetchVagas();
          fetchCandidatos();
        }}
      />

      <VagasSelectionModal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        onSelect={handleSelection}
      />

      {/* Confirm Delete Vaga */}
      <AlertModal
        isOpen={!!pendingDeleteVaga}
        onClose={() => setPendingDeleteVaga(null)}
        title="Excluir Vaga"
        description="Tem certeza que deseja excluir esta vaga? Todos os dados vinculados a ela poderão ser perdidos."
        variant="error"
        confirmText="Excluir"
        onConfirm={confirmDeleteVaga}
      />

      {/* Confirm Delete Candidato */}
      <AlertModal
        isOpen={!!pendingDeleteCandidato}
        onClose={() => setPendingDeleteCandidato(null)}
        title="Excluir Candidato"
        description="Tem certeza que deseja excluir este candidato permanentemente?"
        variant="error"
        confirmText="Excluir"
        onConfirm={confirmDeleteCandidato}
      />

      {/* Confirm Remove Feedback */}
      <AlertModal
        isOpen={!!pendingRemoveFeedback}
        onClose={() => setPendingRemoveFeedback(null)}
        title="Remover Avaliação"
        description={`Deseja remover a avaliação do líder do destaque para o candidato ${pendingRemoveFeedback?.name}?`}
        variant="warning"
        confirmText="Remover"
        onConfirm={confirmRemoveFeedback}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        description={alertConfig.description}
        variant={alertConfig.variant}
        confirmText="OK"
      />
    </div>
  )
}

export default RHVagas




