import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
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
import { useDatabaseSync } from '../../../hooks/useDatabaseSync';

// CAMINHO CORRIGIDO: saindo de /pages e entrando em /utils (dentro de controladoria)
import { maskCNPJ } from '../utils/masks';

// Interface para sócio com seus contratos dentro de um grupo
interface PartnerWithContracts {
  partner_name: string;
  partner_id?: string;
  contracts: { id: string; hon_number?: string; seq_id?: number; status: string }[];
}

// Interface para cliente agrupado por CNPJ
interface GroupedClient {
  // Dados do cliente (do primeiro registro do grupo)
  primaryClient: Client;
  // Todos os registros originais do grupo
  allClients: Client[];
  // Sócios com seus contratos
  partners: PartnerWithContracts[];
  // Total de contratos
  totalContracts: number;
}

export function Clients() {
  const { userRole } = useAuth();
  const isReadOnly = userRole === 'readonly';

  const [clients, setClients] = useState<Client[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | undefined>(undefined);

  // Estado para visualização (agora é GroupedClient)
  const [viewingGroup, setViewingGroup] = useState<GroupedClient | null>(null);

  // Novos filtros
  const [clientFilter, setClientFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useDatabaseSync(() => {
    fetchData();
  }, ['clients', 'partners']);



  const fetchData = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        partner:partners(name),
        contracts:contracts(id, hon_number, seq_id, status, partner_id, contract_partner:partners!contracts_partner_id_fkey(name))
      `)
      .order('name');

    if (!error && data) {
      const formatted = data.map((c: any) => ({
        ...c,
        partner_name: c.partner?.name,
        active_contracts_count: c.contracts?.length || 0,
        _contracts_raw: c.contracts || []
      }));
      setClients(formatted);
    }
    setLoading(false);
  };

  // Agrupar clientes por CNPJ
  const groupedClients = useMemo(() => {
    const groups: GroupedClient[] = [];
    const cnpjMap = new Map<string, Client[]>();
    const noCnpjClients: Client[] = [];

    for (const client of clients) {
      const cnpj = client.cnpj?.replace(/\D/g, '');
      if (cnpj && cnpj.length > 0) {
        if (!cnpjMap.has(cnpj)) {
          cnpjMap.set(cnpj, []);
        }
        cnpjMap.get(cnpj)!.push(client);
      } else {
        noCnpjClients.push(client);
      }
    }

    // Processar grupos com CNPJ
    for (const [, groupClients] of cnpjMap) {
      const primaryClient = groupClients[0];
      const partnersMap = new Map<string, PartnerWithContracts>();

      for (const client of groupClients) {
        // Sócio do registro client
        if (client.partner_name && !partnersMap.has(client.partner_name)) {
          partnersMap.set(client.partner_name, {
            partner_name: client.partner_name,
            partner_id: client.partner_id,
            contracts: []
          });
        }

        // Contratos e seus sócios
        const rawContracts = (client as any)._contracts_raw || [];
        for (const contract of rawContracts) {
          const contractPartnerName = contract.contract_partner?.name || client.partner_name;
          if (!contractPartnerName) continue;

          if (!partnersMap.has(contractPartnerName)) {
            partnersMap.set(contractPartnerName, {
              partner_name: contractPartnerName,
              partner_id: contract.partner_id,
              contracts: []
            });
          }
          partnersMap.get(contractPartnerName)!.contracts.push({
            id: contract.id,
            hon_number: contract.hon_number,
            seq_id: contract.seq_id,
            status: contract.status
          });
        }
      }

      const totalContracts = groupClients.reduce((sum, c) => sum + ((c as any)._contracts_raw?.length || 0), 0);

      groups.push({
        primaryClient,
        allClients: groupClients,
        partners: Array.from(partnersMap.values()),
        totalContracts
      });
    }

    // Processar clientes sem CNPJ (cada um é seu próprio grupo)
    for (const client of noCnpjClients) {
      const partners: PartnerWithContracts[] = [];
      if (client.partner_name) {
        const rawContracts = (client as any)._contracts_raw || [];
        partners.push({
          partner_name: client.partner_name,
          partner_id: client.partner_id,
          contracts: rawContracts.map((c: any) => ({
            id: c.id,
            hon_number: c.hon_number,
            seq_id: c.seq_id,
            status: c.status
          }))
        });
      }

      groups.push({
        primaryClient: client,
        allClients: [client],
        partners,
        totalContracts: (client as any)._contracts_raw?.length || 0
      });
    }

    return groups.sort((a, b) => a.primaryClient.name.localeCompare(b.primaryClient.name));
  }, [clients]);

  const handleEdit = (client: Client) => {
    setClientToEdit(client);
    setViewingGroup(null);
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
      setViewingGroup(null);
    }
    else alert('Erro ao excluir: ' + error.message);
  };

  const handleView = (group: GroupedClient) => {
    setViewingGroup(group);
  };

  // Obter lista única de clientes e sócios para os filtros
  const uniqueClients = useMemo(() =>
    Array.from(new Set(groupedClients.map(g => g.primaryClient.name))).sort()
  , [groupedClients]);

  const uniquePartners = useMemo(() =>
    Array.from(new Set(groupedClients.flatMap(g => g.partners.map(p => p.partner_name)).filter(Boolean))).sort()
  , [groupedClients]);

  const filteredGroups = useMemo(() => groupedClients.filter(g => {
    const client = g.primaryClient;
    const allPartnerNames = g.partners.map(p => p.partner_name);

    const matchesSearch = !searchTerm ||
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cnpj?.includes(searchTerm) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allPartnerNames.some(pn => pn.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesClient = !clientFilter || client.name === clientFilter;
    const matchesPartner = !partnerFilter || allPartnerNames.includes(partnerFilter);

    return matchesSearch && matchesClient && matchesPartner;
  }), [groupedClients, searchTerm, clientFilter, partnerFilter]);

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
          {!isReadOnly && (
            <button
              onClick={handleNew}
              className="flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-2.5 sm:py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" /> Novo Cliente
            </button>
          )}
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
              <p className="text-xl font-black text-[#0a192f] leading-none">{filteredGroups.length}</p>
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
              options={uniquePartners.map(p => ({ label: p!, value: p! }))}
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
        ) : filteredGroups.length === 0 ? (
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
                {filteredGroups.map(group => {
                  const client = group.primaryClient;
                  return (
                    <div
                      key={client.id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleView(group)}
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
                        {group.partners.length === 0 ? (
                          <span className="text-sm text-gray-400 font-semibold">-</span>
                        ) : group.partners.length === 1 ? (
                          <span className="text-sm text-gray-700 font-semibold truncate">
                            {group.partners[0].partner_name}
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {group.partners.map((p, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold truncate max-w-[140px]"
                                title={`${p.partner_name} (${p.contracts.length} contrato${p.contracts.length !== 1 ? 's' : ''})`}
                              >
                                {p.partner_name.split(' ').slice(0, 2).join(' ')}
                                {p.contracts.length > 0 && (
                                  <span className="text-[9px] text-blue-500">({p.contracts.length})</span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Contratos Vinculados Column */}
                      <div className="col-span-2 flex items-center justify-center shrink-0">
                        {group.totalContracts > 0 ? (
                          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg">
                            <Briefcase className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-black text-emerald-700">{group.totalContracts}</span>
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
                        {!isReadOnly && (
                          <>
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
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
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
        viewingGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex justify-between items-start sm:items-center px-4 sm:px-6 py-4 bg-gradient-to-br from-[#1e3a8a] to-[#112240] shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${viewingGroup.primaryClient.is_person ? 'bg-blue-400/20' : 'bg-indigo-400/20'}`}>
                    {viewingGroup.primaryClient.is_person ? <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> : <Building className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                  </div>
                  <div className="min-w-0 pr-4">
                    <h2 className="text-lg sm:text-xl font-black text-white truncate">{viewingGroup.primaryClient.name}</h2>
                    <p className="text-xs sm:text-sm text-white/80 font-semibold truncate">{viewingGroup.primaryClient.cnpj ? maskCNPJ(viewingGroup.primaryClient.cnpj) : 'Sem documento'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingGroup(null)}
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
                          <p className="text-sm font-bold text-gray-800 truncate">{viewingGroup.primaryClient.email || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500">Telefone</p>
                          <p className="text-sm font-bold text-gray-800 truncate">{viewingGroup.primaryClient.phone || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  {viewingGroup.primaryClient.address && (
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Endereço</h3>
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 break-words">
                            {viewingGroup.primaryClient.address}, {viewingGroup.primaryClient.number}
                            {viewingGroup.primaryClient.complement && ` - ${viewingGroup.primaryClient.complement}`}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            {viewingGroup.primaryClient.city}, {viewingGroup.primaryClient.uf}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sócios Responsáveis e Contratos */}
                  {viewingGroup.partners.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                        {viewingGroup.partners.length === 1 ? 'Sócio Responsável' : 'Sócios Responsáveis'}
                      </h3>
                      <div className="space-y-3">
                        {viewingGroup.partners.map((partner, idx) => (
                          <div key={idx} className="p-3 bg-blue-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              <User className="w-4 h-4 text-blue-600 shrink-0" />
                              <p className="text-sm font-bold text-blue-900 truncate">{partner.partner_name}</p>
                            </div>
                            {partner.contracts.length > 0 && (
                              <div className="mt-2 ml-7 space-y-1">
                                {partner.contracts.map((contract, cIdx) => (
                                  <div key={cIdx} className="flex items-center gap-2">
                                    <Briefcase className="w-3 h-3 text-blue-400 shrink-0" />
                                    <span className="text-[11px] font-semibold text-blue-700">
                                      {contract.hon_number
                                        ? `HON ${contract.hon_number}`
                                        : `Caso ${String(contract.seq_id || 0).padStart(6, '0')}`
                                      }
                                    </span>
                                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                      contract.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                      contract.status === 'proposal' ? 'bg-amber-100 text-amber-700' :
                                      contract.status === 'analysis' ? 'bg-blue-100 text-blue-700' :
                                      'bg-gray-100 text-gray-600'
                                    }`}>
                                      {contract.status === 'active' ? 'Ativo' :
                                       contract.status === 'proposal' ? 'Proposta' :
                                       contract.status === 'analysis' ? 'Análise' :
                                       contract.status === 'rejected' ? 'Rejeitado' :
                                       contract.status === 'probono' ? 'Pro Bono' :
                                       contract.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total de Contratos */}
                  {viewingGroup.totalContracts > 0 && (
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Total de Contratos</h3>
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                        <Briefcase className="w-4 h-4 text-emerald-600 shrink-0" />
                        <p className="text-sm font-bold text-emerald-900 truncate">{viewingGroup.totalContracts} contrato(s)</p>
                      </div>
                    </div>
                  )}

                  {/* Observações */}
                  {viewingGroup.primaryClient.notes && (
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Observações</h3>
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap word-break">{viewingGroup.primaryClient.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer com Botões */}
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-3 bg-gray-50 shrink-0">
                <button
                  onClick={() => setViewingGroup(null)}
                  className="px-6 py-2.5 sm:py-2 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors bg-white sm:bg-transparent border sm:border-transparent border-gray-200 rounded-xl sm:rounded-none w-full sm:w-auto"
                >
                  Fechar
                </button>
                {!isReadOnly && (
                  <button
                    onClick={() => handleEdit(viewingGroup.primaryClient)}
                    className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95 w-full sm:w-auto"
                  >
                    <Edit className="w-4 h-4" />
                    Editar Cliente
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}