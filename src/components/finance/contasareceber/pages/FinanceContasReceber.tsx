import { useState } from 'react'
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
  ChevronRight
} from 'lucide-react'
import { FinanceModalEnviarFatura } from '../components/FinanceModalEnviarFatura'
import { FinanceModalDetalhesFatura } from '../components/FinanceModalDetalhesFatura'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Estado para o modal de detalhes
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedFatura, setSelectedFatura] = useState<Fatura | null>(null)

  const [currentDate, setCurrentDate] = useState(new Date())
  const { faturas, loading, confirmarPagamento } = useFinanceContasReceber()

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const prevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  const nextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const handleOpenDetails = (fatura: Fatura) => {
    setSelectedFatura(fatura)
    setIsDetailsModalOpen(true)
  }

  const getStatusStyles = (status: FaturaStatus) => {
    switch (status) {
      case 'aguardando_resposta':
        return { bg: 'bg-blue-500', dot: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-100', icon: <Clock className="h-3 w-3" />, label: 'Aguardando (2d)' }
      case 'radar':
        return { bg: 'bg-amber-500', dot: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-100', icon: <AlertCircle className="h-3 w-3" />, label: 'No Radar (+2d)' }
      case 'contato_direto':
        return { bg: 'bg-red-500', dot: 'bg-red-500', text: 'text-red-700', border: 'border-red-100', icon: <Phone className="h-3 w-3" />, label: 'Contato Direto' }
      case 'pago':
        return { bg: 'bg-emerald-500', dot: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-100', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Recebido' }
      default:
        return { bg: 'bg-gray-400', dot: 'bg-gray-400', text: 'text-gray-700', border: 'border-gray-100', icon: <Clock className="h-3 w-3" />, label: 'Enviado' }
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

  const filteredFaturas = faturas.filter(f =>
    f.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

      <div className="max-w-7xl mx-auto space-y-6 w-full">

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
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium text-sm"
              />
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
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Data Envio</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Data Resposta (+2d)</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center text-red-500">Prazo Fatal (+4d)</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Valor</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredFaturas.map((fatura, index) => {
                      const style = getStatusStyles(fatura.status);
                      const dataEnvio = new Date(fatura.data_envio);

                      const dataResposta = new Date(dataEnvio);
                      dataResposta.setDate(dataResposta.getDate() + 2);

                      const prazoFatal = new Date(dataEnvio);
                      prazoFatal.setDate(prazoFatal.getDate() + 4);

                      return (
                        <tr
                          key={fatura.id}
                          className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                          onClick={() => handleOpenDetails(fatura)} // TODO: Implementar handleOpenDetails
                        >
                          <td className="px-6 py-4 text-center">
                            <span className="text-[10px] font-bold text-gray-300">#{String(index + 1).padStart(2, '0')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-[#0a192f] block">{fatura.cliente_nome}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs font-medium text-gray-500">{dataEnvio.toLocaleDateString('pt-BR')}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs font-medium text-blue-600">{dataResposta.toLocaleDateString('pt-BR')}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs font-bold text-red-600">{prazoFatal.toLocaleDateString('pt-BR')}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-black text-[#1e3a8a]">
                              {Number(fatura.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                                {style.icon}
                                <span className="text-[10px] font-black uppercase tracking-tighter">{style.label}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              {fatura.status !== 'pago' && (
                                <button onClick={() => handleConfirmarPagamento(fatura.id, fatura.cliente_nome)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Confirmar Recebimento"><Check className="h-4 w-4" /></button>
                              )}
                              <button className="p-2 text-gray-400 hover:text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-all"><FileText className="h-4 w-4" /></button>
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
                <Mail className="h-12 w-12 text-[#1e3a8a] opacity-20 mb-4" />
                <h2 className="text-xl font-black text-[#0a192f]">Nenhuma fatura encontrada</h2>
              </div>
            )
          ) : (
            <div className="flex flex-col h-full">
              <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
                {DIAS_SEMANA.map(d => (
                  <div key={d} className="py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{d}</div>
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

      <FinanceModalDetalhesFatura
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        fatura={selectedFatura}
      />
    </div>
  )
}