// src/components/crm/IncompleteClients.tsx
import { useEffect, useState, useMemo, Fragment } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  CheckCircle, Pencil, XCircle, Search, X, 
  Filter, ArrowUpDown, Check, FileSpreadsheet,
  Users, Gift, AlertCircle
} from 'lucide-react'
import { Menu, Transition } from '@headlessui/react'
import { NewClientModal } from './NewClientModal'
import { ClientData } from '../../types/client'
import * as XLSX from 'xlsx'

export function IncompleteClients() {
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
    const { data } = await supabase.from('clientes').select('*')
    
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
            .from('clientes')
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
    if(!confirm("Deseja marcar este cadastro como 'Completo' ignorando os campos vazios atuais?")) return;

    const missingFields = REQUIRED_FIELDS
        .filter(field => !client[field.key])
        .map(field => field.label);
    
    const currentIgnored = client.ignored_fields || [];
    const newIgnored = [...new Set([...currentIgnored, ...missingFields])];

    const { error } = await supabase
        .from('clientes')
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
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#112240]"></div>
    </div>
  )

  return (
    <div className="h-full flex flex-col gap-4">
      
      <div className="flex-shrink-0 flex flex-col gap-4">
        
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-gray-200">
            
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded border border-gray-200">
                  <AlertCircle className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Cadastros Incompletos</p>
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-900">{processedClients.length}</span> {processedClients.length === 1 ? 'pendência' : 'pendências'}
                  </p>
                </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
                
                <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-xs font-semibold bg-white text-gray-600 hover:bg-gray-50 transition-all">
                        <Users className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">
                            {filterSocio ? filterSocio : 'Sócio'}
                        </span>
                    </Menu.Button>
                    <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100">
                        <Menu.Items className="absolute right-0 mt-1 w-48 origin-top-right rounded bg-white shadow-lg border border-gray-200 focus:outline-none z-20 max-h-60 overflow-y-auto">
                            <div className="p-1">
                                <Menu.Item>
                                    {({ active }) => (
                                        <button onClick={() => setFilterSocio('')} className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center justify-between px-3 py-2 text-xs text-gray-700 rounded font-medium`}>
                                            <span>Todos os Sócios</span>
                                            {filterSocio === '' && <Check className="h-3 w-3 text-gray-600" />}
                                        </button>
                                    )}
                                </Menu.Item>
                                {availableSocios.map((s) => (
                                    <Menu.Item key={s}>
                                        {({ active }) => (
                                            <button onClick={() => setFilterSocio(s)} className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center justify-between px-3 py-2 text-xs text-gray-700 rounded`}>
                                                <span className="truncate">{s}</span>
                                                {filterSocio === s && <Check className="h-3 w-3 text-gray-600" />}
                                            </button>
                                        )}
                                    </Menu.Item>
                                ))}
                            </div>
                        </Menu.Items>
                    </Transition>
                </Menu>

                <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-xs font-semibold bg-white text-gray-600 hover:bg-gray-50 transition-all">
                        <Gift className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">
                            {filterBrinde ? filterBrinde : 'Brinde'}
                        </span>
                    </Menu.Button>
                    <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100">
                        <Menu.Items className="absolute right-0 mt-1 w-48 origin-top-right rounded bg-white shadow-lg border border-gray-200 focus:outline-none z-20 max-h-60 overflow-y-auto">
                            <div className="p-1">
                                <Menu.Item>
                                    {({ active }) => (
                                        <button onClick={() => setFilterBrinde('')} className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center justify-between px-3 py-2 text-xs text-gray-700 rounded font-medium`}>
                                            <span>Todos os Brindes</span>
                                            {filterBrinde === '' && <Check className="h-3 w-3 text-gray-600" />}
                                        </button>
                                    )}
                                </Menu.Item>
                                {availableBrindes.map((b) => (
                                    <Menu.Item key={b}>
                                        {({ active }) => (
                                            <button onClick={() => setFilterBrinde(b)} className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center justify-between px-3 py-2 text-xs text-gray-700 rounded`}>
                                                <span className="truncate">{b}</span>
                                                {filterBrinde === b && <Check className="h-3 w-3 text-gray-600" />}
                                            </button>
                                        )}
                                    </Menu.Item>
                                ))}
                            </div>
                        </Menu.Items>
                    </Transition>
                </Menu>

                {hasActiveFilters && (
                    <button 
                        onClick={clearFilters}
                        className="px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1 transition-colors"
                        title="Limpar todos os filtros"
                    >
                        <X className="h-3 w-3" />
                        <span className="hidden sm:inline">Limpar</span>
                    </button>
                )}

                <div className="h-5 w-px bg-gray-200"></div>

                <Menu as="div" className="relative">
                    <Menu.Button className="p-2 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors">
                        <ArrowUpDown className="h-4 w-4" />
                    </Menu.Button>
                    <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100">
                        <Menu.Items className="absolute right-0 mt-1 w-40 origin-top-right rounded bg-white shadow-lg border border-gray-200 focus:outline-none z-20">
                            <div className="p-1">
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
                                                className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center justify-between px-3 py-2 text-xs text-gray-700 rounded`}
                                            >
                                                {opt.label}
                                                {sortOrder === opt.id && <Check className="h-3 w-3 text-gray-600" />}
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
                    className="p-2 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
                    title="Exportar para XLSX"
                >
                    <FileSpreadsheet className="h-4 w-4" />
                </button>

                <button 
                    onClick={() => {
                        setIsSearchOpen(!isSearchOpen);
                        if(isSearchOpen && !filterSocio && !filterBrinde) setSearchTerm(''); 
                    }}
                    className={`p-2 rounded transition-colors ${isSearchOpen ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                    title="Buscar na lista"
                >
                    {isSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                </button>
            </div>
        </div>

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSearchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar pendências por nome, empresa..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-gray-900 placeholder:text-gray-400"
                    autoFocus={isSearchOpen}
                />
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
        {processedClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-200">
              <CheckCircle className="h-12 w-12 mb-3 text-gray-300" />
              <p className="font-semibold text-base text-gray-900 mb-1">
                  {hasActiveFilters ? 'Nenhuma pendência encontrada' : 'Tudo certo!'}
              </p>
              <p className="text-sm text-gray-500 mb-3">
                  {hasActiveFilters ? 'Nenhum resultado com estes filtros.' : 'Não há cadastros pendentes.'}
              </p>
              {hasActiveFilters && (
                  <button 
                      onClick={clearFilters}
                      className="text-sm font-semibold text-gray-600 hover:text-gray-900 underline"
                  >
                      Limpar filtros
                  </button>
              )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
              {processedClients.map((client: any) => {
                  const missing = REQUIRED_FIELDS
                      .filter(f => (!client[f.key] && !(client.ignored_fields || []).includes(f.label)))
                      .map(f => f.label)

                  return (
                      <div key={client.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-sm transition-all">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-3">
                                      <div className="h-10 w-10 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm">
                                        {client.nome ? client.nome[0].toUpperCase() : '?'}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <h3 className="font-semibold text-gray-900 text-sm truncate">{client.nome || 'Sem Nome'}</h3>
                                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                                              {client.empresa && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">{client.empresa}</span>}
                                              {client.socio && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">{client.socio}</span>}
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                      {missing.map(field => (
                                          <span key={field} className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                              <AlertCircle className="h-2.5 w-2.5" />
                                              {field}
                                          </span>
                                      ))}
                                  </div>
                              </div>

                              <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                                  <button 
                                      onClick={() => handleIgnore(client)}
                                      className="px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 border border-gray-300 rounded flex items-center gap-1.5 transition-colors"
                                      title="Ignorar pendências"
                                  >
                                      <XCircle className="h-3.5 w-3.5" />
                                      <span className="hidden md:inline">Ignorar</span>
                                  </button>
                                  <button 
                                      onClick={() => handleEdit(client)}
                                      className="px-4 py-2 bg-[#112240] text-white text-xs font-semibold rounded hover:bg-[#1a3a6c] flex items-center gap-1.5 transition-colors"
                                  >
                                      <Pencil className="h-3.5 w-3.5" />
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
        onSave={handleSave}
        clientToEdit={clientToEdit}
      />
    </div>
  )
}