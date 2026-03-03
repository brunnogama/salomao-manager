import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { CollaboratorPageLayout } from './CollaboratorLayouts'
import { DadosPessoaisSection } from './DadosPessoaisSection'
import { CandidatoHistoricoSection } from './CandidatoHistoricoSection'
import { AlertModal } from '../../ui/AlertModal'
import { User, BookOpen } from 'lucide-react'
import { Candidato } from '../../../types/controladoria' // We will add this type later
import {
    maskCPF,
    maskDate,
    maskRG,
    maskPhone,
    maskCNPJ
} from '../utils/colaboradoresUtils'

interface CandidatoFormModalProps {
    isOpen: boolean
    onClose: () => void
    candidatoId?: string | null
    onSave: () => void
}

export function CandidatoFormModal({ isOpen, onClose, candidatoId, onSave }: CandidatoFormModalProps) {
    const [activeTab, setActiveTab] = useState(1)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<any>>({})

    // Tagging system state
    const [isTagging, setIsTagging] = useState(false)
    const [tagSearch, setTagSearch] = useState('')
    const [cursorPosition, setCursorPosition] = useState(0)
    const [availableTags, setAvailableTags] = useState<string[]>([])

    useEffect(() => {
        if (isOpen) {
            setActiveTab(1)
            fetchTags()
            if (candidatoId) {
                fetchCandidato(candidatoId)
            } else {
                setFormData({})
            }
        }
    }, [isOpen, candidatoId])

    const fetchTags = async () => {
        try {
            const { data, error } = await supabase.from('perfil_tags').select('tag').order('tag')
            if (!error && data) {
                setAvailableTags(data.map(d => d.tag))
            }
        } catch (e) {
            console.error('Error fetching tags:', e)
        }
    }

    const fetchCandidato = async (id: string) => {
        try {
            const { data, error } = await supabase
                .from('candidatos')
                .select('*')
                .eq('id', id)
                .single()
            if (error) throw error
            setFormData(data)
        } catch (error) {
            console.error('Error fetching candidato:', error)
        }
    }

    const handleSave = async () => {
        // Basic validation
        if (!formData.nome) {
            // error
            return
        }

        try {
            setLoading(true)
            const payload = {
                ...formData
            }

            if (candidatoId) {
                const { error } = await supabase.from('candidatos').update(payload).eq('id', candidatoId)
                if (error) throw error
            } else {
                const { error: insertError } = await supabase.from('candidatos').insert([payload])
                if (insertError) throw insertError
            }

            // Extract tags from form data and upsert to perfil_tags
            if (payload.perfil) {
                const lines = payload.perfil.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
                if (lines.length > 0) {
                    const tagsToInsert = lines.map((t: string) => ({ tag: t }));
                    const { error: tagError } = await supabase.from('perfil_tags').upsert(tagsToInsert, { onConflict: 'tag' });
                    if (tagError) console.error("Error upserting tags", tagError);
                }
            }

            onSave()
            onClose()
        } catch (error) {
            console.error('Error saving:', error)
        } finally {
            setLoading(false)
        }
    }

    // Tagging Logic
    const handlePerfilChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        const position = e.target.selectionStart;
        setFormData({ ...formData, perfil: text });

        // Check if we just typed '@'
        const lastAtSymbol = text.lastIndexOf('@', position - 1);
        const lastNewLine = text.lastIndexOf('\n', position - 1);

        // Determine if we are actively tagging (bound to current line)
        const bound = lastNewLine;
        if (lastAtSymbol > bound) {
            setIsTagging(true);
            setTagSearch(text.substring(lastAtSymbol + 1, position));
            setCursorPosition(lastAtSymbol);
        } else {
            setIsTagging(false);
        }
    }

    const insertTag = (tagText: string) => {
        if (!formData.perfil) return;
        const currentText = formData.perfil;
        const beforeTag = currentText.substring(0, cursorPosition);

        // Find where the current line ends
        const nextNewLine = currentText.indexOf('\n', cursorPosition);
        const afterTag = nextNewLine !== -1 ? currentText.substring(nextNewLine) : '';

        // Format tag (just insert text cleanly without @)
        const newText = `${beforeTag}${tagText}${afterTag}`;

        setFormData({ ...formData, perfil: newText });
        setIsTagging(false);
        setTagSearch('');
    }

    const steps = [
        { id: 1, label: 'Dados Pessoais', icon: User },
        { id: 2, label: 'Histórico', icon: BookOpen },
    ]

    if (!isOpen) return null

    return (
        <CollaboratorPageLayout
            title={formData.nome || 'Novo Candidato'}
            onClose={onClose}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isEditMode={true}
            currentSteps={steps}
            footer={
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl shadow-lg hover:shadow-xl font-bold transition-all flex items-center gap-2 text-[10px] uppercase tracking-wider"
                >
                    {loading ? 'Salvando...' : 'Salvar Cadastro'}
                </button>
            }
        >
            {activeTab === 1 && (
                <div className="space-y-6">
                    <DadosPessoaisSection
                        formData={formData}
                        setFormData={setFormData}
                        maskCPF={maskCPF}
                        maskDate={maskDate}
                        maskRG={maskRG}
                        maskPhone={maskPhone}
                        maskCNPJ={maskCNPJ}
                        isViewMode={false}
                    />
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mt-6">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex justify-between items-center">
                            Perfil e Tags
                            <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">Use @ para pesquisar tags</span>
                        </label>
                        <div className="relative">
                            <textarea
                                value={formData.perfil || ''}
                                onChange={handlePerfilChange}
                                placeholder="Descreva o perfil (cada linha salva vira uma tag)&#10;Ex:&#10;Experiência no contencioso cível&#10;Legalone&#10;&#10;Dica: Use @ para buscar na nuvem de talentos"
                                className="w-full bg-gray-50 border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-3 outline-none font-medium transition-all min-h-[120px] resize-y"
                            />

                            {/* Sub-menu for @ tags */}
                            {isTagging && (
                                <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-gray-100 z-10 max-h-48 overflow-y-auto">
                                    {availableTags
                                        .filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()))
                                        .map(t => (
                                            <button
                                                key={t}
                                                onClick={() => insertTag(t)}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-50 last:border-0"
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    {availableTags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase())).length === 0 && (
                                        <div className="px-4 py-3 text-sm text-gray-400 text-center">Nenhuma tag encontrada para "{tagSearch}"</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 2 && (
                <CandidatoHistoricoSection
                    candidatoId={candidatoId || null}
                    isViewMode={false}
                />
            )}
        </CollaboratorPageLayout>
    )
}
