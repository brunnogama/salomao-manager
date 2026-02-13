import React, { useState, useEffect } from 'react'
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
  X,
  Download
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { FinanceModalEnviarFatura } from '../components/FinanceModalEnviarFatura'
import { FinanceModalDetalhesFatura } from '../components/FinanceModalDetalhesFatura'
import { FinanceModalEditarDatas } from '../components/FinanceModalEditarDatas'
import { ConfirmationModal } from '../../../ui/ConfirmationModal'
import { useFinanceContasReceber, FaturaStatus, Fatura } from '../hooks/useFinanceContasReceber'
import { SearchableSelect } from '../../../crm/SearchableSelect'

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

  // Novos estados para filtros
  const [selectedClient, setSelectedClient] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Modal de Confirmação
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [transactionToActOn, setTransactionToActOn] = useState<{ id: string, name: string } | null>(null)

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

  const nextMonth = () => {
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

  const handleConfirmarPagamento = (e: React.MouseEvent, fatura: Fatura) => {
    e.stopPropagation();
    setTransactionToActOn({ id: fatura.id, name: fatura.cliente_nome });
    setIsConfirmModalOpen(true);
  };

  const executeConfirmarPagamento = async () => {
    if (transactionToActOn) {
      await confirmarPagamento(transactionToActOn.id);
      setIsConfirmModalOpen(false);
      setTransactionToActOn(null);
    }
  };

  const handleDeleteFatura = (e: React.MouseEvent, fatura: Fatura) => {
    e.stopPropagation();
    setTransactionToActOn({ id: fatura.id, name: fatura.cliente_nome });
    setIsDeleteModalOpen(true);
  };

  const executeDeleteFatura = async () => {
    if (transactionToActOn) {
      await excluirFatura(transactionToActOn.id);
      setIsDeleteModalOpen(false);
      setTransactionToActOn(null);
    }
  };

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




  const uniqueClients = Array.from(new Set(faturas.map(f => f.cliente_nome))).sort()

  const handleExport = () => {
    const dataToExport = filteredFaturas.map(f => ({
      ID: formatInvoiceId(f.id),
      Cliente: f.cliente_nome,
      'E-mail': f.cliente_email,
      Assunto: f.assunto,
      'Data Envio': new Date(f.data_envio).toLocaleDateString(),
      Status: f.status
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Faturas")
    XLSX.writeFile(wb, "Contas_a_Receber.xlsx")
  }

  const filteredFaturas = faturas.filter(f => {
    const matchesSearch = f.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.assunto?.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesTab = true;
    if (activeFilter === 'aguardando') matchesTab = f.status === 'aguardando_resposta';
    if (activeFilter === 'radar') matchesTab = f.status === 'radar';
    if (activeFilter === 'pago') matchesTab = f.status === 'pago';

    let matchesClient = true;
    if (selectedClient) {
      matchesClient = f.cliente_nome === selectedClient
    }

    let matchesDate = true;
    const faturaDate = new Date(f.data_envio)
    faturaDate.setHours(0, 0, 0, 0)

    if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0) // Ajuste para comparar apenas data
      // Ajuste de fuso horário se necessário, mas new Date("YYYY-MM-DD") é UTC, enquanto localDateString é local.
      // Melhor usar string comparison ou lib de data, mas para simplificar:
      // O input date retorna YYYY-MM-DD.
      // Vamos comparar timestamps zerados.
      // const start = new Date(startDate + 'T00:00:00')
      if (faturaDate < new Date(startDate + 'T00:00:00')) matchesDate = false
    }

    if (endDate) {
      if (faturaDate > new Date(endDate + 'T23:59:59')) matchesDate = false
    }

    return matchesSearch && matchesTab && matchesClient && matchesDate;
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
            onClick={handleExport}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-sm hover:bg-gray-50 transition-all active:scale-95"
          >
            <Download className="h-4 w-4" /> Exportar XLSX
          </button>
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

        {/* CONTROLS CARD - Search | Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-5 duration-600">
          <div className="flex flex-col xl:flex-row items-center gap-4">

            {/* TABS DE STATUS (Esquerda) */}
            <div className="flex bg-gray-100 p-1 rounded-xl shrink-0 mr-4">
              <button onClick={() => setActiveFilter('todos')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'todos' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Enviadas</button>
              <button onClick={() => setActiveFilter('aguardando')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'aguardando' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Aguardando</button>
              <button onClick={() => setActiveFilter('radar')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'radar' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Prazo Fatal</button>
              <button onClick={() => setActiveFilter('pago')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === 'pago' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Concluídas</button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex-1 shrink-0 focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 focus-within:border-[#1e3a8a] transition-all mr-4">
              <Search className="h-4 w-4 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Buscar..."
                className="bg-transparent border-none text-sm w-full outline-none text-gray-700 font-medium placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters Row (Direita) */}
            <div className="flex items-center gap-3 shrink-0">
              <SearchableSelect
                label=""
                placeholder="Cliente"
                value={selectedClient}
                onChange={setSelectedClient}
                options={uniqueClients.map(c => ({ id: c, name: c }))}
                className="min-w-[600px]"
                dropdownWidth={600}
                align="right"
              />

              {/* DATA FILTER */}
              <div className="bg-gray-100/50 border border-gray-200 rounded-xl p-3 flex items-center gap-3 h-[46px] min-w-fit hover:bg-white hover:border-[#1e3a8a] transition-all group cursor-pointer relative">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Período</span>
                  <div className="h-4 w-[1px] bg-gray-300 mx-1" />
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent text-xs font-medium text-gray-600 outline-none w-[90px] p-0 border-none focus:ring-0 cursor-pointer"
                    />
                    <span className="text-gray-400 text-[10px]">até</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent text-xs font-medium text-gray-600 outline-none w-[90px] p-0 border-none focus:ring-0 cursor-pointer"
                    />
                  </div>
                </div>
                {(startDate || endDate) && (
                  <button onClick={() => { setStartDate(''); setEndDate('') }} className="hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full p-0.5 transition-colors absolute right-2"><X className="h-3.5 w-3.5" /></button>
                )}
              </div>
            </div>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-6 duration-700 flex-1 flex flex-col min-h-[450px]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-32 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-[#1e3a8a]" />
              <p className="font-bold text-[10px] uppercase tracking-[0.3em]">Processando dados...</p>
            </div>
          )}

          {!loading && activeTab === 'lista' && (
            filteredFaturas.length > 0 ? (
              <div className="overflow-auto h-full custom-scrollbar">
                <table className="w-full">
                  <thead className="bg-gray-50/50 border-b border-gray-100 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-5 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] w-28">ID</th>
                      <th className="px-6 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Cliente</th>
                      <th className="px-6 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Assunto</th>
                      <th className="px-6 py-5 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Envio</th>
                      <th className="px-6 py-5 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Resposta</th>
                      <th className="px-6 py-5 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Prazo Fatal</th>
                      <th className="px-6 py-5 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                      <th className="px-6 py-5 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredFaturas.map((fatura) => {
                      const style = getStatusStyles(fatura.status);
                      const dataEnvio = new Date(fatura.data_envio);
                      let dataResposta = new Date(dataEnvio);
                      if (fatura.data_resposta) dataResposta = new Date(fatura.data_resposta);
                      else dataResposta.setDate(dataResposta.getDate() + 2);

                      let prazoFatal = new Date(dataEnvio);
                      if (fatura.data_radar) prazoFatal = new Date(fatura.data_radar);
                      else prazoFatal.setDate(prazoFatal.getDate() + 4);

                      return (
                        <tr
                          key={fatura.id}
                          onClick={() => handleOpenDetails(fatura)}
                          className="hover:bg-blue-50/30 cursor-pointer transition-colors group"
                        >
                          <td className="px-6 py-4 text-center">
                            <span className="text-[10px] font-black text-gray-400 whitespace-nowrap">{formatInvoiceId(fatura.id)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-[#0a192f]">{fatura.cliente_nome}</span>
                              <span className="text-[10px] text-gray-400 font-medium">{fatura.cliente_email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-gray-600 line-clamp-1">{fatura.assunto}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-[11px] font-bold text-gray-600">{dataEnvio.toLocaleDateString()}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-[11px] font-bold text-blue-600">{formatDate(dataResposta)}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg">{formatDate(prazoFatal)}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border ${style.bg.replace('bg-', 'text-').replace('600', '700')} bg-opacity-10 border-opacity-20`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${style.bg}`} />
                              {style.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {fatura.status !== 'pago' && (
                                <>
                                  <button onClick={(e) => handleConfirmarPagamento(e, fatura)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all hover:scale-110 active:scale-95" title="Confirmar Recebimento"><Check className="h-4 w-4" /></button>
                                  <button onClick={(e) => handleOpenEditDates(e, fatura)} className="p-2 text-[#1e3a8a] hover:bg-[#1e3a8a]/10 rounded-xl transition-all hover:scale-110 active:scale-95" title="Editar Prazos"><Pencil className="h-4 w-4" /></button>
                                </>
                              )}
                              <button onClick={(e) => handleDeleteFatura(e, fatura)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-110 active:scale-95" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                <FileText className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">Nenhuma fatura encontrada</p>
              </div>
            )
          )}

          {!loading && activeTab === 'calendario' && (
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

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDeleteFatura}
        title="Excluir Fatura"
        description={`Tem certeza que deseja excluir a fatura de ${transactionToActOn?.name}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeConfirmarPagamento}
        title="Confirmar Pagamento"
        description={`Deseja confirmar o pagamento da fatura de ${transactionToActOn?.name}?`}
        confirmText="Confirmar"
        cancelText="Cancelar"
        variant="success"
      />
    </div>
  )
}