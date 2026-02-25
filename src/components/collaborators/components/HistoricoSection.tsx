import { useState, useEffect } from 'react'
import { AlertTriangle, FileText, Save, Loader2, History, ChevronRight } from 'lucide-react'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { Collaborator } from '../../../types/controladoria'
import { supabase } from '../../../lib/supabase'

interface HistoricoSectionProps {
    formData: Partial<Collaborator>
    setFormData: React.Dispatch<React.SetStateAction<Partial<Collaborator>>>
    maskDate: (v: string) => string
    isViewMode?: boolean
}

export function HistoricoSection({ formData, setFormData, maskDate, isViewMode = false }: HistoricoSectionProps) {
    const [activeSection, setActiveSection] = useState<'none' | 'warnings' | 'absences' | 'observations'>('none')
    const [loading, setLoading] = useState(false)

    // --- ADVERTÊNCIAS STATE ---
    const [warningReason, setWarningReason] = useState('')
    const [warningDesc, setWarningDesc] = useState('')


    // --- OBSERVAÇÕES STATE ---
    const [obsText, setObsText] = useState(formData.history_observations || '')

    // Atualiza obsText se formData mudar
    useEffect(() => {
        if (formData.history_observations) setObsText(formData.history_observations)
    }, [formData.history_observations])

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
            alert('Advertência salva com sucesso!')
            setWarningReason('')
            setWarningDesc('')
            setActiveSection('none')
        } catch (e: any) {
            alert('Erro ao salvar: ' + e.message)
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
            alert('Observações atualizadas!')
            setActiveSection('none')
        } catch (e: any) {
            alert('Erro ao salvar: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            {/* BUTTONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Advertências */}
                <button
                    onClick={() => setActiveSection(activeSection === 'warnings' ? 'none' : 'warnings')}
                    className={`
                        relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 text-left group
                        ${activeSection === 'warnings'
                            ? 'bg-red-50 border-red-200 shadow-md transform scale-[1.02]'
                            : 'bg-white border-gray-100 hover:border-red-200 hover:shadow-lg'
                        }
                    `}
                >
                    <div className={`p-3 rounded-xl w-fit mb-3 transition-colors ${activeSection === 'warnings' ? 'bg-red-200 text-red-700' : 'bg-red-50 text-red-500 group-hover:bg-red-100'}`}>
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider mb-1">Advertências</h3>
                    <p className="text-[10px] text-gray-500 font-medium">Registrar ocorrências e infrações</p>
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${activeSection === 'warnings' ? 'rotate-90 opacity-100' : 'opacity-0 -translate-x-2'}`}>
                        <ChevronRight className="h-5 w-5 text-red-500" />
                    </div>
                </button>


                {/* Observações */}
                <button
                    onClick={() => setActiveSection(activeSection === 'observations' ? 'none' : 'observations')}
                    className={`
                        relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 text-left group
                        ${activeSection === 'observations'
                            ? 'bg-amber-50 border-amber-200 shadow-md transform scale-[1.02]'
                            : 'bg-white border-gray-100 hover:border-amber-200 hover:shadow-lg'
                        }
                    `}
                >
                    <div className={`p-3 rounded-xl w-fit mb-3 transition-colors ${activeSection === 'observations' ? 'bg-amber-200 text-amber-700' : 'bg-amber-50 text-amber-500 group-hover:bg-amber-100'}`}>
                        <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider mb-1">Observações</h3>
                    <p className="text-[10px] text-gray-500 font-medium">Anotações gerais e histórico</p>
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${activeSection === 'observations' ? 'rotate-90 opacity-100' : 'opacity-0 -translate-x-2'}`}>
                        <ChevronRight className="h-5 w-5 text-amber-500" />
                    </div>
                </button>
            </div>

            {/* SECTIONS CONTENT */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[300px] relative">
                {activeSection === 'none' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                        <History className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-sm font-medium">Selecione uma opção acima para visualizar</p>
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
                                    placeholder="Digite aqui observações gerais, anotações de reuniões ou pontos de atenção sobre o colaborador..."
                                    value={obsText}
                                    onChange={e => setObsText(e.target.value)}
                                    disabled={isViewMode}
                                    readOnly={isViewMode}
                                />
                            </div>

                            {!isViewMode && (
                                <div className="flex justify-end pt-4">
                                    <button
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
            </div>
        </div>
    )
}
