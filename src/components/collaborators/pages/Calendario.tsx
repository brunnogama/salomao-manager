// src/components/collaborators/pages/Calendario.tsx
import { useState, useEffect, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Cake,
  Users,
  Sparkles,
  PartyPopper,
  Clock,
  Filter,
  X,
  Plus,
  Save,
  AlignLeft,
  CalendarDays,
  Calendar as CalendarEventIcon,
  Pencil,
  Trash2
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { RHCalendarioDiaModal } from '../components/RHCalendarioDiaModal'
import { useColaboradores } from '../hooks/useColaboradores'

interface Colaborador {
  id: string | number;
  name: string; // Atualizado de nome
  birthday: string; // Atualizado de data_nascimento
  role: string; // Atualizado de cargo
  photo_url?: string;
}

interface Evento {
  id: number;
  titulo: string;
  tipo: string;
  data_evento: string;
  descricao?: string;
}

interface AniversarioData {
  colaborador: Colaborador;
  dia: number;
  mes: number;
  ano: number;
  diasRestantes: number;
  isHoje: boolean;
  isEstaSemana: boolean;
  isEsteMes: boolean;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function Calendario() {
  const { colaboradores, loading: colabsLoading } = useColaboradores()
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loadingEventos, setLoadingEventos] = useState(true)

  const collaborators = useMemo(() => {
    return colaboradores
      .filter((c: any) => c.status === 'active' && c.birthday && c.birthday.trim() !== '')
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        birthday: c.birthday,
        role: c.roles?.name || c.role || '',
        photo_url: c.photo_url || c.foto_url
      }))
  }, [colaboradores])
  const [currentDate] = useState(new Date())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [viewMode, setViewMode] = useState<'calendario' | 'proximos'>('calendario')
  const [filterMes, setFilterMes] = useState<number | null>(null)

  // Estados para o Modal de Evento
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [savingEvento, setSavingEvento] = useState(false)
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null)
  const [novoEvento, setNovoEvento] = useState({
    titulo: '',
    tipo: 'Reunião',
    data: new Date().toISOString().split('T')[0],
    descricao: ''
  })

  // Estado para o Modal de Lista do Dia
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ day: number, events: any[] } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoadingEventos(true)
    const { data: evs } = await supabase
      .from('eventos')
      .select('*')
      .order('data_evento')

    if (evs) setEventos(evs)
    setLoadingEventos(false)
  }

  const handleSaveEvento = async () => {
    if (!novoEvento.titulo || !novoEvento.data) return

    setSavingEvento(true)
    try {
      if (editingEvento) {
        const { error } = await supabase
          .from('eventos')
          .update({
            titulo: novoEvento.titulo,
            tipo: novoEvento.tipo,
            data_evento: novoEvento.data,
            descricao: novoEvento.descricao
          })
          .eq('id', editingEvento.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('eventos')
          .insert({
            titulo: novoEvento.titulo,
            tipo: novoEvento.tipo,
            data_evento: novoEvento.data,
            descricao: novoEvento.descricao
          })
        if (error) throw error
      }

      await fetchData()
      setIsModalOpen(false)
      setEditingEvento(null)
      setNovoEvento({
        titulo: '',
        tipo: 'Reunião',
        data: new Date().toISOString().split('T')[0],
        descricao: ''
      })
      alert(editingEvento ? 'Evento atualizado!' : 'Evento criado!')
    } catch (error) {
      console.error('Erro ao salvar evento:', error)
      alert('Erro ao salvar evento.')
    } finally {
      setSavingEvento(false)
    }
  }

  const handleDeleteEvento = async (id: number) => {
    if (!confirm('Deseja realmente excluir este evento?')) return
    try {
      const { error } = await supabase.from('eventos').delete().eq('id', id)
      if (error) throw error
      await fetchData()
      setSelectedDayEvents(null)
    } catch (error) {
      alert('Erro ao excluir evento')
    }
  }

  const handleEditClick = (evento: any) => {
    setEditingEvento(evento)
    setNovoEvento({
      titulo: evento.titulo,
      tipo: evento.tipo,
      data: evento.data_evento,
      descricao: evento.descricao || ''
    })
    setIsModalOpen(true)
    setSelectedDayEvents(null)
  }

  const toTitleCase = (str: string) => {
    if (!str) return ''
    return str.toLowerCase().split(' ').map(word => {
      return (word.length > 2) ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    }).join(' ');
  }

  const formatName = (name: string) => {
    if (!name) return ''
    const cleanName = name.trim()
    const parts = cleanName.split(/\s+/)

    if (parts.length === 1) {
      return toTitleCase(parts[0])
    }

    return toTitleCase(`${parts[0]} ${parts[parts.length - 1]}`)
  }

  const calcularDiasRestantes = (dia: number, mes: number): number => {
    const hoje = new Date()
    const anoAtual = hoje.getFullYear()
    let proximoAniversario = new Date(anoAtual, mes, dia)

    if (proximoAniversario < hoje) {
      proximoAniversario = new Date(anoAtual + 1, mes, dia)
    }

    const diffTime = proximoAniversario.getTime() - hoje.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const processarAniversarios = (): AniversarioData[] => {
    const hoje = new Date()
    const aniversarios: AniversarioData[] = []

    collaborators.forEach((colab: any) => {
      if (colab.birthday) {
        const nascimento = new Date(colab.birthday)
        const nascimentoCorrigido = new Date(nascimento.valueOf() + nascimento.getTimezoneOffset() * 60000)

        const dia = nascimentoCorrigido.getDate()
        const mes = nascimentoCorrigido.getMonth()
        const ano = nascimentoCorrigido.getFullYear()

        const diasRestantes = calcularDiasRestantes(dia, mes)

        aniversarios.push({
          colaborador: colab,
          dia,
          mes,
          ano,
          diasRestantes,
          isHoje: diasRestantes === 0,
          isEstaSemana: diasRestantes <= 7 && diasRestantes >= 0,
          isEsteMes: mes === hoje.getMonth()
        })
      }
    })

    return aniversarios.sort((a, b) => a.diasRestantes - b.diasRestantes)
  }

  const aniversarios = processarAniversarios()

  const aniversariosDoMes = (mes: number, _ano: number): AniversarioData[] => {
    return aniversarios.filter(a => a.mes === mes)
  }

  const eventosDoMes = (mes: number, ano: number) => {
    return eventos.filter(e => {
      const d = new Date(e.data_evento + 'T12:00:00')
      return d.getMonth() === mes && d.getFullYear() === ano
    })
  }

  const getAniversariosHoje = () => aniversarios.filter(a => a.isHoje)
  const getAniversariosEstaSemana = () => aniversarios.filter(a => a.isEstaSemana && !a.isHoje)
  const getAniversariosEsteMes = () => aniversarios.filter(a => a.isEsteMes)
  const getProximosAniversarios = () => {
    if (filterMes !== null) {
      return aniversarios.filter(a => a.mes === filterMes)
    }
    return aniversarios.slice(0, 20)
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear)
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear)
    const days = []
    const anivMes = aniversariosDoMes(selectedMonth, selectedYear)
    const evMes = eventosDoMes(selectedMonth, selectedYear)

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const anivDoDia = anivMes.filter(a => a.dia === day)
      const evDoDia = evMes.filter(e => new Date(e.data_evento + 'T12:00:00').getDate() === day)
      const totalDia = [...anivDoDia, ...evDoDia]

      const isToday =
        day === currentDate.getDate() &&
        selectedMonth === currentDate.getMonth() &&
        selectedYear === currentDate.getFullYear()

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDayEvents({ day, events: totalDia })}
          className={`aspect-square p-2 rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer ${isToday
            ? 'bg-gradient-to-br from-[#1e3a8a] to-[#112240] border-[#1e3a8a] shadow-xl'
            : totalDia.length > 0
              ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg hover:scale-105 hover:border-[#1e3a8a]/50'
              : 'bg-white border-gray-100 hover:border-[#1e3a8a]/30 hover:bg-blue-50/30'
            }`}
        >
          <div className={`text-sm font-black ${isToday ? 'text-white' : 'text-[#0a192f]'}`}>
            {day}
          </div>
          {totalDia.length > 0 && (
            <div className="space-y-1 mt-1">
              {totalDia.slice(0, 2).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-1.5 py-1 rounded-lg shadow-sm border border-blue-100"
                >
                  {'colaborador' in item ? (
                    <Cake className="h-3 w-3 text-[#1e3a8a] flex-shrink-0" />
                  ) : (
                    <CalendarEventIcon className="h-3 w-3 text-green-600 flex-shrink-0" />
                  )}
                  <span className="text-[9px] font-bold text-gray-700 truncate w-full leading-tight">
                    {'colaborador' in item ? formatName(item.colaborador.name) : item.titulo}
                  </span>
                </div>
              ))}
              {totalDia.length > 2 && (
                <div className="text-[8px] font-black text-[#1e3a8a] text-center bg-white/80 rounded px-1">
                  +{totalDia.length - 2}
                </div>
              )}
            </div>
          )}
        </div>
      )
    }

    return days
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

  const aniversariosHoje = getAniversariosHoje()
  const aniversariosEsteMes = getAniversariosEsteMes()

  // Agrupamento de eventos para a lista lateral


  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">

      {/* PAGE HEADER COMPLETO - Título + User Info */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <CalendarIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Calendário
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Acompanhe os aniversários dos collaborators, reuniões e eventos
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => { setEditingEvento(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#15803d] to-green-700 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95 hover:from-green-700 hover:to-[#15803d]"
          >
            <Plus className="h-4 w-4" />
            Novo Evento
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6 w-full">

        {/* TOOLBAR & STATS */}
        <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max hover:shadow-md transition-all">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#d4af37] to-amber-600 shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Aniver. Hoje</p>
                <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">{aniversariosHoje.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max hover:shadow-md transition-all">
              <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg">
                <PartyPopper className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Aniver. Mês</p>
                <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">{aniversariosEsteMes.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max hover:shadow-md transition-all">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg">
                <CalendarEventIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Eventos Mês</p>
                <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">{eventosDoMes(selectedMonth, selectedYear).length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max hover:shadow-md transition-all">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Total Colab.</p>
                <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">{collaborators.length}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full xl:w-auto justify-end">
            {/* Novo Evento moved to header */}

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('calendario')}
                className={`px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-sm ${viewMode === 'calendario'
                  ? 'bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
              >
                Calendário
              </button>
              <button
                onClick={() => setViewMode('proximos')}
                className={`px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-sm ${viewMode === 'proximos'
                  ? 'bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
              >
                Lista
              </button>
            </div>
          </div>
        </div>

        {/* ANIVERSÁRIOS DE HOJE */}
        {aniversariosHoje.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 rounded-2xl shadow-xl border-2 border-[#d4af37]/30 p-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#d4af37]/20">
              <div className="p-3 bg-gradient-to-br from-[#d4af37] to-amber-600 rounded-xl shadow-lg">
                <Cake className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight flex items-center gap-2">
                  🎉 Aniversariantes de Hoje!
                </h2>
                <p className="text-xs font-semibold text-gray-600">Não esqueça de parabenizar</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aniversariosHoje.map((aniv) => (
                <div
                  key={aniv.colaborador.id}
                  className="bg-white rounded-xl p-5 shadow-lg border-2 border-[#d4af37]/50 hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-[#d4af37]"
                >
                  <div className="flex items-center gap-3">
                    {aniv.colaborador.photo_url ? (
                      <img
                        src={aniv.colaborador.photo_url}
                        alt={aniv.colaborador.name}
                        className="w-16 h-16 rounded-xl object-cover border-4 border-[#d4af37] shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#d4af37] to-amber-600 flex items-center justify-center text-white text-2xl font-black border-4 border-[#d4af37]/30 shadow-lg">
                        {aniv.colaborador.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-black text-[#0a192f]">{formatName(aniv.colaborador.name)}</p>
                      <p className="text-xs font-semibold text-gray-600">{toTitleCase(aniv.colaborador.role)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONTEÚDO PRINCIPAL */}
        {viewMode === 'calendario' ? (
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
                {renderCalendar()}
              </div>
            </div>

            {/* Lista Lateral - Separada por Tipo */}
            <div className="flex flex-col gap-6 h-full">
              {/* Seção Aniversariantes */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col flex-1 max-h-[50%]">
                <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider mb-4 flex items-center gap-2 sticky top-0 bg-white z-10 pb-2 border-b border-gray-100">
                  <Cake className="h-4 w-4 text-[#d4af37]" /> Aniversariantes ({aniversariosDoMes(selectedMonth, selectedYear).length})
                </h3>
                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {aniversariosDoMes(selectedMonth, selectedYear).sort((a, b) => a.dia - b.dia).map((aniv, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100 hover:border-[#d4af37]/30 transition-all hover:shadow-sm">
                      <div className="flex flex-col items-center justify-center w-10 h-10 bg-white rounded-lg border border-gray-200 shadow-sm shrink-0">
                        <span className="text-[8px] font-black uppercase text-gray-400">{MESES[aniv.mes].substring(0, 3)}</span>
                        <span className="text-sm font-black text-[#0a192f]">{aniv.dia}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-[#0a192f] truncate">{formatName(aniv.colaborador.name)}</p>
                        <p className="text-[10px] text-gray-500 truncate">{toTitleCase(aniv.colaborador.role)}</p>
                      </div>
                      {aniv.isHoje && (
                        <div className="h-2 w-2 rounded-full bg-[#d4af37] animate-pulse" title="Hoje!" />
                      )}
                    </div>
                  ))}
                  {aniversariosDoMes(selectedMonth, selectedYear).length === 0 && (
                    <div className="text-center py-4 text-xs text-gray-400 font-medium italic">
                      Nenhum aniversariante este mês
                    </div>
                  )}
                </div>
              </div>

              {/* Seção Eventos */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col flex-1 max-h-[50%]">
                <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider mb-4 flex items-center gap-2 sticky top-0 bg-white z-10 pb-2 border-b border-gray-100">
                  <CalendarEventIcon className="h-4 w-4 text-[#1e3a8a]" /> Eventos ({eventosDoMes(selectedMonth, selectedYear).length})
                </h3>
                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {eventosDoMes(selectedMonth, selectedYear).sort((a, b) => new Date(a.data_evento).getDate() - new Date(b.data_evento).getDate()).map((evento, idx) => (
                    <div key={idx} className="group flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-100 hover:border-[#1e3a8a]/30 transition-all hover:shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex flex-col items-center justify-center w-10 h-10 bg-white rounded-lg border border-gray-200 shadow-sm shrink-0">
                          <span className="text-[8px] font-black uppercase text-gray-400">{MESES[selectedMonth].substring(0, 3)}</span>
                          <span className="text-sm font-black text-[#1e3a8a]">{new Date(evento.data_evento + 'T12:00:00').getDate()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-[#0a192f] truncate">{evento.titulo}</p>
                          <p className="text-[10px] text-gray-500 truncate">{evento.tipo}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(evento)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvento(evento.id)}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {eventosDoMes(selectedMonth, selectedYear).length === 0 && (
                    <div className="text-center py-4 text-xs text-gray-400 font-medium italic">
                      Nenhum evento agendado
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1e3a8a]/10 rounded-xl">
                  <Clock className="h-5 w-5 text-[#1e3a8a]" />
                </div>
                <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">Próximos Aniversários</h2>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterMes ?? ''}
                  onChange={(e) => setFilterMes(e.target.value ? parseInt(e.target.value) : null)}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all"
                >
                  <option value="">Todos os meses</option>
                  {MESES.map((mes, idx) => (
                    <option key={idx} value={idx}>{mes}</option>
                  ))}
                </select>
                {filterMes !== null && (
                  <button
                    onClick={() => setFilterMes(null)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {getProximosAniversarios().map((aniv) => (
                <div
                  key={aniv.colaborador.id}
                  className={`flex items-center justify-between p-5 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${aniv.isHoje
                    ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-[#d4af37]/50'
                    : aniv.isEstaSemana
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-[#1e3a8a]/30'
                      : 'bg-gray-50 border-gray-200 hover:border-[#1e3a8a]/30'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    {aniv.colaborador.photo_url ? (
                      <img
                        src={aniv.colaborador.photo_url}
                        alt={aniv.colaborador.name}
                        className="w-14 h-14 rounded-xl object-cover border-2 border-[#1e3a8a]/30 shadow-md"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white text-xl font-black border-2 border-[#1e3a8a]/30 shadow-md">
                        {aniv.colaborador.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-black text-[#0a192f] text-base">{formatName(aniv.colaborador.name)}</p>
                      <p className="text-xs font-semibold text-gray-600">{toTitleCase(aniv.colaborador.role)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Data</p>
                      <p className="font-bold text-[#0a192f]">
                        {aniv.dia} de {MESES[aniv.mes]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Faltam</p>
                      <p className={`font-black text-lg ${aniv.isHoje ? 'text-[#d4af37]' : aniv.isEstaSemana ? 'text-[#1e3a8a]' : 'text-[#0a192f]'
                        }`}>
                        {aniv.diasRestantes === 0 ? 'Hoje!' : `${aniv.diasRestantes} dias`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL NOVO/EDITAR EVENTO */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 bg-gradient-to-r from-[#112240] to-[#1e3a8a] flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <CalendarDays className="h-5 w-5" />
                  <h3 className="font-black text-base tracking-tight">{editingEvento ? 'Editar Evento' : 'Novo Evento'}</h3>
                </div>
                <button
                  onClick={() => { setIsModalOpen(false); setEditingEvento(null); }}
                  className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Título</label>
                  <input
                    type="text"
                    value={novoEvento.titulo}
                    onChange={(e) => setNovoEvento({ ...novoEvento, titulo: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Tipo</label>
                    <select
                      value={novoEvento.tipo}
                      onChange={(e) => setNovoEvento({ ...novoEvento, tipo: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all bg-white font-medium"
                    >
                      <option value="Reunião">Reunião</option>
                      <option value="Aniversário">Aniversário</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Data</label>
                    <input
                      type="date"
                      value={novoEvento.data}
                      onChange={(e) => setNovoEvento({ ...novoEvento, data: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                    <AlignLeft className="h-3 w-3" /> Descrição <span className="font-normal">(Opcional)</span>
                  </label>
                  <textarea
                    value={novoEvento.descricao}
                    onChange={(e) => setNovoEvento({ ...novoEvento, descricao: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all resize-none font-medium"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => { setIsModalOpen(false); setEditingEvento(null); }}
                  className="px-6 py-2.5 text-[9px] font-black text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-xl transition-all uppercase tracking-[0.2em]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEvento}
                  disabled={savingEvento || !novoEvento.titulo}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white font-black text-[9px] rounded-xl hover:shadow-lg transition-all disabled:opacity-50 shadow-md uppercase tracking-[0.2em] active:scale-95"
                >
                  {savingEvento ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DETALHES DO DIA */}
        {selectedDayEvents && (
          <RHCalendarioDiaModal
            day={selectedDayEvents.day}
            events={selectedDayEvents.events}
            onClose={() => setSelectedDayEvents(null)}
            onEdit={handleEditClick}
            onDelete={handleDeleteEvento}
            formatName={formatName}
          />
        )}

      </div>
    </div>
  )
}