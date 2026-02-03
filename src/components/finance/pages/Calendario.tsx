// src/components/finance/pages/Calendario.tsx
import { useState, useEffect } from 'react'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  DollarSign,
  TrendingUp,
  Clock,
  Filter,
  X,
  Plus,
  Save,
  AlignLeft,
  CalendarDays,
  Grid,
  LogOut,
  UserCircle,
  GraduationCap
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { ListaVencimentosOAB } from '../components/ListaVencimentosOAB'

interface CalendarioProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function Calendario({ userName = 'Usuário', onModuleHome, onLogout }: CalendarioProps) {
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [viewMode, setViewMode] = useState<'calendario' | 'lista'>('calendario')

  // Estados para o Modal de Evento
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [savingEvento, setSavingEvento] = useState(false)
  const [novoEvento, setNovoEvento] = useState({
    titulo: '',
    tipo: 'Pagamento',
    data: new Date().toISOString().split('T')[0],
    descricao: ''
  })

  const handleSaveEvento = async () => {
    if (!novoEvento.titulo || !novoEvento.data) return
    setSavingEvento(true)
    // Lógica de salvamento será implementada conforme sua necessidade futura
    setTimeout(() => {
      setIsModalOpen(false)
      setSavingEvento(false)
      alert('Lançamento financeiro registrado (Simulação)')
    }, 800)
  }

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay()

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(prev => prev - 1)
    } else {
      setSelectedMonth(prev => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(prev => prev + 1)
    } else {
      setSelectedMonth(prev => prev + 1)
    }
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear)
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear)
    const days = []
    const today = new Date()

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = 
        day === today.getDate() && 
        selectedMonth === today.getMonth() && 
        selectedYear === today.getFullYear()

      days.push(
        <div
          key={day}
          className={`aspect-square p-2 rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
            isToday 
              ? 'bg-gradient-to-br from-[#1e3a8a] to-[#112240] border-[#1e3a8a] shadow-xl' 
              : 'bg-white border-gray-100 hover:border-[#1e3a8a]/30 hover:bg-blue-50/30'
          }`}
        >
          <div className={`text-sm font-black ${isToday ? 'text-white' : 'text-[#0a192f]'}`}>
            {day}
          </div>
          {/* Mock de Evento Financeiro */}
          {day === 15 && !isToday && (
            <div className="flex items-center gap-1 bg-red-50 px-1 py-0.5 rounded border border-red-100">
              <ArrowUpCircle className="h-2 w-2 text-red-600" />
              <span className="text-[8px] font-bold text-red-700 truncate">Vencimento</span>
            </div>
          )}
        </div>
      )
    }
    return days
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">
      
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <DollarSign className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Fluxo de Caixa & Vencimentos
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Gestão temporal de obrigações e recebimentos
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
      
      {/* TOOLBAR & STATS */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="flex gap-4 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
          <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max hover:shadow-md transition-all">
            <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg">
              <ArrowUpCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">A Pagar Hoje</p>
              <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max hover:shadow-md transition-all">
            <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-700 shadow-lg">
              <ArrowDownCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">A Receber</p>
              <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max hover:shadow-md transition-all">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-[#112240] shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Pendente</p>
              <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">0</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full xl:w-auto justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Novo Lançamento
          </button>

          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('calendario')} 
              className={`px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-sm flex items-center gap-2 ${
                viewMode === 'calendario' 
                  ? 'bg-[#1e3a8a] text-white' 
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              <CalendarIcon className="h-4 w-4" /> Mês
            </button>
            <button 
              onClick={() => setViewMode('lista')} 
              className={`px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-sm flex items-center gap-2 ${
                viewMode === 'lista' 
                  ? 'bg-[#1e3a8a] text-white' 
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              <GraduationCap className="h-4 w-4" /> OAB
            </button>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      {viewMode === 'calendario' ? (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-100">
            <button 
              onClick={handlePreviousMonth} 
              className="p-2.5 hover:bg-[#1e3a8a]/10 rounded-xl transition-all"
            >
              <ChevronLeft className="h-6 w-6 text-[#1e3a8a]" />
            </button>
            <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">
              {MESES[selectedMonth]} {selectedYear}
            </h2>
            <button 
              onClick={handleNextMonth} 
              className="p-2.5 hover:bg-[#1e3a8a]/10 rounded-xl transition-all"
            >
              <ChevronRight className="h-6 w-6 text-[#1e3a8a]" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-3">
            {DIAS_SEMANA.map(dia => (
              <div key={dia} className="text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">{dia}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {renderCalendar()}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-100">
            <button 
              onClick={handlePreviousMonth} 
              className="p-2.5 hover:bg-[#1e3a8a]/10 rounded-xl transition-all"
            >
              <ChevronLeft className="h-6 w-6 text-[#1e3a8a]" />
            </button>
            <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">
              {MESES[selectedMonth]} {selectedYear}
            </h2>
            <button 
              onClick={handleNextMonth} 
              className="p-2.5 hover:bg-[#1e3a8a]/10 rounded-xl transition-all"
            >
              <ChevronRight className="h-6 w-6 text-[#1e3a8a]" />
            </button>
          </div>

          {/* COMPONENTE DE LISTA DE VENCIMENTOS OAB */}
          <ListaVencimentosOAB 
            mesAtual={selectedMonth} 
            anoAtual={selectedYear} 
          />
        </div>
      )}

      {/* MODAL NOVO LANÇAMENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-[#112240] to-[#1e3a8a] flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                <h3 className="font-black text-base tracking-tight">Novo Lançamento</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                  Descrição da Conta
                </label>
                <input 
                  type="text" 
                  value={novoEvento.titulo} 
                  onChange={(e) => setNovoEvento({...novoEvento, titulo: e.target.value})} 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-medium" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                    Categoria
                  </label>
                  <select 
                    value={novoEvento.tipo} 
                    onChange={(e) => setNovoEvento({...novoEvento, tipo: e.target.value})} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none bg-white font-medium"
                  >
                    <option value="Pagamento">Contas a Pagar</option>
                    <option value="Recebimento">Contas a Receber</option>
                    <option value="Aeronave">Custos Aeronave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                    Vencimento
                  </label>
                  <input 
                    type="date" 
                    value={novoEvento.data} 
                    onChange={(e) => setNovoEvento({...novoEvento, data: e.target.value})} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-medium" 
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="px-6 py-2.5 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveEvento} 
                disabled={savingEvento} 
                className="flex items-center gap-2 px-6 py-2.5 bg-[#112240] text-white font-black text-[9px] rounded-xl uppercase tracking-[0.2em] shadow-md"
              >
                {savingEvento ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar Lançamento
              </button>
            </div>
          </div>
        </div>
      )}
      
      </div>
    </div>
  )
}
