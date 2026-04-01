import { useState, useEffect } from 'react'
import { AlertTriangle, FileText, Save, Loader2, History, ChevronRight, Briefcase, Trash2, Calendar, Users, UserX, RefreshCcw } from 'lucide-react'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { Collaborator } from '../../../types/controladoria'
import { supabase } from '../../../lib/supabase'
import { CandidatoEntrevistaSection } from './CandidatoEntrevistaSection'
import { toast } from 'sonner'
import { AlertModal } from '../../../components/ui/AlertModal'

interface HistoricoSectionProps {
    formData: Partial<Collaborator>
    setFormData: React.Dispatch<React.SetStateAction<Partial<Collaborator>>>
    maskDate: (v: string) => string
    isViewMode?: boolean
}

const formatDurationExtensive = (totalDays: number) => {
    const years = Math.floor(totalDays / 365);
    const months = Math.floor((totalDays % 365) / 30);
    const days = totalDays % 30;

    const parts = [];
    if (years > 0) parts.push(`${years} ano${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} ${months > 1 ? 'meses' : 'mês'}`);
    if (days > 0 || parts.length === 0) parts.push(`${days} dia${days !== 1 ? 's' : ''}`);

    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    const last = parts.pop();
    return parts.join(', ') + ' e ' + last;
}

export function HistoricoSection({ formData, setFormData, maskDate: _maskDate, isViewMode = false }: HistoricoSectionProps) {
    const [activeSection, setActiveSection] = useState<'none' | 'roles' | 'warnings' | 'absences' | 'observations' | 'recruiting'>('roles')
    const [loading, setLoading] = useState(false)

    // --- CARGOS STATE ---
    const [roleHistory, setRoleHistory] = useState<any[]>([])
    const [pendingDeleteRoleId, setPendingDeleteRoleId] = useState<string | null>(null)

    // --- ADVERTÊNCIAS STATE ---
    const [warningReason, setWarningReason] = useState('')
    const [warningDesc, setWarningDesc] = useState('')

    // --- CYCLES STATE ---
    const [pendingDeleteEventId, setPendingDeleteEventId] = useState<string | null>(null)


    // --- OBSERVAÇÕES STATE ---
    const [obsText, setObsText] = useState(formData.history_observations || '')

    // --- RECRUTAMENTO STATE ---
    const [recruitingHistory, setRecruitingHistory] = useState<any[]>([])
    const [entrevistaCandidato, setEntrevistaCandidato] = useState<any>(null)
    const [loadingRecruiting, setLoadingRecruiting] = useState(false)

    // Atualiza obsText se formData mudar
    useEffect(() => {
        if (formData.history_observations) setObsText(formData.history_observations)
    }, [formData.history_observations])

    // --- EFFECT ---
    useEffect(() => {
        if (formData.id) {
            fetchRoleHistory()
        }
    }, [formData.id])

    useEffect(() => {
        if (formData.candidato_id || formData.email || formData.name) {
            fetchRecruitingHistory()
        }
    }, [formData.candidato_id, formData.email, formData.name])

    const fetchRoleHistory = async () => {
        if (!formData.id) return
        const { data } = await supabase
            .from('collaborator_role_history')
            .select('*')
            .eq('collaborator_id', formData.id)
            .order('change_date', { ascending: false })

        if (data) setRoleHistory(data)
    }

    const fetchRecruitingHistory = async () => {
        setLoadingRecruiting(true)
        try {
            // First, find the candidato by email or name
            let query = supabase.from('candidatos').select('id, nome, email, entrevista_dados, area, indicado_por, role')

            if (formData.candidato_id) {
                query = query.eq('id', formData.candidato_id)
            } else if (formData.email && formData.name) {
                query = query.or(`email.eq.${formData.email},nome.ilike.%${formData.name.trim()}%`)
            } else if (formData.email) {
                query = query.eq('email', formData.email)
            } else if (formData.name) {
                query = query.ilike('nome', `%${formData.name.trim()}%`)
            }

            const { data: candidatoData, error: candidatoError } = await query.limit(1)

            if (candidatoError) throw candidatoError

            if (candidatoData && candidatoData.length > 0) {
                const candidatoId = candidatoData[0].id
                const candidatoRecord = candidatoData[0]

                setEntrevistaCandidato({
                    nome: candidatoRecord.nome,
                    area: candidatoRecord.area,
                    indicado_por: candidatoRecord.indicado_por,
                    role: candidatoRecord.role,
                    entrevista_dados: candidatoRecord.entrevista_dados || {}
                })

                // Now fetch events (interviews) related to this candidato
                // Buscar anotações e histórico do tipo 'Observação' ou antigos sem data de evento
                const { data: historicoData, error: historicoError } = await supabase
                    .from('candidato_historico')
                    .select('*')
                    .eq('candidato_id', candidatoId)

                if (historicoError) throw historicoError

                // Buscar eventos reais do calendário atrelados a este candidato
                // Usando .contains porque participantes_candidatos é um array JSONB
                const { data: eventosData, error: eventosError } = await supabase
                    .from('eventos')
                    .select('*')
                    .contains('participantes_candidatos', [candidatoId])

                if (eventosError) console.error('Erro ao buscar eventos do calendário:', eventosError)

                const historicoEventoIds = new Set((historicoData || []).map(h => h.evento_id).filter(Boolean));

                const combined = [
                    ...(historicoData || []).map(h => ({
                        ...h,
                        id: `hist_${h.id}`,
                        source: 'historico'
                    })),
                    ...(eventosData || []).filter(e => !historicoEventoIds.has(e.id)).map(e => ({
                        id: `ev_${e.id}`,
                        tipo: e.tipo || 'Entrevista',
                        created_at: e.created_at,
                        data_registro: e.created_at,
                        entrevista_data: e.data_evento ? e.data_evento.split('T')[0] : null,
                        entrevista_hora: e.data_evento && e.data_evento.includes('T') ? e.data_evento.split('T')[1].substring(0, 5) : null,
                        descricao: e.descricao || `Evento agendado: ${e.titulo}`,
                        compareceu: e.compareceu !== undefined ? e.compareceu : null,
                        source: 'calendario'
                    }))
                ]

                const sortedHistorico = combined.sort((a: any, b: any) => {
                    const dateA = new Date(a.created_at || a.data_registro || 0).getTime()
                    const dateB = new Date(b.created_at || b.data_registro || 0).getTime()
                    return dateB - dateA
                })

                setRecruitingHistory(sortedHistorico)
            } else {
                setRecruitingHistory([])
            }
        } catch (error) {
            console.error('Erro ao buscar histórico de recrutamento:', error)
        } finally {
            setLoadingRecruiting(false)
        }
    }

    // --- DELETE HANDLER ---
    const handleDeleteRoleHistoryClick = (id: string) => {
        setPendingDeleteRoleId(id);
    }

    const confirmDeleteRoleHistory = async () => {
        if (!pendingDeleteRoleId) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('collaborator_role_history').delete().eq('id', pendingDeleteRoleId);
            if (error) throw error;
            setRoleHistory(prev => prev.filter(item => item.id !== pendingDeleteRoleId));
            toast.success('Registro de histórico excluído com sucesso.');
        } catch (e: any) {
            toast.error('Erro ao excluir histórico: ' + e.message);
        } finally {
            setLoading(false);
            setPendingDeleteRoleId(null);
        }
    }

    // --- HELPERS ---

    // --- SAVE HANDLERS ---
    const handleSaveWarning = async () => {
        if (!formData.id || !warningReason) return
        setLoading(true)
        try {
            const { error } = await supabase.from('collaborator_warnings').insert({
                collaborator_id: formData.id,
                reason: warningReason,
                description: warningDesc
            })
            if (error) throw error
            toast.success('Advertência salva com sucesso!')
            setWarningReason('')
            setWarningDesc('')
            setActiveSection('none')
        } catch (e: any) {
            toast.error('Erro ao salvar: ' + e.message)
        } finally {
            setLoading(false)
        }
    }


    const handleSaveObs = async () => {
        if (!formData.id) return
        setLoading(true)
        try {
            const { error } = await supabase.from('collaborators').update({
                history_observations: obsText
            }).eq('id', formData.id)

            if (error) throw error
            setFormData(prev => ({ ...prev, history_observations: obsText }))
            toast.success('Observações atualizadas!')
            setActiveSection('none')
        } catch (e: any) {
            toast.error('Erro ao salvar: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            {/* BUTTONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Cargos */}
                <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'roles' ? 'none' : 'roles')}
                    className={`
                        relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 text-left group
                        ${activeSection === 'roles'
                            ? 'bg-blue-50 border-blue-200 shadow-md transform scale-[1.02]'
                            : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-lg'
                        }
                    `}
                >
                    <div className={`p-3 rounded-xl w-fit mb-3 transition-colors ${activeSection === 'roles' ? 'bg-blue-200 text-blue-700' : 'bg-blue-50 text-blue-500 group-hover:bg-blue-100'}`}>
                        <Briefcase className="h-6 w-6" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-[#0a192f] uppercase tracking-wider mb-1">Cargos</h3>
                    <p className="text-[10px] text-gray-500 font-medium hidden sm:block">Mudanças de cargo</p>
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${activeSection === 'roles' ? 'rotate-90 opacity-100' : 'opacity-0 -translate-x-2'}`}>
                        <ChevronRight className="h-5 w-5 text-blue-500" />
                    </div>
                </button>

                {/* Advertências */}
                <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'warnings' ? 'none' : 'warnings')}
                    className={`
                        relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 text-left group
                        ${activeSection === 'warnings'
                            ? 'bg-red-50 border-red-200 shadow-md transform scale-[1.02]'
                            : 'bg-white border-gray-100 hover:border-red-200 hover:shadow-lg'
                        }
                    `}
                >
                    <div className={`p-3 rounded-xl w-fit mb-3 transition-colors ${activeSection === 'warnings' ? 'bg-red-200 text-red-700' : 'bg-red-50 text-red-500 group-hover:bg-red-100'}`}>
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-[#0a192f] uppercase tracking-wider mb-1">Alertas</h3>
                    <p className="text-[10px] text-gray-500 font-medium hidden sm:block">Registrar infrações</p>
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${activeSection === 'warnings' ? 'rotate-90 opacity-100' : 'opacity-0 -translate-x-2'}`}>
                        <ChevronRight className="h-5 w-5 text-red-500" />
                    </div>
                </button>

                {/* Recrutamento */}
                <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'recruiting' ? 'none' : 'recruiting')}
                    className={`
                        relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 text-left group
                        ${activeSection === 'recruiting'
                            ? 'bg-emerald-50 border-emerald-200 shadow-md transform scale-[1.02]'
                            : 'bg-white border-gray-100 hover:border-emerald-200 hover:shadow-lg'
                        }
                    `}
                >
                    <div className={`p-3 rounded-xl w-fit mb-3 transition-colors ${activeSection === 'recruiting' ? 'bg-emerald-200 text-emerald-700' : 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100'}`}>
                        <Users className="h-6 w-6" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-[#0a192f] uppercase tracking-wider mb-1">Seleção</h3>
                    <p className="text-[10px] text-gray-500 font-medium hidden sm:block">Histórico de entrevistas</p>
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${activeSection === 'recruiting' ? 'rotate-90 opacity-100' : 'opacity-0 -translate-x-2'}`}>
                        <ChevronRight className="h-5 w-5 text-emerald-500" />
                    </div>
                </button>

                {/* Observações */}
                <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'observations' ? 'none' : 'observations')}
                    className={`
                        relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 text-left group
                        ${activeSection === 'observations'
                            ? 'bg-amber-50 border-amber-200 shadow-md transform scale-[1.02]'
                            : 'bg-white border-gray-100 hover:border-amber-200 hover:shadow-lg'
                        }
                    `}
                >
                    <div className={`p-3 rounded-xl w-fit mb-3 transition-colors ${activeSection === 'observations' ? 'bg-amber-200 text-amber-700' : 'bg-amber-50 text-amber-500 group-hover:bg-amber-100'}`}>
                        <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-[#0a192f] uppercase tracking-wider mb-1">Anotações</h3>
                    <p className="text-[10px] text-gray-500 font-medium hidden sm:block">Observações gerais</p>
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${activeSection === 'observations' ? 'rotate-90 opacity-100' : 'opacity-0 -translate-x-2'}`}>
                        <ChevronRight className="h-5 w-5 text-amber-500" />
                    </div>
                </button>
            </div>

            <AlertModal
                isOpen={!!pendingDeleteRoleId}
                onClose={() => setPendingDeleteRoleId(null)}
                title="Deseja realmente excluir?"
                description="Tem certeza que quer excluir este registro de histórico? Esta ação não pode ser desfeita."
                variant="error"
                confirmText="Excluir"
                onConfirm={confirmDeleteRoleHistory}
            />

            {/* SECTIONS CONTENT */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[300px] relative">
                {activeSection === 'none' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                        <History className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-sm font-medium">Selecione uma opção acima para visualizar</p>
                    </div>
                )}

                {/* CARGOS PANEL */}
                {activeSection === 'roles' && (
                    <div className="p-8 animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
                        <div className="flex items-center gap-3 border-b border-blue-100 pb-4 mb-6">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Briefcase className="h-5 w-5" /></div>
                            <h4 className="text-lg font-black text-[#0a192f]">Histórico de Cargos</h4>
                        </div>

                        {(() => {
                            const nameFirst = formData.name?.split(' ')[0] || 'Integrante';
                            const parseDateBR = (d: string) => {
                                if (!d || typeof d !== 'string') return 0;
                                const parts = d.split('/');
                                if (parts.length === 3) {
                                    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`).getTime();
                                }
                                return 0;
                            };

                            const nowTs = new Date().getTime();
                            const daysBetween = (start: number, end: number) => Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));

                            const events = [];

                            // 1. Current contract (Or current Readmission)
                            const currentHireTs = parseDateBR(formData.hire_date || '');
                            if (formData.hire_date) {
                                const isReadmission = formData.employment_cycles && formData.employment_cycles.length > 0;
                                const isActive = formData.status === 'active';
                                events.push({
                                    id: 'current_hire',
                                    type: isReadmission ? 'readmission' : 'hire',
                                    date: formData.hire_date,
                                    timestamp: currentHireTs,
                                    text: isReadmission 
                                        ? `${nameFirst} foi readmitido na empresa em ` 
                                        : `${nameFirst} entrou na empresa em `,
                                    subtitle: isActive ? `Há ${formatDurationExtensive(daysBetween(currentHireTs, nowTs))}` : 'Ciclo Registrado',
                                    icon: isReadmission ? <RefreshCcw className="w-4 h-4" /> : <Calendar className="w-4 h-4" />,
                                    iconBg: isReadmission ? 'bg-emerald-100' : 'bg-blue-100',
                                    iconColor: isReadmission ? 'text-emerald-600' : 'text-blue-600',
                                    container: isReadmission ? 'bg-emerald-50/50 border-emerald-100/50' : 'bg-blue-50/50 border-blue-100/50'
                                });
                            }

                            if (formData.status === 'inactive' && formData.termination_date) {
                                const termTs = parseDateBR(formData.termination_date);
                                const cycleDays = currentHireTs && termTs ? daysBetween(currentHireTs, termTs) : 0;
                                events.push({
                                    id: 'current_termination',
                                    type: 'termination',
                                    date: formData.termination_date,
                                    timestamp: termTs,
                                    text: `${nameFirst} foi desligado em `,
                                    subtitle: cycleDays > 0 ? `Trabalhou por ${formatDurationExtensive(cycleDays)}` : 'Desligamento',
                                    icon: <UserX className="w-4 h-4" />,
                                    iconBg: 'bg-red-100',
                                    iconColor: 'text-red-600',
                                    container: 'bg-red-50/50 border-red-100/50'
                                });
                            }

                            // 2. Past Cycles from employment_cycles
                            if (formData.employment_cycles && Array.isArray(formData.employment_cycles)) {
                                formData.employment_cycles.forEach((cycle, idx) => {
                                    const isFirstHire = idx === formData.employment_cycles!.length - 1;
                                    const cycleHireTs = parseDateBR(cycle.hire_date || '');
                                    const cycleTermTs = parseDateBR(cycle.termination_date || '');
                                    const cycleDays = cycleHireTs && cycleTermTs ? daysBetween(cycleHireTs, cycleTermTs) : 0;
                                    
                                    if (cycle.termination_date) {
                                        events.push({
                                            id: `cycle_term_${idx}`,
                                            type: 'termination',
                                            date: cycle.termination_date,
                                            timestamp: cycleTermTs,
                                            text: `${nameFirst} foi desligado em `,
                                            subtitle: cycleDays > 0 ? `Trabalhou por ${formatDurationExtensive(cycleDays)}` : 'Desligamento',
                                            icon: <UserX className="w-4 h-4" />,
                                            iconBg: 'bg-red-100',
                                            iconColor: 'text-red-600',
                                            container: 'bg-red-50/50 border-red-100/50'
                                        });
                                    }
                                    
                                    if (cycle.hire_date) {
                                        events.push({
                                            id: `cycle_hire_${idx}`,
                                            type: isFirstHire ? 'hire' : 'readmission',
                                            date: cycle.hire_date,
                                            timestamp: cycleHireTs,
                                            text: isFirstHire 
                                                  ? `${nameFirst} entrou na empresa em `
                                                  : `${nameFirst} foi readmitido na empresa em `,
                                            subtitle: 'Ciclo Registrado',
                                            icon: isFirstHire ? <Calendar className="w-4 h-4" /> : <RefreshCcw className="w-4 h-4" />,
                                            iconBg: isFirstHire ? 'bg-blue-100' : 'bg-emerald-100',
                                            iconColor: isFirstHire ? 'text-blue-600' : 'text-emerald-600',
                                            container: isFirstHire ? 'bg-blue-50/50 border-blue-100/50' : 'bg-emerald-50/50 border-emerald-100/50'
                                        });
                                    }
                                });
                            }

                            // Sort visually: Newest to Oldest
                            events.sort((a, b) => b.timestamp - a.timestamp);

                            return (
                                <>
                                    <div className="space-y-4 mb-6">
                                        {events.map((ev) => (
                                            <div key={ev.id} className={`p-4 rounded-xl border flex items-center gap-3 ${ev.container}`}>
                                            <div className={`p-2 rounded-lg shrink-0 ${ev.iconBg} ${ev.iconColor}`}>
                                                {ev.icon}
                                            </div>
                                            <div>
                                                <p className="text-sm text-[#0a192f] font-medium leading-tight">
                                                    {ev.text} <span className="font-bold">{ev.date}</span>
                                                </p>
                                                {ev.subtitle ? (
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">
                                                        {ev.subtitle}
                                                    </p>
                                                ) : null}
                                            </div>
                                            {!isViewMode && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPendingDeleteEventId(ev.id);
                                                    }}
                                                    className="ml-auto p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir este registro"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                <AlertModal
                                    isOpen={!!pendingDeleteEventId}
                                    onClose={() => setPendingDeleteEventId(null)}
                                    title="Excluir Registro de Ciclo"
                                    description="Tem certeza que deseja excluir esta data? O histórico associado a ela não poderá ser recuperado."
                                    variant="error"
                                    confirmText="Sim, Excluir"
                                    onConfirm={() => {
                                        if (!pendingDeleteEventId) return;
                                        
                                        let updated = { ...formData };
                                        
                                        if (pendingDeleteEventId === 'current_hire') {
                                            updated.hire_date = '';
                                        } else if (pendingDeleteEventId === 'current_termination') {
                                            updated.termination_date = '';
                                        } else if (pendingDeleteEventId.startsWith('cycle_term_')) {
                                            const idx = parseInt(pendingDeleteEventId.split('_')[2]);
                                            if (updated.employment_cycles && updated.employment_cycles[idx]) {
                                                const newCycles = [...updated.employment_cycles];
                                                newCycles[idx] = { ...newCycles[idx], termination_date: null };
                                                updated.employment_cycles = newCycles;
                                            }
                                        } else if (pendingDeleteEventId.startsWith('cycle_hire_')) {
                                            const idx = parseInt(pendingDeleteEventId.split('_')[2]);
                                            if (updated.employment_cycles && updated.employment_cycles[idx]) {
                                                const newCycles = [...updated.employment_cycles];
                                                newCycles[idx] = { ...newCycles[idx], hire_date: null };
                                                updated.employment_cycles = newCycles;
                                            }
                                        }
                                        
                                        // Auto-cleanup completely empty cycles
                                        if (updated.employment_cycles) {
                                            updated.employment_cycles = updated.employment_cycles.filter((c: any) => c.hire_date || c.termination_date);
                                        }
                                        
                                        setFormData(updated);
                                        setPendingDeleteEventId(null);
                                        toast.success('Registro do ciclo excluído.');
                                    }}
                                />
                                </>
                            );
                        })()}

                        {roleHistory.length > 0 ? (
                            <div className="space-y-4">
                                {roleHistory.map((item, index) => {
                                    // Handle dates directly to avoid timezone shifts
                                    let dateText = item.change_date;
                                    if (item.change_date && item.change_date.includes('-')) {
                                        const [year, month, day] = item.change_date.split('T')[0].split('-');
                                        dateText = `${day}/${month}/${year}`;
                                    }

                                    // Format duration
                                    const durationText = formatDurationExtensive(item.duration_days);

                                    return (
                                        <div key={item.id || index} className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50 hover:border-blue-200 transition-colors">
                                            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mt-1">
                                                <Briefcase className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-[#0a192f] text-sm font-medium leading-tight">
                                                        Em <span className="font-bold text-blue-600">{dateText}</span> foi promovido a <span className="font-bold">{item.new_role}</span>
                                                    </p>
                                                    {!isViewMode && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteRoleHistoryClick(item.id)}
                                                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                            title="Excluir histórico"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 font-medium">
                                                    Cargo anterior: <span className="font-bold text-gray-700">{item.previous_role}</span>
                                                </p>
                                                {item.duration_days > 0 && (
                                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                                        Há <span className="font-bold">{durationText}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm font-medium text-gray-500">Nenhum histórico encontrado para este integrante.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ADVERTÊNCIAS PANEL */}
                {activeSection === 'warnings' && (
                    <div className="p-8 animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
                        <div className="flex items-center gap-3 border-b border-red-100 pb-4 mb-6">
                            <div className="p-2 bg-red-50 rounded-lg text-red-600"><AlertTriangle className="h-5 w-5" /></div>
                            <h4 className="text-lg font-black text-[#0a192f]">Registrar Nova Advertência</h4>
                        </div>

                        <div className="grid grid-cols-1 gap-6 max-w-2xl">
                            <SearchableSelect
                                label="Motivo da Advertência"
                                placeholder="Selecione o motivo..."
                                value={warningReason}
                                onChange={setWarningReason}
                                disabled={isViewMode}
                                options={[
                                    { id: 'Comportamental', name: 'Comportamental' },
                                    { id: 'Técnica', name: 'Técnica' },
                                    { id: 'Assiduidade', name: 'Assiduidade' },
                                    { id: 'Insubordinação', name: 'Insubordinação' },
                                    { id: 'Desídia', name: 'Desídia' },
                                    { id: 'Outros', name: 'Outros' }
                                ]}
                            />

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição Detalhada</label>
                                <textarea
                                    className={`w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm min-h-[120px] focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    placeholder="Descreva o ocorrido..."
                                    value={warningDesc}
                                    onChange={e => setWarningDesc(e.target.value)}
                                    disabled={isViewMode}
                                    readOnly={isViewMode}
                                />
                            </div>

                            {!isViewMode && (
                                <div className="flex justify-end pt-4">
                                    <button
                                        type="button"
                                        onClick={handleSaveWarning}
                                        disabled={loading || !warningReason}
                                        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-red-700 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Salvar Ocorrência
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {/* OBSERVAÇÕES PANEL */}

                {/* RECRUTAMENTO PANEL */}
                {activeSection === 'recruiting' && (
                    <div className="p-8 animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
                        <div className="flex items-center gap-3 border-b border-emerald-100 pb-4 mb-6">
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><Users className="h-5 w-5" /></div>
                            <h4 className="text-lg font-black text-[#0a192f]">Histórico de Recrutamento</h4>
                        </div>

                        {loadingRecruiting ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                            </div>
                        ) : (
                            <>
                                {entrevistaCandidato && entrevistaCandidato.area && (
                                    <div className="mb-8 border-b-2 border-emerald-100 pb-8">
                                        <h5 className="font-black text-[#0a192f] mb-4 uppercase tracking-widest text-xs">Ficha de Entrevista do Candidato</h5>
                                        <div className="bg-gray-50/50 rounded-2xl border border-gray-100">
                                            <CandidatoEntrevistaSection
                                                formData={entrevistaCandidato}
                                                setFormData={() => { }}
                                                isViewMode={true}
                                            />
                                        </div>
                                    </div>
                                )}

                                {recruitingHistory.length > 0 ? (
                                    <div>
                                        <h5 className="font-black text-[#0a192f] mb-4 uppercase tracking-widest text-xs">Linha do Tempo de Processos Seletivos</h5>
                                        <div className="space-y-4">
                                            {recruitingHistory.map((evento) => {
                                                // Format data string
                                                let dateText = evento.created_at;
                                                if (evento.created_at && evento.created_at.includes('T')) {
                                                    const dateObj = new Date(evento.created_at);
                                                    const day = String(dateObj.getDate()).padStart(2, '0');
                                                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                                                    const year = dateObj.getFullYear();
                                                    const hours = String(dateObj.getHours()).padStart(2, '0');
                                                    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                                                    dateText = `${day}/${month}/${year} às ${hours}:${minutes}`;
                                                }

                                                const isEntrevista = evento.tipo === 'Entrevista';

                                                return (
                                                    <div key={evento.id} className="p-5 border border-emerald-100 rounded-xl bg-emerald-50/30 space-y-3 relative overlow-hidden">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded mb-2">
                                                                    {evento.tipo}
                                                                </span>
                                                                <h5 className="text-[#0a192f] font-bold text-sm">Registro de {evento.tipo}</h5>
                                                            </div>
                                                            <p className="text-xs text-gray-500 font-medium">
                                                                Registrado em <span className="font-bold text-emerald-600">{dateText}</span>
                                                            </p>
                                                        </div>

                                                        {isEntrevista && (
                                                            <div className="grid grid-cols-2 gap-4 text-xs mt-3 bg-white p-3 rounded border border-emerald-50">
                                                                <div>
                                                                    <p className="text-gray-400 font-bold uppercase tracking-wider mb-1" style={{ fontSize: '9px' }}>Data Agendada</p>
                                                                    <p className="font-medium text-gray-700">
                                                                        {evento.entrevista_data ? evento.entrevista_data.split('-').reverse().join('/') : 'Não informada'}
                                                                        {evento.entrevista_hora ? ` às ${evento.entrevista_hora}` : ''}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-400 font-bold uppercase tracking-wider mb-1" style={{ fontSize: '9px' }}>Status / Presença</p>
                                                                    <p className={`font-bold ${evento.compareceu === true ? 'text-green-600' : evento.compareceu === false ? 'text-red-600' : 'text-amber-500'}`}>
                                                                        {evento.compareceu === true ? 'Compareceu' : evento.compareceu === false ? 'Faltou' : 'Pendente / Agendada'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="mt-4 p-4 bg-white rounded-lg border border-emerald-100">
                                                            <h6 className="text-[10px] font-black text-[#0a192f] uppercase tracking-wider mb-2">Detalhes / Observações</h6>
                                                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{evento.descricao || 'Nenhuma observação registrada.'}</p>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3 opacity-50" />
                                        <p className="text-sm font-medium text-gray-500">Nenhum evento de recrutamento encontrado para este integrante.</p>
                                        <p className="text-xs text-gray-400 mt-1">Isso ocorre quando o e-mail não corresponde ao cadastro do candidato.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeSection === 'observations' && (
                    <div className="p-8 animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
                        <div className="flex items-center gap-3 border-b border-amber-100 pb-4 mb-6">
                            <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><FileText className="h-5 w-5" /></div>
                            <h4 className="text-lg font-black text-[#0a192f]">Observações Gerais</h4>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Histórico de Anotações</label>
                                <textarea
                                    className={`w-full bg-yellow-50/30 border border-gray-200 rounded-xl p-6 text-sm min-h-[300px] focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-none font-medium leading-relaxed ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    placeholder="Digite aqui observações gerais, anotações de reuniões ou pontos de atenção sobre o integrante..."
                                    value={obsText}
                                    onChange={e => setObsText(e.target.value)}
                                    disabled={isViewMode}
                                    readOnly={isViewMode}
                                />
                            </div>

                            {!isViewMode && (
                                <div className="flex justify-end pt-4">
                                    <button
                                        type="button"
                                        onClick={handleSaveObs}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-amber-600 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Salvar Observações
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div >
    )
}
