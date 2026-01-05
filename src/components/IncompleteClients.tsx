import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, ArrowRight, RefreshCcw } from 'lucide-react';

export function IncompleteClients() {
  const [pendings, setPendings] = useState<any[]>([]);

  const fetchPendings = async () => {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .or('tipo_brinde.is.null,socio.is.null,telefone.is.null');
    if (data) setPendings(data);
  };

  useEffect(() => { fetchPendings(); }, []);

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn">
      {/* Header Glassmorphism */}
      <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-2xl text-red-600 shadow-lg shadow-red-100/50">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-black text-[#112240] text-lg">Pendências de Cadastro</h3>
            <p className="text-xs text-gray-500">Estes registros precisam de atenção imediata para validação.</p>
          </div>
        </div>
        <button 
          onClick={fetchPendings} 
          className="flex items-center gap-2 bg-white/50 border border-gray-100 px-4 py-2 rounded-xl text-xs font-bold hover:bg-white transition-all active:scale-95"
        >
          <RefreshCcw className="h-4 w-4" /> ATUALIZAR
        </button>
      </div>

      {/* Tabela Glassmorphism */}
      <div className="bg-white/80 backdrop-blur-lg rounded-[2.5rem] border border-white/60 shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
        <div className="overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Cliente</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Responsável</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] text-center">Pendências</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pendings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-medium">Nenhuma pendência encontrada. Bom trabalho!</td>
                </tr>
              ) : (
                pendings.map((client) => (
                  <tr key={client.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-gray-800">{client.nome}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{client.email || 'Sem e-mail cadastrado'}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black text-[#112240] bg-white border border-gray-100 px-3 py-1 rounded-lg shadow-sm">
                        {client.socio || 'NÃO DEFINIDO'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {!client.tipo_brinde && <span className="bg-red-50 text-red-600 text-[8px] font-black px-2.5 py-1 rounded-full border border-red-100 tracking-wider">BRINDE</span>}
                        {!client.telefone && <span className="bg-amber-50 text-amber-600 text-[8px] font-black px-2.5 py-1 rounded-full border border-amber-100 tracking-wider">TELEFONE</span>}
                        {!client.socio && <span className="bg-indigo-50 text-indigo-600 text-[8px] font-black px-2.5 py-1 rounded-full border border-indigo-100 tracking-wider">SÓCIO</span>}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-gray-300 group-hover:text-blue-600 transition-all hover:translate-x-1">
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
