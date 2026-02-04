import { useMemo, useEffect, useState } from 'react'
import { TrendingUp, BarChart3, PieChart, Calendar, TrendingDown } from 'lucide-react'

interface DashboardProps {
  data: any[];
  onMissionClick?: (data: string, destino: string) => void;
  onResetFilter?: () => void;
  selectedYear?: string;
  onYearChange?: (year: string) => void;
}

// Funções utilitárias movidas para fora para evitar erros de inicialização e performance
const formatMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split('-')
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${months[parseInt(month) - 1]}/${year.slice(2)}`
}

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

export function AeronaveDashboard({ data, onMissionClick, onResetFilter, selectedYear = 'total', onYearChange }: DashboardProps) {
  const [localSelectedYear, setLocalSelectedYear] = useState<string>(selectedYear)

  useEffect(() => {
    if (onResetFilter) {
      onResetFilter();
    }
  }, [onResetFilter]);

  useEffect(() => {
    setLocalSelectedYear(selectedYear)
  }, [selectedYear])

  const handleYearChange = (year: string) => {
    setLocalSelectedYear(year)
    if (onYearChange) {
      onYearChange(year)
    }
  }

  const filteredByYear = useMemo(() => {
    if (localSelectedYear === 'total') return data
    return data.filter(item => {
      if (!item.data) return false
      const year = item.data.split('-')[0]
      return year === localSelectedYear
    })
  }, [data, localSelectedYear])

  const stats = useMemo(() => {
    const totalPaid = filteredByYear.reduce((acc, curr) => acc + (Number(curr.valor_pago) || 0), 0)
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

    // DADOS MENSAIS para o gráfico
    const monthlyData: { [key: string]: number } = {}
    filteredByYear.forEach(item => {
      if (item.data) {
        const [year, month] = item.data.split('-')
        const monthKey = `${year}-${month}`
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (Number(item.valor_pago) || 0)
      }
    })

    // Ordenar meses cronologicamente
    const sortedMonthlyData = Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, value]) => ({
        month,
        value,
        label: formatMonthLabel(month)
      }))

    return {
      totalPaid,
      totalFlights,
      missions: Object.values(missionsMap).sort((a: any, b: any) => b.data.localeCompare(a.data)),
      expenses: Object.entries(expenseMap).sort((a: any, b: any) => b[1] - a[1]),
      suppliers: Object.entries(supplierMap).sort((a: any, b: any) => b[1] - a[1]).slice(0, 15),
      monthlyData: sortedMonthlyData
    }
  }, [filteredByYear])

  // Calcular altura relativa para o gráfico
  const maxMonthlyValue = Math.max(...stats.monthlyData.map(d => d.value), 1)

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen animate-in fade-in duration-500">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRÁFICO DE COLUNAS MENSAL */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-8">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-black text-[#112240] uppercase tracking-[0.15em] flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-blue-600" /> Gastos Mensais
            </h4>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Geral</p>
              <p className="text-xl font-black text-blue-600">{formatCurrency(stats.totalPaid)}</p>
            </div>
          </div>

          <div className="relative h-64 flex items-end gap-3 overflow-x-auto custom-scrollbar pb-2">
            {stats.monthlyData.map((item) => {
              const height = (item.value / maxMonthlyValue) * 100
              
              return (
                <div key={item.month} className="relative flex-shrink-0 group flex flex-col justify-end" style={{ width: '70px' }}>
                  {/* Valor no topo da coluna */}
                  <div className="text-[9px] font-black text-blue-600 text-center mb-2 opacity-100 transition-opacity">
                    {formatCurrency(item.value).replace('R$', '').trim()}
                  </div>

                  <div className="relative h-full flex flex-col justify-end items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-300 group-hover:from-blue-700 group-hover:to-blue-500 relative"
                      style={{ height: `${height}%` }}
                    >
                      {/* Tooltip ao hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        <div className="bg-[#112240] text-white px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                          <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">{item.label}</p>
                          <p className="text-xs font-black">{formatCurrency(item.value)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Label do mês */}
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-3 text-center leading-tight">
                      {item.label}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="h-px bg-gray-100 w-full mt-2" />
        </div>

        {/* Card Despesas por Tipo (Lado do gráfico mensal) */}
        <div className="lg:col-span-4 bg-[#112240] p-8 rounded-[2rem] shadow-xl text-white h-auto flex flex-col">
          <h4 className="text-sm font-black text-blue-300 uppercase tracking-[0.15em] mb-6 flex items-center gap-2">
            <PieChart className="h-4 w-4" /> Despesas por Tipo
          </h4>
          <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1">
            {stats.expenses.map(([name, value]: any) => (
              <div key={name} className="flex items-center justify-between group cursor-default gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:scale-150 transition-transform flex-shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-300 break-words">{name}</span>
                </div>
                <span className="text-xs font-black whitespace-nowrap">{formatCurrency(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LADO ESQUERDO: Totais por Missão */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[740px]">
          <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
            <h4 className="text-sm font-black text-[#112240] uppercase tracking-[0.15em] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" /> Totais por Missão
            </h4>
            
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1 border border-gray-200">
              <Calendar className="h-3.5 w-3.5 text-gray-400 ml-2" />
              <button
                onClick={() => handleYearChange('total')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  localSelectedYear === 'total' 
                    ? 'bg-[#1e3a8a] text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Total
              </button>
              <button
                onClick={() => handleYearChange('2026')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  localSelectedYear === '2026' 
                    ? 'bg-[#1e3a8a] text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                2026
              </button>
              <button
                onClick={() => handleYearChange('2025')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  localSelectedYear === '2025' 
                    ? 'bg-[#1e3a8a] text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                2025
              </button>
            </div>
          </div>
          
          <div className="px-8 py-3 bg-blue-50/30 border-b border-blue-100/50">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              {filteredByYear.length} Lançamentos {localSelectedYear !== 'total' && `em ${localSelectedYear}`}
            </span>
          </div>

          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">
                <tr>
                  <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Missão</th>
                  <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Data</th>
                  <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Previsto</th>
                  <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Pago</th>
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
                      <span className="text-sm font-black text-[#112240] uppercase truncate block max-w-[220px]">
                        {m.missao}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-bold text-gray-600">{formatDate(m.data)}</span>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-blue-600 text-right">{formatCurrency(m.previsto)}</td>
                    <td className="px-8 py-4 text-sm font-black text-emerald-600 text-right">{formatCurrency(m.pago)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* LADO DIREITO: Principais Fornecedores (Aumentado) */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm h-[740px] flex flex-col">
          <h4 className="text-sm font-black text-[#112240] uppercase tracking-[0.15em] mb-6 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" /> Principais Fornecedores
          </h4>
          <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1 pr-2">
            {stats.suppliers.map(([name, value]: any) => (
              <div key={name} className="space-y-1.5">
                <div className="flex justify-between items-center gap-3">
                  <span className="text-xs font-black text-gray-500 uppercase break-words">{name}</span>
                  <span className="text-xs font-black text-[#112240] whitespace-nowrap">{formatCurrency(value)}</span>
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

      </div>
    </div>
  )
}