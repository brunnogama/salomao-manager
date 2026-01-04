import { useState, useMemo } from 'react'
import { Plus, Filter, LayoutList, LayoutGrid, Pencil, Trash2, X, AlertTriangle, ChevronDown } from 'lucide-react'
import { NewClientModal, ClientData } from './NewClientModal'

// Vamos usar a mesma interface definida no modal ou estendê-la
interface Client extends ClientData {
  id: number;
}

export function Clients() {
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Estado para Edição e Exclusão
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

  // Filtros
  const [socioFilter, setSocioFilter] = useState('')
  const [brindeFilter, setBrindeFilter] = useState('')

  // Dados Mockados Completos
  const [clients, setClients] = useState<Client[]>([
    { id: 1, nome: 'Carlos Eduardo', empresa: 'Tech Solutions', cargo: 'CEO', brinde: 'Brinde VIP', tipoBrinde: 'Brinde VIP', quantidade: 1, socio: 'Marcio Gama', cidade: 'São Paulo/SP', cep: '01000-000', endereco: 'Av Paulista', numero: '1000', complemento: '', bairro: 'Bela Vista', estado: 'SP', email: 'carlos@tech.com', observacoes: '', outroBrinde: '' },
    { id: 2, nome: 'Ana Paula', empresa: 'Retail Corp', cargo: 'Diretora', brinde: 'Brinde Médio', tipoBrinde: 'Brinde Médio', quantidade: 2, socio: 'Rodrigo Salomão', cidade: 'Rio de Janeiro/RJ', cep: '20000-000', endereco: 'Av Rio Branco', numero: '500', complemento: '', bairro: 'Centro', estado: 'RJ', email: 'ana@retail.com', observacoes: '', outroBrinde: '' },
    { id: 3, nome: 'Roberto Alves', empresa: 'Logística SA', cargo: 'Gerente', brinde: 'Brinde Médio', tipoBrinde: 'Brinde Médio', quantidade: 1, socio: 'Marcio Gama', cidade: 'Curitiba/PR', cep: '80000-000', endereco: 'Rua XV', numero: '200', complemento: '', bairro: 'Centro', estado: 'PR', email: 'roberto@log.com', observacoes: '', outroBrinde: '' },
  ])

  // Listas para os filtros
  const uniqueSocios = Array.from(new Set(clients.map(c => c.socio)))
  const uniqueBrindes = Array.from(new Set(clients.map(c => c.tipoBrinde)))

  // Filtragem
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSocio = socioFilter ? client.socio === socioFilter : true
      const matchesBrinde = brindeFilter ? client.tipoBrinde === brindeFilter : true
      return matchesSocio && matchesBrinde
    })
  }, [clients, socioFilter, brindeFilter])

  // Funções de Ação
  const handleEdit = (client: Client) => {
    setClientToEdit(client)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client)
  }

  const confirmDelete = () => {
    if (clientToDelete) {
      setClients(clients.filter(c => c.id !== clientToDelete.id))
      setClientToDelete(null)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setClientToEdit(null) // Limpa o cliente em edição ao fechar
  }

  const clearFilters = () => {
    setSocioFilter('')
    setBrindeFilter('')
  }

  return (
    <div className="h-full flex flex-col relative">
      
      {/* MODAL DE CADASTRO / EDIÇÃO */}
      <NewClientModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        clientToEdit={clientToEdit} 
      />

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO (Aviso) */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
             <div className="flex items-center gap-4 mb-4 text-red-600">
               <div className="bg-red-100 p-3 rounded-full">
                 <AlertTriangle className="h-6 w-6" />
               </div>
               <h3 className="text-xl font-bold text-gray-900">Excluir Cliente?</h3>
             </div>
             
             <p className="text-gray-600 mb-6 leading-relaxed">
               Você está prestes a remover <strong>{clientToDelete.nome}</strong> ({clientToDelete.empresa}) do sistema. 
               <br/><br/>
               <span className="text-sm bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100">Essa ação não pode ser desfeita.</span>
             </p>

             <div className="flex justify-end gap-3">
               <button 
                 onClick={() => setClientToDelete(null)}
                 className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
               >
                 Cancelar
               </button>
               <button 
                 onClick={confirmDelete}
                 className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
               >
                 <Trash2 className="h-4 w-4" /> Confirmar Exclusão
               </button>
             </div>
          </div>
        </div>
      )}

      {/* BARRA DE FERRAMENTAS */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        
        {/* Filtros Estilizados */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 px-1">
           
           {/* Filtro Sócio (Custom Style) */}
           <div className="relative group">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
               <Filter className="h-4 w-4" />
             </div>
             <select 
                value={socioFilter}
                onChange={(e) => setSocioFilter(e.target.value)}
                className="appearance-none pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#112240]/20 focus:border-[#112240] cursor-pointer shadow-sm transition-all min-w-[160px]"
             >
                <option value="">Sócio: Todos</option>
                {uniqueSocios.map(socio => (
                  <option key={socio} value={socio}>{socio}</option>
                ))}
             </select>
             {/* Seta Customizada */}
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
               <ChevronDown className="h-4 w-4" />
             </div>
           </div>

           {/* Filtro Brinde (Custom Style) */}
           <div className="relative group">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
               <Filter className="h-4 w-4" />
             </div>
             <select 
                value={brindeFilter}
                onChange={(e) => setBrindeFilter(e.target.value)}
                className="appearance-none pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#112240]/20 focus:border-[#112240] cursor-pointer shadow-sm transition-all min-w-[160px]"
             >
                <option value="">Brinde: Todos</option>
                {clients.map(c => c.tipoBrinde).filter((v, i, a) => a.indexOf(v) === i).map(brinde => (
                  <option key={brinde} value={brinde}>{brinde}</option>
                ))}
             </select>
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
               <ChevronDown className="h-4 w-4" />
             </div>
           </div>
           
           {(socioFilter || brindeFilter) && (
             <button 
               onClick={clearFilters}
               className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center px-2 py-1 bg-red-50 rounded transition-colors"
             >
               <X className="h-3 w-3 mr-1" /> Limpar
             </button>
           )}

           <div className="h-6 w-px bg-gray-300 mx-2 hidden md:block"></div>

           {/* Alternador de Visualização */}
           <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-gray-100 text-[#112240]' : 'text-gray-400 hover:text-gray-600'}`}
                title="Lista"
              >
                <LayoutList className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-gray-100 text-[#112240]' : 'text-gray-400 hover:text-gray-600'}`}
                title="Cards"
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
           </div>
        </div>

        {/* Botão Adicionar */}
        <button 
          onClick={() => { setClientToEdit(null); setIsModalOpen(true); }}
          className="flex items-center px-5 py-2.5 bg-[#112240] text-white rounded-lg hover:bg-[#1a3a6c] transition-all shadow-md hover:shadow-lg whitespace-nowrap transform hover:-translate-y-0.5"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Cliente
        </button>
      </div>

      {/* LISTAGEM */}
      <div className="flex-1 overflow-auto pb-4">
        
        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
            <Filter className="h-12 w-12 text-gray-300 mb-2" />
            <p>Nenhum cliente encontrado com os filtros selecionados.</p>
            <button onClick={clearFilters} className="text-[#112240] font-bold hover:underline mt-2 text-sm">Limpar filtros</button>
          </div>
        ) : (
          <>
            {/* MODO LISTA */}
            {viewMode === 'list' && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente / Empresa</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cargo</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Brinde</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sócio</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Local</th>
                      <th className="relative px-6 py-4"><span className="sr-only">Ações</span></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">{client.nome}</span>
                            <span className="text-xs text-gray-500 font-medium">{client.empresa}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{client.cargo}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full border ${
                            client.tipoBrinde === 'Brinde VIP' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                            client.tipoBrinde === 'Brinde Médio' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            {client.tipoBrinde}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                                    {client.socio.charAt(0)}
                                </div>
                                {client.socio}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.cidade}</td>
                        
                        {/* NOVAS AÇÕES (EDITAR / EXCLUIR) */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleEdit(client)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
                                title="Editar"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button 
                                onClick={() => handleDeleteClick(client)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" 
                                title="Excluir"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MODO CARDS */}
            {viewMode === 'card' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map((client) => (
                  <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:-translate-y-1 relative group">
                    <div className="absolute top-4 right-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            client.tipoBrinde === 'Brinde VIP' ? 'bg-purple-100 text-purple-800' : 
                            client.tipoBrinde === 'Brinde Médio' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.tipoBrinde}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-5">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[#112240] font-bold text-xl border border-gray-100">
                          {client.nome.charAt(0)}
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-gray-900 leading-tight">{client.nome}</h3>
                          <p className="text-sm text-gray-500">{client.empresa}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2.5 text-sm text-gray-600 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                      <p className="flex justify-between"><span className="text-gray-400">Cargo:</span> <span className="font-medium text-gray-800">{client.cargo}</span></p>
                      <p className="flex justify-between"><span className="text-gray-400">Sócio:</span> <span className="font-medium text-gray-800">{client.socio}</span></p>
                      <p className="flex justify-between"><span className="text-gray-400">Local:</span> <span className="font-medium text-gray-800">{client.cidade}</span></p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end gap-2">
                        <button 
                            onClick={() => handleEdit(client)}
                            className="flex-1 py-2 text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                        >
                            Editar
                        </button>
                        <button 
                            onClick={() => handleDeleteClick(client)}
                            className="py-2 px-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            title="Excluir"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
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
