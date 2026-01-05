import { useState, useEffect, useMemo } from 'react'
import { LayoutList, LayoutGrid, Pencil, Trash2, X, AlertTriangle, RefreshCw, ArrowRight, Briefcase, Mail, Gift, Info } from 'lucide-react'
import { NewClientModal, ClientData } from './NewClientModal'
import { supabase } from '../lib/supabase'

interface Client extends ClientData {
  id: number;
}

export function IncompleteClients() {
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const [socioFilter] = useState('')
  const [brindeFilter] = useState('')
  const [sortBy] = useState<'nome' | 'socio' | null>(null)
  const [sortDirection] = useState<'asc' | 'desc'>('asc')

  const [incompleteClients, setIncompleteClients] = useState<Client[]>([])

  const getMissingFields = (client: Client) => {
    const missing: string[] = []
    if (!client.nome) missing.push('Nome')
    if (!client.empresa) missing.push('Empresa')
    if (!client.tipoBrinde) missing.push('Tipo Brinde')
    if (!client.cep) missing.push('CEP')
    if (!client.email) missing.push('Email')
    if (!client.socio) missing.push('Sócio')
    return missing
  }

  const fetchIncompleteClients = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('clientes').select('*').order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar:', error)
    } else {
      const formatted: Client[] = data.map((item: any) => ({
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
      const incomplete = formatted.filter(c => getMissingFields(c).length > 0)
      setIncompleteClients(incomplete)
    }
    setLoading(false)
  }

  useEffect(() => { fetchIncompleteClients() }, [])

  const filteredClients = useMemo(() => {
    let result = [...incompleteClients].filter(client => {
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
  }, [incompleteClients, socioFilter, brindeFilter, sortBy, sortDirection])

  const handleSaveClient = async (clientData: ClientData) => {
    const dbData = {
      nome: clientData.nome,
      empresa: clientData.empresa,
      tipo_brinde: clientData.tipoBrinde,
      cep: clientData.cep,
      email: clientData.email,
      socio: clientData.socio,
      telefone: clientData.telefone,
      endereco: clientData.endereco,
      numero: clientData.numero,
      bairro: clientData.bairro,
      cidade: clientData.cidade,
      estado: clientData.estado,
      observacoes: clientData.observacoes
    }

    try {
      if (clientToEdit) {
        await supabase.from('clientes').update(dbData).eq('id', clientToEdit.id)
      }
      await fetchIncompleteClients()
      setIsModalOpen(false)
      setClientToEdit(null)
      setSelectedClient(null)
    } catch (error: any) {
      alert(`Erro ao salvar: ${error.message}`)
    }
  }

  const handleEdit = (client: Client, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    setSelectedClient(null); // Resolve sobreposição fechando a visualização primeiro
    setClientToEdit(client);
    setTimeout(() => { setIsModalOpen(true); }, 10);
  }

  return (
    <div className="h-full flex flex-col relative">
      <NewClientModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setClientToEdit(null); }} onSave={handleSaveClient} clientToEdit={clientToEdit} />

      {/* MODAL DE EXCLUSÃO */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
             <div className="flex items-center gap-4 mb-4 text-red-600">
               <div className="bg-red-100 p-3 rounded-full"><AlertTriangle className="h-6 w-6" /></div>
               <h3 className="text-xl font-bold">Excluir Registro?</h3>
             </div>
             <p className="text-gray-600 mb-6">Deseja remover permanentemente?</p>
             <div className="flex justify-end gap-3">
               <button onClick={() => setClientToDelete(null)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancelar</button>
               <button onClick={async () => {
                 await supabase.from('clientes').delete().eq('id', clientToDelete.id);
                 fetchIncompleteClients();
                 setClientToDelete(null);
                 setSelectedClient(null);
               }} className="px-4 py-2 text-white bg-red-600 rounded-lg flex items-center gap-2"><Trash2 className="h-4 w-4" /> Excluir</button>
             </div>
          </div>
        </div>
      )}

      {/* VISUALIZAÇÃO DETALHADA */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-red-100 animate-scaleIn">
            <div className="bg-red-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">!</div>
                <h2 className="text-xl font-bold">{selectedClient.nome || 'Cadastro Incompleto'}</h2>
              </div>
              <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="h-6 w-6" /></button>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-red-400 uppercase border-b pb-2">Pendências</h3>
                <div className="flex flex-wrap gap-2">
                  {getMissingFields(selectedClient).map(field => (
                    <span key={field} className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded border border-red-100 font-bold">{field}</span>
                  ))}
                </div>
                <p className="text-sm flex items-center gap-3"><Briefcase className="h-4 w-4 text-gray-400" /> {selectedClient.empresa || '-'}</p>
                <p className="text-sm flex items-center gap-3"><Mail className="h-4 w-4 text-gray-400" /> {selectedClient.email || '-'}</p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase border-b pb-2">Outros Dados</h3>
                <p className="text-sm flex items-center gap-3"><Gift className="h-4 w-4 text-gray-400" /> {selectedClient.tipoBrinde || '-'}</p>
                <p className="text-sm flex items-center gap-3"><Info className="h-4 w-4 text-gray-400" /> {selectedClient.socio || '-'}</p>
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button onClick={(e) => handleEdit(selectedClient, e)} className="px-5 py-2.5 bg-[#112240] text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-black transition-all shadow-md">
                <Pencil className="h-4 w-4" /> Completar Cadastro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-gray-100 text-[#112240]' : 'text-gray-400'}`}><LayoutList className="h-5 w-5" /></button>
            <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-md ${viewMode === 'card' ? 'bg-gray-100 text-[#112240]' : 'text-gray-400'}`}><LayoutGrid className="h-5 w-5" /></button>
          </div>
          <button onClick={fetchIncompleteClients} className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 shadow-sm"><RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="flex-1 overflow-auto pb-4">
        {viewMode === 'list' ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-red-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-red-700 uppercase">Cliente</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-red-700 uppercase">Pendências</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map(client => (
                  <tr key={client.id} onClick={() => setSelectedClient(client)} className="hover:bg-red-50/10 transition-colors cursor-pointer group">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-bold text-gray-900">{client.nome || 'Sem Nome'}</div><div className="text-xs text-gray-500">{client.empresa || '-'}</div></td>
                    <td className="px-6 py-4"><div className="flex flex-wrap gap-1">{getMissingFields(client).map(f => <span key={f} className="px-2 py-0.5 text-[9px] font-bold bg-red-100 text-red-700 rounded border border-red-200 uppercase">{f}</span>)}</div></td>
                    <td className="px-6 py-4 text-right"><ArrowRight className="h-5 w-5 text-gray-300" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map(client => (
              <div key={client.id} onClick={() => setSelectedClient(client)} className="bg-white rounded-xl shadow-sm border border-red-200 p-6 hover:shadow-md transition-all cursor-pointer relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold border border-red-100">!</div>
                  <h3 className="text-base font-bold text-gray-900 truncate">{client.nome || 'Sem Nome'}</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">{getMissingFields(client).map(f => <span key={f} className="px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-700 rounded border border-red-200 uppercase">{f}</span>)}</div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end"><button onClick={(e) => handleEdit(client, e)} className="w-full py-2 text-sm text-white bg-[#112240] hover:bg-black rounded-lg font-bold transition-colors">Completar</button></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
