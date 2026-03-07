import React, { useState, useEffect } from 'react'
import { Plus, GraduationCap, Loader2, BookOpen, Building, Trash2, Edit2, Check, X, Languages } from 'lucide-react'
import { Collaborator } from '../../../types/controladoria'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { supabase } from '../../../lib/supabase'

interface DadosEscolaridadeSectionProps {
    formData: Partial<Collaborator>
    setFormData: React.Dispatch<React.SetStateAction<Partial<Collaborator>>>
    maskDate: (v: string) => string
    handleRefresh?: () => void
    isViewMode?: boolean
}

const semestres = ['1º Período', '2º Período', '3º Período', '4º Período', '5º Período', '6º Período', '7º Período', '8º Período', '9º Período', '10º Período']
const postGradOptions = ['Especialização', 'MBA', 'Mestrado', 'Doutorado', 'Pós-Doutorado']

const ESTADOS_BRASIL = [
    { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' },
    { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
    { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' },
    { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
    { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' },
    { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' },
    { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' },
    { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },
    { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' }
]

export function DadosEscolaridadeSection({ formData, setFormData, maskDate, isViewMode = false }: DadosEscolaridadeSectionProps) {
    const [institutions, setInstitutions] = useState<{ id: string, uf: string, name: string }[]>([])
    const [courses, setCourses] = useState<{ id: string, name: string }[]>([])
    const [postCourses, setPostCourses] = useState<{ id: string, name: string }[]>([])
    const [loadingData, setLoadingData] = useState(false)
    const [editingIds, setEditingIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        const fetchData = async () => {
            setLoadingData(true)
            try {
                const [instRes, coursesRes, postCoursesRes] = await Promise.all([
                    supabase.rpc('get_education_institutions'),
                    supabase.rpc('get_education_courses'),
                    supabase.rpc('get_education_post_courses')
                ]);

                if (instRes.error) throw instRes.error;
                if (coursesRes.error) throw coursesRes.error;
                if (postCoursesRes.error) throw postCoursesRes.error;

                setInstitutions(instRes.data || []);
                setCourses(coursesRes.data || []);
                setPostCourses(postCoursesRes.data || []);
            } catch (error) {
                console.warn("Failed to load education data from Supabase", error)
                // Fallback can be added here if needed, but currently relying on DB
                setInstitutions([]);
                setCourses([]);
                setPostCourses([]);
            } finally {
                setLoadingData(false)
            }
        }
        fetchData()
    }, [])

    const handleAddEducation = (nivel: 'Ensino Fundamental' | 'Ensino Médio' | 'Graduação' | 'Pós-Graduação') => {
        const newEntry = {
            id: crypto.randomUUID(),
            nivel,
            status: 'Cursando' as const,
            instituicao: '',
            instituicao_uf: '', // Novo campo adicionado localmente para o formulário
            curso: '',
            subnivel: nivel === 'Pós-Graduação' ? 'Especialização' : undefined,
            cr: ''
        }
        const currentData = formData.education_history || []
        setFormData({ ...formData, education_history: [...currentData, newEntry] })
        setEditingIds(prev => new Set(prev).add(newEntry.id))
    }

    const toggleEdit = (id: string, forceState?: boolean) => {
        setEditingIds(prev => {
            const next = new Set(prev)
            if (forceState === true) next.add(id)
            else if (forceState === false) next.delete(id)
            else if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const [novoIdioma, setNovoIdioma] = useState('');
    const idiomasList = formData.idiomas ? formData.idiomas.split(/[\n,]/).map(i => i.trim()).filter(Boolean) : [];

    const handleAddIdioma = () => {
        if (!novoIdioma.trim()) return;
        const current = [...idiomasList, novoIdioma.trim()];
        setFormData({ ...formData, idiomas: current.join('\n') });
        setNovoIdioma('');
    };

    const handleRemoveIdioma = (index: number) => {
        const current = [...idiomasList];
        current.splice(index, 1);
        setFormData({ ...formData, idiomas: current.join('\n') });
    };

    const handleKeyDownIdioma = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddIdioma();
        }
    };

    const [novaAtividade, setNovaAtividade] = useState('');
    const atividadesList = formData.atividades_academicas ? formData.atividades_academicas.split(/[\n]/).map(i => i.trim()).filter(Boolean) : [];

    const handleAddAtividade = () => {
        if (!novaAtividade.trim()) return;
        const current = [...atividadesList, novaAtividade.trim()];
        setFormData({ ...formData, atividades_academicas: current.join('\n') });
        setNovaAtividade('');
    };

    const handleRemoveAtividade = (index: number) => {
        const current = [...atividadesList];
        current.splice(index, 1);
        setFormData({ ...formData, atividades_academicas: current.join('\n') });
    };

    const handleKeyDownAtividade = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddAtividade();
        }
    };

    const handleRemoveEducation = (id: string) => {
        const currentData = formData.education_history || []
        setFormData({ ...formData, education_history: currentData.filter(e => e.id !== id) })
    }

    const updateEducation = (id: string, field: string, value: any) => {
        const currentData = formData.education_history || []
        const updated = currentData.map(e => {
            if (e.id === id) {
                const updatedEntry = { ...e, [field]: value };
                // Se mudar a UF, limpa a instituição para forçar re-escolha
                if (field === 'instituicao_uf') {
                    updatedEntry.instituicao = '';
                }
                // Se mudar o curso para Outro, limpa o valor para abrir o texto livre vazio
                if (field === 'curso' && value === 'Outro') {
                    updatedEntry.curso = ' ';
                }
                // Limpeza similar para Instituição "Outra"
                if (field === 'instituicao' && value === 'Outra') {
                    updatedEntry.instituicao = ' ';
                }
                return updatedEntry;
            }
            return e;
        })
        setFormData({ ...formData, education_history: updated })
    }

    const renderEducations = (nivel: 'Ensino Fundamental' | 'Ensino Médio' | 'Graduação' | 'Pós-Graduação') => {
        const history = formData.education_history || []
        const filtered = history.filter(h => h.nivel === nivel)

        const activeCoursesList = nivel === 'Graduação' ? courses : (nivel === 'Pós-Graduação' ? postCourses : []);
        const courseOptions = [...activeCoursesList.map(c => ({ name: c.name })), { name: 'Outro' }]

        const getPeriodOptions = (eduNivel: string) => {
            if (eduNivel === 'Ensino Fundamental') {
                return ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano'];
            }
            if (eduNivel === 'Ensino Médio') {
                return ['1º Ano', '2º Ano', '3º Ano'];
            }
            return semestres;
        };

        return (
            <div className="space-y-4 w-full">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h3 className="text-sm font-bold text-[#1e3a8a] flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        {nivel}
                    </h3>
                    {!isViewMode && (
                        <button
                            type="button"
                            onClick={() => handleAddEducation(nivel)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-[#1e3a8a] text-xs font-bold uppercase rounded-lg transition-all"
                        >
                            <Plus className="h-3.5 w-3.5" /> Adicionar {nivel}
                        </button>
                    )}
                </div>

                {filtered.length === 0 && (
                    <p className="text-xs text-gray-400 italic">Nenhuma {nivel.toLowerCase()} cadastrada.</p>
                )}

                {filtered.map((item, index) => {
                    // Try to infer UF if not set yet, based on institution name matching our DB
                    let currentUF = (item as any).instituicao_uf || '';
                    if (!currentUF && item.instituicao && item.instituicao !== ' ') {
                        const foundInst = institutions.find(i => i.name === item.instituicao);
                        if (foundInst) {
                            currentUF = foundInst.uf;
                            // Silently update state to hold the UF? Better to just use it for rendering logic
                            // to avoid infinite loops in render. We'll use local variable.
                        }
                    }

                    // Get institutions for selected UF
                    const ufInstitutions = currentUF
                        ? institutions.filter(i => i.uf === currentUF).map(i => ({ name: i.name }))
                        : [];

                    if (currentUF) {
                        ufInstitutions.push({ name: 'Outra' });
                    }

                    // Check if current course is "Outro" (not in list)
                    const isCustomCourse = item.curso !== undefined && item.curso !== '' && !activeCoursesList.find(c => c.name === item.curso);
                    const displayCourseValue = isCustomCourse ? 'Outro' : (item.curso || '');

                    // Check if current institution is "Outra" (not in UF list)
                    const isCustomInstitution = item.instituicao !== undefined && item.instituicao !== '' && currentUF && !institutions.find(i => i.uf === currentUF && i.name === item.instituicao);
                    const displayInstValue = isCustomInstitution ? 'Outra' : (item.instituicao || '');

                    const formatDisplayDate = (d: string | undefined) => {
                        if (!d) return '';
                        if (d.includes('/')) return d;
                        if (d.includes('T')) {
                            const [y, m, day] = d.split('T')[0].split('-');
                            return `${day}/${m}/${y}`;
                        }
                        if (d.includes('-') && d.split('-').length === 3) {
                            const [y, m, day] = d.split('-');
                            return `${day}/${m}/${y}`;
                        }
                        return d; // Fallback to raw value
                    };

                    const isEditing = editingIds.has(item.id) || !item.instituicao;

                    if (!isEditing && item.instituicao) {
                        return (
                            <div key={item.id} className="relative bg-white border border-gray-200 rounded-xl p-4 shadow-sm group hover:border-blue-200 transition-all animate-in zoom-in-95">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 pr-12">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-[#0a192f] text-sm">{item.curso && item.curso.trim() ? item.curso : nivel}</h4>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.status === 'Formado(a)' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {item.status}
                                            </span>
                                            {item.subnivel && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">{item.subnivel}</span>}
                                        </div>
                                        <p className="text-xs text-gray-600 flex items-center gap-1.5 font-medium mb-3">
                                            <Building className="h-3.5 w-3.5 text-gray-400" />
                                            {item.instituicao} {item.instituicao_uf ? `- ${item.instituicao_uf}` : ''}
                                        </p>
                                        <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-gray-50 w-fit px-3 py-2 rounded-lg border border-gray-100">
                                            {item.matricula && <span className="flex items-center gap-1"><span className="text-gray-400">Matrícula:</span> <span className="text-[#1e3a8a]">{item.matricula}</span></span>}
                                            {item.semestre && <span className="flex items-center gap-1"><span className="text-gray-400">{['Ensino Fundamental', 'Ensino Médio'].includes(nivel) ? 'Série:' : 'Período:'}</span> <span className="text-[#1e3a8a]">{item.semestre}</span></span>}
                                            {item.previsao_conclusao && <span className="flex items-center gap-1"><span className="text-gray-400">Previsão:</span> <span className="text-amber-600">{formatDisplayDate(item.previsao_conclusao)}</span></span>}
                                            {item.ano_conclusao && <span className="flex items-center gap-1"><span className="text-gray-400">Conclusão:</span> <span className="text-emerald-600">{item.ano_conclusao}</span></span>}
                                            {item.cr && <span className="flex items-center gap-1"><span className="text-gray-400">CR:</span> <span className="text-[#1e3a8a]">{item.cr}</span></span>}
                                        </div>
                                    </div>
                                    {!isViewMode && (
                                        <div className="absolute top-4 right-4 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button type="button" onClick={() => toggleEdit(item.id, true)} className="p-2 text-gray-400 hover:text-[#1e3a8a] hover:bg-blue-50 bg-white border border-gray-200 shadow-sm rounded-lg transition-colors" title="Editar">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button type="button" onClick={() => handleRemoveEducation(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 bg-white border border-gray-200 shadow-sm rounded-lg transition-colors" title="Remover">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }

                    return (
                        <div key={item.id} className="relative bg-[#f8fafc] border border-blue-100 shadow-sm rounded-xl p-5 space-y-4 animate-in slide-in-from-top-2">
                            {!isViewMode && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveEducation(item.id)}
                                    className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition-colors bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm"
                                    title="Remover Formação"
                                    disabled={isViewMode}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}

                            <div className="flex flex-col gap-1 pr-8">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{nivel} #{index + 1}</span>

                                {/* Toggle Status */}
                                <div className="flex bg-white rounded-lg border border-gray-200 p-1 w-fit mt-1">
                                    <button
                                        type="button"
                                        onClick={() => updateEducation(item.id, 'status', 'Cursando')}
                                        disabled={isViewMode}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${item.status === 'Cursando' ? 'bg-[#1e3a8a] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        Cursando
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateEducation(item.id, 'status', 'Formado(a)')}
                                        disabled={isViewMode}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${item.status === 'Formado(a)' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        Formado(a)
                                    </button>
                                </div>
                            </div>

                            {nivel === 'Pós-Graduação' && (
                                <div className="pt-2">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block mb-2">
                                        Tipo de Pós-Graduação
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {postGradOptions.map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => updateEducation(item.id, 'subnivel', type)}
                                                disabled={isViewMode}
                                                className={`
                                                    ${isViewMode ? 'cursor-default opacity-80' : 'cursor-pointer'} px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all
                                                    ${item.subnivel === type
                                                        ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-[#1e3a8a] hover:text-[#1e3a8a]'
                                                    }
                                                `}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 items-end">
                                {['Ensino Fundamental', 'Ensino Médio'].includes(nivel) ? (
                                    <div className="space-y-1.5 col-span-1 md:col-span-2">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Instituição</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Building className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={item.instituicao === ' ' ? '' : item.instituicao}
                                                onChange={(e) => updateEducation(item.id, 'instituicao', e.target.value)}
                                                className={`w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#0a192f] placeholder-gray-400 focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none transition-all ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                placeholder={`Nome da Escola (${nivel})`}
                                                disabled={isViewMode}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* UF da Instituição e Instituição (Mesma linha) */}
                                        <div className="space-y-1.5 col-span-1 md:col-span-1">
                                            <SearchableSelect
                                                label="UF da Instituição"
                                                value={ESTADOS_BRASIL.find(e => e.sigla === currentUF)?.nome || currentUF}
                                                onChange={(v) => {
                                                    const sigla = ESTADOS_BRASIL.find(e => e.nome === v)?.sigla || v;
                                                    updateEducation(item.id, 'instituicao_uf', sigla)
                                                }}
                                                options={ESTADOS_BRASIL.map(e => ({ name: e.nome, label: `${e.nome} - ${e.sigla}` }))}
                                                disabled={isViewMode}
                                            />
                                        </div>

                                        <div className="space-y-1.5 col-span-1 md:col-span-1">
                                            <SearchableSelect
                                                label={
                                                    <span className="flex flex-col w-full gap-0.5">
                                                        <span className="flex items-center justify-between w-full">
                                                            Instituição
                                                            {loadingData && <Loader2 className="h-3 w-3 animate-spin text-[#1e3a8a] ml-1" />}
                                                        </span>
                                                        <span className="text-[8px] text-amber-500 font-bold normal-case tracking-normal">
                                                            (Selecione "Outra" caso não encontre na lista)
                                                        </span>
                                                    </span> as any
                                                }
                                                value={displayInstValue}
                                                onChange={(v) => updateEducation(item.id, 'instituicao', v)}
                                                options={ufInstitutions}
                                                disabled={isViewMode || !currentUF}
                                                disableFormatting={true}
                                            />

                                            {/* Campo Outro (Texto Livre) */}
                                            {isCustomInstitution && (
                                                <div className="relative mt-2 animate-in fade-in zoom-in duration-200">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Building className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={item.instituicao === ' ' ? '' : item.instituicao}
                                                        onChange={(e) => updateEducation(item.id, 'instituicao', e.target.value)}
                                                        className={`w-full pl-10 pr-3 py-2.5 bg-blue-50/50 border border-blue-200 rounded-lg text-xs font-medium text-[#0a192f] placeholder-blue-300 focus:bg-white focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none transition-all ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                        placeholder="Digite o nome da instituição..."
                                                        disabled={isViewMode}
                                                        autoFocus
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Curso */}
                            <div className="space-y-1.5 col-span-1 md:col-span-2">
                                <SearchableSelect
                                    label={['Ensino Fundamental', 'Ensino Médio'].includes(nivel) ? "Formação / Habilitação (Opcional)" : "Curso"}
                                    value={displayCourseValue}
                                    onChange={(v) => updateEducation(item.id, 'curso', v)}
                                    options={courseOptions}
                                    disabled={isViewMode}
                                    disableFormatting={true}
                                />

                                {/* Campo Outro (Texto Livre) */}
                                {isCustomCourse && (
                                    <div className="relative mt-2 animate-in fade-in zoom-in duration-200">
                                        <input
                                            type="text"
                                            value={item.curso === ' ' ? '' : item.curso}
                                            onChange={(e) => updateEducation(item.id, 'curso', e.target.value)}
                                            className={`w-full px-3 py-2.5 bg-blue-50/50 border border-blue-200 rounded-lg text-xs font-medium text-[#0a192f] placeholder-blue-300 focus:bg-white focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none transition-all ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            placeholder={['Ensino Fundamental', 'Ensino Médio'].includes(nivel) ? "Ex: Formação Geral, Técnico em Informática..." : "Digite o nome do curso..."}
                                            disabled={isViewMode}
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Fields varying by status */}
                            {item.status === 'Cursando' ? (
                                <div className={`col-span-1 md:col-span-2 grid grid-cols-1 ${nivel === 'Graduação' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Matrícula</label>
                                        <input
                                            type="text"
                                            value={item.matricula || ''}
                                            onChange={(e) => updateEducation(item.id, 'matricula', e.target.value)}
                                            className={`w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#0a192f] focus:ring-1 outline-none ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            placeholder="Nº da matrícula"
                                            disabled={isViewMode}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{['Ensino Fundamental', 'Ensino Médio'].includes(nivel) ? 'Série / Ano Atual' : 'Período Atual'}</label>
                                        <SearchableSelect
                                            value={item.semestre || ''}
                                            onChange={(v) => updateEducation(item.id, 'semestre', v)}
                                            options={getPeriodOptions(nivel).map(sem => ({ name: sem }))}
                                            disabled={isViewMode}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Previsão de Conclusão</label>
                                        {nivel === 'Graduação' ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={(item.previsao_conclusao || '').split('/')[0] || ''}
                                                    onChange={(e) => {
                                                        const currentParts = (item.previsao_conclusao || '/').split('/');
                                                        const sem = e.target.value;
                                                        const ano = currentParts.length > 1 ? currentParts[1] : '';
                                                        updateEducation(item.id, 'previsao_conclusao', `${sem}${sem || ano ? '/' : ''}${ano}`);
                                                    }}
                                                    className={`w-1/3 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#0a192f] focus:ring-1 outline-none ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    placeholder="1º"
                                                    disabled={isViewMode}
                                                />
                                                <input
                                                    type="text"
                                                    value={(item.previsao_conclusao || '').includes('/') ? (item.previsao_conclusao || '').split('/')[1] : ''}
                                                    onChange={(e) => {
                                                        const currentParts = (item.previsao_conclusao || '/').split('/');
                                                        const sem = currentParts[0] || '';
                                                        const ano = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                        updateEducation(item.id, 'previsao_conclusao', `${sem}${sem || ano ? '/' : ''}${ano}`);
                                                    }}
                                                    maxLength={4}
                                                    className={`w-2/3 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#0a192f] focus:ring-1 outline-none ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    placeholder="2028"
                                                    disabled={isViewMode}
                                                />
                                            </div>
                                        ) : (
                                            <input
                                                type="text"
                                                value={item.previsao_conclusao ? formatDisplayDate(item.previsao_conclusao) : ''}
                                                onChange={(e) => updateEducation(item.id, 'previsao_conclusao', maskDate(e.target.value))}
                                                maxLength={10}
                                                className={`w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#0a192f] focus:ring-1 outline-none ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                placeholder="DD/MM/AAAA"
                                                disabled={isViewMode}
                                            />
                                        )}
                                    </div>
                                    {nivel === 'Graduação' && (
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">CR</label>
                                            <input
                                                type="text"
                                                value={item.cr || ''}
                                                onChange={(e) => {
                                                    let val = e.target.value.replace(/\D/g, '');
                                                    if (val.length > 4) val = val.slice(0, 4);
                                                    if (val.length > 2) {
                                                        val = val.slice(0, 2) + '.' + val.slice(2);
                                                    }
                                                    updateEducation(item.id, 'cr', val);
                                                }}
                                                className={`w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#0a192f] focus:ring-1 outline-none ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                placeholder="00.00"
                                                disabled={isViewMode}
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={`col-span-1 md:col-span-2 grid grid-cols-1 ${nivel === 'Graduação' ? 'md:grid-cols-2' : ''} gap-4`}>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ano de Conclusão</label>
                                        <input
                                            type="text"
                                            value={item.ano_conclusao || ''}
                                            onChange={(e) => updateEducation(item.id, 'ano_conclusao', e.target.value.replace(/\D/g, '').slice(0, 4))}
                                            maxLength={4}
                                            className={`w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#0a192f] focus:ring-1 outline-none ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            placeholder="AAAA"
                                            disabled={isViewMode}
                                        />
                                    </div>
                                    {nivel === 'Graduação' && (
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">CR</label>
                                            <input
                                                type="text"
                                                value={item.cr || ''}
                                                onChange={(e) => {
                                                    let val = e.target.value.replace(/\D/g, '');
                                                    if (val.length > 4) val = val.slice(0, 4);
                                                    if (val.length > 2) {
                                                        val = val.slice(0, 2) + '.' + val.slice(2);
                                                    }
                                                    updateEducation(item.id, 'cr', val);
                                                }}
                                                className={`w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#0a192f] focus:ring-1 outline-none ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                placeholder="00.00"
                                                disabled={isViewMode}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {
                                !isViewMode && (
                                    <div className="flex justify-end pt-4 border-t border-blue-100/50 mt-4">
                                        <button
                                            type="button"
                                            onClick={() => toggleEdit(item.id, false)}
                                            className="flex items-center gap-2 px-5 py-2 bg-[#1e3a8a] hover:bg-blue-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm disabled:opacity-50"
                                            disabled={!item.instituicao || (!['Ensino Fundamental', 'Ensino Médio'].includes(nivel) && !item.instituicao_uf)}
                                        >
                                            <Check className="h-4 w-4" /> Salvar {nivel.split(' ')[0]}
                                        </button>
                                    </div>
                                )
                            }
                        </div>
                    )
                })
                }
            </div >
        )
    }

    return (
        <div className="space-y-8">
            <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Escolaridade
            </h3>
            <div className="flex flex-col gap-8">
                {renderEducations('Ensino Fundamental')}
                {renderEducations('Ensino Médio')}
                {renderEducations('Graduação')}
                {renderEducations('Pós-Graduação')}
            </div>

            <div className="pt-6 border-t border-gray-100 mt-6">
                <h4 className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Qualificações e Idiomas
                </h4>
                <div className="flex flex-col gap-6">
                    <div className="space-y-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Languages className="w-3.5 h-3.5" /> Idiomas
                        </label>

                        <div className="flex flex-col gap-3">
                            {idiomasList.length > 0 && (
                                <div className="flex flex-col gap-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100 min-h-[60px]">
                                    {idiomasList.map((idioma, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2.5 rounded-lg shadow-sm group transition-all hover:border-blue-200">
                                            <span className="text-sm font-semibold text-gray-700">{idioma}</span>
                                            {!isViewMode && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveIdioma(idx)}
                                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Remover idioma"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!isViewMode && (
                                <div className="flex gap-2 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Plus className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none transition-all shadow-sm font-medium"
                                        value={novoIdioma}
                                        onChange={(e) => setNovoIdioma(e.target.value)}
                                        onKeyDown={handleKeyDownIdioma}
                                        placeholder="Digite um idioma (Ex: Inglês Avançado) e aperte Enter..."
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddIdioma}
                                        disabled={!novoIdioma.trim()}
                                        className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        Adicionar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5" /> Atividades Acadêmicas e Extracurriculares
                        </label>

                        <div className="flex flex-col gap-3">
                            {atividadesList.length > 0 && (
                                <div className="flex flex-col gap-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100 min-h-[60px]">
                                    {atividadesList.map((atividade, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2.5 rounded-lg shadow-sm group transition-all hover:border-blue-200">
                                            <span className="text-sm font-semibold text-gray-700">{atividade}</span>
                                            {!isViewMode && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveAtividade(idx)}
                                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Remover atividade"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!isViewMode && (
                                <div className="flex gap-2 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Plus className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none transition-all shadow-sm font-medium"
                                        value={novaAtividade}
                                        onChange={(e) => setNovaAtividade(e.target.value)}
                                        onKeyDown={handleKeyDownAtividade}
                                        placeholder="Ex: Monitoria, Empresa Júnior, Grupo de Pesquisa..."
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddAtividade}
                                        disabled={!novaAtividade.trim()}
                                        className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        Adicionar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
