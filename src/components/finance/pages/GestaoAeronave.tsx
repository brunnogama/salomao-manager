import { useState } from 'react'
import { 
  Plane, 
  UserCircle, 
  LogOut, 
  Grid, 
  Plus, 
  Search, 
  FileText,
  RefreshCw,
  TrendingDown
} from 'lucide-react'

interface GestaoAeronaveProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function GestaoAeronave({ 
  userName = 'Usuário', 
  onModuleHome, 
  onLogout 
}: GestaoAeronaveProps) {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 p-6 space-y-6">
      
      {/* PAGE HEADER - Padrão Salomão Financeiro */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <Plane className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Gestão da Aeronave
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Controle de custos operacionais, taxas e combustíveis
            </p>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Conectado</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white shadow-md">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && (
            <button 
              onClick={onModuleHome} 
              className="p-2 text-gray-600 hover:bg-gray-100 hover:text-[#1e3a8a] rounded-lg transition-all"
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

      {/* ACTION BAR - Busca e Financeiro */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar despesas, hangaragem ou taxas..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100/50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm hover:bg-gray-50 transition-all active:scale-95">
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            Fluxo de Despesas
          </button>
          
          <button className="p-2.5 bg-white border border-gray-200 text-gray-500 rounded-xl hover:text-[#1e3a8a] transition-all active:scale-95">
            <RefreshCw className="h-4 w-4" />
          </button>

          <button className="flex items-center gap-2 px-8 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-[#112240] transition-all active:scale-95">
            <Plus className="h-3.5 w-3.5" />
            Novo Lançamento
          </button>
        </div>
      </div>

      {/* ESPAÇO PARA O CONTEÚDO FINANCEIRO */}
      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-[2rem] bg-white/50">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">
            Módulo Financeiro da Aeronave em Desenvolvimento
          </p>
        </div>
      </div>
      
    </div>
  )
}