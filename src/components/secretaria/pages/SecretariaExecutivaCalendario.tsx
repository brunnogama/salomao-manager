// src/components/executive-secretary/pages/SecretariaExecutivaCalendario.tsx
import { useState } from 'react'
import { 
  CalendarDays, 
  UserCircle, 
  Grid, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Calendar as CalendarIcon,
  Filter,
  X,
  Search
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
  const [currentDate] = useState(new Date())

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
      days.push(<div key={`empty-${i}`} className="aspect-square" />)
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = 
        day === currentDate.getDate() && 
        selectedMonth === currentDate.getMonth() && 
        selectedYear === currentDate.getFullYear()

      days.push(
        <div 
          key={`day-${day}`} 
          className={`aspect-square p-2 rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer ${
            isToday 
              ? 'bg-gradient-to-br from-[#1e3a8a] to-[#112240] border-[#1e3a8a] shadow-xl' 
              : 'bg-white border-gray-100 hover:border-[#1e3a8a]/30 hover:bg-blue-50/30'
          }`}
        >
          <div className={`text-sm font-black ${isToday ? 'text-white' : 'text-[#0a192f]'}`}>
            {day}
          </div>
        </div>
      )
    }

    return days
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">
      
      {/* PAGE HEADER COMPLETO - Salomão Design System */}
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

      <div className="max-w-[1600px] mx-auto space-y-6 w-full">
        
        {/* TOOLBAR & ACTIONS */}
        <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 w-full xl:w-auto">
            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Hoje</p>
                <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">0</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full xl:w-auto justify-end">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#15803d] to-green-700 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95">
              <Plus className="h-4 w-4" />
              Novo Compromisso
            </button>
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL - GRID 3:1 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendário */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-100">
              <button
                onClick={handlePrevMonth}
                className="p-2.5 hover:bg-[#1e3a8a]/10 rounded-xl transition-all hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="h-6 w-6 text-[#1e3a8a]" />
              </button>
              <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">
                {MESES[selectedMonth]} {selectedYear}
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-2.5 hover:bg-[#1e3a8a]/10 rounded-xl transition-all hover:scale-110 active:scale-95"
              >
                <ChevronRight className="h-6 w-6 text-[#1e3a8a]" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-3">
              {DIAS_SEMANA.map(dia => (
                <div key={dia} className="text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">
                  {dia}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {renderCalendarDays()}
            </div>
          </div>

          {/* Lista Lateral */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col h-full">
            <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#1e3a8a]" /> Compromissos
            </h3>
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '600px' }}>
              <div className="text-center py-8">
                <p className="text-gray-400 font-bold text-xs italic">Nenhum compromisso para este mês.</p>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER / PRÓXIMO COMPROMISSO */}
        <div className="bg-[#112240] rounded-2xl p-6 text-white flex items-center justify-between shadow-2xl">
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