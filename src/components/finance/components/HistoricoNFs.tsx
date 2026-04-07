import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Calendar, Building, FileDigit, Key, Search, Loader2, Copy, DollarSign, FileDown, RefreshCw, XCircle, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';
import XLSX from 'xlsx-js-style';
import { toast } from 'sonner';

interface HistoricoNF {
  id: string;
  nf_issue_date: string;
  nf_number: string;
  nf_access_key: string;
  nf_value?: number;
  net_value?: number;
  contract: any;
}

export const HistoricoNFs: React.FC = () => {
  const [historico, setHistorico] = useState<HistoricoNF[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals e Ações
  const [nfToCancel, setNfToCancel] = useState<HistoricoNF | null>(null);
  const [nfToSubstitute, setNfToSubstitute] = useState<HistoricoNF | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

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
          nf_access_key, nf_value, net_value,
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

  const handleConfirmCancel = async () => {
    if (!nfToCancel) return;
    setIsProcessingAction(true);
    try {
      const apiUrl = import.meta.env.VITE_SIGNATURE_API || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/cancelar-nota`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nf_number: nfToCancel.nf_number,
          chave_acesso: nfToCancel.nf_access_key
        })
      });

      if (!response.ok) {
        throw new Error('Serviço de cancelamento indisponível ou erro na prefeitura');
      }

      const { error } = await supabase
        .from('financial_installments')
        .update({ status: 'cancelada' })
        .eq('id', nfToCancel.id);

      if (error) throw error;
      
      toast.success('Nota fiscal cancelada com sucesso!');
      setHistorico(prev => prev.filter(n => n.id !== nfToCancel.id));
    } catch (err) {
      console.error('Erro de API no Cancelamento:', err);
      toast.error('Ocorreu um erro ao cancelar. O endpoint ou serviço está indisponível.');
    } finally {
      setIsProcessingAction(false);
      setNfToCancel(null);
    }
  };

  const handleConfirmSubstitute = async () => {
    if (!nfToSubstitute) return;
    setIsProcessingAction(true);
    try {
      const apiUrl = import.meta.env.VITE_SIGNATURE_API || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/substituir-nota`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nf_number: nfToSubstitute.nf_number,
          chave_acesso: nfToSubstitute.nf_access_key
        })
      });

      if (!response.ok) {
         throw new Error('Serviço de substituição indisponível ou erro na prefeitura');
      }

      const { error } = await supabase
        .from('financial_installments')
        .update({
          status: 'pending',
          nf_access_key: null,
          nf_number: null,
          nf_pdf: null
        })
        .eq('id', nfToSubstitute.id);

      if (error) throw error;
      
      toast.success('A NF original foi cancelada! A parcela retornou para status pendente e já pode ser reenviada.');
      setHistorico(prev => prev.filter(n => n.id !== nfToSubstitute.id));
    } catch (err) {
      console.error('Erro de API na Substituição:', err);
      toast.error('Erro ao substituir NF. O endpoint ou serviço está indisponível.');
    } finally {
      setIsProcessingAction(false);
      setNfToSubstitute(null);
    }
  };

  const handleExportXLSX = () => {
    if (filteredHistorico.length === 0) {
      toast.error('Nenhum dado para exportar.');
      return;
    }

    const exportRawData = filteredHistorico.map(nf => ({
      "Data Emissão": nf.nf_issue_date ? new Date(nf.nf_issue_date).toLocaleDateString('pt-BR') : '-',
      "Cliente": nf.contract?.client_name || '-',
      "NF": nf.nf_number || 'Pendente',
      "Valor Bruto": nf.nf_value || 0,
      "Valor Líquido": nf.net_value || 0,
      "Chave de Acesso": nf.nf_access_key || 'Não disponível'
    }));

    const ws = XLSX.utils.json_to_sheet(exportRawData);

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col }); 
      if (!ws[cellRef]) continue;

      ws[cellRef].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "0A192F" } }, 
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    ws['!cols'] = [
      { wch: 15 }, // Data
      { wch: 40 }, // Cliente
      { wch: 15 }, // NF
      { wch: 20 }, // Bruto
      { wch: 20 }, // Liquido
      { wch: 50 }, // Chave
    ];

    for (let R = 1; R <= range.e.r; ++R) {
      const cellBruto = XLSX.utils.encode_cell({ r: R, c: 3 });
      if (ws[cellBruto] && typeof ws[cellBruto].v === 'number') {
        ws[cellBruto].t = 'n';
        ws[cellBruto].z = '"R$"#,##0.00;"R$"-#,##0.00';
      }
      const cellLiq = XLSX.utils.encode_cell({ r: R, c: 4 });
      if (ws[cellLiq] && typeof ws[cellLiq].v === 'number') {
        ws[cellLiq].t = 'n';
        ws[cellLiq].z = '"R$"#,##0.00;"R$"-#,##0.00';
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NFs Emitidas");
    XLSX.writeFile(wb, `Historico_NFs_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Planilha gerada com sucesso!');
  };

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
          
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative max-w-sm w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, número ou chave..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button
              onClick={handleExportXLSX}
              title="Exportar Planilha"
              className="flex items-center justify-center w-10 h-10 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 shrink-0"
            >
              <FileDown className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* TABLE LIST */}
        <div className="overflow-x-auto">
          <div className="min-w-[1100px]">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_3.5fr_1.5fr_1.5fr_1.5fr_3fr_1.2fr] bg-gray-50 border-b border-gray-200 text-xs font-black text-gray-500 uppercase tracking-wider">
              <div className="p-4 flex items-center gap-2"><Calendar className="w-4 h-4" /> Data</div>
              <div className="p-4 flex items-center gap-2"><Building className="w-4 h-4" /> Cliente (Tomador)</div>
              <div className="p-4 flex items-center gap-2"><FileDigit className="w-4 h-4" /> Número</div>
              <div className="p-4 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Bruto</div>
              <div className="p-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-600" /> Líquido</div>
              <div className="p-4 flex items-center gap-2"><Key className="w-4 h-4" /> Chave de Acesso</div>
              <div className="p-4 flex items-center justify-end">Ações</div>
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
                  <div key={nf.id} className="grid grid-cols-[1fr_3.5fr_1.5fr_1.5fr_1.5fr_3fr_1.2fr] text-sm hover:bg-emerald-50/50 transition-colors group">
                    <div className="p-4 flex items-center font-semibold text-gray-700">
                      {nf.nf_issue_date ? new Date(nf.nf_issue_date).toLocaleDateString('pt-BR') : '-'}
                    </div>
                    <div className="p-4 flex items-center font-bold text-[#0a192f] truncate pr-4">
                      {nf.contract?.client_name || '-'}
                    </div>
                    <div className="p-4 flex items-center group/btn relative">
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
                    <div className="p-4 flex items-center font-bold text-gray-600">
                      {nf.nf_value ? (nf.nf_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                    </div>
                    <div className="p-4 flex items-center font-bold text-emerald-600">
                      {nf.net_value ? (nf.net_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                    </div>
                    <div className="p-4 flex items-center group/btn relative max-w-full">
                       {nf.nf_access_key ? (
                          <div 
                            onClick={() => handleCopy(nf.nf_access_key, 'Chave de Acesso')}
                            className="bg-gray-100/80 border border-gray-200 text-[#1e3a8a] font-mono font-semibold px-2.5 py-1.5 rounded-md text-[10px] cursor-pointer hover:bg-blue-50 hover:text-blue-900 hover:border-blue-200 transition-all flex items-center justify-between gap-2 w-full group/copy"
                          >
                             <span className="truncate">{nf.nf_access_key}</span>
                             <Copy className="w-3.5 h-3.5 opacity-50 group-hover/copy:opacity-100 group-hover/copy:text-blue-600 shrink-0 transition-opacity" />
                          </div>
                       ) : (
                         <span className="text-gray-400 font-semibold italic text-xs">Não disponível</span>
                       )}
                    </div>
                    <div className="p-4 flex items-center justify-end gap-2">
                       <button
                         onClick={() => setNfToSubstitute(nf)}
                         className="p-1.5 bg-white border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 transition-all shadow-sm group/btn tooltip relative"
                         title="Substituir Nota"
                       >
                         <RefreshCw className="w-4 h-4" />
                       </button>
                       <button
                         onClick={() => setNfToCancel(nf)}
                         className="p-1.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all shadow-sm group/btn tooltip relative"
                         title="Cancelar Nota"
                       >
                         <XCircle className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CANCEL MODAL */}
      {nfToCancel && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300">
            <div className="p-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6 shadow-inner">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-center text-xl font-black text-gray-900 mb-2 tracking-tight">Cancelar NF-e?</h2>
              <p className="text-center text-sm text-gray-500 mb-8 font-medium px-4 leading-relaxed">
                Você confirmou o cancelamento no sistema da prefeitura para a NF <strong className="text-red-600 font-bold">{nfToCancel.nf_number}</strong>? Ela deixará de aparecer neste histórico e esta ação é irreversível.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setNfToCancel(null)}
                  disabled={isProcessingAction}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-all shadow-sm"
                >
                  Voltar
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={isProcessingAction}
                  className="flex-[1.5] px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Cancelamento'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* SUBSTITUTE MODAL */}
      {nfToSubstitute && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300">
            <div className="p-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6 shadow-inner">
                <RefreshCw className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-center text-xl font-black text-gray-900 mb-2 tracking-tight">Substituir NF-e?</h2>
              <p className="text-center text-sm text-gray-500 mb-8 font-medium px-4 leading-relaxed">
                A NF <strong className="text-amber-600 font-bold">{nfToSubstitute.nf_number}</strong> será substituída e retornará à aba de <strong className="text-gray-700">Emissão (Pendente)</strong> para que você possa corrigir os dados e gerar uma nova chave.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setNfToSubstitute(null)}
                  disabled={isProcessingAction}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-all shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmSubstitute}
                  disabled={isProcessingAction}
                  className="flex-[1.5] px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Garantir Substituição'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
