import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus, X, Trash2, Pencil, Save, Users, UserX,
  Calendar, Building2, Mail, Loader2, UserPlus,
  GraduationCap, Briefcase, Files, User, BookOpen, FileSpreadsheet, FileDown, Bus, Clock,
  Link as LinkIcon, Copy, CheckCircle2, RefreshCcw, FilterX, BellRing, Tag as TagIcon, ChevronDown, ChevronRight, TableIcon,
  ArrowRight, ArrowLeft, Filter
} from 'lucide-react'

import { exportColaboradoresXLSX, exportVTXLSX } from '../utils/exportColaboradores'
import { supabase } from '../../../lib/supabase'
import { logAction } from '../../../lib/logger'


import { FilterBar, FilterCategory } from '../components/FilterBar'
import { Collaborator, Partner, GEDDocument } from '../../../types/controladoria'
import { AlertModal } from '../../ui/AlertModal'
import { ConfirmationModal } from '../../ui/ConfirmationModal'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { useDatabaseSync } from '../../../hooks/useDatabaseSync'
import { getWorkingDaysInCurrentMonth } from '../utils/colaboradoresUtils';

import { DadosPessoaisSection } from '../components/DadosPessoaisSection'
import { EnderecoSection } from '../components/EnderecoSection'
import { InformacoesProfissionaisSection } from '../components/InformacoesProfissionaisSection'
import { OABSection } from '../components/OABSection'
import { DadosEscolaridadeSection } from '../components/DadosEscolaridadeSection'
import { DadosCorporativosSection } from '../components/DadosCorporativosSection'
import { GEDSection } from '../components/GEDSection'
import { PhotoUploadSection } from '../components/PhotoUploadSection'
import { HistoricoSection } from '../components/HistoricoSection'
import { PeriodoAusenciasSection } from '../components/PeriodoAusenciasSection'
import PerfilSection from '../components/PerfilSection'
import { TabelasTab } from '../components/TabelasTab'
import { CollaboratorModalLayout, CollaboratorPageLayout } from '../components/CollaboratorLayouts'
import { ExportColumnSelectModal } from '../components/ExportColumnSelectModal'
import { ReportTemplatesList, ReportTemplate } from '../components/ReportTemplatesList'
import { useAuth } from '../../../contexts/AuthContext'
import { useLocation } from 'react-router-dom'
import { getSegment } from '../utils/rhChartUtils'

import {
  ESTADOS_BRASIL,
  toTitleCase,
  maskCEP,
  maskCPF,
  maskDate,
  maskRG,
  maskPhone,
  maskCNPJ,
  formatDateToDisplay,
  formatDateToISO,
  formatMonthYearDateToDisplay,
  formatMonthYearDateToISO,
  formatDbMoneyToDisplay,
  parseCurrency
} from '../utils/colaboradoresUtils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LabelList
} from 'recharts'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface Role { id: string | number; name: string }
interface Location { id: string | number; name: string }


interface ColaboradoresProps {
  userName?: string
  onModuleHome?: () => void
  onLogout?: () => void
}




export function Colaboradores({ }: ColaboradoresProps) {
  const { user, userRole } = useAuth();
  const isReadOnly = userRole === 'readonly';
  const [colaboradores, setColaboradores] = useState<Collaborator[]>([])
  const [partners, setPartners] = useState<Partial<Partner>[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([])

  // Scroll Position State
  const listContainerRef = useRef<HTMLDivElement>(null)
  const [savedScrollPosition, setSavedScrollPosition] = useState<number>(0)

  // Lookup Tables State
  const [rateios, setRateios] = useState<{ id: string; name: string }[]>([])
  const [hiringReasons, setHiringReasons] = useState<{ id: string; name: string }[]>([])
  const [terminationInitiatives, setTerminationInitiatives] = useState<{ id: string; name: string }[]>([])
  const [terminationTypes, setTerminationTypes] = useState<{ id: string; name: string }[]>([])
  const [terminationReasons, setTerminationReasons] = useState<{ id: string; name: string }[]>([])
  const [atuacoes, setAtuacoes] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [selectedColaborador, setSelectedColaborador] = useState<Collaborator | null>(null)
  const [activeDetailTab, setActiveDetailTab] = useState(1)
  const [activeFormTab, setActiveFormTab] = useState(1)

  // Magic Link State
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [generatedLinks, setGeneratedLinks] = useState<{ name: string, url: string }[]>([])
  const [showLinksModal, setShowLinksModal] = useState(false)
  const [generatingLinks, setGeneratingLinks] = useState(false)
  const [sendingEmailStatus, setSendingEmailStatus] = useState<Record<number, boolean>>({})
  const [showUpdatedOnly, setShowUpdatedOnly] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterLider, setFilterLider] = useState<string[]>([])
  const [filterPartner, setFilterPartner] = useState<string[]>([])
  const [filterLocal, setFilterLocal] = useState<string[]>([])
  const [filterCargo, setFilterCargo] = useState<string[]>([])

  // New Tabs State
  const [activeMainTab, setActiveMainTab] = useState<'Integrantes' | 'Relatórios' | 'Tabelas'>('Integrantes');
  const [showExportVTMenu, setShowExportVTMenu] = useState(false);
  const [activeReportView, setActiveReportView] = useState<'menu' | 'filtros' | 'vt' | 'modelos'>('menu');
  const [showColumnSelectModal, setShowColumnSelectModal] = useState(false);
  const [exportTargetList, setExportTargetList] = useState<'active' | 'inactive' | 'all' | 'search' | null>(null);
  const [refreshTemplates, setRefreshTemplates] = useState(0);

  // Advanced Filters State
  // Pessoais
  const [advFilterGender, setAdvFilterGender] = useState('');
  const [advFilterBirthStart, setAdvFilterBirthStart] = useState('');
  const [advFilterBirthEnd, setAdvFilterBirthEnd] = useState('');
  const [advFilterChildren, setAdvFilterChildren] = useState<'sim' | 'nao' | ''>('');
  const [advFilterStateHome, setAdvFilterStateHome] = useState('');

  // Corporativos
  const [advFilterStatus, setAdvFilterStatus] = useState<'active' | 'inactive' | ''>('');
  const [advFilterRateio, setAdvFilterRateio] = useState('');
  const [advFilterAdmissionStart, setAdvFilterAdmissionStart] = useState('');
  const [advFilterAdmissionEnd, setAdvFilterAdmissionEnd] = useState('');
  const [advFilterTerminationStart, setAdvFilterTerminationStart] = useState('');
  const [advFilterTerminationEnd, setAdvFilterTerminationEnd] = useState('');
  const [advFilterActivePeriodStart, setAdvFilterActivePeriodStart] = useState('');
  const [advFilterActivePeriodEnd, setAdvFilterActivePeriodEnd] = useState('');
  const [advFilterPartner, setAdvFilterPartner] = useState('');
  const [advFilterLeader, setAdvFilterLeader] = useState('');
  const [advFilterArea, setAdvFilterArea] = useState('');
  const [advFilterTeam, setAdvFilterTeam] = useState('');
  const [advFilterRole, setAdvFilterRole] = useState('');
  const [advFilterContractType, setAdvFilterContractType] = useState('');
  const [advFilterPartnerType, setAdvFilterPartnerType] = useState('');
  const [advFilterLocal, setAdvFilterLocal] = useState('');
  const [advFilterTransporteTipo, setAdvFilterTransporteTipo] = useState('');
  const [advFilterSegment, setAdvFilterSegment] = useState('');

  // Escolares
  const [advFilterGraduationComplete, setAdvFilterGraduationComplete] = useState<'sim' | 'nao' | ''>('');
  const [advFilterPostGraduationComplete, setAdvFilterPostGraduationComplete] = useState<'sim' | 'nao' | ''>('');

  const [advFilterGraduationExpected, setAdvFilterGraduationExpected] = useState('');
  const [advFilterGraduationCompletion, setAdvFilterGraduationCompletion] = useState('');
  const [advFilterGraduationUF, setAdvFilterGraduationUF] = useState('');
  const [advFilterGraduationInstitution, setAdvFilterGraduationInstitution] = useState('');

  const [advFilterPostGraduationExpected, setAdvFilterPostGraduationExpected] = useState('');
  const [advFilterPostGraduationCompletion, setAdvFilterPostGraduationCompletion] = useState('');
  const [advFilterPostGraduationUF, setAdvFilterPostGraduationUF] = useState('');
  const [advFilterPostGraduationInstitution, setAdvFilterPostGraduationInstitution] = useState('');

  // Custom VT Scenarios State
  const [customVt1, setCustomVt1] = useState<number>(200);
  const [customVt2, setCustomVt2] = useState<number>(300);

  // Expanded States for VT Tables
  const [isVtEstagioExpanded, setIsVtEstagioExpanded] = useState(false);
  const [isVtCltExpanded, setIsVtCltExpanded] = useState(false);

  const vtReportRef = useRef<HTMLDivElement>(null);
  const [exportingPDF, setExportingPDF] = useState(false);

  const location = useLocation()

  useEffect(() => {
    if (location.state) {
      let changed = false;

      // Filter by Role
      if (location.state.roleFilter && roles.length > 0) {
        const roleFilterStr = location.state.roleFilter;
        if (roleFilterStr === 'Não definido') {
          setFilterCargo(['unassigned']);
        } else {
          const foundRole = roles.find(r => r.name === roleFilterStr);
          if (foundRole) {
            setFilterCargo([String(foundRole.id)]);
          }
        }
        changed = true;
      }

      // Filter by Leader/Sócio
      if (location.state.leaderFilter && partners.length > 0) {
        const leaderStr = location.state.leaderFilter;
        const foundLeader = partners.find(p => p.name === leaderStr);
        if (foundLeader) {
          setAdvFilterLeader(String(foundLeader.id));
        }
        changed = true;
      }

      // Filter by Segment
      if (location.state.segmentFilter) {
        setAdvFilterSegment(location.state.segmentFilter);
        changed = true;
      }

      // Filter by Local
      if (location.state.localFilter && locations.length > 0) {
        const localStr = location.state.localFilter;
        const foundLocal = locations.find(l => l.name === localStr);
        if (foundLocal) {
          setAdvFilterLocal(String(foundLocal.id));
        }
        changed = true;
      }

      // Filter by Gender
      if (location.state.genderFilter) {
        let genderCode = '';
        if (location.state.genderFilter === 'Masculino') genderCode = 'M';
        if (location.state.genderFilter === 'Feminino') genderCode = 'F';
        if (genderCode) {
          setAdvFilterGender(genderCode);
        }
        changed = true;
      }

      if (changed) {
        setActiveMainTab('Integrantes');
        // Custom cleanup replacing state
        const newState = { ...location.state };
        delete newState.roleFilter;
        delete newState.leaderFilter;
        delete newState.segmentFilter;
        delete newState.localFilter;
        delete newState.genderFilter;
        window.history.replaceState(newState, document.title);
      }
    }
    if (location.state?.cadastrarCandidato) {
      const candidato = location.state.cadastrarCandidato;
      setFormData({
        ...candidato,
        birthday: formatDateToDisplay(candidato.birthday),
        hire_date: formatDateToDisplay(candidato.hire_date),
        termination_date: formatDateToDisplay(candidato.termination_date),
        termino_contrato_estagio: formatDateToDisplay(candidato.termino_contrato_estagio),
        escolaridade_previsao_conclusao: formatDateToDisplay(candidato.escolaridade_previsao_conclusao),
        previsao_formatura: formatMonthYearDateToDisplay(candidato.previsao_formatura),
        bolsa_valor: formatDbMoneyToDisplay(candidato.bolsa_valor),
        vr_valor: formatDbMoneyToDisplay(candidato.vr_valor),
        children_data: candidato.children_data?.map((child: any) => ({
          ...child,
          birth_date: formatDateToDisplay(child.birth_date)
        })) || [],
        education_history: candidato.education_history?.map((edu: any) => ({
          ...edu,
          previsao_conclusao: formatDateToDisplay(edu.previsao_conclusao)
        })) || []
      });
      setShowFormModal(true);
      setActiveMainTab('Integrantes');
      // Clear the state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state, roles, partners])

  const handleClearAdvancedFilters = () => {
    setAdvFilterGender('');
    setAdvFilterBirthStart('');
    setAdvFilterBirthEnd('');
    setAdvFilterChildren('');
    setAdvFilterStateHome('');
    setAdvFilterStatus('');
    setAdvFilterRateio('');
    setAdvFilterAdmissionStart('');
    setAdvFilterAdmissionEnd('');
    setAdvFilterTerminationStart('');
    setAdvFilterTerminationEnd('');
    setAdvFilterActivePeriodStart('');
    setAdvFilterActivePeriodEnd('');
    setAdvFilterPartner('');
    setAdvFilterLeader('');
    setAdvFilterArea('');
    setAdvFilterTeam('');
    setAdvFilterRole('');
    setAdvFilterContractType('');
    setAdvFilterPartnerType('');
    setAdvFilterLocal('');
    setAdvFilterTransporteTipo('');
    setAdvFilterSegment('');
    setAdvFilterGraduationComplete('');
    setAdvFilterPostGraduationComplete('');
    setAdvFilterGraduationComplete('');
    setAdvFilterPostGraduationComplete('');
    setAdvFilterGraduationExpected('');
    setAdvFilterGraduationCompletion('');
    setAdvFilterGraduationUF('');
    setAdvFilterGraduationInstitution('');
    setAdvFilterPostGraduationExpected('');
    setAdvFilterPostGraduationCompletion('');
    setAdvFilterPostGraduationUF('');
    setAdvFilterPostGraduationInstitution('');
  };

  // --- HR Notifications Logic ---
  const HR_EMAILS = [
    'tatiana.gomes@salomaoadv.com.br',
    'kaua.mombrine@salomaoadv.com.br',
    'karina.prazeres@salomaoadv.com.br',
    'teste@salomaoadv.com.br'
  ];
  const isHRUser = user?.email && HR_EMAILS.includes(user.email.toLowerCase());

  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [hasShownInitialModal, setHasShownInitialModal] = useState(false);

  const pendingBackpacks = React.useMemo(() => {
    if (!isHRUser) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return colaboradores
      .filter(c => {
        if (c.status !== 'active' || !c.hire_date || c.mochila_entregue) return false;
        const hireDate = new Date(c.hire_date);
        // Completing exactly 3 months (or more if not delivered)
        const threeMonthsDate = new Date(hireDate);
        threeMonthsDate.setMonth(hireDate.getMonth() + 3);
        threeMonthsDate.setHours(0, 0, 0, 0);

        // Check if the 3-month mark is today or in the past (and not yet delivered)
        return today >= threeMonthsDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.hire_date!);
        dateA.setMonth(dateA.getMonth() + 3);
        const dateB = new Date(b.hire_date!);
        dateB.setMonth(dateB.getMonth() + 3);
        return dateB.getTime() - dateA.getTime(); // Mais recentes primeiro
      });
  }, [colaboradores, isHRUser]);

  const pendingBirthdays = React.useMemo(() => {
    if (!isHRUser) return [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    return colaboradores
      .filter(c => {
        if (c.status !== 'active' || !c.birthday) return false;
        if (c.ultimo_aniversario_parabenizado === currentYear) return false;

        // Extract month and day from YYYY-MM-DD
        const [_, bMonth, bDay] = c.birthday.split('-').map(Number);

        // If the birthday is exactly today and not congratulated yet
        return currentMonth === bMonth && currentDay === bDay;
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [colaboradores, isHRUser]);

  const totalNotifications = pendingBackpacks.length + pendingBirthdays.length;

  useEffect(() => {
    if (isHRUser && totalNotifications > 0 && !hasShownInitialModal && !loading) {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastSeenDate = localStorage.getItem('rh_notifications_last_seen');

      if (lastSeenDate !== todayStr) {
        setShowNotificationsModal(true);
      }
      setHasShownInitialModal(true);
    }
  }, [isHRUser, totalNotifications, hasShownInitialModal, loading]);

  const handleCloseNotifications = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('rh_notifications_last_seen', todayStr);
    setShowNotificationsModal(false);
  };

  const handleMarkBackpackDelivered = async (colabId: string) => {
    try {
      const { error } = await supabase
        .from('collaborators')
        .update({ mochila_entregue: true })
        .eq('id', colabId);

      if (error) throw error;
      setColaboradores(prev => prev.map(c => c.id === colabId ? { ...c, mochila_entregue: true } : c));
    } catch (error) {
      console.error('Error updating backpack status:', error);
    }
  };

  const handleMarkBirthdayCongratulated = async (colabId: string) => {
    try {
      const currentYear = new Date().getFullYear();
      const { error } = await supabase
        .from('collaborators')
        .update({ ultimo_aniversario_parabenizado: currentYear })
        .eq('id', colabId);

      if (error) throw error;
      setColaboradores(prev => prev.map(c => c.id === colabId ? { ...c, ultimo_aniversario_parabenizado: currentYear } : c));
    } catch (error) {
      console.error('Error updating birthday status:', error);
    }
  };


  const hasActiveAdvancedFilters = Object.values({
    advFilterGender, advFilterBirthStart, advFilterBirthEnd, advFilterChildren, advFilterStateHome,
    advFilterStatus, advFilterRateio, advFilterAdmissionStart, advFilterAdmissionEnd, advFilterTerminationStart, advFilterTerminationEnd, advFilterPartner,
    advFilterLeader, advFilterArea, advFilterTeam, advFilterRole, advFilterContractType, advFilterPartnerType, advFilterLocal,
    advFilterTransporteTipo, advFilterGraduationComplete, advFilterPostGraduationComplete,
    advFilterGraduationExpected, advFilterGraduationCompletion, advFilterGraduationUF, advFilterGraduationInstitution,
    advFilterPostGraduationExpected, advFilterPostGraduationCompletion, advFilterPostGraduationUF, advFilterPostGraduationInstitution
  }).some(val => val !== '');

  const getActiveFilterColNames = (): string[] => {
    const cols: string[] = [];
    if (advFilterStatus) cols.push('Status');
    if (advFilterRateio) cols.push('Rateio');
    if (advFilterAdmissionStart || advFilterAdmissionEnd) cols.push('Data Admissão');
    if (advFilterTerminationStart || advFilterTerminationEnd) cols.push('Data Desligamento');
    if (advFilterPartner && advFilterPartner.length > 0) cols.push('Sócio Responsável');
    if (advFilterLeader && advFilterLeader.length > 0) cols.push('Líder Direto');
    if (advFilterArea) cols.push('Área');
    if (advFilterTeam) cols.push('Equipe');
    if (advFilterRole) cols.push('Cargo');
    if (advFilterContractType || advFilterPartnerType) cols.push('Tipo Contrato');
    if (advFilterLocal) cols.push('Local');
    if (advFilterTransporteTipo) cols.push('Tipo Transporte');
    
    if (advFilterGender) cols.push('Gênero');
    if (advFilterBirthStart || advFilterBirthEnd) cols.push('Data Nascimento');
    if (advFilterChildren) cols.push('Possui Filhos?');
    if (advFilterStateHome) cols.push('Estado');
    
    if (advFilterGraduationComplete || advFilterGraduationExpected || advFilterGraduationCompletion || advFilterGraduationUF || advFilterGraduationInstitution || advFilterPostGraduationComplete || advFilterPostGraduationExpected || advFilterPostGraduationCompletion || advFilterPostGraduationUF || advFilterPostGraduationInstitution) {
      cols.push('Nível Escolaridade', 'Instituição', 'Curso');
    }
    return cols;
  };

  const handleApplyTemplate = (template: ReportTemplate) => {
    const tempFiltered = getAdvancedFiltered(''); // applies current filters block
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const dateTimeStr = `${dd}.${mm}.${yyyy} - ${hh}-${min}-${ss}`;
    
    if (tempFiltered.length > 0) {
      exportColaboradoresXLSX({
        filtered: tempFiltered,
        rateios,
        hiringReasons,
        partners,
        colaboradores,
        terminationInitiatives,
        terminationTypes,
        terminationReasons,
        roles,
        locations,
        teams,
        atuacoes,
        fileName: `${template.name} - ${dateTimeStr}`,
        selectedColumns: template.columns,
        activeFilterColNames: getActiveFilterColNames()
      });
    } else {
      setAlertConfig({
        isOpen: true,
        title: 'Sem Dados',
        description: 'Nenhum integrante encontrado com os filtros atuais para exportar este relatório.',
        variant: 'info'
      });
    }
  };

  const handleExportConfirm = async (selectedColumns: string[], templateName?: string) => {
    if (templateName) {
      try {
        const authorNameStr = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
        
        const { error } = await supabase
          .from('rh_export_templates')
          .insert({
            name: templateName,
            columns: selectedColumns,
            created_by: user?.id,
            author_name: authorNameStr
          });
        if (error) throw error;
        setRefreshTemplates(prev => prev + 1);
      } catch (err) {
        console.error('Erro ao salvar template:', err);
      }
    }

    setShowColumnSelectModal(false);
    let tempFiltered: any[] = [];
    let fileName = '';
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const dateTimeStr = `${dd}.${mm}.${yyyy} - ${hh}-${min}-${ss}`;
    const fd = `${dd}-${mm}-${yyyy}`;

    if (exportTargetList === 'search' || exportTargetList === 'all') {
      tempFiltered = getAdvancedFiltered('');
      fileName = templateName ? `${templateName} - ${dateTimeStr}` : `Colaboradores_${fd}`;
    } else if (exportTargetList === 'active') {
      tempFiltered = getAdvancedFiltered('active');
      fileName = `Colaboradores_Ativos_${fd}`;
    } else if (exportTargetList === 'inactive') {
      tempFiltered = getAdvancedFiltered('inactive');
      fileName = `Colaboradores_Inativos_${fd}`;
    }

    if (tempFiltered.length > 0) {
      exportColaboradoresXLSX({
        filtered: tempFiltered,
        rateios,
        hiringReasons,
        partners,
        colaboradores,
        terminationInitiatives,
        terminationTypes,
        terminationReasons,
        roles,
        locations,
        teams,
        atuacoes,
        fileName,
        selectedColumns,
        activeFilterColNames: getActiveFilterColNames()
      });
    }
  };




  // Options for FilterSelect
  const liderOptions = React.useMemo(() => [
    ...colaboradores
      .filter((c: any) => c.is_team_leader)
      .map((c: Collaborator) => ({ label: c.name, value: String(c.id) }))
      .sort((a: any, b: any) => a.label.localeCompare(b.label))
  ], [colaboradores])

  const partnerOptions = React.useMemo(() => [
    ...partners.map((p) => ({ label: p.name || '', value: String(p.id) })).sort((a: any, b: any) => a.label.localeCompare(b.label))
  ], [partners])

  const locationOptions = React.useMemo(() => [
    ...locations.map((l: Location) => ({ label: l.name, value: String(l.id) })).sort((a: any, b: any) => a.label.localeCompare(b.label))
  ], [locations])

  const roleOptions = React.useMemo(() => [
    ...roles.map((r: Role) => ({ label: r.name, value: String(r.id) })).sort((a: any, b: any) => a.label.localeCompare(b.label))
  ], [roles])

  const filterCategories = React.useMemo((): FilterCategory[] => [
    {
      key: 'lider',
      label: 'Líder',
      icon: User,
      type: 'multi',
      options: liderOptions,
      value: filterLider,
      onChange: setFilterLider,
    },
    {
      key: 'partner',
      label: 'Sócio',
      icon: Users,
      type: 'multi',
      options: partnerOptions,
      value: filterPartner,
      onChange: setFilterPartner,
    },
    {
      key: 'local',
      label: 'Local',
      icon: Building2,
      type: 'multi',
      options: locationOptions,
      value: filterLocal,
      onChange: setFilterLocal,
    },
    {
      key: 'cargo',
      label: 'Cargo',
      icon: Briefcase,
      type: 'multi',
      options: roleOptions,
      value: filterCargo,
      onChange: setFilterCargo,
    },
  ], [filterLider, filterPartner, filterLocal, filterCargo, liderOptions, partnerOptions, locationOptions, roleOptions]);

  const activeFilterCount = React.useMemo(() => {
    return filterLider.length + filterPartner.length + filterLocal.length + filterCargo.length;
  }, [filterLider, filterPartner, filterLocal, filterCargo]);

  const activeFilterChips = React.useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    filterLider.forEach(id => {
      const label = liderOptions.find(l => l.value === id)?.label || id;
      chips.push({ key: `lider-${id}`, label: `Líder: ${label}`, onClear: () => setFilterLider(prev => prev.filter(v => v !== id)) });
    });
    filterPartner.forEach(id => {
      const label = partnerOptions.find(p => p.value === id)?.label || id;
      chips.push({ key: `partner-${id}`, label: `Sócio: ${label}`, onClear: () => setFilterPartner(prev => prev.filter(v => v !== id)) });
    });
    filterLocal.forEach(id => {
      const label = locationOptions.find(l => l.value === id)?.label || id;
      chips.push({ key: `local-${id}`, label: `Local: ${label}`, onClear: () => setFilterLocal(prev => prev.filter(v => v !== id)) });
    });
    filterCargo.forEach(id => {
      const label = id === 'unassigned' ? 'Não definido' : roleOptions.find(r => r.value === id)?.label || id;
      chips.push({ key: `cargo-${id}`, label: `Cargo: ${label}`, onClear: () => setFilterCargo(prev => prev.filter(v => v !== id)) });
    });
    return chips;
  }, [filterLider, filterPartner, filterLocal, filterCargo, liderOptions, partnerOptions, locationOptions, roleOptions]);

  const clearAllFilters = () => {
    setFilterLider([]);
    setFilterPartner([]);
    setFilterLocal([]);
    setFilterCargo([]);
  };

  // Inicializa estado vazio por padrão conforme solicitado
  const [formData, setFormData] = useState<Partial<Collaborator>>({ status: 'active', state: '' })

  const getFormSteps = (currentData: Partial<Collaborator>) => {
    const roleName = roles.find(r => String(r.id) === String(currentData.role))?.name?.toLowerCase() || '';
    const isAdvogadoSocioJuridica = currentData.area === 'Jurídica' && (roleName.includes('advogado') || roleName.includes('sócio') || roleName.includes('socio'));

    const steps = [
      { id: 1, label: 'Dados Pessoais e Bancários', icon: User },
      { id: 4, label: 'Dados Corporativos', icon: Briefcase }
    ];

    if (currentData.area && currentData.role) {
      if (isAdvogadoSocioJuridica) {
        steps.push({ id: 8, label: 'OAB', icon: BookOpen });
      } else {
        steps.push({ id: 2, label: 'Dados Profissionais', icon: GraduationCap });
      }
    }

    steps.push(
      { id: 3, label: 'Dados de Escolaridade', icon: BookOpen },
      { id: 9, label: 'Perfil', icon: TagIcon },
      { id: 5, label: 'Período de Ausências', icon: Calendar },
      { id: 6, label: 'Histórico', icon: Clock },
      { id: 7, label: 'GED', icon: Files }
    );

    return steps;
  }
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null)
  const [, setRefreshKey] = useState(0)
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null)

  const [gedDocs, setGedDocs] = useState<GEDDocument[]>([])
  const [, setUploadingGed] = useState(false)
  const [selectedGedCategory, setSelectedGedCategory] = useState('')
  const [atestadoDatas, setAtestadoDatas] = useState({ inicio: '', fim: '' })
  const [pendingGedDocs, setPendingGedDocs] = useState<{ file: File, category: string, label?: string, tempId: string, atestadoDatas?: { inicio: string, fim: string } }[]>([])
  const gedInputRef = useRef<HTMLInputElement>(null)

  const gedCategories = [
    { id: 'Atestado Médico', name: 'Atestado Médico' },
    { id: 'Cartão CNPJ', name: 'Cartão CNPJ' },
    { id: 'Carteira de Trabalho (CTPS)', name: 'Carteira de Trabalho (CTPS)' },
    { id: 'Certidão de Nascimento/Casamento', name: 'Certidão de Nascimento/Casamento' },
    { id: 'Certificado de Escolaridade/Diploma', name: 'Certificado de Escolaridade/Diploma' },
    { id: 'Certificado de Reservista', name: 'Certificado de Reservista' },
    { id: 'Comprovante de Residência', name: 'Comprovante de Residência' },
    { id: 'CPF', name: 'CPF' },
    { id: 'Currículo', name: 'Currículo' },
    { id: 'Documento de Identificação (RG/CNH)', name: 'Documento de Identificação (RG/CNH)' },
    { id: 'Entrevista', name: 'Entrevista' },
    { id: 'PIS/PASEP', name: 'PIS/PASEP' },
    { id: 'Prova', name: 'Prova' },
    { id: 'Redação', name: 'Redação' },
    { id: 'Título de Eleitor', name: 'Título de Eleitor' },
    { id: 'Outros', name: 'Outros' }
  ]

  const photoInputRef = useRef<HTMLInputElement>(null)

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
  })

  // Confirmation Modal State
  const [gedToDelete, setGedToDelete] = useState<GEDDocument | null>(null)
  const [colaboradorToDelete, setColaboradorToDelete] = useState<Collaborator | null>(null)

  const showAlert = (title: string, description: string, variant: 'success' | 'error' | 'info' = 'info') => {
    setAlertConfig({ isOpen: true, title, description, variant })
  }

  useEffect(() => {
    fetchColaboradores()
    fetchPartners()

    // ONE-OFF MIGRATION: Update contract_type to 'ADVOGADO ASSOCIADO' and 'ESTAGIÁRIO'
    const runMigration = async () => {
      try {
        const { data: rolesData } = await supabase.from('roles').select('id, name');
        if (!rolesData) return;
        
        let advogadoUpdated = 0;
        let estagiarioUpdated = 0;

        // 1. Advogados / Sócios / Consultor Jurídico -> ADVOGADO ASSOCIADO
        const advRoleIds = rolesData.filter(r => {
          if (!r.name) return false;
          const n = r.name.toLowerCase();
          return n.includes('advogad') || n.includes('sóci') || n.includes('soci') || n === 'consultor jurídico';
        }).map(r => String(r.id));

        if (advRoleIds.length > 0) {
          const { data: cols } = await supabase.from('collaborators').select('id, role, contract_type').in('role', advRoleIds);
          if (cols) {
            const toUpdate = cols.filter(c => c.contract_type !== 'ADVOGADO ASSOCIADO');
            if (toUpdate.length > 0) {
              const updates = toUpdate.map(c => supabase.from('collaborators').update({ contract_type: 'ADVOGADO ASSOCIADO' }).eq('id', c.id));
              await Promise.all(updates);
              advogadoUpdated = toUpdate.length;
            }
          }
        }

        // 2. Estagiários -> ESTAGIÁRIO
        const estRoleIds = rolesData.filter(r => {
          if (!r.name) return false;
          const n = r.name.toLowerCase();
          return n.includes('estagiário') || n.includes('estagiario') || n.includes('estágio') || n.includes('estagio');
        }).map(r => String(r.id));

        if (estRoleIds.length > 0) {
          const { data: cols } = await supabase.from('collaborators').select('id, role, contract_type').in('role', estRoleIds);
          if (cols) {
            const toUpdate = cols.filter(c => c.contract_type !== 'ESTAGIÁRIO');
            if (toUpdate.length > 0) {
              const updates = toUpdate.map(c => supabase.from('collaborators').update({ contract_type: 'ESTAGIÁRIO' }).eq('id', c.id));
              await Promise.all(updates);
              estagiarioUpdated = toUpdate.length;
            }
          }
        }

        if (advogadoUpdated > 0 || estagiarioUpdated > 0) {
          console.log(`Migration complete. Advogados: ${advogadoUpdated}, Estagiários: ${estagiarioUpdated}`);
          fetchColaboradores();
        }
      } catch (e) {
        console.error('Migration error', e);
      }
    };
    runMigration();
  }, [])

  useDatabaseSync(() => {
    fetchColaboradores()
    fetchPartners()
  }, ['collaborators', 'partners', 'transportes'])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewingPhoto) setViewingPhoto(null)
        else if (showFormModal) setShowFormModal(false)
        else if (selectedColaborador) setSelectedColaborador(null)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [viewingPhoto, showFormModal, selectedColaborador])

  useEffect(() => {
    if (selectedColaborador && activeDetailTab === 7) {
      fetchGedDocs(selectedColaborador.id)
    }
  }, [selectedColaborador, activeDetailTab])

  useEffect(() => {
    if (showFormModal && formData.id && activeFormTab === 7) {
      fetchGedDocs(formData.id)
    }
  }, [showFormModal, formData.id, activeFormTab])

  // Restore scroll position when modal closes and the list re-renders
  useEffect(() => {
    if (!showFormModal && !selectedColaborador && listContainerRef.current && savedScrollPosition > 0) {
      // Small timeout ensures the DOM has updated the list items before scrolling
      setTimeout(() => {
        if (listContainerRef.current) {
          listContainerRef.current.scrollTop = savedScrollPosition;
        }
      }, 50);
    }
  }, [showFormModal, selectedColaborador, savedScrollPosition, colaboradores])



  useEffect(() => {
    const fetchCepData = async (cepValue: string) => {
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepValue}`);
        const data = await response.json();
        if (!data.errors && !data.message) {
          const estadoEncontrado = ESTADOS_BRASIL.find((e: any) => e.sigla === (data.state || data.uf));
          setFormData(prev => ({
            ...prev,
            address: toTitleCase(data.street || data.logradouro || ''),
            neighborhood: toTitleCase(data.neighborhood || data.bairro || ''),
            city: toTitleCase(data.city || data.localidade || ''),
            state: estadoEncontrado ? estadoEncontrado.nome : (data.state || data.uf || '')
          }));
        }
      } catch (error) {
        console.error("Erro CEP automático:", error);
      }
    };

    const cepRaw = formData.zip_code?.replace(/\D/g, '');
    if (cepRaw?.length === 8) {
      fetchCepData(cepRaw);
    }
  }, [formData.zip_code]);

  const handleCepBlur = async () => {
    const cep = formData.zip_code?.replace(/\D/g, '')
    if (cep?.length === 8) {
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`)
        const data = await response.json()
        if (!data.errors && !data.message) {
          const estadoEncontrado = ESTADOS_BRASIL.find((e: any) => e.sigla === (data.state || data.uf))
          setFormData(prev => ({
            ...prev,
            address: toTitleCase(data.street || data.logradouro || ''),
            neighborhood: toTitleCase(data.neighborhood || data.bairro || ''),
            city: toTitleCase(data.city || data.localidade || ''),
            state: estadoEncontrado ? estadoEncontrado.nome : (data.state || data.uf || '')
          }))
        }
      } catch (error) { console.error("Erro CEP:", error) }
    }
  }

  const fetchColaboradores = async () => {
    setLoading(true)
    try {
      const [
        colabRes,
        rolesRes,
        locsRes,
        teamsRes,
        rateiosRes,
        hiringReasonsRes,
        termInitiativesRes,
        termTypesRes,
        termReasonsRes,
        atuacoesRes
      ] = await Promise.all([
        supabase.from('collaborators').select(`*, partner:partner_id(id, name), leader:leader_id(id, name), oab_number(*), education_history:collaborator_education_history(*), team_leader:team_leader(id)`).order('name'),
        supabase.from('roles').select('id, name'),
        supabase.from('locations').select('id, name'),
        supabase.from('teams').select('id, name'),
        supabase.from('rateios').select('id, name'),
        supabase.from('hiring_reasons').select('id, name'),
        supabase.from('termination_initiatives').select('id, name'),
        supabase.from('termination_types').select('id, name'),
        supabase.from('termination_reasons').select('id, name'),
        supabase.from('atuacoes').select('id, name')
      ])

      if (colabRes.error) throw colabRes.error

      if (rolesRes.data) setRoles(rolesRes.data)
      if (locsRes.data) setLocations(locsRes.data)
      if (teamsRes.data) {
        setTeams(teamsRes.data)
      }
      if (rateiosRes.data) setRateios(rateiosRes.data)
      if (hiringReasonsRes.data) setHiringReasons(hiringReasonsRes.data)
      if (termInitiativesRes.data) setTerminationInitiatives(termInitiativesRes.data)
      if (termTypesRes.data) setTerminationTypes(termTypesRes.data)
      if (termReasonsRes.data) setTerminationReasons(termReasonsRes.data)
      if (atuacoesRes.data) setAtuacoes(atuacoesRes.data)

      const rolesMap = new Map(rolesRes.data?.map(r => [String(r.id), r.name]) || [])
      const locsMap = new Map(locsRes.data?.map(l => [String(l.id), l.name]) || [])
      const teamsMap = new Map(teamsRes.data?.map(t => [String(t.id), t.name]) || [])
      const atuacoesMap = new Map(atuacoesRes.data?.map(a => [String(a.id), a.name]) || [])

      const enrichedData = colabRes.data?.map(c => ({
        ...c,
        is_team_leader: c.team_leader && (Array.isArray(c.team_leader) ? c.team_leader.length > 0 : true),
        oabs: c.oab_number?.map((o: any) => ({
          id: o.id,
          numero: o.numero,
          uf: o.uf,
          tipo: o.tipo,
          validade: o.validade
        })) || [],
        photo_url: c.photo_url || c.foto_url,
        roles: { name: rolesMap.get(String(c.role)) || c.role },
        locations: { name: locsMap.get(String(c.local)) || c.local },
        teams: { name: teamsMap.get(String(c.equipe)) || c.equipe },
        atuacoes: { name: atuacoesMap.get(String(c.atuacao)) || c.atuacao }
      })) || []

      setColaboradores(enrichedData)
    } catch (error: any) {
      console.error("Erro ao buscar colaboradores:", error.message)
      setColaboradores([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPartners = async () => {
    const { data } = await supabase.from('partners').select('id, name').order('name')
    if (data) setPartners(data)
  }

  const fetchGedDocs = async (colabId: string) => {
    const { data } = await supabase.from('ged_colaboradores').select('*').eq('colaborador_id', colabId).order('created_at', { ascending: false })
    if (data) setGedDocs(data)
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    fetchColaboradores()
  }

  const handleGedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedGedCategory) {
      if (!selectedGedCategory) showAlert('Atenção', 'Selecione uma categoria primeiro.', 'warning' as any) // Type cast for now or update AlertModal to support warning
      return
    }

    if (formData.id) {
      try {
        setUploadingGed(true)
        const fileExt = file.name.split('.').pop()
        let categoryLabel = selectedGedCategory;
        if (selectedGedCategory === 'Atestado Médico' && atestadoDatas.inicio && atestadoDatas.fim) {
          categoryLabel = `Atestado Médico (${formatDateToDisplay(atestadoDatas.inicio)} a ${formatDateToDisplay(atestadoDatas.fim)})`
        }

        const rawFileName = `${formData.name}_${categoryLabel}`
        const cleanPathName = rawFileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
        const finalFileName = `${cleanPathName}.${fileExt}`
        const filePath = `ged/${formData.id}/${Date.now()}_${finalFileName}`

        const { error: uploadError } = await supabase.storage.from('ged-colaboradores').upload(filePath, file)
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage.from('ged-colaboradores').getPublicUrl(filePath)

        await supabase.from('ged_colaboradores').insert({
          colaborador_id: formData.id,
          nome_arquivo: `${toTitleCase(formData.name || '')}_${categoryLabel}.${fileExt}`,
          url: publicUrl,
          categoria: selectedGedCategory,
          tamanho: file.size,
          tipo_arquivo: file.type
        })

        if (selectedGedCategory === 'Atestado Médico' && atestadoDatas.inicio && atestadoDatas.fim) {
          const diffDays = Math.max(1, Math.ceil((new Date(atestadoDatas.fim + 'T00:00:00').getTime() - new Date(atestadoDatas.inicio + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1);
          await supabase.from('collaborator_absences').insert({
            collaborator_id: formData.id,
            type: 'Atestado Médico',
            start_date: formatDateToDisplay(atestadoDatas.inicio),
            end_date: formatDateToDisplay(atestadoDatas.fim),
            days_count: diffDays,
            observation: 'Inserido automaticamente via anexo de GED.'
          });
        }

        fetchGedDocs(formData.id);
        setSelectedGedCategory('');
        setAtestadoDatas({ inicio: '', fim: '' })
        if (gedInputRef.current) gedInputRef.current.value = ''
      } catch (error: any) {
        showAlert('Erro', 'Erro no upload do GED: ' + error.message, 'error')
      } finally { setUploadingGed(false) }
    } else {
      let categoryLabel = selectedGedCategory;
      if (selectedGedCategory === 'Atestado Médico' && atestadoDatas.inicio && atestadoDatas.fim) {
        categoryLabel = `Atestado Médico (${formatDateToDisplay(atestadoDatas.inicio)} a ${formatDateToDisplay(atestadoDatas.fim)})`
      }
      const newItem = {
        file,
        category: selectedGedCategory,
        label: categoryLabel !== selectedGedCategory ? categoryLabel : undefined,
        tempId: Math.random().toString(36).substr(2, 9),
        atestadoDatas: selectedGedCategory === 'Atestado Médico' ? { ...atestadoDatas } : undefined
      }
      setPendingGedDocs(prev => [...prev, newItem])
      setSelectedGedCategory('')
      setAtestadoDatas({ inicio: '', fim: '' })

      // Add AlertModal render
    }
    if (gedInputRef.current) gedInputRef.current.value = ''
  }

  const handleDeleteGed = (doc: GEDDocument) => {
    setGedToDelete(doc)
  }

  const confirmDeleteGed = async () => {
    if (!gedToDelete) return
    try {
      const pathIndex = gedToDelete.url.indexOf('/ged-colaboradores/')
      if (pathIndex !== -1) {
        const path = gedToDelete.url.substring(pathIndex + '/ged-colaboradores/'.length)
        await supabase.storage.from('ged-colaboradores').remove([path])
      }
      await supabase.from('ged_colaboradores').delete().eq('id', gedToDelete.id)
      const colabId = selectedColaborador?.id || formData.id;
      if (colabId) {
        fetchGedDocs(colabId)
      }
      showAlert('Sucesso', 'Documento excluído com sucesso.', 'success')
    } catch (error) {
      showAlert('Erro', 'Erro ao excluir documento.', 'error')
    } finally {
      setGedToDelete(null)
    }
  }

  const confirmDeleteColaborador = async () => {
    if (!colaboradorToDelete) return
    const { error } = await supabase.from('collaborators').delete().eq('id', colaboradorToDelete.id)
    if (!error) {
      await logAction('EXCLUIR', 'RH', `Excluiu colaborador: ${colaboradorToDelete.name}`, 'Integrantes')
      fetchColaboradores()
      if (selectedColaborador) setSelectedColaborador(null)
      showAlert('Sucesso', 'Colaborador excluído com sucesso.', 'success')
    } else {
      showAlert('Erro', 'Erro ao Excluir Integrante: ' + error.message, 'error')
    }
    setColaboradorToDelete(null)
  }



  const handleSave = async (closeModal = true) => {
    try {
      if (!formData.name) {
        showAlert('Atenção', 'O campo Nome é obrigatório.', 'info')
        return
      }
      setLoading(true)
      let photoUrl = formData.photo_url === undefined ? null : formData.photo_url

      if (selectedPhotoFile) {
        setUploadingPhoto(true)
        try {
          const fileExt = selectedPhotoFile.name.split('.').pop()
          const cleanName = formData.name?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, '').replace(/\s+/g, '_') || 'foto'
          const filePath = `colaboradores/${Date.now()}_${cleanName}.${fileExt}`

          const { error: uploadError } = await supabase.storage.from('fotos-colaboradores').upload(filePath, selectedPhotoFile)
          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage.from('fotos-colaboradores').getPublicUrl(filePath)
          photoUrl = publicUrl
        } catch (error: any) {
          showAlert('Erro', 'Erro ao fazer upload da foto: ' + error.message, 'error')
          setUploadingPhoto(false)
          setLoading(false)
          return
        }
        setUploadingPhoto(false)
      }

      // Prepare data for save: Convert DD/MM/YYYY back to YYYY-MM-DD
      const candidateFormData = formData as any; // Bypass TS linting for Candidate-only fields during map
      const dataToSave = {
        ...formData,
        linkedin_url: candidateFormData.linkedin || formData.linkedin_url, // map linkedin from candidate
        atuacao: candidateFormData.atuacao_id || formData.atuacao, // map atuacao_id from candidate
        cadastro_atualizado: false,
        birthday: formatDateToISO(formData.birthday) || null,
        hire_date: formatDateToISO(formData.hire_date) || null,
        termination_date: formatDateToISO(formData.termination_date) || null,
        escolaridade_previsao_conclusao: formatDateToISO(formData.escolaridade_previsao_conclusao) || null,
        previsao_formatura: formatMonthYearDateToISO(formData.previsao_formatura) || null,
        termino_contrato_estagio: formatDateToISO(formData.termino_contrato_estagio) || null,
        bolsa_valor: formData.bolsa_valor ? parseCurrency(formData.bolsa_valor) : null,
        vr_valor: formData.vr_valor ? parseCurrency(formData.vr_valor) : null,
        children_data: formData.children_data?.map(c => ({
          ...c,
          birth_date: formatDateToISO(c.birth_date) || null
        })),
        education_history: formData.education_history?.map(edu => ({
          ...edu,
          instituicao_uf: edu.instituicao_uf || null,
          turno: edu.turno || null,
          previsao_conclusao: formatDateToISO(edu.previsao_conclusao) || null
        }))
      };

      // Robust cleaning of the payload
      const payload: any = {};
      Object.entries(dataToSave).forEach(([key, value]) => {
        // Skip metadata, joined objects, photo fields, and independent sections (Perfil manages its own data)
        if (['id', 'created_at', 'updated_at', 'photo_url', 'foto_url', 'roles', 'locations', 'teams', 'partner', 'leader', 'hiring_reasons', 'termination_initiatives', 'termination_types', 'termination_reasons', 'rateios', 'oab_number', 'oabs', 'oab_numero', 'oab_uf', 'oab_tipo', 'oab_emissao', 'original_role', 'role_change_date', 'perfil', 'competencias', 'resumo_cv', 'linkedin', 'atuacao_id', 'nome', 'education_history', 'is_team_leader', 'team_leader'].includes(key)) return;
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) return;

        // Map empty strings to null for better DB consistency
        payload[key] = value === '' ? null : value;
      });

      // Maintain consistency: use foto_url as the database column
      // photoUrl was captured at the start, and if undefined, turned into null. If a new photo was uploaded, it becomes the URL.
      payload.foto_url = photoUrl;

      let savedColabId = formData.id;
      if (formData.id) {
        if (formData.original_role && formData.original_role !== formData.role) {
          try {
            const { data: lastChange } = await supabase
              .from('collaborator_role_history')
              .select('change_date')
              .eq('collaborator_id', formData.id)
              .order('change_date', { ascending: false })
              .limit(1)
              .single();

            const startDateStr = lastChange?.change_date || formData.hire_date || formData.created_at || new Date().toISOString();
            const startDate = new Date(startDateStr);
            const today = new Date();
            const diffTime = Math.abs(today.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const changeDateToUse = formData.role_change_date ? formatDateToISO(formData.role_change_date) : today.toISOString();

            const previousRoleName = roles.find(r => String(r.id) === String(formData.original_role))?.name || formData.original_role || 'Não preenchido';
            const newRoleName = roles.find(r => String(r.id) === String(formData.role))?.name || formData.role || 'Não preenchido';

            const historyPayload = {
              collaborator_id: formData.id,
              previous_role: previousRoleName,
              new_role: newRoleName,
              duration_days: diffDays,
              change_date: changeDateToUse
            };

            const { error: histError } = await supabase.from('collaborator_role_history').insert([historyPayload]);
            if (histError) console.error('Erro ao salvar histórico de cargo:', histError);
          } catch (err) {
            console.error('Erro ao processar histórico de cargo:', err);
          }
        }

        const { error } = await supabase.from('collaborators').update(payload).eq('id', formData.id)
        if (error) throw error
        await logAction('EDITAR', 'RH', `Editou colaborador: ${formData.name}`, 'Integrantes')
      } else {
        const { data, error } = await supabase.from('collaborators').insert(payload).select().single()
        if (error) throw error
        savedColabId = data.id;
        await logAction('CRIAR', 'RH', `Criou novo integrante: ${formData.name}`, 'Integrantes')

        // Handle Pending GEDs
        if (data && pendingGedDocs.length > 0) {
          for (const doc of pendingGedDocs) {
            const fileExt = doc.file.name.split('.').pop()
            const finalFileName = `${data.id}_${doc.category}_${Date.now()}.${fileExt}`
            const filePath = `ged/${data.id}/${finalFileName}`
            const { error: upErr } = await supabase.storage.from('ged-colaboradores').upload(filePath, doc.file)
            if (!upErr) {
              const { data: { publicUrl } } = supabase.storage.from('ged-colaboradores').getPublicUrl(filePath)
              await supabase.from('ged_colaboradores').insert({
                colaborador_id: data.id,
                nome_arquivo: doc.label ? `${doc.label}.${fileExt}` : doc.file.name,
                url: publicUrl,
                categoria: doc.category,
                tamanho: doc.file.size,
                tipo_arquivo: doc.file.type
              })

              if (doc.category === 'Atestado Médico' && doc.atestadoDatas?.inicio && doc.atestadoDatas?.fim) {
                const diffDays = Math.max(1, Math.ceil((new Date(doc.atestadoDatas.fim + 'T00:00:00').getTime() - new Date(doc.atestadoDatas.inicio + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1);
                await supabase.from('collaborator_absences').insert({
                  collaborator_id: data.id,
                  type: 'Atestado Médico',
                  start_date: formatDateToDisplay(doc.atestadoDatas.inicio),
                  end_date: formatDateToDisplay(doc.atestadoDatas.fim),
                  days_count: diffDays,
                  observation: 'Inserido automaticamente via anexo de GED.'
                });
              }
            }
          }
        }
      }

      // Handle Team Leader
      if (savedColabId) {
        if (formData.is_team_leader) {
          const { data: tlExists } = await supabase.from('team_leader').select('id').eq('collaborator_id', savedColabId).maybeSingle();
          if (!tlExists) {
            await supabase.from('team_leader').insert({ collaborator_id: savedColabId });
          }
        } else {
          await supabase.from('team_leader').delete().eq('collaborator_id', savedColabId);
        }
      }

      // Handle OABs
      if (savedColabId) {
        const roleName = roles.find(r => String(r.id) === String(formData.role))?.name?.toLowerCase() || '';
        const isAdvogadoOuSocio = roleName.includes('advogado') || roleName.includes('sócio') || roleName.includes('socio');
        const shouldSaveOabs = formData.area === 'Jurídica' && isAdvogadoOuSocio;

        await supabase.from('oab_number').delete().eq('colaborador_id', savedColabId);

        if (shouldSaveOabs) {
          const validOabs = (formData.oabs || []).filter((o: any) => o.numero && o.uf);
          if (validOabs.length > 0) {
            const oabPayload = validOabs.map((o: any) => ({
              colaborador_id: savedColabId,
              numero: o.numero,
              uf: o.uf,
              tipo: o.tipo || 'Suplementar',
              validade: formatDateToISO(o.validade) || null
            }));
            const { error: oabError } = await supabase.from('oab_number').insert(oabPayload);
            if (oabError) console.error("Erro ao salvar OAB:", oabError);
          }
        }

        // Handle Education History (Relacional)
        await supabase.from('collaborator_education_history').delete().eq('collaborator_id', savedColabId);
        if (dataToSave.education_history && dataToSave.education_history.length > 0) {
          const eduPayload = dataToSave.education_history.map((edu: any) => {
            const { id, ...rest } = edu; // remove o id original (gerado localmente no form) para o postgres gerar um novo UUID limpo
            return {
              ...rest,
              collaborator_id: savedColabId
            };
          });
          const { error: eduError } = await supabase.from('collaborator_education_history').insert(eduPayload);
          if (eduError) console.error("Erro ao salvar Escolaridade:", eduError);
        }
      }

      fetchColaboradores()
      if (closeModal) setShowFormModal(false)
      else {
        setFormData({ status: 'active', state: '' })
        setPhotoPreview(null)
        setSelectedPhotoFile(null)
        setPendingGedDocs([])
        setActiveFormTab(1)
      }
    } catch (error: any) {
      showAlert('Erro', 'Erro ao salvar: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (colaborador: Collaborator, initialTab?: number) => {
    // Format dates for display (DD/MM/YYYY)
    const formattedColaborador = {
      ...colaborador,
      original_role: colaborador.role,
      birthday: formatDateToDisplay(colaborador.birthday),
      hire_date: formatDateToDisplay(colaborador.hire_date),
      termination_date: formatDateToDisplay(colaborador.termination_date),
      oab_emissao: formatDateToDisplay(colaborador.oab_emissao),
      oabs: colaborador.oabs?.map((o: any) => ({
        ...o,
        validade: formatDateToDisplay(o.validade)
      })) || [],
      escolaridade_previsao_conclusao: formatDateToDisplay(colaborador.escolaridade_previsao_conclusao),
      previsao_formatura: formatMonthYearDateToDisplay(colaborador.previsao_formatura),
      termino_contrato_estagio: formatDateToDisplay(colaborador.termino_contrato_estagio),
      bolsa_valor: formatDbMoneyToDisplay(colaborador.bolsa_valor),
      vr_valor: formatDbMoneyToDisplay(colaborador.vr_valor),
      children_data: colaborador.children_data?.map((child: any) => ({
        ...child,
        birth_date: formatDateToDisplay(child.birth_date)
      })) || [],
      education_history: colaborador.education_history?.map((edu: any) => ({
        ...edu,
        previsao_conclusao: formatDateToDisplay(edu.previsao_conclusao)
      })) || []
    };

    setFormData(formattedColaborador)
    setPhotoPreview(colaborador.photo_url || null)
    setSelectedPhotoFile(null)
    setActiveFormTab(initialTab || 1)

    // Save scroll position before opening the modal
    if (listContainerRef.current) {
      setSavedScrollPosition(listContainerRef.current.scrollTop)
    }

    setShowFormModal(true)
    setSelectedColaborador(null)
    // Clear pending
    setPendingGedDocs([])
    markAsViewed(colaborador.id, !!colaborador.cadastro_atualizado);
  }

  const handleDelete = (colaborador: Collaborator) => {
    setColaboradorToDelete(colaborador)
  }

  const filtered = colaboradores.filter(c => {
    const normalizer = (str: string) => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';
    const term = normalizer(searchTerm);
    const matchSearch = normalizer(c.name).includes(term) || normalizer(c.email || '').includes(term);
    const matchLider = filterLider.length > 0 ? filterLider.includes(String(c.leader_id)) : true
    const matchPartner = filterPartner.length > 0 ? filterPartner.includes(String(c.partner_id)) : true
    const matchLocal = filterLocal.length > 0 ? filterLocal.includes(String(c.local)) : true
    const matchCargo = filterCargo.length > 0 ? filterCargo.some(fc => fc === 'unassigned' ? (!c.role || String(c.role) === 'Não definido' || String(c.role) === 'null') : String(c.role) === fc) : true
    const matchUpdated = showUpdatedOnly ? c.cadastro_atualizado === true : true
    return matchSearch && matchLider && matchPartner && matchLocal && matchCargo && matchUpdated
  })
  const getAdvancedFiltered = (overrideStatus?: string) => {
    return colaboradores.filter(c => {
      // Pessoais
      if (advFilterGender && c.gender !== advFilterGender) return false;
      if (advFilterBirthStart && (!c.birthday || c.birthday < advFilterBirthStart)) return false;
      if (advFilterBirthEnd && (!c.birthday || c.birthday > advFilterBirthEnd)) return false;
      if (advFilterChildren) {
        const has = !!c.has_children;
        if (advFilterChildren === 'sim' && !has) return false;
        if (advFilterChildren === 'nao' && has) return false;
      }
      if (advFilterStateHome && c.state !== advFilterStateHome) return false;

      // Corporativos
      const statusToCheck = overrideStatus !== undefined ? overrideStatus : advFilterStatus;
      if (statusToCheck && c.status !== statusToCheck) return false;
      if (advFilterRateio && String(c.rateio_id) !== advFilterRateio) return false;
      if (advFilterAdmissionStart && (!c.hire_date || c.hire_date < advFilterAdmissionStart)) return false;
      if (advFilterAdmissionEnd && (!c.hire_date || c.hire_date > advFilterAdmissionEnd)) return false;
      if (advFilterTerminationStart && (!c.termination_date || c.termination_date < advFilterTerminationStart)) return false;
      if (advFilterTerminationEnd && (!c.termination_date || c.termination_date > advFilterTerminationEnd)) return false;
      if (advFilterActivePeriodStart && c.termination_date && c.termination_date < advFilterActivePeriodStart) return false;
      if (advFilterActivePeriodEnd && c.hire_date && c.hire_date > advFilterActivePeriodEnd) return false;

      const safeCompare = (filterVal: string, ...targetVals: (string | undefined | null)[]) => {
        if (!filterVal) return true;
        const lowFilter = filterVal.toLowerCase();
        return targetVals.some(t => t && String(t).toLowerCase() === lowFilter);
      };

      const safeIncludes = (filterVal: string, ...targetVals: (string | undefined | null)[]) => {
        if (!filterVal) return true;
        const lowFilter = filterVal.toLowerCase();
        return targetVals.some(t => t && String(t).toLowerCase().includes(lowFilter));
      };

      if (!safeCompare(advFilterPartner, c.partner_id, (c as any).partner?.name)) return false;
      if (!safeCompare(advFilterLeader, c.leader_id, (c as any).leader?.name)) return false;

      if (!safeCompare(advFilterArea, c.area)) return false;
      if (!safeCompare(advFilterTeam, c.equipe, (c as any).teams?.name)) return false;
      if (!safeCompare(advFilterRole, c.role, (c as any).roles?.name)) return false;
      if (!safeCompare(advFilterContractType, c.contract_type)) return false;
      if (!safeCompare(advFilterPartnerType, c.contract_type)) return false; // Reusing contract_type for partner type
      if (!safeCompare(advFilterLocal, c.local, (c as any).locations?.name)) return false;
      if (!safeIncludes(advFilterTransporteTipo, c.transportes?.map(t => t.tipo).join(', '))) return false;
      if (advFilterSegment && getSegment(c) !== advFilterSegment) return false;

      // Escolares
      if (advFilterGraduationComplete) {
        const hasGrad = c.education_history?.some(e => e.nivel === 'Graduação' && e.status === 'Formado(a)') || (c.escolaridade_nivel === 'Graduação' && !c.escolaridade_previsao_conclusao);
        if (advFilterGraduationComplete === 'sim' && !hasGrad) return false;
        if (advFilterGraduationComplete === 'nao' && hasGrad) return false;
      }
      if (advFilterPostGraduationComplete) {
        const hasPost = c.education_history?.some(e => e.nivel === 'Pós-Graduação' && e.status === 'Formado(a)') || (c.escolaridade_nivel === 'Pós-Graduação' && !c.escolaridade_previsao_conclusao);
        if (advFilterPostGraduationComplete === 'sim' && !hasPost) return false;
        if (advFilterPostGraduationComplete === 'nao' && hasPost) return false;
      }

      if (advFilterGraduationExpected) {
        const hasMatch = c.education_history?.some(e => e.nivel === 'Graduação' && e.previsao_conclusao?.includes(advFilterGraduationExpected));
        if (!hasMatch) return false;
      }
      if (advFilterGraduationCompletion) {
        const hasMatch = c.education_history?.some(e => e.nivel === 'Graduação' && e.ano_conclusao?.includes(advFilterGraduationCompletion));
        if (!hasMatch) return false;
      }
      if (advFilterGraduationUF) {
        const hasMatch = c.education_history?.some(e => e.nivel === 'Graduação' && e.instituicao_uf === advFilterGraduationUF);
        if (!hasMatch) return false;
      }
      if (advFilterGraduationInstitution) {
        const hasMatch = c.education_history?.some(e => e.nivel === 'Graduação' && e.instituicao && e.instituicao.toLowerCase().includes(advFilterGraduationInstitution.toLowerCase()));
        if (!hasMatch) return false;
      }

      if (advFilterPostGraduationExpected) {
        const hasMatch = c.education_history?.some(e => e.nivel === 'Pós-Graduação' && e.previsao_conclusao?.includes(advFilterPostGraduationExpected));
        if (!hasMatch) return false;
      }
      if (advFilterPostGraduationCompletion) {
        const hasMatch = c.education_history?.some(e => e.nivel === 'Pós-Graduação' && e.ano_conclusao?.includes(advFilterPostGraduationCompletion));
        if (!hasMatch) return false;
      }
      if (advFilterPostGraduationUF) {
        const hasMatch = c.education_history?.some(e => e.nivel === 'Pós-Graduação' && e.instituicao_uf === advFilterPostGraduationUF);
        if (!hasMatch) return false;
      }
      if (advFilterPostGraduationInstitution) {
        const hasMatch = c.education_history?.some(e => e.nivel === 'Pós-Graduação' && e.instituicao && e.instituicao.toLowerCase().includes(advFilterPostGraduationInstitution.toLowerCase()));
        if (!hasMatch) return false;
      }

      return true;
    });
  };



  const graduationInstitutionOptions = React.useMemo(() => {
    if (!advFilterGraduationUF) return [];
    const insts = new Set<string>();
    colaboradores.forEach(c => {
      c.education_history?.forEach(h => {
        if (h.nivel === 'Graduação' && h.instituicao_uf === advFilterGraduationUF && h.instituicao) {
          insts.add(h.instituicao);
        }
      });
    });
    return Array.from(insts).sort().map(i => ({ id: i, label: i, value: i }));
  }, [colaboradores, advFilterGraduationUF]);

  const postGraduationInstitutionOptions = React.useMemo(() => {
    if (!advFilterPostGraduationUF) return [];
    const insts = new Set<string>();
    colaboradores.forEach(c => {
      c.education_history?.forEach(h => {
        if (h.nivel === 'Pós-Graduação' && h.instituicao_uf === advFilterPostGraduationUF && h.instituicao) {
          insts.add(h.instituicao);
        }
      });
    });
    return Array.from(insts).sort().map(i => ({ id: i, label: i, value: i }));
  }, [colaboradores, advFilterPostGraduationUF]);


  const handleExportVT = (group: 'Estagiários' | 'CLTs' | 'Todos') => {
    setShowExportVTMenu(false);
    const activeColabs = colaboradores.filter(c => c.status === 'active');

    const vtColabs = activeColabs
      .filter(c => {
        const roleName = ((c as any).roles?.name || String(c.role || '')).toLowerCase();
        const isEstagio = c.contract_type === 'Estágio' || roleName.includes('estagiário') || roleName.includes('estagiario') || roleName.includes('estagio') || roleName.includes('estágio');
        const isCLT = c.contract_type === 'CLT';

        if (group === 'Estagiários') return isEstagio;
        if (group === 'CLTs') return isCLT;
        return isEstagio || isCLT;
      })
      .map(c => {
        let colabVtDaily = 0;
        if (c.transportes && Array.isArray(c.transportes)) {
          colabVtDaily = c.transportes.reduce((tAcc, t) => {
            const idaSum = (t.ida_valores || []).reduce((sum, v) => sum + (v || 0), 0);
            const voltaSum = (t.volta_valores || []).reduce((sum, v) => sum + (v || 0), 0);
            return tAcc + idaSum + voltaSum;
          }, 0);
        }

        return {
          ...c,
          currentVtTotal: colabVtDaily * getWorkingDaysInCurrentMonth()
        };
      });

    exportVTXLSX({
      filtered: vtColabs,
      rateios,
      hiringReasons,
      partners,
      colaboradores,
      terminationInitiatives,
      terminationTypes,
      terminationReasons,
      roles,
      locations,
      teams,
      atuacoes,
      fileName: `Custo_Vale_Transporte_${group}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`
    });
  };

  const calcAgeRange = (start: string, end: string) => {
    if (!start || !end) return null;
    const s = new Date(start);
    const e = new Date(end);
    const today = new Date();

    let minAge = today.getFullYear() - e.getFullYear();
    const m1 = today.getMonth() - e.getMonth();
    if (m1 < 0 || (m1 === 0 && today.getDate() < e.getDate())) minAge--;

    let maxAge = today.getFullYear() - s.getFullYear();
    const m2 = today.getMonth() - s.getMonth();
    if (m2 < 0 || (m2 === 0 && today.getDate() < s.getDate())) maxAge--;

    return `${minAge} a ${maxAge} anos`;
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const activeIds = filtered.filter(c => c.status === 'active').map(c => c.id);
      setSelectedIds(activeIds);
    } else {
      setSelectedIds([]);
    }
  }

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  }

  const handleGenerateLinks = async () => {
    if (selectedIds.length === 0) return;
    setGeneratingLinks(true);

    try {
      const newLinks: { name: string, url: string }[] = [];
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7); // 7 days from now

      for (const id of selectedIds) {
        const token = crypto.randomUUID();
        const { error } = await supabase
          .from('collaborators')
          .update({
            update_token: token,
            update_token_expires_at: expirationDate.toISOString()
          })
          .eq('id', id);

        if (error) throw error;

        const colab = colaboradores.find(c => c.id === id);
        if (colab) {
          newLinks.push({
            name: colab.name,
            url: `${window.location.origin}/atualizacao-cadastral/${token}`
          });
        }
      }

      setGeneratedLinks(newLinks);
      setShowLinksModal(true);
      setSelectedIds([]);
      showAlert('Sucesso', 'Links mágicos gerados com sucesso! Eles são válidos por 7 dias.', 'success');
    } catch (error: any) {
      showAlert('Erro', 'Falha ao gerar links: ' + error.message, 'error');
    } finally {
      setGeneratingLinks(false);
    }
  }

  // LAYOUT FUNCTIONS (MODAL PARA VIEW / PAGINA PARA FORMULARIO)
  const renderModalContent = (activeTab: number, isViewMode: boolean, data: Partial<Collaborator>) => {
    const currentData = isViewMode ? data : formData;
    const currentSetData = isViewMode ? () => { } : setFormData;
    const changedFields = isViewMode && data.cadastro_atualizado ? (data.magic_link_changed_fields || []) : [];

    const magicLinkBanner = isViewMode && data.cadastro_atualizado && changedFields.length > 0 ? (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 mb-4 animate-in slide-in-from-top-2">
        <div className="bg-amber-100 p-1.5 rounded-full text-amber-600 shrink-0">
          <RefreshCcw className="w-4 h-4" />
        </div>
        <div>
          <p className="text-amber-800 text-xs font-bold">Atualizado via Link Mágico{data.magic_link_updated_at ? ` em ${new Date(data.magic_link_updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}</p>
          <p className="text-amber-600 text-[10px] mt-0.5">Os campos com <span className="inline-block w-2 h-2 bg-amber-400 rounded-full mx-0.5 align-middle"></span> borda dourada foram alterados pelo integrante.</p>
        </div>
      </div>
    ) : null;

    // 1. DADOS PESSOAIS
    if (activeTab === 1) {
      return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          {magicLinkBanner}
          <DadosPessoaisSection
            formData={currentData}
            setFormData={currentSetData}
            maskCPF={maskCPF}
            maskDate={maskDate}
            maskRG={maskRG}
            maskPhone={maskPhone}
            maskCNPJ={maskCNPJ}
            isViewMode={isViewMode}
            changedFields={changedFields}
          />
          <EnderecoSection
            formData={currentData}
            setFormData={currentSetData}
            maskCEP={maskCEP}
            handleCepBlur={isViewMode ? () => { } : handleCepBlur}
            isViewMode={isViewMode}
            changedFields={changedFields}
          />
          {/* Observações - Movido para o final da aba 1 */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Observações
            </label>
            <textarea
              className={`w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium min-h-[80px] ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={currentData.observacoes || ''}
              onChange={e => currentSetData({ ...currentData, observacoes: e.target.value })}
              placeholder="Observações gerais sobre o integrante..."
              disabled={isViewMode}
              readOnly={isViewMode}
            />
          </div>
        </div>
      )
    }

    // 2. DADOS PROFISSIONAIS
    if (activeTab === 2) {
      return (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <InformacoesProfissionaisSection
            formData={currentData}
            setFormData={currentSetData}
            isViewMode={isViewMode}
          />
        </div>
      )
    }

    // 8. OAB
    if (activeTab === 8) {
      return (
        <div className="animate-in slide-in-from-right-4 duration-300">
          {magicLinkBanner}
          <OABSection
            formData={currentData}
            setFormData={currentSetData}
            maskDate={maskDate}
            isViewMode={isViewMode}
            changedFields={changedFields}
          />
        </div>
      )
    }

    // 3. ESCOLARIDADE
    if (activeTab === 3) {
      return (
        <div className="animate-in slide-in-from-right-4 duration-300">
          {magicLinkBanner}
          <DadosEscolaridadeSection
            formData={currentData}
            setFormData={currentSetData}
            maskDate={maskDate}
            handleRefresh={handleRefresh}
            isViewMode={isViewMode}
            changedFields={changedFields}
          />
        </div>
      )
    }

    // 4. CORPORATIVO
    if (activeTab === 4) {
      return (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <DadosCorporativosSection
            formData={currentData}
            setFormData={currentSetData}
            maskDate={maskDate}
            isViewMode={isViewMode}
          />
        </div>
      )
    }


    // 5. PERÍODO DE AUSÊNCIAS
    if (activeTab === 5) {
      return (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <PeriodoAusenciasSection
            formData={currentData}
            maskDate={maskDate}
            isViewMode={isViewMode}
          />
        </div>
      )
    }

    // 6. HISTÓRICO
    if (activeTab === 6) {
      return (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <HistoricoSection
            formData={currentData}
            setFormData={currentSetData}
            maskDate={maskDate}
            isViewMode={isViewMode}
          />
        </div>
      )
    }

    // 7. GED
    if (activeTab === 7) {
      return (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <GEDSection
            gedCategories={gedCategories}
            selectedGedCategory={selectedGedCategory}
            setSelectedGedCategory={setSelectedGedCategory}
            atestadoDatas={atestadoDatas}
            setAtestadoDatas={setAtestadoDatas}
            gedInputRef={gedInputRef}
            handleGedUpload={handleGedUpload}
            gedDocs={gedDocs}
            pendingGedDocs={pendingGedDocs}
            setPendingGedDocs={setPendingGedDocs}
            handleDeleteGed={handleDeleteGed}
          />
        </div>
      )
    }

    // 9. PERFIL (TAGS)
    if (activeTab === 9) {
      return (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <PerfilSection
            collaboratorId={currentData.id || ''}
            showAlert={showAlert}
          />
        </div>
      )
    }

    return null
  }

  // Layout Original em Modal (Exclusivo para Visualização)
  const renderModalLayout = (
    title: React.ReactNode,
    onClose: () => void,
    activeTab: number,
    setActiveTab: (id: number) => void,
    children: React.ReactNode,
    footer?: React.ReactNode,
    sidebarContent?: React.ReactNode,
    isEditMode: boolean = false,
    currentData: Partial<Collaborator> = {}
  ) => {
    let onPrev, onNext;
    if (currentData?.id) {
      const idx = filtered.findIndex(c => c.id === currentData.id);
      if (idx > 0) {
        onPrev = () => handleRowClick(filtered[idx - 1]);
      }
      if (idx !== -1 && idx < filtered.length - 1) {
        onNext = () => handleRowClick(filtered[idx + 1]);
      }
    }

    return (
      <CollaboratorModalLayout
        title={title}
        onClose={onClose}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        children={children}
        footer={footer}
        sidebarContent={sidebarContent}
        isEditMode={isEditMode}
        currentSteps={getFormSteps(currentData)}
        onPrev={onPrev}
        onNext={onNext}
      />
    )
  }

  // Layout Espaçoso em Tela Cheia (Exclusivo para Formulários)
  const renderPageLayout = (
    title: React.ReactNode,
    onClose: () => void,
    activeTab: number,
    setActiveTab: (id: number) => void,
    children: React.ReactNode,
    footer?: React.ReactNode,
    sidebarContent?: React.ReactNode,
    isEditMode: boolean = false,
    currentData: Partial<Collaborator> = {}
  ) => {
    let onPrev, onNext;
    if (currentData?.id) {
      const idx = filtered.findIndex(c => c.id === currentData.id);
      if (idx > 0) {
        onPrev = () => handleEdit(filtered[idx - 1], activeTab);
      }
      if (idx !== -1 && idx < filtered.length - 1) {
        onNext = () => handleEdit(filtered[idx + 1], activeTab);
      }
    }

    return (
      <CollaboratorModalLayout
        title={title}
        onClose={onClose}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        children={children}
        footer={footer}
        sidebarContent={sidebarContent}
        isEditMode={isEditMode}
        currentSteps={getFormSteps(currentData)}
        onPrev={onPrev}
        onNext={onNext}
      />
    )
  }

  const markAsViewed = async (id: string, isUpdated: boolean) => {
    if (isUpdated) {
      await supabase.from('collaborators').update({ cadastro_atualizado: false }).eq('id', id);
      setColaboradores(prev => prev.map(c => c.id === id ? { ...c, cadastro_atualizado: false } : c));
    }
  }

  const handleRowClick = (c: Collaborator) => {
    markAsViewed(c.id, !!c.cadastro_atualizado);
    const formattedC = {
      ...c,
      birthday: formatDateToDisplay(c.birthday),
      hire_date: formatDateToDisplay(c.hire_date),
      termination_date: formatDateToDisplay(c.termination_date),
      oab_emissao: formatDateToDisplay(c.oab_emissao),
      escolaridade_previsao_conclusao: formatDateToDisplay(c.escolaridade_previsao_conclusao),
      previsao_formatura: formatMonthYearDateToDisplay(c.previsao_formatura),
      bolsa_valor: formatDbMoneyToDisplay(c.bolsa_valor),
      vr_valor: formatDbMoneyToDisplay(c.vr_valor),
      children_data: c.children_data?.map((child: any) => ({
        ...child,
        birth_date: formatDateToDisplay(child.birth_date)
      })) || [],
      education_history: c.education_history?.map((edu: any) => ({
        ...edu,
        previsao_conclusao: formatDateToDisplay(edu.previsao_conclusao)
      })) || []
    };
    setSelectedColaborador(formattedC as Collaborator);
    setActiveDetailTab(1);
  }

  const handleExportVTPDF = async () => {
    const reportElem = vtReportRef.current;
    if (!reportElem) return;
    setExportingPDF(true);

    // Wait for the DOM to update to hide CLTs and expand Estagiários
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(reportElem, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#f8fafc' // Tailwind gray-50 to match background
        });

        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = 210; // A4 width in mm
        const expectedHeight = (canvas.height * pdfWidth) / canvas.width;
        // Make the page height dynamic so everything fits on one continuous page
        const pdfHeight = Math.max(297, expectedHeight + 45);
        const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);

        // Add Salomão Logo at the top left
        try {
          const logoImg = new Image();
          logoImg.src = '/logo-salomao.png';
          await new Promise((resolve) => {
            logoImg.onload = resolve;
            logoImg.onerror = resolve;
          });

          if (logoImg.width && logoImg.height) {
            const logoWidth = 40;
            const logoHeight = (logoImg.height * logoWidth) / logoImg.width;
            pdf.addImage(logoImg, 'PNG', 10, 10, logoWidth, logoHeight);
          } else {
            pdf.addImage('/logo-salomao.png', 'PNG', 10, 10, 40, 15);
          }
        } catch (e) {
          console.warn('Could not load logo for PDF', e);
        }

        // Title
        pdf.setFontSize(14);
        pdf.setTextColor(30, 58, 138); // #1e3a8a
        pdf.setFont("helvetica", "bold");
        pdf.text("Relatório Comparativo de Vale Transporte", 60, 20);

        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 60, 25);

        // Add the content block below the header
        pdf.addImage(imgData, 'PNG', 10, 35, pdfWidth - 20, expectedHeight);

        pdf.save(`Comparativo_VT_Estagiarios_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
      } catch (error) {
        console.error('Erro ao gerar PDF', error);
        showAlert('Erro', 'Não foi possível gerar o PDF.', 'error');
      } finally {
        setExportingPDF(false);
        setShowExportVTMenu(false);
      }
    }, 150);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6">

      {/* PAGE HEADER COMPLETO - Título + Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-500">
        {/* Left: Título e Ícone */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Integrantes
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Gerencie o time, edite perfis e controle acessos
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 pb-2 md:pb-0 w-full md:w-auto justify-end mt-2 md:mt-0">
          {/* TABS MOVED HERE - OUTSIDE TERNARY */}
          <div className="flex items-center bg-gray-100/80 p-1 rounded-xl shrink-0">
            {colaboradores.some(c => c.cadastro_atualizado && c.status === 'active') && (
              <button
                onClick={() => setShowUpdatedOnly(!showUpdatedOnly)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${showUpdatedOnly ? 'bg-amber-100 text-amber-700 shadow-sm' : 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'}`}
                title="Ver Cadastros Atualizados"
              >
                <RefreshCcw className="h-4 w-4" />
                Atualizações ({colaboradores.filter(c => c.cadastro_atualizado && c.status === 'active').length})
              </button>
            )}
            <button
              onClick={() => setActiveMainTab('Integrantes')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeMainTab === 'Integrantes' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Users className="h-4 w-4" /> Equipe
            </button>
            {!isReadOnly && (
              <>
                <button
                  onClick={() => setActiveMainTab('Relatórios')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeMainTab === 'Relatórios' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <FileSpreadsheet className="h-4 w-4" /> Relatórios
                </button>
                <button
                  onClick={() => setActiveMainTab('Tabelas')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeMainTab === 'Tabelas' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <TableIcon className="h-4 w-4" /> Tabelas
                </button>
              </>
            )}
          </div>

          {activeMainTab === 'Integrantes' ? (
            <div className="flex items-center gap-4 border-l border-gray-100 pl-4 ml-2">

              <div className="flex items-center gap-1.5 p-1 bg-white border border-gray-100 rounded-xl shadow-sm">
                {isHRUser && totalNotifications > 0 && (
                  <button
                    onClick={() => setShowNotificationsModal(true)}
                    className="relative p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors animate-pulse hover:animate-none flex items-center justify-center shrink-0"
                    title={`${totalNotifications} Notificações de RH`}
                  >
                    <BellRing className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                      {totalNotifications}
                    </span>
                  </button>
                )}
                <button
                  onClick={async () => {
                    setLoading(true)
                    await fetchColaboradores()
                    setLoading(false)
                    setGeneratedLinks([])
                    setSelectedIds([])
                  }}
                  className="p-2 sm:p-2.5 text-[#1e3a8a] hover:bg-blue-50 focus:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 flex items-center justify-center relative"
                  title="Atualizar Dados"
                >
                  {colaboradores.filter(c => c.cadastro_atualizado && c.status === 'active').length > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  )}
                  <RefreshCcw className={`h-4 w-4 sm:h-5 sm:w-5 ${!showUpdatedOnly ? 'animate-spin-slow' : ''}`} />
                </button>
                {showUpdatedOnly && (
                  <button
                    onClick={() => setShowUpdatedOnly(false)}
                    className="p-2 sm:p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 flex items-center justify-center"
                    title="Limpar Filtro"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                )}
              </div>



              {!isReadOnly && (
                <button
                  onClick={() => {
                    setFormData({ status: 'active', state: '' })
                    setPhotoPreview(null)
                    setSelectedPhotoFile(null)
                    setActiveFormTab(1)
                    setShowFormModal(true)
                  }}
                  className="flex items-center justify-center w-10 h-10 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 shrink-0"
                  title="Novo Integrante"
                >
                  <Plus className="h-5 w-5" />
                </button>
              )}

              {!isReadOnly && selectedIds.length > 0 && (
                <button
                  onClick={handleGenerateLinks}
                  disabled={generatingLinks}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2 sm:py-2.5 rounded-xl font-bold uppercase tracking-wider transition-all shadow-lg text-[10px] sm:text-xs shrink-0"
                >
                  {generatingLinks ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                  Gerar Links ({selectedIds.length})
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4 border-l border-gray-100 pl-4 ml-2">
              <div className="flex items-center gap-1.5 p-1 bg-white border border-gray-100 rounded-xl shadow-sm">
                <button
                  onClick={handleClearAdvancedFilters}
                  className="p-2 sm:p-2.5 text-[#1e3a8a] hover:bg-blue-50 focus:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 flex items-center justify-center relative"
                  title="Limpar Filtros"
                >
                  {hasActiveAdvancedFilters && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  )}
                  <FilterX className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>

              <div className="relative z-[150]">
                <button
                  onClick={() => {
                    setExportTargetList('search');
                    setShowColumnSelectModal(true);
                  }}
                  className="flex items-center justify-center w-10 h-10 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 shrink-0"
                  title="Exportar Planilha"
                >
                  <FileDown className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>



      {activeMainTab === 'Integrantes' && (
        <>
          {!isReadOnly && (
            <div className="flex flex-col lg:flex-row items-stretch gap-4">
              {/* Card de KPI */}
              <div className="flex items-stretch shrink-0">
                <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Users className="h-5 w-5 text-[#1e3a8a]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none">Ativos</span>
                    <span className="text-xl font-black text-[#0a192f] leading-tight">{filtered.filter(c => c.status === 'active').length}</span>
                  </div>
                </div>
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
          )}

          {/* Table/Grid */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden animate-in slide-in-from-bottom-6 duration-700">
            <div
              ref={listContainerRef}
              className="flex-1 overflow-auto custom-scrollbar-table relative pb-4"
            >
              <table className="w-full min-w-[1000px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
                    <th className="px-6 py-4 w-12 text-center border-b border-white/10">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-[#1e3a8a] border-white/20 bg-white/10 focus:ring-amber-500 cursor-pointer"
                        onChange={handleSelectAll}
                        checked={filtered.filter(c => c.status === 'active').length > 0 && selectedIds.length === filtered.filter(c => c.status === 'active').length}
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-white uppercase tracking-wider">Integrante</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-white uppercase tracking-wider">Cargo</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-white uppercase tracking-wider">Sócio</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-white uppercase tracking-wider">Líder</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-white uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-white uppercase tracking-wider rounded-tr-xl">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Loader2 className="h-8 w-8 text-[#1e3a8a] animate-spin mx-auto mb-2" />
                        <p className="text-gray-400 text-xs font-medium">Carregando integrantes...</p>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        <UserX className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-medium">Nenhum integrante encontrado.</p>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {/* APROVADOS (PRÉ-CADASTRO) */}
                      {filtered.some(c => c.status === 'Pré-Cadastro') && (
                        <tr className="bg-amber-50/80">
                          <td colSpan={7} className="px-6 py-3 border-y border-amber-200">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800 flex items-center gap-2">
                              <UserPlus className="h-4 w-4" /> Pré-Cadastro (Aprovado em Vaga)
                            </p>
                          </td>
                        </tr>
                      )}
                      {filtered.filter(c => c.status === 'Pré-Cadastro').map((c) => (
                        <tr key={c.id} onClick={() => handleRowClick(c)} className="bg-amber-50/30 hover:bg-amber-50/60 cursor-pointer transition-colors group">
                          <td className="px-6 py-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded text-amber-600 border-amber-300 focus:ring-amber-600 cursor-pointer"
                              checked={selectedIds.includes(c.id)}
                              onChange={(e) => handleSelect(e, c.id)}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar src={c.photo_url} name={c.name} onImageClick={(e: any) => { e.stopPropagation(); c.photo_url && setViewingPhoto(c.photo_url) }} />
                              <div>
                                <p className="font-bold text-sm text-[#0a192f]">{toTitleCase(c.name)}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {c.matricula_interna && <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-700 border border-amber-200">{c.matricula_interna}</span>}
                                  <p className="text-[10px] text-gray-400 font-medium">{c.email}</p>
                                </div>
                                {c.perfil && c.perfil.split('\n').filter((l: string) => l.trim()).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    <span className="px-1.5 py-0.5 bg-amber-100/50 text-amber-700 border border-amber-200/50 rounded text-[8px] font-bold uppercase tracking-wider">
                                      {c.perfil.split('\n').filter((l: string) => l.trim()).length} tag{c.perfil.split('\n').filter((l: string) => l.trim()).length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-[#0a192f]">{toTitleCase((c as any).roles?.name || c.role || '')}</p>
                            {(() => {
                              const atu = (c as any).atuacoes?.name || c.atuacao || '';
                              const tags = atu.split(',').filter((t: string) => t.trim().length > 0);
                              if (tags.length > 1) {
                                return (
                                  <div className="flex mt-1">
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded text-[9px] font-bold uppercase tracking-widest">
                                      {tags.length} tags
                                    </span>
                                  </div>
                                );
                              }
                              return <p className="text-[10px] text-gray-400 font-medium mt-0.5 leading-snug">{toTitleCase(atu)}</p>;
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-700">{(c as any).partner?.name || '-'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-700">{(c as any).leader?.name || '-'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border bg-amber-100 text-amber-800 border-amber-300">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                              Pré-Cadastro
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!isReadOnly && (
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); handleEdit(c) }} className="p-2 text-[#1e3a8a] hover:bg-[#1e3a8a]/10 rounded-xl transition-all hover:scale-110 active:scale-95"><Pencil className="h-4 w-4" /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(c) }} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-110 active:scale-95"><Trash2 className="h-4 w-4" /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}

                      {/* ATIVOS */}
                      {filtered.some(c => c.status === 'active') && filtered.some(c => c.status === 'Pré-Cadastro') && (
                        <tr className="bg-blue-50/50">
                          <td colSpan={7} className="px-6 py-3 border-y border-blue-100">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1e3a8a] flex items-center gap-2">
                              <Users className="h-4 w-4" /> Equipe Ativa
                            </p>
                          </td>
                        </tr>
                      )}
                      {filtered.filter(c => c.status === 'active').map((c) => (
                        <tr key={c.id} onClick={() => handleRowClick(c)} className="hover:bg-blue-50/30 cursor-pointer transition-colors group">
                          <td className="px-6 py-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded text-[#1e3a8a] border-gray-300 focus:ring-[#1e3a8a] cursor-pointer"
                              checked={selectedIds.includes(c.id)}
                              onChange={(e) => handleSelect(e, c.id)}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar src={c.photo_url} name={c.name} onImageClick={(e: any) => { e.stopPropagation(); c.photo_url && setViewingPhoto(c.photo_url) }} />
                              <div>
                                <p className="font-bold text-sm text-[#0a192f]">{toTitleCase(c.name)}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {c.matricula_interna && <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-600 border border-blue-100">{c.matricula_interna}</span>}
                                  <p className="text-[10px] text-gray-400 font-medium">{c.email}</p>
                                </div>
                                {c.perfil && c.perfil.split('\n').filter((l: string) => l.trim()).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    <span className="px-1.5 py-0.5 bg-blue-50/50 text-blue-600 border border-blue-100/50 rounded text-[8px] font-bold uppercase tracking-wider">
                                      {c.perfil.split('\n').filter((l: string) => l.trim()).length} tag{c.perfil.split('\n').filter((l: string) => l.trim()).length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-[#0a192f]">{toTitleCase((c as any).roles?.name || c.role || '')}</p>
                            {(() => {
                              const atu = (c as any).atuacoes?.name || c.atuacao || '';
                              const tags = atu.split(',').filter((t: string) => t.trim().length > 0);
                              if (tags.length > 1) {
                                return (
                                  <div className="flex mt-1">
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded text-[9px] font-bold uppercase tracking-widest">
                                      {tags.length} tags
                                    </span>
                                  </div>
                                );
                              }
                              return <p className="text-[10px] text-gray-400 font-medium mt-0.5 leading-snug">{toTitleCase(atu)}</p>;
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-700">{(c as any).partner?.name || '-'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-700">{(c as any).leader?.name || '-'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border bg-green-50 text-green-700 border-green-200">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              Ativo
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!isReadOnly && (
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); handleEdit(c) }} className="p-2 text-[#1e3a8a] hover:bg-[#1e3a8a]/10 rounded-xl transition-all hover:scale-110 active:scale-95"><Pencil className="h-4 w-4" /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(c) }} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-110 active:scale-95"><Trash2 className="h-4 w-4" /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}

                      {/* INATIVOS */}
                      {filtered.some(c => c.status !== 'active' && c.status !== 'Pré-Cadastro') && (
                        <tr className="bg-gray-50/50">
                          <td colSpan={7} className="px-6 py-3 border-y border-gray-100">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Inativos</p>
                          </td>
                        </tr>
                      )}
                      {filtered.filter(c => c.status !== 'active' && c.status !== 'Pré-Cadastro').map(c => (
                        <tr key={c.id} onClick={() => handleRowClick(c)} className="hover:bg-red-50/10 cursor-pointer transition-colors group grayscale hover:grayscale-0 opacity-70 hover:opacity-100">
                          <td className="px-6 py-4 w-12 text-center">
                            {/* Disabled checkbox for inactive users */}
                            <input type="checkbox" disabled className="w-4 h-4 rounded border-gray-200 bg-gray-100 cursor-not-allowed opacity-50" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar src={c.photo_url} name={c.name} onImageClick={(e: any) => { e.stopPropagation(); c.photo_url && setViewingPhoto(c.photo_url) }} />
                              <div>
                                <p className="font-bold text-sm text-[#0a192f]">{toTitleCase(c.name)}</p>
                                {c.matricula_interna && <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-gray-100 text-gray-500 border border-gray-200">{c.matricula_interna}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-[#0a192f]">{toTitleCase((c as any).roles?.name || c.role || '')}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-700">{(c as any).partner?.name || '-'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-700">{(c as any).leader?.name || '-'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border bg-red-50 text-red-700 border-red-200">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Inativo
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!isReadOnly && (
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); handleEdit(c) }} className="p-2 text-[#1e3a8a] hover:bg-[#1e3a8a]/10 rounded-xl transition-all hover:scale-110 active:scale-95"><Pencil className="h-4 w-4" /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(c) }} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-110 active:scale-95"><Trash2 className="h-4 w-4" /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeMainTab === 'Relatórios' && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-5 duration-600 flex-1 overflow-auto custom-scrollbar">

          {activeReportView === 'menu' ? (
            <div className="flex flex-col h-full">

              {/* Grid de opções originais e Modelos Salvos */}
              <div>
                <h3 className="text-xl font-black text-[#1e3a8a] mb-6 mt-4">Ferramentas e Relatórios</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 h-fit">
                  <button
                    onClick={() => setActiveReportView('filtros')}
                    className="group relative flex flex-col p-8 bg-white rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 text-left overflow-hidden h-full"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10 w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                      <Filter className="h-7 w-7" />
                    </div>
                    <h3 className="relative z-10 text-xl font-black text-[#1e3a8a] mb-2 group-hover:text-[#112240]">Opções de Filtro</h3>
                    <p className="relative z-10 text-sm text-gray-500 font-medium flex-1">Gere relatórios customizados avançados utilizando múltiplos critérios de filtragem para toda a equipe.</p>
                    <div className="relative z-10 mt-8 flex items-center gap-2 text-blue-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      Acessar Filtros <ArrowRight className="h-4 w-4" />
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveReportView('vt')}
                    className="group relative flex flex-col p-8 bg-white rounded-2xl border border-gray-200 hover:border-emerald-400 hover:shadow-2xl transition-all duration-300 text-left overflow-hidden h-full"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10 w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                      <Bus className="h-7 w-7" />
                    </div>
                    <h3 className="relative z-10 text-xl font-black text-[#1e3a8a] mb-2 group-hover:text-[#112240]">Custo de Vale Transporte</h3>
                    <p className="relative z-10 text-sm text-gray-500 font-medium flex-1">Análise, comparativo e projeção de custos com transportes para o mês vigente (CLT e Estagiários).</p>
                    <div className="relative z-10 mt-8 flex items-center gap-2 text-emerald-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      Acessar Relatório <ArrowRight className="h-4 w-4" />
                    </div>
                  </button>

                  {/* NOVO BOTÃO: Modelos Salvos */}
                  <button
                    onClick={() => setActiveReportView('modelos')}
                    className="group relative flex flex-col p-8 bg-white rounded-2xl border border-gray-200 hover:border-indigo-500 hover:shadow-2xl transition-all duration-300 text-left overflow-hidden h-full"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10 w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                      <FileSpreadsheet className="h-7 w-7" />
                    </div>
                    <h3 className="relative z-10 text-xl font-black text-[#1e3a8a] mb-2 group-hover:text-[#112240]">Modelos Salvos</h3>
                    <p className="relative z-10 text-sm text-gray-500 font-medium flex-1">Repositório de colunas e relatórios customizados salvos. Gere planilhas formatadas na hora.</p>
                    <div className="relative z-10 mt-8 flex items-center gap-2 text-indigo-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      Acessar Repositório <ArrowRight className="h-4 w-4" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300 relative">
              <div className="pb-6 mb-2 border-b border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setActiveReportView('menu')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-[#1e3a8a] rounded-xl transition-colors text-xs font-bold border border-gray-200 shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar para Menu de Relatórios
                </button>
                {activeReportView === 'filtros' && (
                  <button
                    onClick={handleClearAdvancedFilters}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors text-xs font-bold uppercase tracking-wider"
                  >
                    <X className="h-4 w-4" /> Limpar Filtros
                  </button>
                )}
              </div>

              {activeReportView === 'filtros' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="space-y-8">
                    {/* Pessoais */}
                    <div>
                      <h3 className="text-sm font-bold text-[#1e3a8a] mb-4 flex items-center gap-2 border-b pb-2"><User className="h-4 w-4" /> Filtros Pessoais</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative z-[120]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Gênero</label>
                          <SearchableSelect
                            value={advFilterGender}
                            onChange={setAdvFilterGender}
                            options={[
                              { id: 'Masculino', label: 'Masculino', value: 'Masculino' },
                              { id: 'Feminino', label: 'Feminino', value: 'Feminino' },
                              { id: 'Outro', label: 'Outro', value: 'Outro' }
                            ]}
                            placeholder="Todos..."
                          />
                        </div>
                        <div className="relative z-[119]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Filhos</label>
                          <SearchableSelect
                            value={advFilterChildren}
                            onChange={(val) => setAdvFilterChildren(val as any)}
                            options={[
                              { id: 'sim', label: 'Sim', value: 'sim' },
                              { id: 'nao', label: 'Não', value: 'nao' }
                            ]}
                            placeholder="Todos..."
                          />
                        </div>
                        <div className="col-span-1 md:col-span-2 relative z-[110]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Estado (Moradia)</label>
                          <SearchableSelect
                            value={advFilterStateHome}
                            onChange={setAdvFilterStateHome}
                            options={ESTADOS_BRASIL.map(e => ({ id: e.nome, label: e.nome, value: e.nome }))}
                            placeholder="Selecione..."
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Período Nasc. (Início e Fim)</label>
                          <div className="flex items-center gap-2">
                            <div className="relative w-full">
                              <input type="date" className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium pr-8" value={advFilterBirthStart} onChange={e => setAdvFilterBirthStart(e.target.value)} />
                              {advFilterBirthStart && <button onClick={() => setAdvFilterBirthStart('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 bg-gray-50 p-0.5 rounded-full"><X className="h-4 w-4" /></button>}
                            </div>
                            <span className="text-gray-400">-</span>
                            <div className="relative w-full">
                              <input type="date" className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium pr-8" value={advFilterBirthEnd} onChange={e => setAdvFilterBirthEnd(e.target.value)} />
                              {advFilterBirthEnd && <button onClick={() => setAdvFilterBirthEnd('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 bg-gray-50 p-0.5 rounded-full"><X className="h-4 w-4" /></button>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-end pb-2">
                          {advFilterBirthStart && advFilterBirthEnd && (
                            <div className="bg-blue-50 text-blue-700 text-xs px-3 py-2 rounded-lg font-bold border border-blue-100 flex items-center">
                              Intervalo Etário Selecionado: &nbsp;<span className="text-[#1e3a8a]">{calcAgeRange(advFilterBirthStart, advFilterBirthEnd)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Corporativos */}
                    <div>
                      <h3 className="text-sm font-bold text-[#1e3a8a] mb-4 flex items-center gap-2 border-b pb-2"><Briefcase className="h-4 w-4" /> Filtros Corporativos</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative z-[118]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
                          <SearchableSelect
                            value={advFilterStatus}
                            onChange={(val) => setAdvFilterStatus(val as any)}
                            options={[
                              { id: 'active', label: 'Ativo', value: 'active' },
                              { id: 'inactive', label: 'Inativo', value: 'inactive' }
                            ]}
                            placeholder="Todos..."
                          />
                        </div>
                        <div className="relative z-[109]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Rateio</label>
                          <SearchableSelect
                            value={advFilterRateio}
                            onChange={setAdvFilterRateio}
                            options={rateios.map(r => ({ id: String(r.id), label: r.name, value: String(r.id) }))}
                            placeholder="Todos..."
                          />
                        </div>
                        <div className="relative z-[116]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Área</label>
                          <SearchableSelect
                            value={advFilterArea}
                            onChange={setAdvFilterArea}
                            options={[
                              { id: 'Administrativa', label: 'Administrativa', value: 'Administrativa' },
                              { id: 'Jurídica', label: 'Jurídica', value: 'Jurídica' }
                            ]}
                            placeholder="Todas..."
                          />
                        </div>
                        <div className="relative z-[115]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Tipo de Contratação</label>
                          <SearchableSelect
                            value={advFilterContractType}
                            onChange={setAdvFilterContractType}
                            options={[
                              { id: 'ADVOGADO ASSOCIADO', label: 'Advogado Associado', value: 'ADVOGADO ASSOCIADO' },
                              { id: 'CLT', label: 'CLT', value: 'CLT' },
                              { id: 'Sócio', label: 'Sócio', value: 'Sócio' },
                              { id: 'Associado', label: 'Associado', value: 'Associado' },
                              { id: 'Estágio', label: 'Estágio', value: 'Estágio' },
                              { id: 'Jovem Aprendiz', label: 'Jovem Aprendiz', value: 'Jovem Aprendiz' },
                              { id: 'Terceirizado', label: 'Terceirizado', value: 'Terceirizado' },
                              { id: 'Outros', label: 'Outros', value: 'Outros' }
                            ]}
                            placeholder="Todos..."
                          />
                        </div>

                        <div className="relative z-[115]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Tipo de Sócio</label>
                          <SearchableSelect
                            value={advFilterPartnerType}
                            onChange={setAdvFilterPartnerType}
                            options={[
                              { id: 'Sócio de Serviço', label: 'Sócio de Serviço', value: 'Sócio de Serviço' },
                              { id: 'Sócio de Capital', label: 'Sócio de Capital', value: 'Sócio de Capital' },
                              { id: 'Sócio Administrador', label: 'Sócio Administrador', value: 'Sócio Administrador' }
                            ]}
                            placeholder="Todos..."
                          />
                        </div>

                        <div className="relative z-[114]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Meio de Transporte</label>
                          <SearchableSelect
                            value={advFilterTransporteTipo}
                            onChange={setAdvFilterTransporteTipo}
                            options={[
                              { id: 'Integração Bilhete Único', label: 'Integração Bilhete Único', value: 'Integração Bilhete Único' },
                              { id: 'Metrô', label: 'Metrô', value: 'Metrô' },
                              { id: 'Ônibus', label: 'Ônibus', value: 'Ônibus' },
                              { id: 'Trem', label: 'Trem', value: 'Trem' },
                              { id: 'Van', label: 'Van', value: 'Van' },
                              { id: 'BRT', label: 'BRT', value: 'BRT' },
                              { id: 'VLT', label: 'VLT', value: 'VLT' },
                              { id: 'Barcas', label: 'Barcas', value: 'Barcas' },
                              { id: 'Não Optante', label: 'Não Optante', value: 'Não Optante' }
                            ]}
                            placeholder="Todos..."
                          />
                        </div>

                        <div className="relative z-[108]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Sócio Responsável</label>
                          <SearchableSelect value={advFilterPartner} onChange={setAdvFilterPartner} options={partnerOptions as any} placeholder="Todos..." />
                        </div>
                        <div className="relative z-[107]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Líder Direto</label>
                          <SearchableSelect value={advFilterLeader} onChange={setAdvFilterLeader} options={liderOptions as any} placeholder="Todos..." />
                        </div>
                        <div className="relative z-[106]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Equipe</label>
                          <SearchableSelect value={advFilterTeam} onChange={setAdvFilterTeam} table="teams" placeholder="Todas..." />
                        </div>
                        <div className="relative z-[105]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Cargo</label>
                          <SearchableSelect value={advFilterRole} onChange={setAdvFilterRole} options={roleOptions as any} placeholder="Todos..." />
                        </div>
                        <div className="relative z-[104]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Local</label>
                          <SearchableSelect value={advFilterLocal} onChange={setAdvFilterLocal} options={locationOptions as any} placeholder="Todos..." />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Período Admissão (Início e Fim)</label>
                          <div className="flex items-center gap-2 w-full">
                            <input type="date" className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={advFilterAdmissionStart} onChange={e => setAdvFilterAdmissionStart(e.target.value)} />
                            <span className="text-gray-400">-</span>
                            <input type="date" className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={advFilterAdmissionEnd} onChange={e => setAdvFilterAdmissionEnd(e.target.value)} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Período Desligamento (Início e Fim)</label>
                          <div className="flex items-center gap-2 w-full">
                            <input type="date" className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={advFilterTerminationStart} onChange={e => setAdvFilterTerminationStart(e.target.value)} />
                            <span className="text-gray-400">-</span>
                            <input type="date" className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={advFilterTerminationEnd} onChange={e => setAdvFilterTerminationEnd(e.target.value)} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Período Ativo (Início e Fim)</label>
                          <div className="flex items-center gap-2 w-full">
                            <input type="date" className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={advFilterActivePeriodStart} onChange={e => setAdvFilterActivePeriodStart(e.target.value)} />
                            <span className="text-gray-400">-</span>
                            <input type="date" className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={advFilterActivePeriodEnd} onChange={e => setAdvFilterActivePeriodEnd(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Escolares */}
                    <div>
                      <h3 className="text-sm font-bold text-[#1e3a8a] mb-4 flex items-center gap-2 border-b pb-2"><GraduationCap className="h-4 w-4" /> Filtros Escolares</h3>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                        <div className="relative z-[113]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Graduação Completa</label>
                          <SearchableSelect
                            value={advFilterGraduationComplete}
                            onChange={(val) => setAdvFilterGraduationComplete(val as any)}
                            options={[
                              { id: 'sim', label: 'Sim', value: 'sim' },
                              { id: 'nao', label: 'Não', value: 'nao' }
                            ]}
                            placeholder="Todos..."
                          />
                        </div>
                        <div className="relative z-[112]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">UF (Graduação)</label>
                          <SearchableSelect value={advFilterGraduationUF} onChange={(v) => { setAdvFilterGraduationUF(v); setAdvFilterGraduationInstitution(''); }} options={ESTADOS_BRASIL.map(e => ({ id: e.sigla, label: e.nome, value: e.sigla }))} placeholder="Todos..." />
                        </div>
                        <div className="relative z-[111]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Instituição</label>
                          <SearchableSelect value={advFilterGraduationInstitution} onChange={setAdvFilterGraduationInstitution} options={graduationInstitutionOptions} placeholder="Todas..." disabled={!advFilterGraduationUF} />
                        </div>
                        <div className="relative z-[110]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Ano Prev. Conclusão</label>
                          <input type="text" placeholder="Ex: 2025" className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium pr-8" value={advFilterGraduationExpected} onChange={e => setAdvFilterGraduationExpected(e.target.value)} />
                          {advFilterGraduationExpected && <button onClick={() => setAdvFilterGraduationExpected('')} className="absolute right-2 top-[34px] text-gray-400 hover:text-red-500 bg-gray-50 p-0.5 rounded-full z-10"><X className="h-4 w-4" /></button>}
                        </div>
                        <div className="relative z-[109]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Ano de Conclusão</label>
                          <input type="text" placeholder="Ex: 2020" className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium pr-8" value={advFilterGraduationCompletion} onChange={e => setAdvFilterGraduationCompletion(e.target.value)} />
                          {advFilterGraduationCompletion && <button onClick={() => setAdvFilterGraduationCompletion('')} className="absolute right-2 top-[34px] text-gray-400 hover:text-red-500 bg-gray-50 p-0.5 rounded-full z-10"><X className="h-4 w-4" /></button>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="relative z-[108]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Pós-Graduação Comp.</label>
                          <SearchableSelect
                            value={advFilterPostGraduationComplete}
                            onChange={(val) => setAdvFilterPostGraduationComplete(val as any)}
                            options={[
                              { id: 'sim', label: 'Sim', value: 'sim' },
                              { id: 'nao', label: 'Não', value: 'nao' }
                            ]}
                            placeholder="Todos..."
                          />
                        </div>
                        <div className="relative z-[107]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">UF (Pós)</label>
                          <SearchableSelect value={advFilterPostGraduationUF} onChange={(v) => { setAdvFilterPostGraduationUF(v); setAdvFilterPostGraduationInstitution(''); }} options={ESTADOS_BRASIL.map(e => ({ id: e.sigla, label: e.nome, value: e.sigla }))} placeholder="Todos..." />
                        </div>
                        <div className="relative z-[106]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Instituição</label>
                          <SearchableSelect value={advFilterPostGraduationInstitution} onChange={setAdvFilterPostGraduationInstitution} options={postGraduationInstitutionOptions} placeholder="Todas..." disabled={!advFilterPostGraduationUF} />
                        </div>
                        <div className="relative z-[105]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Ano Prev. Conclusão</label>
                          <input type="text" placeholder="Ex: 2025" className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium pr-8" value={advFilterPostGraduationExpected} onChange={e => setAdvFilterPostGraduationExpected(e.target.value)} />
                          {advFilterPostGraduationExpected && <button onClick={() => setAdvFilterPostGraduationExpected('')} className="absolute right-2 top-[34px] text-gray-400 hover:text-red-500 bg-gray-50 p-0.5 rounded-full z-10"><X className="h-4 w-4" /></button>}
                        </div>
                        <div className="relative z-[104]">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Ano de Conclusão</label>
                          <input type="text" placeholder="Ex: 2020" className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium pr-8" value={advFilterPostGraduationCompletion} onChange={e => setAdvFilterPostGraduationCompletion(e.target.value)} />
                          {advFilterPostGraduationCompletion && <button onClick={() => setAdvFilterPostGraduationCompletion('')} className="absolute right-2 top-[34px] text-gray-400 hover:text-red-500 bg-gray-50 p-0.5 rounded-full z-10"><X className="h-4 w-4" /></button>}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-8 border-t border-gray-100 pt-6">
                      <button
                        onClick={() => {
                          const tempFiltered = getAdvancedFiltered('');
                          if (tempFiltered.length > 0) {
                            setExportTargetList('search');
                            setShowColumnSelectModal(true);
                          } else {
                            alert('Nenhum integrante encontrado com os filtros informados.');
                          }
                        }}
                        className="flex items-center gap-2 px-8 py-3 bg-[#1e3a8a] text-white rounded-xl font-black uppercase tracking-wider hover:bg-[#112240] transition-colors shadow-lg active:scale-95 text-sm cursor-pointer"
                      >
                        <FileSpreadsheet className="h-5 w-5 mr-1" />
                        Pesquisar e Exportar
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* Relatório de VT (CLT e Estagiários) */}
              {activeReportView === 'modelos' && (
                <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-full">
                  <div className="flex flex-col">
                    <h3 className="text-xl font-black text-[#1e3a8a] mb-2">Modelos de Relatório Salvos</h3>
                    <p className="text-sm text-gray-500 mb-6">Selecione um dos modelos abaixo para exportar a planilha imediatamente, respeitando os filtros avançados ativos caso tenha algum aplicado.</p>
                  </div>
                  <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <ReportTemplatesList onApplyTemplate={handleApplyTemplate} refreshTrigger={refreshTemplates} />
                  </div>
                </div>
              )}

              {activeReportView === 'vt' && (
                <div className="flex flex-col h-full animate-in fade-in duration-500">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-[#1e3a8a] flex items-center gap-2">
                      <Bus className="h-5 w-5 text-amber-500" /> Custo de Vale Transporte (CLT e Estagiários)
                    </h3>
                    <div className="relative flex items-center gap-2">
                      <button
                        onClick={handleExportVTPDF}
                        disabled={exportingPDF}
                        className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-xl font-black uppercase tracking-wider hover:bg-red-700 transition-colors shadow-xl active:scale-95 text-xs disabled:opacity-50"
                      >
                        {exportingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                        {exportingPDF ? 'Gerando...' : 'Exportar PDF'}
                      </button>
                      <button
                        onClick={() => setShowExportVTMenu(!showExportVTMenu)}
                        className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-xl active:scale-95 text-xs"
                      >
                        <FileSpreadsheet className="h-4 w-4" /> Exportar Relação (XLSX) <ChevronDown className="h-4 w-4 ml-1" />
                      </button>

                      {showExportVTMenu && (
                        <>
                          <div className="fixed inset-0 z-[190]" onClick={() => setShowExportVTMenu(false)}></div>
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-[200] overflow-hidden py-1">
                            <button
                              onClick={() => handleExportVT('Estagiários')}
                              className="w-full text-left px-4 py-2.5 text-sm text-[#0a192f] hover:bg-gray-50 flex items-center gap-2 font-medium"
                            >
                              <GraduationCap className="h-4 w-4 text-emerald-600" />
                              Estagiários
                            </button>
                            <button
                              onClick={() => handleExportVT('CLTs')}
                              className="w-full text-left px-4 py-2.5 text-sm text-[#0a192f] hover:bg-gray-50 flex items-center gap-2 font-medium"
                            >
                              <Briefcase className="h-4 w-4 text-emerald-600" />
                              CLTs
                            </button>
                            <button
                              onClick={() => handleExportVT('Todos')}
                              className="w-full text-left px-4 py-2.5 text-sm text-[#0a192f] hover:bg-gray-50 flex items-center gap-2 font-medium"
                            >
                              <Users className="h-4 w-4 text-emerald-600" />
                              Todos (CLT e Estágio)
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
                    <div ref={vtReportRef} className="bg-[#f8fafc] p-4 rounded-xl">
                      {(() => {
                        const workingDays = getWorkingDaysInCurrentMonth();
                        const activeColabs = colaboradores.filter(c => c.status === 'active');

                        let totalActualEstagio = 0;
                        let countEstagio = 0;
                        let totalActualCLT = 0;
                        let countCLT = 0;

                        activeColabs.forEach(c => {
                          const roleName = ((c as any).roles?.name || String(c.role || '')).toLowerCase();
                          const isEstagio = c.contract_type === 'Estágio' || roleName.includes('estagiário') || roleName.includes('estagiario') || roleName.includes('estagio') || roleName.includes('estágio');
                          const isCLT = c.contract_type === 'CLT' && !isEstagio;

                          if (isEstagio || isCLT) {
                            let colabVtDaily = 0;
                            if (c.transportes && Array.isArray(c.transportes)) {
                              colabVtDaily = c.transportes.reduce((tAcc, t) => {
                                const idaSum = (t.ida_valores || []).reduce((sum, v) => sum + (v || 0), 0);
                                const voltaSum = (t.volta_valores || []).reduce((sum, v) => sum + (v || 0), 0);
                                return tAcc + idaSum + voltaSum;
                              }, 0);
                            }
                            if (isEstagio) {
                              totalActualEstagio += colabVtDaily * workingDays;
                              countEstagio++;
                            } else if (isCLT) {
                              totalActualCLT += colabVtDaily * workingDays;
                              countCLT++;
                            }
                          }
                        });

                        const economiaCen1 = totalActualEstagio - (countEstagio * customVt1);
                        const economiaCen2 = totalActualEstagio - (countEstagio * customVt2);

                        const chartData = [
                          {
                            name: 'Custo Total',
                            'Atual': totalActualEstagio,
                            'Cenário 1': countEstagio * customVt1,
                            'Cenário 2': countEstagio * customVt2
                          },
                          {
                            name: 'Economia Projetada',
                            'Atual': 0,
                            'Cenário 1': economiaCen1,
                            'Cenário 2': economiaCen2
                          }
                        ];

                        return (
                          <div className="mb-8 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-md font-black text-[#1e3a8a] uppercase tracking-wider mb-4">Comparativo de Custos Mensais (Apenas Estagiários)</h4>
                            <div className="h-64 w-full mt-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={chartData}
                                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                  <YAxis
                                    tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                  />
                                  <RechartsTooltip
                                    formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f1f5f9' }}
                                  />
                                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                  <Bar dataKey="Atual" fill="#1e3a8a" radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="Atual" position="top" formatter={(val: number) => val === 0 ? '' : `R$ ${val.toLocaleString('pt-BR')}`} style={{ fontSize: '10px', fontWeight: 'bold', fill: '#1e3a8a' }} />
                                  </Bar>
                                  <Bar dataKey="Cenário 1" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                                    <LabelList
                                      dataKey="Cenário 1"
                                      position="top"
                                      content={(props: any) => {
                                        const { x, y, width, value, index } = props;
                                        if (value === 0) return null;
                                        if (index === 1) { // Economia Projetada
                                          const percCen1 = totalActualEstagio > 0 ? ((economiaCen1 / totalActualEstagio) * 100).toFixed(1) : '0.0';
                                          return (
                                            <g>
                                              <text x={x + width / 2} y={y - 15} fill="#f59e0b" fontSize="10px" fontWeight="bold" textAnchor="middle">
                                                R$ {value.toLocaleString('pt-BR')}
                                              </text>
                                              <text x={x + width / 2} y={y - 5} fill="#f59e0b" fontSize="10px" fontWeight="bold" textAnchor="middle">
                                                ({percCen1}%)
                                              </text>
                                            </g>
                                          );
                                        }
                                        return (
                                          <text x={x + width / 2} y={y - 5} fill="#f59e0b" fontSize="10px" fontWeight="bold" textAnchor="middle">
                                            R$ {value.toLocaleString('pt-BR')}
                                          </text>
                                        );
                                      }}
                                    />
                                  </Bar>
                                  <Bar dataKey="Cenário 2" fill="#10b981" radius={[4, 4, 0, 0]}>
                                    <LabelList
                                      dataKey="Cenário 2"
                                      position="top"
                                      content={(props: any) => {
                                        const { x, y, width, value, index } = props;
                                        if (value === 0) return null;
                                        if (index === 1) { // Economia Projetada
                                          const percCen2 = totalActualEstagio > 0 ? ((economiaCen2 / totalActualEstagio) * 100).toFixed(1) : '0.0';
                                          return (
                                            <g>
                                              <text x={x + width / 2} y={y - 15} fill="#10b981" fontSize="10px" fontWeight="bold" textAnchor="middle">
                                                R$ {value.toLocaleString('pt-BR')}
                                              </text>
                                              <text x={x + width / 2} y={y - 5} fill="#10b981" fontSize="10px" fontWeight="bold" textAnchor="middle">
                                                ({percCen2}%)
                                              </text>
                                            </g>
                                          );
                                        }
                                        return (
                                          <text x={x + width / 2} y={y - 5} fill="#10b981" fontSize="10px" fontWeight="bold" textAnchor="middle">
                                            R$ {value.toLocaleString('pt-BR')}
                                          </text>
                                        );
                                      }}
                                    />
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        );
                      })()}

                      {[
                        { type: 'Estágio', label: 'Estagiário', isExpanded: exportingPDF ? true : isVtEstagioExpanded, setIsExpanded: setIsVtEstagioExpanded },
                        { type: 'CLT', label: 'CLT', isExpanded: isVtCltExpanded, setIsExpanded: setIsVtCltExpanded }
                      ].filter(g => exportingPDF ? g.type === 'Estágio' : true).map((groupConfig, idx) => {
                        const workingDays = getWorkingDaysInCurrentMonth();
                        const activeColabs = colaboradores.filter(c => c.status === 'active');

                        // Filtra os integrantes do grupo atual (Estágio vs CLT)
                        const groupColaboradores = activeColabs
                          .filter(c => {
                            if (groupConfig.type === 'Estágio') {
                              const roleName = ((c as any).roles?.name || String(c.role || '')).toLowerCase();
                              return c.contract_type === 'Estágio' || roleName.includes('estagiário') || roleName.includes('estagiario') || roleName.includes('estagio') || roleName.includes('estágio');
                            }
                            return c.contract_type === groupConfig.type;
                          })
                          .map(c => {
                            let colabVtDaily = 0;
                            if (c.transportes && Array.isArray(c.transportes)) {
                              colabVtDaily = c.transportes.reduce((tAcc, t) => {
                                const idaSum = (t.ida_valores || []).reduce((sum, v) => sum + (v || 0), 0);
                                const voltaSum = (t.volta_valores || []).reduce((sum, v) => sum + (v || 0), 0);
                                return tAcc + idaSum + voltaSum;
                              }, 0);
                            }
                            return {
                              ...c,
                              atuacaoName: (c as any).atuacoes?.name || c.atuacao || 'S/ Atuação',
                              liderName: (c as any).leader?.name || 'S/ Líder',
                              localName: (c as any).locations?.name || c.local || '-',
                              bairroName: (c as any).neighborhood || '-',
                              currentVtTotal: colabVtDaily * workingDays
                            };
                          })
                          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

                        if (groupColaboradores.length === 0) return null;

                        // Agrupando os dados de acordo com o tipo
                        const groupedData: Record<string, typeof groupColaboradores> = {};
                        let overallCount = 0;
                        let overallVt = 0;
                        let overallEconomia1 = 0;
                        let overallEconomia2 = 0;

                        groupColaboradores.forEach(colab => {
                          const groupKey = groupConfig.type === 'Estágio' ? colab.liderName : colab.atuacaoName;
                          if (!groupedData[groupKey]) groupedData[groupKey] = [];
                          groupedData[groupKey].push(colab);

                          overallCount++;
                          overallVt += colab.currentVtTotal;
                          if (groupConfig.type === 'Estágio') {
                            overallEconomia1 += Math.max(0, colab.currentVtTotal - customVt1);
                            overallEconomia2 += Math.max(0, colab.currentVtTotal - customVt2);
                          }
                        });

                        // Ordenar as chaves de agrupamento
                        const sortedGroupKeys = Object.keys(groupedData).sort((a, b) => a.localeCompare(b));

                        return (
                          <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                            <button
                              onClick={() => groupConfig.setIsExpanded(!groupConfig.isExpanded)}
                              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {groupConfig.isExpanded ? <ChevronDown className="h-5 w-5 text-[#1e3a8a]" /> : <ChevronRight className="h-5 w-5 text-[#1e3a8a]" />}
                                <h4 className="text-md font-black text-[#1e3a8a] uppercase tracking-wider">{groupConfig.label} ({overallCount})</h4>
                              </div>
                              <span className="text-sm font-bold text-emerald-700">Total VT: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(overallVt)}</span>
                            </button>

                            {groupConfig.isExpanded && (
                              <div className="overflow-x-auto border-t border-gray-200">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="bg-gradient-to-r from-blue-50 to-white text-[#1e3a8a] text-[10px] uppercase font-black tracking-widest border-b border-blue-100">
                                      <th className="p-4">Integrante</th>
                                      <th className="p-4 text-center">Vínculo</th>
                                      {groupConfig.type === 'CLT' && (
                                        <th className="p-4 text-center">Líder Direto</th>
                                      )}
                                      <th className="p-4 text-center">Local</th>
                                      <th className="p-4 text-center">Bairro</th>
                                      <th className="p-4 text-right">VT Atual</th>

                                      {groupConfig.type === 'Estágio' && (
                                        <>
                                          <th className="p-4 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                              <span>Valor Cenário 1</span>
                                              {exportingPDF ? (
                                                <span className="text-amber-600 font-bold text-xs">Custo Alvo: R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(customVt1)}</span>
                                              ) : (
                                                <div className="flex items-center gap-1" title="Defina o teto do VT neste cenário">
                                                  <span className="text-gray-400 font-medium tooltip">Teto: R$</span>
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    className="w-20 px-2 py-1 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-amber-500 outline-none text-right"
                                                    value={customVt1}
                                                    onChange={(e) => setCustomVt1(Number(e.target.value) || 0)}
                                                    onClick={(e) => e.stopPropagation()}
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          </th>
                                          <th className="p-4 text-right">
                                            <span>Economia (Cenário 1)</span>
                                          </th>
                                          <th className="p-4 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                              <span>Valor Cenário 2</span>
                                              {exportingPDF ? (
                                                <span className="text-amber-600 font-bold text-xs">Custo Alvo: R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(customVt2)}</span>
                                              ) : (
                                                <div className="flex items-center gap-1" title="Defina o teto do VT neste cenário">
                                                  <span className="text-gray-400 font-medium tooltip">Teto: R$</span>
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    className="w-20 px-2 py-1 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-amber-500 outline-none text-right"
                                                    value={customVt2}
                                                    onChange={(e) => setCustomVt2(Number(e.target.value) || 0)}
                                                    onClick={(e) => e.stopPropagation()}
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          </th>
                                          <th className="p-4 text-right">
                                            <span>Economia (Cenário 2)</span>
                                          </th>
                                        </>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                    {sortedGroupKeys.map(groupKey => {
                                      const colabsInGroup = groupedData[groupKey];
                                      const groupSubtotalVt = colabsInGroup.reduce((acc, curr) => acc + curr.currentVtTotal, 0);
                                      const groupSubtotalEco1 = colabsInGroup.reduce((acc, curr) => acc + Math.max(0, curr.currentVtTotal - customVt1), 0);
                                      const groupSubtotalEco2 = colabsInGroup.reduce((acc, curr) => acc + Math.max(0, curr.currentVtTotal - customVt2), 0);
                                      const groupSubtotalValCen1 = groupSubtotalVt - groupSubtotalEco1;
                                      const groupSubtotalValCen2 = groupSubtotalVt - groupSubtotalEco2;

                                      return (
                                        <React.Fragment key={groupKey}>
                                          {/* Cabeçalho do Grupo */}
                                          <tr className="bg-gray-50/80">
                                            <td colSpan={groupConfig.type === 'Estágio' ? 9 : 6} className="p-3 text-xs font-bold text-[#1e3a8a]">
                                              {groupConfig.type === 'Estágio' ? 'Líder Direto: ' : 'Atuação: '} {groupKey} ({colabsInGroup.length})
                                            </td>
                                          </tr>

                                          {/* Linhas do Grupo */}
                                          {colabsInGroup.map(colab => {
                                            const economia1 = Math.max(0, colab.currentVtTotal - customVt1);
                                            const economia2 = Math.max(0, colab.currentVtTotal - customVt2);
                                            const valCen1 = colab.currentVtTotal - economia1;
                                            const valCen2 = colab.currentVtTotal - economia2;

                                            return (
                                              <tr key={colab.id} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="p-4 text-sm font-bold text-[#0a192f] pl-8">{colab.name}</td>
                                                <td className="p-4 text-sm font-medium text-gray-600 text-center">
                                                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-bold">{colab.contract_type}</span>
                                                </td>
                                                {groupConfig.type === 'CLT' && (
                                                  <td className="p-4 text-sm font-medium text-gray-500 text-center">
                                                    {colab.liderName}
                                                  </td>
                                                )}
                                                <td className="p-4 text-sm font-medium text-gray-500 text-center">
                                                  {colab.localName}
                                                </td>
                                                <td className="p-4 text-sm font-medium text-gray-500 text-center">
                                                  {colab.bairroName}
                                                </td>
                                                <td className="p-4 text-sm font-black text-[#1e3a8a] text-right">
                                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(colab.currentVtTotal)}
                                                </td>

                                                {groupConfig.type === 'Estágio' && (
                                                  <>
                                                    <td className="p-4 text-sm font-bold text-gray-600 text-right">
                                                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valCen1)}
                                                    </td>
                                                    <td className="p-4 text-sm font-bold text-gray-600 text-right group-hover:text-amber-600 transition-colors" title={`Se o teto for R$ ${customVt1}, a economia será este valor.`}>
                                                      {economia1 > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(economia1) : '-'}
                                                    </td>
                                                    <td className="p-4 text-sm font-bold text-gray-600 text-right">
                                                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valCen2)}
                                                    </td>
                                                    <td className="p-4 text-sm font-bold text-gray-600 text-right group-hover:text-amber-600 transition-colors" title={`Se o teto for R$ ${customVt2}, a economia será este valor.`}>
                                                      {economia2 > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(economia2) : '-'}
                                                    </td>
                                                  </>
                                                )}
                                              </tr>
                                            );
                                          })}

                                          {/* Subtotal do Grupo */}
                                          <tr className="bg-gray-50/50 border-b-2 border-gray-200">
                                            <td colSpan={groupConfig.type === 'Estágio' ? 4 : 5} className="p-3 text-xs font-bold text-gray-600 text-right">
                                              Subtotal {groupKey}:
                                            </td>
                                            <td className="p-3 text-sm font-black text-[#1e3a8a] text-right">
                                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(groupSubtotalVt)}
                                            </td>
                                            {groupConfig.type === 'Estágio' && (
                                              <>
                                                <td className="p-3 text-sm font-bold text-gray-600 text-right">
                                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(groupSubtotalValCen1)}
                                                </td>
                                                <td className="p-3 text-sm font-bold text-amber-600 text-right">
                                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(groupSubtotalEco1)}
                                                </td>
                                                <td className="p-3 text-sm font-bold text-gray-600 text-right">
                                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(groupSubtotalValCen2)}
                                                </td>
                                                <td className="p-3 text-sm font-bold text-amber-600 text-right">
                                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(groupSubtotalEco2)}
                                                </td>
                                              </>
                                            )}
                                          </tr>
                                        </React.Fragment>
                                      );
                                    })}

                                    {/* Total Geral de todos os grupos combinados */}
                                    <tr className="bg-gradient-to-r from-emerald-50 to-white/50 border-t-2 border-emerald-200">
                                      <td className="p-4 text-sm font-black text-emerald-800 uppercase tracking-wider" colSpan={groupConfig.type === 'Estágio' ? 4 : 5}>Total Geral ({overallCount})</td>
                                      <td className="p-4 text-base font-black text-emerald-700 text-right">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(overallVt)}
                                      </td>
                                      {groupConfig.type === 'Estágio' && (
                                        <>
                                          <td className="p-4 text-base font-bold text-emerald-700/80 text-right">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(overallVt - overallEconomia1)}
                                          </td>
                                          <td className="p-4 text-base font-black text-emerald-700 text-right">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(overallEconomia1)}
                                          </td>
                                          <td className="p-4 text-base font-bold text-emerald-700/80 text-right">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(overallVt - overallEconomia2)}
                                          </td>
                                          <td className="p-4 text-base font-black text-emerald-700 text-right">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(overallEconomia2)}
                                          </td>
                                        </>
                                      )}
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <p className="text-[10px] text-gray-400 mt-3 font-medium flex gap-2">
                        <span className="text-amber-500 font-bold">*</span>
                        Baseado em {getWorkingDaysInCurrentMonth()} dias úteis (Mês Vigente) para colaboradores Ativos (CLT e Estágio).
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeMainTab === 'Tabelas' && !isReadOnly && (
        <TabelasTab />
      )}

      {/* VIEW MODAL (Original Window) */}
      {
        selectedColaborador && renderModalLayout(
          toTitleCase(selectedColaborador.name),
          () => setSelectedColaborador(null),
          activeDetailTab,
          setActiveDetailTab,
          activeDetailTab === 4
            ? <div className="contents">{renderModalContent(activeDetailTab, true, selectedColaborador)}</div>
            : <fieldset disabled className="contents">{renderModalContent(activeDetailTab, true, selectedColaborador)}</fieldset>,
          (
            <>
              <button
                onClick={() => handleDelete(selectedColaborador)}
                className="px-6 py-2.5 text-red-600 font-black text-[9px] uppercase tracking-[0.2em] border border-red-200 rounded-xl hover:bg-red-50 transition-all flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" /> Excluir
              </button>
              <button
                onClick={() => handleEdit(selectedColaborador, activeDetailTab)}
                className="px-6 py-2.5 bg-[#1e3a8a] hover:bg-[#112240] text-white font-black text-[9px] uppercase tracking-[0.2em] rounded-xl hover:shadow-xl transition-all shadow-lg active:scale-95 flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" /> Editar Perfil
              </button>
            </>
          ),
          // Sidebar Content (Display Photo)
          <div className="flex flex-col items-center">
            <div className="w-48 h-48 rounded-full overflow-hidden border-[6px] border-white shadow-xl bg-gray-50 flex items-center justify-center cursor-pointer transition-transform hover:scale-105" onClick={() => selectedColaborador.photo_url && setViewingPhoto(selectedColaborador.photo_url)}>
              {selectedColaborador.photo_url ? (
                <img src={selectedColaborador.photo_url} className="w-full h-full object-cover" alt={selectedColaborador.name} />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center">
                  <span className="text-5xl font-black text-white opacity-50">{selectedColaborador.name?.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            {selectedColaborador.matricula_interna && (
              <div className="mt-4 px-4 py-1.5 bg-gray-100/80 rounded-full border border-gray-200 shadow-sm">
                <span className="text-xs font-black text-gray-500 tracking-wider">{selectedColaborador.matricula_interna}</span>
              </div>
            )}
          </div>,
          false,
          selectedColaborador
        )
      }

      {/* FORM PAGE (Full Page Layout) */}
      {
        showFormModal && renderPageLayout(
          formData.id ? (
            <span className="flex items-baseline gap-3">
              <span>{formData.name || 'Sem Nome'}</span>
              <span className="text-sm sm:text-base font-bold text-gray-400 tracking-normal normal-case">Editando Integrante</span>
            </span>
          ) : 'Novo Integrante',
          () => setShowFormModal(false),
          activeFormTab,
          setActiveFormTab,
          renderModalContent(activeFormTab, false, formData),
          (
            <>
              <button
                onClick={() => setShowFormModal(false)}
                className="px-6 py-3 text-[10px] font-black text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all uppercase tracking-[0.2em]"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSave(true)}
                className="flex items-center gap-2 px-8 py-3 bg-[#1e3a8a] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                <Save className="h-5 w-5" /> Salvar Tudo
              </button>
            </>
          ),
          // Sidebar Content (Photo Upload)
          <PhotoUploadSection
            photoPreview={photoPreview}
            uploadingPhoto={uploadingPhoto}
            photoInputRef={photoInputRef}
            setPhotoPreview={setPhotoPreview}
            onPhotoSelected={setSelectedPhotoFile}
            onRemovePhoto={() => {
              setPhotoPreview(null)
              setSelectedPhotoFile(null)
              setFormData(prev => ({ ...prev, photo_url: undefined, foto_url: undefined }))
            }}
          />,
          true, // isEditMode = true for the form modal
          formData
        )
      }

      {
        viewingPhoto && (
          <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setViewingPhoto(null)}>
            <button className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors" onClick={() => setViewingPhoto(null)}>
              <X className="h-8 w-8" />
            </button>
            <img src={viewingPhoto} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default" onClick={e => e.stopPropagation()} alt="Visualização" />
          </div>
        )
      }

      {/* LINKS MODAL */}
      {
        showLinksModal && createPortal(
          <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl w-full max-w-3xl flex flex-col overflow-hidden shadow-2xl relative">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                    <LinkIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#0a192f]">Links de Atualização Copiáveis</h3>
                    <p className="text-xs text-gray-500 font-medium">Envie estes links únicos para cada integrante.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLinksModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm mb-4 border border-blue-100 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <p>Nesta seção você tem acesso aos links únicos. <strong>Atenção:</strong> Os links expiram em exatos 7 dias contados a partir de agora. Após expirarem, o integrante precisará que você gere e envie um novo link.</p>
                </div>

                {generatedLinks.map((link, idx) => {
                  const isSendingEmail = sendingEmailStatus[idx] || false;
                  return (
                    <div key={idx} className="flex items-center gap-3 bg-white border border-gray-200 p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0 font-bold">
                        {link.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#0a192f] truncate">{toTitleCase(link.name)}</p>
                        <p className="text-xs text-blue-600 font-medium truncate">{link.url}</p>
                      </div>

                      {/* EMail action */}
                      <button
                        disabled={isSendingEmail}
                        onClick={async () => {
                          setSendingEmailStatus(prev => ({ ...prev, [idx]: true }));
                          try {
                            const colabEmail = colaboradores.find(c => c.name === link.name)?.email;

                            if (!colabEmail) {
                              showAlert('Erro', `O integrante ${link.name} não possui um e-mail corporativo cadastrado.`, 'error');
                              return;
                            }

                            await fetch('https://hook.us2.make.com/5lv612jlqx6cqnfwu5qnivxgsvkcphwq', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                nome_colaborador: link.name,
                                email_colaborador: colabEmail,
                                link_atualizacao: link.url
                              })
                            });

                            // With 'no-cors', response type will be 'opaque' and status will be 0.
                            // It won't fail with CORS, but we can't reliably read the status code.
                            // We'll optimistically assume success if no network error was caught.
                            showAlert('Sucesso', `E-mail enviado para o Make.com (${colabEmail})!`, 'success');
                          } catch (error) {
                            showAlert('Erro', 'Ocorreu um erro ao enviar para o Make.com. Verifique o console.', 'error');
                            console.error(error);
                          } finally {
                            setSendingEmailStatus(prev => ({ ...prev, [idx]: false }));
                          }
                        }}
                        className="p-2.5 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-lg transition-colors border border-gray-200 border-dashed group-hover:border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Enviar este link por E-mail (Make.com)"
                      >
                        {isSendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      </button>

                      {/* Copy action */}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`Olá ${toTitleCase(link.name)}, por favor, atualize seus dados no sistema através deste link único: ${link.url}`);
                          showAlert('Sucesso', 'Mensagem pronta copiada para a área de transferência!', 'success');
                        }}
                        className="p-2.5 bg-gray-50 hover:bg-amber-50 text-gray-500 hover:text-amber-600 rounded-lg transition-colors border border-gray-200 border-dashed group-hover:border-amber-200"
                        title="Copiar mensagem pronta com o link"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setShowLinksModal(false)}
                  className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-[#112240] transition-colors shadow-lg"
                >
                  Concluí
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {/* HR NOTIFICATIONS MODAL */}
      {
        showNotificationsModal && createPortal(
          <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col overflow-hidden shadow-2xl relative">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                    <BellRing className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#0a192f]">Avisos do RH</h3>
                    <p className="text-xs text-gray-500 font-medium">Você tem {totalNotifications} {totalNotifications === 1 ? 'pendência' : 'pendências'} de hoje.</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseNotifications}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">

                {/* Mochila Section */}
                {pendingBackpacks.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <Briefcase className="h-4 w-4 text-[#1e3a8a]" />
                      <h4 className="font-bold text-[#0a192f] text-sm uppercase tracking-wider">Entrega de Mochila (3 Meses)</h4>
                    </div>
                    {pendingBackpacks.map(c => (
                      <div key={c.id} className="flex items-center justify-between bg-blue-50/50 border border-blue-100 p-3 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Avatar src={c.photo_url || c.foto_url} name={c.name} size="sm" />
                          <div>
                            <p className="text-sm font-bold text-[#0a192f]">{c.name}</p>
                            <p className="text-[10px] uppercase font-bold text-gray-500">Admissão: {formatDateToDisplay(c.hire_date)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleMarkBackpackDelivered(c.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase transition-colors hover:bg-emerald-600"
                          title="Marcar como Entregue"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Entregue
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Aniversariantes Section */}
                {pendingBirthdays.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <User className="h-4 w-4 text-[#1e3a8a]" />
                      <h4 className="font-bold text-[#0a192f] text-sm uppercase tracking-wider">Aniversariantes do Dia</h4>
                    </div>
                    {pendingBirthdays.map(c => (
                      <div key={c.id} className="flex items-center justify-between bg-amber-50/50 border border-amber-100 p-3 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Avatar src={c.photo_url || c.foto_url} name={c.name} size="sm" />
                          <div>
                            <p className="text-sm font-bold text-[#0a192f]">{c.name}</p>
                            <p className="text-[10px] uppercase font-bold text-gray-500">Data: {formatDateToDisplay(c.birthday)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleMarkBirthdayCongratulated(c.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-bold uppercase transition-colors hover:bg-amber-600"
                          title="Marcar como Feito"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Feito
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={handleCloseNotifications}
                  className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-[#112240] transition-colors shadow-lg"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        description={alertConfig.description}
        variant={alertConfig.variant}
        confirmText="OK"
      />

      <ConfirmationModal
        isOpen={!!gedToDelete}
        onClose={() => setGedToDelete(null)}
        onConfirm={confirmDeleteGed}
        title="Excluir Documento"
        description="Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />

      <ConfirmationModal
        isOpen={!!colaboradorToDelete}
        onClose={() => setColaboradorToDelete(null)}
        onConfirm={confirmDeleteColaborador}
        title="Excluir Integrante"
        description={`Tem certeza que deseja excluir o integrante "${colaboradorToDelete?.name}" permanentemente? Todas as informações vinculadas a ele serão removidas.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />

      {showColumnSelectModal && (
        <ExportColumnSelectModal
          isOpen={showColumnSelectModal}
          onClose={() => setShowColumnSelectModal(false)}
          onConfirm={handleExportConfirm}
        />
      )}
    </div>
  )

  // --- SUB-COMPONENTS ---

  function Avatar({ src, name, size = 'sm', onImageClick }: any) {
    const sz = size === 'lg' ? 'w-20 h-20 text-xl' : 'w-10 h-10 text-sm'
    const clickableClass = onImageClick && src ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''

    if (src) return <img src={src} loading="lazy" onClick={onImageClick} className={`${sz} rounded-full object-cover border-2 border-white shadow-sm ${clickableClass}`} alt={name} />
    return (
      <div className={`${sz} rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center font-black text-white shadow-md`}>
        {name?.charAt(0).toUpperCase()}
      </div>
    )
  }
}
