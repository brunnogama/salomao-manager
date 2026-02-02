import { format } from 'date-fns'

export function AeronaveTable({ data, loading }: any) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  if (loading) return <div className="p-10 text-center">Carregando...</div>

  return (
    <table className="w-full text-left border-separate border-spacing-y-2 px-4">
      <thead>
        <tr className="text-[#112240]">
          <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Tripulação</th>
          <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Aeronave</th>
          <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Data</th>
          <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Destino</th>
          <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Fornecedor</th>
          <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Previsto</th>
          <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-right">Pago</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item: any) => (
          <tr key={item.id} className="group bg-white hover:bg-blue-50/40 border border-gray-100 rounded-xl transition-all shadow-sm">
            <td className="px-4 py-4 text-sm font-bold text-[#112240] first:rounded-l-xl">{item.tripulacao}</td>
            <td className="px-4 py-4 text-sm font-semibold text-gray-600">{item.aeronave}</td>
            <td className="px-4 py-4 text-sm font-semibold text-gray-600">
              {item.data && format(new Date(item.data), 'dd/MM/yyyy')}
            </td>
            <td className="px-4 py-4 text-sm font-medium text-gray-500">{item.localidade_destino}</td>
            <td className="px-4 py-4 text-sm font-bold text-[#1e3a8a]">{item.fornecedor}</td>
            <td className="px-4 py-4 text-sm font-bold text-gray-400">{formatCurrency(item.valor_previsto)}</td>
            <td className="px-4 py-4 text-sm font-black text-emerald-600 text-right last:rounded-r-xl">{formatCurrency(item.valor_pago)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}