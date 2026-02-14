// src/components/crm/Clients.tsx
import { useEffect, useState, useMemo, useRef, Fragment } from 'react'
import { supabase } from '../../lib/supabase'
import { Menu, Transition } from '@headlessui/react'
import { utils, writeFile, read } from 'xlsx'
import {
  Search,
  MessageCircle,
  Trash2,
  Pencil,
  Mail,
  Briefcase,
  FileSpreadsheet,
  Upload,
  Loader2,
  AlertTriangle,
  Plus,
  X,
  Users,
  Building2,
  Gift,
  UserCircle,
  LogOut,
  Grid
} from 'lucide-react'
import { NewClientModal } from './NewClientModal'
import { ClientData, getBrindeColors } from '../../types/client'
import { logAction } from '../../lib/logger'

interface ClientsProps {
  initialFilters?: { socio?: string; brinde?: string };
  tableName?: string;
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function Clients({
  initialFilters,
  tableName = 'clientes',
  userName = 'Usuário',
  onModuleHome,
  onLogout
}: ClientsProps) {
  const [clients, setClients] = useState<ClientData[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clientToEdit, setClientToEdit] = useState<ClientData | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<ClientData | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSocio, setFilterSocio] = useState<string>('')
  const [filterBrinde, setFilterBrinde] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest')

  // Ajustado para garantir que os sócios disponíveis no filtro venham da lista carregada de clientes
  const availableSocios = useMemo(() =>
    Array.from(new Set(clients.map(c => c.socio).filter(Boolean))).sort(), [clients]
  )
  const availableBrindes = useMemo(() =>
    Array.from(new Set(clients.map(c => c.tipo_brinde).filter(Boolean))), [clients]
  )

  useEffect(() => { fetchClients() }, [tableName])
  useEffect(() => {
    if (initialFilters?.socio) setFilterSocio(initialFilters.socio)
    if (initialFilters?.brinde) setFilterBrinde(initialFilters.brinde)
  }, [initialFilters])

  const fetchClients = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from(tableName)
      .select('*, contracts!inner(status)')
      .in('contracts.status', ['proposal_sent', 'closed'])
    if (!error && data) setClients(data as ClientData[])
    setLoading(false)
  }

  const handleDeleteClient = async (client: ClientData) => {
    await supabase.from(tableName).delete().eq('id', client.id)
    await logAction('DELETE', tableName.toUpperCase(), `Excluiu ${client.nome}`)
    setDeleteConfirm(null)
    fetchClients()
  }

  const processedClients = useMemo(() => {
    let filtered = clients.filter(c => {
      const matchSearch = !searchTerm || [c.nome, c.empresa, c.email].some(f => f?.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchSocio = !filterSocio || c.socio === filterSocio
      const matchBrinde = !filterBrinde || c.tipo_brinde === filterBrinde
      return matchSearch && matchSocio && matchBrinde
    })
    filtered.sort((a, b) => {
      if (sortOrder === 'newest') return (b.id || 0) - (a.id || 0)
      if (sortOrder === 'oldest') return (a.id || 0) - (b.id || 0)
      return sortOrder === 'az' ? (a.nome || '').localeCompare(b.nome || '') : (b.nome || '').localeCompare(a.nome || '')
    })
    return filtered
  }, [clients, searchTerm, filterSocio, filterBrinde, sortOrder])

  const handleExportExcel = () => {
    const ws = utils.json_to_sheet(processedClients)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, "Clientes")
    writeFile(wb, `${tableName}_export.xlsx`)
  }

  const hasActiveFilters = searchTerm || filterSocio || filterBrinde

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">
      <input ref={fileInputRef} type="file" accept=".xlsx, .xls" onChange={async (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        setImporting(true);
        try {
          const data = await file.arrayBuffer();
          const jsonData = utils.sheet_to_json(read(data).Sheets[read(data).SheetNames[0]]);
          await supabase.from(tableName).insert(jsonData);
          fetchClients();
        } catch (err: any) { alert(err.message) } finally { setImporting(false) }
      }} className="hidden" />

      <NewClientModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setClientToEdit(null) }}
        onSave={fetchClients}
        clientToEdit={clientToEdit}
        tableName={tableName}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 text-white flex items-center justify-between">
              <h2 className="text-lg font-black">Confirmar Exclusão</h2>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-xl bg-red-50 border-2 border-red-200">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#0a192f] mb-2">
                    Tem certeza que deseja excluir este cliente?
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-bold">{deleteConfirm.nome}</span>
                    <br />
                    {deleteConfirm.empresa && <span className="text-xs text-gray-500">{deleteConfirm.empresa}</span>}
                  </p>
                  <p className="text-xs text-red-600 mt-3 font-semibold">
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteClient(deleteConfirm)}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE HEADER - Padrão Presencial */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <Users className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Clientes CRM
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Gestão completa de clientes e contatos
            </p>
          </div>
        </div>

        {/* Right: User Info & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Conectado</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white shadow-md">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && (
            <button
              onClick={onModuleHome}
              className="p-2 text-gray-600 hover:bg-gray-100 hover:text-[#1e3a8a] rounded-lg transition-all"
              title="Voltar aos módulos"
            >
              <Grid className="h-5 w-5" />
            </button>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">

        {/* Barra de Filtros Reorganizada */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <div className="flex items-center gap-3 overflow-x-auto">
            {/* Card Total */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-2.5 flex items-center gap-3 hover:shadow-md transition-all flex-shrink-0">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#1e3a8a] to-[#112240]">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div className="border-l border-gray-200 pl-3">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Total</p>
                <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">{clients.length}</p>
              </div>
            </div>

            {/* Busca Expandida */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none bg-white transition-all hover:border-[#1e3a8a]/30"
                />
              </div>
            </div>

            {/* Filtro Sócio */}
            <div className="relative min-w-[160px] flex-shrink-0">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
              <select
                value={filterSocio}
                onChange={e => setFilterSocio(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none bg-white transition-all appearance-none cursor-pointer hover:border-[#1e3a8a]/30"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em'
                }}
              >
                <option value="">Todos Sócios</option>
                {availableSocios.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Filtro Brinde */}
            <div className="relative min-w-[160px] flex-shrink-0">
              <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
              <select
                value={filterBrinde}
                onChange={e => setFilterBrinde(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none bg-white transition-all appearance-none cursor-pointer hover:border-[#1e3a8a]/30"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em'
                }}
              >
                <option value="">Todos Brindes</option>
                {availableBrindes.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => { setSearchTerm(''); setFilterSocio(''); setFilterBrinde('') }}
                className="flex items-center gap-2 px-3 py-2.5 text-[9px] font-black text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all uppercase tracking-[0.2em] flex-shrink-0"
              >
                <X className="h-3.5 w-3.5" /> Limpar
              </button>
            )}

            {/* Actions - Importar, Exportar, Novo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 bg-[#1e3a8a] hover:bg-[#112240] text-white rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
                title="Importar"
              >
                <Upload className="h-5 w-5" />
              </button>

              <button
                onClick={handleExportExcel}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
                title="Exportar"
              >
                <FileSpreadsheet className="h-5 w-5" />
              </button>

              <button
                onClick={() => { setClientToEdit(null); setIsModalOpen(true) }}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a8a] hover:bg-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" /> Novo
              </button>
            </div>
          </div>
        </div>

        {/* Listagem - Sempre em modo Lista */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-[#1e3a8a]" /></div>
          ) : processedClients.length === 0 ? (
            <div className="py-20 text-center text-gray-500">
              <AlertTriangle className="mx-auto h-12 w-12 mb-2 text-gray-300" />
              <p className="font-bold text-[#0a192f]">Nenhum registro encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Cliente</th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Empresa</th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Sócio</th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Brinde</th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Contato</th>
                    <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {processedClients.map(c => (
                    <ClientRow
                      key={c.id}
                      client={c}
                      onEdit={setClientToEdit}
                      onOpenModal={() => setIsModalOpen(true)}
                      onDelete={setDeleteConfirm}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// --- CLIENT ROW COMPONENT ---
function ClientRow({ client, onEdit, onOpenModal, onDelete }: any) {
  const colors = getBrindeColors(client.tipo_brinde)
  return (
    <tr
      onClick={() => { onEdit(client); onOpenModal(); }}
      className="hover:bg-blue-50/40 cursor-pointer transition-all duration-200 group"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white font-black text-sm shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
            {client.nome[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-black text-[#0a192f] group-hover:text-[#1e3a8a] transition-colors">{client.nome}</p>
            <p className="text-xs text-gray-500 font-medium">{client.cargo || 'Sem cargo'}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700 font-medium">{client.empresa}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-bold text-[#0a192f]">{client.socio}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-block px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${colors.badge}`}>
          {client.tipo_brinde}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {client.email && (
            <button
              onClick={() => window.open(`mailto:${client.email}`)}
              className="p-2 rounded-full border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-500 hover:shadow-sm transition-all"
              title="E-mail"
            >
              <Mail className="h-4 w-4 text-blue-600" />
            </button>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { onEdit(client); onOpenModal(); }}
            className="p-2 text-[#1e3a8a] hover:bg-[#1e3a8a]/10 rounded-xl transition-all hover:scale-110 active:scale-95"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(client)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-110 active:scale-95"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}