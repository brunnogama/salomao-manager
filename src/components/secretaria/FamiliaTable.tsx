import { Eye, FileText, Calendar, User, Tag } from 'lucide-react'

interface FamiliaTableProps {
  data: any[]
  onItemClick?: (item: any) => void
}

export function FamiliaTable({ data, onItemClick }: FamiliaTableProps) {
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
      <table className="w-full text-left border-separate border-spacing-y-2 px-4">
        <thead>
          <tr className="text-[#112240]">
            <th className="px-6 py-4 text-[12px] font-black uppercase tracking-[0.2em]">Vencimento</th>
            <th className="px-6 py-4 text-[12px] font-black uppercase tracking-[0.2em]">Fornecedor</th>
            <th className="px-6 py-4 text-[12px] font-black uppercase tracking-[0.2em]">Descrição</th>
            <th className="px-6 py-4 text-[12px] font-black uppercase tracking-[0.2em]">Titular</th>
            <th className="px-6 py-4 text-[12px] font-black uppercase tracking-[0.2em]">Categoria</th>
            <th className="px-6 py-4 text-[12px] font-black uppercase tracking-[0.2em]">Valor</th>
            <th className="px-6 py-4 text-[12px] font-black uppercase tracking-[0.2em]">Status</th>
            <th className="px-6 py-4 text-[12px] font-black uppercase tracking-[0.2em] text-right">Ações</th>
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
                onClick={() => onItemClick?.(item)}
                className="group bg-white hover:bg-blue-50/40 border border-gray-100 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                {/* Vencimento */}
                <td className="px-6 py-5 first:rounded-l-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-white transition-colors">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-[#112240]">
                      {formatDate(item.vencimento)}
                    </span>
                  </div>
                </td>

                {/* Fornecedor */}
                <td className="px-6 py-5">
                  <span className="text-sm font-bold text-[#112240] uppercase tracking-wider">{item.fornecedor}</span>
                </td>

                {/* Descrição */}
                <td className="px-6 py-5">
                  <span className="text-sm text-gray-600 line-clamp-1 font-medium">
                    {item.descricao_servico || "---"}
                  </span>
                </td>

                {/* Titular */}
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#112240]">{item.titular}</span>
                  </div>
                </td>

                {/* Categoria */}
                <td className="px-6 py-5">
                  <span className="inline-flex items-center px-3 py-1 bg-gray-100/80 rounded-xl text-[10px] font-black text-gray-600 uppercase tracking-widest group-hover:bg-white transition-colors border border-gray-200/50">
                    {item.categoria}
                  </span>
                </td>

                {/* Valor */}
                <td className="px-6 py-5 text-sm font-black text-[#1e3a8a]">
                  {formatCurrency(item.valor)}
                </td>

                {/* Status */}
                <td className="px-6 py-5">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                    item.status === 'Pago' 
                      ? 'bg-green-50 text-green-700 border-green-100' 
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Pago' ? 'bg-green-500' : 'bg-amber-500'}`} />
                    {item.status}
                  </div>
                </td>

                {/* Ações */}
                <td className="px-6 py-5 text-right last:rounded-r-xl">
                  <button className="p-2.5 bg-gray-100/50 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}