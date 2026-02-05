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
import { Filter, TrendingUp, Plane, DollarSign, Users, Calendar } from 'lucide-react'
import { AeronaveLancamento } from '../types/AeronaveTypes'

interface AeronaveDashboardProps {
  data: AeronaveLancamento[];
  onMissionClick?: (missionName: string) => void;
}

export function AeronaveDashboard({ data, onMissionClick }: AeronaveDashboardProps) {
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString())

  // --- Cores do Sistema ---
  const COLORS = {
    line: '#1e3a8a', // Azul Salomão Principal
    dot: '#ffffff',
    activeDot: '#f59e0b', // Amber
    text: '#64748b'
  }

  // --- Helpers de Formatação ---
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val)

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    const userTimezoneOffset = date.getTimezoneOffset() * 60000
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date.getTime() + userTimezoneOffset))
  }

  // --- Filtro de Ano ---
  const availableYears = useMemo(() => {
    const years = new Set(data.map(d => (d.data_pagamento || d.vencimento || '').split('-')[0]).filter(Boolean))
    const sorted = Array.from(years).sort().reverse()
    return sorted.length > 0 ? sorted : [new Date().getFullYear().toString()]
  }, [data])

  const dashboardData = useMemo(() => {
    return data.filter(item => {
      const dateStr = item.data_pagamento || item.vencimento || item.created_at || ''
      return dateStr.startsWith(yearFilter)
    })
  }, [data, yearFilter])

  // --- 1. Dados do Gráfico (Dinâmico: Meses com movimento) ---
  const chartData = useMemo(() => {
    // Agrupa por mês YYYY-MM
    const grouped = dashboardData.reduce((acc, item) => {
      const dateStr = item.data_pagamento || item.vencimento
      if (!dateStr) return acc
      
      const date = new Date(dateStr)
      // Ajuste timezone
      const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
      const key = `${adjustedDate.getFullYear()}-${String(adjustedDate.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = adjustedDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
      const monthIndex = adjustedDate.getMonth()

      if (!acc[key]) {
        acc[key] = { 
          name: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1), 
          fullDate: key, 
          value: 0,
          originalIndex: monthIndex // Para ordenação
        }
      }
      acc[key].value += (item.valor_pago || 0)
      return acc
    }, {} as Record<string, any>)

    // Converte para array e ordena cronologicamente
    return Object.values(grouped).sort((a, b) => {
      if (a.fullDate < b.fullDate) return -1
      if (a.fullDate > b.fullDate) return 1
      return 0
    })
  }, [dashboardData])

  // --- 2. Dados de Fornecedores (Todos, Ordenados) ---
  const suppliersList = useMemo(() => {
    const groups = dashboardData.reduce((acc, item) => {
      const name = item.fornecedor || 'Não Informado'
      if (!acc[name]) {
        acc[name] = { name, despesas: new Set(), total: 0 }
      }
      acc[name].total += (item.valor_pago || 0)
      if (item.despesa) acc[name].despesas.add(item.despesa) // Coleta tipos de despesa
      return acc
    }, {} as Record<string, any>)

    return Object.values(groups)
      .map(g => ({
        ...g,
        despesaLabel: Array.from(g.despesas).join(', ') || '-'
      }))
      .sort((a, b) => b.total - a.total)
  }, [dashboardData])

  // --- 3. Dados de Missões (Agrupados por Missão) ---
  const missionsList = useMemo(() => {
    const missions = dashboardData.filter(i => i.origem === 'missao')
    const groups = missions.reduce((acc, item) => {
      const id = item.id_missao || 'S/ID'
      const nome = item.nome_missao || `Missão ${id}`
      const key = `${id}-${nome}` // Chave única composta

      if (!acc[key]) {
        acc[key] = { 
          id, 
          nome, 
          data: item.data_missao, 
          total: 0 
        }
      }
      acc[key].total += (item.valor_pago || 0)
      // Atualiza data se encontrar (prioriza a primeira encontrada)
      if (!acc[key].data && item.data_missao) acc[key].data = item.data_missao
      return acc
    }, {} as Record<string, any>)

    return Object.values(groups).sort((a, b) => b.total - a.total)
  }, [dashboardData])

  // --- 4. Dados de Despesas Fixas (Agrupados por Fornecedor + Tipo) ---
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

  // --- Custom Tooltip Chart ---
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-xl rounded-xl min-w-[150px]">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-lg font-black text-[#1e3a8a]">{formatCurrency(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-full">
      
      {/* Header do Dashboard */}
      <div className="flex items-center justify-between mb-2">
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

      {/* 1. GRÁFICO DE LINHA (Dinâmico) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Evolução de Gastos (Mensal)</h4>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: COLORS.text, fontSize: 11, fontWeight: 700 }} 
                dy={15}
                padding={{ left: 20, right: 20 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: COLORS.text, fontSize: 11 }}
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
                animationDuration={1500}
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

      {/* 2. TABELA: TODOS OS FORNECEDORES */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[400px]">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
          <Users className="h-4 w-4 text-gray-400" />
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Ranking de Fornecedores</h4>
        </div>
        
        {/* Cabeçalho */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg mb-2">
          <div className="col-span-5 text-[10px] font-black uppercase text-gray-500">Fornecedor</div>
          <div className="col-span-4 text-[10px] font-black uppercase text-gray-500">Despesa</div>
          <div className="col-span-3 text-[10px] font-black uppercase text-gray-500 text-right">Total Pago</div>
        </div>

        {/* Lista com Scroll */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
          {suppliersList.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-4 px-4 py-3 border border-gray-100 rounded-xl hover:bg-blue-50/30 transition-colors items-center">
              <div className="col-span-5 flex items-center gap-3 overflow-hidden">
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-gray-100 text-[9px] font-bold text-gray-500 rounded">
                  {idx + 1}
                </span>
                <span className="text-xs font-bold text-gray-700 truncate" title={item.name}>{item.name}</span>
              </div>
              <div className="col-span-4 text-xs font-medium text-gray-500 truncate" title={item.despesaLabel}>
                {item.despesaLabel}
              </div>
              <div className="col-span-3 text-xs font-black text-[#1e3a8a] text-right">
                {formatCurrency(item.total)}
              </div>
            </div>
          ))}
          {suppliersList.length === 0 && (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs">Nenhum dado disponível</div>
          )}
        </div>
      </div>

      {/* 3. ROW DUPLA: MISSÕES E DESPESAS FIXAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD ESQUERDA: RELAÇÃO DAS MISSÕES */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
            <Plane className="h-4 w-4 text-blue-600" />
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Relação de Missões</h4>
          </div>

          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 rounded-lg mb-2">
            <div className="col-span-6 text-[10px] font-black uppercase text-gray-500">Missão</div>
            <div className="col-span-3 text-[10px] font-black uppercase text-gray-500 text-center">Data</div>
            <div className="col-span-3 text-[10px] font-black uppercase text-gray-500 text-right">Total</div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
            {missionsList.map((missao, idx) => (
              <button 
                key={idx}
                onClick={() => onMissionClick && onMissionClick(missao.nome)}
                className="w-full grid grid-cols-12 gap-2 px-4 py-3 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all items-center text-left group"
              >
                <div className="col-span-6 text-xs font-bold text-gray-700 truncate group-hover:text-blue-700">
                  {missao.nome}
                </div>
                <div className="col-span-3 flex items-center justify-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-50 py-1 rounded">
                  <Calendar className="h-3 w-3" />
                  {formatDate(missao.data)}
                </div>
                <div className="col-span-3 text-xs font-black text-blue-600 text-right">
                  {formatCurrency(missao.total)}
                </div>
              </button>
            ))}
            {missionsList.length === 0 && (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs">Nenhuma missão no período</div>
            )}
          </div>
        </div>

        {/* CARD DIREITA: DESPESA FIXA (Ranking) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Despesas Fixas</h4>
          </div>

          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 rounded-lg mb-2">
            <div className="col-span-5 text-[10px] font-black uppercase text-gray-500">Fornecedor</div>
            <div className="col-span-4 text-[10px] font-black uppercase text-gray-500">Tipo</div>
            <div className="col-span-3 text-[10px] font-black uppercase text-gray-500 text-right">Total</div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
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
        </div>

      </div>
    </div>
  )
}