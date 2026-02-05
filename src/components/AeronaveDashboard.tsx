import { useMemo, useState } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts'
import { Filter, PieChart as PieIcon, TrendingUp } from 'lucide-react'
import { AeronaveLancamento } from '../types/AeronaveTypes'

interface AeronaveDashboardProps {
  data: AeronaveLancamento[];
}

export function AeronaveDashboard({ data }: AeronaveDashboardProps) {
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString())

  // --- Cores do Sistema ---
  const COLORS = {
    missao: '#1e3a8a', // Azul Salomão
    fixa: '#059669',   // Emerald
    bg: '#f8fafc',
    text: '#64748b'
  }

  const PIE_COLORS = ['#1e3a8a', '#3b82f6', '#059669', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1']

  // --- Filtro de Ano (Interno do Dashboard) ---
  // Filtramos os dados recebidos para garantir que o gráfico mostre o ano selecionado
  // (Caso o filtro global da página principal esteja vazio, usamos este. Se estiver preenchido, respeitamos o dataset)
  const dashboardData = useMemo(() => {
    return data.filter(item => {
      const dateStr = item.data_pagamento || item.vencimento || item.created_at || ''
      return dateStr.startsWith(yearFilter)
    })
  }, [data, yearFilter])

  // --- Processamento Gráfico 1: Evolução Mensal ---
  const monthlyData = useMemo(() => {
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ]

    const result = months.map(m => ({ name: m, missao: 0, fixa: 0, total: 0 }))

    dashboardData.forEach(item => {
      const dateStr = item.data_pagamento || item.vencimento
      if (!dateStr) return

      const date = new Date(dateStr)
      // Ajuste timezone básico
      const monthIndex = new Date(date.getTime() + date.getTimezoneOffset() * 60000).getMonth()
      
      const valor = item.valor_pago || 0

      if (item.origem === 'missao') {
        result[monthIndex].missao += valor
      } else {
        result[monthIndex].fixa += valor
      }
      result[monthIndex].total += valor
    })

    return result
  }, [dashboardData])

  // --- Processamento Gráfico 2: Distribuição por Tipo ---
  const typeData = useMemo(() => {
    const groups: Record<string, number> = {}

    dashboardData.forEach(item => {
      const tipo = item.tipo || 'Outros'
      const valor = item.valor_pago || 0
      groups[tipo] = (groups[tipo] || 0) + valor
    })

    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value) // Ordenar maior para menor
      .slice(0, 8) // Pegar top 8
  }, [dashboardData])

  // --- Processamento: Top Fornecedores ---
  const topSuppliers = useMemo(() => {
    const groups: Record<string, number> = {}
    dashboardData.forEach(item => {
      const supplier = item.fornecedor || 'Não informado'
      const valor = item.valor_pago || 0
      groups[supplier] = (groups[supplier] || 0) + valor
    })

    return Object.entries(groups)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
  }, [dashboardData])

  // --- Helpers ---
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val)

  const availableYears = useMemo(() => {
    const years = new Set(data.map(d => (d.data_pagamento || d.vencimento || '').split('-')[0]).filter(Boolean))
    return Array.from(years).sort().reverse()
  }, [data])

  // Se não houver dados no ano, adicionar o atual para não quebrar a UI
  if (!availableYears.includes(new Date().getFullYear().toString())) {
    availableYears.unshift(new Date().getFullYear().toString())
  }

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl text-xs">
          <p className="font-bold text-gray-700 mb-2 uppercase tracking-wide">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-500 font-medium capitalize">{entry.name}:</span>
              <span className="font-bold text-gray-800">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-full">
      
      {/* Header do Dashboard (Filtro de Ano) */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
            <TrendingUp className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-black text-[#112240] uppercase tracking-tight">Análise Financeira</h3>
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
          <Filter className="h-4 w-4 text-gray-400" />
          <select 
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer"
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRÁFICO 1: Evolução Mensal (Barras Empilhadas) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Fluxo de Caixa Mensal (Pago)</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: COLORS.text, fontSize: 10, fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: COLORS.text, fontSize: 10 }}
                  tickFormatter={(val) => `R$${val/1000}k`} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar 
                  dataKey="fixa" 
                  name="Despesas Fixas" 
                  stackId="a" 
                  fill={COLORS.fixa} 
                  radius={[0, 0, 4, 4]} 
                  barSize={32} 
                />
                <Bar 
                  dataKey="missao" 
                  name="Custo Missões" 
                  stackId="a" 
                  fill={COLORS.missao} 
                  radius={[4, 4, 0, 0]} 
                  barSize={32} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 2: Top Fornecedores (Lista Visual) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Top 5 Fornecedores</h4>
          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
            {topSuppliers.length > 0 ? topSuppliers.map(([name, value], idx) => (
              <div key={name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex-shrink-0 w-6 h-6 rounded bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-black">
                    {idx + 1}
                  </div>
                  <span className="text-xs font-bold text-gray-700 truncate" title={name}>{name}</span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-xs font-black text-[#1e3a8a]">{formatCurrency(value)}</span>
                   <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-[#1e3a8a]" 
                        style={{ width: `${(value / topSuppliers[0][1]) * 100}%` }} 
                      />
                   </div>
                </div>
              </div>
            )) : (
              <p className="text-xs text-gray-400 text-center py-10">Sem dados para o período</p>
            )}
          </div>
        </div>

        {/* GRÁFICO 3: Distribuição por Tipo (Donut) */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm h-[350px]">
          <div className="flex items-center gap-2 mb-2">
            <PieIcon className="h-4 w-4 text-gray-400" />
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Despesas por Categoria</h4>
          </div>
          <div className="h-full w-full relative -top-4">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

         {/* KPIs Rápidos */}
         <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
               <p className="text-[9px] font-black uppercase text-blue-400 mb-1">Total Missões (Ano)</p>
               <p className="text-xl font-black text-blue-700">
                  {formatCurrency(dashboardData.filter(i => i.origem === 'missao').reduce((acc, curr) => acc + (curr.valor_pago || 0), 0))}
               </p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
               <p className="text-[9px] font-black uppercase text-emerald-400 mb-1">Total Fixo (Ano)</p>
               <p className="text-xl font-black text-emerald-700">
                  {formatCurrency(dashboardData.filter(i => i.origem === 'fixa').reduce((acc, curr) => acc + (curr.valor_pago || 0), 0))}
               </p>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
               <p className="text-[9px] font-black uppercase text-amber-400 mb-1">A Pagar (Previsto)</p>
               <p className="text-xl font-black text-amber-700">
                  {formatCurrency(dashboardData.reduce((acc, curr) => {
                     // Lógica simples: Se não tem data de pagamento, conta o previsto
                     return !curr.data_pagamento ? acc + (curr.valor_previsto || 0) : acc
                  }, 0))}
               </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
               <p className="text-[9px] font-black uppercase text-purple-400 mb-1">Média Mensal</p>
               <p className="text-xl font-black text-purple-700">
                 {formatCurrency(dashboardData.reduce((acc, curr) => acc + (curr.valor_pago || 0), 0) / 12)}
               </p>
            </div>
         </div>

      </div>
    </div>
  )
}