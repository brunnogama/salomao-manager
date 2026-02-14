import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Building,
  User,
  Briefcase
} from 'lucide-react';
import { Client } from '../../../types/controladoria';
import { ClientFormModal } from '../clients/ClientFormModal';

// CAMINHO CORRIGIDO: saindo de /pages e entrando em /utils (dentro de controladoria)
import { maskCNPJ } from '../utils/masks';

export function Clients() {


  const [clients, setClients] = useState<Client[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | undefined>(undefined);

  useEffect(() => {

    fetchData();
  }, []);



  const fetchData = async () => {
    setLoading(true);



    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        partner:partners(name),
        contracts:contracts(count)
      `)
      .order('name');

    if (!error && data) {
      const formatted = data.map((c: any) => ({
        ...c,
        partner_name: c.partner?.name,
        active_contracts_count: c.contracts?.[0]?.count || 0
      }));
      setClients(formatted);
    }
    setLoading(false);
  };

  const handleEdit = (client: Client) => {

    setClientToEdit(client);
    setIsModalOpen(true);
  };

  const handleNew = () => {

    setClientToEdit(undefined);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {


    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!error) {
      fetchData();
    }
    else alert('Erro ao excluir: ' + error.message);
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cnpj?.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm) ||
    c.partner_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6">

      {/* 1. Header - Salomão Design System */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-3 shadow-lg">
            <Users className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Clientes</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Gestão da base de clientes</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Novo Cliente
          </button>
        </div>
      </div>

      {/* 2. Toolbar - Salomão Design System */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, CNPJ, email ou sócio..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-gray-100/50 rounded-lg text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-200">
              Total: {filteredClients.length}
            </div>


          </div>
        </div>
      </div>

      {/* 3. Área de Conteúdo - Table View */}
      <div className="flex-1">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">
            Carregando base de dados...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhum cliente encontrado</h3>
            <p className="text-gray-500">Tente ajustar os filtros ou adicione um novo cliente</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 px-6 py-4">
                <div className="col-span-4">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Cliente</p>
                </div>
                <div className="col-span-3">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Sócio Responsável</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">Contratos Vinculados</p>
                </div>
                <div className="col-span-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">UF</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Ações</p>
                </div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {filteredClients.map(client => (
                <div
                  key={client.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Cliente Column */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${client.is_person ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      {client.is_person ? <User className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-[#0a192f] truncate">{client.name}</h3>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide truncate">
                        {client.cnpj ? maskCNPJ(client.cnpj) : 'Sem documento'}
                      </p>
                    </div>
                  </div>

                  {/* Sócio Responsável Column */}
                  <div className="col-span-3 flex items-center">
                    <span className="text-sm text-gray-700 font-semibold truncate">
                      {client.partner_name || '-'}
                    </span>
                  </div>

                  {/* Contratos Vinculados Column */}
                  <div className="col-span-2 flex items-center justify-center">
                    {client.active_contracts_count !== undefined && client.active_contracts_count > 0 ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg">
                        <Briefcase className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-black text-emerald-700">{client.active_contracts_count}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 font-semibold">-</span>
                    )}
                  </div>

                  {/* UF Column */}
                  <div className="col-span-1 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-700">
                      {client.uf || '-'}
                    </span>
                  </div>

                  {/* Ações Column */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(client)}
                      className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all"
                      title="Editar cliente"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id!)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all"
                      title="Excluir cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Formulário */}
      <ClientFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        client={clientToEdit}
        onSave={fetchData}
      />
    </div>
  );
}