
import React from 'react'
import { Calendar, Building, BookOpen, GraduationCap } from 'lucide-react'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { Collaborator } from '../../../types/controladoria'

interface DadosEscolaridadeSectionProps {
    formData: Partial<Collaborator>
    setFormData: React.Dispatch<React.SetStateAction<Partial<Collaborator>>>
    maskDate: (v: string) => string
    handleRefresh?: () => void
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

export function DadosEscolaridadeSection({ formData, setFormData, maskDate, handleRefresh }: DadosEscolaridadeSectionProps) {

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
                <div className="relative">
                    <SearchableSelect
                        label="Nível de Escolaridade"
                        value={formData.escolaridade_nivel || ''}
                        onChange={handleLevelChange}
                        options={educationLevelOptions}
                        placeholder="Selecione o nível..."
                    />
                </div>

                {/* Sub-nível (Pós-Graduação) */}
                {formData.escolaridade_nivel === 'Pós-Graduação' && (
                    <div className="relative animate-in fade-in zoom-in duration-300">
                        <SearchableSelect
                            label="Tipo de Pós-Graduação"
                            value={formData.escolaridade_subnivel || ''}
                            onChange={(val) => setFormData(prev => ({ ...prev, escolaridade_subnivel: val }))}
                            options={postGradOptions}
                            placeholder="Selecione o tipo..."
                        />
                    </div>
                )}
            </div>

            {formData.escolaridade_nivel && (
                <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nome da Instituição */}
                        <div className="relative col-span-1 md:col-span-2">
                            <label className="absolute -top-2 left-2 px-1 bg-white text-[10px] font-bold text-[#1e3a8a] z-10">
                                Nome da Instituição
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Building className="h-4 w-4 text-gray-400 group-focus-within:text-[#1e3a8a] transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.escolaridade_instituicao || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, escolaridade_instituicao: e.target.value }))}
                                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#0a192f] placeholder-gray-300 focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all"
                                    placeholder="Ex: Universidade Federal..."
                                />
                            </div>
                        </div>

                        {/* Curso */}
                        <div className="relative col-span-1 md:col-span-2">
                            <SearchableSelect
                                label="Curso"
                                value={formData.escolaridade_curso || ''}
                                onChange={(val) => setFormData(prev => ({ ...prev, escolaridade_curso: val }))}
                                table="education_courses"
                                placeholder="Selecione ou gerencie..."
                                onRefresh={handleRefresh}
                            />
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
                                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#0a192f] placeholder-gray-300 focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all"
                                    placeholder="Número da matrícula"
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
                                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#0a192f] placeholder-gray-300 focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all"
                                    placeholder="Ex: 5º Semestre"
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
                                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-[#0a192f] placeholder-gray-300 focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all"
                                    placeholder="DD/MM/AAAA"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
