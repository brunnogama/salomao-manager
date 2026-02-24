import { useState, useEffect, useRef } from 'react'
import { X, Save, Plus, DollarSign, FileText, Plane, Settings, Search, ChevronDown, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AeronaveLancamento, OrigemLancamento } from '../types/AeronaveTypes'
import { GerenciadorOpcoesModal } from './GerenciadorOpcoesModal'
import { MissaoSelect } from './MissaoSelect'
import { useEscKey } from '../hooks/useEscKey'

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
          w-full px-3 py-2 bg-[#f9fafb] border border-gray-200 rounded-xl text-xs font-semibold 
          flex items-center justify-between transition-all outline-none
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/10' : ''}
        `}
      >
        <span className={value ? 'text-gray-700' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[99999] mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
          {/* Barra de Busca Fixa */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar opção..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium outline-none focus:border-blue-500 transition-all placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Lista de Opções */}
          <div className="max-h-52 overflow-y-auto custom-scrollbar p-1.5">
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
                      w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors
                      ${value === opt ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                    `}
                  >
                    {opt}
                    {value === opt && <Check className="h-3.5 w-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-4 text-center text-[10px] text-gray-400 italic">
                Nenhum resultado encontrado.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// CORRIGIDO: CurrencyInput movido para fora do componente pai para evitar perda de foco
const CurrencyInput = ({ value, onChange, label, required = false }: any) => {
  const [localValue, setLocalValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (!isFocused) {
      const formatted = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value || 0)
      setLocalValue(formatted)
    }
  }, [value, isFocused])

  const handleFocus = () => {
    setIsFocused(true)
    if (value === 0) {
      setLocalValue('')
    } else {
      const formatted = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value || 0)
      setLocalValue(formatted)
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0)
    setLocalValue(formatted)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const numbers = input.replace(/\D/g, '')

    if (numbers === '') {
      setLocalValue('')
      onChange(0)
      return
    }

    const numericValue = parseInt(numbers) / 100
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericValue)

    setLocalValue(formatted)
    onChange(numericValue)
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative group w-full">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 group-focus-within:text-blue-600 transition-colors pointer-events-none select-none">
          R$
        </div>
        <input
          type="text"
          inputMode="numeric"
          className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
          value={localValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="0,00"
        />
      </div>
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
  useEscKey(isOpen, onClose);

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
    aeronave: 'PR WBW',
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
    valor_total_doc: 0,
    centro_custo: ''
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
          despesa: origem === 'missao' ? 'Custo Missões' : 'Despesa Fixa',
          aeronave: 'PR WBW'
        })
      }
    }
  }, [isOpen, initialData, origem])

  // --- Helpers ---
  const handleChange = (field: keyof AeronaveLancamento, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Regra de Negócio: Se alterar o valor pago, reflete no valor total do doc automaticamente
      if (field === 'valor_pago' && (!prev.valor_total_doc || prev.valor_total_doc === 0)) {
        newData.valor_total_doc = value;
      }

      return newData;
    });
  }

  const handleOpenConfig = (titulo: string, tabela: string) => {
    setConfigModal({ open: true, tipo: titulo, tabela: tabela })
  }

  const handleCloseConfig = () => {
    setConfigModal({ ...configModal, open: false })
    fetchListas()
  }

  const handleSubmit = async (saveAndNew: boolean) => {
    try {
      setLoading(true)
      await onSave(formData)
      if (onSuccess) onSuccess()

      if (saveAndNew) {
        setFormData({
          ...emptyForm,
          origem: origem,
          despesa: origem === 'missao' ? 'Custo Missões' : 'Despesa Fixa',
          aeronave: 'PR WBW'
        })
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
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 ${origem === 'missao' ? 'bg-blue-50/50' : 'bg-emerald-50/50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl shadow-sm ${origem === 'missao' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#112240] uppercase tracking-tight">
                {initialData ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h2>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${origem === 'missao' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {origem === 'missao' ? 'Custo de Missão' : 'Despesa Fixa'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 p-4 sm:p-6 bg-white max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">

            {/* COLUNA 1: Dados Principais e Operacionais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100">
                <div className="p-1 bg-gray-100 rounded-lg text-gray-500">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dados Operacionais</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Aeronave</label>
                  <div className="flex gap-2 w-full">
                    <SearchableSelect
                      value={formData.aeronave || ''}
                      onChange={val => handleChange('aeronave', val)}
                      options={frotaOpcoes}
                      placeholder="Selecione a aeronave..."
                    />
                    <button
                      onClick={() => handleOpenConfig('Frota', 'aeronave_frota')}
                      className="px-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-xl transition-all border border-gray-200 flex items-center justify-center shadow-sm"
                      title="Gerenciar Frota"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {origem === 'missao' && (
                  <>
                    <div className="col-span-2 flex flex-col gap-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Tripulação</label>
                      <input
                        type="text" className="input-base"
                        value={formData.tripulacao || ''}
                        onChange={e => handleChange('tripulacao', e.target.value)}
                        placeholder="Ex: Cmte. Silva, Cop. João"
                      />
                    </div>

                    <div className="col-span-2 flex flex-col gap-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Missão</label>
                      <MissaoSelect
                        value={formData.id_missao}
                        onSelect={(missao) => {
                          if (missao) {
                            handleChange('id_missao', missao.id_missao)
                            handleChange('nome_missao', missao.nome_missao)
                            handleChange('data_missao', missao.data_inicio || '')
                          } else {
                            handleChange('id_missao', undefined)
                            handleChange('nome_missao', '')
                            handleChange('data_missao', '')
                          }
                        }}
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2 grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Categoria</label>
                    <input
                      disabled
                      className="input-base bg-gray-50 text-gray-400 cursor-not-allowed"
                      value={formData.despesa}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Tipo de Gasto</label>
                    <div className="flex gap-2 w-full">
                      <SearchableSelect
                        value={formData.tipo || ''}
                        onChange={val => handleChange('tipo', val)}
                        options={tiposOpcoes}
                        placeholder="Selecione..."
                      />
                      <button
                        onClick={() => handleOpenConfig('Tipos de Despesa', 'aeronave_tipos')}
                        className="px-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl transition-colors border border-gray-200 flex items-center justify-center shadow-sm"
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Descrição Detalhada</label>
                  <input type="text" className="input-base" value={formData.descricao || ''} onChange={e => handleChange('descricao', e.target.value)} />
                </div>

                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Fornecedor</label>
                  <div className="flex gap-2 w-full">
                    <SearchableSelect
                      value={formData.fornecedor || ''}
                      onChange={val => handleChange('fornecedor', val)}
                      options={fornecedoresOpcoes}
                      placeholder="Selecione o fornecedor..."
                    />
                    <button
                      onClick={() => handleOpenConfig('Fornecedores', 'aeronave_fornecedores')}
                      className="px-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl transition-colors border border-gray-200 flex items-center justify-center shadow-sm"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {origem === 'missao' && (
                  <div className="col-span-2">
                    <CurrencyInput label="Faturado CNPJ Salomão" value={formData.faturado_cnpj || 0} onChange={(val: number) => handleChange('faturado_cnpj', val)} />
                  </div>
                )}
              </div>
            </div>

            {/* COLUNA 2: Financeiro e Fiscal */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100">
                  <div className="p-1 bg-gray-100 rounded-lg text-gray-500">
                    <DollarSign className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Detalhes Financeiros</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Vencimento</label>
                    <input type="date" className="input-base" value={formData.vencimento || ''} onChange={e => handleChange('vencimento', e.target.value)} />
                  </div>

                  <CurrencyInput label="Valor Previsto" value={formData.valor_previsto || 0} onChange={(val: number) => handleChange('valor_previsto', val)} />

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Data Pagamento</label>
                    <input type="date" className="input-base" value={formData.data_pagamento || ''} onChange={e => handleChange('data_pagamento', e.target.value)} />
                  </div>

                  <CurrencyInput label="Valor Pago" value={formData.valor_pago || 0} onChange={(val: number) => handleChange('valor_pago', val)} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100">
                  <div className="p-1 bg-gray-100 rounded-lg text-gray-500">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Fiscal e Observações</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Doc. Fiscal</label>
                    <div className="flex gap-2 w-full">
                      <SearchableSelect
                        value={formData.doc_fiscal || ''}
                        onChange={val => handleChange('doc_fiscal', val)}
                        options={docFiscalOpcoes}
                        placeholder="Tipo de documento..."
                      />
                      <button
                        onClick={() => handleOpenConfig('Docs Fiscais', 'aeronave_docs_fiscais')}
                        className="px-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl transition-colors border border-gray-200 flex items-center justify-center shadow-sm"
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Número</label>
                    <input type="text" className="input-base" value={formData.numero_doc || ''} onChange={e => handleChange('numero_doc', e.target.value)} />
                  </div>

                  <CurrencyInput label="Valor Total Doc" value={formData.valor_total_doc || 0} onChange={(val: number) => handleChange('valor_total_doc', val)} />

                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Observação</label>
                    <textarea rows={2} className="input-base py-2 resize-none" value={formData.observacao || ''} onChange={e => handleChange('observacao', e.target.value)} />
                  </div>

                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Centro de Custo</label>
                    <input type="text" className="input-base" value={formData.centro_custo || ''} onChange={e => handleChange('centro_custo', e.target.value)} placeholder="Ex: Administrativo, Jurídico..." />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 transition-all">Cancelar</button>
          <button onClick={() => handleSubmit(true)} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white border border-[#1e3a8a] text-[#1e3a8a] hover:bg-blue-50 transition-all shadow-sm"><Plus className="h-3.5 w-3.5" /> Salvar e Novo</button>
          <button onClick={() => handleSubmit(false)} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#1e3a8a] text-white hover:bg-[#112240] transition-all shadow-lg active:scale-95"><Save className="h-3.5 w-3.5" /> {loading ? 'Salvando...' : 'Salvar'}</button>
        </div>

      </div>

      <style>{`
        .input-base {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          font-size: 0.75rem;
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

      <GerenciadorOpcoesModal
        isOpen={configModal.open}
        onClose={handleCloseConfig}
        titulo={configModal.tipo}
        tabela={configModal.tabela}
      />
    </div>
  )
}