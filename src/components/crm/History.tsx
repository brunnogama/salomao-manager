// src/components/crm/History.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, RefreshCw, Calendar, XCircle, LayoutGrid } from 'lucide-react'
import XLSX from 'xlsx-js-style'
import { FilterSelect } from '../controladoria/ui/FilterSelect'

interface LogItem {
  id: number
  created_at: string
  user_email: string
  action: string
  module: string
  details: string
}

export function History() {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(true)

  // Estados de Filtro
  const [filter, setFilter] = useState('')
  const [moduleFilter, setModuleFilter] = useState('TODOS')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchLogs = async () => {
    setLoading(true)

    let query = supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false })

    // Aplica filtro de data no banco se selecionado
    if (startDate) {
      query = query.gte('created_at', `${startDate}T00:00:00`)
    }
    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59`)
    }

    // Se houver filtro de data, aumenta o limite para garantir que o usuário veja tudo no período
    // Se não, mantém os últimos 100 para performance
    if (startDate || endDate) {
      query = query.limit(1000)
    } else {
      query = query.limit(100)
    }

    const { data, error } = await query

    if (error) {
      console.error(error)
    } else {
      setLogs(data || [])
    }
    setLoading(false)
  }

  // Recarrega sempre que mudar as datas
  useEffect(() => {
    fetchLogs()
  }, [startDate, endDate])

  const clearDateFilters = () => {
    setStartDate('')
    setEndDate('')
  }

  const filteredLogs = logs.filter(log => {
    const matchesText =
      log.user_email.toLowerCase().includes(filter.toLowerCase()) ||
      log.details.toLowerCase().includes(filter.toLowerCase()) ||
      log.action.toLowerCase().includes(filter.toLowerCase())

    const matchesModule = moduleFilter === 'TODOS' ? true : log.module === moduleFilter

    return matchesText && matchesModule
  })

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CRIAR': return 'bg-green-100 text-green-700 border-green-200'
      case 'EDITAR': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'EXCLUIR': return 'bg-red-100 text-red-700 border-red-200'
      case 'EXPORTAR': return 'bg-orange-100 text-orange-700 border-orange-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filteredLogs)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Logs")
    XLSX.writeFile(wb, "Historico_Atividades.xlsx")
  }

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* BARRA DE FILTROS */}
      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full xl:w-auto">
          {/* Busca Texto */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#112240] transition-colors"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>

          {/* Filtro Módulo */}
          <div className="w-full md:w-auto">
            <FilterSelect
              icon={LayoutGrid}
              value={moduleFilter}
              onChange={setModuleFilter}
              options={[
                { label: 'Todos', value: 'TODOS' },
                { label: 'Clientes', value: 'CLIENTES' },
                { label: 'Kanban', value: 'KANBAN' },
                { label: 'Config', value: 'CONFIG' },
                { label: 'Incompletos', value: 'INCOMPLETOS' }
              ]}
              placeholder="Módulo"
            />
          </div>

          {/* Filtros de Data */}
          <div className="flex items-center gap-2 w-full md:w-auto bg-white border border-gray-200 rounded-lg p-1.5 px-3">
            <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
            <div className="flex items-center gap-2 overflow-x-auto">
              <input
                type="date"
                className="text-sm outline-none text-gray-600 bg-transparent"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                title="Data Início"
              />
              <span className="text-gray-400 text-xs shrink-0">até</span>
              <input
                type="date"
                className="text-sm outline-none text-gray-600 bg-transparent"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                title="Data Fim"
              />
            </div>
            {(startDate || endDate) && (
              <button onClick={clearDateFilters} className="ml-auto text-gray-400 hover:text-red-500 shrink-0">
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2 w-full xl:w-auto">
          <button onClick={fetchLogs} className="p-2 text-gray-500 hover:text-[#112240] bg-white border border-gray-200 rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center shrink-0" title="Atualizar">
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleExport} className="flex-1 xl:flex-none px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 shadow-sm transition-all text-center">
            Exportar Logs
          </button>
        </div>
      </div>

      {/* TABELA DE LOGS */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
          <div className="min-w-[800px]">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240] sticky top-0 z-10">
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Data/Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Usuário</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Módulo</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Ação</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Detalhes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading && logs.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Carregando histórico...</td></tr>
                ) : filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
                      {log.user_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {log.module}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLogs.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Search className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">Nenhum registro encontrado com os filtros atuais.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
