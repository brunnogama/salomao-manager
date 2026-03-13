import { useState, useEffect, useRef } from 'react'
import { Printer, ChevronDown } from 'lucide-react'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { ManagedSelect } from '../../crm/ManagedSelect'
import { supabase } from '../../../lib/supabase'
import { maskCurrencyInput } from '../utils/colaboradoresUtils'
import { CARGOS_ADMINISTRATIVA, CARGOS_JURIDICA } from '../utils/cargosAtuacoesUtils'

interface CandidatoEntrevistaSectionProps {
    formData: any
    setFormData: (data: any) => void
    isViewMode?: boolean
    onShowReprovadoModal?: (status: string) => void
}

export function CandidatoEntrevistaSection({
    formData,
    setFormData,
    isViewMode = false,
    onShowReprovadoModal
}: CandidatoEntrevistaSectionProps) {
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false)
    const statusMenuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
                setIsStatusMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleStatusSelecaoChange = (value: string) => {
        setIsStatusMenuOpen(false);
        if (value.startsWith('Reprovado') && onShowReprovadoModal) {
            onShowReprovadoModal(value);
        } else {
            setFormData({ ...formData, status_selecao: value })
        }
    };
    const [vagasAbertas, setVagasAbertas] = useState<any[]>([])
    const [roleNameCache, setRoleNameCache] = useState<string>('');

    useEffect(() => {
        async function fetchVagas() {
            const { data } = await supabase
                .from('vagas')
                .select('id, vaga_id_text, role:roles(name)')
                .in('status', ['Aberta'])

            if (data) {
                setVagasAbertas(data.map(v => ({
                    id: v.id,
                    name: `${v.vaga_id_text} (${v.role ? (v.role as any).name : 'Sem Cargo'})`
                })))
            }
        }
        fetchVagas()
    }, [])

    const area = formData.area || ''

    // Dados da entrevista ficam salvos dentro de formData.entrevista_dados (jsonb)
    const entrevista = formData.entrevista_dados || {}

    useEffect(() => {
        async function fetchRoleName() {
            const roleId = formData.role || formData.entrevista_dados?.cargo;
            if (!roleId) {
                setRoleNameCache('');
                return;
            }
            const roleStr = String(roleId);
            if (roleStr.toLowerCase().includes('advogado') || isNaN(Number(roleId)) && !roleStr.includes('-')) {
                // Se já for uma string contendo 'advogado' ou um texto comum (não-UUID, não-número)
                setRoleNameCache(roleStr);
                return;
            }
            try {
                const { data } = await supabase.from('roles').select('name').eq('id', roleId).maybeSingle();
                if (data && data.name) {
                    setRoleNameCache(data.name);
                } else {
                    setRoleNameCache(roleStr);
                }
            } catch (err) {
                setRoleNameCache(roleStr);
            }
        }
        fetchRoleName();
    }, [formData.role, formData.entrevista_dados?.cargo]);

    const isAdvogado = area === 'Jurídica' && typeof roleNameCache === 'string' && roleNameCache.toLowerCase().includes('advogado');

    const handleEntrevistaChange = (field: string, value: any) => {
        setFormData({
            ...formData,
            entrevista_dados: {
                ...entrevista,
                [field]: value
            }
        })
    }

    const handlePrint = () => {
        window.print()
    }

    if (!area) {
        return (
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                <p className="text-amber-800 font-bold mb-2">Área não definida</p>
                <p className="text-amber-700 text-sm">Por favor, selecione a Área (Administrativa ou Jurídica) na aba de Dados Corporativos para exibir os campos corretos da entrevista.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 print:space-y-4 print:text-black">
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-section, .print-section * {
                        visibility: visible;
                    }
                    .print-section {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 2cm;
                    }
                    .no-print {
                        display: none !important;
                    }
                    input, textarea, select {
                        border: none !important;
                        background: transparent !important;
                        box-shadow: none !important;
                        resize: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        -webkit-appearance: none;
                    }
                }
            `}</style>

            <div className="flex justify-between items-center no-print bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div>
                    <h3 className="text-lg font-black text-[#0a192f] uppercase tracking-wide">Registro de Entrevista</h3>
                    <p className="text-sm text-gray-500 font-medium">Área {area}</p>
                </div>
                <button
                    onClick={handlePrint}
                    className="flex flex-col sm:flex-row items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-bold uppercase tracking-wider"
                >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir</span>
                </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 print-section">
                <div className="text-center hidden print:block mb-8 pb-4 border-b-2 border-gray-800">
                    <h1 className="text-2xl font-black uppercase tracking-widest text-black">Relatório de Entrevista - {area}</h1>
                    <p className="text-lg font-bold mt-2">{formData.nome || formData.name || 'Candidato(a)'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block print:text-gray-800 print:text-xs">Entrevista realizada em</label>
                        <input
                            type="date"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm disabled:opacity-70 font-medium"
                            value={entrevista.data_entrevista || ''}
                            onChange={(e) => handleEntrevistaChange('data_entrevista', e.target.value)}
                            disabled={isViewMode}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block print:text-gray-800 print:text-xs">
                        Resumo do Currículo <span className="text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full ml-2 lowercase tracking-normal font-bold">Gerado por IA</span>
                    </label>
                    <textarea
                        className="w-full bg-purple-50/30 border border-purple-100 rounded-xl p-4 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all shadow-sm disabled:opacity-70 min-h-[100px] resize-y font-medium text-gray-700"
                        value={formData.resumo_cv || ''}
                        disabled={true}
                        placeholder="Utilize o botão da IA na aba de Perfil para gerar este resumo."
                    />
                </div>

                {area === 'Administrativa' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SearchableSelect
                                label="Entrevistadoras"
                                placeholder="Selecione..."
                                value={entrevista.entrevistadoras || ''}
                                onChange={(val) => handleEntrevistaChange('entrevistadoras', val)}
                                disabled={isViewMode}
                                options={[
                                    { id: 'Karina Reis Dos Prazeres', name: 'Karina Reis Dos Prazeres' },
                                    { id: 'Tatiana Gonçalves Gomes', name: 'Tatiana Gonçalves Gomes' },
                                    { id: 'Karina e Tatiana', name: 'Karina e Tatiana' }
                                ]}
                            />

                            <ManagedSelect
                                label="Cargo"
                                placeholder="..."
                                value={entrevista.cargo || formData.role || ''}
                                onChange={(val) => handleEntrevistaChange('cargo', val)}
                                disabled={isViewMode}
                                tableName="roles"
                                clientFilter={(item: any) => {
                                    const roleName = item.name;
                                    if (area === 'Jurídica') return CARGOS_JURIDICA.includes(roleName);
                                    if (area === 'Administrativa') return CARGOS_ADMINISTRATIVA.includes(roleName);
                                    return true;
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <SearchableSelect
                                label="Vaga"
                                placeholder="Nome da vaga em aberto..."
                                value={entrevista.vaga || ''}
                                onChange={(val) => handleEntrevistaChange('vaga', val)}
                                disabled={isViewMode}
                                options={vagasAbertas}
                                allowCustom={true}
                                disableFormatting={true}
                            />
                        </div>

                        {[
                            { key: 'abertura_apresentacao', label: 'Abertura e Apresentação' },
                            { key: 'experiencia_tecnica', label: 'Experiência Técnica e Áreas de Atuação' },
                            { key: 'aderencia_atividades', label: 'Aderência às atividades administrativa e de mensageiro' },
                            { key: 'conclusao', label: 'Conclusão' },
                            { key: 'disponibilidade', label: 'Disponibilidade' }
                        ].map(field => (
                            <div key={field.key} className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block print:text-gray-800 print:text-xs">{field.label}</label>
                                <textarea
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm min-h-[100px] resize-y font-medium text-gray-700 disabled:opacity-70"
                                    value={entrevista[field.key] || ''}
                                    onChange={(e) => handleEntrevistaChange(field.key, e.target.value)}
                                    disabled={isViewMode}
                                />
                            </div>
                        ))}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block print:text-gray-800 print:text-xs">Pretensão Salarial</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm disabled:opacity-70 font-medium"
                                    value={entrevista.pretensao_salarial || ''}
                                    onChange={(e) => handleEntrevistaChange('pretensao_salarial', maskCurrencyInput(e.target.value))}
                                    placeholder="R$ 0,00"
                                    disabled={isViewMode}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {area === 'Jurídica' && !isAdvogado && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SearchableSelect
                                label="Entrevistadoras"
                                placeholder="Selecione..."
                                value={entrevista.entrevistadoras || ''}
                                onChange={(val) => handleEntrevistaChange('entrevistadoras', val)}
                                disabled={isViewMode}
                                options={[
                                    { id: 'Karina Reis Dos Prazeres', name: 'Karina Reis Dos Prazeres' },
                                    { id: 'Tatiana Gonçalves Gomes', name: 'Tatiana Gonçalves Gomes' },
                                    { id: 'Karina e Tatiana', name: 'Karina e Tatiana' }
                                ]}
                            />
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block print:text-gray-800 print:text-xs">Indicação</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm disabled:opacity-70 font-medium"
                                    value={formData.indicado_por || ''}
                                    onChange={(e) => setFormData({ ...formData, indicado_por: e.target.value })}
                                    disabled={isViewMode}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block print:text-gray-800 print:text-xs">Disponibilidade para início</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm disabled:opacity-70 font-medium"
                                    value={entrevista.disponibilidade_inicio || ''}
                                    onChange={(e) => handleEntrevistaChange('disponibilidade_inicio', e.target.value)}
                                    disabled={isViewMode}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block print:text-gray-800 print:text-xs">Reside</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm disabled:opacity-70 font-medium"
                                    value={entrevista.reside || ''}
                                    onChange={(e) => handleEntrevistaChange('reside', e.target.value)}
                                    disabled={isViewMode}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block print:text-gray-800 print:text-xs">MS Office</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm disabled:opacity-70 font-medium"
                                    value={entrevista.ms_office || ''}
                                    onChange={(e) => handleEntrevistaChange('ms_office', e.target.value)}
                                    disabled={isViewMode}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block print:text-gray-800 print:text-xs">Formação Acadêmica</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm disabled:opacity-70 font-medium"
                                    value={entrevista.formacao_academica || ''}
                                    onChange={(e) => handleEntrevistaChange('formacao_academica', e.target.value)}
                                    disabled={isViewMode}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block print:text-gray-800 print:text-xs">Horário de Estudo</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm disabled:opacity-70 font-medium"
                                    value={entrevista.horario_estudo || ''}
                                    onChange={(e) => handleEntrevistaChange('horario_estudo', e.target.value)}
                                    disabled={isViewMode}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block print:text-gray-800 print:text-xs">Melhor horário de estágio</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm disabled:opacity-70 font-medium"
                                    value={entrevista.melhor_horario_estagio || ''}
                                    onChange={(e) => handleEntrevistaChange('melhor_horario_estagio', e.target.value)}
                                    disabled={isViewMode}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block print:text-gray-800 print:text-xs">Inglês</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm disabled:opacity-70 font-medium"
                                    value={entrevista.ingles || ''}
                                    onChange={(e) => handleEntrevistaChange('ingles', e.target.value)}
                                    disabled={isViewMode}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block print:text-gray-800 print:text-xs">Experiência profissional e pessoal</label>
                            <textarea
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm min-h-[100px] resize-y font-medium text-gray-700 disabled:opacity-70"
                                value={entrevista.experiencia_prof_pessoal || ''}
                                onChange={(e) => handleEntrevistaChange('experiencia_prof_pessoal', e.target.value)}
                                disabled={isViewMode}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block print:text-gray-800 print:text-xs">Pretensão Salarial</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm disabled:opacity-70 font-medium"
                                    value={entrevista.pretensao_salarial || ''}
                                    onChange={(e) => handleEntrevistaChange('pretensao_salarial', maskCurrencyInput(e.target.value))}
                                    placeholder="R$ 0,00"
                                    disabled={isViewMode}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {area === 'Jurídica' && isAdvogado && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SearchableSelect
                                label="Entrevistadoras"
                                placeholder="Selecione..."
                                value={entrevista.entrevistadoras || ''}
                                onChange={(val) => handleEntrevistaChange('entrevistadoras', val)}
                                disabled={isViewMode}
                                options={[
                                    { id: 'Karina Reis Dos Prazeres', name: 'Karina Reis Dos Prazeres' },
                                    { id: 'Tatiana Gonçalves Gomes', name: 'Tatiana Gonçalves Gomes' },
                                    { id: 'Karina e Tatiana', name: 'Karina e Tatiana' }
                                ]}
                            />
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block print:text-gray-800 print:text-xs">Indicação</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm disabled:opacity-70 font-medium"
                                    value={formData.indicado_por || ''}
                                    onChange={(e) => setFormData({ ...formData, indicado_por: e.target.value })}
                                    disabled={isViewMode}
                                />
                            </div>
                        </div>

                        {[
                            {
                                section: "1. Abertura e Apresentação",
                                questions: [
                                    { key: 'abertura_apresentacao', label: 'Trajetória profissional' }
                                ]
                            },
                            {
                                section: "2. Experiência Técnica e Áreas de Atuação",
                                questions: [
                                    { key: 'exp_areas_especializacao', label: 'Principais áreas de especialização jurídica' },
                                    { key: 'exp_contencioso_consultivo', label: 'Atuação com contencioso e consultivo' },
                                    { key: 'exp_projeto_relevante', label: 'Projeto relevante que você liderou' },
                                    { key: 'exp_atualizacao_legislacao', label: 'Atualização das informações da legislação?' }
                                ]
                            },
                            {
                                section: "3. Liderança e Gestão",
                                questions: [
                                    { key: 'lid_experiencia', label: 'Experiência com liderança de equipes ou departamentos jurídicos' },
                                    { key: 'lid_delegacao', label: 'Delegação de tarefas e acompanhamento do desempenho dos membros da equipe?' },
                                    { key: 'lid_conflitos', label: 'Conflitos internos na equipe. Como resolveu?' }
                                ]
                            },
                            {
                                section: "4. Relacionamento com Clientes e Comunicação",
                                questions: [
                                    { key: 'rel_clientes_dificeis', label: 'Relacionamento com clientes difíceis ou situações de crise' },
                                    { key: 'rel_capacidade_negociacao', label: 'Capacidade de negociação' },
                                    { key: 'rel_comunicacao_nao_tecnico', label: 'Comunicação com cliente não técnico' }
                                ]
                            },
                            {
                                section: "5. Tomada de Decisão e Ética",
                                questions: [
                                    { key: 'tomada_decisao_dificil', label: 'Tomada de decisão difícil.' }
                                ]
                            },
                            {
                                section: "6. Alinhamento Estratégico e Visão de Negócio",
                                questions: [
                                    { key: 'ali_papel_juridico', label: 'Como você observa o papel do departamento jurídico na estratégia da empresa?' },
                                    { key: 'ali_projetos_multidisciplinares', label: 'Projetos multidisciplinares com outras áreas' },
                                    { key: 'ali_atuacao_preventiva', label: 'Essencial para que o jurídico atue de forma preventiva e não apenas reativa?' }
                                ]
                            },
                            {
                                section: "7. Adequação Cultural e Motivação",
                                questions: [
                                    { key: 'adeq_interesse', label: 'Interesse em trabalhar conosco' },
                                    { key: 'adeq_valores', label: 'Valores profissionais e como eles se alinham com a cultura da nossa organização?' },
                                    { key: 'adeq_projeto_futuro', label: 'Projeto profissional nos próximos 3 a 5 anos' }
                                ]
                            },
                            {
                                section: "8. Encerramento",
                                questions: [
                                    { key: 'disponibilidade', label: 'Disponibilidade' }
                                ]
                            }
                        ].map((group, groupIdx) => (
                            <div key={groupIdx} className="space-y-4 pt-4 border-t border-gray-100 first:border-0 first:pt-0">
                                <h4 className="text-sm font-black text-[#0a192f]">{group.section}</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {group.questions.map(field => (
                                        <div key={field.key} className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block ml-1">• {field.label}</label>
                                            <textarea
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm min-h-[80px] resize-y font-medium text-gray-700 disabled:opacity-70"
                                                value={entrevista[field.key] || ''}
                                                onChange={(e) => handleEntrevistaChange(field.key, e.target.value)}
                                                disabled={isViewMode}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block print:text-gray-800 print:text-xs">Pretensão Salarial</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm disabled:opacity-70 font-medium"
                                    value={entrevista.pretensao_salarial || ''}
                                    onChange={(e) => handleEntrevistaChange('pretensao_salarial', maskCurrencyInput(e.target.value))}
                                    placeholder="R$ 0,00"
                                    disabled={isViewMode}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Campos em Comum (Pontos, Rec. Final) */}
                <div className="pt-6 border-t border-gray-100 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block print:text-gray-800 print:text-xs text-green-600">Pontos Fortes</label>
                            <textarea
                                className="w-full bg-green-50/30 border border-green-100 rounded-xl p-4 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all shadow-sm min-h-[100px] resize-y font-medium text-gray-700 disabled:opacity-70"
                                value={entrevista.pontos_fortes || ''}
                                onChange={(e) => handleEntrevistaChange('pontos_fortes', e.target.value)}
                                disabled={isViewMode}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block print:text-gray-800 print:text-xs text-amber-600">Pontos a Desenvolver</label>
                            <textarea
                                className="w-full bg-amber-50/30 border border-amber-100 rounded-xl p-4 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all shadow-sm min-h-[100px] resize-y font-medium text-gray-700 disabled:opacity-70"
                                value={entrevista.pontos_a_desenvolver || ''}
                                onChange={(e) => handleEntrevistaChange('pontos_a_desenvolver', e.target.value)}
                                disabled={isViewMode}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                        <SearchableSelect
                            label="Recomendação Final"
                            placeholder="Selecione..."
                            value={entrevista.recomendacao_final || ''}
                            onChange={(val) => handleEntrevistaChange('recomendacao_final', val)}
                            disabled={isViewMode}
                            options={[
                                { id: 'Não Recomendado pela Área', name: 'Não Recomendado pela Área' },
                                { id: 'Não Recomendado pelo RH', name: 'Não Recomendado pelo RH' },
                                { id: 'Recomendado com ressalvas', name: 'Recomendado com ressalvas' },
                                { id: 'Recomendado para próxima etapa', name: 'Recomendado para próxima etapa' }
                            ]}
                        />

                        {/* Status Select */}
                        <div className="space-y-1.5" ref={statusMenuRef}>
                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Status do Candidato</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                                    className={`flex items-center justify-between w-full text-[10px] font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl border transition-all ${formData.status_selecao === 'Aprovado em Vaga' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' :
                                        formData.status_selecao?.startsWith('Reprovado') ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                                            formData.status_selecao === 'Reaproveitamento' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' :
                                                'bg-blue-50 text-[#1e3a8a] border-blue-200 hover:bg-blue-100'
                                        }`}
                                    disabled={isViewMode}
                                >
                                    <span>{formData.status_selecao || 'Aberto'}</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isStatusMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isStatusMenuOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[60]">
                                        {['Aberto', 'Aprovado em Vaga', 'Reaproveitamento', 'Reprovado pela Área', 'Reprovado pelo RH'].map(status => (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStatusSelecaoChange(status);
                                                }}
                                                className="w-full text-left px-5 py-3 text-xs font-bold text-[#0a192f] hover:bg-blue-50 hover:text-[#1e3a8a] transition-colors border-b border-gray-50 last:border-0"
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
