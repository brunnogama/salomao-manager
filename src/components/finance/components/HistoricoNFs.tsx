import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Calendar, Building, FileDigit, Key, Search, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface HistoricoNF {
  id: string;
  nf_issue_date: string;
  nf_number: string;
  nf_access_key: string;
  contract: any;
}

export const HistoricoNFs: React.FC = () => {
  const [historico, setHistorico] = useState<HistoricoNF[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHistorico();
  }, []);

  const fetchHistorico = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('financial_installments')
        .select(`
          id,
          nf_issue_date,
          nf_number,
          nf_access_key,
          contract:contracts(client_name)
        `)
        .eq('status', 'nf_emitida')
        .not('nf_access_key', 'is', null)
        .order('nf_issue_date', { ascending: false });

      if (error) throw error;
      setHistorico(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico de NFs:', error);
      toast.error('Erro ao buscar histórico de notas fiscais.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string | null, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado(a)!`);
  };

  const filteredHistorico = historico.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const clientName = (item.contract?.client_name || '').toLowerCase();
    const nfNumber = (item.nf_number || '').toLowerCase();
    const key = (item.nf_access_key || '').toLowerCase();
    return clientName.includes(searchLower) || nfNumber.includes(searchLower) || key.includes(searchLower);
  });

  return (
    <div className="w-full flex flex-col gap-6 p-4 sm:p-6 bg-gray-50/50 min-h-full">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
        {/* HEADER & SEARCH */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-[#0a192f] tracking-tight flex items-center gap-2">
              Histórico de NFs Emitidas
            </h2>
            <p className="text-sm font-medium text-gray-500 mt-1">
              Registro cronológico de todas as Notas Fiscais emitidas através do sistema.
            </p>
          </div>
          
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, número ou chave..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* TABLE LIST */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-xs font-black text-gray-500 uppercase tracking-wider">
              <div className="col-span-2 p-4 flex items-center gap-2"><Calendar className="w-4 h-4" /> Data da Emissão</div>
              <div className="col-span-3 p-4 flex items-center gap-2"><Building className="w-4 h-4" /> Cliente (Tomador)</div>
              <div className="col-span-2 p-4 flex items-center gap-2"><FileDigit className="w-4 h-4" /> Número da NFS-e</div>
              <div className="col-span-5 p-4 flex items-center gap-2"><Key className="w-4 h-4" /> Chave de Acesso</div>
            </div>

            {/* Table Body */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-[#1e3a8a]">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <span className="font-bold text-sm tracking-wider uppercase">Carregando Histórico...</span>
              </div>
            ) : filteredHistorico.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                <FileDigit className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-bold uppercase tracking-widest text-sm">Nenhum registro encontrado</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredHistorico.map((nf) => (
                  <div key={nf.id} className="grid grid-cols-12 text-sm hover:bg-emerald-50/50 transition-colors group">
                    <div className="col-span-2 p-4 flex items-center font-semibold text-gray-700">
                      {nf.nf_issue_date ? new Date(nf.nf_issue_date).toLocaleDateString('pt-BR') : '-'}
                    </div>
                    <div className="col-span-3 p-4 flex items-center font-bold text-[#0a192f] truncate pr-4">
                      {nf.contract?.client_name || '-'}
                    </div>
                    <div className="col-span-2 p-4 flex items-center group/btn relative">
                      {nf.nf_number ? (
                         <div 
                           onClick={() => handleCopy(nf.nf_number, 'Número NFS-e')}
                           className="bg-emerald-100/50 border border-emerald-200 text-emerald-800 font-mono font-bold px-2.5 py-1 rounded-md text-xs cursor-pointer hover:bg-emerald-200 hover:border-emerald-300 transition-all flex items-center gap-2"
                         >
                            {nf.nf_number}
                            <Copy className="w-3 h-3 opacity-50" />
                         </div>
                      ) : (
                         <span className="text-gray-400 font-semibold italic text-xs">Pendente</span>
                      )}
                    </div>
                    <div className="col-span-5 p-4 flex items-center group/btn relative max-w-full">
                       {nf.nf_access_key ? (
                          <div 
                            onClick={() => handleCopy(nf.nf_access_key, 'Chave de Acesso')}
                            className="bg-gray-100/80 border border-gray-200 text-gray-700 font-mono font-semibold px-2.5 py-1 rounded-md text-xs cursor-pointer hover:bg-gray-200 hover:text-black hover:border-gray-300 transition-all flex items-center justify-between gap-3 w-full"
                          >
                             <span className="truncate">{nf.nf_access_key}</span>
                             <Copy className="w-3 h-3 opacity-50 shrink-0" />
                          </div>
                       ) : (
                         <span className="text-gray-400 font-semibold italic text-xs">Não disponível</span>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
