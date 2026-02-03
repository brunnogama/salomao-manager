import { useState, useRef, useEffect } from 'react'
import { 
  Search, Plus, X, MapPin, User, Briefcase, Trash2, Pencil, Save, Users, 
  UserMinus, CheckCircle, UserX, Calendar, Building2, Camera, Image, Mail, 
  FileText, ExternalLink, Loader2, Grid, LogOut, UserCircle
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { useColaboradores } from '../hooks/useColaboradores'
import { ColaboradoresList } from '../components/ColaboradoresList'
import { StatCard, Avatar, DetailRow } from '../components/ColaboradorUI'
import { 
  ESTADOS_BRASIL, toTitleCase, formatDateDisplay, 
  maskCEP, maskCPF, maskDate 
} from '../utils/colaboradoresUtils'
import { Colaborador } from '../../../types/colaborador'

export function Colaboradores({ userName = 'Usuário', onModuleHome, onLogout }: any) {
  const { colaboradores, deleteColaborador, gedDocs, fetchGedDocs, uploadingGed, setUploadingGed, fetchColaboradores } = useColaboradores()
  
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null)
  const [activeDetailTab, setActiveDetailTab] = useState<'dados' | 'ged'>('dados')
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState<Partial<Colaborador>>({})
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [selectedGedCategory, setSelectedGedCategory] = useState('')
  
  const photoInputRef = useRef<HTMLInputElement>(null)
  const gedInputRef = useRef<HTMLInputElement>(null)

  const handleOpenNew = () => {
    setFormData({ status: 'Ativo', estado: 'Rio de Janeiro' })
    setPhotoPreview(null)
    setViewMode('form')
    setSelectedColaborador(null)
  }

  const handleEdit = (colab: Colaborador) => {
    const fmt = (s?: string) => {
      if (!s) return ''
      const date = new Date(s)
      return new Date(date.valueOf() + date.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR')
    }
    setFormData({ 
      ...colab, 
      data_nascimento: fmt(colab.data_nascimento), 
      data_admissao: fmt(colab.data_admissao), 
      data_desligamento: fmt(colab.data_desligamento) 
    })
    setPhotoPreview(colab.foto_url || null)
    setViewMode('form')
    setSelectedColaborador(null)
  }

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

  const handleSave = async () => {
    if (!formData.nome) return alert('Nome obrigatório')
    const toISO = (s?: string) => {
      if (!s || s.length !== 10) return null
      const [d, m, y] = s.split('/')
      return `${y}-${m}-${d}`
    }

    const payload = {
      ...formData,
      nome: toTitleCase(formData.nome || ''),
      email: formData.email?.toLowerCase(),
      endereco: toTitleCase(formData.endereco || ''),
      complemento: toTitleCase(formData.complemento || ''),
      bairro: toTitleCase(formData.bairro || ''),
      cidade: toTitleCase(formData.cidade || ''),
      data_nascimento: toISO(formData.data_nascimento),
      data_admissao: toISO(formData.data_admissao),
      data_desligamento: toISO(formData.data_desligamento),
      foto_url: photoPreview // Simplificado para o exemplo, ideal manter sua lógica de upload
    }

    const { error } = formData.id 
      ? await supabase.from('colaboradores').update(payload).eq('id', formData.id)
      : await supabase.from('colaboradores').insert(payload)

    if (error) alert(error.message)
    else { setViewMode('list'); fetchColaboradores(); }
  }

  const filtered = colaboradores.filter(c => 
    c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || c.cpf?.includes(searchTerm)
  )

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-4">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg"><Users className="h-7 w-7 text-white" /></div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Colaboradores</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Gestão de cadastro completo</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white"><UserCircle className="h-5 w-5" /></div>
          {onModuleHome && <button onClick={onModuleHome} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><Grid className="h-5 w-5" /></button>}
          {onLogout && <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><LogOut className="h-5 w-5" /></button>}
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard title="Total" value={colaboradores.length} icon={Users} color="blue" />
            <StatCard title="Ativos" value={colaboradores.filter(c => c.status === 'Ativo').length} icon={CheckCircle} color="green" />
            <StatCard title="Desligados" value={colaboradores.filter(c => c.status === 'Desligado').length} icon={UserMinus} color="red" />
            <StatCard title="Inativos" value={colaboradores.filter(c => c.status === 'Inativo').length} icon={UserX} color="gray" />
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={handleOpenNew} className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95"><Plus className="h-4 w-4" /> Novo</button>
          </div>

          <ColaboradoresList 
            colaboradores={filtered} 
            onEdit={handleEdit} 
            onDelete={deleteColaborador}
            onSelect={(c) => { setSelectedColaborador(c); fetchGedDocs(c.id); setActiveDetailTab('dados'); }}
          />
        </div>
      ) : (
        /* FORMULÁRIO COMPLETO */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-8 border-b pb-4">
            <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">{formData.id ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
            <button onClick={() => setViewMode('list')} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full"><X className="h-6 w-6" /></button>
          </div>
          
          <div className="space-y-8">
            <section className="space-y-4">
              <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><User className="h-4 w-4" /> Dados Pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Nome Completo</label>
                  <input className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 font-medium outline-none" value={formData.nome || ''} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
                </div>
                <SearchableSelect label="Gênero" value={formData.genero || ''} onChange={v => setFormData({ ...formData, genero: v })} options={[{ name: 'Masculino' }, { name: 'Feminino' }]} />
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">CPF</label>
                  <input className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 font-medium outline-none" value={formData.cpf || ''} onChange={e => setFormData({ ...formData, cpf: maskCPF(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Data Nascimento</label>
                  <input className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 font-medium outline-none" value={formData.data_nascimento || ''} onChange={e => setFormData({ ...formData, data_nascimento: maskDate(e.target.value) })} maxLength={10} placeholder="DD/MM/AAAA" />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><MapPin className="h-4 w-4" /> Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">CEP</label>
                  <input className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 font-medium outline-none" value={formData.cep || ''} onChange={e => setFormData({ ...formData, cep: maskCEP(e.target.value) })} onBlur={handleCepBlur} />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Logradouro</label>
                  <input className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 font-medium outline-none" value={formData.endereco || ''} onChange={e => setFormData({ ...formData, endereco: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Número</label>
                  <input className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 font-medium outline-none" value={formData.numero || ''} onChange={e => setFormData({ ...formData, numero: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Bairro</label>
                  <input className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 font-medium outline-none" value={formData.bairro || ''} onChange={e => setFormData({ ...formData, bairro: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <SearchableSelect label="Estado" value={formData.estado || ''} onChange={v => setFormData({ ...formData, estado: v })} options={ESTADOS_BRASIL.map(e => ({ name: e.nome }))} />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><Briefcase className="h-4 w-4" /> Corporativo</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SearchableSelect label="Status" value={formData.status || ''} onChange={v => setFormData({ ...formData, status: v })} options={[{ name: 'Ativo' }, { name: 'Desligado' }]} />
                <SearchableSelect label="Equipe" value={formData.equipe || ''} onChange={v => setFormData({ ...formData, equipe: v })} table="opcoes_equipes" />
                <SearchableSelect label="Cargo" value={formData.cargo || ''} onChange={v => setFormData({ ...formData, cargo: v })} table="opcoes_cargos" />
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-4 mt-12 pt-6 border-t">
            <button onClick={() => setViewMode('list')} className="px-6 py-2.5 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">Cancelar</button>
            <button onClick={handleSave} className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg"><Save className="h-4 w-4" /> Salvar</button>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES COMPLETO */}
      {selectedColaborador && (
        <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-8 py-5 border-b flex justify-between bg-gray-50 items-center">
              <div className="flex items-center gap-4">
                <Avatar src={selectedColaborador.foto_url} name={selectedColaborador.nome} size="lg" />
                <div>
                  <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">{toTitleCase(selectedColaborador.nome)}</h2>
                  <p className="text-sm text-gray-500 font-semibold">{toTitleCase(selectedColaborador.cargo)} • {toTitleCase(selectedColaborador.equipe)}</p>
                </div>
              </div>
              <button onClick={() => setSelectedColaborador(null)} className="p-2 hover:bg-gray-200 rounded-full"><X className="h-6 w-6 text-gray-400" /></button>
            </div>

            <div className="flex border-b px-8 bg-white">
              <button onClick={() => setActiveDetailTab('dados')} className={`py-4 px-6 text-[9px] font-black uppercase tracking-[0.2em] border-b-2 ${activeDetailTab === 'dados' ? 'border-[#1e3a8a] text-[#1e3a8a]' : 'border-transparent text-gray-400'}`}>Dados Detalhados</button>
              <button onClick={() => setActiveDetailTab('ged')} className={`py-4 px-6 text-[9px] font-black uppercase tracking-[0.2em] border-b-2 ${activeDetailTab === 'ged' ? 'border-[#1e3a8a] text-[#1e3a8a]' : 'border-transparent text-gray-400'}`}>Documentos (GED)</button>
            </div>

            <div className="px-8 py-6 flex-1 overflow-y-auto">
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
                    <DetailRow label="Endereço" value={`${selectedColaborador.endereco || ''}, ${selectedColaborador.numero || ''}`} />
                    <DetailRow label="Cidade/UF" value={`${selectedColaborador.cidade || ''} - ${selectedColaborador.estado || ''}`} />
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Corporativo</h3>
                    <DetailRow label="Email" value={selectedColaborador.email} icon={Mail} />
                    <div className="grid grid-cols-2 gap-4">
                      <DetailRow label="Equipe" value={selectedColaborador.equipe} />
                      <DetailRow label="Líder" value={selectedColaborador.lider_equipe} />
                      <DetailRow label="Local" value={selectedColaborador.local} icon={Building2} />
                      <DetailRow label="Admissão" value={formatDateDisplay(selectedColaborador.data_admissao)} icon={Calendar} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gedDocs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="h-5 w-5 text-red-600" />
                        <p className="text-sm font-bold text-[#0a192f] truncate">{doc.nome_arquivo}</p>
                      </div>
                      <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 text-[#1e3a8a] hover:bg-blue-50 rounded-lg"><ExternalLink className="h-4 w-4" /></a>
                    </div>
                  ))}
                  {gedDocs.length === 0 && <p className="col-span-2 text-center text-gray-400 py-10">Nenhum documento vinculado.</p>}
                </div>
              )}
            </div>
            
            <div className="px-8 py-5 border-t flex justify-end gap-3 bg-gray-50">
               <button onClick={() => deleteColaborador(selectedColaborador.id, selectedColaborador.foto_url).then(res => res && setSelectedColaborador(null))} className="px-4 py-2 text-red-600 font-black text-[9px] uppercase tracking-[0.2em] border border-red-200 rounded-xl">Excluir</button>
               <button onClick={() => handleEdit(selectedColaborador)} className="px-6 py-2 bg-[#1e3a8a] text-white font-black text-[9px] uppercase tracking-[0.2em] rounded-xl shadow-lg">Editar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}