import { useState, useEffect } from 'react'
import { AlertTriangle, FileText, Save, Loader2, History, ChevronRight, Briefcase, Trash2, Calendar, Users, UserX, RefreshCcw, Network, ArrowUpRight, ArrowDownRight, User, Activity, ArrowRight } from 'lucide-react'
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
    const [activeSection, setActiveSection] = useState<'none' | 'roles' | 'warnings' | 'absences' | 'observations' | 'recruiting' | 'org' | 'audits'>('roles')
    const [loading, setLoading] = useState(false)

    // --- AUDIT STATE ---
    const [auditHistory, setAuditHistory] = useState<any[]>([])
    const [loadingAudit, setLoadingAudit] = useState(false)
    const [auditRefsMap, setAuditRefsMap] = useState<Record<string, string>>({})

    // --- CARGOS STATE ---
    const [roleHistory, setRoleHistory] = useState<any[]>([])
    const [pendingDeleteRoleId, setPendingDeleteRoleId] = useState<string | null>(null)

    // --- ADVERTÊNCIAS STATE ---
    const [warningReason, setWarningReason] = useState('')
    const [warningDesc, setWarningDesc] = useState('')

    // --- ORGANOGRAMA STATE ---
    const [hierarchyHistory, setHierarchyHistory] = useState<any[]>([])
    const [superiors, setSuperiors] = useState<any[]>([])
    const [inferiors, setInferiors] = useState<any[]>([])
    const [loadingOrg, setLoadingOrg] = useState(false)

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
            if (activeSection === 'org') {
                fetchOrgData()
            } else if (activeSection === 'audits') {
                fetchAuditHistory()
            }
        }
    }, [formData.id, activeSection])

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

    const fetchAuditHistory = async () => {
        if (!formData.id) return
        setLoadingAudit(true)
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('table_name', 'collaborators')
                .eq('record_id', formData.id)
                .order('changed_at', { ascending: false })

            if (error) throw error

            const userIds = [...new Set((data || []).map(log => log.user_id).filter(Boolean))]
            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('user_profiles')
                    .select('id, name')
                    .in('id', userIds)
                
                const profileMap = new Map((profiles || []).map(p => [p.id, p.name]))
                const updatedLogs = (data || []).map(log => ({
                    ...log,
                    user_name: profileMap.get(log.user_id) || log.user_email || 'Sistema'
                }))
                setAuditHistory(updatedLogs)
            } else {
                setAuditHistory(data || [])
            }

            // POPULATE REF MAP FOR AUDIT DIFFS
            const roleIds = new Set<string>();
            const candIds = new Set<string>();
            const userIdsSet = new Set<string>();

            const collectIds = (obj: any) => {
                if (!obj) return;
                if (obj.role) roleIds.add(String(obj.role));
                if (obj.candidato_id) candIds.add(String(obj.candidato_id));
                ['leader_ids', 'partner_ids'].forEach(field => {
                    if (obj[field]) {
                        let arr = obj[field];
                        if (typeof arr === 'string') { try { arr = JSON.parse(arr); } catch { arr = [] } }
                        if (Array.isArray(arr)) arr.forEach((id: any) => userIdsSet.add(String(id)));
                    }
                });
            };

            for (const log of data || []) {
                collectIds(log.old_data);
                collectIds(log.new_data);
            }

            const refMap: Record<string, string> = {};
            if (roleIds.size > 0) {
                const { data: roles } = await supabase.from('roles').select('id, name').in('id', Array.from(roleIds));
                roles?.forEach(r => refMap[String(r.id)] = r.name);
            }
            if (candIds.size > 0) {
                const { data: cand } = await supabase.from('candidatos').select('id, nome').in('id', Array.from(candIds));
                cand?.forEach(c => refMap[String(c.id)] = c.nome);
            }
            if (userIdsSet.size > 0) {
                const { data: collabs } = await supabase.from('collaborators').select('id, name').in('id', Array.from(userIdsSet));
                collabs?.forEach(c => refMap[String(c.id)] = c.name);
            }
            setAuditRefsMap(refMap);

        } catch (error) {
            console.error('Erro ao buscar auditoria:', error)
        } finally {
            setLoadingAudit(false)
        }
    }

    const fetchOrgData = async () => {
        if (!formData.id) return
        setLoadingOrg(true)
        try {
            // 1. Fetch Superiors
            let supData: any[] = []
            const superiorIds = [...(formData.partner_ids || []), ...(formData.leader_ids || [])].filter(Boolean)
            if (superiorIds.length > 0) {
                const { data: sData } = await supabase
                    .from('collaborators')
                    .select('id, name, role, foto_url, status')
                    .in('id', superiorIds)
                supData = sData || []
            } else {
                setSuperiors([])
            }

            // 2. Fetch Inferiors
            const { data: infLeader } = await supabase
                .from('collaborators')
                .select('id, name, role, foto_url, status, leader_ids, partner_ids')
                .contains('leader_ids', [formData.id])

            const { data: infPartner } = await supabase
                .from('collaborators')
                .select('id, name, role, foto_url, status, leader_ids, partner_ids')
                .contains('partner_ids', [formData.id])

            const merged = [...(infLeader || []), ...(infPartner || [])]
            const uniqueInf = Array.from(new Map(merged.map(item => [item.id, item])).values())

            // 3. Fetch History Timeline
            // a) Suas próprias mudanças
            const { data: ownHistory } = await supabase
                .from('collaborator_hierarchy_history')
                .select('*, collaborators(name)')
                .eq('collaborator_id', formData.id)

            // b) Mudanças de outros (quando este usuário foi adicionado/removido)
            // Query em paralelo para buscar de forma segura em colunas JSONB
            const jsonParam = `["${formData.id}"]`
            const queries = [
                supabase.from('collaborator_hierarchy_history').select('*, collaborators(name)').contains('new_leader_ids', jsonParam),
                supabase.from('collaborator_hierarchy_history').select('*, collaborators(name)').contains('old_leader_ids', jsonParam),
                supabase.from('collaborator_hierarchy_history').select('*, collaborators(name)').contains('new_partner_ids', jsonParam),
                supabase.from('collaborator_hierarchy_history').select('*, collaborators(name)').contains('old_partner_ids', jsonParam),
                supabase.from('roles').select('id, name')
            ]
            
            const results = await Promise.all(queries)
            const rolesData = results[4].data || []
            const rolesMap = new Map(rolesData.map((r: any) => [String(r.id), r.name]))

            let othersHistory: any[] = []
            for(let i=0; i<4; i++) {
                if (results[i].data) othersHistory.push(...results[i].data)
            }

            // Map Superiors and Inferiors with generic role names
            const mapRole = (items: any[]) => items.map(item => ({
                ...item,
                role: item.role ? (rolesMap.get(String(item.role)) || 'CARGO NÃO DEFINIDO') : 'CARGO NÃO DEFINIDO'
            }))

            setSuperiors(mapRole(supData || []))
            setInferiors(mapRole(uniqueInf))

            let allHistory = [...(ownHistory || []), ...othersHistory]
            
            // Remove duplicates and sort descending
            const uniqueHistory = Array.from(new Map(allHistory.map(item => [item.id, item])).values())
                .sort((a, b) => new Date(b.change_date).getTime() - new Date(a.change_date).getTime())

            const historyLeaderIds = new Set<string>();
            uniqueHistory.forEach(item => {
                [...(item.old_partner_ids || []), ...(item.old_leader_ids || []), ...(item.new_partner_ids || []), ...(item.new_leader_ids || [])].forEach(id => {
                    if (id) historyLeaderIds.add(String(id));
                });
            });

            if (historyLeaderIds.size > 0) {
                const { data: historyLeadersData } = await supabase.from('collaborators').select('id, name').in('id', Array.from(historyLeaderIds));
                const namesMap = new Map();
                if (historyLeadersData) {
                    historyLeadersData.forEach((l: any) => namesMap.set(String(l.id), l.name));
                }
                const resolvedNamesObj = Object.fromEntries(namesMap);
                uniqueHistory.forEach(item => {
                    item._resolvedNamesMap = resolvedNamesObj;
                });
            }

            setHierarchyHistory(uniqueHistory)

        } catch (e: any) {
            console.error(e)
            toast.error('Erro ao carregar organograma.')
        } finally {
            setLoadingOrg(false)
        }
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

    const fieldDict: Record<string, string> = {
        name: 'Nome Completo',
        gender: 'Gênero',
        zip_code: 'CEP',
        address: 'Endereço',
        address_number: 'Nº Endereço',
        neighborhood: 'Bairro',
        city: 'Cidade',
        state: 'Estado',
        cpf: 'CPF',
        rg: 'RG',
        birthday: 'Data de Nascimento',
        tipo: 'Tipo',
        equipe: 'Equipe',
        local: 'Localidade',
        role: 'Responsabilidade / Cargo',
        hire_date: 'Data de Admissão',
        termination_date: 'Data de Desligamento',
        status: 'Status',
        email: 'E-mail Profissional',
        leader_ids: 'Líderes Diretos',
        partner_ids: 'Lideranças Superiores',
        contract_type: 'Vínculo (Contrato)',
        civil_status: 'Estado Civil',
        area: 'Área',
        email_pessoal: 'E-mail Pessoal',
        observacoes: 'Anotações (Histórico)',
        history_observations: 'Anotações (Histórico)',
        previsao_formatura: 'Previsão de Formatura',
        termino_contrato_estagio: 'Término Previsto do Contrato',
        candidato_id: 'Candidato'
    }

    const formatDiffAudit = (log: any) => {
        if (log.action === 'INSERT') return <span className="font-bold text-[#0a192f]">Registro inicial criado no sistema.</span>
        if (log.action === 'DELETE') return <span className="font-bold text-red-500">Registro foi excluído permanentemente.</span>
        
        if (log.action === 'UPDATE' && log.old_data && log.new_data) {
            const changes = []
            
            const renderVal = (v: any) => {
                if (v === null || v === undefined || v === '') return 'Vazio';
                if (Array.isArray(v)) {
                    if (v.length === 0) return 'Vazio';
                    return v.map(id => auditRefsMap[String(id)] || String(id)).join(', ');
                }
                if (typeof v === 'string') {
                    try {
                        const parsed = JSON.parse(v);
                        if (Array.isArray(parsed)) {
                            if (parsed.length === 0) return 'Vazio';
                            return parsed.map((id: any) => auditRefsMap[String(id)] || String(id)).join(', ');
                        }
                    } catch {}
                }
                if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
                return auditRefsMap[String(v)] || String(v);
            }

            for (const key of Object.keys(log.new_data)) {
                if (['updated_at', 'created_at', 'created_by', 'updated_by', 'updated_by_name', 'update_token', 'update_token_expires_at', 'foto_url'].includes(key)) continue
                if (JSON.stringify(log.new_data[key]) !== JSON.stringify(log.old_data[key])) {
                     changes.push({
                         field: fieldDict[key] || key,
                         oldVal: renderVal(log.old_data[key]),
                         newVal: renderVal(log.new_data[key])
                     })
                }
            }
            if (changes.length === 0) return <span className="text-gray-400 italic">Atualização interna do sistema (nenhum campo visível alterado).</span>
            
            return (
                <div className="space-y-2 mt-2 break-words">
                    {changes.map((c, i) => (
                        <div key={i} className="text-[11px] sm:text-xs font-medium text-gray-700 bg-white border border-gray-100 p-2.5 rounded-lg flex items-center gap-2 flex-wrap min-w-0 shadow-sm">
                           <span className="font-black text-[#0a192f] shrink-0 uppercase tracking-tight">{c.field}:</span>
                           <span className="text-red-500 line-through decoration-red-200 truncate max-w-[200px]">{String(c.oldVal)}</span>
                           <ArrowRight className="w-3.5 h-3.5 text-gray-400 mx-1 shrink-0" />
                           <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded truncate max-w-[200px]">{String(c.newVal)}</span>
                        </div>
                    ))}
                </div>
            )
        }
        return <span className="text-gray-400 italic">Modificação registrada.</span>
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            {/* BUTTONS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Cargos */}
                <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'roles' ? 'none' : 'roles')}
                    className={`
                        relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 text-left group
                        ${activeSection === 'roles'
                            ? 'bg-blue-50 border-blue-200 shadow-md transform scale-[1.02]'
                            : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-lg'
                        }
                    `}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl shrink-0 transition-colors ${activeSection === 'roles' ? 'bg-blue-200 text-blue-700' : 'bg-blue-50 text-blue-500 group-hover:bg-blue-100'}`}>
                            <Briefcase className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <div className="pr-8">
                            <h3 className="text-xs sm:text-sm font-black text-[#0a192f] uppercase tracking-wider mb-0.5">Cargos</h3>
                            <p className="text-[10px] text-gray-500 font-medium hidden sm:block">Mudanças de cargo</p>
                        </div>
                    </div>
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${activeSection === 'roles' ? 'rotate-90 opacity-100' : 'opacity-0 -translate-x-2'}`}>
                        <ChevronRight className="h-5 w-5 text-blue-500" />
                    </div>
                </button>

                {/* Advertências */}
                <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'warnings' ? 'none' : 'warnings')}
                    className={`
                        relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 text-left group
                        ${activeSection === 'warnings'
                            ? 'bg-red-50 border-red-200 shadow-md transform scale-[1.02]'
                            : 'bg-white border-gray-100 hover:border-red-200 hover:shadow-lg'
                        }
                    `}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl shrink-0 transition-colors ${activeSection === 'warnings' ? 'bg-red-200 text-red-700' : 'bg-red-50 text-red-500 group-hover:bg-red-100'}`}>
                            <AlertTriangle className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <div className="pr-8">
                            <h3 className="text-xs sm:text-sm font-black text-[#0a192f] uppercase tracking-wider mb-0.5">Alertas</h3>
                            <p className="text-[10px] text-gray-500 font-medium hidden sm:block">Registrar infrações</p>
                        </div>
                    </div>
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${activeSection === 'warnings' ? 'rotate-90 opacity-100' : 'opacity-0 -translate-x-2'}`}>
                        <ChevronRight className="h-5 w-5 text-red-500" />
                    </div>
                </button>

                {/* Recrutamento */}
                <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'recruiting' ? 'none' : 'recruiting')}
                    className={`
                        relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 text-left group
                        ${activeSection === 'recruiting'
                            ? 'bg-emerald-50 border-emerald-200 shadow-md transform scale-[1.02]'
                            : 'bg-white border-gray-100 hover:border-emerald-200 hover:shadow-lg'
                        }
                    `}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl shrink-0 transition-colors ${activeSection === 'recruiting' ? 'bg-emerald-200 text-emerald-700' : 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100'}`}>
                            <Users className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <div className="pr-8">
                            <h3 className="text-xs sm:text-sm font-black text-[#0a192f] uppercase tracking-wider mb-0.5">Seleção</h3>
                            <p className="text-[10px] text-gray-500 font-medium hidden sm:block">Histórico de entrevistas</p>
                        </div>
                    </div>
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${activeSection === 'recruiting' ? 'rotate-90 opacity-100' : 'opacity-0 -translate-x-2'}`}>
                        <ChevronRight className="h-5 w-5 text-emerald-500" />
                    </div>
                </button>

                {/* Observações */}
                <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'observations' ? 'none' : 'observations')}
                    className={`
                        relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 text-left group
                        ${activeSection === 'observations'
                            ? 'bg-amber-50 border-amber-200 shadow-md transform scale-[1.02]'
                            : 'bg-white border-gray-100 hover:border-amber-200 hover:shadow-lg'
                        }
                    `}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl shrink-0 transition-colors ${activeSection === 'observations' ? 'bg-amber-200 text-amber-700' : 'bg-amber-50 text-amber-500 group-hover:bg-amber-100'}`}>
                            <FileText className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <div className="pr-8">
                            <h3 className="text-xs sm:text-sm font-black text-[#0a192f] uppercase tracking-wider mb-0.5">Anotações</h3>
                            <p className="text-[10px] text-gray-500 font-medium hidden sm:block">Observações gerais</p>
                        </div>
                    </div>
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${activeSection === 'observations' ? 'rotate-90 opacity-100' : 'opacity-0 -translate-x-2'}`}>
                        <ChevronRight className="h-5 w-5 text-amber-500" />
                    </div>
                </button>

                {/* Organograma */}
                <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'org' ? 'none' : 'org')}
                    className={`
                        relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 text-left group
                        ${activeSection === 'org'
                            ? 'bg-indigo-50 border-indigo-200 shadow-md transform scale-[1.02]'
                            : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-lg'
                        }
                    `}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl shrink-0 transition-colors ${activeSection === 'org' ? 'bg-indigo-200 text-indigo-700' : 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100'}`}>
                            <Network className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <div className="pr-8">
                            <h3 className="text-xs sm:text-sm font-black text-[#0a192f] uppercase tracking-wider mb-0.5">Organograma</h3>
                            <p className="text-[10px] text-gray-500 font-medium hidden sm:block">Hierarquia Completa</p>
                        </div>
                    </div>
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${activeSection === 'org' ? 'rotate-90 opacity-100' : 'opacity-0 -translate-x-2'}`}>
                        <ChevronRight className="h-5 w-5 text-indigo-500" />
                    </div>
                </button>

                {/* Alterações */}
                <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'audits' ? 'none' : 'audits')}
                    className={`
                        relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 text-left group
                        ${activeSection === 'audits'
                            ? 'bg-emerald-50 border-emerald-200 shadow-md transform scale-[1.02]'
                            : 'bg-white border-gray-100 hover:border-emerald-200 hover:shadow-lg'
                        }
                    `}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl shrink-0 transition-colors ${activeSection === 'audits' ? 'bg-emerald-200 text-emerald-700' : 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100'}`}>
                            <Activity className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <div className="pr-8">
                            <h3 className="text-xs sm:text-sm font-black text-[#0a192f] uppercase tracking-wider mb-0.5">Alterações</h3>
                            <p className="text-[10px] text-gray-500 font-medium hidden sm:block">Log de Histórico</p>
                        </div>
                    </div>
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${activeSection === 'audits' ? 'rotate-90 opacity-100' : 'opacity-0 -translate-x-2'}`}>
                        <ChevronRight className="h-5 w-5 text-emerald-500" />
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

                {/* ORGANOGRAMA E HIERARQUIA PANEL */}
                {activeSection === 'org' && (
                    <div className="p-8 animate-in fade-in slide-in-from-top-4 duration-300 space-y-8">
                        <div className="flex items-center gap-3 border-b border-indigo-100 pb-4">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Network className="h-5 w-5" /></div>
                            <h4 className="text-lg font-black text-[#0a192f]">Organograma e Cadeia Hierárquica</h4>
                        </div>

                        {loadingOrg ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-10">
                                {/* Visão Fotográfica Atual */}
                                <div>
                                    <h5 className="font-black text-[#0a192f] mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
                                        <ArrowUpRight className="w-4 h-4 text-gray-400" /> Superiores (Líderes e Sócios)
                                    </h5>
                                    {superiors.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {superiors.map(sup => (
                                                <div key={sup.id} className="flex items-center gap-4 p-4 border border-gray-100 hover:border-indigo-200 bg-white rounded-xl shadow-sm transition-all duration-300">
                                                    {sup.foto_url ? (
                                                        <img src={sup.foto_url} alt={sup.name} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                                            <User className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="overflow-hidden">
                                                        <p className="text-sm font-bold text-[#0a192f] truncate">{sup.name?.split(' ').slice(0, 2).join(' ')}</p>
                                                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider truncate">{sup.role || 'Cargo não definido'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center text-sm font-medium text-gray-400">
                                            Nenhum superior direto registrado.
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h5 className="font-black text-[#0a192f] mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
                                        <ArrowDownRight className="w-4 h-4 text-gray-400" /> Liderados (Inferiores)
                                    </h5>
                                    {inferiors.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {inferiors.map(inf => (
                                                <div key={inf.id} className="flex items-center gap-4 p-4 border border-gray-100 hover:border-emerald-200 bg-white rounded-xl shadow-sm transition-all duration-300">
                                                    {inf.foto_url ? (
                                                        <img src={inf.foto_url} alt={inf.name} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                                            <User className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="overflow-hidden">
                                                        <p className="text-sm font-bold text-[#0a192f] truncate">{inf.name?.split(' ').slice(0, 2).join(' ')}</p>
                                                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider truncate">{inf.role || 'Cargo não definido'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center text-sm font-medium text-gray-400">
                                            Nenhum liderado registrado para este integrante.
                                        </div>
                                    )}
                                </div>

                                {/* Linha do Tempo */}
                                <div>
                                    <h5 className="font-black text-[#0a192f] mb-6 uppercase tracking-widest text-xs border-t border-gray-100 pt-6">Histórico de Alterações</h5>
                                    {hierarchyHistory.length > 0 ? (
                                        <div className="space-y-4">
                                            {hierarchyHistory.map((item, index) => {
                                                const dateObj = new Date(item.change_date)
                                                const dateText = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()} às ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`
                                                const isSelf = item.collaborator_id === formData.id;
                                                const subjectName = isSelf ? "Sua respectiva liderança" : `A equipe de ${item.collaborators?.name || 'Deletado'}`;
                                                
                                                return (
                                                    <div key={item.id || index} className="flex gap-4 p-5 border border-indigo-100 rounded-xl bg-indigo-50/20 hover:bg-indigo-50/50 transition-colors relative shadow-sm">
                                                        <div className="absolute left-6 top-14 bottom-0 w-px bg-indigo-100 hidden md:block"></div>
                                                        <div className="flex-shrink-0 z-10 w-10 h-10 bg-white border border-indigo-200 text-indigo-500 rounded-full flex items-center justify-center">
                                                            {isSelf ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                                                                <h6 className="text-[#0a192f] font-bold text-sm">
                                                                    {isSelf ? 'Mudança nas lideranças superiores' : 'Mudança nos liderados diretos'}
                                                                </h6>
                                                                <span className="text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
                                                                    {dateText}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-600 mb-3">{subjectName} sofreu alteração.</p>
                                                            
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
                                                                <div className="bg-red-50/50 border border-red-100 rounded-lg p-3">
                                                                    <p className="font-black text-red-400 uppercase tracking-widest mb-1">Líderes Removidos / Antigos</p>
                                                                    <div className="text-gray-600 font-medium whitespace-pre-wrap break-all">
                                                                        {(() => {
                                                                            const p = item.old_partner_ids || [];
                                                                            const l = item.old_leader_ids || [];
                                                                            const all = [...p, ...l].filter(Boolean);
                                                                            if (all.length === 0) return 'Nenhuma exclusão.';
                                                                            
                                                                            const names = all.map((id: any) => item._resolvedNamesMap?.[String(id)] || 'Integrante Deletado');
                                                                            return <ul className="list-disc pl-4 space-y-1 mt-1">{names.map((name, i) => <li key={i}>{name}</li>)}</ul>;
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                                <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3">
                                                                    <p className="font-black text-emerald-500 uppercase tracking-widest mb-1">Líderes Adicionados / Novos</p>
                                                                    <div className="text-gray-600 font-medium whitespace-pre-wrap break-all">
                                                                        {(() => {
                                                                            const p = item.new_partner_ids || [];
                                                                            const l = item.new_leader_ids || [];
                                                                            const all = [...p, ...l].filter(Boolean);
                                                                            if (all.length === 0) return 'Nenhuma adição.';
                                                                            
                                                                            const names = all.map((id: any) => item._resolvedNamesMap?.[String(id)] || 'Integrante Deletado');
                                                                            return <ul className="list-disc pl-4 space-y-1 mt-1">{names.map((name, i) => <li key={i}>{name}</li>)}</ul>;
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <p className="text-[9px] text-gray-400 mt-3 text-right">Editado por: {item.changed_by_name || 'Sistema'}</p>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Network className="w-12 h-12 text-gray-300 mx-auto mb-3 opacity-50" />
                                            <p className="text-sm font-medium text-gray-500">Nenhum histórico de hierarquia encontrado para este integrante.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeSection === 'audits' && (
                    <div className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-xl shadow-emerald-900/5 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-3 border-b border-emerald-100 pb-4 mb-6">
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><Activity className="h-5 w-5" /></div>
                            <h4 className="text-lg font-black text-[#0a192f]">Histórico de Alterações do Perfil</h4>
                        </div>

                        {loadingAudit ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                            </div>
                        ) : auditHistory.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3 opacity-50" />
                                <p className="text-sm font-medium text-gray-500">Nenhum registro de auditoria encontrado.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {auditHistory.map((log) => {
                                    const date = new Date(log.changed_at)
                                    return (
                                        <div key={log.id} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 hover:border-emerald-200 transition-colors">
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                    <span className="bg-white border border-gray-200 px-2 py-1 rounded text-[#1e3a8a]">{date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR')}</span>
                                                    <span>Por: <strong className="text-[#0a192f]">{log.user_name}</strong></span>
                                                </div>
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                                                    log.action === 'INSERT' ? 'bg-blue-100 text-blue-700' :
                                                    log.action === 'UPDATE' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {log.action === 'INSERT' ? 'Criação' : log.action === 'UPDATE' ? 'Edição' : 'Exclusão'}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {formatDiffAudit(log)}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div >
    )
}
