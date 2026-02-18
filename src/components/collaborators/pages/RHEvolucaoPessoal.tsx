import { useState, useMemo } from 'react'
import {
  TrendingUp,
  Filter,
  Users,
  Briefcase,
  UserMinus,
  UserPlus,
  Calendar,
  X
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
  LabelList
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
  // 1. Try to use the explicit 'area' field if available
  const area = normalizeString(colaborador.area)
  if (area === 'administrativa' || area === 'administrativo') return 'Administrativo'
  if (area === 'juridica' || area === 'juridico') return 'Jurídico'

  // 2. Fallback to keywords in Role/Team
  // Access safe navigation for roles.name because role might be ID now
  const roleName = colaborador.roles?.name || String(colaborador.role || '')
  const teamName = colaborador.teams?.name || String(colaborador.equipe || '')

  const role = normalizeString(roleName)
  const team = normalizeString(teamName)

  // Keywords indicating Legal sector
  const legalKeywords = ['advogado', 'juridico', 'estagiario de direito', 'estagiario', 'socio']

  // Checks
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
  return new Date(dateStr).getFullYear()
}

const formatCompact = (val: number) => {
  if (val === 0) return '0'
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1
  }).format(val);
}

// --- Main Component ---

export function RHEvolucaoPessoal() {
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
  const [filterPartner, setFilterPartner] = useState<string>('todos')

  // --- Derived Data / Lists for Filters ---
  const years = useMemo(() => {
    const yearsSet = new Set<string>()
    colaboradores.forEach(c => {
      if (c.hire_date) yearsSet.add(getYearFromDate(c.hire_date)!.toString())
      if (c.termination_date) yearsSet.add(getYearFromDate(c.termination_date)!.toString())
    })
    const sorted = Array.from(yearsSet).sort().reverse()
    return ['Todos os anos', ...sorted]
  }, [colaboradores])

  const months = [
    { label: 'Todos os meses', value: 'todos' },
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

  // Use Master Lists for Options
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

  // --- Filtered Data ---
  const filteredData = useMemo(() => {
    return colaboradores.filter(c => {
      // Local Filter (Compare IDs)
      if (filterLocal !== 'todos') {
        // c.local is now the ID (number or string)
        if (String(c.local) !== filterLocal) return false
      }

      // Partner Filter (Compare IDs)
      if (filterPartner !== 'todos') {
        const cPartnerId = c.partner_id ? String(c.partner_id) : (c.partner && c.partner.id ? String(c.partner.id) : null)

        // Handle case where we might only have name but filter is ID (fallback)
        // If masterPartners has the ID selected, we expect match on ID.
        // If c.partner_id is null, check if logic needs update. 
        // For now assume partner_id is populated correctly or c.socio logic handled in hook.

        if (cPartnerId !== filterPartner) return false
      }

      return true
    })
  }, [colaboradores, filterLocal, filterPartner])

  // --- KPI Calculations ---
  // Determine reference date for KPIs
  const referenceDate = useMemo(() => {
    const now = new Date()
    let year = now.getFullYear()
    let month = now.getMonth()

    if (filterYear !== 'todos' && filterYear !== 'Todos os anos') {
      year = parseInt(filterYear)
      // If specific year selected, check month
      if (filterMonth !== 'todos') {
        month = parseInt(filterMonth)
        // Set to last day of that month
        return new Date(year, month + 1, 0, 23, 59, 59)
      } else {
        // If only year selected, use end of year (or current date if current year?)
        // Usually "2023" means "End of 2023" for stats
        if (year === now.getFullYear()) return now
        return new Date(year, 11, 31, 23, 59, 59)
      }
    } else {
      // If "Todos" years selected, but specific month? (Weird case, assume current year's month)
      if (filterMonth !== 'todos') {
        month = parseInt(filterMonth)
        return new Date(year, month + 1, 0, 23, 59, 59)
      }
    }
    return now
  }, [filterYear, filterMonth])

  const totalActive = useMemo(() => {
    return filteredData.filter(c => isActiveAtDate(c, referenceDate)).length
  }, [filteredData, referenceDate])

  const totalActiveAdmin = useMemo(() => {
    return filteredData.filter(c => isActiveAtDate(c, referenceDate) && getSegment(c) === 'Administrativo').length
  }, [filteredData, referenceDate])

  const totalActiveLegal = useMemo(() => {
    return filteredData.filter(c => isActiveAtDate(c, referenceDate) && getSegment(c) === 'Jurídico').length
  }, [filteredData, referenceDate])

  // --- Charts Data Preparation ---

  // 1. Headcount Evolution (Accumulated) - Monthly for Selected Year
  const headcountChartData = useMemo(() => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() // 0-indexed (0=Jan, 1=Feb, etc.)

    // If 'todos' is selected, default to current year for the chart
    const selectedYearInt = (filterYear === 'todos' || filterYear === 'Todos os anos')
      ? currentYear
      : parseInt(filterYear)
    const isCurrentYear = selectedYearInt === currentYear

    // Determine how many months to show
    let maxMonthIndex = 11
    if (isCurrentYear) {
      maxMonthIndex = currentMonth
    } else if (selectedYearInt > currentYear) {
      maxMonthIndex = -1 // Don't show anything for future years
    }

    const months = Array.from({ length: 12 }, (_, i) => i).filter(m => m <= maxMonthIndex)

    // Calculate initial headcount (jan 1st of selected year)
    let currentAdmin = 0
    let currentLegal = 0

    // PRE-CALCULATION: Count people active BEFORE Jan 1st of selected year
    filteredData.forEach(c => {
      // Add time to ensure it falls on the correct local day
      const hireDate = c.hire_date ? new Date(c.hire_date + 'T12:00:00') : null
      const termDate = c.termination_date ? new Date(c.termination_date + 'T12:00:00') : null
      const segment = getSegment(c)

      if (hireDate) {
        const startOfYear = new Date(selectedYearInt, 0, 1)
        // Hired strictly before start of year
        if (hireDate < startOfYear) {
          // Rule: Active if NOT terminated OR terminated ON or AFTER start of year
          if (!termDate || termDate >= startOfYear) {
            if (segment === 'Administrativo') currentAdmin++
            else currentLegal++
          }
        }
      }
    })

    const data = months.map(monthIndex => {
      // Define limits for this month
      // Start: 1st day of month
      const monthStart = new Date(selectedYearInt, monthIndex, 1)
      // End: Start of next month
      const nextMonthStart = new Date(selectedYearInt, monthIndex + 1, 1)

      // Transactions within this specific month
      let hiresAdmin = 0
      let hiresLegal = 0
      let termsAdmin = 0
      let termsLegal = 0

      filteredData.forEach(c => {
        const segment = getSegment(c)

        // Hires in this month
        if (c.hire_date) {
          const hDate = new Date(c.hire_date + 'T12:00:00')
          if (hDate >= monthStart && hDate < nextMonthStart) {
            if (segment === 'Administrativo') hiresAdmin++
            else hiresLegal++
          }
        }

        // Terminations in this month
        if (c.termination_date) {
          const tDate = new Date(c.termination_date + 'T12:00:00')
          if (tDate >= monthStart && tDate < nextMonthStart) {
            if (segment === 'Administrativo') termsAdmin++
            else termsLegal++
          }
        }
      })

      // Update cumulative counts
      currentAdmin += (hiresAdmin - termsAdmin)
      currentLegal += (hiresLegal - termsLegal)

      return {
        name: monthStart.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        Administrativo: currentAdmin,
        Jurídico: currentLegal,
        Total: currentAdmin + currentLegal
      }
    })

    return data
  }, [filteredData, filterYear])


  // 2. Continuous Hiring by Role (Stacked Bar) - Admin & Legal Separate
  // Data Structure: [{ month: 'Jan', 'Advogado': 2, 'Paralegal': 1, ... }, ...]

  // 2. Continuous Hiring by Role (Stacked Bar) - Admin & Legal Separate
  // Data Structure: [{ month: 'Jan', 'Advogado': 2, 'Paralegal': 1, ... }, ...]

  const processHiringByRole = (targetSegment: Segment) => {
    // 1. Initialize 12 months structure
    const targetYear = (filterYear === 'todos' || filterYear === 'Todos os anos')
      ? new Date().getFullYear()
      : parseInt(filterYear)

    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(targetYear, i, 1)
      return {
        monthIndex: i,
        name: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        total: 0
      }
    }) as any[]

    const uniqueRoles = new Set<string>()

    // 2. Populate data
    filteredData.forEach(c => {
      if (!c.hire_date) return
      // Use time to avoid timezone shifts
      const hDate = new Date(c.hire_date + 'T12:00:00')
      if (hDate.getFullYear() !== targetYear) return

      if (getSegment(c) !== targetSegment) return

      const monthIndex = hDate.getMonth()
      // Use role name safely
      const roleName = c.roles?.name || String(c.role || 'Não definido')

      uniqueRoles.add(roleName)

      // Increment count for this role in this month
      if (months[monthIndex]) {
        months[monthIndex][roleName] = (months[monthIndex][roleName] || 0) + 1
        months[monthIndex].total++
      }
    })

    // 3. Filter for display if needed
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()
    const selectedYearInt = targetYear
    const isCurrentYear = selectedYearInt === currentYear

    let maxMonthIndex = 11
    if (isCurrentYear) {
      maxMonthIndex = currentMonth
    } else if (selectedYearInt > currentYear) {
      maxMonthIndex = -1
    }

    const finalMonths = months.filter(m => m.monthIndex <= maxMonthIndex)

    return { data: finalMonths, roles: Array.from(uniqueRoles) }
  }

  const hiringAdmin = useMemo(() => processHiringByRole('Administrativo'), [filteredData, filterYear])
  const hiringLegal = useMemo(() => processHiringByRole('Jurídico'), [filteredData, filterYear])

  // Generate colors for roles
  const roleColors = [
    '#4169E1', '#556B2F', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1', '#14b8a6'
  ]


  // 3. Yearly Hiring Flow (Fluxo de Contratações) - Line Chart
  const yearlyHiringFlow = useMemo(() => {
    // Get range of years from data or default to recent
    const yearsMap = new Map<number, { admin: number, legal: number }>()

    filteredData.forEach(c => {
      if (!c.hire_date) return
      // Use time to avoid timezone shifts
      const year = new Date(c.hire_date + 'T12:00:00').getFullYear()
      if (!yearsMap.has(year)) yearsMap.set(year, { admin: 0, legal: 0 })

      const counts = yearsMap.get(year)!
      if (getSegment(c) === 'Administrativo') counts.admin++
      else counts.legal++
    })

    const sortedYears = Array.from(yearsMap.keys()).sort((a, b) => a - b)
    // If empty, show at least current year
    if (sortedYears.length === 0) sortedYears.push(new Date().getFullYear())

    // Fill gaps? Or just show data points. Let's just show present years.
    return sortedYears.map(year => ({
      name: year.toString(),
      Administrativo: yearsMap.get(year)?.admin || 0,
      Jurídico: yearsMap.get(year)?.legal || 0
    }))
  }, [filteredData]) // Not dependent on filterYear, shows historical trend


  // 4. Yearly Turnover Flow (Fluxo de Desligamentos) - Line Chart
  const yearlyTurnoverFlow = useMemo(() => {
    const yearsMap = new Map<number, { admin: number, legal: number }>()

    filteredData.forEach(c => {
      if (!c.termination_date) return
      const year = new Date(c.termination_date).getFullYear()
      if (!yearsMap.has(year)) yearsMap.set(year, { admin: 0, legal: 0 })

      const counts = yearsMap.get(year)!
      if (getSegment(c) === 'Administrativo') counts.admin++
      else counts.legal++
    })

    const sortedYears = Array.from(yearsMap.keys()).sort((a, b) => a - b)
    if (sortedYears.length === 0) sortedYears.push(new Date().getFullYear())

    return sortedYears.map(year => ({
      name: year.toString(),
      Administrativo: yearsMap.get(year)?.admin || 0,
      Jurídico: yearsMap.get(year)?.legal || 0
    }))
  }, [filteredData])


  // --- Custom Tooltip ---
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-xl min-w-[140px] z-50">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3 mb-1">
              <span className="text-[10px] font-bold uppercase" style={{ color: entry.color }}>
                {entry.name}
              </span>
              <span className="text-xs font-black text-gray-700">{entry.value}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // --- Custom Label (Replicação do balão azul do Datalabels) ---
  const CustomDataLabel = (props: any) => {
    const { x, y, value, fill } = props;
    // Se o valor for zero, talvez não exibir? Ou exibir. Aero exibe sempre.
    return (
      <g>
        <rect
          x={x - 15}
          y={y - 25}
          width={30}
          height={18}
          rx={4}
          fill={fill} // Usa a cor da série (Admin=Orange, Legal=Royal)
        />
        <text
          x={x}
          y={y - 13}
          fill="white"
          textAnchor="middle"
          fontSize="10px"
          fontWeight="bold"
        >
          {formatCompact(value)}
        </text>
      </g>
    );
  };

  const COLORS = {
    primary: '#374151',   // Admin (Graphite)
    secondary: '#4169E1', // Jurídico (Royal Blue)
    tertiary: '#f59e0b',  // Amber
    text: '#6b7280',
    grid: '#e5e7eb'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6">

      {/* 1. Header & Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-3 shadow-lg">
            <TrendingUp className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Evolução de Pessoal</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Análise de Headcount e Turnover</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter: Month */}
          <FilterSelect
            icon={Calendar}
            value={filterMonth}
            onChange={setFilterMonth}
            options={months}
            placeholder="Mês"
          />

          {/* Filter: Year */}
          <FilterSelect
            icon={Calendar}
            value={filterYear === 'todos' ? 'Todos os anos' : filterYear}
            onChange={(val) => {
              const value = val === 'Todos os anos' ? 'todos' : val
              setFilterYear(value)
            }}
            options={years.map(y => ({ label: y, value: y === 'Todos os anos' ? 'todos' : y }))}
            placeholder="Ano"
          />

          {/* Filter: Local */}
          <FilterSelect
            icon={Filter}
            value={filterLocal === 'todos' ? '' : filterLocal}
            onChange={(val) => setFilterLocal(val || 'todos')}
            options={locationOptions}
            placeholder="Local"
          />

          {/* Filter: Partner */}
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
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Total Active - General */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-gray-800"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Ativos</p>
            <p className="text-3xl font-black text-gray-800 mt-1">{totalActive}</p>
          </div>
          <div className="p-3 bg-gray-100 rounded-xl">
            <Users className="h-6 w-6 text-gray-600" />
          </div>
        </div>

        {/* Total Active - Legal */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-[#4169E1]"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ativos Jurídico</p>
            <p className="text-3xl font-black text-[#4169E1] mt-1">{totalActiveLegal}</p>
          </div>
          <div className="p-3 bg-[#4169E1]/10 rounded-xl">
            <TrendingUp className="h-6 w-6 text-[#4169E1]" />
          </div>
        </div>

        {/* Total Active - Admin */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-[#374151]"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ativos Administrativo</p>
            <p className="text-3xl font-black text-[#374151] mt-1">{totalActiveAdmin}</p>
          </div>
          <div className="p-3 bg-[#374151]/10 rounded-xl">
            <Briefcase className="h-6 w-6 text-[#374151]" />
          </div>
        </div>

      </div>

      {/* 3. Charts Section */}

      {/* Chart 1: Headcount Evolution */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="mb-6 pb-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#4169E1]/10 text-[#4169E1]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Evolução Acumulada do Headcount</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Administrativo vs Jurídico ({filterYear})</p>
            </div>
          </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={headcountChartData} margin={{ top: 30, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLegal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: COLORS.text, fontSize: 11, fontWeight: 700 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: COLORS.text, fontSize: 11, fontWeight: 700 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="Administrativo"
                stroke={COLORS.primary}
                fillOpacity={1}
                fill="url(#colorAdmin)"
                strokeWidth={3}
                dot={{ r: 4, fill: '#ffffff', stroke: COLORS.primary, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: COLORS.primary, strokeWidth: 0 }}
              >
                <LabelList dataKey="Administrativo" content={<CustomDataLabel fill={COLORS.primary} />} />
              </Area>
              <Area
                type="monotone"
                dataKey="Jurídico"
                stroke={COLORS.secondary}
                fillOpacity={1}
                fill="url(#colorLegal)"
                strokeWidth={3}
                dot={{ r: 4, fill: '#ffffff', stroke: COLORS.secondary, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: COLORS.secondary, strokeWidth: 0 }}
              >
                <LabelList dataKey="Jurídico" content={<CustomDataLabel fill={COLORS.secondary} />} />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Hiring by Role (Administrative & Legal) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Administrative Hiring */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#374151]/10 text-[#374151]">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Contratações por Cargo (Adm)</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{filterYear === 'todos' ? new Date().getFullYear() : filterYear}</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hiringAdmin.data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {hiringAdmin.roles.map((role, idx) => (
                  <Bar key={role} dataKey={role} stackId="a" fill={roleColors[idx % roleColors.length]} radius={[0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legal Hiring */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#4169E1]/10 text-[#4169E1]">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Contratações por Cargo (Jur)</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{filterYear === 'todos' ? new Date().getFullYear() : filterYear}</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hiringLegal.data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {hiringLegal.roles.map((role, idx) => (
                  <Bar key={role} dataKey={role} stackId="a" fill={roleColors[idx % roleColors.length]} radius={[0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>


      {/* Flow Charts Trend (Yearly) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 3: Hiring Flow (Historical) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex-1">
          <div className="mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#374151]" />
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">Fluxo de Contratações (Anual)</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yearlyHiringFlow} margin={{ top: 30, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAdminFlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLegalFlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="Administrativo"
                  stroke={COLORS.primary}
                  fillOpacity={1}
                  fill="url(#colorAdminFlow)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#ffffff', stroke: COLORS.primary, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: COLORS.primary, strokeWidth: 0 }}
                >
                  <LabelList dataKey="Administrativo" content={<CustomDataLabel fill={COLORS.primary} />} />
                </Area>
                <Area
                  type="monotone"
                  dataKey="Jurídico"
                  stroke={COLORS.secondary}
                  fillOpacity={1}
                  fill="url(#colorLegalFlow)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#ffffff', stroke: COLORS.secondary, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: COLORS.secondary, strokeWidth: 0 }}
                >
                  <LabelList dataKey="Jurídico" content={<CustomDataLabel fill={COLORS.secondary} />} />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Turnover Flow (Historical) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex-1">
          <div className="mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
            <UserMinus className="w-4 h-4 text-[#4169E1]" />
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">Fluxo de Desligamentos (Anual)</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yearlyTurnoverFlow} margin={{ top: 30, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAdminTurn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLegalTurn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="Administrativo"
                  stroke={COLORS.primary}
                  fillOpacity={1}
                  fill="url(#colorAdminTurn)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#ffffff', stroke: COLORS.primary, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: COLORS.primary, strokeWidth: 0 }}
                >
                  <LabelList dataKey="Administrativo" content={<CustomDataLabel fill={COLORS.primary} />} />
                </Area>
                <Area
                  type="monotone"
                  dataKey="Jurídico"
                  stroke={COLORS.secondary}
                  fillOpacity={1}
                  fill="url(#colorLegalTurn)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#ffffff', stroke: COLORS.secondary, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: COLORS.secondary, strokeWidth: 0 }}
                >
                  <LabelList dataKey="Jurídico" content={<CustomDataLabel fill={COLORS.secondary} />} />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  )
}

function ScaleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  )
}
