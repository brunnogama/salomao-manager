import { useState, useEffect, useRef } from 'react'
import { Search, Settings, ChevronDown, X, Plus, Pencil, Trash2, Save, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Missao {
  id: string;
  id_missao: number;
  nome_missao: string;
  data_inicio: string | null;
  data_fim: string | null;
}

interface MissaoSelectProps {
  value: number | null | undefined;
  onSelect: (missao: Missao | null) => void;
  disabled?: boolean;
}

export function MissaoSelect({ value, onSelect, disabled = false }: MissaoSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isManaging, setIsManaging] = useState(false)
  const [missoes, setMissoes] = useState<Missao[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Estados para gerenciamento
  const [newMissao, setNewMissao] = useState({ id_missao: '', nome_missao: '', data_inicio: '', data_fim: '' })
  const [editingMissao, setEditingMissao] = useState<Missao | null>(null)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const managingRef = useRef<HTMLDivElement>(null)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('pt-BR').format(date)
  }

  const formatPeriod = (start: string | null, end: string | null) => {
    if (!start && !end) return '-'
    if (start === end) return formatDate(start)
    return `${formatDate(start)} a ${formatDate(end)}`
  }

  const fetchMissoes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('aeronave_missoes')
      .select('*')
      .order('id_missao', { ascending: false })
    
    if (data) setMissoes(data)
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen || isManaging) fetchMissoes()
  }, [isOpen, isManaging])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isManaging && managingRef.current?.contains(event.target as Node)) return
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (!isManaging) {
          setIsOpen(false)
          setSearchTerm('')
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isManaging])

  const selectedMissao = missoes.find(m => m.id_missao === value)

  const filteredMissoes = missoes.filter(m =>
    m.id_missao.toString().includes(searchTerm) ||
    m.nome_missao.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddMissao = async () => {
    if (!newMissao.id_missao || !newMissao.nome_missao) return
    
    const { error } = await supabase.from('aeronave_missoes').insert({
      id_missao: parseInt(newMissao.id_missao),
      nome_missao: newMissao.nome_missao.trim(),
      data_inicio: newMissao.data_inicio || null,
      data_fim: newMissao.data_fim || null
    })
    
    if (error) {
      alert('Erro ao adicionar: ' + error.message)
      return
    }
    
    setNewMissao({ id_missao: '', nome_missao: '', data_inicio: '', data_fim: '' })
    fetchMissoes()
  }

  const handleUpdateMissao = async () => {
    if (!editingMissao) return
    
    const { error } = await supabase
      .from('aeronave_missoes')
      .update({
        nome_missao: editingMissao.nome_missao,
        data_inicio: editingMissao.data_inicio || null,
        data_fim: editingMissao.data_fim || null
      })
      .eq('id', editingMissao.id)
    
    if (error) {
      alert('Erro ao atualizar: ' + error.message)
      return
    }
    
    setEditingMissao(null)
    fetchMissoes()
  }

  const handleDeleteMissao = async (id: string) => {
    if (!confirm('Excluir esta missão?')) return
    
    const { error } = await supabase.from('aeronave_missoes').delete().eq('id', id)
    
    if (error) {
      alert('Erro ao excluir: ' + error.message)
      return
    }
    
    fetchMissoes()
  }

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* TRIGGER */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full px-3 py-2 bg-[#f9fafb] border border-gray-200 rounded-xl text-xs font-semibold 
          flex items-center justify-between transition-all outline-none
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-blue-300'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/10' : ''}
        `}
      >
        <span className={value ? 'text-gray-700' : 'text-gray-400'}>
          {selectedMissao ? `#${String(selectedMissao.id_missao).padStart(6, '0')} - ${selectedMissao.nome_missao}` : 'Selecione a missão...'}
        </span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSelect(null)
              }}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* DROPDOWN */}
      {isOpen && !isManaging && (
        <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[99999]">
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar ID ou Nome..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium outline-none focus:border-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-4 text-center text-xs text-gray-400">Carregando...</div>
            ) : filteredMissoes.length > 0 ? (
              <div className="p-1.5 space-y-1">
                {filteredMissoes.map((missao) => (
                  <button
                    key={missao.id}
                    onClick={() => {
                      onSelect(missao)
                      setIsOpen(false)
                      setSearchTerm('')
                    }}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg transition-all
                      ${value === missao.id_missao ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-black text-blue-600/70 uppercase tracking-widest">
                            #{String(missao.id_missao).padStart(6, '0')}
                          </span>
                          <span className="text-xs font-bold text-gray-800 truncate">
                            {missao.nome_missao}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-gray-500">
                          <Calendar className="h-2.5 w-2.5" />
                          {formatPeriod(missao.data_inicio, missao.data_fim)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-gray-400 italic">Nenhuma missão encontrada</div>
            )}
          </div>

          <div className="border-t border-gray-200 bg-gray-50 p-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsManaging(true)
                setSearchTerm('')
              }}
              className="w-full px-3 py-2 text-center text-xs font-bold text-[#112240] bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-md flex items-center justify-center gap-2 transition-all uppercase tracking-wide"
            >
              <Settings className="h-3.5 w-3.5" />
              Gerenciar Missões
            </button>
          </div>
        </div>
      )}

      {/* MODAL GERENCIAMENTO */}
      {isManaging && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100000] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsManaging(false)}
        >
          <div
            ref={managingRef}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 flex justify-between items-center border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-base text-gray-800 flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-500" />
                Gerenciar Missões
              </h3>
              <button
                onClick={() => {
                  setIsManaging(false)
                  setEditingMissao(null)
                  setNewMissao({ id_missao: '', nome_missao: '', data_inicio: '', data_fim: '' })
                }}
                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              {/* FORM ADICIONAR */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-4 gap-2">
                  <input
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ID Missão"
                    type="number"
                    value={newMissao.id_missao}
                    onChange={(e) => setNewMissao({ ...newMissao, id_missao: e.target.value })}
                  />
                  <input
                    className="col-span-3 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome da Missão"
                    value={newMissao.nome_missao}
                    onChange={(e) => setNewMissao({ ...newMissao, nome_missao: e.target.value })}
                  />
                  <input
                    className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    type="date"
                    placeholder="Data Início"
                    value={newMissao.data_inicio}
                    onChange={(e) => setNewMissao({ ...newMissao, data_inicio: e.target.value })}
                  />
                  <input
                    className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    type="date"
                    placeholder="Data Fim"
                    value={newMissao.data_fim}
                    onChange={(e) => setNewMissao({ ...newMissao, data_fim: e.target.value })}
                  />
                </div>
                <button
                  onClick={handleAddMissao}
                  className="w-full mt-2 bg-[#112240] text-white py-2 rounded-lg hover:bg-[#1a3a6c] transition-all flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wide"
                  disabled={!newMissao.id_missao || !newMissao.nome_missao}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Missão
                </button>
              </div>

              {/* LISTA */}
              <div className="max-h-96 overflow-y-auto space-y-2 custom-scrollbar">
                {missoes.map((missao) => (
                  <div
                    key={missao.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:border-blue-200 transition-all group"
                  >
                    {editingMissao?.id === missao.id ? (
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-4 gap-2">
                          <input
                            disabled
                            className="border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100 cursor-not-allowed"
                            value={missao.id_missao}
                          />
                          <input
                            className="col-span-3 border border-blue-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                            value={editingMissao.nome_missao}
                            onChange={(e) => setEditingMissao({ ...editingMissao, nome_missao: e.target.value })}
                          />
                          <input
                            className="col-span-2 border border-blue-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                            type="date"
                            value={editingMissao.data_inicio || ''}
                            onChange={(e) => setEditingMissao({ ...editingMissao, data_inicio: e.target.value })}
                          />
                          <input
                            className="col-span-2 border border-blue-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                            type="date"
                            value={editingMissao.data_fim || ''}
                            onChange={(e) => setEditingMissao({ ...editingMissao, data_fim: e.target.value })}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateMissao}
                            className="flex-1 bg-green-100 text-green-700 hover:bg-green-200 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1 text-sm font-bold"
                          >
                            <Save className="h-4 w-4" />
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingMissao(null)}
                            className="flex-1 bg-gray-200 text-gray-600 hover:bg-gray-300 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1 text-sm font-bold"
                          >
                            <X className="h-4 w-4" />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-blue-600/70 uppercase tracking-widest">
                              #{String(missao.id_missao).padStart(6, '0')}
                            </span>
                            <span className="text-sm font-bold text-gray-800">
                              {missao.nome_missao}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {formatPeriod(missao.data_inicio, missao.data_fim)}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingMissao(missao)}
                            className="text-blue-600 hover:bg-blue-100 p-1.5 rounded-md transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMissao(missao.id)}
                            className="text-red-600 hover:bg-red-100 p-1.5 rounded-md transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {missoes.length === 0 && (
                  <div className="text-center py-6 text-sm text-gray-400 italic">
                    Nenhuma missão cadastrada ainda.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}