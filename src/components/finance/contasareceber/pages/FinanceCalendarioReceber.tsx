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
  FileText
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

  // Estilos de Status idênticos aos badges do RH
  const getStatusStyle = (status: FaturaStatus) => {
    switch (status) {
      case 'aguardando_resposta': return 'bg-white/90 text-blue-700 border-blue-100'
      case 'radar': return 'bg-white/90 text-amber-700 border-amber-100'
      case 'contato_direto': return 'bg-white/90 text-red-700 border-red-100'
      case 'pago': return 'bg-white/90 text-emerald-700 border-emerald-100'
      default: return 'bg-white/90 text-gray-700 border-gray-100'
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
      setSelectedMonth(11); setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0); setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

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

    return Object.keys(grouped).map(Number).sort((a, b) => a - b).map(day => ({ day, items: grouped[day] }))
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
              ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg hover:scale-105'
              : 'bg-white border-gray-100 hover:border-[#1e3a8a]/30 hover:bg-blue-50/30'
          }`}
        >
          <div className={`text-sm font-black ${isToday ? 'text-white' : 'text-[#0a192f]'}`}>{day}</div>
          <div className="space-y-1 mt-1">
            {faturasDoDia.slice(0, 2).map((f) => (
              <div key={f.id} className={`flex items-center gap-1 bg-white/90 backdrop-blur-sm px-1.5 py-1 rounded-lg shadow-sm border text-[9px] font-bold truncate ${isToday ? 'bg-white/20 text-white border-white/30' : getStatusStyle(f.status)}`}>
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isToday ? 'bg-white' : getStatusDot(f.status)}`} />
                <span className="truncate">{f.cliente_nome}</span>
              </div>
            ))}
            {faturasDoDia.length > 2 && (
              <div className={`text-[8px] font-black text-center rounded px-1 ${isToday ? 'text-white bg-white/10' : 'text-[#1e3a8a] bg-white/80'}`}>
                +{faturasDoDia.length - 2}
              </div>
            )}
          </div>
        </div>
      )
    }
    return days
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">
      
      {/* PAGE HEADER COMPLETO */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <CalendarIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Calendário Financeiro</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Gestão de faturamento e recebíveis</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Conectado</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white shadow-md">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && (
            <button onClick={onModuleHome} className="p-2 text-gray-600 hover:bg-gray-100 hover:text-[#1e3a8a] rounded-lg transition-all"><Grid className="h-5 w-5" /></button>
          )}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6 w-full">
        
        {/* STATS TOOLBAR */}
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
            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max hover:shadow-md transition-all">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg"><TrendingUp className="h-5 w-5 text-white" /></div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Total</p>
                <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 items-center bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-gray-400 tracking-wider">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div> Aguardando
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-gray-400 tracking-wider">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div> Radar
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-gray-400 tracking-wider">
              <div className="w-2 h-2 rounded-full bg-red-500"></div> Contato
            </div>
          </div>
        </div>

        {/* LAYOUT PRINCIPAL: CALENDÁRIO + SIDEBAR */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-100">
              <button onClick={handlePrevMonth} className="p-2.5 hover:bg-[#1e3a8a]/10 rounded-xl transition-all hover:scale-110"><ChevronLeft className="h-6 w-6 text-[#1e3a8a]" /></button>
              <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">{MESES[selectedMonth]} {selectedYear}</h2>
              <button onClick={handleNextMonth} className="p-2.5 hover:bg-[#1e3a8a]/10 rounded-xl transition-all hover:scale-110"><ChevronRight className="h-6 w-6 text-[#1e3a8a]" /></button>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-3">
              {DIAS_SEMANA.map(dia => (
                <div key={dia} className="text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">{dia}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {loading ? <div className="col-span-7 h-96 flex flex-col items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1e3a8a] mb-2" /><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Carregando...</p></div> : renderCalendar()}
            </div>
          </div>

          {/* LISTA LATERAL IDENTICA AO RH */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col h-full">
            <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#1e3a8a]" /> Faturas do Mês
            </h3>
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '600px' }}>
              {getAgrupadosPorDia().map((group) => (
                <div key={group.day} className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden shadow-sm">
                  <div className="bg-gray-200/50 px-3 py-1.5 flex justify-between items-center border-b border-gray-100">
                    <span className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-wider">Dia {group.day}</span>
                    <span className="text-[9px] font-bold text-gray-400 italic">{group.items.length} {group.items.length > 1 ? 'faturas' : 'fatura'}</span>
                  </div>
                  <div className="p-2 space-y-2">
                    {group.items.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm hover:border-[#1e3a8a]/30 transition-all group">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${getStatusDot(item.status)}`} />
                          <p className="text-[10px] font-bold text-[#0a192f] truncate leading-tight">{item.cliente_nome}</p>
                        </div>
                        <span className="text-[9px] font-black text-gray-400 shrink-0">R$ {item.valor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {getAgrupadosPorDia().length === 0 && !loading && (
                <div className="text-center py-20">
                  <FileText className="h-10 w-10 text-gray-100 mx-auto mb-3" />
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Sem faturas este mês</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}