import { useState, useEffect } from 'react'
import { X, Save, Plus, Calendar, DollarSign, FileText, Plane, Settings } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
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
    aeronave: '', // Será preenchido com default se houver frota
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

    // Define aeronave default se estiver vazia e houver frota
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

  // Ao fechar config, recarrega listas para refletir mudanças
  const handleCloseConfig = () => {
    setConfigModal({ ...configModal, open: false })
    fetchListas()
  }

  const CurrencyInput = ({ value, onChange, label, required = false }: any) => {
    const displayValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative group">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
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
        // Re-aplica aeronave default
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
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 ${origem === 'missao' ? 'bg-blue-50/50' : 'bg-emerald-50/50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${origem === 'missao' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#112240] uppercase tracking-tight">
                {initialData ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h2>
              <p className={`text-[10px] font-black uppercase tracking-widest ${origem === 'missao' ? 'text-blue-600' : 'text-emerald-600'}`}>
                {origem === 'missao' ? 'Custo de Missão' : 'Despesa Fixa'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

            {/* SEÇÃO 1: Dados Principais */}
            <div className="col-span-1 md:col-span-2 flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-500 uppercase">Dados do Lançamento</span>
            </div>

            {origem === 'missao' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Tripulação</label>
                <input 
                  type="text" className="input-base"
                  value={formData.tripulacao || ''}
                  onChange={e => handleChange('tripulacao', e.target.value)}
                  placeholder="Ex: Cmte. Silva, Cop. João"
                />
              </div>
            )}

            {/* Aeronave (Com Config) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Aeronave</label>
              <div className="flex gap-2">
                <select 
                  className="input-base flex-1"
                  value={formData.aeronave || ''}
                  onChange={e => handleChange('aeronave', e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {frotaOpcoes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <button 
                  onClick={() => handleOpenConfig('Frota', 'aeronave_frota')}
                  className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-colors border border-gray-200"
                  title="Gerenciar Frota"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>

            {origem === 'missao' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Data Missão</label>
                  <input 
                    type="date" className="input-base"
                    value={formData.data_missao || ''}
                    onChange={e => handleChange('data_missao', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">ID Missão (999999)</label>
                  <input 
                    type="number" className="input-base"
                    value={formData.id_missao || ''}
                    onChange={e => handleChange('id_missao', parseInt(e.target.value))}
                    placeholder="000000"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nome da Missão</label>
                  <input 
                    type="text" className="input-base"
                    value={formData.nome_missao || ''}
                    onChange={e => handleChange('nome_missao', e.target.value)}
                    placeholder="Ex: Viagem São Paulo"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Despesa (Categoria)</label>
              <select disabled className="input-base bg-gray-100 text-gray-500 cursor-not-allowed" value={formData.despesa}>
                <option value="Custo Missões">Custo Missões</option>
                <option value="Despesa Fixa">Despesa Fixa</option>
              </select>
            </div>

            {/* Tipo (Com Config) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Tipo</label>
              <div className="flex gap-2">
                <select 
                  className="input-base flex-1"
                  value={formData.tipo || ''}
                  onChange={e => handleChange('tipo', e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {tiposOpcoes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <button 
                  onClick={() => handleOpenConfig('Tipos de Despesa', 'aeronave_tipos')}
                  className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-colors border border-gray-200"
                  title="Gerenciar Tipos"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Descrição Detalhada</label>
              <input type="text" className="input-base" value={formData.descricao || ''} onChange={e => handleChange('descricao', e.target.value)} />
            </div>

            {/* Fornecedor (Com Config) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Fornecedor</label>
              <div className="flex gap-2">
                <select 
                  className="input-base flex-1"
                  value={formData.fornecedor || ''}
                  onChange={e => handleChange('fornecedor', e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {fornecedoresOpcoes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <button 
                  onClick={() => handleOpenConfig('Fornecedores', 'aeronave_fornecedores')}
                  className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-colors border border-gray-200"
                  title="Gerenciar Fornecedores"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>

            {origem === 'missao' && (
              <CurrencyInput label="Faturado CNPJ Salomão" value={formData.faturado_cnpj || 0} onChange={val => handleChange('faturado_cnpj', val)} />
            )}

            {/* SEÇÃO 2: Financeiro */}
            <div className="col-span-1 md:col-span-2 flex items-center gap-2 mt-4 mb-2 pb-2 border-b border-gray-100">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-500 uppercase">Detalhes Financeiros</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Vencimento</label>
              <input type="date" className="input-base" value={formData.vencimento || ''} onChange={e => handleChange('vencimento', e.target.value)} />
            </div>

            <CurrencyInput label="Valor Previsto" value={formData.valor_previsto || 0} onChange={val => handleChange('valor_previsto', val)} />

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Data Pagamento</label>
              <input type="date" className="input-base" value={formData.data_pagamento || ''} onChange={e => handleChange('data_pagamento', e.target.value)} />
            </div>

            <CurrencyInput label="Valor Pago" value={formData.valor_pago || 0} onChange={val => handleChange('valor_pago', val)} />

            {/* SEÇÃO 3: Fiscal */}
            <div className="col-span-1 md:col-span-2 flex items-center gap-2 mt-4 mb-2 pb-2 border-b border-gray-100">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-500 uppercase">Documentação Fiscal</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Doc. Fiscal</label>
              <div className="flex gap-2">
                <select 
                  className="input-base flex-1"
                  value={formData.doc_fiscal || ''}
                  onChange={e => handleChange('doc_fiscal', e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {docFiscalOpcoes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <button 
                  onClick={() => handleOpenConfig('Docs Fiscais', 'aeronave_docs_fiscais')}
                  className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-colors border border-gray-200"
                  title="Gerenciar Docs"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Número</label>
              <input type="text" className="input-base" value={formData.numero_doc || ''} onChange={e => handleChange('numero_doc', e.target.value)} />
            </div>

            <CurrencyInput label="Valor Total Doc" value={formData.valor_total_doc || 0} onChange={val => handleChange('valor_total_doc', val)} />

            <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5 mt-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Observação</label>
              <textarea rows={3} className="input-base py-3" value={formData.observacao || ''} onChange={e => handleChange('observacao', e.target.value)} />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 transition-all">Cancelar</button>
          <button onClick={() => handleSubmit(true)} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-white border border-[#1e3a8a] text-[#1e3a8a] hover:bg-blue-50 transition-all shadow-sm"><Plus className="h-4 w-4" /> Salvar e Novo</button>
          <button onClick={() => handleSubmit(false)} disabled={loading} className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-[#1e3a8a] text-white hover:bg-[#112240] transition-all shadow-lg active:scale-95"><Save className="h-4 w-4" /> {loading ? 'Salvando...' : 'Salvar'}</button>
        </div>

      </div>
      
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
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
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