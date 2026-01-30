// src/components/collaborators/pages/Calendario.tsx
import { useState, useEffect } from 'react'
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
  CalendarDays
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

interface Colaborador {
  id: number;
  nome: string;
  data_nascimento: string;
  cargo: string;
  foto_url?: string;
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
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [viewMode, setViewMode] = useState<'calendario' | 'proximos'>('calendario')
  const [filterMes, setFilterMes] = useState<number | null>(null)

  // Estados para o Modal de Evento
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [savingEvento, setSavingEvento] = useState(false)
  const [novoEvento, setNovoEvento] = useState({
    titulo: '',
    tipo: 'Reunião', // Default
    data: new Date().toISOString().split('T')[0],
    descricao: ''
  })

  useEffect(() => {
    fetchColaboradores()
  }, [])

  const fetchColaboradores = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('colaboradores')
      .select('id, nome, data_nascimento, cargo, foto_url')
      .not('data_nascimento', 'is', null)
      .eq('status', 'Ativo')
      .order('nome')
    
    if (data) setColaboradores(data)
    setLoading(false)
  }

  const handleSaveEvento = async () => {
    if (!novoEvento.titulo || !novoEvento.data) return
    
    setSavingEvento(true)
    try {
      const { error } = await supabase
        .from('eventos') // Certifique-se de criar esta tabela
        .insert({
          titulo: novoEvento.titulo,
          tipo: novoEvento.tipo,
          data_evento: novoEvento.data,
          descricao: novoEvento.descricao
        })

      if (error) throw error

      setIsModalOpen(false)
      setNovoEvento({
        titulo: '',
        tipo: 'Reunião',
        data: new Date().toISOString().split('T')[0],
        descricao: ''
      })
      alert('Evento criado com sucesso!')
      // Aqui você poderia recarregar os eventos se estivesse exibindo eventos mistos
    } catch (error) {
      console.error('Erro ao salvar evento:', error)
      alert('Erro ao salvar evento. Verifique se a tabela "eventos" existe.')
    } finally {
      setSavingEvento(false)
    }
  }

  const toTitleCase = (str: string) => {
    if (!str) return ''
    return str.toLowerCase().split(' ').map(word => {
      return (word.length > 2) ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    }).join(' ');
  }

  const formatName = (nome: string) => {
    if (!nome) return ''
    const cleanName = nome.trim()
    const parts = cleanName.split(/\s+/)
    
    if (parts.length === 1) {
      return toTitleCase(parts[0])
    }
    
    // Pega o primeiro e o último nome
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

    colaboradores.forEach(colab => {
      if (colab.data_nascimento) {
        const nascimento = new Date(colab.data_nascimento)
        const dia = nascimento.getDate()
        const mes = nascimento.getMonth()
        const ano = nascimento.getFullYear()
        
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

  const aniversariosDoMes = (mes: number, ano: number): AniversarioData[] => {
    return aniversarios.filter(a => a.mes === mes)
  }

  const getAniversariosHoje = () => aniversarios.filter(a => a.isHoje)
  const getAniversariosEstaSemana = () => aniversarios.filter(a => a.isEstaSemana && !a.isHoje)
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

    // Dias vazios antes do primeiro dia
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />)
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const anivDoDia = anivMes.filter(a => a.dia === day)
      const isToday = 
        day === currentDate.getDate() && 
        selectedMonth === currentDate.getMonth() && 
        selectedYear === currentDate.getFullYear()

      days.push(
        <div
          key={day}
          className={`aspect-square p-2 rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
            isToday 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 shadow-lg' 
              : anivDoDia.length > 0
              ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-md hover:scale-105 cursor-pointer'
              : 'bg-white border-gray-100 hover:border-blue-100 hover:bg-blue-50/30'
          }`}
        >
          <div className={`text-sm font-bold ${isToday ? 'text-white' : 'text-gray-700'}`}>
            {day}
          </div>
          {anivDoDia.length > 0 && (
            <div className="space-y-1 mt-1">
              {anivDoDia.slice(0, 2).map((aniv, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-1.5 py-1 rounded-md shadow-sm border border-blue-100"
                  title={formatName(aniv.colaborador.nome)}
                >
                  <Cake className="h-3 w-3 text-blue-600 flex-shrink-0" />
                  <span className="text-[9px] font-medium text-gray-700 truncate w-full leading-tight">
                    {formatName(aniv.colaborador.nome)}
                  </span>
                </div>
              ))}
              {anivDoDia.length > 2 && (
                <div className="text-[8px] font-bold text-blue-600 text-center bg-white/80 rounded px-1">
                  +{anivDoDia.length - 2}
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
  const aniversariosEstaSemana = getAniversariosEstaSemana()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando calendário...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* TOOLBAR & STATS */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="flex gap-4 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100 min-w-max">
            <div className="p-1.5 bg-yellow-100 rounded-md">
              <Sparkles className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Hoje</p>
              <p className="text-lg font-bold text-gray-900 leading-none">{aniversariosHoje.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100 min-w-max">
            <div className="p-1.5 bg-pink-100 rounded-md">
              <PartyPopper className="h-4 w-4 text-pink-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Esta Semana</p>
              <p className="text-lg font-bold text-gray-900 leading-none">{aniversariosEstaSemana.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100 min-w-max">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-lg font-bold text-gray-900 leading-none">{colaboradores.length}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full xl:w-auto justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium shadow-md hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Evento
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('calendario')}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                viewMode === 'calendario'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Calendário
            </button>
            <button
              onClick={() => setViewMode('proximos')}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                viewMode === 'proximos'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Próximos
            </button>
          </div>
        </div>
      </div>

      {/* ANIVERSÁRIOS DE HOJE */}
      {aniversariosHoje.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 rounded-2xl shadow-lg border-2 border-yellow-200 p-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-400 rounded-xl shadow-lg">
              <Cake className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                🎉 Aniversariantes de Hoje!
              </h2>
              <p className="text-sm text-gray-600">Não esqueça de parabenizar</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aniversariosHoje.map((aniv) => (
              <div
                key={aniv.colaborador.id}
                className="bg-white rounded-xl p-4 shadow-md border-2 border-yellow-300 hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  {aniv.colaborador.foto_url ? (
                    <img
                      src={aniv.colaborador.foto_url}
                      alt={aniv.colaborador.nome}
                      className="w-16 h-16 rounded-full object-cover border-4 border-yellow-400 shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-yellow-300 shadow-lg">
                      {aniv.colaborador.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{formatName(aniv.colaborador.nome)}</p>
                    <p className="text-sm text-gray-600">{toTitleCase(aniv.colaborador.cargo)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      {viewMode === 'calendario' ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          {/* Navegação do Calendário */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-6 w-6 text-blue-600" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              {MESES[selectedMonth]} {selectedYear}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ChevronRight className="h-6 w-6 text-blue-600" />
            </button>
          </div>

          {/* Dias da Semana */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {DIAS_SEMANA.map(dia => (
              <div key={dia} className="text-center text-sm font-bold text-gray-500 uppercase">
                {dia}
              </div>
            ))}
          </div>

          {/* Grade do Calendário */}
          <div className="grid grid-cols-7 gap-2">
            {renderCalendar()}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Próximos Aniversários</h2>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterMes ?? ''}
                onChange={(e) => setFilterMes(e.target.value ? parseInt(e.target.value) : null)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Todos os meses</option>
                {MESES.map((mes, idx) => (
                  <option key={idx} value={idx}>{mes}</option>
                ))}
              </select>
              {filterMes !== null && (
                <button
                  onClick={() => setFilterMes(null)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                  aniv.isHoje
                    ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300'
                    : aniv.isEstaSemana
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  {aniv.colaborador.foto_url ? (
                    <img
                      src={aniv.colaborador.foto_url}
                      alt={aniv.colaborador.nome}
                      className="w-14 h-14 rounded-full object-cover border-2 border-blue-300 shadow"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold border-2 border-blue-300 shadow">
                      {aniv.colaborador.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{formatName(aniv.colaborador.nome)}</p>
                    <p className="text-sm text-gray-600">{toTitleCase(aniv.colaborador.cargo)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Data</p>
                    <p className="font-bold text-gray-900">
                      {aniv.dia} de {MESES[aniv.mes]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Faltam</p>
                    <p className={`font-bold text-lg ${
                      aniv.isHoje ? 'text-yellow-600' : aniv.isEstaSemana ? 'text-blue-600' : 'text-gray-900'
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

      {/* MODAL NOVO EVENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-800">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-lg">Novo Evento</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 p-1 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={novoEvento.titulo}
                  onChange={(e) => setNovoEvento({...novoEvento, titulo: e.target.value})}
                  placeholder="Ex: Reunião Geral"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={novoEvento.tipo}
                    onChange={(e) => setNovoEvento({...novoEvento, tipo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                  >
                    <option value="Reunião">Reunião</option>
                    <option value="Aniversário">Aniversário</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={novoEvento.data}
                    onChange={(e) => setNovoEvento({...novoEvento, data: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <AlignLeft className="h-3 w-3" /> Descrição <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <textarea
                  value={novoEvento.descricao}
                  onChange={(e) => setNovoEvento({...novoEvento, descricao: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEvento}
                disabled={savingEvento || !novoEvento.titulo}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {savingEvento ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar Evento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}