// src/components/collaborators/pages/Colaboradores.tsx
import { useState, useEffect, useRef } from 'react'
import {
  Search, Plus, X, Trash2, Pencil, Save, Users, UserMinus, CheckCircle, UserX,
  Calendar, Building2, Mail, FileText, ExternalLink, Loader2,
  Grid, LogOut, UserCircle, GraduationCap
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
  const [activeDetailTab, setActiveDetailTab] = useState<'dados' | 'ged'>('dados')

  const [searchTerm, setSearchTerm] = useState('')
  const [filterLider, setFilterLider] = useState('')
  const [filterPartner, setFilterPartner] = useState('')
  const [filterLocal, setFilterLocal] = useState('')
  const [filterCargo, setFilterCargo] = useState('')

  const [formData, setFormData] = useState<Partial<Collaborator>>({ status: 'active', state: 'Rio de Janeiro' })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null)

  const [gedDocs, setGedDocs] = useState<GEDDocument[]>([])
  const [uploadingGed, setUploadingGed] = useState(false)
  const [selectedGedCategory, setSelectedGedCategory] = useState('')
  const gedInputRef = useRef<HTMLInputElement>(null)

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
    if (selectedColaborador && activeDetailTab === 'ged') {
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
      // Query padronizada para evitar erros de cache de esquema
      // Fetch data independently since joins might fail without FKs
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
        photo_url: c.photo_url || c.foto_url, // Map from legacy DB field
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
    if (!file || !selectedColaborador || !selectedGedCategory) {
      if (!selectedGedCategory) alert('Selecione uma categoria primeiro.')
      return
    }
    try {
      setUploadingGed(true)
      const fileExt = file.name.split('.').pop()
      const rawFileName = `${selectedColaborador.name}_${selectedGedCategory}`
      const cleanPathName = rawFileName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '_');

      const finalFileName = `${cleanPathName}.${fileExt}`
      const filePath = `ged/${selectedColaborador.id}/${Date.now()}_${finalFileName}`

      const { error: uploadError } = await supabase.storage.from('ged-colaboradores').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('ged-colaboradores').getPublicUrl(filePath)

      await supabase.from('ged_colaboradores').insert({
        colaborador_id: selectedColaborador.id,
        nome_arquivo: `${toTitleCase(selectedColaborador.name)}_${toTitleCase(selectedGedCategory)}.${fileExt}`,
        url: publicUrl,
        categoria: selectedGedCategory,
        tamanho: file.size,
        tipo_arquivo: file.type
      })

      fetchGedDocs(selectedColaborador.id);
      setSelectedGedCategory('');
      if (gedInputRef.current) gedInputRef.current.value = ''
    } catch (error: any) { alert('Erro no upload do GED: ' + error.message) } finally { setUploadingGed(false) }
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
    if (!formData.name) return alert('Nome obrigatório')

    const toISO = (s?: string) => {
      if (!s || s.length !== 10) return null
      if (!s.includes('/')) return s
      const [d, m, y] = s.split('/')
      return `${y}-${m}-${d}`
    }

    let photoUrl = formData.photo_url
    if (photoInputRef.current?.files?.[0]) {
      if (formData.id && formData.photo_url) await deleteFoto(formData.photo_url)
      photoUrl = await uploadPhoto(photoInputRef.current.files[0], formData.id || 'temp_' + Date.now()) || photoUrl
    }

    const payload = {
      ...formData,
      name: toTitleCase(formData.name || ''),
      email: formData.email?.toLowerCase(),
      address: toTitleCase(formData.address || ''),
      address_complement: toTitleCase(formData.address_complement || ''),
      neighborhood: toTitleCase(formData.neighborhood || ''),
      city: toTitleCase(formData.city || ''),
      role: toTitleCase(formData.role || ''),
      birthday: toISO(formData.birthday),
      hire_date: toISO(formData.hire_date),
      termination_date: toISO(formData.termination_date),
      oab_vencimento: toISO(formData.oab_vencimento),
      photo_url: photoUrl,
      partner_id: formData.partner_id || null,
      leader_id: formData.leader_id || null
    }

      // Map photo_url to foto_url for DB compatibility and cleanup payload
      // Map photo_url to foto_url for DB compatibility and cleanup payload
      // Unconditionally map to ensure photo_url is never sent to the DB if it doesn't exist in schema
      (payload as any).foto_url = (payload as any).photo_url;
    delete (payload as any).photo_url;

    // Remove joined fields that are not columns in the table
    delete (payload as any).leader
    delete (payload as any).partner
    delete (payload as any).roles
    delete (payload as any).locations
    delete (payload as any).teams
    // Remove legacy field if present in formData
    delete (payload as any).oab_expiration

    const { error } = formData.id
      ? await supabase.from('collaborators').update(payload).eq('id', formData.id)
      : await supabase.from('collaborators').insert(payload)

    if (error) {
      alert(error.message)
    } else {
      fetchColaboradores()
      if (closeModal) {
        setShowFormModal(false)
        setPhotoPreview(null)
      } else {
        setFormData({ status: 'active', state: 'Rio de Janeiro' })
        setPhotoPreview(null)
        if (photoInputRef.current) photoInputRef.current.value = ''
        // Optional: Scroll to top of form
        document.querySelector('.custom-scrollbar')?.scrollTo(0, 0)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir?')) return
    const colab = colaboradores.find(c => c.id === id)
    if (colab?.photo_url) await deleteFoto(colab.photo_url)
    await supabase.from('collaborators').delete().eq('id', id)
    fetchColaboradores(); setSelectedColaborador(null)
  }

  const handleEdit = (colab: Collaborator) => {
    const fmt = (s?: string) => {
      if (!s) return ''
      const date = new Date(s)
      return new Date(date.valueOf() + date.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR')
    }
    setFormData({
      ...colab,
      birthday: fmt(colab.birthday),
      hire_date: fmt(colab.hire_date),
      termination_date: fmt(colab.termination_date),
      oab_vencimento: fmt(colab.oab_vencimento)
    })
    setPhotoPreview(colab.photo_url || null)
    setShowFormModal(true)
    setSelectedColaborador(null)
  }

  const handleOpenNewForm = () => {
    setFormData({ status: 'active', state: 'Rio de Janeiro' })
    setPhotoPreview(null)
    setShowFormModal(true)
  }

  const filtered = colaboradores.filter(c =>
    (c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.cpf?.includes(searchTerm)) &&
    (!filterLider || c.leader_id === filterLider) &&
    (!filterPartner || c.partner_id === filterPartner) &&
    (!filterLocal || c.local === filterLocal) &&
    (!filterCargo || c.role === filterCargo)
  )

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">

      {/* PAGE HEADER COMPLETO */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <Users className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Colaboradores
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Gerencie o cadastro completo dos colaboradores
            </p>
          </div>
        </div>

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

      <div className="space-y-6 pb-12 w-full">
        {/* STATS CARDS */}
        {/* TOOLBAR */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3 overflow-visible">
          <div className="flex flex-1 gap-3 overflow-visible">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="w-64"><SearchableSelect placeholder="Sócios" value={filterPartner} onChange={setFilterPartner} options={partners.map(p => ({ id: p.id, name: p.name }))} /></div>
            <div className="w-64"><SearchableSelect placeholder="Líderes" value={filterLider} onChange={setFilterLider} options={colaboradores.filter(c => c.status === 'active').map(c => ({ id: c.id, name: c.name }))} /></div>
            <div className="w-64">
              <SearchableSelect
                placeholder="Cargos"
                value={filterCargo}
                onChange={setFilterCargo}
                table="roles"
              />
            </div>
            <div className="w-64">
              <SearchableSelect
                placeholder="Locais"
                value={filterLocal}
                onChange={setFilterLocal}
                table="locations"
              />
            </div>
          </div>
          <button
            onClick={handleOpenNewForm}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a8a] hover:bg-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Novo
          </button>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 shadow-sm">
              <tr>
                <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  Colaborador
                  <span className="bg-blue-50 text-[#1e3a8a] px-2 py-0.5 rounded-full text-[9px] font-black border border-blue-100">
                    {colaboradores.filter(c => c.status === 'active').length}
                  </span>
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Cargo</th>
                <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Sócio Resp.</th>
                <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Líder</th>
                <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => (
                <tr key={c.id} onClick={() => { setSelectedColaborador(c); setActiveDetailTab('dados'); }} className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={c.photo_url} name={c.name} onImageClick={() => c.photo_url && setViewingPhoto(c.photo_url)} />
                      <p className="font-bold text-sm text-[#0a192f]">{toTitleCase(c.name)}</p>
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
            </tbody>
          </table >
        </div >
      </div >

      {showFormModal && (
        <div
          className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFormModal(false)
          }}
        >
          <div className="bg-white rounded-[2rem] w-full max-w-[90vw] my-8 flex flex-col shadow-2xl border border-gray-200/50 overflow-visible max-h-[95vh]">

            {/* Header */}
            <div className="px-8 py-5 border-b flex justify-between items-center bg-gray-50 shrink-0 rounded-t-[2rem]">
              <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight flex items-center gap-2">
                {formData.id ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {formData.id ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h2>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-all group"
              >
                <X className="h-6 w-6 text-gray-400 group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            {/* Body */}
            <div className="px-8 py-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-6">

                {/* Header Row: Photo + Personal Data */}
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Photo - Compact */}
                  <div className="shrink-0 flex justify-center md:justify-start pt-2">
                    <PhotoUploadSection
                      photoPreview={photoPreview}
                      uploadingPhoto={uploadingPhoto}
                      photoInputRef={photoInputRef}
                      setPhotoPreview={setPhotoPreview}
                    />
                  </div>

                  {/* Personal Data - Expands */}
                  <div className="flex-1 w-full">
                    <DadosPessoaisSection
                      formData={formData}
                      setFormData={setFormData}
                      maskCPF={maskCPF}
                      maskDate={maskDate}
                    />
                  </div>
                </div>

                {/* Address Section */}
                <EnderecoSection
                  formData={formData}
                  setFormData={setFormData}
                  maskCEP={maskCEP}
                  handleCepBlur={handleCepBlur}
                />

                {/* Professional & Corporate Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Informações Profissionais (OAB, CTPS, PIS) */}
                  <InformacoesProfissionaisSection
                    formData={formData}
                    setFormData={setFormData}
                    maskDate={maskDate}
                  />

                  {/* Dados Corporativos */}
                  <DadosCorporativosSection
                    formData={formData}
                    setFormData={setFormData}
                    maskDate={maskDate}
                    handleRefresh={handleRefresh}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t flex justify-end gap-3 bg-gray-50 shrink-0 rounded-b-[2rem]">
              <button
                onClick={() => setShowFormModal(false)}
                className="px-6 py-2.5 text-[9px] font-black text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all uppercase tracking-[0.2em]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
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
            </div>
          </div>
        </div>
      )
      }

      {
        selectedColaborador && (
          <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
            <div className="bg-white rounded-[2rem] w-full max-w-5xl my-8 flex flex-col shadow-2xl border border-gray-200/50">

              {/* Header */}
              <div className="px-8 py-5 border-b flex justify-between bg-gray-50 shrink-0 rounded-t-[2rem]">
                <div className="flex items-center gap-4">
                  <Avatar src={selectedColaborador.photo_url} name={selectedColaborador.name} size="lg" onImageClick={() => selectedColaborador.photo_url && setViewingPhoto(selectedColaborador.photo_url)} />
                  <div>
                    <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">{toTitleCase(selectedColaborador.name)}</h2>
                    <p className="text-sm text-gray-500 font-semibold">
                      {toTitleCase((selectedColaborador as any).roles?.name || selectedColaborador.role || '')} • {toTitleCase((selectedColaborador as any).teams?.name || selectedColaborador.equipe || '')}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedColaborador(null)} className="p-2 hover:bg-gray-200 rounded-full transition-all group">
                  <X className="h-6 w-6 text-gray-400 group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b px-8 bg-white shrink-0">
                <button onClick={() => setActiveDetailTab('dados')} className={`py-4 px-6 text-[9px] font-black uppercase tracking-[0.2em] border-b-2 transition-colors ${activeDetailTab === 'dados' ? 'border-[#1e3a8a] text-[#1e3a8a]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  Dados Pessoais
                </button>
                <button onClick={() => setActiveDetailTab('ged')} className={`py-4 px-6 text-[9px] font-black uppercase tracking-[0.2em] border-b-2 transition-colors flex items-center gap-2 ${activeDetailTab === 'ged' ? 'border-[#1e3a8a] text-[#1e3a8a]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  <FileText className="h-3.5 w-3.5" /> Documentos
                </button>
              </div>

              {/* Body */}
              <div className={`px-8 py-6 ${activeDetailTab === 'dados' ? 'max-h-[calc(90vh-320px)] overflow-y-auto custom-scrollbar' : ''}`}>
                {activeDetailTab === 'dados' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Pessoal</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailRow label="CPF" value={selectedColaborador.cpf} />
                        <DetailRow label="Nascimento" value={formatDateDisplay(selectedColaborador.birthday)} icon={Calendar} />
                        <DetailRow label="Gênero" value={selectedColaborador.gender} />
                        <DetailRow label="CEP" value={selectedColaborador.zip_code} />
                      </div>
                      <DetailRow label="Endereço" value={`${selectedColaborador.address || ''}, ${selectedColaborador.address_number || ''} ${selectedColaborador.address_complement ? '- ' + selectedColaborador.address_complement : ''}`} />
                      <div className="grid grid-cols-2 gap-4">
                        <DetailRow label="Bairro" value={selectedColaborador.neighborhood} />
                        <DetailRow label="Cidade/UF" value={`${selectedColaborador.city} - ${selectedColaborador.state}`} />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Corporativo</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailRow label="Email Corporativo" value={selectedColaborador.email} icon={Mail} />
                        <DetailRow label="Sócio Resp." value={(selectedColaborador as any).partner?.name} />
                        <DetailRow label="Cargo" value={selectedColaborador.role} />
                        <DetailRow label="Local" value={selectedColaborador.local} icon={Building2} />
                        <DetailRow label="Líder" value={(selectedColaborador as any).leader?.name} />
                        <DetailRow label="Admissão" value={formatDateDisplay(selectedColaborador.hire_date)} icon={Calendar} />
                        <DetailRow label="Desligamento" value={formatDateDisplay(selectedColaborador.termination_date)} icon={Calendar} />
                      </div>

                      {/* Informações Profissionais no Modal */}
                      {(selectedColaborador.oab_number || selectedColaborador.oab_state || selectedColaborador.oab_vencimento) && (
                        <>
                          <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2 mt-6">
                            < GraduationCap className="h-3.5 w-3.5" /> Profissional
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <DetailRow label="OAB" value={selectedColaborador.oab_numero} />
                            <DetailRow label="UF OAB" value={selectedColaborador.oab_uf} />
                            <DetailRow label="Vencimento OAB" value={formatDateDisplay(selectedColaborador.oab_vencimento)} icon={Calendar} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-6 rounded-xl border border-dashed border-blue-200 relative">
                      <div className="flex flex-col md:flex-row items-end gap-4">
                        <div className="flex-1 w-full relative z-[110]">
                          <SearchableSelect label="Tipo de Documento" placeholder="Selecione ou gerencie..." value={selectedGedCategory} onChange={setSelectedGedCategory} table="ged_categories" onRefresh={handleRefresh} />
                        </div>
                        <div className="shrink-0 w-full md:w-auto">
                          <input type="file" hidden ref={gedInputRef} accept=".pdf,image/*" onChange={handleGedUpload} />
                          <button
                            disabled={uploadingGed || !selectedGedCategory}
                            onClick={() => gedInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 bg-[#1e3a8a] hover:bg-[#112240] hover:shadow-xl disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95"
                          >
                            {uploadingGed ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Vincular
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-sm font-black text-[#0a192f]">Arquivos Vinculados ({gedDocs.length})</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {gedDocs.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-[#1e3a8a]/30 transition-all shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="p-2 bg-red-50 text-red-600 rounded-lg"><FileText className="h-5 w-5" /></div>
                              <div className="overflow-hidden">
                                <p className="text-sm font-bold text-[#0a192f] truncate">{doc.nome_arquivo}</p>
                                <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">{doc.categoria}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 text-[#1e3a8a] hover:bg-[#1e3a8a]/10 rounded-lg transition-all"><ExternalLink className="h-4 w-4" /></a>
                              <button onClick={() => handleDeleteGed(doc)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-5 border-t flex justify-end gap-3 bg-gray-50 shrink-0 rounded-b-[2rem]">
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
              </div>
            </div>
          </div>
        )
      }
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
      <p className="text-sm font-bold text-[#0a192f]">{value || '-'}</p>
    </div>
  )
}