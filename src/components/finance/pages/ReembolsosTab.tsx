import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Search, Filter, Eye, CheckCircle2, XCircle, Clock, FileText, Download, Loader2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface Reembolso {
  id: string;
  reembolsavel_cliente: boolean;
  recibo_url: string;
  numero_recibo: string;
  fornecedor_nome: string;
  fornecedor_cnpj: string;
  data_despesa: string;
  valor: number;
  descricao: string;
  status: string;
  comprovante_pagamento_url: string | null;
  created_at: string;
  collaborators: { name: string };
}

export function ReembolsosTab() {
  const [reembolsos, setReembolsos] = useState<Reembolso[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [selectedReembolso, setSelectedReembolso] = useState<Reembolso | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);

  useEffect(() => {
    fetchReembolsos();
  }, []);

  const fetchReembolsos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reembolsos')
        .select(`
          *,
          collaborators (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setReembolsos(data);
    } catch (err) {
      console.error('Erro ao buscar reembolsos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (r: Reembolso) => {
    setSelectedReembolso(r);
    setPaymentFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReembolso(null);
  };

  const handlePayment = async () => {
    if (!selectedReembolso) return;
    
    setProcessingPayment(true);
    try {
      let comprovanteUrl = null;

      if (paymentFile) {
        const fileExt = paymentFile.name.split('.').pop();
        const fileName = `${selectedReembolso.id}_pagamento.${fileExt}`;
        const filePath = `comprovantes/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('gastos_reembolsos')
          .upload(filePath, paymentFile);

        if (!uploadError) {
          const { data } = supabase.storage.from('gastos_reembolsos').getPublicUrl(filePath);
          comprovanteUrl = data.publicUrl;
        } else {
          console.error("Erro upload:", uploadError);
          // continua sem anexo se falhou apenas para teste, ou pode bloquear
        }
      }

      // Update Database
      const { error } = await supabase
        .from('reembolsos')
        .update({
          status: 'pago',
          comprovante_pagamento_url: comprovanteUrl,
          reembolsavel_cliente: selectedReembolso.reembolsavel_cliente // Salva a escolha atualizada pelo financeiro se mudaram
        })
        .eq('id', selectedReembolso.id);

      if (error) throw error;

      // Chama webhook do Make.com se houver para notificar o usuário (Assíncrono)
      const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_REEMBOLSO_PAGO;
      if(webhookUrl && webhookUrl !== 'SUA_URL_AQUI') {
         fetch(webhookUrl, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ reembolso_id: selectedReembolso.id, comprovante_url: comprovanteUrl })
         }).catch(e => console.error("Erro chamando webhook", e)); // Fogo e esquece
      }

      await fetchReembolsos();
      handleCloseModal();
      
    } catch (err) {
      console.error(err);
      alert('Erro ao processar pagamento.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const filtered = reembolsos.filter(r => 
    r.collaborators.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.fornecedor_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-96 self-start md:self-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por colaborador ou despesa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium text-sm"
          />
        </div>
        <div className="flex gap-3 w-full justify-end md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-100 text-[#0a192f] rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-sm hover:bg-gray-50 transition-all">
            <Filter className="h-4 w-4" /> Filtros
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 flex justify-center border border-gray-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#1e3a8a]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="p-12 flex flex-col items-center justify-center text-center">
             <div className="p-4 rounded-full bg-gray-50 mb-4">
               <FileText className="h-12 w-12 text-gray-400" />
             </div>
             <h2 className="text-xl font-black text-[#0a192f]">Nenhum Reembolso</h2>
             <p className="text-gray-500 max-w-sm mt-2">
               Não encontramos nenhum pedido de reembolso no momento.
             </p>
           </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase tracking-wider font-bold text-gray-500">
                  <th className="p-4 pl-6">Colaborador</th>
                  <th className="p-4">Data / Valor</th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4">Cobrar Cliente?</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 pl-6 font-medium text-[#112240]">{r.collaborators.name}</td>
                    <td className="p-4 text-sm text-gray-600">
                      <div>{r.data_despesa ? format(new Date(r.data_despesa), 'dd/MM/yyyy') : '--'}</div>
                      <div className="font-bold text-[#1e3a8a]">
                        R$ {r.valor ? r.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={r.descricao}>
                      {r.descricao || 'Sem descrição'}
                    </td>
                    <td className="p-4">
                      {r.reembolsavel_cliente ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold">
                          Sim
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                          Não
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {r.status === 'pendente' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" /> Pendente
                        </span>
                      )}
                      {r.status === 'pago' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200/50 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Pago
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button 
                        onClick={() => handleOpenModal(r)}
                        className="p-2 bg-gray-50 text-gray-600 hover:text-[#1e3a8a] hover:bg-blue-50 rounded-xl transition-all inline-flex shadow-sm border border-gray-100"
                        title="Ver Detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Reembolso */}
      {isModalOpen && selectedReembolso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Visualização do Recibo (Esquerda) */}
            <div className="w-full md:w-1/2 bg-gray-100 border-r border-gray-200 flex flex-col hidden md:flex">
              <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-[#112240] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> Recibo Original
                </h3>
                <a 
                  href={selectedReembolso.recibo_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                >
                  Abrir <ArrowRight className="w-3 h-3" />
                </a>
              </div>
              <div className="flex-1 p-4 flex justify-center overflow-auto items-start">
                {selectedReembolso.recibo_url.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={selectedReembolso.recibo_url} className="w-full h-full min-h-[500px] rounded-xl border border-gray-200" title="PDF" />
                ) : (
                  <img src={selectedReembolso.recibo_url} alt="Recibo" className="max-w-full rounded-xl shadow-sm border border-gray-200" />
                )}
              </div>
            </div>

            {/* Dados e Ações (Direita) */}
            <div className="w-full md:w-1/2 flex flex-col max-h-[90vh]">
              
              <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-black text-[#112240]">Análise de Reembolso</h2>
                  <p className="text-sm text-gray-500">Solicitante: {selectedReembolso.collaborators.name}</p>
                </div>
                <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-5 md:p-6 flex-1 overflow-y-auto space-y-6">
                
                {/* Visualização de Recibo Mobile */}
                <div className="md:hidden">
                   <a 
                    href={selectedReembolso.recibo_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full p-4 border border-blue-200 bg-blue-50 rounded-xl text-blue-700 font-bold flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" /> Ver Recibo Anexado
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Número</label>
                    <div className="font-medium text-gray-800">{selectedReembolso.numero_recibo || '--'}</div>
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Data</label>
                    <div className="font-medium text-gray-800">
                      {selectedReembolso.data_despesa ? format(new Date(selectedReembolso.data_despesa), 'dd/MM/yyyy') : '--'}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Fornecedor</label>
                    <div className="font-medium text-gray-800">{selectedReembolso.fornecedor_nome || '--'}</div>
                  </div>
                  <div className="col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Descrição do Solicitante</label>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedReembolso.descricao || 'Nenhuma descrição fornecida.'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#112240] text-white flex justify-between items-center shadow-lg">
                  <span className="font-bold text-gray-300">Valor a Reembolsar</span>
                  <span className="text-2xl font-black text-green-400">
                    R$ {selectedReembolso.valor ? selectedReembolso.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                  </span>
                </div>

                {/* Área Financeira */}
                {selectedReembolso.status !== 'pago' ? (
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 space-y-4">
                    <h4 className="font-bold text-[#1e3a8a] mb-2 border-b border-blue-100 pb-2">Ação do Financeiro</h4>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="reembolsar-cliente-modal"
                        className="w-5 h-5 rounded text-[#1e3a8a] focus:ring-[#1e3a8a]"
                        checked={selectedReembolso.reembolsavel_cliente}
                        onChange={(e) => setSelectedReembolso({ ...selectedReembolso, reembolsavel_cliente: e.target.checked })}
                      />
                      <label htmlFor="reembolsar-cliente-modal" className="font-medium text-gray-800 cursor-pointer">
                        Despesa reembolsável pelo cliente?
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 mt-4">Comprovante de Pagamento (Opcional)</label>
                      <input 
                        type="file" 
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files && setPaymentFile(e.target.files[0])}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#1e3a8a] file:text-white hover:file:bg-[#152e72] cursor-pointer bg-white border border-gray-200 rounded-xl p-1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <h4 className="font-bold text-green-800">Reembolso Pago</h4>
                    {selectedReembolso.comprovante_pagamento_url && (
                      <a 
                        href={selectedReembolso.comprovante_pagamento_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex mt-3 text-sm font-bold bg-white text-green-700 px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
                      >
                        Ver Comprovante
                      </a>
                    )}
                  </div>
                )}

              </div>

              {/* Botões do Rodapé */}
              {selectedReembolso.status !== 'pago' && (
                <div className="p-5 border-t border-gray-100 bg-gray-50 sticky bottom-0 z-10">
                  <button
                    onClick={handlePayment}
                    disabled={processingPayment}
                    className="w-full py-4 bg-[#0a192f] text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-black transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {processingPayment ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</> : 'Marcar como Pago e Notificar Colaborador'}
                  </button>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
