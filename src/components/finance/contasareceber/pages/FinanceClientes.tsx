// src/components/finance/pages/FinanceClientes.tsx
import { useState, useEffect } from 'react'
import { 
  Users, 
  UserCircle, 
  Grid, 
  LogOut,
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  Mail,
  Building2
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { FinanceModalCliente } from '../components/FinanceModalCliente'

interface FinanceClientesProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

interface Cliente {
  id: string;
  cnpj: string;
  nome: string;
  email: string;
  created_at: string;
}

export function FinanceClientes({ 
  userName = 'Usuário', 
  onModuleHome, 
  onLogout 
}: FinanceClientesProps) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null)

  useEffect(() => {
    loadClientes()
  }, [])

  const loadClientes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('finance_clientes')
        .select('*')
        .order('nome')

      if (error) throw error
      setClientes(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar clientes:', error)
      alert('Erro ao carregar clientes: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCliente = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${nome}"?`)) return

    try {
      const { error } = await supabase
        .from('finance_clientes')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('Cliente excluído com sucesso!')
      loadClientes()
    } catch (error: any) {
      alert('Erro ao excluir cliente: ' + error.message)
    }
  }

  const handleEditCliente = (cliente: Cliente) => {
    setClienteEditando(cliente)
    setIsModalOpen(true)
  }

  const handleNovoCliente = () => {
    setClienteEditando(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setClienteEditando(null)
    loadClientes()
  }

  const filteredClientes = clientes.filter(c => 
    c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cnpj?.includes(searchTerm)
  )

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">
      
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <Users className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Clientes
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Cadastro e gestão de clientes financeiros
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Financeiro</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white shadow-md">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && (
            <button 
              onClick={onModuleHome} 
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title="Voltar aos módulos"
            >
              <Grid className="h-5 w-5" />
            </button>
          )}
          {onLogout && (
            <button 
              onClick={onLogout} 
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 w-full">
        
        {/* TOOLBAR */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar por nome, e-mail ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium text-sm"
            />
          </div>

          <button 
            onClick={handleNovoCliente}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Novo Cliente
          </button>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Total de Clientes</p>
                <p className="text-[24px] font-black text-[#0a192f] tracking-tight leading-none mt-0.5">
                  {clientes.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Com CNPJ</p>
                <p className="text-[24px] font-black text-[#0a192f] tracking-tight leading-none mt-0.5">
                  {clientes.filter(c => c.cnpj).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Cadastrados Hoje</p>
                <p className="text-[24px] font-black text-[#0a192f] tracking-tight leading-none mt-0.5">
                  {clientes.filter(c => {
                    const today = new Date().toISOString().split('T')[0];
                    return c.created_at.startsWith(today);
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TABELA DE CLIENTES */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-[#1e3a8a]" />
              <p className="font-bold text-[10px] uppercase tracking-[0.3em]">Carregando clientes...</p>
            </div>
          ) : filteredClientes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      CNPJ
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      E-mail
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Cadastro
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-50 text-[#1e3a8a]">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-bold text-[#0a192f]">
                            {cliente.nome}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-600">
                          {cliente.cnpj || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-600">
                          {cliente.email}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] text-gray-400 font-bold">
                          {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEditCliente(cliente)}
                            className="p-2 text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar cliente"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCliente(cliente.id, cliente.nome)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Excluir cliente"
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
          ) : (
            <div className="p-20 flex flex-col items-center justify-center text-center">
              <div className="p-4 rounded-full bg-blue-50 mb-4">
                <Users className="h-12 w-12 text-[#1e3a8a] opacity-20" />
              </div>
              <h2 className="text-xl font-black text-[#0a192f]">
                {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              </h2>
              <p className="text-gray-500 max-w-sm mt-2">
                {searchTerm 
                  ? 'Tente ajustar sua busca ou cadastrar um novo cliente'
                  : 'Comece cadastrando seu primeiro cliente'
                }
              </p>
              {!searchTerm && (
                <button 
                  onClick={handleNovoCliente}
                  className="flex items-center gap-2 px-6 py-3 bg-[#1e3a8a] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95 mt-4"
                >
                  <Plus className="h-4 w-4" /> Cadastrar Cliente
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      <FinanceModalCliente
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        clienteEditando={clienteEditando}
      />
    </div>
  )
}