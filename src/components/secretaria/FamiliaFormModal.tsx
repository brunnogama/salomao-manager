import { useState, useEffect } from 'react'
import { X, Save, Settings2, Plus, Trash2, Edit2, Percent, Calculator, ChevronDown, Check, Upload } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useEscKey } from '../../hooks/useEscKey'

interface FamiliaFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: any
}

export function FamiliaFormModal({ isOpen, onClose, onSave, initialData }: FamiliaFormModalProps) {
  useEscKey(isOpen, onClose)
  const [formData, setFormData] = useState<any>({
    vencimento: '', titular: '', fornecedor: '', descricao_servico: '',
    tipo: '', categoria: '', valor: '', nota_fiscal: '', fatura: '', recibo: '',
    boleto: '', os: '', rateio: '', rateio_porcentagem: 0,
    fator_gerador: '', data_envio: '', status: 'Pendente', comprovante: null
  })

  const [options, setOptions] = useState<{ [key: string]: string[] }>({
    titular: [], fornecedor: [], tipo: [], categoria: [], fator_gerador: [], rateio: [],
    status: ['Pendente', 'Pago', 'Atrasado', 'Cancelado']
  })

  const [isManageModalOpen, setIsManageModalOpen] = useState<{ open: boolean, field: string }>({ open: false, field: '' })
  const [isRateioModalOpen, setIsRateioModalOpen] = useState(false)
  const [newItemValue, setNewItemValue] = useState('')
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<{ original: string, current: string } | null>(null)

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
        fator_gerador: '', data_envio: '', status: 'Pendente', comprovante: null
      })
    }
  }, [initialData, isOpen])

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Limpeza dos dados para evitar erro 400 (Bad Request)
    // No Postgres, campos de data e número não aceitam string vazia ('')
    const cleanedData = {
      ...formData,
      vencimento: formData.vencimento || null,
      data_envio: formData.data_envio || null,
      valor: formData.valor && formData.valor !== '' ? parseFloat(formData.valor) : 0,
      rateio_porcentagem: formData.rateio_porcentagem && formData.rateio_porcentagem !== '' ? parseFloat(formData.rateio_porcentagem) : 0,
      // Se 'comprovante' for um objeto File, enviamos null aqui. 
      // O upload deve ser feito no componente pai via onSave se necessário.
      comprovante: typeof formData.comprovante === 'string' ? formData.comprovante : null
    };

    // Remove campos de sistema que o Supabase não aceita em INSERT/UPDATE
    delete cleanedData.created_at;
    delete cleanedData.criado_em;

    onSave(cleanedData);
  };

  const handleAddItem = () => {
    if (!newItemValue.trim()) return
    const field = isManageModalOpen.field
    setOptions(prev => ({
      ...prev,
      [field]: [...prev[field], newItemValue.trim()].sort()
    }))
    setNewItemValue('')
  }

  const handleDeleteItem = (itemToDelete: string) => {
    const field = isManageModalOpen.field
    setOptions(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== itemToDelete)
    }))
  }

  const handleUpdateItem = () => {
    if (!editingItem || !editingItem.current.trim()) return
    const field = isManageModalOpen.field
    const oldValue = editingItem.original
    const newValue = editingItem.current.trim()

    setOptions(prev => ({
      ...prev,
      [field]: prev[field].map(item => item === oldValue ? newValue : item).sort()
    }))

    if (formData[field] === oldValue) {
      setFormData((prev: any) => ({ ...prev, [field]: newValue }))
    }
    setEditingItem(null)
  }

  const ManagedSelect = ({ label, name, value, optionsList }: any) => {
    const isDropdownOpen = activeDropdown === name
    return (
      <div className="space-y-1 flex flex-col h-full relative" onClick={(e) => e.stopPropagation()}>
        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">{label}</label>
        <div
          onClick={() => setActiveDropdown(isDropdownOpen ? null : name)}
          className={`w-full h-[34px] px-3 flex items-center justify-between bg-gray-100/50 border rounded-xl text-xs transition-all cursor-pointer group ${isDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/10 bg-white' : 'border-gray-200'
            }`}
        >
          <span className={`truncate font-medium ${!value ? 'text-gray-400' : 'text-[#112240]'}`}>
            {value || 'Selecione...'}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsManageModalOpen({ open: true, field: name });
                setActiveDropdown(null);
              }}
              className="p-1 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-all"
            >
              <Settings2 className="w-3 h-3" />
            </button>
            <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {isDropdownOpen && (
          <div className="absolute top-[38px] left-0 w-full bg-white border border-gray-100 shadow-2xl rounded-xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="max-h-[150px] overflow-y-auto py-1 custom-scrollbar">
              {optionsList.map((opt: string) => (
                <div
                  key={opt}
                  onClick={() => {
                    setFormData({ ...formData, [name]: opt });
                    setActiveDropdown(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${value === opt ? 'bg-blue-50 text-blue-700' : 'text-[#112240] hover:bg-gray-50'
                    }`}
                >
                  {opt}
                  {value === opt && <Check className="w-3 h-3" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 bg-[#0a192f]/60 backdrop-blur-md transition-all">
      <div className="bg-white w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white/20">

        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white flex-shrink-0">
          <div>
            <h3 className="text-xl font-black text-[#112240] tracking-tight leading-none">{initialData ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
            <p className="text-[9px] text-gray-400 font-medium uppercase tracking-widest mt-1">Gestão Financeira • Família Salomão</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all group">
            <X className="w-5 h-5 text-gray-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 overflow-hidden flex flex-col gap-4 text-[#112240]">
          <div className="space-y-3">
            <h4 className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-50 pb-1">Identificação e Classificação</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="space-y-1 flex flex-col h-full">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Vencimento</label>
                <input type="date" name="vencimento" value={formData.vencimento} onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })} className="w-full h-[34px] px-3 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-700" required />
              </div>
              <ManagedSelect label="Titular" name="titular" value={formData.titular} optionsList={options.titular} />
              <ManagedSelect label="Fornecedor" name="fornecedor" value={formData.fornecedor} optionsList={options.fornecedor} />
              <ManagedSelect label="Tipo" name="tipo" value={formData.tipo} optionsList={options.tipo} />
              <ManagedSelect label="Categoria" name="categoria" value={formData.categoria} optionsList={options.categoria} />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-50 pb-1">Valores e Status</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="space-y-1 flex flex-col h-full">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Valor (R$)</label>
                <input type="number" step="0.01" name="valor" value={formData.valor} onChange={(e) => setFormData({ ...formData, valor: e.target.value })} className="w-full h-[34px] px-3 bg-blue-50/30 border border-blue-100 rounded-xl text-xs font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-500/20" required />
              </div>
              <ManagedSelect label="Status" name="status" value={formData.status} optionsList={options.status} />
              <ManagedSelect label="Fator Gerador" name="fator_gerador" value={formData.fator_gerador} optionsList={options.fator_gerador} />
              <div className="space-y-1 flex flex-col h-full">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Rateio</label>
                <button type="button" onClick={() => setIsRateioModalOpen(true)} className="w-full h-[34px] flex items-center justify-between px-3 bg-white border border-dashed border-gray-200 text-gray-700 rounded-xl text-[10px] font-semibold hover:border-blue-400 transition-all">
                  <span className="truncate">{formData.rateio ? `${formData.rateio} (${formData.rateio_porcentagem}%)` : 'Configurar'}</span>
                  <Calculator className="w-3 h-3 opacity-40 flex-shrink-0" />
                </button>
              </div>
              <div className="space-y-1 flex flex-col h-full">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Envio</label>
                <input type="date" name="data_envio" value={formData.data_envio} onChange={(e) => setFormData({ ...formData, data_envio: e.target.value })} className="w-full h-[34px] px-3 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none text-gray-700" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-50 pb-1">Documentação e GED</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="space-y-1"><label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">NF</label><input name="nota_fiscal" value={formData.nota_fiscal} onChange={(e) => setFormData({ ...formData, nota_fiscal: e.target.value })} className="w-full h-[34px] px-3 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none text-gray-700" /></div>
              <div className="space-y-1"><label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Fatura</label><input name="fatura" value={formData.fatura} onChange={(e) => setFormData({ ...formData, fatura: e.target.value })} className="w-full h-[34px] px-3 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none text-gray-700" /></div>
              <div className="space-y-1"><label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Recibo</label><input name="recibo" value={formData.recibo} onChange={(e) => setFormData({ ...formData, recibo: e.target.value })} className="w-full h-[34px] px-3 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none text-gray-700" /></div>
              <div className="space-y-1"><label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Boleto</label><input name="boleto" value={formData.boleto} onChange={(e) => setFormData({ ...formData, boleto: e.target.value })} className="w-full h-[34px] px-3 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none text-gray-700" /></div>
              <div className="space-y-1"><label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">O.S.</label><input name="os" value={formData.os} onChange={(e) => setFormData({ ...formData, os: e.target.value })} className="w-full h-[34px] px-3 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none text-gray-700" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Descrição do Serviço</label>
                <input name="descricao_servico" value={formData.descricao_servico} onChange={(e) => setFormData({ ...formData, descricao_servico: e.target.value })} className="w-full h-[34px] px-4 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-gray-700" placeholder="Resumo do serviço..." />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Comprovante (GED)</label>
                <label className="flex items-center gap-2 w-full h-[34px] px-3 border border-dashed border-blue-200 rounded-xl cursor-pointer bg-blue-50/30 hover:bg-blue-50 transition-all">
                  <Upload className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span className="text-[9px] font-bold text-blue-600 truncate">
                    {formData.comprovante ? (typeof formData.comprovante === 'string' ? 'PDF Vinculado' : formData.comprovante.name) : 'Anexar PDF'}
                  </span>
                  <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFormData({ ...formData, comprovante: e.target.files ? e.target.files[0] : null })} />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-50 flex-shrink-0">
            <button type="button" onClick={onClose} className="text-[9px] font-black text-gray-400 hover:text-gray-600 transition-all uppercase tracking-widest">Cancelar</button>
            <button type="submit" className="flex items-center gap-2 px-8 py-2.5 bg-[#1e3a8a] text-white text-[9px] font-black rounded-xl hover:bg-[#112240] shadow-lg transition-all active:scale-95 uppercase tracking-widest">
              <Save className="w-4 h-4" /> {initialData ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>

      {isManageModalOpen.open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[#0a192f]/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-gray-100 animate-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h4 className="font-black text-[#112240] uppercase text-[10px] tracking-widest flex items-center gap-2">
                <Settings2 className="w-3.5 h-3.5 text-blue-600" /> Gerenciar {isManageModalOpen.field}
              </h4>
              <button onClick={() => { setIsManageModalOpen({ open: false, field: '' }); setEditingItem(null); }}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              {editingItem ? (
                <div className="flex gap-2">
                  <input type="text" value={editingItem.current} onChange={(e) => setEditingItem({ ...editingItem, current: e.target.value })} className="flex-1 p-2 bg-blue-50 border border-blue-200 rounded-xl text-xs outline-none font-bold text-blue-700" />
                  <button type="button" onClick={handleUpdateItem} className="p-2 bg-blue-600 text-white rounded-xl"><Save className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" value={newItemValue} onChange={(e) => setNewItemValue(e.target.value)} placeholder="Novo..." className="flex-1 p-2 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none text-gray-700" />
                  <button type="button" onClick={handleAddItem} className="p-2 bg-blue-600 text-white rounded-xl"><Plus className="w-4 h-4" /></button>
                </div>
              )}
              <div className="max-h-[180px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {options[isManageModalOpen.field]?.map((item) => (
                  <div key={item} className="flex justify-between items-center p-2 bg-gray-50 rounded-xl border border-gray-100 group hover:border-blue-200 transition-all">
                    <span className="text-xs font-semibold text-[#112240]">{item}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => setEditingItem({ original: item, current: item })} className="p-1 text-gray-400 hover:text-blue-500"><Edit2 className="w-3 h-3" /></button>
                      <button type="button" onClick={() => handleDeleteItem(item)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => { setIsManageModalOpen({ open: false, field: '' }); setEditingItem(null); }} className="w-full py-3 bg-[#1e3a8a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Concluir</button>
            </div>
          </div>
        </div>
      )}

      {isRateioModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#0a192f]/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl p-6 border border-gray-100 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-black text-[#112240] uppercase text-[10px] tracking-[0.2em] flex items-center gap-2"><Percent className="w-4 h-4 text-blue-600" /> Rateio</h4>
              <button onClick={() => setIsRateioModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Destino</label>
                <div className="relative">
                  <select value={formData.rateio} onChange={(e) => setFormData({ ...formData, rateio: e.target.value })} className="w-full p-2.5 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none appearance-none font-medium text-gray-700">
                    <option value="">Selecione...</option>
                    {options.titular.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-3 top-3 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Percentagem (%)</label>
                <input type="number" value={formData.rateio_porcentagem} onChange={(e) => setFormData({ ...formData, rateio_porcentagem: e.target.value })} className="w-full p-2.5 bg-gray-100/50 border border-gray-200 rounded-xl text-xs font-black outline-none text-gray-700" />
              </div>
              <button type="button" onClick={() => setIsRateioModalOpen(false)} className="w-full py-3 bg-[#1e3a8a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Confirmar Rateio</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}