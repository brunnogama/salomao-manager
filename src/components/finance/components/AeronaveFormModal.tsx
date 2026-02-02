import { useState, useEffect, useRef } from 'react'
import { X, Save, Plane, FolderSearch, Upload, FileText } from 'lucide-react'
import { AeronaveMenuSelector } from './AeronaveMenuSelector'
import { NumericFormat } from 'react-number-format'
import InputMask from 'react-input-mask'

export function AeronaveFormModal({ isOpen, onClose, onSave, initialData }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  
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
    data_pagamento: '',
    tipo_documento: '', // Campo para o GED
    documento_url: ''   // Referência do arquivo
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      if (initialData.documento_url) setSelectedFileName('Documento já anexado')
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
        data_pagamento: '',
        tipo_documento: '',
        documento_url: ''
      })
      setSelectedFileName(null)
    }
  }, [initialData, isOpen])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      // A lógica de upload real para o Supabase Storage deve ser chamada aqui
      // ou no momento do handleSave passando o arquivo como parâmetro
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md transition-all">
      {/* Aumentado para max-w-7xl para evitar barra de rolagem e melhorar visualização horizontal */}
      <div className="bg-white w-full max-w-7xl rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[95vh] flex flex-col border border-white/20">
        
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
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Coluna 1: Operacional */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2">Informações Operacionais</h4>
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
                  placeholder="Prefixo"
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

            {/* Coluna 2: Financeiro */}
            <div className="lg:col-span-5 space-y-4">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-50 pb-2">Financeiro e Logística</h4>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Localidade e Destino</span>
                  <input 
                    className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                    value={formData.localidade_destino}
                    onChange={e => setFormData({...formData, localidade_destino: e.target.value})}
                  />
                </label>
                <label className="block">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Fornecedor</span>
                  <input 
                    className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                    value={formData.fornecedor}
                    onChange={e => setFormData({...formData, fornecedor: e.target.value})}
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Faturado CNPJ</span>
                  <NumericFormat thousandSeparator="." decimalSeparator="," prefix="R$ " className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none" onValueChange={(vals) => setFormData({...formData, faturado_cnpj: vals.floatValue || 0})} value={formData.faturado_cnpj} />
                </label>
                <label className="block">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">R$ Previsto</span>
                  <NumericFormat thousandSeparator="." decimalSeparator="," prefix="R$ " className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none" onValueChange={(vals) => setFormData({...formData, valor_previsto: vals.floatValue || 0})} value={formData.valor_previsto} />
                </label>
                <label className="block">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">R$ Extra</span>
                  <NumericFormat thousandSeparator="." decimalSeparator="," prefix="R$ " className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none" onValueChange={(vals) => setFormData({...formData, valor_extra: vals.floatValue || 0})} value={formData.valor_extra} />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">R$ Pago</span>
                  <NumericFormat thousandSeparator="." decimalSeparator="," prefix="R$ " className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none" onValueChange={(vals) => setFormData({...formData, valor_pago: vals.floatValue || 0})} value={formData.valor_pago} />
                </label>
                <label className="block">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Vencimento</span>
                  <InputMask mask="99/99/9999" className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none" value={formData.data_vencimento} onChange={(e: any) => setFormData({...formData, data_vencimento: e.target.value})} placeholder="DD/MM/AAAA" />
                </label>
                <label className="block">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Pagamento</span>
                  <InputMask mask="99/99/9999" className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none" value={formData.data_pagamento} onChange={(e: any) => setFormData({...formData, data_pagamento: e.target.value})} placeholder="DD/MM/AAAA" />
                </label>
              </div>
            </div>

            {/* Coluna 3: GED (Documentação) */}
            <div className="lg:col-span-4 space-y-4">
              <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest border-b border-orange-50 pb-2">GED - Documentação</h4>
              
              <div className="bg-orange-50/30 p-5 rounded-[1.5rem] border border-orange-100/50 space-y-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <AeronaveMenuSelector 
                      label="Selecione o Tipo"
                      value={formData.tipo_documento}
                      onChange={(val: string) => setFormData({...formData, tipo_documento: val})}
                    />
                  </div>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".pdf" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 bg-white border border-orange-200 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm active:scale-90"
                      title="Buscar PDF"
                    >
                      <Upload className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {selectedFileName && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-lg border border-orange-100 animate-in fade-in slide-in-from-left-2">
                    <FileText className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-[10px] font-bold text-gray-600 truncate flex-1">{selectedFileName}</span>
                    <button onClick={() => setSelectedFileName(null)} className="text-gray-400 hover:text-red-500"><X className="h-3.5 w-3.5"/></button>
                  </div>
                )}

                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest leading-tight">
                  Formatos aceitos: PDF. Tamanho máx: 10MB.
                </p>
              </div>

              <label className="block">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Observação</span>
                <textarea 
                  rows={4}
                  className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium resize-none"
                  value={formData.observacao}
                  onChange={e => setFormData({...formData, observacao: e.target.value})}
                  placeholder="Notas adicionais..."
                />
              </label>
            </div>

          </div>
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