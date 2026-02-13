import { useState, useEffect } from 'react'
import {
  ArrowDownCircle,
  Filter,
  Mail,
  Clock,
  AlertCircle,
  Phone,
  CheckCircle2,
  Loader2,
  FileText,
  Search,
  Check,
  Calendar as CalendarIcon,
  List,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X
} from 'lucide-react'
import { FinanceModalEnviarFatura } from '../components/FinanceModalEnviarFatura'
import { FinanceModalDetalhesFatura } from '../components/FinanceModalDetalhesFatura'
import { FinanceModalEditarDatas } from '../components/FinanceModalEditarDatas'
import { useFinanceContasReceber, FaturaStatus, Fatura } from '../hooks/useFinanceContasReceber'

interface FinanceContasReceberProps {
  userEmail?: string;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function FinanceContasReceber({
  userEmail = ''
}: FinanceContasReceberProps) {
  const [activeTab, setActiveTab] = useState<'lista' | 'calendario'>('lista')
  const [activeFilter, setActiveFilter] = useState<'todos' | 'aguardando' | 'radar' | 'pago'>('todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Estado para o modal de detalhes
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedFatura, setSelectedFatura] = useState<Fatura | null>(null)

  // Estado para modal de edição de datas
  const [isEditDateModalOpen, setIsEditDateModalOpen] = useState(false)
  const [faturaParaEditar, setFaturaParaEditar] = useState<Fatura | null>(null)

  const [currentDate, setCurrentDate] = useState(new Date())
  const { faturas, loading, confirmarPagamento, excluirFatura } = useFinanceContasReceber()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setIsDetailsModalOpen(false);
        setIsEditDateModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const prevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
  setCurrentDate(newDate)
}

const formatInvoiceId = (id: string) => `FAT - ${id.substring(0, 6).toUpperCase()}`

const handleOpenDetails = (fatura: Fatura) => {
  setSelectedFatura(fatura)
  setIsDetailsModalOpen(true)
}

const handleOpenEditDates = (e: React.MouseEvent, fatura: Fatura) => {
  e.stopPropagation();
  setFaturaParaEditar(fatura);
  setIsEditDateModalOpen(true);
}

const handleDeleteFatura = async (e: React.MouseEvent, fatura: Fatura) => {
  e.stopPropagation();
  if (confirm(`ATENÇÃO: Deseja realmente excluir a fatura de ${fatura.cliente_nome}? Esta ação não pode ser desfeita.`)) {
    try {
      await excluirFatura(fatura.id);
    } catch (error: any) {
      alert("Erro ao excluir: " + error.message);
    }
  }
}

const getStatusStyles = (status: FaturaStatus) => {
  switch (status) {
    case 'aguardando_resposta':
      return { bg: 'bg-blue-600', dot: 'bg-white', text: 'text-white', border: 'border-blue-700', icon: <Clock className="h-3 w-3 text-white" />, label: 'Aguardando (2d)' }
    case 'radar':
      return { bg: 'bg-amber-600', dot: 'bg-white', text: 'text-white', border: 'border-amber-700', icon: <AlertCircle className="h-3 w-3 text-white" />, label: 'No Radar (+2d)' }
    case 'contato_direto':
      return { bg: 'bg-red-600', dot: 'bg-white', text: 'text-white', border: 'border-red-700', icon: <Phone className="h-3 w-3 text-white" />, label: 'Contato Direto' }
    case 'pago':
      return { bg: 'bg-emerald-600', dot: 'bg-white', text: 'text-white', border: 'border-emerald-700', icon: <CheckCircle2 className="h-3 w-3 text-white" />, label: 'Recebido' }
    default:
      return { bg: 'bg-gray-500', dot: 'bg-white', text: 'text-white', border: 'border-gray-600', icon: <Clock className="h-3 w-3 text-white" />, label: 'Enviado' }
  }
}

const handleConfirmarPagamento = async (id: string, cliente: string) => {
  if (confirm(`Deseja confirmar o recebimento da fatura de ${cliente}?`)) {
    try {
      await confirmarPagamento(id);
    } catch (error: any) {
      alert("Erro ao confirmar pagamento: " + error.message);
    }
  }
}

const filteredFaturas = faturas.filter(f => {
  const matchesSearch = f.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.assunto?.toLowerCase().includes(searchTerm.toLowerCase())

  let matchesTab = true;
  if (activeFilter === 'aguardando') matchesTab = f.status === 'aguardando_resposta';
  if (activeFilter === 'radar') matchesTab = f.status === 'radar';
  if (activeFilter === 'pago') matchesTab = f.status === 'pago';

  return matchesSearch && matchesTab;
})

// Contadores para as abas
const countTodos = faturas.length;
const countAguardando = faturas.filter(f => f.status === 'aguardando_resposta').length;
const countRadar = faturas.filter(f => f.status === 'radar').length;
const countPago = faturas.filter(f => f.status === 'pago').length;

const renderCalendarDays = () => {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const days = []
  const totalDaysCount = daysInMonth(year, month)
  const offset = firstDayOfMonth(year, month)

  for (let i = 0; i < offset; i++) {
    days.push(<div key={`empty-${i}`} className="h-32 bg-gray-50/50 border border-gray-100"></div>)
  }

  for (let day = 1; day <= totalDaysCount; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const faturasDoDia = faturas.filter(f => f.data_envio?.startsWith(dateStr))

    days.push(
      <div key={day} className="h-32 bg-white border border-gray-100 p-2 hover:bg-gray-50 transition-colors flex flex-col">
        <span className="text-xs font-bold text-gray-400">{day}</span>
        <div className="mt-1 space-y-1 overflow-y-auto max-h-24 custom-scrollbar">
          {faturasDoDia.map(f => {
            const style = getStatusStyles(f.status)
            return (
              <div key={f.id} className={`text-[10px] p-1 rounded text-white font-bold truncate flex items-center gap-1 ${style.bg}`} title={f.cliente_nome}>
                {f.cliente_nome}
              </div>
            )
          })}
        </div>
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
          <ArrowDownCircle className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
            Contas a Receber
          </h1>
          <p className="text-sm font-semibold text-gray-500 mt-0.5">Gestão de entradas e fluxo 2d + 2d</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setIsModalOpen(true)}
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
        >
          <Mail className="h-4 w-4" /> Enviar Fatura
        </button>
      </div>
    </div>

    <div className="max-w-[1600px] mx-auto space-y-6 w-full">

      {/* BOTÕES DE VISUALIZAÇÃO - LINHA PRÓPRIA */}
      <div className="flex bg-gray-100 p-1.5 rounded-xl w-fit shadow-sm">
        <button
          onClick={() => setActiveTab('lista')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'lista'
            ? 'bg-white text-[#1e3a8a] shadow-md'
            : 'text-gray-400 hover:text-gray-600'
            }`}
        >
          <List className="h-4 w-4" /> Lista
        </button>
        <button
          onClick={() => setActiveTab('calendario')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'calendario'
            ? 'bg-white text-[#1e3a8a] shadow-md'
            : 'text-gray-400 hover:text-gray-600'
            }`}
        >
          <CalendarIcon className="h-4 w-4" /> Calendário
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {activeTab === 'lista' ? (
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {/* FILTER TABS */}
            <div className="flex bg-gray-100 p-1 rounded-xl shrink-0 self-start md:self-auto overflow-x-auto max-w-full">
              <button
                onClick={() => setActiveFilter('todos')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === 'todos' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Enviadas <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${activeFilter === 'todos' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>{countTodos}</span>
              </button>
              <button
                onClick={() => setActiveFilter('aguardando')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === 'aguardando' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Aguardando <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${activeFilter === 'aguardando' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>{countAguardando}</span>
              </button>
              <button
                onClick={() => setActiveFilter('radar')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === 'radar' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Prazo Fatal <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${activeFilter === 'radar' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>{countRadar}</span>
              </button>
              <button
                onClick={() => setActiveFilter('pago')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === 'pago' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Concluídas <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${activeFilter === 'pago' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>{countPago}</span>
              </button>
            </div>

            {/* SEARCH BAR */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente ou assunto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium text-xs"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all text-[#1e3a8a]"><ChevronLeft className="h-5 w-5" /></button>
            <span className="text-lg font-black text-[#0a192f] min-w-[180px] text-center uppercase tracking-widest">
              {MESES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all text-[#1e3a8a]"><ChevronRight className="h-5 w-5" /></button>
          </div>
        )}

        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-100 text-[#0a192f] rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-sm hover:bg-gray-50 transition-all">
            <Filter className="h-4 w-4" /> Filtros
          </button>
          {/* Button moved to header */}
        </div>
      </div>

      {/* LEGENDA */}
      {activeTab === 'calendario' && (
        <div className="flex gap-4 px-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500">
            <div className="w-3 h-3 rounded bg-blue-500"></div> Aguardando
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500">
            <div className="w-3 h-3 rounded bg-amber-500"></div> Radar
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500">
            <div className="w-3 h-3 rounded bg-red-500"></div> Contato Direto
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500">
            <div className="w-3 h-3 rounded bg-emerald-500"></div> Recebido
          </div>
        </div>
      )}

      {/* CONTEÚDO DINÂMICO */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-h-[450px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-[#1e3a8a]" />
            <p className="font-bold text-[10px] uppercase tracking-[0.3em]">Processando dados...</p>
          </div>
        ) : activeTab === 'lista' ? (
          filteredFaturas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-16">#</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Assunto</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Data Envio</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Data Resposta (+2d)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center text-red-500">Prazo Fatal (+4d)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredFaturas.map((fatura, index) => {
                    const style = getStatusStyles(fatura.status);
                    const dataEnvio = new Date(fatura.data_envio);

                    // Calcula datas visuais (se não houver overrides no banco)
                    // Se fatura.data_resposta existe, usa ela. Senão +2d
                    let dataResposta = new Date(dataEnvio);
                    if (fatura.data_resposta) {
                      dataResposta = new Date(fatura.data_resposta);
                    } else {
                      dataResposta.setDate(dataResposta.getDate() + 2);
                    }

                    // Se fatura.data_radar existe, usa ela (que estamos usando como Prazo Fatal visual). Senão +4d
                    let prazoFatal = new Date(dataEnvio);
                    if (fatura.data_radar) {
                      prazoFatal = new Date(fatura.data_radar);
                    } else {
                      prazoFatal.setDate(prazoFatal.getDate() + 4);
                    }

                    const statusStyle = getStatusStyles(fatura.status); // Renomear para evitar conflito se houver

                    return (
                      <tr
                        key={fatura.id}
                        onClick={() => handleOpenDetails(fatura)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-[10px] font-black text-gray-400 group-hover:text-[#1e3a8a] transition-colors">
                            {formatInvoiceId(fatura.id)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#0a192f]">{fatura.cliente_nome}</span>
                            <span className="text-[10px] text-gray-400">{fatura.cliente_email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-gray-600 line-clamp-1">{fatura.assunto}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[10px] font-bold text-gray-500">
                            {dataEnvio.toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[10px] font-bold text-blue-600">
                            {formatDate(dataResposta)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                            {formatDate(dataRadar)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${style.bg} ${style.text} border ${style.border}`}>
                            {style.icon}
                            {style.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {fatura.status !== 'pago' && (
                              <>
                                <button
                                  onClick={() => handleConfirmarPagamento(fatura.id, fatura.cliente_nome)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                  title="Confirmar Recebimento"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => handleOpenEditDates(e, fatura)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                  title="Editar Prazos"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={(e) => handleDeleteFatura(e, fatura)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Excluir Fatura"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-20 flex flex-col items-center justify-center text-center">
              <FileText className="h-12 w-12 mb-4 text-gray-200" />
              <p className="font-bold text-[10px] uppercase tracking-[0.3em] text-gray-300">Nenhuma fatura encontrada</p>
            </div>
          )
        ) : (
          <div className="flex flex-col h-full">
            <div className="grid grid-cols-7 gap-px bg-gray-100 border-b border-gray-100">
              {DIAS_SEMANA.map((dia) => (
                <div key={dia} className="bg-gray-50 py-2 text-center text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  {dia}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 flex-1">
              {renderCalendarDays()}
            </div>
          </div>
        )}
      </div>
    </div>

    <FinanceModalEnviarFatura
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      userEmail={userEmail}
    />

    {selectedFatura && (
      <FinanceModalDetalhesFatura
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        fatura={selectedFatura}
      />
    )}

    {faturaParaEditar && (
      <FinanceModalEditarDatas
        isOpen={isEditDateModalOpen}
        onClose={() => setIsEditDateModalOpen(false)}
        faturaId={faturaParaEditar.id}
        dataRespostaAtual={faturaParaEditar.data_resposta}
        dataRadarAtual={faturaParaEditar.data_radar}
      />
    )}
  </div>
)
}