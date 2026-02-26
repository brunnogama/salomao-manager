import React, { useState, useEffect } from 'react'
import { Plus, GraduationCap, Loader2, BookOpen, Building, Trash2 } from 'lucide-react'
import { Collaborator } from '../../../types/controladoria'
import { SearchableSelect } from '../../crm/SearchableSelect'

interface DadosEscolaridadeSectionProps {
    formData: Partial<Collaborator>
    setFormData: React.Dispatch<React.SetStateAction<Partial<Collaborator>>>
    maskDate: (v: string) => string
    handleRefresh?: () => void
    isViewMode?: boolean
}

const semestres = ['1º Semestre', '2º Semestre', '3º Semestre', '4º Semestre', '5º Semestre', '6º Semestre', '7º Semestre', '8º Semestre', '9º Semestre', '10º Semestre']
const postGradOptions = ['Especialização', 'MBA', 'Mestrado', 'Doutorado', 'Pós-Doutorado']

// Predefined fallback options for courses
const commonCourses = [
    'Administração', 'Direito', 'Contabilidade', 'Engenharia Civil', 'Engenharia de Produção',
    'Engenharia de Software', 'Sistemas de Informação', 'Ciência da Computação', 'Economia',
    'Marketing', 'Gestão de Recursos Humanos', 'Gestão Financeira', 'Psicologia', 'Design', 'Outro'
]

export function DadosEscolaridadeSection({ formData, setFormData, maskDate, isViewMode = false }: DadosEscolaridadeSectionProps) {
    const [universities, setUniversities] = useState<{ name: string }[]>([])
    const [loadingUnis, setLoadingUnis] = useState(false)

    // Fallback static list of major Brazilian universities to ensure the UI always works
    // even when APIs fail.
    const fallbackUniversities = [
        'Universidade de São Paulo (USP)', 'Universidade Estadual de Campinas (UNICAMP)',
        'Universidade Federal do Rio de Janeiro (UFRJ)', 'Universidade Federal de Minas Gerais (UFMG)',
        'Universidade Federal do Rio Grande do Sul (UFRGS)', 'Universidade Estadual Paulista (UNESP)',
        'Universidade de Brasília (UnB)', 'Universidade Federal de Santa Catarina (UFSC)',
        'Universidade Federal do Paraná (UFPR)', 'Pontifícia Universidade Católica do Rio de Janeiro (PUC-Rio)',
        'Pontifícia Universidade Católica de São Paulo (PUC-SP)', 'Universidade Federal de Pernambuco (UFPE)',
        'Pontifícia Universidade Católica do Rio Grande do Sul (PUCRS)', 'Universidade Federal do Ceará (UFC)',
        'Universidade do Estado do Rio de Janeiro (UERJ)', 'Universidade Federal de São Carlos (UFSCar)',
        'Universidade Federal da Bahia (UFBA)', 'Universidade Federal do Rio Grande do Norte (UFRN)',
        'Universidade Federal de Goiás (UFG)', 'Universidade Presbiteriana Mackenzie',
        'Fundação Getulio Vargas (FGV)', 'Universidade Estácio de Sá', 'Universidade Paulista (UNIP)',
        'Centro Universitário Carioca (UniCarioca)', 'Ibmec', 'Insper'
    ].sort();

    // Ensure we fetch universities once
    useEffect(() => {
        const fetchUnis = async () => {
            setLoadingUnis(true)
            try {
                // Fetch from reliable Github raw content since HipoLabs domain has HTTPS/Connection Refused issues
                const response = await fetch('https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json')

                if (!response.ok) throw new Error('API fetch failed');

                const data = await response.json()
                const brazilUnis = data.filter((u: any) => u.country === 'Brazil')

                if (brazilUnis.length > 0) {
                    const uniqueNames = Array.from(new Set(brazilUnis.map((u: any) => u.name))).sort() as string[]
                    setUniversities(uniqueNames.map(n => ({ name: n })))
                } else {
                    setUniversities(fallbackUniversities.map(n => ({ name: n })))
                }
            } catch (error) {
                console.warn("Failed to load global universities, using fallback list", error)
                setUniversities(fallbackUniversities.map(n => ({ name: n })))
            } finally {
                setLoadingUnis(false)
            }
        }
        fetchUnis()
    }, [])

    const handleAddEducation = (nivel: 'Graduação' | 'Pós-Graduação') => {
        const newEntry = {
            id: crypto.randomUUID(),
            nivel,
            status: 'Cursando' as const,
            instituicao: '',
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
        const updated = currentData.map(e => e.id === id ? { ...e, [field]: value } : e)
        setFormData({ ...formData, education_history: updated })
    }

    // Migration helper for visual feedback only (old fields usually overridden by arrays if preferred)
    const renderEducations = (nivel: 'Graduação' | 'Pós-Graduação') => {
        const history = formData.education_history || []
        const filtered = history.filter(h => h.nivel === nivel)

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

                {filtered.map((item, index) => (
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
                            {/* Instituição com Datalist Integrado API HipoLabs */}
                            <div className="space-y-1.5 col-span-1 md:col-span-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-between">
                                    <span>Instituição</span>
                                    {loadingUnis && <Loader2 className="h-3 w-3 animate-spin text-[#1e3a8a]" />}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Building className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        list={`universities-list-${item.id}`} // Unique ID per item for datalist
                                        value={item.instituicao || ''}
                                        onChange={(e) => updateEducation(item.id, 'instituicao', e.target.value)}
                                        className={`w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#0a192f] placeholder-gray-300 focus:ring-1 focus:ring-[#1e3a8a] outline-none ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        placeholder="Digite ou selecione a universidade..."
                                        disabled={isViewMode}
                                        autoComplete="off"
                                    />
                                    <datalist id={`universities-list-${item.id}`}>
                                        {universities.map((uni, idx) => (
                                            <option key={idx} value={uni.name} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            {/* Curso */}
                            <div className="space-y-1.5 col-span-1 md:col-span-2">
                                <SearchableSelect
                                    label="Curso"
                                    value={item.curso && !commonCourses.includes(item.curso) ? 'Outro' : (item.curso || '')}
                                    onChange={(v) => {
                                        if (v === 'Outro') {
                                            updateEducation(item.id, 'curso', ' ');
                                        } else {
                                            updateEducation(item.id, 'curso', v);
                                        }
                                    }}
                                    options={commonCourses.map(c => ({ name: c }))}
                                    disabled={isViewMode}
                                />

                                {/* Campo Outro (Texto Livre) */}
                                {item.curso !== undefined && !commonCourses.includes(item.curso) && item.curso !== '' && (
                                    <div className="relative mt-2 animate-in fade-in zoom-in duration-200">
                                        <input
                                            type="text"
                                            value={item.curso === ' ' ? '' : item.curso}
                                            onChange={(e) => updateEducation(item.id, 'curso', e.target.value)}
                                            className={`w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-[#0a192f] placeholder-gray-400 focus:ring-1 focus:ring-[#1e3a8a] outline-none ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                                    <div className="space-y-1.5 pt-[18px]">
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
                ))}
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
