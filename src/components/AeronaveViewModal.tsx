import { X, Edit3, Trash2, Calendar, CreditCard, FileText } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { AeronaveLancamento } from '../types/AeronaveTypes'

interface AeronaveViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: AeronaveLancamento | null;
  onEdit: (item: AeronaveLancamento) => void;
  onDelete: () => void; // Callback para atualizar a lista após deletar
}

export function AeronaveViewModal({ isOpen, onClose, item, onEdit, onDelete }: AeronaveViewModalProps) {
  if (!isOpen || !item) return null

  const isMissao = item.origem === 'missao'

  // --- Helpers ---
  const formatMoney = (val: number | undefined | null) => 
    val ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val) : 'R$ 0,00'

  const formatDate = (val: string | undefined | null) => {
    if (!val) return '-'
    const date = new Date(val)
    const userTimezoneOffset = date.getTimezoneOffset() * 60000
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date.getTime() + userTimezoneOffset))
  }

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir este lançamento permanentemente?')) {
      const { error } = await supabase.from('aeronave_lancamentos').delete().eq('id', item.id)
      if (error) {
        alert('Erro ao excluir.')
      } else {
        onDelete()
        onClose()
      }
    }
  }

  // Componente interno para exibir campo-valor
  const InfoRow = ({ label, value, highlight = false }: { label: string, value: string | number | undefined | null, highlight?: boolean }) => (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-[#1e3a8a]' : 'text-gray-700'}`}>
        {value || '-'}
      </span>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className={`px-6 py-5 border-b border-gray-100 flex items-center justify-between ${isMissao ? 'bg-blue-50/50' : 'bg-emerald-50/50'}`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${isMissao ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {isMissao ? 'Missão' : 'Fixa'}
              </span>
              <span className="text-[10px] font-bold text-gray-400">ID: {String(item.id_missao || '').padStart(6, '0')}</span>
            </div>
            <h2 className="text-xl font-black text-[#112240] tracking-tight">
              {isMissao ? (item.nome_missao || 'Sem Nome') : item.descricao}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-600 shadow-sm transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Bloco 1: Detalhes Gerais */}
          <section>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
              <FileText className="h-4 w-4 text-gray-400" />
              <h3 className="text-xs font-bold text-gray-500 uppercase">Detalhes Gerais</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
              <InfoRow label="Aeronave" value={item.aeronave} />
              <InfoRow label="Tripulação" value={isMissao ? item.tripulacao : 'N/A'} />
              <InfoRow label="Data Missão" value={isMissao ? formatDate(item.data_missao) : 'N/A'} />
              
              <InfoRow label="Despesa" value={item.despesa} />
              <InfoRow label="Tipo" value={item.tipo} />
              <InfoRow label="Fornecedor" value={item.fornecedor} highlight />
              
              <div className="col-span-2 md:col-span-3">
                <InfoRow label="Descrição" value={item.descricao} />
              </div>
            </div>
          </section>

          {/* Bloco 2: Financeiro */}
          <section className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <h3 className="text-xs font-bold text-gray-500 uppercase">Financeiro</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-4">
              <InfoRow label="Vencimento" value={formatDate(item.vencimento)} />
              <div className="text-amber-600">
                <InfoRow label="Valor Previsto" value={formatMoney(item.valor_previsto)} />
              </div>
              
              <InfoRow label="Data Pagamento" value={formatDate(item.data_pagamento)} />
              <div className="text-emerald-600">
                <InfoRow label="Valor Pago" value={formatMoney(item.valor_pago)} />
              </div>

              {isMissao && (
                 <div className="col-span-2 md:col-span-4 mt-2 pt-2 border-t border-gray-200/50">
                    <InfoRow label="Faturado CNPJ Salomão" value={formatMoney(item.faturado_cnpj)} />
                 </div>
              )}
            </div>
          </section>

          {/* Bloco 3: Fiscal e Obs */}
          <section>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <InfoRow label="Doc. Fiscal" value={item.doc_fiscal} />
              </div>
              <div>
                <InfoRow label="Número Doc" value={item.numero_doc} />
              </div>
            </div>
            <div className="mt-4">
               <InfoRow label="Observações" value={item.observacao} />
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <Trash2 className="h-4 w-4" /> Excluir
          </button>

          <button 
            onClick={() => onEdit(item)}
            className="flex items-center gap-2 px-6 py-2 bg-[#1e3a8a] text-white hover:bg-[#112240] rounded-lg text-xs font-bold uppercase tracking-widest shadow-md transition-all active:scale-95"
          >
            <Edit3 className="h-4 w-4" /> Editar
          </button>
        </div>

      </div>
    </div>
  )
}