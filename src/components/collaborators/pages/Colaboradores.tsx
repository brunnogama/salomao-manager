import { useState, useEffect, useRef } from 'react'
import { 
  Search, Plus, X, MapPin, User, Briefcase, Trash2, Pencil, Save, Users, 
  UserMinus, CheckCircle, UserX, Calendar, Building2, Camera, Image, Mail, 
  FileText, ExternalLink, Loader2, Grid, LogOut, UserCircle
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { Colaborador, GEDDocument } from '../../../types/colaborador'
import { StatCard, Avatar, DetailRow } from '../components/ColaboradorUI'
import { 
  ESTADOS_BRASIL, toTitleCase, formatDateDisplay, 
  maskCEP, maskCPF, maskDate 
} from '../utils/colaboradoresUtils'

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

  const [gedDocs, setGedDocs] = useState<GEDDocument[]>([])
  const [uploadingGed, setUploadingGed] = useState(false)
  const [selectedGedCategory, setSelectedGedCategory] = useState('')
  
  const gedInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchColaboradores() }, [])

  useEffect(() => {
    if (selectedColaborador && activeDetailTab === 'ged') {
      fetchGedDocs(selectedColaborador.id)
    }
  }, [selectedColaborador, activeDetailTab])

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
    if (!file || !selectedColaborador || !selectedGedCategory) return
    try {
      setUploadingGed(true)
      const fileExt = file.name.split('.').pop()
      const rawFileName = `${selectedColaborador.nome}_${selectedGedCategory}`
      const cleanPathName = rawFileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
      const filePath = `ged/${selectedColaborador.id}/${Date.now()}_${cleanPathName}.${fileExt}`

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
    } catch (error: any) { alert('Erro no upload: ' + error.message) } finally { setUploadingGed(false) }
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
      {/* HEADER */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <Users className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Colaboradores</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Gestão de cadastro completo</p>
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
          {onModuleHome && <button onClick={onModuleHome} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"><Grid className="h-5 w-5" /></button>}
          {onLogout && <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><LogOut className="h-5 w-5" /></button>}
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
          <button onClick={() => { setFormData({ status: 'Ativo', estado: 'Rio de Janeiro' }); setPhotoPreview(null); setViewMode('form') }} className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95"><Plus className="h-4 w-4" /> Novo</button>
        </div>

        {viewMode === 'list' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Colaborador</th>
                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Cargo</th>
                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Equipe</th>
                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(c => (
                  <tr key={c.id} onClick={() => setSelectedColaborador(c)} className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={c.foto_url} name={c.nome} />
                        <p className="font-bold text-sm text-[#0a192f]">{toTitleCase(c.nome)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#0a192f]">{toTitleCase(c.cargo)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{toTitleCase(c.equipe)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border ${c.status === 'Ativo' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(c) }} className="p-2 text-[#1e3a8a] hover:bg-white rounded-xl shadow-sm border border-gray-100"><Pencil className="h-4 w-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id) }} className="p-2 text-red-600 hover:bg-white rounded-xl shadow-sm border border-gray-100"><Trash2 className="h-4 w-4" /></button>
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
              <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight flex items-center gap-2">{formData.id ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
              <button onClick={() => setViewMode('list')} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full"><X className="h-6 w-6" /></button>
            </div>
            <div className="space-y-8">
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-center gap-6">
                <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative">
                  {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <Image className="text-gray-300 h-12 w-12" />}
                  {uploadingPhoto && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}
                </div>
                <div>
                  <button onClick={() => photoInputRef.current?.click()} className="px-4 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg flex items-center gap-2"><Camera className="h-4 w-4" /> Adicionar Foto</button>
                </div>
                <input type="file" hidden ref={photoInputRef} accept="image/*" onChange={e => {
                  const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => setPhotoPreview(ev.target?.result as string); r.readAsDataURL(f) }
                }} />
              </div>

              <section className="space-y-4">
                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><User className="h-4 w-4" /> Dados Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Nome Completo</label>
                    <input className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none font-medium" value={formData.nome || ''} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
                  </div>
                  <SearchableSelect label="Gênero" value={formData.genero || ''} onChange={v => setFormData({ ...formData, genero: v })} options={[{ name: 'Masculino' }, { name: 'Feminino' }]} />
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">CPF</label>
                    <input className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none font-medium" value={formData.cpf || ''} onChange={e => setFormData({ ...formData, cpf: maskCPF(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Data Nascimento</label>
                    <input className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none font-medium" value={formData.data_nascimento || ''} onChange={e => setFormData({ ...formData, data_nascimento: maskDate(e.target.value) })} maxLength={10} placeholder="DD/MM/AAAA" />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><MapPin className="h-4 w-4" /> Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">CEP</label>
                    <input className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none font-medium" value={formData.cep || ''} onChange={e => setFormData({ ...formData, cep: maskCEP(e.target.value) })} onBlur={handleCepBlur} />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Logradouro</label>
                    <input className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none font-medium" value={formData.endereco || ''} onChange={e => setFormData({ ...formData, endereco: e.target.value })} />
                  </div>
                </div>
              </section>
            </div>
            <div className="flex justify-end gap-4 mt-12 pt-6 border-t border-gray-100">
              <button onClick={() => setViewMode('list')} className="px-6 py-2.5 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">Cancelar</button>
              <button onClick={handleSave} className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg active:scale-95"><Save className="h-4 w-4" /> Salvar</button>
            </div>
          </div>
        )}

        {selectedColaborador && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="px-8 py-5 border-b flex justify-between bg-gray-50 items-center">
                <div className="flex items-center gap-4">
                  <Avatar src={selectedColaborador.foto_url} name={selectedColaborador.nome} size="lg" />
                  <div>
                    <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">{toTitleCase(selectedColaborador.nome)}</h2>
                    <p className="text-sm text-gray-500 font-semibold">{toTitleCase(selectedColaborador.cargo)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedColaborador(null)} className="p-2 hover:bg-gray-200 rounded-full transition-all"><X className="h-6 w-6" /></button>
              </div>

              <div className="flex border-b px-8 bg-white">
                <button onClick={() => setActiveDetailTab('dados')} className={`py-4 px-6 text-[9px] font-black uppercase tracking-[0.2em] border-b-2 transition-colors ${activeDetailTab === 'dados' ? 'border-[#1e3a8a] text-[#1e3a8a]' : 'border-transparent text-gray-400'}`}>Dados</button>
                <button onClick={() => setActiveDetailTab('ged')} className={`py-4 px-6 text-[9px] font-black uppercase tracking-[0.2em] border-b-2 transition-colors ${activeDetailTab === 'ged' ? 'border-[#1e3a8a] text-[#1e3a8a]' : 'border-transparent text-gray-400'}`}>Documentos</button>
              </div>

              <div className="px-8 py-6 flex-1 overflow-y-auto">
                {activeDetailTab === 'dados' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Pessoal</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailRow label="CPF" value={selectedColaborador.cpf} />
                        <DetailRow label="Nascimento" value={formatDateDisplay(selectedColaborador.data_nascimento)} icon={Calendar} />
                        <DetailRow label="Email" value={selectedColaborador.email} icon={Mail} />
                        <DetailRow label="Local" value={selectedColaborador.local} icon={Building2} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-6 rounded-xl border border-dashed border-blue-200">
                      <div className="flex flex-col md:flex-row items-end gap-4">
                        <div className="flex-1 w-full">
                          <SearchableSelect label="Categoria GED" value={selectedGedCategory} onChange={setSelectedGedCategory} table="opcoes_ged_colaboradores" onRefresh={handleRefresh} />
                        </div>
                        <button onClick={() => gedInputRef.current?.click()} disabled={uploadingGed || !selectedGedCategory} className="w-full md:w-auto bg-[#1e3a8a] text-white px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg active:scale-95">Vincular Arquivo</button>
                        <input type="file" hidden ref={gedInputRef} onChange={handleGedUpload} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gedDocs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <FileText className="h-5 w-5 text-red-600 shrink-0" />
                            <div className="overflow-hidden">
                              <p className="text-sm font-bold text-[#0a192f] truncate">{doc.nome_arquivo}</p>
                              <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">{doc.categoria}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 text-[#1e3a8a] hover:bg-blue-50 rounded-lg"><ExternalLink className="h-4 w-4" /></a>
                            <button onClick={() => handleDeleteGed(doc)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}