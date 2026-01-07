import { useEffect, useState } from 'react'
import { Users, CheckSquare, Gift, AlertTriangle, Briefcase } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'

// CORREÇÃO: Adicionada a interface DashboardProps
interface DashboardProps {
  onNavigate: (filters?: { socio?: string; brinde?: string }) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    totalClientes: 0,
    tarefasPendentes: 0,
    cadastrosIncompletos: 0,
    brindesVip: 0
  })
  
  const [brindeData, setBrindeData] = useState<any[]>([])
  const [socioData, setSocioData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    
    // Consultas paralelas
    const [clientes, tarefas, incompletos] = await Promise.all([
      supabase.from('clientes').select('id, tipo_brinde, socio'),
      supabase.from('tasks').select('id', { count: 'exact' }).eq('status', 'todo'),
      supabase.from('clientes').select('id', { count: 'exact' }).not('ignored_fields', 'is', null)
    ])

    const clientesData = clientes.data || []
    
    // Processar dados de Brindes
    const brindesCount: Record<string, number> = {}
    clientesData.forEach(c => {
      const tipo = c.tipo_brinde || 'Não Definido'
      brindesCount[tipo] = (brindesCount[tipo] || 0) + 1
    })
    const brindeChartData = Object.entries(brindesCount).map(([name, value]) => ({ name, value }))

    // Processar dados de Sócios
    const sociosCount: Record<string, number> = {}
    clientesData.forEach(c => {
      const socio = c.socio || 'Sem Sócio'
      sociosCount[socio] = (sociosCount[socio] || 0) + 1
    })
    const socioChartData = Object.entries(sociosCount)
      .map(([name, clientes]) => ({ name, clientes }))
      .sort((a, b) => b.clientes - a.clientes)
      .slice(0, 5)

    setStats({
      totalClientes: clientes.count || clientesData.length,
      tarefasPendentes: tarefas.count || 0,
      cadastrosIncompletos: incompletos.count || 0,
      brindesVip: brindesCount['Brinde VIP'] || 0
    })

    setBrindeData(brindeChartData)
    setSocioData(socioChartData)
    setLoading(false)
  }

  const COLORS = ['#112240', '#2563eb', '#10b981', '#f59e0b', '#ef4444']

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#112240]">Visão Geral</h2>
      
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => onNavigate()} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all hover:-translate-y-1">
          <div>
            <p className="text-sm font-medium text-gray-500">Total de Clientes</p>
            <p className="text-3xl font-bold text-[#112240]">{stats.totalClientes}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Users className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Tarefas Pendentes</p>
            <p className="text-3xl font-bold text-orange-600">{stats.tarefasPendentes}</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg text-orange-600"><CheckSquare className="h-6 w-6" /></div>
        </div>

        <div onClick={() => onNavigate({ brinde: 'Brinde VIP' })} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all hover:-translate-y-1">
          <div>
            <p className="text-sm font-medium text-gray-500">Brindes VIP</p>
            <p className="text-3xl font-bold text-purple-600">{stats.brindesVip}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600"><Gift className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Cadastros Pendentes</p>
            <p className="text-3xl font-bold text-red-600">{stats.cadastrosIncompletos}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-red-600"><AlertTriangle className="h-6 w-6" /></div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico de Brindes */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Gift className="h-5 w-5 text-blue-600" /> Distribuição de Brindes
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={brindeData} 
                  cx="50%" cy="50%" 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="value"
                  cursor="pointer"
                  onClick={(data) => onNavigate({ brinde: data.name })}
                >
                  {brindeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Sócios */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" /> Top 5 Sócios
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={socioData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar 
                    dataKey="clientes" 
                    fill="#112240" 
                    radius={[0, 4, 4, 0]} 
                    barSize={20}
                    cursor="pointer"
                    onClick={(data) => onNavigate({ socio: data.name })}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}