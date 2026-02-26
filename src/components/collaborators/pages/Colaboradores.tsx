import React, { useState, useEffect, useRef } from 'react'
import {
  Search, Plus, X, Trash2, Pencil, Save, Users, UserX,
  Calendar, Building2, Mail, FileText, ExternalLink, Loader2,
  GraduationCap, Briefcase, Files, User, BookOpen, FileSpreadsheet, Clock,
  Link as LinkIcon, Copy, CheckCircle2, RefreshCcw
} from 'lucide-react'

import XLSX from 'xlsx-js-style'
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
import { DadosEscolaridadeSection } from '../components/DadosEscolaridadeSection'
import { DadosCorporativosSection } from '../components/DadosCorporativosSection'
import { PhotoUploadSection } from '../components/PhotoUploadSection'
import { HistoricoSection } from '../components/HistoricoSection'
import { PeriodoAusenciasSection } from '../components/PeriodoAusenciasSection'
// ... existing imports

interface Role { id: string | number; name: string }
interface Location { id: string | number; name: string }


interface ColaboradoresProps {
  userName?: string
  onModuleHome?: () => void
  onLogout?: () => void
}


const ESTADOS_BRASIL = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' }
]

export function Colaboradores({ }: ColaboradoresProps) {
  const [colaboradores, setColaboradores] = useState<Collaborator[]>([])
  const [partners, setPartners] = useState<Partial<Partner>[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([])

  // Lookup Tables State
  const [rateios, setRateios] = useState<{ id: string; name: string }[]>([])
  const [hiringReasons, setHiringReasons] = useState<{ id: string; name: string }[]>([])
  const [terminationInitiatives, setTerminationInitiatives] = useState<{ id: string; name: string }[]>([])
  const [terminationTypes, setTerminationTypes] = useState<{ id: string; name: string }[]>([])
  const [terminationReasons, setTerminationReasons] = useState<{ id: string; name: string }[]>([])
  const [costCenters, setCostCenters] = useState<{ id: string; name: string }[]>([])
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

  const getLookupName = (list: { id: string; name: string }[], id?: string) => {
    if (!id) return ''
    return list.find(i => i.id === id)?.name || ''
  }

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

  const formSteps = [
    { id: 1, label: 'Dados Pessoais', icon: User },
    { id: 2, label: 'Dados Profissionais', icon: GraduationCap },
    { id: 3, label: 'Dados de Escolaridade', icon: BookOpen },
    { id: 4, label: 'Dados Corporativos', icon: Briefcase },
    { id: 5, label: 'Período de Ausências', icon: Calendar },
    { id: 6, label: 'Histórico', icon: Clock },
    { id: 7, label: 'GED', icon: Files }
  ]
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null)
  const [, setRefreshKey] = useState(0)
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null)

  const [gedDocs, setGedDocs] = useState<GEDDocument[]>([])
  const [, setUploadingGed] = useState(false)
  const [selectedGedCategory, setSelectedGedCategory] = useState('')
  const [atestadoDatas, setAtestadoDatas] = useState({ inicio: '', fim: '' })
  const [pendingGedDocs, setPendingGedDocs] = useState<{ file: File, category: string, label?: string, tempId: string }[]>([])
  const gedInputRef = useRef<HTMLInputElement>(null)

  const gedCategories = [
    { id: 'Atestado Médico', label: 'Atestado Médico', value: 'Atestado Médico' },
    { id: 'Carteira de Trabalho', label: 'Carteira de Trabalho', value: 'Carteira de Trabalho' },
    { id: 'CNH', label: 'CNH', value: 'CNH' },
    { id: 'Comprovante de Matrícula', label: 'Comprovante de Matrícula', value: 'Comprovante de Matrícula' },
    { id: 'Comprovante de Residência', label: 'Comprovante de Residência', value: 'Comprovante de Residência' },
    { id: 'CPF', label: 'CPF', value: 'CPF' },
    { id: 'Diploma', label: 'Diploma', value: 'Diploma' },
    { id: 'Identidade', label: 'Identidade', value: 'Identidade' },
    { id: 'OAB', label: 'OAB', value: 'OAB' }
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
    if (selectedColaborador && activeDetailTab === 5) {
      fetchGedDocs(selectedColaborador.id)
    }
  }, [selectedColaborador, activeDetailTab])

  const toTitleCase = (str: string) => {
    if (!str) return ''
    const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi'];
    const acronyms = ['clt', 'pj', 'cpf', 'rg', 'cnh', 'oab', 'rh', 'ti', 'ceo', 'cfo', 'pis', 'pasep', 'ctps'];
    return str.toLowerCase().split(' ').map(word => {
      if (romanNumerals.includes(word) || acronyms.includes(word)) return word.toUpperCase();
      return (word.length > 2) ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    }).join(' ');
  }



  const maskCEP = (v: string) => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9)
  const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14)
  const maskDate = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 10)
  const maskRG = (v: string) => v.replace(/\D/g, '').replace(/(\d{8})(\d{1,2})/, '$1-$2').slice(0, 10)
  const maskPhone = (v: string) => {
    const raw = v.replace(/\D/g, '')
    if (raw.length <= 10) return raw.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').slice(0, 14)
    return raw.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').slice(0, 15)
  }

  const formatDateToDisplay = (isoDate: string | undefined | null) => {
    if (!isoDate) return ''
    if (isoDate.includes('/')) return isoDate
    const cleanDate = isoDate.split('T')[0]
    const [y, m, d] = cleanDate.split('-')
    return `${d}/${m}/${y}`
  }

  const formatDateToISO = (displayDate: string | undefined | null) => {
    if (!displayDate) return ''
    if (displayDate.includes('-')) return displayDate
    const [d, m, y] = displayDate.split('/')
    return `${y}-${m}-${d}`
  }

  const handleCepBlur = async () => {
    const cep = formData.zip_code?.replace(/\D/g, '')
    if (cep?.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()
        if (!data.erro) {
          const estadoEncontrado = ESTADOS_BRASIL.find(e => e.sigla === data.uf)
          setFormData(prev => ({
            ...prev,
            address: toTitleCase(data.logradouro),
            neighborhood: toTitleCase(data.bairro),
            city: toTitleCase(data.localidade),
            state: estadoEncontrado ? estadoEncontrado.nome : data.uf
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
        costCentersRes
      ] = await Promise.all([
        supabase.from('collaborators').select(`*, partner:partner_id(id, name), leader:leader_id(id, name)`).order('name'),
        supabase.from('roles').select('id, name'),
        supabase.from('locations').select('id, name'),
        supabase.from('teams').select('id, name'),
        supabase.from('rateios').select('id, name'),
        supabase.from('hiring_reasons').select('id, name'),
        supabase.from('termination_initiatives').select('id, name'),
        supabase.from('termination_types').select('id, name'),
        supabase.from('termination_reasons').select('id, name'),
        supabase.from('cost_centers').select('id, name')
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
      if (costCentersRes.data) setCostCenters(costCentersRes.data)

      const rolesMap = new Map(rolesRes.data?.map(r => [String(r.id), r.name]) || [])
      const locsMap = new Map(locsRes.data?.map(l => [String(l.id), l.name]) || [])
      const teamsMap = new Map(teamsRes.data?.map(t => [String(t.id), t.name]) || [])

      const enrichedData = colabRes.data?.map(c => ({
        ...c,
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
          categoryLabel = `Atestado Médico (${atestadoDatas.inicio} a ${atestadoDatas.fim})`
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
        categoryLabel = `Atestado Médico (${atestadoDatas.inicio} a ${atestadoDatas.fim})`
      }
      const newItem = {
        file,
        category: selectedGedCategory,
        label: categoryLabel !== selectedGedCategory ? categoryLabel : undefined,
        tempId: Math.random().toString(36).substr(2, 9)
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
      const path = gedToDelete.url.split('/ged-colaboradores/')[1]
      await supabase.storage.from('ged-colaboradores').remove([path])
      await supabase.from('ged_colaboradores').delete().eq('id', gedToDelete.id)
      fetchGedDocs(selectedColaborador!.id)
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
        oab_emissao: formatDateToISO(formData.oab_emissao) || null,
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
        if (['id', 'created_at', 'updated_at', 'photo_url', 'foto_url', 'roles', 'locations', 'teams', 'partner', 'leader', 'hiring_reasons', 'termination_initiatives', 'termination_types', 'termination_reasons', 'rateios'].includes(key)) return;
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) return;

        // Map empty strings to null for better DB consistency
        payload[key] = value === '' ? null : value;
      });

      // Maintain consistency: use foto_url as the database column
      payload.foto_url = photoUrl;

      if (formData.id) {
        const { error } = await supabase.from('collaborators').update(payload).eq('id', formData.id)
        if (error) throw error
        await logAction('EDITAR', 'RH', `Editou colaborador: ${formData.name}`, 'Colaboradores')
      } else {
        const { data, error } = await supabase.from('collaborators').insert(payload).select().single()
        if (error) throw error
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
            }
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
      birthday: formatDateToDisplay(colaborador.birthday),
      hire_date: formatDateToDisplay(colaborador.hire_date),
      termination_date: formatDateToDisplay(colaborador.termination_date),
      oab_emissao: formatDateToDisplay(colaborador.oab_emissao),
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
    setShowFormModal(true)
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

  const handleExportXLSX = () => {
    // 1. Sort Data: Active first, then Inactive
    const sortedData = [...filtered].sort((a, b) => {
      if (a.status === b.status) return a.name.localeCompare(b.name);
      return a.status === 'active' ? -1 : 1;
    });

    const dataToExport = sortedData.map(c => ({
      'ID': c.id,
      // 1. DADOS PESSOAIS
      'Nome Completo': c.name,
      'CPF': c.cpf,
      'RG': c.rg,
      'Data Nascimento': formatDateToDisplay(c.birthday),
      'Gênero': c.gender,
      'Estado Civil': c.civil_status,
      'Possui Filhos?': c.has_children ? 'Sim' : 'Não',
      'Quantidade de Filhos': c.children_count || 0,
      'Nome Emergência': c.emergencia_nome,
      'Telefone Emergência': c.emergencia_telefone,
      'Parentesco Emergência': c.emergencia_parentesco,
      'Observações': c.observacoes,
      'CEP': c.zip_code,
      'Endereço': c.address,
      'Número': c.address_number,
      'Complemento': c.address_complement,
      'Bairro': c.neighborhood,
      'Cidade': c.city,
      'Estado': c.state,

      // 2. DADOS PROFISSIONAIS
      'OAB Número': c.oab_numero,
      'OAB UF': c.oab_uf,
      'OAB Emissão': formatDateToDisplay(c.oab_emissao),
      'Tipo Inscrição OAB': c.oab_tipo,
      'PIS/PASEP': c.pis || c.pis_pasep,
      'Matrícula e-Social': c.matricula_esocial,
      'Dispensa Militar': c.dispensa_militar,
      'CTPS': c.ctps || c.ctps_numero,
      'Série CTPS': c.ctps_serie,
      'UF CTPS': c.ctps_uf,

      // 3. DADOS DE ESCOLARIDADE
      'Nível Escolaridade': c.escolaridade_nivel,
      'Subnível': c.escolaridade_subnivel,
      'Instituição': c.escolaridade_instituicao,
      'Curso': c.escolaridade_curso,
      'Matrícula Escolar': c.escolaridade_matricula,
      'Semestre': c.escolaridade_semestre,
      'Previsão Conclusão': formatDateToDisplay(c.escolaridade_previsao_conclusao),

      // 4. DADOS CORPORATIVOS
      'Status': c.status === 'active' ? 'Ativo' : 'Inativo',
      'Rateio': getLookupName(rateios, c.rateio_id),
      'Data Admissão': formatDateToDisplay(c.hire_date),
      'Motivo Contratação': getLookupName(hiringReasons, c.hiring_reason_id),
      'Tipo Contrato': c.contract_type,
      'Email Corporativo': c.email,
      'Sócio Responsável': (c as any).partner?.name || getLookupName(partners as any[], c.partner_id),
      'Líder Direto': (c as any).leader?.name || getLookupName(colaboradores as any[], c.leader_id),
      'Equipe/Área': (c as any).teams?.name || c.equipe,
      'Cargo': (c as any).roles?.name || c.role,
      'Centro de Custo': c.centro_custo,
      'Local': (c as any).locations?.name || c.local,

      // 5. HISTÓRICO (DESLIGAMENTO)
      'Data Desligamento': formatDateToDisplay(c.termination_date),
      'Iniciativa Desligamento': getLookupName(terminationInitiatives, c.termination_initiative_id),
      'Tipo Desligamento': getLookupName(terminationTypes, c.termination_type_id),
      'Motivo Desligamento': getLookupName(terminationReasons, c.termination_reason_id),
      'Observações Histórico': c.history_observations
    }));

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', '-');
    const fileName = `Colaboradores_${formattedDate}_${formattedTime}.xlsx`;

    const ws = XLSX.utils.json_to_sheet(dataToExport);

    // Apply Styles
    // Range gives us the dimensions Ex: "A1:Z100"
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    // Iterate rows (skipping header 0)
    for (let R = 1; R <= range.e.r; ++R) {
      // Check status in the data source (sortedData[R-1])
      const isInactive = sortedData[R - 1]?.status !== 'active';

      if (isInactive) {
        // Encode cell address for 'Nome Completo' (Column A -> 0)
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: 0 }); // 0 is Name column index

        if (!ws[cellAddress]) continue;

        // Apply Red Font Style
        ws[cellAddress].s = {
          font: {
            color: { rgb: "FF0000" },
            bold: true
          }
        };
      }
    }

    // Auto-width for columns (Optional but good)
    const wscols = Object.keys(dataToExport[0] || {}).map(() => ({ wch: 20 }));
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Colaboradores");
    XLSX.writeFile(wb, fileName);
  };

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

  // LAYOUT FUNCTIONS
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
            isViewMode={isViewMode}
          />
          <EnderecoSection
            formData={currentData}
            setFormData={currentSetData}
            maskCEP={maskCEP}
            handleCepBlur={isViewMode ? () => { } : handleCepBlur}
            isViewMode={isViewMode}
          />
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
      // Content logic for GED corresponds to View/Edit similarly except upload allowed in Form
      // In View Mode, we allow upload too, so logic is shared mostly, but let's implement the GED UI
      // For simplicity, using same UI for both mode as it allows management
      return (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <div className="border-2 border-dashed border-gray-100 rounded-2xl p-6 bg-gray-50/50">
            <div className="text-center mb-6">
              <Files className="h-10 w-10 mx-auto mb-2 text-[#1e3a8a] opacity-50" />
              <h3 className="text-sm font-bold text-[#0a192f]">Gestão de Documentos</h3>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
              <div className="flex flex-col md:flex-row items-end gap-3">
                <div className="flex-1 w-full relative z-[110]">
                  <SearchableSelect
                    label="Tipo de Documento"
                    placeholder="Selecione..."
                    value={selectedGedCategory}
                    onChange={setSelectedGedCategory}
                    options={gedCategories}
                    uppercase={false}
                  />
                </div>

                {selectedGedCategory === 'Atestado Médico' && (
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative">
                      <input
                        type="date"
                        className="pl-3 pr-2 py-2.5 bg-white border border-gray-200 rounded-lg text-xs w-32"
                        value={atestadoDatas.inicio}
                        onChange={e => setAtestadoDatas(p => ({ ...p, inicio: e.target.value }))}
                        placeholder="Início"
                      />
                    </div>
                    <span className="text-gray-400">-</span>
                    <div className="relative">
                      <input
                        type="date"
                        className="pl-3 pr-2 py-2.5 bg-white border border-gray-200 rounded-lg text-xs w-32"
                        value={atestadoDatas.fim}
                        onChange={e => setAtestadoDatas(p => ({ ...p, fim: e.target.value }))}
                        placeholder="Fim"
                      />
                    </div>
                  </div>
                )}

                <div className="shrink-0 w-full md:w-auto">
                  <input type="file" hidden ref={gedInputRef} accept=".pdf,image/*" onChange={handleGedUpload} />
                  <button
                    disabled={!selectedGedCategory || (selectedGedCategory === 'Atestado Médico' && (!atestadoDatas.inicio || !atestadoDatas.fim))}
                    onClick={() => gedInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 bg-[#1e3a8a] hover:bg-[#112240] hover:shadow-xl disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-md active:scale-95"
                  >
                    <Plus className="h-4 w-4" /> Anexar
                  </button>
                </div>
              </div>
            </div>

            {/* List of files (Existing + Pending) */}
            <div className="space-y-3">
              {/* Existing Files */}
              {gedDocs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded"><FileText className="h-4 w-4" /></div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-[#0a192f] truncate">{doc.nome_arquivo}</p>
                      <span className="text-[9px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded uppercase tracking-wider">{doc.categoria}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={doc.url} target="_blank" rel="noreferrer" className="p-1.5 text-[#1e3a8a] hover:bg-[#1e3a8a]/10 rounded transition-all"><ExternalLink className="h-4 w-4" /></a>
                    <button onClick={() => handleDeleteGed(doc)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}

              {/* Pending Files (Only relevant in Form Mode usually, but could be added in view) */}
              {pendingGedDocs.map(doc => (
                <div key={doc.tempId} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-1.5 bg-yellow-100 text-yellow-600 rounded"><FileText className="h-4 w-4" /></div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-[#0a192f] truncate">{doc.file.name}</p>
                      <div className="flex gap-2">
                        <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded uppercase tracking-wider">{doc.category}</span>
                        <span className="text-[9px] text-yellow-600 italic">Pendente</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setPendingGedDocs(prev => prev.filter(p => p.tempId !== doc.tempId))}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {gedDocs.length === 0 && pendingGedDocs.length === 0 && (
                <p className="text-center text-gray-400 text-xs py-4">Nenhum documento anexado ainda.</p>
              )}
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  const renderModalLayout = (
    title: string,
    onClose: () => void,
    activeTab: number,
    setActiveTab: (id: number) => void,
    children: React.ReactNode,
    footer?: React.ReactNode,
    sidebarContent?: React.ReactNode,
    isEditMode: boolean = false
  ) => {
    return (
      <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-md z-[100] flex justify-end animate-in fade-in duration-300">
        <div className="bg-white rounded-l-[2rem] w-[95vw] max-w-7xl h-full flex overflow-hidden animate-in slide-in-from-right-1/2 duration-500 shadow-2xl border-l border-gray-200 relative">

          {/* Left Sidebar */}
          <div className="w-80 bg-white border-r border-gray-100 flex flex-col py-10 px-6 shrink-0 overflow-y-auto no-scrollbar">
            {/* Photo Area */}
            <div className="mb-10 flex justify-center">
              {sidebarContent}
            </div>

            {/* Vertical Tabs */}
            <div className="space-y-1 w-full">
              {formSteps.map((step) => {
                const Icon = step.icon
                const isActive = activeTab === step.id
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveTab(step.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left relative group ${isActive
                      ? isEditMode ? 'text-amber-600 bg-amber-50 font-bold shadow-sm' : 'text-[#1e3a8a] bg-blue-50 font-bold shadow-sm'
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                      }`}
                  >
                    <div className={`p-1 rounded-lg transition-colors ${isActive ? (isEditMode ? 'text-amber-600' : 'text-[#1e3a8a]') : 'text-gray-300 group-hover:text-gray-500'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.2em]">{step.label}</span>
                    {isActive && <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1 ${isEditMode ? 'bg-amber-500' : 'bg-[#1e3a8a]'} rounded-r-full`} />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#fafafa]">
            {/* Content Header (Title + Close) */}
            <div className="px-12 py-8 pb-2 flex justify-between items-center shrink-0">
              <h2 className="text-3xl font-black text-[#0a192f] tracking-tight">{title}</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-all text-gray-400 hover:text-red-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-12 py-6 pb-32 custom-scrollbar">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-12 py-6 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
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
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Colaboradores
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Gerencie o time, edite perfis e controle acessos
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto justify-end mt-2 md:mt-0 custom-scrollbar">
          <div className="flex items-center gap-3 min-w-max">
            <div className="flex gap-2">
              {colaboradores.filter(c => c.cadastro_atualizado && c.status === 'active').length > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowUpdatedOnly(!showUpdatedOnly)}
                    className={`p-2 sm:p-2.5 rounded-lg transition-colors border flex items-center justify-center relative group outline-none overflow-hidden
                      ${showUpdatedOnly
                        ? 'bg-amber-100 text-amber-700 border-amber-200 shadow-inner'
                        : 'bg-[#1e3a8a] text-white border-[#1e3a8a] hover:bg-[#112240] shadow-lg'
                      }
                    `}
                    title={showUpdatedOnly ? "Filtro Ativado" : "Ver Cadastros Atualizados"}
                  >
                    {!showUpdatedOnly && (
                      <span className="absolute top-1 right-1 flex h-2 w-2">
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
              )}
              <button
                onClick={handleExportXLSX}
                className="p-2 sm:p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100 flex items-center justify-center"
                title="Exportar Excel"
              >
                <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            <button
              onClick={() => {
                setFormData({ status: 'active', state: '' })
                setPhotoPreview(null)
                setActiveFormTab(1)
                setShowFormModal(true)
              }}
              className="flex bg-[#1e3a8a] text-white px-4 py-2 sm:py-2.5 rounded-xl font-bold uppercase tracking-wider hover:bg-[#112240] transition-all shadow-lg shadow-blue-900/20 items-center justify-center gap-2 text-[10px] sm:text-xs"
            >
              <Plus className="h-4 w-4" />
              Novo Colab.
            </button>

            {/* Generate Links Action - Conditionally Shown */}
            {selectedIds.length > 0 && (
              <button
                onClick={handleGenerateLinks}
                disabled={generatingLinks}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2 sm:py-2.5 rounded-xl font-bold uppercase tracking-wider transition-all shadow-lg text-[10px] sm:text-xs"
              >
                {generatingLinks ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                Gerar Links ({selectedIds.length})
              </button>
            )}
          </div>
        </div>
      </div>

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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-6 duration-700 flex-1 flex flex-col">
        <div className="overflow-auto h-full custom-scrollbar">
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
                <th className="px-6 py-4 text-right text-[10px] font-black text-white uppercase tracking-wider pr-8 rounded-tr-xl">Ações</th>
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
                            <p className="text-[10px] text-gray-400 font-medium">{c.email}</p>
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

      {/* VIEW MODAL */}
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
              <Pencil className="h-4 w-4" /> Editar
            </button>
          </>
        ),
        // Sidebar Content (Display Photo)
        <div className="w-48 h-48 rounded-full overflow-hidden border-[6px] border-white shadow-xl bg-gray-50 flex items-center justify-center cursor-pointer transition-transform hover:scale-105" onClick={() => selectedColaborador.photo_url && setViewingPhoto(selectedColaborador.photo_url)}>
          {selectedColaborador.photo_url ? (
            <img src={selectedColaborador.photo_url} className="w-full h-full object-cover" alt={selectedColaborador.name} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center">
              <span className="text-5xl font-black text-white opacity-50">{selectedColaborador.name?.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
      )}

      {/* FORM MODAL */}
      {showFormModal && renderModalLayout(
        formData.id ? 'Editar Colaborador' : 'Novo Colaborador',
        () => setShowFormModal(false),
        activeFormTab,
        setActiveFormTab,
        renderModalContent(activeFormTab, false, formData),
        (
          <>
            <button
              onClick={() => setShowFormModal(false)}
              className="px-6 py-2.5 text-[9px] font-black text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all uppercase tracking-[0.2em]"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleSave(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <Save className="h-4 w-4" /> Salvar
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
        true // isEditMode = true for the form modal
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

                          const response = await fetch('https://hook.us2.make.com/5lv612jlqx6cqnfwu5qnivxgsvkcphwq', {
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

  function DetailRow({ label, value, icon: Icon }: any) {
    return (
      <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
        <p className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1 mb-1 tracking-widest">
          {Icon && <Icon className="h-3 w-3" />}
          {label}
        </p>
        <p className="text-sm font-bold text-[#0a192f] break-words">{value || '-'}</p>
      </div>
    )
  }
}
