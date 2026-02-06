import { useState } from 'react'
import { 
  LayoutDashboard, 
  UserCircle, 
  Grid, 
  LogOut 
} from 'lucide-react'

interface FinanceDashboardProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function FinanceDashboard({ userName = 'Usuário', onModuleHome, onLogout }: FinanceDashboardProps) {
  const [loading, setLoading] = useState(false)

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
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Financeiro</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white shadow-md">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && (
            <button 
              onClick={onModuleHome} 
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title="Voltar aos módulos"
            >
              <Grid className="h-5 w-5" />
            </button>
          )}
          {onLogout && (
            <button 
              onClick={onLogout} 
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
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