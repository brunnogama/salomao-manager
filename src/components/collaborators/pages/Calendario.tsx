// src/components/collaborators/pages/Calendario.tsx
import React, { useState, useEffect, useMemo } from 'react'
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
  Trash2,
  ChevronLeft, ChevronRight,
  Briefcase
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useColaboradores } from '../hooks/useColaboradores'
import { getFeriadosDoAno } from '../utils/holidays'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { SocioSelector } from '../../crm/SocioSelector'
import { EventSelectionModal, EventCreationType } from '../components/EventSelectionModal'
import { toast } from 'sonner'

interface Colaborador {
  id: string | number;
  name: string; // Atualizado de nome
  birthday: string; // Atualizado de data_nascimento
  role: string; // Atualizado de cargo
  photo_url?: string;
  hire_date?: string;
  location?: string;
  leader?: string;
}

interface Evento {
  id: number;
  titulo: string;
  tipo: string;
  data_evento: string;
  descricao?: string;
  hora?: string;
  local_tipo?: 'Online' | 'Presencial';
  local_endereco_url?: string;
  participantes_internos?: string[]; // IDs or names
  participantes_externos?: { nome: string; email: string }[];
  participantes_socios?: string[];
  vaga_id?: string;
  participantes_candidatos?: string[];
  entrevistador_id?: string;
}

interface NovoEventoData {
  titulo: string;
  data: string;
  tipo: string;
  descricao: string;
  hora: string;
  local_tipo: 'Online' | 'Presencial';
  local_endereco_url: string;
  participantes_internos: string[];
  participantes_externos: { nome: string; email: string }[];
  participantes_socios: string[];
  vaga_id?: string;
  participantes_candidatos: string[];
  entrevistador_id?: string;
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
  const [vagas, setVagas] = useState<any[]>([])
  const [candidatos, setCandidatos] = useState<any[]>([])

  const collaborators = useMemo(() => {
    return colaboradores
      .filter((c: any) => c.status === 'active' && c.birthday && c.birthday.trim() !== '')
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        birthday: c.birthday,
        role: c.roles?.name || c.role || '',
        photo_url: c.photo_url || c.foto_url,
        hire_date: c.hire_date,
        location: c.locations?.name || c.local || '',
        leader: c.leader?.name || ''
      }))
  }, [colaboradores])
  // Estado para a navegação do calendário da visão mensal (lateral)
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  const selectedMonth = calendarViewDate.getMonth();
  const selectedYear = calendarViewDate.getFullYear();

  // Selected date para filtrar eventos (opcional)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Navegar meses
  const prevMonth = () => {
    setCalendarViewDate(new Date(selectedYear, selectedMonth - 1, 1));
  };
  const nextMonth = () => {
    setCalendarViewDate(new Date(selectedYear, selectedMonth + 1, 1));
  };
  const handleDayClick = (dayDate: Date) => {
    // If same day is clicked, deselect it
    if (selectedDay && dayDate.toDateString() === selectedDay.toDateString()) {
      setSelectedDay(null);
    } else {
      setSelectedDay(dayDate);
    }
  };

  // Gerar grid do calendário
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
  // Dias do mês anterior para preencher a primeira semana
  const prevMonthDays = new Date(selectedYear, selectedMonth, 0).getDate();
  const getCalendarDays = () => {
    const dates = [];
    // Dias do mês anterior
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      dates.push({ day: prevMonthDays - i, isCurrentMonth: false, date: new Date(selectedYear, selectedMonth - 1, prevMonthDays - i) });
    }
    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push({ day: i, isCurrentMonth: true, date: new Date(selectedYear, selectedMonth, i) });
    }
    // Dias do próximo mês para completar a grade em múltiplas de 7
    const remainingCells = 42 - dates.length; // 6 rows de 7 days = 42
    for (let i = 1; i <= remainingCells; i++) {
      dates.push({ day: i, isCurrentMonth: false, date: new Date(selectedYear, selectedMonth + 1, i) });
    }
    return dates;
  };
  const calendarGrid = useMemo(() => getCalendarDays(), [selectedMonth, selectedYear]);

  // Função auxiliar para obter as cores dos eventos do dia
  const getDayEventColors = (dayDate: Date, allEvts: any[]) => {
    const timestampStr = dayDate.toDateString();
    const dayEvents = allEvts.filter(e => {
      if (!e.dataObjeto) return false;
      return e.dataObjeto.toDateString() === timestampStr;
    });

    if (dayEvents.length === 0) return [];

    const colors = new Set<string>();
    dayEvents.forEach(e => {
      const evento = e as any;
      if (evento.tipo === 'Entrevista') colors.add('bg-purple-500');
      else if (evento.tipo === 'Reunião') colors.add('bg-blue-500');
      else if (evento.tipo === 'Aniversário' || evento._source === 'aniversario') colors.add('bg-amber-500');
      else if (evento.tipo === 'Mochila') colors.add('bg-indigo-500');
      else if (evento.tipo === 'Feriado') colors.add('bg-red-500');
      else colors.add('bg-gray-500');
    });

    return Array.from(colors);
  };

  // Estados para Modal de Visualização Rápida
  const [visualizarColaborador, setVisualizarColaborador] = useState<Colaborador | null>(null);
  const [visualizarEvento, setVisualizarEvento] = useState<Evento | null>(null);

  // Estados para o Modal de Evento
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [savingEvento, setSavingEvento] = useState(false)
  const [editingEvento, setEditingEvento] = useState<number | null>(null) // Changed to number for event ID
  // Estados locais para inputs do Modal
  const [currentSocio, setCurrentSocio] = useState('')
  const [currentCandidato, setCurrentCandidato] = useState('')
  const [currentExtName, setCurrentExtName] = useState('')
  const [currentExtEmail, setCurrentExtEmail] = useState('')

  const [novoEvento, setNovoEvento] = useState<NovoEventoData>({
    titulo: '',
    data: new Date().toISOString().split('T')[0],
    tipo: 'Reunião',
    descricao: '',
    hora: '',
    local_tipo: 'Online',
    local_endereco_url: '',
    participantes_internos: [],
    participantes_externos: [],
    participantes_socios: [],
    participantes_candidatos: [],
    vaga_id: '',
    entrevistador_id: ''
  })

  // Estado para o Modal de Seleção de Tipo de Evento
  const [isEventSelectionModalOpen, setIsEventSelectionModalOpen] = useState(false)

  const handleOpenNewEvent = (tipo: EventCreationType) => {
    setIsEventSelectionModalOpen(false)
    setEditingEvento(null)
    setCurrentCandidato('') // Limpar seleção de candidato
    setNovoEvento({
      titulo: '',
      data: new Date().toISOString().split('T')[0],
      tipo: tipo,
      descricao: '',
      hora: '',
      local_tipo: 'Online',
      local_endereco_url: '',
      participantes_internos: [],
      participantes_externos: [],
      participantes_socios: [],
      participantes_candidatos: [],
      vaga_id: '',
      entrevistador_id: ''
    })
    setIsModalOpen(true)
  }

  // Estado para Tabs
  const [activeTab, setActiveTab] = useState('Geral')

  // Atualizar Titulo e Endereço se for Entrevista
  useEffect(() => {
    if (novoEvento.tipo === 'Entrevista') {
      const vagaSelecionada = vagas.find(v => String(v.id) === String(novoEvento.vaga_id));
      const vagaNome = vagaSelecionada && vagaSelecionada.role ? vagaSelecionada.role.name : 'Vaga';

      // Consider both already added candidates and the currently selected one in the dropdown
      const allCandidateIds = [...novoEvento.participantes_candidatos];
      if (currentCandidato && !allCandidateIds.includes(currentCandidato)) {
        allCandidateIds.push(currentCandidato);
      }

      const candidatosNomes = allCandidateIds.map(id => {
        const c = candidatos.find(cand => String(cand.id) === String(id));
        return c ? formatName(c.nome) : '';
      }).filter(Boolean).join(', ');

      const candidatoDisplay = candidatosNomes || 'Candidato';
      const novoTitulo = `Entrevista - ${vagaNome} - ${candidatoDisplay}`;

      setNovoEvento(prev => {
        const updates: Partial<NovoEventoData> = {};
        if (prev.titulo !== novoTitulo) updates.titulo = novoTitulo;

        // Define endereço inicial como Sala de Reunião 01 se não estiver preenchido com sala
        if (prev.local_tipo === 'Presencial' && (!prev.local_endereco_url || !prev.local_endereco_url.startsWith('Sala de Reunião'))) {
          updates.local_endereco_url = 'Sala de Reunião 01';
        }

        return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
      });
    }
  }, [novoEvento.tipo, novoEvento.vaga_id, novoEvento.participantes_candidatos, currentCandidato, vagas, candidatos]);

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: evs } = await supabase
      .from('eventos') // Changed from 'eventos' to 'events'
      .select('*')
      .order('data_evento') // Changed from 'data_evento' to 'event_date'

    const feriados = getFeriadosDoAno(new Date().getFullYear()).map((f: any, idx: number) => ({
      ...f,
      id: -(idx + 1) // IDs negativos para feriados
    })) as Evento[]

    if (evs) {
      // Map to add required fields
      const mappedEvs = (evs || []).map((e: any) => {
        // Separa data e hora se disponível
        const [datePart, timePart] = e.data_evento ? e.data_evento.split('T') : ['', ''];
        const hora = timePart ? timePart.substring(0, 5) : '';

        return ({
          id: e.id,
          titulo: e.titulo,
          tipo: e.tipo,
          data_evento: datePart, // Extract Date from timestamptz
          descricao: e.descricao,
          hora: hora, // Extract Time from timestamptz ou usa ''
          local_tipo: undefined, // Mocked as not in DB
          local_endereco_url: e.local_endereco_url || '',
          participantes_internos: [], // Mocked as not in DB
          participantes_externos: [], // Mocked as not in DB
          participantes_socios: [], // Mocked as not in DB
          vaga_id: e.vaga_id,
          entrevistador_id: e.entrevistador_id,
          participantes_candidatos: e.participantes_candidatos || []
        });
      }) as Evento[];

      const entrevistas = mappedEvs.filter(e => e.tipo === 'Entrevista' && e.participantes_candidatos && e.participantes_candidatos.length > 0);
      entrevistas.forEach(ev => {
        (ev.participantes_candidatos || []).forEach(candId => {
          supabase.from('candidato_historico')
            .select('id')
            .eq('candidato_id', candId)
            .eq('tipo', 'Entrevista')
            .eq('entrevista_data', ev.data_evento)
            .then(({ data }) => {
              if (!data || data.length === 0) {
                supabase.from('candidato_historico').insert({
                  candidato_id: candId,
                  tipo: 'Entrevista',
                  descricao: `Entrevista agendada: ${ev.titulo}`,
                  data_registro: new Date().toISOString(),
                  entrevista_data: ev.data_evento,
                  entrevista_hora: ev.hora || null,
                  compareceu: null
                }).then(({ error }) => {
                  if (!error) console.log('✅ Histórico retroativo sincronizado para candidato:', candId);
                });
              }
            });
        });
      });
      // --- Fim Sync Automático ---

      setEventos([...feriados, ...mappedEvs])
    } else {
      setEventos([...feriados])
    }

    // Fetch Vagas
    const { data: vagasData, error: vagasError } = await supabase
      .from('vagas')
      .select('id, status, vaga_id_text, role:role_id(name), leader:leader_id(name)')
      .in('status', ['Aberta', 'Congelada', 'Aguardando Autorização']);

    if (vagasError) console.error('Erro ao buscar vagas do calendário:', vagasError);
    if (vagasData) setVagas(vagasData);

    // Fetch Candidatos
    const { data: candData } = await supabase
      .from('candidatos')
      .select('id, nome, email')
      .order('nome');
    if (candData) setCandidatos(candData);
  }

  const handleSaveEvento = async () => {
    if (!novoEvento.titulo || !novoEvento.data) return

    setSavingEvento(true)
    try {
      // Combine date and time for the timestamptz column
      const combinedDateTime = novoEvento.hora
        ? `${novoEvento.data}T${novoEvento.hora}:00`
        : `${novoEvento.data}T00:00:00`;

      if (editingEvento) {
        // Atualiza evento existente
        const { error } = await supabase
          .from('eventos')
          .update({
            titulo: novoEvento.titulo,
            data_evento: combinedDateTime,
            tipo: novoEvento.tipo,
            descricao: novoEvento.descricao,
            vaga_id: novoEvento.vaga_id || null,
            participantes_candidatos: novoEvento.participantes_candidatos || [],
            entrevistador_id: novoEvento.entrevistador_id || null
          })
          .eq('id', editingEvento)

        if (error) throw error
      } else {
        // Cria novo evento
        const { error } = await supabase
          .from('eventos')
          .insert([{
            titulo: novoEvento.titulo,
            data_evento: combinedDateTime,
            tipo: novoEvento.tipo,
            descricao: novoEvento.descricao,
            vaga_id: novoEvento.vaga_id || null,
            participantes_candidatos: novoEvento.participantes_candidatos || [],
            entrevistador_id: novoEvento.entrevistador_id || null
          }])

        if (error) throw error
      }

      // Se for Entrevista e houver candidatos, adicionar histórico se for criação
      if (novoEvento.tipo === 'Entrevista' && novoEvento.participantes_candidatos && novoEvento.participantes_candidatos.length > 0) {
        // Se for edição, idealmente verificaríamos se já existe para não duplicar, mas a pedido, criamos ao salvar
        // Para evitar duplicações massivas na edição, por hora faremos a inserção. Um sync avançado seria melhor.
        const historicos = novoEvento.participantes_candidatos.map(candId => ({
          candidato_id: candId,
          tipo: 'Entrevista',
          descricao: `Entrevista agendada: ${novoEvento.titulo}`,
          data_registro: new Date().toISOString(),
          entrevista_data: novoEvento.data,
          entrevista_hora: novoEvento.hora || null,
          compareceu: null // Pendente
        }));

        const { error: histError } = await supabase.from('candidato_historico').insert(historicos);
        if (histError) console.error('Erro ao salvar histórico do candidato:', histError);
      }

      await fetchData()
      setIsModalOpen(false)
      setEditingEvento(null)
      setNovoEvento({ titulo: '', data: new Date().toISOString().split('T')[0], tipo: 'Reunião', descricao: '', hora: '', local_tipo: 'Online', local_endereco_url: '', participantes_internos: [], participantes_externos: [], participantes_socios: [], participantes_candidatos: [], vaga_id: '', entrevistador_id: '' })
      setCurrentExtName('')
      setCurrentExtEmail('')
      setCurrentSocio('')
      toast.success(editingEvento ? 'Evento atualizado!' : 'Evento criado!')
    } catch (error) {
      console.error('Erro ao salvar evento:', error)
      toast.error('Erro ao salvar evento.')
    } finally {
      setSavingEvento(false)
    }
  }

  const handleDeleteEvento = async (id: number) => {
    if (!confirm('Deseja realmente excluir este evento?')) return
    try {
      const { error } = await supabase.from('eventos').delete().eq('id', id) // Changed back to 'eventos'
      if (error) throw error
      await fetchData()
    } catch (error) {
      toast.error('Erro ao excluir evento')
    }
  }

  const handleEditClick = (evento: Evento) => { // Changed type to Evento
    setEditingEvento(evento.id) // Store only the ID
    setNovoEvento({
      titulo: evento.titulo,
      data: evento.data_evento,
      tipo: evento.tipo,
      descricao: evento.descricao || '',
      hora: evento.hora || '',
      local_tipo: evento.local_tipo || 'Online',
      local_endereco_url: evento.local_endereco_url || '',
      participantes_internos: evento.participantes_internos || [],
      participantes_externos: evento.participantes_externos || [],
      participantes_socios: evento.participantes_socios || [],
      participantes_candidatos: evento.participantes_candidatos || [],
      vaga_id: evento.vaga_id || '',
      entrevistador_id: evento.entrevistador_id || ''
    })
    setCurrentExtName('')
    setCurrentExtEmail('')
    setCurrentSocio('')
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

    return toTitleCase(`${parts[0]} ${parts[parts.length - 1]} `)
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

    const baseEventos = eventos
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

    const mochilaEventos: any[] = []
    collaborators.forEach(c => {
      if (c.hire_date) {
        let year, month, day;
        if (c.hire_date.includes('/')) {
          [day, month, year] = c.hire_date.split('/');
        } else {
          [year, month, day] = c.hire_date.split('T')[0].split('-');
        }

        if (year && month && day) {
          const dateAdmissao = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          dateAdmissao.setMonth(dateAdmissao.getMonth() + 3);
          dateAdmissao.setHours(0, 0, 0, 0);

          const diffTime = dateAdmissao.getTime() - hoje.getTime();
          const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diasRestantes >= 0) {
            mochilaEventos.push({
              id: `mochila - ${c.id} `,
              titulo: `${formatName(c.name)} completa 3 meses de casa`,
              tipo: 'Mochila',
              dataObjeto: dateAdmissao,
              diasRestantes,
              isHoje: diasRestantes === 0,
              isEstaSemana: diasRestantes <= 7 && diasRestantes >= 0,
              colaboradorRef: c
            });
          }
        }
      }
    });

    return [...baseEventos, ...mochilaEventos]
      .filter(e => e.diasRestantes >= 0)
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
      .slice(0, 20)
  }

  const aniversariosHoje = getAniversariosHoje()
  const aniversariosEsteMes = getAniversariosEsteMes()

  const eventosHoje = getProximosEventos().filter(e => e.isHoje)

  // PREPARAÇÃO DOS DADOS PARA A LISTA
  let itemsToShow: any[] = [];
  const todosAniversarios = getProximosAniversarios().map(a => ({
    ...a,
    _source: 'aniversario',
    sortValue: a.diasRestantes,
    dataSort: new Date(new Date().getFullYear(), a.mes, a.dia).getTime()
  }));
  const todosEventos = getProximosEventos().map(e => ({
    ...e,
    _source: 'evento',
    sortValue: e.diasRestantes,
    dataSort: e.dataObjeto.getTime()
  }));

  if (activeTab === 'Geral') {
    itemsToShow = [...todosAniversarios, ...todosEventos].sort((a, b) => a.sortValue - b.sortValue);
  } else if (activeTab === 'Feriados') {
    itemsToShow = todosEventos.filter(e => e.tipo === 'Feriado');
  } else if (activeTab === 'Entrevistas') {
    itemsToShow = eventos
      .filter(e => e.tipo === 'Entrevista')
      .map(e => ({ ...e, _source: 'evento', dataObjeto: new Date(e.data_evento + 'T12:00:00') }))
      .sort((a, b) => b.dataObjeto.getTime() - a.dataObjeto.getTime());
  } else {
    itemsToShow = todosEventos.filter(e => e.tipo === activeTab);
  }

  // Filtrar pelo dia selecionado do calendário esquerdo, se houver
  if (selectedDay) {
    itemsToShow = itemsToShow.filter(item => {
      const itemDate = item._source === 'aniversario'
        ? new Date(new Date().getFullYear(), item.mes, item.dia)
        : item.dataObjeto;
      return itemDate.toDateString() === selectedDay.toDateString();
    });
  }

  // Agrupar os itens a serem exibidos por data (timestamp meia-noite)
  const groupedEvents = itemsToShow.reduce((acc, item) => {
    const d = item._source === 'aniversario'
      ? new Date(new Date().getFullYear(), item.mes, item.dia)
      : item.dataObjeto;

    // Normalize time to midnight
    const dateKey = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<number, any[]>);

  // Sort dates (keys) em ordem decrescente para entrevistas, caso contrário crescente
  const sortedDates = Object.keys(groupedEvents).map(Number).sort((a, b) => activeTab === 'Entrevistas' ? b - a : a - b);

  // Helper de eventos totais para passar aos pontinhos do calendário
  const allMixedEvents = [...todosAniversarios, ...eventos.map(e => ({ ...e, _source: 'evento', dataObjeto: new Date(e.data_evento + 'T12:00:00') }))];

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6">

      {/* ROW DE CABEÇALHO COM ABAS INTEGRADAS (No padrão Colaboradores) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <CalendarIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Agenda
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Acompanhe os aniversários, reuniões e eventos
            </p>
          </div>
        </div>

        {/* Right: Actions and Tabs */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 shrink-0 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto justify-end mt-2 md:mt-0 custom-scrollbar">

          {/* ABAS */}
          <div className="flex items-center bg-gray-100/80 p-1 rounded-xl shrink-0 gap-1 overflow-x-auto">
            {['Geral', 'Entrevistas', 'Reuniões', 'Eventos', 'Feriados', 'Outros'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap min-w-max ${activeTab === tab
                  ? 'bg-white text-[#1e3a8a] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* DIVISOR E AÇÕES */}
          <div className="flex items-center gap-4 md:border-l md:border-gray-200 md:pl-4 md:ml-2">
            <button
              onClick={() => setIsEventSelectionModalOpen(true)}
              className="flex items-center justify-center p-2.5 bg-[#1e3a8a] text-white rounded-lg hover:bg-blue-800 transition-all shadow-md shrink-0 focus:ring-2 focus:ring-[#1e3a8a] focus:ring-offset-2"
              title="Novo Compromisso"
            >
              <Plus className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
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
                  <Sparkles className="h-5 w-5 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Aniver. Hoje</p>
                  <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">{aniversariosHoje.length}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max hover:shadow-md transition-all">
                <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg">
                  <PartyPopper className="h-5 w-5 text-white" strokeWidth={1.5} />
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
                  <CalendarEventIcon className="h-5 w-5 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Eventos Hoje</p>
                  <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">{eventosHoje.length}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max hover:shadow-md transition-all">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg">
                  <CalendarEventIcon className="h-5 w-5 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Eventos Mês</p>
                  <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">{eventosDoMes(selectedMonth, selectedYear).length}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* TABS NAVIGATION */}
        {/* <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100 overflow-x-auto custom-scrollbar">
          {['Geral', 'Entrevistas', 'Reuniões', 'Eventos', 'Feriados', 'Outros'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap min-w-max ${activeTab === tab
                ? 'bg-gradient-to-br from-[#1e3a8a] to-[#112240] text-white shadow-md'
                : 'text-gray-500 hover:text-[#1e3a8a] hover:bg-blue-50/50'
                }`}
            >
              {tab}
            </button>
          ))}
        </div> */}
      </div>

      {/* CONTEÚDO PRINCIPAL (Grid de 2 colunas: Calendário e Listagem) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 w-full">
        {/* COLUNA ESQUERDA: CALENDÁRIO */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col w-full overflow-hidden h-fit">
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-[18px] font-black text-[#0a192f] capitalize">
              {MESES[selectedMonth]} {selectedYear}
            </h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-200 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-200 rounded-lg transition-colors"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, idx) => (
                <div key={idx} className="text-[10px] font-black text-gray-400 uppercase">{dia}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarGrid.map((dt, idx) => {
                const dayEventColors = getDayEventColors(dt.date, allMixedEvents);
                const isSelected = selectedDay && dt.date.toDateString() === selectedDay.toDateString();
                const isToday = dt.date.toDateString() === new Date().toDateString();
                return (
                  <button
                    key={idx}
                    onClick={() => handleDayClick(dt.date)}
                    className={`relative p-2 flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all group
                      ${!dt.isCurrentMonth ? 'text-gray-300 hover:text-gray-500' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
                      ${isSelected ? 'bg-[#1e3a8a] text-white hover:bg-[#112240] hover:text-white' : ''}
                      ${isToday && !isSelected ? 'border border-[#1e3a8a] text-[#1e3a8a]' : ''}
                    `}
                  >
                    <span>{dt.day}</span>
                    {dayEventColors.length > 0 && (
                      <div className="flex gap-0.5 mt-1 absolute bottom-1">
                        {dayEventColors.slice(0, 3).map((color, colorIdx) => (
                          <div key={colorIdx} className={`w-1.5 h-1.5 rounded-full ${isSelected && color !== 'bg-white' ? color : color}`} />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            {selectedDay && (
              <button
                onClick={() => setSelectedDay(null)}
                className="w-full mt-4 py-2 text-xs font-bold text-gray-500 hover:text-[#1e3a8a] transition-colors uppercase tracking-widest text-center"
              >
                Limpar Seleção
              </button>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: LISTA DE COMPROMISSOS */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col w-full overflow-hidden h-fit mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#1e3a8a]/10 rounded-xl">
                <CalendarDays className="h-5 w-5 text-[#1e3a8a]" strokeWidth={1.5} />
              </div>
              <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">
                {activeTab === 'Geral' ? 'Todos os Compromissos' : activeTab}
              </h2>
            </div>
            <div className="flex items-center gap-2 mt-4 sm:mt-0 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Mês Anterior">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest px-2 min-w-[100px] text-center">
                {MESES[selectedMonth]} {selectedYear}
              </span>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Próximo Mês">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[800px] custom-scrollbar">
            {sortedDates.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-400 py-12">
                <CalendarDays className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm font-medium italic">Nenhum evento encontrado para esta data/categoria.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {sortedDates.map(dateKey => {
                  const items = groupedEvents[dateKey];
                  const dateObj = new Date(dateKey);
                  return (
                    <div key={dateKey} className="space-y-4">
                      {/* Caleçalho da Data */}
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-black text-[#0a192f] capitalize">
                          {dateObj.getDate()} {MESES[dateObj.getMonth()].substring(0, 3)}
                        </h3>
                        <div className="h-px bg-gray-200 flex-1"></div>
                      </div>

                      {/* Lista de itens deste dia */}
                      <div className="space-y-3 pl-2 sm:pl-4">
                        {items.map((item: any, idx: number) => {
                          const isAniver = item._source === 'aniversario' || item.tipo === 'Aniversário';

                          // Discover if event is past
                          const today = new Date();
                          const eventDate = new Date(dateKey); // dateKey represents the day
                          let isPast = false;

                          if (eventDate.toDateString() !== today.toDateString() && eventDate < today) {
                            isPast = true;
                          } else if (eventDate.toDateString() === today.toDateString()) {
                            if (item.hora) {
                              const [hours, minutes] = item.hora.split(':').map(Number);
                              const eventDateTime = new Date(eventDate);
                              eventDateTime.setHours(hours, minutes, 0, 0);
                              if (eventDateTime < today) {
                                isPast = true;
                              }
                            } else {
                              // Assuming all-day events are past only when the day is fully over (which is covered by the first check)
                              isPast = false;
                            }
                          }

                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                if (item.tipo === 'Mochila' || item._source === 'aniversario') {
                                  setVisualizarColaborador((item.colaboradorRef || item.colaborador) as Colaborador);
                                } else {
                                  setVisualizarEvento(item as Evento);
                                }
                              }}
                              className={`group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md
                                ${isPast ? 'bg-gray-50/50 border-gray-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0' : 'bg-white border-gray-100 hover:bg-gray-50/80 hover:border-gray-200'}
                              `}
                            >
                              <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                <div className={`text-sm font-bold min-w-[70px] ${isPast ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {item.hora ? item.hora : 'Dia Todo'}
                                </div>
                                <div className="hidden sm:block w-px h-6 bg-gray-200"></div>
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border shrink-0 
                                  ${isPast ? 'bg-gray-100 text-gray-500 border-gray-200' :
                                    item.tipo === 'Entrevista' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                      item.tipo === 'Reunião' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        (item.tipo === 'Aniversário' || item._source === 'aniversario') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                          item.tipo === 'Mochila' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                            item.tipo === 'Feriado' ? 'bg-red-50 text-red-700 border-red-200' :
                                              'bg-gray-100 text-gray-700 border-gray-200'
                                  }`}>
                                  {item.tipo === 'Reunião' ? <Users className="w-3 h-3" /> :
                                    item.tipo === 'Entrevista' ? <Briefcase className="w-3 h-3" /> :
                                      (item.tipo === 'Aniversário' || item._source === 'aniversario') ? <PartyPopper className="w-3 h-3" /> :
                                        item.tipo === 'Feriado' ? <CalendarDays className="w-3 h-3" /> :
                                          <CalendarEventIcon className="w-3 h-3" />}
                                  {item._source === 'aniversario' ? 'Aniversário' : item.tipo}
                                </div>
                                <div className="hidden sm:block w-px h-6 bg-gray-200"></div>
                                <div className="flex items-center gap-3 w-full">
                                  {(item.colaborador?.photo_url || item.colaboradorRef?.photo_url) ? (
                                    <img src={item.colaborador?.photo_url || item.colaboradorRef?.photo_url} className={`w-9 h-9 rounded-full object-cover shadow-sm shrink-0 border border-gray-200 ${isPast ? 'opacity-70' : ''}`} />
                                  ) : isAniver || item.tipo === 'Mochila' ? (
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-black shadow-sm shrink-0 ${isPast ? 'bg-gray-400' : isAniver ? 'bg-gradient-to-br from-[#d4af37] to-amber-600' : 'bg-gradient-to-br from-indigo-500 to-indigo-700'}`}>
                                      {(item.colaborador?.name || item.colaboradorRef?.name || '?').charAt(0).toUpperCase()}
                                    </div>
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shadow-sm shrink-0">
                                      <CalendarDays className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <span className={`font-bold text-sm truncate ${isPast ? 'text-gray-500' : 'text-[#0a192f]'}`}>
                                      {item._source === 'aniversario' ? formatName(item.colaborador.name) : item.titulo}
                                    </span>
                                    {item.descricao && (
                                      <span className={`text-xs font-medium truncate mt-0.5 ${isPast ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {item.descricao}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Ações */}
                              {item._source === 'evento' && item.tipo !== 'Feriado' && item.tipo !== 'Mochila' && (
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-auto pl-4">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleEditClick(item as Evento); }}
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors tooltip ${isPast ? 'text-gray-500 hover:bg-gray-200' : 'text-blue-600 hover:bg-blue-50'}`}
                                    title="Editar"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteEvento(item.id); }}
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors tooltip ${isPast ? 'text-red-400 hover:bg-red-50' : 'text-red-600 hover:bg-red-50'}`}
                                    title="Excluir"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL NOVO/EDITAR EVENTO */}
      {
        isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
              <div className="px-6 py-4 bg-gradient-to-r from-[#112240] to-[#1e3a8a] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-white">
                  <CalendarDays className="h-5 w-5" strokeWidth={1.5} />
                  <h3 className="font-black text-base tracking-tight">{editingEvento ? 'Editar Compromisso' : 'Novo Compromisso'}</h3>
                </div>
                <button
                  onClick={() => { setIsModalOpen(false); setEditingEvento(null); }}
                  className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Título</label>
                  <input
                    type="text"
                    value={novoEvento.titulo}
                    onChange={(e) => setNovoEvento({ ...novoEvento, titulo: e.target.value })}
                    disabled={novoEvento.tipo === 'Entrevista'}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all font-medium disabled:opacity-60 disabled:bg-gray-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Tipo</label>
                    <SearchableSelect
                      options={[
                        { value: 'Reunião', label: 'Reunião' },
                        { value: 'Entrevista', label: 'Entrevista' },
                        { value: 'Aniversário', label: 'Aniversário' },
                        { value: 'Outros', label: 'Outros' }
                      ]}
                      value={novoEvento.tipo}
                      onChange={(val) => setNovoEvento({ ...novoEvento, tipo: val })}
                      placeholder="Selecione o tipo"
                    />
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="col-span-3">
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Data</label>
                      <input
                        type="date"
                        value={novoEvento.data}
                        onChange={(e) => setNovoEvento({ ...novoEvento, data: e.target.value })}
                        className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all font-medium text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 text-truncate truncate">Hora (Opcional)</label>
                      <input
                        type="time"
                        value={novoEvento.hora}
                        onChange={(e) => setNovoEvento({ ...novoEvento, hora: e.target.value })}
                        className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all font-medium text-sm"
                      />
                    </div>
                  </div>
                </div>

                {(novoEvento.tipo === 'Reunião' || novoEvento.tipo === 'Entrevista') && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Formato</label>
                        <SearchableSelect
                          options={[
                            { value: 'Online', label: 'Online' },
                            { value: 'Presencial', label: 'Presencial' }
                          ]}
                          value={novoEvento.local_tipo}
                          onChange={(val) => setNovoEvento({ ...novoEvento, local_tipo: val as 'Online' | 'Presencial' })}
                          placeholder="Selecione o formato"
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            {novoEvento.local_tipo === 'Online' ? 'URL da Reunião' : 'Local'}
                          </label>
                          {novoEvento.tipo === 'Entrevista' && novoEvento.local_tipo === 'Online' && (
                            <button
                              type="button"
                              onClick={() => {
                                // Mock link since MS Graph API isn't fully integrated for meeting creation yet
                                const randomId = Math.random().toString(36).substring(2, 12);
                                const mockLink = `https://teams.microsoft.com/l/meetup-join/19:meeting_${randomId}@thread.v2/0?context={"Tid":"mock"}`;
                                setNovoEvento({ ...novoEvento, local_endereco_url: mockLink });
                                toast.success("Link gerado e preenchido!");
                                toast.info("Nota: Integração corporativa com Microsoft Graph necessária para links reais.");
                              }}
                              className="text-[9px] font-black text-[#1e3a8a] bg-[#1e3a8a]/10 hover:bg-[#1e3a8a]/20 px-2 py-1 rounded transition-colors uppercase tracking-[0.1em]"
                            >
                              Gerar Link Teams
                            </button>
                          )}
                        </div>
                        {novoEvento.tipo === 'Entrevista' && novoEvento.local_tipo === 'Presencial' ? (
                          <SearchableSelect
                            options={['Sala de Reunião 01', 'Sala de Reunião 02', 'Sala de Reunião 03', 'Sala de Reunião 04', 'Sala de Reunião 05'].map(s => ({ id: s, name: s }))}
                            value={novoEvento.local_endereco_url}
                            onChange={(val) => setNovoEvento({ ...novoEvento, local_endereco_url: val })}
                            placeholder="Selecione a Sala..."
                          />
                        ) : (
                          <input
                            type="text"
                            placeholder={novoEvento.local_tipo === 'Online' ? 'https://teams.microsoft.com/...' : 'Rua, Número, Sala...'}
                            value={novoEvento.local_endereco_url}
                            onChange={(e) => setNovoEvento({ ...novoEvento, local_endereco_url: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all font-medium"
                          />
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {novoEvento.tipo === 'Entrevista' && (
                        <>
                          {/* ENTREVISTADOR (Apenas para Entrevista) */}
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                              <Users className="h-3 w-3" /> Entrevistador(a)
                            </label>
                            <SearchableSelect
                              options={[
                                { id: 'Karina Reis dos Prazeres', name: 'Karina Reis dos Prazeres' },
                                { id: 'Tatiana Gonçalves Gomes', name: 'Tatiana Gonçalves Gomes' }
                              ]}
                              value={novoEvento.entrevistador_id || ''}
                              onChange={(val) => setNovoEvento({ ...novoEvento, entrevistador_id: val })}
                              placeholder="Selecione o entrevistador..."
                              uppercase={false}
                            />
                          </div>

                          {/* VAGA (Apenas para Entrevista) */}
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                              <Briefcase className="h-3 w-3" /> Vaga Relacionada
                            </label>
                            <SearchableSelect
                              options={vagas.map(v => {
                                const cargo = v.role?.name || 'Sem Cargo';
                                const lider = v.leader?.name ? ` - ${v.leader.name} ` : '';
                                const vagaId = v.vaga_id_text ? ` - ${v.vaga_id_text} ` : '';
                                return {
                                  id: v.id,
                                  name: `${cargo}${lider}${vagaId}`
                                };
                              })}
                              value={novoEvento.vaga_id || ''}
                              onChange={(val) => setNovoEvento({ ...novoEvento, vaga_id: val })}
                              placeholder="Selecione uma vaga..."
                            />
                          </div>

                          {/* CANDIDATOS (Apenas para Entrevista) */}
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                              <Users className="h-3 w-3" /> Candidato
                            </label>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <SearchableSelect
                                  options={candidatos.map(c => ({ id: c.id, name: c.nome }))}
                                  value={currentCandidato}
                                  onChange={setCurrentCandidato}
                                  placeholder="Selecione um candidato..."
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (currentCandidato && !novoEvento.participantes_candidatos.includes(currentCandidato)) {
                                    setNovoEvento({ ...novoEvento, participantes_candidatos: [...novoEvento.participantes_candidatos, currentCandidato] })
                                    setCurrentCandidato('')
                                  }
                                }}
                                className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors border border-gray-200 flex items-center justify-center"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>
                            {novoEvento.participantes_candidatos.length > 0 && (
                              <div className="flex gap-2 flex-wrap mt-2">
                                {novoEvento.participantes_candidatos.map((id) => {
                                  const cand = candidatos.find(c => c.id === id);
                                  if (!cand) return null;
                                  return (
                                    <div key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-xs font-semibold">
                                      {formatName(cand.nome)}
                                      <button onClick={() => setNovoEvento({ ...novoEvento, participantes_candidatos: novoEvento.participantes_candidatos.filter(i => i !== id) })} className="hover:text-red-500 rounded ml-1"><X className="w-3 h-3" /></button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {novoEvento.tipo !== 'Entrevista' && (
                        <>
                          {/* COLABORADORES */}
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                              <Users className="h-3 w-3" /> Convidados (Colaborador)
                            </label>
                            <SearchableSelect
                              options={collaborators.map(c => ({ value: c.id, label: formatName(c.name) }))}
                              value={''} // Clear after select
                              onChange={(val) => {
                                if (!novoEvento.participantes_internos.includes(val)) {
                                  setNovoEvento({ ...novoEvento, participantes_internos: [...novoEvento.participantes_internos, val] })
                                }
                              }}
                              placeholder="Adicionar colaborador..."
                            />
                            {novoEvento.participantes_internos.length > 0 && (
                              <div className="flex gap-2 flex-wrap mt-2">
                                {novoEvento.participantes_internos.map((id) => {
                                  const colab = collaborators.find(c => c.id === id);
                                  if (!colab) return null;
                                  return (
                                    <div key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-[#1e3a8a]/10 text-[#1e3a8a] border border-[#1e3a8a]/20 rounded-md text-xs font-semibold">
                                      {formatName(colab.name)}
                                      <button onClick={() => setNovoEvento({ ...novoEvento, participantes_internos: novoEvento.participantes_internos.filter(i => i !== id) })} className="hover:text-red-500 rounded ml-1"><X className="w-3 h-3" /></button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* SÓCIOS */}
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                              <Users className="h-3 w-3" /> Convidados (Sócio)
                            </label>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <SocioSelector
                                  value={currentSocio}
                                  onChange={setCurrentSocio}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (currentSocio && !novoEvento.participantes_socios.includes(currentSocio)) {
                                    setNovoEvento({ ...novoEvento, participantes_socios: [...novoEvento.participantes_socios, currentSocio] })
                                    setCurrentSocio('')
                                  }
                                }}
                                className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors border border-gray-200 flex items-center justify-center"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>
                            {novoEvento.participantes_socios.length > 0 && (
                              <div className="flex gap-2 flex-wrap mt-2">
                                {novoEvento.participantes_socios.map((socioName, idx) => (
                                  <div key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 rounded-md text-xs font-semibold">
                                    {socioName}
                                    <button onClick={() => setNovoEvento({ ...novoEvento, participantes_socios: novoEvento.participantes_socios.filter(i => i !== socioName) })} className="hover:text-red-500 rounded ml-1"><X className="w-3 h-3" /></button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* EXTERNOS */}
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                              <Users className="h-3 w-3" /> Convidados Externos
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                placeholder="Nome (Ex: João Cliente)"
                                value={currentExtName}
                                onChange={(e) => setCurrentExtName(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all font-medium text-sm w-full"
                              />
                              <input
                                type="email"
                                placeholder="E-mail"
                                value={currentExtEmail}
                                onChange={(e) => setCurrentExtEmail(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all font-medium text-sm w-full"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (currentExtName.trim()) {
                                    setNovoEvento({
                                      ...novoEvento,
                                      participantes_externos: [
                                        ...novoEvento.participantes_externos,
                                        { nome: currentExtName.trim(), email: currentExtEmail.trim() }
                                      ]
                                    })
                                    setCurrentExtName('')
                                    setCurrentExtEmail('')
                                  }
                                }}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors border border-gray-200 flex items-center justify-center shrink-0"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>
                            {novoEvento.participantes_externos.length > 0 && (
                              <div className="flex flex-col gap-2 mt-2">
                                {novoEvento.participantes_externos.map((ext, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold text-gray-700">
                                    <div className="flex flex-col min-w-0">
                                      <span className="truncate">{ext.nome}</span>
                                      {ext.email && <span className="text-[10px] text-gray-400 font-medium truncate">{ext.email}</span>}
                                    </div>
                                    <button
                                      onClick={() => setNovoEvento({
                                        ...novoEvento,
                                        participantes_externos: novoEvento.participantes_externos.filter((_, i) => i !== idx)
                                      })}
                                      className="hover:bg-red-50 text-gray-400 hover:text-red-500 rounded p-1 transition-colors shrink-0"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                    <AlignLeft className="h-3 w-3" /> Observações <span className="font-normal">(Opcional)</span>
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

      {/* MODAL RESUMO COLABORADOR */}
      {
        visualizarColaborador && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setVisualizarColaborador(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 bg-gradient-to-r from-[#d4af37] to-amber-600 flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 text-white/20">
                  <Cake className="w-24 h-24" />
                </div>
                <div className="flex items-center gap-3 text-white relative z-10">
                  {visualizarColaborador.photo_url ? (
                    <img src={visualizarColaborador.photo_url} className="w-12 h-12 rounded-full border-2 border-white object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center font-bold text-amber-600 bg-white shadow-sm text-xl">
                      {visualizarColaborador.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-black text-lg max-w-[200px] truncate leading-tight">{formatName(visualizarColaborador.name)}</h3>
                    <p className="text-white/80 text-[10px] font-semibold uppercase tracking-wider mt-0.5">{visualizarColaborador.role || 'Sem cargo'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setVisualizarColaborador(null)}
                  className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all relative z-10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-gray-50 border border-gray-100 text-gray-500 rounded-xl shadow-sm"><AlignLeft className="w-4 h-4" /></div>
                  <div>
                    <p className="text-[9px] font-black tracking-widest uppercase text-gray-400 mb-0.5">Local de Atuação</p>
                    <p className="text-[13px] font-bold text-[#0a192f]">{visualizarColaborador.location || 'Não informado'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-gray-50 border border-gray-100 text-gray-500 rounded-xl shadow-sm"><Users className="w-4 h-4" /></div>
                  <div>
                    <p className="text-[9px] font-black tracking-widest uppercase text-gray-400 mb-0.5">Líder Direto</p>
                    <p className="text-[13px] font-bold text-[#0a192f]">{visualizarColaborador.leader || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* MODAL RESUMO EVENTO */}
      {
        visualizarEvento && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setVisualizarEvento(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 text-white/20">
                  <CalendarEventIcon className="w-24 h-24" />
                </div>
                <div className="flex items-center gap-3 text-white relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg max-w-[200px] truncate leading-tight">{visualizarEvento.titulo}</h3>
                    <p className="text-white/80 text-[10px] font-semibold uppercase tracking-wider mt-0.5">{visualizarEvento.tipo}</p>
                  </div>
                </div>
                <button
                  onClick={() => setVisualizarEvento(null)}
                  className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all relative z-10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                {visualizarEvento.hora && (
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2.5 bg-gray-50 border border-gray-100 text-gray-500 rounded-xl shadow-sm"><CalendarDays className="w-4 h-4" /></div>
                    <div>
                      <p className="text-[9px] font-black tracking-widest uppercase text-gray-400 mb-0.5">Data e Hora</p>
                      <p className="text-[13px] font-bold text-[#0a192f]">{new Date(visualizarEvento.data_evento + 'T12:00:00').toLocaleDateString('pt-BR')} às {visualizarEvento.hora}</p>
                    </div>
                  </div>
                )}
                {(visualizarEvento.local_tipo || visualizarEvento.local_endereco_url) && (
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2.5 bg-gray-50 border border-gray-100 text-gray-500 rounded-xl shadow-sm"><AlignLeft className="w-4 h-4" /></div>
                    <div>
                      <p className="text-[9px] font-black tracking-widest uppercase text-gray-400 mb-0.5">Local</p>
                      <p className="text-[13px] font-bold text-[#0a192f]">
                        {visualizarEvento.local_tipo === 'Online' ? '💻 Online' : '📍 Presencial'}
                        {visualizarEvento.local_endereco_url && <span className="font-normal text-gray-600 ml-1">- {visualizarEvento.local_endereco_url}</span>}
                      </p>
                    </div>
                  </div>
                )}
                {(
                  (visualizarEvento.participantes_internos && visualizarEvento.participantes_internos.length > 0) ||
                  (visualizarEvento.participantes_socios && visualizarEvento.participantes_socios.length > 0) ||
                  (visualizarEvento.participantes_externos && visualizarEvento.participantes_externos.length > 0) ||
                  (visualizarEvento.participantes_candidatos && visualizarEvento.participantes_candidatos.length > 0)
                ) && (
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-2.5 bg-gray-50 border border-gray-100 text-gray-500 rounded-xl shadow-sm"><Users className="w-4 h-4" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-black tracking-widest uppercase text-gray-400 mb-0.5">Participantes</p>

                        {/* INTERNOS */}
                        {(visualizarEvento.participantes_internos && visualizarEvento.participantes_internos.length > 0) && (
                          <div className="flex flex-wrap gap-1 mt-1 mb-1.5">
                            {visualizarEvento.participantes_internos.map((id: string) => {
                              const colab = collaborators.find(c => String(c.id) === String(id));
                              return colab ? (
                                <span key={id} className="inline-flex px-1.5 py-0.5 bg-[#1e3a8a]/5 text-[#1e3a8a] rounded text-[10px] font-bold border border-[#1e3a8a]/10 truncate max-w-full">
                                  {formatName(colab.name)}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}

                        {/* SOCIOS */}
                        {(visualizarEvento.participantes_socios && visualizarEvento.participantes_socios.length > 0) && (
                          <div className="flex flex-wrap gap-1 mt-1 mb-1.5">
                            {visualizarEvento.participantes_socios.map((nomeSocio, idx) => (
                              <span key={`socio - ${idx} `} className="inline-flex px-1.5 py-0.5 bg-[#d4af37]/10 text-[#d4af37] rounded text-[10px] font-bold border border-[#d4af37]/20 truncate max-w-full">
                                {nomeSocio} (Sócio)
                              </span>
                            ))}
                          </div>
                        )}

                        {/* EXTERNOS */}
                        {(visualizarEvento.participantes_externos && visualizarEvento.participantes_externos.length > 0) && (
                          <div className="flex flex-col gap-0.5 mt-2">
                            {visualizarEvento.participantes_externos.map((ext, idx) => (
                              <p key={`ext - ${idx} `} className="text-[11px] text-gray-600 font-medium leading-tight">
                                Externo: {ext.nome} {ext.email && <span className="opacity-70">({ext.email})</span>}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* CANDIDATOS */}
                        {(visualizarEvento.participantes_candidatos && visualizarEvento.participantes_candidatos.length > 0) && (
                          <div className="flex flex-wrap gap-1 mt-1 mb-1.5">
                            {visualizarEvento.participantes_candidatos.map((id: string) => {
                              const cand = candidatos.find(c => String(c.id) === String(id));
                              return cand ? (
                                <span key={id} className="inline-flex px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-bold border border-purple-200 truncate max-w-full">
                                  {formatName(cand.nome)} (Candidato)
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                {visualizarEvento.entrevistador_id && (
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2.5 bg-gray-50 border border-gray-100 text-gray-500 rounded-xl shadow-sm"><Briefcase className="w-4 h-4" /></div>
                    <div>
                      <p className="text-[9px] font-black tracking-widest uppercase text-gray-400 mb-0.5">Entrevistador(a)</p>
                      <p className="text-[13px] font-bold text-[#0a192f]">
                        {(() => {
                          const c = collaborators.find((col) => String(col.id) === String(visualizarEvento.entrevistador_id));
                          return c ? c.name : 'Desconhecido';
                        })()}
                      </p>
                    </div>
                  </div>
                )}
                {visualizarEvento.descricao ? (
                  <div className="flex items-start gap-4 mt-4 pt-4 border-t border-gray-100">
                    <div className="p-2.5 bg-gray-50 border border-gray-100 text-gray-500 rounded-xl shadow-sm"><AlignLeft className="w-4 h-4" /></div>
                    <div>
                      <p className="text-[9px] font-black tracking-widest uppercase text-gray-400 mb-0.5">Local / Descrição</p>
                      <p className="text-[13px] font-semibold text-gray-700 whitespace-pre-line leading-relaxed">{visualizarEvento.descricao}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="p-3 bg-gray-50 rounded-full mb-2"><AlignLeft className="w-5 h-5 text-gray-300" /></div>
                    <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 italic">Nenhuma descrição</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* NOVO: Modal Seletor de Tipo de Evento */}
      <EventSelectionModal
        isOpen={isEventSelectionModalOpen}
        onClose={() => setIsEventSelectionModalOpen(false)}
        onSelect={handleOpenNewEvent}
      />
    </div>
  )
}