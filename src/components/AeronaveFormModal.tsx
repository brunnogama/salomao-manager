import { useState, useEffect, useRef } from 'react'
import { Save, Plus, DollarSign, FileText, Plane, Settings, Search, ChevronDown, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AeronaveLancamento, OrigemLancamento } from '../types/AeronaveTypes'
import { GerenciadorOpcoesModal } from './GerenciadorOpcoesModal'
import { MissaoSelect } from './MissaoSelect'
import { CollaboratorModalLayout } from './collaborators/components/CollaboratorLayouts'

interface AeronaveFormModalProps {
  isOpen: boolean;
  onClose: () => void;
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
          w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold 
          flex items-center justify-between transition-all outline-none
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-blue-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/5'}
          ${isOpen ? 'border-blue-500 ring-4 ring-blue-500/5' : ''}
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
          className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
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
  initialData,
  onSave,
  onSuccess
}: AeronaveFormModalProps) {
  // --- Aba ativa: 1 = Custo Missões, 2 = Despesa Fixa ---
  const [activeTab, setActiveTab] = useState(1)

  // Derivar origem a partir da aba ativa
  const origem: OrigemLancamento = activeTab === 1 ? 'missao' : 'fixa'

  const steps = [
    { id: 1, label: 'Custo Missões', icon: Plane },
    { id: 2, label: 'Despesa Fixa', icon: DollarSign },
  ]

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
  const getEmptyForm = (tab: number): Partial<AeronaveLancamento> => ({
    origem: tab === 1 ? 'missao' : 'fixa',
    tripulacao: '',
    aeronave: 'PR WBW',
    data_missao: '',
    id_missao: undefined,
    nome_missao: '',
    despesa: tab === 1 ? 'Custo Missões' : 'Despesa Fixa',
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
  })

  const [formData, setFormData] = useState<Partial<AeronaveLancamento>>(getEmptyForm(1))
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
        // Definir aba com base na origem do dado existente
        setActiveTab(initialData.origem === 'fixa' ? 2 : 1)
      } else {
        setFormData(getEmptyForm(1))
        setActiveTab(1)
      }
    }
  }, [isOpen, initialData])

  // Ao mudar de aba (apenas para novos lançamentos), resetar form com a origem correta
  const handleTabChange = (tabId: number) => {
    setActiveTab(tabId)
    if (!initialData) {
      setFormData(getEmptyForm(tabId))
    }
  }

  // --- Helpers ---
  const handleChange = (field: keyof AeronaveLancamento, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
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
      // Garantir que a origem está sincronizada com a aba
      const dataToSave = { ...formData, origem }
      if (origem === 'missao') {
        dataToSave.despesa = 'Custo Missões'
      } else {
        dataToSave.despesa = 'Despesa Fixa'
      }
      await onSave(dataToSave)
      if (onSuccess) onSuccess()

      if (saveAndNew) {
        setFormData(getEmptyForm(activeTab))
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
    <>
      <CollaboratorModalLayout
        title={initialData ? 'Editar Lançamento' : 'Novo Lançamento'}
        onClose={onClose}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        currentSteps={steps}
        isEditMode={!!initialData}
        sidebarContent={
          <div className="flex flex-col items-center gap-4">
            <div className={`p-6 rounded-3xl shadow-inner flex items-center justify-center ${origem === 'missao' ? 'bg-blue-600 text-white shadow-blue-200/50' : 'bg-emerald-600 text-white shadow-emerald-200/50'}`}>
              {origem === 'missao' ? <Plane className="w-16 h-16" /> : <DollarSign className="w-16 h-16" />}
            </div>
            <div className="text-center w-full px-2">
              <h3 className="font-black text-[#0a192f] text-sm uppercase tracking-[0.1em] text-center">
                {origem === 'missao' ? 'Custo Missões' : 'Despesa Fixa'}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                {initialData ? 'Editando' : 'Novo Lançamento'}
              </p>
            </div>
          </div>
        }
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 transition-all">Cancelar</button>
            <button onClick={() => handleSubmit(true)} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white border border-[#1e3a8a] text-[#1e3a8a] hover:bg-blue-50 transition-all shadow-sm"><Plus className="h-3.5 w-3.5" /> Salvar e Novo</button>
            <button onClick={() => handleSubmit(false)} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white hover:shadow-xl transition-all shadow-lg active:scale-95"><Save className="h-3.5 w-3.5" /> {loading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        }
      >
        {/* Form Body */}
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
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
                      className="px-2.5 bg-white hover:bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl transition-all border border-gray-200 flex items-center justify-center shadow-sm active:scale-95"
                      title="Gerenciar Frota"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {origem === 'missao' && (
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
                )}

                <div className="col-span-2 grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Categoria</label>
                    <input
                      disabled
                      className="input-base bg-gray-50 text-gray-400 cursor-not-allowed"
                      value={origem === 'missao' ? 'Custo Missões' : 'Despesa Fixa'}
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
                        className="px-2.5 bg-white hover:bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl transition-colors border border-gray-200 flex items-center justify-center shadow-sm active:scale-95"
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
                      className="px-2.5 bg-white hover:bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl transition-colors border border-gray-200 flex items-center justify-center shadow-sm active:scale-95"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Centro de Custo</label>
                  <input type="text" className="input-base" value={formData.centro_custo || ''} onChange={e => handleChange('centro_custo', e.target.value)} placeholder="Ex: Administrativo, Jurídico..." />
                </div>

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
                        className="px-2.5 bg-white hover:bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl transition-colors border border-gray-200 flex items-center justify-center shadow-sm active:scale-95"
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
                </div>
              </div>

            </div>
          </div>
        </div>

        <style>{`
          .input-base {
            width: 100%;
            padding: 0.5rem 0.75rem;
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 0.75rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: #374151;
            outline: none;
            transition: all 0.2s;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }
          .input-base:focus {
            border-color: #93c5fd;
            background-color: #ffffff;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.05);
          }
          .input-base:disabled {
            background-color: #f3f4f6;
            color: #9ca3af;
          }
        `}</style>
      </CollaboratorModalLayout>

      <GerenciadorOpcoesModal
        isOpen={configModal.open}
        onClose={handleCloseConfig}
        titulo={configModal.tipo}
        tabela={configModal.tabela}
      />
    </>
  )
}