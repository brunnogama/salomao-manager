import { useEffect, useState, useMemo, Fragment } from 'react'
import { supabase } from '../../lib/supabase'
import {
  CheckCircle, Pencil, XCircle, Search, X,
  Check, FileSpreadsheet, Users, Gift,
  AlertCircle, AlertTriangle, UserCircle,
  Grid, LogOut, ArrowUpDown
} from 'lucide-react'
import { Menu, Transition } from '@headlessui/react'
import { NewClientModal } from './NewClientModal'
import { ClientData } from '../../types/client'
import * as XLSX from 'xlsx'

interface IncompleteClientsProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function IncompleteClients({
  userName = 'Usuário',
  onModuleHome,
  onLogout
}: IncompleteClientsProps) {
  const [clients, setClients] = useState<ClientData[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clientToEdit, setClientToEdit] = useState<ClientData | null>(null)

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [filterSocio, setFilterSocio] = useState<string>('')
  const [filterBrinde, setFilterBrinde] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest')

  const [availableSocios, setAvailableSocios] = useState<string[]>([])
  const [availableBrindes, setAvailableBrindes] = useState<string[]>([])

  const REQUIRED_FIELDS = [
    { key: 'nome', label: 'Nome' },
    { key: 'empresa', label: 'Empresa' },
    { key: 'cargo', label: 'Cargo' },
    { key: 'tipo_brinde', label: 'Tipo Brinde' },
    { key: 'cep', label: 'CEP' },
    { key: 'endereco', label: 'Endereço' },
    { key: 'numero', label: 'Número' },
    { key: 'bairro', label: 'Bairro' },
    { key: 'cidade', label: 'Cidade' },
    { key: 'estado', label: 'UF' },
    { key: 'email', label: 'Email' },
    { key: 'socio', label: 'Sócio' }
  ]

  const fetchIncompleteClients = async () => {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*')

    if (data) {
      const incomplete = data.filter((c: any) => {
        const ignored = c.ignored_fields || []

        const hasMissing = REQUIRED_FIELDS.some(field => {
          const value = c[field.key]
          const isEmpty = !value || value.toString().trim() === ''
          const isIgnored = ignored.includes(field.label)
          return isEmpty && !isIgnored
        })

        return hasMissing
      })
      setClients(incomplete)

      const socios = Array.from(new Set(incomplete.map((c: any) => c.socio).filter(Boolean))) as string[]
      const brindes = Array.from(new Set(incomplete.map((c: any) => c.tipo_brinde).filter(Boolean))) as string[]
      setAvailableSocios(socios.sort())
      setAvailableBrindes(brindes.sort())
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchIncompleteClients()
  }, [])

  const processedClients = useMemo(() => {
    let result = [...clients]

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase()
      result = result.filter(c =>
        (c.nome?.toLowerCase() || '').includes(lowerTerm) ||
        (c.empresa?.toLowerCase() || '').includes(lowerTerm) ||
        (c.email?.toLowerCase() || '').includes(lowerTerm) ||
        (c.socio?.toLowerCase() || '').includes(lowerTerm)
      )
    }

    if (filterSocio) {
      result = result.filter(c => c.socio === filterSocio)
    }
    if (filterBrinde) {
      result = result.filter(c => c.tipo_brinde === filterBrinde)
    }

    result.sort((a: any, b: any) => {
      if (sortOrder === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      if (sortOrder === 'oldest') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      if (sortOrder === 'az') return (a.nome || '').localeCompare(b.nome || '')
      if (sortOrder === 'za') return (b.nome || '').localeCompare(a.nome || '')
      return 0
    })

    return result
  }, [clients, searchTerm, filterSocio, filterBrinde, sortOrder])

  const handleEdit = (client: ClientData) => {
    setClientToEdit(client)
    setIsModalOpen(true)
  }

  const handleSave = async (updatedClient: ClientData) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update(updatedClient)
        .eq('email', clientToEdit?.email || updatedClient.email)

      if (error) throw error

      setIsModalOpen(false)
      setClientToEdit(null)
      fetchIncompleteClients()
    } catch (err) {
      console.error("Erro ao atualizar:", err)
    }
  }

  const handleIgnore = async (client: any) => {
    if (!confirm("Deseja marcar este cadastro como 'Completo' ignorando os campos vazios atuais?")) return;

    const missingFields = REQUIRED_FIELDS
      .filter(field => !client[field.key])
      .map(field => field.label);

    const currentIgnored = client.ignored_fields || [];
    const newIgnored = [...new Set([...currentIgnored, ...missingFields])];

    const { error } = await supabase
      .from('clients')
      .update({ ignored_fields: newIgnored })
      .eq('id', client.id);

    if (!error) fetchIncompleteClients();
  }

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(processedClients);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pendencias");
    XLSX.writeFile(wb, "clientes_pendentes.xlsx");
  }

  const hasActiveFilters = searchTerm !== '' || filterSocio !== '' || filterBrinde !== '';

  const clearFilters = () => {
    setSearchTerm('');
    setFilterSocio('');
    setFilterBrinde('');
  }

  if (loading) return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a8a]"></div>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 p-6 space-y-6">

      {/* PAGE HEADER */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-600 to-red-800 shadow-lg">
            <AlertTriangle className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Incompletos
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              <span className="text-red-600 font-black">{processedClients.length}</span> {processedClients.length === 1 ? 'pendência' : 'pendências'} para resolver
            </p>
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Conectado</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white shadow-md">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && (
            <button onClick={onModuleHome} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all" title="Módulos">
              <Grid className="h-5 w-5" />
            </button>
          )}
          {onLogout && (
            <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Sair">
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* TOOLBAR & FILTERS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">

          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, empresa ou e-mail..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white text-gray-700 hover:bg-gray-50 hover:border-[#1e3a8a]/30 transition-all">
                <Users className="h-4 w-4" />
                <span>{filterSocio || 'Sócios'}</span>
              </Menu.Button>
              <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100">
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white shadow-xl border border-gray-200 focus:outline-none z-20 max-h-60 overflow-y-auto custom-scrollbar">
                  <div className="p-1.5">
                    <Menu.Item>
                      {({ active }) => (
                        <button onClick={() => setFilterSocio('')} className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center justify-between px-3 py-2.5 text-xs text-gray-700 rounded-lg font-bold`}>
                          <span>Todos os Sócios</span>
                          {filterSocio === '' && <Check className="h-4 w-4 text-[#1e3a8a]" />}
                        </button>
                      )}
                    </Menu.Item>
                    {availableSocios.map((s) => (
                      <Menu.Item key={s}>
                        {({ active }) => (
                          <button onClick={() => setFilterSocio(s)} className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center justify-between px-3 py-2.5 text-xs text-gray-700 rounded-lg`}>
                            <span className="truncate">{s}</span>
                            {filterSocio === s && <Check className="h-4 w-4 text-[#1e3a8a]" />}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white text-gray-700 hover:bg-gray-50 hover:border-[#1e3a8a]/30 transition-all">
                <Gift className="h-4 w-4" />
                <span>{filterBrinde || 'Brindes'}</span>
              </Menu.Button>
              <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100">
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white shadow-xl border border-gray-200 focus:outline-none z-20 max-h-60 overflow-y-auto custom-scrollbar">
                  <div className="p-1.5">
                    <Menu.Item>
                      {({ active }) => (
                        <button onClick={() => setFilterBrinde('')} className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center justify-between px-3 py-2.5 text-xs text-gray-700 rounded-lg font-bold`}>
                          <span>Todos os Brindes</span>
                          {filterBrinde === '' && <Check className="h-4 w-4 text-[#1e3a8a]" />}
                        </button>
                      )}
                    </Menu.Item>
                    {availableBrindes.map((b) => (
                      <Menu.Item key={b}>
                        {({ active }) => (
                          <button onClick={() => setFilterBrinde(b)} className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center justify-between px-3 py-2.5 text-xs text-gray-700 rounded-lg`}>
                            <span className="truncate">{b}</span>
                            {filterBrinde === b && <Check className="h-4 w-4 text-[#1e3a8a]" />}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            <Menu as="div" className="relative">
              <Menu.Button className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-[#1e3a8a]/30 transition-all">
                <ArrowUpDown className="h-5 w-5" />
              </Menu.Button>
              <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100">
                <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right rounded-xl bg-white shadow-xl border border-gray-200 focus:outline-none z-20">
                  <div className="p-1.5">
                    {[
                      { id: 'newest', label: 'Mais Recentes' },
                      { id: 'oldest', label: 'Mais Antigos' },
                      { id: 'az', label: 'Nome (A-Z)' },
                      { id: 'za', label: 'Nome (Z-A)' }
                    ].map((opt) => (
                      <Menu.Item key={opt.id}>
                        {({ active }) => (
                          <button
                            onClick={() => setSortOrder(opt.id as any)}
                            className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center justify-between px-3 py-2.5 text-xs text-gray-700 rounded-lg font-bold`}
                          >
                            {opt.label}
                            {sortOrder === opt.id && <Check className="h-4 w-4 text-[#1e3a8a]" />}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            <button
              onClick={handleExport}
              className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 transition-all active:scale-95"
              title="Exportar"
            >
              <FileSpreadsheet className="h-5 w-5" />
            </button>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="p-2.5 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTA DE PENDÊNCIAS */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {processedClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <CheckCircle className="h-16 w-16 mb-4 text-green-500" />
            <p className="font-black text-xl text-[#0a192f]">Tudo em dia!</p>
            <p className="text-sm text-gray-500">Nenhum cadastro pendente encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-10">
            {processedClients.map((client: any) => {
              const missing = REQUIRED_FIELDS
                .filter(f => (!client[f.key] && !(client.ignored_fields || []).includes(f.label)))
                .map(f => f.label)

              return (
                <div key={client.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                        {client.nome ? client.nome[0].toUpperCase() : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-[#0a192f] text-lg leading-none mb-2">{client.nome || 'Sem Nome'}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{client.empresa || 'Empresa não informada'}</span>
                          <span className="text-[10px] text-gray-300">•</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#1e3a8a]">{client.socio || 'Sem Sócio'}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {missing.map(field => (
                            <span key={field} className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100">
                              <AlertCircle className="h-3 w-3" />
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-50 justify-end">
                      <button
                        onClick={() => handleIgnore(client)}
                        className="px-6 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                      >
                        Ignorar
                      </button>
                      <button
                        onClick={() => handleEdit(client)}
                        className="flex items-center gap-2 px-8 py-2.5 bg-[#1e3a8a] text-white text-[9px] font-black rounded-xl hover:bg-[#112240] shadow-lg transition-all active:scale-95 uppercase tracking-widest"
                      >
                        <Pencil className="h-4 w-4" />
                        Resolver
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <NewClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => { setIsModalOpen(false); fetchIncompleteClients(); }}
        clientToEdit={clientToEdit}
        tableName="clients"
      />
    </div>
  )
}