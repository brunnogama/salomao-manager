import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase'; // Caminho centralizado no Manager
import { Users, Search, Plus, Filter, User, MapPin, Phone, Mail, Edit, Trash2, Building, Briefcase, X, FileText, Shield } from 'lucide-react';
import { Client, Partner } from '../types'; 
import { ClientFormModal } from '../clients/ClientFormModal'; // Rota corrigida para a pasta de componentes clientes
import { maskCNPJ } from '../utils/masks'; 

export function Clients() {
  // --- ROLE STATE ---
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | undefined>(undefined);
  
  // States para visualização de detalhes
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [viewingContracts, setViewingContracts] = useState<any[]>([]);

  useEffect(() => {
    checkUserRole();
    fetchData();
  }, []);

  // --- ROLE CHECK ---
  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        if (profile) {
            setUserRole(profile.role as 'admin' | 'editor' | 'viewer');
        }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    
    const { data: partnersData } = await supabase.from('partners').select('*').order('name');
    if (partnersData) setPartners(partnersData);

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
    if (userRole === 'viewer') return;
    setClientToEdit(client);
    setIsModalOpen(true);
    setViewingClient(null); // Fecha o modal de visualização se estiver aberto
  };

  const handleNew = () => {
    if (userRole === 'viewer') return;
    setClientToEdit(undefined);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (userRole !== 'admin') return;
    
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!error) {
        fetchData();
        setViewingClient(null); // Fecha o modal de visualização se estiver aberto
    }
    else alert('Erro ao excluir: ' + error.message);
  };

  const handleViewClient = async (client: Client) => {
    setViewingClient(client);
    setViewingContracts([]); // Reseta contratos enquanto carrega
    
    // Busca os contratos completos deste cliente
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
    <div className="p-8 animate-in fade-in duration-500 bg-gray-50/50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-sm font-black text-[#0a192f] uppercase tracking-[0.3em] flex items-center gap-3">
            <Users className="w-6 h-6 text-amber-500" /> Clientes & Terceiros
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Base consolidada de registros do escritório.</p>
            {/* Badge de Perfil */}
            {userRole && (
                <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase border flex items-center gap-1.5 ${
                    userRole === 'admin' 
                        ? 'bg-purple-50 text-purple-700 border-purple-100' 
                        : userRole === 'editor' 
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : 'bg-gray-50 text-gray-500 border-gray-100'
                }`}>
                    <Shield className="w-3 h-3" />
                    {userRole === 'admin' ? 'Administrador' : userRole === 'editor' ? 'Editor' : 'Visualizador'}
                </span>
            )}
          </div>
        </div>
        
        {/* Botão Novo Cliente - Apenas Admin e Editor */}
        {userRole !== 'viewer' && (
            <button onClick={handleNew} className="bg-[#0a192f] hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center text-[10px] font-black uppercase tracking-widest active:scale-95">
            <Plus className="w-4 h-4 mr-2 text-amber-500" /> Novo Registro
            </button>
        )}
      </div>

      <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm mb-8 flex items-center gap-4">
        <div className="flex-1 flex items-center bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus-within:border-[#0a192f] transition-all">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input 
            type="text" 
            placeholder="BUSCAR POR NOME, CNPJ OU EMAIL..." 
            className="flex-1 bg-transparent outline-none text-[10px] font-bold uppercase tracking-widest text-[#0a192f] placeholder:text-gray-300"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 border-l border-gray-100">
            Total: <span className="text-[#0a192f] font-black">{filteredClients.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center p-20 gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a192f]"></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando registros...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map(client => (
            <div 
                key={client.id} 
                onClick={() => handleViewClient(client)}
                className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:border-amber-200 hover:shadow-xl transition-all group cursor-pointer overflow-hidden relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${client.is_person ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        {client.is_person ? <User className="w-6 h-6" /> : <Building className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-[#0a192f] uppercase tracking-tight line-clamp-1">{client.name}</h3>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{client.cnpj ? maskCNPJ(client.cnpj) : 'Sem documento'}</p>
                    </div>
                </div>
                
                {/* Ações Rápidas */}
                <div className="opacity-0 group-hover:opacity-100 transition-all flex gap-1 transform translate-x-4 group-hover:translate-x-0">
                    {userRole !== 'viewer' && (
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(client); }} className="p-2 hover:bg-gray-50 rounded-xl text-blue-500" title="Editar"><Edit className="w-4 h-4" /></button>
                    )}
                    {userRole === 'admin' && (
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(client.id!); }} className="p-2 hover:bg-gray-50 rounded-xl text-red-500" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                    )}
                </div>
              </div>

              <div className="space-y-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-tighter mt-6">
                <div className="flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-2.5 text-gray-300" />
                    <span className="truncate">{client.email || 'Não informado'}</span>
                </div>
                <div className="flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-2.5 text-gray-300" />
                    <span>{client.phone || 'Não informado'}</span>
                </div>
                <div className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-2.5 text-amber-500" />
                    <span className="truncate">{client.city ? `${client.city}/${client.uf}` : 'Localização pendente'}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
                 <div className="flex items-center text-[9px] font-black uppercase tracking-widest text-gray-400">
                    <User className="w-3.5 h-3.5 mr-2 text-amber-500" />
                    {client.partner_name || 'N/A'}
                 </div>
                 {client.active_contracts_count !== undefined && client.active_contracts_count > 0 && (
                     <div className="flex items-center text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase">
                        <Briefcase className="w-3 h-3 mr-1.5" />
                        {client.active_contracts_count} Casos
                     </div>
                 )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        client={clientToEdit} 
        onSave={fetchData}
      />

      {/* Modal de Detalhes do Cliente - Estilo Manager */}
      {viewingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a192f]/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
                <div className="flex justify-between items-center p-8 border-b border-gray-100 bg-[#0a192f]">
                    <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                        {viewingClient.is_person ? <User className="w-6 h-6 text-amber-500" /> : <Building className="w-6 h-6 text-amber-500" />}
                        {viewingClient.name}
                    </h2>
                    <button onClick={() => setViewingClient(null)} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-8 overflow-y-auto custom-scrollbar bg-gray-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-l-2 border-amber-500 pl-3">Dados de Contato</h3>
                            <div className="text-[11px] font-bold text-gray-600 space-y-3 uppercase tracking-tighter">
                                <p className="flex items-center"><Mail className="w-4 h-4 mr-3 text-amber-500 opacity-70"/> {viewingClient.email || '-'}</p>
                                <p className="flex items-center"><Phone className="w-4 h-4 mr-3 text-amber-500 opacity-70"/> {viewingClient.phone || '-'}</p>
                                <p className="flex items-center"><MapPin className="w-4 h-4 mr-3 text-amber-500 opacity-70"/> {viewingClient.city ? `${viewingClient.city}/${viewingClient.uf}` : '-'}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-l-2 border-amber-500 pl-3">Informações Gerais</h3>
                            <div className="text-[11px] font-bold text-[#0a192f] space-y-3 uppercase tracking-tighter">
                                <p><span className="text-gray-400 font-black mr-2">Documento:</span> {viewingClient.cnpj ? maskCNPJ(viewingClient.cnpj) : '-'}</p>
                                <p><span className="text-gray-400 font-black mr-2">Responsável:</span> {viewingClient.partner_name || '-'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-8">
                        <h3 className="text-[10px] font-black text-[#0a192f] uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-amber-500" /> Histórico de Contratos
                        </h3>
                        
                        {viewingContracts.length > 0 ? (
                            <div className="space-y-3">
                                {viewingContracts.map((contract: any) => (
                                    <div key={contract.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-amber-200 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-amber-50 p-2.5 rounded-xl">
                                                <FileText className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-[#0a192f] uppercase tracking-tight">{contract.title || 'Contrato Sem Título'}</p>
                                                <p className="text-[10px] font-bold text-emerald-600 mt-0.5">VLR: {contract.value ? Number(contract.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ -'}</p>
                                            </div>
                                        </div>
                                        <div className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-gray-50 border border-gray-100 text-gray-500">
                                            {contract.status || 'Pendente'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Nenhum contrato vinculado ao registro.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    {userRole !== 'viewer' && (
                        <button 
                            onClick={() => handleEdit(viewingClient)}
                            className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-100 shadow-sm transition-all active:scale-95 flex items-center"
                        >
                            <Edit className="w-4 h-4 mr-2 text-blue-500" /> Editar Registro
                        </button>
                    )}
                    {userRole === 'admin' && (
                        <button 
                            onClick={() => handleDelete(viewingClient.id!)}
                            className="px-6 py-2.5 bg-red-50 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-100 shadow-sm transition-all active:scale-95 flex items-center"
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir permanentemente
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}