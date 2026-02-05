import { useMemo, useState } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LabelList
} from 'recharts'
import { Filter, TrendingUp, Plane, DollarSign, Users, Calendar, AlertCircle, PieChart } from 'lucide-react'
import { AeronaveLancamento } from '../types/AeronaveTypes'

interface AeronaveDashboardProps {
  data: AeronaveLancamento[];
  onMissionClick?: (missionName: string) => void;
  filterOrigem?: 'todos' | 'missao' | 'fixa';
}

export function AeronaveDashboard({ data, onMissionClick, filterOrigem = 'todos' }: AeronaveDashboardProps) {
  const [yearFilter, setYearFilter] = useState<string>('all')

  const COLORS = {
    line: '#1e3a8a',
    dot: '#ffffff',
    activeDot: '#f59e0b',
    text: '#64748b'
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val)

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    const userTimezoneOffset = date.getTimezoneOffset() * 60000
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date.getTime() + userTimezoneOffset))
  }

  const availableYears = useMemo(() => {
    const years = new Set(data.map(d => (d.data_pagamento || d.vencimento || '').split('-')[0]).filter(Boolean))
    const sorted = Array.from(years).sort().reverse()
    return sorted.length > 0 ? sorted : [new Date().getFullYear().toString()]
  }, [data])

  const dashboardData = useMemo(() => {
    if (yearFilter === 'all') return data
    return data.filter(item => {
      const dateStr = item.data_pagamento || item.vencimento || item.created_at || ''
      return dateStr.startsWith(yearFilter)
    })
  }, [data, yearFilter])

  // --- 1. Gráfico ---
  const chartData = useMemo(() => {
    const validRecords = dashboardData.filter(item => 
      item.data_pagamento && (item.valor_pago || 0) > 0
    )

    const grouped = validRecords.reduce((acc, item) => {
      const dateStr = item.data_pagamento
      if (!dateStr) return acc
      
      const date = new Date(dateStr)
      const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
      const key = `${adjustedDate.getFullYear()}-${String(adjustedDate.getMonth() + 1).padStart(2, '0')}`
      
      const monthLabel = adjustedDate.toLocaleDateString('pt-BR', { 
        month: 'short', 
        year: yearFilter === 'all' ? '2-digit' : undefined 
      }).replace('.', '')
      
      if (!acc[key]) {
        acc[key] = { 
          name: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1), 
          fullDate: key, 
          value: 0
        }
      }
      acc[key].value += (item.valor_pago || 0)
      return acc
    }, {} as Record<string, any>)

    return Object.values(grouped)
      .filter(item => item.value > 0)
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate))
  }, [dashboardData, yearFilter])

  // --- 2. Fornecedores ---
  const suppliersList = useMemo(() => {
    const groups = dashboardData.reduce((acc, item) => {
      const name = item.fornecedor || 'Não Informado'
      if (!acc[name]) {
        acc[name] = { name, despesas: new Set(), total: 0 }
      }
      acc[name].total += (item.valor_pago || 0)
      if (item.despesa) acc[name].despesas.add(item.despesa)
      return acc
    }, {} as Record<string, any>)

    return Object.values(groups)
      .map(g => ({
        ...g,
        despesaLabel: Array.from(g.despesas).join(', ') || '-'
      }))
      .sort((a, b) => b.total - a.total)
  }, [dashboardData])

  // --- 3. Missões ---
  const missionsList = useMemo(() => {
    const missions = dashboardData.filter(i => i.origem === 'missao')
    const groups = missions.reduce((acc, item) => {
      const id = item.id_missao || 'S/ID'
      const nome = item.nome_missao || `Missão ${id}`
      const key = `${id}-${nome}`

      if (!acc[key]) {
        acc[key] = { id, nome, data: item.data_missao, total: 0 }
      }
      acc[key].total += (item.valor_pago || 0)
      if (!acc[key].data && item.data_missao) acc[key].data = item.data_missao
      return acc
    }, {} as Record<string, any>)

    return Object.values(groups).sort((a, b) => b.total - a.total)
  }, [dashboardData])

  // --- 4. Despesas Fixas ---
  const fixedExpensesList = useMemo(() => {
    const fixed = dashboardData.filter(i => i.origem === 'fixa')
    const groups = fixed.reduce((acc, item) => {
      const fornecedor = item.fornecedor || 'Não Informado'
      const tipo = item.tipo || 'Geral'
      const key = `${fornecedor}-${tipo}`

      if (!acc[key]) {
        acc[key] = { fornecedor, tipo, total: 0 }
      }
      acc[key].total += (item.valor_pago || 0)
      return acc
    }, {} as Record<string, any>)

    return Object.values(groups).sort((a, b) => b.total - a.total)
  }, [dashboardData])

  // --- 5. Pagamentos Pendentes ---
  const pendingPaymentsList = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const pending = dashboardData.filter(item => 
      item.vencimento && 
      (item.valor_previsto || 0) > 0 && 
      (!item.data_pagamento || item.data_pagamento >= today)
    )

    return pending
      .map(item => ({
        vencimento: item.vencimento,
        fornecedor: item.fornecedor || 'Não Informado',
        tipo: item.tipo || 'Outros',
        valor: item.valor_previsto || 0
      }))
      .sort((a, b) => (a.vencimento || '').localeCompare(b.vencimento || ''))
  }, [dashboardData])

  // --- 6. Top Categorias (Missão) ---
  const topMissionCategories = useMemo(() => {
    const data = dashboardData.filter(i => i.origem === 'missao')
    const groups = data.reduce((acc, item) => {
      const tipo = item.tipo || 'Outros'
      acc[tipo] = (acc[tipo] || 0) + (item.valor_pago || 0)
      return acc
    }, {} as Record<string, number>)

    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [dashboardData])

  // --- 7. Top Categorias (Fixa) ---
  const topFixedCategories = useMemo(() => {
    const data = dashboardData.filter(i => i.origem === 'fixa')
    const groups = data.reduce((acc, item) => {
      const tipo = item.tipo || 'Outros'
      acc[tipo] = (acc[tipo] || 0) + (item.valor_pago || 0)
      return acc
    }, {} as Record<string, number>)

    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [dashboardData])

  const handleMissionClick = (missionName: string) => {
    if (onMissionClick && typeof onMissionClick === 'function') {
      onMissionClick(missionName)
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-xl rounded-xl min-w-[150px] z-50">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-lg font-black text-[#1e3a8a]">{formatCurrency(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-full">
      
      {/* LINHA 1: GRÁFICO E RANKING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[450px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-black text-[#112240] uppercase tracking-widest">Análise Financeira</h4>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              <select 
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
              >
                <option value="all">Todos os Anos</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: COLORS.text, fontSize: 10, fontWeight: 700 }} 
                  dy={15}
                  interval={0}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: COLORS.text, fontSize: 10 }}
                  tickFormatter={(val) => `R$${val/1000}k`} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={COLORS.line} 
                  strokeWidth={3}
                  dot={{ r: 5, fill: COLORS.line, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8, fill: COLORS.activeDot, strokeWidth: 0 }}
                  animationDuration={800} 
                  animationEasing="ease-out"
                >
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    formatter={(val: number) => formatCurrency(val)} 
                    style={{ fill: '#1e3a8a', fontSize: '10px', fontWeight: 800 }} 
                    offset={15}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[450px]">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 shrink-0">
            <Users className="h-4 w-4 text-gray-400" />
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Ranking de Fornecedores</h4>
          </div>
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 rounded-lg mb-2 shrink-0">
            <div className="col-span-7 text-[10px] font-black uppercase text-gray-500">Fornecedor</div>
            <div className="col-span-5 text-[10px] font-black uppercase text-gray-500 text-right">Total</div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 min-h-0">
            {suppliersList.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 border border-gray-100 rounded-xl hover:bg-blue-50/30 transition-colors items-center">
                <div className="col-span-7 flex items-center gap-2 overflow-hidden">
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-gray-100 text-[9px] font-bold text-gray-500 rounded">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-gray-700 truncate" title={item.name}>{item.name}</span>
                </div>
                <div className="col-span-5 text-xs font-black text-[#1e3a8a] text-right">
                  {formatCurrency(item.total)}
                </div>
              </div>
            ))}
            {suppliersList.length === 0 && (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs">Nenhum dado disponível</div>
            )}
          </div>
        </div>
      </div>

      {/* LINHA 2: LISTAS DETALHADAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
        {/* CARD ESQUERDA: RELAÇÃO DAS MISSÕES */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
          {filterOrigem === 'fixa' ? (
            <>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 shrink-0">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Pagamentos Pendentes</h4>
              </div>
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 rounded-lg mb-2 shrink-0">
                <div className="col-span-3 text-[10px] font-black uppercase text-gray-500">Vencimento</div>
                <div className="col-span-4 text-[10px] font-black uppercase text-gray-500">Fornecedor</div>
                <div className="col-span-2 text-[10px] font-black uppercase text-gray-500">Tipo</div>
                <div className="col-span-3 text-[10px] font-black uppercase text-gray-500 text-right">Valor</div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 min-h-0">
                {pendingPaymentsList.length > 0 ? (
                  pendingPaymentsList.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 border border-gray-100 rounded-xl hover:bg-amber-50/30 transition-colors items-center">
                      <div className="col-span-3 text-[10px] font-semibold text-gray-600">
                        {formatDate(item.vencimento)}
                      </div>
                      <div className="col-span-4 text-xs font-bold text-gray-700 truncate" title={item.fornecedor}>
                        {item.fornecedor}
                      </div>
                      <div className="col-span-2">
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-100 truncate max-w-full">
                          {item.tipo}
                        </span>
                      </div>
                      <div className="col-span-3 text-xs font-black text-amber-600 text-right">
                        {formatCurrency(item.valor)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-emerald-600 gap-2">
                    <AlertCircle className="h-8 w-8" />
                    <p className="text-sm font-bold">Sem pendências</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 shrink-0">
                <Plane className="h-4 w-4 text-blue-600" />
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Relação de Missões</h4>
              </div>
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 rounded-lg mb-2 shrink-0">
                <div className="col-span-7 text-[10px] font-black uppercase text-gray-500">Missão</div>
                <div className="col-span-5 text-[10px] font-black uppercase text-gray-500 text-right">Total</div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 min-h-0">
                {missionsList.map((missao, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleMissionClick(missao.nome)}
                    className="w-full grid grid-cols-12 gap-2 px-4 py-3 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all items-center text-left group"
                  >
                    <div className="col-span-7 flex flex-col gap-0.5 overflow-hidden">
                      <span className="text-xs font-bold text-gray-700 truncate group-hover:text-blue-700">
                        {missao.nome}
                      </span>
                      <span className="text-[9px] font-medium text-gray-400 flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        {formatDate(missao.data)}
                      </span>
                    </div>
                    <div className="col-span-5 text-xs font-black text-blue-600 text-right">
                      {formatCurrency(missao.total)}
                    </div>
                  </button>
                ))}
                {missionsList.length === 0 && (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs">Nenhuma missão no período</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* CARD DIREITA: DESPESAS FIXAS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
          {filterOrigem === 'missao' ? (
            <>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 shrink-0">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Pagamentos Pendentes</h4>
              </div>
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 rounded-lg mb-2 shrink-0">
                <div className="col-span-3 text-[10px] font-black uppercase text-gray-500">Vencimento</div>
                <div className="col-span-4 text-[10px] font-black uppercase text-gray-500">Fornecedor</div>
                <div className="col-span-2 text-[10px] font-black uppercase text-gray-500">Tipo</div>
                <div className="col-span-3 text-[10px] font-black uppercase text-gray-500 text-right">Valor</div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 min-h-0">
                {pendingPaymentsList.length > 0 ? (
                  pendingPaymentsList.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 border border-gray-100 rounded-xl hover:bg-amber-50/30 transition-colors items-center">
                      <div className="col-span-3 text-[10px] font-semibold text-gray-600">
                        {formatDate(item.vencimento)}
                      </div>
                      <div className="col-span-4 text-xs font-bold text-gray-700 truncate" title={item.fornecedor}>
                        {item.fornecedor}
                      </div>
                      <div className="col-span-2">
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-100 truncate max-w-full">
                          {item.tipo}
                        </span>
                      </div>
                      <div className="col-span-3 text-xs font-black text-amber-600 text-right">
                        {formatCurrency(item.valor)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-emerald-600 gap-2">
                    <AlertCircle className="h-8 w-8" />
                    <p className="text-sm font-bold">Sem pendências</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 shrink-0">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Despesas Fixas</h4>
              </div>
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 rounded-lg mb-2 shrink-0">
                <div className="col-span-5 text-[10px] font-black uppercase text-gray-500">Fornecedor</div>
                <div className="col-span-4 text-[10px] font-black uppercase text-gray-500">Tipo</div>
                <div className="col-span-3 text-[10px] font-black uppercase text-gray-500 text-right">Total</div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 min-h-0">
                {fixedExpensesList.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 border border-gray-100 rounded-xl hover:bg-emerald-50/30 transition-colors items-center">
                    <div className="col-span-5 text-xs font-bold text-gray-700 truncate" title={item.fornecedor}>
                      {item.fornecedor}
                    </div>
                    <div className="col-span-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100 truncate max-w-full">
                        {item.tipo}
                      </span>
                    </div>
                    <div className="col-span-3 text-xs font-black text-emerald-600 text-right">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                ))}
                {fixedExpensesList.length === 0 && (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs">Nenhuma despesa fixa no período</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* LINHA 3: EVOLUÇÃO DE GASTOS POR TIPO (TOP 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TOP 5 CATEGORIAS - MISSÕES */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-auto">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
            <PieChart className="h-4 w-4 text-blue-600" />
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Maiores Gastos em Missões</h4>
          </div>
          <div className="space-y-3">
            {topMissionCategories.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-gray-700">{cat.name}</span>
                  <span className="font-black text-blue-600">{formatCurrency(cat.value)}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full" 
                    style={{ width: `${(cat.value / topMissionCategories[0].value) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {topMissionCategories.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Sem dados</p>
            )}
          </div>
        </div>

        {/* TOP 5 CATEGORIAS - FIXAS */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-auto">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
            <PieChart className="h-4 w-4 text-emerald-600" />
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Maiores Despesas Fixas</h4>
          </div>
          <div className="space-y-3">
            {topFixedCategories.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-gray-700">{cat.name}</span>
                  <span className="font-black text-emerald-600">{formatCurrency(cat.value)}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 rounded-full" 
                    style={{ width: `${(cat.value / topFixedCategories[0].value) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {topFixedCategories.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Sem dados</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}