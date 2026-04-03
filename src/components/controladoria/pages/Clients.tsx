import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Building,
  User,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  X,
  Download,
  Gift
} from 'lucide-react';
import { Client, ClientContact } from '../../../types/controladoria';
import { ClientFormModal } from '../clients/ClientFormModal';
import { useDatabaseSync } from '../../../hooks/useDatabaseSync';
import { FilterBar, FilterCategory } from '../../collaborators/components/FilterBar';

import { maskCNPJ, maskPhone } from '../utils/masks';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { ConfirmModal } from '../ui/ConfirmModal';
import { getGiftIconColor } from '../../../types/crmContact';

interface ClientsProps {
  initialFilters?: { socio?: string; brinde?: string };
}

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

export function Clients({ initialFilters }: ClientsProps = {}) {
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
  const [filterGiftType, setFilterGiftType] = useState<string>('');

  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.socio) setPartnerFilter(initialFilters.socio);
      if (initialFilters.brinde) setFilterGiftType(initialFilters.brinde);
    }
  }, [initialFilters]);

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
        contracts:contracts(id, hon_number, seq_id, status, partner_id, contract_partner:partners!contracts_partner_id_fkey(name)),
        contacts:client_contacts(*)
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewingGroup) {
        setViewingGroup(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingGroup]);

  const handleEdit = (client: Client) => {
    setClientToEdit(client);
    setViewingGroup(null);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setClientToEdit(undefined);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setClientToDelete(id);
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;
    const { error } = await supabase.from('clients').delete().eq('id', clientToDelete);
    if (!error) {
      toast.success('Cliente excluído com sucesso!');
      fetchData();
      setViewingGroup(null);
    } else {
      toast.error('Erro ao excluir: ' + error.message);
    }
    setClientToDelete(null);
  };

  const handleView = (group: GroupedClient) => {
    setViewingGroup(group);
  };

  const uniqueClients = useMemo(() =>
    Array.from(new Set(groupedClients.map(g => g.primaryClient.name))).sort()
  , [groupedClients]);

  const uniquePartners = useMemo(() =>
    Array.from(new Set(groupedClients.flatMap(g => g.partners.map(p => p.partner_name)).filter(Boolean))).sort()
  , [groupedClients]);

  // CRM: Calculate Gift Stats
  const { giftStats, totalGifts } = useMemo(() => {
    const stats: Record<string, number> = {};
    let total = 0;

    clients.forEach(client => {
      client.contacts?.forEach((contact: any) => {
        let type = contact.gift_type;
        if (type === 'Brinde Pequeno' || type === 'Outro') type = 'Outros';

        if (type && type !== 'Não recebe') {
          const qty = contact.gift_quantity || 1;
          stats[type] = (stats[type] || 0) + qty;
          total += qty;
        }
      });
    });
    return { giftStats: stats, totalGifts: total };
  }, [clients]);

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

    const matchesGift = !filterGiftType || g.allClients.some(c => c.contacts?.some((contact: any) => {
      let type = contact.gift_type;
      if (type === 'Brinde Pequeno' || type === 'Outro') type = 'Outros';
      return type === filterGiftType;
    }));

    return matchesSearch && matchesClient && matchesPartner && matchesGift;
  }), [groupedClients, searchTerm, clientFilter, partnerFilter, filterGiftType]);


  const filterCategories = useMemo((): FilterCategory[] => [
    {
      key: 'client',
      label: 'Cliente',
      icon: Building,
      type: 'single',
      options: uniqueClients.map(c => ({ label: c, value: c })),
      value: clientFilter,
      onChange: (val: string) => setClientFilter(val),
    },
    {
      key: 'partner',
      label: 'Sócio',
      icon: User,
      type: 'single',
      options: uniquePartners.map(p => ({ label: p!, value: p! })),
      value: partnerFilter,
      onChange: (val: string) => setPartnerFilter(val),
    },
  ], [clientFilter, partnerFilter, uniqueClients, uniquePartners]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (clientFilter) count++;
    if (partnerFilter) count++;
    return count;
  }, [clientFilter, partnerFilter]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    if (clientFilter) {
      chips.push({ key: 'client', label: `Cliente: ${clientFilter}`, onClear: () => setClientFilter('') });
    }
    if (partnerFilter) {
      chips.push({ key: 'partner', label: `Sócio: ${partnerFilter}`, onClear: () => setPartnerFilter('') });
    }
    return chips;
  }, [clientFilter, partnerFilter]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setClientFilter('');
    setPartnerFilter('');
    setFilterGiftType('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6">

      {/* 1. Header - Salomão Design System */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-2.5 sm:p-3 shadow-lg shrink-0">
            <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Clientes</h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">Gestão da base de clientes</p>
          </div>
        </div>

      {/* Ícones redondos */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              const data = filteredGroups.map(g => ({
                'Cliente': g.primaryClient.name,
                'CNPJ': g.primaryClient.cnpj || '',
                'Sócio': g.partners.map(p => p.partner_name).join(', '),
                'Contratos': g.totalContracts,
                'UF': g.primaryClient.uf || '',
                'Email': g.primaryClient.email || '',
                'Telefone': g.primaryClient.phone || '',
              }));
              import('xlsx-js-style').then(mod => {
                const XLSX = mod.default || mod;
                const ws = XLSX.utils.json_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
                XLSX.writeFile(wb, 'Clientes_Controladoria.xlsx');
              });
            }}
            className="flex items-center justify-center w-10 h-10 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30"
            title="Exportar XLSX"
          >
            <Download className="h-4 w-4" />
          </button>
          {!isReadOnly && (
            <button
              onClick={handleNew}
              className="flex items-center justify-center w-10 h-10 bg-[#1e3a8a] text-white rounded-full hover:bg-[#112240] transition-all shadow-lg shadow-blue-500/30"
              title="Novo Cliente"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Card + FilterBar */}
      <div className="flex flex-col lg:flex-row items-stretch gap-4">
        {/* Card de KPI - Total */}
        <div className="flex items-stretch shrink-0">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-sm">
            <div className="p-2 rounded-lg bg-blue-50">
              <Briefcase className="h-5 w-5 text-[#1e3a8a]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none">Total</span>
              <span className="text-xl font-black text-[#0a192f] leading-tight">{filteredGroups.length.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>

        {/* FilterBar */}
        <div className="flex-1">
          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            categories={filterCategories}
            activeFilterChips={activeFilterChips}
            activeFilterCount={activeFilterCount}
            onClearAll={clearAllFilters}
          />
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
                              title="Gestão de Brindes (Editar)"
                            >
                              <Gift className="w-4 h-4" />
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
        showGiftsTab={true}
      />

      {/* Modal de Visualização */}
      {
        viewingGroup && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setViewingGroup(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center shadow-lg">
                    {viewingGroup.primaryClient.is_person ? <User className="w-6 h-6 text-white" /> : <Building className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#0a192f]">{viewingGroup.primaryClient.name}</h2>
                    <p className="text-sm font-semibold text-gray-500">{viewingGroup.primaryClient.cnpj ? maskCNPJ(viewingGroup.primaryClient.cnpj) : 'Sem documento'}</p>
                  </div>
                </div>
                <button onClick={() => setViewingGroup(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  {/* Gift Summary */}
                  {viewingGroup.allClients.some(c => c.contacts?.some((contact: any) => contact.gift_type && contact.gift_type !== 'Não recebe')) && (
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Resumo de Brindes</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {viewingGroup.allClients.flatMap(c => c.contacts || [])
                          .filter((contact: any) => contact.gift_type && contact.gift_type !== 'Não recebe')
                          .map((c: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <div className={`p-2 rounded-lg bg-gradient-to-br ${getGiftIconColor(c.gift_type || '')}`}>
                                <Gift className="w-3 h-3 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-800 truncate">{c.name}</p>
                                <div className="flex gap-2 text-[10px] text-gray-500 mt-0.5">
                                  <span>{c.gift_type}</span>
                                  {c.gift_quantity && <span>(x{c.gift_quantity})</span>}
                                </div>
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                          <p className="text-sm font-bold text-gray-800 truncate">{viewingGroup.primaryClient.phone ? maskPhone(viewingGroup.primaryClient.phone) : '-'}</p>
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
                    <Gift className="w-4 h-4" />
                    Gerenciar Brindes
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }

      <ConfirmModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={confirmDeleteClient}
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente?"
        variant="danger"
        confirmText="Excluir"
      />
    </div >
  );
}