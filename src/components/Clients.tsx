import { useEffect, useState, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Plus, Search, X, Filter, ArrowUpDown, Check, 
  MessageCircle, Trash2, Pencil, Mail, Phone, 
  Briefcase, User, Gift, Info, MapPin, Printer, FileSpreadsheet,
  Upload, Loader2, AlertTriangle, LayoutGrid, List
} from 'lucide-react'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { NewClientModal, ClientData } from './NewClientModal'
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
  
  // Tipo de visualização salvo no localStorage
  const [viewType, setViewType] = useState<'cards' | 'list'>(() => {
    const saved = localStorage.getItem('clientsViewType')
    return (saved === 'list' || saved === 'cards') ? saved : 'cards'
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSocio, setFilterSocio] = useState<string>('')
  const [filterBrinde, setFilterBrinde] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest')

  const [availableSocios, setAvailableSocios] = useState<string[]>([])
  const [availableBrindes, setAvailableBrindes] = useState<string[]>([])

  // Função para mudar tipo de visualização
  const handleViewTypeChange = (type: 'cards' | 'list') => {
    setViewType(type)
    localStorage.setItem('clientsViewType', type)
  }

  const fetchClients = async () => {
    setLoading(true)
    const { data, error } = await supabase.from(tableName).select('*')
    
    if (!error && data) {
        const formattedClients: ClientData[] = data.map((item: any) => ({
            id: item.id,
            nome: item.nome,
            empresa: item.empresa,
            cargo: item.cargo,
            telefone: item.telefone,
            tipo_brinde: item.tipo_brinde, 
            outro_brinde: item.outro_brinde,
            quantidade: item.quantidade,
            email: item.email,
            socio: item.socio,
            cep: item.cep,
            endereco: item.endereco,
            numero: item.numero,
            complemento: item.complemento,
            bairro: item.bairro,
            cidade: item.cidade,
            estado: item.estado,
            observacoes: item.observacoes,
            historico_brindes: item.historico_brindes || []
        }))
        setClients(formattedClients)
        
        const socios = Array.from(new Set(formattedClients.map(c => c.socio).filter(Boolean)))
        const brindes = Array.from(new Set(formattedClients.map(c => c.tipo_brinde).filter(Boolean)))
        setAvailableSocios(socios)
        setAvailableBrindes(brindes)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchClients()
  }, [tableName])

  useEffect(() => {
    if (initialFilters?.socio) setFilterSocio(initialFilters.socio)
    if (initialFilters?.brinde) setFilterBrinde(initialFilters.brinde)
  }, [initialFilters])

  // Modal sempre abre em modo VISUALIZAÇÃO
  const openEditModal = (client: ClientData) => {
    setClientToEdit(client)
    setIsModalOpen(true)
  }

  const handleDeleteClient = async (client: ClientData, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`Tem certeza que deseja excluir ${client.nome}?`)) {
      await supabase.from(tableName).delete().eq('id', client.id)
      await logAction('DELETE', tableName.toUpperCase(), `Excluiu ${client.nome}`)
      fetchClients()
    }
  }

  const handleWhatsApp = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const cleanPhone = phone.replace(/\D/g, '')
    window.open(`https://wa.me/55${cleanPhone}`, '_blank')
  }

  // Função para iniciar ligação via 3CX (protocolo tel:)
  const handlePhoneCall = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const cleanPhone = phone.replace(/\D/g, '')
    window.location.href = `tel:${cleanPhone}`
  }

  const handleEmail = (email: string, e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(`mailto:${email}`, '_blank')
  }

  const processedClients = useMemo(() => {
    let filtered = clients.filter(client => {
      const matchesSearch = searchTerm === '' || 
        client.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesSocio = filterSocio === '' || client.socio === filterSocio
      const matchesBrinde = filterBrinde === '' || client.tipo_brinde === filterBrinde
      
      return matchesSearch && matchesSocio && matchesBrinde
    })

    filtered.sort((a, b) => {
      if (sortOrder === 'newest') return (b.id || 0) - (a.id || 0)
      if (sortOrder === 'oldest') return (a.id || 0) - (b.id || 0)
      if (sortOrder === 'az') return (a.nome || '').localeCompare(b.nome || '')
      if (sortOrder === 'za') return (b.nome || '').localeCompare(a.nome || '')
      return 0
    })

    return filtered
  }, [clients, searchTerm, filterSocio, filterBrinde, sortOrder])

  const handleExportExcel = () => {
    const dataToExport = processedClients.map(client => ({
      Nome: client.nome,
      Empresa: client.empresa,
      Cargo: client.cargo,
      Email: client.email,
      Telefone: client.telefone,
      Sócio: client.socio,
      'Tipo de Brinde': client.tipo_brinde,
      Quantidade: client.quantidade,
      CEP: client.cep,
      Endereço: client.endereco,
      Número: client.numero,
      Bairro: client.bairro,
      Cidade: client.cidade,
      Estado: client.estado
    }))
    const ws = utils.json_to_sheet(dataToExport)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, "Clientes")
    writeFile(wb, `${tableName}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handlePrintList = () => {
    window.print()
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const data = await file.arrayBuffer()
      const workbook = read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = utils.sheet_to_json(worksheet)

      const clientsToInsert = jsonData.map((row: any) => ({
        nome: row.Nome || row.nome,
        empresa: row.Empresa || row.empresa || '',
        cargo: row.Cargo || row.cargo || '',
        email: row.Email || row.email || '',
        telefone: row.Telefone || row.telefone || '',
        socio: row['Sócio'] || row.Socio || row.socio || '',
        tipo_brinde: row['Tipo de Brinde'] || row.tipo_brinde || 'Brinde Médio',
        quantidade: row.Quantidade || row.quantidade || 1,
        cep: row.CEP || row.cep || '',
        endereco: row['Endereço'] || row.Endereco || row.endereco || '',
        numero: row['Número'] || row.Numero || row.numero || '',
        bairro: row.Bairro || row.bairro || '',
        cidade: row.Cidade || row.cidade || '',
        estado: row.Estado || row.estado || ''
      }))

      const { error } = await supabase.from(tableName).insert(clientsToInsert)
      if (error) throw error

      await logAction('IMPORT', tableName.toUpperCase(), `Importou ${clientsToInsert.length} registros`)
      fetchClients()
      alert(`${clientsToInsert.length} registros importados com sucesso!`)
    } catch (error: any) {
      alert('Erro ao importar: ' + error.message)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setFilterSocio('')
    setFilterBrinde('')
    // NÃO limpa sortOrder - ordenação não é filtro
  }

  // CORRIGIDO: sortOrder NÃO é considerado filtro ativo
  const hasActiveFilters = searchTerm !== '' || filterSocio !== '' || filterBrinde !== ''

  const getBrindeColors = (tipo: string) => {
    if (tipo === 'Brinde VIP') {
      return {
        avatar: 'bg-gradient-to-br from-purple-500 to-purple-600',
        badge: 'bg-purple-100 text-purple-700 border-purple-200'
      }
    } else if (tipo === 'Brinde Médio') {
      return {
        avatar: 'bg-gradient-to-br from-green-500 to-green-600',
        badge: 'bg-green-100 text-green-700 border-green-200'
      }
    } else if (tipo === 'Outro') {
      return {
        avatar: 'bg-gradient-to-br from-blue-500 to-blue-600',
        badge: 'bg-blue-100 text-blue-700 border-blue-200'
      }
    } else {
      return {
        avatar: 'bg-gradient-to-br from-gray-400 to-gray-500',
        badge: 'bg-gray-100 text-gray-700 border-gray-200'
      }
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <input ref={fileInputRef} type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />

      <NewClientModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setClientToEdit(null)
        }}
        onSave={fetchClients}
        clientToEdit={clientToEdit}
        tableName={tableName}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsSearchOpen(!isSearchOpen)} className={`p-2 rounded-lg transition-all ${isSearchOpen ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
                        <Search className="h-5 w-5" />
                    </button>

                    <Menu as="div" className="relative">
                        <Menu.Button className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                            <Filter className="h-5 w-5" />
                        </Menu.Button>
                        <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                            <Menu.Items className="absolute left-0 mt-2 w-56 origin-top-left rounded-xl bg-white shadow-xl border border-gray-200 p-2 z-50">
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase px-2">Sócio</label>
                                        <select value={filterSocio} onChange={(e) => setFilterSocio(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                                            <option value="">Todos</option>
                                            {availableSocios.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase px-2">Tipo Brinde</label>
                                        <select value={filterBrinde} onChange={(e) => setFilterBrinde(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                                            <option value="">Todos</option>
                                            {availableBrindes.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </Menu.Items>
                        </Transition>
                    </Menu>

                    <Menu as="div" className="relative">
                        <Menu.Button className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                            <ArrowUpDown className="h-5 w-5" />
                        </Menu.Button>
                        <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                            <Menu.Items className="absolute left-0 mt-2 w-48 origin-top-left rounded-xl bg-white shadow-xl border border-gray-200 p-1 z-50">
                                {[
                                    { value: 'newest', label: 'Mais Recentes' },
                                    { value: 'oldest', label: 'Mais Antigos' },
                                    { value: 'az', label: 'A → Z' },
                                    { value: 'za', label: 'Z → A' }
                                ].map(option => (
                                    <Menu.Item key={option.value}>
                                        {({ active }) => (
                                            <button onClick={() => setSortOrder(option.value as any)} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${active ? 'bg-blue-50' : ''} ${sortOrder === option.value ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                                                {option.label}
                                                {sortOrder === option.value && <Check className="h-4 w-4" />}
                                            </button>
                                        )}
                                    </Menu.Item>
                                ))}
                            </Menu.Items>
                        </Transition>
                    </Menu>

                    {hasActiveFilters && (
                        <button onClick={clearAllFilters} className="px-3 py-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors text-xs font-bold flex items-center gap-2 border border-amber-300 shadow-sm animate-pulse">
                            <X className="h-3.5 w-3.5" /> Limpar Filtros
                        </button>
                    )}
                </div>

                {/* Botões de Visualização */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <button 
                            onClick={() => handleViewTypeChange('cards')} 
                            className={`p-2 rounded-md transition-all ${viewType === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Visualização em Cards"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button 
                            onClick={() => handleViewTypeChange('list')} 
                            className={`p-2 rounded-md transition-all ${viewType === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Visualização em Lista"
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-1">
                        <button onClick={triggerFileInput} disabled={importing} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors" title="Importar Excel">
                            {importing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                        </button>
                        <button onClick={handleExportExcel} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 transition-colors" title="Exportar Excel"><FileSpreadsheet className="h-5 w-5" /></button>
                        <button onClick={handlePrintList} className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors" title="Imprimir Lista"><Printer className="h-5 w-5" /></button>
                    </div>

                    <button onClick={() => { setClientToEdit(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-[#112240] hover:bg-[#1a3a6c] text-white px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors shadow-sm whitespace-nowrap">
                        <Plus className="h-4 w-4" /><span className="hidden sm:inline">Novo Registro</span>
                    </button>
                </div>
            </div>
        </div>

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSearchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="relative p-4">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Busque por nome, empresa..." className="w-full pl-10 pr-4 py-3 bg-white border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" autoFocus={isSearchOpen} />
            </div>
        </div>

        <div className="p-4 sm:p-6">
            {loading ? (
                <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                </div>
            ) : processedClients.length === 0 ? (
                <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Nenhum registro encontrado</p>
                </div>
            ) : viewType === 'cards' ? (
                // VISUALIZAÇÃO EM CARDS
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {processedClients.map((client) => {
                        const colors = getBrindeColors(client.tipo_brinde)
                        return (
                            <div 
                                key={client.id} 
                                onClick={() => openEditModal(client)} 
                                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3.5 hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-2.5">
                                    <div className="flex gap-2.5 flex-1">
                                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg ${colors.avatar}`}>
                                            {client.nome?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        
                                        <div className="flex-1 overflow-hidden">
                                            <h3 className="font-bold text-gray-900 text-sm truncate">{client.nome}</h3>
                                            <p className="text-xs text-gray-500 truncate">{client.cargo || 'Sem cargo'}</p>
                                        </div>
                                    </div>
                                    
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${colors.badge} whitespace-nowrap`}>
                                        {client.tipo_brinde}
                                    </span>
                                </div>

                                <div className="space-y-1.5 mb-3">
                                    <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-100">
                                        <Info className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                                        <span className="text-xs text-blue-900 font-medium truncate">Sócio: {client.socio || 'N/A'}</span>
                                    </div>
                                    
                                    {client.empresa && (
                                        <div className="flex items-center gap-2 bg-purple-50 p-2 rounded-lg border border-purple-100">
                                            <Briefcase className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
                                            <span className="text-xs text-purple-900 font-medium truncate">Empresa: {client.empresa}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                    <div className="flex gap-1">
                                        {client.telefone && (
                                            <>
                                                <button onClick={(e) => handleWhatsApp(client.telefone, e)} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="WhatsApp">
                                                    <MessageCircle className="h-3.5 w-3.5" />
                                                </button>
                                                <button onClick={(e) => handlePhoneCall(client.telefone, e)} className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600 hover:bg-cyan-100 transition-colors" title="Ligar com 3CX">
                                                    <Phone className="h-3.5 w-3.5" />
                                                </button>
                                            </>
                                        )}
                                        {client.email && (
                                            <button onClick={(e) => handleEmail(client.email, e)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="E-mail">
                                                <Mail className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="flex gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); openEditModal(client); }} className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors" title="Editar">
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={(e) => handleDeleteClient(client, e)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Excluir">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                // VISUALIZAÇÃO EM LISTA
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Nome</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Empresa</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Cargo</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Sócio</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Brinde</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Contato</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {processedClients.map((client) => {
                                const colors = getBrindeColors(client.tipo_brinde)
                                return (
                                    <tr 
                                        key={client.id} 
                                        onClick={() => openEditModal(client)}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${colors.avatar}`}>
                                                    {client.nome?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <span className="font-medium text-gray-900 text-sm">{client.nome}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{client.empresa || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{client.cargo || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{client.socio || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${colors.badge}`}>
                                                {client.tipo_brinde}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {client.telefone && (
                                                    <>
                                                        <button onClick={(e) => handleWhatsApp(client.telefone, e)} className="p-1 rounded bg-green-50 text-green-600 hover:bg-green-100" title="WhatsApp">
                                                            <MessageCircle className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button onClick={(e) => handlePhoneCall(client.telefone, e)} className="p-1 rounded bg-cyan-50 text-cyan-600 hover:bg-cyan-100" title="Ligar com 3CX">
                                                            <Phone className="h-3.5 w-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                                {client.email && (
                                                    <button onClick={(e) => handleEmail(client.email, e)} className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100" title="E-mail">
                                                        <Mail className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex gap-1">
                                                <button onClick={(e) => { e.stopPropagation(); openEditModal(client); }} className="p-1.5 rounded bg-gray-50 text-gray-600 hover:bg-gray-100" title="Visualizar">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button onClick={(e) => handleDeleteClient(client, e)} className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100" title="Excluir">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
                <span className="font-bold text-gray-900">{processedClients.length}</span> registro(s) encontrado(s)
            </p>
        </div>
      </div>
    </div>
  )
}
