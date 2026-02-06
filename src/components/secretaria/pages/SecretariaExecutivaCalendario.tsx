import { useState } from 'react'
import { 
  CalendarDays, 
  UserCircle, 
  Grid, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock
} from 'lucide-react'

interface SecretariaExecutivaCalendarioProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function SecretariaExecutivaCalendario({ 
  userName = 'Usuário', 
  onModuleHome, 
  onLogout 
}: SecretariaExecutivaCalendarioProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  // Funções para gerar a grade real do calendário
  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay()

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear)
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear)
    const days = []

    // Espaços vazios para o início do mês
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square p-2" />)
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <div 
          key={day} 
          className="aspect-square p-2 border border-gray-50 rounded-xl hover:bg-blue-50/30 transition-all cursor-pointer group relative bg-white"
        >
          <span className="text-sm font-bold text-gray-400 group-hover:text-[#1e3a8a]">{day}</span>
        </div>
      )
    }

    return days
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">
      
      {/* PAGE HEADER - Padrão Salomão Design System */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <CalendarDays className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Agenda Executiva
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Gestão de compromissos, reuniões e eventos da diretoria
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Secretaria Executiva</span>
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
        
        {/* TOOLBAR */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-all">
              <ChevronLeft className="h-5 w-5 text-[#1e3a8a]" />
            </button>
            <h2 className="text-lg font-black text-[#0a192f] min-w-[150px] text-center">
              {MESES[selectedMonth]} {selectedYear}
            </h2>
            <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-all">
              <ChevronRight className="h-5 w-5 text-[#1e3a8a]" />
            </button>
          </div>

          <button className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95">
            <Plus className="h-4 w-4" /> Novo Compromisso
          </button>
        </div>

        {/* CALENDAR GRID */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {DIAS_SEMANA.map(dia => (
              <div key={dia} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest py-2">
                {dia}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2 min-h-[400px]">
            {renderCalendarDays()}
          </div>
        </div>

        {/* LEGEND / UPCOMING */}
        <div className="bg-[#112240] rounded-2xl p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Clock className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Próximo Compromisso</p>
              <p className="text-sm font-medium">Nenhum evento agendado para as próximas 24h</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}