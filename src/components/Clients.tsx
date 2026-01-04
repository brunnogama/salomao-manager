import { useState, useEffect, useMemo } from 'react'
import { Plus, Filter, LayoutList, LayoutGrid, Pencil, Trash2, X, AlertTriangle, ChevronDown, FileSpreadsheet, RefreshCw, ArrowUpDown, MessageCircle, Phone } from 'lucide-react'
import { NewClientModal, ClientData } from './NewClientModal'
import { utils, writeFile } from 'xlsx'
import { supabase } from '../lib/supabase'

interface Client extends ClientData {
  id: number;
}

export function Clients() {
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

  // Filtros
  const [socioFilter, setSocioFilter] = useState('')
  const [brindeFilter, setBrindeFilter] = useState('')
  
  // Ordenação
  const [sortBy, setSortBy] = useState<'nome' | 'socio' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const [clients, setClients] = useState<Client[]>([])

  // 1. BUSCAR DADOS
  const fetchClients = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar clientes:', error)
    } else {
      const formattedClients: Client[] = data.map((item: any) => ({
        id: item.id,
        nome: item.nome,
        empresa: item.empresa,
        cargo: item.cargo,
        telefone: item.telefone,
        tipoBrinde: item.tipo_brinde,
        outroBrinde: item.outro_brinde,
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
        observacoes: item.observacoes
      }))
      setClients(formattedClients)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const uniqueSocios = Array.from(new Set(clients.map(c => c.socio).filter(Boolean)))
  const uniqueBrindes = Array.from(new Set(clients.map(c => c.tipoBrinde).filter(Boolean)))

  // LÓGICA DE FILTRO E ORDENAÇÃO
  const processedClients = useMemo(() => {
    let result = clients.filter(client => {
      const matchesSocio = socioFilter ? client.socio === socioFilter : true
      const matchesBrinde = brindeFilter ? client.tipoBrinde === brindeFilter : true
      return matchesSocio && matchesBrinde
    })

    if (sortBy) {
      result.sort((a, b) => {
        let valA = (sortBy === 'nome' ? a.nome : a.socio) || ''
        let valB = (sortBy === 'nome' ? b.nome : b.socio) || ''
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
      })
    }
    return result
  }, [clients, socioFilter, brindeFilter, sortBy, sortDirection])

  const toggleSort = (field: 'nome' | 'socio') => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDirection('asc')
    }
  }

  // AÇÕES DE CONTATO (WHATSAPP FORMAL E 3CX)
  const handleWhatsApp = (client: Client) => {
    const cleanPhone = client.telefone.replace(/\D/g, '')
    
    // MENSAGEM PADRONIZADA COM DADOS
    const message = `Olá Sr(a). ${client.nome}, somos do Salomão Advogados.

Estamos atualizando nossa base de dados. Poderia, por gentileza, confirmar se as informações abaixo estão corretas?

🏢 *Empresa:* ${client.empresa || '-'}
📮 *CEP:* ${client.cep || '-'}
📍 *Endereço:* ${client.endereco || '-'}
🔢 *Número:* ${client.numero || '-'}
🏘️ *Bairro:* ${client.bairro || '-'}
🏙️ *Cidade/UF:* ${client.cidade || '-'}/${client.estado || '-'}
📝 *Complemento:* ${client.complemento || '-'}
📧 *E-mail:* ${client.email || '-'}

📱 *Outro número de telefone:* (Caso possua, por favor informar)

Agradecemos a atenção!`

    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  const handle3CX = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    // 'tel:' abre o app padrão de chamadas (3CX se configurado no SO)
    window.location.href = `tel:${cleanPhone}`
  }

  const handleSaveClient = async (clientData: ClientData) => {
    const dbData = {
      nome: clientData.nome,
      empresa: clientData.empresa,
      cargo: clientData.cargo,
      telefone: clientData.telefone,
      tipo_brinde: clientData.tipoBrinde,
      outro_brinde: clientData.outroBrinde,
      quantidade: clientData.quantidade,
      cep: clientData.cep,
      endereco: clientData.endereco,
      numero: clientData.numero,
      complemento: clientData.complemento,
      bairro: clientData.bairro,
      cidade: clientData.cidade,
      estado: clientData.estado,
      email: clientData.email,
      socio: clientData.socio,
      observacoes: clientData.observacoes
    }

    try {
      if (clientToEdit) {
        const { error } = await supabase.from('clientes').update(dbData).eq('id', clientToEdit.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('clientes').insert([dbData])
        if (error) throw error
      }
      await fetchClients()
      setIsModalOpen(false)
      setClientToEdit(null)
    } catch (error: any) {
      alert(`Erro ao salvar: ${error.message}`)
    }
  }

  const confirmDelete = async () => {
    if (clientToDelete) {
      try {
        const { error } = await supabase.from('clientes').delete().eq('id', clientToDelete.id)
        if (error) throw error
        await fetchClients()
        setClientToDelete(null)
      } catch (error: any) {
        alert(`Erro ao excluir: ${error.message}`)
      }
    }
  }

  const handleEdit = (client: Client) => {
    setClientToEdit(client)
    setIsModalOpen(true)
  }

  const closeModal = () => { setIsModalOpen(false); setClientToEdit(null); }
  const clearFilters = () => { setSocioFilter(''); setBrindeFilter(''); setSortBy(null); }

  const handleExportExcel = () => {
    const dataToExport = processedClients.map(client => ({
      "Nome do Cliente": client.nome,
      "Empresa": client.empresa,
      "Telefone": client.telefone,
      "Cargo": client.cargo,
      "Sócio Responsável": client.socio,
      "Tipo de Brinde": client.tipoBrinde,
      "Quantidade": client.quantidade,
      "Especificação (Outro)": client.outroBrinde || '-',
      "Email": client.email,
      "Cidade": client.cidade,
      "Estado": client.estado,
      "Endereço Completo": `${client.endereco}, ${client.numero} ${client.complemento ? '- ' + client.complemento : ''} - ${client.bairro}`,
      "CEP": client.cep,
      "Observações": client.observacoes
    }))

    const ws = utils.json_to_sheet(dataToExport)
    const wscols = [{ wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 5 }, { wch: 40 }, { wch: 10 }, { wch: 30 }]
    ws['!cols'] = wscols
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, "Clientes Salomão")
    writeFile(wb, `Gestao_Clientes_Salomao_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`)
  }

  return (
    <div className="h-full flex flex-col relative">
      <NewClientModal isOpen={isModalOpen} onClose={closeModal} onSave={handleSaveClient} clientToEdit={clientToEdit} />

      {clientToDelete && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
             <div className="flex items-center gap-4 mb-4 text-red-600">
               <div className="bg-red-100 p-3 rounded-full"><AlertTriangle className="h-6 w-6" /></div>
               <h3 className="text-xl font-bold text-gray-900">Excluir Cliente?</h3>
             </div>
             <p className="text-gray-600 mb-6">Deseja remover <strong>{clientToDelete.nome}</strong> permanentemente?</p>
             <div className="flex justify-end gap-3">
               <button onClick={() => setClientToDelete(null)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
               <button onClick={confirmDelete} className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"><Trash2 className="h-4 w-4" /> Excluir</button>
             </div>
          </div>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 px-1">
           <div className="relative group">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Filter className="h-4 w-4" /></div>
             <select value={socioFilter} onChange={(e) => setSocioFilter(e.target.value)} className="appearance-none pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#112240]/20 min-w-[160px]">
                <option value="">Sócio: Todos</option>
                {uniqueSocios.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDown className="h-4 w-4" /></div>
           </div>

           <div className="relative group">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Filter className="h-4 w-4" /></div>
             <select value={brindeFilter} onChange={(e) => setBrindeFilter(e.target.value)} className="appearance-none pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#112240]/20 min-w-[160px]">
                <option value="">Brinde: Todos</option>
                {uniqueBrindes.map(b => <option key={b} value={b}>{b}</option>)}
             </select>
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDown className="h-4 w-4" /></div>
           </div>

           <div className="flex bg-white border border-gray-200 rounded-lg p-1 gap-1">
              <button onClick={() => toggleSort('nome')} className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${sortBy === 'nome' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><ArrowUpDown className="h-3 w-3 mr-1" /> Nome</button>
              <button onClick={() => toggleSort('socio')} className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${sortBy === 'socio' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><ArrowUpDown className="h-3 w-3 mr-1" /> Sócio</button>
           </div>
           
           {(socioFilter || brindeFilter || sortBy) && (
             <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center px-2 py-1 bg-red-50 rounded whitespace-nowrap"><X className="h-3 w-3 mr-1" /> Limpar</button>
           )}

           <div className="h-6 w-px bg-gray-300 mx-2 hidden md:block"></div>

           <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-gray-100 text-[#112240]' : 'text-gray-400 hover:text-gray-600'}`}><LayoutList className="h-5 w-5" /></button>
              <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-md ${viewMode === 'card' ? 'bg-gray-100 text-[#112240]' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid className="h-5 w-5" /></button>
           </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto">
            <button onClick={fetchClients} className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"><RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /></button>
            <button onClick={handleExportExcel} className="flex-1 xl:flex-none flex items-center justify-center px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" /> Exportar Excel</button>
            <button onClick={() => { setClientToEdit(null); setIsModalOpen(true); }} className="flex-1 xl:flex-none flex items-center justify-center px-5 py-2.5 bg-[#112240] text-white rounded-lg hover:bg-[#1a3a6c] transition-all shadow-md flex items-center gap-2"><Plus className="h-5 w-5" /> Novo Cliente</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto pb-4">
        {loading && clients.length === 0 && (
          <div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#112240]"></div></div>
        )}

        {!loading && processedClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
            <Filter className="h-12 w-12 text-gray-300 mb-2" />
            <p>Nenhum cliente encontrado.</p>
            {(socioFilter || brindeFilter) && <button onClick={clearFilters} className="text-[#112240] font-bold hover:underline mt-2 text-sm">Limpar filtros</button>}
          </div>
        ) : (
          <>
            {viewMode === 'list' && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-[#112240]" onClick={() => toggleSort('nome')}>Cliente / Empresa {sortBy === 'nome' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cargo</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Brinde</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-[#112240]" onClick={() => toggleSort('socio')}>Sócio {sortBy === 'socio' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contato</th>
                      <th className="relative px-6 py-4"><span className="sr-only">Ações</span></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {processedClients.map((client) => (
                      <tr key={client.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">{client.nome}</span>
                            <span className="text-xs text-gray-500 font-medium">{client.empresa}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{client.cargo}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full border ${client.tipoBrinde === 'Brinde VIP' ? 'bg-purple-50 text-purple-700 border-purple-200' : client.tipoBrinde === 'Brinde Médio' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                            {client.tipoBrinde}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">{(client.socio || 'U').charAt(0)}</div>
                                {client.socio || '-'}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {client.telefone ? (
                            <div className="flex items-center gap-2">
                              {/* BOTÃO WHATSAPP ATUALIZADO */}
                              <button onClick={() => handleWhatsApp(client)} className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-full transition-colors" title="Enviar WhatsApp"><MessageCircle className="h-4 w-4" /></button>
                              <button onClick={() => handle3CX(client.telefone)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors" title="Ligar com 3CX"><Phone className="h-4 w-4" /></button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Sem telefone</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(client)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md" title="Editar"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => setClientToDelete(client)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {viewMode === 'card' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {processedClients.map((client) => (
                  <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all relative group">
                    <div className="absolute top-4 right-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${client.tipoBrinde === 'Brinde VIP' ? 'bg-purple-100 text-purple-800' : client.tipoBrinde === 'Brinde Médio' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {client.tipoBrinde}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[#112240] font-bold text-xl border border-gray-100">{client.nome.charAt(0)}</div>
                      <div>
                          <h3 className="text-lg font-bold text-gray-900 leading-tight">{client.nome}</h3>
                          <p className="text-sm text-gray-500">{client.empresa}</p>
                      </div>
                    </div>
                    
                    {/* BOTÕES DE AÇÃO RÁPIDA NO CARD */}
                    {client.telefone && (
                      <div className="flex gap-2 mb-4">
                        <button onClick={() => handleWhatsApp(client)} className="flex-1 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-bold flex items-center justify-center gap-1"><MessageCircle className="h-3 w-3" /> WhatsApp</button>
                        <button onClick={() => handle3CX(client.telefone)} className="flex-1 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-bold flex items-center justify-center gap-1"><Phone className="h-3 w-3" /> Ligar</button>
                      </div>
                    )}

                    <div className="space-y-2.5 text-sm text-gray-600 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                      <p className="flex justify-between"><span className="text-gray-400">Cargo:</span> <span className="font-medium text-gray-800">{client.cargo}</span></p>
                      <p className="flex justify-between"><span className="text-gray-400">Sócio:</span> <span className="font-medium text-gray-800">{client.socio}</span></p>
                      <p className="flex justify-between"><span className="text-gray-400">Local:</span> <span className="font-medium text-gray-800">{client.cidade}</span></p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end gap-2">
                        <button onClick={() => handleEdit(client)} className="flex-1 py-2 text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg font-medium transition-colors">Editar</button>
                        <button onClick={() => setClientToDelete(client)} className="py-2 px-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
