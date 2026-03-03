import React, { useState, useEffect, useRef } from 'react'
import {
  Search, Plus, X, Trash2, Pencil, Save, Users, UserX,
  Calendar, Building2, Mail, Loader2,
  GraduationCap, Briefcase, Files, User, BookOpen, FileSpreadsheet, Clock,
  Link as LinkIcon, Copy, CheckCircle2, RefreshCcw, Filter, FilterX, BellRing
} from 'lucide-react'

import { exportColaboradoresXLSX } from '../utils/exportColaboradores'
import { supabase } from '../../../lib/supabase'
import { logAction } from '../../../lib/logger'

import { FilterSelect } from '../../controladoria/ui/FilterSelect'
import { Collaborator, Partner, GEDDocument } from '../../../types/controladoria'
import { AlertModal } from '../../ui/AlertModal'
import { ConfirmationModal } from '../../ui/ConfirmationModal'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { useDatabaseSync } from '../../../hooks/useDatabaseSync'

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
import { CollaboratorModalLayout } from '../components/CollaboratorLayouts'
import { useAuth } from '../../../contexts/AuthContext'

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
  formatDateToISO
} from '../utils/colaboradoresUtils'
// ... existing imports

interface Role { id: string | number; name: string }
interface Location { id: string | number; name: string }


interface ColaboradoresProps {
  userName?: string
  onModuleHome?: () => void
  onLogout?: () => void
}




export function Colaboradores({ }: ColaboradoresProps) {
  const { user } = useAuth();
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
  const [filterLider, setFilterLider] = useState('')
  const [filterPartner, setFilterPartner] = useState('')
  const [filterLocal, setFilterLocal] = useState('')
  const [filterCargo, setFilterCargo] = useState('')

  // New Tabs State
  const [activeMainTab, setActiveMainTab] = useState<'Colaboradores' | 'Filtros'>('Colaboradores');

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
  const [advFilterPartner, setAdvFilterPartner] = useState('');
  const [advFilterLeader, setAdvFilterLeader] = useState('');
  const [advFilterArea, setAdvFilterArea] = useState('');
  const [advFilterTeam, setAdvFilterTeam] = useState('');
  const [advFilterRole, setAdvFilterRole] = useState('');
  const [advFilterContractType, setAdvFilterContractType] = useState('');
  const [advFilterLocal, setAdvFilterLocal] = useState('');
  const [advFilterTransporteTipo, setAdvFilterTransporteTipo] = useState('');

  // Escolares
  const [advFilterGraduationComplete, setAdvFilterGraduationComplete] = useState<'sim' | 'nao' | ''>('');
  const [advFilterPostGraduationComplete, setAdvFilterPostGraduationComplete] = useState<'sim' | 'nao' | ''>('');
  const [advFilterExpectedCompletion, setAdvFilterExpectedCompletion] = useState('');
  const [advFilterCompletionYear, setAdvFilterCompletionYear] = useState('');

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
    setAdvFilterPartner('');
    setAdvFilterLeader('');
    setAdvFilterArea('');
    setAdvFilterTeam('');
    setAdvFilterRole('');
    setAdvFilterContractType('');
    setAdvFilterLocal('');
    setAdvFilterTransporteTipo('');
    setAdvFilterGraduationComplete('');
    setAdvFilterPostGraduationComplete('');
    setAdvFilterExpectedCompletion('');
    setAdvFilterCompletionYear('');
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

    return colaboradores.filter(c => {
      if (c.status !== 'active' || !c.hire_date || c.mochila_entregue) return false;
      const hireDate = new Date(c.hire_date);
      // Completing exactly 3 months (or more if not delivered)
      const threeMonthsDate = new Date(hireDate);
      threeMonthsDate.setMonth(hireDate.getMonth() + 3);
      threeMonthsDate.setHours(0, 0, 0, 0);

      // Check if the 3-month mark is today or in the past (and not yet delivered)
      return today >= threeMonthsDate;
    });
  }, [colaboradores, isHRUser]);

  const pendingBirthdays = React.useMemo(() => {
    if (!isHRUser) return [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    return colaboradores.filter(c => {
      if (c.status !== 'active' || !c.birthday) return false;
      if (c.ultimo_aniversario_parabenizado === currentYear) return false;

      // Extract month and day from YYYY-MM-DD
      const [_, bMonth, bDay] = c.birthday.split('-').map(Number);

      // If the birthday is today or in the past (for THIS year) and not congratulated yet
      if (currentMonth > bMonth) return true;
      if (currentMonth === bMonth && currentDay >= bDay) return true;
      return false;
    });
  }, [colaboradores, isHRUser]);

  const totalNotifications = pendingBackpacks.length + pendingBirthdays.length;

  useEffect(() => {
    if (isHRUser && totalNotifications > 0 && !hasShownInitialModal && !loading) {
      setShowNotificationsModal(true);
      setHasShownInitialModal(true);
    }
  }, [isHRUser, totalNotifications, hasShownInitialModal, loading]);

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
    advFilterStatus, advFilterRateio, advFilterAdmissionStart, advFilterAdmissionEnd, advFilterPartner,
    advFilterLeader, advFilterArea, advFilterTeam, advFilterRole, advFilterContractType, advFilterLocal,
    advFilterTransporteTipo, advFilterGraduationComplete, advFilterPostGraduationComplete, advFilterExpectedCompletion, advFilterCompletionYear
  }).some(val => val !== '');




  // Options for FilterSelect
  const liderOptions = React.useMemo(() => [
    ...colaboradores.map((c: Collaborator) => ({ label: c.name, value: String(c.id) })).sort((a: any, b: any) => a.label.localeCompare(b.label))
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

  const activeCount = React.useMemo(() =>
    colaboradores.filter(c => c.status === 'active').length
    , [colaboradores])

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
    { id: 'Carteira de Trabalho (CTPS)', name: 'Carteira de Trabalho (CTPS)' },
    { id: 'Certidão de Nascimento/Casamento', name: 'Certidão de Nascimento/Casamento' },
    { id: 'Certificado de Escolaridade/Diploma', name: 'Certificado de Escolaridade/Diploma' },
    { id: 'Certificado de Reservista', name: 'Certificado de Reservista' },
    { id: 'Comprovante de Residência', name: 'Comprovante de Residência' },
    { id: 'CPF', name: 'CPF' },
    { id: 'Documento de Identificação (RG/CNH)', name: 'Documento de Identificação (RG/CNH)' },
    { id: 'Outros', name: 'Outros' },
    { id: 'PIS/PASEP', name: 'PIS/PASEP' },
    { id: 'Título de Eleitor', name: 'Título de Eleitor' }
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
  }, [])

  useDatabaseSync(() => {
    fetchColaboradores()
    fetchPartners()
  }, ['collaborators', 'partners'])

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
        supabase.from('collaborators').select(`*, partner:partner_id(id, name), leader:leader_id(id, name), oab_number(*)`).order('name'),
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

      const enrichedData = colabRes.data?.map(c => ({
        ...c,
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
        teams: { name: teamsMap.get(String(c.equipe)) || c.equipe }
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
      await logAction('EXCLUIR', 'RH', `Excluiu colaborador: ${colaboradorToDelete.name}`, 'Colaboradores')
      fetchColaboradores()
      if (selectedColaborador) setSelectedColaborador(null)
      showAlert('Sucesso', 'Colaborador excluído com sucesso.', 'success')
    } else {
      showAlert('Erro', 'Erro ao excluir colaborador: ' + error.message, 'error')
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
      let photoUrl = formData.photo_url

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
      const dataToSave = {
        ...formData,
        cadastro_atualizado: false,
        birthday: formatDateToISO(formData.birthday) || null,
        hire_date: formatDateToISO(formData.hire_date) || null,
        termination_date: formatDateToISO(formData.termination_date) || null,
        escolaridade_previsao_conclusao: formatDateToISO(formData.escolaridade_previsao_conclusao) || null,
        children_data: formData.children_data?.map(c => ({
          ...c,
          birth_date: formatDateToISO(c.birth_date) || null
        })),
        education_history: formData.education_history?.map(edu => ({
          ...edu,
          instituicao_uf: edu.instituicao_uf || null,
          previsao_conclusao: formatDateToISO(edu.previsao_conclusao) || null
        }))
      };

      // Robust cleaning of the payload
      const payload: any = {};
      Object.entries(dataToSave).forEach(([key, value]) => {
        // Skip metadata, joined objects, and photo fields (handled separately)
        if (['id', 'created_at', 'updated_at', 'photo_url', 'foto_url', 'roles', 'locations', 'teams', 'partner', 'leader', 'hiring_reasons', 'termination_initiatives', 'termination_types', 'termination_reasons', 'rateios', 'oab_number', 'oabs', 'oab_numero', 'oab_uf', 'oab_tipo', 'oab_emissao', 'original_role', 'role_change_date'].includes(key)) return;
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) return;

        // Map empty strings to null for better DB consistency
        payload[key] = value === '' ? null : value;
      });

      // Maintain consistency: use foto_url as the database column
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
        await logAction('EDITAR', 'RH', `Editou colaborador: ${formData.name}`, 'Colaboradores')
      } else {
        const { data, error } = await supabase.from('collaborators').insert(payload).select().single()
        if (error) throw error
        savedColabId = data.id;
        await logAction('CRIAR', 'RH', `Criou novo colaborador: ${formData.name}`, 'Colaboradores')

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

  const handleEdit = (colaborador: Collaborator) => {
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
    setActiveFormTab(1)

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
    const matchSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchLider = filterLider ? String(c.leader_id) === filterLider : true
    const matchPartner = filterPartner ? String(c.partner_id) === filterPartner : true
    const matchLocal = filterLocal ? String(c.local) === filterLocal : true
    const matchCargo = filterCargo ? String(c.role) === filterCargo : true
    const matchUpdated = showUpdatedOnly ? c.cadastro_atualizado === true : true
    return matchSearch && matchLider && matchPartner && matchLocal && matchCargo && matchUpdated
  })
  const getAdvancedFiltered = () => {
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
      if (advFilterStatus && c.status !== advFilterStatus) return false;
      if (advFilterRateio && String(c.rateio_id) !== advFilterRateio) return false;
      if (advFilterAdmissionStart && (!c.hire_date || c.hire_date < advFilterAdmissionStart)) return false;
      if (advFilterAdmissionEnd && (!c.hire_date || c.hire_date > advFilterAdmissionEnd)) return false;

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
      if (!safeCompare(advFilterLocal, c.local, (c as any).locations?.name)) return false;
      if (!safeIncludes(advFilterTransporteTipo, c.transportes?.map(t => t.tipo).join(', '))) return false;

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

      if (advFilterExpectedCompletion) {
        const prevCourse = c.escolaridade_previsao_conclusao || c.education_history?.find(e => e.status === 'Cursando')?.previsao_conclusao;
        if (!prevCourse || !prevCourse.includes(advFilterExpectedCompletion)) return false;
      }
      if (advFilterCompletionYear) {
        const compYear = c.education_history?.find(e => e.status === 'Formado(a)')?.ano_conclusao;
        if (!compYear || !compYear.includes(advFilterCompletionYear)) return false;
      }

      return true;
    });
  };

  const currentAdvancedFiltered = React.useMemo(() => getAdvancedFiltered(), [
    colaboradores, advFilterGender, advFilterBirthStart, advFilterBirthEnd, advFilterChildren, advFilterStateHome,
    advFilterStatus, advFilterRateio, advFilterAdmissionStart, advFilterAdmissionEnd, advFilterPartner, advFilterLeader,
    advFilterArea, advFilterTeam, advFilterRole, advFilterContractType, advFilterLocal, advFilterTransporteTipo,
    advFilterGraduationComplete, advFilterPostGraduationComplete, advFilterExpectedCompletion, advFilterCompletionYear
  ]);

  const handleExportAdvanced = () => {
    exportColaboradoresXLSX({
      filtered: currentAdvancedFiltered,
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
      atuacoes
    })
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

    // 1. DADOS PESSOAIS
    if (activeTab === 1) {
      return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <DadosPessoaisSection
            formData={currentData}
            setFormData={currentSetData}
            maskCPF={maskCPF}
            maskDate={maskDate}
            maskRG={maskRG}
            maskPhone={maskPhone}
            maskCNPJ={maskCNPJ}
            isViewMode={isViewMode}
          />
          <EnderecoSection
            formData={currentData}
            setFormData={currentSetData}
            maskCEP={maskCEP}
            handleCepBlur={isViewMode ? () => { } : handleCepBlur}
            isViewMode={isViewMode}
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
              placeholder="Observações gerais sobre o colaborador..."
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
          <OABSection
            formData={currentData}
            setFormData={currentSetData}
            maskDate={maskDate}
            isViewMode={isViewMode}
          />
        </div>
      )
    }

    // 3. ESCOLARIDADE
    if (activeTab === 3) {
      return (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <DadosEscolaridadeSection
            formData={currentData}
            setFormData={currentSetData}
            maskDate={maskDate}
            handleRefresh={handleRefresh}
            isViewMode={isViewMode}
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

    return null
  }

  // Layout Original em Modal (Exclusivo para Visualização)
  const renderModalLayout = (
    title: string,
    onClose: () => void,
    activeTab: number,
    setActiveTab: (id: number) => void,
    children: React.ReactNode,
    footer?: React.ReactNode,
    sidebarContent?: React.ReactNode,
    isEditMode: boolean = false,
    currentData: Partial<Collaborator> = {}
  ) => {
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
      />
    )
  }

  // Layout Espaçoso em Tela Cheia (Exclusivo para Formulários)
  const renderPageLayout = (
    title: string,
    onClose: () => void,
    activeTab: number,
    setActiveTab: (id: number) => void,
    children: React.ReactNode,
    footer?: React.ReactNode,
    sidebarContent?: React.ReactNode,
    isEditMode: boolean = false,
    currentData: Partial<Collaborator> = {}
  ) => {
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
              <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
                Colaboradores
              </h1>
              {isHRUser && totalNotifications > 0 && (
                <button
                  onClick={() => setShowNotificationsModal(true)}
                  className="relative p-2 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors animate-pulse hover:animate-none flex items-center justify-center shrink-0"
                  title={`${totalNotifications} Notificações de RH`}
                >
                  <BellRing className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                    {totalNotifications}
                  </span>
                </button>
              )}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Gerencie o time, edite perfis e controle acessos
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto justify-end mt-2 md:mt-0 custom-scrollbar">
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
              onClick={() => setActiveMainTab('Colaboradores')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeMainTab === 'Colaboradores' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Users className="h-4 w-4" /> Equipe
            </button>
            <button
              onClick={() => setActiveMainTab('Filtros')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeMainTab === 'Filtros' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Filter className="h-4 w-4" /> Filtros
            </button>
          </div>

          {activeMainTab === 'Colaboradores' ? (
            <div className="flex items-center gap-4 border-l border-gray-100 pl-4 ml-2">

              <div className="flex items-center gap-1.5 p-1 bg-white border border-gray-100 rounded-xl shadow-sm">
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



              <button
                onClick={() => {
                  setFormData({ status: 'active', state: '' })
                  setPhotoPreview(null)
                  setActiveFormTab(1)
                  setShowFormModal(true)
                }}
                className="flex items-center justify-center w-10 h-10 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 shrink-0"
                title="Novo Colaborador"
              >
                <Plus className="h-5 w-5" />
              </button>

              {selectedIds.length > 0 && (
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

              <button
                onClick={handleExportAdvanced}
                className="flex items-center justify-center w-10 h-10 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 shrink-0"
                title={`Exportar (${currentAdvancedFiltered.length})`}
              >
                <FileSpreadsheet className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>



      {activeMainTab === 'Colaboradores' && (
        <>
          {/* CONTROLS CARD - Search | Filters */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-5 duration-600">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">

              {/* Active Count Card */}
              <div className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-2.5 shrink-0 animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="p-1.5 bg-blue-100 rounded-lg text-[#1e3a8a]">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-900/40 uppercase tracking-widest leading-none mb-1">Ativos</p>
                  <p className="text-sm font-bold text-[#1e3a8a] leading-none">{activeCount}</p>
                </div>
              </div>

              {/* Search Bar - Expanded */}
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 w-full flex-1 focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 focus-within:border-[#1e3a8a] transition-all relative">
                <Search className="h-4 w-4 text-gray-400 mr-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="bg-transparent border-none text-sm w-full outline-none text-gray-700 font-medium placeholder:text-gray-400 pr-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                    title="Limpar busca"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filters Row - Auto-sizing */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:justify-end">
                <FilterSelect
                  icon={User}
                  value={filterLider}
                  onChange={setFilterLider}
                  options={liderOptions}
                  placeholder="Líder"
                />
                <FilterSelect
                  icon={Users}
                  value={filterPartner}
                  onChange={setFilterPartner}
                  options={partnerOptions}
                  placeholder="Sócio"
                />
                <FilterSelect
                  icon={Building2}
                  value={filterLocal}
                  onChange={setFilterLocal}
                  options={locationOptions}
                  placeholder="Local"
                />
                <FilterSelect
                  icon={Briefcase}
                  value={filterCargo}
                  onChange={setFilterCargo}
                  options={roleOptions}
                  placeholder="Cargo"
                />
              </div>
            </div>
          </div>

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
                    <th className="px-6 py-4 text-left text-[10px] font-black text-white uppercase tracking-wider">Colaborador</th>
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
                        <p className="text-gray-400 text-xs font-medium">Carregando colaboradores...</p>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        <UserX className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-medium">Nenhum colaborador encontrado.</p>
                      </td>
                    </tr>
                  ) : (
                    <>
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
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-[#0a192f]">{toTitleCase((c as any).roles?.name || c.role || '')}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{toTitleCase((c as any).teams?.name || c.equipe || '')}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-700">{(c as any).partner?.name || '-'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-700">{(c as any).leader?.name || '-'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border ${c.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${c.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                              {c.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => { e.stopPropagation(); handleEdit(c) }} className="p-2 text-[#1e3a8a] hover:bg-[#1e3a8a]/10 rounded-xl transition-all hover:scale-110 active:scale-95"><Pencil className="h-4 w-4" /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(c) }} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-110 active:scale-95"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filtered.some(c => c.status !== 'active') && (
                        <tr className="bg-gray-50/50">
                          <td colSpan={7} className="px-6 py-3 border-y border-gray-100">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Inativos</p>
                          </td>
                        </tr>
                      )}
                      {filtered.filter(c => c.status !== 'active').map(c => (
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
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border ${c.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${c.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                              {c.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => { e.stopPropagation(); handleEdit(c) }} className="p-2 text-[#1e3a8a] hover:bg-[#1e3a8a]/10 rounded-xl transition-all hover:scale-110 active:scale-95"><Pencil className="h-4 w-4" /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(c) }} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-110 active:scale-95"><Trash2 className="h-4 w-4" /></button>
                            </div>
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

      {activeMainTab === 'Filtros' && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-5 duration-600 space-y-8 flex-1 overflow-auto custom-scrollbar">

          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-[#1e3a8a]">Opções de Filtro</h2>
            <button
              onClick={handleClearAdvancedFilters}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <X className="h-4 w-4" /> Limpar Filtros
            </button>
          </div>

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

              <div className="col-span-1 md:col-span-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Período Admissão (Início e Fim)</label>
                <div className="flex items-center gap-2 max-w-sm">
                  <input type="date" className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={advFilterAdmissionStart} onChange={e => setAdvFilterAdmissionStart(e.target.value)} />
                  <span className="text-gray-400">-</span>
                  <input type="date" className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={advFilterAdmissionEnd} onChange={e => setAdvFilterAdmissionEnd(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Escolares */}
          <div>
            <h3 className="text-sm font-bold text-[#1e3a8a] mb-4 flex items-center gap-2 border-b pb-2"><GraduationCap className="h-4 w-4" /> Filtros Escolares</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative z-[110]">
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
              <div className="relative z-[109]">
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
              <div className="relative">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Ano Prev. Conclusão</label>
                <input type="text" placeholder="Ex: 2025" className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium pr-8" value={advFilterExpectedCompletion} onChange={e => setAdvFilterExpectedCompletion(e.target.value)} />
                {advFilterExpectedCompletion && <button onClick={() => setAdvFilterExpectedCompletion('')} className="absolute right-2 top-[34px] text-gray-400 hover:text-red-500 bg-gray-50 p-0.5 rounded-full z-10"><X className="h-4 w-4" /></button>}
              </div>
              <div className="relative">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Ano de Conclusão</label>
                <input type="text" placeholder="Ex: 2020" className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium pr-8" value={advFilterCompletionYear} onChange={e => setAdvFilterCompletionYear(e.target.value)} />
                {advFilterCompletionYear && <button onClick={() => setAdvFilterCompletionYear('')} className="absolute right-2 top-[34px] text-gray-400 hover:text-red-500 bg-gray-50 p-0.5 rounded-full z-10"><X className="h-4 w-4" /></button>}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-100">
            <button
              onClick={handleExportAdvanced}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-xl active:scale-95 text-xs"
            >
              <FileSpreadsheet className="h-5 w-5" /> Gerar Relatório XLSX ({currentAdvancedFiltered.length})
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODAL (Original Window) */}
      {selectedColaborador && renderModalLayout(
        toTitleCase(selectedColaborador.name),
        () => setSelectedColaborador(null),
        activeDetailTab,
        setActiveDetailTab,
        renderModalContent(activeDetailTab, true, selectedColaborador),
        (
          <>
            <button
              onClick={() => handleDelete(selectedColaborador)}
              className="px-6 py-2.5 text-red-600 font-black text-[9px] uppercase tracking-[0.2em] border border-red-200 rounded-xl hover:bg-red-50 transition-all flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </button>
            <button
              onClick={() => handleEdit(selectedColaborador)}
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
      )}

      {/* FORM PAGE (Full Page Layout) */}
      {showFormModal && renderPageLayout(
        formData.id ? 'Editar Colaborador' : 'Novo Colaborador',
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
        />,
        true, // isEditMode = true for the form modal
        formData
      )}

      {viewingPhoto && (
        <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setViewingPhoto(null)}>
          <button className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors" onClick={() => setViewingPhoto(null)}>
            <X className="h-8 w-8" />
          </button>
          <img src={viewingPhoto} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default" onClick={e => e.stopPropagation()} alt="Visualização" />
        </div>
      )}

      {/* LINKS MODAL */}
      {showLinksModal && (
        <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-3xl flex flex-col overflow-hidden shadow-2xl relative">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                  <LinkIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0a192f]">Links de Atualização Copiáveis</h3>
                  <p className="text-xs text-gray-500 font-medium">Envie estes links únicos para cada colaborador.</p>
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
                <p>Nesta seção você tem acesso aos links únicos. <strong>Atenção:</strong> Os links expiram em exatos 7 dias contados a partir de agora. Após expirarem, o colaborador precisará que você gere e envie um novo link.</p>
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
                            showAlert('Erro', `O colaborador ${link.name} não possui um e-mail corporativo cadastrado.`, 'error');
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
        </div>
      )}

      {/* HR NOTIFICATIONS MODAL */}
      {showNotificationsModal && (
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
                onClick={() => setShowNotificationsModal(false)}
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
                onClick={() => setShowNotificationsModal(false)}
                className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-[#112240] transition-colors shadow-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

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
        title="Excluir Colaborador"
        description={`Tem certeza que deseja excluir o colaborador "${colaboradorToDelete?.name}" permanentemente? Todas as informações vinculadas a ele serão removidas.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )

  // --- SUB-COMPONENTS ---

  function Avatar({ src, name, size = 'sm', onImageClick }: any) {
    const sz = size === 'lg' ? 'w-20 h-20 text-xl' : 'w-10 h-10 text-sm'
    const clickableClass = onImageClick && src ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''

    if (src) return <img src={src} onClick={onImageClick} className={`${sz} rounded-full object-cover border-2 border-white shadow-sm ${clickableClass}`} alt={name} />
    return (
      <div className={`${sz} rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center font-black text-white shadow-md`}>
        {name?.charAt(0).toUpperCase()}
      </div>
    )
  }
}
