// src/components/collaborators/pages/Colaboradores.tsx
import { useState, useEffect, useRef } from 'react'
import {
  Search, Plus, X, Trash2, Pencil, Save, Users, UserMinus, CheckCircle, UserX,
  Calendar, Building2, Mail, FileText, ExternalLink, Loader2, Link as LinkIcon,
  Grid, LogOut, UserCircle, GraduationCap, Briefcase, Files, History, User, Check, BookOpen, AlertCircle
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { Collaborator, Partner } from '../../../types/controladoria'

// Importar componentes modulares
import { PhotoUploadSection } from '../components/PhotoUploadSection'
import { DadosPessoaisSection } from '../components/DadosPessoaisSection'
import { EnderecoSection } from '../components/EnderecoSection'
import { DadosCorporativosSection } from '../components/DadosCorporativosSection'
import { InformacoesProfissionaisSection } from '../components/InformacoesProfissionaisSection'
import { DadosEscolaridadeSection } from '../components/DadosEscolaridadeSection'

// --- ESTADOS ---
const ESTADOS_BRASIL = [
  { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' }
];

interface GEDDocument {
  id: string;
  nome_arquivo: string;
  url: string;
  categoria: string;
  created_at: string;
}

interface ColaboradoresProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function Colaboradores({ userName = 'Usuário', onModuleHome, onLogout }: ColaboradoresProps) {
  const [colaboradores, setColaboradores] = useState<Collaborator[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
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

  // Inicializa estado vazio por padrão conforme solicitado
  const [formData, setFormData] = useState<Partial<Collaborator>>({ status: 'active', state: '' })

  const formSteps = [
    { id: 1, label: 'Dados Pessoais', icon: User },
    { id: 2, label: 'Dados Profissionais', icon: GraduationCap },
    { id: 3, label: 'Dados de Escolaridade', icon: BookOpen },
    { id: 4, label: 'Dados Corporativos', icon: Briefcase },
    { id: 5, label: 'Histórico', icon: History },
    { id: 6, label: 'GED', icon: Files }
  ]
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null)

  const [gedDocs, setGedDocs] = useState<GEDDocument[]>([])
  const [uploadingGed, setUploadingGed] = useState(false)
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
    if (selectedColaborador && activeDetailTab === 6) {
      fetchGedDocs(selectedColaborador.id)
    }
  }, [selectedColaborador, activeDetailTab])

  const toTitleCase = (str: string) => {
    if (!str) return ''
    return str.toLowerCase().split(' ').map(word => (word.length > 2) ? word.charAt(0).toUpperCase() + word.slice(1) : word).join(' ');
  }

  const formatDateDisplay = (str?: string) => {
    if (!str) return '-'
    const date = new Date(str)
    return new Date(date.valueOf() + date.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR')
  }

  const maskCEP = (v: string) => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9)
  const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14)
  const maskDate = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 10)

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
      const [colabRes, rolesRes, locsRes, teamsRes] = await Promise.all([
        supabase.from('collaborators').select(`*, partner:partner_id(id, name), leader:leader_id(id, name)`).order('name'),
        supabase.from('roles').select('id, name'),
        supabase.from('locations').select('id, name'),
        supabase.from('teams').select('id, name')
      ])

      if (colabRes.error) throw colabRes.error

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

  const uploadPhoto = async (file: File, id: string) => {
    try {
      setUploadingPhoto(true)
      const fileName = `${id}_${Date.now()}.${file.name.split('.').pop()}`
      const { error: upErr } = await supabase.storage.from('fotos-colaboradores').upload(`colaboradores/${fileName}`, file)
      if (upErr) throw upErr
      const { data } = supabase.storage.from('fotos-colaboradores').getPublicUrl(`colaboradores/${fileName}`)
      return data.publicUrl
    } catch (error) { alert('Erro no upload'); return null } finally { setUploadingPhoto(false) }
  }

  const deleteFoto = async (url: string) => {
    const path = url.split('/fotos-colaboradores/')[1]
    if (path) await supabase.storage.from('fotos-colaboradores').remove([`colaboradores/${path}`])
  }

  const handleGedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedGedCategory) {
      if (!selectedGedCategory) alert('Selecione uma categoria primeiro.')
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
      } catch (error: any) { alert('Erro no upload do GED: ' + error.message) } finally { setUploadingGed(false) }
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
      if (gedInputRef.current) gedInputRef.current.value = ''
    }
  }

  const handleDeleteGed = async (doc: GEDDocument) => {
    if (!confirm('Excluir este documento?')) return
    try {
      const path = doc.url.split('/ged-colaboradores/')[1]
      await supabase.storage.from('ged-colaboradores').remove([path])
      await supabase.from('ged_colaboradores').delete().eq('id', doc.id)
      fetchGedDocs(selectedColaborador!.id)
    } catch (error) { alert('Erro ao excluir documento.') }
  }

  const handleSave = async (closeModal = true) => {
    try {
      if (!formData.name || !formData.cpf) return alert('Campos obrigatórios: Nome e CPF')
      setLoading(true)
      let photoUrl = formData.photo_url

      if (formData.id) {
        // Update
        const { error } = await supabase.from('collaborators').update({
          ...formData, photo_url: photoUrl
        }).eq('id', formData.id)
        if (error) throw error
      } else {
        // Insert
        const { data, error } = await supabase.from('collaborators').insert({
          ...formData, photo_url: photoUrl
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
        setPendingGedDocs([])
        setActiveFormTab(1)
      }
    } catch (error: any) { alert('Erro ao salvar: ' + error.message) } finally { setLoading(false) }
  }

  const handleEdit = (colaborador: Collaborator) => {
    setFormData(colaborador)
    setPhotoPreview(colaborador.photo_url || null)
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
                <DetailRow label="Nascimento" value={formatDateDisplay(data.birthday)} icon={Calendar} />
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
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="shrink-0 flex justify-center md:justify-start pt-2">
                <PhotoUploadSection
                  photoPreview={photoPreview}
                  uploadingPhoto={uploadingPhoto}
                  photoInputRef={photoInputRef}
                  setPhotoPreview={setPhotoPreview}
                />
              </div>
              <div className="flex-1 w-full">
                <DadosPessoaisSection
                  formData={formData}
                  setFormData={setFormData}
                  maskCPF={maskCPF}
                  maskDate={maskDate}
                />
              </div>
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
                  <DetailRow label="Emissão OAB" value={formatDateDisplay(data.oab_emissao)} icon={Calendar} />
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
              <DetailRow label="Previsão de Conclusão" value={formatDateDisplay(data.escolaridade_previsao_conclusao)} icon={Calendar} />
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
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 mb-6">Informações da Empresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              <DetailRow label="Email Corporativo" value={data.email} icon={Mail} />
              <DetailRow label="Cargo" value={(data as any).roles?.name || data.role} />
              <DetailRow label="Centro de Custo" value={data.centro_custo} />
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Sócio Responsável" value={(data as any).partner?.name} />
                <DetailRow label="Líder" value={(data as any).leader?.name} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Equipe/Área" value={(data as any).teams?.name || data.equipe} />
                <DetailRow label="Local de Trabalho" value={(data as any).locations?.name || data.local} icon={Building2} />
              </div>
              <div className="grid grid-cols-4 gap-4 md:col-span-2">
                <DetailRow label="Admissão" value={formatDateDisplay(data.hire_date)} icon={Calendar} />
                <DetailRow label="Desligamento" value={formatDateDisplay(data.termination_date)} icon={Calendar} />
                <DetailRow label="Motivo Desligamento" value={data.motivo_desligamento} />
                <DetailRow label="Status" value={data.status === 'active' ? 'Ativo' : 'Inativo'} />
              </div>
            </div>
          </div>
        )
      } else {
        return (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <DadosCorporativosSection
              formData={formData}
              setFormData={setFormData}
              maskDate={maskDate}
              handleRefresh={handleRefresh}
            />
          </div>
        )
      }
    }

    // 5. HISTORICO
    if (activeTab === 5) {
      return (
        <div className="text-center py-12 text-gray-400 animate-in slide-in-from-right-4 duration-300 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
          <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-bold text-gray-500 mb-1">Histórico do Colaborador</h3>
          <p className="text-sm">Registro de alterações, férias e ocorrências.</p>
          <p className="text-xs mt-4 py-1 px-3 bg-gray-200 rounded-full inline-block font-bold">Em Breve</p>
        </div>
      )
    }

    // 6. GED
    if (activeTab === 6) {
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
    footer?: React.ReactNode
  ) => {
    return (
      <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-[2rem] w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-50 duration-300 shadow-2xl border border-gray-200">

          {/* Header */}
          <div className="px-8 py-5 border-b flex justify-between items-center bg-gray-50/50 shrink-0">
            <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight flex items-center gap-3">
              {title}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-all group">
              <X className="h-6 w-6 text-gray-400 group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>

          {/* Main Content Layout - Horizontal Flex */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar - Vertical Tabs */}
            <div className="w-64 bg-gray-50/50 border-r border-gray-100 overflow-y-auto p-4 space-y-2 shrink-0">
              {formSteps.map((step) => {
                const Icon = step.icon
                const isActive = activeTab === step.id

                // Visual calculation for "Completed" isn't strictly necessary for View, but nice for Form
                // We can simplify to just active state highlight
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveTab(step.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group relative overflow-hidden ${isActive
                      ? 'bg-white text-[#1e3a8a] shadow-md border border-gray-100 font-bold'
                      : 'text-gray-500 hover:bg-white hover:text-gray-700 hover:shadow-sm'
                      }`}
                  >
                    <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-[#1e3a8a]/10 text-[#1e3a8a]' : 'bg-gray-100 text-gray-400 group-hover:text-gray-600'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider">{step.label}</span>
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1e3a8a] rounded-l-xl" />}
                  </button>
                )
              })}
            </div>

            {/* Right Content - Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white relative">
              {children}
            </div>
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-8 py-5 border-t flex justify-end gap-3 bg-gray-50/50 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">

      {/* PAGE HEADER COMPLETO - Título + User Info */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-500">
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

        {/* Right: User Info & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Conectado</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white shadow-md">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && (
            <button
              onClick={onModuleHome}
              className="p-2 text-gray-600 hover:bg-gray-100 hover:text-[#1e3a8a] rounded-lg transition-all"
              title="Voltar aos módulos"
            >
              <Grid className="h-5 w-5" />
            </button>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* CONTROLS CARD - Search | Filters | Action */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-5 duration-600">
        <div className="flex flex-col xl:flex-row items-center gap-4">

          {/* Search Bar - Grows to fill space */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 w-full xl:flex-1 focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 focus-within:border-[#1e3a8a] transition-all">
            <Search className="h-4 w-4 text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              className="bg-transparent border-none text-sm w-full outline-none text-gray-700 font-medium placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 no-scrollbar">
            <SearchableSelect
              label=""
              placeholder="Líder"
              value={filterLider}
              onChange={setFilterLider}
              table="collaborators"
              options={colaboradores.map(c => ({ id: c.id, name: c.name }))}
              className="min-w-[140px]"
            />
            <SearchableSelect
              label=""
              placeholder="Sócio"
              value={filterPartner}
              onChange={setFilterPartner}
              table="partners"
              className="min-w-[140px]"
            />
            <SearchableSelect
              label=""
              placeholder="Local"
              value={filterLocal}
              onChange={setFilterLocal}
              table="locations"
              className="min-w-[140px]"
            />
            <SearchableSelect
              label=""
              placeholder="Cargo"
              value={filterCargo}
              onChange={setFilterCargo}
              table="roles"
              className="min-w-[140px]"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              setFormData({ status: 'active', state: '' })
              setPhotoPreview(null)
              setActiveFormTab(1)
              setShowFormModal(true)
            }}
            className="bg-[#1e3a8a] hover:bg-[#112240] text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" /> Novo Colaborador
          </button>
        </div>
      </div>

      {/* Table/Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-6 duration-700 flex-1">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Colaborador</th>
                <th className="px-6 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Cargo</th>
                <th className="px-6 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Sócio</th>
                <th className="px-6 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Líder</th>
                <th className="px-6 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Ações</th>
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
              className="px-6 py-2.5 text-[9px] font-black text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all uppercase tracking-[0.2em]"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleSave(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <Save className="h-4 w-4" /> Salvar
            </button>
            <button
              onClick={() => handleSave(false)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95 hover:bg-[#112240]"
            >
              <Plus className="h-4 w-4" /> Salvar e Novo
            </button>
          </>
        )
      )}

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
              className="px-4 py-2.5 text-red-600 font-black text-[9px] uppercase tracking-[0.2em] border border-red-200 rounded-xl hover:bg-red-50 transition-all"
            >
              Excluir
            </button>
            <button
              onClick={() => handleEdit(selectedColaborador)}
              className="px-4 py-2.5 bg-[#1e3a8a] hover:bg-[#112240] text-white font-black text-[9px] uppercase tracking-[0.2em] rounded-xl hover:shadow-xl transition-all shadow-lg active:scale-95"
            >
              Editar
            </button>
          </>
        )
      )}

      {viewingPhoto && (
        <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setViewingPhoto(null)}>
          <button className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors" onClick={() => setViewingPhoto(null)}>
            <X className="h-8 w-8" />
          </button>
          <img src={viewingPhoto} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default" onClick={e => e.stopPropagation()} alt="Visualização" />
        </div>
      )}
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