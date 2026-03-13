import { useState, useEffect } from 'react'
import { X, Save, Settings2, Plus, Trash2, Edit2, ChevronDown, Check } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useEscKey } from '../../../hooks/useEscKey'

interface DemandasFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: any
}

export function DemandasFormModal({ isOpen, onClose, onSave, initialData }: DemandasFormModalProps) {
  useEscKey(isOpen, onClose)
  
  const [formData, setFormData] = useState<any>({
    data_solicitacao: new Date().toISOString().split('T')[0], 
    solicitante: '', 
    unidade: '', 
    fornecedor: '', 
    equipamento: '',
    tipo: '', 
    categoria: '', 
    demanda: '', 
    prioridade: 'Média', 
    responsavel: '', 
    quem_acompanha: '', 
    status: 'Pendente', 
    proxima_acao: '', 
    prazo: '', 
    observacoes: ''
  })

  const [options, setOptions] = useState<{ [key: string]: string[] }>({
    solicitante: ['João', 'Luis Felipe', 'Luis Felipe e João', 'Rafaela', 'Rafaela e Vanessa', 'Rodrigo', 'Rodrigo e Luis Felipe', 'Vanessa', 'Todos'],
    unidade: ['Academia', 'Casa 1', 'Casa 2', 'Escritório', 'Geral'],
    prioridade: ['Alta', 'Média', 'Baixa'],
    status: ['Pendente', 'Em andamento', 'Concluído']
  })

  // To store the default initial values to not lose them if db is empty
  const [defaultOptions] = useState<{ [key: string]: string[] }>({
    solicitante: ['João', 'Luis Felipe', 'Luis Felipe e João', 'Rafaela', 'Rafaela e Vanessa', 'Rodrigo', 'Rodrigo e Luis Felipe', 'Vanessa', 'Todos'],
    unidade: ['Academia', 'Casa 1', 'Casa 2', 'Escritório', 'Geral'],
    prioridade: ['Alta', 'Média', 'Baixa'],
    status: ['Pendente', 'Em andamento', 'Concluído']
  })

  const [isManageModalOpen, setIsManageModalOpen] = useState<{ open: boolean, field: string }>({ open: false, field: '' })
  const [newItemValue, setNewItemValue] = useState('')
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<{ original: string, current: string } | null>(null)

  const fetchUniqueOptions = async () => {
    const fields = ['solicitante', 'unidade', 'prioridade', 'status']
    const newOptions: any = { ...options }
    try {
      for (const field of fields) {
        const { data } = await supabase.from('familia_salomao_demandas').select(field)
        if (data) {
          const uniqueValues = Array.from(new Set(data.map(item => item[field]).filter(Boolean))) as string[]
          
          // Merge with default options to always have them available
          const defaultFieldOptions = defaultOptions[field] || [];
          const mergedSet = new Set([...defaultFieldOptions, ...uniqueValues])
          newOptions[field] = Array.from(mergedSet).sort()
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
        data_solicitacao: new Date().toISOString().split('T')[0], 
        solicitante: '', 
        unidade: '', 
        fornecedor: '', 
        equipamento: '',
        tipo: '', 
        categoria: '', 
        demanda: '', 
        prioridade: 'Média', 
        responsavel: '', 
        quem_acompanha: '', 
        status: 'Pendente', 
        proxima_acao: '', 
        prazo: '', 
        observacoes: ''
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

    const cleanedData = {
      ...formData,
      data_solicitacao: formData.data_solicitacao || null,
      prazo: formData.prazo || null,
    };

    delete cleanedData.created_at;

    onSave(cleanedData);
  };

  const handleAddItem = () => {
    if (!newItemValue.trim()) return
    const field = isManageModalOpen.field
    setOptions(prev => ({
      ...prev,
      [field]: [...new Set([...prev[field], newItemValue.trim()])].sort()
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
            <h3 className="text-xl font-black text-[#112240] tracking-tight leading-none">{initialData ? 'Editar Demanda' : 'Nova Demanda'}</h3>
            <p className="text-[9px] text-gray-400 font-medium uppercase tracking-widest mt-1">Gestão de Demandas • Secretaria Executiva</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all group">
            <X className="w-5 h-5 text-gray-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 overflow-y-auto custom-scrollbar flex flex-col gap-5 text-[#112240] flex-1">
          
          <div className="space-y-3">
            <h4 className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-50 pb-1">Identificação</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1 flex flex-col h-full">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Data da Solicitação</label>
                <input type="date" name="data_solicitacao" value={formData.data_solicitacao} onChange={(e) => setFormData({ ...formData, data_solicitacao: e.target.value })} className="w-full h-[34px] px-3 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-700" required />
              </div>
              <ManagedSelect label="Solicitante" name="solicitante" value={formData.solicitante} optionsList={options.solicitante} />
              <ManagedSelect label="Unidade" name="unidade" value={formData.unidade} optionsList={options.unidade} />
              <div className="space-y-1"><label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Fornecedor</label><input type="text" name="fornecedor" value={formData.fornecedor} onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })} className="w-full h-[34px] px-3 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none text-gray-700" /></div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-50 pb-1">Detalhes da Demanda</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="space-y-1 md:col-span-2"><label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Demanda</label><input type="text" name="demanda" value={formData.demanda} onChange={(e) => setFormData({ ...formData, demanda: e.target.value })} className="w-full h-[34px] px-3 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none font-medium focus:ring-2 focus:ring-blue-500/20 text-gray-700" required /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1"><label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Equipamento</label><input type="text" name="equipamento" value={formData.equipamento} onChange={(e) => setFormData({ ...formData, equipamento: e.target.value })} className="w-full h-[34px] px-3 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none text-gray-700" /></div>
              <div className="space-y-1"><label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Tipo</label><input type="text" name="tipo" value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} className="w-full h-[34px] px-3 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none text-gray-700" /></div>
              <div className="space-y-1"><label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Categoria</label><input type="text" name="categoria" value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} className="w-full h-[34px] px-3 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none text-gray-700" /></div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-50 pb-1">Acompanhamento e Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <ManagedSelect label="Prioridade" name="prioridade" value={formData.prioridade} optionsList={options.prioridade} />
              <ManagedSelect label="Status" name="status" value={formData.status} optionsList={options.status} />
              <div className="space-y-1 flex flex-col h-full">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Prazo</label>
                <input type="date" name="prazo" value={formData.prazo} onChange={(e) => setFormData({ ...formData, prazo: e.target.value })} className="w-full h-[34px] px-3 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none text-gray-700" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1"><label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Responsável</label><input type="text" name="responsavel" value={formData.responsavel} onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })} className="w-full h-[34px] px-3 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none text-gray-700" /></div>
              <div className="space-y-1"><label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Quem Acompanha</label><input type="text" name="quem_acompanha" value={formData.quem_acompanha} onChange={(e) => setFormData({ ...formData, quem_acompanha: e.target.value })} className="w-full h-[34px] px-3 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none text-gray-700" /></div>
              <div className="space-y-1"><label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Próxima Ação</label><input type="text" name="proxima_acao" value={formData.proxima_acao} onChange={(e) => setFormData({ ...formData, proxima_acao: e.target.value })} className="w-full h-[34px] px-3 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none text-gray-700" /></div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-50 pb-1">Observações</h4>
            <div className="space-y-1">
              <textarea name="observacoes" value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} className="w-full min-h-[80px] p-3 bg-gray-100/50 border border-gray-200 rounded-xl text-xs outline-none text-gray-700 resize-y custom-scrollbar" placeholder="Comentários e observações adicionais..." />
            </div>
          </div>
          
        </form>

        <div className="px-8 py-4 border-t border-gray-50 flex justify-end items-center gap-4 bg-gray-50/50 flex-shrink-0">
          <button type="button" onClick={onClose} className="text-[9px] font-black text-gray-400 hover:text-gray-600 transition-all uppercase tracking-widest">Cancelar</button>
          <button type="button" onClick={handleSubmit} className="flex items-center gap-2 px-8 py-2.5 bg-[#1e3a8a] text-white text-[9px] font-black rounded-xl hover:bg-[#112240] shadow-lg transition-all active:scale-95 uppercase tracking-widest">
            <Save className="w-4 h-4" /> {initialData ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </div>

      {isManageModalOpen.open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[#0a192f]/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-gray-100 animate-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h4 className="font-black text-[#112240] uppercase text-[10px] tracking-widest flex items-center gap-2">
                <Settings2 className="w-3.5 h-3.5 text-blue-600" /> Gerenciar opções
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
    </div>
  )
}
