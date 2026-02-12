
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
}

const UFS = [{ sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' }, { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' }, { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' }, { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' }, { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' }, { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' }, { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' }, { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' }, { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' }];

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
    const [showAddInstitution, setShowAddInstitution] = useState(false)
    const [newInstData, setNewInstData] = useState({ name: '', campus: '', city: '', uf: 'RJ' })
    const [savingInst, setSavingInst] = useState(false)
    const [instKey, setInstKey] = useState(0)

    const handleSaveInstitution = async () => {
        if (!newInstData.name) return

        setSavingInst(true)
        try {
            const { data, error } = await supabase
                .from('education_institutions')
                .insert(newInstData)
                .select()
                .single()

            if (error) throw error

            if (data) {
                // Update selection with the new ID
                setFormData(prev => ({ ...prev, escolaridade_instituicao: data.id }))
                setNewInstData({ name: '', campus: '', city: '', uf: 'RJ' })
                setShowAddInstitution(false)
                setInstKey(prev => prev + 1)
                if (handleRefresh) handleRefresh()
            }
        } catch (error) {
            console.error('Erro ao salvar instituição:', error)
            alert('Erro ao salvar instituição. Verifique se a tabela existe.')
        } finally {
            setSavingInst(false)
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
                        {/* Nome da Instituição - COM BOTÃO ADICIONAR */}
                        <div className="relative col-span-1 md:col-span-2 space-y-1.5" key={instKey}>
                            <label className="text-[10px] bg-white px-1 font-bold text-[#1e3a8a] z-10 uppercase tracking-wider flex items-center justify-between">
                                <span>Nome da Instituição</span>
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
                            </label>

                            <SearchableSelect
                                value={formData.escolaridade_instituicao || ''}
                                onChange={(val) => setFormData(prev => ({ ...prev, escolaridade_instituicao: val }))}
                                placeholder="Selecione a instituição..."
                                table="education_institutions"
                                onRefresh={handleRefresh}
                                className="w-full"
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

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* NOME */}
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-[10px] font-black text-[#0a192f] uppercase tracking-wider ml-1">
                                                Nome da Instituição *
                                            </label>
                                            <input
                                                type="text"
                                                value={newInstData.name}
                                                onChange={(e) => setNewInstData({ ...newInstData, name: toTitleCase(e.target.value) })}
                                                placeholder="Ex: Universidade Federal..."
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium"
                                            />
                                        </div>

                                        {/* CAMPUS */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-[#0a192f] uppercase tracking-wider ml-1">
                                                Campus
                                            </label>
                                            <input
                                                type="text"
                                                value={newInstData.campus}
                                                onChange={(e) => setNewInstData({ ...newInstData, campus: toTitleCase(e.target.value) })}
                                                placeholder="Ex: Campus Central"
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium"
                                            />
                                        </div>

                                        {/* CIDADE E UF */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="col-span-2 space-y-1.5">
                                                <label className="text-[10px] font-black text-[#0a192f] uppercase tracking-wider ml-1">
                                                    Cidade
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newInstData.city}
                                                    onChange={(e) => setNewInstData({ ...newInstData, city: toTitleCase(e.target.value) })}
                                                    placeholder="Cidade"
                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-[#0a192f] uppercase tracking-wider ml-1">
                                                    UF
                                                </label>
                                                <select
                                                    value={newInstData.uf}
                                                    onChange={(e) => setNewInstData({ ...newInstData, uf: e.target.value })}
                                                    className="w-full px-2 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium"
                                                >
                                                    {UFS.map(uf => (
                                                        <option key={uf.sigla} value={uf.sigla}>{uf.sigla}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewInstData({ name: '', campus: '', city: '', uf: 'RJ' })
                                                setShowAddInstitution(false)
                                            }}
                                            className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-gray-700 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveInstitution}
                                            disabled={savingInst || !newInstData.name}
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
