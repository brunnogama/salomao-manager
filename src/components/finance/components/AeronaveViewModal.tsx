import { X, Edit2, Trash2, Plane, Calendar, MapPin, DollarSign, Info, FolderSearch } from 'lucide-react'
import { AeronaveMenuSelector } from './AeronaveMenuSelector' // Reutilizando o componente de menu suspenso gerenciável

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

  // Função para formatar data para o padrão Brasil DD/MM/AAAA
  const formatDateBR = (dateString: string) => {
    if (!dateString) return '---'
    try {
      // Caso a data venha no formato YYYY-MM-DD do banco
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
    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-3.5 w-3.5 text-${color}-600`} />
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-sm font-bold text-[#112240]">{value || '---'}</p>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col animate-in zoom-in duration-300 max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <Plane className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#112240] tracking-tight leading-none">Detalhes do Lançamento</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Gestão da Aeronave</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-8 overflow-y-auto custom-scrollbar space-y-8">
          
          {/* Seção 1: Operacional */}
          <div>
            <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <Info className="h-4 w-4" /> Informações Operacionais
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DataField icon={Plane} label="Aeronave" value={item.aeronave} />
              <DataField icon={Calendar} label="Data do Voo" value={formatDateBR(item.data)} />
              <DataField icon={MapPin} label="Localidade/Destino" value={item.localidade_destino} />
              <DataField icon={Edit2} label="Tripulação" value={item.tripulacao} />
              <DataField icon={Info} label="Despesa" value={item.despesa} />
              <DataField icon={Edit2} label="Fornecedor" value={item.fornecedor} color="indigo" />
            </div>
          </div>

          {/* Seção 2: Financeiro */}
          <div>
            <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Dados Financeiros
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <DataField icon={DollarSign} label="Previsto Total" value={formatCurrency(item.valor_previsto)} color="emerald" />
              <DataField icon={DollarSign} label="Extra" value={formatCurrency(item.valor_extra)} color="emerald" />
              <DataField icon={DollarSign} label="Pago" value={formatCurrency(item.valor_pago)} color="emerald" />
              <DataField icon={DollarSign} label="Faturado CNPJ" value={formatCurrency(item.faturado_cnpj)} color="emerald" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <DataField icon={Calendar} label="Vencimento" value={formatDateBR(item.data_vencimento)} color="orange" />
              <DataField icon={Calendar} label="Data Pgto" value={formatDateBR(item.data_pagamento)} color="emerald" />
            </div>
          </div>

          {/* Seção 3: GED (Gestão Eletrônica de Documentos) */}
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-[11px] font-black text-orange-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <FolderSearch className="h-4 w-4" /> Gestão de Documentos (GED)
            </h4>
            <div className="bg-gray-50/50 p-6 rounded-[1.5rem] border border-gray-100">
              <div className="max-w-xs">
                <AeronaveMenuSelector 
                  label="Tipo de Documento Anexo"
                  value={item.tipo_documento || ''}
                  onChange={() => {}} // Apenas visualização neste modal, edição no modal de form
                />
              </div>
              <p className="text-[9px] text-gray-400 font-bold uppercase mt-4 tracking-widest">
                * Os documentos físicos e digitais estão vinculados via ID: {item.id?.split('-')[0]}
              </p>
            </div>
          </div>

          {/* Observações */}
          {item.observacao && (
            <div className="bg-blue-50/30 p-6 rounded-[1.5rem] border border-blue-100">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-2">Observações</span>
              <p className="text-sm font-semibold text-gray-600 leading-relaxed italic">"{item.observacao}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-50 bg-gray-50/30 flex justify-between items-center">
          <button 
            onClick={() => onDelete(item)}
            className="flex items-center gap-2 px-6 py-3 text-red-500 hover:bg-red-50 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Trash2 className="h-4 w-4" /> Excluir Registro
          </button>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-3 text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Fechar
            </button>
            <button 
              onClick={() => onEdit(item)}
              className="flex items-center gap-2 px-8 py-3 bg-[#1e3a8a] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-[#112240] transition-all"
            >
              <Edit2 className="h-4 w-4" /> Editar Lançamento
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}