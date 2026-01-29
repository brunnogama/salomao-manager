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
    (localStorage.getItem('clientsViewType') as 'cards' | 'list') || 'cards'
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
    <div className="p-4 sm:p-6 space-y-6">
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header de Ações */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            {/* Card de Total */}
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-2 flex items-center gap-3 shadow-sm">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
                <p className="text-lg font-bold text-gray-900">{clients.length}</p>
              </div>
            </div>

            {/* Barra de Busca */}
            <div className="flex-1">
              <input 
                type="text" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                placeholder="Busque por nome, empresa ou email..." 
                className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white" 
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtros Dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="p-2 rounded-lg bg-white border text-gray-600"><Filter className="h-5 w-5" /></Menu.Button>
              <Transition as={Fragment} enter="transition duration-100" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100">
                <Menu.Items className="absolute right-0 mt-2 w-72 bg-white shadow-xl border rounded-xl p-4 z-50">
                  <div className="space-y-4">
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase">Sócio</label>
                      <select value={filterSocio} onChange={e => setFilterSocio(e.target.value)} className="w-full border rounded-lg p-2 text-sm">
                        <option value="">Todos</option>{availableSocios.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase">Tipo Brinde</label>
                      <select value={filterBrinde} onChange={e => setFilterBrinde(e.target.value)} className="w-full border rounded-lg p-2 text-sm">
                        <option value="">Todos</option>{availableBrindes.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            {hasActiveFilters && (
              <button onClick={() => {setSearchTerm(''); setFilterSocio(''); setFilterBrinde('')}} className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg flex items-center gap-2"><X className="h-3 w-3"/> Limpar</button>
            )}

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => {setViewType('cards'); localStorage.setItem('clientsViewType', 'cards')}} className={`p-1.5 rounded ${viewType === 'cards' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}><LayoutGrid className="h-4 w-4"/></button>
              <button onClick={() => {setViewType('list'); localStorage.setItem('clientsViewType', 'list')}} className={`p-1.5 rounded ${viewType === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}><List className="h-4 w-4"/></button>
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg bg-blue-50 text-blue-600"><Upload className="h-5 w-5"/></button>
            <button onClick={handleExportExcel} className="p-2 rounded-lg bg-green-50 text-green-600"><FileSpreadsheet className="h-5 w-5"/></button>
            <button onClick={() => {setClientToEdit(null); setIsModalOpen(true)}} className="bg-[#112240] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm"><Plus className="h-4 w-4"/> Novo</button>
          </div>
        </div>

        {/* Listagem */}
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>
          ) : processedClients.length === 0 ? (
            <div className="py-20 text-center text-gray-500"><AlertTriangle className="mx-auto h-12 w-12 mb-2 opacity-20" /><p>Nenhum registro encontrado</p></div>
          ) : viewType === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {processedClients.map(c => <ClientCard key={c.id} client={c} onEdit={setClientToEdit} onOpenModal={() => setIsModalOpen(true)} onDelete={handleDeleteClient} />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b-2">
                  <tr className="text-[10px] font-bold text-gray-400 uppercase">
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Empresa</th>
                    <th className="px-4 py-3">Sócio</th>
                    <th className="px-4 py-3">Brinde</th>
                    <th className="px-4 py-3">Contato</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
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
      className="relative bg-white rounded-xl border border-gray-200 p-5 hover:shadow-2xl hover:border-blue-200 transition-all duration-300 cursor-pointer group overflow-hidden"
    >
      {/* Background gradient decorativo */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${colors.avatar} opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
      
      {/* Header do Card */}
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md ${colors.avatar} group-hover:scale-110 transition-transform duration-300`}>
            {client.nome[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#112240] truncate text-base group-hover:text-blue-600 transition-colors">
              {client.nome}
            </h3>
            <div className="flex items-center gap-1.5 text-gray-500 mt-0.5">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <p className="text-xs truncate">{client.empresa}</p>
            </div>
          </div>
        </div>
        
        {/* Menu de Ações */}
        <Menu as="div" className="relative">
          <Menu.Button 
            onClick={(e) => e.stopPropagation()} 
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Menu.Button>
          <Transition as={Fragment}>
            <Menu.Items className="absolute right-0 mt-1 w-40 bg-white shadow-xl border rounded-lg py-1 z-50">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(client); onOpenModal(); }}
                    className={`${active ? 'bg-blue-50' : ''} w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-gray-700`}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={(e) => onDelete(client, e)}
                    className={`${active ? 'bg-red-50' : ''} w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-red-600`}
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
      <div className="mb-4">
        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${colors.badge}`}>
          {client.tipo_brinde}
        </span>
      </div>

      {/* Info do Sócio */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Briefcase className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wide">Sócio Responsável</p>
            <p className="text-xs font-bold text-gray-700">{client.socio}</p>
          </div>
        </div>
      </div>

      {/* Ações de Contato */}
      <div className="flex gap-2">
        {client.telefone && (
          <button 
            onClick={(e) => {e.stopPropagation(); window.open(`https://wa.me/55${client.telefone.replace(/\D/g,'')}`)}} 
            className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors group/btn"
          >
            <MessageCircle className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
            <span className="text-xs font-bold">WhatsApp</span>
          </button>
        )}
        {client.email && (
          <button 
            onClick={(e) => {e.stopPropagation(); window.open(`mailto:${client.email}`)}} 
            className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors group/btn"
          >
            <Mail className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
            <span className="text-xs font-bold">E-mail</span>
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
      className="hover:bg-blue-50/50 cursor-pointer transition-all group"
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold shadow-sm ${colors.avatar}`}>
            {client.nome[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{client.nome}</p>
            <p className="text-xs text-gray-500">{client.cargo || 'Sem cargo'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">{client.empresa}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-blue-50 rounded">
            <Briefcase className="h-3 w-3 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-blue-600">{client.socio}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${colors.badge}`}>
          {client.tipo_brinde}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          {client.telefone && (
            <button 
              onClick={(e) => {e.stopPropagation(); window.open(`https://wa.me/55${client.telefone.replace(/\D/g,'')}`)}} 
              className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
              title="WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          )}
          {client.email && (
            <button 
              onClick={(e) => {e.stopPropagation(); window.open(`mailto:${client.email}`)}} 
              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              title="E-mail"
            >
              <Mail className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(client); onOpenModal(); }} 
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button 
            onClick={(e) => onDelete(client, e)} 
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}