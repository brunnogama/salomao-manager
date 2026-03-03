import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { Vaga } from '../../../types/controladoria'
import {
  Briefcase,
  Plus,
  Search,
  Users,
  Clock,
  CheckCircle2,
  Edit2,
  AlertCircle,
  X,
  Filter,
  User,
  Building2
} from 'lucide-react'
import { FilterSelect } from '../../controladoria/ui/FilterSelect'
import { VagaFormModal } from '../components/VagaFormModal'
import { CandidatoFormModal } from '../components/CandidatoFormModal'
import { VagasSelectionModal, VagasCreationType } from '../components/VagasSelectionModal'

export function RHVagas() {
  const [searchTerm, setSearchTerm] = useState('')
  const [vagas, setVagas] = useState<Vaga[]>([])
  const [candidatos, setCandidatos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'abertas' | 'talentos' | 'fechadas' | 'filtros'>('abertas')

  // Filtros
  const [filterLider, setFilterLider] = useState('')
  const [filterPartner, setFilterPartner] = useState('')
  const [filterLocal, setFilterLocal] = useState('')
  const [filterCargo, setFilterCargo] = useState('')

  // Opções de Filtro
  const [liderOptions, setLiderOptions] = useState<{ value: string; label: string }[]>([])
  const [partnerOptions, setPartnerOptions] = useState<{ value: string; label: string }[]>([])
  const [locationOptions, setLocationOptions] = useState<{ value: string; label: string }[]>([])
  const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([])

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false)
  const [isCandidatoModalOpen, setIsCandidatoModalOpen] = useState(false)
  const [selectedVagaId, setSelectedVagaId] = useState<string | null>(null)
  const [selectedCandidatoId, setSelectedCandidatoId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([fetchVagas(), fetchCandidatos(), fetchFilterOptions()])
    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError('Não foi possível carregar as informações.')
    } finally {
      setLoading(false)
    }
  }

  const fetchFilterOptions = async () => {
    const [rolesRes, locsRes, partnersRes, leadersRes] = await Promise.all([
      supabase.from('roles').select('id, name').order('name'),
      supabase.from('locations').select('id, name').order('name'),
      supabase.from('partners').select('id, name').order('name'),
      supabase.from('collaborators').select('id, name').order('name')
    ]);
    if (rolesRes.data) setRoleOptions(rolesRes.data.map(r => ({ value: String(r.id), label: r.name })));
    if (locsRes.data) setLocationOptions(locsRes.data.map(l => ({ value: String(l.id), label: l.name })));
    if (partnersRes.data) setPartnerOptions(partnersRes.data.map(p => ({ value: String(p.id), label: p.name })));
    if (leadersRes.data) setLiderOptions(leadersRes.data.map(c => ({ value: String(c.id), label: c.name })));
  }

  const fetchVagas = async () => {
    const { data, error: dbError } = await supabase
      .from('vagas')
      .select(`
        *,
        role:role_id (id, name),
        location:location_id (id, name),
        partner:partner_id (id, name),
        leader:leader_id (id, name)
      `)
      .order('created_at', { ascending: false })

    if (dbError) throw dbError
    setVagas(data || [])
  }

  const fetchCandidatos = async () => {
    const { data, error: dbError } = await supabase
      .from('candidatos')
      .select(`
        *,
        candidato_historico ( tipo, data_registro )
      `)
      .order('created_at', { ascending: false })

    if (dbError) throw dbError
    setCandidatos(data || [])
  }

  const handleOpenSelectionModal = () => {
    setIsSelectionModalOpen(true)
  }

  const handleSelection = (tipo: VagasCreationType) => {
    setIsSelectionModalOpen(false)
    if (tipo === 'vaga') {
      handleOpenModal()
    } else {
      setSelectedCandidatoId(null)
      setIsCandidatoModalOpen(true)
    }
  }

  const handleOpenModal = (id?: string) => {
    setSelectedVagaId(id || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedVagaId(null)
  }

  const handleCloseCandidatoModal = () => {
    setIsCandidatoModalOpen(false)
    setSelectedCandidatoId(null)
  }

  const filteredVagas = vagas.filter(v => {
    const term = searchTerm.toLowerCase()
    const matchSearch = (
      v.vaga_id_text?.toLowerCase().includes(term) ||
      v.role?.name?.toLowerCase().includes(term) ||
      v.area?.toLowerCase().includes(term) ||
      v.location?.name?.toLowerCase().includes(term) ||
      v.partner?.name?.toLowerCase().includes(term) ||
      v.leader?.name?.toLowerCase().includes(term)
    )

    const matchLider = filterLider ? String(v.leader_id) === filterLider : true
    const matchPartner = filterPartner ? String(v.partner_id) === filterPartner : true
    const matchLocal = filterLocal ? String(v.location_id) === filterLocal : true
    const matchCargo = filterCargo ? String(v.role_id) === filterCargo : true

    return matchSearch && matchLider && matchPartner && matchLocal && matchCargo
  })

  const filteredCandidatos = candidatos.filter(c => {
    const term = searchTerm.toLowerCase()
    const matchSearch = c.nome?.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term)

    // Convert text fields or IDs exactly the way they are stored. 
    // Usually 'role' and 'local' on candidato are string IDs in the form, but let's compare as strings.
    const matchLocal = filterLocal ? String(c.local) === filterLocal : true
    const matchCargo = filterCargo ? String(c.role) === filterCargo : true

    return matchSearch && matchLocal && matchCargo
  })

  // Stats
  const vagasAbertas = vagas.filter(v => v.status === 'Aberta').length
  const totalTalentosCount = candidatos.length

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const vagasFechadasNoMes = vagas.filter(v => {
    if (v.status !== 'Fechada' || !v.data_fechamento) return false
    const d = new Date(v.data_fechamento)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  }).length

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6 pb-24">

      {/* PAGE HEADER COMPLETO - Título + Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-500">
        {/* Left: Título e Ícone */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <Briefcase className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
                Recrutamento & Seleção
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Gestão de vagas abertas, candidatos e processos seletivos
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto justify-end mt-2 md:mt-0 custom-scrollbar">
          {/* TABS MOVED HERE - OUTSIDE TERNARY */}
          <div className="flex items-center bg-gray-100/80 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setActiveTab('abertas')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'abertas' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Briefcase className="h-4 w-4" /> Vagas Abertas
            </button>
            <button
              onClick={() => setActiveTab('talentos')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'talentos' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Users className="h-4 w-4" /> Talentos
            </button>
            <button
              onClick={() => setActiveTab('fechadas')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'fechadas' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <CheckCircle2 className="h-4 w-4" /> Vagas Fechadas
            </button>
            <button
              onClick={() => setActiveTab('filtros')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'filtros' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Filter className="h-4 w-4" /> Filtros
            </button>
          </div>

          <div className="flex items-center gap-4 border-l border-gray-100 pl-4 ml-2">
            <button
              onClick={handleOpenSelectionModal}
              className="flex items-center justify-center w-10 h-10 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 shrink-0"
              title="Adicionar Novo"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {activeTab !== 'filtros' && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-5 duration-600 flex-none">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">

            {/* Active Count Card */}
            {activeTab === 'abertas' && (
              <div className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-2.5 shrink-0 animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="p-1.5 bg-blue-100 rounded-lg text-[#1e3a8a]">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-900/40 uppercase tracking-widest leading-none mb-1">Abertas</p>
                  <p className="text-sm font-bold text-[#1e3a8a] leading-none">{vagasAbertas}</p>
                </div>
              </div>
            )}
            {activeTab === 'talentos' && (
              <div className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-2.5 shrink-0 animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="p-1.5 bg-blue-100 rounded-lg text-[#1e3a8a]">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-900/40 uppercase tracking-widest leading-none mb-1">Total Talentos</p>
                  <p className="text-sm font-bold text-[#1e3a8a] leading-none">{totalTalentosCount}</p>
                </div>
              </div>
            )}
            {activeTab === 'fechadas' && (
              <div className="flex items-center gap-3 bg-emerald-50/50 border border-emerald-100 rounded-xl px-4 py-2.5 shrink-0 animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest leading-none mb-1">Fechadas no Mês</p>
                  <p className="text-sm font-bold text-emerald-700 leading-none">{vagasFechadasNoMes}</p>
                </div>
              </div>
            )}

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
      )}

      {activeTab === 'filtros' && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-5 duration-600 space-y-8 flex-1 overflow-auto custom-scrollbar">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-[#1e3a8a]">Opções de Filtro</h2>
            <button
              onClick={() => {
                setFilterLider('')
                setFilterPartner('')
                setFilterLocal('')
                setFilterCargo('')
                setSearchTerm('')
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <X className="h-4 w-4" /> Limpar Filtros
            </button>
          </div>
          <p className="text-gray-500 text-sm">Filtros avançados em desenvolvimento para vagas...</p>
        </div>
      )}

      {/* LISTA DE VAGAS / CANDIDATOS */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center border border-red-100 shadow-sm">
          <AlertCircle className="h-8 w-8 text-red-500 mb-3" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      ) : (activeTab === 'abertas' || activeTab === 'fechadas') && filteredVagas.filter(v => activeTab === 'fechadas' ? v.status === 'Fechada' : (v.status === 'Aberta' || v.status === 'Congelada')).length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-full bg-blue-50 mb-4">
              <Briefcase className="h-12 w-12 text-[#1e3a8a] opacity-20" />
            </div>
            <h2 className="text-xl font-black text-[#0a192f]">Nenhuma vaga {activeTab === 'fechadas' ? 'fechada' : 'aberta'} encontrada</h2>
            <p className="text-gray-500 max-w-sm mt-2">
              {searchTerm ? 'Tente ajustar os termos da sua busca.' : activeTab === 'abertas' ? 'Clique no botão acima para abrir nova vaga.' : ''}
            </p>
          </div>
        </div>
      ) : activeTab === 'talentos' && filteredCandidatos.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-full bg-blue-50 mb-4">
              <Users className="h-12 w-12 text-[#1e3a8a] opacity-20" />
            </div>
            <h2 className="text-xl font-black text-[#0a192f]">Nenhum candidato encontrado</h2>
            <p className="text-gray-500 max-w-sm mt-2">
              {searchTerm ? 'Tente ajustar os termos da sua busca.' : 'Clique no botão acima para adicionar novo candidato.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-700 overflow-x-auto min-h-[400px]">
          {activeTab === 'talentos' ? (
            <table className="w-full min-w-max text-left border-collapse">
              <thead className="bg-[#1e3a8a]">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-wider rounded-tl-xl">Nome</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-wider">Entrevistado?</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-wider rounded-tr-xl">Data da entrevista</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCandidatos.map((c: any) => {
                  const hasInterview = c.candidato_historico?.some((h: any) => h.tipo === 'Entrevista');
                  const interviewDates = c.candidato_historico
                    ?.filter((h: any) => h.tipo === 'Entrevista' && h.data_registro)
                    .map((h: any) => new Date(h.data_registro))
                    .sort((a: any, b: any) => b.getTime() - a.getTime());
                  const lastInterviewDate = interviewDates && interviewDates.length > 0 ? interviewDates[0] : null;

                  return (
                    <tr key={c.id} onClick={() => { setSelectedCandidatoId(c.id); setIsCandidatoModalOpen(true); }} className="hover:bg-blue-50/50 cursor-pointer transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm text-[#0a192f]">{c.nome}</p>
                        <p className="text-xs text-gray-500">{c.email || c.telefone || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        {hasInterview ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="w-3 h-3" /> Sim
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border bg-gray-50 text-gray-600 border-gray-200">
                            Não
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                        {lastInterviewDate ? lastInterviewDate.toLocaleDateString('pt-BR') : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-max text-left border-collapse">
              <thead className="bg-[#1e3a8a]">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-wider rounded-tl-xl">Data Abertura</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-wider">Vaga</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-wider">Tipo (Área)</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-wider">Local</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-wider">Quantidade</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-wider">Líder Direto</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-wider text-right rounded-tr-xl">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVagas.filter(v => activeTab === 'fechadas' ? v.status === 'Fechada' : (v.status === 'Aberta' || v.status === 'Congelada')).map(vaga => (
                  <tr key={vaga.id} onClick={() => handleOpenModal(vaga.id)} className="hover:bg-blue-50/50 cursor-pointer transition-colors group">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                      {vaga.data_abertura ? new Date(vaga.data_abertura).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-100">
                          {vaga.vaga_id_text}
                        </span>
                      </div>
                      <p className="font-bold text-sm text-[#0a192f]">{vaga.role?.name || 'Cargo não definido'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      {vaga.area || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      {vaga.location?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[#0a192f]">
                      {vaga.quantidade}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      {vaga.leader?.name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border ${vaga.status === 'Aberta' ? 'bg-green-50 text-green-700 border-green-200' : vaga.status === 'Congelada' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {vaga.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(vaga.id) }} className="p-2 text-[#1e3a8a] hover:bg-[#1e3a8a]/10 rounded-xl transition-all hover:scale-110 active:scale-95"><Edit2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      <VagaFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        vagaId={selectedVagaId}
        onSuccess={fetchVagas}
      />

      <CandidatoFormModal
        isOpen={isCandidatoModalOpen}
        onClose={handleCloseCandidatoModal}
        candidatoId={selectedCandidatoId}
        onSave={fetchVagas}
      />

      <VagasSelectionModal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        onSelect={handleSelection}
      />
    </div >
  )
}