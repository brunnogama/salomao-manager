import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Clock,
  TrendingUp,
  Megaphone
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RHDashboardProps { }

export function RHDashboard({ }: RHDashboardProps) {
  const [actionsCount, setActionsCount] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const year = new Date().getFullYear()
      const { data: actions, error } = await supabase
        .from('rh_actions')
        .select('event_date')
        .gte('event_date', `${year}-01-01`)
        .lte('event_date', `${year}-12-31`)

      if (error) throw error

      const monthlyCounts = new Array(12).fill(0)
      actions?.forEach(action => {
        const month = new Date(action.event_date).getMonth()
        monthlyCounts[month]++
      })

      setActionsCount(monthlyCounts)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const chartData = {
    labels: [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ],
    datasets: [
      {
        label: 'Ações Realizadas',
        data: actionsCount,
        backgroundColor: '#1e3a8a',
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <LayoutDashboard className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Dashboard RH
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Indicadores de capital humano e gestão de colaboradores
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full">

        {/* DATA VISUALIZATION - ACTIONS CHART */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-[#1e3a8a]">
                <Megaphone className="h-5 w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#0a192f]">Ações Realizadas (Anual)</h2>
            </div>
          </div>

          <div className="h-48 sm:h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400 animate-pulse text-sm">Carregando dados...</div>
            ) : (
              <Bar options={chartOptions} data={chartData} />
            )}
          </div>
        </div>

        {/* STATS CARDS - Placeholder for other metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 opacity-50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-[#1e3a8a]">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Total Colaboradores</p>
            <p className="text-2xl font-black text-[#0a192f]">--</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 opacity-50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-[#1e3a8a]">
                <UserPlus className="h-6 w-6" />
              </div>
            </div>
            <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Novas Admissões</p>
            <p className="text-2xl font-black text-[#0a192f]">--</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 opacity-50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-[#1e3a8a]">
                <Clock className="h-6 w-6" />
              </div>
            </div>
            <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Ponto Pendente</p>
            <p className="text-2xl font-black text-[#0a192f]">--</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 opacity-50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-[#1e3a8a]">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Turnover Mensal</p>
            <p className="text-2xl font-black text-[#0a192f]">--%</p>
          </div>
        </div>

      </div>
    </div>
  )
}