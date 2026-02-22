import { useState, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  TrendingUp,
  Clock,
  Filter,
  X,
  Save,
  AlignLeft,
  GraduationCap,
  Pencil,
  Trash2,
  CalendarDays as MonthIcon
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function Calendario() {
  const [currentDate] = useState(new Date())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [vencimentosOAB, setVencimentosOAB] = useState<any[]>([])

  // Estados para o Modal de Evento
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [savingEvento, setSavingEvento] = useState(false)
  const [novoEvento, setNovoEvento] = useState({
    titulo: '',
    tipo: 'Pagamento',
    data: new Date().toISOString().split('T')[0],
    descricao: ''
  })

  // Estado para o Modal de Lista do Dia (mantendo lógica do sistema anterior)
  // Estado para o Modal de Lista do Dia (mantendo lógica do sistema anterior)

  // Efeito para buscar colaboradores e calcular vencimentos para a visão de grade
  useEffect(() => {
    const fetchVencimentosCalendario = async () => {
      const { data } = await supabase.from('colaboradores').select('nome, cargo, data_admissao')
      if (data) {
        const processados = data.filter((v: any) => {
          if (!v.data_admissao) return false
          const cargoLimpo = v.cargo?.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || ''
          return cargoLimpo === 'advogado' || cargoLimpo === 'socio'
        }).map((v: any) => {
          let dia, mes, ano;
          if (v.data_admissao.includes('/')) {
            [dia, mes, ano] = v.data_admissao.split('/').map(Number);
          } else {
            [ano, mes, dia] = v.data_admissao.split('-').map(Number);
          }
          const dataVenc = new Date(ano, (mes - 1) + 6, dia)
          dataVenc.setDate(dataVenc.getDate() - 1)
          return { nome: v.nome, dataVenc, tipo: 'OAB' }
        })
        setVencimentosOAB(processados)
      }
    }
    fetchVencimentosCalendario()
  }, [])

  const handleSaveEvento = async () => {
    if (!novoEvento.titulo || !novoEvento.data) return
    setSavingEvento(true)
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

  // Agrupamento de eventos para a lista lateral (Lógica aplicada do RH)
  const getAgrupadosPorDia = () => {
    const list = vencimentosOAB.filter(v =>
      v.dataVenc.getMonth() === selectedMonth &&
      v.dataVenc.getFullYear() === selectedYear
    );
    const grouped: { [key: number]: any[] } = {};

    list.forEach(item => {
      const day = item.dataVenc.getDate();
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(item);
    });

    return Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b)
      .map(day => ({ day, items: grouped[day] }));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear)
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear)
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        day === currentDate.getDate() &&
        selectedMonth === currentDate.getMonth() &&
        selectedYear === currentDate.getFullYear()

      const vencimentosDoDia = vencimentosOAB.filter(v =>
        v.dataVenc.getDate() === day &&
        v.dataVenc.getMonth() === selectedMonth &&
        v.dataVenc.getFullYear() === selectedYear
      )

      days.push(
        <div
          key={day}
          className={`aspect-square p-2 rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer ${isToday
            ? 'bg-gradient-to-br from-[#1e3a8a] to-[#112240] border-[#1e3a8a] shadow-xl'
            : vencimentosDoDia.length > 0
              ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg hover:scale-105 hover:border-[#1e3a8a]/50'
              : 'bg-white border-gray-100 hover:border-[#1e3a8a]/30 hover:bg-blue-50/30'
            }`}
        >
          <div className={`text-sm font-black ${isToday ? 'text-white' : 'text-[#0a192f]'}`}>
            {day}
          </div>

          <div className="space-y-1 mt-1">
            {vencimentosDoDia.slice(0, 2).map((v, idx) => (
              <div key={`oab-${idx}`} className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-1.5 py-1 rounded-lg shadow-sm border border-orange-100">
                <GraduationCap className="h-3 w-3 text-orange-600 flex-shrink-0" />
                <span className="text-[9px] font-bold text-gray-700 truncate w-full leading-tight">{v.nome}</span>
              </div>
            ))}
            {vencimentosDoDia.length > 2 && (
              <div className="text-[8px] font-black text-[#1e3a8a] text-center bg-white/80 rounded px-1">
                +{vencimentosDoDia.length - 2}
              </div>
            )}
            {day === 15 && !isToday && vencimentosDoDia.length === 0 && (
              <div className="flex items-center gap-1 bg-white/90 px-1.5 py-1 rounded-lg border border-red-100">
                <ArrowUpCircle className="h-3 w-3 text-red-600 flex-shrink-0" />
                <span className="text-[9px] font-bold text-gray-700 truncate">Vencimento</span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return days
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6">

      {/* PAGE HEADER COMPLETO */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <CalendarIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Calendário Financeiro
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Gestão temporal de obrigações e recebimentos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0 justify-end flex-wrap">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Novo Lançamento
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-6 w-full">

        {/* TOOLBAR & STATS */}
        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <div className="flex gap-4 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 custom-scrollbar">
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

          {/* Button moved to header */}
        </div>

        {/* CONTEÚDO PRINCIPAL - GRID 3:1 APLICADO */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Calendário */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 mb-4 lg:mb-0">
            <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6 pb-4 sm:pb-5 border-b border-gray-100">
              <button
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-[#1e3a8a]/10 rounded-xl transition-all hover:scale-110 active:scale-95 shrink-0"
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-[#1e3a8a]" />
              </button>
              <h2 className="text-base sm:text-[20px] font-black text-[#0a192f] tracking-tight text-center">
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
                <div key={dia} className="text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">{dia}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {renderCalendar()}
            </div>
          </div>

          {/* Lista Lateral - Agrupada e com ações (Design Unificado) */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col h-full">
            <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#1e3a8a]" /> Lançamentos do Mês
            </h3>
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '600px' }}>
              {getAgrupadosPorDia().length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 font-bold text-sm italic">Nenhum lançamento agendado.</p>
                </div>
              ) : (
                getAgrupadosPorDia().map((group) => (
                  <div key={group.day} className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
                    <div className="bg-gray-200/50 px-3 py-1.5 flex justify-between items-center">
                      <span className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-wider">
                        Dia {group.day}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 italic">
                        {group.items.length} {group.items.length > 1 ? 'itens' : 'item'}
                      </span>
                    </div>
                    <div className="p-2 space-y-2">
                      {group.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <GraduationCap className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                            <p className="text-xs font-bold text-[#0a192f] truncate">
                              {item.nome}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* MODAL NOVO LANÇAMENTO */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 bg-gradient-to-r from-[#112240] to-[#1e3a8a] flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  <h3 className="font-black text-base tracking-tight">Novo Lançamento</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white p-1.5 rounded-lg transition-all">
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
                    onChange={(e) => setNovoEvento({ ...novoEvento, titulo: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-medium transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                      Categoria
                    </label>
                    <select
                      value={novoEvento.tipo}
                      onChange={(e) => setNovoEvento({ ...novoEvento, tipo: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none bg-white font-medium transition-all"
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
                      onChange={(e) => setNovoEvento({ ...novoEvento, data: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none font-medium transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] hover:bg-gray-200 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEvento}
                  disabled={savingEvento}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white font-black text-[9px] rounded-xl uppercase tracking-[0.2em] shadow-md hover:shadow-lg transition-all active:scale-95"
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