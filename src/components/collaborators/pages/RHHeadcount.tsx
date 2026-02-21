import { useState, useMemo } from 'react'
import {
  Users,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Map as MapIcon,
  Briefcase,
  Scale,
  Calendar,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  GraduationCap,
  Heart,
  ShieldCheck,
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

const calculateAge = (birthday?: string) => {
  if (!birthday) return null
  try {
    const birthDate = new Date(birthday + 'T12:00:00')
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  } catch (e) {
    return null
  }
}


// --- Main Component ---

export function RHHeadcount() {
  const {
    colaboradores,
    loading,
    locations: masterLocations
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
    const map = new Map<string, { count: number, totalAge: number, ageCount: number }>()
    activeData.forEach(c => {
      let g = c.gender || 'Não Informado'
      if (g === 'M' || g === 'Masculino') g = 'Masculino'
      else if (g === 'F' || g === 'Feminino') g = 'Feminino'
      else g = 'Outros'

      const age = calculateAge(c.birthday)

      if (!map.has(g)) map.set(g, { count: 0, totalAge: 0, ageCount: 0 })
      const data = map.get(g)!
      data.count++
      if (age !== null && age > 0) {
        data.totalAge += age
        data.ageCount++
      }
    })

    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      value: data.count,
      avgAge: data.ageCount > 0 ? Math.round(data.totalAge / data.ageCount) : 0
    }))
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


  // 6. Age Pyramid Data (Legal)
  const agePyramidData = useMemo(() => {
    const groups = [
      { label: '< 25 anos', min: 0, max: 24 },
      { label: '25 - 34 anos', min: 25, max: 34 },
      { label: '35 - 44 anos', min: 35, max: 44 },
      { label: '45 - 54 anos', min: 45, max: 54 },
      { label: '55+ anos', min: 55, max: 120 },
    ]

    const dataMap = groups.map(g => ({
      group: g.label,
      Masculino: 0,
      Feminino: 0,
    }))

    activeData
      .filter(c => getSegment(c) === 'Jurídico')
      .forEach(c => {
        const age = calculateAge(c.birthday)
        if (age === null) return

        let gender = 'Outros'
        if (c.gender === 'M' || c.gender === 'Masculino') gender = 'Masculino'
        else if (c.gender === 'F' || c.gender === 'Feminino') gender = 'Feminino'

        if (gender === 'Outros') return

        const groupIndex = groups.findIndex(g => age >= g.min && age <= g.max)
        if (groupIndex !== -1) {
          dataMap[groupIndex][gender as 'Masculino' | 'Feminino']++
        }
      })

    return dataMap
  }, [activeData])

  // 7. Age Distribution Data (Administrative)
  const ageDistributionAdminData = useMemo(() => {
    const groups = [
      { label: '< 25 anos', min: 0, max: 24 },
      { label: '25 - 34 anos', min: 25, max: 34 },
      { label: '35 - 44 anos', min: 35, max: 44 },
      { label: '45 - 54 anos', min: 45, max: 54 },
      { label: '55+ anos', min: 55, max: 120 },
    ]

    const dataMap = groups.map(g => ({
      group: g.label,
      Masculino: 0,
      Feminino: 0,
    }))

    activeData
      .filter(c => getSegment(c) === 'Administrativo')
      .forEach(c => {
        const age = calculateAge(c.birthday)
        if (age === null) return

        let gender = 'Outros'
        if (c.gender === 'M' || c.gender === 'Masculino') gender = 'Masculino'
        else if (c.gender === 'F' || c.gender === 'Feminino') gender = 'Feminino'

        if (gender === 'Outros') return

        const groupIndex = groups.findIndex(g => age >= g.min && age <= g.max)
        if (groupIndex !== -1) {
          dataMap[groupIndex][gender as 'Masculino' | 'Feminino']++
        }
      })

    return dataMap
  }, [activeData])

  // 8. Generational Diversity Data
  const generationalData = useMemo(() => {
    const counts = {
      'Baby Boomers (55+)': 0,
      'Geração X (45-54)': 0,
      'Millennials (25-44)': 0,
      'Geração Z (< 25)': 0
    }

    activeData.forEach(c => {
      const age = calculateAge(c.birthday)
      if (age === null) return

      if (age >= 55) counts['Baby Boomers (55+)']++
      else if (age >= 45) counts['Geração X (45-54)']++
      else if (age >= 25) counts['Millennials (25-44)']++
      else counts['Geração Z (< 25)']++
    })

    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [activeData])

  // --- Constants ---
  const COLORS = {
    primary: '#ea580c',   // Admin (Dark Orange)
    secondary: '#1e3a8a', // Jurídico (Dark Blue)
    tertiary: '#f59e0b',
    text: '#6b7280',
    grid: '#e5e7eb',
    pieGender: ['#3b82f6', '#ec4899', '#9ca3af'],
    pyramid: {
      male: '#1d4ed8',   // Blue 700
      maleFill: '#dbeafe', // Blue 100
      female: '#be185d', // Pink 700
      femaleFill: '#fce7f3' // Pink 100
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-xl min-w-[140px] z-50">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex flex-col mb-1 last:mb-0">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase" style={{ color: entry.color }}>
                  {entry.name}
                </span>
                <span className="text-xs font-black text-gray-700">{entry.value}</span>
              </div>
              {entry.payload && entry.payload.avgAge !== undefined && (
                <div className="text-right mt-0.5">
                  <span className="text-[9px] font-bold text-gray-400">
                    MÉDIA: {entry.payload.avgAge} ANOS
                  </span>
                </div>
              )}
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

      {/* 3. Charts Row 1: Local & Leaders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Local & Area (Stacked Bar) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <MapIcon className="w-5 h-5" />
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

        {/* Collaborators per Team Leader */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Colaboradores por Líder</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Top 15 Lideranças</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
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
                <Bar dataKey="value" name="Time" radius={[0, 4, 4, 0]} barSize={20} fill="#8b5cf6">
                  <LabelList dataKey="value" position="right" fill="#8b5cf6" fontSize={10} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 4. Chart Row 2: Gender & Age Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Gender (Donut) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:col-span-1">
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
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

                    return (
                      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="bold">
                        <tspan x={x} dy="-4">{`${(percent * 100).toFixed(0)}%`}</tspan>
                        {payload.avgAge > 0 && (
                          <tspan x={x} dy="12" fontSize={8} fontWeight="normal">{`Média ${payload.avgAge} anos`}</tspan>
                        )}
                      </text>
                    );
                  }}
                  labelLine={false}
                >
                  {genderData.map((entry, index) => {
                    let color = COLORS.pieGender[2]
                    if (entry.name === 'Masculino') color = COLORS.pieGender[0]
                    if (entry.name === 'Feminino') color = COLORS.pieGender[1]
                    return <Cell key={`cell-${index}`} fill={color} />
                  })}
                </Pie>
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>


        {/* Age Distribution (Legal) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:col-span-2">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Faixa Etária (Jurídico)</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Distribuição por Gênero</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={agePyramidData}
                layout="vertical"
                margin={{ top: 10, right: 40, left: 10, bottom: 0 }}
                barGap={2}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.grid} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="group"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COLORS.text, fontSize: 10, fontWeight: 600 }}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
                <Legend iconType="circle" />
                <Bar
                  dataKey="Masculino"
                  fill={COLORS.pyramid.male}
                  radius={[0, 4, 4, 0]}
                  barSize={15}
                >
                  <LabelList dataKey="Masculino" position="right" fill={COLORS.pyramid.male} fontSize={10} fontWeight={700} offset={8} />
                </Bar>
                <Bar
                  dataKey="Feminino"
                  fill={COLORS.pyramid.female}
                  radius={[0, 4, 4, 0]}
                  barSize={15}
                >
                  <LabelList dataKey="Feminino" position="right" fill={COLORS.pyramid.female} fontSize={10} fontWeight={700} offset={8} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Age Distribution (Administrative) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:col-span-2">
          <div className="mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Faixa Etária (Administrativo)</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Distribuição por Gênero</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ageDistributionAdminData}
                layout="vertical"
                margin={{ top: 10, right: 40, left: 10, bottom: 0 }}
                barGap={2}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.grid} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="group"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COLORS.text, fontSize: 10, fontWeight: 600 }}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
                <Legend iconType="circle" />
                <Bar
                  dataKey="Masculino"
                  fill="#0369a1"
                  radius={[0, 4, 4, 0]}
                  barSize={15}
                >
                  <LabelList dataKey="Masculino" position="right" fill="#0369a1" fontSize={10} fontWeight={700} offset={8} />
                </Bar>
                <Bar
                  dataKey="Feminino"
                  fill="#db2777"
                  radius={[0, 4, 4, 0]}
                  barSize={15}
                >
                  <LabelList dataKey="Feminino" position="right" fill="#db2777" fontSize={10} fontWeight={700} offset={8} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 6. Chart Row 4: Legal Specifics */}
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

      {/* 7. Strategic HR Insights & Actions */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col space-y-6">
        <div className="pb-4 border-b border-gray-100 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-800 tracking-tight">Insights e Ações Estratégicas de RH</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gestão de Pessoas e Planejamento</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* Sucessão e Risco */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col space-y-3">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle size={20} />
              <h4 className="font-black text-sm uppercase tracking-tight">Planejamento de Sucessão</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              <span className="font-bold text-gray-800">Risco de Apagão:</span> Se a média gerência não estiver preparada, a saída de seniores pode impactar o negócio.
            </p>
            <div className="mt-auto pt-3 border-t border-gray-200">
              <p className="text-[10px] font-black text-blue-900 uppercase">Ação Recomendada:</p>
              <p className="text-xs text-blue-900">Identificar profissionais (35-45 anos) para programas de mentoria e shadowing.</p>
            </div>
          </div>

          {/* Retenção e Turnover */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col space-y-3">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <TrendingUp size={20} />
              <h4 className="font-black text-sm uppercase tracking-tight">Retenção e Turnover</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              <span className="font-bold text-gray-800">Foco Millenials/Gen Z:</span> Faixas etárias mais jovens tendem a ter rotatividade maior no setor jurídico.
            </p>
            <div className="mt-auto pt-3 border-t border-gray-200">
              <p className="text-[10px] font-black text-orange-800 uppercase">Ação Recomendada:</p>
              <p className="text-xs text-orange-800">Criar programas de carreira acelerada e flexibilidade para reduzir custos de recrutamento.</p>
            </div>
          </div>

          {/* Treinamento */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <GraduationCap size={20} />
              <h4 className="font-black text-sm uppercase tracking-tight">Estratégia de Aprendizado</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              <span className="font-bold text-gray-800">Mentoria Reversa:</span> Equipes jovens trazem agilidade tecnológica, enquanto sêniores detêm a estratégia.
            </p>
            <div className="mt-auto pt-3 border-t border-gray-200">
              <p className="text-[10px] font-black text-indigo-800 uppercase">Ação Recomendada:</p>
              <p className="text-xs text-indigo-800">Sêniores ensinam estratégia e base jurídica; jovens ensinam Lawtechs e IA.</p>
            </div>
          </div>

          {/* Benefícios */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col space-y-3">
            <div className="flex items-center gap-2 text-pink-600 mb-2">
              <Heart size={20} />
              <h4 className="font-black text-sm uppercase tracking-tight">Cultura e Benefícios</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              <span className="font-bold text-gray-800">Plano Flexível:</span> Necessidades mudam com a idade: estabilidade vs. plano de carreira rápido.
            </p>
            <div className="mt-auto pt-3 border-t border-gray-200">
              <p className="text-[10px] font-black text-pink-800 uppercase">Ação Recomendada:</p>
              <p className="text-xs text-pink-800">Customizar pacotes de benefícios que atendam desde o estagiário ao sócio sênior.</p>
            </div>
          </div>

          {/* Diversidade */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <ShieldCheck size={20} />
              <h4 className="font-black text-sm uppercase tracking-tight">Compliance e Diversidade</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              <span className="font-bold text-gray-800">Combate ao Ageismo:</span> Valorização do talento independente da idade para garantir pluralidade de ideias.
            </p>
            <div className="mt-auto pt-3 border-t border-gray-200">
              <p className="text-[10px] font-black text-emerald-800 uppercase">Ação Recomendada:</p>
              <p className="text-xs text-emerald-800">Garantir processos seletivos cegos à idade para cargos de associados e administrativos.</p>
            </div>
          </div>

          {/* Diversidade Geracional (Mini Gráfico) */}
          <div className="p-5 rounded-2xl bg-[#1e3a8a] text-white flex flex-col">
            <h4 className="font-black text-sm uppercase tracking-tight mb-4">Diversidade Geracional</h4>
            <div className="flex-1 space-y-3 overflow-y-auto">
              {generationalData.map((item, idx) => (
                <div key={idx} className="flex flex-col space-y-1">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-80">
                    <span>{item.name}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${(item.value / totalActive * 100) || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div >
  )
}
