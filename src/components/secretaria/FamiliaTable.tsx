import { Eye } from 'lucide-react'

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
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vencimento</th>
            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Titular</th>
            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fornecedor</th>
            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Categoria</th>
            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Valor</th>
            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-10 text-center text-gray-500 text-sm">
                Nenhum registro encontrado.
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr 
                key={item.id} 
                onClick={() => onItemClick?.(item)}
                className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4 text-sm font-medium text-[#112240]">
                  {formatDate(item.vencimento)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {item.titular}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {item.fornecedor}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className="px-2 py-1 bg-gray-100 rounded-md text-[11px] font-medium text-gray-600">
                    {item.categoria}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-[#112240]">
                  {formatCurrency(item.valor)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                    item.status === 'Pago' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-gray-400 hover:text-[#1e3a8a] hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100">
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