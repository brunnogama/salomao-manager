import { useState, useEffect } from 'react'
import { X, Save, Settings2, Plus, Trash2, Edit2, Percent, Calculator, FileText } from 'lucide-react'
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
    tipo: '', categoria: '', valor: '', nota_fiscal: '', fatura: '', recibo: '',
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
        tipo: '', categoria: '', valor: '', nota_fiscal: '', fatura: '', recibo: '',
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
    <div className="space-y-1.5">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
        <button type="button" onClick={() => setIsManageModalOpen({ open: true, field: name })} className="text-[9px] flex items-center gap-1 text-blue-500 hover:text-blue-700 font-bold transition-colors">
          <Settings2 className="w-3 h-3" /> GERENCIAR
        </button>
      </div>
      <select name={name} value={value} onChange={handleChange} className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer" required>
        <option value="">Selecione...</option>
        {optionsList.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md transition-all">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        {/* Header */}
        <div className="px-10 py-7 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-2xl font-black text-[#112240] tracking-tight">{initialData ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">Gestão Financeira • Família Salomão</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all group">
            <X className="w-6 h-6 text-gray-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-10 overflow-y-auto grid grid-cols-1 md:grid-cols-4 gap-6 text-[#112240]">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Vencimento</label>
            <input type="date" name="vencimento" value={formData.vencimento} onChange={handleChange} className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" required />
          </div>

          <ManagedSelect label="Titular" name="titular" value={formData.titular} optionsList={options.titular} />
          <ManagedSelect label="Fornecedor" name="fornecedor" value={formData.fornecedor} optionsList={options.fornecedor} />
          <ManagedSelect label="Status" name="status" value={formData.status} optionsList={options.status} />

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Descrição do Serviço</label>
            <input name="descricao_servico" value={formData.descricao_servico} onChange={handleChange} className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="Ex: Manutenção Preventiva..." />
          </div>

          <ManagedSelect label="Tipo" name="tipo" value={formData.tipo} optionsList={options.tipo} />
          <ManagedSelect label="Categoria" name="categoria" value={formData.categoria} optionsList={options.categoria} />
          
          <ManagedSelect label="Fator Gerador" name="fator_gerador" value={formData.fator_gerador} optionsList={options.fator_gerador} />

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Valor (R$)</label>
            <div className="relative">
              <input type="number" step="0.01" name="valor" value={formData.valor} onChange={handleChange} className="w-full p-3 bg-blue-50/30 border border-blue-100 rounded-2xl text-sm font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Rateio</label>
            <button 
              type="button" 
              onClick={() => setIsRateioModalOpen(true)}
              className="w-full flex items-center justify-between p-3 bg-white border-2 border-dashed border-gray-200 text-gray-600 rounded-2xl text-sm font-semibold hover:border-blue-400 hover:text-blue-600 transition-all"
            >
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                <span className="truncate">{formData.rateio ? `${formData.rateio} (${formData.rateio_porcentagem}%)` : 'Configurar'}</span>
              </div>
              <Settings2 className="w-4 h-4 opacity-40" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Nota Fiscal</label>
            <input name="nota_fiscal" value={formData.nota_fiscal} onChange={handleChange} className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>

          {/* Novos campos de Texto em vez de Checkbox */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Fatura</label>
            <input name="fatura" value={formData.fatura} onChange={handleChange} className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Recibo</label>
            <input name="recibo" value={formData.recibo} onChange={handleChange} className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Boleto</label>
            <input name="boleto" value={formData.boleto} onChange={handleChange} className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">O.S.</label>
            <input name="os" value={formData.os} onChange={handleChange} className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>

          <div className="md:col-span-4 flex justify-end gap-4 pt-10 mt-4 border-t border-gray-50">
            <button type="button" onClick={onClose} className="px-8 py-3.5 text-xs font-black text-gray-400 hover:text-gray-600 transition-all uppercase tracking-[0.2em]">Cancelar</button>
            <button type="submit" className="flex items-center gap-3 px-12 py-3.5 bg-[#1e3a8a] text-white text-xs font-black rounded-2xl hover:bg-[#112240] shadow-xl shadow-blue-900/10 transition-all active:scale-95 uppercase tracking-[0.2em]">
              <Save className="w-4 h-4" /> {initialData ? 'Atualizar Dados' : 'Confirmar Lançamento'}
            </button>
          </div>
        </form>
      </div>

      {/* Sub-modal de Rateio */}
      {isRateioModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#0a192f]/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 border border-gray-100 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h4 className="font-black text-[#112240] uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                  <Percent className="w-4 h-4 text-blue-600" /> Rateio
                </h4>
              </div>
              <button onClick={() => setIsRateioModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Destino</label>
                <select 
                  value={formData.rateio} 
                  onChange={(e) => setFormData({...formData, rateio: e.target.value})}
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="">Selecione...</option>
                  {options.titular.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Percentagem (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.rateio_porcentagem} 
                    onChange={(e) => setFormData({...formData, rateio_porcentagem: e.target.value})}
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <Percent className="w-4 h-4 text-gray-400 absolute right-4 top-4" />
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setIsRateioModalOpen(false)}
                className="w-full py-4 bg-[#1e3a8a] text-white rounded-2xl text-[10px] font-black hover:bg-[#112240] shadow-lg shadow-blue-900/10 transition-all uppercase tracking-[0.2em]"
              >
                Confirmar Rateio
              </button>
              
              <button 
                type="button" 
                onClick={() => { setFormData({...formData, rateio: '', rateio_porcentagem: 0}); setIsRateioModalOpen(false); }}
                className="w-full py-2 text-red-500 text-[9px] font-bold uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all"
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