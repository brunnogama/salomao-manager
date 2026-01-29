import { FileText, MoreHorizontal } from 'lucide-react'

export function FamiliaTable({ data }: { data: any[] }) {
  const formatBRL = (val: any) => {
    const num = parseFloat(val) || 0
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <table className="w-full text-sm text-left">
      <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b sticky top-0">
        <tr>
          <th className="px-4 py-3">Vencimento</th>
          <th className="px-4 py-3">Titular</th>
          <th className="px-4 py-3">Fornecedor</th>
          <th className="px-4 py-3">Descrição</th>
          <th className="px-4 py-3">Valor</th>
          <th className="px-4 py-3">Status</th>
          <th className="px-4 py-3">Ações</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {data.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-4 py-10 text-center text-gray-400">Aguardando importação de dados...</td>
          </tr>
        ) : (
          data.map((item, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 whitespace-nowrap">{item.vencimento}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{item.titular}</td>
              <td className="px-4 py-3">{item.fornecedor}</td>
              <td className="px-4 py-3 max-w-xs truncate">{item.descricao}</td>
              <td className="px-4 py-3 font-semibold text-[#1e3a8a]">{formatBRL(item.valor)}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${item.status === 'Pago' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {item.status || 'Pendente'}
                </span>
              </td>
              <td className="px-4 py-3">
                <button className="p-1 hover:bg-gray-100 rounded text-gray-400"><MoreHorizontal className="w-4 h-4" /></button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}