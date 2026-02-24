import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, RefreshCw, Calendar, XCircle, LayoutGrid, User, Monitor, Globe, FileText, LogIn, LogOut } from 'lucide-react'
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

interface ParsedDetails {
    info: string
    ip: string
    user_name: string
    page: string
    isAudit?: boolean
    tableName?: string
    recordId?: string
}

export function History() {
    const [logs, setLogs] = useState<LogItem[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'activities' | 'access'>('activities')

    // Estados de Filtro
    const [filter, setFilter] = useState('')
    const [moduleFilter, setModuleFilter] = useState('TODOS')
    const [actionFilter, setActionFilter] = useState('TODOS')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    const fetchLogs = async () => {
        setLoading(true)

        // Verificamos o papel do usuário primeiro
        const { data: { user } } = await supabase.auth.getUser()
        let userRole = 'viewer'
        if (user) {
            // First try by ID
            let { data: profile } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle()

            // If not found, try by email (more robust)
            if (!profile && user.email) {
                const { data: profileByEmail } = await supabase
                    .from('user_profiles')
                    .select('role')
                    .eq('email', user.email)
                    .maybeSingle()
                profile = profileByEmail
            }

            if (profile) userRole = profile.role || 'viewer'
        }

        let query = supabase
            .from('logs')
            .select('*')
            .order('created_at', { ascending: false })

        if (startDate) {
            query = query.gte('created_at', `${startDate}T00:00:00`)
        }
        if (endDate) {
            query = query.lte('created_at', `${endDate}T23:59:59`)
        }

        const { data: logsData, error: logsError } = await query.limit(500)

        let combinedLogs: any[] = logsData || []

        // Se for admin, buscamos também os audit_logs (retroativo/profundo)
        if (userRole === 'admin') {
            let auditQuery = supabase
                .from('audit_logs')
                .select('*')
                .order('changed_at', { ascending: false })

            if (startDate) {
                auditQuery = auditQuery.gte('changed_at', `${startDate}T00:00:00`)
            }
            if (endDate) {
                auditQuery = auditQuery.lte('changed_at', `${endDate}T23:59:59`)
            }

            const { data: auditData, error: auditError } = await auditQuery.limit(500)
            if (auditError) console.error('Erro ao buscar audit_logs:', auditError)

            if (auditData) {
                const mappedAudit = auditData.map((a: any) => ({
                    id: `audit-${a.id}`,
                    created_at: a.changed_at,
                    user_email: a.user_email || 'Sistema',
                    action: a.action,
                    module: 'BANCO (Audit)',
                    details: JSON.stringify({
                        info: `Alteração profunda na tabela ${a.table_name}`,
                        ip: 'BANCO',
                        user_name: a.user_email?.split('@')[0] || 'Sistema',
                        page: a.table_name,
                        isAudit: true,
                        tableName: a.table_name,
                        recordId: a.record_id
                    })
                }))
                combinedLogs = [...combinedLogs, ...mappedAudit].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
            }
        }

        if (logsError) {
            console.error(logsError)
        } else {
            setLogs(combinedLogs)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchLogs()
    }, [startDate, endDate])

    const clearFilters = () => {
        setFilter('')
        setModuleFilter('TODOS')
        setActionFilter('TODOS')
        setStartDate('')
        setEndDate('')
    }

    const parseLogDetails = (details: string): ParsedDetails => {
        try {
            if (details.startsWith('{')) {
                return JSON.parse(details)
            }
        } catch (e) {
            // Not JSON
        }
        return {
            info: details,
            ip: '---',
            user_name: '',
            page: ''
        }
    }

    const filteredLogs = logs.filter(log => {
        const parsed = parseLogDetails(log.details)
        const isAuthAction = ['LOGIN', 'LOGOUT'].includes(log.action)

        // Filtro por Aba
        if (activeTab === 'activities' && isAuthAction) return false
        if (activeTab === 'access' && !isAuthAction) return false

        const matchesText =
            log.user_email.toLowerCase().includes(filter.toLowerCase()) ||
            parsed.user_name.toLowerCase().includes(filter.toLowerCase()) ||
            parsed.info.toLowerCase().includes(filter.toLowerCase()) ||
            log.action.toLowerCase().includes(filter.toLowerCase()) ||
            parsed.ip.toLowerCase().includes(filter.toLowerCase())

        const matchesModule = moduleFilter === 'TODOS' ? true : (log.module === moduleFilter || parsed.page === moduleFilter)
        const matchesAction = actionFilter === 'TODOS' ? true : log.action === actionFilter

        return matchesText && matchesModule && matchesAction
    })

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CRIAR': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
            case 'EDITAR': return 'bg-blue-50 text-blue-700 border-blue-100'
            case 'EXCLUIR': return 'bg-red-50 text-red-700 border-red-100'
            case 'EXPORTAR': return 'bg-amber-50 text-amber-700 border-amber-100'
            case 'LOGIN': return 'bg-indigo-50 text-indigo-700 border-indigo-100'
            case 'LOGOUT': return 'bg-slate-50 text-slate-700 border-slate-100'
            default: return 'bg-gray-50 text-gray-700 border-gray-100'
        }
    }

    const handleExport = () => {
        const exportData = filteredLogs.map(log => {
            const parsed = parseLogDetails(log.details)
            return {
                'Data/Hora': new Date(log.created_at).toLocaleString('pt-BR'),
                'E-mail': log.user_email,
                'Nome': parsed.user_name || log.user_email.split('@')[0],
                'IP': parsed.ip,
                'Módulo/Página': parsed.page || log.module,
                'Ação': log.action,
                'Detalhes': parsed.info
            }
        })
        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Logs")
        XLSX.writeFile(wb, `Historico_${activeTab === 'activities' ? 'Atividades' : 'Acessos'}.xlsx`)
    }

    const formatAuditInfo = (parsed: ParsedDetails) => {
        if (!parsed.isAudit) return parsed.info
        return (
            <div className="flex flex-col gap-1">
                <span className="font-black text-[#1e3a8a]">{parsed.info}</span>
                <span className="text-[9px] opacity-70">Registro ID: {parsed.recordId}</span>
            </div>
        )
    }

    // Obter lista única de páginas/módulos para o filtro
    const uniquePages = Array.from(new Set(logs.map(log => {
        const parsed = parseLogDetails(log.details)
        return parsed.page || log.module
    }))).sort()

    return (
        <div className="h-full flex flex-col space-y-4 sm:space-y-6 bg-transparent">

            {/* HEADER E ABAS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200 shadow-sm w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab('activities')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'activities'
                            ? 'bg-[#0a192f] text-white shadow-lg'
                            : 'text-gray-500 hover:bg-white hover:text-[#0a192f]'
                            }`}
                    >
                        <FileText className="h-4 w-4" />
                        Atividades
                    </button>
                    <button
                        onClick={() => setActiveTab('access')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'access'
                            ? 'bg-[#0a192f] text-white shadow-lg'
                            : 'text-gray-500 hover:bg-white hover:text-[#0a192f]'
                            }`}
                    >
                        <Monitor className="h-4 w-4" />
                        Acessos
                    </button>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={fetchLogs} className="p-2 sm:px-4 sm:py-2 text-gray-500 hover:text-[#112240] bg-white border border-gray-200 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2" title="Atualizar">
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline text-xs font-bold">Sincronizar</span>
                    </button>
                    <button onClick={handleExport} className="flex-1 sm:flex-none px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 shadow-sm transition-all text-center">
                        Exportar
                    </button>
                </div>
            </div>

            {/* BARRA DE FILTROS */}
            <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 bg-white/80 p-4 rounded-2xl shadow-sm border border-gray-100 relative z-20">

                <div className="flex flex-wrap items-center gap-3 w-full">
                    {/* Busca Texto */}
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar colaborador, IP, informação..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#0a192f] focus:ring-4 focus:ring-[#0a192f]/5 transition-all"
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                        />
                    </div>

                    {/* Filtro Página/Módulo */}
                    {activeTab === 'activities' && (
                        <div className="w-full sm:w-auto min-w-[160px]">
                            <FilterSelect
                                icon={LayoutGrid}
                                value={moduleFilter}
                                onChange={setModuleFilter}
                                options={[
                                    { label: 'Todos os Módulos', value: 'TODOS' },
                                    ...uniquePages.map(page => ({ label: page, value: page }))
                                ]}
                                placeholder="Módulo/Página"
                                clearValue="TODOS"
                            />
                        </div>
                    )}

                    {/* Filtro Tipo Ação (Apenas na aba Atividades) */}
                    {activeTab === 'activities' && (
                        <div className="w-full sm:w-auto min-w-[160px]">
                            <FilterSelect
                                icon={FileText}
                                value={actionFilter}
                                onChange={setActionFilter}
                                options={[
                                    { label: 'Todas as Ações', value: 'TODOS' },
                                    { label: 'CRIAR', value: 'CRIAR' },
                                    { label: 'EDITAR', value: 'EDITAR' },
                                    { label: 'EXCLUIR', value: 'EXCLUIR' },
                                    { label: 'EXPORTAR', value: 'EXPORTAR' },
                                    { label: 'RESET', value: 'RESET' },
                                    { label: 'UPDATE', value: 'UPDATE' }
                                ]}
                                placeholder="Ação"
                                clearValue="TODOS"
                            />
                        </div>
                    )}

                    {/* Filtros de Data */}
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1.5 px-4 shadow-sm">
                        <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                className="text-xs font-bold outline-none text-gray-600 bg-transparent"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                            <span className="text-gray-300 font-bold text-[10px] uppercase tracking-tighter">até</span>
                            <input
                                type="date"
                                className="text-xs font-bold outline-none text-gray-600 bg-transparent"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                        {(startDate || endDate || filter || moduleFilter !== 'TODOS' || actionFilter !== 'TODOS') && (
                            <button onClick={clearFilters} className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Limpar Filtros">
                                <XCircle className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* TABELA DE LOGS */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col relative">
                {/* Decorative subtle stripe at top */}
                <div className="h-1 w-full bg-gradient-to-r from-[#0a192f] via-[#1e3a8a] to-[#0a192f]"></div>

                <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                    <table className="min-w-[1000px] w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Data / Hora</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Colaborador</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">IP / Dispositivo</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Local / Página</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Ação Realizada</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Informação Detalhada</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <RefreshCw className="h-8 w-8 text-blue-200 animate-spin" />
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Carregando Histórico...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                                            <Search className="h-12 w-12 text-gray-300" />
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Nenhum registro encontrado</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.map((log) => {
                                const parsed = parseLogDetails(log.details)

                                return (
                                    <tr key={log.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-[#0a192f]">
                                                    {new Date(log.created_at).toLocaleDateString('pt-BR')}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 mt-0.5">
                                                    {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
                                                    <User className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">
                                                        {parsed.user_name || log.user_email.split('@')[0].replace('.', ' ')}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-gray-400">{log.user_email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Globe className="h-3 w-3 opacity-50" />
                                                <span className="text-[10px] font-mono font-bold bg-gray-50 px-2 py-0.5 rounded border border-gray-100 italic">
                                                    {parsed.ip}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <LayoutGrid className="h-3 w-3 text-gray-300" />
                                                <span className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-wide">
                                                    {parsed.page || log.module}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {log.action === 'LOGIN' && <LogIn className="h-3 w-3 text-indigo-500" />}
                                                {log.action === 'LOGOUT' && <LogOut className="h-3 w-3 text-slate-500" />}
                                                <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border tracking-widest uppercase ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 min-w-[300px]">
                                            <div className="text-[11px] font-medium text-gray-600 leading-relaxed italic">
                                                {formatAuditInfo(parsed)}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
