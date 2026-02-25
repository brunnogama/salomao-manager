
import React, { useState } from 'react'
import { Calendar, Building, BookOpen, GraduationCap, Plus, Save, Loader2 } from 'lucide-react'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { Collaborator } from '../../../types/controladoria'
import { supabase } from '../../../lib/supabase'
import { toTitleCase } from '../../controladoria/utils/masks'

interface DadosEscolaridadeSectionProps {
    formData: Partial<Collaborator>
    setFormData: React.Dispatch<React.SetStateAction<Partial<Collaborator>>>
    maskDate: (v: string) => string
    handleRefresh?: () => void
    isViewMode?: boolean
    educationInstitutions?: any[]
    educationCourses?: any[]
}

const educationLevelOptions = [
    { id: 'Ensino Fundamental', label: 'Ensino Fundamental', value: 'Ensino Fundamental' },
    { id: 'Ensino Médio', label: 'Ensino Médio', value: 'Ensino Médio' },
    { id: 'Graduação', label: 'Graduação', value: 'Graduação' },
    { id: 'Pós-Graduação', label: 'Pós-Graduação', value: 'Pós-Graduação' }
]

const postGradOptions = [
    { id: 'Especialização', label: 'Especialização', value: 'Especialização' },
    { id: 'MBA', label: 'MBA', value: 'MBA' },
    { id: 'Mestrado', label: 'Mestrado', value: 'Mestrado' },
    { id: 'Doutorado', label: 'Doutorado', value: 'Doutorado' },
    { id: 'Pós-Doutorado', label: 'Pós-Doutorado', value: 'Pós-Doutorado' }
]

export function DadosEscolaridadeSection({ formData, setFormData, maskDate, handleRefresh, isViewMode = false, educationInstitutions, educationCourses }: DadosEscolaridadeSectionProps) {
    // Institution States
    const [showAddInstitution, setShowAddInstitution] = useState(false)
    const [newInstName, setNewInstName] = useState('')
    const [savingInst, setSavingInst] = useState(false)

    // Course States
    const [showAddCourse, setShowAddCourse] = useState(false)
    const [newCourseName, setNewCourseName] = useState('')
    const [savingCourse, setSavingCourse] = useState(false)

    const [refreshKey, setRefreshKey] = useState(0)

    const handleSaveInstitution = async () => {
        if (!newInstName) return

        setSavingInst(true)
        try {
            const { data, error } = await supabase
                .from('education_institutions')
                .insert({ name: newInstName })
                .select()
                .single()

            if (error) throw error

            if (data) {
                // Update selection with the new ID
                setFormData(prev => ({ ...prev, escolaridade_instituicao: data.id }))
                setNewInstName('')
                setShowAddInstitution(false)
                setRefreshKey(prev => prev + 1)
                if (handleRefresh) handleRefresh()
            }
        } catch (error) {
            console.error('Erro ao salvar instituição:', error)
            alert('Erro ao salvar instituição. Verifique se a tabela existe.')
        } finally {
            setSavingInst(false)
        }
    }

    const handleSaveCourse = async () => {
        if (!newCourseName) return

        setSavingCourse(true)
        try {
            const { data, error } = await supabase
                .from('education_courses')
                .insert({ name: newCourseName })
                .select()
                .single()

            if (error) throw error

            if (data) {
                setFormData(prev => ({ ...prev, escolaridade_curso: data.id }))
                setNewCourseName('')
                setShowAddCourse(false)
                setRefreshKey(prev => prev + 1)
                if (handleRefresh) handleRefresh()
            }
        } catch (error) {
            console.error('Erro ao salvar curso:', error)
            alert('Erro ao salvar curso. Verifique se a tabela existe.')
        } finally {
            setSavingCourse(false)
        }
    }

    const handleLevelChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            escolaridade_nivel: value,
            // Reset sub-level if level changes and is not Pos-Grad
            escolaridade_subnivel: value !== 'Pós-Graduação' ? '' : prev.escolaridade_subnivel
        }))
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nível de Escolaridade */}
                <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                        Nível de Escolaridade
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {educationLevelOptions.map((level) => (
                            <div
                                key={level.id}
                                onClick={() => { if (!isViewMode) handleLevelChange(level.value) }}
                                className={`
                                    ${isViewMode ? 'cursor-default opacity-80' : 'cursor-pointer'} rounded-lg border p-3 flex flex-col items-center justify-center gap-2 transition-all
                                    ${formData.escolaridade_nivel === level.value
                                        ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white shadow-md'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-[#1e3a8a]/50 hover:bg-blue-50/50'
                                    }
                                `}
                            >
                                <GraduationCap className={`h-5 w-5 ${formData.escolaridade_nivel === level.value ? 'text-white' : 'text-[#1e3a8a]'}`} />
                                <span className="text-[10px] font-bold text-center leading-tight">{level.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sub-nível (Pós-Graduação) */}
                {formData.escolaridade_nivel === 'Pós-Graduação' && (
                    <div className="md:col-span-2 space-y-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                            Tipo de Pós-Graduação
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {postGradOptions.map((type) => (
                                <div
                                    key={type.id}
                                    onClick={() => { if (!isViewMode) setFormData(prev => ({ ...prev, escolaridade_subnivel: type.value })) }}
                                    className={`
                                        ${isViewMode ? 'cursor-default opacity-80' : 'cursor-pointer'} px-4 py-2 rounded-full border text-[11px] font-bold transition-all
                                        ${formData.escolaridade_subnivel === type.value
                                            ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-[#1e3a8a] hover:text-[#1e3a8a]'
                                        }
                                    `}
                                >
                                    {type.label}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {formData.escolaridade_nivel && (
                <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nome da Instituição - COM BOTÃO ADICIONAR */}
                        <div className="relative col-span-1 md:col-span-2 space-y-1.5" key={`inst-${refreshKey}`}>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-between">
                                <span>Nome da Instituição</span>
                                {!isViewMode && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAddInstitution(!showAddInstitution)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${showAddInstitution
                                            ? 'bg-[#1e3a8a] text-white shadow-md'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Adicionar
                                    </button>
                                )}
                            </label>

                            <SearchableSelect
                                value={formData.escolaridade_instituicao || ''}
                                onChange={(val) => setFormData(prev => ({ ...prev, escolaridade_instituicao: val }))}
                                placeholder="Selecione a instituição..."
                                table={educationInstitutions ? undefined : "education_institutions"}
                                options={educationInstitutions}
                                onRefresh={handleRefresh}
                                className="w-full"
                                disabled={isViewMode}
                            />

                            {/* PAINEL DE ADICIONAR INSTITUIÇÃO */}
                            {showAddInstitution && (
                                <div className="bg-blue-50 border-2 border-[#1e3a8a] rounded-xl p-5 space-y-4 animate-in slide-in-from-top duration-200 mt-2">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Building className="h-5 w-5 text-[#1e3a8a]" />
                                        <h4 className="text-sm font-black text-[#0a192f] uppercase tracking-wider">
                                            Nova Instituição
                                        </h4>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-[#0a192f] uppercase tracking-wider ml-1">
                                            Nome da Instituição *
                                        </label>
                                        <input
                                            type="text"
                                            value={newInstName}
                                            onChange={(e) => setNewInstName(toTitleCase(e.target.value))}
                                            placeholder="Ex: Universidade Federal..."
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewInstName('')
                                                setShowAddInstitution(false)
                                            }}
                                            className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-gray-700 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveInstitution}
                                            disabled={savingInst || !newInstName}
                                            className="flex items-center gap-2 px-5 py-2 bg-[#1e3a8a] text-white rounded-lg font-black text-[10px] uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {savingInst ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Save className="h-3 w-3" />
                                            )}
                                            Salvar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Curso - COM BOTÃO ADICIONAR */}
                        <div className="relative col-span-1 md:col-span-2 space-y-1.5" key={`course-${refreshKey}`}>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-between">
                                <span>Curso</span>
                                {!isViewMode && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAddCourse(!showAddCourse)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${showAddCourse
                                            ? 'bg-[#1e3a8a] text-white shadow-md'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Adicionar
                                    </button>
                                )}
                            </label>

                            <SearchableSelect
                                value={formData.escolaridade_curso || ''}
                                onChange={(val) => setFormData(prev => ({ ...prev, escolaridade_curso: val }))}
                                placeholder="Selecione o curso..."
                                table={educationCourses ? undefined : "education_courses"}
                                options={educationCourses}
                                onRefresh={handleRefresh}
                                className="w-full"
                                disabled={isViewMode}
                            />

                            {/* PAINEL DE ADICIONAR CURSO */}
                            {showAddCourse && (
                                <div className="bg-blue-50 border-2 border-[#1e3a8a] rounded-xl p-5 space-y-4 animate-in slide-in-from-top duration-200 mt-2">
                                    <div className="flex items-center gap-2 mb-3">
                                        <BookOpen className="h-5 w-5 text-[#1e3a8a]" />
                                        <h4 className="text-sm font-black text-[#0a192f] uppercase tracking-wider">
                                            Novo Curso
                                        </h4>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-[#0a192f] uppercase tracking-wider ml-1">
                                            Nome do Curso *
                                        </label>
                                        <input
                                            type="text"
                                            value={newCourseName}
                                            onChange={(e) => setNewCourseName(toTitleCase(e.target.value))}
                                            placeholder="Ex: Administração..."
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewCourseName('')
                                                setShowAddCourse(false)
                                            }}
                                            className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-gray-700 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveCourse}
                                            disabled={savingCourse || !newCourseName}
                                            className="flex items-center gap-2 px-5 py-2 bg-[#1e3a8a] text-white rounded-lg font-black text-[10px] uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {savingCourse ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Save className="h-3 w-3" />
                                            )}
                                            Salvar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Matrícula */}
                        <div className="relative">
                            <label className="absolute -top-2 left-2 px-1 bg-white text-[10px] font-bold text-[#1e3a8a] z-10">
                                Matrícula
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <BookOpen className="h-4 w-4 text-gray-400 group-focus-within:text-[#1e3a8a] transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.escolaridade_matricula || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, escolaridade_matricula: e.target.value }))}
                                    className={`w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#0a192f] placeholder-gray-300 focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    placeholder="Número da matrícula"
                                    disabled={isViewMode}
                                    readOnly={isViewMode}
                                />
                            </div>
                        </div>

                        {/* Semestre */}
                        <div className="relative">
                            <label className="absolute -top-2 left-2 px-1 bg-white text-[10px] font-bold text-[#1e3a8a] z-10">
                                Semestre Atual
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <GraduationCap className="h-4 w-4 text-gray-400 group-focus-within:text-[#1e3a8a] transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.escolaridade_semestre || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, escolaridade_semestre: e.target.value }))}
                                    className={`w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#0a192f] placeholder-gray-300 focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    placeholder="Ex: 5º Semestre"
                                    disabled={isViewMode}
                                    readOnly={isViewMode}
                                />
                            </div>
                        </div>

                        {/* Previsão de Conclusão */}
                        <div className="relative">
                            <label className="absolute -top-2 left-2 px-1 bg-white text-[10px] font-bold text-[#1e3a8a] z-10">
                                Previsão de Conclusão
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar className="h-4 w-4 text-gray-400 group-focus-within:text-[#1e3a8a] transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.escolaridade_previsao_conclusao || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, escolaridade_previsao_conclusao: maskDate(e.target.value) }))}
                                    maxLength={10}
                                    className={`w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#0a192f] placeholder-gray-300 focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    placeholder="DD/MM/AAAA"
                                    disabled={isViewMode}
                                    readOnly={isViewMode}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
