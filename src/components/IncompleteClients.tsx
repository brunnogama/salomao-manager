// src/components/IncompleteClients.tsx
import { useEffect, useState, useMemo, Fragment } from 'react'
import { supabase } from '../lib/supabase'
import { 
  CheckCircle, Pencil, XCircle, Search, X, 
  Filter, ArrowUpDown, Check, FileSpreadsheet,
  Users, Gift
} from 'lucide-react'
import { Menu, Transition } from '@headlessui/react'
import { NewClientModal, ClientData } from './NewClientModal'
import * as XLSX from 'xlsx'

export function IncompleteClients() {
  const [clients, setClients] = useState<ClientData[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clientToEdit, setClientToEdit] = useState<ClientData | null>(null)
  
  // --- ESTADOS DE BUSCA E FILTRO ---
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [filterSocio, setFilterSocio] = useState<string>('')
  const [filterBrinde, setFilterBrinde] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest')

  const [availableSocios, setAvailableSocios] = useState<string[]>([])
  const [availableBrindes, setAvailableBrindes] = useState<string[]>([])

  // Campos obrigatórios
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
        
        // Verifica se tem campos vazios que NÃO estão na lista de ignorados
        const hasMissing = REQUIRED_FIELDS.some(field => {
           const value = c[field.key]
           const isEmpty = !value || value.toString().trim() === ''
           const isIgnored = ignored.includes(field.label)
           return isEmpty && !isIgnored
        })

        return hasMissing
      })
      setClients(incomplete)

      // Extrai listas únicas baseadas APENAS nos clientes incompletos
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

  // --- LÓGICA CENTRAL DE FILTRAGEM ---
  const processedClients = useMemo(() => {
    let result = [...clients]

    // 1. Busca por Texto
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase()
        result = result.filter(c => 
            (c.nome?.toLowerCase() || '').includes(lowerTerm) ||
            (c.empresa?.toLowerCase() || '').includes(lowerTerm) ||
            (c.email?.toLowerCase() || '').includes(lowerTerm) ||
            (c.socio?.toLowerCase() || '').includes(lowerTerm)
        )
    }

    // 2. Filtros Específicos
    if (filterSocio) {
        result = result.filter(c => c.socio === filterSocio)
    }
    if (filterBrinde) {
        result = result.filter(c => c.tipo_brinde === filterBrinde)
    }

    // 3. Ordenação
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

  // --- EXPORTAR XLSX ---
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(processedClients);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pendencias");
    XLSX.writeFile(wb, "clientes_pendentes.xlsx");
  }

  // --- LIMPAR FILTROS ---
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
      
      {/* HEADER + FERRAMENTAS */}
      <div className="flex-shrink-0 flex flex-col gap-4">
        
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
            
            {/* Lado Esquerdo: Contador */}
            <div className="pl-2">
                <p className="text-sm font-medium text-gray-500">
                    <span className="font-bold text-red-600">{processedClients.length}</span> cadastros com pendências
                </p>
            </div>
            
            {/* Lado Direito: Filtros, Ordenação e Ações */}
            <div className="flex flex-wrap items-center gap-2">
                
                {/* Ícone de Filtro Geral */}
                <div className="flex items-center gap-1 text-gray-400 mr-1 hidden sm:flex">
                    <Filter className="h-4 w-4" />
                </div>

                {/* Filtro Sócio (MENU ELEGANTE) */}
                <Menu as="div" className="relative">
                    <Menu.Button className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-bold transition-colors ${filterSocio ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:text-[#112240] hover:bg-gray-100'}`}>
                        <Users className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">
                            {filterSocio ? filterSocio : 'Sócios'}
                        </span>
                    </Menu.Button>
                    <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                        <Menu.Items className="absolute right-0 mt-1 w-48 origin-top-right rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-20 max-h-60 overflow-y-auto custom-scrollbar">
                            <div className="p-1">
                                <Menu.Item>
                                    {({ active }) => (
                                        <button onClick={() => setFilterSocio('')} className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center justify-between px-3 py-2 text-xs text-gray-700 rounded-md`}>
                                            <span>Todos os Sócios</span>
                                            {filterSocio === '' && <Check className="h-3 w-3 text-blue-600" />}
                                        </button>
                                    )}
                                </Menu.Item>
                                {availableSocios.map((s) => (
                                    <Menu.Item key={s}>
                                        {({ active }) => (
                                            <button onClick={() => setFilterSocio(s)} className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center justify-between px-3 py-2 text-xs text-gray-700 rounded-md`}>
                                                <span className="truncate">{s}</span>
                                                {filterSocio === s && <Check className="h-3 w-3 text-blue-600" />}
                                            </button>
                                        )}
                                    </Menu.Item>
                                ))}
                            </div>
                        </Menu.Items>
                    </Transition>
                </Menu>

                {/* Filtro Brinde (MENU ELEGANTE) */}
                <Menu as="div" className="relative">
                    <Menu.Button className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-bold transition-colors ${filterBrinde ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:text-[#112240] hover:bg-gray-100'}`}>
                        <Gift className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">
                            {filterBrinde ? filterBrinde : 'Brindes'}
                        </span>
                    </Menu.Button>
                    <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                        <Menu.Items className="absolute right-0 mt-1 w-48 origin-top-right rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-20 max-h-60 overflow-y-auto custom-scrollbar">
                            <div className="p-1">
                                <Menu.Item>
                                    {({ active }) => (
                                        <button onClick={() => setFilterBrinde('')} className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center justify-between px-3 py-2 text-xs text-gray-700 rounded-md`}>
                                            <span>Todos os Brindes</span>
                                            {filterBrinde === '' && <Check className="h-3 w-3 text-blue-600" />}
                                        </button>
                                    )}
                                </Menu.Item>
                                {availableBrindes.map((b) => (
                                    <Menu.Item key={b}>
                                        {({ active }) => (
                                            <button onClick={() => setFilterBrinde(b)} className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center justify-between px-3 py-2 text-xs text-gray-700 rounded-md`}>
                                                <span className="truncate">{b}</span>
                                                {filterBrinde === b && <Check className="h-3 w-3 text-blue-600" />}
                                            </button>
                                        )}
                                    </Menu.Item>
                                ))}
                            </div>
                        </Menu.Items>
                    </Transition>
                </Menu>

                {/* Botão Limpar Filtros */}
                {hasActiveFilters && (
                    <button 
                        onClick={clearFilters}
                        className="p-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                        title="Limpar todos os filtros"
                    >
                        <X className="h-4 w-4" />
                        <span className="text-xs font-bold hidden sm:inline">Limpar</span>
                    </button>
                )}

                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                {/* Ordenação */}
                <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:text-[#112240] hover:bg-gray-100 transition-colors">
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">
                            {sortOrder === 'newest' ? 'Recentes' : sortOrder === 'oldest' ? 'Antigos' : 'Nome'}
                        </span>
                    </Menu.Button>
                    <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                        <Menu.Items className="absolute right-0 mt-1 w-40 origin-top-right rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
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
                                                className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center justify-between px-3 py-2 text-xs text-gray-700 rounded-md`}
                                            >
                                                {opt.label}
                                                {sortOrder === opt.id && <Check className="h-3 w-3 text-blue-600" />}
                                            </button>
                                        )}
                                    </Menu.Item>
                                ))}
                            </div>
                        </Menu.Items>
                    </Transition>
                </Menu>

                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                {/* Botão Exportar */}
                <button 
                    onClick={handleExport}
                    className="p-2 bg-gray-50 text-gray-400 border border-gray-200 rounded-lg hover:text-green-600 hover:bg-green-50 hover:border-green-200 transition-colors"
                    title="Exportar para XLSX"
                >
                    <FileSpreadsheet className="h-5 w-5" />
                </button>

                {/* Botão Busca */}
                <button 
                    onClick={() => {
                        setIsSearchOpen(!isSearchOpen);
                        if(isSearchOpen && !filterSocio && !filterBrinde) setSearchTerm(''); 
                    }}
                    className={`p-2 rounded-lg transition-colors ${isSearchOpen ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-400 hover:text-[#112240] hover:bg-gray-100 border border-gray-200'}`}
                    title="Buscar na lista"
                >
                    {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                </button>
            </div>
        </div>

        {/* Busca Deslizante */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSearchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar pendências por nome, empresa..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-red-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 text-[#112240] placeholder:text-gray-400 shadow-sm"
                    autoFocus={isSearchOpen}
                />
            </div>
        </div>
      </div>

      {/* LISTAGEM COM SCROLL */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
        {processedClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
              <CheckCircle className="h-10 w-10 mb-2 text-green-500" />
              <p className="font-medium">
                  {hasActiveFilters ? 'Nenhuma pendência encontrada com estes filtros.' : 'Tudo certo! Nenhum cadastro pendente.'}
              </p>
              {hasActiveFilters && (
                  <button 
                      onClick={clearFilters}
                      className="mt-2 text-blue-600 text-sm font-bold hover:underline"
                  >
                      Limpar filtros
                  </button>
              )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
              {processedClients.map((client: any) => {
                  const missing = REQUIRED_FIELDS
                      .filter(f => (!client[f.key] && !(client.ignored_fields || []).includes(f.label)))
                      .map(f => f.label)

                  return (
                      <div key={client.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4 group border-l-4 border-l-red-400">
                          <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-bold text-[#112240] text-lg">{client.nome || 'Sem Nome'}</h3>
                                  {client.empresa && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{client.empresa}</span>}
                                  {client.socio && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">Sócio: {client.socio}</span>}
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                  {missing.map(field => (
                                      <span key={field} className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                                          Falta: {field}
                                      </span>
                                  ))}
                              </div>
                          </div>

                          <div className="flex items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                              <button 
                                  onClick={() => handleIgnore(client)}
                                  className="px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors"
                                  title="Ignorar pendências deste cliente"
                              >
                                  <XCircle className="h-4 w-4" />
                                  <span className="hidden md:inline">Ignorar</span>
                              </button>
                              <button 
                                  onClick={() => handleEdit(client)}
                                  className="px-4 py-2 bg-[#112240] text-white text-sm font-bold rounded-lg hover:bg-[#1a3a6c] flex items-center gap-2 shadow-sm transition-all"
                              >
                                  <Pencil className="h-4 w-4" />
                                  Resolver
                              </button>
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
