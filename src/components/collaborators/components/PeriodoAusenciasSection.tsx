import { useState, useEffect } from 'react'
import { Clock, Save, Loader2, Calendar as CalendarIcon, FilePlus2, Stethoscope, Trash2, Send } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Collaborator } from '../../../types/controladoria'
import { ManagedMultiSelect } from '../../crm/ManagedMultiSelect'

interface PeriodoAusenciasSectionProps {
    formData: Partial<Collaborator>
    isViewMode?: boolean
    maskDate: (value: string) => string
    showAlert?: (title: string, message: string, type?: 'success' | 'error' | 'info') => void
}

export function PeriodoAusenciasSection({
    formData,
    isViewMode = false,
    maskDate,
    showAlert
}: PeriodoAusenciasSectionProps) {
    const [activeTab, setActiveTab] = useState<'historico_ferias' | 'registrar' | 'historico_atestados'>('historico_ferias')
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)
    const [absences, setAbsences] = useState<any[]>([])

    const [absenceStart, setAbsenceStart] = useState('')
    const [absenceEnd, setAbsenceEnd] = useState('')
    const [absenceObs, setAbsenceObs] = useState('')
    const [absenceSubtype, setAbsenceSubtype] = useState('Descanso')

    const [reqLeaderIds, setReqLeaderIds] = useState<string[]>([])
    const [destinatariosList, setDestinatariosList] = useState<any[]>([])

    useEffect(() => {
        const fetchDestinatarios = async () => {
            const { data: leadersData } = await supabase
                .from('collaborators')
                .select('id, name, team_leader!inner(id)')
                .eq('status', 'active')
            
            const { data: partnersData } = await supabase
                .from('partners')
                .select('id, name')
                
            const combined = [...(leadersData || []), ...(partnersData || [])]
            const uniqueMap = new Map()
            for (const item of combined) {
                const key = item.name.trim().toLowerCase()
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, item)
                }
            }
            const unique = Array.from(uniqueMap.values())
            unique.sort((a, b) => a.name.localeCompare(b.name))
            
            setDestinatariosList(unique)
        }
        fetchDestinatarios()
    }, [])

    useEffect(() => {
        if (formData.id) fetchAbsences()
    }, [formData.id])

    useEffect(() => {
        if (formData.leader_id && reqLeaderIds.length === 0) {
            setReqLeaderIds([formData.leader_id])
        }
    }, [formData.leader_id])

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
            if (showAlert) showAlert('Sucesso', 'Registro de ausência excluído com sucesso!', 'success')
            else alert('Registro de ausência excluído com sucesso!')
        } catch (e: any) {
            if (showAlert) showAlert('Erro', 'Erro ao excluir: ' + e.message, 'error')
            else alert('Erro ao excluir: ' + e.message)
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
            if (showAlert) showAlert('Sucesso', 'Ausência registrada com sucesso!', 'success')
            else alert('Ausência registrada!')
            
            setAbsenceStart('')
            setAbsenceEnd('')
            setAbsenceObs('')
            fetchAbsences()
        } catch (e: any) {
            if (showAlert) showAlert('Erro', 'Erro ao salvar: ' + e.message, 'error')
            else alert('Erro ao salvar: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSendMagicLink = async () => {
        if (!formData.id || reqLeaderIds.length === 0) return;
        setLoading(true);
        try {
            // A RPC atual recebe apenas um líder (p_leader_id).
            // Usaremos o primeiro líder da lista selecionada.
            const primaryLeaderId = reqLeaderIds[0];

            const { data, error } = await supabase.rpc('create_vacation_request', {
                p_collaborator_id: formData.id,
                p_leader_id: primaryLeaderId,
                p_aquisitive_period_start: null,
                p_aquisitive_period_end: null
            });

            if (error) throw error;

            if (showAlert) {
                showAlert('Sucesso', 'Formulário enviado! O integrante receberá o link no e-mail corporativo.', 'success');
            } else {
                alert('Formulário enviado com sucesso! O integrante receberá o link no e-mail corporativo.');
            }

            const nameSlug = formData.name ? formData.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : 'colaborador';
            
            const webhookPayload = {
                event: 'hr_requested',
                colaborador_nome: formData.name,
                colaborador_email: formData.email,
                lider_id: primaryLeaderId,
                link_magico_integrante: `${window.location.origin}/solicitacao-ferias/${nameSlug}-${data.employee_token}`,
                periodo_aquisitivo_inicio: "",
                periodo_aquisitivo_fim: "",
                email_rh: 'rh@salomaoadv.com.br'
            };

            console.log("PAYLOAD ENVIADO PARA O MAKE:", webhookPayload);

            // Disparar Webhook para o Make.com enviar o e-mail ao integrante
            try {
                await fetch('https://hook.us2.make.com/xklqclzckk2723dwejxueuy65ketmb4k', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(webhookPayload)
                });
            } catch (err) {
                console.error('Erro ao notificar Make:', err);
            }
            
            setReqLeaderIds(formData.leader_id ? [formData.leader_id] : []);
            setActiveTab('historico_ferias');
        } catch (e: any) {
            if (showAlert) showAlert('Erro', 'Erro ao gerar link mágico: ' + e.message, 'error');
            else alert('Erro ao gerar link mágico: ' + e.message);
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
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 max-w-4xl mb-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="bg-[#1e3a8a] p-2.5 rounded-xl text-white shadow-md shrink-0"><Send className="h-5 w-5" /></div>
                                <div className="min-w-0">
                                    <h5 className="font-black text-[#1e3a8a] text-sm mb-0.5">Enviar Formulário ao Integrante</h5>
                                    <p className="text-[11px] text-[#1e3a8a]/60 font-medium truncate">O link será enviado ao e-mail corporativo de <strong>{formData.name}</strong></p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end w-full md:w-auto">
                                <div className="w-full md:w-[280px]">
                                    <label className="block text-[9px] font-black text-blue-900/40 uppercase tracking-widest mb-1.5 ml-1">Líder Destinatário</label>
                                    <div className="bg-white rounded-xl shadow-sm border border-blue-200/60">
                                        <ManagedMultiSelect
                                            value={reqLeaderIds}
                                            onChange={v => setReqLeaderIds(v)}
                                            options={destinatariosList}
                                            placeholder="Selecione..."
                                            disabled={false}
                                            forceEnabled={true}
                                            className="!border-none"
                                        />
                                    </div>
                                </div>
                                
                                <div
                                    role="button"
                                    onClick={() => {
                                        if (loading || reqLeaderIds.length === 0) return;
                                        handleSendMagicLink();
                                    }}
                                    className={`flex items-center justify-center gap-2 px-6 h-[46px] w-full md:w-auto bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black uppercase text-[10px] tracking-wider transition-all mt-4 md:mt-5 ${loading || reqLeaderIds.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer'}`}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    Enviar
                                </div>
                            </div>
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
