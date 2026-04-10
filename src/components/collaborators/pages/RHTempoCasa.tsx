import { useState, useMemo } from 'react'
import {
  Clock,
  Filter,
  Users,
  Briefcase,
  Calendar,
  X,
  TrendingUp,
  Award,
  Scale
} from 'lucide-react'
import {
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
import { Collaborator } from '../../../types/controladoria'
import { FilterSelect } from '../../controladoria/ui/FilterSelect'
import { useNavigate } from 'react-router-dom'

import {
  getSegment,
  getYearFromDate,
  calculateTenure,
  isActiveAtDate,
  formatYears,
  normalizeString
} from '../utils/rhChartUtils'
import { RHChartTooltip } from '../components/RHChartTooltip'
import { RHChartDataLabel } from '../components/RHChartDataLabel'
import { RHChartPieLabel } from '../components/RHChartPieLabel'
import { CopyChartButton } from '../../controladoria/ui/CopyChartButton'

// --- Main Component ---

export function RHTempoCasa() {
  const {
    colaboradores,
    loading,
    locations: masterLocations,
    partners: masterPartners
  } = useColaboradores()
  const navigate = useNavigate()

  // --- State for Filters ---
  const [filterYear, setFilterYear] = useState<string>('todos')
  const [filterMonth, setFilterMonth] = useState<string>('todos')
  const [filterLocal, setFilterLocal] = useState<string>('todos')
  const [filterPartner, setFilterPartner] = useState<string>('todos') // Kept for consistency, though maybe less relevant for tenure?

  // --- Derived Data / Lists for Filters ---
  const years = useMemo(() => {
    const yearsSet = new Set<string>()
    colaboradores.forEach(c => {
      if (c.hire_date) yearsSet.add(getYearFromDate(c.hire_date)!.toString())
      if (c.termination_date) yearsSet.add(getYearFromDate(c.termination_date)!.toString())
    })
    const sorted = Array.from(yearsSet).sort().reverse()
    return sorted
  }, [colaboradores])

  const months = [
    { label: 'Meses', value: 'todos' },
    { label: 'Janeiro', value: '0' },
    { label: 'Fevereiro', value: '1' },
    { label: 'Março', value: '2' },
    { label: 'Abril', value: '3' },
    { label: 'Maio', value: '4' },
    { label: 'Junho', value: '5' },
    { label: 'Julho', value: '6' },
    { label: 'Agosto', value: '7' },
    { label: 'Setembro', value: '8' },
    { label: 'Outubro', value: '9' },
    { label: 'Novembro', value: '10' },
    { label: 'Dezembro', value: '11' }
  ]

  const locationOptions = useMemo(() => {
    return masterLocations
      .map(l => ({ label: l.name, value: String(l.id) }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [masterLocations])

  const partnerOptions = useMemo(() => {
    return masterPartners
      .map(p => ({ label: p.name, value: String(p.id) }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [masterPartners])


  // --- Filtered Data & Context ---

  // Unlike Headcount, Tenure analysis is usually based on "Current Active" employees at the selected point in time.
  // If no filters are selected, it means "Today".
  // If Month/Year are selected, it means "End of that period".

  const referenceDate = useMemo(() => {
    const now = new Date()
    let year = now.getFullYear()
    let month = now.getMonth()

    if (filterYear === 'todos' || filterYear === 'Anos') {
      if (filterMonth === 'todos') {
        return null;
      }
    }

    if (filterYear !== 'todos' && filterYear !== 'Todos os anos') {
      year = parseInt(filterYear)
      if (filterMonth !== 'todos') {
        month = parseInt(filterMonth)
        return new Date(year, month + 1, 0, 23, 59, 59)
      } else {
        // End of Year (or today if current year)
        if (year === now.getFullYear()) return now
        return new Date(year, 11, 31, 23, 59, 59)
      }
    } else {
      if (filterMonth !== 'todos') {
        month = parseInt(filterMonth)
        return new Date(year, month + 1, 0, 23, 59, 59)
      }
    }
    return now
  }, [filterYear, filterMonth])

  const activeDataAtRefDate = useMemo(() => {
    return colaboradores.filter(c => {
      // 1. Must be active at reference date
      if (referenceDate) {
        if (!isActiveAtDate(c, referenceDate)) return false
      } else {
        if (c.status !== 'active') return false
      }

      // 2. Local Filter
      if (filterLocal !== 'todos') {
        if (String(c.local) !== filterLocal) return false
      }

      // 3. Partner Filter (if applicable to tenure/team view)
      if (filterPartner !== 'todos') {
        // simplified partner check
        const pid = c.partner_id ? String(c.partner_id) : (c.partner && c.partner.id ? String(c.partner.id) : null)
        if (pid !== filterPartner) return false;
      }

      return true
    })
  }, [colaboradores, referenceDate, filterLocal, filterPartner])

  // --- KPI Calculations ---

  const calculateAverageTenure = (dataset: Collaborator[]) => {
    if (dataset.length === 0) return 0
    const totalYears = dataset.reduce((acc, c) => {
      if (!c.hire_date) return acc
      return acc + calculateTenure(c.hire_date, referenceDate)
    }, 0)
    return totalYears / dataset.length
  }

  const avgTenureTotal = useMemo(() => calculateAverageTenure(activeDataAtRefDate), [activeDataAtRefDate])
  const avgTenureLegal = useMemo(() => calculateAverageTenure(activeDataAtRefDate.filter(c => getSegment(c) === 'Jurídico')), [activeDataAtRefDate])


  // --- Charts Data ---

  // 1. Evolution of Stability (Avg Tenure over time)
  // This shows how the avg tenure changed over the selected period (Year buttons filter the view range)
  const stabilityEvolutionData = useMemo(() => {
    // If specific Year selected -> Monthly evolution
    if (filterYear !== 'todos' && filterYear !== 'Anos') {
      const year = parseInt(filterYear)
      const monthsIdx = Array.from({ length: 12 }, (_, i) => i)

      // Optimization: Pre-filter valid employees who were hired before end of year
      // Actually, we need to check active status at each month end.

      return monthsIdx.map(mIdx => {
        const d = new Date(year, mIdx + 1, 0, 23, 59, 59)
        // Don't project into future if current year
        // if (d > new Date()) return null // Optional: hide future months

        const activeAtD = colaboradores.filter(c => {
          if (!isActiveAtDate(c, d)) return false
          if (filterLocal !== 'todos' && String(c.local) !== filterLocal) return false
          return true
        })

        const admin = activeAtD.filter(c => getSegment(c) === 'Administrativo')
        const legal = activeAtD.filter(c => getSegment(c) === 'Jurídico')

        const calcAvgMap = (list: Collaborator[]) => {
          if (list.length === 0) return 0;
          const sum = list.reduce((acc, c) => acc + calculateTenure(c.hire_date!, d), 0)
          return sum / list.length
        }

        return {
          name: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
          Administrativo: parseFloat(calcAvgMap(admin).toFixed(2)),
          Jurídico: parseFloat(calcAvgMap(legal).toFixed(2)),
        }
      }).filter(x => x !== null)
    }
    // All Years -> Yearly Evolution
    else {
      const yearsList = years.map(y => parseInt(y)).filter(y => y >= 2010).sort((a, b) => a - b) // Limit to reasonable history
      // Add current year if not present
      const currentYear = new Date().getFullYear()
      if (!yearsList.includes(currentYear)) yearsList.push(currentYear)

      return yearsList.map(y => {
        const d = (y === currentYear) ? new Date() : new Date(y, 11, 31, 23, 59, 59)

        const activeAtD = colaboradores.filter(c => {
          if (!isActiveAtDate(c, d)) return false
          if (filterLocal !== 'todos' && String(c.local) !== filterLocal) return false
          return true
        })

        const admin = activeAtD.filter(c => getSegment(c) === 'Administrativo')
        const legal = activeAtD.filter(c => getSegment(c) === 'Jurídico')

        const calcAvgMap = (list: Collaborator[]) => {
          if (list.length === 0) return 0;
          const sum = list.reduce((acc, c) => acc + calculateTenure(c.hire_date!, d), 0)
          return sum / list.length
        }

        return {
          name: y.toString(),
          Administrativo: parseFloat(calcAvgMap(admin).toFixed(2)),
          Jurídico: parseFloat(calcAvgMap(legal).toFixed(2)),
        }
      })
    }
  }, [colaboradores, filterYear, filterLocal, years])


  // 2. Avg Tenure by Area
  const tenureByAreaData = useMemo(() => {
    const areaMap = new Map<string, { totalYears: number, count: number }>()

    activeDataAtRefDate.forEach(c => {
      let areaName = c.area || 'Não Definido'
      // Normalize subtle diffs?
      areaName = areaName.trim()
      if (!areaName || areaName === '-') areaName = 'Não Definido'

      if (!areaMap.has(areaName)) areaMap.set(areaName, { totalYears: 0, count: 0 })

      if (c.hire_date) {
        const years = calculateTenure(c.hire_date, referenceDate)
        const entry = areaMap.get(areaName)!
        entry.totalYears += years
        entry.count++
      }
    })

    return Array.from(areaMap.entries()).map(([name, data]) => ({
      name,
      avg: data.count > 0 ? parseFloat((data.totalYears / data.count).toFixed(2)) : 0
    })).sort((a, b) => b.avg - a.avg)
  }, [activeDataAtRefDate, referenceDate])

  // 3. Avg Tenure by Leader
  const { leaderJuridicoSocios, leaderJuridicoLideres } = useMemo(() => {
    const leaderMap = new Map<string, { totalYears: number, count: number, members: Collaborator[], leaderObj: Collaborator }>()

    activeDataAtRefDate.forEach(c => {
      const leaderName = c.leader?.name
      if (!leaderName) return

      const normalizedLeaderName = normalizeString(leaderName)
      
      if (!leaderMap.has(normalizedLeaderName)) {
        const fullLeaderObj = colaboradores.find(col => normalizeString(col.name) === normalizedLeaderName)
        leaderMap.set(normalizedLeaderName, { 
          totalYears: 0, 
          count: 0, 
          members: [], 
          leaderObj: fullLeaderObj || (c.leader as unknown as Collaborator) 
        })
      }

      if (c.hire_date) {
        const years = calculateTenure(c.hire_date, referenceDate)
        const entry = leaderMap.get(normalizedLeaderName)!
        entry.totalYears += years
        entry.count++
        entry.members.push(c)
      }
    })

    const allLeaders = Array.from(leaderMap.entries())
      .map(([, data]) => {
        let category: 'Jurídico - Sócios' | 'Jurídico - Líderes' | 'Administrativo' = 'Administrativo'
        const leaderObj = data.leaderObj

        const segment = getSegment(leaderObj)
        if (segment === 'Jurídico') {
          const roleName = normalizeString(leaderObj.roles?.name || String(leaderObj.role || ''))
          if (roleName.includes('socio') || roleName.includes('sócio')) {
            category = 'Jurídico - Sócios'
          } else {
            category = 'Jurídico - Líderes'
          }
        } else {
          category = 'Administrativo'
        }

        return {
          name: leaderObj.name,
          category,
          avg: data.count > 0 ? parseFloat((data.totalYears / data.count).toFixed(2)) : 0
        }
      }).sort((a, b) => b.avg - a.avg)

    return {
      leaderJuridicoSocios: allLeaders.filter(l => l.category === 'Jurídico - Sócios'),
      leaderJuridicoLideres: allLeaders.filter(l => l.category === 'Jurídico - Líderes'),
    }
  }, [activeDataAtRefDate, referenceDate, colaboradores])

  // 4. Legal Concentration by Experience
  const legalExperienceData = useMemo(() => {
    const buckets = {
      '0-1 ano': 0,
      '1-3 anos': 0,
      '3-5 anos': 0,
      '5+ anos': 0
    }

    const legalStaff = activeDataAtRefDate.filter(c => getSegment(c) === 'Jurídico')

    legalStaff.forEach(c => {
      const years = calculateTenure(c.hire_date!, referenceDate)
      if (years < 1) buckets['0-1 ano']++
      else if (years < 3) buckets['1-3 anos']++
      else if (years < 5) buckets['3-5 anos']++
      else buckets['5+ anos']++
    })

    return Object.entries(buckets).map(([name, value]) => ({ name, value }))
  }, [activeDataAtRefDate, referenceDate])

  // --- Constants ---
  const COLORS = {
    primary: '#ea580c',   // Admin (Dark Orange)
    secondary: '#1e3a8a', // Jurídico (Dark Blue)
    tertiary: '#0d9488',  // Terceirizada (Teal)
    text: '#6b7280',
    grid: '#e5e7eb',
    pie: ['#93c5fd', '#60a5fa', '#2563eb', '#1e3a8a'] // Blue gradients for Legal
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
            <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Tempo de Casa</h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">Análise de Estabilidade e Senioridade</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-2 md:mt-0 justify-end">
          <FilterSelect
            icon={Calendar}
            value={filterMonth === 'todos' ? '' : filterMonth}
            onChange={(val) => setFilterMonth(val || 'todos')}
            options={months}
            placeholder="Meses"
          />
          <FilterSelect
            icon={Calendar}
            value={(filterYear === 'todos' || filterYear === 'Anos') ? '' : filterYear}
            onChange={(val) => setFilterYear(val || 'todos')}
            options={[{ label: 'Anos', value: 'todos' }, ...years.map(y => ({ label: y, value: y }))]}
            placeholder="Anos"
          />
          <FilterSelect
            icon={Filter}
            value={filterLocal === 'todos' ? '' : filterLocal}
            onChange={(val) => setFilterLocal(val || 'todos')}
            options={locationOptions}
            placeholder="Local"
          />
          <FilterSelect
            icon={Users}
            value={filterPartner === 'todos' ? '' : filterPartner}
            onChange={(val) => setFilterPartner(val || 'todos')}
            options={partnerOptions}
            placeholder="Sócio"
          />

          {(filterLocal !== 'todos' || filterPartner !== 'todos' || filterYear !== 'todos' || filterMonth !== 'todos') && (
            <button
              onClick={() => {
                setFilterLocal('todos');
                setFilterPartner('todos');
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
      <div id="export-kpis-tempo" className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* General Avg Tenure */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-gray-800"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tempo Médio (Geral)</p>
            <p className="text-3xl font-black text-gray-800 mt-1">{formatYears(avgTenureTotal)}</p>
          </div>
          <div className="p-3 bg-gray-100 rounded-xl">
            <Award className="h-6 w-6 text-gray-600" />
          </div>
        </div>

        {/* Legal Avg Tenure */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-[#1e3a8a]"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Média Jurídico</p>
            <p className="text-3xl font-black text-[#1e3a8a] mt-1">{formatYears(avgTenureLegal)}</p>
          </div>
          <div className="p-3 bg-[#1e3a8a]/10 rounded-xl">
            <Scale className="h-6 w-6 text-[#1e3a8a]" />
          </div>
        </div>
      </div>

      {/* 3. Charts Row 1: Evolution */}
      <div id="export-evolucao-estabilidade" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="mb-6 pb-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-50 text-green-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Evolução da Estabilidade Média (Anos)</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Histórico de Retenção</p>
            </div>
          </div>
          <CopyChartButton targetId="export-evolucao-estabilidade" />
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stabilityEvolutionData} margin={{ top: 30, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradLegal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.1} />
                  <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: COLORS.text, fontSize: 11 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: COLORS.text, fontSize: 11, fontWeight: 700 }}
                unit="a"
              />
              <Tooltip content={RHChartTooltip} />
              <Legend />
              <Area
                type="monotone"
                dataKey="Administrativo"
                stroke={COLORS.primary}
                fill="url(#gradAdmin)"
                strokeWidth={3}
                dot={{ r: 4, fill: '#ffffff', stroke: COLORS.primary, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: COLORS.primary, strokeWidth: 0 }}
              >
                <LabelList dataKey="Administrativo" content={(props) => RHChartDataLabel({ ...props, fill: COLORS.primary, position: "top" })} />
              </Area>
              <Area
                type="monotone"
                dataKey="Jurídico"
                stroke={COLORS.secondary}
                fill="url(#gradLegal)"
                strokeWidth={3}
                dot={{ r: 4, fill: '#ffffff', stroke: COLORS.secondary, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: COLORS.secondary, strokeWidth: 0 }}
              >
                <LabelList dataKey="Jurídico" content={(props) => RHChartDataLabel({ ...props, fill: COLORS.secondary, position: "bottom" })} />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Charts Row 2: Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Tenure by Area */}
        <div id="export-tempo-area" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800 tracking-tight">Tempo Médio por Área</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Comparativo Setorial</p>
              </div>
            </div>
            <CopyChartButton targetId="export-tempo-area" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tenureByAreaData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.grid} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COLORS.text, fontSize: 10, fontWeight: 600 }}
                  width={120}
                />
                <Tooltip cursor={{ fill: '#f3f4f6' }} content={RHChartTooltip} />
                <Bar dataKey="avg" radius={[0, 4, 4, 0]} barSize={20} name="Anos">
                  {tenureByAreaData.map((entry, index) => {
                    const normalized = normalizeString(entry.name)
                    const isLegal = normalized.includes('juridic') // Match juridico or juridica
                    const isTerceirizada = normalized.includes('terceirizad')
                    let color = COLORS.primary
                    if (isLegal) color = COLORS.secondary
                    else if (isTerceirizada) color = COLORS.tertiary
                    
                    return <Cell key={`cell-${index}`} fill={color} />
                  })}
                  <LabelList dataKey="avg" position="right" fill={COLORS.text} fontSize={10} fontWeight={700} formatter={(val: number) => val.toFixed(1)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Experience Concentration */}
        <div id="export-concentracao-experiencia" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#1e3a8a]/10 text-[#1e3a8a]">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800 tracking-tight">Concentração Jurídico por Experiência</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Distribuição de Senioridade</p>
              </div>
            </div>
            <CopyChartButton targetId="export-concentracao-experiencia" />
          </div>
          <div className="flex flex-col md:flex-row items-center justify-around h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  data={legalExperienceData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  label={RHChartPieLabel}
                  labelLine={false}
                >
                  {legalExperienceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} />
                  ))}
                </Pie>
                <Tooltip content={RHChartTooltip} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 5. Tenure by Leader */}
      <div id="export-tempo-lider" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
        <div className="mb-6 pb-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Tempo Médio por Líder</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Liderança de Equipes</p>
            </div>
          </div>
          <CopyChartButton targetId="export-tempo-lider" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          {leaderJuridicoSocios.length > 0 && (
            <div className="flex flex-col">
              <h4 className="text-sm font-black text-gray-700 tracking-tight mb-2">Jurídico: Sócios</h4>
              <div className="w-full" style={{ height: Math.max(80, leaderJuridicoSocios.length * 35) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leaderJuridicoSocios} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.grid} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: COLORS.text, fontSize: 10, fontWeight: 600 }}
                      width={250}
                    />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} content={RHChartTooltip} />
                    <Bar dataKey="avg" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} name="Anos" className="cursor-pointer" onClick={(data) => navigate('/rh/colaboradores', { state: { leaderFilter: data.name } })}>
                      <LabelList dataKey="avg" position="right" fill="#8b5cf6" fontSize={10} fontWeight={700} formatter={(val: number) => val.toFixed(1)} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {leaderJuridicoLideres.length > 0 && (
            <div className="flex flex-col">
              <h4 className="text-sm font-black text-gray-700 tracking-tight mb-2">Jurídico: Líderes</h4>
              <div className="w-full" style={{ height: Math.max(80, leaderJuridicoLideres.length * 35) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leaderJuridicoLideres} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.grid} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: COLORS.text, fontSize: 10, fontWeight: 600 }}
                      width={250}
                    />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} content={RHChartTooltip} />
                    <Bar dataKey="avg" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} name="Anos" className="cursor-pointer" onClick={(data) => navigate('/rh/colaboradores', { state: { leaderFilter: data.name } })}>
                      <LabelList dataKey="avg" position="right" fill="#8b5cf6" fontSize={10} fontWeight={700} formatter={(val: number) => val.toFixed(1)} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
