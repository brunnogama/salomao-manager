import { useEffect, useState, useMemo, useRef, Fragment } from 'react'
import { supabase } from '../lib/supabase'
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
  MoreVertical
} from 'lucide-react'
import { NewClientModal } from './NewClientModal'
import { ClientData, getBrindeColors } from '../types/client'
import { logAction } from '../lib/logger'

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
    <div className="p-4 sm:p-6 space-y-5">
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

      <div className="bg-gradient-to-br from-white via-white to-slate-50/30 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 overflow-hidden backdrop-blur-sm">
        {/* Header de Ações */}
        <div className="p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200/60 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {/* Card de Total */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-300/50 shadow-sm px-4 py-2.5 flex items-center gap-3 hover:shadow-md transition-all">
              <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg border border-slate-200/50">
                <Users className="h-4 w-4 text-slate-700" />
              </div>
              <div className="border-l border-slate-200 pl-3">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total</p>
                <p className="text-lg font-bold text-slate-900">{clients.length}</p>
              </div>
            </div>

            {/* Barra de Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  placeholder="Buscar cliente..." 
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300/60 rounded-xl focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 outline-none bg-white/70 backdrop-blur-sm transition-all shadow-sm hover:shadow" 
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtros Dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="p-2.5 rounded-xl border border-slate-300/60 bg-white/80 backdrop-blur-sm text-slate-600 hover:bg-white hover:shadow-md transition-all">
                <Filter className="h-4 w-4" />
              </Menu.Button>
              <Transition as={Fragment} enter="transition duration-100" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100">
                <Menu.Items className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md shadow-xl border border-slate-200/60 rounded-xl p-4 z-50">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Sócio</label>
                      <select value={filterSocio} onChange={e => setFilterSocio(e.target.value)} className="w-full border border-slate-300/60 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-slate-400/20 outline-none bg-white shadow-sm">
                        <option value="">Todos</option>{availableSocios.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Tipo Brinde</label>
                      <select value={filterBrinde} onChange={e => setFilterBrinde(e.target.value)} className="w-full border border-slate-300/60 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-slate-400/20 outline-none bg-white shadow-sm">
                        <option value="">Todos</option>{availableBrindes.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            {hasActiveFilters && (
              <button 
                onClick={() => {setSearchTerm(''); setFilterSocio(''); setFilterBrinde('')}} 
                className="px-3 py-2 text-xs font-bold text-slate-600 bg-white/80 backdrop-blur-sm border border-slate-300/60 rounded-xl hover:bg-white hover:shadow-md flex items-center gap-1.5 transition-all"
              >
                <X className="h-3.5 w-3.5"/> Limpar
              </button>
            )}

            <div className="flex border border-slate-300/60 rounded-xl overflow-hidden bg-white/50 backdrop-blur-sm shadow-sm">
              <button 
                onClick={() => {setViewType('cards'); localStorage.setItem('clientsViewType', 'cards')}} 
                className={`p-2 transition-all ${viewType === 'cards' ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-white shadow-inner' : 'bg-transparent text-slate-600 hover:bg-slate-50'}`}
              >
                <LayoutGrid className="h-4 w-4"/>
              </button>
              <button 
                onClick={() => {setViewType('list'); localStorage.setItem('clientsViewType', 'list')}} 
                className={`p-2 border-l border-slate-300/60 transition-all ${viewType === 'list' ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-white shadow-inner' : 'bg-transparent text-slate-600 hover:bg-slate-50'}`}
              >
                <List className="h-4 w-4"/>
              </button>
            </div>

            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="p-2.5 rounded-xl border border-slate-300/60 bg-white/80 backdrop-blur-sm text-slate-600 hover:bg-white hover:shadow-md transition-all"
              title="Importar"
            >
              <Upload className="h-4 w-4"/>
            </button>

            <button 
              onClick={handleExportExcel} 
              className="p-2.5 rounded-xl border border-slate-300/60 bg-white/80 backdrop-blur-sm text-slate-600 hover:bg-white hover:shadow-md transition-all"
              title="Exportar"
            >
              <FileSpreadsheet className="h-4 w-4"/>
            </button>

            <button 
              onClick={() => {setClientToEdit(null); setIsModalOpen(true)}} 
              className="bg-gradient-to-br from-[#112240] to-[#1a3a6c] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm hover:shadow-lg hover:scale-[1.02] transition-all shadow-md"
            >
              <Plus className="h-4 w-4"/> Novo
            </button>
          </div>
        </div>

        {/* Listagem */}
        <div className="p-5">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-slate-400" /></div>
          ) : processedClients.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <AlertTriangle className="mx-auto h-12 w-12 mb-2 text-slate-300" />
              <p className="font-medium">Nenhum registro encontrado</p>
            </div>
          ) : viewType === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {processedClients.map(c => <ClientCard key={c.id} client={c} onEdit={setClientToEdit} onOpenModal={() => setIsModalOpen(true)} onDelete={handleDeleteClient} />)}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/60">
              <table className="w-full text-left">
                <thead className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/60">
                  <tr className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="px-5 py-4">Cliente</th>
                    <th className="px-5 py-4">Empresa</th>
                    <th className="px-5 py-4">Sócio</th>
                    <th className="px-5 py-4">Brinde</th>
                    <th className="px-5 py-4">Contato</th>
                    <th className="px-5 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white/50">
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
      className="relative bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl p-5 hover:shadow-xl hover:scale-[1.02] hover:border-slate-300 transition-all duration-300 cursor-pointer group overflow-hidden"
    >
      {/* Gradient decorativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Header do Card */}
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-700 font-bold text-sm shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all">
            {client.nome[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 truncate text-base group-hover:text-[#112240] transition-colors">
              {client.nome}
            </h3>
            <div className="flex items-center gap-1.5 text-slate-500 mt-1">
              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
              <p className="text-xs truncate">{client.empresa}</p>
            </div>
          </div>
        </div>
        
        {/* Menu de Ações */}
        <Menu as="div" className="relative z-10">
          <Menu.Button 
            onClick={(e) => e.stopPropagation()} 
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreVertical className="h-4 w-4" />
          </Menu.Button>
          <Transition as={Fragment}>
            <Menu.Items className="absolute right-0 mt-1 w-40 bg-white/95 backdrop-blur-md shadow-xl border border-slate-200/60 rounded-xl py-1.5 z-50">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(client); onOpenModal(); }}
                    className={`${active ? 'bg-slate-50' : ''} w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 text-slate-700 font-medium transition-colors`}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={(e) => onDelete(client, e)}
                    className={`${active ? 'bg-slate-50' : ''} w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 text-slate-700 font-medium transition-colors`}
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
      <div className="relative mb-4 pb-4 border-b border-slate-100">
        <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm ${colors.badge}`}>
          {client.tipo_brinde}
        </span>
      </div>

      {/* Info do Sócio */}
      <div className="relative mb-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200/50">
            <Briefcase className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Sócio</p>
            <p className="text-sm font-bold text-slate-900">{client.socio}</p>
          </div>
        </div>
      </div>

      {/* Ações de Contato */}
      <div className="relative flex gap-2">
        {client.telefone && (
          <button 
            onClick={(e) => {e.stopPropagation(); window.open(`https://wa.me/55${client.telefone.replace(/\D/g,'')}`)}} 
            className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border border-slate-200/60 bg-white/50 hover:bg-white hover:shadow-md transition-all group/btn"
            title="WhatsApp"
          >
            <MessageCircle className="h-4 w-4 text-green-600 group-hover/btn:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-700">WhatsApp</span>
          </button>
        )}
        {client.email && (
          <button 
            onClick={(e) => {e.stopPropagation(); window.open(`mailto:${client.email}`)}} 
            className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border border-slate-200/60 bg-white/50 hover:bg-white hover:shadow-md transition-all group/btn"
            title="E-mail"
          >
            <Mail className="h-4 w-4 text-blue-600 group-hover/btn:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-700">E-mail</span>
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
      className="hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-transparent cursor-pointer transition-all duration-200 group"
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-700 font-bold text-sm shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
            {client.nome[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 group-hover:text-[#112240] transition-colors">{client.nome}</p>
            <p className="text-xs text-slate-500">{client.cargo || 'Sem cargo'}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-700">{client.empresa}</span>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-900">{client.socio}</span>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm ${colors.badge}`}>
          {client.tipo_brinde}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          {client.telefone && (
            <button 
              onClick={(e) => {e.stopPropagation(); window.open(`https://wa.me/55${client.telefone.replace(/\D/g,'')}`)}} 
              className="p-2 rounded-lg border border-slate-200/60 bg-white/50 hover:bg-white hover:shadow-md transition-all"
              title="WhatsApp"
            >
              <MessageCircle className="h-4 w-4 text-green-600" />
            </button>
          )}
          {client.email && (
            <button 
              onClick={(e) => {e.stopPropagation(); window.open(`mailto:${client.email}`)}} 
              className="p-2 rounded-lg border border-slate-200/60 bg-white/50 hover:bg-white hover:shadow-md transition-all"
              title="E-mail"
            >
              <Mail className="h-4 w-4 text-blue-600" />
            </button>
          )}
        </div>
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(client); onOpenModal(); }} 
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button 
            onClick={(e) => onDelete(client, e)} 
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}
