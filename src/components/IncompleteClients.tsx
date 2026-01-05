import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, RefreshCcw, ArrowRight } from 'lucide-react';

export function IncompleteClients() {
  const [pendings, setPendings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendings = async () => {
    setLoading(true);
    const { data } = await supabase.from('clientes').select('*').or('tipo_brinde.is.null,socio.is.null,telefone.is.null');
    if (data) setPendings(data);
    setLoading(false);
  };

  useEffect(() => { fetchPendings(); }, []);

  if (loading) return <div className="p-8 text-center">Carregando pendências...</div>;

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <h2 className="text-lg font-bold text-gray-800">Cadastros Incompletos</h2>
        </div>
        <button onClick={fetchPendings} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600">
          <RefreshCcw className="h-4 w-4" /> Atualizar
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">Pendência</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pendings.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-800">{client.nome}</p>
                  <p className="text-xs text-gray-500">{client.socio || 'Sócio não definido'}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    {!client.tipo_brinde && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">BRINDE</span>}
                    {!client.telefone && <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded">TELEFONE</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-600 hover:underline text-sm font-bold flex items-center gap-1 ml-auto">
                    Editar <ArrowRight className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
