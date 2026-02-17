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
  Cell,
  LineChart,
  Line
} from 'recharts'
import { useColaboradores } from '../hooks/useColaboradores'
import { Collaborator } from '../../../types/controladoria'
import { FilterSelect } from '../../controladoria/ui/FilterSelect'

// --- Types & Interfaces ---

type Segment = 'Administrativo' | 'Jurídico'

// --- Helper Functions ---

const getSegment = (colaborador: Collaborator): Segment => {
  // 1. Try to use the explicit 'area' field if available
  if (colaborador.area === 'Administrativa') return 'Administrativo'
  if (colaborador.area === 'Jurídica') return 'Jurídico'

  // 2. Fallback to keywords in Role/Team
  const role = (colaborador.roles?.name || colaborador.role || '').toLowerCase()
  const team = (colaborador.teams?.name || colaborador.equipe || '').toLowerCase()

  // Keywords indicating Legal sector
  const legalKeywords = ['advogado', 'juridico', 'jurídico', 'estagiário de direito', 'sócio', 'socio']

  // Checks
  if (legalKeywords.some(k => role.includes(k) || team.includes(k))) {
    return 'Jurídico'
  }

  return 'Administrativo'
}

const getYearFromDate = (dateStr?: string) => {
  if (!dateStr) return null
  return new Date(dateStr).getFullYear()
}

// --- Main Component ---

export function RHEvolucaoPessoal() {
  const { colaboradores, loading } = useColaboradores()

  // --- State for Filters ---
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString())
  const [filterLocal, setFilterLocal] = useState<string>('todos')
  const [filterPartner, setFilterPartner] = useState<string>('todos')
  const [searchTerm, setSearchTerm] = useState('')

  // --- Derived Data / Lists for Filters ---
  const years = useMemo(() => {
    const yearsSet = new Set<string>()
    colaboradores.forEach(c => {
      if (c.hire_date) yearsSet.add(getYearFromDate(c.hire_date)!.toString())
      if (c.termination_date) yearsSet.add(getYearFromDate(c.termination_date)!.toString())
    })
    const sorted = Array.from(yearsSet).sort().reverse()
    if (sorted.length === 0) return [new Date().getFullYear().toString()]
    return sorted
  }, [colaboradores])

  const locations = useMemo(() => {
    const locs = new Set(colaboradores.map(c => c.locations?.name || c.local).filter(Boolean))
    return Array.from(locs).sort()
  }, [colaboradores])

  const partners = useMemo(() => {
    const partsNames = new Set(colaboradores.map(c => c.partner?.name).filter(Boolean))
    return Array.from(partsNames).sort()
  }, [colaboradores])

  // --- Filtered Data ---
  const filteredData = useMemo(() => {
    return colaboradores.filter(c => {
      // Local Filter
      if (filterLocal !== 'todos') {
        const cLocal = c.locations?.name || c.local
        if (cLocal !== filterLocal) return false
      }

      // Partner Filter
      if (filterPartner !== 'todos') {
        const cPartner = c.partner?.name
        if (cPartner !== filterPartner) return false
      }

      // Search Filter
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase()
        return (
          c.name.toLowerCase().includes(lowerSearch) ||
          c.email?.toLowerCase().includes(lowerSearch)
        )
      }

      return true
    })
  }, [colaboradores, filterLocal, filterPartner, searchTerm])

  // --- KPI Calculations ---

  const totalActive = useMemo(() => {
    return filteredData.filter(c => c.status === 'active' || c.status === 'ativo').length
  }, [filteredData])

  const totalActiveAdmin = useMemo(() => {
    return filteredData.filter(c => (c.status === 'active' || c.status === 'ativo') && getSegment(c) === 'Administrativo').length
  }, [filteredData])

  const totalActiveLegal = useMemo(() => {
    return filteredData.filter(c => (c.status === 'active' || c.status === 'ativo') && getSegment(c) === 'Jurídico').length
  }, [filteredData])

  // --- Charts Data Preparation ---

  // 1. Headcount Evolution (Accumulated) - Monthly for Selected Year
  const headcountChartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i) // 0..11
    const selectedYearInt = parseInt(filterYear)

    // Calculate initial headcount (jan 1st of selected year)
    let currentAdmin = 0
    let currentLegal = 0

    // Count people active before Jan 1st
    filteredData.forEach(c => {
      const hireDate = c.hire_date ? new Date(c.hire_date) : null
      const termDate = c.termination_date ? new Date(c.termination_date) : null
      const segment = getSegment(c)

      if (hireDate) {
        const startOfYear = new Date(selectedYearInt, 0, 1)
        // Hired before start of year
        if (hireDate < startOfYear) {
          // Not terminated OR terminated after start of year
          if (!termDate || termDate >= startOfYear) {
            if (segment === 'Administrativo') currentAdmin++
            else currentLegal++
          }
        }
      }
    })

    const data = months.map(monthIndex => {
      const monthDate = new Date(selectedYearInt, monthIndex, 1) // 1st day of month
      const nextMonthDate = new Date(selectedYearInt, monthIndex + 1, 1) // 1st day of next month

      // Transactions within this month
      let hiresAdmin = 0
      let hiresLegal = 0
      let termsAdmin = 0
      let termsLegal = 0

      filteredData.forEach(c => {
        const segment = getSegment(c)

        // Hires in this month
        if (c.hire_date) {
          const hDate = new Date(c.hire_date)
          // Check if hire date is within this month
          if (hDate >= monthDate && hDate < nextMonthDate) {
            if (segment === 'Administrativo') hiresAdmin++
            else hiresLegal++
          }
        }

        // Terminations in this month
        if (c.termination_date) {
          const tDate = new Date(c.termination_date)
          // Check if termination date is within this month
          if (tDate >= monthDate && tDate < nextMonthDate) {
            if (segment === 'Administrativo') termsAdmin++
            else termsLegal++
          }
        }
      })

      // Update cumulative counts
      currentAdmin += (hiresAdmin - termsAdmin)
      currentLegal += (hiresLegal - termsLegal)

      return {
        name: monthDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        Administrativo: currentAdmin,
        Jurídico: currentLegal,
        Total: currentAdmin + currentLegal
      }
    })

    return data
  }, [filteredData, filterYear])


  // 2. Continuous Hiring by Role (Stacked Bar) - Admin & Legal Separate
  // Data Structure: [{ month: 'Jan', 'Advogado': 2, 'Paralegal': 1, ... }, ...]

  const processHiringByRole = (targetSegment: Segment) => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(parseInt(filterYear), i, 1)
      return {
        monthIndex: i,
        name: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        total: 0
      }
    }) as any[]

    const uniqueRoles = new Set<string>()

    filteredData.forEach(c => {
      if (!c.hire_date) return
      const hDate = new Date(c.hire_date)
      if (hDate.getFullYear().toString() !== filterYear) return

      if (getSegment(c) !== targetSegment) return

      const monthIndex = hDate.getMonth()
      const roleName = c.roles?.name || c.role || 'Não definido'

      uniqueRoles.add(roleName)

      // Increment count for this role in this month
      months[monthIndex][roleName] = (months[monthIndex][roleName] || 0) + 1
      months[monthIndex].total++
    })

    return { data: months, roles: Array.from(uniqueRoles) }
  }

  const hiringAdmin = useMemo(() => processHiringByRole('Administrativo'), [filteredData, filterYear])
  const hiringLegal = useMemo(() => processHiringByRole('Jurídico'), [filteredData, filterYear])

  // Generate colors for roles
  const roleColors = [
    '#1e3a8a', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#14b8a6'
  ]


  // 3. Yearly Hiring Flow (Fluxo de Contratações) - Line Chart
  const yearlyHiringFlow = useMemo(() => {
    // Get range of years from data or default to recent
    const yearsMap = new Map<number, { admin: number, legal: number }>()

    filteredData.forEach(c => {
      if (!c.hire_date) return
      const year = new Date(c.hire_date).getFullYear()
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

  const COLORS = {
    primary: '#1e3a8a',
    secondary: '#10b981', // Emerald
    tertiary: '#f59e0b', // Amber
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

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-3 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold outline-none focus:border-blue-500 transition-all w-[150px]"
            />
          </div>

          {/* Filter: Year */}
          <FilterSelect
            icon={Calendar}
            value={filterYear}
            onChange={setFilterYear}
            options={years.map(y => ({ label: y, value: y }))}
            placeholder="Ano"
          />

          {/* Filter: Local */}
          <FilterSelect
            icon={Filter}
            value={filterLocal === 'todos' ? '' : filterLocal}
            onChange={(val) => setFilterLocal(val || 'todos')}
            options={locations.map(l => ({ label: l as string, value: l as string }))}
            placeholder="Local"
          />

          {/* Filter: Partner */}
          <FilterSelect
            icon={Users}
            value={filterPartner === 'todos' ? '' : filterPartner}
            onChange={(val) => setFilterPartner(val || 'todos')}
            options={partners.map(p => ({ label: p as string, value: p as string }))}
            placeholder="Sócio"
          />

          {(filterLocal !== 'todos' || filterPartner !== 'todos' || searchTerm) && (
            <button
              onClick={() => { setFilterLocal('todos'); setFilterPartner('todos'); setSearchTerm(''); }}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Total Active - Admin */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-blue-600"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ativos Administrativo</p>
            <p className="text-3xl font-black text-blue-900 mt-1">{totalActiveAdmin}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        {/* Total Active - Legal */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-emerald-600"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ativos Jurídico</p>
            <p className="text-3xl font-black text-emerald-900 mt-1">{totalActiveLegal}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl">
            <ScaleIcon className="h-6 w-6 text-emerald-600" />
          </div>
        </div>

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
      </div>

      {/* 3. Charts Section */}

      {/* Chart 1: Headcount Evolution */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="mb-6 pb-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
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
            <AreaChart data={headcountChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLegal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.1} />
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
              />
              <Area
                type="monotone"
                dataKey="Jurídico"
                stroke={COLORS.secondary}
                fillOpacity={1}
                fill="url(#colorLegal)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Hiring by Role (Administrative & Legal) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Administrative Hiring */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Contratações por Cargo (Adm)</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{filterYear}</p>
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
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Contratações por Cargo (Jur)</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{filterYear}</p>
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
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">Fluxo de Contratações (Anual)</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearlyHiringFlow}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="Administrativo" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Jurídico" stroke={COLORS.secondary} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Turnover Flow (Historical) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex-1">
          <div className="mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
            <UserMinus className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">Fluxo de Desligamentos (Anual)</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearlyTurnoverFlow}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="Administrativo" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Jurídico" stroke={COLORS.secondary} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
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