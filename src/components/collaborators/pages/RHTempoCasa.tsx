import { useState } from 'react'
import { 
  Clock, 
  UserCircle, 
  Grid, 
  LogOut,
  Medal,
  Calendar,
  Gift,
  Search
} from 'lucide-react'

interface RHTempoCasaProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function RHTempoCasa({ userName = 'Usuário', onModuleHome, onLogout }: RHTempoCasaProps) {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">
      
      {/* PAGE HEADER - Padrão Salomão Design System */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <Clock className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Tempo de Casa
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Gestão de senioridade, jubileus e aniversários de admissão
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
        
        {/* FILTROS E BUSCA */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium text-sm"
            />
          </div>

          <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max">
              <div className="p-2 rounded-lg bg-blue-50 text-[#1e3a8a]">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[8px] text-gray-400 uppercase font-black tracking-[0.1em]">Próximos Jubileus</p>
                <p className="text-sm font-bold text-[#0a192f]">0 este mês</p>
              </div>
            </div>
          </div>
        </div>

        {/* ÁREA DE LISTAGEM */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-full bg-blue-50 mb-4">
              <Medal className="h-12 w-12 text-[#1e3a8a] opacity-20" />
            </div>
            <div className="flex items-center gap-2 mb-2">
               <Gift className="h-5 w-5 text-blue-400" />
               <h2 className="text-xl font-black text-[#0a192f]">Comemorações de Carreira</h2>
            </div>
            <p className="text-gray-500 max-w-sm mt-2">
              Aqui serão listados os colaboradores por tempo de permanência e premiações por tempo de serviço.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}