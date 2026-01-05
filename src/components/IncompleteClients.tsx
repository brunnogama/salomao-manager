import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Phone, MapPin, MoreVertical, Plus, Search, Filter, Download, RefreshCcw } from 'lucide-react';

interface Client {
  id: string;
  nome: string;
  telefone: string;
  socio: string;
  tipo_brinde: string;
  uf: string;
}

export function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase.from('clientes').select('*').order('nome');
    if (data) setClients(data);
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const getBrindeColor = (tipo: string) => {
    if (tipo === 'Brinde VIP') return '#a855f7';
    if (tipo === 'Brinde Médio') return '#22c55e';
    return '#94a3b8';
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn pb-10">
      <div className="bg-white/70 backdrop-blur-md p-4 rounded-[1.5rem] border border-white/40 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3 items-center flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Buscar cliente..." className="w-full bg-white/50 border border-gray-100 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <button className="p-2.5 bg-white/50 border border-gray-100 rounded-xl hover:bg-white transition-colors"><Filter className="h-4 w-4 text-gray-500" /></button>
          <button onClick={fetchClients} className="p-2.5 bg-white/50 border border-gray-100 rounded-xl hover:bg-white transition-colors"><RefreshCcw className="h-4 w-4 text-gray-500" /></button>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"><Download className="h-4 w-4" /> EXPORTAR</button>
          <button className="flex items-center gap-2 bg-[#112240] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-900/20 hover:bg-black transition-all"><Plus className="h-4 w-4" /> NOVO CLIENTE</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pr-2 custom-scrollbar">
        {clients.map((client) => (
          <div key={client.id} className="group bg-white/80 backdrop-blur-sm p-6 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 transition-all hover:shadow-xl hover:shadow-blue-900/[0.04] hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center font-bold text-[#112240] text-lg border border-white shadow-inner">
                {client.nome?.charAt(0)}
              </div>
              <div className="flex flex-col items-end gap-2 text-right">
                <span className="text-[9px] font-black px-2.5 py-1 rounded-full border tracking-wider" style={{ color: getBrindeColor(client.tipo_brinde), borderColor: `${getBrindeColor(client.tipo_brinde)}30`, backgroundColor: `${getBrindeColor(client.tipo_brinde)}10` }}>
                  {client.tipo_brinde?.toUpperCase() || 'SEM BRINDE'}
                </span>
                <button className="text-gray-300 hover:text-gray-600"><MoreVertical className="h-4 w-4" /></button>
              </div>
            </div>

            <h4 className="font-bold text-[#112240] text-base mb-4 truncate group-hover:text-blue-700 transition-colors">{client.nome}</h4>
            
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
              <button className="text-[10px] font-black text-blue-600 hover:tracking-widest transition-all">VER DETALHES</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
