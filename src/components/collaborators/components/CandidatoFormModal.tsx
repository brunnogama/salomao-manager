import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { CollaboratorPageLayout } from './CollaboratorLayouts'
import { DadosPessoaisSection } from './DadosPessoaisSection'
import { CandidatoHistoricoSection } from './CandidatoHistoricoSection'
import { AlertModal } from '../../ui/AlertModal'
import { User, BookOpen, FileText } from 'lucide-react'
import { GEDSection } from './GEDSection'
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

    // GED State
    const [gedCategories] = useState(['Currículo', 'Portfólio', 'Certificado', 'Outros'])
    const [selectedGedCategory, setSelectedGedCategory] = useState('')
    const [atestadoDatas, setAtestadoDatas] = useState<{ inicio: string, fim: string }>({ inicio: '', fim: '' })
    const gedInputRef = React.useRef<HTMLInputElement>(null)
    const [gedDocs, setGedDocs] = useState<any[]>([])
    const [pendingGedDocs, setPendingGedDocs] = useState<{ file: File, categoria: string, dateInfo?: any }[]>([])

    useEffect(() => {
        if (isOpen) {
            setActiveTab(1)
            fetchTags()
            setPendingGedDocs([])
            setSelectedGedCategory('')
            if (candidatoId) {
                fetchCandidato(candidatoId)
                fetchGedDocs(candidatoId)
            } else {
                setFormData({})
                setGedDocs([])
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

    const fetchGedDocs = async (id: string) => {
        try {
            const { data, error } = await supabase
                .from('candidato_ged')
                .select('*')
                .eq('candidato_id', id)
            if (error) throw error
            if (data) setGedDocs(data)
        } catch (e: any) {
            console.error('Erro ao buscar documentos:', e.message)
        }
    }

    // GED Handlers
    const handleGedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && selectedGedCategory) {
            const file = e.target.files[0]
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert('Arquivo muito grande! Máximo de 10MB permitidos.')
                if (gedInputRef.current) gedInputRef.current.value = ''
                return
            }

            const newDoc = {
                file,
                categoria: selectedGedCategory,
                dateInfo: selectedGedCategory === 'Atestado' ? { ...atestadoDatas } : undefined
            }
            setPendingGedDocs(prev => [...prev, newDoc])
            setSelectedGedCategory('')
            setAtestadoDatas({ inicio: '', fim: '' })
            if (gedInputRef.current) gedInputRef.current.value = ''
        } else if (!selectedGedCategory) {
            alert('Por favor, selecione uma categoria antes de enviar o arquivo.')
        }
    }

    const handleDeleteGed = async (id?: string, pendingIndex?: number) => {
        if (!confirm('Deseja realmente excluir este documento?')) return;
        setLoading(true);
        try {
            if (id) {
                const docToDelete = gedDocs.find(d => d.id === id);
                if (docToDelete?.url) {
                    const filePath = docToDelete.url.split('public/salomao-docs/')[1];
                    if (filePath) await supabase.storage.from('salomao-docs').remove([filePath]);
                }
                const { error } = await supabase.from('candidato_ged').delete().eq('id', id);
                if (error) throw error;
                fetchGedDocs(candidatoId!);
            } else if (pendingIndex !== undefined) {
                setPendingGedDocs(prev => prev.filter((_, i) => i !== pendingIndex));
            }
        } catch (e: any) {
            alert('Erro ao excluir documento: ' + e.message);
        } finally {
            setLoading(false);
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

            // Upload pending GED docs
            const finalCandidatoId = candidatoId || (await supabase.from('candidatos').select('id').eq('nome', payload.nome).order('created_at', { ascending: false }).limit(1).single()).data?.id;

            if (finalCandidatoId && pendingGedDocs.length > 0) {
                for (const doc of pendingGedDocs) {
                    const fileExt = doc.file.name.split('.').pop()
                    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
                    const filePath = `candidatos/${finalCandidatoId}/ged/${fileName}`

                    const { error: uploadError } = await supabase.storage.from('salomao-docs').upload(filePath, doc.file)
                    if (uploadError) console.error('Error uploading file:', uploadError.message)
                    else {
                        const { data: { publicUrl } } = supabase.storage.from('salomao-docs').getPublicUrl(filePath)
                        const { error: dbError } = await supabase.from('candidato_ged').insert({
                            candidato_id: finalCandidatoId,
                            nome_arquivo: doc.file.name,
                            tamanho: doc.file.size,
                            categoria: doc.categoria,
                            url: publicUrl,
                            // At present we assume the current user is logged in
                            uploaded_by: (await supabase.auth.getUser()).data.user?.id || null
                        })
                        if (dbError) console.error('Error registering file in db:', dbError.message)
                    }
                }
                setPendingGedDocs([])
                if (candidatoId) fetchGedDocs(candidatoId)
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
        { id: 3, label: 'GED / Arquivos', icon: FileText },
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
            {activeTab === 3 && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                    <GEDSection
                        gedCategories={gedCategories}
                        selectedGedCategory={selectedGedCategory}
                        setSelectedGedCategory={setSelectedGedCategory}
                        atestadoDatas={atestadoDatas}
                        setAtestadoDatas={setAtestadoDatas}
                        gedInputRef={gedInputRef}
                        handleGedUpload={handleGedUpload}
                        gedDocs={gedDocs}
                        pendingGedDocs={pendingGedDocs}
                        setPendingGedDocs={setPendingGedDocs}
                        handleDeleteGed={handleDeleteGed}
                    />
                </div>
            )}
        </CollaboratorPageLayout>
    )
}
