// Caminho do arquivo: AeronaveViewModal.tsx

import { useMemo, useEffect, useState } from 'react'
import { TrendingUp, BarChart3, PieChart, Calendar, TrendingDown, Receipt, DollarSign, Database } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart, LabelList } from 'recharts'

interface DashboardProps {
  data: any[];
  dataPagamentos: any[];
  onMissionClick?: (data: string, destino: string) => void;
  onResetFilter?: () => void;
  selectedYear?: string;
  onYearChange?: (year: string) => void;
  viewMode?: 'tudo' | 'despesas' | 'pagamentos';
  onViewModeChange?: (mode: 'tudo' | 'despesas' | 'pagamentos') => void;
}

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

export function AeronaveDashboard({ 
  data, 
  dataPagamentos = [],
  onMissionClick, 
  onResetFilter, 
  selectedYear = 'total', 
  onYearChange,
  viewMode = 'tudo',
  onViewModeChange
}: DashboardProps) {
  const [localSelectedYear, setLocalSelectedYear] = useState<string>(selectedYear)
  const [localViewMode, setLocalViewMode] = useState<'tudo' | 'despesas' | 'pagamentos'>(viewMode)

  useEffect(() => {
    if (onResetFilter) {
      onResetFilter();
    }
  }, [onResetFilter]);

  useEffect(() => {
    setLocalSelectedYear(selectedYear)
  }, [selectedYear])

  useEffect(() => {
    setLocalViewMode(viewMode)
  }, [viewMode])

  const handleYearChange = (year: string) => {
    setLocalSelectedYear(year)
    if (onYearChange) {
      onYearChange(year)
    }
  }

  const handleViewModeChange = (mode: 'tudo' | 'despesas' | 'pagamentos') => {
    setLocalViewMode(mode)
    if (onViewModeChange) {
      onViewModeChange(mode)
    }
  }

  const filteredByYear = useMemo(() => {
    let sourceData: any[] = []
    if (localViewMode === 'tudo') {
      sourceData = [...data, ...dataPagamentos]
    } else if (localViewMode === 'despesas') {
      sourceData = data
    } else {
      sourceData = dataPagamentos
    }
    
    if (localSelectedYear === 'total') return sourceData
    
    return sourceData.filter(item => {
      const dateField = item.data || item.emissao
      if (!dateField) return false
      const year = dateField.split('-')[0]
      return year === localSelectedYear
    })
  }, [data, dataPagamentos, localSelectedYear, localViewMode])

  const statsDespesas = useMemo(() => {
    const despesasData = localViewMode === 'tudo' ? data : (localViewMode === 'despesas' ? filteredByYear : [])
    const filteredDespesas = localSelectedYear === 'total' 
      ? despesasData 
      : despesasData.filter(item => item.data?.startsWith(localSelectedYear))

    const totalPaid = filteredDespesas.reduce((acc, curr) => acc + (Number(curr.valor_pago) || 0), 0)
    const totalFlights = new Set(filteredDespesas.map(item => `${item.data}-${item.localidade_destino}`)).size

    const missionsMap: any = {}
    filteredDespesas.forEach(item => {
      if (!item.data || !item.localidade_destino) return
      
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
    filteredDespesas.forEach(item => {
      const cat = item.despesa || 'Outros'
      expenseMap[cat] = (expenseMap[cat] || 0) + (Number(item.valor_pago) || 0)
    })

    const supplierMap: any = {}
    filteredDespesas.forEach(item => {
      const sup = item.fornecedor || 'Não Informado'
      supplierMap[sup] = (supplierMap[sup] || 0) + (Number(item.valor_pago) || 0)
    })

    const monthlyData: { [key: string]: number } = {}
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    if (localSelectedYear !== 'total') {
      const limitMonth = parseInt(localSelectedYear) === currentYear ? currentMonth : 12
      for (let i = 1; i <= limitMonth; i++) {
        const monthKey = `${localSelectedYear}-${String(i).padStart(2, '0')}`
        monthlyData[monthKey] = 0
      }
    } else {
      const startYear = 2025;
      const startMonth = 10;

      for (let y = startYear; y <= currentYear; y++) {
        const mStart = (y === startYear) ? startMonth : 1;
        const mEnd = (y === currentYear) ? currentMonth : 12;
        for (let m = mStart; m <= mEnd; m++) {
          const monthKey = `${y}-${String(m).padStart(2, '0')}`
          monthlyData[monthKey] = 0
        }
      }
    }

    filteredDespesas.forEach(item => {
      if (item.data) {
        const [year, month] = item.data.split('-')
        const monthKey = `${year}-${month}`
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (Number(item.valor_pago) || 0)
        }
      }
    })

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
  }, [data, filteredByYear, localSelectedYear, localViewMode])

  const statsPagamentos = useMemo(() => {
    const pagamentosBase = localViewMode === 'tudo' ? dataPagamentos : (localViewMode === 'pagamentos' ? filteredByYear : [])
    const pagamentosData = localSelectedYear === 'total'
      ? pagamentosBase
      : pagamentosBase.filter(item => item.emissao?.startsWith(localSelectedYear))
    
    const totalBruto = pagamentosData.reduce((acc, curr) => acc + (Number(curr.valor_bruto) || 0), 0)
    const totalLiquido = pagamentosData.reduce((acc, curr) => acc + (Number(curr.valor_liquido_realizado) || 0), 0)

    const tipoMap: any = {}
    pagamentosData.forEach(item => {
      const tipo = item.tipo || 'Outros'
      if (!tipoMap[tipo]) {
        tipoMap[tipo] = { bruto: 0, liquido: 0 }
      }
      tipoMap[tipo].bruto += Number(item.valor_bruto) || 0
      tipoMap[tipo].liquido += Number(item.valor_liquido_realizado) || 0
    })

    const devedorMap: any = {}
    pagamentosData.forEach(item => {
      const dev = item.devedor || 'Não Informado'
      if (!devedorMap[dev]) {
        devedorMap[dev] = { bruto: 0, liquido: 0 }
      }
      devedorMap[dev].bruto += Number(item.valor_bruto) || 0
      devedorMap[dev].liquido += Number(item.valor_liquido_realizado) || 0
    })

    const monthlyData: { [key: string]: { bruto: number, liquido: number } } = {}
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    if (localSelectedYear !== 'total') {
      const limitMonth = parseInt(localSelectedYear) === currentYear ? currentMonth : 12
      for (let i = 1; i <= limitMonth; i++) {
        const monthKey = `${localSelectedYear}-${String(i).padStart(2, '0')}`
        monthlyData[monthKey] = { bruto: 0, liquido: 0 }
      }
    } else {
      const startYear = 2025;
      const startMonth = 10;

      for (let y = startYear; y <= currentYear; y++) {
        const mStart = (y === startYear) ? startMonth : 1;
        const mEnd = (y === currentYear) ? currentMonth : 12;
        for (let m = mStart; m <= mEnd; m++) {
          const monthKey = `${y}-${String(m).padStart(2, '0')}`
          monthlyData[monthKey] = { bruto: 0, liquido: 0 }
        }
      }
    }

    pagamentosData.forEach(item => {
      if (item.emissao) {
        const [year, month] = item.emissao.split('-')
        const monthKey = `${year}-${month}`
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey].bruto += Number(item.valor_bruto) || 0
          monthlyData[monthKey].liquido += Number(item.valor_liquido_realizado) || 0
        }
      }
    })

    const sortedMonthlyData = Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, values]) => ({
        month,
        bruto: values.bruto,
        liquido: values.liquido,
        label: formatMonthLabel(month)
      }))

    return {
      totalBruto,
      totalLiquido,
      tipos: Object.entries(tipoMap).sort((a: any, b: any) => b[1].liquido - a[1].liquido),
      devedores: Object.entries(devedorMap).sort((a: any, b: any) => b[1].liquido - a[1].liquido).slice(0, 15),
      monthlyData: sortedMonthlyData
    }
  }, [dataPagamentos, filteredByYear, localSelectedYear, localViewMode])

  const stats = useMemo(() => {
    if (localViewMode === 'tudo') {
      const combinedMonthly = statsDespesas.monthlyData.map(d => {
        const pag = statsPagamentos.monthlyData.find(p => p.month === d.month)
        return {
          ...d,
          liquido: pag?.liquido || 0,
          bruto: pag?.bruto || 0,
          totalMensal: (d.value || 0) + (pag?.liquido || 0)
        }
      })

      return { 
        ...statsDespesas, 
        ...statsPagamentos,
        monthlyData: combinedMonthly,
        totalCombinado: (statsDespesas?.totalPaid || 0) + (statsPagamentos?.totalLiquido || 0)
      }
    } else if (localViewMode === 'despesas') {
      return statsDespesas
    } else {
      return statsPagamentos
    }
  }, [localViewMode, statsDespesas, statsPagamentos])

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen animate-in fade-in duration-500">
      
      {/* BOTÕES DE ALTERNÂNCIA DESPESAS/PAGAMENTOS/TUDO */}
      <div className="flex justify-center">
        <div className="inline-flex bg-white p-1.5 rounded-2xl border-2 border-gray-200 shadow-sm">
          <button
            onClick={() => handleViewModeChange('tudo')}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              localViewMode === 'tudo'
                ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Database className="h-4 w-4" />
            Tudo
          </button>
          <button
            onClick={() => handleViewModeChange('despesas')}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              localViewMode === 'despesas'
                ? 'bg-gradient-to-br from-[#1e3a8a] to-[#112240] text-white shadow-lg'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Receipt className="h-4 w-4" />
            Custo Missões
          </button>
          <button
            onClick={() => handleViewModeChange('pagamentos')}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              localViewMode === 'pagamentos'
                ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-lg'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            Despesas Fixas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRÁFICO DE LINHAS MENSAL */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-8 h-[380px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-black text-[#112240] uppercase tracking-[0.15em] flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-blue-600" /> 
              {localViewMode === 'tudo' ? 'Movimentação Mensal' : 
               localViewMode === 'despesas' ? 'Gastos Mensais' : 'Pagamentos Mensais'}
            </h4>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Geral</p>
              <p className="text-2xl font-black text-blue-600 leading-tight">
                {localViewMode === 'tudo' 
                  ? formatCurrency(stats.totalCombinado ?? 0)
                  : localViewMode === 'despesas' 
                    ? formatCurrency(stats.totalPaid ?? 0) 
                    : formatCurrency(stats.totalLiquido ?? 0)}
              </p>
            </div>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyData} margin={{ top: 30, right: 30, left: 30, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLiquido" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }}
                  dy={10}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis hide domain={[0, 'auto']} />
                {localViewMode === 'tudo' ? (
                  <Area 
                    type="monotone" 
                    dataKey="totalMensal" 
                    stroke="#2563eb" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={1500}
                  >
                    <LabelList 
                      dataKey="totalMensal" 
                      position="top" 
                      formatter={(val: number) => val > 0 ? new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(val) : ''}
                      style={{ fontSize: '12px', fontWeight: 'bold', fill: '#2563eb' }}
                      offset={12}
                    />
                  </Area>
                ) : localViewMode === 'despesas' ? (
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#2563eb" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={1500}
                  >
                    <LabelList 
                      dataKey="value" 
                      position="top" 
                      formatter={(val: number) => val > 0 ? new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(val) : ''}
                      style={{ fontSize: '12px', fontWeight: 'bold', fill: '#2563eb' }}
                      offset={12}
                    />
                  </Area>
                ) : (
                  <Area 
                    type="monotone" 
                    dataKey="liquido" 
                    stroke="#10b981" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorLiquido)" 
                    animationDuration={1500}
                  >
                    <LabelList 
                      dataKey="liquido" 
                      position="top" 
                      formatter={(val: number) => val > 0 ? new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(val) : ''}
                      style={{ fontSize: '12px', fontWeight: 'bold', fill: '#10b981' }}
                      offset={12}
                    />
                  </Area>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card Lateral Direito */}
        <div className="lg:col-span-4 bg-[#112240] p-8 rounded-[2rem] shadow-xl text-white h-[380px] flex flex-col">
          <h4 className="text-sm font-black text-blue-300 uppercase tracking-[0.15em] mb-6 flex items-center gap-2">
            <PieChart className="h-4 w-4" /> 
            {localViewMode === 'tudo' ? 'Categorias Combinadas' :
             localViewMode === 'despesas' ? 'Despesas por Tipo' : 'Pagamentos por Tipo'}
          </h4>
          <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
            {localViewMode === 'tudo' ? (
              <>
                <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-2">Despesas</p>
                {(statsDespesas?.expenses || []).slice(0, 5).map(([name, value]: any) => (
                  <div key={`desp-${name}`} className="flex items-center justify-between group cursor-default gap-3 border-b border-white/5 pb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:scale-150 transition-transform flex-shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-300 break-words">{name}</span>
                    </div>
                    <span className="text-xs font-black whitespace-nowrap">{formatCurrency(value)}</span>
                  </div>
                ))}
                <p className="text-xs font-bold text-emerald-200 uppercase tracking-widest mt-4 mb-2">Pagamentos</p>
                {(statsPagamentos?.tipos || []).slice(0, 5).map(([name, values]: any) => (
                  <div key={`pag-${name}`} className="flex items-center justify-between group cursor-default gap-3 border-b border-white/5 pb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:scale-150 transition-transform flex-shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-300 break-words">{name}</span>
                    </div>
                    <span className="text-xs font-black whitespace-nowrap">{formatCurrency(values.liquido)}</span>
                  </div>
                ))}
              </>
            ) : localViewMode === 'despesas' ? (
              statsDespesas.expenses.map(([name, value]: any) => (
                <div key={name} className="flex items-center justify-between group cursor-default gap-3 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:scale-150 transition-transform flex-shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-300 break-words">{name}</span>
                  </div>
                  <span className="text-xs font-black whitespace-nowrap">{formatCurrency(value)}</span>
                </div>
              ))
            ) : (
              statsPagamentos.tipos.map(([name, values]: any) => (
                <div key={name} className="flex items-center justify-between group cursor-default gap-3 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:scale-150 transition-transform flex-shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-300 break-words">{name}</span>
                  </div>
                  <span className="text-xs font-black whitespace-nowrap">{formatCurrency(values.liquido)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LADO ESQUERDO */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[740px]">
          <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
            <h4 className="text-sm font-black text-[#112240] uppercase tracking-[0.15em] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" /> 
              {localViewMode === 'tudo' ? 'Todos os Registros' :
               localViewMode === 'despesas' ? 'Totais por Missão' : 'Lista de Pagamentos'}
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
              {localViewMode === 'tudo' ? (statsDespesas.missions.length + statsPagamentos.totalBruto/statsPagamentos.totalBruto || 0) : filteredByYear.length} Lançamentos {localSelectedYear !== 'total' && `em ${localSelectedYear}`}
            </span>
          </div>

          <div className="overflow-x-auto flex-1 custom-scrollbar">
            {localViewMode === 'tudo' ? (
              <div className="space-y-6">
                <div>
                  <h5 className="px-8 py-4 text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50/50">
                    Missões ({(statsDespesas?.missions || []).length})
                  </h5>
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
                      {(statsDespesas?.missions || []).slice(0, 10).map((m: any) => (
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
                <div>
                  <h5 className="px-8 py-4 text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50/50">
                    Pagamentos ({dataPagamentos.length})
                  </h5>
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">
                      <tr>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Emissão</th>
                        <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Vencimento</th>
                        <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                        <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Devedor</th>
                        <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Valor Líquido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {dataPagamentos.slice(0, 10).map((item: any) => (
                        <tr 
                          key={item.id} 
                          className="hover:bg-blue-50/30 transition-colors group"
                        >
                          <td className="px-8 py-4">
                            <span className="text-sm font-bold text-gray-600">{formatDate(item.emissao)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-semibold text-gray-600">{formatDate(item.vencimento)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-black text-[#112240] uppercase">{item.tipo}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-semibold text-gray-700">{item.devedor}</span>
                          </td>
                          <td className="px-8 py-4 text-sm font-black text-emerald-600 text-right">
                            {formatCurrency(item.valor_liquido_realizado)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : localViewMode === 'despesas' ? (
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
                  {statsDespesas.missions.map((m: any) => (
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
            ) : (
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">
                  <tr>
                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Emissão</th>
                    <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Vencimento</th>
                    <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                    <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Devedor</th>
                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Valor Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredByYear.map((item: any) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="px-8 py-4">
                        <span className="text-sm font-bold text-gray-600">{formatDate(item.emissao)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-semibold text-gray-600">{formatDate(item.vencimento)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-black text-[#112240] uppercase">{item.tipo}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-semibold text-gray-700">{item.devedor}</span>
                      </td>
                      <td className="px-8 py-4 text-sm font-black text-emerald-600 text-right">
                        {formatCurrency(item.valor_liquido_realizado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* LADO DIREITO */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm h-[740px] flex flex-col">
          <h4 className="text-sm font-black text-[#112240] uppercase tracking-[0.15em] mb-6 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" /> 
            {localViewMode === 'tudo' ? 'Fornecedores e Devedores' :
             localViewMode === 'despesas' ? 'Principais Fornecedores' : 'Principais Devedores'}
          </h4>
          <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1 pr-2">
            {localViewMode === 'tudo' ? (
              <>
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Fornecedores</p>
                  {(statsDespesas?.suppliers || []).slice(0, 7).map(([name, value]: any) => (
                    <div key={`forn-${name}`} className="space-y-1.5 mb-4">
                      <div className="flex justify-between items-center gap-3">
                        <span className="text-xs font-black text-gray-500 uppercase break-words">{name}</span>
                        <span className="text-xs font-black text-[#112240] whitespace-nowrap">{formatCurrency(value)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full" 
                          style={{ width: `${(value / ((statsDespesas?.totalPaid || 1))) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Devedores</p>
                  {(statsPagamentos?.devedores || []).slice(0, 7).map(([name, values]: any) => (
                    <div key={`dev-${name}`} className="space-y-1.5 mb-4">
                      <div className="flex justify-between items-center gap-3">
                        <span className="text-xs font-black text-gray-500 uppercase break-words">{name}</span>
                        <span className="text-xs font-black text-[#112240] whitespace-nowrap">{formatCurrency(values.liquido)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-600 rounded-full" 
                          style={{ width: `${(values.liquido / ((statsPagamentos?.totalLiquido || 1))) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : localViewMode === 'despesas' ? (
              statsDespesas.suppliers.map(([name, value]: any) => (
                <div key={name} className="space-y-1.5">
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-xs font-black text-gray-500 uppercase break-words">{name}</span>
                    <span className="text-xs font-black text-[#112240] whitespace-nowrap">{formatCurrency(value)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${(value / (statsDespesas.totalPaid || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              statsPagamentos.devedores.map(([name, values]: any) => (
                <div key={name} className="space-y-1.5">
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-xs font-black text-gray-500 uppercase break-words">{name}</span>
                    <span className="text-xs font-black text-[#112240] whitespace-nowrap">{formatCurrency(values.liquido)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600 rounded-full" 
                      style={{ width: `${(values.liquido / (statsPagamentos.totalLiquido || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}