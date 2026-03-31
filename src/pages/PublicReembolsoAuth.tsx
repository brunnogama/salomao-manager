import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Download, FileText, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ReembolsoDetails {
  id: string;
  created_at: string;
  status: string;
  valor: number;
  descricao: string;
  numero_recibo: string;
  fornecedor_nome: string;
  fornecedor_cnpj: string;
  recibo_url: string;
  solicitante_nome: string;
  solicitante_email: string;
  autorizador_nome: string;
  autorizador_email: string;
  data_despesa?: string;
  cliente_nome?: string;
  observacao?: string;
}

export default function PublicReembolsoAuth() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<'approve' | 'reject' | null>(null);
  const [data, setData] = useState<ReembolsoDetails | null>(null);
  const [error, setError] = useState('');

  // A mesma URL providenciada para centralizar o webhook no Make
  const MAKE_WEBHOOK = "https://hook.us2.make.com/ek933ugsc18euo3uwv9eha6mgk8ngvws";

  useEffect(() => {
    if (id) {
      loadDetails();
    } else {
      setError('ID não fornecido.');
      setLoading(false);
    }
  }, [id]);

  const loadDetails = async () => {
    try {
      const { data: rData, error: rError } = await supabase
        .from('reembolsos')
        .select(`
          *,
          collaborators:colaborador_id(name, email),
          authorizer:autorizador_id(name, email)
        `)
        .eq('id', id)
        .single();

      if (rError) throw rError;
      if (!rData) throw new Error("Reembolso não encontrado.");

      setData({
        id: rData.id,
        created_at: rData.created_at,
        status: rData.status,
        valor: rData.valor,
        descricao: rData.descricao || '',
        numero_recibo: rData.numero_recibo || '',
        fornecedor_nome: rData.fornecedor_nome || '',
        fornecedor_cnpj: rData.fornecedor_cnpj || '',
        recibo_url: rData.recibo_url || '',
        solicitante_nome: rData.collaborators?.name || 'Desconhecido',
        solicitante_email: rData.collaborators?.email || '',
        autorizador_nome: rData.authorizer?.name || '',
        autorizador_email: rData.authorizer?.email || '',
        data_despesa: rData.data_despesa,
        cliente_nome: rData.cliente_nome,
        observacao: rData.observacao
      });

    } catch (err: any) {
      console.error(err);
      setError('Não foi possível carregar os detalhes desta solicitação. A página pode ter expirado ou o link é inválido.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!data) return;
    setProcessing(action);
    const newStatus = action === 'approve' ? 'pendente' : 'rejeitado';

    try {
      const { error: updateError } = await supabase
        .from('reembolsos')
        .update({ status: newStatus })
        .eq('id', data.id);

      if (updateError) throw updateError;

      // Update local state to reflect change immediately
      setData(prev => prev ? { ...prev, status: newStatus } : null);
      
      toast.success(action === 'approve' ? 'Reembolso Autorizado com sucesso!' : 'Reembolso Rejeitado.');

      // Disparar o Webhook para notificar
      const payloadMake = {
        evento: "resultado_autorizacao",
        acao: action === 'approve' ? "Autorizado" : "Rejeitado",
        reembolso: {
          id: data.id,
          valor: data.valor > 0 ? data.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : "Aguardando Apuração",
          descricao: data.descricao || "Aguardando Leitura",
          fornecedor: data.fornecedor_nome || "Aguardando Leitura",
        },
        solicitante: {
          nome: data.solicitante_nome,
          email: data.solicitante_email
        },
        autorizador: {
          nome: data.autorizador_nome,
          email: data.autorizador_email
        }
      };

      await fetch(MAKE_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadMake)
      }).catch(e => console.error("Webhook silencioso falhou:", e));

    } catch (err: any) {
      console.error(err);
      toast.error('Ocorreu um erro ao processar sua solicitação: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin border-4 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-500 font-medium">Buscando detalhes da solicitação...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-red-50 text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 flex items-center justify-center rounded-full mx-auto mb-2">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Ops, algo deu errado</h1>
          <p className="text-gray-500 text-sm leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  const isPending = data.status === 'pendente_autorizacao';
  const isApproved = data.status === 'pendente' || data.status === 'pago';
  const isRejected = data.status === 'rejeitado';

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center py-6 px-4 md:py-12 md:px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-yellow-100/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="w-full max-w-[1200px] relative z-10 space-y-6 flex flex-col h-full items-center">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#112240]">
            Autorização de Reembolso
          </h1>
          <p className="text-sm md:text-base text-gray-500">
            Módulo de Validação do Líder/Gestor
          </p>
        </div>

        {/* Card Principal Split-Screen */}
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-blue-900/5 overflow-hidden border border-white/60 flex flex-col w-full max-w-[1200px]">
          
          {/* Status Banner */}
          {!isPending && (
            <div className={`p-4 text-center font-bold text-sm tracking-widest uppercase items-center justify-center gap-2 flex
              ${isApproved ? 'bg-green-50 text-green-700 border-b border-green-100' : ''}
              ${isRejected ? 'bg-red-50 text-red-700 border-b border-red-100' : ''}
            `}>
              {isApproved && <><CheckCircle2 className="w-5 h-5" /> Autorizado (Já na fila do financeiro)</>}
              {isRejected && <><XCircle className="w-5 h-5" /> Esta despesa foi Rejeitada</>}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] xl:grid-cols-[1fr,450px] divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
            
            {/* Esquerda: Visualizador do Recibo */}
            <div className="p-4 md:p-8 bg-gray-50/50 h-full flex flex-col">
               {data.recibo_url ? (
                 <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white flex flex-col shadow-sm flex-1 min-h-[500px]">
                   <div className="w-full bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                     <span className="text-sm font-bold text-[#112240] flex items-center gap-2">
                       <FileText className="w-5 h-5 text-blue-600" />
                       Visualizador de Documento
                     </span>
                     <a
                       href={data.recibo_url}
                       target="_blank"
                       rel="noreferrer"
                       className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-bold text-xs hover:bg-gray-50 transition-colors shadow-sm"
                     >
                       <Download className="w-4 h-4" />
                       Baixar
                     </a>
                   </div>
                   
                   <div className="w-full flex-1 flex items-center justify-center bg-gray-50/80 p-4">
                     {data.recibo_url.toLowerCase().match(/\.(jpeg|jpg|png|gif|webp)(?:\?.*)?$/i) ? (
                       <img
                         src={data.recibo_url}
                         alt="Recibo"
                         className="max-h-[700px] w-auto max-w-full rounded-xl shadow-sm border border-gray-200/60 object-contain mx-auto"
                         loading="lazy"
                       />
                     ) : data.recibo_url.toLowerCase().match(/\.pdf(?:\?.*)?$/i) ? (
                       <iframe
                         src={`${data.recibo_url}#toolbar=0`}
                         className="w-full h-[700px] rounded-xl border border-gray-200/60"
                         title="PDF Preview"
                       />
                     ) : (
                       <div className="p-8 flex flex-col items-center text-center">
                         <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                           <FileText className="w-8 h-8" />
                         </div>
                         <p className="font-bold text-gray-700">Visualização Indisponível</p>
                         <p className="text-xs text-gray-400 mt-1 max-w-xs">Este tipo de arquivo não suporta visualização direta no navegador. Utilize o botão acima para baixar.</p>
                       </div>
                     )}
                   </div>
                 </div>
               ) : (
                 <div className="h-full min-h-[500px] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 bg-white">
                    <FileText className="w-10 h-10 mb-2 opacity-50" />
                    <p className="font-medium text-sm">Nenhum recibo anexado</p>
                 </div>
               )}
            </div>

            {/* Direita: Informações e Ações */}
            <div className="p-6 md:p-8 flex flex-col h-full bg-white relative">
               
               {/* 1. Blocos de Destaque Principais (Nome e Valor) */}
               <div className="space-y-6 mb-8">
                  <div>
                     <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500"/> Solicitante</p>
                     <p className="text-xl md:text-2xl font-black text-[#112240] tracking-tight">{data.solicitante_nome}</p>
                  </div>
                  
                  <div className="p-6 rounded-[1.25rem] bg-gradient-to-br from-[#112240] to-[#1e3a8a] text-white shadow-xl shadow-blue-900/10 flex flex-col gap-1 border border-blue-800">
                     <p className="text-[11px] font-bold text-blue-200/80 uppercase tracking-widest">Valor da Despesa</p>
                     {data.valor > 0 ? (
                        <div className="text-4xl font-black text-[#f1c40f] tracking-tight drop-shadow-sm flex items-end">
                           <span className="text-2xl mr-1.5 text-[#f1c40f]/80 font-bold tracking-normal mb-1">R$</span>
                           {data.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                     ) : (
                        <div className="text-lg font-bold text-blue-100 flex items-center gap-2 mt-1">
                           <AlertCircle className="w-5 h-5 opacity-80" /> <span className="opacity-90">A apurar no contábil</span>
                        </div>
                     )}
                  </div>
               </div>

               {/* 2. Resumo Secundário (Apenas se a IA tiver lido ou financeiro atualizado) */}
               {data.valor > 0 && (
                  <div className="space-y-6 mb-8 flex-1">
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex flex-col justify-center">
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Data da Nota</p>
                           <p className="text-[15px] font-black text-[#112240]">
                              {data.data_despesa ? new Date(data.data_despesa + 'T12:00:00').toLocaleDateString('pt-BR') : new Date(data.created_at).toLocaleDateString('pt-BR')}
                           </p>
                        </div>
                        <div className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-xl flex flex-col justify-center">
                           <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Cliente Vinculado</p>
                           <p className="text-[14px] font-black text-blue-900 leading-tight">
                              {data.cliente_nome ? data.cliente_nome : 'Não Reembolsável'}
                           </p>
                        </div>
                     </div>

                     <div className="pt-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-gray-300"/> 
                          Fornecedor
                        </p>
                        <p className="text-sm font-bold text-gray-800 bg-white border border-gray-200/80 p-3.5 rounded-xl shadow-sm">
                           {data.fornecedor_nome || '-'}
                        </p>
                     </div>
                     
                     <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-gray-300"/> 
                          Itens Consumidos (IA)
                        </p>
                        <p className="text-sm font-medium text-gray-600 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                           {data.descricao || '-'}
                        </p>
                     </div>

                     {data.observacao && (
                        <div className="pt-2">
                           <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5"/>
                              Observação Extra do Usuário
                           </p>
                           <p className="text-sm font-medium text-amber-900 bg-amber-50 p-4 rounded-xl border border-amber-200/60 shadow-inner">
                              "{data.observacao}"
                           </p>
                        </div>
                     )}
                  </div>
               )}

               {/* Aviso se ainda pendente de Leitura IA */}
               {data.valor === 0 && (
                  <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col items-center justify-center text-center space-y-3 mb-8 flex-1">
                     <div className="w-14 h-14 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-100">
                        <AlertCircle className="w-7 h-7" />
                     </div>
                     <h3 className="font-bold text-[#112240] text-lg mt-2">Valores Pendentes</h3>
                     <p className="text-sm text-gray-500 leading-relaxed px-4">
                        Os dados não constam pois aguardam processamento. Você já pode autorizar o reembolso conferindo a imagem e o valor ao lado.
                     </p>
                  </div>
               )}

               {/* 3. Action Buttons (Bottom Pinned) */}
               {isPending && (
                  <div className="flex flex-col gap-3 mt-auto pt-6 border-t border-gray-100">
                     <button
                        onClick={() => handleAction('approve')}
                        disabled={processing !== null}
                        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-900 to-[#1e3a8a] focus:ring-4 focus:ring-blue-100 border border-blue-800 text-white font-bold tracking-widest uppercase text-sm shadow-xl shadow-blue-900/20 hover:shadow-blue-900/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                     >
                        {processing === 'approve' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        Autorizar Despesa
                     </button>
                     <button
                        onClick={() => handleAction('reject')}
                        disabled={processing !== null}
                        className="w-full py-4 px-6 rounded-2xl border-2 border-red-100 bg-white text-red-500 font-bold tracking-widest uppercase text-sm hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                     >
                        {processing === 'reject' ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                        Não Autorizar
                     </button>
                  </div>
               )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
