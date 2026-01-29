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
    <div className="p-4 sm:p-6 space-y-4">
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

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header de Ações */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            {/* Card de Total */}
            <div className="bg-white rounded border border-gray-300 px-3 py-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              <div className="border-l border-gray-200 pl-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Total</p>
                <p className="text-base font-bold text-gray-900">{clients.length}</p>
              </div>
            </div>

            {/* Barra de Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  placeholder="Buscar cliente..." 
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none bg-white transition-all" 
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtros Dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="p-2 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
                <Filter className="h-4 w-4" />
              </Menu.Button>
              <Transition as={Fragment} enter="transition duration-100" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100">
                <Menu.Items className="absolute right-0 mt-2 w-64 bg-white shadow-lg border border-gray-200 rounded p-3 z-50">
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide block mb-1">Sócio</label>
                      <select value={filterSocio} onChange={e => setFilterSocio(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-gray-400 outline-none">
                        <option value="">Todos</option>{availableSocios.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide block mb-1">Tipo Brinde</label>
                      <select value={filterBrinde} onChange={e => setFilterBrinde(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-gray-400 outline-none">
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
                className="px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1 transition-colors"
              >
                <X className="h-3 w-3"/> Limpar
              </button>
            )}

            <div className="flex border border-gray-300 rounded overflow-hidden">
              <button 
                onClick={() => {setViewType('cards'); localStorage.setItem('clientsViewType', 'cards')}} 
                className={`p-2 transition-colors ${viewType === 'cards' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <LayoutGrid className="h-4 w-4"/>
              </button>
              <button 
                onClick={() => {setViewType('list'); localStorage.setItem('clientsViewType', 'list')}} 
                className={`p-2 border-l border-gray-300 transition-colors ${viewType === 'list' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="h-4 w-4"/>
              </button>
            </div>

            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="p-2 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
              title="Importar"
            >
              <Upload className="h-4 w-4"/>
            </button>

            <button 
              onClick={handleExportExcel} 
              className="p-2 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
              title="Exportar"
            >
              <FileSpreadsheet className="h-4 w-4"/>
            </button>

            <button 
              onClick={() => {setClientToEdit(null); setIsModalOpen(true)}} 
              className="bg-[#112240] text-white px-4 py-2 rounded font-semibold flex items-center gap-2 text-sm hover:bg-[#1a3a6c] transition-colors"
            >
              <Plus className="h-4 w-4"/> Novo
            </button>
          </div>
        </div>

        {/* Listagem */}
        <div className="p-4">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-gray-400" /></div>
          ) : processedClients.length === 0 ? (
            <div className="py-20 text-center text-gray-500">
              <AlertTriangle className="mx-auto h-12 w-12 mb-2 text-gray-300" />
              <p className="font-medium">Nenhum registro encontrado</p>
            </div>
          ) : viewType === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {processedClients.map(c => <ClientCard key={c.id} client={c} onEdit={setClientToEdit} onOpenModal={() => setIsModalOpen(true)} onDelete={handleDeleteClient} />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Empresa</th>
                    <th className="px-4 py-3">Sócio</th>
                    <th className="px-4 py-3">Brinde</th>
                    <th className="px-4 py-3">Contato</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
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
      className="bg-white border border-gray-200 rounded p-4 hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer group"
    >
      {/* Header do Card */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm">
            {client.nome[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-sm">
              {client.nome}
            </h3>
            <div className="flex items-center gap-1 text-gray-500 mt-0.5">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <p className="text-xs truncate">{client.empresa}</p>
            </div>
          </div>
        </div>
        
        {/* Menu de Ações */}
        <Menu as="div" className="relative">
          <Menu.Button 
            onClick={(e) => e.stopPropagation()} 
            className="p-1 rounded hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Menu.Button>
          <Transition as={Fragment}>
            <Menu.Items className="absolute right-0 mt-1 w-36 bg-white shadow-lg border border-gray-200 rounded py-1 z-50">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(client); onOpenModal(); }}
                    className={`${active ? 'bg-gray-50' : ''} w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-gray-700 font-medium`}
                  >
                    <Pencil className="h-3 w-3" /> Editar
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={(e) => onDelete(client, e)}
                    className={`${active ? 'bg-gray-50' : ''} w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-gray-700 font-medium`}
                  >
                    <Trash2 className="h-3 w-3" /> Excluir
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Badge Tipo Brinde - COM COR */}
      <div className="mb-3 pb-3 border-b border-gray-100">
        <span className={`inline-block px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border ${colors.badge}`}>
          {client.tipo_brinde}
        </span>
      </div>

      {/* Info do Sócio */}
      <div className="mb-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Briefcase className="h-3 w-3 text-gray-400" />
          <div>
            <p className="text-[9px] text-gray-500 uppercase font-semibold tracking-wide">Sócio</p>
            <p className="text-xs font-medium text-gray-900">{client.socio}</p>
          </div>
        </div>
      </div>

      {/* Ações de Contato - COM CORES NOS ÍCONES */}
      <div className="flex gap-2">
        {client.telefone && (
          <button 
            onClick={(e) => {e.stopPropagation(); window.open(`https://wa.me/55${client.telefone.replace(/\D/g,'')}`)}} 
            className="flex-1 flex items-center justify-center gap-1 p-2 rounded border border-gray-300 hover:bg-gray-50 transition-colors group/btn"
            title="WhatsApp"
          >
            <MessageCircle className="h-3.5 w-3.5 text-green-600" />
            <span className="text-xs font-medium text-gray-700">WhatsApp</span>
          </button>
        )}
        {client.email && (
          <button 
            onClick={(e) => {e.stopPropagation(); window.open(`mailto:${client.email}`)}} 
            className="flex-1 flex items-center justify-center gap-1 p-2 rounded border border-gray-300 hover:bg-gray-50 transition-colors group/btn"
            title="E-mail"
          >
            <Mail className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-xs font-medium text-gray-700">E-mail</span>
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
      className="hover:bg-gray-50 cursor-pointer transition-colors group"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm">
            {client.nome[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{client.nome}</p>
            <p className="text-xs text-gray-500">{client.cargo || 'Sem cargo'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-sm text-gray-700">{client.empresa}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Briefcase className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">{client.socio}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-block px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border ${colors.badge}`}>
          {client.tipo_brinde}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {client.telefone && (
            <button 
              onClick={(e) => {e.stopPropagation(); window.open(`https://wa.me/55${client.telefone.replace(/\D/g,'')}`)}} 
              className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
              title="WhatsApp"
            >
              <MessageCircle className="h-3.5 w-3.5 text-green-600" />
            </button>
          )}
          {client.email && (
            <button 
              onClick={(e) => {e.stopPropagation(); window.open(`mailto:${client.email}`)}} 
              className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
              title="E-mail"
            >
              <Mail className="h-3.5 w-3.5 text-blue-600" />
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(client); onOpenModal(); }} 
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={(e) => onDelete(client, e)} 
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}