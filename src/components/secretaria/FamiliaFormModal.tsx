import { useState, useEffect } from 'react'
import { X, Save, Settings2, Plus, Trash2, Edit2, Percent, Calculator } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface FamiliaFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: any
}

export function FamiliaFormModal({ isOpen, onClose, onSave, initialData }: FamiliaFormModalProps) {
  const [formData, setFormData] = useState<any>({
    vencimento: '', titular: '', fornecedor: '', descricao_servico: '',
    tipo: '', categoria: '', valor: '', nota_fiscal: '', recibo: '',
    boleto: '', os: '', rateio: '', rateio_porcentagem: 0,
    fator_gerador: '', data_envio: '', status: 'Pendente', comprovante: ''
  })

  const [options, setOptions] = useState<{ [key: string]: string[] }>({
    titular: [], fornecedor: [], tipo: [], categoria: [], fator_gerador: [], rateio: [],
    status: ['Pendente', 'Pago', 'Atrasado', 'Cancelado']
  })

  const [isManageModalOpen, setIsManageModalOpen] = useState<{ open: boolean, field: string }>({ open: false, field: '' })
  const [isRateioModalOpen, setIsRateioModalOpen] = useState(false)

  const fetchUniqueOptions = async () => {
    const fields = ['titular', 'fornecedor', 'tipo', 'categoria', 'fator_gerador', 'rateio']
    const newOptions: any = { ...options }
    try {
      for (const field of fields) {
        const { data } = await supabase.from('familia_salomao_dados').select(field)
        if (data) {
          const uniqueValues = Array.from(new Set(data.map(item => item[field]).filter(Boolean))) as string[]
          newOptions[field] = uniqueValues.sort()
        }
      }
      setOptions(newOptions)
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    if (isOpen) fetchUniqueOptions()
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        vencimento: '', titular: '', fornecedor: '', descricao_servico: '',
        tipo: '', categoria: '', valor: '', nota_fiscal: '', recibo: '',
        boleto: '', os: '', rateio: '', rateio_porcentagem: 0,
        fator_gerador: '', data_envio: '', status: 'Pendente', comprovante: ''
      })
    }
  }, [initialData, isOpen])

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const ManagedSelect = ({ label, name, value, optionsList }: any) => (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
        <button type="button" onClick={() => setIsManageModalOpen({ open: true, field: name })} className="text-[10px] flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold">
          <Settings2 className="w-3 h-3" /> GERENCIAR
        </button>
      </div>
      <select name={name} value={value} onChange={handleChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" required>
        <option value="">Selecione...</option>
        {optionsList.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-[#112240]">{initialData ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400" /></button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-[#112240]">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vencimento</label>
            <input type="date" name="vencimento" value={formData.vencimento} onChange={handleChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>

          <ManagedSelect label="Titular" name="titular" value={formData.titular} optionsList={options.titular} />
          <ManagedSelect label="Fornecedor" name="fornecedor" value={formData.fornecedor} optionsList={options.fornecedor} />

          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Descrição do Serviço</label>
            <input name="descricao_servico" value={formData.descricao_servico} onChange={handleChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Manutenção..." />
          </div>

          <ManagedSelect label="Tipo" name="tipo" value={formData.tipo} optionsList={options.tipo} />
          <ManagedSelect label="Categoria" name="categoria" value={formData.categoria} optionsList={options.categoria} />
          <ManagedSelect label="Fator Gerador" name="fator_gerador" value={formData.fator_gerador} optionsList={options.fator_gerador} />

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Valor (R$)</label>
            <input type="number" step="0.01" name="valor" value={formData.valor} onChange={handleChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>

          {/* Campo de Rateio com UI de Modal */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rateio</label>
            <button 
              type="button" 
              onClick={() => setIsRateioModalOpen(true)}
              className="w-full flex items-center justify-between p-2.5 bg-blue-50 border border-blue-100 text-[#1e3a8a] rounded-xl text-sm font-semibold hover:bg-blue-100 transition-all"
            >
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                <span>{formData.rateio ? `${formData.rateio} (${formData.rateio_porcentagem}%)` : 'Configurar Rateio'}</span>
              </div>
              <Settings2 className="w-4 h-4 opacity-50" />
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nota Fiscal</label>
            <input name="nota_fiscal" value={formData.nota_fiscal} onChange={handleChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <ManagedSelect label="Status" name="status" value={formData.status} optionsList={options.status} />

          {/* Checkboxes */}
          <div className="md:col-span-3 grid grid-cols-3 gap-4 pt-4 border-t border-gray-50">
            {['recibo', 'boleto', 'os'].map((field) => (
              <label key={field} className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={!!formData[field]} onChange={(e) => setFormData({...formData, [field]: e.target.checked})} className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs font-bold text-gray-500 uppercase group-hover:text-blue-600 transition-colors">{field === 'os' ? 'O.S.' : field}</span>
              </label>
            ))}
          </div>

          <div className="md:col-span-3 flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all uppercase tracking-widest">Cancelar</button>
            <button type="submit" className="flex items-center gap-2 px-8 py-2.5 bg-[#1e3a8a] text-white text-sm font-bold rounded-xl hover:bg-[#112240] shadow-lg transition-all active:scale-95 uppercase tracking-widest">
              <Save className="w-4 h-4" /> {initialData ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>

      {/* Sub-modal de Rateio */}
      {isRateioModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-gray-100 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-[#112240] uppercase text-xs tracking-widest flex items-center gap-2">
                <Percent className="w-4 h-4 text-blue-600" /> Configurar Rateio
              </h4>
              <button onClick={() => setIsRateioModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Destino do Rateio</label>
                <select 
                  value={formData.rateio} 
                  onChange={(e) => setFormData({...formData, rateio: e.target.value})}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione...</option>
                  {options.titular.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Percentagem (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.rateio_porcentagem} 
                    onChange={(e) => setFormData({...formData, rateio_porcentagem: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Percent className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setIsRateioModalOpen(false)}
                className="w-full py-3 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold hover:bg-[#112240] shadow-md transition-all"
              >
                CONFIRMAR RATEIO
              </button>
              
              <button 
                type="button" 
                onClick={() => { setFormData({...formData, rateio: '', rateio_porcentagem: 0}); setIsRateioModalOpen(false); }}
                className="w-full py-2 text-red-500 text-[10px] font-bold uppercase hover:bg-red-50 rounded-lg transition-all"
              >
                Limpar Configuração
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}