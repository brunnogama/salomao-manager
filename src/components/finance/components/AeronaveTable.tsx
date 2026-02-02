interface AeronaveTableProps {
  data: any[];
  loading: boolean;
  onRowClick: (item: any) => void;
}

export function AeronaveTable({ data, loading, onRowClick }: AeronaveTableProps) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  // Formatação de data nativa para evitar dependência de 'date-fns'
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      // Adiciona ajuste de fuso horário para evitar que a data mude para o dia anterior
      const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      return new Intl.DateTimeFormat('pt-BR').format(adjustedDate)
    } catch (e) {
      return dateString
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center p-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div>
    </div>
  )

  if (!data || data.length === 0) return (
    <div className="p-20 text-center">
      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nenhum registro encontrado</p>
    </div>
  )

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-separate border-spacing-y-2 px-4">
        <thead>
          <tr className="text-[#112240]">
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Aeronave</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Data</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Destino</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Fornecedor</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Faturado CNPJ</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Previsto</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Pago</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-right">Data Pgto</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item: any) => (
            <tr 
              key={item.id} 
              onClick={() => onRowClick(item)}
              className="group bg-white hover:bg-blue-50/40 border border-gray-100 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <td className="px-4 py-4 text-sm font-semibold text-gray-600 first:rounded-l-xl">{item.aeronave}</td>
              <td className="px-4 py-4 text-sm font-semibold text-gray-600">
                {formatDate(item.data)}
              </td>
              <td className="px-4 py-4 text-sm font-medium text-gray-500">{item.localidade_destino}</td>
              <td className="px-4 py-4 text-sm font-bold text-[#1e3a8a]">{item.fornecedor}</td>
              <td className="px-4 py-4 text-sm font-bold text-orange-600">{formatCurrency(item.faturado_cnpj)}</td>
              <td className="px-4 py-4 text-sm font-bold text-gray-400">{formatCurrency(item.valor_previsto)}</td>
              <td className="px-4 py-4 text-sm font-black text-emerald-600">
                {formatCurrency(item.valor_pago)}
              </td>
              <td className="px-4 py-4 text-sm font-semibold text-gray-500 text-right last:rounded-r-xl">
                {formatDate(item.data_pagamento)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}