// src/components/collaborators/pages/RHHeadcount.tsx

import { useState } from 'react'
import { 
  Users, 
  UserCircle, 
  Grid, 
  LogOut,
  PieChart,
  BarChart3,
  Map,
  Filter
} from 'lucide-react'

interface RHHeadcountProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function RHHeadcount({ userName = 'Usuário', onModuleHome, onLogout }: RHHeadcountProps) {
  const [loading, setLoading] = useState(false)

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">
      
      {/* PAGE HEADER - Padrão Salomão Design System */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Headcount & Estrutura
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Análise quantitativa e distribuição do quadro de pessoal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Recursos Humanos</span>
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
        
        {/* FILTROS DE DISTRIBUIÇÃO */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[240px] bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-[#1e3a8a] rounded-lg">
                <PieChart className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-[#0a192f]">Por Departamento</span>
            </div>
            <Filter className="h-4 w-4 text-gray-300" />
          </div>

          <div className="flex-1 min-w-[240px] bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-[#1e3a8a] rounded-lg">
                <BarChart3 className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-[#0a192f]">Por Cargo</span>
            </div>
            <Filter className="h-4 w-4 text-gray-300" />
          </div>

          <div className="flex-1 min-w-[240px] bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-[#1e3a8a] rounded-lg">
                <Map className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-[#0a192f]">Por Unidade</span>
            </div>
            <Filter className="h-4 w-4 text-gray-300" />
          </div>
        </div>

        {/* CONTAINER DE GRÁFICOS (PLACEHOLDER) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-12 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center justify-center text-center">
             <BarChart3 className="h-12 w-12 text-[#1e3a8a] opacity-10 mb-4" />
             <p className="text-sm font-black text-[#0a192f] uppercase tracking-widest">Distribuição Mensal</p>
             <p className="text-xs text-gray-400 mt-1 font-medium">Processando dados do Supabase...</p>
          </div>

          <div className="bg-white p-12 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center justify-center text-center">
             <PieChart className="h-12 w-12 text-[#1e3a8a] opacity-10 mb-4" />
             <p className="text-sm font-black text-[#0a192f] uppercase tracking-widest">Composição por Vínculo</p>
             <p className="text-xs text-gray-400 mt-1 font-medium">Aguardando registros...</p>
          </div>
        </div>

      </div>
    </div>
  )
}
