// src/components/finance/contasareceber/pages/FinanceCalendarioReceber.tsx
import { useState } from 'react'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Grid, 
  LogOut, 
  UserCircle,
  Loader2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  FileText,
  Search
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
  const [currentDate] = useState(new Date())

  const getStatusStyle = (status: FaturaStatus) => {
    switch (status) {
      case 'aguardando_resposta': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'radar': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'contato_direto': return 'bg-red-100 text-red-700 border-red-200'
      case 'pago': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusDot = (status: FaturaStatus) => {
    switch (status) {
      case 'aguardando_resposta': return 'bg-blue-500'
      case 'radar': return 'bg-amber-500'
      case 'contato_direto': return 'bg-red-500'
      case 'pago': return 'bg-emerald-500'
      default: return 'bg-gray-400'
    }
  }

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

  // Lógica de agrupamento lateral (Exatamente como no Calendario.tsx)
  const getAgrupadosPorDia = () => {
    const faturasMes = faturas.filter(f => {
      const d = new Date(f.data_envio + 'T12:00:00')
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
    })

    const grouped: { [key: number]: any[] } = {}
    faturasMes.forEach(f => {
      const day = new Date(f.data_envio + 'T12:00:00').getDate()
      if (!grouped[day]) grouped[day] = []
      grouped[day].push(f)
    })

    return Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b)
      .map(day => ({ day, items: grouped[day] }))
  }

  const stats = {
    total: faturas.filter(f => new Date(f.data_envio + 'T12:00:00').getMonth() === selectedMonth).length,
    pagas: faturas.filter(f => f.status === 'pago' && new Date(f.data_envio + 'T12:00:00').getMonth() === selectedMonth).length,
    pendentes: faturas.filter(f => f.status !== 'pago' && new Date(f.data_envio + 'T12:00:00').getMonth() === selectedMonth).length,
  }

  const renderCalendar = () => {
    const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const firstDayOffset = new Date(selectedYear, selectedMonth, 1).getDay()
    const days = []

    for (let i = 0; i < firstDayOffset; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />)
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const faturasDoDia = faturas.filter(f => f.data_envio.startsWith(dateStr))
      const isToday = day === currentDate.getDate() && selectedMonth === currentDate.getMonth() && selectedYear === currentDate.getFullYear()

      days.push(
        <div
          key={day}
          className={`aspect-square p-2 rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer ${
            isToday 
              ? 'bg-gradient-to-br from-[#1e3a8a] to-[#112240] border-[#1e3a8a] shadow-xl' 
              : faturasDoDia.length > 0
              ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg'
              : 'bg-white border-gray-100 hover:bg-blue-50/30'
          }`}
        >
          <div className={`text-sm font-black ${isToday ? 'text-white' : 'text-[#0a192f]'}`}>{day}</div>
          <div className="space-y-1 mt-1">
            {faturasDoDia.slice(0, 2).map((f) => (
              <div key={f.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded shadow-sm border text-[8px] font-bold truncate ${isToday ? 'bg-white/20 text-white border-white/30' : getStatusStyle(f.status)}`}>
                {f.cliente_nome}
              </div>
            ))}
            {faturasDoDia.length > 2 && (
              <div className={`text-[8px] font-black text-center rounded ${isToday ? 'text-white' : 'text-[#1e3a8a] bg-white/80'}`}>+{faturasDoDia.length - 2}</div>
            )}
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
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Calendário Financeiro</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Gestão de recebíveis por data de faturamento</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Financeiro</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white shadow-md">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && (
            <button onClick={onModuleHome} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"><Grid className="h-5 w-5" /></button>
          )}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6 w-full">
        
        {/* STATS */}
        <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max hover:shadow-md transition-all">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg"><DollarSign className="h-5 w-5 text-white" /></div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Pagas</p>
                <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">{stats.pagas}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max hover:shadow-md transition-all">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg"><AlertTriangle className="h-5 w-5 text-white" /></div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Pendentes</p>
                <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">{stats.pendentes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL COM SIDEBAR */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendário */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-100">
              <button onClick={handlePrevMonth} className="p-2.5 hover:bg-[#1e3a8a]/10 rounded-xl transition-all"><ChevronLeft className="h-6 w-6 text-[#1e3a8a]" /></button>
              <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">{MESES[selectedMonth]} {selectedYear}</h2>
              <button onClick={handleNextMonth} className="p-2.5 hover:bg-[#1e3a8a]/10 rounded-xl transition-all"><ChevronRight className="h-6 w-6 text-[#1e3a8a]" /></button>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-3">
              {DIAS_SEMANA.map(dia => (
                <div key={dia} className="text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">{dia}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {loading ? <div className="col-span-7 h-96 flex items-center justify-center"><Loader2 className="animate-spin text-[#1e3a8a]" /></div> : renderCalendar()}
            </div>
          </div>

          {/* LISTA LATERAL - Agrupada conforme solicitado */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col h-full">
            <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#1e3a8a]" /> Faturas do Mês
            </h3>
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '600px' }}>
              {getAgrupadosPorDia().map((group) => (
                <div key={group.day} className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
                  <div className="bg-gray-200/50 px-3 py-1.5 flex justify-between items-center">
                    <span className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-wider">Dia {group.day}</span>
                    <span className="text-[9px] font-bold text-gray-400 italic">{group.items.length} itens</span>
                  </div>
                  <div className="p-2 space-y-2">
                    {group.items.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-100 shadow-sm group">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${getStatusDot(item.status)}`} />
                          <p className="text-[10px] font-bold text-[#0a192f] truncate">{item.cliente_nome}</p>
                        </div>
                        <span className="text-[9px] font-black text-gray-400">R$ {item.valor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {getAgrupadosPorDia().length === 0 && !loading && (
                <div className="text-center py-10">
                  <FileText className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-[10px] font-black text-gray-400 uppercase">Nenhuma fatura</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}