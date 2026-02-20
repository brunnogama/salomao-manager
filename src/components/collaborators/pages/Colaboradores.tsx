import React, { useState, useEffect, useRef } from 'react'
import {
  Search, Plus, X, Trash2, Pencil, Save, Users, UserX,
  Calendar, Building2, Mail, FileText, ExternalLink, Loader2,
  GraduationCap, Briefcase, Files, User, BookOpen, FileSpreadsheet, Clock
} from 'lucide-react'
import { differenceInMonths, differenceInYears } from 'date-fns'
import XLSX from 'xlsx-js-style'
import { supabase } from '../../../lib/supabase'

import { FilterSelect } from '../../controladoria/ui/FilterSelect'
import { Collaborator, Partner, GEDDocument } from '../../../types/controladoria'
import { AlertModal } from '../../ui/AlertModal'
import { ConfirmationModal } from '../../ui/ConfirmationModal'
import { SearchableSelect } from '../../crm/SearchableSelect'

import { DadosPessoaisSection } from '../components/DadosPessoaisSection'
import { EnderecoSection } from '../components/EnderecoSection'
import { InformacoesProfissionaisSection } from '../components/InformacoesProfissionaisSection'
import { DadosEscolaridadeSection } from '../components/DadosEscolaridadeSection'
import { DadosCorporativosSection } from '../components/DadosCorporativosSection'
import { PhotoUploadSection } from '../components/PhotoUploadSection'

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
  const [loading, setLoading] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [selectedColaborador, setSelectedColaborador] = useState<Collaborator | null>(null)
  const [activeDetailTab, setActiveDetailTab] = useState(1)
  const [activeFormTab, setActiveFormTab] = useState(1)

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

  // Inicializa estado vazio por padrão conforme solicitado
  const [formData, setFormData] = useState<Partial<Collaborator>>({ status: 'active', state: '' })

  const formSteps = [
    { id: 1, label: 'Dados Pessoais', icon: User },
    { id: 2, label: 'Dados Profissionais', icon: GraduationCap },
    { id: 3, label: 'Dados de Escolaridade', icon: BookOpen },
    { id: 4, label: 'Dados Corporativos', icon: Briefcase },
    { id: 5, label: 'GED', icon: Files }
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

  const showAlert = (title: string, description: string, variant: 'success' | 'error' | 'info' = 'info') => {
    setAlertConfig({ isOpen: true, title, description, variant })
  }

  useEffect(() => {
    fetchColaboradores()
    fetchPartners()
  }, [])

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
    return str.toLowerCase().split(' ').map(word => (word.length > 2) ? word.charAt(0).toUpperCase() + word.slice(1) : word).join(' ');
  }



  const maskCEP = (v: string) => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9)
  const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14)
  const maskDate = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 10)

  const formatDateToDisplay = (isoDate: string | undefined | null) => {
    if (!isoDate) return ''
    if (isoDate.includes('/')) return isoDate
    const [y, m, d] = isoDate.split('-')
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
      const [colabRes, rolesRes, locsRes, teamsRes, rateiosRes, hiringReasonsRes, termInitiativesRes, termTypesRes, termReasonsRes] = await Promise.all([
        supabase.from('collaborators').select(`*, partner:partner_id(id, name), leader:leader_id(id, name)`).order('name'),
        supabase.from('roles').select('id, name'),
        supabase.from('locations').select('id, name'),
        supabase.from('teams').select('id, name'),
        supabase.from('rateios').select('id, name'),
        supabase.from('hiring_reasons').select('id, name'),
        supabase.from('termination_initiatives').select('id, name'),
        supabase.from('termination_types').select('id, name'),
        supabase.from('termination_reasons').select('id, name')
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



  const handleSave = async (closeModal = true) => {
    try {
      if (!formData.name) return alert('Campos obrigatórios: Nome')
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
        birthday: formatDateToISO(formData.birthday) || null,
        hire_date: formatDateToISO(formData.hire_date) || null,
        termination_date: formatDateToISO(formData.termination_date) || null,
        oab_emissao: formatDateToISO(formData.oab_emissao) || null,
        escolaridade_previsao_conclusao: formatDateToISO(formData.escolaridade_previsao_conclusao) || null
      };

      if (formData.id) {
        // Update
        // Remove nested objects that are not columns
        const {
          leader,
          partner,
          roles,
          locations,
          teams,
          photo_url,
          ...cleanData
        } = dataToSave;

        const { error } = await supabase.from('collaborators').update({
          ...cleanData, foto_url: photoUrl
        }).eq('id', formData.id)
        if (error) throw error
      } else {
        // Insert
        // Remove nested objects that are not columns
        const {
          leader,
          partner,
          roles,
          locations,
          teams,
          photo_url,
          ...cleanData
        } = dataToSave;

        const { data, error } = await supabase.from('collaborators').insert({
          ...cleanData, foto_url: photoUrl
        }).select().single()
        if (error) throw error

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
    } catch (error: any) { alert('Erro ao salvar: ' + error.message) } finally { setLoading(false) }
  }

  const handleEdit = (colaborador: Collaborator) => {
    // Format dates for display (DD/MM/YYYY)
    const formattedColaborador = {
      ...colaborador,
      birthday: formatDateToDisplay(colaborador.birthday),
      hire_date: formatDateToDisplay(colaborador.hire_date),
      termination_date: formatDateToDisplay(colaborador.termination_date),
      oab_emissao: formatDateToDisplay(colaborador.oab_emissao),
      escolaridade_previsao_conclusao: formatDateToDisplay(colaborador.escolaridade_previsao_conclusao)
    };

    setFormData(formattedColaborador)
    setPhotoPreview(colaborador.photo_url || null)
    setSelectedPhotoFile(null)
    setActiveFormTab(1)
    setShowFormModal(true)
    // Clear pending
    setPendingGedDocs([])
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este colaborador?')) return
    await supabase.from('collaborators').delete().eq('id', id)
    fetchColaboradores()
    if (selectedColaborador) setSelectedColaborador(null)
  }

  const filtered = colaboradores.filter(c => {
    const matchSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchLider = filterLider ? String(c.leader_id) === filterLider : true
    const matchPartner = filterPartner ? String(c.partner_id) === filterPartner : true
    const matchLocal = filterLocal ? String(c.local) === filterLocal : true
    const matchCargo = filterCargo ? String(c.role) === filterCargo : true
    return matchSearch && matchLider && matchPartner && matchLocal && matchCargo
  })

  const handleExportXLSX = () => {
    // 1. Sort Data: Active first, then Inactive
    const sortedData = [...filtered].sort((a, b) => {
      if (a.status === b.status) return a.name.localeCompare(b.name);
      return a.status === 'active' ? -1 : 1;
    });

    const dataToExport = sortedData.map(c => ({
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

  // LAYOUT FUNCTIONS
  const renderModalContent = (activeTab: number, isViewMode: boolean, data: Partial<Collaborator>) => {
    // 1. DADOS PESSOAIS
    if (activeTab === 1) {
      if (isViewMode) {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Informações Pessoais</h3>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="CPF" value={data.cpf} />
                <DetailRow label="Identidade (RG)" value={data.rg} />
                <DetailRow label="Nascimento" value={formatDateToDisplay(data.birthday)} icon={Calendar} />
                <DetailRow label="Gênero" value={data.gender} />
                <DetailRow label="Est. Civil" value={data.civil_status} />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Endereço</h3>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="CEP" value={data.zip_code} />
                <DetailRow label="Estado" value={data.state} />
              </div>
              <DetailRow label="Logradouro" value={`${data.address || ''}, ${data.address_number || ''}`} />
              <DetailRow label="Complemento" value={data.address_complement} />
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Bairro" value={data.neighborhood} />
                <DetailRow label="Cidade" value={data.city} />
              </div>
            </div>

            {/* Dados de Emergência */}
            <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-100">
              <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 mb-4">Dados de Emergência</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DetailRow label="Nome" value={data.emergencia_nome} />
                <DetailRow label="Telefone" value={data.emergencia_telefone} />
                <DetailRow label="Parentesco" value={data.emergencia_parentesco} />
              </div>
            </div>

            {/* Observações */}
            <div className="col-span-1 md:col-span-2">
              <DetailRow label="Observações" value={data.observacoes} />
            </div>
          </div>
        )
      } else {
        // FORM MODE
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            {/* FORM MODE - Photo moved to sidebar */}
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <DadosPessoaisSection
                formData={formData}
                setFormData={setFormData}
                maskCPF={maskCPF}
                maskDate={maskDate}
              />
            </div>
            <EnderecoSection
              formData={formData}
              setFormData={setFormData}
              maskCEP={maskCEP}
              handleCepBlur={handleCepBlur}
            />
          </div>
        )
      }
    }

    // 2. DADOS PROFISSIONAIS
    if (activeTab === 2) {
      if (isViewMode) {
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Registro Profissional (OAB)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Número OAB" value={data.oab_numero} />
                  <DetailRow label="Estado OAB" value={data.oab_uf} />
                  {/* Renamed Label to Emissão OAB */}
                  <DetailRow label="Emissão OAB" value={formatDateToDisplay(data.oab_emissao)} icon={Calendar} />
                </div>
                {data.oab_tipo && <DetailRow label="Tipo de Inscrição" value={data.oab_tipo} />}
              </div>

              <div className="space-y-6">
                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Outros Documentos</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <DetailRow label="PIS/PASEP" value={data.pis || data.pis_pasep} />
                    <DetailRow label="Matrícula e-Social" value={data.matricula_esocial} />
                  </div>
                  <DetailRow label="CTPS (Carteira de Trabalho)" value={data.ctps || data.ctps_numero} />
                  <div className="grid grid-cols-2 gap-4">
                    <DetailRow label="Série CTPS" value={data.ctps_serie} />
                    <DetailRow label="UF CTPS" value={data.ctps_uf} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      } else {
        return (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <InformacoesProfissionaisSection
              formData={formData}
              setFormData={setFormData}
              maskDate={maskDate}
            />
          </div>
        )
      }
    }

    // 3. ESCOLARIDADE
    if (activeTab === 3) {
      if (isViewMode) {
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#1e3a8a]" />
              <h3 className="text-lg font-bold text-[#0a192f]">Dados de Escolaridade</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              <DetailRow label="Nível de Escolaridade" value={data.escolaridade_nivel} icon={GraduationCap} />
              {data.escolaridade_subnivel && (
                <DetailRow label="Subnível" value={data.escolaridade_subnivel} />
              )}
              <div className="col-span-1 md:col-span-2">
                <DetailRow label="Instituição" value={data.escolaridade_instituicao} icon={Building2} />
              </div>
              <div className="col-span-1 md:col-span-2">
                <DetailRow label="Curso" value={data.escolaridade_curso} />
              </div>
              <DetailRow label="Matrícula" value={data.escolaridade_matricula} />
              <DetailRow label="Semestre" value={data.escolaridade_semestre} />
              <DetailRow label="Previsão de Conclusão" value={formatDateToDisplay(data.escolaridade_previsao_conclusao)} icon={Calendar} />
            </div>
          </div>
        )
      } else {
        return (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <DadosEscolaridadeSection
              formData={formData}
              setFormData={setFormData}
              maskDate={maskDate}
              handleRefresh={handleRefresh}
            />
          </div>
        )
      }
    }

    // 4. CORPORATIVO
    if (activeTab === 4) {
      if (isViewMode) {
        // Helpers
        const getLookupName = (list: any[], id?: string | number) => list.find(item => String(item.id) === String(id))?.name || id

        // Calculate Duration
        let duration = null
        if (data.hire_date && data.termination_date) {
          try {
            const parseDate = (dString: string) => {
              // Handle ISO YYYY-MM-DD
              if (dString.includes('-')) {
                const [year, month, day] = dString.split('-').map(Number)
                return new Date(year, month - 1, day)
              }
              // Handle DD/MM/YYYY
              if (dString.includes('/')) {
                const [day, month, year] = dString.split('/').map(Number)
                return new Date(year, month - 1, day)
              }
              return new Date()
            }

            const start = parseDate(data.hire_date)
            const end = parseDate(data.termination_date)

            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
              const years = differenceInYears(end, start)
              const months = differenceInMonths(end, start) % 12
              duration = { years, months }
            }
          } catch (e) { }
        }

        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">

            {/* RATEIO & STATUS */}
            <div>
              <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 mb-4">Rateio & Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailRow label="Rateio" value={getLookupName(rateios, data.rateio_id)} />
                <DetailRow label="Status" value={data.status === 'active' ? 'Ativo' : 'Inativo'} />
              </div>
            </div>

            {/* CONTRATAÇÃO */}
            <div>
              <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 mb-4">Contratação</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-6">
                <DetailRow label="Data de Admissão" value={formatDateToDisplay(data.hire_date)} icon={Calendar} />
                <DetailRow label="Motivo Contratação" value={getLookupName(hiringReasons, data.hiring_reason_id)} />
                <DetailRow label="Tipo Contrato" value={data.contract_type} />

                <div className="md:col-span-1"><DetailRow label="Email Corporativo" value={data.email} icon={Mail} /></div>
                <DetailRow label="Sócio Responsável" value={(data as any).partner?.name || getLookupName(partners, data.partner_id)} />
                <DetailRow label="Líder Direto" value={(data as any).leader?.name || getLookupName(colaboradores, data.leader_id)} />

                <DetailRow label="Equipe/Área" value={(data as any).teams?.name || getLookupName(teams, data.equipe)} />
                <DetailRow label="Cargo" value={(data as any).roles?.name || getLookupName(roles, data.role)} />
                <DetailRow label="Centro de Custo" value={data.centro_custo} />

                <DetailRow label="Local" value={(data as any).locations?.name || getLookupName(locations, data.local)} icon={Building2} />
              </div>
            </div>

            {/* DESLIGAMENTO */}
            {data.termination_date && (
              <div>
                <h3 className="text-[9px] font-black text-red-300 uppercase tracking-widest border-b border-red-100 pb-2 mb-4">Desligamento</h3>
                <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DetailRow label="Data Desligamento" value={formatDateToDisplay(data.termination_date)} icon={Calendar} />
                    <DetailRow label="Iniciativa" value={getLookupName(terminationInitiatives, data.termination_initiative_id)} />
                    <DetailRow label="Tipo" value={getLookupName(terminationTypes, data.termination_type_id)} />
                    <DetailRow label="Motivo" value={getLookupName(terminationReasons, data.termination_reason_id) || data.termination_reason_id} />
                  </div>
                </div>

                {/* TIMELINE */}
                {duration && (
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in zoom-in-95 duration-500">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Linha do Tempo
                    </h4>

                    <div className="relative pt-2 pb-6 px-4">
                      {/* Bar */}
                      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full" />
                      <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-[#1e3a8a] to-red-500 -translate-y-1/2 rounded-full opacity-20" />

                      <div className="flex justify-between relative z-10">
                        {/* Start Point */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-[#1e3a8a] shadow ring-4 ring-white" />
                          <div className="text-center">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Admissão</p>
                            <p className="text-xs font-bold text-[#1e3a8a]">{formatDateToDisplay(data.hire_date)}</p>
                          </div>
                        </div>

                        {/* Mid Duration */}
                        <div className="bg-white px-4 py-1 rounded-full border border-gray-200 shadow-sm">
                          <p className="text-xs font-bold text-gray-600">
                            {duration.years > 0 && `${duration.years} ano${duration.years > 1 ? 's' : ''}`}
                            {duration.years > 0 && duration.months > 0 && ' e '}
                            {duration.months > 0 && `${duration.months} m${duration.months > 1 ? 'eses' : 'ês'}`}
                            {duration.years === 0 && duration.months === 0 && 'Recente'}
                          </p>
                        </div>

                        {/* End Point */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-red-500 shadow ring-4 ring-white" />
                          <div className="text-center">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Desligamento</p>
                            <p className="text-xs font-bold text-red-600">{formatDateToDisplay(data.termination_date)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      } else {
        return (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <DadosCorporativosSection
              formData={formData}
              setFormData={setFormData}
              maskDate={maskDate}
            />
          </div>
        )
      }
    }


    // 5. GED
    if (activeTab === 5) {
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
    sidebarContent?: React.ReactNode
  ) => {
    return (
      <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-[2rem] w-full max-w-6xl h-[90vh] flex overflow-hidden animate-in zoom-in-50 duration-300 shadow-2xl border border-gray-200 relative">

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
                      ? 'text-[#1e3a8a] bg-blue-50 font-bold shadow-sm'
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                      }`}
                  >
                    <div className={`p-1 rounded-lg transition-colors ${isActive ? 'text-[#1e3a8a]' : 'text-gray-300 group-hover:text-gray-500'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.2em]">{step.label}</span>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1 bg-[#1e3a8a] rounded-r-full" />}
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
            <div className="flex-1 overflow-y-auto px-12 py-6 custom-scrollbar">
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

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">

      {/* PAGE HEADER COMPLETO - Título + Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-500">
        {/* Left: Título e Ícone */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <Users className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Colaboradores
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Gerencie o time, edite perfis e controle acessos
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0 overflow-x-auto pb-2 md:pb-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const url = window.location.origin + '/ficha-cadastral';
                  window.open(url, '_blank');
                }}
                className="p-2 text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                title="Copiar Link Ficha Cadastral"
              >
                <Users className="h-5 w-5" />
              </button>
              <button
                onClick={handleExportXLSX}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100"
                title="Exportar Excel"
              >
                <FileSpreadsheet className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={() => {
                setFormData({ status: 'active', state: '' })
                setPhotoPreview(null)
                setActiveFormTab(1)
                setShowFormModal(true)
              }}
              className="hidden md:flex bg-[#1e3a8a] text-white px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider hover:bg-[#112240] transition-all shadow-lg shadow-blue-900/20 items-center gap-2 text-xs"
            >
              <Plus className="h-4 w-4" />
              Novo Colaborador
            </button>
          </div>
        </div>
      </div>

      {/* CONTROLS CARD - Search | Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-5 duration-600">
        <div className="flex flex-col xl:flex-row items-center gap-4">

          {/* Search Bar - Expanded */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 w-full flex-1 focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 focus-within:border-[#1e3a8a] transition-all">
            <Search className="h-4 w-4 text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-transparent border-none text-sm w-full outline-none text-gray-700 font-medium placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters Row - Auto-sizing */}
          <div className="flex flex-wrap items-center gap-3 w-auto justify-end">
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
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
                <th className="px-6 py-5 text-left text-[9px] font-black text-white uppercase tracking-[0.2em]">Colaborador</th>
                <th className="px-6 py-5 text-left text-[9px] font-black text-white uppercase tracking-[0.2em]">Cargo</th>
                <th className="px-6 py-5 text-left text-[9px] font-black text-white uppercase tracking-[0.2em]">Sócio</th>
                <th className="px-6 py-5 text-left text-[9px] font-black text-white uppercase tracking-[0.2em]">Líder</th>
                <th className="px-6 py-5 text-left text-[9px] font-black text-white uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-right text-[9px] font-black text-white uppercase tracking-[0.2em]">Ações</th>
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
                    <tr key={c.id} onClick={() => { setSelectedColaborador(c); setActiveDetailTab(1); }} className="hover:bg-blue-50/30 cursor-pointer transition-colors group">
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
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id) }} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-110 active:scale-95"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.some(c => c.status !== 'active') && (
                    <tr className="bg-gray-50/50">
                      <td colSpan={6} className="px-6 py-3 border-y border-gray-100">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Inativos</p>
                      </td>
                    </tr>
                  )}
                  {filtered.filter(c => c.status !== 'active').map(c => (
                    <tr key={c.id} onClick={() => { setSelectedColaborador(c); setActiveDetailTab(1); }} className="hover:bg-red-50/10 cursor-pointer transition-colors group grayscale hover:grayscale-0 opacity-70 hover:opacity-100">
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
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id) }} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-110 active:scale-95"><Trash2 className="h-4 w-4" /></button>
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
              onClick={() => handleDelete(selectedColaborador.id)}
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
        />
      )}

      {viewingPhoto && (
        <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setViewingPhoto(null)}>
          <button className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors" onClick={() => setViewingPhoto(null)}>
            <X className="h-8 w-8" />
          </button>
          <img src={viewingPhoto} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default" onClick={e => e.stopPropagation()} alt="Visualização" />
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
    </div>
  )
}

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
      <p className="text-sm font-bold text-[#0a192f] break-all">{value || '-'}</p>
    </div>
  )
}
