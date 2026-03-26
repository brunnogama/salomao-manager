import { useState, useEffect } from 'react'
import { Clock, Save, Loader2, Calendar as CalendarIcon, FilePlus2, Stethoscope, Trash2, Send } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Collaborator } from '../../../types/controladoria'

interface PeriodoAusenciasSectionProps {
    formData: Partial<Collaborator>
    maskDate: (v: string) => string
    isViewMode?: boolean
}

export function PeriodoAusenciasSection({ formData, maskDate, isViewMode = false }: PeriodoAusenciasSectionProps) {
    const [activeTab, setActiveTab] = useState<'historico_ferias' | 'registrar' | 'historico_atestados'>('historico_ferias')
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)
    const [absences, setAbsences] = useState<any[]>([])

    const [absenceStart, setAbsenceStart] = useState('')
    const [absenceEnd, setAbsenceEnd] = useState('')
    const [absenceObs, setAbsenceObs] = useState('')
    const [absenceSubtype, setAbsenceSubtype] = useState('Descanso')

    const [reqAquiStart, setReqAquiStart] = useState('')
    const [reqAquiEnd, setReqAquiEnd] = useState('')
    const [reqLeaderId, setReqLeaderId] = useState('')
    const [leadersList, setLeadersList] = useState<any[]>([])

    useEffect(() => {
        if (formData.id) fetchAbsences()
        fetchLeaders()
    }, [formData.id])

    const fetchLeaders = async () => {
        const { data } = await supabase.from('collaborators').select('id, name').order('name');
        if (data) setLeadersList(data);
    }

    const fetchAbsences = async () => {
        if (!formData.id) return
        setFetching(true)
        const { data } = await supabase
            .from('collaborator_absences')
            .select('*')
            .eq('collaborator_id', formData.id)
            .order('start_date', { ascending: false })
        if (data) setAbsences(data)
        setFetching(false)
    }

    const handleDeleteAbsence = async (id: number) => {
        if (!confirm('Deseja excluir este registro de ausência?')) return
        try {
            await supabase.from('collaborator_absences').delete().eq('id', id)
            fetchAbsences()
        } catch (e: any) {
            alert('Erro ao excluir: ' + e.message)
        }
    }


    const calculateDays = (start: string, end: string) => {
        if (start.length !== 10 || end.length !== 10) return 0
        const [d1, m1, y1] = start.split('/').map(Number)
        const [d2, m2, y2] = end.split('/').map(Number)
        const date1 = new Date(y1, m1 - 1, d1)
        const date2 = new Date(y2, m2 - 1, d2)
        if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return 0
        const diffTime = Math.abs(date2.getTime() - date1.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        return diffDays
    }

    const getAbsenceTitle = () => {
        const type = formData.contract_type
        if (type === 'CLT' || type === 'JOVEM APRENDIZ') return 'Períodos de Férias'
        if (type === 'ESTAGIÁRIO') return 'Recesso Remunerado'
        return 'Períodos de Descanso / Recesso'
    }

    const handleSaveAbsence = async () => {
        if (!formData.id || !absenceStart || !absenceEnd) return
        setLoading(true)
        try {
            const days = calculateDays(absenceStart, absenceEnd)
            let typeLabel = 'Férias'
            if (formData.contract_type === 'ESTAGIÁRIO') typeLabel = 'Recesso Remunerado'
            if (['ADVOGADO', 'PJ'].includes(formData.contract_type || '')) {
                typeLabel = absenceSubtype
            }

            const { error } = await supabase.from('collaborator_absences').insert({
                collaborator_id: formData.id,
                type: typeLabel,
                start_date: absenceStart,
                end_date: absenceEnd,
                days_count: days,
                observation: absenceObs
            })

            if (error) throw error
            alert('Ausência registrada!')
            setAbsenceStart('')
            setAbsenceEnd('')
            setAbsenceObs('')
            fetchAbsences()
        } catch (e: any) {
            alert('Erro ao salvar: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSendMagicLink = async () => {
        if (!formData.id || !reqLeaderId || !reqAquiStart || !reqAquiEnd) return;
        setLoading(true);
        try {
            const formatToISO = (dateStr: string) => {
                const [d, m, y] = dateStr.split('/');
                return `${y}-${m}-${d}`;
            };
            
            const { data, error } = await supabase.rpc('create_vacation_request', {
                p_collaborator_id: formData.id,
                p_leader_id: reqLeaderId,
                p_aquisitive_period_start: formatToISO(reqAquiStart),
                p_aquisitive_period_end: formatToISO(reqAquiEnd)
            });

            if (error) throw error;

            alert('Solicitação criada com sucesso! O Link Mágico pode ser enviado agora.');

            // Disparar Webhook para o Make.com enviar o e-mail ao integrante
            try {
                await fetch('https://hook.us2.make.com/xklqclzckk2723dwejxueuy65ketmb4k', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: 'hr_requested',
                        colaborador_nome: formData.name,
                        colaborador_email: formData.email_pessoal || formData.email,
                        lider_id: reqLeaderId,
                        link_magico_integrante: `${window.location.origin}/solicitacao-ferias/${data.employee_token}`,
                        periodo_aquisitivo_inicio: reqAquiStart,
                        periodo_aquisitivo_fim: reqAquiEnd,
                        email_rh: 'rh@salomaoadv.com.br'
                    })
                });
            } catch (err) {
                console.error('Erro ao notificar Make:', err);
            }
            
            setReqAquiStart('');
            setReqAquiEnd('');
            setReqLeaderId('');
            setActiveTab('historico_ferias');
        } catch (e: any) {
            alert('Erro ao gerar link mágico: ' + e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 border-b border-blue-100 pb-4 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg text-[#1e3a8a]"><Clock className="h-5 w-5" /></div>
                <h4 className="text-lg font-black text-[#0a192f]">Registrar {getAbsenceTitle()}</h4>
            </div>

            {/* TABS CONTAINER */}
            <div className="flex bg-gray-100 p-1.5 rounded-xl gap-2 overflow-x-auto w-full mb-6">
                <button
                    onClick={() => setActiveTab('historico_ferias')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'historico_ferias' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
                >
                    <CalendarIcon className="h-4 w-4" /> Histórico Férias/Recesso
                </button>
                <button
                    onClick={() => setActiveTab('registrar')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'registrar' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
                >
                    <FilePlus2 className="h-4 w-4" /> Registrar Ausência Manual
                </button>
                <button
                    onClick={() => setActiveTab('historico_atestados')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'historico_atestados' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
                >
                    <Stethoscope className="h-4 w-4" /> Atestados Médicos
                </button>
            </div>

            {activeTab === 'registrar' && (
                <div className="grid grid-cols-1 gap-6 max-w-3xl animate-in fade-in duration-300">
                    {['ADVOGADO', 'PJ'].includes(formData.contract_type || '') && (
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Tipo de Ausência</label>
                            <div className="flex gap-4">
                                {['Descanso', 'Recesso fim de ano'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setAbsenceSubtype(type)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${absenceSubtype === type ? 'bg-[#1e3a8a] text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Início</label>
                            <input
                                type="text"
                                className={`w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none transition-all ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                placeholder="DD/MM/AAAA"
                                maxLength={10}
                                value={absenceStart}
                                onChange={e => setAbsenceStart(maskDate(e.target.value))}
                                disabled={isViewMode}
                                readOnly={isViewMode}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fim</label>
                            <input
                                type="text"
                                className={`w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none transition-all ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                placeholder="DD/MM/AAAA"
                                maxLength={10}
                                value={absenceEnd}
                                onChange={e => setAbsenceEnd(maskDate(e.target.value))}
                                disabled={isViewMode}
                                readOnly={isViewMode}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantidade de Dias</label>
                            <div className="w-full bg-gray-100 border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-500">
                                {calculateDays(absenceStart, absenceEnd)} dias
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Observações (Opcional)</label>
                        <textarea
                            className={`w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm min-h-[100px] focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none transition-all resize-none ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                            placeholder="Observações adicionais sobre o período..."
                            value={absenceObs}
                            onChange={e => setAbsenceObs(e.target.value)}
                            disabled={isViewMode}
                            readOnly={isViewMode}
                        />
                    </div>

                    {!isViewMode && (
                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleSaveAbsence}
                                disabled={loading || !absenceStart || !absenceEnd}
                                className="flex items-center gap-2 px-6 py-3 bg-[#1e3a8a] text-white rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-[#112240] hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Registrar Ausência
                            </button>
                        </div>
                    )}
                </div>
            )}



            {(activeTab === 'historico_ferias' || activeTab === 'historico_atestados') && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* ENVIAR FORMULÁRIO DE FÉRIAS (Only in Historico de Férias tab) */}
                    {activeTab === 'historico_ferias' && (
                        <div className="grid grid-cols-1 gap-6 max-w-3xl mb-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <div className="flex items-start gap-4">
                                <div className="bg-[#1e3a8a] p-2.5 rounded-xl text-white shadow-md shrink-0"><Send className="h-5 w-5" /></div>
                                <div>
                                    <h5 className="font-black text-[#1e3a8a] text-base mb-1">Enviar Formulário ao Integrante</h5>
                                    <p className="text-xs text-[#1e3a8a]/70 max-w-xl font-medium">
                                        Preencha o período aquisitivo e defina o líder que irá aprovar o pedido. O sistema enviará um e-mail automaticamente com o link seguro e exclusivo para que <strong>{formData.name}</strong> possa escolher a data desejada para o seu descanso.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-blue-900/50 uppercase tracking-widest">Início Aquisitivo</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white border border-blue-200/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none shadow-sm transition-all"
                                        placeholder="DD/MM/AAAA"
                                        maxLength={10}
                                        value={reqAquiStart}
                                        onChange={e => setReqAquiStart(maskDate(e.target.value))}
                                        disabled={isViewMode}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-blue-900/50 uppercase tracking-widest">Fim Aquisitivo</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white border border-blue-200/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none shadow-sm transition-all"
                                        placeholder="DD/MM/AAAA"
                                        maxLength={10}
                                        value={reqAquiEnd}
                                        onChange={e => setReqAquiEnd(maskDate(e.target.value))}
                                        disabled={isViewMode}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-blue-900/50 uppercase tracking-widest">Líder para Aprovação</label>
                                <select
                                    className="w-full bg-white border border-blue-200/60 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none shadow-sm transition-all text-gray-700"
                                    value={reqLeaderId}
                                    onChange={e => setReqLeaderId(e.target.value)}
                                    disabled={isViewMode}
                                >
                                    <option value="">Selecione o líder responsável...</option>
                                    {leadersList.map(l => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>
                            </div>

                            {!isViewMode && (
                                <div className="flex justify-end pt-2 border-t border-blue-100/50 mt-2">
                                    <button
                                        onClick={handleSendMagicLink}
                                        disabled={loading || !reqAquiStart || !reqAquiEnd || !reqLeaderId}
                                        className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black uppercase text-xs tracking-wider hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        Gerar Link e Disparar E-mail
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* HISTÓRICO LIST */}
                    {activeTab === 'historico_ferias' && (
                         <h5 className="font-black text-[#0a192f] text-sm mb-4 px-2 tracking-tight">Histórico Cadastrado</h5>
                    )}
                    {fetching ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 text-[#1e3a8a] animate-spin" /></div>
                    ) : (
                        absences.filter(a => activeTab === 'historico_atestados' ? a.type === 'Atestado Médico' : a.type !== 'Atestado Médico').length > 0 ? (
                            absences.filter(a => activeTab === 'historico_atestados' ? a.type === 'Atestado Médico' : a.type !== 'Atestado Médico').map(a => {
                                const formatDateBr = (d: string) => {
                                    if (!d) return '';
                                    if (d.includes('/')) return d;
                                    const [y, m, day] = d.split('T')[0].split('-');
                                    return `${day}/${m}/${y}`;
                                };
                                return (
                                    <div key={a.id} className="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-200 transition-colors shadow-sm">
                                        <div className="flex gap-4">
                                            <div className={`p-3 rounded-xl mt-1 shrink-0 ${activeTab === 'historico_atestados' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {activeTab === 'historico_atestados' ? <Stethoscope className="h-5 w-5" /> : <CalendarIcon className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-[#0a192f] flex items-center gap-2">
                                                    {a.type}
                                                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wider text-gray-600">
                                                        {a.days_count} dia{a.days_count > 1 ? 's' : ''}
                                                    </span>
                                                </h5>
                                                <p className="text-sm font-medium text-gray-500 mt-1">
                                                    {formatDateBr(a.start_date)} até {formatDateBr(a.end_date)}
                                                </p>
                                                {a.observation && (
                                                    <p className="text-xs text-gray-400 mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100 italic">
                                                        "{a.observation}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {!isViewMode && (
                                            <button
                                                onClick={() => handleDeleteAbsence(a.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                )
                            })
                        ) : (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm font-medium text-gray-500">Nenhum registro encontrado.</p>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    )
}
