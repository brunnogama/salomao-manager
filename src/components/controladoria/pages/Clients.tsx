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
  Briefcase,

  Mail,
  Phone,
  MapPin,
  Filter,
  X
} from 'lucide-react';
import { Client } from '../../../types/controladoria';
import { ClientFormModal } from '../clients/ClientFormModal';
import { FilterSelect } from '../ui/FilterSelect';

// CAMINHO CORRIGIDO: saindo de /pages e entrando em /utils (dentro de controladoria)
import { maskCNPJ } from '../utils/masks';

export function Clients() {


  const [clients, setClients] = useState<Client[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | undefined>(undefined);

  // Estado para visualização
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  // Novos filtros
  const [clientFilter, setClientFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');

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
    setViewingClient(null);
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
      setViewingClient(null);
    }
    else alert('Erro ao excluir: ' + error.message);
  };

  const handleView = (client: Client) => {
    setViewingClient(client);
  };

  // Obter lista única de clientes e sócios para os filtros
  const uniqueClients = Array.from(new Set(clients.map(c => c.name))).sort();
  const uniquePartners = Array.from(new Set(clients.map(c => c.partner_name).filter(Boolean))).sort();

  const filteredClients = clients.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cnpj?.includes(searchTerm) ||
      c.email?.toLowerCase().includes(searchTerm) ||
      c.partner_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClient = !clientFilter || c.name === clientFilter;
    const matchesPartner = !partnerFilter || c.partner_name === partnerFilter;

    return matchesSearch && matchesClient && matchesPartner;
  });

  const hasActiveFilters = !!clientFilter || !!partnerFilter;



  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 sm:p-6 space-y-4 sm:space-y-6">

      {/* 1. Header - Salomão Design System */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-2 sm:p-3 shadow-lg shrink-0">
            <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Clientes</h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">Gestão da base de clientes</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          <button
            onClick={handleNew}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-2.5 sm:py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Novo Cliente
          </button>
        </div>
      </div>

      {/* 2. Toolbar: Total | Busca | Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">

          {/* Card de Total */}
          <div className="flex items-center gap-3 pb-4 lg:pb-0 lg:pr-4 border-b lg:border-b-0 lg:border-r border-gray-100">
            <div className="p-2 bg-[#1e3a8a]/10 text-[#1e3a8a] rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Total</p>
              <p className="text-xl font-black text-[#0a192f] leading-none">{filteredClients.length}</p>
            </div>
          </div>

          {/* Barra de Busca (flex-1, sempre visível) */}
          <div className="relative flex-1 w-full lg:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, CNPJ, email ou sócio..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtros: Clientes e Sócios */}
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              icon={Building}
              value={clientFilter}
              onChange={setClientFilter}
              options={uniqueClients.map(c => ({ label: c, value: c }))}
              placeholder="Todos os Clientes"
            />

            <FilterSelect
              icon={User}
              value={partnerFilter}
              onChange={setPartnerFilter}
              options={uniquePartners.map(p => ({ label: p, value: p }))}
              placeholder="Todos os Sócios"
            />
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto custom-scrollbar">
            <div className="min-w-[1000px]">
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
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleView(client)}
                  >
                    {/* Cliente Column */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${client.is_person ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
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
                    <div className="col-span-3 flex items-center min-w-0">
                      <span className="text-sm text-gray-700 font-semibold truncate">
                        {client.partner_name || '-'}
                      </span>
                    </div>

                    {/* Contratos Vinculados Column */}
                    <div className="col-span-2 flex items-center justify-center shrink-0">
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
                    <div className="col-span-1 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-gray-700">
                        {client.uf || '-'}
                      </span>
                    </div>

                    {/* Ações Column */}
                    <div className="col-span-2 flex items-center justify-end gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(client);
                        }}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all"
                        title="Editar cliente"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(client.id!);
                        }}
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

      {/* Modal de Visualização */}
      {
        viewingClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex justify-between items-start sm:items-center px-4 sm:px-6 py-4 bg-gradient-to-br from-[#1e3a8a] to-[#112240] shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${viewingClient.is_person ? 'bg-blue-400/20' : 'bg-indigo-400/20'}`}>
                    {viewingClient.is_person ? <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> : <Building className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                  </div>
                  <div className="min-w-0 pr-4">
                    <h2 className="text-lg sm:text-xl font-black text-white truncate">{viewingClient.name}</h2>
                    <p className="text-xs sm:text-sm text-white/80 font-semibold truncate">{viewingClient.cnpj ? maskCNPJ(viewingClient.cnpj) : 'Sem documento'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingClient(null)}
                  className="p-1 sm:p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  {/* Informações Básicas */}
                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Informações Básicas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500">Email</p>
                          <p className="text-sm font-bold text-gray-800 truncate">{viewingClient.email || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500">Telefone</p>
                          <p className="text-sm font-bold text-gray-800 truncate">{viewingClient.phone || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  {viewingClient.address && (
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Endereço</h3>
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 break-words">
                            {viewingClient.address}, {viewingClient.number}
                            {viewingClient.complement && ` - ${viewingClient.complement}`}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            {viewingClient.city}, {viewingClient.uf}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sócio Responsável */}
                  {viewingClient.partner_name && (
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Sócio Responsável</h3>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                        <User className="w-4 h-4 text-blue-600 shrink-0" />
                        <p className="text-sm font-bold text-blue-900 truncate">{viewingClient.partner_name}</p>
                      </div>
                    </div>
                  )}

                  {/* Contratos */}
                  {viewingClient.active_contracts_count !== undefined && viewingClient.active_contracts_count > 0 && (
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Contratos Vinculados</h3>
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                        <Briefcase className="w-4 h-4 text-emerald-600 shrink-0" />
                        <p className="text-sm font-bold text-emerald-900 truncate">{viewingClient.active_contracts_count} contrato(s) ativo(s)</p>
                      </div>
                    </div>
                  )}

                  {/* Observações */}
                  {viewingClient.notes && (
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Observações</h3>
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap word-break">{viewingClient.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer com Botões */}
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-3 bg-gray-50 shrink-0">
                <button
                  onClick={() => setViewingClient(null)}
                  className="px-6 py-2.5 sm:py-2 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors bg-white sm:bg-transparent border sm:border-transparent border-gray-200 rounded-xl sm:rounded-none w-full sm:w-auto"
                >
                  Fechar
                </button>
                <button
                  onClick={() => handleEdit(viewingClient)}
                  className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95 w-full sm:w-auto"
                >
                  <Edit className="w-4 h-4" />
                  Editar Cliente
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}