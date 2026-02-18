import { useState, useMemo } from 'react'
import {
  Users,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Map,
  Briefcase,
  Scale,
  Calendar,
  X
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

const formatCompact = (val: number) => {
  if (val === 0) return '0'
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1
  }).format(val);
}

// --- Main Component ---

export function RHHeadcount() {
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

  // --- Reference Date & Filter Logic ---
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
        // If current year, use NOW to be accurate, else end of year
        if (year === now.getFullYear()) return now
        return new Date(year, 11, 31, 23, 59, 59)
      }
    } else {
      if (filterMonth !== 'todos') {
        month = parseInt(filterMonth)
        // Use current year's month if no year selected? Or just use NOW if nothing selected?
        // Usually 'Todos' years means 'Current Status'
        return new Date(year, month + 1, 0, 23, 59, 59)
      }
    }
    return now
  }, [filterYear, filterMonth])

  // Active Data at Reference Date (Filtered by Local)
  const activeData = useMemo(() => {
    return colaboradores.filter(c => {
      // 1. Must be active at reference date
      if (!isActiveAtDate(c, referenceDate)) return false

      // 2. Local Filter
      if (filterLocal !== 'todos') {
        if (String(c.local) !== filterLocal) return false
      }

      return true
    })
  }, [colaboradores, referenceDate, filterLocal])

  // --- KPI Calculations ---
  const totalActive = activeData.length
  const totalActiveAdmin = activeData.filter(c => getSegment(c) === 'Administrativo').length
  const totalActiveLegal = activeData.filter(c => getSegment(c) === 'Jurídico').length

  // --- Charts Data ---

  // 1. Headcount by Local & Area
  const localAreaData = useMemo(() => {
    const map = new Map<string, { admin: number, legal: number }>()

    activeData.forEach(c => {
      const locName = c.locations?.name || 'Não Definido'
      if (!map.has(locName)) map.set(locName, { admin: 0, legal: 0 })
      const entry = map.get(locName)!

      if (getSegment(c) === 'Administrativo') entry.admin++
      else entry.legal++
    })

    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      Administrativo: data.admin,
      Jurídico: data.legal,
      Total: data.admin + data.legal
    })).sort((a, b) => b.Total - a.Total)
  }, [activeData])

  // 2. Gender Distribution (Donut)
  const genderData = useMemo(() => {
    const map = new Map<string, number>()
    activeData.forEach(c => {
      let g = c.gender || 'Não Informado'
      if (g === 'M' || g === 'Masculino') g = 'Masculino'
      else if (g === 'F' || g === 'Feminino') g = 'Feminino'
      else g = 'Outros'

      map.set(g, (map.get(g) || 0) + 1)
    })

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [activeData])

  // 3. Collaborators per Team Leader
  const leaderData = useMemo(() => {
    const map = new Map<string, number>()
    activeData.forEach(c => {
      const leader = c.leader?.name || 'Não Definido'
      map.set(leader, (map.get(leader) || 0) + 1)
    })

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15) // Top 15
  }, [activeData])

  // 4. Legal Role Distribution (Cargo do Jurídico)
  const legalRoleData = useMemo(() => {
    const map = new Map<string, number>()
    activeData.filter(c => getSegment(c) === 'Jurídico').forEach(c => {
      const role = c.roles?.name || String(c.role || 'Não Definido')
      map.set(role, (map.get(role) || 0) + 1)
    })

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [activeData])

  // 5. Legal Level Distribution (Nível do Jurídico)
  const legalLevelData = useMemo(() => {
    const levels = {
      'Sócio': 0,
      'Sênior': 0,
      'Pleno': 0,
      'Júnior': 0,
      'Estagiário': 0,
      'Outros': 0
    }

    activeData.filter(c => getSegment(c) === 'Jurídico').forEach(c => {
      const role = normalizeString(c.roles?.name || String(c.role || ''))

      if (role.includes('socio')) levels['Sócio']++
      else if (role.includes('senior')) levels['Sênior']++
      else if (role.includes('pleno')) levels['Pleno']++
      else if (role.includes('junior')) levels['Júnior']++
      else if (role.includes('estagiari')) levels['Estagiário']++
      else levels['Outros']++
    })

    return Object.entries(levels).map(([name, value]) => ({ name, value }))
  }, [activeData])


  // --- Custom Label Components ---
  const CustomDataLabel = (props: any) => {
    const { x, y, value, fill, position, offset } = props;
    if (!value) return null; // Don't show 0s

    // Logic for stacked bar positioning can be tricky, let's keep it simple for now or use the same pill style
    // For Stacked, we usually want it centered in the bar segment
    // But Recharts LabelList positioning on stacked bars can be weird.

    // For simple bars:
    let yOffset = -25
    if (position === 'insideRight') return null; // Handle if necessary

    return (
      <g>
        <rect
          x={x + (props.width / 2) - 15}
          y={y + yOffset}
          width={30}
          height={18}
          rx={4}
          fill={fill}
        />
        <text
          x={x + (props.width / 2)}
          y={y + yOffset + 12}
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

  const CustomPieLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, value, fill, name } = props;
    if (!cx || !cy) return null;

    const RADIAN = Math.PI / 180;
    const x = cx + (outerRadius + 30) * Math.cos(-midAngle * RADIAN);
    const y = cy + (outerRadius + 30) * Math.sin(-midAngle * RADIAN);

    return (
      <g>
        <text
          x={x}
          y={y - 12}
          fill="#374151"
          textAnchor="middle"
          fontSize="10px"
          fontWeight="bold"
        >
          {name}
        </text>
        <rect
          x={x - 12}
          y={y - 8}
          width={24}
          height={16}
          rx={4}
          fill={fill}
        />
        <text
          x={x}
          y={y + 4}
          fill="white"
          textAnchor="middle"
          fontSize="10px"
          fontWeight="bold"
        >
          {value}
        </text>
      </g>
    );
  };

  // --- Constants ---
  const COLORS = {
    primary: '#ea580c',   // Admin (Dark Orange)
    secondary: '#1e3a8a', // Jurídico (Dark Blue)
    tertiary: '#f59e0b',
    text: '#6b7280',
    grid: '#e5e7eb',
    pieGender: ['#3b82f6', '#ec4899', '#9ca3af']
  }

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
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Headcount</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Visão Geral da Força de Trabalho</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
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

          {(filterLocal !== 'todos' || filterYear !== 'todos' || filterMonth !== 'todos') && (
            <button
              onClick={() => {
                setFilterLocal('todos');
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

        {/* Total Active */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-gray-800"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total de Colaboradores</p>
            <p className="text-3xl font-black text-gray-800 mt-1">{totalActive}</p>
          </div>
          <div className="p-3 bg-gray-100 rounded-xl">
            <Users className="h-6 w-6 text-gray-600" />
          </div>
        </div>

        {/* Total Legal */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-[#1e3a8a]"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total do Jurídico</p>
            <p className="text-3xl font-black text-[#1e3a8a] mt-1">{totalActiveLegal}</p>
          </div>
          <div className="p-3 bg-[#1e3a8a]/10 rounded-xl">
            <Scale className="h-6 w-6 text-[#1e3a8a]" />
          </div>
        </div>

        {/* Total Admin */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-[#ea580c]"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total do Administrativo</p>
            <p className="text-3xl font-black text-[#ea580c] mt-1">{totalActiveAdmin}</p>
          </div>
          <div className="p-3 bg-[#ea580c]/10 rounded-xl">
            <Briefcase className="h-6 w-6 text-[#ea580c]" />
          </div>
        </div>
      </div>

      {/* 3. Charts Row 1: Local & Gender */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Local & Area (Stacked Bar) - Span 2 */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Distribuição por Local e Área</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Geolocalização do Time</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={localAreaData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 11, fontWeight: 700 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Administrativo" stackId="a" fill={COLORS.primary} radius={[0, 0, 4, 4]}>
                </Bar>
                <Bar dataKey="Jurídico" stackId="a" fill={COLORS.secondary} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="Total" position="top" fill={COLORS.text} fontSize={10} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender (Donut) - Span 1 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-pink-50 text-pink-600">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Gênero</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Diversidade</p>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={CustomPieLabel}
                >
                  {genderData.map((entry, index) => {
                    let color = COLORS.pieGender[2]
                    if (entry.name === 'Masculino') color = COLORS.pieGender[0]
                    if (entry.name === 'Feminino') color = COLORS.pieGender[1]
                    return <Cell key={`cell-${index}`} fill={color} />
                  })}
                </Pie>
                <Legend verticalAlign="bottom" height={36} />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Chart Row 2: Team Leader */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-800 tracking-tight">Colaboradores por Líder de Equipe</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Top 15 Lideranças</p>
          </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leaderData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.grid} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fill: COLORS.text, fontSize: 10, fontWeight: 600 }}
                width={150}
              />
              <Tooltip cursor={{ fill: '#f3f4f6' }} content={<CustomTooltip />} />
              <Bar dataKey="value" name="Colaboradores" radius={[0, 4, 4, 0]} barSize={20} fill="#8b5cf6">
                <LabelList dataKey="value" position="right" fill="#8b5cf6" fontSize={10} fontWeight={700} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Chart Row 3: Legal Specifics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Legal Roles */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#1e3a8a]/10 text-[#1e3a8a]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Distribuição por Cargo (Jurídico)</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Detalhamento de Funções</p>
            </div>
          </div>
          <div className="h-[400px] w-full bg-scroll overflow-y-auto">
            {/* Use scrollable container if list is long? 
                 Recharts doesn't scroll natively. Better to fix height or just show Top N.
                 Let's fit in fixed height for now.
             */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={legalRoleData.slice(0, 15)} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.grid} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COLORS.text, fontSize: 10, fontWeight: 600 }}
                  width={140}
                />
                <Tooltip cursor={{ fill: '#f3f4f6' }} content={<CustomTooltip />} />
                <Bar dataKey="value" name="Qtd" radius={[0, 4, 4, 0]} barSize={20} fill={COLORS.secondary}>
                  <LabelList dataKey="value" position="right" fill={COLORS.secondary} fontSize={10} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legal Levels */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#1e3a8a]/10 text-[#1e3a8a]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Distribuição por Nível (Jurídico)</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Senioridade da Equipe</p>
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={legalLevelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 11, fontWeight: 700 }} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} content={<CustomTooltip />} />
                <Bar dataKey="value" name="Qtd" radius={[4, 4, 0, 0]} barSize={40} fill={COLORS.secondary}>
                  <LabelList dataKey="value" position="top" fill={COLORS.secondary} fontSize={10} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  )
}
