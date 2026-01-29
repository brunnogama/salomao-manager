import { useEffect, useState, useMemo, useRef, Fragment } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Plus, Search, X, Filter, ArrowUpDown, Check, 
  MessageCircle, Trash2, Pencil, Mail, Phone, 
  Briefcase, Info, Printer, FileSpreadsheet,
  Upload, Loader2, AlertTriangle, LayoutGrid, List
} from 'lucide-react'
import { Menu, Transition } from '@headlessui/react'
import { NewClientModal } from './NewClientModal'
import { ClientData, getBrindeColors } from '../types/client'
import { utils, writeFile, read } from 'xlsx'
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
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSearchOpen(!isSearchOpen)} className={`p-2 rounded-lg transition-all ${isSearchOpen ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 border'}`}><Search className="h-5 w-5" /></button>
            
            {/* Filtros Dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="p-2 rounded-lg bg-white border text-gray-600"><Filter className="h-5 w-5" /></Menu.Button>
              <Transition as={Fragment} enter="transition duration-100" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100">
                <Menu.Items className="absolute left-0 mt-2 w-72 bg-white shadow-xl border rounded-xl p-4 z-50">
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

            {searchTerm || filterSocio || filterBrinde ? (
              <button onClick={() => {setSearchTerm(''); setFilterSocio(''); setFilterBrinde('')}} className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg flex items-center gap-2"><X className="h-3 w-3"/> Limpar</button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => {setViewType('cards'); localStorage.setItem('clientsViewType', 'cards')}} className={`p-1.5 rounded ${viewType === 'cards' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}><LayoutGrid className="h-4 w-4"/></button>
              <button onClick={() => {setViewType('list'); localStorage.setItem('clientsViewType', 'list')}} className={`p-1.5 rounded ${viewType === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}><List className="h-4 w-4"/></button>
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg bg-blue-50 text-blue-600"><Upload className="h-5 w-5"/></button>
            <button onClick={handleExportExcel} className="p-2 rounded-lg bg-green-50 text-green-600"><FileSpreadsheet className="h-5 w-5"/></button>
            <button onClick={() => {setClientToEdit(null); setIsModalOpen(true)}} className="bg-[#112240] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm"><Plus className="h-4 w-4"/> Novo</button>
          </div>
        </div>

        {/* Busca Expandível */}
        {isSearchOpen && (
          <div className="p-4 border-b">
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Busque por nome ou empresa..." className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" autoFocus />
          </div>
        )}

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
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Empresa</th>
                    <th className="px-4 py-3">Sócio</th>
                    <th className="px-4 py-3">Brinde</th>
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
    <div onClick={() => { onEdit(client); onOpenModal(); }} className="bg-white rounded-2xl border p-4 hover:shadow-xl transition-all cursor-pointer group">
      <div className="flex justify-between mb-3">
        <div className="flex gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white font-black ${colors.avatar}`}>{client.nome[0].toUpperCase()}</div>
          <div className="flex-1 overflow-hidden">
            <h3 className="font-bold text-sm truncate">{client.nome}</h3>
            <p className="text-[10px] text-gray-400 uppercase font-bold truncate">{client.empresa}</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${colors.badge}`}>{client.tipo_brinde}</span>
      </div>
      <div className="space-y-2 py-2 border-t border-dashed">
        <div className="flex items-center gap-2 text-xs text-blue-800 font-medium"><Info className="h-3 w-3 text-blue-400"/> {client.socio}</div>
      </div>
      <div className="flex justify-between items-center pt-3 border-t">
        <div className="flex gap-1">
          {client.telefone && <button onClick={e => {e.stopPropagation(); window.open(`https://wa.me/55${client.telefone.replace(/\D/g,'')}`)}} className="p-1.5 rounded bg-green-50 text-green-600"><MessageCircle className="h-3.5 w-3.5"/></button>}
          {client.email && <button onClick={e => {e.stopPropagation(); window.open(`mailto:${client.email}`)}} className="p-1.5 rounded bg-blue-50 text-blue-600"><Mail className="h-3.5 w-3.5"/></button>}
        </div>
        <button onClick={e => onDelete(client, e)} className="p-1.5 rounded text-red-400 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5"/></button>
      </div>
    </div>
  )
}

function ClientRow({ client, onEdit, onOpenModal, onDelete }: any) {
  const colors = getBrindeColors(client.tipo_brinde)
  return (
    <tr onClick={() => { onEdit(client); onOpenModal(); }} className="hover:bg-gray-50 cursor-pointer transition-colors group">
      <td className="px-4 py-3 text-sm font-bold">{client.nome}</td>
      <td className="px-4 py-3 text-xs text-gray-500">{client.empresa}</td>
      <td className="px-4 py-3 text-xs font-medium text-blue-600">{client.socio}</td>
      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colors.badge}`}>{client.tipo_brinde}</span></td>
      <td className="px-4 py-3 text-right">
        <button onClick={e => onDelete(client, e)} className="p-1.5 text-red-400 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4"/></button>
      </td>
    </tr>
  )
}