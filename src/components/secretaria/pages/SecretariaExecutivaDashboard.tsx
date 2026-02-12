import {
  LayoutDashboard,
  Briefcase,
  Users,
  CalendarDays,
  FileText
} from 'lucide-react'

interface SecretariaExecutivaDashboardProps {
  // Props removed as they are unused
}

export function SecretariaExecutivaDashboard({ }: SecretariaExecutivaDashboardProps) {

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
              Dashboard Executivo
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Gestão estratégica e apoio à diretoria
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Action buttons will go here if added in future */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 w-full">

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-[#1e3a8a]">
                <Briefcase className="h-6 w-6" />
              </div>
            </div>
            <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Tarefas Pendentes</p>
            <p className="text-2xl font-black text-[#0a192f]">0</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-[#1e3a8a]">
                <CalendarDays className="h-6 w-6" />
              </div>
            </div>
            <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Agendamentos Hoje</p>
            <p className="text-2xl font-black text-[#0a192f]">0</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-[#1e3a8a]">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Contatos Recentes</p>
            <p className="text-2xl font-black text-[#0a192f]">0</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-[#1e3a8a]">
                <FileText className="h-6 w-6" />
              </div>
            </div>
            <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Documentos Novos</p>
            <p className="text-2xl font-black text-[#0a192f]">0</p>
          </div>
        </div>

        {/* ÁREA DE CONTEÚDO EM CONSTRUÇÃO */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-full bg-blue-50 mb-4">
            <LayoutDashboard className="h-12 w-12 text-[#1e3a8a] animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-[#0a192f]">Dashboard em Desenvolvimento</h2>
          <p className="text-gray-500 max-w-sm mt-2 font-medium">
            Estamos integrando os dados da secretaria para exibir indicadores de produtividade e gestão administrativa.
          </p>
        </div>

      </div>
    </div>
  )
}