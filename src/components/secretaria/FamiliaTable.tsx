import { FileText, MoreHorizontal, Paperclip, Receipt, FileSpreadsheet, ClipboardList } from 'lucide-react'

export function FamiliaTable({ data }: { data: any[] }) {
  // Formata valor para Real R$
  const formatBRL = (val: any) => {
    const num = parseFloat(val) || 0
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  // Formata data ISO (AAAA-MM-DD) para Brasileiro (DD/MM/AAAA)
  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
      const [year, month, day] = dateStr.split('-')
      if (!year || !month || !day) return dateStr // Retorna original se não estiver no formato ISO
      return `${day}/${month}/${year}`
    } catch {
      return dateStr
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 whitespace-nowrap">Vencimento</th>
            <th className="px-4 py-3">Titular</th>
            <th className="px-4 py-3">Fornecedor</th>
            <th className="px-4 py-3">Descrição do Serviço</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Categoria</th>
            <th className="px-4 py-3">Valor</th>
            <th className="px-4 py-3">NF</th>
            <th className="px-4 py-3 whitespace-nowrap">Data Envio</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-center">Docs</th>
            <th className="px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={12} className="px-4 py-10 text-center text-gray-400">
                Aguardando importação de dados...
              </td>
            </tr>
          ) : (
            data.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-600">
                  {formatDateBR(item.vencimento)}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900">{item.titular}</td>
                <td className="px-4 py-3">{item.fornecedor}</td>
                <td className="px-4 py-3 max-w-xs truncate" title={item.descricao_servico}>
                  {item.descricao_servico}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{item.tipo}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.categoria}</td>
                <td className="px-4 py-3 font-bold text-[#1e3a8a] whitespace-nowrap">
                  {formatBRL(item.valor)}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{item.nota_fiscal || '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                  {formatDateBR(item.data_envio)}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${
                    item.status === 'Pago' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {item.status || 'Pendente'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1.5 text-gray-400">
                    {item.recibo && <Receipt className="w-4 h-4 hover:text-blue-600 cursor-pointer" title="Recibo" />}
                    {item.boleto && <FileText className="w-4 h-4 hover:text-blue-600 cursor-pointer" title="Boleto" />}
                    {item.os && <ClipboardList className="w-4 h-4 hover:text-blue-600 cursor-pointer" title="O.S." />}
                    {item.comprovante && <Paperclip className="w-4 h-4 hover:text-blue-600 cursor-pointer" title="Comprovante" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="p-1 hover:bg-gray-100 rounded text-gray-400 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
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