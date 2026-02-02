import { useState, useEffect } from 'react'
import { X, Save, Plane } from 'lucide-react'
import { AeronaveMenuSelector } from './AeronaveMenuSelector'
import { NumericFormat } from 'react-number-format'
import InputMask from 'react-input-mask'

export function AeronaveFormModal({ isOpen, onClose, onSave, initialData }: any) {
  const [formData, setFormData] = useState({
    tripulacao: '',
    aeronave: '',
    data: '',
    localidade_destino: '',
    despesa: '',
    fornecedor: '',
    observacao: '',
    faturado_cnpj: 0,
    valor_previsto: 0,
    valor_extra: 0,
    valor_pago: 0,
    data_vencimento: '',
    data_pagamento: ''
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        tripulacao: '',
        aeronave: '',
        data: '',
        localidade_destino: '',
        despesa: '',
        fornecedor: '',
        observacao: '',
        faturado_cnpj: 0,
        valor_previsto: 0,
        valor_extra: 0,
        valor_pago: 0,
        data_vencimento: '',
        data_pagamento: ''
      })
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md transition-all">
      <div className="bg-white w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[95vh] flex flex-col border border-white/20">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-50 flex justify-between items-center bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Plane className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#112240] tracking-tight leading-none">
                {initialData ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Gestão da Aeronave</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all group">
            <X className="w-5 h-5 text-gray-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Informações Operacionais */}
            <div className="space-y-4">
              <label className="block">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Tripulação</span>
                <input 
                  className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                  value={formData.tripulacao}
                  onChange={e => setFormData({...formData, tripulacao: e.target.value})}
                  placeholder="Nome dos tripulantes"
                />
              </label>
              
              <label className="block">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Aeronave</span>
                <input 
                  className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                  value={formData.aeronave}
                  onChange={e => setFormData({...formData, aeronave: e.target.value})}
                  placeholder="Prefixo da aeronave"
                />
              </label>

              <label className="block">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Data</span>
                <InputMask
                  mask="99/99/9999"
                  className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                  value={formData.data}
                  onChange={(e: any) => setFormData({...formData, data: e.target.value})}
                  placeholder="DD/MM/AAAA"
                />
              </label>
            </div>

            {/* Logística e Fornecedor */}
            <div className="space-y-4">
              <label className="block">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Localidade e Destino</span>
                <input 
                  className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                  value={formData.localidade_destino}
                  onChange={e => setFormData({...formData, localidade_destino: e.target.value})}
                  placeholder="Ex: SDU -> CGH"
                />
              </label>

              <label className="block">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Despesa</span>
                <input 
                  className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                  value={formData.despesa}
                  onChange={e => setFormData({...formData, despesa: e.target.value})}
                  placeholder="Tipo de despesa"
                />
              </label>

              <AeronaveMenuSelector 
                label="Fornecedor"
                value={formData.fornecedor}
                onChange={(val: string) => setFormData({...formData, fornecedor: val})}
              />
            </div>

            {/* Financeiro - Valores */}
            <div className="space-y-4">
              <label className="block">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Faturado CNPJ SALOMÃO</span>
                <NumericFormat
                  thousandSeparator="." decimalSeparator="," prefix="R$ "
                  className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                  onValueChange={(vals) => setFormData({...formData, faturado_cnpj: vals.floatValue || 0})}
                  value={formData.faturado_cnpj}
                />
              </label>

              <label className="block">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">R$ Previsto Total</span>
                <NumericFormat
                  thousandSeparator="." decimalSeparator="," prefix="R$ "
                  className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                  onValueChange={(vals) => setFormData({...formData, valor_previsto: vals.floatValue || 0})}
                  value={formData.valor_previsto}
                />
              </label>

              <label className="block">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">R$ Extra</span>
                <NumericFormat
                  thousandSeparator="." decimalSeparator="," prefix="R$ "
                  className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                  onValueChange={(vals) => setFormData({...formData, valor_extra: vals.floatValue || 0})}
                  value={formData.valor_extra}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-50">
            <label className="block">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">R$ Pago</span>
              <NumericFormat
                thousandSeparator="." decimalSeparator="," prefix="R$ "
                className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                onValueChange={(vals) => setFormData({...formData, valor_pago: vals.floatValue || 0})}
                value={formData.valor_pago}
              />
            </label>

            <label className="block">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Data Vencimento</span>
              <InputMask
                mask="99/99/9999"
                className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                value={formData.data_vencimento}
                onChange={(e: any) => setFormData({...formData, data_vencimento: e.target.value})}
                placeholder="DD/MM/AAAA"
              />
            </label>

            <label className="block">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Data Pagamento</span>
              <InputMask
                mask="99/99/9999"
                className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                value={formData.data_pagamento}
                onChange={(e: any) => setFormData({...formData, data_pagamento: e.target.value})}
                placeholder="DD/MM/AAAA"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Observação</span>
            <textarea 
              rows={3}
              className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium resize-none"
              value={formData.observacao}
              onChange={e => setFormData({...formData, observacao: e.target.value})}
              placeholder="Notas adicionais..."
            />
          </label>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-50 bg-white flex justify-end items-center gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-6 py-2 text-[9px] font-black text-gray-400 hover:text-gray-600 transition-all uppercase tracking-widest">
            Cancelar
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="flex items-center gap-2 px-8 py-2 bg-[#1e3a8a] text-white text-[9px] font-black rounded-xl hover:bg-[#112240] shadow-lg transition-all active:scale-95 uppercase tracking-widest"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar Registro
          </button>
        </div>
      </div>
    </div>
  )
}
