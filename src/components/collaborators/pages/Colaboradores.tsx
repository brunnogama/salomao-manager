// src/components/collaborators/pages/Colaboradores.tsx
import { useState, useEffect, useRef } from 'react'
import { 
  Search, Upload, Download, Plus, X, MapPin, User, Briefcase, 
  Trash2, Pencil, Save, Users, UserMinus, CheckCircle, UserX, 
  Calendar, Building2, Camera, Image, Mail, FileText, File, ExternalLink, Loader2, ChevronDown
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

export function Colaboradores() {
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
    <div className="max-w-7xl mx-auto space-y-6 pb-12 transition-all">
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <StatCard title="Total" value={colaboradores.length} icon={Users} />
          <StatCard title="Ativos" value={colaboradores.filter(c => c.status === 'Ativo').length} icon={CheckCircle} />
          <StatCard title="Desligados" value={colaboradores.filter(c => c.status === 'Desligado').length} icon={UserMinus} />
          <StatCard title="Inativos" value={colaboradores.filter(c => c.status === 'Inativo').length} icon={UserX} />
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
        {viewMode === 'list' && (
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar por nome ou CPF..." 
                className="w-full pl-9 pr-4 py-2.5 bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a] outline-none transition-all font-medium" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
            <div className="w-44"><SearchableSelect placeholder="Líderes" value={filterLider} onChange={setFilterLider} options={Array.from(new Set(colaboradores.map(c => c.lider_equipe).filter(Boolean))).map(n => ({ name: toTitleCase(n) }))} /></div>
            <div className="w-44"><SearchableSelect placeholder="Cargos" value={filterCargo} onChange={setFilterCargo} options={Array.from(new Set(colaboradores.map(c => c.cargo).filter(Boolean))).map(n => ({ name: toTitleCase(n) }))} /></div>
            <div className="w-44"><SearchableSelect placeholder="Locais" value={filterLocal} onChange={setFilterLocal} options={Array.from(new Set(colaboradores.map(c => c.local).filter(Boolean))).map(n => ({ name: toTitleCase(n) }))} /></div>
          </div>
        )}
        <button 
          onClick={() => { setFormData({ status: 'Ativo', estado: 'Rio de Janeiro' }); setPhotoPreview(null); setViewMode('form') }} 
          className="flex items-center gap-2 px-8 py-2 bg-[#1e3a8a] text-white text-[9px] font-black rounded-xl hover:bg-[#112240] shadow-lg transition-all active:scale-95 uppercase tracking-widest"
        >
          <Plus className="h-4 w-4" /> Novo Colaborador
        </button>
      </div>

      {viewMode === 'list' ? (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-y-2 px-2">
            <thead>
              <tr>
                <th className="px-4 py-4 text-[11px] font-black text-gray-500 uppercase tracking-[0.15em]">Colaborador</th>
                <th className="px-4 py-4 text-[11px] font-black text-gray-500 uppercase tracking-[0.15em]">Cargo / Equipe</th>
                <th className="px-4 py-4 text-[11px] font-black text-gray-500 uppercase tracking-[0.15em]">Status</th>
                <th className="px-4 py-4 text-right text-[11px] font-black text-gray-500 uppercase tracking-[0.15em]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => { setSelectedColaborador(c); setActiveDetailTab('dados'); }} className="group bg-white hover:bg-blue-50/40 border border-gray-100 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer">
                  <td className="px-4 py-4 first:rounded-l-xl flex items-center gap-3">
                    <Avatar src={c.foto_url} name={c.nome} />
                    <div>
                      <p className="font-bold text-sm text-[#112240]">{toTitleCase(c.nome)}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{c.email || c.cpf}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-gray-700">{toTitleCase(c.cargo)}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{toTitleCase(c.equipe)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-4 last:rounded-r-xl text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(c) }} className="p-2 bg-blue-50 text-blue-600 hover:bg-[#1e3a8a] hover:text-white rounded-lg transition-all shadow-sm border border-blue-100">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id) }} className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all shadow-sm border border-red-100">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center mb-8 border-b border-gray-50 pb-4">
            <h2 className="text-2xl font-black text-[#0a192f] tracking-tight flex items-center gap-3">
              {formData.id ? <Pencil className="h-6 w-6 text-[#d4af37]" /> : <Plus className="h-6 w-6 text-[#d4af37]" />} 
              {formData.id ? 'Editar Colaborador' : 'Novo Colaborador'}
            </h2>
            <button onClick={() => setViewMode('list')} className="p-2 hover:bg-gray-100 rounded-full transition-all group">
              <X className="h-6 w-6 text-gray-400 group-hover:rotate-90 transition-all" />
            </button>
          </div>

          <div className="space-y-10">
            <div className="bg-gradient-to-br from-[#112240] to-[#1e3a8a] p-8 rounded-[2rem] border border-white/10 flex items-center gap-8 shadow-xl">
              <div className="w-32 h-32 rounded-2xl bg-white/10 border-2 border-white/20 shadow-2xl overflow-hidden flex items-center justify-center relative group backdrop-blur-sm">
                {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <Image className="text-blue-200/50 h-12 w-12" />}
                {uploadingPhoto && <div className="absolute inset-0 bg-[#0a192f]/60 flex items-center justify-center backdrop-blur-sm"><Loader2 className="animate-spin text-[#d4af37]" /></div>}
              </div>
              <div>
                <button onClick={() => photoInputRef.current?.click()} className="px-8 py-2.5 bg-[#d4af37] text-[#0a192f] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-white transition-all active:scale-95 flex items-center gap-2">
                  <Camera className="h-4 w-4" /> {photoPreview ? 'Alterar Foto' : 'Adicionar Foto'}
                </button>
                <p className="text-[10px] font-bold text-blue-100/60 mt-3 uppercase tracking-widest">JPG, PNG ou GIF • Máximo 5MB</p>
              </div>
              <input type="file" hidden ref={photoInputRef} accept="image/*" onChange={e => {
                const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => setPhotoPreview(ev.target?.result as string); r.readAsDataURL(f) }
              }} />
            </div>

            <section className="space-y-6">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] border-b border-gray-100 pb-3 flex items-center gap-2"><User className="h-4 w-4 text-[#1e3a8a]" /> Dados Pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1 mb-1 block">Nome Completo</label>
                  <input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.nome || ''} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
                </div>
                <SearchableSelect label="Gênero" value={formData.genero || ''} onChange={v => setFormData({ ...formData, genero: v })} options={[{ name: 'Masculino' }, { name: 'Feminino' }, { name: 'Outro' }]} />
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1 mb-1 block">CPF</label>
                  <input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.cpf || ''} onChange={e => setFormData({ ...formData, cpf: maskCPF(e.target.value) })} maxLength={14} />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1 mb-1 block">Data Nascimento</label>
                  <input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.data_nascimento || ''} onChange={e => setFormData({ ...formData, data_nascimento: maskDate(e.target.value) })} maxLength={10} placeholder="DD/MM/AAAA" />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] border-b border-gray-100 pb-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-[#1e3a8a]" /> Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1 mb-1 block">CEP</label>
                  <input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.cep || ''} onChange={e => setFormData({ ...formData, CEP: maskCEP(e.target.value) })} onBlur={handleCepBlur} maxLength={9} />
                </div>
                <div className="md:col-span-3">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1 mb-1 block">Logradouro</label>
                  <input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.endereco || ''} onChange={e => setFormData({ ...formData, endereco: e.target.value })} />
                </div>
                <div><label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1 mb-1 block">Número</label><input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.numero || ''} onChange={e => setFormData({ ...formData, numero: e.target.value })} /></div>
                <div><label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1 mb-1 block">Complemento</label><input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.complemento || ''} onChange={e => setFormData({ ...formData, complemento: e.target.value })} /></div>
                <div><label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1 mb-1 block">Bairro</label><input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.bairro || ''} onChange={e => setFormData({ ...formData, bairro: e.target.value })} /></div>
                <SearchableSelect label="Estado" value={formData.estado || ''} onChange={v => setFormData({ ...formData, estado: v })} options={ESTADOS_BRASIL.map(e => ({ name: e.nome }))} />
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] border-b border-gray-100 pb-3 flex items-center gap-2"><Briefcase className="h-4 w-4 text-[#1e3a8a]" /> Dados Corporativos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2"><label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1 mb-1 block">E-mail Corporativo</label><input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                <SearchableSelect label="Status" value={formData.status || ''} onChange={v => setFormData({ ...formData, status: v })} options={[{ name: 'Ativo' }, { name: 'Desligado' }, { name: 'Inativo' }]} />
                <SearchableSelect label="Equipe" value={formData.equipe || ''} onChange={v => setFormData({ ...formData, equipe: v })} table="opcoes_equipes" onRefresh={handleRefresh} />
                <SearchableSelect label="Cargo" value={formData.cargo || ''} onChange={v => setFormData({ ...formData, cargo: v })} table="opcoes_cargos" onRefresh={handleRefresh} />
                <SearchableSelect label="Local" value={formData.local || ''} onChange={v => setFormData({ ...formData, local: v })} table="opcoes_locais" onRefresh={handleRefresh} />
                <SearchableSelect label="Líder" value={formData.lider_equipe || ''} onChange={v => setFormData({ ...formData, lider_equipe: v })} table="opcoes_lideres" onRefresh={handleRefresh} />
                <div><label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1 mb-1 block">Admissão</label><input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.data_admissao || ''} onChange={e => setFormData({ ...formData, data_admissao: maskDate(e.target.value) })} maxLength={10} placeholder="DD/MM/AAAA" /></div>
                <div><label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1 mb-1 block">Desligamento</label><input className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" value={formData.data_desligamento || ''} onChange={e => setFormData({ ...formData, data_desligamento: maskDate(e.target.value) })} maxLength={10} placeholder="DD/MM/AAAA" /></div>
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-3 mt-12 pt-6 border-t border-gray-50">
            <button onClick={() => setViewMode('list')} className="px-6 py-2 text-[9px] font-black text-gray-400 hover:text-gray-600 transition-all uppercase tracking-widest">Cancelar</button>
            <button onClick={handleSave} className="flex items-center gap-2 px-8 py-2 bg-[#15803d] text-white text-[9px] font-black rounded-xl hover:bg-green-800 shadow-lg transition-all active:scale-95 uppercase tracking-widest"><Save className="h-4 w-4" /> Salvar Cadastro</button>
          </div>
        </div>
      )}

      {selectedColaborador && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md transition-all">
          <div className="bg-white w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[95vh] flex flex-col border border-white/20">
            <div className="px-8 py-5 border-b border-gray-50 flex justify-between items-center bg-white flex-shrink-0">
              <div className="flex items-center gap-4">
                <Avatar src={selectedColaborador.foto_url} name={selectedColaborador.nome} size="lg" />
                <div>
                  <h2 className="text-2xl font-black text-[#0a192f] tracking-tight">{toTitleCase(selectedColaborador.nome)}</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{toTitleCase(selectedColaborador.cargo)} • {toTitleCase(selectedColaborador.equipe)}</p>
                </div>
              </div>
              <button onClick={() => setSelectedColaborador(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all group">
                <X className="h-6 w-6 text-gray-400 group-hover:rotate-90 transition-all" />
              </button>
            </div>

            <div className="flex border-b border-gray-50 px-8 bg-white shrink-0">
              <button onClick={() => setActiveDetailTab('dados')} className={`py-4 px-6 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeDetailTab === 'dados' ? 'border-[#1e3a8a] text-[#1e3a8a]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Dados Pessoais</button>
              <button onClick={() => setActiveDetailTab('ged')} className={`py-4 px-6 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeDetailTab === 'ged' ? 'border-[#1e3a8a] text-[#1e3a8a]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}><FileText className="h-4 w-4" /> Documentos (GED)</button>
            </div>

            <div className={`px-8 py-6 flex-1 custom-scrollbar ${activeDetailTab === 'ged' ? 'overflow-visible' : 'overflow-y-auto'}`}>
              {activeDetailTab === 'dados' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-[0.2em] border-b border-blue-50 pb-2">Pessoal</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <DetailField label="CPF" value={selectedColaborador.cpf} icon={User} />
                      <DetailField label="Nascimento" value={formatDateDisplay(selectedColaborador.data_nascimento)} icon={Calendar} />
                      <DetailField label="Gênero" value={selectedColaborador.genero} icon={Users} />
                      <DetailField label="CEP" value={selectedColaborador.cep} icon={MapPin} />
                    </div>
                    <DetailField label="Endereço Completo" value={`${selectedColaborador.endereco || ''}, ${selectedColaborador.numero || ''} ${selectedColaborador.complemento ? '- ' + selectedColaborador.complemento : ''}`} icon={MapPin} />
                    <div className="grid grid-cols-2 gap-4">
                      <DetailField label="Bairro" value={selectedColaborador.bairro} icon={MapPin} />
                      <DetailField label="Cidade/UF" value={`${selectedColaborador.cidade} - ${selectedColaborador.estado}`} icon={MapPin} />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-[0.2em] border-b border-blue-50 pb-2">Corporativo</h3>
                    <DetailField label="Email Corporativo" value={selectedColaborador.email} icon={Mail} />
                    <div className="grid grid-cols-2 gap-4">
                      <DetailField label="Equipe" value={selectedColaborador.equipe} icon={Briefcase} />
                      <DetailField label="Cargo" value={selectedColaborador.cargo} icon={Briefcase} />
                      <DetailField label="Local" value={selectedColaborador.local} icon={Building2} />
                      <DetailField label="Líder" value={selectedColaborador.lider_equipe} icon={User} />
                      <DetailField label="Admissão" value={formatDateDisplay(selectedColaborador.data_admissao)} icon={Calendar} />
                      <DetailField label="Desligamento" value={formatDateDisplay(selectedColaborador.data_desligamento)} icon={Calendar} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-blue-50/50 p-6 rounded-[1.5rem] border border-dashed border-blue-200 overflow-visible relative">
                    <div className="flex flex-col md:flex-row items-end gap-4">
                      <div className="flex-1 w-full relative z-[100]">
                        <SearchableSelect label="Tipo de Documento" placeholder="Selecione ou gerencie..." value={selectedGedCategory} onChange={setSelectedGedCategory} table="opcoes_ged_colaboradores" onRefresh={handleRefresh} />
                      </div>
                      <div className="shrink-0 w-full md:w-auto">
                        <input type="file" hidden ref={gedInputRef} accept=".pdf,image/*" onChange={handleGedUpload} />
                        <button disabled={uploadingGed || !selectedGedCategory} onClick={() => gedInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 bg-[#1e3a8a] hover:bg-[#112240] disabled:opacity-50 text-white px-8 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/10">
                          {uploadingGed ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Vincular Arquivo
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Arquivos Vinculados ({gedDocs.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gedDocs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-[#1e3a8a]/30 hover:shadow-md transition-all group">
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-all"><FileText className="h-5 w-5" /></div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-bold text-[#112240] truncate">{doc.nome_arquivo}</p>
                              <span className="inline-flex mt-1 items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 border border-gray-200">{doc.categoria}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-all"><ExternalLink className="h-4 w-4" /></a>
                            <button onClick={() => handleDeleteGed(doc)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-8 py-5 border-t border-gray-50 bg-white flex justify-between items-center flex-shrink-0">
              <button onClick={() => handleDelete(selectedColaborador.id)} className="px-6 py-2 text-[9px] font-black text-red-500 hover:text-red-700 transition-all uppercase tracking-widest">Excluir Colaborador</button>
              <button onClick={() => handleEdit(selectedColaborador)} className="flex items-center gap-2 px-8 py-2 bg-[#1e3a8a] text-white text-[9px] font-black rounded-xl hover:bg-[#112240] shadow-lg transition-all active:scale-95 uppercase tracking-widest">Editar Cadastro</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- SUB-COMPONENTS ---

function StatCard({ title, value, icon: Icon }: any) {
  return (
    <div className="flex items-center gap-4 bg-gradient-to-br from-[#112240] to-[#1e3a8a] px-5 py-4 rounded-xl shadow-lg border border-white/10 group transition-all hover:shadow-blue-900/20 hover:scale-[1.02]">
      <div className="p-3 bg-white/10 rounded-xl text-[#d4af37] group-hover:scale-110 transition-all">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-blue-200/70 uppercase tracking-[0.2em]">{title}</p>
        <p className="text-3xl font-black text-white">{value}</p>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const isAtivo = status === 'Ativo';
  const isDesligado = status === 'Desligado';
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
      isAtivo ? 'bg-green-50 text-green-700 border-green-100' : 
      isDesligado ? 'bg-red-50 text-red-700 border-red-100' : 
      'bg-gray-50 text-gray-600 border-gray-200'
    }`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isAtivo ? 'bg-green-500' : isDesligado ? 'bg-red-500' : 'bg-gray-400'}`} />
      {status}
    </div>
  )
}

function DetailField({ label, value, icon: Icon }: any) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-2xl bg-white border border-gray-100 transition-all hover:bg-gray-50/50 hover:shadow-sm group">
      <div className="flex items-center gap-2">
        <div className="p-1 rounded-md bg-blue-50 text-[#1e3a8a] group-hover:bg-[#1e3a8a] group-hover:text-white transition-all">
          <Icon className="w-3 h-3" />
        </div>
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover:text-[#1e3a8a] transition-all">
          {label}
        </span>
      </div>
      <p className="text-xs font-bold text-[#112240] truncate pl-1">
        {value || '-'}
      </p>
    </div>
  )
}

function Avatar({ src, name, size = 'sm' }: any) {
  const sz = size === 'lg' ? 'w-20 h-20' : 'w-10 h-10'
  return (
    <div className={`${sz} rounded-xl overflow-hidden border-2 border-white shadow-md bg-gray-100 flex-shrink-0 transition-all`}>
      {src ? (
        <img src={src} className="w-full h-full object-cover" alt={name} />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#112240] to-[#1e3a8a] text-[#d4af37] font-black text-sm">
          {name?.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  )
}
