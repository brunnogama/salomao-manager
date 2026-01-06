import { useState, useEffect, useMemo } from 'react'
import { Plus, Filter, LayoutList, LayoutGrid, Pencil, Trash2, X, AlertTriangle, ChevronDown, FileSpreadsheet, RefreshCw, ArrowUpDown, MessageCircle, Phone, MapPin, Mail, Briefcase, Gift, Info, User, Printer, Calendar } from 'lucide-react'
import { NewClientModal, ClientData } from './NewClientModal'
import { utils, writeFile } from 'xlsx'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/logger'

interface Client extends ClientData {
  id: number;
}

interface ClientsProps {
  initialFilters?: { socio?: string; brinde?: string };
}

export function Clients({ initialFilters }: ClientsProps) {
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const [socioFilter, setSocioFilter] = useState(initialFilters?.socio || '')
  const [brindeFilter, setBrindeFilter] = useState(initialFilters?.brinde || '')
  
  useEffect(() => {
    if (initialFilters) {
        if (initialFilters.socio !== undefined) setSocioFilter(initialFilters.socio);
        if (initialFilters.brinde !== undefined) setBrindeFilter(initialFilters.brinde);
    }
  }, [initialFilters])
  
  const [sortBy, setSortBy] = useState<'nome' | 'socio' | null>('nome')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const [clients, setClients] = useState<Client[]>([])

  const fetchClients = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('clientes').select('*')
    
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
        observacoes: item.observacoes,
        ignored_fields: item.ignored_fields || [],
        historico_brindes: item.historico_brindes || [] // Adicionado aqui para corrigir o erro TS
      }))
      setClients(formattedClients)
    }
    setLoading(false)
  }

  useEffect(() => { fetchClients() }, [])

  const uniqueSocios = useMemo(() => {
    return Array.from(new Set(clients.map(c => c.socio).filter(Boolean))).sort();
  }, [clients]);

  const uniqueBrindes = useMemo(() => {
    return Array.from(new Set(clients.map(c => c.tipoBrinde).filter(Boolean))).sort();
  }, [clients]);

  const processedClients = useMemo(() => {
    let result = [...clients].filter(client => {
      const matchesSocio = socioFilter ? client.socio === socioFilter : true
      const matchesBrinde = brindeFilter ? client.tipoBrinde === brindeFilter : true
      return matchesSocio && matchesBrinde
    })

    if (sortBy) {
      result.sort((a, b) => {
        const valA = (sortBy === 'nome' ? a.nome : a.socio) || ''
        const valB = (sortBy === 'nome' ? b.nome : b.socio) || ''
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

  // --- IMPRESSÃO ---
  const handlePrint = (client: Client) => {
    const printWindow = window.open('', '', 'width=900,height=800');
    if (!printWindow) return;

    const historyRows = client.historico_brindes?.map(h => 
        `<tr><td style="padding:4px;border:1px solid #ddd">${h.ano}</td><td style="padding:4px;border:1px solid #ddd">${h.tipo}</td><td style="padding:4px;border:1px solid #ddd">${h.obs}</td></tr>`
    ).join('') || '<tr><td colspan="3" style="padding:4px;text-align:center;font-style:italic">Sem histórico</td></tr>';

    const htmlContent = `
      <html>
        <head>
          <title>Ficha Cadastral - ${client.nome}</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1f2937; }
            .header { border-bottom: 3px solid #112240; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: end; }
            .logo { font-size: 28px; font-weight: 800; color: #112240; text-transform: uppercase; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #112240; background: #f3f4f6; padding: 8px 12px; border-radius: 4px; margin-bottom: 15px; border-left: 4px solid #112240; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .label { font-size: 10px; color: #6b7280; font-weight: 700; text-transform: uppercase; display: block; }
            .value { font-size: 14px; color: #111827; font-weight: 500; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; display: block; width: 100%; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; padding: 6px; border: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="header"><div><div class="logo">Salomão Advogados</div><div>Ficha Cadastral</div></div></div>
          <div class="section"><div class="section-title">Dados</div><div class="grid"><div><span class="label">Nome</span><span class="value">${client.nome}</span></div><div><span class="label">Sócio</span><span class="value">${client.socio}</span></div></div></div>
          <div class="section"><div class="section-title">Histórico de Brindes</div>
            <table><thead><tr><th>Ano</th><th>Brinde</th><th>Obs</th></tr></thead><tbody>${historyRows}</tbody></table>
          </div>
          <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };</script>
        </body>
      </html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  const handlePrintList = () => {
    if (processedClients.length === 0) { alert("Nenhum cliente."); return; }
    const printWindow = window.open('', '', 'width=900,height=800');
    if (!printWindow) return;
    const clientsHtml = processedClients.map(client => `
      <div style="border:1px solid #ddd;border-radius:4px;padding:10px;background:#f9fafb;">
        <div style="font-weight:bold;color:#112240;display:flex;justify-content:space-between"><span>${client.nome}</span><span style="font-size:10px;background:#e0e7ff;color:#3730a3;padding:2px 6px;border-radius:4px">${client.socio}</span></div>
        <div style="font-size:11px;margin-top:5px">Empresa: ${client.empresa} | Brinde: ${client.tipoBrinde}</div>
      </div>`).join('');
    printWindow.document.write(`<html><body style="font-family:sans-serif;padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:15px">${clientsHtml}<script>window.onload=()=>{setTimeout(()=>{window.print();window.close();},500);};</script></body></html>`);
    printWindow.document.close();
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
      observacoes: clientData.observacoes,
      ignored_fields: clientData.ignored_fields,
      historico_brindes: clientData.historico_brindes
    }

    try {
      if (clientToEdit) {
        const { error } = await supabase.from('clientes').update(dbData).eq('id', clientToEdit.id)
        if (error) throw error
        await logAction('EDITAR', 'CLIENTES', `Atualizou dados de: ${clientData.nome}`)
      } else {
        const { error } = await supabase.from('clientes').insert([dbData])
        if (error) throw error
        await logAction('CRIAR', 'CLIENTES', `Novo cliente cadastrado: ${clientData.nome}`)
      }
      await fetchClients()
      setIsModalOpen(false)
      setClientToEdit(null)
      setSelectedClient(null) 
    } catch (error: any) {
      alert(`Erro ao salvar: ${error.message}`)
    }
  }

  const handleEdit = (client: Client, e?: React.MouseEvent) => {
    if(e) { e.preventDefault(); e.stopPropagation(); }
    setSelectedClient(null);
    setClientToEdit(client);
    setTimeout(() => { setIsModalOpen(true); }, 10);
  }

  const handleDeleteClick = (client: Client, e?: React.MouseEvent) => {
    if(e) { e.preventDefault(); e.stopPropagation(); }
    setClientToDelete(client);
  }

  const confirmDelete = async () => {
    if (clientToDelete) {
        await supabase.from('clientes').delete().eq('id', clientToDelete.id);
        await logAction('EXCLUIR', 'CLIENTES', `Removeu cliente: ${clientToDelete.nome}`)
        fetchClients();
        setClientToDelete(null);
        setSelectedClient(null);
    }
  }

  const handleExportExcel = async () => {
    const ws = utils.json_to_sheet(processedClients)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, "Clientes")
    writeFile(wb, "Relatorio_Clientes.xlsx")
    await logAction('EXPORTAR', 'CLIENTES', `Exportou lista com ${processedClients.length} clientes`)
  }

  return (
    <div className="h-full flex flex-col relative">
      <NewClientModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setClientToEdit(null); }} onSave={handleSaveClient} clientToEdit={clientToEdit} />

      {clientToDelete && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
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

      {selectedClient && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 animate-scaleIn flex flex-col max-h-[85vh]">
            <div className="bg-[#112240] p-6 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold border border-white/20">{selectedClient.nome.charAt(0)}</div>
                <h2 className="text-xl font-bold">{selectedClient.nome}</h2>
              </div>
              <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="h-6 w-6" /></button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Dados</h3>
                    <p className="text-sm flex items-center gap-3"><Briefcase className="h-4 w-4 text-blue-600" /> <strong>Empresa:</strong> {selectedClient.empresa}</p>
                    <p className="text-sm flex items-center gap-3"><User className="h-4 w-4 text-blue-600" /> <strong>Cargo:</strong> {selectedClient.cargo || '-'}</p>
                    <p className="text-sm flex items-center gap-3"><Mail className="h-4 w-4 text-blue-600" /> <strong>Email:</strong> {selectedClient.email || '-'}</p>
                    <p className="text-sm flex items-center gap-3"><Phone className="h-4 w-4 text-blue-600" /> <strong>Tel:</strong> {selectedClient.telefone || '-'}</p>
                </div>
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Logística</h3>
                    <p className="text-sm flex items-center gap-3"><MapPin className="h-4 w-4 text-blue-600" /> {selectedClient.endereco}, {selectedClient.numero}</p>
                    <p className="text-sm text-gray-600 ml-7">{selectedClient.bairro} - {selectedClient.cidade}/{selectedClient.estado}</p>
                    <p className="text-sm flex items-center gap-3"><Gift className="h-4 w-4 text-blue-600" /> <strong>Brinde Atual:</strong> {selectedClient.tipoBrinde}</p>
                    <p className="text-sm flex items-center gap-3"><Info className="h-4 w-4 text-blue-600" /> <strong>Sócio:</strong> {selectedClient.socio}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-[#112240] mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Histórico de Brindes Anuais
                </h3>
                {selectedClient.historico_brindes && selectedClient.historico_brindes.length > 0 ? (
                    <div className="space-y-2">
                        {selectedClient.historico_brindes.map((h, i) => (
                            <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 text-sm">
                                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">{h.ano}</span>
                                <span className="font-medium text-gray-700">{h.tipo || '-'}</span>
                                <span className="text-gray-500 text-xs italic truncate max-w-[150px]">{h.obs || '-'}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 italic text-center py-2">Nenhum histórico registrado.</p>
                )}
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center shrink-0">
              <button onClick={() => handlePrint(selectedClient)} className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                <Printer className="h-4 w-4" /> Imprimir Ficha
              </button>
              
              <div className="flex gap-3">
                <button onClick={(e) => handleEdit(selectedClient, e)} className="px-5 py-2.5 bg-[#112240] text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#1a3a6c] transition-all shadow-md">
                    <Pencil className="h-4 w-4" /> Editar
                </button>
                <button onClick={(e) => handleDeleteClick(selectedClient, e)} className="px-5 py-2.5 bg-red-50 text-red-600 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-red-100 transition-all border border-red-100">
                    <Trash2 className="h-4 w-4" /> Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 px-1">
           <div className="relative group">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Filter className="h-4 w-4" /></div>
             <select value={socioFilter} onChange={(e) => setSocioFilter(e.target.value)} className="appearance-none pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 outline-none focus:ring-2 focus:ring-[#112240]/20 min-w-[160px]">
                <option value="">Sócio: Todos</option>
                {uniqueSocios.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDown className="h-4 w-4" /></div>
           </div>
           <div className="relative group">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Filter className="h-4 w-4" /></div>
             <select value={brindeFilter} onChange={(e) => setBrindeFilter(e.target.value)} className="appearance-none pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 outline-none focus:ring-2 focus:ring-[#112240]/20 min-w-[160px]">
                <option value="">Brinde: Todos</option>
                {uniqueBrindes.map(b => <option key={b} value={b}>{b}</option>)}
             </select>
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDown className="h-4 w-4" /></div>
           </div>
           <div className="flex bg-white border border-gray-200 rounded-lg p-1 gap-1 shadow-sm">
              <button onClick={() => toggleSort('nome')} className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${sortBy === 'nome' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><ArrowUpDown className="h-3 w-3 mr-1" /> Nome</button>
              <button onClick={() => toggleSort('socio')} className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${sortBy === 'socio' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><ArrowUpDown className="h-3 w-3 mr-1" /> Sócio</button>
           </div>
           <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-gray-100 text-[#112240]' : 'text-gray-400 hover:text-gray-600'}`}><LayoutList className="h-5 w-5" /></button>
              <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-md ${viewMode === 'card' ? 'bg-gray-100 text-[#112240]' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid className="h-5 w-5" /></button>
           </div>
        </div>
        <div className="flex items-center gap-3 w-full xl:w-auto">
            <button onClick={fetchClients} className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"><RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /></button>
            <button onClick={handlePrintList} className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50" title="Imprimir Lista"><Printer className="h-5 w-5" /></button>
            <button onClick={handleExportExcel} className="flex-1 xl:flex-none flex items-center justify-center px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md gap-2 font-medium text-sm"><FileSpreadsheet className="h-5 w-5" /> Exportar</button>
            <button onClick={() => { setSelectedClient(null); setClientToEdit(null); setIsModalOpen(true); }} className="flex-1 xl:flex-none flex items-center justify-center px-5 py-2.5 bg-[#112240] text-white rounded-lg hover:bg-[#1a3a6c] transition-all shadow-md gap-2 font-bold text-sm"><Plus className="h-5 w-5" /> Novo Cliente</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto pb-4 font-medium">
        {loading && clients.length === 0 ? (
          <div className="flex h-full items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-[#112240]" /></div>
        ) : (
          <div className={viewMode === 'card' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "bg-white border border-gray-200 rounded-xl overflow-hidden"}>
            {viewMode === 'card' ? (
              processedClients.map(client => (
                <div key={client.id} onClick={() => setSelectedClient(client)} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all relative group cursor-pointer animate-fadeIn flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-3 overflow-hidden">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-[#112240] font-bold border border-gray-200 flex-shrink-0">{client.nome.charAt(0)}</div>
                      <div className="overflow-hidden"><h3 className="text-sm font-bold text-gray-900 truncate">{client.nome}</h3><p className="text-xs text-gray-500 truncate">{client.empresa}</p></div>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full flex-shrink-0 ${client.tipoBrinde === 'Brinde VIP' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>{client.tipoBrinde}</span>
                  </div>
                  
                  <div className="bg-gray-50 rounded-md p-2 mb-2 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Sócio:</span>
                        <span className="font-bold text-[#112240]">{client.socio || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Tel:</span>
                        <span className="text-gray-600 font-medium">{client.telefone || '-'}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-2 flex justify-between items-center transition-opacity">
                    <div className="flex gap-2">
                      <button className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors"><MessageCircle className="h-4 w-4" /></button>
                      <button className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"><Phone className="h-4 w-4" /></button>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={(e) => handleEdit(client, e)} className="p-1.5 text-gray-500 hover:text-[#112240] rounded-md transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={(e) => handleDeleteClick(client, e)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Empresa</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Sócio</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Brinde</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {processedClients.map(client => (
                    <tr key={client.id} onClick={() => setSelectedClient(client)} className="hover:bg-blue-50/30 transition-colors cursor-pointer group">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 text-sm">{client.nome}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">{client.empresa}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">{client.socio}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${client.tipoBrinde === 'Brinde VIP' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>{client.tipoBrinde}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={(e) => handleEdit(client, e)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"><Pencil className="h-4 w-4" /></button>
                          <button onClick={(e) => handleDeleteClick(client, e)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
