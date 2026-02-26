import React, { useState, useEffect } from 'react'
import { Plus, GraduationCap, Loader2, BookOpen, Building, Trash2 } from 'lucide-react'
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

const semestres = ['1º Semestre', '2º Semestre', '3º Semestre', '4º Semestre', '5º Semestre', '6º Semestre', '7º Semestre', '8º Semestre', '9º Semestre', '10º Semestre']
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
    const [loadingData, setLoadingData] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            setLoadingData(true)
            try {
                const [instRes, coursesRes] = await Promise.all([
                    supabase.rpc('get_education_institutions'),
                    supabase.rpc('get_education_courses')
                ]);

                if (instRes.error) throw instRes.error;
                if (coursesRes.error) throw coursesRes.error;

                setInstitutions(instRes.data || []);
                setCourses(coursesRes.data || []);
            } catch (error) {
                console.warn("Failed to load education data from Supabase", error)
                // Fallback can be added here if needed, but currently relying on DB
                setInstitutions([]);
                setCourses([]);
            } finally {
                setLoadingData(false)
            }
        }
        fetchData()
    }, [])

    const handleAddEducation = (nivel: 'Graduação' | 'Pós-Graduação') => {
        const newEntry = {
            id: crypto.randomUUID(),
            nivel,
            status: 'Cursando' as const,
            instituicao: '',
            instituicao_uf: '', // Novo campo adicionado localmente para o formulário
            curso: '',
            subnivel: nivel === 'Pós-Graduação' ? 'Especialização' : undefined
        }
        const currentData = formData.education_history || []
        setFormData({ ...formData, education_history: [...currentData, newEntry] })
    }

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

    const renderEducations = (nivel: 'Graduação' | 'Pós-Graduação') => {
        const history = formData.education_history || []
        const filtered = history.filter(h => h.nivel === nivel)

        const courseOptions = [...courses.map(c => ({ name: c.name })), { name: 'Outro' }]

        return (
            <div className="space-y-4 w-full">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h3 className="text-sm font-bold text-[#1e3a8a] flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        {nivel === 'Graduação' ? 'Graduação' : 'Pós-Graduação'}
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
                    const isCustomCourse = item.curso !== undefined && item.curso !== '' && !courses.find(c => c.name === item.curso);
                    const displayCourseValue = isCustomCourse ? 'Outro' : (item.curso || '');

                    // Check if current institution is "Outra" (not in UF list)
                    const isCustomInstitution = item.instituicao !== undefined && item.instituicao !== '' && currentUF && !institutions.find(i => i.uf === currentUF && i.name === item.instituicao);
                    const displayInstValue = isCustomInstitution ? 'Outra' : (item.instituicao || '');

                    return (
                        <div key={item.id} className="relative bg-gray-50/50 border border-gray-200 rounded-xl p-5 space-y-4 animate-in slide-in-from-top-2">
                            {!isViewMode && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveEducation(item.id)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                {/* UF da Instituição e Instituição (Mesma linha) */}
                                <div className="space-y-1.5 col-span-1 md:col-span-1">
                                    <SearchableSelect
                                        label="UF da Instituição"
                                        value={ESTADOS_BRASIL.find(e => e.sigla === currentUF)?.nome || currentUF}
                                        onChange={(v) => {
                                            const sigla = ESTADOS_BRASIL.find(e => e.nome === v)?.sigla || v;
                                            updateEducation(item.id, 'instituicao_uf', sigla)
                                        }}
                                        options={ESTADOS_BRASIL.map(e => ({ name: e.nome }))}
                                        disabled={isViewMode}
                                    />
                                </div>

                                <div className="space-y-1.5 col-span-1 md:col-span-1">
                                    <SearchableSelect
                                        label={
                                            <span className="flex items-center justify-between w-full">
                                                Instituição
                                                {loadingData && <Loader2 className="h-3 w-3 animate-spin text-[#1e3a8a] ml-1" />}
                                            </span> as any
                                        }
                                        value={displayInstValue}
                                        onChange={(v) => updateEducation(item.id, 'instituicao', v)}
                                        options={ufInstitutions}
                                        disabled={isViewMode || !currentUF}
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
                                                className={`w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#0a192f] placeholder-gray-400 focus:ring-1 focus:ring-[#1e3a8a] outline-none ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                placeholder="Digite o nome da instituição..."
                                                disabled={isViewMode}
                                                autoFocus
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Curso */}
                                <div className="space-y-1.5 col-span-1 md:col-span-2">
                                    <SearchableSelect
                                        label="Curso"
                                        value={displayCourseValue}
                                        onChange={(v) => updateEducation(item.id, 'curso', v)}
                                        options={courseOptions}
                                        disabled={isViewMode}
                                    />

                                    {/* Campo Outro (Texto Livre) */}
                                    {isCustomCourse && (
                                        <div className="relative mt-2 animate-in fade-in zoom-in duration-200">
                                            <input
                                                type="text"
                                                value={item.curso === ' ' ? '' : item.curso}
                                                onChange={(e) => updateEducation(item.id, 'curso', e.target.value)}
                                                className={`w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#0a192f] placeholder-gray-400 focus:ring-1 focus:ring-[#1e3a8a] outline-none ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                placeholder="Digite o nome do curso..."
                                                disabled={isViewMode}
                                                autoFocus
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Fields varying by status */}
                                {item.status === 'Cursando' ? (
                                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                        <div className="space-y-1.5 pt-[19px]">
                                            <SearchableSelect
                                                label="Semestre Atual"
                                                value={item.semestre || ''}
                                                onChange={(v) => updateEducation(item.id, 'semestre', v)}
                                                options={semestres.map(sem => ({ name: sem }))}
                                                disabled={isViewMode}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Previsão de Conclusão</label>
                                            <input
                                                type="text"
                                                value={item.previsao_conclusao || ''}
                                                onChange={(e) => updateEducation(item.id, 'previsao_conclusao', maskDate(e.target.value))}
                                                maxLength={10}
                                                className={`w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#0a192f] focus:ring-1 outline-none ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                placeholder="DD/MM/AAAA"
                                                disabled={isViewMode}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 col-span-1 md:col-span-2">
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
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Escolaridade
            </h3>
            <div className="flex flex-col gap-8">
                {renderEducations('Graduação')}
                {renderEducations('Pós-Graduação')}
            </div>
        </div>
    )
}
