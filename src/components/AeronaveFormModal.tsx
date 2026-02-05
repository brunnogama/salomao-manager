import { useState, useEffect, useRef } from 'react'
import { X, Save, Plus, DollarSign, FileText, Plane, Settings, Search, ChevronDown, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AeronaveLancamento, OrigemLancamento } from '../types/AeronaveTypes'
import { GerenciadorOpcoesModal } from './GerenciadorOpcoesModal'

interface AeronaveFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  origem: OrigemLancamento;
  initialData?: AeronaveLancamento | null;
  onSave: (data: Partial<AeronaveLancamento>) => Promise<void>;
  onSuccess?: () => void;
}

// --- Componente Select Customizado com Busca ---
interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
}

function SearchableSelect({ value, onChange, options, placeholder = 'Selecione...', disabled = false }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-2.5 bg-[#f9fafb] border border-gray-200 rounded-xl text-sm font-semibold 
          flex items-center justify-between transition-all outline-none
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/10' : ''}
        `}
      >
        <span className={value ? 'text-gray-700' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
          {/* Barra de Busca Fixa */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input 
                autoFocus
                type="text"
                placeholder="Buscar opção..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium outline-none focus:border-blue-500 transition-all placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Lista de Opções */}
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
            {filteredOptions.length > 0 ? (
              <div className="space-y-0.5">
                {filteredOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      onChange(opt)
                      setIsOpen(false)
                      setSearchTerm('')
                    }}
                    className={`
                      w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between transition-colors
                      ${value === opt ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                    `}
                  >
                    {opt}
                    {value === opt && <Check className="h-4 w-4 text-blue-600" />}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-xs text-gray-400 italic">
                Nenhum resultado encontrado.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function AeronaveFormModal({ 
  isOpen, 
  onClose, 
  origem, 
  initialData, 
  onSave, 
  onSuccess 
}: AeronaveFormModalProps) {
  
  // --- Estados de Listas Dinâmicas ---
  const [tiposOpcoes, setTiposOpcoes] = useState<string[]>([])
  const [fornecedoresOpcoes, setFornecedoresOpcoes] = useState<string[]>([])
  const [docFiscalOpcoes, setDocFiscalOpcoes] = useState<string[]>([])
  const [frotaOpcoes, setFrotaOpcoes] = useState<string[]>([])

  // --- Controle do Modal de Configuração ---
  const [configModal, setConfigModal] = useState<{ open: boolean, tipo: string, tabela: any }>({
    open: false, tipo: '', tabela: 'aeronave_tipos'
  })

  // --- Estado do Formulário ---
  const emptyForm: Partial<AeronaveLancamento> = {
    origem: origem,
    tripulacao: '',
    aeronave: '', 
    data_missao: '',
    id_missao: undefined,
    nome_missao: '',
    despesa: origem === 'missao' ? 'Custo Missões' : 'Despesa Fixa',
    tipo: '',
    descricao: '',
    fornecedor: '',
    faturado_cnpj: 0,
    vencimento: '',
    valor_previsto: 0,
    data_pagamento: '',
    valor_pago: 0,
    observacao: '',
    doc_fiscal: '',
    numero_doc: '',
    valor_total_doc: 0
  }

  const [formData, setFormData] = useState<Partial<AeronaveLancamento>>(emptyForm)
  const [loading, setLoading] = useState(false)

  // --- Carregar Listas do Banco ---
  const fetchListas = async () => {
    const fetchTable = async (table: string) => {
      const { data } = await supabase.from(table).select('nome').order('nome')
      return data?.map((i: any) => i.nome) || []
    }

    const [tipos, forns, docs, frota] = await Promise.all([
      fetchTable('aeronave_tipos'),
      fetchTable('aeronave_fornecedores'),
      fetchTable('aeronave_docs_fiscais'),
      fetchTable('aeronave_frota')
    ])

    setTiposOpcoes(tipos)
    setFornecedoresOpcoes(forns)
    setDocFiscalOpcoes(docs)
    setFrotaOpcoes(frota)

    if (!formData.aeronave && frota.length > 0) {
      setFormData(prev => ({ ...prev, aeronave: frota[0] }))
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchListas()
      if (initialData) {
        setFormData({ ...initialData })
      } else {
        setFormData({ 
          ...emptyForm, 
          origem: origem,
          despesa: origem === 'missao' ? 'Custo Missões' : 'Despesa Fixa' 
        })
      }
    }
  }, [isOpen, initialData, origem])

  // --- Helpers ---
  const handleChange = (field: keyof AeronaveLancamento, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleOpenConfig = (titulo: string, tabela: string) => {
    setConfigModal({ open: true, tipo: titulo, tabela: tabela })
  }

  const handleCloseConfig = () => {
    setConfigModal({ ...configModal, open: false })
    fetchListas()
  }

  const CurrencyInput = ({ value, onChange, label, required = false }: any) => {
    const displayValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative group w-full">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
          <input
            type="text"
            className="input-base pl-9"
            value={displayValue}
            onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) / 100)}
          />
        </div>
      </div>
    )
  }

  const handleSubmit = async (saveAndNew: boolean) => {
    try {
      setLoading(true)
      await onSave(formData)
      if (onSuccess) onSuccess()
      
      if (saveAndNew) {
        setFormData({ ...emptyForm, origem: origem, despesa: origem === 'missao' ? 'Custo Missões' : 'Despesa Fixa' })
        if (frotaOpcoes.length > 0) setFormData(prev => ({ ...prev, aeronave: frotaOpcoes[0] }))
      } else {
        onClose()
      }
    } catch (error) {
      console.error(error)
      alert('Erro ao salvar lançamento.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* ALTERADO: Largura do modal aumentada para max-w-7xl */}
      <div className="bg-white w-full max-w-7xl max-h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className={`flex items-center justify-between px-8 py-5 border-b border-gray-100 ${origem === 'missao' ? 'bg-blue-50/50' : 'bg-emerald-50/50'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl shadow-sm ${origem === 'missao' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
              <Plane className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#112240] uppercase tracking-tight">
                {initialData ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${origem === 'missao' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {origem === 'missao' ? 'Custo de Missão' : 'Despesa Fixa'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">

            {/* COLUNA 1: Dados Principais e Operacionais */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Dados Operacionais</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Aeronave (Com Config) - FULL WIDTH */}
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Aeronave</label>
                  <div className="flex gap-2 w-full">
                    <SearchableSelect 
                      value={formData.aeronave || ''}
                      onChange={val => handleChange('aeronave', val)}
                      options={frotaOpcoes}
                      placeholder="Selecione a aeronave..."
                    />
                    <button 
                      onClick={() => handleOpenConfig('Frota', 'aeronave_frota')}
                      className="px-3.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-xl transition-all border border-gray-200 flex items-center justify-center shadow-sm"
                      title="Gerenciar Frota"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Campos Condicionais de Missão */}
                {origem === 'missao' && (
                  <>
                    <div className="col-span-2 flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Tripulação</label>
                      <input 
                        type="text" className="input-base"
                        value={formData.tripulacao || ''}
                        onChange={e => handleChange('tripulacao', e.target.value)}
                        placeholder="Ex: Cmte. Silva, Cop. João"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Data Missão</label>
                      <input 
                        type="date" className="input-base"
                        value={formData.data_missao || ''}
                        onChange={e => handleChange('data_missao', e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">ID Missão</label>
                      <input 
                        type="number" className="input-base"
                        value={formData.id_missao || ''}
                        onChange={e => handleChange('id_missao', parseInt(e.target.value))}
                        placeholder="000000"
                      />
                    </div>
                    <div className="col-span-2 flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nome da Missão</label>
                      <input 
                        type="text" className="input-base"
                        value={formData.nome_missao || ''}
                        onChange={e => handleChange('nome_missao', e.target.value)}
                        placeholder="Ex: Viagem São Paulo"
                      />
                    </div>
                  </>
                )}

                {/* Tipo e Despesa */}
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Categoria</label>
                    <input 
                      disabled 
                      className="input-base bg-gray-50 text-gray-400 cursor-not-allowed" 
                      value={formData.despesa} 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Tipo de Gasto</label>
                    <div className="flex gap-2 w-full">
                      <SearchableSelect 
                        value={formData.tipo || ''}
                        onChange={val => handleChange('tipo', val)}
                        options={tiposOpcoes}
                        placeholder="Selecione..."
                      />
                      <button 
                        onClick={() => handleOpenConfig('Tipos de Despesa', 'aeronave_tipos')}
                        className="px-3 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl transition-colors border border-gray-200 flex items-center justify-center shadow-sm"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Descrição Detalhada */}
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Descrição Detalhada</label>
                  <input type="text" className="input-base" value={formData.descricao || ''} onChange={e => handleChange('descricao', e.target.value)} />
                </div>

                {/* Fornecedor */}
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Fornecedor</label>
                  <div className="flex gap-2 w-full">
                    <SearchableSelect 
                      value={formData.fornecedor || ''}
                      onChange={val => handleChange('fornecedor', val)}
                      options={fornecedoresOpcoes}
                      placeholder="Selecione o fornecedor..."
                    />
                    <button 
                      onClick={() => handleOpenConfig('Fornecedores', 'aeronave_fornecedores')}
                      className="px-3.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl transition-colors border border-gray-200 flex items-center justify-center shadow-sm"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {origem === 'missao' && (
                  <div className="col-span-2">
                    <CurrencyInput label="Faturado CNPJ Salomão" value={formData.faturado_cnpj || 0} onChange={val => handleChange('faturado_cnpj', val)} />
                  </div>
                )}
              </div>
            </div>

            {/* COLUNA 2: Financeiro e Fiscal */}
            <div className="space-y-8">
              
              {/* BLOCO FINANCEIRO */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Detalhes Financeiros</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Vencimento</label>
                    <input type="date" className="input-base" value={formData.vencimento || ''} onChange={e => handleChange('vencimento', e.target.value)} />
                  </div>

                  <CurrencyInput label="Valor Previsto" value={formData.valor_previsto || 0} onChange={val => handleChange('valor_previsto', val)} />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Data Pagamento</label>
                    <input type="date" className="input-base" value={formData.data_pagamento || ''} onChange={e => handleChange('data_pagamento', e.target.value)} />
                  </div>

                  <CurrencyInput label="Valor Pago" value={formData.valor_pago || 0} onChange={val => handleChange('valor_pago', val)} />
                </div>
              </div>

              {/* BLOCO FISCAL */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Fiscal e Observações</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Doc. Fiscal</label>
                    <div className="flex gap-2 w-full">
                      <SearchableSelect 
                        value={formData.doc_fiscal || ''}
                        onChange={val => handleChange('doc_fiscal', val)}
                        options={docFiscalOpcoes}
                        placeholder="Tipo de documento..."
                      />
                      <button 
                        onClick={() => handleOpenConfig('Docs Fiscais', 'aeronave_docs_fiscais')}
                        className="px-3.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl transition-colors border border-gray-200 flex items-center justify-center shadow-sm"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Número</label>
                    <input type="text" className="input-base" value={formData.numero_doc || ''} onChange={e => handleChange('numero_doc', e.target.value)} />
                  </div>

                  <CurrencyInput label="Valor Total Doc" value={formData.valor_total_doc || 0} onChange={val => handleChange('valor_total_doc', val)} />

                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Observação</label>
                    <textarea rows={4} className="input-base py-3 resize-none" value={formData.observacao || ''} onChange={e => handleChange('observacao', e.target.value)} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 transition-all">Cancelar</button>
          <button onClick={() => handleSubmit(true)} disabled={loading} className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-white border border-[#1e3a8a] text-[#1e3a8a] hover:bg-blue-50 transition-all shadow-sm"><Plus className="h-4 w-4" /> Salvar e Novo</button>
          <button onClick={() => handleSubmit(false)} disabled={loading} className="flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-[#1e3a8a] text-white hover:bg-[#112240] transition-all shadow-lg active:scale-95"><Save className="h-4 w-4" /> {loading ? 'Salvando...' : 'Salvar'}</button>
        </div>

      </div>
      
      {/* Styles Injected */}
      <style>{`
        .input-base {
          width: 100%;
          padding: 0.625rem 1rem;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          outline: none;
          transition: all 0.2s;
        }
        .input-base:focus {
          border-color: #3b82f6;
          background-color: #ffffff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .input-base:disabled {
          background-color: #f3f4f6;
          color: #9ca3af;
        }
      `}</style>

      {/* Modal de Configuração (Aninhado) */}
      <GerenciadorOpcoesModal 
        isOpen={configModal.open}
        onClose={handleCloseConfig}
        titulo={configModal.tipo}
        tabela={configModal.tabela}
      />
    </div>
  )
}