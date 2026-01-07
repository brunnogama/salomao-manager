import { useEffect, useState, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Plus, Search, X, Filter, ArrowUpDown, Check, 
  MessageCircle, Trash2, Pencil, Mail, Phone, 
  Briefcase, User, Gift, Info, MapPin, Printer, FileSpreadsheet,
  Upload, Loader2, AlertTriangle
} from 'lucide-react'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { NewClientModal, ClientData } from './NewClientModal'
import { utils, writeFile, read } from 'xlsx'
import { logAction } from '../lib/logger'

interface ClientsProps {
  initialFilters?: { socio?: string; brinde?: string };
  tableName?: string; // 'clientes' ou 'magistrados'
}

export function Clients({ initialFilters, tableName = 'clientes' }: ClientsProps) {
  const [clients, setClients] = useState<ClientData[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clientToEdit, setClientToEdit] = useState<ClientData | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSocio, setFilterSocio] = useState<string>('')
  const [filterBrinde, setFilterBrinde] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest')

  const [availableSocios, setAvailableSocios] = useState<string[]>([])
  const [availableBrindes, setAvailableBrindes] = useState<string[]>([])

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
    } else if (error) {
        console.error("Erro fetch:", error)
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

  // --- DELETE MANUAL ---
  const handleDelete = async (client: ClientData) => {
    if (!client.id) return alert("Erro: Registro sem ID.")

    if (confirm(`Tem certeza que deseja excluir permanentemente: ${client.nome}?`)) {
        try {
            console.log(`Iniciando exclusão manual para ID ${client.id}...`)

            // 1. Tenta limpar tarefas vinculadas primeiro
            try {
               await supabase.from('tasks').delete().eq('client_id', client.id);
            } catch (e) { console.warn("Aviso: Não foi possível limpar tarefas vinculadas.", e) }

            // 2. Agora tenta excluir o cliente
            const { error } = await supabase.from(tableName).delete().eq('id', client.id)
            
            if (error) {
                console.error("Erro Supabase:", error)
                throw new Error(error.message)
            }

            // 3. Sucesso na interface
            setClients(current => current.filter(c => c.id !== client.id))
            await logAction('EXCLUIR', tableName.toUpperCase(), `Excluiu: ${client.nome}`)
            
        } catch (error: any) {
            alert(`Erro ao excluir: ${error.message}\nVerifique permissões.`)
        }
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if(!confirm(`Importar para: ${tableName.toUpperCase()}?`)) {
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
    }

    setImporting(true)

    try {
      const data = await file.arrayBuffer()
      const workbook = read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = utils.sheet_to_json(worksheet)

      if (jsonData.length === 0) throw new Error('Arquivo vazio.')

      // Correção de Tipo: Força any para evitar erro de build
      const { data: { user } } = await (supabase.auth as any).getUser()
      const userEmail = user?.email || 'Importação'

      const normalizeKeys = (obj: any) => {
          const newObj: any = {};
          Object.keys(obj).forEach(key => {
              newObj[key.trim().toLowerCase()] = obj[key];
          });
          return newObj;
      }

      const itemsToInsert = jsonData.map((rawRow: any) => {
        const row = normalizeKeys(rawRow);
        if (!row.nome && !row['nome completo']) return null;

        return {
            nome: row.nome || row['nome completo'] || 'Sem Nome',
            empresa: row.empresa || '',
            cargo: row.cargo || '',
            email: row.email || row['e-mail'] || '',
            telefone: row.telefone || row.celular || '',
            socio: row.socio || row['sócio'] || '',
            tipo_brinde: row.tipo_brinde || row['tipo de brinde'] || row.brinde || 'Brinde Médio',
            quantidade: row.quantidade || 1,
            cep: row.cep || '',
            endereco: row.endereco || row['endereço'] || '',
            numero: row.numero || row['número'] || '',
            bairro: row.bairro || '',
            cidade: row.cidade || '',
            estado: row.estado || row.uf || '',
            created_by: userEmail,
            updated_by: userEmail
        }
      }).filter(Boolean);
      
      const { error } = await supabase.from(tableName).insert(itemsToInsert)
      if (error) throw error
      
      alert(`${itemsToInsert.length} importados com sucesso!`)
      await logAction('IMPORTAR', tableName.toUpperCase(), `Importou ${itemsToInsert.length} itens`)
      fetchClients()

    } catch (error: any) {
      alert('Erro na importação: ' + error.message)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const triggerFileInput = () => {
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
          fileInputRef.current.click();
      }
  }

  const handleSave = async (client: ClientData) => {
    // Correção de Tipo: Força any
    const { data: { user } } = await (supabase.auth as any).getUser()
    const userEmail = user?.email || 'Sistema'
    
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
            await logAction('EDITAR', tableName.toUpperCase(), `Atualizou: ${client.nome}`)
        } else {
            dbData.created_by = userEmail
            const { error } = await supabase.from(tableName).insert([dbData])
            if (error) throw error
            await logAction('CRIAR', tableName.toUpperCase(), `Criou: ${client.nome}`)
        }
        setIsModalOpen(false)
        setClientToEdit(null)
        fetchClients()
    } catch (error: any) {
        alert(`Erro ao salvar: ${error.message}`)
    }
  }

  // Helpers
  const handleWhatsApp = (client: ClientData, e?: React.MouseEvent) => {
    if(e) { e.preventDefault(); e.stopPropagation(); }
    const cleanPhone = (client.telefone || '').replace(/\D/g, '')
    if(!cleanPhone) return alert("Telefone não cadastrado.")
    
    const message = `Olá Sr(a). ${client.nome}.

Somos do escritório Salomão Advogados e gostaríamos de confirmar seus dados cadastrais para o envio do brinde de final de ano.

📋 *Dados Cadastrados:*
• Nome: ${client.nome}
• Empresa: ${client.empresa || 'Não informado'}
• Cargo: ${client.cargo || 'Não informado'}
• Brinde: ${client.tipo_brinde} (${client.quantidade}x)

📍 *Endereço de Entrega:*
• CEP: ${client.cep || 'Não informado'}
• Endereço: ${client.endereco || 'Não informado'}, ${client.numero || 'S/N'}
${client.complemento ? `• Complemento: ${client.complemento}` : ''}
• Bairro: ${client.bairro || 'Não informado'}
• Cidade/UF: ${client.cidade || 'Não informado'}/${client.estado || 'Não informado'}

Por favor, confirme se todos os dados estão corretos ou nos informe quaisquer alterações necessárias.

Atenciosamente,
Equipe Salomão Advogados`
    
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handle3CX = (client: ClientData, e?: React.MouseEvent) => {
    if(e) { e.preventDefault(); e.stopPropagation(); }
    const cleanPhone = (client.telefone || '').replace(/\D/g, '')
    if(!cleanPhone) return alert("Telefone não cadastrado.")
    window.location.href = `tel:${cleanPhone}`
  }

  const handleEmail = (client: ClientData, e?: React.MouseEvent) => {
    if(e) { e.preventDefault(); e.stopPropagation(); }
    if(!client.email) return alert("E-mail não cadastrado.")
    
    const subject = encodeURIComponent("Confirmação de Dados Cadastrais - Salomão Advogados")
    const body = encodeURIComponent(`Prezado(a) Sr(a). ${client.nome},

Somos do escritório Salomão Advogados e gostaríamos de confirmar seus dados cadastrais para o envio do brinde de final de ano.

DADOS CADASTRADOS:
• Nome: ${client.nome}
• Empresa: ${client.empresa || 'Não informado'}
• Cargo: ${client.cargo || 'Não informado'}
• Telefone: ${client.telefone || 'Não informado'}
• E-mail: ${client.email}
• Brinde: ${client.tipo_brinde} (${client.quantidade}x)
• Sócio Responsável: ${client.socio || 'Não informado'}

ENDEREÇO DE ENTREGA:
• CEP: ${client.cep || 'Não informado'}
• Endereço: ${client.endereco || 'Não informado'}, ${client.numero || 'S/N'}
${client.complemento ? `• Complemento: ${client.complemento}\n` : ''}• Bairro: ${client.bairro || 'Não informado'}
• Cidade/UF: ${client.cidade || 'Não informado'}/${client.estado || 'Não informado'}

Por favor, confirme se todos os dados estão corretos ou nos informe quaisquer alterações necessárias respondendo a este e-mail.

Atenciosamente,
Equipe Salomão Advogados`)
    
    window.open(`mailto:${client.email}?subject=${subject}&body=${body}`, '_blank')
  }

  const handleExportExcel = async () => {
    const ws = utils.json_to_sheet(processedClients)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, "Lista")
    writeFile(wb, `Relatorio_${tableName}.xlsx`)
  }

  const handlePrintList = () => {
    if (processedClients.length === 0) return alert("Lista vazia.")
    const printWindow = window.open('', '', 'width=900,height=800')
    if (!printWindow) return
    const listHtml = processedClients.map(c => `<div><strong>${c.nome}</strong> (${c.empresa})</div>`).join('')
    printWindow.document.write(`<html><body><h2>Lista: ${tableName.toUpperCase()}</h2>${listHtml}<script>window.print()</script></body></html>`)
    printWindow.document.close()
  }

  const openEditModal = (client: ClientData) => {
    setClientToEdit(client)
    setIsModalOpen(true)
  }

  if (loading) return (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#112240]"></div>
    </div>
  )

  return (
    <div className="h-full flex flex-col gap-4">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />

      <div className="flex-shrink-0 flex flex-col gap-4">
        {/* HEADER */}
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
                                        {({ active }: { active: boolean }) => (
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

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSearchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Busque por nome, empresa..." className="w-full pl-10 pr-4 py-3 bg-white border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-[#112240] placeholder:text-gray-400 shadow-sm" autoFocus={isSearchOpen} />
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
        {processedClients.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <AlertTriangle className="h-12 w-12 mb-2 opacity-20" />
                <p>Nenhum registro encontrado em {tableName}.</p>
                {tableName === 'magistrados' && <p className="text-xs mt-2">Verifique se você importou a base corretamente.</p>}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {processedClients.map((client) => {
                    // Definir cores baseado no tipo de brinde
                    const getBrindeColors = (tipo: string) => {
                        if (tipo === 'Brinde VIP') {
                            return {
                                bar: 'bg-gradient-to-b from-purple-500 to-purple-600',
                                avatar: 'bg-gradient-to-br from-purple-500 to-purple-600',
                                badge: 'bg-purple-100 text-purple-700 border-purple-200'
                            }
                        } else if (tipo === 'Brinde Médio') {
                            return {
                                bar: 'bg-gradient-to-b from-green-500 to-green-600',
                                avatar: 'bg-gradient-to-br from-green-500 to-green-600',
                                badge: 'bg-green-100 text-green-700 border-green-200'
                            }
                        } else if (tipo === 'Outro') {
                            return {
                                bar: 'bg-gradient-to-b from-blue-500 to-blue-600',
                                avatar: 'bg-gradient-to-br from-blue-500 to-blue-600',
                                badge: 'bg-blue-100 text-blue-700 border-blue-200'
                            }
                        } else {
                            // Não Recebe
                            return {
                                bar: 'bg-gradient-to-b from-gray-400 to-gray-500',
                                avatar: 'bg-gradient-to-br from-gray-400 to-gray-500',
                                badge: 'bg-gray-100 text-gray-700 border-gray-200'
                            }
                        }
                    }

                    const colors = getBrindeColors(client.tipo_brinde)

                    return (
                        <div 
                            key={client.id || client.email} 
                            onClick={() => openEditModal(client)} 
                            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 hover:shadow-xl hover:border-blue-200 transition-all duration-300 relative group cursor-pointer animate-fadeIn flex flex-col justify-between h-full overflow-hidden"
                        >
                            {/* Barra lateral colorida de acordo com o brinde */}
                            <div className={`absolute left-0 top-0 w-1 h-full ${colors.bar}`}></div>

                            {/* Header do Card */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex gap-3 overflow-hidden flex-1">
                                    {/* Avatar com gradiente */}
                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-lg ${colors.avatar}`}>
                                        {client.nome?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    
                                    <div className="overflow-hidden flex-1">
                                        <h3 className="text-base font-black text-gray-900 truncate leading-tight mb-0.5" title={client.nome}>
                                            {client.nome}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
                                            <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span className="truncate">{client.empresa || 'Sem empresa'}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Badge do tipo de brinde */}
                                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg flex-shrink-0 ml-2 shadow-sm ${colors.badge}`}>
                                    {client.tipo_brinde === 'Brinde VIP' ? 'VIP' :
                                     client.tipo_brinde === 'Brinde Médio' ? 'MÉDIO' :
                                     client.tipo_brinde === 'Outro' ? 'OUTRO' :
                                     'NÃO RECEBE'}
                                </span>
                            </div>
                            
                            {/* Informações em cards menores */}
                            <div className="space-y-2 mb-3">
                                {/* Sócio */}
                                <div className="bg-gradient-to-r from-blue-50 to-blue-50/50 rounded-lg p-2.5 border border-blue-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-blue-700">
                                            <div className="bg-blue-100 p-1 rounded-md">
                                                <Info className="h-3 w-3" />
                                            </div>
                                            <span className="font-medium">Sócio</span>
                                        </div>
                                        <span className="font-bold text-blue-900 text-xs truncate ml-2 max-w-[140px]" title={client.socio}>
                                            {client.socio || '-'}
                                        </span>
                                    </div>
                                </div>

                                {/* Cargo e Local em grid */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1">
                                            <User className="h-3 w-3" />
                                            <span>Cargo</span>
                                        </div>
                                        <p className="font-bold text-xs text-gray-900 truncate" title={client.cargo}>
                                            {client.cargo || '-'}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1">
                                            <MapPin className="h-3 w-3" />
                                            <span>Local</span>
                                        </div>
                                        <p className="font-bold text-xs text-gray-900 truncate" title={`${client.cidade || ''}/${client.estado || ''}`}>
                                            {client.cidade || client.estado ? `${client.cidade || ''}/${client.estado || ''}` : '-'}
                                        </p>
                                    </div>
                                </div>

                                {/* Brinde info */}
                                <div className="bg-gradient-to-r from-amber-50 to-amber-50/50 rounded-lg p-2 border border-amber-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-xs text-amber-700">
                                            <Gift className="h-3.5 w-3.5" />
                                            <span className="font-medium">{client.tipo_brinde}</span>
                                        </div>
                                        {client.tipo_brinde !== 'Não Recebe' && (
                                            <span className="bg-amber-100 text-amber-800 text-xs font-black px-2 py-0.5 rounded-md">
                                                {client.quantidade}x
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer com ações */}
                            <div className="border-t border-gray-100 pt-3 flex justify-between items-center mt-auto">
                                {/* Botões de comunicação */}
                                <div className="flex gap-1.5">
                                    {client.telefone && (
                                        <>
                                            <button 
                                                onClick={(e) => handleWhatsApp(client, e)} 
                                                className="p-2 text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-all hover:scale-110 active:scale-95 shadow-sm" 
                                                title="WhatsApp"
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={(e) => handle3CX(client, e)} 
                                                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all hover:scale-110 active:scale-95 shadow-sm" 
                                                title="Ligar 3CX"
                                            >
                                                <Phone className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}
                                    {client.email && (
                                        <button 
                                            onClick={(e) => handleEmail(client, e)} 
                                            className="p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all hover:scale-110 active:scale-95 shadow-sm" 
                                            title="Email"
                                        >
                                            <Mail className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                
                                {/* Botões de edição/exclusão */}
                                <div className="flex gap-1">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); openEditModal(client); }} 
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-200" 
                                        title="Editar"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(client); }} 
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all z-10 border border-transparent hover:border-red-200" 
                                        title="Excluir"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        )}
      </div>

      <NewClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} clientToEdit={clientToEdit} />
    </div>
  )
}