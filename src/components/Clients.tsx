import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Phone, MapPin, MoreVertical, Plus, Search, Filter, Download, RefreshCcw, Pencil, Trash2, X, Mail } from 'lucide-react';

interface Client {
  id: string;
  nome: string;
  telefone: string;
  socio: string;
  tipo_brinde: string;
  uf: string;
  email: string;
  cidade?: string;
}

export function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase.from('clientes').select('*').order('nome');
    if (data) setClients(data as Client[]);
    setLoading(false);
  };

  const deleteClient = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Impede de abrir o modal ao clicar em excluir
    if (confirm('Deseja realmente excluir este cliente?')) {
      await supabase.from('clientes').delete().eq('id', id);
      fetchClients();
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const getBrindeColor = (tipo: string) => {
    if (tipo === 'Brinde VIP') return '#a855f7';
    if (tipo === 'Brinde Médio') return '#22c55e';
    return '#94a3b8';
  };

  if (loading) return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn pb-10 relative">
      {/* Toolbar */}
      <div className="bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white/40 shadow-sm flex flex-wrap gap-4 items-center justify-between z-10">
        <div className="flex gap-3 items-center flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Buscar cliente..." className="w-full bg-white/50 border border-gray-100 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>
          <button onClick={fetchClients} className="p-2.5 bg-white/50 border border-gray-100 rounded-xl hover:bg-white transition-all active:scale-90"><RefreshCcw className="h-4 w-4 text-gray-500" /></button>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"><Download className="h-4 w-4" /> EXPORTAR</button>
          <button className="flex items-center gap-2 bg-[#112240] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-900/20 hover:bg-black transition-all active:scale-95"><Plus className="h-4 w-4" /> NOVO CLIENTE</button>
        </div>
      </div>

      {/* Grid de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pr-2 custom-scrollbar">
        {clients.map((client) => (
          <div 
            key={client.id} 
            onClick={() => setSelectedClient(client)}
            className="group bg-white/80 backdrop-blur-sm p-6 rounded-[2.5rem] border border-white/60 shadow-sm transition-all hover:shadow-xl hover:shadow-blue-900/[0.04] hover:-translate-y-1 cursor-pointer relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-inner flex items-center justify-center font-bold text-[#112240] text-lg border border-gray-50">
                {client.nome?.charAt(0)}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-[9px] font-black px-2.5 py-1 rounded-full border tracking-wider" style={{ color: getBrindeColor(client.tipo_brinde), borderColor: `${getBrindeColor(client.tipo_brinde)}30`, backgroundColor: `${getBrindeColor(client.tipo_brinde)}10` }}>
                  {client.tipo_brinde?.toUpperCase() || 'SEM BRINDE'}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 bg-white rounded-lg border border-gray-100 text-gray-400 hover:text-blue-600 shadow-sm"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={(e) => deleteClient(client.id, e)} className="p-1.5 bg-white rounded-lg border border-gray-100 text-gray-400 hover:text-red-600 shadow-sm"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>

            <h4 className="font-bold text-[#112240] text-base mb-4 truncate">{client.nome}</h4>
            
            <div className="space-y-3 pb-5 border-b border-gray-50">
              <div className="flex items-center gap-3 text-gray-500">
                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600"><User className="h-3.5 w-3.5" /></div>
                <span className="text-[10px] font-bold uppercase tracking-tight">{client.socio || 'Não atribuído'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-500">
                <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400"><Phone className="h-3.5 w-3.5" /></div>
                <span className="text-[10px] font-medium">{client.telefone || '(00) 00000-0000'}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-gray-400">
                <MapPin className="h-3 w-3" />
                <span className="text-[10px] font-bold">{client.uf || 'UF'}</span>
              </div>
              <span className="text-[9px] font-black text-blue-600/40 uppercase tracking-widest">Clique para expandir</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Expansão Glassmorphism */}
      {selectedClient && (
        <div className="fixed inset-0 bg-[#112240]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white/90 backdrop-blur-xl w-full max-w-2xl rounded-[3rem] shadow-2xl border border-white overflow-hidden animate-scaleIn">
            <div className="bg-[#112240] p-8 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center text-2xl font-black">
                  {selectedClient.nome.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">{selectedClient.nome}</h2>
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Ficha Completa do Cliente</p>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors"><X className="h-6 w-6" /></button>
            </div>

            <div className="p-10 grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Responsável</label>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <User className="h-5 w-5 text-blue-600" />
                    <span className="font-bold text-[#112240]">{selectedClient.socio}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Contato</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium">{selectedClient.telefone || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium">{selectedClient.email || 'Não informado'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Especificação de Brinde</label>
                  <div className="p-4 rounded-2xl border flex items-center justify-between" style={{ borderColor: `${getBrindeColor(selectedClient.tipo_brinde)}30`, backgroundColor: `${getBrindeColor(selectedClient.tipo_brinde)}05` }}>
                    <span className="font-black text-sm uppercase" style={{ color: getBrindeColor(selectedClient.tipo_brinde) }}>{selectedClient.tipo_brinde}</span>
                    <Gift className="h-5 w-5" style={{ color: getBrindeColor(selectedClient.tipo_brinde) }} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Localização</label>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-bold text-[#112240]">{selectedClient.uf} - {selectedClient.cidade || 'Cidade não informada'}</span>
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">EDITAR CADASTRO</button>
                  <button onClick={(e) => { deleteClient(selectedClient.id, e); setSelectedClient(null); }} className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all"><Trash2 className="h-5 w-5" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
