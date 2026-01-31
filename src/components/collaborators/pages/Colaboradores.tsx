// src/components/collaborators/pages/Colaboradores.tsx
import { useState, useEffect, useRef } from 'react'
import { 
  Search, Upload, Download, Plus, X, MapPin, User, Briefcase, 
  Trash2, Pencil, Save, Users, UserMinus, CheckCircle, UserX, 
  Calendar, Building2, Camera, Image, Mail, FileText, File, ExternalLink, Loader2,
  Grid, LogOut, UserCircle
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../../../lib/supabase'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { Colaborador } from '../../../types/colaborador'

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
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null)
  const [activeDetailTab, setActiveDetailTab] = useState<'dados' | 'ged'>('dados')
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLider, setFilterLider] = useState('')
  const [filterLocal, setFilterLocal] = useState('')
  const [filterCargo, setFilterCargo] = useState('')

  const [formData, setFormData] = useState<Partial<Colaborador>>({ status: 'Ativo', estado: 'Rio de Janeiro' })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null)

  const [gedDocs, setGedDocs] = useState<GEDDocument[]>([])
  const [uploadingGed, setUploadingGed] = useState(false)
  const [selectedGedCategory, setSelectedGedCategory] = useState('')
  const gedInputRef = useRef<HTMLInputElement>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchColaboradores() }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewingPhoto) setViewingPhoto(null)
        else if (selectedColaborador) setSelectedColaborador(null)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [viewingPhoto, selectedColaborador])

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
    const cep = formData.cep?.replace(/\D/g, '')
    if (cep?.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()
        if (!data.erro) {
          const estadoEncontrado = ESTADOS_BRASIL.find(e => e.sigla === data.uf)
          setFormData(prev => ({
            ...prev,
            endereco: toTitleCase(data.logradouro),
            bairro: toTitleCase(data.bairro),
            cidade: toTitleCase(data.localidade),
            estado: estadoEncontrado ? estadoEncontrado.nome : data.uf
          })) 
        }
      } catch (error) { console.error("Erro CEP:", error) }
    }
  }

  const fetchColaboradores = async () => {
    setLoading(true)
    const { data } = await supabase.from('colaboradores').select('*').order('nome')
    if (data) setColaboradores(data)
    setLoading(false)
  }

  const fetchGedDocs = async (colabId: number) => {
    const { data } = await supabase.from('ged_colaboradores').select('*').eq('colaborador_id', colabId).order('created_at', { ascending: false })
    if (data) setGedDocs(data)
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    fetchColaboradores()
  }

  const uploadPhoto = async (file: File, id: number) => {
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
      const rawFileName = `${selectedColaborador.nome}_${selectedGedCategory}`
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
        nome_arquivo: `${toTitleCase(selectedColaborador.nome)}_${toTitleCase(selectedGedCategory)}.${fileExt}`,
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

  const handleSave = async () => {
    if (!formData.nome) return alert('Nome obrigatório')
    const toISO = (s?: string) => {
      if (!s || s.length !== 10) return null
      const [d, m, y] = s.split('/')
      return `${y}-${m}-${d}`
    }
    
    let fotoUrl = formData.foto_url
    if (photoInputRef.current?.files?.[0]) {
      if (formData.id && formData.foto_url) await deleteFoto(formData.foto_url)
      fotoUrl = await uploadPhoto(photoInputRef.current.files[0], formData.id || Date.now()) || fotoUrl
    }

    const payload = {
      ...formData,
      nome: toTitleCase(formData.nome || ''),
      email: formData.email?.toLowerCase(),
      endereco: toTitleCase(formData.endereco || ''),
      complemento: toTitleCase(formData.complemento || ''),
      bairro: toTitleCase(formData.bairro || ''),
      cidade: toTitleCase(formData.cidade || ''),
      lider_equipe: toTitleCase(formData.lider_equipe || ''),
      cargo: toTitleCase(formData.cargo || ''),
      data_nascimento: toISO(formData.data_nascimento),
      data_admissao: toISO(formData.data_admissao),
      data_desligamento: toISO(formData.data_desligamento),
      foto_url: fotoUrl
    }

    const { error } = formData.id 
      ? await supabase.from('colaboradores').update(payload).eq('id', formData.id)
      : await supabase.from('colaboradores').insert(payload)

    if (error) alert(error.message)
    else { setViewMode('list'); fetchColaboradores(); setPhotoPreview(null); }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir?')) return
    const colab = colaboradores.find(c => c.id === id)
    if (colab?.foto_url) await deleteFoto(colab.foto_url)
    await supabase.from('colaboradores').delete().eq('id', id)
    fetchColaboradores(); setSelectedColaborador(null)
  }

  const handleEdit = (colab: Colaborador) => {
    const fmt = (s?: string) => {
      if (!s) return ''
      const date = new Date(s)
      return new Date(date.valueOf() + date.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR')
    }
    setFormData({ ...colab, data_nascimento: fmt(colab.data_nascimento), data_admissao: fmt(colab.data_admissao), data_desligamento: fmt(colab.data_desligamento) })
    setPhotoPreview(colab.foto_url || null); setViewMode('form'); setSelectedColaborador(null)
  }

  const filtered = colaboradores.filter(c => 
    (c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || c.cpf?.includes(searchTerm)) &&
    (!filterLider || c.lider_equipe === filterLider) &&
    (!filterLocal || c.local === filterLocal) &&
    (!filterCargo || c.cargo === filterCargo)
  )

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-4">
      
      {/* PAGE HEADER COMPLETO - Título + User Info */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
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
              Gerencie o cadastro completo dos colaboradores
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

      <div className="space-y-6 pb-12 w-full">
        {viewMode === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4">
            <StatCard title="Total" value={colaboradores.length} icon={Users} color="blue" />
            <StatCard title="Ativos" value={colaboradores.filter(c => c.status === 'Ativo').length} icon={CheckCircle} color="green" />
            <StatCard title="Desligados" value={colaboradores.filter(c => c.status === 'Desligado').length} icon={UserMinus} color="red" />
            <StatCard title="Inativos" value={colaboradores.filter(c => c.status === 'Inativo').length} icon={UserX} color="gray" />
          </div>
        )}

        {/* DESIGN SYSTEM: Botão Novo com Navy Gradient */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3">
          {viewMode === 'list' && (
            <div className="flex flex-1 gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="w-44"><SearchableSelect placeholder="Líderes" value={filterLider} onChange={setFilterLider} options={Array.from(new Set(colaboradores.map(c => c.lider_equipe).filter(Boolean))).map(n => ({ name: toTitleCase(n) }))} /></div>
              <div className="w-44"><SearchableSelect placeholder="Cargos" value={filterCargo} onChange={setFilterCargo} options={Array.from(new Set(colaboradores.map(c => c.cargo).filter(Boolean))).map(n => ({ name: toTitleCase(n) }))} /></div>
              <div className="w-44"><SearchableSelect placeholder="Locais" value={filterLocal} onChange={setFilterLocal} options={Array.from(new Set(colaboradores.map(c => c.local).filter(Boolean))).map(n => ({ name: toTitleCase(n) }))} /></div>
            </div>
          )}
          {/* DESIGN SYSTEM: Botão Navy com tracking-[0.2em] */}
          <button 
            onClick={() => { setFormData({ status: 'Ativo', estado: 'Rio de Janeiro' }); setPhotoPreview(null); setViewMode('form') }} 
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a8a] hover:bg-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Novo
          </button>
        </div>

        {viewMode === 'list' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Colaborador</th>
                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Cargo</th>
                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Equipe</th>
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
                        <Avatar src={c.foto_url} name={c.nome} />
                        <p className="font-bold text-sm text-[#0a192f]">{toTitleCase(c.nome)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-[#0a192f]">{toTitleCase(c.cargo)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-700">{toTitleCase(c.equipe)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-700">{toTitleCase(c.lider_equipe)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border ${c.status === 'Ativo' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${c.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500'}`} />
                        {c.status}
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
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight flex items-center gap-2">
                {formData.id ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {formData.id ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h2>
              <button onClick={() => setViewMode('list')} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-all group">
                <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Photo Upload */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 flex items-center gap-6">
                <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative group">
                  {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <Image className="text-gray-300 h-12 w-12" />}
                  {uploadingPhoto && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}
                </div>
                <div>
                  <button onClick={() => photoInputRef.current?.click()} className="px-4 py-2.5 bg-[#1e3a8a] hover:bg-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl flex items-center gap-2 transition-all active:scale-95">
                    <Camera className="h-4 w-4" /> {photoPreview ? 'Alterar' : 'Adicionar'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2 font-medium">JPG, PNG ou GIF. Máximo 5MB.</p>
                </div>
                <input type="file" hidden ref={photoInputRef} accept="image/*" onChange={e => {
                  const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => setPhotoPreview(ev.target?.result as string); r.readAsDataURL(f) }
                }} />
              </div>

              {/* DESIGN SYSTEM: Labels com tracking-widest */}
              <section className="space-y-4">
                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><User className="h-4 w-4" /> Dados Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Nome Completo</label>
                    <input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.nome || ''} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
                  </div>
                  <SearchableSelect label="Gênero" value={formData.genero || ''} onChange={v => setFormData({ ...formData, genero: v })} options={[{ name: 'Masculino' }, { name: 'Feminino' }, { name: 'Outro' }]} />
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">CPF</label>
                    <input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.cpf || ''} onChange={e => setFormData({ ...formData, cpf: maskCPF(e.target.value) })} maxLength={14} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Data Nascimento</label>
                    <input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.data_nascimento || ''} onChange={e => setFormData({ ...formData, data_nascimento: maskDate(e.target.value) })} maxLength={10} placeholder="DD/MM/AAAA" />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><MapPin className="h-4 w-4" /> Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">CEP</label>
                    <input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.cep || ''} onChange={e => setFormData({ ...formData, cep: maskCEP(e.target.value) })} onBlur={handleCepBlur} maxLength={9} />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Logradouro</label>
                    <input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.endereco || ''} onChange={e => setFormData({ ...formData, endereco: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Número</label>
                    <input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.numero || ''} onChange={e => setFormData({ ...formData, numero: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Complemento</label>
                    <input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.complemento || ''} onChange={e => setFormData({ ...formData, complemento: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Bairro</label>
                    <input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.bairro || ''} onChange={e => setFormData({ ...formData, bairro: e.target.value })} />
                  </div>
                  <SearchableSelect label="Estado" value={formData.estado || ''} onChange={v => setFormData({ ...formData, estado: v })} options={ESTADOS_BRASIL.map(e => ({ name: e.nome }))} />
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><Briefcase className="h-4 w-4" /> Dados Corporativos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">E-mail Corporativo</label>
                    <input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <SearchableSelect label="Status" value={formData.status || ''} onChange={v => setFormData({ ...formData, status: v })} options={[{ name: 'Ativo' }, { name: 'Desligado' }, { name: 'Inativo' }]} />
                  <SearchableSelect label="Equipe" value={formData.equipe || ''} onChange={v => setFormData({ ...formData, equipe: v })} table="opcoes_equipes" onRefresh={handleRefresh} />
                  <SearchableSelect label="Cargo" value={formData.cargo || ''} onChange={v => setFormData({ ...formData, cargo: v })} table="opcoes_cargos" onRefresh={handleRefresh} />
                  <SearchableSelect label="Local" value={formData.local || ''} onChange={v => setFormData({ ...formData, local: v })} table="opcoes_locais" onRefresh={handleRefresh} />
                  <SearchableSelect label="Líder" value={formData.lider_equipe || ''} onChange={v => setFormData({ ...formData, lider_equipe: v })} table="opcoes_lideres" onRefresh={handleRefresh} />
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Admissão</label>
                    <input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.data_admissao || ''} onChange={e => setFormData({ ...formData, data_admissao: maskDate(e.target.value) })} maxLength={10} placeholder="DD/MM/AAAA" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Desligamento</label>
                    <input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.data_desligamento || ''} onChange={e => setFormData({ ...formData, data_desligamento: maskDate(e.target.value) })} maxLength={10} placeholder="DD/MM/AAAA" />
                  </div>
                </div>
              </section>
            </div>

            {/* DESIGN SYSTEM: Botões com Navy/Green */}
            <div className="flex justify-end gap-4 mt-12 pt-6 border-t border-gray-100">
              <button onClick={() => setViewMode('list')} className="px-6 py-2.5 text-[9px] font-black text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all uppercase tracking-[0.2em]">Cancelar</button>
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95">
                <Save className="h-4 w-4" /> Salvar
              </button>
            </div>
          </div>
        )}

        {/* DESIGN SYSTEM: Modal com backdrop navy e rounded-[2rem] */}
        {selectedColaborador && (
          <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200/50 overflow-visible">
              
              {/* Header */}
              <div className="px-8 py-5 border-b flex justify-between bg-gray-50 shrink-0 rounded-t-[2rem]">
                <div className="flex items-center gap-4">
                  <Avatar src={selectedColaborador.foto_url} name={selectedColaborador.nome} size="lg" />
                  <div>
                    <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">{toTitleCase(selectedColaborador.nome)}</h2>
                    <p className="text-sm text-gray-500 font-semibold">{toTitleCase(selectedColaborador.cargo)} • {toTitleCase(selectedColaborador.equipe)}</p>
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
              <div className={`px-8 py-6 flex-1 custom-scrollbar ${activeDetailTab === 'ged' ? 'overflow-visible' : 'overflow-y-auto'}`}>
                {activeDetailTab === 'dados' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Pessoal</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailRow label="CPF" value={selectedColaborador.cpf} />
                        <DetailRow label="Nascimento" value={formatDateDisplay(selectedColaborador.data_nascimento)} icon={Calendar} />
                        <DetailRow label="Gênero" value={selectedColaborador.genero} />
                        <DetailRow label="CEP" value={selectedColaborador.cep} />
                      </div>
                      <DetailRow label="Endereço" value={`${selectedColaborador.endereco || ''}, ${selectedColaborador.numero || ''} ${selectedColaborador.complemento ? '- ' + selectedColaborador.complemento : ''}`} />
                      <div className="grid grid-cols-2 gap-4">
                        <DetailRow label="Bairro" value={selectedColaborador.bairro} />
                        <DetailRow label="Cidade/UF" value={`${selectedColaborador.cidade} - ${selectedColaborador.estado}`} />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Corporativo</h3>
                      <DetailRow label="Email Corporativo" value={selectedColaborador.email} icon={Mail} />
                      <div className="grid grid-cols-2 gap-4">
                        <DetailRow label="Equipe" value={selectedColaborador.equipe} />
                        <DetailRow label="Cargo" value={selectedColaborador.cargo} />
                        <DetailRow label="Local" value={selectedColaborador.local} icon={Building2} />
                        <DetailRow label="Líder" value={selectedColaborador.lider_equipe} />
                        <DetailRow label="Admissão" value={formatDateDisplay(selectedColaborador.data_admissao)} icon={Calendar} />
                        <DetailRow label="Desligamento" value={formatDateDisplay(selectedColaborador.data_desligamento)} icon={Calendar} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-6 rounded-xl border border-dashed border-blue-200 overflow-visible relative">
                      <div className="flex flex-col md:flex-row items-end gap-4">
                        <div className="flex-1 w-full relative z-[100]">
                          <SearchableSelect label="Tipo de Documento" placeholder="Selecione ou gerencie..." value={selectedGedCategory} onChange={setSelectedGedCategory} table="opcoes_ged_colaboradores" onRefresh={handleRefresh} />
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
        )}
      </div>
    </div>
  )
}

// --- SUB-COMPONENTS ---
function StatCard({ title, value, icon: Icon, color }: any) {
  const themes: any = { 
    blue: 'text-blue-600 bg-blue-50 border-blue-100', 
    green: 'text-green-600 bg-green-50 border-green-100', 
    red: 'text-red-600 bg-red-50 border-red-100', 
    gray: 'text-gray-600 bg-gray-50 border-gray-100' 
  }
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border flex items-center justify-between transition-all hover:shadow-md ${themes[color].split(' ')[2]}`}>
      <div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</p>
        <p className="text-[30px] font-black mt-1 text-[#0a192f] tracking-tight">{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${themes[color].split(' ')[0]} ${themes[color].split(' ')[1]}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  )
}

function Avatar({ src, name, size = 'sm' }: any) {
  const sz = size === 'lg' ? 'w-20 h-20 text-xl' : 'w-10 h-10 text-sm'
  if (src) return <img src={src} className={`${sz} rounded-full object-cover border-2 border-white shadow-sm`} alt={name} />
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
