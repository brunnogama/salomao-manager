import { useState } from 'react'
import { Plus, Filter, LayoutList, LayoutGrid, MoreVertical, Search } from 'lucide-react'
import { NewClientModal } from './NewClientModal'

export function Clients() {
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Dados Mockados para visualizar o layout
  const clients = [
    { id: 1, nome: 'Carlos Eduardo', empresa: 'Tech Solutions', cargo: 'CEO', brinde: 'Brinde VIP', socio: 'Marcio Gama', cidade: 'São Paulo/SP' },
    { id: 2, nome: 'Ana Paula', empresa: 'Retail Corp', cargo: 'Diretora', brinde: 'Brinde Médio', socio: 'Rodrigo Salomão', cidade: 'Rio de Janeiro/RJ' },
    { id: 3, nome: 'Roberto Alves', empresa: 'Logística SA', cargo: 'Gerente', brinde: 'Brinde Médio', socio: 'Marcio Gama', cidade: 'Curitiba/PR' },
  ]

  return (
    <div className="h-full flex flex-col">
      <NewClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Barra de Ferramentas */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        
        {/* Filtros */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
           <button className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
              <Filter className="h-4 w-4 mr-2" />
              Sócio
           </button>
           <button className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
              <Filter className="h-4 w-4 mr-2" />
              Tipo de Brinde
           </button>
           
           <div className="h-6 w-px bg-gray-300 mx-2"></div>

           <div className="flex bg-gray-200 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-[#112240]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <LayoutList className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-white shadow text-[#112240]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
           </div>
        </div>

        {/* Botão Adicionar */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-[#112240] text-white rounded-lg hover:bg-[#1a3a6c] transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Cliente
        </button>
      </div>

      {/* Conteúdo da Lista */}
      <div className="flex-1 overflow-auto">
        
        {/* MODO LISTA (TABELA) */}
        {viewMode === 'list' && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente / Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brinde</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sócio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{client.nome}</span>
                        <span className="text-xs text-gray-500">{client.empresa}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.cargo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        client.brinde === 'Brinde VIP' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {client.brinde}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.socio}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.cidade}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-400 hover:text-gray-600"><MoreVertical className="h-5 w-5" /></button>
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
            {clients.map((client) => (
              <div key={client.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow relative">
                <div className="absolute top-4 right-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        client.brinde === 'Brinde VIP' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {client.brinde}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                   <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg">
                      {client.nome.charAt(0)}
                   </div>
                   <div>
                      <h3 className="text-lg font-medium text-gray-900">{client.nome}</h3>
                      <p className="text-sm text-gray-500">{client.empresa}</p>
                   </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong className="font-medium text-gray-700">Cargo:</strong> {client.cargo}</p>
                  <p><strong className="font-medium text-gray-700">Sócio:</strong> {client.socio}</p>
                  <p><strong className="font-medium text-gray-700">Local:</strong> {client.cidade}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                   <button className="text-[#112240] font-medium text-sm hover:underline">Ver Detalhes</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
