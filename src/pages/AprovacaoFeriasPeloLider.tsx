import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle2, User, ShieldCheck, Check, X, CalendarRange } from 'lucide-react';

const isoToDisplayDate = (isoDate: string | undefined | null) => {
    if (!isoDate) return '-';
    if (isoDate.includes('/')) return isoDate;
    const cleanDate = isoDate.split('T')[0];
    const [y, m, d] = cleanDate.split('-');
    return `${d}/${m}/${y}`;
};

interface ParsedPeriod {
    originalText: string;
    index: number;
    start: string;
    end: string;
    days: string;
    status: 'pending' | 'approved' | 'rejected';
}

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
    
    // Fragmented periods handling
    const [periods, setPeriods] = useState<ParsedPeriod[]>([]);
    const [pureObservation, setPureObservation] = useState('');

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

                // Parse the employee observation for fragmented periods
                const obs = data.request.employee_observation || '';
                const marker = '=== [Registro de Fragmentação de Férias] ===';
                
                if (obs.includes(marker)) {
                    const parsed: ParsedPeriod[] = [];
                    const regex = /> Período (\d+): (\d{2}\/\d{2}\/\d{4}) a (\d{2}\/\d{2}\/\d{4}) \((\d+) dias\)/g;
                    let match;
                    while ((match = regex.exec(obs)) !== null) {
                        parsed.push({
                            originalText: match[0],
                            index: parseInt(match[1], 10),
                            start: match[2],
                            end: match[3],
                            days: match[4],
                            status: 'pending'
                        });
                    }
                    setPeriods(parsed);

                    const extraMarker = 'Observações Extras do Integrante:\n';
                    const extraIndex = obs.indexOf(extraMarker);
                    if (extraIndex !== -1) {
                        setPureObservation(obs.substring(extraIndex + extraMarker.length).trim());
                    } else {
                        setPureObservation('');
                    }
                } else {
                    // Fallback for single period legacy entries or unfragmented
                    if (data.request.vacation_start && data.request.vacation_end) {
                        setPeriods([{
                            originalText: '',
                            index: 1,
                            start: isoToDisplayDate(data.request.vacation_start),
                            end: isoToDisplayDate(data.request.vacation_end),
                            days: String(data.request.vacation_days_count),
                            status: 'pending'
                        }]);
                    }
                    setPureObservation(obs);
                }

            } catch (err: any) {
                console.error('Erro ao buscar dados:', err);
                setError(err.message || 'Erro ao carregar os dados. A solicitação pode já ter sido processada.');
            } finally {
                setLoading(false);
            }
        };

        fetchRequestData();
    }, [token]);

    const handlePeriodStatus = (index: number, newStatus: 'approved' | 'rejected') => {
        const newPeriods = [...periods];
        newPeriods[index].status = newStatus;
        setPeriods(newPeriods);
        setFormError(null);
    };

    const handleAction = async (intendedActionApprove: boolean) => {
        try {
            if (periods.length > 0 && periods.some(p => p.status === 'pending')) {
                setFormError('Você precisa avaliar (aprovar ou recusar) TODOS os períodos solicitados antes de enviar.');
                return;
            }

            const hasRejection = periods.some(p => p.status === 'rejected');
            
            if (intendedActionApprove && hasRejection) {
                setFormError('Você não pode aprovar a solicitação geral pois reprovou ao menos um dos períodos marcados.');
                return;
            }

            // Se for devolver (intendedActionApprove = false) sem escrever motivo
            if (!intendedActionApprove && !observation.trim()) {
                setFormError('Ao solicitar ajustes para o integrante, é OBRIGATÓRIO preencher o motivo do ajuste nas suas observações.');
                return;
            }

            setSaving(true);
            setFormError(null);

            // Prepend which periods were approved/rejected to the leader observation
            let finalObservation = '';
            if (periods.length > 0 && hasRejection) {
                const evaluationText = periods.map(p => `• Período ${p.index}: ${p.status === 'approved' ? '✅ Aprovado' : '❌ REPROVADO'} (${p.start} a ${p.end})`).join('\n');
                finalObservation = `AVALIAÇÃO DE PERÍODOS:\n${evaluationText}\n\n${observation.trim() ? `OBSERVAÇÕES ADICIONAIS:\n${observation.trim()}` : ''}`;
            } else if (periods.length > 0) {
                // If everything is approved, we just format nicely
                const evaluationText = periods.map(p => `• Período ${p.index}: ✅ Aprovado (${p.start} a ${p.end})`).join('\n');
                finalObservation = `AVALIAÇÃO DE PERÍODOS:\n${evaluationText}\n\n${observation.trim() ? `OBSERVAÇÕES ADICIONAIS:\n${observation.trim()}` : ''}`;
            } else {
                finalObservation = observation.trim();
            }

            const { error: updateError } = await supabase.rpc('update_vacation_request_leader', {
                p_token: token,
                p_approve: intendedActionApprove,
                p_observation: finalObservation
            });

            if (updateError) throw updateError;

            // Trigger Make.com Webhook
            try {
                await fetch('https://hook.us2.make.com/xklqclzckk2723dwejxueuy65ketmb4k', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: intendedActionApprove ? 'leader_approved' : 'leader_rejected',
                        request_id: vacationReq.id,
                        colaborador_nome: collaborator?.name,
                        colaborador_email: collaborator?.email_pessoal || collaborator?.email,
                        lider_nome: leader?.name,
                        observacao_lider: finalObservation,
                        link_magico_integrante: `${window.location.origin}/solicitacao-ferias/${vacationReq.employee_token}`,
                        email_rh: 'rh@salomaoadv.com.br'
                    })
                });
            } catch(e) { console.error('Make webhook error', e); }

            setSuccess({ status: intendedActionApprove ? 'approved' : 'rejected' });
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
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${success.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {success.status === 'approved' ? <CheckCircle2 className="h-10 w-10" /> : <ShieldCheck className="h-10 w-10" />}
                    </div>
                    <h2 className="text-2xl font-black text-[#0a192f] mb-2 tracking-tight">Decisão Registrada!</h2>
                    <p className="text-gray-500 mb-8">
                        {success.status === 'approved' 
                            ? `A solicitação de ${termType.toLowerCase()} foi assinada digitalmente, os períodos foram aprovados e processados com sucesso. O RH foi notificado.`
                            : `A solicitação foi devolvida ao integrante solicitando ajustes das datas informadas. Ele fará os reparos e submeterá novamente.`
                        }
                    </p>
                    <p className="text-xs text-gray-400">Você já pode fechar esta janela.</p>
                </div>
            </div>
        );
    }

    const hasRejection = periods.some(p => p.status === 'rejected');
    const allDecided = periods.length > 0 && periods.every(p => p.status !== 'pending');

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto w-full">
                <div className="flex flex-col items-center gap-5 mb-8 text-center">
                    <div className="shrink-0 w-full max-w-[280px] flex justify-center">
                        <img src="/logo-salomao.png" alt="Salomão" className="h-[95px] object-contain bg-transparent" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-[#0a192f] tracking-tight leading-none mb-2">Aprovação de {fullTermType}</h1>
                        <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">Ação solicitada para: <strong className="text-gray-900 font-bold">{collaborator?.name}</strong></p>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden relative">

                    <div className="px-8 py-8 md:px-12 md:py-10 space-y-10">
                        {/* Identificação */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-black text-[#0a192f] border-b border-gray-100 pb-2">Identificação do Integrante</h3>
                            <div className="flex flex-col sm:flex-row flex-wrap gap-6 items-start">
                                <div className="flex-1 w-full min-w-[250px] max-w-[450px]">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Colaborador</label>
                                    <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-700 break-words flex flex-wrap gap-2 items-center">
                                        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded font-black shrink-0">{collaborator?.matricula_interna || 'S/N'}</span>
                                        <span className="font-bold text-[#0a192f]">{collaborator?.name || '-'}</span>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-[150px] max-w-[250px]">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">CPF / Matrícula</label>
                                    <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-700">
                                        {collaborator?.cpf || '-'}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Período Aquisitivo */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-black text-[#0a192f] border-b border-gray-100 pb-2">Período Aquisitivo</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50">
                                <div>
                                    <label className="block text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-2 ml-1">Início do Período</label>
                                    <div className="w-full bg-white border border-blue-200 rounded-xl p-3 text-sm font-bold text-[#0a192f] flex items-center gap-2">
                                        <CalendarRange className="h-4 w-4 text-blue-400" />
                                        {isoToDisplayDate(vacationReq?.aquisitive_period_start)}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-2 ml-1">Fim do Período</label>
                                    <div className="w-full bg-white border border-blue-200 rounded-xl p-3 text-sm font-bold text-[#0a192f] flex items-center gap-2">
                                        <CalendarRange className="h-4 w-4 text-blue-400" />
                                        {isoToDisplayDate(vacationReq?.aquisitive_period_end)}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Avaliação de Períodos de Gozo */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-black text-[#0a192f] border-b border-gray-100 pb-2">Avaliação de Gozo de {termType}</h3>
                            <p className="text-sm text-gray-500 ml-1 mb-2">Analise as datas informadas pelo integrante. Escolha Aprovar ou Recusar para <strong className="font-bold">cada período individualmente</strong>.</p>
                            
                            <div className="space-y-4">
                                {periods.map((period, index) => (
                                    <div key={index} className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 shadow-[0_2px_8px_rgb(0,0,0,0.04)] p-4 pt-5 rounded-2xl relative transition-all duration-300 ${
                                        period.status === 'approved' ? 'bg-emerald-50/50 border border-emerald-200 ring-2 ring-emerald-50' : 
                                        period.status === 'rejected' ? 'bg-red-50/50 border border-red-200 ring-2 ring-red-50' : 
                                        'bg-white border border-gray-200'
                                    }`}>
                                        <div className={`absolute -top-3 left-4 text-white text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-widest shadow-sm transition-colors ${period.status === 'approved' ? 'bg-emerald-500' : period.status === 'rejected' ? 'bg-red-500' : 'bg-[#1e3a8a]'}`}>
                                            Período {period.index}
                                        </div>
                                        
                                        <div className="col-span-1 lg:col-span-3 flex flex-col sm:flex-row gap-4 pt-2">
                                            <div className="flex-1 min-w-0">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">Data de Início</label>
                                                <div className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#0a192f]">{period.start}</div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">Data de Término</label>
                                                <div className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#0a192f]">{period.end}</div>
                                            </div>
                                            <div className="flex-1 sm:max-w-[100px] min-w-0">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate text-center sm:text-left">Dias</label>
                                                <div className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-black text-gray-600 text-center">{period.days}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="col-span-1 lg:col-span-2 flex items-center justify-end gap-2 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-4 mt-2 lg:mt-0">
                                            <button 
                                                onClick={() => handlePeriodStatus(index, 'approved')}
                                                className={`flex-1 flex flex-col items-center justify-center gap-1.5 h-full min-h-[50px] px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period.status === 'approved' ? 'bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] scale-[1.02]' : 'bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 border border-gray-200'}`}
                                            >
                                                <Check className={`w-5 h-5 ${period.status === 'approved' ? 'text-white' : 'text-emerald-500'}`} /> Aprovar
                                            </button>
                                            <button 
                                                onClick={() => handlePeriodStatus(index, 'rejected')}
                                                className={`flex-1 flex flex-col items-center justify-center gap-1.5 h-full min-h-[50px] px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period.status === 'rejected' ? 'bg-red-500 text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)] scale-[1.02]' : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 border border-gray-200'}`}
                                            >
                                                <X className={`w-5 h-5 ${period.status === 'rejected' ? 'text-white' : 'text-red-500'}`} /> Recusar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Abono Pecuniário e Observações */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Abono Pecuniário (Vendido)</p>
                                {vacationReq?.sell_vacation ? (
                                    <div className="inline-flex items-center gap-2 px-4 py-3 bg-amber-100 text-amber-800 rounded-xl border border-amber-200 font-bold text-sm">
                                        <span>Requisitou venda de {vacationReq.sell_vacation_days} dias</span>
                                    </div>
                                ) : (
                                    <div className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-500">
                                        Não optante
                                    </div>
                                )}
                            </div>
                            
                            <div className="border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6 w-full">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Observações Prévias do Integrante</p>
                                {pureObservation ? (
                                    <p className="text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-200 italic shadow-sm w-full break-words">
                                        "{pureObservation}"
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-400 font-medium ml-1">Nenhuma observação enviada.</p>
                                )}
                            </div>
                        </div>

                        {/* Área de Resposta do Líder */}
                        <section className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest ml-1">Mensagem p/ o Integrante (Obrigatório caso recuse algum período)</label>
                                <textarea
                                    className={`w-full bg-white border ${hasRejection && !observation.trim() ? 'border-amber-400 ring-2 ring-amber-50' : 'border-gray-200'} rounded-xl p-4 text-sm min-h-[120px] outline-none focus:border-[#1e3a8a] resize-none transition-all`}
                                    placeholder={hasRejection ? "Você recusou um ou mais períodos. Por favor, detalhe aqui os motivos ou sugira novas datas..." : "Deixe uma mensagem para o integrante ou uma nota interna para o RH na aprovação..."}
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

                    <div className="px-8 py-6 md:px-12 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-3 sticky bottom-0 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                        {!allDecided ? (
                            <div className="w-full text-center text-sm font-bold text-amber-600 py-2">
                                Aguardando avaliação de datas acima...
                            </div>
                        ) : (
                            <>
                                {hasRejection ? (
                                    <button
                                        onClick={() => handleAction(false)}
                                        disabled={saving}
                                        className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-wider text-xs hover:bg-amber-600 disabled:opacity-70 transition-all shadow-lg active:scale-95"
                                    >
                                        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />}
                                        Devolver p/ Integrante (Ajustar Datas)
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleAction(false)}
                                            disabled={saving}
                                            className="bg-white border border-gray-300 text-gray-700 w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-black uppercase tracking-wider text-xs hover:bg-gray-100 disabled:opacity-70 transition-all shadow-sm active:scale-95"
                                        >
                                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                            Pedir Outros Ajustes
                                        </button>
                                        <button
                                            onClick={() => handleAction(true)}
                                            disabled={saving}
                                            className="w-full lg:w-auto flex items-center justify-center gap-2 bg-[#10b981] text-white px-10 py-4 rounded-xl font-black uppercase tracking-wider text-xs hover:bg-[#059669] disabled:opacity-70 transition-all shadow-[0_4px_16px_rgba(16,185,129,0.3)] active:scale-95"
                                        >
                                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                                            Aprovar Férias e Notificar
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
