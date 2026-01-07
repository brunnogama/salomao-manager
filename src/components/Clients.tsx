import { useEffect, useState, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Plus, Search, X, Filter, ArrowUpDown, Check, 
  MessageCircle, Trash2, Pencil, Mail, Phone, 
  Briefcase, User, Gift, Info, MapPin, Printer, FileSpreadsheet,
  Upload, Loader2
} from 'lucide-react'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { NewClientModal, ClientData } from './NewClientModal'
import { utils, writeFile, read } from 'xlsx'
import { logAction } from '../lib/logger'

interface ClientsProps {
  initialFilters?: { socio?: string; brinde?: string };
  tableName?: string; // Propriedade para definir a tabela (Padrão: 'clientes')
}

export function Clients({ initialFilters, tableName = 'clientes' }: ClientsProps) {
  const [clients, setClients] = useState<ClientData[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false) // Estado para loading da importação
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clientToEdit, setClientToEdit] = useState<ClientData | null>(null)
  
  // Ref para o input de arquivo invisível
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // --- ESTADOS DE BUSCA E FILTRO ---
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [filterSocio, setFilterSocio] = useState<string>('')
  const [filterBrinde, setFilterBrinde] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest')

  const [availableSocios, setAvailableSocios] = useState<string[]>([])
  const [availableBrindes, setAvailableBrindes] = useState<string[]>([])

  const fetchClients = async () => {
    setLoading(true)
    let query = supabase.from(tableName).select('*')
    
    const { data, error } = await query
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
            cep: item.cep,
            endereco: item.endereco,
            numero: item.numero,
            complemento: item.complemento,
            bairro: item.bairro,
            cidade: item.cidade,
            estado: item.estado,
            email: item.email,
            socio: item.socio,
            observacoes: item.observacoes,
            ignored_fields: item.ignored_fields,
            historico_brindes: item.historico_brindes,
            created_at: item.created_at,
            updated_at: item.updated_at,
            created_by: item.created_by,
            updated_by: item.updated_by
        }))

        setClients(formattedClients)
        
        const socios = Array.from(new Set(formattedClients.map(c => c.socio).filter(Boolean))) as string[]
        const brindes = Array.from(new Set(formattedClients.map(c => c.tipo_brinde).filter(Boolean))) as string[]
        setAvailableSocios(socios.sort())
        setAvailableBrindes(brindes.sort())
    }
    setLoading(false)
  }

  useEffect(() => {
    if (initialFilters?.socio) setFilterSocio(initialFilters.socio)
    if (initialFilters?.brinde) setFilterBrinde(initialFilters.brinde)
    fetchClients()
  }, [initialFilters, tableName])

  const processedClients = useMemo(() => {
    let result = [...clients]

    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase()
        result = result.filter(c => 
            (c.nome?.toLowerCase() || '').includes(lowerTerm) ||
            (c.empresa?.toLowerCase() || '').includes(lowerTerm) ||
            (c.email?.toLowerCase() || '').includes(lowerTerm) ||
            (c.cargo?.toLowerCase() || '').includes(lowerTerm) ||
            (c.cidade?.toLowerCase() || '').includes(lowerTerm)
        )
    }

    if (filterSocio) result = result.filter(c => c.socio === filterSocio)
    if (filterBrinde) result = result.filter(c => c.tipo_brinde === filterBrinde)

    result.sort((a: any, b: any) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0

        if (sortOrder === 'newest') return dateB - dateA
        if (sortOrder === 'oldest') return dateA - dateB
        if (sortOrder === 'az') return (a.nome || '').localeCompare(b.nome || '')
        if (sortOrder === 'za') return (b.nome || '').localeCompare(a.nome || '')
        return 0
    })

    return result
  }, [clients, searchTerm, filterSocio, filterBrinde, sortOrder])

  // --- IMPORTAÇÃO DE EXCEL ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if(!confirm(`Deseja importar este arquivo para a tabela: ${tableName.toUpperCase()}?`)) {
        if (fileInputRef.current) fileInputRef.current.value = ''
        return;
    }

    setImporting(true)

    try {
      const data = await file.arrayBuffer()
      const workbook = read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = utils.sheet_to_json(worksheet)

      if (jsonData.length === 0) throw new Error('Arquivo vazio')

      // Mapeia os dados do Excel para o formato do banco
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || 'Importação';

      const itemsToInsert = jsonData.map((row: any) => ({
        nome: row.nome || row.Nome,
        empresa: row.empresa || row.Empresa || '',
        cargo: row.cargo || row.Cargo || '',
        email: row.email || row.Email || '',
        telefone: row.telefone || row.Telefone || '',
        socio: row.socio || row.Socio || '',
        tipo_brinde: row.tipo_brinde || row['Tipo Brinde'] || 'Brinde Médio',
        quantidade: row.quantidade || row.Quantidade || 1,
        cep: row.cep || row.CEP || '',
        endereco: row.endereco || row.Endereco || '',
        numero: row.numero || row.Numero || '',
        bairro: row.bairro || row.Bairro || '',
        cidade: row.cidade || row.Cidade || '',
        estado: row.estado || row.Estado || '',
        created_by: userEmail,
        updated_by: userEmail
      }))
      
      const { error } = await supabase.from(tableName).insert(itemsToInsert)
      
      if (error) throw error
      
      alert(`${itemsToInsert.length} registros importados com sucesso em ${tableName.toUpperCase()}!`)
      await logAction('IMPORTAR', tableName.toUpperCase(), `Importou ${itemsToInsert.length} via Excel`)
      
      fetchClients()

    } catch (error: any) {
      console.error('Erro na importação:', error)
      alert('Erro ao importar: ' + error.message)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSave = async (client: ClientData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email || 'Sistema';
    const logModule = tableName.toUpperCase();

    const dbData: any = {
        nome: client.nome,
        empresa: client.empresa,
        cargo: client.cargo,
        telefone: client.telefone,
        tipo_brinde: client.tipo_brinde,
        outro_brinde: client.outro_brinde,
        quantidade: client.quantidade,
        cep: client.cep,
        endereco: client.endereco,
        numero: client.numero,
        complemento: client.complemento,
        bairro: client.bairro,
        cidade: client.cidade,
        estado: client.estado,
        email: client.email,
        socio: client.socio,
        observacoes: client.observacoes,
        ignored_fields: client.ignored_fields,
        historico_brindes: client.historico_brindes,
        updated_by: userEmail,
        updated_at: new Date().toISOString()
    }

    try {
        if (clientToEdit && clientToEdit.id) {
            const { error } = await supabase.from(tableName).update(dbData).eq('id', clientToEdit.id)
            if (error) throw error
            await logAction('EDITAR', logModule, `Atualizou: ${client.nome}`)
        } else {
            dbData.created_by = userEmail;
            const { error } = await supabase.from(tableName).insert([dbData])
            if (error) throw error
            await logAction('CRIAR', logModule, `Criou: ${client.nome}`)
        }
        setIsModalOpen(false)
        setClientToEdit(null)
        fetchClients()
    } catch (error: any) {
        console.error('Erro ao salvar:', error)
        alert(`Erro ao salvar: ${error.message}`)
    }
  }

  const handleDelete = async (client: ClientData) => {
    if (confirm(`Tem certeza que deseja excluir ${client.nome}?`)) {
        const { error } = await supabase.from(tableName).delete().eq('id', client.id)
        if (!error) {
            await logAction('EXCLUIR', tableName.toUpperCase(), `Excluiu: ${client.nome}`)
            fetchClients()
        }
    }
  }

  const openEditModal = (client: ClientData) => {
    setClientToEdit(client)
    setIsModalOpen(true)
  }

  const openNewModal = () => {
    setClientToEdit(null)
    setIsModalOpen(true)
  }

  const handleWhatsApp = (client: ClientData, e?: React.MouseEvent) => {
    if(e) { e.preventDefault(); e.stopPropagation(); }
    const cleanPhone = (client.telefone || '').replace(/\D/g, '');
    if(!cleanPhone) { alert("Telefone não cadastrado."); return; }
    
    const message = `Olá Sr(a). ${client.nome}.\n\nSomos do Salomão Advogados e estamos atualizando nossa base de dados.\nPoderia, por gentileza, confirmar se as informações abaixo estão corretas?\n\n🏢 Empresa: ${client.empresa || '-'}\n📮 CEP: ${client.cep || '-'}\n📍 Endereço: ${client.endereco || '-'}\n🔢 Número: ${client.numero || '-'}\n🏘️ Bairro: ${client.bairro || '-'}\n🏙️ Cidade/UF: ${client.cidade || '-'}/${client.estado || '-'}\n📝 Complemento: ${client.complemento || '-'}\n📧 E-mail: ${client.email || '-'}\n\n📱 Outro número de telefone: (Caso possua, por favor informar)\n\nAgradecemos a atenção!`;
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  const handle3CX = (client: ClientData, e?: React.MouseEvent) => {
    if(e) { e.preventDefault(); e.stopPropagation(); }
    const cleanPhone = (client.telefone || '').replace(/\D/g, '');
    if(!cleanPhone) { alert("Telefone não cadastrado."); return; }
    window.location.href = `tel:${cleanPhone}`;
  }

  const handleEmail = (client: ClientData, e?: React.MouseEvent) => {
    if(e) { e.preventDefault(); e.stopPropagation(); }
    if(!client.email) { alert("E-mail não cadastrado."); return; }
    
    const subject = encodeURIComponent("Atualização Cadastral - Salomão Advogados");
    const bodyText = `Olá Sr(a). ${client.nome}.\n\nSomos do Salomão Advogados e estamos atualizando nossa base de dados.\nPoderia, por gentileza, confirmar se as informações abaixo estão corretas?\n\n🏢 Empresa: ${client.empresa || '-'}\n📮 CEP: ${client.cep || '-'}\n📍 Endereço: ${client.endereco || '-'}\n🔢 Número: ${client.numero || '-'}\n🏘️ Bairro: ${client.bairro || '-'}\n🏙️ Cidade/UF: ${client.cidade || '-'}/${client.estado || '-'}\n📝 Complemento: ${client.complemento || '-'}\n📧 E-mail: ${client.email || '-'}\n\nAgradecemos desde já!`;
    const body = encodeURIComponent(bodyText);
    
    window.open(`mailto:${client.email}?subject=${subject}&body=${body}`, '_blank');
  }

  const handleExportExcel = async () => {
    const ws = utils.json_to_sheet(processedClients)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, "Lista")
    writeFile(wb, `Relatorio_${tableName}.xlsx`)
    await logAction('EXPORTAR', tableName.toUpperCase(), `Exportou ${processedClients.length} registros`)
  }

  const handlePrintList = () => {
    if (processedClients.length === 0) return alert("Lista vazia.")
    const printWindow = window.open('', '', 'width=900,height=800');
    if (!printWindow) return;
    
    const listHtml = processedClients.map(c => 
        `<div style="border:1px solid #ddd; padding:10px; margin-bottom:10px; break-inside:avoid;">
            <strong>${c.nome}</strong> (${c.empresa})<br/>
            <small>Sócio: ${c.socio} | Brinde: ${c.tipo_brinde}</small>
        </div>`
    ).join('');

    printWindow.document.write(`<html><body><h2>Lista: ${tableName.toUpperCase()}</h2>${listHtml}<script>window.print()</script></body></html>`);
    printWindow.document.close();
  }

  if (loading) return (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#112240]"></div>
    </div>
  )

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Input de arquivo invisível para a importação */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx, .xls"
        className="hidden" 
      />

      <div className="flex-shrink-0 flex flex-col gap-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
            <div className="pl-2">
                <p className="text-sm font-medium text-gray-500">
                    <span className="font-bold text-[#112240]">{processedClients.length}</span> registros
                </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 text-gray-400 mr-1 hidden sm:flex"><Filter className="h-4 w-4" /></div>

                <div className="relative">
                    <select value={filterSocio} onChange={(e) => setFilterSocio(e.target.value)} className={`appearance-none pl-3 pr-8 py-2 rounded-lg text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors cursor-pointer ${filterSocio ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                        <option value="">Todos os Sócios</option>
                        {availableSocios.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="relative">
                    <select value={filterBrinde} onChange={(e) => setFilterBrinde(e.target.value)} className={`appearance-none pl-3 pr-8 py-2 rounded-lg text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors cursor-pointer ${filterBrinde ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                        <option value="">Todos os Brindes</option>
                        {availableBrindes.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>

                <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:text-[#112240] hover:bg-gray-100 transition-colors">
                        <ArrowUpDown className="h-3.5 w-3.5" /><span className="hidden sm:inline">{sortOrder === 'newest' ? 'Recentes' : sortOrder === 'oldest' ? 'Antigos' : 'Nome'}</span>
                    </Menu.Button>
                    <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                        <Menu.Items className="absolute right-0 mt-1 w-40 origin-top-right rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                            <div className="p-1">
                                {[{ id: 'newest', label: 'Mais Recentes' }, { id: 'oldest', label: 'Mais Antigos' }, { id: 'az', label: 'Nome (A-Z)' }, { id: 'za', label: 'Nome (Z-A)' }].map((opt) => (
                                    <Menu.Item key={opt.id}>
                                        {({ active }) => (
                                            <button onClick={() => setSortOrder(opt.id as any)} className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center justify-between px-3 py-2 text-xs text-gray-700 rounded-md`}>
                                                {opt.label}{sortOrder === opt.id && <Check className="h-3 w-3 text-blue-600" />}
                                            </button>
                                        )}
                                    </Menu.Item>
                                ))}
                            </div>
                        </Menu.Items>
                    </Transition>
                </Menu>

                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                <button onClick={() => { setIsSearchOpen(!isSearchOpen); if(isSearchOpen) setSearchTerm(''); }} className={`p-2 rounded-lg transition-colors ${isSearchOpen ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-400 hover:text-[#112240] hover:bg-gray-100 border border-gray-200'}`} title="Buscar">
                    {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                </button>
                
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={importing}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors" 
                        title="Importar Excel"
                    >
                        {importing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                    </button>
                    <button onClick={handleExportExcel} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 transition-colors" title="Exportar Excel"><FileSpreadsheet className="h-5 w-5" /></button>
                    <button onClick={handlePrintList} className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors" title="Imprimir Lista"><Printer className="h-5 w-5" /></button>
                </div>

                <button onClick={openNewModal} className="flex items-center gap-2 bg-[#112240] hover:bg-[#1a3a6c] text-white px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors shadow-sm whitespace-nowrap">
                    <Plus className="h-4 w-4" /><span className="hidden sm:inline">Novo Registro</span>
                </button>
            </div>
        </div>

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSearchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Busque por nome, empresa..." className="w-full pl-10 pr-4 py-3 bg-white border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-[#112240] placeholder:text-gray-400 shadow-sm" autoFocus={isSearchOpen} />
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {processedClients.map((client) => (
                <div key={client.id || client.email} onClick={() => openEditModal(client)} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all relative group cursor-pointer animate-fadeIn flex flex-col justify-between h-full">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex gap-3 overflow-hidden">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-[#112240] font-bold border border-gray-200 flex-shrink-0">
                                {client.nome?.charAt(0) || '?'}
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="text-sm font-bold text-gray-900 truncate" title={client.nome}>{client.nome}</h3>
                                <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
                                    <Briefcase className="h-3 w-3 inline" /><span>{client.empresa}</span>
                                </div>
                            </div>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full flex-shrink-0 ${client.tipo_brinde === 'Brinde VIP' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>{client.tipo_brinde}</span>
                    </div>
                    
                    <div className="bg-gray-50 rounded-md p-2.5 mb-3 text-xs space-y-2 border border-gray-100">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-1.5"><div className="flex items-center gap-1.5 text-gray-500"><Info className="h-3 w-3" /><span>Sócio:</span></div><span className="font-bold text-[#112240] truncate ml-2">{client.socio || '-'}</span></div>
                        <div className="flex justify-between items-center"><div className="flex items-center gap-1.5 text-gray-500"><User className="h-3 w-3" /><span>Cargo:</span></div><span className="font-medium text-gray-700 truncate ml-2 max-w-[120px] text-right">{client.cargo || '-'}</span></div>
                        <div className="flex justify-between items-center"><div className="flex items-center gap-1.5 text-gray-500"><Gift className="h-3 w-3" /><span>Brinde:</span></div><span className="font-medium text-gray-700 truncate ml-2 text-right">{client.tipo_brinde} ({client.quantidade}x)</span></div>
                        <div className="flex justify-between items-start"><div className="flex items-center gap-1.5 text-gray-500 flex-shrink-0"><MapPin className="h-3 w-3" /><span>Local:</span></div><span className="font-medium text-gray-700 truncate text-right ml-2" title={`${client.cidade || ''}/${client.estado || ''}`}>{client.cidade || client.estado ? `${client.cidade || ''}/${client.estado || ''}` : '-'}</span></div>
                    </div>

                    <div className="border-t border-gray-100 pt-3 flex justify-between items-center mt-auto">
                        <div className="flex gap-2">
                            {client.telefone && (
                                <>
                                    <button onClick={(e) => handleWhatsApp(client, e)} className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 rounded-md transition-colors" title="WhatsApp"><MessageCircle className="h-3.5 w-3.5" /></button>
                                    <button onClick={(e) => handle3CX(client, e)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors" title="Ligar 3CX"><Phone className="h-3.5 w-3.5" /></button>
                                </>
                            )}
                            {client.email && <button onClick={(e) => handleEmail(client, e)} className="p-1.5 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors" title="Email"><Mail className="h-3.5 w-3.5" /></button>}
                        </div>
                        <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); openEditModal(client); }} className="p-1.5 text-gray-400 hover:text-[#112240] hover:bg-gray-100 rounded-md transition-colors" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(client); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        {processedClients.length === 0 && (
            <div className="text-center py-12 text-gray-400"><Search className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>Nenhum registro encontrado.</p><button onClick={() => {setSearchTerm(''); setFilterBrinde(''); setFilterSocio('');}} className="mt-2 text-blue-600 text-sm font-bold hover:underline">Limpar tudo</button></div>
        )}
      </div>

      <NewClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} clientToEdit={clientToEdit} />
    </div>
  )
}
