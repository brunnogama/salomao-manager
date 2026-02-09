// src/components/finance/contasareceber/pages/FinanceCalendarioReceber.tsx
import { useState } from 'react'
import { 
  ArrowDownCircle, 
  UserCircle, 
  Grid, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  Phone,
  CheckCircle2
} from 'lucide-react'
import { useFinanceContasReceber, FaturaStatus } from '../hooks/useFinanceContasReceber'

interface FinanceCalendarioReceberProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function FinanceCalendarioReceber({ 
  userName = 'Usuário', 
  onModuleHome, 
  onLogout 
}: FinanceCalendarioReceberProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const { faturas, loading } = useFinanceContasReceber()

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))

  const getStatusColor = (status: FaturaStatus) => {
    switch (status) {
      case 'aguardando_resposta': return 'bg-blue-500'
      case 'radar': return 'bg-amber-500'
      case 'contato_direto': return 'bg-red-500'
      case 'pago': return 'bg-emerald-500'
      default: return 'bg-gray-400'
    }
  }

  const renderDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const days = []
    const totalDays = daysInMonth(year, month)
    const offset = firstDayOfMonth(year, month)

    for (let i = 0; i < offset; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-gray-50/50 border border-gray-100"></div>)
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = new Date(year, month, day).toISOString().split('T')[0]
      const faturasDoDia = faturas.filter(f => f.data_envio.startsWith(dateStr))

      days.push(
        <div key={day} className="h-32 bg-white border border-gray-100 p-2 hover:bg-gray-50 transition-colors">
          <span className="text-xs font-bold text-gray-400">{day}</span>
          <div className="mt-1 space-y-1 overflow-y-auto max-h-24 custom-scrollbar">
            {faturasDoDia.map(f => (
              <div 
                key={f.id} 
                className={`text-[10px] p-1 rounded text-white font-bold truncate flex items-center gap-1 ${getStatusColor(f.status)}`}
                title={`${f.cliente_nome}: R$ ${f.valor}`}
              >
                {f.cliente_nome}
              </div>
            ))}
          </div>
        </div>
      )
    }
    return days
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">
      
      {/* HEADER */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <CalendarIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Calendário de Recebíveis</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Pendências por data de envio da fatura</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft /></button>
          <span className="text-lg font-black text-[#0a192f] min-w-[150px] text-center uppercase tracking-widest">
            {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight /></button>
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
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {loading ? (
            <div className="col-span-7 py-20 flex justify-center"><Loader2 className="animate-spin text-[#1e3a8a]" /></div>
          ) : renderDays()}
        </div>
      </div>
    </div>
  )
}