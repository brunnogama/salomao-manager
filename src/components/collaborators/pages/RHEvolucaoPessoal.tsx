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
import { Scale } from 'lucide-react'
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
  return new Date(dateStr + 'T12:00:00').getFullYear()
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

  // 1. Headcount Evolution (Accumulated)
  const headcountChartData = useMemo(() => {
    // SCENARIO 1: Specific Year Selected -> Show Monthly Evolution (Jan-Dec) for that year
    if (filterYear !== 'todos' && filterYear !== 'Todos os anos' && filterYear !== 'Anos') {
      const selectedYearInt = parseInt(filterYear)
      const monthsList = Array.from({ length: 12 }, (_, i) => i)

      const today = new Date()
      const currentYear = today.getFullYear()
      const currentMonth = today.getMonth()

      // Determine how many months to show
      let maxMonthIndex = 11
      // If viewing current year, only show up to current month?
      // Or show full year if we want to show 0s? Usually up to current month is better for specific year view.
      if (selectedYearInt === currentYear) maxMonthIndex = currentMonth
      else if (selectedYearInt > currentYear) maxMonthIndex = -1 // Future year -> empty? or just show 0s? Let's show empty to be clean.

      const visibleMonths = monthsList.filter(m => m <= maxMonthIndex)

      return visibleMonths.map(monthIndex => {
        // Date reference: End of Month
        const date = new Date(selectedYearInt, monthIndex + 1, 0, 23, 59, 59)

        const activeAdmin = filteredData.filter(c => isActiveAtDate(c, date) && getSegment(c) === 'Administrativo').length
        const activeLegal = filteredData.filter(c => isActiveAtDate(c, date) && getSegment(c) === 'Jurídico').length

        return {
          name: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
          Administrativo: activeAdmin,
          Jurídico: activeLegal,
          Total: activeAdmin + activeLegal
        }
      })
    }

    // SCENARIO 2: All Years (Historical Evolution)
    else {
      // Get all unique years from data + current year
      const yearsSet = new Set<number>()
      filteredData.forEach(c => {
        if (c.hire_date) yearsSet.add(new Date(c.hire_date + 'T12:00:00').getFullYear())
        // Include termination years too? Not strictly necessary for headcount (active), but good for range.
        if (c.termination_date) yearsSet.add(new Date(c.termination_date + 'T12:00:00').getFullYear())
      })

      const currentYear = new Date().getFullYear()
      yearsSet.add(currentYear)

      // Filter out crazy years if any (e.g. 1900?)
      const sortedYears = Array.from(yearsSet).filter(y => y >= 2000 && y <= currentYear + 5).sort((a, b) => a - b)

      return sortedYears.map(year => {
        let date: Date

        if (filterMonth !== 'todos') {
          // Sub-scenario: Specific Month selected -> Show that month's snapshot for each year
          const monthIndex = parseInt(filterMonth)
          // Last day of that month in that year
          date = new Date(year, monthIndex + 1, 0, 23, 59, 59)
        } else {
          // Sub-scenario: No Month selected -> Show Annual (End of Year)
          // Exception: For Current Year, use Today (to show current status), or End of Year (projected/current)?
          // Using Today for current year allows "Real-time" view. 
          // Using Dec 31 for past years ensures we capture the final state.
          if (year === currentYear) {
            date = new Date() // Right now
          } else {
            date = new Date(year, 11, 31, 23, 59, 59)
          }
        }

        const activeAdmin = filteredData.filter(c => isActiveAtDate(c, date) && getSegment(c) === 'Administrativo').length
        const activeLegal = filteredData.filter(c => isActiveAtDate(c, date) && getSegment(c) === 'Jurídico').length

        // If future year (e.g. 2028 from some data anomaly) and values are just carry-over, it might look flat.
        // But logic holds: if hired before 2028 and not fired, they are active.

        return {
          name: year.toString(),
          Administrativo: activeAdmin,
          Jurídico: activeLegal,
          Total: activeAdmin + activeLegal
        }
      })
    }
  }, [filteredData, filterYear, filterMonth])
  // 2. Hiring Ranking by Role (Horizontal Bar)
  const processHiringRanking = (targetSegment: Segment) => {
    const roleCounts = new Map<string, number>()

    // Aggregation based on current filters
    filteredData.forEach(c => {
      // Apply filters first (Year/Month logic mirroring Headcount)
      const hDate = c.hire_date ? new Date(c.hire_date + 'T12:00:00') : null
      if (!hDate) return

      // Year Filter
      if (filterYear !== 'todos' && filterYear !== 'Todos os anos' && filterYear !== 'Anos') {
        if (hDate.getFullYear() !== parseInt(filterYear)) return
      }

      // Month Filter
      if (filterMonth !== 'todos') {
        if (hDate.getMonth() !== parseInt(filterMonth)) return
      }

      if (getSegment(c) !== targetSegment) return

      const roleName = c.roles?.name || String(c.role || 'Não definido')
      roleCounts.set(roleName, (roleCounts.get(roleName) || 0) + 1)
    })

    // Convert to array and sort
    const data = Array.from(roleCounts.entries())
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count) // Descending
    // Take top 10? Or all? Let's show all for now, scroll if needed or just grow.
    // User didn't specify limit, but chart size is fixed.
    // Let's name it 'y' and 'x' for simple charting

    return data
  }

  const hiringAdminRanking = useMemo(() => processHiringRanking('Administrativo'), [filteredData, filterYear, filterMonth])
  const hiringLegalRanking = useMemo(() => processHiringRanking('Jurídico'), [filteredData, filterYear, filterMonth])

  // 3. Hiring Flow (Line Area)
  const yearlyHiringFlow = useMemo(() => {
    // If Year Selected -> Monthly Flow for that year
    if (filterYear !== 'todos' && filterYear !== 'Anos') {
      const year = parseInt(filterYear)
      const months = Array.from({ length: 12 }, (_, i) => i)

      const today = new Date()
      // Limit if current year?
      let limit = 11
      if (year === today.getFullYear()) limit = today.getMonth()

      return months.filter(m => m <= limit).map(mIndex => {
        const mStart = new Date(year, mIndex, 1)
        const mEnd = new Date(year, mIndex + 1, 1)

        let adm = 0, leg = 0
        filteredData.forEach(c => {
          if (!c.hire_date) return
          const h = new Date(c.hire_date + 'T12:00:00')
          if (h >= mStart && h < mEnd) {
            if (getSegment(c) === 'Administrativo') adm++
            else leg++
          }
        })
        return {
          name: mStart.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
          Administrativo: adm,
          Jurídico: leg
        }
      })
    } else {
      // Year='Todos' -> Yearly Flow
      // If Month Filter exists -> Comparison of that Month across Years
      const yearsMap = new Map<number, { admin: number, legal: number }>()

      filteredData.forEach(c => {
        if (!c.hire_date) return
        const hDate = new Date(c.hire_date + 'T12:00:00')

        // Filter Month if selected
        if (filterMonth !== 'todos') {
          if (hDate.getMonth() !== parseInt(filterMonth)) return
        }

        const year = hDate.getFullYear()
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
    }
  }, [filteredData, filterYear, filterMonth])


  // 4. Turnover Flow (Line Area)
  const yearlyTurnoverFlow = useMemo(() => {
    // Logic mirrors Hiring Flow
    if (filterYear !== 'todos' && filterYear !== 'Anos') {
      const year = parseInt(filterYear)
      const months = Array.from({ length: 12 }, (_, i) => i)

      const today = new Date()
      let limit = 11
      if (year === today.getFullYear()) limit = today.getMonth()

      return months.filter(m => m <= limit).map(mIndex => {
        const mStart = new Date(year, mIndex, 1)
        const mEnd = new Date(year, mIndex + 1, 1)

        let adm = 0, leg = 0
        filteredData.forEach(c => {
          if (!c.termination_date) return
          const t = new Date(c.termination_date + 'T12:00:00')
          if (t >= mStart && t < mEnd) {
            if (getSegment(c) === 'Administrativo') adm++
            else leg++
          }
        })
        return {
          name: mStart.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
          Administrativo: adm,
          Jurídico: leg
        }
      })
    } else {
      const yearsMap = new Map<number, { admin: number, legal: number }>()

      filteredData.forEach(c => {
        if (!c.termination_date) return
        const tDate = new Date(c.termination_date + 'T12:00:00')

        if (filterMonth !== 'todos') {
          if (tDate.getMonth() !== parseInt(filterMonth)) return
        }

        const year = tDate.getFullYear()
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
    }
  }, [filteredData, filterYear, filterMonth])


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
    const { x, y, value, fill, dataKey } = props;
    // Basic Offset Logic
    let yOffset = -25 // Default Up

    // 1. Avoid Start/End Clipping
    // Assuming 'props.chartWidth' isn't directly available unless we pass payload length.
    // But index is 0, we can push right. If index is last, push left.
    // However, Recharts doesn't easily expose 'total length' here without extra Props.
    // We can rely on X coordinate. If X is very small (< 30), push right.
    // If X is very large (> width - 30), push left.

    // Instead of complex width logic, let's just use margins effectively and shift slightly.
    // Or check index if we knew total length. We can't know total length easily here.

    // Adjust Y based on Series to minimize overlap
    // Admin (Orange) -> Shift Down slightly if values are close? Or keep standard?
    // In the print, Admin is below Legal. So shifting Admin down might help separation.

    if (dataKey === 'Administrativo') {
      yOffset = 10 // Shift down below the point
    } else {
      yOffset = -35 // Shift up above the point
    }

    // Adjust X to avoid clipping at ends
    // We can use a simple prop passed down, or just hardcode some safe zones if margin is tight.
    // Better strategy: Increase Chart Margin. But users asked to "Conserte".
    // Let's implement dynamic anchor.

    // A simpler visual fix for overlap:
    // Admin: Below point.
    // Legal: Above point.

    return (
      <g>
        <rect
          x={x - 15}
          y={y + yOffset} // Adjusted Y
          width={30}
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
          {formatCompact(value)}
        </text>
      </g>
    );
  };

  const COLORS = {
    primary: '#ea580c',   // Admin (Dark Orange)
    secondary: '#1e3a8a', // Jurídico (Dark Blue)
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
            value={filterMonth === 'todos' ? '' : filterMonth}
            onChange={(val) => setFilterMonth(val || 'todos')}
            options={months}
            placeholder="Meses"
          />

          {/* Filter: Year */}
          <FilterSelect
            icon={Calendar}
            value={(filterYear === 'todos' || filterYear === 'Anos') ? '' : filterYear}
            onChange={(val) => setFilterYear(val || 'todos')}
            options={[{ label: 'Anos', value: 'todos' }, ...years.map(y => ({ label: y, value: y }))]}
            placeholder="Anos"
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
          <div className="absolute right-0 top-0 h-full w-1 bg-[#1e3a8a]"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ativos Jurídico</p>
            <p className="text-3xl font-black text-[#1e3a8a] mt-1">{totalActiveLegal}</p>
          </div>
          <div className="p-3 bg-[#1e3a8a]/10 rounded-xl">
            <Scale className="h-6 w-6 text-[#1e3a8a]" />
          </div>
        </div>

        {/* Total Active - Admin */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-[#ea580c]"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ativos Administrativo</p>
            <p className="text-3xl font-black text-[#ea580c] mt-1">{totalActiveAdmin}</p>
          </div>
          <div className="p-3 bg-[#ea580c]/10 rounded-xl">
            <Briefcase className="h-6 w-6 text-[#ea580c]" />
          </div>
        </div>

      </div>

      {/* 3. Charts Section */}

      {/* Chart 1: Headcount Evolution */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="mb-6 pb-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#1e3a8a]/10 text-[#1e3a8a]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Evolução Acumulada do Headcount</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {filterYear !== 'todos' && filterYear !== 'Anos'
                  ? `Mês a Mês (${filterYear})`
                  : filterMonth !== 'todos'
                    ? `Comparativo (${months.find(m => m.value === filterMonth)?.label})`
                    : 'Anual (Histórico)'}
              </p>
            </div>
          </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={headcountChartData} margin={{ top: 30, right: 30, left: 0, bottom: 0 }}>
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
                tick={{ fill: COLORS.text, fontSize: 11 }}
                dy={10}
                padding={{ left: 20, right: 20 }} // Add padding to X-axis to prevent label clipping
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

      {/* Administrative Hiring Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#ea580c]/10 text-[#ea580c]">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Contratações por Cargo (Adm)</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ranking do Período</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hiringAdminRanking} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.grid} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="role"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={100}
                  tick={{ fill: COLORS.text, fontSize: 10, fontWeight: 600 }}
                />
                <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 border border-blue-100 shadow-lg rounded-lg">
                          <p className="text-xs font-bold text-gray-700">{payload[0].payload.role}</p>
                          <p className="text-sm font-black text-[#ea580c]">{payload[0].value} contratações</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="count" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={20}>
                  <LabelList dataKey="count" position="right" fill={COLORS.primary} fontSize={10} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legal Hiring Ranking */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#1e3a8a]/10 text-[#1e3a8a]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Contratações por Cargo (Jur)</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ranking do Período</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hiringLegalRanking} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.grid} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="role"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={100}
                  tick={{ fill: COLORS.text, fontSize: 10, fontWeight: 600 }}
                />
                <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 border border-blue-100 shadow-lg rounded-lg">
                          <p className="text-xs font-bold text-gray-700">{payload[0].payload.role}</p>
                          <p className="text-sm font-black text-[#1e3a8a]">{payload[0].value} contratações</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="count" fill={COLORS.secondary} radius={[0, 4, 4, 0]} barSize={20}>
                  <LabelList dataKey="count" position="right" fill={COLORS.secondary} fontSize={10} fontWeight={700} />
                </Bar>
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
            <UserPlus className="w-4 h-4 text-[#ea580c]" />
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
            <UserMinus className="w-4 h-4 text-[#1e3a8a]" />
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


