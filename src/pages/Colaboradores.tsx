// src/pages/Colaboradores.tsx

import { useState, useEffect, useRef } from 'react'
import { 
  Search, Upload, Download, Plus, X, MapPin, User, Briefcase, 
  Trash2, Pencil, Save, Users, UserMinus, CheckCircle, UserX, 
  Calendar, Building2, Camera, Image, Mail, FileText, File, ExternalLink, Loader2
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { SearchableSelect } from '../components/SearchableSelect'
import { Colaborador } from '../types/colaborador'

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
  
  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLider, setFilterLider] = useState('')
  const [filterLocal, setFilterLocal] = useState('')
  const [filterCargo, setFilterCargo] = useState('')

  // Estado do Formulário
  const [formData, setFormData] = useState<Partial<Colaborador>>({ status: 'Ativo', estado: 'Rio de Janeiro' })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null)

  // Estados do GED
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

  // Busca documentos quando o colaborador é selecionado ou muda para aba GED
  useEffect(() => {
    if (selectedColaborador && activeDetailTab === 'ged') {
      fetchGedDocs(selectedColaborador.id)
    }
  }, [selectedColaborador, activeDetailTab])

  // --- HELPERS ---
  const toTitleCase = (str: string) => {
    if (!str) return ''
    return str.toLowerCase().split(' ').map(word => (word.length > 2) ? word.charAt(0).toUpperCase() + word.slice(1) : word).join(' ');
  }

  const formatDateDisplay = (str?: string) => {
    if (!str) return '-'
    const date = new Date(str)
    return new Date(date.valueOf() + date.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR')
  }

  const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14)

  // --- DATA FETCHING ---
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

  // --- STORAGE LOGIC ---
  const uploadPhoto = async (file: File, id: number) => {
    try {
      setUploadingPhoto(true)
      const fileName = `${id}_${Date.now()}.${file.name.split('.').pop()}`
      const { error: upErr } = await supabase.storage.from('fotos-colaboradores').upload(`colaboradores/${fileName}`, file)
      if (upErr) throw upErr
      const { data } = supabase.storage.from('fotos-colaboradores').getPublicUrl(`colaboradores/${fileName}`)
      return data.publicUrl
    } catch (error) {
      alert('Erro no upload'); return null
    } finally { setUploadingPhoto(false) }
  }

  const deleteFoto = async (url: string) => {
    const path = url.split('/fotos-colaboradores/')[1]
    if (path) await supabase.storage.from('fotos-colaboradores').remove([path])
  }

  // --- GED LOGIC ---
  const handleGedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedColaborador || !selectedGedCategory) {
      if (!selectedGedCategory) alert('Selecione uma categoria primeiro.')
      return
    }

    try {
      setUploadingGed(true)
      const fileName = `${Date.now()}_${file.name}`
      const filePath = `ged/${selectedColaborador.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('ged-colaboradores')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('ged-colaboradores')
        .getPublicUrl(filePath)

      const { error: dbError } = await supabase.from('ged_colaboradores').insert({
        colaborador_id: selectedColaborador.id,
        nome_arquivo: file.name,
        url: publicUrl,
        categoria: selectedGedCategory,
        tamanho: file.size,
        tipo_arquivo: file.type
      })

      if (dbError) throw dbError

      fetchGedDocs(selectedColaborador.id)
      setSelectedGedCategory('')
      if (gedInputRef.current) gedInputRef.current.value = ''
    } catch (error: any) {
      alert('Erro no upload do GED: ' + error.message)
    } finally {
      setUploadingGed(false)
    }
  }

  const handleDeleteGed = async (doc: GEDDocument) => {
    if (!confirm('Excluir este documento permanentemente?')) return
    try {
      const path = doc.url.split('/ged-colaboradores/')[1]
      await supabase.storage.from('ged-colaboradores').remove([path])
      await supabase.from('ged_colaboradores').delete().eq('id', doc.id)
      fetchGedDocs(selectedColaborador!.id)
    } catch (error) {
      alert('Erro ao excluir documento.')
    }
  }

  // --- CRUD ACTIONS ---
  const handleSave = async () => {
    if (!formData.nome) return alert('Nome obrigatório')
    const toISO = (s?: string) => s?.length === 10 ? s.split('/').reverse().join('-') : null
    
    let fotoUrl = formData.foto_url
    if (photoInputRef.current?.files?.[0]) {
      if (formData.foto_url) await deleteFoto(formData.foto_url)
      fotoUrl = await uploadPhoto(photoInputRef.current.files[0], formData.id || Date.now()) || fotoUrl
    }

    const payload = {
      ...formData,
      nome: toTitleCase(formData.nome || ''),
      email: formData.email?.toLowerCase(),
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
    const fmt = (s?: string) => s ? new Date(new Date(s).valueOf() + new Date(s).getTimezoneOffset() * 60000).toLocaleDateString('pt-BR') : ''
    setFormData({ ...colab, data_nascimento: fmt(colab.data_nascimento), data_admissao: fmt(colab.data_admissao), data_desligamento: fmt(colab.data_desligamento) })
    setPhotoPreview(colab.foto_url || null); setViewMode('form'); setSelectedColaborador(null)
  }

  // --- RENDER HELPERS ---
  const filtered = colaboradores.filter(c => 
    (c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || c.cpf?.includes(searchTerm)) &&
    (!filterLider || c.lider_equipe === filterLider) &&
    (!filterLocal || c.local === filterLocal) &&
    (!filterCargo || c.cargo === filterCargo)
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4">
          <StatCard title="Total" value={colaboradores.length} icon={Users} color="blue" />
          <StatCard title="Ativos" value={colaboradores.filter(c => c.status === 'Ativo').length} icon={CheckCircle} color="green" />
          <StatCard title="Desligados" value={colaboradores.filter(c => c.status === 'Desligado').length} icon={UserMinus} color="red" />
          <StatCard title="Inativos" value={colaboradores.filter(c => c.status === 'Inativo').length} icon={UserX} color="gray" />
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3">
        {viewMode === 'list' && (
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="w-44"><SearchableSelect placeholder="Líderes" value={filterLider} onChange={setFilterLider} options={Array.from(new Set(colaboradores.map(c => c.lider_equipe).filter(Boolean))).map(n => ({ name: toTitleCase(n) }))} /></div>
            <div className="w-44"><SearchableSelect placeholder="Locais" value={filterLocal} onChange={setFilterLocal} options={Array.from(new Set(colaboradores.map(c => c.local).filter(Boolean))).map(n => ({ name: toTitleCase(n) }))} /></div>
          </div>
        )}
        <button onClick={() => { setFormData({ status: 'Ativo', estado: 'Rio de Janeiro' }); setPhotoPreview(null); setViewMode('form') }} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm"><Plus className="h-4 w-4" /> Novo</button>
      </div>

      {/* Table / Form */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Colaborador</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Equipe/Cargo</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(c => (
                <tr key={c.id} onClick={() => { setSelectedColaborador(c); setActiveDetailTab('dados'); }} className="hover:bg-blue-50/50 cursor-pointer transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <Avatar src={c.foto_url} name={c.nome} />
                    <div><p className="font-bold text-sm">{toTitleCase(c.nome)}</p><p className="text-xs text-gray-500">{c.cpf}</p></div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium">{toTitleCase(c.cargo)}</p>
                    <p className="text-xs text-gray-500">{toTitleCase(c.equipe)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.status === 'Ativo' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{c.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(c) }} className="p-2 text-blue-600"><Pencil className="h-4 w-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id) }} className="p-2 text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-8 animate-in fade-in">
          <div className="flex justify-between items-center mb-8 border-b pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">{formData.id ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />} {formData.id ? 'Editar' : 'Novo'} Colaborador</h2>
            <button onClick={() => setViewMode('list')} className="text-gray-500"><X className="h-6 w-6" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3 bg-blue-50 p-6 rounded-lg border border-blue-100 flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow overflow-hidden flex items-center justify-center">
                {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <Image className="text-gray-400 h-10 w-10" />}
              </div>
              <button onClick={() => photoInputRef.current?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm flex items-center gap-2"><Camera className="h-4 w-4" /> Alterar Foto</button>
              <input type="file" hidden ref={photoInputRef} accept="image/*" onChange={e => {
                const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => setPhotoPreview(ev.target?.result as string); r.readAsDataURL(f) }
              }} />
            </div>
            <div className="md:col-span-2"><label className="block text-xs font-bold uppercase mb-1">Nome</label><input className="w-full border rounded-lg p-2.5" value={formData.nome || ''} onChange={e => setFormData({ ...formData, nome: e.target.value })} /></div>
            <div><label className="block text-xs font-bold uppercase mb-1">CPF</label><input className="w-full border rounded-lg p-2.5" value={formData.cpf || ''} onChange={e => setFormData({ ...formData, cpf: maskCPF(e.target.value) })} /></div>
            
            <SearchableSelect label="Equipe" value={formData.equipe || ''} onChange={v => setFormData({ ...formData, equipe: v })} table="opcoes_equipes" onRefresh={handleRefresh} />
            <SearchableSelect label="Cargo" value={formData.cargo || ''} onChange={v => setFormData({ ...formData, cargo: v })} table="opcoes_cargos" onRefresh={handleRefresh} />
            <SearchableSelect label="Local" value={formData.local || ''} onChange={v => setFormData({ ...formData, local: v })} table="opcoes_locais" onRefresh={handleRefresh} />
            <SearchableSelect label="Status" value={formData.status || ''} onChange={v => setFormData({ ...formData, status: v })} options={[{ name: 'Ativo' }, { name: 'Desligado' }, { name: 'Inativo' }]} />
          </div>
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
            <button onClick={() => setViewMode('list')} className="px-6 py-2 border rounded-lg font-bold">Cancelar</button>
            <button onClick={handleSave} className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold flex items-center gap-2"><Save className="h-4 w-4" /> Salvar</button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedColaborador && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200">
            {/* Header Modal */}
            <div className="p-6 border-b flex justify-between bg-gray-50 shrink-0">
              <div className="flex items-center gap-4">
                <Avatar src={selectedColaborador.foto_url} name={selectedColaborador.nome} size="lg" />
                <div>
                  <h2 className="text-xl font-bold">{toTitleCase(selectedColaborador.nome)}</h2>
                  <p className="text-sm text-gray-500">{selectedColaborador.cargo} • {selectedColaborador.equipe}</p>
                </div>
              </div>
              <button onClick={() => setSelectedColaborador(null)} className="p-2 hover:bg-gray-200 rounded-full"><X className="h-6 w-6" /></button>
            </div>

            {/* Tabs Modal */}
            <div className="flex border-b px-6 bg-white shrink-0">
              <button 
                onClick={() => setActiveDetailTab('dados')}
                className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors ${activeDetailTab === 'dados' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                Dados Pessoais
              </button>
              <button 
                onClick={() => setActiveDetailTab('ged')}
                className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeDetailTab === 'ged' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                <FileText className="h-4 w-4" /> Documentos (GED)
              </button>
            </div>

            {/* Content Modal */}
            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
              {activeDetailTab === 'dados' ? (
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase border-b pb-1">Pessoal</h3>
                    <DetailRow label="CPF" value={selectedColaborador.cpf} />
                    <DetailRow label="Nascimento" value={formatDateDisplay(selectedColaborador.data_nascimento)} />
                    <DetailRow label="Gênero" value={selectedColaborador.genero} />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase border-b pb-1">Empresa</h3>
                    <DetailRow label="Email" value={selectedColaborador.email} icon={Mail} />
                    <DetailRow label="Equipe" value={selectedColaborador.equipe} />
                    <DetailRow label="Local" value={selectedColaborador.local} icon={Building2} />
                    <DetailRow label="Admissão" value={formatDateDisplay(selectedColaborador.data_admissao)} />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Upload Area */}
                  <div className="bg-blue-50 p-6 rounded-xl border border-dashed border-blue-200">
                    <div className="flex flex-col md:flex-row items-end gap-4">
                      <div className="flex-1 w-full">
                        <SearchableSelect 
                          label="Tipo de Documento"
                          placeholder="Selecione ou gerencie..."
                          value={selectedGedCategory}
                          onChange={setSelectedGedCategory}
                          table="opcoes_ged_colaboradores"
                          onRefresh={handleRefresh}
                        />
                      </div>
                      <div className="shrink-0 w-full md:w-auto">
                        <input 
                          type="file" 
                          hidden 
                          ref={gedInputRef} 
                          accept=".pdf,image/*" 
                          onChange={handleGedUpload} 
                        />
                        <button 
                          disabled={uploadingGed || !selectedGedCategory}
                          onClick={() => gedInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow-sm"
                        >
                          {uploadingGed ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                          Vincular Arquivo
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-blue-600 mt-2 font-medium italic">* Formatos aceitos: PDF e Imagens.</p>
                  </div>

                  {/* Listagem de Arquivos */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-700">Arquivos Vinculados ({gedDocs.length})</h3>
                    {gedDocs.length === 0 ? (
                      <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100">
                        <File className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Nenhum documento anexado ainda.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {gedDocs.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-all shadow-sm group">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="p-2 bg-red-50 text-red-600 rounded-lg shrink-0">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-sm font-bold text-gray-900 truncate">{doc.nome_arquivo}</p>
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{doc.categoria}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Visualizar">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                              <button onClick={() => handleDeleteGed(doc)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Remover">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-6 border-t flex justify-end gap-3 bg-gray-50 shrink-0">
              <button onClick={() => handleDelete(selectedColaborador.id)} className="px-4 py-2 text-red-600 font-bold border border-red-200 rounded-lg hover:bg-red-50">Excluir Colaborador</button>
              <button onClick={() => handleEdit(selectedColaborador)} className="px-6 py-2 bg-[#112240] text-white font-bold rounded-lg hover:bg-[#1a3a6c]">Editar Cadastro</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- SUB-COMPONENTS ---
function StatCard({ title, value, icon: Icon, color }: any) {
  const themes: any = { blue: 'text-blue-600 bg-blue-50', green: 'text-green-600 bg-green-50', red: 'text-red-600 bg-red-50', gray: 'text-gray-600 bg-gray-50' }
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border flex items-center justify-between">
      <div><p className="text-sm text-gray-500">{title}</p><p className="text-3xl font-bold mt-1">{value}</p></div>
      <div className={`p-3 rounded-xl ${themes[color]}`}><Icon className="h-6 w-6" /></div>
    </div>
  )
}

function Avatar({ src, name, size = 'sm' }: any) {
  const sz = size === 'lg' ? 'w-20 h-20 text-3xl' : 'w-10 h-10 text-sm'
  if (src) return <img src={src} className={`${sz} rounded-full object-cover border shadow-sm`} />
  return <div className={`${sz} rounded-full bg-gray-100 border flex items-center justify-center font-bold text-gray-400`}>{name?.charAt(0)}</div>
}

function DetailRow({ label, value, icon: Icon }: any) {
  return (
    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
      <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">{Icon && <Icon className="h-3 w-3" />}{label}</p>
      <p className="text-sm font-medium text-gray-900">{value || '-'}</p>
    </div>
  )
}