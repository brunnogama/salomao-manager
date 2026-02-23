import { useState, useMemo, useEffect } from 'react'
import {
  LayoutDashboard,
  Users,
  Maximize2,
  Minimize2,
  Cake,
  TrendingUp,
  Award,
  MapPin,
  DoorOpen,
  PieChart as PieChartIcon
} from 'lucide-react'
import { usePresentation } from '../../../contexts/PresentationContext'
import { useColaboradores } from '../hooks/useColaboradores'
import { Collaborator } from '../../../types/controladoria'
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
import { supabase } from '../../../lib/supabase'

// --- Helper Functions ---
const normalizeString = (str?: string) => {
  if (!str) return ''
  return str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const getSegment = (colaborador: Collaborator): 'Administrativo' | 'Jurídico' => {
  const area = normalizeString(colaborador.area)
  if (area === 'administrativa' || area === 'administrativo') return 'Administrativo'
  if (area === 'juridica' || area === 'juridico') return 'Jurídico'

  const roleName = colaborador.roles?.name || String(colaborador.role || '')
  const teamName = colaborador.teams?.name || String(colaborador.equipe || '')

  const role = normalizeString(roleName)
  const team = normalizeString(teamName)

  // Keywords indicating Legal sector
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

const calculateTenure = (hireDateStr: string, refDate: Date = new Date()) => {
  const hireDate = new Date(hireDateStr + 'T12:00:00')
  const diffTime = Math.abs(refDate.getTime() - hireDate.getTime())
  return diffTime / (1000 * 60 * 60 * 24 * 365.25)
}

const formatCompact = (val: number | undefined | null) => {
  if (val === undefined || val === null || isNaN(val)) return '0'
  if (val === 0) return '0'
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(val);
}

// --- Custom Components ---
const CustomDataLabel = (props: any) => {
  const { x, y, value, fill, position } = props;
  const yOffset = position === 'bottom' ? 20 : -40
  return (
    <g>
      <rect x={x - 15} y={y + yOffset} width={30} height={18} rx={4} fill={fill} />
      <text x={x} y={y + yOffset + 12} fill="white" textAnchor="middle" fontSize="10px" fontWeight="bold">
        {formatCompact(value)}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-xl min-w-[140px] z-50">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-3 mb-1">
            <span className="text-[10px] font-bold uppercase" style={{ color: entry.color }}>{entry.name}</span>
            <span className="text-xs font-black text-gray-700">
              {typeof entry.value === 'number' && entry.name.includes('Média') ? entry.value.toFixed(1) + ' anos' : entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const renderCustomPieLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, value, fill, percent } = props;
  if (!cx || !cy || percent < 0.05) return null; // Hide if slice is too small
  const RADIAN = Math.PI / 180;
  const x = cx + (outerRadius + 20) * Math.cos(-midAngle * RADIAN);
  const y = cy + (outerRadius + 20) * Math.sin(-midAngle * RADIAN);
  return (
    <g>
      <rect x={x - 12} y={y - 9} width={24} height={18} rx={4} fill={fill} />
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="10px" fontWeight="bold">{value}</text>
    </g>
  );
};

// --- Main component ---
export function RHDashboard() {
  const { isPresentationMode, togglePresentationMode } = usePresentation()
  const { colaboradores, loading } = useColaboradores()
  const [terminationReasons, setTerminationReasons] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchReasons = async () => {
      const { data } = await supabase.from('termination_reasons').select('id, name')
      if (data) {
        const map: Record<string, string> = {}
        data.forEach(d => map[d.id] = d.name)
        setTerminationReasons(map)
      }
    }
    fetchReasons()
  }, [])

  const COLORS = {
    primary: '#ea580c',   // Admin (Dark Orange)
    secondary: '#1e3a8a', // Jurídico (Dark Blue)
    grid: '#e5e7eb',
    text: '#6b7280',
    pie: ['#1e40af', '#db2777', '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6', '#ec4899', '#64748b']
  }

  // --- Derived Metrics ---
  const today = new Date()
  const currentMonth = today.getMonth() + 1 // 1-12
  const currentYear = today.getFullYear()

  const activeColabs = useMemo(() => colaboradores.filter(c => c.status === 'active'), [colaboradores])

  // 1. Aniversariantes do Mês
  const birthdaysThisMonth = useMemo(() => {
    return activeColabs.filter(c => {
      if (!c.birthday) return false;
      const parts = c.birthday.split('-')
      if (parts.length >= 2) {
        return parseInt(parts[1], 10) === currentMonth
      }
      return false
    }).length
  }, [activeColabs, currentMonth])

  // 2. Evolução Acumulada do Headcount (Current Year)
  const headcountChartData = useMemo(() => {
    const monthsList = Array.from({ length: 12 }, (_, i) => i)
    const maxMonthIndex = currentMonth - 1 // Show up to current month
    const visibleMonths = monthsList.filter(m => m <= maxMonthIndex)

    return visibleMonths.map(monthIndex => {
      const date = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59) // End of month
      const activeAdmin = colaboradores.filter(c => isActiveAtDate(c, date) && getSegment(c) === 'Administrativo').length
      const activeLegal = colaboradores.filter(c => isActiveAtDate(c, date) && getSegment(c) === 'Jurídico').length

      return {
        name: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        Administrativo: activeAdmin,
        Jurídico: activeLegal,
      }
    })
  }, [colaboradores, currentYear, currentMonth])

  // 3. Evolução da Estabilidade Média (Current Year)
  const stabilityEvolutionData = useMemo(() => {
    const monthsList = Array.from({ length: 12 }, (_, i) => i)
    const maxMonthIndex = currentMonth - 1
    const visibleMonths = monthsList.filter(m => m <= maxMonthIndex)

    return visibleMonths.map(monthIndex => {
      const date = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59)
      const activeAtDate = colaboradores.filter(c => isActiveAtDate(c, date))

      const admin = activeAtDate.filter(c => getSegment(c) === 'Administrativo')
      const legal = activeAtDate.filter(c => getSegment(c) === 'Jurídico')

      const calcAvgMap = (list: Collaborator[]) => {
        if (list.length === 0) return 0;
        const sum = list.reduce((acc, c) => acc + calculateTenure(c.hire_date!, date), 0)
        return sum / list.length
      }

      return {
        name: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        Administrativo: parseFloat(calcAvgMap(admin).toFixed(2)),
        Jurídico: parseFloat(calcAvgMap(legal).toFixed(2)),
      }
    })
  }, [colaboradores, currentYear, currentMonth])

  // 4. Distribuição por Local e Área
  const distLocalAreaData = useMemo(() => {
    const map = new Map<string, { admin: number, legal: number }>()

    activeColabs.forEach(c => {
      const locName = c.locations?.name || String(c.local || 'Não Definido')
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
    })).sort((a, b) => b.Total - a.Total) // Sort by total descending
  }, [activeColabs])

  // 5. Gênero
  const distGenderData = useMemo(() => {
    const map = new Map<string, number>()
    activeColabs.forEach(c => {
      let gender = c.gender || 'Não Informado'
      if (gender.toLowerCase().trim() === 'masculino') gender = 'Masculino'
      else if (gender.toLowerCase().trim() === 'feminino') gender = 'Feminino'
      else if (gender.toLowerCase().trim() === 'm') gender = 'Masculino'
      else if (gender.toLowerCase().trim() === 'f') gender = 'Feminino'
      map.set(gender, (map.get(gender) || 0) + 1)
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [activeColabs])

  // 6. Tipo de Desligamento (All time)
  // Or current year? Showing all time makes the chart richer if there are few this year. Let's do current year to be consistent with evolution.
  const distTerminationData = useMemo(() => {
    const map = new Map<string, number>()
    colaboradores.forEach(c => {
      if (!c.termination_date) return;
      const tDate = new Date(c.termination_date + 'T12:00:00')
      if (tDate.getFullYear() !== currentYear) return;

      let reason = 'Não Informado'
      if (c.termination_reason_id && terminationReasons[c.termination_reason_id]) {
        reason = terminationReasons[c.termination_reason_id]
      } else if (c.termination_reasons?.name) {
        reason = c.termination_reasons.name
      }

      map.set(reason, (map.get(reason) || 0) + 1)
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [colaboradores, currentYear, terminationReasons])


  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="h-full flex items-center justify-center text-blue-900 animate-pulse font-bold">
          Carregando Dashboard RH...
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <LayoutDashboard className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Dashboard RH
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Visão geral estratégica e indicadores chave
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Botão de Apresentação */}
          <button
            onClick={togglePresentationMode}
            title={isPresentationMode ? "Sair da Apresentação" : "Modo Apresentação"}
            className={`flex justify-center items-center w-10 h-10 rounded-xl shadow-lg transition-all active:scale-95 ${isPresentationMode
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
          >
            {isPresentationMode ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6 w-full pb-10">

        {/* TOP CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1 bg-pink-500"></div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Aniversariantes do Mês</p>
              <p className="text-3xl font-black text-gray-800">{birthdaysThisMonth}</p>
            </div>
            <div className="p-3 bg-pink-50 rounded-xl text-pink-500">
              <Cake className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1 bg-blue-600"></div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Total Ativos (Hoje)</p>
              <p className="text-3xl font-black text-gray-800">{activeColabs.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* CHARTS ROW 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Headcount */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#1e3a8a]/10 rounded-lg text-[#1e3a8a]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-[#0a192f]">Evolução Acumulada do Headcount ({currentYear})</h2>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={headcountChartData} margin={{ top: 30, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hcAdmin" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1} /><stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} /></linearGradient>
                    <linearGradient id="hcLegal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.1} /><stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 10 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                  <Area type="monotone" dataKey="Administrativo" stroke={COLORS.primary} fill="url(#hcAdmin)" strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: COLORS.primary, strokeWidth: 2 }} activeDot={{ r: 6 }}>
                    <LabelList dataKey="Administrativo" content={(props) => <CustomDataLabel {...props} fill={COLORS.primary} position="bottom" />} />
                  </Area>
                  <Area type="monotone" dataKey="Jurídico" stroke={COLORS.secondary} fill="url(#hcLegal)" strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: COLORS.secondary, strokeWidth: 2 }} activeDot={{ r: 6 }}>
                    <LabelList dataKey="Jurídico" content={(props) => <CustomDataLabel {...props} fill={COLORS.secondary} position="top" />} />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stability */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-50 rounded-lg text-green-600">
                <Award className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-[#0a192f]">Estabilidade Média ({currentYear})</h2>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stabilityEvolutionData} margin={{ top: 30, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stAdmin" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1} /><stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} /></linearGradient>
                    <linearGradient id="stLegal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.1} /><stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 10 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 10 }} unit="a" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                  <Area type="monotone" dataKey="Administrativo" stroke={COLORS.primary} fill="url(#stAdmin)" strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: COLORS.primary, strokeWidth: 2 }} activeDot={{ r: 6 }}>
                    <LabelList dataKey="Administrativo" content={(props) => <CustomDataLabel {...props} fill={COLORS.primary} position="bottom" />} />
                  </Area>
                  <Area type="monotone" dataKey="Jurídico" stroke={COLORS.secondary} fill="url(#stLegal)" strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: COLORS.secondary, strokeWidth: 2 }} activeDot={{ r: 6 }}>
                    <LabelList dataKey="Jurídico" content={(props) => <CustomDataLabel {...props} fill={COLORS.secondary} position="top" />} />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* CHARTS ROW 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Distribuição por Local e Área */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#0a192f] leading-none">Distribuição por Local</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Colaboradores Ativos</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distLocalAreaData} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.grid} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 10, fontWeight: 600 }} width={80} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 600, bottom: 0 }} />
                  <Bar dataKey="Jurídico" stackId="a" fill={COLORS.secondary} barSize={20} />
                  <Bar dataKey="Administrativo" stackId="a" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={20}>
                    <LabelList dataKey="Total" position="right" fill={COLORS.text} fontSize={10} fontWeight={700} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gênero */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <PieChartIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#0a192f] leading-none">Gênero</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Diversidade Ativos</p>
              </div>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              {distGenderData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 30, left: 30, bottom: 20 }}>
                    <Pie
                      data={distGenderData}
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      label={renderCustomPieLabel}
                      labelLine={false}
                    >
                      {distGenderData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-sm">Sem dados preenchidos.</p>
              )}
            </div>
          </div>

          {/* Tipo de Desligamento */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-50 rounded-lg text-red-500">
                <DoorOpen className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#0a192f] leading-none">Tipo Desligamento</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Acumulado ({currentYear})</p>
              </div>
            </div>
            <div className="h-64 w-full">
              {distTerminationData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distTerminationData} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.grid} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: COLORS.text, fontSize: 10, fontWeight: 600 }} width={100} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Quantidade" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20}>
                      <LabelList dataKey="value" position="right" fill={COLORS.text} fontSize={10} fontWeight={700} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <span className="text-gray-400 text-sm font-medium border-2 border-dashed border-gray-100 rounded-xl px-4 py-8">Nenhum registrado.</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div >
  )
}