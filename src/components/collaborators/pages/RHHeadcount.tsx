import { useState, useMemo } from 'react'
import {
  Users,
  BarChart3,
  PieChart as PieChartIcon,
  Map as MapIcon,
  Briefcase,
  Scale,
  Calendar,
  X,
  TrendingUp
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
import { useNavigate } from 'react-router-dom'

import {
  getSegment,
  isActiveAtDate,
  getYearFromDate,
  calculateAge,
  normalizeString
} from '../utils/rhChartUtils'
import { RHChartTooltip } from '../components/RHChartTooltip'
import { CopyChartButton } from '../../controladoria/ui/CopyChartButton'

// --- Main Component ---

export function RHHeadcount() {
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
  const [filterSocio, setFilterSocio] = useState<string>('todos')

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

  const socioOptions = useMemo(() => {
    return masterPartners
      .map(p => ({ label: p.name, value: String(p.id) }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [masterPartners])

  // --- Reference Date & Filter Logic ---
  const referenceDate = useMemo(() => {
    const now = new Date()
    let year = now.getFullYear()
    let month = now.getMonth()

    // If 'todos', then we just use 'active' status without date bounds
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

  // Active Data at Reference Date (Filtered by Local and Socio)
  const activeData = useMemo(() => {
    return colaboradores.filter(c => {
      // 1. Must be active at reference date (if specific date filtered)
      if (referenceDate) {
        if (!isActiveAtDate(c, referenceDate)) return false
      } else {
        // Default to just current active status if no specific date is queried
        if (c.status !== 'active') return false
      }

      // 2. Local Filter
      if (filterLocal !== 'todos') {
        if (String(c.local) !== filterLocal) return false
      }

      // 3. Socio Filter
      if (filterSocio !== 'todos') {
        const cSocio = c.partner_id ? String(c.partner_id) : (c.partner?.id ? String(c.partner.id) : null)
        if (cSocio !== filterSocio) return false
      }

      return true
    })
  }, [colaboradores, referenceDate, filterLocal, filterSocio])

  // --- KPI Calculations ---
  const totalActive = activeData.length
  const totalActiveAdmin = activeData.filter(c => getSegment(c) === 'Administrativo').length
  const totalActiveLegal = activeData.filter(c => getSegment(c) === 'Jurídico').length
  const totalActiveTerceirizada = activeData.filter(c => getSegment(c) === 'Terceirizada').length

  // --- Charts Data ---

  // Advogados x Estagiarios por Local
  const advogadosVsEstagiariosData = useMemo(() => {
    const map = new Map<string, { advogados: number, estagiarios: number }>()

    activeData.filter(c => getSegment(c) === 'Jurídico').forEach(c => {
      let locName = c.locations?.name
      if (!locName && c.local) {
        const found = masterLocations.find(l => String(l.id) === String(c.local));
        if (found) locName = found.name;
      }
      locName = locName || 'Não Definido'

      if (!map.has(locName)) map.set(locName, { advogados: 0, estagiarios: 0 })

      const role = normalizeString(c.roles?.name || String(c.role || ''))
      if (role.includes('estagiari')) {
        map.get(locName)!.estagiarios++
      } else {
        map.get(locName)!.advogados++
      }
    })

    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      Advogados: data.advogados,
      Estagiários: data.estagiarios,
      Total: data.advogados + data.estagiarios
    })).sort((a, b) => b.Total - a.Total)
  }, [activeData, masterLocations])

  // 1. Headcount by Local & Area
  const localAreaData = useMemo(() => {
    const map = new Map<string, { admin: number, legal: number, terceirizada: number }>()

    activeData.forEach(c => {
      let locName = c.locations?.name
      if (!locName && c.local) {
        const found = masterLocations.find(l => String(l.id) === String(c.local));
        if (found) locName = found.name;
      }
      locName = locName || 'Não Definido'

      if (!map.has(locName)) map.set(locName, { admin: 0, legal: 0, terceirizada: 0 })
      const entry = map.get(locName)!

      const seg = getSegment(c)
      if (seg === 'Administrativo') entry.admin++
      else if (seg === 'Jurídico') entry.legal++
      else entry.terceirizada++
    })

    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      Administrativo: data.admin,
      Jurídico: data.legal,
      Terceirizada: data.terceirizada,
      Total: data.admin + data.legal + data.terceirizada
    })).sort((a, b) => b.Total - a.Total)
  }, [activeData, masterLocations])

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
  const { leaderJuridicoSocios, leaderJuridicoLideres } = useMemo(() => {
    const leaderMap = new Map<string, { count: number, members: Collaborator[], leaderObj: Collaborator }>()

    activeData.forEach(c => {
      const leaderName = c.leader?.name
      if (!leaderName) return

      const normalizedLeaderName = normalizeString(leaderName)
      
      if (!leaderMap.has(normalizedLeaderName)) {
        const fullLeaderObj = colaboradores.find(col => normalizeString(col.name) === normalizedLeaderName)
        leaderMap.set(normalizedLeaderName, { 
          count: 0, 
          members: [], 
          leaderObj: fullLeaderObj || (c.leader as unknown as Collaborator) 
        })
      }
      
      const entry = leaderMap.get(normalizedLeaderName)!
      entry.count++
      entry.members.push(c)
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
          value: data.count
        }
      }).sort((a, b) => b.value - a.value)

    return {
      leaderJuridicoSocios: allLeaders.filter(l => l.category === 'Jurídico - Sócios'),
      leaderJuridicoLideres: allLeaders.filter(l => l.category === 'Jurídico - Líderes')
    }
  }, [activeData, colaboradores])

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
      Total: 0
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
          dataMap[groupIndex].Total++
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
      Total: 0
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
          dataMap[groupIndex].Total++
        }
      })

    return dataMap
  }, [activeData])

  // --- Constants ---
  const COLORS = {
    primary: '#ea580c',   // Admin (Dark Orange)
    secondary: '#1e3a8a', // Jurídico (Dark Blue)
    tertiary: '#0d9488',  // Terceirizada (Teal)
    text: '#6b7280',
    grid: '#e5e7eb',
    pieGender: ['#1e40af', '#db2777', '#9ca3af'],
    pyramid: {
      male: '#1d4ed8',   // Blue 700
      maleFill: '#dbeafe', // Blue 100
      female: '#be185d', // Pink 700
      femaleFill: '#fce7f3' // Pink 100
    }
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
            <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Headcount</h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">Visão Geral da Força de Trabalho</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-2 md:mt-0 justify-end bg-gray-50/50 p-2 rounded-xl border border-gray-100/80">
          <FilterSelect
            icon={Calendar}
            value={filterMonth === 'todos' ? '' : filterMonth}
            onChange={(val) => setFilterMonth(val || 'todos')}
            options={months}
            placeholder="Meses"
          />
          <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
          <FilterSelect
            icon={Calendar}
            value={(filterYear === 'todos' || filterYear === 'Anos') ? '' : filterYear}
            onChange={(val) => setFilterYear(val || 'todos')}
            options={[{ label: 'Anos', value: 'todos' }, ...years.map(y => ({ label: y, value: y }))]}
            placeholder="Anos"
          />
          <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
          <FilterSelect
            icon={MapIcon}
            value={filterLocal === 'todos' ? '' : filterLocal}
            onChange={(val) => setFilterLocal(val || 'todos')}
            options={locationOptions}
            placeholder="Local"
          />
          <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
          <FilterSelect
            icon={Users}
            value={filterSocio === 'todos' ? '' : filterSocio}
            onChange={(val) => setFilterSocio(val || 'todos')}
            options={socioOptions}
            placeholder="Sócio (Opcional)"
          />

          {(filterLocal !== 'todos' || filterYear !== 'todos' || filterMonth !== 'todos' || filterSocio !== 'todos') && (
            <button
              onClick={() => {
                setFilterLocal('todos');
                setFilterYear('todos');
                setFilterMonth('todos');
                setFilterSocio('todos');
              }}
              className="p-2 sm:p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-100 bg-white ml-2 shadow-sm"
              title="Limpar Filtros"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div id="export-kpis-headcount" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Total Active */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-gray-800"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total de Integrantes</p>
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

        {/* Total Terceirizada */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-[#0d9488]"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Terceiros</p>
            <p className="text-3xl font-black text-[#0d9488] mt-1">{totalActiveTerceirizada}</p>
          </div>
          <div className="p-3 bg-[#0d9488]/10 rounded-xl">
            <Users className="h-6 w-6 text-[#0d9488]" />
          </div>
        </div>
      </div>

      {/* 3. Charts Row 1: Local */}
      <div id="export-headcount-mapa" className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Local & Area (Stacked Bar) */}
        <div id="chart-headcount-local-area" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <MapIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800 tracking-tight">Distribuição por Local e Área</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Geolocalização do Time</p>
              </div>
            </div>
            <CopyChartButton targetId="chart-headcount-local-area" />
          </div>
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={localAreaData} margin={{ top: 30, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 11, fontWeight: 700 }} />
                <Tooltip content={RHChartTooltip} />
                <Legend />
                <Bar dataKey="Administrativo" stackId="a" fill={COLORS.primary} radius={[0, 0, 4, 4]} className="cursor-pointer" onClick={(data) => navigate('/rh/colaboradores', { state: { localFilter: data.name, segmentFilter: 'Administrativo' } })}>
                  <LabelList dataKey="Administrativo" position="center" fill="#fff" fontSize={10} fontWeight={700} formatter={(val: number) => val > 0 ? val : ''} />
                </Bar>
                <Bar dataKey="Jurídico" stackId="a" fill={COLORS.secondary} className="cursor-pointer" onClick={(data) => navigate('/rh/colaboradores', { state: { localFilter: data.name, segmentFilter: 'Jurídico' } })}>
                  <LabelList dataKey="Jurídico" position="center" fill="#fff" fontSize={10} fontWeight={700} formatter={(val: number) => val > 0 ? val : ''} />
                </Bar>
                <Bar dataKey="Terceirizada" stackId="a" fill={COLORS.tertiary} radius={[4, 4, 0, 0]} className="cursor-pointer" onClick={(data) => navigate('/rh/colaboradores', { state: { localFilter: data.name, segmentFilter: 'Terceirizada' } })}>
                  <LabelList dataKey="Terceirizada" position="center" fill="#fff" fontSize={10} fontWeight={700} formatter={(val: number) => val > 0 ? val : ''} />
                  <LabelList dataKey="Total" position="top" fill={COLORS.text} fontSize={10} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Advogados x Estagiários por Local */}
        <div id="chart-headcount-adv-est" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800 tracking-tight">Advogados x Estagiários por Local</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Composição Jurídica</p>
              </div>
            </div>
            <CopyChartButton targetId="chart-headcount-adv-est" />
          </div>
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={advogadosVsEstagiariosData} margin={{ top: 30, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 11, fontWeight: 700 }} />
                <Tooltip content={RHChartTooltip} />
                <Legend />
                <Bar dataKey="Advogados" stackId="a" fill={COLORS.secondary} radius={[0, 0, 4, 4]} className="cursor-pointer" onClick={(data) => navigate('/rh/colaboradores', { state: { localFilter: data.name, segmentFilter: 'Jurídico' } })}>
                  <LabelList dataKey="Advogados" position="center" fill="#fff" fontSize={10} fontWeight={700} formatter={(val: number) => val > 0 ? val : ''} />
                </Bar>
                <Bar dataKey="Estagiários" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} className="cursor-pointer" onClick={(data) => navigate('/rh/colaboradores', { state: { localFilter: data.name, segmentFilter: 'Jurídico' } })}>
                  <LabelList dataKey="Estagiários" position="center" fill="#fff" fontSize={10} fontWeight={700} formatter={(val: number) => val > 0 ? val : ''} />
                  <LabelList dataKey="Total" position="top" fill={COLORS.text} fontSize={10} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Collaborators per Team Leader */}
      <div id="export-headcount-lideres" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
        <div className="mb-6 pb-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Integrantes por Líder</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lideranças</p>
            </div>
          </div>
          <CopyChartButton targetId="export-headcount-lideres" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          {leaderJuridicoSocios.length > 0 && (
            <div className="flex flex-col">
              <h4 className="text-sm font-black text-gray-700 tracking-tight mb-2">Jurídico: Sócios</h4>
              <div className="w-full" style={{ height: Math.max(80, leaderJuridicoSocios.length * 35) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leaderJuridicoSocios} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
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
                    <Bar dataKey="value" name="Time" radius={[0, 4, 4, 0]} barSize={20} fill="#8b5cf6" className="cursor-pointer" onClick={(data) => navigate('/rh/colaboradores', { state: { leaderFilter: data.name } })}>
                      <LabelList dataKey="value" position="right" fill="#8b5cf6" fontSize={10} fontWeight={700} />
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
                  <BarChart data={leaderJuridicoLideres} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
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
                    <Bar dataKey="value" name="Time" radius={[0, 4, 4, 0]} barSize={20} fill="#8b5cf6" className="cursor-pointer" onClick={(data) => navigate('/rh/colaboradores', { state: { leaderFilter: data.name } })}>
                      <LabelList dataKey="value" position="right" fill="#8b5cf6" fontSize={10} fontWeight={700} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 4. Chart Row 2: Gender & Age Distributions */}
      <div id="export-headcount-demografico" className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Gender (Donut) */}
        <div id="chart-headcount-gender" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:col-span-1">
          <div className="mb-6 pb-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-pink-50 text-pink-600">
                <PieChartIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800 tracking-tight">Gênero</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Diversidade</p>
              </div>
            </div>
            <CopyChartButton targetId="chart-headcount-gender" />
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[300px] relative">
            <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-gray-800">{genderData.reduce((acc, curr) => acc + curr.value, 0)}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Total</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 30, left: 30, bottom: 20 }}>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }) => {
                    const RADIAN = Math.PI / 180;

                    // Posição para a porcentagem (dentro do gráfico)
                    const radiusInside = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const xInside = cx + radiusInside * Math.cos(-midAngle * RADIAN);
                    const yInside = cy + radiusInside * Math.sin(-midAngle * RADIAN);

                    // Posição para a média de idade (fora do gráfico)
                    const radiusOutside = outerRadius + 20;
                    const xOutside = cx + radiusOutside * Math.cos(-midAngle * RADIAN);
                    const yOutside = cy + radiusOutside * Math.sin(-midAngle * RADIAN);

                    const textAnchorOutside = xOutside > cx ? 'start' : 'end';

                    return (
                      <g>
                        {/* Rótulo de Porcentagem */}
                        <text
                          x={xInside}
                          y={yInside}
                          fill="white"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={14}
                          fontWeight="900"
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>

                        {/* Rótulo de Média de Idade (Fora) */}
                        {payload.avgAge > 0 && (
                          <text
                            x={xOutside}
                            y={yOutside}
                            fill="#6b7280"
                            textAnchor={textAnchorOutside}
                            dominantBaseline="central"
                            fontSize={11}
                            fontWeight="600"
                          >
                            {`Média ${payload.avgAge} anos`}
                          </text>
                        )}
                      </g>
                    );
                  }}
                  labelLine={false}
                  onClick={(_, index) => {
                    const payloadName = genderData[index]?.name;
                    if (payloadName) navigate('/rh/colaboradores', { state: { genderFilter: payloadName } });
                  }}
                  className="cursor-pointer"
                >
                  {genderData.map((entry, index) => {
                    let color = COLORS.pieGender[2]
                    if (entry.name === 'Masculino') color = COLORS.pieGender[0]
                    if (entry.name === 'Feminino') color = COLORS.pieGender[1]
                    return <Cell key={`cell-${index}`} fill={color} />
                  })}
                </Pie>
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Tooltip content={RHChartTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>


        {/* Age Distribution (Legal) */}
        <div id="chart-headcount-age-jur" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:col-span-2">
          <div className="mb-6 pb-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800 tracking-tight">Faixa Etária (Jurídico)</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Distribuição por Gênero</p>
              </div>
            </div>
            <CopyChartButton targetId="chart-headcount-age-jur" />
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
                <Tooltip content={RHChartTooltip} cursor={{ fill: '#f3f4f6' }} />
                <Legend iconType="circle" />
                <Bar
                  dataKey="Masculino"
                  fill={COLORS.pyramid.male}
                  radius={[0, 4, 4, 0]}
                  barSize={15}
                  className="cursor-pointer"
                  onClick={() => navigate('/rh/colaboradores', { state: { segmentFilter: 'Jurídico', genderFilter: 'Masculino' } })}
                >
                  <LabelList dataKey="Masculino" position="right" fill={COLORS.pyramid.male} fontSize={10} fontWeight={700} offset={8} />
                </Bar>
                <Bar
                  dataKey="Feminino"
                  fill={COLORS.pyramid.female}
                  radius={[0, 4, 4, 0]}
                  barSize={15}
                  className="cursor-pointer"
                  onClick={() => navigate('/rh/colaboradores', { state: { segmentFilter: 'Jurídico', genderFilter: 'Feminino' } })}
                >
                  <LabelList dataKey="Feminino" position="right" fill={COLORS.pyramid.female} fontSize={10} fontWeight={700} offset={8} />
                </Bar>
                <Bar dataKey="Total" fill="transparent" barSize={1} isAnimationActive={false}>
                  <LabelList dataKey="Total" position="right" fill={COLORS.text} fontSize={10} fontWeight={700} formatter={(val: number) => val > 0 ? `Total: ${val}` : ''} offset={5} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Age Distribution (Administrative) */}
        <div id="chart-headcount-age-adm" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:col-span-2">
          <div className="mb-6 pb-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800 tracking-tight">Faixa Etária (Administrativo)</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Distribuição por Gênero</p>
              </div>
            </div>
            <CopyChartButton targetId="chart-headcount-age-adm" />
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
                <Tooltip content={RHChartTooltip} cursor={{ fill: '#f3f4f6' }} />
                <Legend iconType="circle" />
                <Bar
                  dataKey="Masculino"
                  fill="#0369a1"
                  radius={[0, 4, 4, 0]}
                  barSize={15}
                  className="cursor-pointer"
                  onClick={() => navigate('/rh/colaboradores', { state: { segmentFilter: 'Administrativo', genderFilter: 'Masculino' } })}
                >
                  <LabelList dataKey="Masculino" position="right" fill="#0369a1" fontSize={10} fontWeight={700} offset={8} />
                </Bar>
                <Bar
                  dataKey="Feminino"
                  fill="#db2777"
                  radius={[0, 4, 4, 0]}
                  barSize={15}
                  className="cursor-pointer"
                  onClick={() => navigate('/rh/colaboradores', { state: { segmentFilter: 'Administrativo', genderFilter: 'Feminino' } })}
                >
                  <LabelList dataKey="Feminino" position="right" fill="#db2777" fontSize={10} fontWeight={700} offset={8} />
                </Bar>
                <Bar dataKey="Total" fill="transparent" barSize={1} isAnimationActive={false}>
                  <LabelList dataKey="Total" position="right" fill={COLORS.text} fontSize={10} fontWeight={700} formatter={(val: number) => val > 0 ? `Total: ${val}` : ''} offset={5} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 6. Chart Row 4: Legal Specifics */}
      <div id="export-headcount-cargos" className="grid grid-cols-1 gap-6">


        {/* Legal Levels */}
        <div id="chart-headcount-legal-levels" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#1e3a8a]/10 text-[#1e3a8a]">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800 tracking-tight">Distribuição por Nível (Jurídico)</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Senioridade da Equipe</p>
              </div>
            </div>
            <CopyChartButton targetId="chart-headcount-legal-levels" />
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={legalLevelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 11, fontWeight: 700 }} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} content={RHChartTooltip} />
                <Bar dataKey="value" name="Qtd" radius={[4, 4, 0, 0]} barSize={40} fill={COLORS.secondary}>
                  <LabelList dataKey="value" position="top" fill={COLORS.secondary} fontSize={10} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>


      </div>

    </div >
  )
}
