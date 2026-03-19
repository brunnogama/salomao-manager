import { useState, useEffect } from 'react'
import {
    User,
    AlertCircle,
    Edit2,
    Mail,
    Phone,
    Briefcase,
    MapPin,
    Tag,
    FileText,
    Calendar,
    X,
    Linkedin,
    GraduationCap,
    Languages,
    Building2,
    Clock
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { formatPhoneDisplay, formatNameDisplay } from '../utils/colaboradoresUtils'

interface CandidatoViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidatoId: string | null;
    onEdit: (id: string) => void;
    roleOptions?: { value: string; label: string }[];
    locationOptions?: { value: string; label: string }[];
}

export function CandidatoViewModal({ isOpen, onClose, candidatoId, onEdit, roleOptions = [], locationOptions = [] }: CandidatoViewModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [candidato, setCandidato] = useState<any>(null)
    const [experiencias, setExperiencias] = useState<any[]>([])
    const [historico, setHistorico] = useState<any[]>([])

    useEffect(() => {
        if (isOpen && candidatoId) {
            fetchCandidato(candidatoId)
        } else {
            setCandidato(null)
            setExperiencias([])
            setHistorico([])
        }
    }, [isOpen, candidatoId])

    const fetchCandidato = async (id: string) => {
        try {
            setLoading(true)
            setError(null)

            const { data, error: dbError } = await supabase
                .from('candidatos')
                .select(`
                    *,
                    candidato_experiencias(*),
                    candidato_historico(*)
                `)
                .eq('id', id)
                .single()

            if (dbError) throw dbError
            setCandidato(data)
            setExperiencias(data?.candidato_experiencias || [])
            setHistorico(data?.candidato_historico || [])
        } catch (err: any) {
            console.error('Error fetching candidato:', err)
            setError('Erro ao carregar dados do candidato.')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    }

    const getStatusColor = (status?: string) => {
        if (status?.startsWith('Reprovado')) return 'bg-red-50 text-red-700 border-red-200'
        switch (status) {
            case 'Aberto': return 'bg-blue-50 text-blue-700 border-blue-200'
            case 'Em Processo': return 'bg-amber-50 text-amber-700 border-amber-200'
            case 'Aprovado em Vaga': return 'bg-green-50 text-green-700 border-green-200'
            case 'Reaproveitamento': return 'bg-amber-50 text-amber-700 border-amber-200'
            default: return 'bg-gray-50 text-gray-600 border-gray-200'
        }
    }

    const roleName = roleOptions.find(r => String(r.value) === String(candidato?.role))?.label || candidato?.role || '-'
    const localName = locationOptions.find(l => String(l.value) === String(candidato?.local))?.label || candidato?.local || '-'

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">

                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                            <User className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-[16px] font-black tracking-tight uppercase flex items-center gap-2 text-[#0a192f]">
                                Visualizar Candidato
                            </h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                {candidato?.candidato_id_text || 'ID Automático'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    <div className="space-y-8">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                            </div>
                        ) : candidato ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

                                {/* Nome + Status */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0 h-16 w-16 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 border-2 border-white shadow flex items-center justify-center">
                                            <span className="text-2xl font-black text-emerald-700">{candidato.nome?.charAt(0) || '?'}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-[#0a192f]">{formatNameDisplay(candidato.nome) || 'Sem nome'}</h3>
                                            <p className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                                                <Briefcase className="w-3.5 h-3.5" /> {roleName}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border ${getStatusColor(candidato.status_selecao)}`}>
                                        {candidato.status_selecao || 'Sem status'}
                                    </span>
                                </div>

                                {/* Cards de contato */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> E-mail</span>
                                        <span className="text-sm font-semibold text-gray-700 truncate">{candidato.email || '-'}</span>
                                    </div>
                                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Telefone</span>
                                        <span className="text-sm font-semibold text-gray-700">{formatPhoneDisplay(candidato.telefone) || '-'}</span>
                                    </div>
                                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Local</span>
                                        <span className="text-sm font-semibold text-gray-700">{localName}</span>
                                    </div>
                                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Nascimento</span>
                                        <span className="text-sm font-semibold text-gray-700">{formatDate(candidato.birthday)}</span>
                                    </div>
                                </div>

                                {/* LinkedIn */}
                                {candidato.linkedin_url && (
                                    <div className="flex items-center gap-2">
                                        <Linkedin className="w-4 h-4 text-blue-600" />
                                        <a href={candidato.linkedin_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:underline truncate">
                                            {candidato.linkedin_url}
                                        </a>
                                    </div>
                                )}

                                {/* Indicado por */}
                                {candidato.indicado_por && (
                                    <section>
                                        <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-3">Indicação</h3>
                                        <p className="text-sm font-semibold text-gray-700 ml-1">{candidato.indicado_por}</p>
                                    </section>
                                )}

                                {/* Perfil (Tags) */}
                                {candidato.perfil && (
                                    <section>
                                        <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Perfil (Tags)</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {candidato.perfil.split('\n').filter((t: string) => t.trim()).map((t: string, i: number) => (
                                                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                                                    <Tag className="w-3 h-3" /> {t.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Resumo CV */}
                                {candidato.resumo_cv && (
                                    <section>
                                        <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Resumo do Currículo</h3>
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                            {candidato.resumo_cv}
                                        </div>
                                    </section>
                                )}

                                {/* Formação e Idiomas */}
                                {(candidato.atividades_academicas || candidato.idiomas) && (
                                    <section>
                                        <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Formação e Idiomas</h3>
                                        <div className="flex flex-col gap-6">
                                            {candidato.atividades_academicas && (
                                                <div>
                                                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Atividades Acadêmicas e Extracurriculares</span>
                                                    <div className="flex flex-col gap-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                                        {candidato.atividades_academicas.split(/[\n]/).map((atividade: string) => atividade.trim()).filter(Boolean).map((atividade: string, idx: number) => (
                                                            <div key={idx} className="flex items-center bg-white border border-gray-200 px-3 py-2.5 rounded-lg shadow-sm">
                                                                <span className="text-sm font-semibold text-gray-700">{atividade}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {candidato.idiomas && (
                                                <div>
                                                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5"><Languages className="w-3.5 h-3.5" /> Idiomas</span>
                                                    <div className="flex flex-col gap-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                                        {candidato.idiomas.split(/[\n,]/).map((idioma: string) => idioma.trim()).filter(Boolean).map((idioma: string, idx: number) => (
                                                            <div key={idx} className="flex items-center bg-white border border-gray-200 px-3 py-2.5 rounded-lg shadow-sm">
                                                                <span className="text-sm font-semibold text-gray-700">{idioma}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                )}

                                {/* Experiências Profissionais */}
                                {experiencias.length > 0 && (
                                    <section>
                                        <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Experiências Profissionais</h3>
                                        <div className="space-y-3">
                                            {experiencias.map((exp, i) => (
                                                <div key={exp.id || i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="text-sm font-bold text-[#0a192f]">{exp.cargo || 'Cargo não informado'}</p>
                                                            <p className="text-xs text-gray-500 font-semibold">{exp.empresa || 'Empresa não informada'}</p>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatDate(exp.data_inicio)} — {exp.data_fim ? formatDate(exp.data_fim) : 'Atual'}
                                                        </span>
                                                    </div>
                                                    {exp.perfil && (
                                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                                            {exp.perfil.split('\n').filter((l: string) => l.trim()).map((tag: string, j: number) => (
                                                                <span key={j} className="px-2 py-0.5 bg-gray-50 text-gray-600 border border-gray-100 rounded text-[10px] font-bold">
                                                                    {tag.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Histórico de Seleção */}
                                {historico.length > 0 && (
                                    <section>
                                        <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Histórico de Seleção</h3>
                                        <div className="space-y-2">
                                            {historico.sort((a, b) => new Date(b.data_registro || 0).getTime() - new Date(a.data_registro || 0).getTime()).map((h, i) => (
                                                <div key={h.id || i} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-black uppercase tracking-wider">
                                                            {h.tipo || 'Evento'}
                                                        </span>
                                                        <span className="text-sm text-gray-700">{h.observacao || '-'}</span>
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 font-bold">{formatDate(h.data_registro)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Motivo Reprovação */}
                                {candidato.status_selecao?.startsWith('Reprovado') && candidato.motivo_reprovacao && (
                                    <section>
                                        <h3 className="text-[9px] font-black text-red-500 uppercase tracking-widest border-b border-red-100 pb-2 mb-4">⚠️ Motivo da Reprovação</h3>
                                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-sm text-red-700 whitespace-pre-wrap leading-relaxed font-medium">
                                            {candidato.motivo_reprovacao}
                                        </div>
                                    </section>
                                )}

                            </div>
                        ) : null}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
                    >
                        Fechar
                    </button>
                    {candidato && (
                        <button
                            type="button"
                            onClick={() => {
                                onClose()
                                onEdit(candidato.id)
                            }}
                            className="bg-[#1e3a8a] text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-[#1e3a8a]/90 transition-all flex items-center gap-2 shadow-lg shadow-[#1e3a8a]/20 active:scale-95 hover:-translate-y-0.5"
                        >
                            <Edit2 className="w-4 h-4" />
                            Editar Candidato
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
