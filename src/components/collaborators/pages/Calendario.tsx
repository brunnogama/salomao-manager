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
  Trash2,
  Check,
  Send,
  Loader2,
  Briefcase
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useColaboradores } from '../hooks/useColaboradores'
import { getFeriadosDoAno } from '../utils/holidays'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { SocioSelector } from '../../crm/SocioSelector'

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
  const [currentDate] = useState(new Date())
  const selectedMonth = currentDate.getMonth();
  const selectedYear = currentDate.getFullYear();

  // Estados para Modal de Visualização Rápida
  const [visualizarColaborador, setVisualizarColaborador] = useState<Colaborador | null>(null);
  const [visualizarEvento, setVisualizarEvento] = useState<Evento | null>(null);

  // Estados para o Modal de Evento
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [savingEvento, setSavingEvento] = useState(false)
  const [editingEvento, setEditingEvento] = useState<number | null>(null) // Changed to number for event ID
  // Estados locais para inputs do Modal
  const [currentSocio, setCurrentSocio] = useState('')
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
    vaga_id: ''
  })

  // Estados para Aniversários WPP
  const [selectedAniversariantes, setSelectedAniversariantes] = useState<string[]>([])
  const [isSendingWpp, setIsSendingWpp] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: evs } = await supabase
      .from('events') // Changed from 'eventos' to 'events'
      .select('*')
      .order('event_date') // Changed from 'data_evento' to 'event_date'

    const feriados = getFeriadosDoAno(new Date().getFullYear()).map((f: any, idx: number) => ({
      ...f,
      id: -(idx + 1) // IDs negativos para feriados
    })) as Evento[]

    if (evs) {
      // Map Supabase data to local Evento interface
      const mappedEvs: Evento[] = evs.map((e: any) => {
        let externos: { nome: string; email: string }[] = [];
        let socios: string[] = [];
        if (e.participants_external) {
          try {
            const parsed = JSON.parse(e.participants_external)
            if (Array.isArray(parsed)) {
              externos = parsed;
            } else if (parsed && typeof parsed === 'object') {
              if (parsed.externos) externos = parsed.externos;
              if (parsed.socios) socios = parsed.socios;
            } else {
              externos = [{ nome: e.participants_external, email: '' }]
            }
          } catch {
            externos = [{ nome: e.participants_external, email: '' }]
          }
        }

        return ({
          id: e.id,
          titulo: e.title,
          tipo: e.type,
          data_evento: e.event_date,
          descricao: e.description,
          hora: e.time,
          local_tipo: e.location_type,
          local_endereco_url: e.location_address,
          participantes_internos: e.participants_internal,
          participantes_externos: externos,
          participantes_socios: socios
        });
      });
      setEventos([...feriados, ...mappedEvs])
    } else {
      setEventos([...feriados])
    }

    // Fetch Vagas
    const { data: vagasData } = await supabase
      .from('vagas')
      .select('id, title, status, vaga_id_text')
      .in('status', ['Aberta', 'Congelada', 'Aguardando Autorização']);
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
      const externalPayload = JSON.stringify({
        externos: novoEvento.participantes_externos,
        socios: novoEvento.participantes_socios
      })

      let savedEventId = editingEvento;

      if (editingEvento) {
        // Atualiza evento existente
        const { error } = await supabase
          .from('events')
          .update({
            title: novoEvento.titulo,
            event_date: novoEvento.data,
            type: novoEvento.tipo,
            description: novoEvento.descricao,
            time: novoEvento.hora,
            location_type: novoEvento.local_tipo,
            location_address: novoEvento.local_endereco_url,
            participants_internal: novoEvento.participantes_internos,
            participants_external: externalPayload,
            vaga_id: novoEvento.vaga_id || null,
            participantes_candidatos: novoEvento.participantes_candidatos
          })
          .eq('id', editingEvento)

        if (error) throw error
      } else {
        // Cria novo evento
        const { data: newEventData, error } = await supabase
          .from('events')
          .insert([{
            title: novoEvento.titulo,
            event_date: novoEvento.data,
            type: novoEvento.tipo,
            description: novoEvento.descricao,
            time: novoEvento.hora,
            location_type: novoEvento.local_tipo,
            location_address: novoEvento.local_endereco_url,
            participants_internal: novoEvento.participantes_internos,
            participants_external: externalPayload,
            vaga_id: novoEvento.vaga_id || null,
            participantes_candidatos: novoEvento.participantes_candidatos
          }]).select('id').single()

        if (error) throw error
        if (newEventData) savedEventId = newEventData.id;
      }

      // Se for Entrevista e houver candidatos, adicionar histórico se for criação
      if (novoEvento.tipo === 'Entrevista' && novoEvento.participantes_candidatos.length > 0 && !editingEvento && savedEventId) {
        const historicos = novoEvento.participantes_candidatos.map(candId => ({
          candidato_id: candId,
          tipo: 'Entrevista',
          descricao: `Entrevista agendada: ${novoEvento.titulo}`,
          data_registro: new Date().toISOString(),
          entrevista_data: novoEvento.data,
          entrevista_hora: novoEvento.hora || null,
          compareceu: null, // Pendente
          evento_id: savedEventId
        }));

        await supabase.from('candidato_historico').insert(historicos);
      }

      await fetchData()
      setIsModalOpen(false)
      setEditingEvento(null)
      setNovoEvento({ titulo: '', data: new Date().toISOString().split('T')[0], tipo: 'Reunião', descricao: '', hora: '', local_tipo: 'Online', local_endereco_url: '', participantes_internos: [], participantes_externos: [], participantes_socios: [], participantes_candidatos: [], vaga_id: '' })
      setCurrentExtName('')
      setCurrentExtEmail('')
      setCurrentSocio('')
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
      const { error } = await supabase.from('events').delete().eq('id', id) // Changed from 'eventos' to 'events'
      if (error) throw error
      await fetchData()
    } catch (error) {
      alert('Erro ao excluir evento')
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
      vaga_id: evento.vaga_id || ''
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

  const handleToggleAniversariante = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedAniversariantes(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  const handleSendWpp = async () => {
    if (selectedAniversariantes.length === 0) return;
    setIsSendingWpp(true);

    try {
      const selecionados = aniversarios.filter(a => selectedAniversariantes.includes(String(a.colaborador.id)));

      const locationsSet = new Set(selecionados.map(a => a.colaborador.location).filter(Boolean));
      const locations = Array.from(locationsSet);
      if (locations.length === 0) locations.push('Escritório'); // fallback

      const names = selecionados.map(a => formatName(a.colaborador.name));

      // TEXTO PADRÃO SOLICITADO
      // "Hoje celebramos os aniversários dos nossos integrantes do (nomes das cidades): (nomes de todos os aniversariantes do dia) Parabéns e que os novos ciclos de vocês sejam repletos de realizações, saúde e muitas alegrias."

      const textoPadrao = `Hoje celebramos os aniversários dos nossos integrantes do ${locations.join(' e ')}: ${names.join(', ')}. Parabéns e que os novos ciclos de vocês sejam repletos de realizações, saúde e muitas alegrias.`;

      // Payload para enviar ao Make.com
      const payload = {
        tipo: selecionados.length > 1 ? 'mensal_ou_multiplo' : 'diario',
        cidades: locations.join(' e '),
        nomes: names.join(', '),
        quantidade: selecionados.length,
        mensagem_pronta: textoPadrao,
        aniversariantes: selecionados.map(s => ({
          nome: formatName(s.colaborador.name),
          cidade: s.colaborador.location || 'Escritório',
          foto: s.colaborador.photo_url || ''
        }))
      };

      const webhookUrl = 'https://hook.us2.make.com/8f6ve3x2toikhvh7d8fi7ohegc88s5rh';

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      alert('Mensagem enviada com sucesso para a automação!');
      setSelectedAniversariantes([]); // limpa a seleção
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar a mensagem. Verifique a URL do Webhook e o console.');
    } finally {
      setIsSendingWpp(false);
    }
  }



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
              id: `mochila-${c.id}`,
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
              Agenda
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Acompanhe os aniversários dos colaboradores, reuniões e eventos
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto mt-2 sm:mt-0">
          <div className="relative flex items-center justify-center p-2 sm:p-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all group overflow-hidden cursor-pointer">
            <input
              type="date"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              title="Consultar Data"
              onClick={(e) => {
                try {
                  (e.target as any).showPicker();
                } catch (err) { }
              }}
            />
            <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-[#1e3a8a] group-hover:scale-110 transition-transform" />
          </div>
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

        {/* BLOCOS: ANIVERSARIANTES | EVENTOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 w-full">
          {/* BLOCO ANIVERSARIANTES */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col max-h-[800px] xl:max-h-[85vh] w-full">
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#d4af37]/10 rounded-xl">
                  <Cake className="h-5 w-5 text-[#d4af37]" />
                </div>
                <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">Próximos Aniversários</h2>
              </div>

              {selectedAniversariantes.length > 0 && (
                <button
                  disabled={isSendingWpp}
                  onClick={handleSendWpp}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all text-xs font-bold uppercase tracking-wider active:scale-95 disabled:opacity-70"
                >
                  {isSendingWpp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Parabenizar ({selectedAniversariantes.length})
                </button>
              )}
            </div>

            <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1">
              {getProximosAniversarios().map((aniv) => {
                const isSelected = selectedAniversariantes.includes(String(aniv.colaborador.id));
                return (
                  <div
                    key={aniv.colaborador.id}
                    onClick={() => setVisualizarColaborador(aniv.colaborador as Colaborador)}
                    className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:shadow-lg cursor-pointer relative ${aniv.isHoje
                      ? 'bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-[#d4af37] shadow-md transform scale-[1.01] mx-1'
                      : aniv.isEstaSemana
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-[#1e3a8a]/30'
                        : 'bg-gray-50 border-gray-200 hover:border-[#1e3a8a]/30'
                      } ${isSelected ? 'ring-2 ring-green-500 border-transparent' : ''}`}
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-2">
                      <div
                        onClick={(e) => handleToggleAniversariante(e, String(aniv.colaborador.id))}
                        className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${isSelected
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 bg-white hover:border-green-500'
                          }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>

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
                        <p className="font-black text-[#0a192f] text-sm truncate">{aniv.isHoje ? '🎉 ' : ''}{formatName(aniv.colaborador.name)}</p>
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
                        <p className="text-[8px] text-gray-400 uppercase font-black tracking-[0.2em] mb-0.5">{aniv.diasRestantes === 0 ? '' : 'Faltam'}</p>
                        <p className={`font-black text-sm flex items-center justify-end ${aniv.isHoje ? 'text-[#d4af37]' : aniv.isEstaSemana ? 'text-[#1e3a8a]' : 'text-[#0a192f]'
                          }`}>
                          {aniv.diasRestantes === 0 ? <span className="text-[#d4af37] text-base transform scale-110">Hoje</span> : `${aniv.diasRestantes}d`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BLOCO EVENTOS */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col max-h-[800px] xl:max-h-[85vh] w-full">
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
                  onClick={() => evento.tipo === 'Mochila' ? setVisualizarColaborador(evento.colaboradorRef as Colaborador) : setVisualizarEvento(evento as Evento)}
                  className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:shadow-lg cursor-pointer ${evento.isHoje
                    ? 'bg-gradient-to-r from-emerald-100 to-green-100 border-2 border-emerald-500 shadow-md transform scale-[1.01] mx-1'
                    : evento.isEstaSemana
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-[#1e3a8a]/30'
                      : 'bg-gray-50 border-gray-200 hover:border-[#1e3a8a]/30'
                    }`}
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    {evento.tipo === 'Mochila' && (evento as any).colaboradorRef?.photo_url ? (
                      <img src={(evento as any).colaboradorRef.photo_url} alt={evento.titulo} className="w-12 h-12 rounded-xl object-cover border-2 border-[#1e3a8a]/30 shadow-md shrink-0" />
                    ) : evento.tipo === 'Mochila' ? (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white text-lg font-black border-2 border-[#1e3a8a]/30 shadow-md shrink-0">
                        {(evento as any).colaboradorRef?.name.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-black border-2 shadow-md shrink-0 ${evento.isHoje ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-500/30' : evento.tipo === 'Aniversário' ? 'bg-gradient-to-br from-[#d4af37] to-amber-600 border-[#d4af37]/30' : 'bg-gradient-to-br from-[#1e3a8a] to-[#112240] border-[#1e3a8a]/30'}`}>
                        {evento.tipo === 'Reunião' ? <Users className="h-5 w-5" /> : evento.tipo === 'Aniversário' ? <PartyPopper className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-black text-[#0a192f] text-sm truncate">{evento.isHoje ? '🎉 ' : ''}{evento.titulo}</p>
                      <p className="text-[10px] font-semibold text-gray-600 truncate">{evento.tipo}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-l border-gray-200/50 pl-4 shrink-0">
                    <div className="text-right hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditClick(evento); }}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteEvento(evento.id); }}
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
                      <p className="text-[8px] text-gray-400 uppercase font-black tracking-[0.2em] mb-0.5">{evento.diasRestantes === 0 ? '' : 'Faltam'}</p>
                      <p className={`font-black text-sm flex items-center justify-end ${evento.isHoje ? 'text-emerald-600' : evento.isEstaSemana ? 'text-[#1e3a8a]' : 'text-[#0a192f]'
                        }`}>
                        {evento.diasRestantes === 0 ? <span className="text-emerald-600 text-base transform scale-110">Hoje</span> : `${evento.diasRestantes}d`}
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
              <div className="px-6 py-4 bg-gradient-to-r from-[#112240] to-[#1e3a8a] flex items-center justify-between shrink-0">
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

              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
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
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Data</label>
                      <input
                        type="date"
                        value={novoEvento.data}
                        onChange={(e) => setNovoEvento({ ...novoEvento, data: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Hora <span className="font-normal">(Opcional)</span></label>
                      <input
                        type="time"
                        value={novoEvento.hora}
                        onChange={(e) => setNovoEvento({ ...novoEvento, hora: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all font-medium"
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
                      <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                          {novoEvento.local_tipo === 'Online' ? 'URL da Reunião' : 'Endereço'}
                        </label>
                        <input
                          type="text"
                          placeholder={novoEvento.local_tipo === 'Online' ? 'https://meet.google.com/...' : 'Rua, Número, Sala...'}
                          value={novoEvento.local_endereco_url}
                          onChange={(e) => setNovoEvento({ ...novoEvento, local_endereco_url: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {novoEvento.tipo === 'Entrevista' && (
                        <>
                          {/* VAGA (Apenas para Entrevista) */}
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                              <Briefcase className="h-3 w-3" /> Vaga Relacionada
                            </label>
                            <SearchableSelect
                              options={vagas.map(v => ({ value: v.id, label: v.vaga_id_text ? `${v.vaga_id_text} - ${v.title}` : v.title }))}
                              value={novoEvento.vaga_id || ''}
                              onChange={(val) => setNovoEvento({ ...novoEvento, vaga_id: val })}
                              placeholder="Selecione uma vaga..."
                            />
                          </div>

                          {/* CANDIDATOS (Apenas para Entrevista) */}
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                              <Users className="h-3 w-3" /> Entrevistados (Candidatos)
                            </label>
                            <SearchableSelect
                              options={candidatos.map(c => ({ value: c.id, label: c.nome }))}
                              value={''} // Clear after select
                              onChange={(val) => {
                                if (val && !novoEvento.participantes_candidatos.includes(val)) {
                                  setNovoEvento({ ...novoEvento, participantes_candidatos: [...novoEvento.participantes_candidatos, val] })
                                }
                              }}
                              placeholder="Adicionar candidato..."
                            />
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
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

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

            {/* MODAL RESUMO COLABORADOR */}
            {visualizarColaborador && (
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
            {visualizarEvento && (
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
                      (visualizarEvento.participantes_externos && visualizarEvento.participantes_externos.length > 0)
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
                                  <span key={`socio-${idx}`} className="inline-flex px-1.5 py-0.5 bg-[#d4af37]/10 text-[#d4af37] rounded text-[10px] font-bold border border-[#d4af37]/20 truncate max-w-full">
                                    {nomeSocio} (Sócio)
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* EXTERNOS */}
                            {(visualizarEvento.participantes_externos && visualizarEvento.participantes_externos.length > 0) && (
                              <div className="flex flex-col gap-0.5 mt-2">
                                {visualizarEvento.participantes_externos.map((ext, idx) => (
                                  <p key={`ext-${idx}`} className="text-[11px] text-gray-600 font-medium leading-tight">
                                    Externo: {ext.nome} {ext.email && <span className="opacity-70">({ext.email})</span>}
                                  </p>
                                ))}
                              </div>
                            )}
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
            )
            }