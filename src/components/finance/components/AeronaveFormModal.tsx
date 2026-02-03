import { useState, useEffect, useRef } from 'react'
import { X, Save, Plane, Upload, FileText, Download, Trash2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { AeronaveMenuSelector } from './AeronaveMenuSelector'
import { NumericFormat } from 'react-number-format'
import InputMask from 'react-input-mask'

export function AeronaveFormModal({ isOpen, onClose, onSave, initialData }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    tripulacao: '',
    aeronave: '',
    data: '',
    localidade_destino: '',
    despesa: '',
    descricao: '',
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

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      setSelectedFile(null)
    } else {
      setFormData({
        tripulacao: '',
        aeronave: '',
        data: '',
        localidade_destino: '',
        despesa: '',
        descricao: '',
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
      setSelectedFile(null)
    }
  }, [initialData, isOpen])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Arquivo muito grande. Tamanho máximo: 10MB')
        return
      }
      setSelectedFile(file);
    }
  }

  const handleDownloadDocument = async () => {
    if (!formData.documento_url) return
    
    try {
      const { data, error } = await supabase.storage
        .from('aeronave-documentos')
        .download(formData.documento_url)
      
      if (error) throw error
      
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = formData.documento_url.split('/').pop() || 'documento.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar documento:', error)
      alert('Erro ao baixar o documento')
    }
  }

  const handleDeleteDocument = async () => {
    if (!formData.documento_url) return
    if (!confirm('Tem certeza que deseja excluir permanentemente este documento?')) return

    setUploading(true)
    try {
      const { error: storageError } = await supabase.storage
        .from('aeronave-documentos')
        .remove([formData.documento_url])
      
      if (storageError) throw storageError

      setFormData({
        ...formData,
        documento_url: '',
        tipo_documento: ''
      })
      
      alert('Documento excluído com sucesso. Salve o registro para confirmar.')
    } catch (error) {
      console.error('Erro ao excluir documento:', error)
      alert('Erro ao excluir o documento')
    } finally {
      setUploading(false)
    }
  }

  const sanitizeFileName = (name: string) => {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w.-]/g, '_'); // Substitui espaços e símbolos por _
  }

  const handleSave = async () => {
    setUploading(true)
    try {
      let documentUrl = formData.documento_url

      if (selectedFile) {
        if (initialData?.documento_url) {
          await supabase.storage
            .from('aeronave-documentos')
            .remove([initialData.documento_url])
        }

        const fileName = sanitizeFileName(selectedFile.name);
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('aeronave-documentos')
          .upload(filePath, selectedFile)

        if (uploadError) throw uploadError

        documentUrl = filePath
      }

      await onSave({
        ...formData,
        documento_url: documentUrl
      })

      setSelectedFile(null)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar o registro')
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md transition-all">
      <div className="bg-white w-full max-w-7xl rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[95vh] flex flex-col border border-white/20">
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

        <div className="px-8 py-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Despesa</span>
                  <input 
                    className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                    value={formData.despesa}
                    onChange={e => setFormData({...formData, despesa: e.target.value})}
                    placeholder="Tipo de despesa"
                  />
                </label>
                <label className="block">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Descrição</span>
                  <input 
                    className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                    value={formData.descricao}
                    onChange={e => setFormData({...formData, descricao: e.target.value})}
                    placeholder="Descrição detalhada"
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Faturado CNPJ</span>
                  <NumericFormat thousandSeparator="." decimalSeparator="," prefix="R$ " className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none font-medium" onValueChange={(vals) => setFormData({...formData, faturado_cnpj: vals.floatValue || 0})} value={formData.faturado_cnpj} />
                </label>
                <label className="block">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">R$ Previsto</span>
                  <NumericFormat thousandSeparator="." decimalSeparator="," prefix="R$ " className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none font-medium" onValueChange={(vals) => setFormData({...formData, valor_previsto: vals.floatValue || 0})} value={formData.valor_previsto} />
                </label>
                <label className="block">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">R$ Extra</span>
                  <NumericFormat thousandSeparator="." decimalSeparator="," prefix="R$ " className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none font-medium" onValueChange={(vals) => setFormData({...formData, valor_extra: vals.floatValue || 0})} value={formData.valor_extra} />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">R$ Pago</span>
                  <NumericFormat thousandSeparator="." decimalSeparator="," prefix="R$ " className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none font-medium" onValueChange={(vals) => setFormData({...formData, valor_pago: vals.floatValue || 0})} value={formData.valor_pago} />
                </label>
                <label className="block">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Vencimento</span>
                  <InputMask mask="99/99/9999" className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none font-medium" value={formData.data_vencimento} onChange={(e: any) => setFormData({...formData, data_vencimento: e.target.value})} placeholder="DD/MM/AAAA" />
                </label>
                <label className="block">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Pagamento</span>
                  <InputMask mask="99/99/9999" className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none font-medium" value={formData.data_pagamento} onChange={(e: any) => setFormData({...formData, data_pagamento: e.target.value})} placeholder="DD/MM/AAAA" />
                </label>
              </div>
            </div>

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

                {selectedFile && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-lg border border-orange-100 animate-in fade-in slide-in-from-left-2">
                    <FileText className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-[10px] font-bold text-gray-600 truncate flex-1">{selectedFile.name}</span>
                    <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-red-500">
                      <X className="h-3.5 w-3.5"/>
                    </button>
                  </div>
                )}

                {!selectedFile && formData.documento_url && (
                  <div className="bg-white/80 p-3 rounded-xl border border-orange-200 animate-in fade-in">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-orange-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Documento Atual</p>
                          <p className="text-xs font-bold text-gray-700 truncate">{formData.documento_url.split('/').pop()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleDownloadDocument}
                          type="button"
                          className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-all flex-shrink-0"
                          title="Baixar documento"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={handleDeleteDocument}
                          type="button"
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all flex-shrink-0"
                          title="Excluir documento"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
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

        <div className="px-8 py-5 border-t border-gray-50 bg-white flex justify-end items-center gap-3 flex-shrink-0">
          <button 
            onClick={onClose} 
            disabled={uploading}
            className="px-6 py-2 text-[9px] font-black text-gray-400 hover:text-gray-600 transition-all uppercase tracking-widest disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={uploading}
            className="flex items-center gap-2 px-8 py-2 bg-[#1e3a8a] text-white text-[9px] font-black rounded-xl hover:bg-[#112240] shadow-lg transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Salvar Registro
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}