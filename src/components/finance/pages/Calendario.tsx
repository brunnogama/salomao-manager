import { Grid, LogOut, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarioProps {
  userName: string;
  onModuleHome: () => void;
  onLogout: () => void;
}

export function Calendario({ userName, onModuleHome, onLogout }: CalendarioProps) {
  // Mock simples para visualização do calendário
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  
  return (
    <div className="flex flex-col h-full">
      {/* HEADER IDENTICO AO SISTEMA */}
      <header className="bg-white h-16 border-b flex items-center justify-between px-8 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-800">Calendário</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-[#112240] flex items-center justify-center text-white text-xs font-bold">
              {userName.charAt(0)}
            </div>
            <span className="text-sm font-medium text-gray-700">{userName}</span>
          </div>

          <div className="h-6 w-[1px] bg-gray-200 mx-1" />

          <button 
            onClick={onModuleHome}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="Mudar Módulo"
          >
            <Grid className="h-5 w-5" />
          </button>

          <button 
            onClick={onLogout}
            className="p-2 text-gray-500 hover:bg-red-50 rounded-lg transition-colors group"
            title="Sair"
          >
            <LogOut className="h-5 w-5 group-hover:text-red-600" />
          </button>
        </div>
      </header>

      {/* CONTEÚDO DO CALENDÁRIO */}
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Controles do Calendário */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-800">Fevereiro 2026</h2>
              <div className="flex items-center gap-1">
                <button className="p-1 hover:bg-gray-100 rounded-md"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                <button className="p-1 hover:bg-gray-100 rounded-md"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
              </div>
            </div>
            <button className="bg-[#112240] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a3a6d] transition-colors">
              Novo Evento
            </button>
          </div>

          {/* Grid do Calendário */}
          <div className="grid grid-cols-7 border-b bg-gray-50">
            {daysOfWeek.map(day => (
              <div key={day} className="py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-[120px]">
            {/* Exemplo de preenchimento de dias (31 dias simplificados) */}
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="p-2 border-r border-b border-gray-100 hover:bg-gray-50 transition-colors group last:border-r-0">
                <span className="text-sm font-semibold text-gray-400 group-hover:text-[#112240]">{i + 1}</span>
                {/* Espaço para eventos */}
                {i === 4 && (
                  <div className="mt-1 p-1 text-[10px] bg-blue-100 text-blue-700 rounded border border-blue-200 truncate">
                    Pagamento Aeronave
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}