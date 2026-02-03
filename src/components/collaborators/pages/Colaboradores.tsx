import { useState } from 'react'
import { 
  Search, Plus, Users, CheckCircle, UserMinus, UserX, Grid, LogOut, UserCircle, X,
  Calendar, Mail, Building2, FileText, ExternalLink, Camera, Image, Save, User, MapPin, Briefcase
} from 'lucide-react'
import { useColaboradores } from '../hooks/useColaboradores'
import { ColaboradoresList } from '../components/ColaboradoresList'
import { StatCard, Avatar, DetailRow } from '../components/ColaboradorUI'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { toTitleCase, formatDateDisplay, maskCPF, maskDate, maskCEP } from '../utils/colaboradoresUtils'
import { Colaborador } from '../../../types/colaborador'

export function Colaboradores({ userName = 'Usuário', onModuleHome, onLogout }: any) {
  const { colaboradores, deleteColaborador, gedDocs, fetchGedDocs } = useColaboradores()
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null)
  const [activeDetailTab, setActiveDetailTab] = useState<'dados' | 'ged'>('dados')
  const [formData, setFormData] = useState<Partial<Colaborador>>({})

  const filtered = colaboradores.filter(c => 
    c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || c.cpf?.includes(searchTerm)
  )

  const handleOpenNew = () => {
    setFormData({ status: 'Ativo', estado: 'Rio de Janeiro' })
    setViewMode('form')
  }

  const handleSelectColaborador = (colab: Colaborador) => {
    setSelectedColaborador(colab)
    fetchGedDocs(colab.id)
  }

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
        <div className="flex items-center gap-3">
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
            <button onClick={handleOpenNew} className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg">
              <Plus className="h-4 w-4" /> Novo
            </button>
          </div>

          <ColaboradoresList 
            colaboradores={filtered} 
            onEdit={(c) => { setFormData(c); setViewMode('form'); }} 
            onDelete={deleteColaborador}
            onSelect={handleSelectColaborador}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-8 border-b pb-4">
            <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">{formData.id ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
            <button onClick={() => setViewMode('list')} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full"><X className="h-6 w-6" /></button>
          </div>
          <p className="text-gray-500 italic">Campos do formulário aqui...</p>
        </div>
      )}

      {/* MODAL DE DETALHES */}
      {selectedColaborador && (
        <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-8 py-5 border-b flex justify-between bg-gray-50 items-center">
              <div className="flex items-center gap-4">
                <Avatar src={selectedColaborador.foto_url} name={selectedColaborador.nome} size="lg" />
                <div>
                  <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">{toTitleCase(selectedColaborador.nome)}</h2>
                  <p className="text-sm text-gray-500 font-semibold">{toTitleCase(selectedColaborador.cargo)} • {toTitleCase(selectedColaborador.equipe)}</p>
                </div>
              </div>
              <button onClick={() => setSelectedColaborador(null)} className="p-2 hover:bg-gray-200 rounded-full group"><X className="h-6 w-6 text-gray-400 group-hover:rotate-90 transition-transform" /></button>
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
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Corporativo</h3>
                    <DetailRow label="Email Corporativo" value={selectedColaborador.email} icon={Mail} />
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">Documentos vinculados aparecerão aqui...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}