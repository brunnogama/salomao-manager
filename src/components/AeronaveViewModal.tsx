import { X, Edit3, Trash2, Calendar, CreditCard, FileText, Printer, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AeronaveLancamento } from '../types/AeronaveTypes'

interface AeronaveViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: AeronaveLancamento | null;
  itemsGroup?: AeronaveLancamento[]; // Novo: Lista de itens caso seja agrupado
  onEdit: (item: AeronaveLancamento) => void;
  onDelete: () => void;
}

export function AeronaveViewModal({ 
  isOpen, 
  onClose, 
  item, 
  itemsGroup = [], 
  onEdit, 
  onDelete 
}: AeronaveViewModalProps) {
  if (!isOpen || !item) return null

  const isGroup = itemsGroup && itemsGroup.length > 0
  const isMissao = item.origem === 'missao'

  const formatMoney = (val: number | undefined | null) => 
    val ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val) : 'R$ 0,00'

  const formatDate = (val: string | undefined | null) => {
    if (!val) return '-'
    const date = new Date(val)
    const userTimezoneOffset = date.getTimezoneOffset() * 60000
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date.getTime() + userTimezoneOffset))
  }

  // Cálculo de divergência para faturas agrupadas
  const totalItens = isGroup ? itemsGroup.reduce((acc, curr) => acc + (Number(curr.valor_pago) || 0), 0) : 0
  const valorTotalDoc = Number(item.valor_total_doc) || 0
  const temDivergencia = isGroup && Math.abs(totalItens - valorTotalDoc) > 0.01
  const diferenca = valorTotalDoc - totalItens

  const handlePrint = () => {
    window.print()
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

  const InfoRow = ({ label, value, highlight = false }: { label: string, value: string | number | undefined | null, highlight?: boolean }) => (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-[#1e3a8a]' : 'text-gray-700'}`}>
        {value || '-'}
      </span>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white">
      <div id="printable-modal" className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 print:shadow-none print:max-h-none print:rounded-none">
        
        {/* Header */}
        <div className={`px-6 py-5 border-b border-gray-100 flex items-center justify-between ${isMissao ? 'bg-blue-50/50' : 'bg-emerald-50/50'} print:bg-white print:border-b-2`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${isMissao ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'} print:border`}>
                {isGroup ? 'Fatura Agrupada' : (isMissao ? 'Missão' : 'Fixa')}
              </span>
              <span className="text-[10px] font-bold text-gray-400">
                DOC: {item.doc_fiscal} | Nº: {item.numero_doc || '-'}
              </span>
            </div>
            <h2 className="text-xl font-black text-[#112240] tracking-tight">
              {isGroup ? `Relatório de Itens - Fatura ${item.numero_doc}` : (isMissao ? (item.nome_missao || 'Sem Nome') : item.descricao)}
            </h2>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button 
              onClick={handlePrint}
              className="p-2 bg-white rounded-lg text-gray-500 hover:text-[#1e3a8a] border border-gray-100 shadow-sm transition-all"
              title="Imprimir / Salvar PDF"
            >
              <Printer className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-600 shadow-sm transition-all">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar print:overflow-visible">
          
          {isGroup ? (
            /* VISUALIZAÇÃO AGRUPADA (ITENS DA FATURA) */
            <section className="space-y-4">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <h3 className="text-xs font-bold text-gray-500 uppercase">Relação de Itens</h3>
                </div>
                <div className="flex gap-6">
                  <div className="text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Soma dos Itens</span>
                    <p className="text-sm font-bold text-gray-600">{formatMoney(totalItens)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Total da Fatura</span>
                    <p className="text-lg font-black text-[#1e3a8a]">{formatMoney(valorTotalDoc)}</p>
                  </div>
                </div>
              </div>

              {temDivergencia && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 print:bg-white print:border-amber-500">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-black uppercase">Atenção: Divergência de Valores</p>
                    <p className="font-medium">A soma dos itens não corresponde ao total da fatura. Diferença: <span className="font-bold">{formatMoney(diferenca)}</span></p>
                  </div>
                </div>
              )}
              
              <div className="overflow-hidden border border-gray-100 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3">ID Missão</th>
                      <th className="px-4 py-3">Missão</th>
                      <th className="px-4 py-3">Fornecedor</th>
                      <th className="px-4 py-3">Tipo / Descrição</th>
                      <th className="px-4 py-3 text-right">Valor Pago</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {itemsGroup.map((subItem) => (
                      <tr key={subItem.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-bold text-gray-500">
                          {subItem.id_missao ? `#${subItem.id_missao}` : '-'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-700">
                          {subItem.nome_missao || 'Despesa Fixa'}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-600">
                          {subItem.fornecedor || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-[#1e3a8a] text-[11px] uppercase">{subItem.tipo}</p>
                          <p className="text-gray-500 text-xs">{subItem.descricao}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-gray-700">
                          {formatMoney(subItem.valor_pago)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                 <InfoRow label="Observação Geral" value={item.observacao} />
              </div>
            </section>
          ) : (
            /* VISUALIZAÇÃO INDIVIDUAL ORIGINAL */
            <>
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

              <section>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Doc. Fiscal" value={item.doc_fiscal} />
                  <InfoRow label="Número Doc" value={item.numero_doc} />
                </div>
                <div className="mt-4">
                  <InfoRow label="Observações" value={item.observacao} />
                </div>
              </section>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center print:hidden">
          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <Trash2 className="h-4 w-4" /> Excluir
          </button>

          {!isGroup && (
            <button 
              onClick={() => onEdit(item)}
              className="flex items-center gap-2 px-6 py-2 bg-[#1e3a8a] text-white hover:bg-[#112240] rounded-lg text-xs font-bold uppercase tracking-widest shadow-md transition-all active:scale-95"
            >
              <Edit3 className="h-4 w-4" /> Editar
            </button>
          )}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #printable-modal, #printable-modal * { visibility: visible; }
          #printable-modal { position: absolute; left: 0; top: 0; width: 100%; }
          .custom-scrollbar { overflow: visible !important; }
        }
      `}} />
    </div>
  )
}