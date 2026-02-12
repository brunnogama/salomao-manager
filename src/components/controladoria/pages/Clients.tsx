import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  Users,
  Search,
  Plus,
  User,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  Building,
  Briefcase,
  X,
  FileText
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

  // States para visualização de detalhes
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [viewingContracts, setViewingContracts] = useState<any[]>([]);

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
    setViewingClient(null);
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
      setViewingClient(null);
    }
    else alert('Erro ao excluir: ' + error.message);
  };

  const handleViewClient = async (client: Client) => {
    setViewingClient(client);
    setViewingContracts([]);

    const { data } = await supabase
      .from('contracts')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false });

    if (data) setViewingContracts(data);
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cnpj?.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm)
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
              placeholder="Buscar por nome, CNPJ ou email..."
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

      {/* 3. Área de Conteúdo */}
      <div className="flex-1">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">
            Carregando base de dados...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredClients.map(client => (
              <div
                key={client.id}
                onClick={() => handleViewClient(client)}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
              >
                <div className={`absolute right-0 top-0 h-full w-1 ${client.is_person ? 'bg-blue-600' : 'bg-indigo-600'}`}></div>

                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${client.is_person ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      {client.is_person ? <User className="w-5 h-5" /> : <Building className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-black text-[#0a192f] line-clamp-1">{client.name}</h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{client.cnpj ? maskCNPJ(client.cnpj) : 'Sem documento'}</p>
                    </div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(client); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Editar"><Edit className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(client.id!); }} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center text-xs font-semibold text-gray-600">
                    <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />
                    <span className="truncate">{client.email || '-'}</span>
                  </div>
                  <div className="flex items-center text-xs font-semibold text-gray-600">
                    <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" />
                    <span>{client.phone || '-'}</span>
                  </div>
                  <div className="flex items-center text-xs font-semibold text-gray-600">
                    <MapPin className="w-3.5 h-3.5 mr-2 text-gray-400" />
                    <span className="truncate">{client.city ? `${client.city}/${client.uf}` : '-'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
                  <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest" title="Sócio Responsável">
                    <User className="w-3 h-3 mr-1 text-[#1e3a8a]" />
                    {client.partner_name || 'N/A'}
                  </div>
                  {client.active_contracts_count !== undefined && client.active_contracts_count > 0 && (
                    <div className="flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                      <Briefcase className="w-3 h-3 mr-1" />
                      {client.active_contracts_count} Casos
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modais mantidos com a lógica original */}
      <ClientFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        client={clientToEdit}
        onSave={fetchData}
      />

      {viewingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a192f]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-black text-[#0a192f] flex items-center gap-2">
                {viewingClient.is_person ? <User className="w-6 h-6 text-blue-600" /> : <Building className="w-6 h-6 text-indigo-600" />}
                {viewingClient.name}
              </h2>
              <button onClick={() => setViewingClient(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dados de Contato</h3>
                  <div className="text-sm font-semibold text-gray-600 space-y-2">
                    <p className="flex items-center"><Mail className="w-4 h-4 mr-2 text-gray-400" /> {viewingClient.email || 'Não informado'}</p>
                    <p className="flex items-center"><Phone className="w-4 h-4 mr-2 text-gray-400" /> {viewingClient.phone || 'Não informado'}</p>
                    <p className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-gray-400" /> {viewingClient.city ? `${viewingClient.city}/${viewingClient.uf}` : 'Não informado'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Informações Gerais</h3>
                  <div className="text-sm font-semibold text-gray-600 space-y-2">
                    <p><span className="text-gray-400 uppercase text-[9px] font-black mr-2">Documento:</span> {viewingClient.cnpj ? maskCNPJ(viewingClient.cnpj) : '-'}</p>
                    <p><span className="text-gray-400 uppercase text-[9px] font-black mr-2">Sócio Resp.:</span> {viewingClient.partner_name || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Contratos Cadastrados
                </h3>

                {viewingContracts.length > 0 ? (
                  <div className="space-y-2">
                    {viewingContracts.map((contract: any) => (
                      <div key={contract.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:border-blue-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-lg shadow-sm">
                            <FileText className="w-4 h-4 text-[#1e3a8a]" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#0a192f]">{contract.title || 'Contrato sem título'}</p>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Valor: {contract.value ? Number(contract.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ -'}</p>
                          </div>
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-white border border-gray-200 text-gray-500">
                          {contract.status || 'Ativo'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    Nenhum contrato encontrado
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => handleEdit(viewingClient)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:border-blue-300 shadow-sm flex items-center transition-all"
              >
                <Edit className="w-4 h-4 mr-2" /> Editar
              </button>
              <button
                onClick={() => handleDelete(viewingClient.id!)}
                className="px-4 py-2 bg-white border border-red-100 rounded-lg text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 shadow-sm flex items-center transition-all"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}