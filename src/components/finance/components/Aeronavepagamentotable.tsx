interface PagamentoTableProps {
  data: any[];
  loading: boolean;
  onRowClick: (item: any) => void;
}

export function AeronavePagamentoTable({ data, loading, onRowClick }: PagamentoTableProps) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    try {
      if (dateString.includes('/') && dateString.split('/')[0].length <= 2) {
        return dateString;
      }
      
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString;

      const adjustedDate = new Date(date.getTime() + Math.abs(date.getTimezoneOffset() * 60000));
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
      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nenhum pagamento encontrado</p>
    </div>
  )

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-separate border-spacing-y-2 px-4">
        <thead>
          <tr className="text-[#112240]">
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">ID</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Emissão</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Vencimento</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Tipo</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Devedor</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest">Descrição</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-right">Valor Bruto</th>
            <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-right">Valor Líquido</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item: any) => (
            <tr 
              key={item.id} 
              onClick={() => onRowClick(item)}
              className="group bg-white hover:bg-blue-50/40 border border-gray-100 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <td className="px-4 py-4 text-[10px] font-black text-blue-600/60 first:rounded-l-xl uppercase tracking-widest">
                #{String(item.index_id || 0).padStart(6, '0')}
              </td>
              <td className="px-4 py-4 text-sm font-semibold text-gray-600">
                {formatDate(item.emissao)}
              </td>
              <td className="px-4 py-4 text-sm font-semibold text-gray-600">
                {formatDate(item.vencimento)}
              </td>
              <td className="px-4 py-4 text-sm font-bold text-[#1e3a8a]">{item.tipo}</td>
              <td className="px-4 py-4 text-sm font-semibold text-gray-700">{item.devedor}</td>
              <td className="px-4 py-4 text-sm font-medium text-gray-500 italic max-w-xs truncate">{item.descricao}</td>
              <td className="px-4 py-4 text-sm font-bold text-amber-600 text-right">
                {formatCurrency(item.valor_bruto)}
              </td>
              <td className="px-4 py-4 text-sm font-black text-emerald-600 text-right last:rounded-r-xl">
                {formatCurrency(item.valor_liquido_realizado)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}