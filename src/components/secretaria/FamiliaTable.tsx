import { Edit2, Trash2, FileText, Calendar } from 'lucide-react'

interface FamiliaTableProps {
  data: any[]
  onEditClick: (item: any) => void
  onDeleteClick: (item: any) => void
}

export function FamiliaTable({ data, onEditClick, onDeleteClick }: FamiliaTableProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---'
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-separate border-spacing-y-2 px-2">
        <thead>
          <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
            <th className="px-4 py-4 text-[11px] font-black text-white uppercase tracking-[0.15em] whitespace-nowrap first:rounded-l-xl">Vencimento</th>
            <th className="px-4 py-4 text-[11px] font-black text-white uppercase tracking-[0.15em] whitespace-nowrap">Fornecedor</th>
            <th className="px-4 py-4 text-[11px] font-black text-white uppercase tracking-[0.15em]">Descrição</th>
            <th className="px-4 py-4 text-[11px] font-black text-white uppercase tracking-[0.15em] whitespace-nowrap">Titular</th>
            <th className="px-4 py-4 text-[11px] font-black text-white uppercase tracking-[0.15em] whitespace-nowrap">Categoria</th>
            <th className="px-4 py-4 text-[11px] font-black text-white uppercase tracking-[0.15em] whitespace-nowrap">Valor</th>
            <th className="px-4 py-4 text-[11px] font-black text-white uppercase tracking-[0.15em] whitespace-nowrap">Status</th>
            <th className="px-4 py-4 text-[11px] font-black text-white uppercase tracking-[0.15em] text-right last:rounded-r-xl">Ações</th>
          </tr>
        </thead>
        <tbody className="space-y-2">
          {data.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-12 text-center bg-gray-100/30 rounded-xl border-2 border-dashed border-gray-200">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-8 h-8 text-gray-300" />
                  <p className="text-sm font-bold text-gray-400">Nenhum registro encontrado na base.</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={item.id}
                className="group bg-white hover:bg-blue-50/40 border border-gray-100 rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                {/* Vencimento */}
                <td className="px-4 py-4 first:rounded-l-xl whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 transition-colors">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-semibold text-[#112240]">
                      {formatDate(item.vencimento)}
                    </span>
                  </div>
                </td>

                {/* Fornecedor */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-[#112240] uppercase tracking-tight">{item.fornecedor}</span>
                </td>

                {/* Descrição */}
                <td className="px-4 py-4 min-w-[200px]">
                  <span className="text-sm text-gray-600 line-clamp-1 font-medium">
                    {item.descricao_servico || "---"}
                  </span>
                </td>

                {/* Titular */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#112240]">{item.titular}</span>
                  </div>
                </td>

                {/* Categoria */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 bg-gray-100/80 rounded-lg text-[9px] font-black text-gray-600 uppercase tracking-wider transition-colors border border-gray-200/50">
                    {item.categoria}
                  </span>
                </td>

                {/* Valor */}
                <td className="px-4 py-4 text-sm font-black text-[#1e3a8a] whitespace-nowrap">
                  {formatCurrency(item.valor)}
                </td>

                {/* Status */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${item.status === 'Pago'
                      ? 'bg-green-50 text-green-700 border-green-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Pago' ? 'bg-green-500' : 'bg-amber-500'}`} />
                    {item.status}
                  </div>
                </td>

                {/* Ações */}
                <td className="px-4 py-4 text-right last:rounded-r-xl whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditClick(item); }}
                      className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-sm border border-blue-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteClick(item); }}
                      className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all shadow-sm border border-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}