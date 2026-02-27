// src/components/collaborators/pages/Calendario.tsx
import { useState, useEffect, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  Cake,
  Users,
  Sparkles,
  PartyPopper,
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
import { useColaboradores } from '../hooks/useColaboradores'
import { getFeriadosDoAno } from '../utils/holidays'

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

export function Calendario() {
  const { colaboradores } = useColaboradores()
  const [eventos, setEventos] = useState<Evento[]>([])

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
  const selectedMonth = currentDate.getMonth();
  const selectedYear = currentDate.getFullYear();

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

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: evs } = await supabase
      .from('eventos')
      .select('*')
      .order('data_evento')

    const feriados = getFeriadosDoAno(new Date().getFullYear()).map((f: any, idx: number) => ({
      ...f,
      id: -(idx + 1) // IDs negativos para feriados
    })) as Evento[]

    if (evs) {
      setEventos([...feriados, ...evs])
    } else {
      setEventos([...feriados])
    }
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
    // Pegar o 'hoje' resetado para meia noite do timezone local
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

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
    hoje.setHours(0, 0, 0, 0)
    const aniversarios: AniversarioData[] = []

    collaborators.forEach((colab: any) => {
      if (colab.birthday) {
        // Parse da data ISO (ex: "1990-02-27")
        const [anoStr, mesStr, diaStr] = colab.birthday.split('T')[0].split('-')
        const dia = parseInt(diaStr, 10)
        const mes = parseInt(mesStr, 10) - 1 // Mês em JavaScript é zero-based
        const ano = parseInt(anoStr, 10)

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



  const eventosDoMes = (mes: number, ano: number) => {
    return eventos.filter(e => {
      const d = new Date(e.data_evento + 'T12:00:00')
      return d.getMonth() === mes && d.getFullYear() === ano
    })
  }

  const getAniversariosHoje = () => aniversarios.filter(a => a.isHoje)

  const getAniversariosEsteMes = () => aniversarios.filter(a => a.isEsteMes)
  const getProximosAniversarios = () => {
    return aniversarios.slice(0, 20)
  }

  const getProximosEventos = () => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    return eventos
      .map(e => {
        const dataEvento = new Date(e.data_evento + 'T12:00:00')
        dataEvento.setHours(0, 0, 0, 0)
        const diffTime = dataEvento.getTime() - hoje.getTime()
        const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        return {
          ...e,
          dataObjeto: dataEvento,
          diasRestantes,
          isHoje: diasRestantes === 0,
          isEstaSemana: diasRestantes <= 7 && diasRestantes >= 0,
        }
      })
      .filter(e => e.diasRestantes >= 0)
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
      .slice(0, 20)
  }

  const aniversariosHoje = getAniversariosHoje()
  const aniversariosEsteMes = getAniversariosEsteMes()

  const eventosHoje = getProximosEventos().filter(e => e.isHoje)

  // Agrupamento de eventos para a lista lateral


  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6">

      {/* PAGE HEADER COMPLETO - Título + User Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <CalendarIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Calendário
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Acompanhe os aniversários dos collaborators, reuniões e eventos
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto mt-2 sm:mt-0">
          <button
            onClick={() => { setEditingEvento(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-[#15803d] to-green-700 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95 hover:from-green-700 hover:to-[#15803d]"
          >
            <Plus className="h-4 w-4" />
            Novo Evento
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6 w-full">

        {/* TOOLBAR & STATS */}
        <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
          <div className="flex w-full overflow-x-auto pb-2 xl:pb-0 justify-between items-center gap-6">

            {/* ESQUERDA: ANIVERSÁRIOS */}
            <div className="flex gap-4">
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
            </div>

            {/* DIREITA: EVENTOS */}
            <div className="flex gap-4">
              <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max hover:shadow-md transition-all">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg">
                  <CalendarEventIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Eventos Hoje</p>
                  <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">{eventosHoje.length}</p>
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
            </div>

          </div>

          <div className="flex flex-wrap gap-3 w-full xl:w-auto justify-end">
            {/* Novo Evento moved to header */}
          </div>
        </div>

        {/* DESTAQUES DO DIA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* ANIVERSÁRIOS DE HOJE */}
          <div className="lg:col-span-1 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 rounded-2xl shadow-xl border-2 border-[#d4af37]/30 p-6 animate-in fade-in slide-in-from-top-4 duration-500 h-full">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#d4af37]/20">
              <div className="p-3 bg-gradient-to-br from-[#d4af37] to-amber-600 rounded-xl shadow-lg shrink-0">
                <Cake className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight flex items-center gap-2 truncate">
                  🎉 Aniversariantes de Hoje!
                </h2>
                <p className="text-xs font-semibold text-gray-600 truncate">Não esqueça de parabenizar</p>
              </div>
            </div>
            {aniversariosHoje.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
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
                          className="w-16 h-16 rounded-xl object-cover border-4 border-[#d4af37] shadow-lg shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#d4af37] to-amber-600 flex items-center justify-center text-white text-2xl font-black border-4 border-[#d4af37]/30 shadow-lg shrink-0">
                          {aniv.colaborador.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-[#0a192f] truncate">{formatName(aniv.colaborador.name)}</p>
                        <p className="text-xs font-semibold text-gray-600 truncate">{toTitleCase(aniv.colaborador.role)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500 font-medium italic">
                Nenhum aniversariante hoje
              </div>
            )}
          </div>

          {/* EVENTOS DE HOJE */}
          <div className="lg:col-span-2 bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 rounded-2xl shadow-xl border-2 border-emerald-500/30 p-6 animate-in fade-in slide-in-from-top-4 duration-500 h-full">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-emerald-500/20">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg shrink-0">
                <CalendarEventIcon className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight flex items-center gap-2 truncate">
                  📅 Eventos de Hoje!
                </h2>
                <p className="text-xs font-semibold text-gray-600 truncate">Acontecimentos e Feriados de hoje</p>
              </div>
            </div>
            {eventosHoje.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventosHoje.map((evento, idx) => (
                  <div
                    key={evento.id || idx}
                    className="bg-white rounded-xl p-5 shadow-lg border-2 border-emerald-500/50 hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-emerald-500"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-2xl font-black border-4 border-emerald-500/30 shadow-lg shrink-0">
                        {evento.tipo.includes('Feriado') ? <Sparkles className="h-8 w-8" /> : evento.tipo === 'Reunião' ? <Users className="h-8 w-8" /> : evento.tipo === 'Aniversário' ? <PartyPopper className="h-8 w-8" /> : <CalendarEventIcon className="h-8 w-8" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-[#0a192f] leading-tight truncate">{evento.titulo}</p>
                        <p className="text-xs font-semibold text-gray-600 mt-1 truncate">{evento.tipo}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500 font-medium italic">
                Nenhum evento para hoje
              </div>
            )}
          </div>
        </div>

        {/* BLOCOS: ANIVERSARIANTES | EVENTOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 w-full">
          {/* BLOCO ANIVERSARIANTES */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col max-h-[600px] w-full">
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#d4af37]/10 rounded-xl">
                  <Cake className="h-5 w-5 text-[#d4af37]" />
                </div>
                <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">Próximos Aniversários</h2>
              </div>
            </div>

            <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1">
              {getProximosAniversarios().map((aniv) => (
                <div
                  key={aniv.colaborador.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:shadow-lg ${aniv.isHoje
                    ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-[#d4af37]/50'
                    : aniv.isEstaSemana
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-[#1e3a8a]/30'
                      : 'bg-gray-50 border-gray-200 hover:border-[#1e3a8a]/30'
                    }`}
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    {aniv.colaborador.photo_url ? (
                      <img
                        src={aniv.colaborador.photo_url}
                        alt={aniv.colaborador.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-[#1e3a8a]/30 shadow-md shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4af37] to-amber-600 flex items-center justify-center text-white text-lg font-black border-2 border-[#d4af37]/30 shadow-md shrink-0">
                        {aniv.colaborador.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-black text-[#0a192f] text-sm truncate">{formatName(aniv.colaborador.name)}</p>
                      <p className="text-[10px] font-semibold text-gray-600 truncate max-w-[120px] md:max-w-[200px]">{toTitleCase(aniv.colaborador.role)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-l border-gray-200/50 pl-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-[8px] text-gray-400 uppercase font-black tracking-[0.2em] mb-0.5">Data</p>
                      <p className="font-bold text-[#0a192f] text-xs">
                        {aniv.dia} {MESES[aniv.mes].substring(0, 3)}
                      </p>
                    </div>
                    <div className="text-right w-12 sm:w-16">
                      <p className="text-[8px] text-gray-400 uppercase font-black tracking-[0.2em] mb-0.5">Faltam</p>
                      <p className={`font-black text-sm ${aniv.isHoje ? 'text-[#d4af37]' : aniv.isEstaSemana ? 'text-[#1e3a8a]' : 'text-[#0a192f]'
                        }`}>
                        {aniv.diasRestantes === 0 ? 'Hoje!' : `${aniv.diasRestantes}d`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BLOCO EVENTOS */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col max-h-[600px] w-full">
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1e3a8a]/10 rounded-xl">
                  <CalendarEventIcon className="h-5 w-5 text-[#1e3a8a]" />
                </div>
                <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">Próximos Eventos</h2>
              </div>
            </div>

            <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1">
              {getProximosEventos().length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400 font-medium italic">
                  Nenhum evento agendado
                </div>
              ) : getProximosEventos().map((evento, idx) => (
                <div
                  key={idx}
                  className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:shadow-lg ${evento.isHoje
                    ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-500/50'
                    : evento.isEstaSemana
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-[#1e3a8a]/30'
                      : 'bg-gray-50 border-gray-200 hover:border-[#1e3a8a]/30'
                    }`}
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-black border-2 shadow-md shrink-0 ${evento.isHoje ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-500/30' : evento.tipo === 'Aniversário' ? 'bg-gradient-to-br from-[#d4af37] to-amber-600 border-[#d4af37]/30' : 'bg-gradient-to-br from-[#1e3a8a] to-[#112240] border-[#1e3a8a]/30'}`}>
                      {evento.tipo === 'Reunião' ? <Users className="h-5 w-5" /> : evento.tipo === 'Aniversário' ? <PartyPopper className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-[#0a192f] text-sm truncate">{evento.titulo}</p>
                      <p className="text-[10px] font-semibold text-gray-600 truncate">{evento.tipo}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-l border-gray-200/50 pl-4 shrink-0">
                    <div className="text-right hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(evento)}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvento(evento.id)}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[8px] text-gray-400 uppercase font-black tracking-[0.2em] mb-0.5">Data</p>
                      <p className="font-bold text-[#0a192f] text-xs">
                        {evento.dataObjeto.getDate()} {MESES[evento.dataObjeto.getMonth()].substring(0, 3)}
                      </p>
                    </div>
                    <div className="text-right w-12 sm:w-16">
                      <p className="text-[8px] text-gray-400 uppercase font-black tracking-[0.2em] mb-0.5">Faltam</p>
                      <p className={`font-black text-sm ${evento.isHoje ? 'text-emerald-600' : evento.isEstaSemana ? 'text-[#1e3a8a]' : 'text-[#0a192f]'
                        }`}>
                        {evento.diasRestantes === 0 ? 'Hoje!' : `${evento.diasRestantes}d`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

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

      </div>
    </div>
  )
}