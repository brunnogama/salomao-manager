import React, { useState, useEffect } from 'react'
import { useCloseOnEscape } from '../../../hooks/useCloseOnEscape'
import { supabase } from '../../../lib/supabase'
import { CollaboratorModalLayout } from './CollaboratorLayouts'
import { DadosPessoaisSection } from './DadosPessoaisSection'
import { CandidatoHistoricoSection } from './CandidatoHistoricoSection'
import { DadosProfissionaisCandidato } from './DadosProfissionaisCandidato'
import { User, BookOpen, FileText, Briefcase, Hash, X, Sparkles, Bot, Loader2 } from 'lucide-react'
import { GEDSection } from './GEDSection'
import { EnderecoSection } from './EnderecoSection'
import {
    maskCPF,
    maskDate,
    maskRG,
    maskPhone,
    maskCNPJ,
    maskCEP
} from '../utils/colaboradoresUtils'

interface CandidatoFormModalProps {
    isOpen: boolean
    onClose: () => void
    candidatoId?: string | null
    onSave: () => void
}

export function CandidatoFormModal({ isOpen, onClose, candidatoId, onSave }: CandidatoFormModalProps) {
    useCloseOnEscape(isOpen, onClose)

    const [activeTab, setActiveTab] = useState(1)
    const [loading, setLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<any>>({})

    // Tagging system state
    const [isTagging, setIsTagging] = useState(false)
    const [tagSearch, setTagSearch] = useState('')
    const [tagInputValue, setTagInputValue] = useState('')
    const [availableTags, setAvailableTags] = useState<string[]>([])

    // GED State
    const [gedCategories] = useState([
        { id: 'Currículo', name: 'Currículo' },
        { id: 'Portfólio', name: 'Portfólio' },
        { id: 'Certificado', name: 'Certificado' },
        { id: 'Outros', name: 'Outros' }
    ])
    const [selectedGedCategory, setSelectedGedCategory] = useState('')
    const [atestadoDatas, setAtestadoDatas] = useState<{ inicio: string, fim: string }>({ inicio: '', fim: '' })
    const gedInputRef = React.useRef<HTMLInputElement>(null)
    const [gedDocs, setGedDocs] = useState<any[]>([])
    const [pendingGedDocs, setPendingGedDocs] = useState<{ file: File, category: string, label?: string, tempId: string, atestadoDatas?: { inicio: string, fim: string } }[]>([])
    const [pendingHistorico, setPendingHistorico] = useState<any[]>([])
    const [pendingExperiencias, setPendingExperiencias] = useState<any[]>([])
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type: 'success' | 'warning' | 'error' }>({ isOpen: false, title: '', message: '', type: 'success' })

    const showAlert = (title: string, message: string, type: 'success' | 'warning' | 'error') => {
        setAlertConfig({ isOpen: true, title, message, type });
    }

    useEffect(() => {
        if (isOpen) {
            setActiveTab(1)
            fetchTags()
            setPendingGedDocs([])
            setPendingHistorico([])
            setPendingExperiencias([])
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
            // Map DB 'nome' to 'name' for DadosPessoaisSection compatibility
            if (data && data.nome) {
                data.name = data.nome;
            }
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

    const handleCepBlur = async () => {
        if (formData.zip_code?.length === 9) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${formData.zip_code.replace('-', '')}/json/`)
                const data = await response.json()
                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        address: data.logradouro,
                        neighborhood: data.bairro,
                        city: data.localidade,
                        state: data.uf
                    }))
                }
            } catch (error) {
                console.error('Erro ao buscar CEP:', error)
            }
        }
    }

    const handleExtractResumeAI = async () => {
        if (!candidatoId) {
            showAlert('Atenção', 'Você precisa salvar o candidato pela primeira vez (para gerar um ID) antes de usar a IA.', 'warning');
            return;
        }

        // Verifica se há CV no pending docs ou GED pra avisar o user
        const hasStoredCV = gedDocs.some(d => d.Categoria === 'Currículo');
        const hasPendingCV = pendingGedDocs.some(d => d.category === 'Currículo');

        if (!hasStoredCV && !hasPendingCV) {
            showAlert('Atenção', 'Faça o upload de um PDF classificado como "Currículo" na aba Arquivos primeiro.', 'warning');
            return;
        }
        if (!hasStoredCV && hasPendingCV) {
            showAlert('Atenção', 'Salve o cadastro para enviar o PDF pendente antes de rodar a IA.', 'warning');
            return;
        }

        try {
            setAiLoading(true);
            const { data, error } = await supabase.functions.invoke('analisar-curriculo-cv', {
                body: { candidatoId }
            });

            if (error) {
                throw new Error(error.message || "Erro desconhecido na Edge Function");
            }
            if (data?.error) {
                throw new Error(data.error);
            }

            if (data?.data) {
                const { resumoProfissional, perfilTags, sugestaoCargo } = data.data;

                // Merge no formData
                setFormData(prev => {
                    const currentTags = (prev.perfil || '').split('\n').filter(Boolean);
                    const newTagsArray = [...new Set([...currentTags, ...(perfilTags || [])])];

                    return {
                        ...prev,
                        resumo_cv: resumoProfissional || prev.resumo_cv,
                        perfil: newTagsArray.join('\n'),
                        role: prev.role || sugestaoCargo // Só sugere cargo se estiver sem
                    };
                });

                showAlert('Sucesso', 'Currículo analisado! O resumo e as tags foram preenchidos (veja a aba "Dados Profissionais" para sugestão de cargo se ele estava vazio).', 'success');
            } else {
                throw new Error("Resposta inválida da Inteligência Artificial.");
            }
        } catch (e: any) {
            showAlert('Erro Processamento IA', e.message, 'error');
        } finally {
            setAiLoading(false);
        }
    };

    // GED Handlers
    const handleGedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && selectedGedCategory) {
            const file = e.target.files[0]
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                showAlert('Atenção', 'Arquivo muito grande! Máximo de 10MB permitidos.', 'warning')
                if (gedInputRef.current) gedInputRef.current.value = ''
                return
            }

            const tempId = Math.random().toString(36).substring(7);
            const newDoc = {
                file,
                category: selectedGedCategory,
                label: file.name,
                tempId,
                atestadoDatas: selectedGedCategory === 'Atestado Médico' ? { ...atestadoDatas } : undefined
            }
            setPendingGedDocs(prev => [...prev, newDoc])
            setSelectedGedCategory('')
            setAtestadoDatas({ inicio: '', fim: '' })
            if (gedInputRef.current) gedInputRef.current.value = ''
        } else if (!selectedGedCategory) {
            showAlert('Atenção', 'Por favor, selecione uma categoria antes de enviar o arquivo.', 'warning')
        }
    }

    const handleDeleteGed = async (doc: any) => {
        if (!confirm('Deseja realmente excluir este documento?')) return;
        setLoading(true);
        try {
            if (doc.id) {
                const docToDelete = gedDocs.find(d => d.id === doc.id);
                if (docToDelete?.url) {
                    const filePath = docToDelete.url.split('public/salomao-docs/')[1];
                    if (filePath) await supabase.storage.from('salomao-docs').remove([filePath]);
                }
                const { error } = await supabase.from('candidato_ged').delete().eq('id', doc.id);
                if (error) throw error;
                fetchGedDocs(candidatoId!);
            } else if (doc.tempId !== undefined) {
                setPendingGedDocs(prev => prev.filter(p => p.tempId !== doc.tempId));
            }
        } catch (e: any) {
            showAlert('Erro', 'Erro ao excluir documento: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    const handleSave = async () => {
        // Basic validation
        if (!formData.name && !formData.nome) {
            showAlert('Atenção', 'Nome do candidato é obrigatório.', 'warning')
            return
        }

        try {
            setLoading(true)
            const payload = {
                ...formData
            }

            // Map 'name' back to 'nome' for DB compatibility and clean up non-DB fields
            if (payload.name) {
                payload.nome = payload.name;
                delete payload.name;
            }
            // Remove relationship arrays that might be in formData
            delete payload.candidato_historico;
            delete payload.candidato_experiencias;
            delete payload.candidato_ged;

            // Allowed fields based on the actual Candidato schema via OpenAPI
            const allowedFields = [
                'nome', 'email', 'telefone', 'linkedin', 'curriculo_url', 'perfil', 'resumo_cv', 'role', 'local', 'area', 'contract_type',
                'gender', 'rg', 'cpf', 'birthday', 'civil_status', 'email_pessoal', 'linkedin_url',
                'has_children', 'children_count', 'children_data'
            ];

            const cleanPayload: any = {};
            allowedFields.forEach(field => {
                if (payload[field] !== undefined) {
                    cleanPayload[field] = payload[field];
                }
            });

            console.log('--- ENVIANDO CANDIDATO PARA O BANCO ---');
            console.log('Payload limpo:', cleanPayload);
            console.log('ID do Candidato:', candidatoId);

            if (candidatoId) {
                const { error } = await supabase.from('candidatos').update(cleanPayload).eq('id', candidatoId)
                if (error) {
                    console.error('Erro no update do candidato:', error);
                    throw error;
                }
            } else {
                const { error: insertError } = await supabase.from('candidatos').insert([cleanPayload])
                if (insertError) {
                    console.error('Erro no insert do candidato:', insertError);
                    throw insertError;
                }
            }

            console.log('Candidato salvo com sucesso!');

            // Extract tags from form data and upsert to perfil_tags
            if (cleanPayload.perfil) {
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
                            Categoria: doc.category,
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

            if (finalCandidatoId && pendingGedDocs.length > 0) {
                // ...
            }

            // Save pending Historico
            if (finalCandidatoId && pendingHistorico.length > 0) {
                const historicoPayload = pendingHistorico.map(h => ({ ...h, candidato_id: finalCandidatoId }));
                const { error: histError } = await supabase.from('candidato_historico').insert(historicoPayload);
                if (histError) console.error("Error saving pending historico", histError);
            }

            // Save pending Experiencias
            if (finalCandidatoId && pendingExperiencias.length > 0) {
                const expPayload = pendingExperiencias.map(e => {
                    const { temp_id, ...rest } = e;
                    return { ...rest, candidato_id: finalCandidatoId };
                });
                const { error: expError } = await supabase.from('candidato_experiencias').insert(expPayload);
                if (expError) console.error("Error saving pending experiencias", expError);

                for (const exp of pendingExperiencias) {
                    if (exp.perfil) {
                        const lines = exp.perfil.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
                        if (lines.length > 0) {
                            const tagsToInsert = lines.map((t: string) => ({ tag: t }));
                            await supabase.from('perfil_tags').upsert(tagsToInsert, { onConflict: 'tag' });
                        }
                    }
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
    const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setTagInputValue(text);

        const lastAtSymbol = text.lastIndexOf('@');
        if (lastAtSymbol !== -1) {
            setIsTagging(true);
            setTagSearch(text.substring(lastAtSymbol + 1));
        } else {
            setIsTagging(false);
            setTagSearch('');
        }
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (isTagging) return; // deixa o usuario escolher do menu

            const text = tagInputValue.trim().replace(/^@/, '');
            if (text) {
                addTagToFormData(text);
                setTagInputValue('');
                setIsTagging(false);
            }
        } else if (e.key === 'Backspace' && tagInputValue === '') {
            e.preventDefault();
            const currentTags = (formData.perfil || '').split('\n').filter(Boolean);
            if (currentTags.length > 0) {
                currentTags.pop();
                setFormData({ ...formData, perfil: currentTags.join('\n') });
            }
        }
    };

    const addTagToFormData = (tagText: string) => {
        const currentTags = (formData.perfil || '').split('\n').filter(Boolean);
        if (!currentTags.includes(tagText)) {
            currentTags.push(tagText);
            setFormData({ ...formData, perfil: currentTags.join('\n') });
        }
    };

    const removeTagFromFormData = (indexToRemove: number) => {
        const currentTags = (formData.perfil || '').split('\n').filter(Boolean);
        currentTags.splice(indexToRemove, 1);
        setFormData({ ...formData, perfil: currentTags.join('\n') });
    };

    const insertTag = (tagText: string) => {
        addTagToFormData(tagText);
        setTagInputValue('');
        setIsTagging(false);
        setTagSearch('');
    };

    const steps = [
        { id: 1, label: 'Dados Pessoais', icon: User },
        { id: 2, label: 'Dados Profissionais', icon: Briefcase },
        { id: 3, label: 'Perfil e Tags', icon: Hash },
        { id: 4, label: 'Histórico', icon: BookOpen },
        { id: 5, label: 'GED / Arquivos', icon: FileText },
    ]

    if (!isOpen) return null

    return (
        <CollaboratorModalLayout
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
                        hideBankingAndEmergency={true}
                    />
                    <EnderecoSection
                        formData={formData}
                        setFormData={setFormData}
                        maskCEP={maskCEP}
                        handleCepBlur={handleCepBlur}
                        isViewMode={false}
                    />
                </div>
            )}
            {activeTab === 2 && (
                <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
                    <DadosProfissionaisCandidato
                        formData={formData}
                        setFormData={setFormData}
                        isViewMode={false}
                        candidatoId={candidatoId || null}
                        pendingExperiencias={pendingExperiencias}
                        setPendingExperiencias={setPendingExperiencias}
                        showAlert={showAlert}
                    />
                </div>
            )}
            {activeTab === 3 && (
                <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
                    {/* IA Resume Generation Header Box */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 p-5 rounded-xl shadow-sm relative overflow-hidden group/ai">
                        <div className="absolute top-0 right-0 p-4 opacity-10 blur-sm scale-150 group-hover/ai:rotate-12 transition-transform duration-700 pointer-events-none">
                            <Sparkles className="w-24 h-24 text-indigo-500" />
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                            <div>
                                <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2 mb-1">
                                    <Bot className="w-5 h-5 text-indigo-600" />
                                    Analisador IA de Currículos
                                </h4>
                                <p className="text-xs text-indigo-700/80 font-medium">Extraia resumo e habilidades automaticamente lendo o PDF anexado do currículo do talento.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleExtractResumeAI}
                                disabled={aiLoading}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-200" />}
                                {aiLoading ? 'Lendo PDF...' : 'Extrair com IA'}
                            </button>
                        </div>
                    </div>

                    {/* Resumo Textarea */}
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                            Resumo Profissional / CV
                        </label>
                        <textarea
                            className="w-full bg-gray-50 border border-gray-200 text-[#0a192f] text-sm rounded-xl p-4 min-h-[140px] focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none transition-all resize-y shadow-sm font-medium"
                            placeholder="Descreva brevemente o profissional, principais qualificações, anos de experiência ou use o botão da IA 🪄 acima para preencher via currículo."
                            value={formData.resumo_cv || ''}
                            onChange={(e) => setFormData({ ...formData, resumo_cv: e.target.value })}
                        />
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex justify-between items-center">
                            Perfil e Tags
                            <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">Use @ para pesquisar tags</span>
                        </label>
                        <div className="relative flex-1 flex flex-col">
                            <div className="w-full bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 focus-within:border-[#1e3a8a] p-3 transition-all min-h-[300px] flex-1 flex flex-col items-start relative cursor-text group">

                                {isTagging && availableTags.length > 0 && (
                                    <div className="absolute top-12 left-3 w-[80%] max-w-sm bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] max-h-48 overflow-y-auto ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-3 py-2 text-[10px] font-black text-blue-800 bg-blue-50/50 border-b border-blue-100 uppercase tracking-widest sticky top-0 backdrop-blur-sm">
                                            Sugestões da Nuvem
                                        </div>
                                        <div className="p-1">
                                            {availableTags
                                                .filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()))
                                                .filter(t => !(formData.perfil || '').split('\n').filter(Boolean).includes(t))
                                                .map(t => (
                                                    <button
                                                        key={t}
                                                        onClick={() => insertTag(t)}
                                                        className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-[#1e3a8a] transition-all rounded-lg flex items-center gap-2 group/btn"
                                                    >
                                                        <Hash className="h-3 w-3 text-gray-400 group-hover/btn:text-[#1e3a8a] transition-colors" />
                                                        {t}
                                                    </button>
                                                ))}
                                        </div>
                                        {availableTags
                                            .filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()))
                                            .filter(t => !(formData.perfil || '').split('\n').filter(Boolean).includes(t))
                                            .length === 0 && (
                                                <div className="px-4 py-3 text-xs text-gray-400 text-center font-medium">Nenhuma tag encontrada para "{tagSearch}"</div>
                                            )}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2 w-full">
                                    {(formData.perfil || '').split('\n').filter(Boolean).map((tag: string, index: number) => (
                                        <div key={index} className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-[#1e3a8a] px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm animate-in zoom-in-50 duration-200 group/tag">
                                            <Hash className="h-3.5 w-3.5 text-blue-400" />
                                            {tag}
                                            <button
                                                onClick={() => removeTagFromFormData(index)}
                                                className="ml-1 hover:bg-white rounded-full p-0.5 text-blue-400 hover:text-red-500 transition-colors opacity-60 group-hover/tag:opacity-100"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}

                                    <input
                                        type="text"
                                        value={tagInputValue}
                                        onChange={handleTagInputChange}
                                        onKeyDown={handleTagInputKeyDown}
                                        placeholder={(formData.perfil || '').split('\n').filter(Boolean).length === 0 ? "Digite a tag e aperte Enter ou vírgula. Ou digite @ para buscar." : "Nova tag..."}
                                        className="bg-transparent text-[#0a192f] text-sm outline-none font-medium flex-1 min-w-[200px] py-1.5 placeholder:text-gray-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 4 && (
                <CandidatoHistoricoSection
                    candidatoId={candidatoId || null}
                    isViewMode={false}
                    pendingHistorico={pendingHistorico}
                    setPendingHistorico={setPendingHistorico}
                />
            )}
            {activeTab === 5 && (
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
            {/* Modal Dialog for alerts matching the system design */}
            {alertConfig.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-500/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
                        <div className={`p-3 rounded-xl w-fit mb-4 ${alertConfig.type === 'success' ? 'bg-green-50' :
                            alertConfig.type === 'warning' ? 'bg-amber-50' : 'bg-red-50'
                            }`}>
                            {alertConfig.type === 'success' && <div className="h-6 w-6 text-green-500 flex items-center justify-center">✓</div>}
                            {alertConfig.type === 'warning' && <div className="h-6 w-6 text-amber-500 font-bold text-center">!</div>}
                            {alertConfig.type === 'error' && <div className="h-6 w-6 text-red-500 font-bold text-center">✕</div>}
                        </div>
                        <h3 className="text-lg font-black text-[#0a192f] mb-2 uppercase tracking-wide">{alertConfig.title}</h3>
                        <p className="text-sm text-gray-500 mb-6 font-medium">{alertConfig.message}</p>
                        <button
                            onClick={() => setAlertConfig({ ...alertConfig, isOpen: false })}
                            className="w-full py-2.5 bg-[#0a192f] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-900 transition-colors"
                        >
                            Entendi
                        </button>
                    </div>
                </div>
            )}
        </CollaboratorModalLayout>
    )
}
