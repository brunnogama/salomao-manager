import { useState, useEffect } from 'react'
import { Settings2, Plus, Trash2, X, ChevronDown } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

export function AeronaveMenuSelector({ label, value, onChange }: any) {
  const [options, setOptions] = useState<string[]>([])
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [newOption, setNewOption] = useState('')

  const fetchOptions = async () => {
    const { data } = await supabase.from('aeronave_fornecedores').select('nome').order('nome')
    if (data) setOptions(data.map(d => d.nome))
  }

  useEffect(() => { fetchOptions() }, [])

  const handleAdd = async () => {
    if (!newOption) return
    await supabase.from('aeronave_fornecedores').insert([{ nome: newOption }])
    setNewOption('')
    fetchOptions()
  }

  const handleDelete = async (nome: string) => {
    await supabase.from('aeronave_fornecedores').delete().eq('nome', nome)
    fetchOptions()
  }

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-1 px-1">
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
        <button onClick={() => setIsManageOpen(true)} className="text-blue-500 hover:text-blue-700 transition-colors">
          <Settings2 className="w-3 h-3" />
        </button>
      </div>
      
      <div className="relative">
        <select 
          className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium appearance-none cursor-pointer"
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">Selecione o fornecedor...</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Mini Modal de Gerenciamento */}
      {isManageOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a192f]/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#112240]">Gerenciar Fornecedores</h4>
              <button onClick={() => setIsManageOpen(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-2">
                <input 
                  className="flex-1 bg-gray-50 border border-gray-200 text-xs rounded-lg p-2 outline-none"
                  placeholder="Novo fornecedor..."
                  value={newOption}
                  onChange={e => setNewOption(e.target.value)}
                />
                <button onClick={handleAdd} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                {options.map(opt => (
                  <div key={opt} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg group">
                    <span className="text-xs font-semibold text-gray-600">{opt}</span>
                    <button onClick={() => handleDelete(opt)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}