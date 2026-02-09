// src/components/finance/contasareceber/pages/FinanceCalendarioReceber.tsx
import { useState } from 'react'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Filter, 
  X, 
  Plus, 
  Grid, 
  LogOut, 
  UserCircle,
  AlertCircle,
  Phone,
  CheckCircle2,
  FileText,
  Search,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { useFinanceContasReceber, FaturaStatus } from '../hooks/useFinanceContasReceber'

interface FinanceCalendarioReceberProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function FinanceCalendarioReceber({ userName = 'Usuário', onModuleHome, onLogout }: FinanceCalendarioReceberProps) {
  const { faturas, loading } = useFinanceContasReceber()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const getStatusColorClass = (status: FaturaStatus) => {
    switch (status) {
      case 'aguardando_resposta': return 'bg-blue-500'
      case 'radar': return 'bg-amber-500'
      case 'contato_direto': return 'bg-red-500'
      case 'pago': return 'bg-emerald-500'
      default: return 'bg-gray-400'
    }
  }

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay()

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

  const renderCalendar = () => {
    const totalDays = getDaysInMonth(selectedMonth, selectedYear)
    const firstDayOffset = getFirstDayOfMonth(selectedMonth, selectedYear)
    const days = []

    // Dias vazios do mês anterior
    for (let i = 0; i < firstDayOffset; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-gray-50/50 border border-gray-100" />)
    }

    // Dias do mês atual
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const faturasDoDia = faturas.filter(f => f.data_envio.startsWith(dateStr))

      days.push(
        <div
          key={day}
          className="h-32 bg-white border border-gray-100 p-2 hover:bg-gray-50 transition-colors flex flex-col"
        >
          <span className="text-xs font-bold text-gray-400">{day}</span>
          <div className="mt-1 space-y-1 overflow-y-auto max-h-24 custom-scrollbar">
            {faturasDoDia.map((fatura) => (
              <div
                key={fatura.id}
                className={`text-[10px] p-1 rounded text-white font-bold truncate flex items-center gap-1 ${getStatusColorClass(fatura.status)}`}
                title={`${fatura.cliente_nome}: R$ ${fatura.valor}`}
              >
                {fatura.cliente_nome}
              </div>
            ))}
          </div>
        </div>
      )
    }
    return days
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 p-6 space-y-6">
      
      {/* HEADER */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <CalendarIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Calendário de Recebíveis
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Pendências por data de envio da fatura
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <ChevronLeft className="h-6 w-6 text-[#1e3a8a]" />
          </button>
          <span className="text-lg font-black text-[#0a192f] min-w-[180px] text-center uppercase tracking-widest">
            {MESES[selectedMonth]} {selectedYear}
          </span>
          <button 
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <ChevronRight className="h-6 w-6 text-[#1e3a8a]" />
          </button>
        </div>
      </div>

      {/* LEGENDA */}
      <div className="flex gap-4 px-2">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500">
          <div className="w-3 h-3 rounded bg-blue-500"></div> Aguardando
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500">
          <div className="w-3 h-3 rounded bg-amber-500"></div> Radar
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500">
          <div className="w-3 h-3 rounded bg-red-500"></div> Contato Direto
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500">
          <div className="w-3 h-3 rounded bg-emerald-500"></div> Recebido
        </div>
      </div>

      {/* CALENDÁRIO GRID */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header Dias da Semana */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
          {DIAS_SEMANA.map(dia => (
            <div key={dia} className="py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {dia}
            </div>
          ))}
        </div>

        {/* Grade de Dias */}
        <div className="grid grid-cols-7">
          {loading ? (
            <div className="col-span-7 h-96 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin mb-2 text-[#1e3a8a]" />
              <p className="text-[10px] font-black uppercase tracking-widest">Carregando Calendário...</p>
            </div>
          ) : (
            renderCalendar()
          )}
        </div>
      </div>
    </div>
  )
}