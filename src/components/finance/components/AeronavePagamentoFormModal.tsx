import { useState, useEffect } from 'react'
import { X, Save, DollarSign } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { ManagedDropdown } from './ManagedDropdown'
import { NumericFormat } from 'react-number-format'
import InputMask from 'react-input-mask'

interface PagamentoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: any;
}

export function AeronavePagamentoFormModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData 
}: PagamentoFormModalProps) {
  
  const [formData, setFormData] = useState({
    emissao: '',
    vencimento: '',
    valor_bruto: 0,
    valor_liquido_realizado: 0,
    tipo: '',
    devedor: '',
    descricao: ''
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        emissao: '',
        vencimento: '',
        valor_bruto: 0,
        valor_liquido_realizado: 0,
        tipo: '',
        devedor: '',
        descricao: ''
      })
    }
  }, [initialData, isOpen])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar o pagamento')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md transition-all">
      <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[95vh] flex flex-col border border-white/20">
        
        {/* HEADER */}
        <div className="px-8 py-5 border-b border-gray-50 flex justify-between items-center bg-gradient-to-br from-emerald-50/50 to-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#112240] tracking-tight leading-none">
                {initialData ? 'Editar Pagamento' : 'Novo Pagamento'}
              </h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                Gestão Financeira da Aeronave
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-xl transition-all group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="px-8 py-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* SEÇÃO: DATAS */}
          <div>
            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-50 pb-2 mb-4">
              Datas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">
                  Data de Emissão *
                </span>
                <InputMask
                  mask="99/99/9999"
                  className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
                  value={formData.emissao}
                  onChange={(e: any) => setFormData({...formData, emissao: e.target.value})}
                  placeholder="DD/MM/AAAA"
                />
              </label>

              <label className="block">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">
                  Data de Vencimento *
                </span>
                <InputMask
                  mask="99/99/9999"
                  className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
                  value={formData.vencimento}
                  onChange={(e: any) => setFormData({...formData, vencimento: e.target.value})}
                  placeholder="DD/MM/AAAA"
                />
              </label>
            </div>
          </div>

          {/* SEÇÃO: VALORES */}
          <div>
            <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest border-b border-amber-50 pb-2 mb-4">
              Valores
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">
                  Valor Bruto *
                </span>
                <NumericFormat 
                  thousandSeparator="." 
                  decimalSeparator="," 
                  prefix="R$ " 
                  className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium" 
                  onValueChange={(vals) => setFormData({...formData, valor_bruto: vals.floatValue || 0})} 
                  value={formData.valor_bruto}
                  placeholder="R$ 0,00"
                />
              </label>

              <label className="block">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">
                  Valor Líquido Realizado *
                </span>
                <NumericFormat 
                  thousandSeparator="." 
                  decimalSeparator="," 
                  prefix="R$ " 
                  className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium" 
                  onValueChange={(vals) => setFormData({...formData, valor_liquido_realizado: vals.floatValue || 0})} 
                  value={formData.valor_liquido_realizado}
                  placeholder="R$ 0,00"
                />
              </label>
            </div>
          </div>

          {/* SEÇÃO: IDENTIFICAÇÃO */}
          <div>
            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2 mb-4">
              Identificação
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ManagedDropdown
                label="Tipo de Pagamento"
                value={formData.tipo}
                onChange={(val) => setFormData({...formData, tipo: val})}
                tableName="aeronave_tipos_pagamento"
                columnName="tipo"
                placeholder="Selecione o tipo"
                required
              />

              <ManagedDropdown
                label="Devedor"
                value={formData.devedor}
                onChange={(val) => setFormData({...formData, devedor: val})}
                tableName="aeronave_devedores"
                columnName="nome"
                placeholder="Selecione o devedor"
                required
              />
            </div>
          </div>

          {/* SEÇÃO: DESCRIÇÃO */}
          <div>
            <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-gray-50 pb-2 mb-4">
              Detalhes
            </h4>
            <label className="block">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">
                Descrição
              </span>
              <textarea 
                rows={4}
                className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium resize-none"
                value={formData.descricao}
                onChange={e => setFormData({...formData, descricao: e.target.value})}
                placeholder="Informações adicionais sobre o pagamento..."
              />
            </label>
          </div>

        </div>

        {/* FOOTER */}
        <div className="px-8 py-5 border-t border-gray-50 bg-white flex justify-end items-center gap-3 flex-shrink-0">
          <button 
            onClick={onClose} 
            disabled={saving}
            className="px-6 py-2 text-[9px] font-black text-gray-400 hover:text-gray-600 transition-all uppercase tracking-widest disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-2 bg-emerald-600 text-white text-[9px] font-black rounded-xl hover:bg-emerald-700 shadow-lg transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Salvar Pagamento
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}