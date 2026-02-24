import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Edit3, Search, Save, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useEscKey } from '../hooks/useEscKey'

interface OptionItem {
  id: string;
  nome: string;
}

interface GerenciadorOpcoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  tabela: 'aeronave_tipos' | 'aeronave_fornecedores' | 'aeronave_docs_fiscais' | 'aeronave_frota';
}

export function GerenciadorOpcoesModal({ isOpen, onClose, titulo, tabela }: GerenciadorOpcoesModalProps) {
  const [items, setItems] = useState<OptionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newValue, setNewValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const fetchItems = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from(tabela)
        .select('*')
        .order('nome', { ascending: true })

      if (error) throw error
      if (data) setItems(data)
    } catch (err) {
      console.error('Erro ao buscar itens:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) fetchItems()
  }, [isOpen, tabela])

  const handleAdd = async () => {
    if (!newValue.trim()) return
    try {
      const { error } = await supabase.from(tabela).insert({ nome: newValue.trim() })
      if (error) throw error
      setNewValue('')
      setIsAdding(false)
      fetchItems()
    } catch (err) {
      alert('Erro ao adicionar item.')
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editValue.trim()) return
    try {
      const { error } = await supabase.from(tabela).update({ nome: editValue.trim() }).eq('id', id)
      if (error) throw error
      setEditingId(null)
      fetchItems()
    } catch (err) {
      alert('Erro ao atualizar item.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return
    try {
      const { error } = await supabase.from(tabela).delete().eq('id', id)
      if (error) throw error
      fetchItems()
    } catch (err) {
      alert('Erro ao excluir item.')
    }
  }

  const filteredItems = items.filter(i => i.nome.toLowerCase().includes(searchTerm.toLowerCase()))

  useEscKey(isOpen, onClose)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">Gerenciar {titulo}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar (Busca + Adicionar) */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {isAdding ? (
            <div className="flex gap-2 animate-in slide-in-from-top-2">
              <input
                autoFocus
                type="text"
                placeholder="Nome do novo item"
                className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <button onClick={handleAdd} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Save className="h-4 w-4" />
              </button>
              <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#1e3a8a] text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#112240] transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" /> Adicionar Novo
            </button>
          )}
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar max-h-[400px]">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
          ) : filteredItems.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-8">Nenhum item encontrado.</p>
          ) : (
            <div className="space-y-1">
              {filteredItems.map(item => (
                <div key={item.id} className="group flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-all">
                  {editingId === item.id ? (
                    <div className="flex-1 flex gap-2 mr-2">
                      <input
                        autoFocus
                        type="text"
                        className="flex-1 px-2 py-1 text-sm border border-blue-200 rounded outline-none"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleUpdate(item.id)}
                      />
                      <button onClick={() => handleUpdate(item.id)} className="text-green-600 hover:text-green-700"><Save className="h-4 w-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-gray-700">{item.nome}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingId(item.id); setEditValue(item.nome); }}
                          className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}