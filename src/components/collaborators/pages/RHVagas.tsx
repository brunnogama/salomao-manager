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
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { VagaFormModal } from '../components/VagaFormModal'
import { CandidatoFormModal } from '../components/CandidatoFormModal'
import { VagasSelectionModal, VagasCreationType } from '../components/VagasSelectionModal'

export function RHVagas() {
  const [searchTerm, setSearchTerm] = useState('')
  const [vagas, setVagas] = useState<Vaga[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false)
  const [isCandidatoModalOpen, setIsCandidatoModalOpen] = useState(false)
  const [selectedVagaId, setSelectedVagaId] = useState<string | null>(null)
  const [selectedCandidatoId, setSelectedCandidatoId] = useState<string | null>(null)

  useEffect(() => {
    fetchVagas()
  }, [])

  const fetchVagas = async () => {
    try {
      setLoading(true)
      const { data, error: dbError } = await supabase
        .from('vagas')
        .select(`
          *,
          role:role_id (id, name),
          location:location_id (id, name),
          partner:partner_id (id, name)
        `)
        .order('created_at', { ascending: false })

      if (dbError) throw dbError
      setVagas(data || [])
    } catch (err: any) {
      console.error('Error fetching vagas:', err)
      setError('Não foi possível carregar as vagas.')
    } finally {
      setLoading(false)
    }
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
    return (
      v.vaga_id_text?.toLowerCase().includes(term) ||
      v.role?.name?.toLowerCase().includes(term) ||
      v.area?.toLowerCase().includes(term)
    )
  })

  // Stats
  const vagasAbertas = vagas.filter(v => v.status === 'Aberta').length
  const totalCandidatos = 0 // Will be updated when Candidate features are added

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6 pb-24">

      {/* PAGE HEADER - Padrão Salomão Design System */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <Briefcase className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Recrutamento & Seleção
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Gestão de vagas abertas, candidatos e processos seletivos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0 justify-end">
          <button
            onClick={handleOpenSelectionModal}
            className="p-3 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
            title="Adicionar Novo"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full">

        {/* TOOLBAR & STATS */}
        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <div className="flex flex-row gap-4 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 custom-scrollbar">
            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max">
              <div className="p-2 rounded-lg bg-blue-50 text-[#1e3a8a]">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[8px] text-gray-400 uppercase font-black tracking-[0.1em]">Vagas Abertas</p>
                <p className="text-sm font-bold text-[#0a192f]">{vagasAbertas}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max">
              <div className="p-2 rounded-lg bg-blue-50 text-[#1e3a8a]">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[8px] text-gray-400 uppercase font-black tracking-[0.1em]">Total Candidatos</p>
                <p className="text-sm font-bold text-[#0a192f]">{totalCandidatos}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full xl:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar vagas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium text-xs"
              />
            </div>
            {/* Nova Vaga button moved to header */}
          </div>
        </div>

        {/* LISTA DE VAGAS */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center border border-red-100">
            <AlertCircle className="h-8 w-8 text-red-500 mb-3" />
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        ) : filteredVagas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="p-4 rounded-full bg-blue-50 mb-4">
                <CheckCircle2 className="h-12 w-12 text-[#1e3a8a] opacity-20" />
              </div>
              <h2 className="text-xl font-black text-[#0a192f]">Nenhum processo seletivo {searchTerm ? 'encontrado' : 'ativo'}</h2>
              <p className="text-gray-500 max-w-sm mt-2">
                {searchTerm ? 'Tente ajustar os termos da sua busca.' : 'Clique em "Nova Vaga" para iniciar um recrutamento.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-6 gap-4">
            {filteredVagas.map(vaga => (
              <div key={vaga.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:border-blue-200 transition-colors group relative overflow-hidden">
                {/* Status Indicator */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${vaga.status === 'Aberta' ? 'bg-green-500' :
                  vaga.status === 'Congelada' ? 'bg-amber-500' : 'bg-gray-400'
                  }`} />

                <div className="ml-2 flex flex-col h-full relative">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {vaga.vaga_id_text}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${vaga.status === 'Aberta' ? 'bg-green-50 text-green-700 border-green-200' :
                          vaga.status === 'Congelada' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>
                          {vaga.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#0a192f] leading-tight">
                        {vaga.role?.name || 'Cargo não definido'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">{vaga.area || 'Área não definida'}</p>
                    </div>

                    <button
                      onClick={() => handleOpenModal(vaga.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 mb-4 mt-auto">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Local</p>
                      <p className="text-xs font-semibold text-gray-700">{vaga.location?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Qtd</p>
                      <p className="text-xs font-semibold text-gray-700">{vaga.quantidade} vaga{vaga.quantidade > 1 ? 's' : ''}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Recrutadora</p>
                      <p className="text-xs font-semibold text-gray-700">{vaga.recrutadora || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold">
                        {vaga.data_abertura ? new Date(vaga.data_abertura).toLocaleDateString('pt-BR') : '-'}
                        {vaga.data_fechamento ? ` até ${new Date(vaga.data_fechamento).toLocaleDateString('pt-BR')}` : ''}
                      </span>
                    </div>

                    <div className="flex -space-x-2">
                      {/* Placeholder for candidates avatars */}
                      <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-500">+0</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

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
    </div>
  )
}