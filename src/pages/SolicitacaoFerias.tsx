import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle2, User, Save, ShieldCheck, CalendarRange, Info } from 'lucide-react';
import { Collaborator } from '../types/controladoria';

const maskDate = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 10);

const unmaskDateToISO = (displayDate: string | undefined | null) => {
    if (!displayDate) return null;
    if (displayDate.includes('-')) return displayDate;
    if (displayDate.length !== 10) return null;
    const [d, m, y] = displayDate.split('/');
    return `${y}-${m}-${d}`;
};

const isoToDisplayDate = (isoDate: string | undefined | null) => {
    if (!isoDate) return '';
    if (isoDate.includes('/')) return isoDate;
    const cleanDate = isoDate.split('T')[0];
    const [y, m, d] = cleanDate.split('-');
    return `${d}/${m}/${y}`;
};

const calculateDays = (start: string, end: string) => {
    if (start.length !== 10 || end.length !== 10) return 0;
    const isoStart = unmaskDateToISO(start);
    const isoEnd = unmaskDateToISO(end);
    if (!isoStart || !isoEnd) return 0;
    
    const date1 = new Date(isoStart + 'T00:00:00');
    const date2 = new Date(isoEnd + 'T00:00:00');
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return 0;
    const diffTime = date2.getTime() - date1.getTime();
    if (diffTime < 0) return 0;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
};

export default function SolicitacaoFerias() {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [collaborator, setCollaborator] = useState<Partial<Collaborator> | null>(null);
    const [vacationReq, setVacationReq] = useState<any>(null);

    // Form fields
    const [aquiStart, setAquiStart] = useState('');
    const [aquiEnd, setAquiEnd] = useState('');
    const [vacationStart, setVacationStart] = useState('');
    const [vacationEnd, setVacationEnd] = useState('');
    const [sellVacation, setSellVacation] = useState(false);
    const [sellVacationDays, setSellVacationDays] = useState('');
    const [observation, setObservation] = useState('');
    const [accepted, setAccepted] = useState(false);

    useEffect(() => {
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);

        const fetchRequestData = async () => {
            try {
                if (!token) {
                    setError('Link inválido ou ausente.');
                    setLoading(false);
                    return;
                }

                const { data, error: rpcError } = await supabase.rpc('get_vacation_request_by_employee_token', {
                    p_token: token
                });

                if (rpcError) throw rpcError;
                if (!data || !data.request) {
                    throw new Error('Solicitação não encontrada, já respondida ou link expirado.');
                }

                setCollaborator(data.collaborator);
                setVacationReq(data.request);

                // Pre-fill if already set
                if (data.request.aquisitive_period_start) setAquiStart(isoToDisplayDate(data.request.aquisitive_period_start));
                if (data.request.aquisitive_period_end) setAquiEnd(isoToDisplayDate(data.request.aquisitive_period_end));
                if (data.request.vacation_start) setVacationStart(isoToDisplayDate(data.request.vacation_start));
                if (data.request.vacation_end) setVacationEnd(isoToDisplayDate(data.request.vacation_end));
                if (data.request.sell_vacation) setSellVacation(data.request.sell_vacation);
                if (data.request.sell_vacation_days) setSellVacationDays(String(data.request.sell_vacation_days));
                if (data.request.employee_observation) setObservation(data.request.employee_observation);

            } catch (err: any) {
                console.error('Erro ao buscar dados:', err);
                setError(err.message || 'Erro ao carregar os dados desta solicitação.');
            } finally {
                setLoading(false);
            }
        };

        fetchRequestData();
    }, [token]);

    const handleSave = async () => {
        try {
            if (!aquiStart || !aquiEnd || !vacationStart || !vacationEnd) {
                setError('Preencha todas as datas (Período aquisitivo e Gozo).');
                return;
            }
            if (aquiStart.length !== 10 || aquiEnd.length !== 10 || vacationStart.length !== 10 || vacationEnd.length !== 10) {
                setError('Preencha as datas no formato correto (DD/MM/AAAA).');
                return;
            }
            if (sellVacation && (!sellVacationDays || parseInt(sellVacationDays) <= 0)) {
                setError('Informe a quantidade de dias para o abono pecuniário.');
                return;
            }
            if (!accepted) {
                setError('Você deve confirmar a veracidade das informações com a sua assinatura digital (caixa de seleção).');
                return;
            }

            const isoAquiStart = unmaskDateToISO(aquiStart);
            const isoAquiEnd = unmaskDateToISO(aquiEnd);
            const isoVacStart = unmaskDateToISO(vacationStart);
            const isoVacEnd = unmaskDateToISO(vacationEnd);

            // Calculate vacation_days_count automatically
            const daysCount = calculateDays(vacationStart, vacationEnd);

            setSaving(true);
            setError(null);

            // First update the aquisitive period on the request directly
            await supabase.from('vacation_requests').update({
                aquisitive_period_start: isoAquiStart,
                aquisitive_period_end: isoAquiEnd
            }).eq('id', vacationReq.id);

            // Then call RPC to update and progress status to pending_leader
            const { error: updateError } = await supabase.rpc('update_vacation_request_employee', {
                p_token: token,
                p_vacation_start: isoVacStart,
                p_vacation_end: isoVacEnd,
                p_vacation_days_count: daysCount,
                p_sell_vacation: sellVacation,
                p_sell_vacation_days: sellVacation ? parseInt(sellVacationDays) : null,
                p_observation: observation
            });

            if (updateError) throw updateError;

            // Trigger Make.com Webhook
            try {
                await fetch('https://hook.us2.make.com/xklqclzckk2723dwejxueuy65ketmb4k', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: 'employee_submitted',
                        request_id: vacationReq.id,
                        colaborador_nome: collaborator?.name,
                        lider_id: vacationReq.leader_id,
                        link_magico_lider: `${window.location.origin}/aprovacao-ferias/${vacationReq.leader_token}`,
                        email_rh: 'rh@salomaoadv.com.br'
                    })
                });
            } catch(e) { console.error('Make webhook error', e); }

            setSuccess(true);
        } catch (err: any) {
            console.error('Erro ao salvar:', err);
            setError(err.message || 'Ocorreu um erro ao enviar sua solicitação. Tente novamente mais tarde.');
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
                    <h2 className="text-lg font-bold text-[#0a192f]">Carregando o formulário...</h2>
                    <p className="text-sm text-gray-500 mt-2">Por favor, aguarde um momento.</p>
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
                    <h2 className="text-2xl font-black text-[#0a192f] mb-2 tracking-tight">Formulário Indisponível</h2>
                    <p className="text-gray-500 mb-8">{error}</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-gray-100 animate-in zoom-in-50 duration-500">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-black text-[#0a192f] mb-2 tracking-tight">Formulário Enviado!</h2>
                    <p className="text-gray-500 mb-8">Sua solicitação de {termType.toLowerCase()} foi enviada com sucesso ao seu Líder Direto. Você receberá uma notificação quando for aprovada ou caso precisem de ajustes.</p>
                    <p className="text-xs text-gray-400">Você já pode fechar esta janela.</p>
                </div>
            </div>
        );
    }

    const calculatedDays = calculateDays(vacationStart, vacationEnd);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col items-center gap-5 mb-8 text-center">
                    <div className="shrink-0 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 w-full max-w-[200px] flex justify-center">
                        <img src="/logo-salomao.png" alt="Salomão" className="h-[55px] object-contain" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-[#0a192f] tracking-tight leading-none mb-2">Solicitação de {fullTermType}</h1>
                        <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">Preencha os períodos desejados para aprovação da sua liderança.</p>
                    </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 shadow-sm rounded-2xl p-4 sm:p-5 flex items-start gap-4 mb-8 transition-transform duration-300 max-w-2xl mx-auto">
                    <div className="bg-emerald-100 p-2.5 rounded-full text-emerald-600 shrink-0 shadow-inner">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="pt-0.5">
                        <h3 className="text-emerald-900 font-bold text-sm mb-1">Processo Integrado (RH)</h3>
                        <p className="text-emerald-700/90 text-xs sm:text-sm leading-relaxed">
                            Ao finalizar, os dados serão enviados para seu líder e farão parte de seu histórico gerencial oficial.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden relative">

                    <div className="px-8 py-8 md:px-12 md:py-10 space-y-10">
                        
                        {/* Identificação */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-black text-[#0a192f] border-b border-gray-100 pb-2">Identificação do Integrante</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
                                    <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-700">
                                        {collaborator?.name || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Cargo / Função</label>
                                    <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-700">
                                        {collaborator?.role || collaborator?.contract_type || '-'}
                                    </div>
                                </div>
                                <div>
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
                                    <div className="relative">
                                        <CalendarRange className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                                        <input
                                            type="text"
                                            className="w-full bg-white border border-blue-200 rounded-xl p-3 pl-10 text-sm outline-none focus:border-[#1e3a8a]"
                                            value={aquiStart}
                                            onChange={e => setAquiStart(maskDate(e.target.value))}
                                            placeholder="DD/MM/AAAA"
                                            maxLength={10}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-2 ml-1">Fim do Período</label>
                                    <div className="relative">
                                        <CalendarRange className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                                        <input
                                            type="text"
                                            className="w-full bg-white border border-blue-200 rounded-xl p-3 pl-10 text-sm outline-none focus:border-[#1e3a8a]"
                                            value={aquiEnd}
                                            onChange={e => setAquiEnd(maskDate(e.target.value))}
                                            placeholder="DD/MM/AAAA"
                                            maxLength={10}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Gozo de Férias */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-black text-[#0a192f] border-b border-gray-100 pb-2">Gozo de {termType}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Data de Início</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#1e3a8a]"
                                        value={vacationStart}
                                        onChange={e => setVacationStart(maskDate(e.target.value))}
                                        placeholder="DD/MM/AAAA"
                                        maxLength={10}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Data de Término</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#1e3a8a]"
                                        value={vacationEnd}
                                        onChange={e => setVacationEnd(maskDate(e.target.value))}
                                        placeholder="DD/MM/AAAA"
                                        maxLength={10}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Total de Dias</label>
                                    <div className="w-full bg-gray-100 border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-500 text-center">
                                        {calculatedDays > 0 ? `${calculatedDays} dias` : '-'}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Abono Pecuniário - Only logical for CLT theoretically, but left available for all to be safe depending on HR usage */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-black text-[#0a192f] border-b border-gray-100 pb-2">Abono Pecuniário (Venda de 1/3)</h3>
                            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                                <div className="flex gap-4 p-1 bg-gray-100 rounded-xl shrink-0">
                                    <button
                                        onClick={() => setSellVacation(true)}
                                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${sellVacation ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Sim
                                    </button>
                                    <button
                                        onClick={() => { setSellVacation(false); setSellVacationDays(''); }}
                                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${!sellVacation ? 'bg-white text-[#1e3a8a] shadow-md border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Não
                                    </button>
                                </div>

                                {sellVacation && (
                                    <div className="animate-in fade-in slide-in-from-left-4 duration-300 w-full sm:w-48">
                                        <label className="block text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-2 ml-1">Quantidade de Dias</label>
                                        <input
                                            type="number"
                                            className="w-full bg-blue-50/50 border border-blue-200 rounded-xl p-3 text-sm outline-none focus:border-[#1e3a8a]"
                                            value={sellVacationDays}
                                            onChange={e => setSellVacationDays(e.target.value)}
                                            placeholder="Ex: 10"
                                            min="1"
                                        />
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-lg font-black text-[#0a192f] border-b border-gray-100 pb-2">Observações (Opcional)</h3>
                            <textarea
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm min-h-[100px] outline-none focus:border-[#1e3a8a] resize-none"
                                placeholder="Algum detalhe ou recado para a liderança analisar junto à sua solicitação?"
                                value={observation}
                                onChange={e => setObservation(e.target.value)}
                            />
                        </section>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium animate-in fade-in">
                                {error}
                            </div>
                        )}

                        {/* Assinatura / Aceite */}
                        <div className="bg-gray-100 p-6 rounded-2xl flex items-start gap-4 mt-8 w-full border border-gray-200 cursor-pointer hover:bg-gray-200/50 transition-colors"
                             onClick={() => setAccepted(!accepted)}>
                            <div className="pt-0.5">
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 accent-[#1e3a8a] cursor-pointer" 
                                    checked={accepted}
                                    onChange={(e) => setAccepted(e.target.checked)}
                                />
                            </div>
                            <div className="">
                                <h4 className="text-sm font-bold text-[#0a192f] mb-1">Assinatura Digital</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Confirmo que as datas informadas acima foram devidamente alinhadas e representam minha solicitação oficial de gozo de {termType.toLowerCase()}. Estou ciente das políticas internas aplicáveis.
                                </p>
                            </div>
                        </div>

                    </div>

                    <div className="px-8 py-6 md:px-12 bg-gray-50 border-t border-gray-100 flex items-center justify-between sticky bottom-0 z-10">
                        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 font-medium">
                            <Info className="w-4 h-4" /> Validado no envio
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1e3a8a] text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-wider text-xs hover:bg-[#112240] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                        >
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            {saving ? 'Enviando...' : 'Salvar e Enviar ao Líder'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
