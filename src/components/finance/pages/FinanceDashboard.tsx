import {
  LayoutDashboard
} from 'lucide-react'

interface FinanceDashboardProps {
  // Props removed as they are unused
}

export function FinanceDashboard({ }: FinanceDashboardProps) {

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">

      {/* PAGE HEADER - Seguindo padrão Salomão Design System */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <LayoutDashboard className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Dashboard Financeiro
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Visão geral e indicadores de performance financeira
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Action buttons will go here if added in future */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 w-full">
        {/* Conteúdo em construção */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-full bg-blue-50 mb-4">
            <LayoutDashboard className="h-12 w-12 text-[#1e3a8a] animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-[#0a192f]">Dashboard em Construção</h2>
          <p className="text-gray-500 max-w-md mt-2">
            Estamos integrando os dados do Supabase para exibir seus indicadores financeiros em tempo real.
          </p>
        </div>
      </div>

    </div>
  )
}