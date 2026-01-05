import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Phone, MapPin, Plus, Search, Download, RefreshCcw, Pencil, Trash2, X, ListFilter, SortAsc } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Client {
  id: string;
  nome: string;
  telefone: string;
  socio: string;
  tipo_brinde: string;
  uf: string;
  email: string;
}

export function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase.from('clientes').select('*').order('nome');
    if (data) setClients(data as Client[]);
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(clients);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
    XLSX.writeFile(workbook, "Relatorio_Clientes.xlsx");
  };

  const deleteClient = async (id: string) => {
    if (confirm('Deseja realmente excluir este cliente?')) {
      await supabase.from('clientes').delete().eq('id', id);
      fetchClients();
    }
  };

  const filteredClients = clients.filter(c => 
    c.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Carregando clientes...</div>;

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={fetchClients} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors border border-gray-300">
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors font-medium text-sm">
            <Download className="h-4 w-4" /> Exportar XLS
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-[#112240] text-white px-4 py-2 rounded-md hover:bg-black transition-colors font-medium text-sm">
            <Plus className="h-4 w-4" /> Novo Cliente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 custom-scrollbar">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="h-10 w-10 bg-blue-100 text-blue-700 flex items-center justify-center rounded-full font-bold">
                {client.nome?.charAt(0)}
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                client.tipo_brinde === 'Brinde VIP' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {client.tipo_brinde || 'Padrão'}
              </span>
            </div>
            <h3 className="font-bold text-gray-800 mb-1">{client.nome}</h3>
            <div className="text-sm text-gray-500 space-y-1">
              <p className="flex items-center gap-2"><User className="h-3 w-3" /> {client.socio}</p>
              <p className="flex items-center gap-2"><Phone className="h-3 w-3" /> {client.telefone}</p>
              <p className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {client.uf}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
              <button className="p-1.5 text-gray-400 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => deleteClient(client.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
