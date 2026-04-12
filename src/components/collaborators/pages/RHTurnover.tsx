import { useState, useMemo } from 'react'
import {
  RefreshCw,
  TrendingDown,
  TrendingUp,
  UserMinus,
  Users,
  Calendar,
  X,
  BarChart2,
  PieChart as PieChartIcon,
  Activity,
  UserCheck
} from 'lucide-react'
import {
  ComposedChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  LabelList,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { useColaboradores } from '../hooks/useColaboradores'

import { FilterSelect } from '../../controladoria/ui/FilterSelect'

import {
  getSegment,
  getYearFromDate,
  calculateTenure,
  wasActiveInMonth,
  formatYears,
  normalizeString
} from '../utils/rhChartUtils'
import { RHChartTooltip } from '../components/RHChartTooltip'
import { RHChartDataLabel } from '../components/RHChartDataLabel'
import { RHChartPieLabel } from '../components/RHChartPieLabel'
import { CopyChartButton } from '../../controladoria/ui/CopyChartButton'

export function RHTurnover() {
  const { colaboradores, loading, teams: masterTeams, partners: masterPartners } = useColaboradores()

  // --- State for Filters ---
  const currentYear = new Date().getFullYear().toString()

  const [filterYear, setFilterYear] = useState<string>('todos')
  const [filterMonth, setFilterMonth] = useState<string>('todos')
  const [filterTeam, setFilterTeam] = useState<string>('todos')
  const [filterLeader, setFilterLeader] = useState<string>('todos')

  // --- Derived Data / Lists for Filters ---
  const years = useMemo(() => {
    const yearsSet = new Set<string>()
    colaboradores.forEach(c => {
      if (c.hire_date) yearsSet.add(getYearFromDate(c.hire_date)!.toString())
      if (c.termination_date) yearsSet.add(getYearFromDate(c.termination_date)!.toString())
    })
    const sorted = Array.from(yearsSet).sort().reverse()
    if (!sorted.includes(currentYear)) sorted.unshift(currentYear)
    return sorted
  }, [colaboradores, currentYear])

  const months = [
    { label: 'Todos os Meses', value: 'todos' },
    { label: 'Janeiro', value: '0' }, { label: 'Fevereiro', value: '1' },
    { label: 'Março', value: '2' }, { label: 'Abril', value: '3' },
    { label: 'Maio', value: '4' }, { label: 'Junho', value: '5' },
    { label: 'Julho', value: '6' }, { label: 'Agosto', value: '7' },
    { label: 'Setembro', value: '8' }, { label: 'Outubro', value: '9' },
    { label: 'Novembro', value: '10' }, { label: 'Dezembro', value: '11' }
  ]

  const teamOptions = useMemo(() => {
    return masterTeams
      .map(t => ({ label: t.name, value: String(t.id) }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [masterTeams])

  const leaderOptions = useMemo(() => {
    return masterPartners
      .map(p => ({ label: p.name, value: String(p.id) }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [masterPartners])

  // --- Base Filtering (For general Terminations list) ---
  const filteredTerminations = useMemo(() => {
    return colaboradores.filter(c => {
      if (!c.termination_date) return false

      const termYear = getYearFromDate(c.termination_date)?.toString()
      const termMonth = new Date(c.termination_date + 'T12:00:00').getMonth().toString()

      if (filterYear !== 'todos' && termYear !== filterYear) return false
      if (filterMonth !== 'todos' && termMonth !== filterMonth) return false

      const equipeValue = String(c.equipe || '')
      if (filterTeam !== 'todos' && equipeValue !== filterTeam) return false

      const leaderValue = c.leader_id ? String(c.leader_id) : (c.partner?.id ? String(c.partner.id) : null)
      if (filterLeader !== 'todos' && leaderValue !== filterLeader) return false

      return true
    })
  }, [colaboradores, filterYear, filterMonth, filterTeam, filterLeader])

  // --- KPIs Calculations ---

  const { turnoverGeral, turnoverJuridico, headcountMedio } = useMemo(() => {
    let year = filterYear === 'todos' ? new Date().getFullYear() : parseInt(filterYear)
    let startMonth = filterMonth === 'todos' ? 0 : parseInt(filterMonth)
    let endMonth = filterMonth === 'todos' ? 11 : parseInt(filterMonth)

    // Calculate Active Headcount for the period
    let totalActivesSum = 0
    let legalActivesSum = 0
    let monthsCnt = 0

    for (let m = startMonth; m <= endMonth; m++) {
      monthsCnt++
      const activesInMonth = colaboradores.filter(c => {
        // If "Todos os anos" is selected, just use current active status.
        // Otherwise, run the historical `wasActiveInMonth` check.
        if (filterYear === 'todos') {
          if (c.status !== 'active') return false
        } else {
          if (!wasActiveInMonth(c, year, m)) return false
        }

        if (filterTeam !== 'todos' && String(c.equipe || '') !== filterTeam) return false
        const leaderValue = c.leader_id ? String(c.leader_id) : (c.partner?.id ? String(c.partner.id) : null)
        if (filterLeader !== 'todos' && leaderValue !== filterLeader) return false
        return true
      })
      totalActivesSum += activesInMonth.length
      legalActivesSum += activesInMonth.filter(c => getSegment(c) === 'Jurídico').length
    }

    const avgTotalActive = totalActivesSum / monthsCnt
    const avgLegalActive = legalActivesSum / monthsCnt

    const totalTerminations = filteredTerminations.length
    const legalTerminations = filteredTerminations.filter(c => getSegment(c) === 'Jurídico').length

    const turnover = avgTotalActive > 0 ? (totalTerminations / avgTotalActive) * 100 : 0
    const turnoverJuridico = avgLegalActive > 0 ? (legalTerminations / avgLegalActive) * 100 : 0

    return {
      turnoverGeral: turnover,
      turnoverJuridico,
      headcountMedio: avgTotalActive
    }
  }, [colaboradores, filteredTerminations, filterYear, filterMonth, filterTeam, filterLeader])

  // Voluntário vs Involuntário (Mock/Estimation if not in DB directly yet, using initiative)
  const volInvolData = useMemo(() => {
    let vol = 0
    let invol = 0
    let naoInformado = 0
    filteredTerminations.forEach(c => {
      // Assuming termination_initiative_id or reason indicates this
      // For now, let's distribute roughly if data is missing, or use actual field if available
      const initiative = c.termination_initiatives?.name?.toLowerCase() || ''
      if (initiative.includes('empregado') || initiative.includes('pedido')) {
        vol++
      } else if (initiative.includes('empregador') || initiative.includes('sem justa') || initiative.includes('justa')) {
        invol++
      } else {
        naoInformado++
      }
    })
    return [
      { name: 'Voluntário', value: vol },
      { name: 'Involuntário', value: invol },
      { name: 'Não Informado', value: naoInformado }
    ]
  }, [filteredTerminations])

  const tempoCasaDesligados = useMemo(() => {
    if (filteredTerminations.length === 0) return 0
    const sum = filteredTerminations.reduce((acc, c) => acc + (c.hire_date ? calculateTenure(c.hire_date, null, c.termination_date!) : 0), 0)
    return sum / filteredTerminations.length
  }, [filteredTerminations])

  // --- Charts Data ---

  // 1. Evolução do Turnover (Mensal ou Anual para 'todos')
  const evolutionData = useMemo(() => {
    if (filterYear !== 'todos' && filterYear !== 'Anos') {
      let year = parseInt(filterYear)
      const monthsIdx = Array.from({ length: 12 }, (_, i) => i)

      return monthsIdx.map(mIdx => {
        const activesInMonthList = colaboradores.filter(c => {
          if (!wasActiveInMonth(c, year, mIdx)) return false
          if (filterTeam !== 'todos' && String(c.equipe || '') !== filterTeam) return false
          const leaderValue = c.leader_id ? String(c.leader_id) : (c.partner?.id ? String(c.partner.id) : null)
          if (filterLeader !== 'todos' && leaderValue !== filterLeader) return false
          return true
        })

        const terminationsList = colaboradores.filter(c => {
          if (!c.termination_date) return false
          const termDate = new Date(c.termination_date + 'T12:00:00')
          if (termDate.getFullYear() !== year || termDate.getMonth() !== mIdx) return false
          if (filterTeam !== 'todos' && String(c.equipe || '') !== filterTeam) return false
          const leaderValue = c.leader_id ? String(c.leader_id) : (c.partner?.id ? String(c.partner.id) : null)
          if (filterLeader !== 'todos' && leaderValue !== filterLeader) return false
          return true
        })

        const activesJur = activesInMonthList.filter(c => getSegment(c) === 'Jurídico').length
        const termsJur = terminationsList.filter(c => getSegment(c) === 'Jurídico').length
        const taxaJur = activesJur > 0 ? (termsJur / activesJur) * 100 : 0

        const activesAdm = activesInMonthList.filter(c => getSegment(c) === 'Administrativo').length
        const termsAdm = terminationsList.filter(c => getSegment(c) === 'Administrativo').length
        const taxaAdm = activesAdm > 0 ? (termsAdm / activesAdm) * 100 : 0
        
        const totaisAtivos = activesInMonthList.length
        const taxaGeral = totaisAtivos > 0 ? (terminationsList.length / totaisAtivos) * 100 : 0

        const d = new Date(year, mIdx, 1)
        return {
          name: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
          'Turnover Jurídico': parseFloat(taxaJur.toFixed(2)),
          'Turnover Adm': parseFloat(taxaAdm.toFixed(2)),
          'Taxa de Turnover': parseFloat(taxaGeral.toFixed(2)),
          Desligamentos: terminationsList.length
        }
      }).filter(item => item['Taxa de Turnover'] > 0 || item.Desligamentos > 0)
    } else {
      const yearsList = years.map(y => parseInt(y)).filter(y => y >= 2010).sort((a, b) => a - b)
      
      return yearsList.map(y => {
        let sumActives = 0; let sumActivesJur = 0; let sumActivesAdm = 0
        for (let m = 0; m < 12; m++) {
          const activesInM = colaboradores.filter(c => {
            if (!wasActiveInMonth(c, y, m)) return false
            if (filterTeam !== 'todos' && String(c.equipe || '') !== filterTeam) return false
            const leaderValue = c.leader_id ? String(c.leader_id) : (c.partner?.id ? String(c.partner.id) : null)
            if (filterLeader !== 'todos' && leaderValue !== filterLeader) return false
            return true
          })
          sumActives += activesInM.length
          sumActivesJur += activesInM.filter(c => getSegment(c) === 'Jurídico').length
          sumActivesAdm += activesInM.filter(c => getSegment(c) === 'Administrativo').length
        }
        const avgActives = sumActives / 12
        const avgActivesJur = sumActivesJur / 12
        const avgActivesAdm = sumActivesAdm / 12

        const termsList = colaboradores.filter(c => {
          if (!c.termination_date) return false
          const termDate = new Date(c.termination_date + 'T12:00:00')
          if (termDate.getFullYear() !== y) return false
          if (filterTeam !== 'todos' && String(c.equipe || '') !== filterTeam) return false
          const leaderValue = c.leader_id ? String(c.leader_id) : (c.partner?.id ? String(c.partner.id) : null)
          if (filterLeader !== 'todos' && leaderValue !== filterLeader) return false
          return true
        })

        const terminations = termsList.length
        const termsJur = termsList.filter(c => getSegment(c) === 'Jurídico').length
        const termsAdm = termsList.filter(c => getSegment(c) === 'Administrativo').length

        const taxaGeral = avgActives > 0 ? (terminations / avgActives) * 100 : 0
        const taxaJur = avgActivesJur > 0 ? (termsJur / avgActivesJur) * 100 : 0
        const taxaAdm = avgActivesAdm > 0 ? (termsAdm / avgActivesAdm) * 100 : 0

        return {
          name: y.toString(),
          'Turnover Jurídico': parseFloat(taxaJur.toFixed(2)),
          'Turnover Adm': parseFloat(taxaAdm.toFixed(2)),
          'Taxa de Turnover': parseFloat(taxaGeral.toFixed(2)),
          Desligamentos: terminations
        }
      }).filter(item => item['Taxa de Turnover'] > 0 || item.Desligamentos > 0)
    }
  }, [colaboradores, filterYear, filterTeam, filterLeader, years])

  // 2. Turnover por Tempo de Casa na Saída
  const tenureAtExitData = useMemo(() => {
    const buckets = {
      '< 6 meses': 0,
      '6m a 1 ano': 0,
      '1 a 3 anos': 0,
      '3 a 5 anos': 0,
      '> 5 anos': 0
    }

    filteredTerminations.forEach(c => {
      if (!c.hire_date) return
      const years = calculateTenure(c.hire_date, null, c.termination_date!)
      if (years < 0.5) buckets['< 6 meses']++
      else if (years <= 1) buckets['6m a 1 ano']++
      else if (years <= 3) buckets['1 a 3 anos']++
      else if (years <= 5) buckets['3 a 5 anos']++
      else buckets['> 5 anos']++
    })

    return Object.entries(buckets).map(([name, value]) => ({ name, value }))
  }, [filteredTerminations])

  // 3. Desligamentos por Cargo (Top 10)
  const terminationsByRole = useMemo(() => {
    const roleMap = new Map<string, number>()
    filteredTerminations.forEach(c => {
      const role = c.roles?.name || String(c.role || 'Não Informado')
      roleMap.set(role, (roleMap.get(role) || 0) + 1)
    })
    return Array.from(roleMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10
  }, [filteredTerminations])

  // 4. Desligamentos por Equipe
  const terminationsByTeam = useMemo(() => {
    const teamMap = new Map<string, number>()
    filteredTerminations.forEach(c => {
      const team = c.teams?.name || String(c.equipe || 'Não Informado')
      teamMap.set(team, (teamMap.get(team) || 0) + 1)
    })
    return Array.from(teamMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [filteredTerminations])

  // --- Constants ---
  const COLORS = {
    primary: '#1e3a8a',   // Dark Blue
    secondary: '#ea580c', // Dark Orange
    danger: '#ef4444',    // Red
    success: '#10b981',   // Green
    text: '#6b7280',
    grid: '#e5e7eb',
    pie: ['#3b82f6', '#ef4444', '#9ca3af', '#f59e0b', '#10b981']
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 sm:p-6 space-y-4 sm:space-y-6">

      {/* 1. Header & Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-3 shadow-lg shrink-0">
            <RefreshCw className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Turnover & Retenção</h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">Métricas de rotatividade e desligamentos</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-2 md:mt-0 justify-end">
          <FilterSelect
            icon={Calendar}
            value={filterMonth}
            onChange={(val) => setFilterMonth(val || 'todos')}
            options={months}
            placeholder="Mês"
          />
          <FilterSelect
            icon={Calendar}
            value={filterYear}
            onChange={(val) => setFilterYear(val || 'todos')}
            options={[{ label: 'Todos os Anos', value: 'todos' }, ...years.map(y => ({ label: y, value: y }))]}
            placeholder="Ano"
          />
          <FilterSelect
            icon={Users}
            value={filterTeam === 'todos' ? '' : filterTeam}
            onChange={(val) => setFilterTeam(val || 'todos')}
            options={teamOptions}
            placeholder="Equipe"
          />
          <FilterSelect
            icon={UserCheck}
            value={filterLeader === 'todos' ? '' : filterLeader}
            onChange={(val) => setFilterLeader(val || 'todos')}
            options={leaderOptions}
            placeholder="Líder (Sócio)"
          />

          {(filterTeam !== 'todos' || filterLeader !== 'todos' || filterYear !== 'todos' || filterMonth !== 'todos') && (
            <button
              onClick={() => {
                setFilterTeam('todos');
                setFilterLeader('todos');
                setFilterYear('todos');
                setFilterMonth('todos');
              }}
              className="p-2 sm:p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div id="export-kpis-turnover" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Turnover Geral */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-red-500"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Turnover Geral</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-3xl font-black text-gray-800">{turnoverGeral.toFixed(1)}%</p>
            </div>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <RefreshCw className="h-6 w-6" />
          </div>
        </div>

        {/* Total Desligamentos */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-orange-500"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Desligamentos no Período</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-3xl font-black text-gray-800">{filteredTerminations.length}</p>
              <span className="text-xs font-bold text-gray-400 mb-1">/ {Math.round(headcountMedio)} méd.</span>
            </div>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <UserMinus className="h-6 w-6" />
          </div>
        </div>

        {/* Turnover Jurídico */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-[#1e3a8a]"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Turnover Jurídico</p>
            <p className="text-3xl font-black text-[#1e3a8a] mt-1">{turnoverJuridico.toFixed(1)}%</p>
          </div>
          <div className="p-3 bg-blue-50 text-[#1e3a8a] rounded-xl">
            <Activity className="h-6 w-6" />
          </div>
        </div>

        {/* Tempo Médio Desligados */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-gray-800"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tenure na Saída (Méd.)</p>
            <p className="text-3xl font-black text-gray-800 mt-1">{formatYears(tempoCasaDesligados)}</p>
          </div>
          <div className="p-3 bg-gray-100 text-gray-600 rounded-xl">
            <TrendingDown className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* 3. Charts Row 1: Evolution & Vol/Invol */}
      <div id="export-turnover-evolucao" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolution Chart */}
        <div id="chart-turnover-evolucao" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800 tracking-tight">Evolução do Turnover {filterYear === 'todos' ? '(Histórico Anual)' : `(${filterYear})`}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Histórico Mensal de Rotatividade</p>
              </div>
            </div>
            <CopyChartButton targetId="chart-turnover-evolucao" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={evolutionData} margin={{ top: 50, right: 40, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 11 }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 11, fontWeight: 700 }} unit="%" />
                <Tooltip content={RHChartTooltip} cursor={{ fill: '#f3f4f6' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="Turnover Jurídico" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: COLORS.primary, strokeWidth: 2 }}>
                  <LabelList dataKey="Turnover Jurídico" content={(props) => RHChartDataLabel({ ...props, fill: COLORS.primary, position: "top", percent: true })} />
                </Line>
                <Line yAxisId="left" type="monotone" dataKey="Turnover Adm" stroke={COLORS.secondary} strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: COLORS.secondary, strokeWidth: 2 }}>
                  <LabelList dataKey="Turnover Adm" content={(props) => RHChartDataLabel({ ...props, fill: COLORS.secondary, position: "bottom", percent: true })} />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Voluntário vs Involuntário */}
        <div id="chart-turnover-tipo" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                <PieChartIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800 tracking-tight">Tipo de Desligamento</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Iniciativa da Rescisão</p>
              </div>
            </div>
            <CopyChartButton targetId="chart-turnover-tipo" />
          </div>
          <div className="flex-grow min-h-[250px] relative flex flex-col justify-center">
            {filteredTerminations.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <Pie
                    data={volInvolData}
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    label={RHChartPieLabel}
                    labelLine={false}
                  >
                    <Cell fill={COLORS.pie[0]} /> {/* Blue for Vol */}
                    <Cell fill={COLORS.pie[1]} /> {/* Red for Invol */}
                    <Cell fill={COLORS.pie[2]} /> {/* Gray for Não Informado */}
                  </Pie>
                  <Tooltip content={RHChartTooltip} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium text-sm">
                Sem dados no período
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Charts Row 2: Breakdown */}
      <div id="export-turnover-risco-cargos" className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Tenure at Exit */}
        <div id="chart-turnover-risco" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800 tracking-tight">Risco por Tempo de Casa</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quando as pessoas saem?</p>
              </div>
            </div>
            <CopyChartButton targetId="chart-turnover-risco" />
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tenureAtExitData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 10, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 10 }} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} content={RHChartTooltip} />
                <Bar dataKey="value" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={30} name="Qtd">
                  <LabelList dataKey="value" position="top" fill={COLORS.primary} fontSize={10} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categoria/Cargo */}
        <div id="chart-turnover-cargos" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:col-span-2">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-50 text-green-600">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800 tracking-tight">Principais Cargos/Equipes Afetados</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Desligamentos por Função</p>
              </div>
            </div>
            <CopyChartButton targetId="chart-turnover-cargos" />
          </div>
          <div className="h-[250px] w-full flex gap-4">
            {/* Roles BarChart */}
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-500 mb-2 pl-4">Top 10 Cargos</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={terminationsByRole} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 9, fontWeight: 600 }} width={120} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} content={RHChartTooltip} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={15} name="Qtd">
                    {terminationsByRole.map((entry, index) => {
                      const norm = normalizeString(entry.name);
                      // Check if it's Estagiário or Juridico roles
                      const isJuridico = norm.includes('estagiari') || getSegment({ roles: { name: entry.name } } as any) === 'Jurídico';
                      return <Cell key={`cell-${index}`} fill={isJuridico ? COLORS.primary : COLORS.secondary} />;
                    })}
                    <LabelList dataKey="count" position="right" fill={COLORS.text} fontSize={10} fontWeight={700} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="w-px bg-gray-100 my-4"></div>

            {/* Teams BarChart */}
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-500 mb-2 pl-4">Top 8 Equipes</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={terminationsByTeam} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 9, fontWeight: 600 }} width={120} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} content={RHChartTooltip} />
                  <Bar dataKey="count" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={15} name="Qtd">
                    <LabelList dataKey="count" position="right" fill={COLORS.text} fontSize={10} fontWeight={700} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
