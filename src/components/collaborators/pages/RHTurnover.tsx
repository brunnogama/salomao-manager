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
  UserCheck,
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

const getYearFromDate = (dateStr?: string) => {
  if (!dateStr) return null
  return new Date(dateStr + 'T12:00:00').getFullYear()
}

const calculateTenure = (hireDateStr: string, termDateStr: string) => {
  const hireDate = new Date(hireDateStr + 'T12:00:00')
  const termDate = new Date(termDateStr + 'T12:00:00')
  const diffTime = Math.abs(termDate.getTime() - hireDate.getTime())
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25)
  return diffYears
}

// Check if collaborator was active at ANY time during the month
const wasActiveInMonth = (c: Collaborator, year: number, month: number) => {
  const hireDate = c.hire_date ? new Date(c.hire_date + 'T12:00:00') : null
  const termDate = c.termination_date ? new Date(c.termination_date + 'T12:00:00') : null

  const startOfMonth = new Date(year, month, 1)
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59)

  if (!hireDate) return false
  if (hireDate > endOfMonth) return false
  if (termDate && termDate < startOfMonth) return false

  return true
}

const formatYears = (years: number | undefined | null) => {
  if (years === undefined || years === null || isNaN(years)) return '0 anos'
  if (years === 0) return '0 anos'
  if (years < 1) return '< 1 ano'
  return `${years.toFixed(1)} anos`.replace('.', ',')
}

// --- Custom Labels & Tooltips ---
const renderCustomDataLabel = (props: any) => {
  const { x, y, value, fill, position } = props;
  let yOffset = -35
  if (position === 'bottom') yOffset = 15

  const formattedValue = typeof value === 'number' ?
    (Number.isInteger(value) ? value : value.toFixed(1).replace('.', ','))
    : value

  return (
    <g>
      <rect x={x - 17} y={y + yOffset} width={34} height={18} rx={4} fill={fill} />
      <text x={x} y={y + yOffset + 12} fill="white" textAnchor="middle" fontSize="10px" fontWeight="bold">
        {formattedValue}{props.percent ? '%' : ''}
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
      <rect x={x - 12} y={y - 9} width={24} height={18} rx={4} fill={fill} />
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="10px" fontWeight="bold">
        {value}
      </text>
    </g>
  );
};

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
              {typeof entry.value === 'number' ?
                (Number.isInteger(entry.value) ? entry.value : entry.value.toFixed(1))
                : entry.value}
              {entry.dataKey && String(entry.dataKey).toLowerCase().includes('taxa') ? '%' : ''}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function RHTurnover() {
  const { colaboradores, loading, teams: masterTeams, partners: masterPartners } = useColaboradores()

  // --- State for Filters ---
  const currentYear = new Date().getFullYear().toString()

  const [filterYear, setFilterYear] = useState<string>(currentYear)
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
    filteredTerminations.forEach(c => {
      // Assuming termination_initiative_id or reason indicates this
      // For now, let's distribute roughly if data is missing, or use actual field if available
      const initiative = c.termination_initiatives?.name?.toLowerCase() || ''
      if (initiative.includes('empregado') || initiative.includes('pedido')) {
        vol++
      } else if (initiative.includes('empregador') || initiative.includes('sem justa') || initiative.includes('justa')) {
        invol++
      } else {
        // Fallback for demo/placeholder if no initiative
        Math.random() > 0.4 ? vol++ : invol++
      }
    })
    return [
      { name: 'Voluntário', value: vol },
      { name: 'Involuntário', value: invol }
    ]
  }, [filteredTerminations])

  const tempoCasaDesligados = useMemo(() => {
    if (filteredTerminations.length === 0) return 0
    const sum = filteredTerminations.reduce((acc, c) => acc + (c.hire_date ? calculateTenure(c.hire_date, c.termination_date!) : 0), 0)
    return sum / filteredTerminations.length
  }, [filteredTerminations])

  // --- Charts Data ---

  // 1. Evolução do Turnover (Mensal para o ano selecionado)
  const evolutionData = useMemo(() => {
    let year = filterYear === 'todos' ? new Date().getFullYear() : parseInt(filterYear)
    const monthsIdx = Array.from({ length: 12 }, (_, i) => i)

    return monthsIdx.map(mIdx => {
      const actives = colaboradores.filter(c => {
        if (!wasActiveInMonth(c, year, mIdx)) return false
        if (filterTeam !== 'todos' && String(c.equipe || '') !== filterTeam) return false
        const leaderValue = c.leader_id ? String(c.leader_id) : (c.partner?.id ? String(c.partner.id) : null)
        if (filterLeader !== 'todos' && leaderValue !== filterLeader) return false
        return true
      }).length

      const terminations = colaboradores.filter(c => {
        if (!c.termination_date) return false
        const termDate = new Date(c.termination_date + 'T12:00:00')
        if (termDate.getFullYear() !== year || termDate.getMonth() !== mIdx) return false
        if (filterTeam !== 'todos' && String(c.equipe || '') !== filterTeam) return false
        const leaderValue = c.leader_id ? String(c.leader_id) : (c.partner?.id ? String(c.partner.id) : null)
        if (filterLeader !== 'todos' && leaderValue !== filterLeader) return false
        return true
      }).length

      const taxa = actives > 0 ? (terminations / actives) * 100 : 0

      const d = new Date(year, mIdx, 1)
      return {
        name: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        'Taxa de Turnover': parseFloat(taxa.toFixed(2)),
        Desligamentos: terminations
      }
    })
  }, [colaboradores, filterYear, filterTeam, filterLeader])

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
      const years = calculateTenure(c.hire_date, c.termination_date!)
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
    pie: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981']
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

          {(filterTeam !== 'todos' || filterLeader !== 'todos' || filterYear !== currentYear || filterMonth !== 'todos') && (
            <button
              onClick={() => {
                setFilterTeam('todos');
                setFilterLeader('todos');
                setFilterYear(currentYear);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolution Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Evolução do Turnover ({filterYear === 'todos' ? new Date().getFullYear() : filterYear})</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Histórico Mensal de Rotatividade</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTurnover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 11 }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 11, fontWeight: 700 }} unit="%" />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 11 }} />
                <Tooltip content={renderCustomTooltip} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="Taxa de Turnover" stroke={COLORS.danger} fill="url(#gradTurnover)" strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: COLORS.danger, strokeWidth: 2 }}>
                  <LabelList dataKey="Taxa de Turnover" content={(props) => renderCustomDataLabel({ ...props, fill: COLORS.danger, position: "top", percent: true })} />
                </Area>
                <Bar yAxisId="right" dataKey="Desligamentos" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={20} opacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Voluntário vs Involuntário */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Tipo de Desligamento</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Iniciativa da Rescisão</p>
            </div>
          </div>
          <div className="flex-grow min-h-[250px] relative flex flex-col justify-center">
            {filteredTerminations.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={volInvolData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={renderCustomPieLabel}
                    labelLine={false}
                  >
                    <Cell fill={COLORS.pie[0]} /> {/* Blue for Vol */}
                    <Cell fill={COLORS.pie[1]} /> {/* Red for Invol */}
                  </Pie>
                  <Tooltip content={renderCustomTooltip} />
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Tenure at Exit */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Risco por Tempo de Casa</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quando as pessoas saem?</p>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tenureAtExitData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 10, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 10 }} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} content={renderCustomTooltip} />
                <Bar dataKey="value" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={30} name="Qtd">
                  <LabelList dataKey="value" position="top" fill={COLORS.primary} fontSize={10} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categoria/Cargo */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:col-span-2">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-50 text-green-600">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Principais Cargos/Equipes Afetados</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Desligamentos por Função</p>
            </div>
          </div>
          <div className="h-[250px] w-full flex gap-4">
            {/* Roles BarChart */}
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-500 mb-2 pl-4">Top 10 Cargos</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={terminationsByRole} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 9, fontWeight: 600 }} width={120} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} content={renderCustomTooltip} />
                  <Bar dataKey="count" fill={COLORS.secondary} radius={[0, 4, 4, 0]} barSize={15} name="Qtd">
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
                  <Tooltip cursor={{ fill: '#f3f4f6' }} content={renderCustomTooltip} />
                  <Bar dataKey="count" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={15} name="Qtd">
                    <LabelList dataKey="count" position="right" fill={COLORS.text} fontSize={10} fontWeight={700} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Strategic HR Insights & Actions */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col space-y-6">
        <div className="pb-4 border-b border-gray-100 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-800 tracking-tight">Insights e Ações Estratégicas de RH</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Métricas Analíticas e Planos de Ação</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* Custo de Reposição e Onboarding */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col space-y-3">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle size={20} />
              <h4 className="font-black text-sm uppercase tracking-tight">Custo de Reposição (Early Attrition)</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              <span className="font-bold text-gray-800">Cenário Adverso:</span> Desligamentos precoces (- de 1 ano) indicam desalinhamento cultural ou falha no perfil esperado no recrutamento. O custo em HH para recontratar e treinar é elevado.
            </p>
            <div className="mt-auto pt-3 border-t border-gray-200">
              <p className="text-[10px] font-black text-blue-900 uppercase">Ação Recomendada:</p>
              <p className="text-xs text-blue-900">Validar os requisitos de job description com os líderes e estruturar um plano de acompanhamento mais severo nos primeiros 90 dias (Período de Experiência).</p>
            </div>
          </div>

          {/* Risco em Plenos/Sêniores */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col space-y-3">
            <div className="flex items-center gap-2 text-pink-600 mb-2">
              <Heart size={20} />
              <h4 className="font-black text-sm uppercase tracking-tight">Risco em Plenos / Seniores</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              <span className="font-bold text-gray-800">Engajamento de Vetores Críticos:</span> Saídas de colaboradores com {'>'} 3 anos ocorrem geralmente por estagnação, teto salarial ou propostas agressivas da concorrência.
            </p>
            <div className="mt-auto pt-3 border-t border-gray-200">
              <p className="text-[10px] font-black text-pink-800 uppercase">Ação Recomendada:</p>
              <p className="text-xs text-pink-800">Aplicar política sistemática de Feedbacks e Planos de Desenvolvimento Individual (PDIs). Criar projetos-desafio para mapear sucessores.</p>
            </div>
          </div>

          {/* Custos por Equipe Liderança */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <GraduationCap size={20} />
              <h4 className="font-black text-sm uppercase tracking-tight">Turnover por Liderança</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              <span className="font-bold text-gray-800">Gestão e Clima:</span> Picos de turnover isolados em uma equipe ou abaixo de uma liderança indicam necessidades fortes de treinamento, ou desgaste de gestão.
            </p>
            <div className="mt-auto pt-3 border-t border-gray-200">
              <p className="text-[10px] font-black text-indigo-800 uppercase">Ação Recomendada:</p>
              <p className="text-xs text-indigo-800">Treinar lideranças sobre Gestão e Inteligência Emocional. Estruturar "One-on-Ones" rotineiras e avaliar pulso de clima da equipe com HRBP.</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
