import { useState, useEffect } from 'react'
import { X, Save, Settings2, Plus, Trash2, Edit2, Percent, Calculator, FileText, ChevronDown, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface FamiliaFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: any
}

export function FamiliaFormModal({ isOpen, onClose, onSave, initialData }: FamiliaFormModalProps) {
  // Estado inicial do formulário
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
  const [newItemValue, setNewItemValue] = useState('')
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  
  // Novos estados para edição de itens no gerenciamento
  const [editingItem, setEditingItem] = useState<{ original: string, current: string } | null>(null)

  // Busca dados para os menus suspensos
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

  // Fecha dropdown ao clicar fora do componente
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  // Guarda de renderização: Se não estiver aberto, não renderiza nada
  if (!isOpen) return null

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

  // Função para salvar edição de um item existente
  const handleUpdateItem = () => {
    if (!editingItem || !editingItem.current.trim()) return
    const field = isManageModalOpen.field
    setOptions(prev => ({
      ...prev,
      [field]: prev[field].map(item => 
        item === editingItem.original ? editingItem.current.trim() : item
      ).sort()
    }))
    setEditingItem(null)
  }

  const ManagedSelect = ({ label, name, value, optionsList }: any) => {
    const isDropdownOpen = activeDropdown === name

    return (
      <div className="space-y-1.5 flex flex-col h-full relative" onClick={(e) => e.stopPropagation()}>
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">{label}</label>
        
        <div 
          onClick={() => setActiveDropdown(isDropdownOpen ? null : name)}
          className={`w-full h-[46px] px-4 flex items-center justify-between bg-gray-50/50 border rounded-2xl text-sm transition-all cursor-pointer group ${
            isDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/10 bg-white' : 'border-gray-200'
          }`}
        >
          <span className={`truncate font-medium ${!value ? 'text-gray-400' : 'text-[#112240]'}`}>
            {value || 'Selecione...'}
          </span>
          <div className="flex items-center gap-2">
             <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                setIsManageModalOpen({ open: true, field: name });
                setActiveDropdown(null);
              }} 
              className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-all"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {isDropdownOpen && (
          <div className="absolute top-[72px] left-0 w-full bg-white border border-gray-100 shadow-2xl rounded-[1.5rem] z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-[240px] overflow-y-auto py-2 custom-scrollbar">
              <div 
                onClick={() => { setFormData({...formData, [name]: ''}); setActiveDropdown(null); }}
                className="px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Selecione...
              </div>
              {optionsList.map((opt: string) => (
                <div 
                  key={opt}
                  onClick={() => {
                    setFormData({...formData, [name]: opt});
                    setActiveDropdown(null);
                  }}
                  className={`px-4 py-2.5 text-sm font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    value === opt ? 'bg-blue-50 text-blue-700' : 'text-[#112240] hover:bg-gray-50'
                  }`}
                >
                  {opt}
                  {value === opt && <Check className="w-3.5 h-3.5" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md transition-all">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white/20">
        
        <div className="px-10 py-7 border-b border-gray-100 flex justify-between items-center bg-white flex-shrink-0">
          <div>
            <h3 className="text-2xl font-black text-[#112240] tracking-tight">{initialData ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">Gestão Financeira • Família Salomão</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all group">
            <X className="w-6 h-6 text-gray-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-10 overflow-y-auto flex flex-col gap-8 text-[#112240] custom-scrollbar">
          
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-50 pb-2">Identificação Básica</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1.5 flex flex-col h-full">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Vencimento</label>
                <input type="date" name="vencimento" value={formData.vencimento} onChange={(e) => setFormData({...formData, vencimento: e.target.value})} className="w-full h-[46px] px-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" required />
              </div>
              <ManagedSelect label="Titular" name="titular" value={formData.titular} optionsList={options.titular} />
              <ManagedSelect label="Fornecedor" name="fornecedor" value={formData.fornecedor} optionsList={options.fornecedor} />
              <ManagedSelect label="Status" name="status" value={formData.status} optionsList={options.status} />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-50 pb-2">Financeiro e Classificação</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1.5 flex flex-col h-full">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Valor (R$)</label>
                <input type="number" step="0.01" name="valor" value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value})} className="w-full h-[46px] px-4 bg-blue-50/30 border border-blue-100 rounded-2xl text-sm font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-500/20" required />
              </div>
              <ManagedSelect label="Tipo" name="tipo" value={formData.tipo} optionsList={options.tipo} />
              <ManagedSelect label="Categoria" name="categoria" value={formData.categoria} optionsList={options.categoria} />
              <ManagedSelect label="Fator Gerador" name="fator_gerador" value={formData.fator_gerador} optionsList={options.fator_gerador} />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-50 pb-2">Documentação e Extras</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1.5 flex flex-col h-full"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Nota Fiscal</label><input name="nota_fiscal" value={formData.nota_fiscal} onChange={(e) => setFormData({...formData, nota_fiscal: e.target.value})} className="w-full h-[46px] px-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm outline-none" /></div>
              <div className="space-y-1.5 flex flex-col h-full"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Fatura</label><input name="fatura" value={formData.fatura} onChange={(e) => setFormData({...formData, fatura: e.target.value})} className="w-full h-[46px] px-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm outline-none" /></div>
              <div className="space-y-1.5 flex flex-col h-full"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Comprovante (GED)</label><input name="comprovante" value={formData.comprovante} onChange={(e) => setFormData({...formData, comprovante: e.target.value})} className="w-full h-[46px] px-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm outline-none" /></div>
              <div className="space-y-1.5 flex flex-col h-full">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Rateio</label>
                <button type="button" onClick={() => setIsRateioModalOpen(true)} className="w-full h-[46px] flex items-center justify-between px-4 bg-white border-2 border-dashed border-gray-200 text-gray-600 rounded-2xl text-sm font-semibold hover:border-blue-400 hover:text-blue-600 transition-all">
                  <span className="truncate">{formData.rateio ? `${formData.rateio} (${formData.rateio_porcentagem}%)` : 'Configurar'}</span>
                  <Calculator className="w-4 h-4 opacity-40 flex-shrink-0" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1.5 flex flex-col h-full"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Recibo</label><input name="recibo" value={formData.recibo} onChange={(e) => setFormData({...formData, recibo: e.target.value})} className="w-full h-[46px] px-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm outline-none" /></div>
              <div className="space-y-1.5 flex flex-col h-full"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Boleto</label><input name="boleto" value={formData.boleto} onChange={(e) => setFormData({...formData, boleto: e.target.value})} className="w-full h-[46px] px-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm outline-none" /></div>
              <div className="space-y-1.5 flex flex-col h-full"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">O.S.</label><input name="os" value={formData.os} onChange={(e) => setFormData({...formData, os: e.target.value})} className="w-full h-[46px] px-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm outline-none" /></div>
          </div>

          <div className="space-y-1.5 pt-4">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Descrição do Serviço</label>
            <textarea name="descricao_servico" value={formData.descricao_servico} onChange={(e) => setFormData({...formData, descricao_servico: e.target.value})} rows={3} className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-[2rem] text-sm outline-none focus:ring-2 focus:ring-blue-500/20 resize-none font-medium" placeholder="Detalhes do serviço..." />
          </div>

          <div className="flex justify-end items-center gap-8 pt-6 mt-4 border-t border-gray-50 flex-shrink-0">
            <button type="button" onClick={onClose} className="text-xs font-black text-gray-400 hover:text-gray-600 transition-all uppercase tracking-[0.2em]">Cancelar</button>
            <button type="submit" className="flex items-center gap-3 px-12 py-4 bg-[#1e3a8a] text-white text-xs font-black rounded-2xl hover:bg-[#112240] shadow-xl transition-all active:scale-95 uppercase tracking-[0.2em]">
              <Save className="w-4 h-4" /> {initialData ? 'Salvar Alterações' : 'Confirmar Lançamento'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Gerenciamento de Opções */}
      {isManageModalOpen.open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[#0a192f]/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h4 className="font-black text-[#112240] uppercase text-xs tracking-widest flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-blue-600" /> Gerenciar {isManageModalOpen.field}
              </h4>
              <button onClick={() => { setIsManageModalOpen({ open: false, field: '' }); setEditingItem(null); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-8 space-y-6">
              {editingItem ? (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={editingItem.current}
                    onChange={(e) => setEditingItem({...editingItem, current: e.target.value})}
                    className="flex-1 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-blue-700"
                  />
                  <button type="button" onClick={handleUpdateItem} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                    <Save className="w-5 h-5" />
                  </button>
                  <button type="button" onClick={() => setEditingItem(null)} className="p-3 bg-gray-100 text-gray-400 rounded-xl hover:bg-gray-200 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newItemValue}
                    onChange={(e) => setNewItemValue(e.target.value)}
                    placeholder="Novo item..."
                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                  />
                  <button type="button" onClick={handleAddItem} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"><Plus className="w-5 h-5" /></button>
                </div>
              )}

              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {options[isManageModalOpen.field]?.map((item) => (
                  <div key={item} className="flex justify-between items-center p-3 bg-gray-50/50 rounded-xl border border-gray-100 group hover:border-blue-200 transition-all">
                    <span className="text-sm font-semibold text-[#112240]">{item}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        type="button" 
                        onClick={() => setEditingItem({ original: item, current: item })}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteItem(item)} 
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => { setIsManageModalOpen({ open: false, field: '' }); setEditingItem(null); }} className="w-full py-4 bg-[#1e3a8a] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#112240] transition-all">Concluir</button>
            </div>
          </div>
        </div>
      )}

      {isRateioModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#0a192f]/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 border border-gray-100 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <h4 className="font-black text-[#112240] uppercase text-[10px] tracking-[0.2em] flex items-center gap-2"><Percent className="w-4 h-4 text-blue-600" /> Rateio</h4>
              <button onClick={() => setIsRateioModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Destino</label>
                <div className="relative">
                  <select value={formData.rateio} onChange={(e) => setFormData({...formData, rateio: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none appearance-none font-medium">
                    <option value="">Selecione...</option>
                    {options.titular.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-4 top-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Percentagem (%)</label>
                <div className="relative">
                  <input type="number" value={formData.rateio_porcentagem} onChange={(e) => setFormData({...formData, rateio_porcentagem: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  <Percent className="w-4 h-4 text-gray-400 absolute right-4 top-4" />
                </div>
              </div>
              <button type="button" onClick={() => setIsRateioModalOpen(false)} className="w-full py-4 bg-[#1e3a8a] text-white rounded-2xl text-[10px] font-black hover:bg-[#112240] transition-all uppercase tracking-[0.2em]">Confirmar Rateio</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}