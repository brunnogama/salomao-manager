import { useState } from 'react'
import { 
  ArrowLeftRight, 
  UserCircle, 
  Grid, 
  LogOut,
  TrendingDown,
  TrendingUp,
  UserMinus,
  AlertCircle
} from 'lucide-react'

interface RHTurnoverProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function RHTurnover({ userName = 'Usuário', onModuleHome, onLogout }: RHTurnoverProps) {
  const [loading, setLoading] = useState(false)

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">
      
      {/* PAGE HEADER - Padrão Salomão Design System */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <ArrowLeftRight className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Turnover & Retenção
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Análise de rotatividade e indicadores de desligamento
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
        
        {/* INDICADORES DE TURNOVER */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-50 text-red-600">
                <UserMinus className="h-5 w-5" />
              </div>
              <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Desligamentos (Mês)</p>
            </div>
            <p className="text-3xl font-black text-[#0a192f]">0</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-50 text-[#1e3a8a]">
                <TrendingDown className="h-5 w-5" />
              </div>
              <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Taxa de Turnover</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-[#0a192f]">0%</p>
              <span className="text-[10px] font-bold text-green-500">0% vs mês ant.</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-50 text-[#1e3a8a]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Índice de Retenção</p>
            </div>
            <p className="text-3xl font-black text-[#0a192f]">100%</p>
          </div>
        </div>

        {/* ÁREA DE ANÁLISE */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-full bg-blue-50 mb-4">
              <AlertCircle className="h-12 w-12 text-[#1e3a8a] opacity-20" />
            </div>
            <h2 className="text-xl font-black text-[#0a192f]">Dados insuficientes para análise</h2>
            <p className="text-gray-500 max-w-sm mt-2">
              As métricas de turnover serão calculadas automaticamente conforme os registros de movimentação de pessoal no sistema.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}