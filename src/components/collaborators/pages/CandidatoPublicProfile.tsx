import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import {
    User,
    MapPin,
    Briefcase,
    Mail,
    Phone,
    Linkedin,
    BookOpen,
    FileText,
    Download,
    AlertCircle,
    GraduationCap,
    Globe,
    Award,
    ShieldCheck,
    Building2,
    Calendar,
    MessageSquare,
    ThumbsUp,
    ThumbsDown,
    Send
} from 'lucide-react'

// Mapeamento amigável das chaves da entrevista para labels
const ENTREVISTA_LABELS: Record<string, string> = {
    data_entrevista: "Entrevista realizada em",
    entrevistadoras: "Entrevistadoras",
    pretensao_salarial: "Pretensão Salarial",
    pontos_fortes: "Pontos Fortes",
    pontos_a_desenvolver: "Pontos a Desenvolver",
    recomendacao_final: "Recomendação Final",
    abertura_apresentacao: "Abertura e Apresentação / Trajetória",
    experiencia_tecnica: "Experiência Técnica e Áreas de Atuação",
    aderencia_atividades: "Aderência às atividades",
    conclusao: "Conclusão",
    disponibilidade: "Disponibilidade",
    disponibilidade_inicio: "Disponibilidade para início",
    reside: "Reside (Local)",
    ms_office: "Conhecimento em MS Office",
    formacao_academica: "Detalhes de Formação",
    horario_estudo: "Horário de Estudo",
    melhor_horario_estagio: "Melhor horário de estágio",
    ingles: "Nível de Inglês",
    experiencia_prof_pessoal: "Experiência profissional e pessoal",
    exp_areas_especializacao: "Principais áreas de especialização",
    exp_contencioso_consultivo: "Atuação com contencioso e consultivo",
    exp_projeto_relevante: "Projeto relevante",
    exp_atualizacao_legislacao: "Atualização de legislação",
    lid_experiencia: "Experiência com liderança",
    lid_delegacao: "Delegação e acompanhamento",
    lid_conflitos: "Resolução de conflitos internos",
    rel_clientes_dificeis: "Relacionamento com clientes difíceis",
    rel_capacidade_negociacao: "Capacidade de negociação",
    rel_comunicacao_nao_tecnico: "Comunicação com áreas não técnicas",
    tomada_decisao_dificil: "Tomada de decisão difícil",
    ali_papel_juridico: "Papel do jurídico na estratégia",
    ali_projetos_multidisciplinares: "Projetos multidisciplinares",
    ali_atuacao_preventiva: "Atuação preventiva vs reativa",
    adeq_interesse: "Interesse na organização",
    adeq_valores: "Alinhamento de valores",
    adeq_projeto_futuro: "Projetos futuros (3 a 5 anos)"
};

export function CandidatoPublicProfile() {
    const { identifier } = useParams<{ identifier: string }>()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [profileData, setProfileData] = useState<any>(null)

    // Feedback state
    const [avaliacaoForm, setAvaliacaoForm] = useState({
        voto: '' as 'Recomendado' | 'Não Recomendado' | '',
        obs: ''
    })
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
    const [feedbackSuccess, setFeedbackSuccess] = useState(false)

    useEffect(() => {
        if (!identifier) {
            setError('Identificador de candidato não fornecido na URL.')
            setLoading(false)
            return
        }

        const fetchProfile = async () => {
            try {
                setLoading(true)
                setError(null)

                const { data, error: rpcError } = await fallbackFetchProfile(identifier);

                if (rpcError) throw rpcError
                if (!data || !data.candidato) throw new Error('Candidato não encontrado.')

                setProfileData(data)

                // Set initial feedback state if already evaluated
                if (data.candidato.data_avaliacao) {
                    setAvaliacaoForm({
                        voto: data.candidato.avaliacao_lider || '',
                        obs: data.candidato.obs_lider || ''
                    });
                    setFeedbackSuccess(true);
                }
            } catch (err: any) {
                console.error('Error fetching public candidate profile:', err)
                setError(err.message || 'Ocorreu um erro ao carregar o perfil do candidato.')
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [identifier])

    const fallbackFetchProfile = async (identifierParam: string) => {
        // First try the RPC
        const { data, error } = await supabase.rpc('get_candidato_public_profile_v2', {
            p_identifier: identifierParam
        });
        return { data, error };
    };

    const handleFeedbackSubmit = async () => {
        if (!avaliacaoForm.voto) return;

        try {
            setIsSubmittingFeedback(true);
            const { error } = await supabase.rpc('save_candidato_feedback_v2', {
                p_identifier: identifier,
                p_avaliacao: avaliacaoForm.voto,
                p_obs: avaliacaoForm.obs
            });

            if (error) throw error;

            setFeedbackSuccess(true);
        } catch (err) {
            console.error('Erro ao salvar avaliação:', err);
            alert('Não foi possível salvar sua avaliação no momento. Tente novamente mais tarde.');
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a8a] mb-4"></div>
                <p className="text-[#1e3a8a] font-medium animate-pulse">Carregando perfil do talento...</p>
            </div>
        )
    }

    if (error || !profileData) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 mb-2">Acesso Indisponível</h2>
                    <p className="text-gray-500 mb-6">{error || 'Não foi possível carregar as informações deste link.'}</p>
                    <button
                        onClick={() => window.close()}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-xl transition-colors"
                    >
                        Fechar Janela
                    </button>
                </div>
            </div>
        )
    }

    const { candidato, documentos, experiencias } = profileData

    // Parsed fields
    const tags = (candidato.perfil || '').split('\n').filter((t: string) => t.trim())
    const hasContactInfo = candidato.email || candidato.telefone || candidato.linkedin
    const locationStr = [candidato.city, candidato.state].filter(Boolean).join(' - ')

    return (
        <div className="min-h-screen bg-gray-50 selection:bg-blue-100 selection:text-blue-900 pb-12">
            {/* Header / Cover */}
            <div className="h-32 md:h-48 bg-gradient-to-r from-[#1e3a8a] to-[#0f1d45] w-full relative">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-24 relative z-10">

                {/* Main Profile Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-white p-6 md:p-10 mb-8 backdrop-blur-sm">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start">

                        {/* Avatar */}
                        <div className="relative group shrink-0">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                                {candidato.photo_url ? (
                                    <img src={candidato.photo_url} alt={candidato.nome} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-16 h-16 text-blue-200" />
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-2 border-white shadow-sm flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Verificado
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="flex-1 text-center md:text-left pt-2">
                            <div className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black tracking-widest uppercase mb-3">
                                Candidato / Talento (ID: {candidato.candidato_id_text || 'SN'})
                            </div>

                            <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
                                {candidato.nome}
                            </h1>

                            <h2 className="text-lg md:text-xl font-medium text-gray-600 mb-4 flex items-center justify-center md:justify-start gap-2">
                                <Briefcase className="w-5 h-5 text-gray-400" />
                                {candidato.role || 'Cargo não informado'}
                                {candidato.area && <span className="opacity-50">|</span>}
                                {candidato.area && <span className="text-gray-500 text-sm font-bold bg-gray-100 px-2.5 py-0.5 rounded-lg">{candidato.area}</span>}
                            </h2>

                            {/* Badges / Location */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                                {locationStr && (
                                    <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                                        <MapPin className="w-4 h-4 text-blue-500" />
                                        <span className="font-semibold">{locationStr}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm">
                                    <Award className="w-4 h-4 text-emerald-500" />
                                    <span className="font-semibold text-emerald-700">Aprovado pelo RH</span>
                                </div>
                            </div>

                        </div>

                    </div>

                    {/* Contact Bar */}
                    {hasContactInfo && (
                        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-4 items-center justify-center xl:justify-start">
                            {candidato.email && (
                                <a href={`mailto:${candidato.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors bg-gray-50 hover:bg-blue-50 px-4 py-2 rounded-xl">
                                    <Mail className="w-4 h-4" /> {candidato.email}
                                </a>
                            )}
                            {candidato.telefone && (
                                <a href={`tel:${candidato.telefone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors bg-gray-50 hover:bg-blue-50 px-4 py-2 rounded-xl">
                                    <Phone className="w-4 h-4" /> {candidato.telefone}
                                </a>
                            )}
                            {candidato.linkedin && (
                                <a href={candidato.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl font-medium">
                                    <Linkedin className="w-4 h-4" /> Perfil LinkedIn
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Column */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Resumo Profissional */}
                        {candidato.resumo_cv && (
                            <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Resumo Profissional
                                </h3>
                                <div className="prose prose-sm md:prose-base text-gray-700 leading-relaxed max-w-none">
                                    <p className="whitespace-pre-wrap">{candidato.resumo_cv}</p>
                                </div>
                            </section>
                        )}

                        {/* Experiências Profissionais */}
                        {experiencias && experiencias.length > 0 && (
                            <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" /> Experiência Profissional
                                </h3>

                                <div className="space-y-8">
                                    {experiencias.map((exp: any, index: number) => (
                                        <div key={exp.id || index} className="relative pl-6 md:pl-8 border-l-2 border-gray-100 last:border-transparent">
                                            <div className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full -left-[9px] top-1"></div>

                                            <div className="-mt-1.5 mb-2">
                                                <h4 className="text-lg font-bold text-gray-900">{exp.cargo}</h4>
                                                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-blue-700 mt-1">
                                                    <Building2 className="w-4 h-4" /> {exp.empresa}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {exp.data_inicio ? new Date(exp.data_inicio).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Início não informado'} - {' '}
                                                {exp.data_fim ? new Date(exp.data_fim).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Até o momento'}
                                            </div>

                                            {exp.perfil && (
                                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{exp.perfil}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Escolaridade (from education_history JSON) */}
                        {candidato.education_history && candidato.education_history.length > 0 && (
                            <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4" /> Formação Acadêmica
                                </h3>

                                <div className="space-y-6">
                                    {candidato.education_history.map((edu: any, index: number) => (
                                        <div key={index} className="flex gap-4 items-start bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                                                <BookOpen className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-bold text-gray-900">{edu.curso || 'Curso não informado'}</h4>
                                                <p className="text-sm font-semibold text-[#1e3a8a] mt-0.5">{edu.instituicao || 'Instituição não informada'}</p>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs font-medium text-gray-500">
                                                    <span>Nível: <strong className="text-gray-700">{edu.nivel || '-'}</strong></span>
                                                    <span>Status: <strong className="text-gray-700">{edu.status || '-'}</strong></span>
                                                    {edu.data_inicio && <span>Início: <strong className="text-gray-700">{edu.data_inicio.split('-').reverse().join('/')}</strong></span>}
                                                    {edu.data_conclusao && <span>Conclusão: <strong className="text-gray-700">{edu.data_conclusao.split('-').reverse().join('/')}</strong></span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Dados da Entrevista */}
                        {candidato.entrevista_dados && Object.keys(candidato.entrevista_dados).filter(k => candidato.entrevista_dados[k] && k !== 'cargo' && k !== 'vaga').length > 0 && (
                            <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="text-sm font-black text-[#1e3a8a] uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Relatório de Entrevista
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                                    {/* Mostrar os campos básicos primeiro (Data, Entrevistadoras, Pretensão, Recom.) */}
                                    {['data_entrevista', 'entrevistadoras', 'pretensao_salarial', 'recomendacao_final'].map(key => {
                                        const value = candidato.entrevista_dados[key];
                                        if (!value) return null;
                                        const displayValue = key === 'data_entrevista' ? new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : value;
                                        return (
                                            <div key={key} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{ENTREVISTA_LABELS[key] || key}</p>
                                                <p className="text-sm font-bold text-gray-800">{displayValue}</p>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Demais campos longos e perguntas abertas */}
                                <div className="mt-8 space-y-6">
                                    {Object.entries(candidato.entrevista_dados)
                                        .filter(([k, v]) => v && !['cargo', 'vaga', 'data_entrevista', 'entrevistadoras', 'pretensao_salarial', 'recomendacao_final', 'pontos_fortes', 'pontos_a_desenvolver'].includes(k))
                                        .map(([key, value]) => (
                                            <div key={key} className="relative pl-4 border-l-2 border-blue-200">
                                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{ENTREVISTA_LABELS[key] || key.replace(/_/g, ' ')}</h4>
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{String(value)}</p>
                                            </div>
                                        ))}
                                </div>

                                {/* Pontos Fortes e a Desenvolver */}
                                {(candidato.entrevista_dados.pontos_fortes || candidato.entrevista_dados.pontos_a_desenvolver) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-gray-100">
                                        {candidato.entrevista_dados.pontos_fortes && (
                                            <div className="bg-green-50/50 p-5 rounded-2xl border border-green-100">
                                                <h4 className="text-xs font-black text-green-700 uppercase tracking-wider mb-2">Pontos Fortes</h4>
                                                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{candidato.entrevista_dados.pontos_fortes}</p>
                                            </div>
                                        )}
                                        {candidato.entrevista_dados.pontos_a_desenvolver && (
                                            <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
                                                <h4 className="text-xs font-black text-amber-700 uppercase tracking-wider mb-2">Pontos a Desenvolver</h4>
                                                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{candidato.entrevista_dados.pontos_a_desenvolver}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </section>
                        )}

                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">

                        {/* Skills & Tags */}
                        {tags.length > 0 && (
                            <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Competências & Match</h3>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag: string, i: number) => (
                                        <span key={i} className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-sm">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Documentos */}
                        {documentos && documentos.length > 0 && (
                            <section className="bg-blue-50/50 p-6 md:p-8 rounded-3xl border border-blue-100">
                                <h3 className="text-sm font-black text-[#1e3a8a]/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Documentos Anexados
                                </h3>
                                <div className="flex flex-col gap-3">
                                    {documentos.map((doc: any) => (
                                        <a
                                            key={doc.id}
                                            href={doc.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group flex flex-col p-4 bg-white rounded-2xl border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">{doc.categoria}</p>
                                                    <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-700 transition-colors" title={doc.nome_arquivo}>
                                                        {doc.nome_arquivo}
                                                    </p>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-blue-50 group-hover:bg-blue-600 flex items-center justify-center shrink-0 transition-colors">
                                                    <Download className="w-4 h-4 text-blue-600 group-hover:text-white" />
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Idiomas */}
                        {candidato.idiomas && (
                            <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Globe className="w-4 h-4" /> Idiomas
                                </h3>
                                <p className="text-sm font-semibold text-gray-700 whitespace-pre-wrap leading-relaxed">{candidato.idiomas}</p>
                            </section>
                        )}

                        {/* Atividades Acadêmicas */}
                        {candidato.atividades_academicas && (
                            <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" /> Atividades Extras
                                </h3>
                                <p className="text-sm font-medium text-gray-600 whitespace-pre-wrap leading-relaxed">{candidato.atividades_academicas}</p>
                            </section>
                        )}

                    </div>

                </div>

                {/* Área de Avaliação do Líder */}
                <div className="mt-8 bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-blue-100 max-w-4xl mx-auto">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-black text-[#0a192f] mb-2">Avaliação do Perfil</h2>
                        <p className="text-sm text-gray-500 font-medium">
                            {feedbackSuccess
                                ? 'Sua avaliação já foi registrada no sistema do RH.'
                                : 'Deixe sua avaliação sobre este talento para a equipe de recrutamento.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <button
                            onClick={() => !feedbackSuccess && setAvaliacaoForm({ ...avaliacaoForm, voto: 'Recomendado' })}
                            disabled={feedbackSuccess}
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${avaliacaoForm.voto === 'Recomendado'
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-md transform scale-[1.02]'
                                    : feedbackSuccess
                                        ? 'border-gray-100 bg-gray-50 text-gray-400 opacity-50 cursor-not-allowed'
                                        : 'border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/50 text-gray-600'
                                }`}
                        >
                            <div className={`p-3 rounded-full mb-3 ${avaliacaoForm.voto === 'Recomendado' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                <ThumbsUp className="w-8 h-8" />
                            </div>
                            <span className="font-bold">Recomendado</span>
                        </button>

                        <button
                            onClick={() => !feedbackSuccess && setAvaliacaoForm({ ...avaliacaoForm, voto: 'Não Recomendado' })}
                            disabled={feedbackSuccess}
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${avaliacaoForm.voto === 'Não Recomendado'
                                    ? 'border-red-500 bg-red-50 text-red-800 shadow-md transform scale-[1.02]'
                                    : feedbackSuccess
                                        ? 'border-gray-100 bg-gray-50 text-gray-400 opacity-50 cursor-not-allowed'
                                        : 'border-gray-200 hover:border-red-200 hover:bg-red-50/50 text-gray-600'
                                }`}
                        >
                            <div className={`p-3 rounded-full mb-3 ${avaliacaoForm.voto === 'Não Recomendado' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                <ThumbsDown className="w-8 h-8" />
                            </div>
                            <span className="font-bold">Não Recomendado</span>
                        </button>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">
                            Observações do Líder (Opcional)
                        </label>
                        <textarea
                            className={`w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm outline-none transition-all shadow-sm min-h-[100px] resize-y font-medium text-gray-700 ${feedbackSuccess ? 'disabled:opacity-70 disabled:bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'}`}
                            value={avaliacaoForm.obs}
                            onChange={(e) => setAvaliacaoForm({ ...avaliacaoForm, obs: e.target.value })}
                            placeholder={feedbackSuccess ? '' : "Escreva seus comentários, razões da recusa ou pontos de atenção para entrevista final..."}
                            disabled={feedbackSuccess}
                        />
                    </div>

                    {!feedbackSuccess && (
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleFeedbackSubmit}
                                disabled={!avaliacaoForm.voto || isSubmittingFeedback}
                                className="flex items-center gap-2 px-8 py-3 bg-[#1e3a8a] text-white rounded-xl text-sm font-bold uppercase tracking-wider shadow-lg hover:bg-blue-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 hover:shadow-blue-900/20"
                            >
                                {isSubmittingFeedback ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" /> Enviar Avaliação
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-12 text-center pb-8 border-t border-gray-200 pt-8">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Perfil confidencial • Acesso restrito
                    </p>
                </div>

            </div>
        </div>
    )
}
