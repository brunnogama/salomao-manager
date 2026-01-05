import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, RefreshCcw, ArrowRight } from 'lucide-react';

export function IncompleteClients() {
  const [pendings, setPendings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .or('tipo_brinde.is.null,socio.is.null,telefone.is.null');
    if (data) setPendings(data);
    setLoading(false);
  };

  useEffect(() => { fetchPendings(); }, []);

  if (loading) return <div className="p-10 text-center text-gray-500 font-medium">Analisando pendências...</div>;

  return (
    <div className="flex flex-col h-full space-y-4 animate-fadeIn">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <h2 className="text-lg font-bold text-[#112240]">Cadastros Incompletos</h2>
        </div>
        <button onClick={fetchPendings} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors uppercase tracking-widest">
          <RefreshCcw className="h-4 w-4" /> Sincronizar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome do Cliente</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Faltando</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pendings.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-gray-400">Nenhuma pendência encontrada.</td>
              </tr>
            ) : (
              pendings.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800 text-sm">{client.nome}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{client.socio || 'Sócio Pendente'}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      {!client.tipo_brinde && <span className="bg-red-50 text-red-600 text-[9px] font-bold px-2 py-0.5 rounded border border-red-100">BRINDE</span>}
                      {!client.telefone && <span className="bg-amber-50 text-amber-600 text-[9px] font-bold px-2 py-0.5 rounded border border-amber-100">TELEFONE</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 text-[10px] font-black flex items-center gap-1 ml-auto uppercase tracking-tighter">
                      Corrigir <ArrowRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
