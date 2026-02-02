// src/components/crm/Clients.tsx
import { useEffect, useState, useMemo, useRef, Fragment } from 'react'
import { supabase } from '../../lib/supabase'
import { Menu, Transition } from '@headlessui/react'
import { utils, writeFile, read } from 'xlsx'
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Check, 
  MessageCircle, 
  Trash2, 
  Pencil, 
  Mail, 
  Phone, 
  Briefcase, 
  Info, 
  Printer, 
  FileSpreadsheet,
  Upload, 
  Loader2, 
  AlertTriangle, 
  LayoutGrid, 
  List,
  Plus,
  X,
  Users,
  Building2,
  MoreVertical,
  Gift,
  UserCircle
} from 'lucide-react'
import { NewClientModal } from './NewClientModal'
import { ClientData, getBrindeColors } from '../../types/client'
import { logAction } from '../../lib/logger'

interface ClientsProps {
  initialFilters?: { socio?: string; brinde?: string };
  tableName?: string;
}

export function Clients({ initialFilters, tableName = 'clientes' }: ClientsProps) {
  const [clients, setClients] = useState<ClientData[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clientToEdit, setClientToEdit] = useState<ClientData | null>(null)
  const [viewType, setViewType] = useState<'cards' | 'list'>(() => 
    (localStorage.getItem('clientsViewType') as 'cards' | 'list') || 'list'
  )
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSocio, setFilterSocio] = useState<string>('')
  const [filterBrinde, setFilterBrinde] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest')

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
    const { data, error } = await supabase.from(tableName).select('*')
    if (!error && data) setClients(data as ClientData[])
    setLoading(false)
  }

  const handleDeleteClient = async (client: ClientData, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`Excluir ${client.nome}?`)) {
      await supabase.from(tableName).delete().eq('id', client.id)
      await logAction('DELETE', tableName.toUpperCase(), `Excluiu ${client.nome}`)
      fetchClients()
    }
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
    <div className="flex flex-col h-full space-y-6">
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

      {/* PAGE HEADER COMPLETO */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        {/* Left: Título e Ícone */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <Users className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Clientes CRM
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Gerencie o cadastro completo de clientes
            </p>
          </div>
        </div>

        {/* Right: Filters + Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Filtro Sócio */}
          <div className="relative min-w-[140px]">
            <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <select 
              value={filterSocio} 
              onChange={e => setFilterSocio(e.target.value)} 
              className="w-full pl-9 pr-3 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none bg-white transition-all appearance-none cursor-pointer hover:border-[#1e3a8a]/30"
            >
              <option value="">Todos Sócios</option>
              {availableSocios.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Filtro Brinde */}
          <div className="relative min-w-[140px]">
            <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <select 
              value={filterBrinde} 
              onChange={e => setFilterBrinde(e.target.value)} 
              className="w-full pl-9 pr-3 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none bg-white transition-all appearance-none cursor-pointer hover:border-[#1e3a8a]/30"
            >
              <option value="">Todos Brindes</option>
              {availableBrindes.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Botão Novo */}
          <button 
            onClick={() => {setClientToEdit(null); setIsModalOpen(true)}} 
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a8a] hover:bg-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Novo
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-200">
        {/* Barra de Ferramentas */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {/* Card de Total */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-2.5 flex items-center gap-3 hover:shadow-md transition-all">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-md">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div className="border-l border-gray-200 pl-3">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Total</p>
                <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">{clients.length}</p>
              </div>
            </div>

            {/* Barra de Busca */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  placeholder="Buscar cliente..." 
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none bg-white transition-all" 
                />
              </div>
            </div>

            {hasActiveFilters && (
              <button 
                onClick={() => {setSearchTerm(''); setFilterSocio(''); setFilterBrinde('')}} 
                className="flex items-center gap-2 px-3 py-2.5 text-[9px] font-black text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all uppercase tracking-[0.2em]"
              >
                <X className="h-3.5 w-3.5"/> Limpar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <button 
                onClick={() => {setViewType('cards'); localStorage.setItem('clientsViewType', 'cards')}} 
                className={`p-2.5 transition-all ${viewType === 'cards' ? 'bg-gradient-to-br from-[#1e3a8a] to-[#112240] text-white shadow-inner' : 'bg-transparent text-gray-600 hover:bg-gray-50'}`}
              >
                <LayoutGrid className="h-4 w-4"/>
              </button>
              <button 
                onClick={() => {setViewType('list'); localStorage.setItem('clientsViewType', 'list')}} 
                className={`p-2.5 border-l border-gray-200 transition-all ${viewType === 'list' ? 'bg-gradient-to-br from-[#1e3a8a] to-[#112240] text-white shadow-inner' : 'bg-transparent text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="h-4 w-4"/>
              </button>
            </div>

            {/* Botões de Ação */}
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-[#1e3a8a]/30 transition-all"
              title="Importar"
            >
              <Upload className="h-4 w-4"/>
            </button>

            <button 
              onClick={handleExportExcel} 
              className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-[#1e3a8a]/30 transition-all"
              title="Exportar"
            >
              <FileSpreadsheet className="h-4 w-4"/>
            </button>
          </div>
        </div>

        {/* Listagem */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-[#1e3a8a]" /></div>
          ) : processedClients.length === 0 ? (
            <div className="py-20 text-center text-gray-500">
              <AlertTriangle className="mx-auto h-12 w-12 mb-2 text-gray-300" />
              <p className="font-bold text-[#0a192f]">Nenhum registro encontrado</p>
            </div>
          ) : viewType === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {processedClients.map(c => <ClientCard key={c.id} client={c} onEdit={setClientToEdit} onOpenModal={() => setIsModalOpen(true)} onDelete={handleDeleteClient} />)}
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
                  {processedClients.map(c => <ClientRow key={c.id} client={c} onEdit={setClientToEdit} onOpenModal={() => setIsModalOpen(true)} onDelete={handleDeleteClient} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// --- SUB-COMPONENTS ---
function ClientCard({ client, onEdit, onOpenModal, onDelete }: any) {
  const colors = getBrindeColors(client.tipo_brinde)
  return (
    <div 
      onClick={() => { onEdit(client); onOpenModal(); }} 
      className="relative bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:scale-[1.02] hover:border-[#1e3a8a]/30 transition-all duration-300 cursor-pointer group overflow-hidden"
    >
      {/* Gradient decorativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Header do Card */}
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white font-black text-sm shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
            {client.nome[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-[#0a192f] truncate text-base group-hover:text-[#1e3a8a] transition-colors">
              {client.nome}
            </h3>
            <div className="flex items-center gap-1.5 text-gray-500 mt-1">
              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
              <p className="text-xs truncate font-medium">{client.empresa}</p>
            </div>
          </div>
        </div>
        
        {/* Menu de Ações */}
        <Menu as="div" className="relative z-10">
          <Menu.Button 
            onClick={(e) => e.stopPropagation()} 
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreVertical className="h-4 w-4" />
          </Menu.Button>
          <Transition as={Fragment}>
            <Menu.Items className="absolute right-0 mt-1 w-40 bg-white shadow-xl border border-gray-200 rounded-xl py-1.5 z-50">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(client); onOpenModal(); }}
                    className={`${active ? 'bg-gray-50' : ''} w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 text-gray-700 font-semibold transition-colors`}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={(e) => onDelete(client, e)}
                    className={`${active ? 'bg-gray-50' : ''} w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 text-red-600 font-semibold transition-colors`}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Badge Tipo Brinde */}
      <div className="relative mb-4 pb-4 border-b border-gray-100">
        <span className={`inline-block px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${colors.badge}`}>
          {client.tipo_brinde}
        </span>
      </div>

      {/* Info do Sócio */}
      <div className="relative mb-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-200">
            <Briefcase className="h-3.5 w-3.5 text-gray-500" />
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Sócio</p>
            <p className="text-sm font-black text-[#0a192f]">{client.socio}</p>
          </div>
        </div>
      </div>

      {/* Ações de Contato */}
      <div className="relative flex gap-2">
        {client.telefone && (
          <button 
            onClick={(e) => {e.stopPropagation(); window.open(`https://wa.me/55${client.telefone.replace(/\D/g,'')}`)}} 
            className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:shadow-sm transition-all group/btn"
            title="WhatsApp"
          >
            <MessageCircle className="h-4 w-4 text-green-600 group-hover/btn:scale-110 transition-transform" />
            <span className="text-xs font-bold text-gray-700">WhatsApp</span>
          </button>
        )}
        {client.email && (
          <button 
            onClick={(e) => {e.stopPropagation(); window.open(`mailto:${client.email}`)}} 
            className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:shadow-sm transition-all group/btn"
            title="E-mail"
          >
            <Mail className="h-4 w-4 text-blue-600 group-hover/btn:scale-110 transition-transform" />
            <span className="text-xs font-bold text-gray-700">E-mail</span>
          </button>
        )}
      </div>
    </div>
  )
}

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
        <div className="flex items-center gap-2">
          {client.telefone && (
            <button 
              onClick={(e) => {e.stopPropagation(); window.open(`https://wa.me/55${client.telefone.replace(/\D/g,'')}`)}} 
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:shadow-sm transition-all"
              title="WhatsApp"
            >
              <MessageCircle className="h-4 w-4 text-green-600" />
            </button>
          )}
          {client.email && (
            <button 
              onClick={(e) => {e.stopPropagation(); window.open(`mailto:${client.email}`)}} 
              className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:shadow-sm transition-all"
              title="E-mail"
            >
              <Mail className="h-4 w-4 text-blue-600" />
            </button>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(client); onOpenModal(); }} 
            className="p-2 text-[#1e3a8a] hover:bg-[#1e3a8a]/10 rounded-xl transition-all hover:scale-110 active:scale-95"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button 
            onClick={(e) => onDelete(client, e)} 
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
