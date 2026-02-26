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
  Scale,
  Lightbulb,
  AlertTriangle,
  GraduationCap,
  Heart
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

// --- Types & Interfaces ---

type Segment = 'Administrativo' | 'Jurídico'

// --- Helper Functions ---

const normalizeString = (str?: string) => {
  if (!str) return ''
  return str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const getSegment = (colaborador: Collaborator): Segment => {
  const area = normalizeString(colaborador.area)
  if (area === 'administrativa' || area === 'administrativo') return 'Administrativo'
  if (area === 'juridica' || area === 'juridico') return 'Jurídico'

  const roleName = colaborador.roles?.name || String(colaborador.role || '')
  const teamName = colaborador.teams?.name || String(colaborador.equipe || '')

  const role = normalizeString(roleName)
  const team = normalizeString(teamName)

  const legalKeywords = ['advogado', 'juridico', 'estagiario de direito', 'estagiario', 'socio']

  if (legalKeywords.some(k => role.includes(k) || team.includes(k))) {
    return 'Jurídico'
  }

  return 'Administrativo'
}

const isActiveAtDate = (c: Collaborator, date: Date) => {
  const hireDate = c.hire_date ? new Date(c.hire_date + 'T12:00:00') : null
  const termDate = c.termination_date ? new Date(c.termination_date + 'T12:00:00') : null

  if (!hireDate) return false
  if (hireDate > date) return false
  if (termDate && termDate <= date) return false

  return true
}

const getYearFromDate = (dateStr?: string) => {
  if (!dateStr) return null
  return new Date(dateStr + 'T12:00:00').getFullYear()
}

const calculateTenure = (hireDateStr: string, refDate: Date = new Date()) => {
  const hireDate = new Date(hireDateStr + 'T12:00:00')
  const diffTime = Math.abs(refDate.getTime() - hireDate.getTime())
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25)
  return diffYears
}

const formatYears = (years: number | undefined | null) => {
  if (years === undefined || years === null || isNaN(years)) return '0 anos'
  if (years === 0) return '0 anos'
  if (years < 1) return '< 1 ano'
  return `${years.toFixed(1)} anos`.replace('.', ',')
}

// --- Custom Label (Replicação do balão azul do Datalabels) ---
// --- Custom Label (Replicação do balão azul do Datalabels) ---
const renderCustomDataLabel = (props: any) => {
  const { x, y, value, fill, position } = props;

  // Explicit positioning logic
  let yOffset = -35 // Default Up (Top)

  if (position === 'bottom') {
    yOffset = 15 // Shift down below the point
  } else {
    yOffset = -35 // Shift up above the point
  }

  const formattedValue = typeof value === 'number' ? value.toFixed(1).replace('.', ',') : value

  return (
    <g>
      <rect
        x={x - 17}
        y={y + yOffset} // Adjusted Y
        width={34}
        height={18}
        rx={4}
        fill={fill}
      />
      <text
        x={x}
        y={y + yOffset + 12} // Centered in rect
        fill="white"
        textAnchor="middle"
        fontSize="10px"
        fontWeight="bold"
      >
        {formattedValue}
      </text>
    </g>
  );
};

const renderCustomPieLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, value, fill } = props;

  if (!cx || !cy) return null;

  const RADIAN = Math.PI / 180;
  const x = cx + (outerRadius + 30) * Math.cos(-midAngle * RADIAN);
  const y = cy + (outerRadius + 30) * Math.sin(-midAngle * RADIAN);

  return (
    <g>
      <rect
        x={x - 12}
        y={y - 9}
        width={24}
        height={18}
        rx={4}
        fill={fill} // Use slice color
      />
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="10px"
        fontWeight="bold"
      >
        {value}
      </text>
    </g>
  );
};

// --- Custom Tooltip ---
const renderCustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-xl min-w-[140px] z-50">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-3 mb-1">
            <span className="text-[10px] font-bold uppercase" style={{ color: entry.color }}>
              {entry.name}
            </span>
            <span className="text-xs font-black text-gray-700">
              {typeof entry.value === 'number' ? entry.value.toFixed(1) + ' anos' : entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

// --- Main Component ---

export function RHTempoCasa() {
  const {
    colaboradores,
    loading,
    locations: masterLocations,
    partners: masterPartners
  } = useColaboradores()

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
      if (!isActiveAtDate(c, referenceDate)) return false

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
  const avgTenureAdmin = useMemo(() => calculateAverageTenure(activeDataAtRefDate.filter(c => getSegment(c) === 'Administrativo')), [activeDataAtRefDate])
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

      const years = calculateTenure(c.hire_date!, referenceDate)
      const entry = areaMap.get(areaName)!
      entry.totalYears += years
      entry.count++
    })

    return Array.from(areaMap.entries()).map(([name, data]) => ({
      name,
      avg: parseFloat((data.totalYears / data.count).toFixed(2))
    })).sort((a, b) => b.avg - a.avg)
  }, [activeDataAtRefDate, referenceDate])

  // 3. Avg Tenure by Leader
  const tenureByLeaderData = useMemo(() => {
    const leaderMap = new Map<string, { totalYears: number, count: number }>()

    activeDataAtRefDate.forEach(c => {
      const leaderName = c.leader?.name || 'Não Definido'
      if (!leaderMap.has(leaderName)) leaderMap.set(leaderName, { totalYears: 0, count: 0 })

      const years = calculateTenure(c.hire_date!, referenceDate)
      const entry = leaderMap.get(leaderName)!
      entry.totalYears += years
      entry.count++
    })

    // Filter out small sample sizes? Maybe leaders with < 2 people? existing logic usually keeps all.
    return Array.from(leaderMap.entries())
      .filter(([name]) => name !== 'Não Definido') // Optional: hide undefined leaders
      .map(([name, data]) => ({
        name,
        avg: parseFloat((data.totalYears / data.count).toFixed(2))
      })).sort((a, b) => b.avg - a.avg)
  }, [activeDataAtRefDate, referenceDate])

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
    tertiary: '#f59e0b',
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

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

        {/* Admin Avg Tenure */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-[#ea580c]"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Média Administrativo</p>
            <p className="text-3xl font-black text-[#ea580c] mt-1">{formatYears(avgTenureAdmin)}</p>
          </div>
          <div className="p-3 bg-[#ea580c]/10 rounded-xl">
            <Briefcase className="h-6 w-6 text-[#ea580c]" />
          </div>
        </div>
      </div>

      {/* 3. Charts Row 1: Evolution */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-green-50 text-green-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-800 tracking-tight">Evolução da Estabilidade Média (Anos)</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Histórico de Retenção</p>
          </div>
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
              <Tooltip content={renderCustomTooltip} />
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
                <LabelList dataKey="Administrativo" content={(props) => renderCustomDataLabel({ ...props, fill: COLORS.primary, position: "top" })} />
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
                <LabelList dataKey="Jurídico" content={(props) => renderCustomDataLabel({ ...props, fill: COLORS.secondary, position: "bottom" })} />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Charts Row 2: Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Tenure by Area */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Tempo Médio por Área</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Comparativo Setorial</p>
            </div>
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
                <Tooltip cursor={{ fill: '#f3f4f6' }} content={renderCustomTooltip} />
                <Bar dataKey="avg" radius={[0, 4, 4, 0]} barSize={20} name="Anos">
                  {tenureByAreaData.map((entry, index) => {
                    const normalized = normalizeString(entry.name)
                    const isLegal = normalized.includes('juridic') // Match juridico or juridica
                    return <Cell key={`cell-${index}`} fill={isLegal ? COLORS.secondary : COLORS.primary} />
                  })}
                  <LabelList dataKey="avg" position="right" fill={COLORS.text} fontSize={10} fontWeight={700} formatter={(val: number) => val.toFixed(1)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tenure by Leader */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Tempo Médio por Líder</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Liderança de Equipes</p>
            </div>
          </div>
          <div className="w-full" style={{ height: Math.max(300, tenureByLeaderData.length * 35) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tenureByLeaderData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
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
                <Tooltip cursor={{ fill: '#f3f4f6' }} content={renderCustomTooltip} />
                <Bar dataKey="avg" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} name="Anos">
                  <LabelList dataKey="avg" position="right" fill="#8b5cf6" fontSize={10} fontWeight={700} formatter={(val: number) => val.toFixed(1)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 5. Experience Concentration (Full Width or Grid? User asked for: "Um gráfico com concentração de jurídico por experiência...") */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#1e3a8a]/10 text-[#1e3a8a]">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-800 tracking-tight">Concentração Jurídico por Experiência</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Distribuição de Senioridade</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-around h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={legalExperienceData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                paddingAngle={5}
                dataKey="value"
                label={renderCustomPieLabel}
                labelLine={false}
              >
                {legalExperienceData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} />
                ))}
              </Pie>
              <Tooltip content={renderCustomTooltip} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. Strategic HR Insights & Actions */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col space-y-6">
        <div className="pb-4 border-b border-gray-100 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-800 tracking-tight">Insights e Ações Estratégicas de RH</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estabilidade e Retenção de Talentos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* Rotatividade Recém-contratados */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col space-y-3">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle size={20} />
              <h4 className="font-black text-sm uppercase tracking-tight">Rotatividade Curto Prazo</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              <span className="font-bold text-gray-800">Custo de Onboarding:</span> Desligamentos precoces (- de 1 ano) indicam desalinhamento de cultura ou falha no recrutamento.
            </p>
            <div className="mt-auto pt-3 border-t border-gray-200">
              <p className="text-[10px] font-black text-blue-900 uppercase">Ação Recomendada:</p>
              <p className="text-xs text-blue-900">Reforçar entrevistas focadas em fit cultural e intensificar o acompanhamento nos primeiros 90 dias.</p>
            </div>
          </div>

          {/* Retenção de Talentos Críticos */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col space-y-3">
            <div className="flex items-center gap-2 text-pink-600 mb-2">
              <Heart size={20} />
              <h4 className="font-black text-sm uppercase tracking-tight">Engajamento e Retenção</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              <span className="font-bold text-gray-800">Risco em Plenos/Seniores:</span> A permanência estável entre 3-5 anos pode ser palco para estagnação se não houver um plano claro.
            </p>
            <div className="mt-auto pt-3 border-t border-gray-200">
              <p className="text-[10px] font-black text-pink-800 uppercase">Ação Recomendada:</p>
              <p className="text-xs text-pink-800">Mapear talentos nesta faixa para programas de liderança e novos desafios de gestão.</p>
            </div>
          </div>

          {/* Conhecimento Institucional */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <GraduationCap size={20} />
              <h4 className="font-black text-sm uppercase tracking-tight">Conhecimento Institucional</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              <span className="font-bold text-gray-800">Veteranos (+5 anos):</span> Representam a memória cultural e processual do escritório. A não disseminação desse conhecimento é um risco elevado.
            </p>
            <div className="mt-auto pt-3 border-t border-gray-200">
              <p className="text-[10px] font-black text-indigo-800 uppercase">Ação Recomendada:</p>
              <p className="text-xs text-indigo-800">Programas de mentoria "Veterano-Novato" para acelerar o ramp-up de novos colaboradores e espalhar a cultura.</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
