import { useMemo, useEffect, useState } from 'react'
import { TrendingUp, BarChart3, PieChart, Calendar } from 'lucide-react'

interface DashboardProps {
  data: any[];
  onMissionClick?: (data: string, destino: string) => void;
  onResetFilter?: () => void;
}

export function AeronaveDashboard({ data, onMissionClick, onResetFilter }: DashboardProps) {
  const [selectedYear, setSelectedYear] = useState<string>('2026')

  // Resetar filtros ao montar o componente
  useEffect(() => {
    if (onResetFilter) {
      onResetFilter();
    }
  }, [onResetFilter]);

  // Filtrar dados por ano
  const filteredByYear = useMemo(() => {
    return data.filter(item => {
      if (!item.data) return false
      const year = item.data.split('-')[0]
      return year === selectedYear
    })
  }, [data, selectedYear])

  const stats = useMemo(() => {
    const totalPaid = filteredByYear.reduce((acc, curr) => acc + (Number(curr.valor_pago) || 0), 0)
    
    // Contagem única de missões baseada em data e destino
    const totalFlights = new Set(filteredByYear.map(item => `${item.data}-${item.localidade_destino}`)).size

    const missionsMap: any = {}
    filteredByYear.forEach(item => {
      const key = `${item.data} | ${item.localidade_destino}`
      if (!missionsMap[key]) {
        missionsMap[key] = { 
          key, 
          data: item.data, 
          destino: item.localidade_destino,
          missao: item.localidade_destino,
          pago: 0, 
          previsto: 0 
        }
      }
      missionsMap[key].pago += Number(item.valor_pago) || 0
      missionsMap[key].previsto += Number(item.valor_previsto) || 0
    })

    const expenseMap: any = {}
    filteredByYear.forEach(item => {
      const cat = item.despesa || 'Outros'
      expenseMap[cat] = (expenseMap[cat] || 0) + (Number(item.valor_pago) || 0)
    })

    const supplierMap: any = {}
    filteredByYear.forEach(item => {
      const sup = item.fornecedor || 'Não Informado'
      supplierMap[sup] = (supplierMap[sup] || 0) + (Number(item.valor_pago) || 0)
    })

    return {
      totalPaid,
      totalFlights,
      missions: Object.values(missionsMap).sort((a: any, b: any) => b.data.localeCompare(a.data)),
      expenses: Object.entries(expenseMap).sort((a: any, b: any) => b[1] - a[1]),
      suppliers: Object.entries(supplierMap).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10)
    }
  }, [filteredByYear])

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---'
    try {
      if (dateStr.includes('/')) return dateStr
      const [y, m, d] = dateStr.split('-')
      return `${d}/${m}/${y}`
    } catch { return dateStr }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen animate-in fade-in duration-500">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LADO ESQUERDO: Totais por Missão */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[740px]">
          <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
            <h4 className="text-[11px] font-black text-[#112240] uppercase tracking-[0.2em] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" /> Totais por Missão
            </h4>
            
            {/* Filtro de Ano */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1 border border-gray-200">
              <Calendar className="h-3.5 w-3.5 text-gray-400 ml-2" />
              <button
                onClick={() => setSelectedYear('2025')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedYear === '2025' 
                    ? 'bg-[#1e3a8a] text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                2025
              </button>
              <button
                onClick={() => setSelectedYear('2026')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedYear === '2026' 
                    ? 'bg-[#1e3a8a] text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                2026
              </button>
            </div>
          </div>
          
          <div className="px-8 py-3 bg-blue-50/30 border-b border-blue-100/50">
            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">
              {filteredByYear.length} Lançamentos em {selectedYear}
            </span>
          </div>

          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">
                <tr>
                  <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Missão</th>
                  <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Data</th>
                  <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Previsto</th>
                  <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.missions.map((m: any) => (
                  <tr 
                    key={m.key} 
                    onClick={() => {
                      if (onMissionClick) onMissionClick(m.data, m.destino);
                    }}
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-4">
                      <span className="text-[11px] font-black text-[#112240] uppercase truncate block max-w-[220px]">
                        {m.missao}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-bold text-gray-600">{formatDate(m.data)}</span>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-blue-600 text-right">{formatCurrency(m.previsto)}</td>
                    <td className="px-8 py-4 text-xs font-black text-emerald-600 text-right">{formatCurrency(m.pago)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* LADO DIREITO: Gráficos - ALTURA AUMENTADA */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm h-[360px] overflow-y-auto custom-scrollbar">
            <h4 className="text-[11px] font-black text-[#112240] uppercase tracking-[0.2em] mb-6 flex items-center gap-2 sticky top-0 bg-white pb-2">
              <BarChart3 className="h-4 w-4 text-blue-600" /> Principais Fornecedores
            </h4>
            <div className="space-y-5">
              {stats.suppliers.map(([name, value]: any) => (
                <div key={name} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-500 truncate max-w-[140px] uppercase">{name}</span>
                    <span className="text-[10px] font-black text-[#112240]">{formatCurrency(value)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${(value / (stats.totalPaid || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#112240] p-8 rounded-[2rem] shadow-xl text-white h-[360px] overflow-y-auto custom-scrollbar">
            <h4 className="text-[11px] font-black text-blue-300 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 sticky top-0 bg-[#112240] pb-2">
              <PieChart className="h-4 w-4" /> Despesas por Tipo
            </h4>
            <div className="space-y-4">
              {stats.expenses.map(([name, value]: any) => (
                <div key={name} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:scale-150 transition-transform" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-300">{name}</span>
                  </div>
                  <span className="text-[10px] font-black">{formatCurrency(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}