import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle2, User, ShieldCheck, Check, X } from 'lucide-react';

const isoToDisplayDate = (isoDate: string | undefined | null) => {
    if (!isoDate) return '-';
    if (isoDate.includes('/')) return isoDate;
    const cleanDate = isoDate.split('T')[0];
    const [y, m, d] = cleanDate.split('-');
    return `${d}/${m}/${y}`;
};

export default function AprovacaoFeriasPeloLider() {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [success, setSuccess] = useState<{ status: 'approved' | 'rejected' } | null>(null);

    const [collaborator, setCollaborator] = useState<any>(null);
    const [leader, setLeader] = useState<any>(null);
    const [vacationReq, setVacationReq] = useState<any>(null);

    const [observation, setObservation] = useState('');

    useEffect(() => {
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);

        const fetchRequestData = async () => {
            try {
                if (!token) {
                    setError('Link inválido ou ausente.');
                    setLoading(false);
                    return;
                }

                const { data, error: rpcError } = await supabase.rpc('get_vacation_request_by_leader_token', {
                    p_token: token
                });

                if (rpcError) throw rpcError;
                if (!data || !data.request) {
                    throw new Error('Solicitação não encontrada, já respondida ou link expirado (pode já ter sido aprovada).');
                }

                setCollaborator(data.collaborator);
                setLeader(data.leader);
                setVacationReq(data.request);

            } catch (err: any) {
                console.error('Erro ao buscar dados:', err);
                setError(err.message || 'Erro ao carregar os dados. A solicitação pode já ter sido processada.');
            } finally {
                setLoading(false);
            }
        };

        fetchRequestData();
    }, [token]);

    const handleAction = async (approve: boolean) => {
        try {
            if (!approve && !observation.trim()) {
                setFormError('Ao reprovar, é OBRIGATÓRIO preencher o motivo nas observações para que o integrante corrija.');
                return;
            }

            setSaving(true);
            setFormError(null);

            const { error: updateError } = await supabase.rpc('update_vacation_request_leader', {
                p_token: token,
                p_approve: approve,
                p_observation: observation
            });

            if (updateError) throw updateError;

            // Trigger Make.com Webhook
            try {
                await fetch('https://hook.us2.make.com/xklqclzckk2723dwejxueuy65ketmb4k', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: approve ? 'leader_approved' : 'leader_rejected',
                        request_id: vacationReq.id,
                        colaborador_nome: collaborator?.name,
                        colaborador_email: collaborator?.email_pessoal || collaborator?.email,
                        lider_nome: leader?.name,
                        observacao_lider: observation,
                        link_magico_integrante: `${window.location.origin}/solicitacao-ferias/${vacationReq.employee_token}`,
                        email_rh: 'rh@salomaoadv.com.br'
                    })
                });
            } catch(e) { console.error('Make webhook error', e); }

            setSuccess({ status: approve ? 'approved' : 'rejected' });
        } catch (err: any) {
            console.error('Erro ao salvar:', err);
            setFormError(err.message || 'Ocorreu um erro ao enviar sua decisão. Tente novamente mais tarde.');
        } finally {
            setSaving(false);
        }
    };

    const termType = (() => {
        const ct = collaborator?.contract_type?.toUpperCase() || '';
        if (ct === 'ESTAGIÁRIO' || ct.includes('ESTAGI')) return 'Recesso';
        if (ct.includes('ADVOGADO ASSOCIADO') || ct.includes('ADVOGADO') || ct === 'PJ') {
            return ct === 'PJ' ? 'Férias' : 'Descanso';
        }
        return 'Férias';
    })();

    const fullTermType = (() => {
        const ct = collaborator?.contract_type?.toUpperCase() || '';
        if (ct === 'ESTAGIÁRIO' || ct.includes('ESTAGI')) return 'Período de Recesso';
        if (ct.includes('ADVOGADO ASSOCIADO') || ct.includes('ADVOGADO') || ct === 'PJ') {
            return ct === 'PJ' ? 'Férias' : 'Período de Descanso';
        }
        return 'Férias';
    })();

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 text-[#1e3a8a] animate-spin mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-[#0a192f]">Carregando solicitação...</h2>
                </div>
            </div>
        );
    }

    if (error && !success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-gray-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-black text-[#0a192f] mb-2 tracking-tight">Acesso Indisponível</h2>
                    <p className="text-gray-500 mb-8">{error}</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-gray-100 animate-in zoom-in-50 duration-500">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${success.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {success.status === 'approved' ? <CheckCircle2 className="h-10 w-10" /> : <ShieldCheck className="h-10 w-10" />}
                    </div>
                    <h2 className="text-2xl font-black text-[#0a192f] mb-2 tracking-tight">Decisão Registrada!</h2>
                    <p className="text-gray-500 mb-8">
                        {success.status === 'approved' 
                            ? `A solicitação foi aprovada e já está agendada no histórico de ${termType.toLowerCase()} do integrante. O RH foi notificado.`
                            : `A solicitação foi devolvida ao integrante com as suas observações. Ele fará os ajustes e enviará novamente.`
                        }
                    </p>
                    <p className="text-xs text-gray-400">Você já pode fechar esta janela.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col items-center gap-5 mb-8 text-center">
                    <div className="shrink-0 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 w-full max-w-[200px] flex justify-center">
                        <img src="/logo-salomao.png" alt="Salomão" className="h-[55px] object-contain" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-[#0a192f] tracking-tight leading-none mb-2">Aprovação de {fullTermType}</h1>
                        <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">Ação solicitada para: <strong className="text-gray-900">{collaborator?.name}</strong></p>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden relative">

                    <div className="px-8 py-8 md:px-12 md:py-10 space-y-10">
                        {/* Resumo da Solicitação */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Dados da Solicitação</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Período Aquisitivo</p>
                                        <p className="text-sm font-medium text-gray-900 mt-0.5">
                                            {isoToDisplayDate(vacationReq?.aquisitive_period_start)} a {isoToDisplayDate(vacationReq?.aquisitive_period_end)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-[#1e3a8a] uppercase tracking-widest">Período de Gozo</p>
                                        <p className="text-base font-bold text-[#0a192f] mt-0.5">
                                            {isoToDisplayDate(vacationReq?.vacation_start)} até {isoToDisplayDate(vacationReq?.vacation_end)}
                                        </p>
                                        <p className="text-xs text-blue-600 font-bold mt-1">Total: {vacationReq?.vacation_days_count} dias</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-4 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Abono Pecuniário (Vendido)</p>
                                    {vacationReq?.sell_vacation ? (
                                        <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">
                                            Sim - {vacationReq.sell_vacation_days} dias
                                        </span>
                                    ) : (
                                        <span className="text-sm font-medium text-gray-500">Não optante</span>
                                    )}
                                </div>
                                
                                {vacationReq?.employee_observation && (
                                    <div className="pt-2">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Observações do Integrante</p>
                                        <p className="text-sm text-gray-700 bg-white p-3 rounded-xl border border-gray-200 italic">
                                            "{vacationReq.employee_observation}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Área de Resposta do Líder */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-black text-[#0a192f] border-b border-gray-100 pb-2">Decisão de Liderança</h3>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Suas Observações (Obrigatório caso devolva para ajustes)</label>
                                <textarea
                                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm min-h-[120px] outline-none focus:border-[#1e3a8a] resize-none"
                                    placeholder="Deixe uma mensagem caso precise sugerir outras datas, ou uma nota interna para o RH na aprovação..."
                                    value={observation}
                                    onChange={e => setObservation(e.target.value)}
                                />
                            </div>
                            {formError && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium animate-in fade-in">
                                    {formError}
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="px-8 py-6 md:px-12 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-3 sticky bottom-0 z-10">
                        <button
                            onClick={() => handleAction(false)}
                            disabled={saving}
                            className="bg-white border border-gray-300 text-gray-700 w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-black uppercase tracking-wider text-xs hover:bg-gray-100 disabled:opacity-70 transition-all shadow-sm active:scale-95"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                            Salvar e Enviar p/ Integrante (Ajuste)
                        </button>
                        <button
                            onClick={() => handleAction(true)}
                            disabled={saving}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#10b981] text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-wider text-xs hover:bg-[#059669] disabled:opacity-70 transition-all shadow-lg active:scale-95"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Aprovar {termType}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
