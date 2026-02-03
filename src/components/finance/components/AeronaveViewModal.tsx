import { X, Edit2, Trash2, Plane, Calendar, MapPin, DollarSign, Info, FolderSearch, Upload, MessageSquare, AlignLeft, Download, FileText } from 'lucide-react'
import { useState, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { AeronaveMenuSelector } from './AeronaveMenuSelector'

interface AeronaveViewModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
}

export function AeronaveViewModal({ item, isOpen, onClose, onEdit, onDelete }: AeronaveViewModalProps) {
  const [uploading, setUploading] = useState(false)
  const [tipoDocumento, setTipoDocumento] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen || !item) return null

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  const formatDateBR = (dateString: string) => {
    if (!dateString) return '---'
    try {
      if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-')
        return `${day}/${month}/${year}`
      }
      return dateString
    } catch (e) {
      return dateString
    }
  }

  const handleDownloadDocument = async () => {
    if (!item.documento_url) return
    
    try {
      const { data, error } = await supabase.storage
        .from('aeronave-documentos')
        .download(item.documento_url)
      
      if (error) throw error
      
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = item.documento_url.split('/').pop() || 'documento.pdf'
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
    if (!item.documento_url) return
    if (!confirm('Tem certeza que deseja excluir o documento anexo?')) return

    try {
      // 1. Remover do Storage
      const { error: storageError } = await supabase.storage
        .from('aeronave-documentos')
        .remove([item.documento_url])
      
      if (storageError) throw storageError

      // 2. Atualizar o banco de dados
      const { error: updateError } = await supabase
        .from('financeiro_aeronave')
        .update({ 
          documento_url: null,
          tipo_documento: null
        })
        .eq('id', item.id)

      if (updateError) throw updateError

      // 3. Atualizar estado local do item
      item.documento_url = null
      item.tipo_documento = null
      setTipoDocumento('')
      
      alert('Documento excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir documento:', error)
      alert('Erro ao excluir o documento')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tipoDocumento) {
      alert('Selecione o tipo de documento antes de fazer upload')
      return
    }

    setUploading(true)
    try {
      // Remove arquivo antigo se existir
      if (item.documento_url) {
        await supabase.storage
          .from('aeronave-documentos')
          .remove([item.documento_url])
      }

      // Upload novo arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${item.id}_${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('aeronave-documentos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Atualiza registro no banco
      const { error: updateError } = await supabase
        .from('financeiro_aeronave')
        .update({ 
          documento_url: filePath,
          tipo_documento: tipoDocumento
        })
        .eq('id', item.id)

      if (updateError) throw updateError

      alert('Documento enviado com sucesso!')
      // Atualiza o item local
      item.documento_url = filePath
      item.tipo_documento = tipoDocumento
      
    } catch (error) {
      console.error('Erro no upload:', error)
      alert('Erro ao enviar documento')
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const DataField = ({ icon: Icon, label, value, color = "blue", className = "" }: any) => (
    <div className={`bg-gray-50/50 p-3 rounded-xl border border-gray-100 h-full ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-3 w-3 text-${color}-600`} />
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-xs font-bold text-[#112240] break-words" title={value}>{value || '---'}</p>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-7xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="px-10 py-6 border-b border-gray-50 flex justify-between items-center bg-white flex-shrink-0">
          <div className="flex items-center gap-5">
            <div className="p-3.5 bg-blue-50 rounded-2xl">
              <Plane className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#112240] tracking-tight leading-none">Detalhes do Lançamento</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-1.5">Gestão da Aeronave</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-2xl transition-all group">
            <X className="h-6 w-6 text-gray-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Content */}
        <div className="px-10 py-8 space-y-8 overflow-auto max-h-[calc(95vh-180px)]">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Seção 1: Operacional */}
            <div className="lg:col-span-3 flex flex-col gap-4">
               <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-2">
                <Info className="h-3.5 w-3.5" /> Operacional
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <DataField icon={Plane} label="Aeronave" value={item.aeronave} />
                <DataField icon={Calendar} label="Data do Voo" value={formatDateBR(item.data)} />
                <DataField icon={MapPin} label="Trajeto" value={item.localidade_destino} />
              </div>
            </div>

            {/* Seção 2: Financeiro */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5" /> Financeiro
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <DataField icon={DollarSign} label="Previsto" value={formatCurrency(item.valor_previsto)} color="emerald" />
                <DataField icon={DollarSign} label="Extra" value={formatCurrency(item.valor_extra)} color="emerald" />
                <DataField icon={DollarSign} label="Pago" value={formatCurrency(item.valor_pago)} color="emerald" />
                <DataField icon={DollarSign} label="Faturado CNPJ" value={formatCurrency(item.faturado_cnpj)} color="emerald" />
                <DataField icon={Calendar} label="Vencimento" value={formatDateBR(item.data_vencimento)} color="orange" />
                <DataField icon={Calendar} label="Data Pgto" value={formatDateBR(item.data_pagamento)} color="emerald" />
              </div>
            </div>

            {/* Seção 3: GED (Documentação) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] flex items-center gap-2">
                <FolderSearch className="h-3.5 w-3.5" /> Documentação (GED)
              </h4>
              <div className="bg-orange-50/30 p-5 rounded-[1.5rem] border border-orange-100/50 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-end gap-2 mb-4">
                    <div className="flex-1">
                      <AeronaveMenuSelector 
                        label="Selecione o Tipo"
                        value={tipoDocumento || item.tipo_documento || ''}
                        onChange={(val: string) => setTipoDocumento(val)} 
                      />
                    </div>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".pdf" 
                      className="hidden" 
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="p-2.5 bg-white border border-orange-200 text-orange-600 rounded-xl shadow-sm hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      title="Upload de documento"
                    >
                      {uploading ? <div className="h-4 w-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" /> : <Upload className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Arquivo vinculado */}
                  {item.documento_url && (
                    <div className="bg-white/80 p-3 rounded-xl border border-orange-200 mb-3 animate-in fade-in">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="h-4 w-4 text-orange-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Documento Anexado</p>
                            <p className="text-xs font-bold text-gray-700 truncate">{item.documento_url.split('/').pop()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={handleDownloadDocument}
                            className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-all"
                            title="Baixar documento"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={handleDeleteDocument}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all"
                            title="Excluir documento"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-orange-100">
                  <p className="text-[8px] text-orange-700/60 font-black uppercase tracking-widest leading-none">
                    ID Vínculo: <span className="text-[#112240]">{item.id?.split('-')[0]}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Seção Detalhada: Despesa, Descrição, Fornecedor e Tripulação */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <DataField icon={Info} label="Despesa" value={item.despesa} color="blue" />
            <DataField icon={AlignLeft} label="Descrição" value={item.descricao} color="blue" />
            <DataField icon={Edit2} label="Fornecedor" value={item.fornecedor} color="indigo" />
            <DataField icon={Edit2} label="Tripulação / Responsável" value={item.tripulacao} color="indigo" />
          </div>

          {/* Observações */}
          {item.observacao && (
            <div className="bg-blue-50/30 p-5 rounded-xl border border-blue-100 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-3 w-3 text-blue-600" />
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Observações</span>
              </div>
              <p className="text-xs font-semibold text-gray-600 leading-relaxed italic break-words">
                "{item.observacao}"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-6 border-t border-gray-50 bg-gray-50/50 flex justify-between items-center flex-shrink-0">
          <button onClick={() => onDelete(item)} className="flex items-center gap-2 px-6 py-3 text-red-500 hover:bg-red-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
            <Trash2 className="h-4 w-4" /> Excluir Registro
          </button>

          <div className="flex gap-4">
            <button onClick={onClose} className="px-6 py-3 text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase tracking-widest transition-all">
              Fechar
            </button>
            <button onClick={() => onEdit(item)} className="flex items-center gap-3 px-10 py-3 bg-[#1e3a8a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-[#112240] transition-all transform active:scale-95">
              <Edit2 className="h-4 w-4" /> Editar Lançamento
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}