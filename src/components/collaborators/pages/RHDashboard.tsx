import {
  LayoutDashboard,



  Users,
  UserPlus,
  Clock,
  TrendingUp
} from 'lucide-react'

interface RHDashboardProps { }

export function RHDashboard({ }: RHDashboardProps) {


  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">

      {/* PAGE HEADER - Padrão Salomão Design System */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <LayoutDashboard className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Dashboard RH
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Indicadores de capital humano e gestão de colaboradores
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Action buttons will go here */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 w-full">

        {/* STATS CARDS - Mockup Visual */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-[#1e3a8a]">
                <Users className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-md">+12%</span>
            </div>
            <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Total Colaboradores</p>
            <p className="text-2xl font-black text-[#0a192f]">0</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-[#1e3a8a]">
                <UserPlus className="h-6 w-6" />
              </div>
            </div>
            <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Novas Admissões</p>
            <p className="text-2xl font-black text-[#0a192f]">0</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-[#1e3a8a]">
                <Clock className="h-6 w-6" />
              </div>
            </div>
            <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Ponto Pendente</p>
            <p className="text-2xl font-black text-[#0a192f]">0</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-[#1e3a8a]">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Turnover Mensal</p>
            <p className="text-2xl font-black text-[#0a192f]">0%</p>
          </div>
        </div>

        {/* Placeholder para Gráficos/Tabelas */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-full bg-blue-50 mb-4">
            <LayoutDashboard className="h-12 w-12 text-[#1e3a8a] animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-[#0a192f]">Dashboard em Desenvolvimento</h2>
          <p className="text-gray-500 max-w-sm mt-2">
            Estamos preparando a integração com a base de colaboradores para exibir métricas em tempo real.
          </p>
        </div>

      </div>
    </div>
  )
}