import React, { useState } from 'react';
import { Search, ShieldCheck, ShieldAlert, FileText, CheckCircle2, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ValidationSection() {
  const [trackingCode, setTrackingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // O ID é um UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(trackingCode.trim())) {
        throw new Error('Formato de código inválido.');
      }

      const { data, error: fetchError } = await supabase
        .from('vacation_requests')
        .select('*')
        .eq('id', trackingCode.trim())
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        throw new Error('Documento não encontrado na plataforma Salomão Manager.');
      }

      setResult(data);
    } catch (err: any) {
      console.error('Validation Error:', err);
      setError(err.message || 'Erro ao validar o código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-gradient-to-r from-[#112240] to-[#1e3a8a] px-8 py-10 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/20">
            <ShieldCheck className="h-8 w-8 text-blue-100" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">Auditoria e Validação</h2>
          <p className="text-blue-100/80 max-w-lg text-sm font-medium">
            Verifique a autenticidade de documentos gerados e assinados eletronicamente pela plataforma. Digite o código de rastreamento abaixo para consultar os logs.
          </p>

          <form onSubmit={handleValidate} className="w-full max-w-xl mt-8 relative">
            <div className="relative flex items-center">
              <div className="absolute left-4 text-gray-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Ex: 123e4567-e89b-12d3-a456-426614174000"
                className="w-full pl-12 pr-32 py-4 bg-white rounded-xl outline-none focus:ring-4 focus:ring-blue-500/30 text-gray-900 font-mono text-sm tracking-wider shadow-xl transition-all"
              />
              <button
                type="submit"
                disabled={loading || !trackingCode.trim()}
                className="absolute right-2 top-2 bottom-2 px-6 bg-[#0a192f] hover:bg-black text-white text-[11px] font-black uppercase tracking-widest rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? 'Buscando...' : 'Validar'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="p-8">
        {!result && !error && !loading && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800">Aguardando Código</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-2">
              Insira o código de rastreamento impresso no PDF para atestar sua veracidade legal no banco de dados.
            </p>
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-50 border-2 border-red-100 rounded-2xl flex items-start gap-4 animate-in slide-in-from-bottom-4">
            <div className="p-3 bg-red-100 shrink-0 rounded-xl">
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-red-900 tracking-tight">Validação Falhou</h3>
              <p className="text-red-700 mt-1 font-medium">{error}</p>
              <p className="text-xs text-red-500/80 mt-2 font-bold uppercase tracking-widest">Atenção: Este documento não consta como válido na base atual.</p>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-6 md:p-8 animate-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between mb-8 pb-8 border-b border-emerald-200/50">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/30 shrink-0">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-emerald-900 tracking-tight flex items-center gap-2">
                    Documento Autêntico
                    <span className="flex h-2 w-2 relative ml-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </h3>
                  <p className="text-emerald-700 font-medium">
                    Chancela verificada e certificada pelo Salomão Manager.
                  </p>
                </div>
              </div>
              <div className="bg-white/60 px-4 py-2 rounded-xl text-center md:text-right shadow-sm border border-emerald-100">
                <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-black mb-1">Cód. Rastreamento</p>
                <p className="font-mono text-xs text-emerald-900 font-bold">{result.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
               {/* Vertical Divider for Desktop */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-200/50 via-emerald-200 to-transparent"></div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-emerald-800 mb-1">
                    <FileText className="h-4 w-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Tipo de Documento</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900 border-l-2 border-emerald-500 pl-3 ml-2">
                    Solicitação de {result.tipo_solicitacao || 'Férias / Ausência'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-emerald-800 mb-1">
                    <User className="h-4 w-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Requerente / Integrante</p>
                  </div>
                  <p className="text-base font-bold text-gray-900 border-l-2 border-emerald-500 pl-3 ml-2">
                    {result.collaborator_name}
                  </p>
                </div>
                
                {result.periodos && result.periodos.length > 0 && (
                   <div>
                       <div className="flex items-center gap-2 text-emerald-800 mb-2">
                         <Clock className="h-4 w-4" />
                         <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Períodos Solicitados</p>
                       </div>
                       <div className="space-y-2 border-l-2 border-emerald-500 pl-3 ml-2">
                          {result.periodos.map((p: any, idx: number) => (
                              <div key={idx} className="bg-white/60 px-3 py-2 rounded-lg inline-block mr-2 text-sm font-bold text-gray-800 shadow-sm">
                                  {format(new Date(p.data_inicio), "dd/MM/yyyy", { locale: ptBR })} à {format(new Date(p.data_fim), "dd/MM/yyyy", { locale: ptBR })} <span className="text-gray-400 font-normal">({p.dias} dias)</span>
                              </div>
                          ))}
                       </div>
                   </div>
                )}
              </div>

              <div className="space-y-6 md:pl-6">
                 <div>
                  <div className="flex items-center gap-2 text-emerald-800 mb-1">
                    <CheckCircle className="h-4 w-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Situação do Documento</p>
                  </div>
                  <div className="border-l-2 border-emerald-500 pl-3 ml-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        result.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        result.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                      {result.status === 'approved' ? 'Aprovado Eletronicamente' : 
                       result.status === 'rejected' ? 'Rejeitado / Cancelado' : 
                       'Ainda Pendente'}
                    </span>
                  </div>
                </div>

                {result.leader_name && (
                    <div>
                      <div className="flex items-center gap-2 text-emerald-800 mb-1">
                        <ShieldCheck className="h-4 w-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Aprovador Autorizado</p>
                      </div>
                      <p className="text-base font-bold text-gray-900 border-l-2 border-emerald-500 pl-3 ml-2">
                        {result.leader_name}
                      </p>
                    </div>
                )}

                {(result.approved_at || result.updated_at) && (
                     <div>
                      <div className="flex items-center gap-2 text-emerald-800 mb-1">
                        <Clock className="h-4 w-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Data da Assinatura / Log</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900 border-l-2 border-emerald-500 pl-3 ml-2 text-emerald-700">
                        {format(new Date(result.approved_at || result.updated_at), "dd 'de' MMMM 'de' yyyy, 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-emerald-200/50 flex justify-center">
                 <p className="text-xs text-emerald-600/70 font-medium flex items-center gap-2">
                     <AlertCircle className="w-3 h-3" />
                     Os IPs, datas e tokens de sessão permanecem invioláveis em nosso banco de dados.
                 </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
