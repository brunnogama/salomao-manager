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
      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">{label}</label>
      
      <div className="relative flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-2.5 outline-none transition-all font-medium"
        >
          <option value="">{placeholder || 'Selecione...'}</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.label}>{opt.label}</option>
          ))}
        </select>

        <button
          onClick={() => setIsManaging(true)}
          type="button"
          className="p-2.5 bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-600 rounded-xl transition-all shadow-sm"
          title={`Gerenciar ${label}`}
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </div>

      {/* Modal de Gerenciamento */}
      {isManaging && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-black text-[#112240] tracking-tight">Gerenciar {label}</h3>
              <button onClick={() => setIsManaging(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all group">
                <X className="w-5 h-5 text-gray-400 group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Input para Adicionar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder={`Novo ${label.toLowerCase()}...`}
                  className="flex-1 bg-gray-100/50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-medium text-gray-700"
                />
                <button
                  onClick={handleAddOption}
                  className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors shadow-md active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Lista de Itens */}
              <div className="max-h-60 overflow-y-auto custom-scrollbar border border-gray-100 rounded-xl">
                {loading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                ) : options.length === 0 ? (
                  <p className="text-center p-8 text-gray-400 text-sm">Nenhum item cadastrado.</p>
                ) : (
                  options.map((opt) => (
                    <div key={opt.id} className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                      <span className="text-sm font-semibold text-gray-700">{opt.label}</span>
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

            <div className="p-4 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setIsManaging(false)}
                className="bg-[#1e3a8a] text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#112240] shadow-lg transition-all active:scale-95"
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