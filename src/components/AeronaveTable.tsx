import { Loader2, AlertCircle } from 'lucide-react'
import { AeronaveLancamento } from '../types/AeronaveTypes'

interface AeronaveTableProps {
  data: AeronaveLancamento[];
  loading: boolean;
  onRowClick: (item: AeronaveLancamento) => void;
}

export function AeronaveTable({ data, loading, onRowClick }: AeronaveTableProps) {
  
  // --- Formatters ---
  const formatCurrency = (val: number | null | undefined) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    try {
      // Ajuste de timezone simples para evitar dia anterior
      const date = new Date(dateString)
      const userTimezoneOffset = date.getTimezoneOffset() * 60000
      const adjustedDate = new Date(date.getTime() + userTimezoneOffset)
      return new Intl.DateTimeFormat('pt-BR').format(adjustedDate)
    } catch (e) {
      return dateString
    }
  }

  const formatId = (id: number | null | undefined) => {
    if (!id) return '---'
    return String(id).padStart(6, '0')
  }

  // --- Render ---

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-[#1e3a8a] animate-spin mb-2" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando dados...</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-center">
        <div className="bg-gray-50 p-4 rounded-full mb-3">
          <AlertCircle className="h-6 w-6 text-gray-300" />
        </div>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nenhum lançamento encontrado</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto custom-scrollbar pb-4">
      <table className="w-full text-left border-separate border-spacing-y-2 px-4">
        <thead>
          <tr className="text-[#112240]">
            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest w-24">ID</th>
            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Data Missão</th>
            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Missão</th>
            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Despesa</th>
            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Tipo</th>
            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Fornecedor</th>
            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center">Pagamento</th>
            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-right">Valor Pago</th>
            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Tipo Documento</th>
            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest">Número</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const isMissao = item.origem === 'missao'

            return (
              <tr 
                key={item.id} 
                onClick={() => onRowClick(item)}
                className="group bg-white hover:bg-blue-50/40 border border-gray-100 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                {/* ID */}
                <td className="px-4 py-4 text-[11px] font-black text-blue-600/60 first:rounded-l-xl uppercase tracking-widest">
                  #{isMissao ? formatId(item.id_missao) : formatId(item.id_missao) /* Mantém ID se existir, ou --- */}
                </td>

                {/* Data Missão (NOVO) */}
                <td className="px-4 py-4 text-sm font-semibold text-gray-600">
                  {formatDate(item.data_missao)}
                </td>

                {/* Missão (N/A se for Despesa Fixa) */}
                <td className="px-4 py-4 text-sm font-semibold">
                  {isMissao ? (
                    <span className="text-[#1e3a8a]">{item.nome_missao || 'Sem Nome'}</span>
                  ) : (
                    <span className="text-gray-300 font-black text-[10px] tracking-widest select-none">N/A</span>
                  )}
                </td>

                {/* Despesa (Macro) */}
                <td className="px-4 py-4 text-sm font-medium text-gray-600">
                  {item.despesa || '-'}
                </td>

                {/* Tipo (Sub-categoria) */}
                <td className="px-4 py-4">
                  <span className={`inline-flex px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide border ${
                    item.origem === 'missao' 
                      ? 'bg-blue-50 text-blue-700 border-blue-100' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}>
                    {item.tipo || 'Geral'}
                  </span>
                </td>

                {/* Fornecedor */}
                <td className="px-4 py-4 text-sm font-semibold text-gray-700 max-w-[150px] truncate" title={item.fornecedor}>
                  {item.fornecedor || '-'}
                </td>

                {/* Data Pagamento */}
                <td className="px-4 py-4 text-sm font-medium text-gray-500 text-center">
                  {item.data_pagamento ? (
                    formatDate(item.data_pagamento)
                  ) : (
                    <span className="text-orange-400 text-[10px] font-bold uppercase">Pendente</span>
                  )}
                </td>

                {/* Valor Pago */}
                <td className="px-4 py-4 text-sm font-black text-right">
                  {item.valor_pago && item.valor_pago > 0 ? (
                     <span className="text-emerald-600">{formatCurrency(item.valor_pago)}</span>
                  ) : (
                     <span className="text-gray-300">-</span>
                  )}
                </td>

                {/* Tipo Documento */}
                <td className="px-4 py-4 text-sm font-medium text-gray-500">
                  {item.doc_fiscal || '-'}
                </td>

                {/* Número */}
                <td className="px-4 py-4 text-sm font-bold text-gray-700 last:rounded-r-xl">
                  {item.numero_doc || '-'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}