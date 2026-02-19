import { useState, useEffect } from 'react'
import {
  Megaphone,
  Search,
  Plus,
  Trash2,
  Pencil,
  MapPin,
  Users,
  Calendar
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { RHAcoesFormModal, RHAction } from '../../collaborators/modals/RHAcoesFormModal'

export function RHAcoes() {
  const [searchTerm, setSearchTerm] = useState('')
  const [actions, setActions] = useState<RHAction[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<RHAction | null>(null)

  useEffect(() => {
    fetchActions()
  }, [])

  const fetchActions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('rh_actions')
      .select('*')
      .order('event_date', { ascending: false })

    if (error) {
      console.error('Error fetching actions:', error)
    } else {
      setActions(data || [])
    }
    setLoading(false)
  }

  const handleSave = async (action: RHAction) => {
    try {
      if (action.id) {
        const { error } = await supabase
          .from('rh_actions')
          .update(action)
          .eq('id', action.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('rh_actions')
          .insert(action)
        if (error) throw error
      }
      fetchActions()
    } catch (error) {
      console.error('Error saving action:', error)
      alert('Erro ao salvar ação')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ação?')) return

    try {
      const { error } = await supabase
        .from('rh_actions')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchActions()
    } catch (error) {
      console.error('Error deleting action:', error)
      alert('Erro ao excluir ação')
    }
  }

  const handleEdit = (action: RHAction) => {
    setSelectedAction(action)
    setIsModalOpen(true)
  }

  const filteredActions = actions.filter(action =>
    action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    action.result?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">

      {/* PAGE HEADER */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <Megaphone className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Ações do RH
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Ações promovidas pelo Recursos Humanos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => { setSelectedAction(null); setIsModalOpen(true) }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Nova Ação
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6 w-full">

        {/* TOOLBAR */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ação ou resultado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium text-sm"
            />
          </div>
        </div>

        {/* ACTIONS LIST */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="text-center py-10 text-gray-500 animate-pulse">Carregando ações...</div>
          ) : filteredActions.length > 0 ? (
            filteredActions.map((action) => (
              <div
                key={action.id}
                onClick={() => handleEdit(action)}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-[100px] -z-0 opacity-50 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md ${action.medium === 'Online' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                        {action.medium}
                      </span>
                      <h3 className="text-lg font-black text-[#0a192f]">{action.title}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(action.event_date)}
                      </div>
                      {action.participants && (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {action.participants}
                        </div>
                      )}
                      {action.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {action.location}
                        </div>
                      )}
                    </div>

                    {action.result && (
                      <p className="text-sm text-gray-600 border-l-2 border-gray-200 pl-3 italic max-w-3xl">
                        "{action.result}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(action); }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(action.id!); }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-blue-50 mb-4">
                  <Megaphone className="h-12 w-12 text-[#1e3a8a] opacity-20" />
                </div>
                <h2 className="text-xl font-black text-[#0a192f]">Nenhuma ação registrada</h2>
                <p className="text-gray-500 max-w-sm mt-2">
                  Comece registrando novas ações e eventos do RH.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      <RHAcoesFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={selectedAction}
      />
    </div>
  )
}