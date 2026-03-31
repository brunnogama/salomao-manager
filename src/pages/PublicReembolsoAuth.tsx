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
        autorizador_email: rData.authorizer?.email || ''
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

      <div className="w-full max-w-2xl relative z-10 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#112240]">
            Autorização de Reembolso
          </h1>
          <p className="text-sm md:text-base text-gray-500">
            Módulo de Validação do Líder/Gestor
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-blue-900/5 overflow-hidden border border-white/60">
          
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

          <div className="p-6 md:p-10 space-y-8">
            
            {/* Infos Pessoais e Resumo */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-8">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Solicitante</p>
                <p className="text-xl font-bold text-[#112240]">{data.solicitante_nome}</p>
              </div>
              <div className="space-y-1 md:text-right">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Valor da Despesa</p>
                {data.valor > 0 ? (
                  <div className="text-3xl font-black text-[#d4af37] tracking-tight">
                    <span className="text-lg mr-1 text-[#d4af37]/70">R$</span>
                    {data.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                ) : (
                  <div className="inline-block px-4 py-2 bg-yellow-50 text-yellow-700 font-bold text-sm tracking-wide rounded-full border border-yellow-200">
                     A Apurar pelo Financeiro
                  </div>
                )}
              </div>
            </div>

            {/* Detalhes da Despesa (Só mostramos se a IA/Financeiro já leu ou houver dados extras preenchidos) */}
            {data.valor > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100/50">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><FileText className="w-3 h-3"/> Descrição</p>
                  <p className="text-sm font-medium text-gray-700 leading-relaxed">{data.descricao || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fornecedor / Estabelecimento</p>
                  <p className="text-sm font-medium text-gray-700">{data.fornecedor_nome || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Data do Envio</p>
                  <p className="text-sm font-medium text-gray-700">{new Date(data.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            )}

            {/* Aviso quando pendente de IA */}
            {data.valor === 0 && (
               <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-inner">
                     <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-[#112240]">Aguardando Apuração</h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                     O valor do recibo abaixo bem como o CNPJ e descrição serão apurados pelo departamento financeiro da Salomão.
                  </p>
                  <p className="text-sm font-bold text-blue-600 mt-2">
                     Você pode manifestar sua autorização baseado na imagem anexa abaixo.
                  </p>
               </div>
            )}

            {/* Recibo Anexo */}
            {data.recibo_url && (
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 flex flex-col items-center">
                <div className="w-full bg-gray-100 border-b border-gray-200 p-3 text-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Comprovante Anexado
                  </span>
                </div>
                {/* Img Preview - assumes its image or pdf link */}
                {data.recibo_url.toLowerCase().match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                  <img src={data.recibo_url} alt="Recibo" className="w-full h-auto max-h-[500px] object-contain p-4" />
                ) : (
                  <div className="p-10 flex flex-col items-center justify-center gap-4 text-center">
                    <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-700">Documento PDF ou Indisponível para Preview</p>
                      <a href={data.recibo_url} target="_blank" rel="noreferrer" className="text-sm text-blue-500 font-semibold hover:underline mt-2 inline-block">
                        Clique aqui para visualizar ou baixar
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {isPending && (
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleAction('reject')}
                  disabled={processing !== null}
                  className="flex-1 py-4 px-6 rounded-xl border border-red-200 bg-white text-red-600 font-bold tracking-wide uppercase text-sm hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processing === 'reject' ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                  Não Autorizar
                </button>
                <button
                  onClick={() => handleAction('approve')}
                  disabled={processing !== null}
                  className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-blue-900 to-blue-800 focus:ring-4 focus:ring-blue-100 border border-blue-900 text-white font-bold tracking-wider uppercase text-sm shadow-xl shadow-blue-900/20 hover:shadow-blue-900/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processing === 'approve' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Autorizar Despesa
                </button>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
