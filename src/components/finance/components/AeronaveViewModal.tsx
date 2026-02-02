import { X, Edit2, Trash2, Plane, Calendar, MapPin, DollarSign, Info, FolderSearch, Upload } from 'lucide-react'
import { AeronaveMenuSelector } from './AeronaveMenuSelector'

interface AeronaveViewModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
}

export function AeronaveViewModal({ item, isOpen, onClose, onEdit, onDelete }: AeronaveViewModalProps) {
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

  const DataField = ({ icon: Icon, label, value, color = "blue" }: any) => (
    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 h-full">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-3.5 w-3.5 text-${color}-600`} />
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-sm font-bold text-[#112240] break-words">{value || '---'}</p>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md animate-in fade-in duration-300">
      {/* Aumentado de max-w-4xl para max-w-6xl e removido max-h restritivo para evitar scroll */}
      <div className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="px-10 py-7 border-b border-gray-50 flex justify-between items-center bg-white flex-shrink-0">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-blue-50 rounded-2xl">
              <Plane className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-[#112240] tracking-tight leading-none">Detalhes do Lançamento</h3>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-2">Gestão da Aeronave</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all group">
            <X className="h-7 w-7 text-gray-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Content */}
        <div className="px-10 py-10 space-y-10 overflow-visible">
          
          {/* Seção 1: Operacional */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-3">
               <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Info className="h-4 w-4" /> Operacional
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <DataField icon={Plane} label="Aeronave" value={item.aeronave} />
                <DataField icon={Calendar} label="Data do Voo" value={formatDateBR(item.data)} />
                <DataField icon={MapPin} label="Trajeto" value={item.localidade_destino} />
              </div>
            </div>

            {/* Seção 2: Financeiro */}
            <div className="lg:col-span-5">
              <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Financeiro
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <DataField icon={DollarSign} label="Previsto Total" value={formatCurrency(item.valor_previsto)} color="emerald" />
                <DataField icon={DollarSign} label="Extra" value={formatCurrency(item.valor_extra)} color="emerald" />
                <DataField icon={DollarSign} label="Pago" value={formatCurrency(item.valor_pago)} color="emerald" />
                <DataField icon={DollarSign} label="Faturado CNPJ" value={formatCurrency(item.faturado_cnpj)} color="emerald" />
                <DataField icon={Calendar} label="Vencimento" value={formatDateBR(item.data_vencimento)} color="orange" />
                <DataField icon={Calendar} label="Data Pgto" value={formatDateBR(item.data_pagamento)} color="emerald" />
              </div>
            </div>

            {/* Seção 3: GED */}
            <div className="lg:col-span-4">
              <h4 className="text-[11px] font-black text-orange-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <FolderSearch className="h-4 w-4" /> Documentação (GED)
              </h4>
              <div className="bg-orange-50/30 p-6 rounded-[2rem] border border-orange-100/50 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <AeronaveMenuSelector 
                        label="Selecione o tipo de Despesa"
                        value={item.tipo_documento || ''}
                        onChange={() => {}} 
                      />
                    </div>
                    <button 
                      className="p-3 bg-white border border-orange-200 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                      title="Buscar PDF no computador"
                    >
                      <Upload className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-orange-100">
                  <p className="text-[10px] text-orange-700/60 font-bold uppercase tracking-widest leading-relaxed">
                    ID de Vínculo: <span className="text-[#112240]">{item.id?.split('-')[0]}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé Interno com Info e Observações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <DataField icon={Edit2} label="Fornecedor" value={item.fornecedor} color="indigo" />
              <DataField icon={Edit2} label="Responsável / Tripulação" value={item.tripulacao} color="indigo" />
            </div>
            {item.observacao && (
              <div className="bg-blue-50/30 p-6 rounded-[2rem] border border-blue-100 flex flex-col">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-3">Notas Internas</span>
                <p className="text-sm font-semibold text-gray-600 leading-relaxed italic">"{item.observacao}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-7 border-t border-gray-50 bg-gray-50/50 flex justify-between items-center flex-shrink-0">
          <button 
            onClick={() => onDelete(item)}
            className="flex items-center gap-3 px-8 py-4 text-red-500 hover:bg-red-50 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
          >
            <Trash2 className="h-5 w-5" /> Excluir Lançamento
          </button>

          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="px-8 py-4 text-gray-400 hover:text-gray-600 text-[11px] font-black uppercase tracking-widest transition-all"
            >
              Fechar
            </button>
            <button 
              onClick={() => onEdit(item)}
              className="flex items-center gap-3 px-10 py-4 bg-[#1e3a8a] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-[#112240] transition-all transform active:scale-95"
            >
              <Edit2 className="h-5 w-5" /> Editar Lançamento
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}