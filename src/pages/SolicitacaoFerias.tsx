import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle2, User, Save, CalendarRange, Info } from 'lucide-react';
import { Collaborator } from '../types/controladoria';

const maskDate = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 10);

const isValidDateDDMMYYYY = (val: string | undefined | null) => {
    if (!val || val.length !== 10) return false;
    const [d, m, y] = val.split('/');
    const day = parseInt(d, 10);
    const month = parseInt(m, 10);
    const year = parseInt(y, 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (month < 1 || month > 12) return false;
    const dateObj = new Date(year, month - 1, day);
    return dateObj.getDate() === day && dateObj.getMonth() === month - 1 && dateObj.getFullYear() === year;
};

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
    const rawToken = useParams<{ token: string }>().token;
    // Extract genuine UUID if a textual slug was prefixed
    const uuidMatch = rawToken?.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
    const token = uuidMatch ? uuidMatch[0] : rawToken;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [collaborator, setCollaborator] = useState<Partial<Collaborator> | null>(null);
    const [vacationReq, setVacationReq] = useState<any>(null);

    // Form fields
    const [aquiStart, setAquiStart] = useState('');
    const [aquiEnd, setAquiEnd] = useState('');
    
    // Multiple Periods Support (up to 3)
    const [periods, setPeriods] = useState<{ start: string; end: string }[]>([{ start: '', end: '' }]);

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
                
                // Note: Prefill for periods is challenging since we aggregate them into observation to keep standard columns,
                // but we will prefill the main ones on the first period anyway if available
                if (data.request.vacation_start || data.request.vacation_end) {
                    setPeriods([{
                        start: isoToDisplayDate(data.request.vacation_start) || '',
                        end: isoToDisplayDate(data.request.vacation_end) || ''
                    }]);
                }

                if (data.request.sell_vacation) setSellVacation(data.request.sell_vacation);
                if (data.request.sell_vacation_days) setSellVacationDays(String(data.request.sell_vacation_days));
                
                let obsText = data.request.employee_observation || '';
                const extraMarker = 'Observações Extras do Integrante:\n';
                const markerIndex = obsText.lastIndexOf(extraMarker);
                
                if (markerIndex !== -1) {
                    setObservation(obsText.substring(markerIndex + extraMarker.length).trim());
                } else if (obsText.includes('=== [Registro de Fragmentação de Férias] ===')) {
                    const endMarker = '============================================\n';
                    const endIndex = obsText.lastIndexOf(endMarker);
                    if (endIndex !== -1) {
                        const possibleObs = obsText.substring(endIndex + endMarker.length).trim();
                        setObservation(possibleObs.replace(/^=+\s*/g, ''));
                    } else {
                        setObservation('');
                    }
                } else {
                    setObservation(obsText);
                }

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
            // Validation
            if (!aquiStart || !aquiEnd) {
                setFormError('Preencha o Período aquisitivo.');
                return;
            }
            if (!isValidDateDDMMYYYY(aquiStart) || !isValidDateDDMMYYYY(aquiEnd)) {
                setFormError('Verifique o Período Aquisitivo: a data informada não existe no calendário (Verifique se trocou o dia pelo mês). E use o padrão DD/MM/AAAA.');
                return;
            }

            let totalDaysCount = 0;
            let firstStartDate: Date | null = null;
            let lastEndDate: Date | null = null;
            let firstIsoStart = '';
            let lastIsoEnd = '';
            let periodsText = '=== [Registro de Fragmentação de Férias] ===\n';

            for (let i = 0; i < periods.length; i++) {
                const p = periods[i];
                if (!p.start || !p.end) {
                    setFormError(`Preencha as datas de início e fim do Período ${i + 1} do Gozo de Férias.`);
                    return;
                }
                if (!isValidDateDDMMYYYY(p.start) || !isValidDateDDMMYYYY(p.end)) {
                    setFormError(`O Período ${i + 1} de gozo contém uma data que não existe no calendário (ex: mês acima de 12). Revise seguindo o padrão DD/MM/AAAA.`);
                    return;
                }
                const isoStart = unmaskDateToISO(p.start);
                const isoEnd = unmaskDateToISO(p.end);
                if (!isoStart || !isoEnd) {
                    setFormError(`Datas do Período ${i + 1} inválidas.`);
                    return;
                }

                const d1 = new Date(isoStart + 'T00:00:00');
                const d2 = new Date(isoEnd + 'T00:00:00');
                if (d2 < d1) {
                    setFormError(`A data de fim do Período ${i + 1} não pode ser menor que a data de início.`);
                    return;
                }

                const dias = calculateDays(p.start, p.end);
                totalDaysCount += dias;
                periodsText += `> Período ${i + 1}: ${p.start} a ${p.end} (${dias} dias)\n`;

                if (!firstStartDate || d1 < firstStartDate) {
                    firstStartDate = d1;
                    firstIsoStart = isoStart;
                }
                if (!lastEndDate || d2 > lastEndDate) {
                    lastEndDate = d2;
                    lastIsoEnd = isoEnd;
                }
            }
            periodsText += `> Total Fracionado: ${totalDaysCount} dias\n============================================\n`;

            if (sellVacation && (!sellVacationDays || parseInt(sellVacationDays) <= 0)) {
                setFormError('Informe a quantidade de dias válidos para o abono pecuniário.');
                return;
            }
            if (!accepted) {
                setFormError('Você deve confirmar a veracidade das informações na caixa de seleção (Assinatura Digital).');
                return;
            }

            const isoAquiStart = unmaskDateToISO(aquiStart);
            const isoAquiEnd = unmaskDateToISO(aquiEnd);

            const finalObservation = observation.trim().length > 0 
                ? `${periodsText}\nObservações Extras do Integrante:\n${observation}`
                : periodsText;

            setSaving(true);
            setFormError(null);

            // First update the aquisitive period on the request directly
            await supabase.from('vacation_requests').update({
                aquisitive_period_start: isoAquiStart,
                aquisitive_period_end: isoAquiEnd
            }).eq('id', vacationReq.id);

            // Then call RPC to update and progress status to pending_leader
            const { error: updateError } = await supabase.rpc('update_vacation_request_employee', {
                p_token: token,
                p_vacation_start: firstIsoStart,
                p_vacation_end: lastIsoEnd,
                p_vacation_days_count: totalDaysCount,
                p_sell_vacation: sellVacation,
                p_sell_vacation_days: sellVacation ? parseInt(sellVacationDays) : null,
                p_observation: finalObservation
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
            setFormError(err.message || 'Ocorreu um erro ao enviar sua solicitação. Tente novamente mais tarde.');
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

    // Calculate total days aggregated across all periods
    const calculatedDaysTotal = periods.reduce((acc, p) => acc + calculateDays(p.start, p.end), 0);

    const handleAddPeriod = () => {
        if (periods.length < 3) setPeriods([...periods, { start: '', end: '' }]);
    };

    const handleRemovePeriod = (indexToRemove: number) => {
        setPeriods(periods.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto w-full">
                <div className="flex flex-col items-center gap-5 mb-8 text-center">
                    <div className="shrink-0 w-full max-w-[280px] flex justify-center">
                        <img src="/logo-salomao.png" alt="Salomão" className="h-[95px] object-contain bg-transparent" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-[#0a192f] tracking-tight leading-none mb-2">Solicitação de {fullTermType}</h1>
                        <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">Preencha os períodos desejados para aprovação pela sua liderança.</p>
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

                        {/* Gozo de Férias com Múltiplos Períodos */}
                        <section className="space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 pb-2 gap-3">
                                <h3 className="text-lg font-black text-[#0a192f]">Gozo de {termType}</h3>
                                {periods.length < 3 && (
                                    <button 
                                        onClick={handleAddPeriod}
                                        className="text-[10px] bg-[#1e3a8a] text-white hover:bg-[#112240] px-4 py-1.5 rounded-lg flex items-center gap-1.5 font-bold uppercase transition-all shadow-sm active:scale-95"
                                    >
                                        <span>+ Adicionar Período</span>
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {periods.map((period, index) => {
                                    const cDays = calculateDays(period.start, period.end);
                                    return (
                                        <div key={index} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 bg-white border border-gray-100 shadow-[0_2px_8px_rgb(0,0,0,0.04)] p-4 rounded-2xl relative animate-in slide-in-from-bottom-2 mt-4 md:mt-0">
                                            <div className="absolute -top-3 left-4 bg-[#1e3a8a] text-white text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                                                Período {index + 1}
                                            </div>

                                            {periods.length > 1 && (
                                                <button
                                                    onClick={() => handleRemovePeriod(index)}
                                                    title={`Remover Período ${index + 1}`}
                                                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1.5 hover:bg-red-600 hover:text-white transition-all shadow border-2 border-white"
                                                >
                                                    <span className="block w-2.5 h-[2px] bg-current rounded-full" />
                                                </button>
                                            )}
                                            
                                            <div className="col-span-1 md:col-span-2 flex flex-col md:flex-row gap-4 md:gap-6 pt-2 md:pt-0">
                                                <div className="flex-1 min-w-0">
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 truncate">Data de Início</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#1e3a8a]"
                                                        value={period.start}
                                                        onChange={e => {
                                                            const newPeriods = [...periods];
                                                            newPeriods[index].start = maskDate(e.target.value);
                                                            setPeriods(newPeriods);
                                                        }}
                                                        placeholder="DD/MM/AAAA"
                                                        maxLength={10}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 truncate">Data de Término</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#1e3a8a]"
                                                        value={period.end}
                                                        onChange={e => {
                                                            const newPeriods = [...periods];
                                                            newPeriods[index].end = maskDate(e.target.value);
                                                            setPeriods(newPeriods);
                                                        }}
                                                        placeholder="DD/MM/AAAA"
                                                        maxLength={10}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0 pt-2 md:pt-0">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 text-center sm:text-left truncate">Total de Dias</label>
                                                <div className="w-full bg-gray-100 border border-gray-200 rounded-xl p-3 text-sm font-black text-gray-600 text-center">
                                                    {cDays > 0 ? `${cDays} dias` : '-'}
                                                </div>
                                            </div>
                                            
                                            {/* Show Aggregate Total only on the first row's column equivalent to save space, or global row */}
                                            {index === 0 && (
                                                <div className="flex-1 border-l border-gray-200 pl-4 hidden md:block">
                                                    <label className="block text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-2 text-center">Total Resgatado</label>
                                                    <div className="w-full bg-blue-50 border border-blue-200 rounded-xl p-3 text-lg leading-none font-black text-[#1e3a8a] text-center flex items-center justify-center h-[46px] shadow-inner">
                                                        {calculatedDaysTotal > 0 ? `${calculatedDaysTotal}` : '0'} d
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                
                                {/* Mobile view total days summary block since it stays hidden in rows after 1 or on small screens */}
                                <div className="md:hidden flex items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-inner mt-4">
                                    <span className="text-xs font-black text-[#1e3a8a] uppercase tracking-widest">Total Geral Solicitado:</span>
                                    <span className="text-lg leading-none font-black text-[#1e3a8a]">{calculatedDaysTotal > 0 ? `${calculatedDaysTotal}` : '0'} d</span>
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

                        {formError && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium animate-in fade-in">
                                {formError}
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

                <div className="mt-8 text-center px-4 w-full">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                        Formulário protegido gerado de forma segura através do <span className="text-[#1e3a8a]">Salomão Manager</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
