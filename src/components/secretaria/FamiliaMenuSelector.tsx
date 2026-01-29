import { useState, useEffect } from 'react'
import { Settings2, Plus, Trash2, X, Check, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Option {
  id: string;
  label: string;
}

interface FamiliaMenuSelectorProps {
  label: string;
  tipoMenu: 'titular' | 'fornecedor' | 'tipo' | 'categoria' | 'status' | 'rateio' | 'fator_gerador';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function FamiliaMenuSelector({ label, tipoMenu, value, onChange, placeholder }: FamiliaMenuSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(false)
  const [newOption, setNewOption] = useState('')
  const [isManaging, setIsManaging] = useState(false)

  const fetchOptions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('familia_config_opcoes')
      .select('id, label')
      .eq('tipo_menu', tipoMenu)
      .order('label', { ascending: true })

    if (!error && data) setOptions(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchOptions()
  }, [tipoMenu])

  const handleAddOption = async () => {
    if (!newOption.trim()) return
    const { error } = await supabase
      .from('familia_config_opcoes')
      .insert([{ tipo_menu: tipoMenu, label: newOption.trim() }])

    if (!error) {
      setNewOption('')
      fetchOptions()
    }
  }

  const handleDeleteOption = async (id: string) => {
    const { error } = await supabase
      .from('familia_config_opcoes')
      .delete()
      .eq('id', id)

    if (!error) fetchOptions()
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</label>
      
      <div className="relative flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all"
        >
          <option value="">{placeholder || 'Selecione...'}</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.label}>{opt.label}</option>
          ))}
        </select>

        <button
          onClick={() => setIsManaging(true)}
          type="button"
          className="p-2.5 bg-white border border-gray-200 text-gray-500 hover:text-[#1e3a8a] hover:border-[#1e3a8a] rounded-lg transition-colors shadow-sm"
          title={`Gerenciar ${label}`}
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </div>

      {/* Modal de Gerenciamento */}
      {isManaging && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-[#112240]">Gerenciar {label}</h3>
              <button onClick={() => setIsManaging(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              {/* Input para Adicionar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder={`Novo ${label.toLowerCase()}...`}
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  onClick={handleAddOption}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Lista de Itens */}
              <div className="max-h-60 overflow-y-auto custom-scrollbar border border-gray-100 rounded-lg">
                {loading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                ) : options.length === 0 ? (
                  <p className="text-center p-8 text-gray-400 text-sm">Nenhum item cadastrado.</p>
                ) : (
                  options.map((opt) => (
                    <div key={opt.id} className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-700">{opt.label}</span>
                      <button
                        onClick={() => handleDeleteOption(opt.id)}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setIsManaging(false)}
                className="bg-[#112240] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#112240]/90 transition-all"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}