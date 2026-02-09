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
  AlertTriangle
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
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [viewMode, setViewMode] = useState<'calendario' | 'lista'>('calendario')

  const getStatusStyles = (status: FaturaStatus) => {
    switch (status) {
      case 'aguardando_resposta':
        return { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-100', dot: 'bg-blue-500', icon: <Clock className="h-3 w-3" />, label: 'Aguardando' }
      case 'radar':
        return { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-500', icon: <AlertCircle className="h-3 w-3" />, label: 'Radar' }
      case 'contato_direto':
        return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-500', icon: <Phone className="h-3 w-3" />, label: 'Direto' }
      case 'pago':
        return { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Pago' }
      default:
        return { bg: 'bg-gray-400', text: 'text-gray-700', border: 'border-gray-100', dot: 'bg-gray-400', icon: <Clock className="h-3 w-3" />, label: 'Enviado' }
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

  // Estatísticas baseadas nas faturas reais
  const stats = {
    total: faturas.length,
    aguardando: faturas.filter(f => f.status === 'aguardando_resposta').length,
    radar: faturas.filter(f => f.status === 'radar').length,
    contato: faturas.filter(f => f.status === 'contato_direto').length
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear)
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear)
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const faturasDoDia = faturas.filter(f => f.data_envio.startsWith(dateStr))

      const isToday = 
        day === new Date().getDate() && 
        selectedMonth === new Date().getMonth() && 
        selectedYear === new Date().getFullYear()

      days.push(
        <div
          key={day}
          className={`aspect-square p-2 rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer ${
            isToday 
              ? 'bg-gradient-to-br from-[#1e3a8a] to-[#112240] border-[#1e3a8a] shadow-xl text-white' 
              : faturasDoDia.length > 0
              ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg hover:scale-105'
              : 'bg-white border-gray-100 hover:border-[#1e3a8a]/30 hover:bg-blue-50/30'
          }`}
        >
          <div className={`text-sm font-black ${isToday ? 'text-white' : 'text-[#0a192f]'}`}>
            {day}
          </div>
          {faturasDoDia.length > 0 && (
            <div className="space-y-1 mt-1">
              {faturasDoDia.slice(0, 2).map((fatura, idx) => {
                const style = getStatusStyles(fatura.status)
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-1.5 py-1 rounded-lg shadow-sm border border-blue-100"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${style.bg}`} />
                    <span className="text-[8px] font-bold text-gray-700 truncate w-full leading-tight">
                      {fatura.cliente_nome}
                    </span>
                  </div>
                )
              })}
              {faturasDoDia.length > 2 && (
                <div className="text-[7px] font-black text-[#1e3a8a] text-center bg-white/80 rounded px-1">
                  +{faturasDoDia.length - 2}
                </div>
              )}
            </div>
          )}
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
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Contas a Receber
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Calendário de vencimentos e fluxo de cobrança 2d + 2d
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Financeiro</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white shadow-md">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && (
            <button onClick={onModuleHome} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all" title="Voltar aos módulos">
              <Grid className="h-5 w-5" />
            </button>
          )}
          {onLogout && (
            <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Sair">
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6 w-full">
      
        {/* TOOLBAR & STATS */}
        <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max hover:shadow-md transition-all">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Aguardando</p>
                <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">{stats.aguardando}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max hover:shadow-md transition-all">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">No Radar</p>
                <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">{stats.radar}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max hover:shadow-md transition-all">
              <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Contato Direto</p>
                <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">{stats.contato}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max hover:shadow-md transition-all">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Faturas Totais</p>
                <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full xl:w-auto justify-end">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('calendario')}
                className={`px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-sm ${
                  viewMode === 'calendario'
                    ? 'bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white shadow-lg'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                Calendário
              </button>
              <button
                onClick={() => setViewMode('lista')}
                className={`px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-sm ${
                  viewMode === 'lista'
                    ? 'bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white shadow-lg'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                Lista
              </button>
            </div>
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        {viewMode === 'calendario' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Calendário Grid */}
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
                {renderCalendar()}
              </div>
            </div>

            {/* Lista Lateral de Pendências Críticas */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col h-full">
              <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" /> Radar e Críticos
              </h3>
              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '600px' }}>
                {faturas.filter(f => f.status === 'radar' || f.status === 'contato_direto').map((fatura) => {
                  const style = getStatusStyles(fatura.status)
                  return (
                    <div key={fatura.id} className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden shadow-sm group">
                      <div className={`px-3 py-1.5 flex justify-between items-center ${style.bg} opacity-20`}>
                        <span className={`text-[10px] font-black uppercase tracking-wider ${style.text}`}>
                          {style.label}
                        </span>
                      </div>
                      <div className="p-3 bg-white">
                        <p className="text-xs font-black text-[#0a192f] truncate">{fatura.cliente_nome}</p>
                        <p className="text-[10px] font-bold text-[#1e3a8a] mt-1">
                          {Number(fatura.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-2 font-medium italic">
                          Enviado em: {new Date(fatura.data_envio).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {faturas.filter(f => f.status === 'radar' || f.status === 'contato_direto').length === 0 && (
                  <div className="text-center py-10">
                    <CheckCircle2 className="h-10 w-10 text-emerald-200 mx-auto mb-3" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tudo em dia!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            {/* Visualização de Lista simplificada integrada */}
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
              <div className="p-2 bg-[#1e3a8a]/10 rounded-xl">
                <FileText className="h-5 w-5 text-[#1e3a8a]" />
              </div>
              <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">Lista Geral de Faturas</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente / Data</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {faturas.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-[#0a192f]">{f.cliente_nome}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Enviado: {new Date(f.data_envio).toLocaleDateString('pt-BR')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-[#1e3a8a]">
                          {Number(f.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${getStatusStyles(f.status).bg} ${getStatusStyles(f.status).text} ${getStatusStyles(f.status).border}`}>
                            {getStatusStyles(f.status).label}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}