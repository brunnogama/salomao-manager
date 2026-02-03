import { useState, useEffect, useRef } from 'react'
import { Search, Settings, Plus, Edit2, Trash2, X, Save } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

interface ManagedDropdownProps {
  label: string
  value: string
  onChange: (value: string) => void
  tableName: string
  columnName: string
  placeholder?: string
  icon?: React.ReactNode
}

export function ManagedDropdown({
  label,
  value,
  onChange,
  tableName,
  columnName,
  placeholder = 'Selecione...',
  icon
}: ManagedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadItems()
  }, [tableName])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const loadItems = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(columnName, { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Erro ao carregar itens:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter(item =>
    item[columnName]?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <label className="block">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">
            {label}
          </span>
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onClick={() => setIsOpen(!isOpen)}
              placeholder={placeholder}
              className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 pr-20 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium cursor-pointer"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsManageModalOpen(true)
                }}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-all group"
                title="Gerenciar itens"
              >
                <Settings className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 group-hover:rotate-90 transition-all" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-all"
              >
                <Search className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>
        </label>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-400">
                  Carregando...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-400">
                  Nenhum item encontrado
                </div>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onChange(item[columnName])
                      setIsOpen(false)
                      setSearchTerm('')
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors flex items-center gap-2"
                  >
                    {icon && <span className="text-gray-400">{icon}</span>}
                    <span className="font-medium text-gray-700">{item[columnName]}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <ManageModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false)
          loadItems()
        }}
        tableName={tableName}
        columnName={columnName}
        label={label}
        items={items}
        onUpdate={loadItems}
      />
    </>
  )
}

interface ManageModalProps {
  isOpen: boolean
  onClose: () => void
  tableName: string
  columnName: string
  label: string
  items: any[]
  onUpdate: () => void
}

function ManageModal({
  isOpen,
  onClose,
  tableName,
  columnName,
  label,
  items,
  onUpdate
}: ManageModalProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [newValue, setNewValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleAdd = async () => {
    if (!newValue.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from(tableName)
        .insert([{ [columnName]: newValue.trim() }])

      if (error) throw error

      setNewValue('')
      setIsAdding(false)
      onUpdate()
    } catch (error) {
      console.error('Erro ao adicionar:', error)
      alert('Erro ao adicionar item')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (id: number) => {
    if (!editingValue.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from(tableName)
        .update({ [columnName]: editingValue.trim() })
        .eq('id', id)

      if (error) throw error

      setEditingId(null)
      setEditingValue('')
      onUpdate()
    } catch (error) {
      console.error('Erro ao editar:', error)
      alert('Erro ao editar item')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, value: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${value}"?`)) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)

      if (error) throw error

      onUpdate()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir item. Pode estar sendo usado em outros registros.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md transition-all">
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col border border-white/20">
        <div className="px-8 py-5 border-b border-gray-50 flex justify-between items-center bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#112240] tracking-tight leading-none">
                Gerenciar {label}
              </h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                Adicionar, Editar e Excluir
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        <div className="px-8 py-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-4">
            {isAdding ? (
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder={`Novo ${label.toLowerCase()}`}
                    className="flex-1 bg-white border border-blue-200 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  />
                  <button
                    onClick={handleAdd}
                    disabled={loading || !newValue.trim()}
                    className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsAdding(false)
                      setNewValue('')
                    }}
                    className="p-2.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2 text-gray-500 hover:text-blue-600 font-bold text-sm"
              >
                <Plus className="w-4 h-4" />
                Adicionar Novo {label}
              </button>
            )}

            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Nenhum item cadastrado
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-all"
                  >
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="flex-1 bg-white border border-blue-200 text-sm rounded-lg p-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleEdit(item.id)}
                        />
                        <button
                          onClick={() => handleEdit(item.id)}
                          disabled={loading || !editingValue.trim()}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null)
                            setEditingValue('')
                          }}
                          className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700 text-sm">
                          {item[columnName]}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingId(item.id)
                              setEditingValue(item[columnName])
                            }}
                            disabled={loading}
                            className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-all disabled:opacity-50"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item[columnName])}
                            disabled={loading}
                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all disabled:opacity-50"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="px-8 py-5 border-t border-gray-50 bg-white flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-2 bg-[#1e3a8a] text-white text-[9px] font-black rounded-xl hover:bg-[#112240] shadow-lg transition-all active:scale-95 uppercase tracking-widest"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}