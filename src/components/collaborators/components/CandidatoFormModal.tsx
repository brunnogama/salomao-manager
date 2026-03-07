import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCloseOnEscape } from '../../../hooks/useCloseOnEscape'
import { supabase } from '../../../lib/supabase'
import { CollaboratorModalLayout } from './CollaboratorLayouts'
import { DadosPessoaisSection } from './DadosPessoaisSection'
import { CandidatoHistoricoSection } from './CandidatoHistoricoSection'
import { DadosProfissionaisCandidato } from './DadosProfissionaisCandidato'
import { DadosEscolaridadeSection } from './DadosEscolaridadeSection'
import { CandidatoExperienciasSection } from './CandidatoExperienciasSection'
import { User, BookOpen, Briefcase, Hash, X, Sparkles, Bot, Loader2, Clock, TagIcon, Files, CalendarHeart, ChevronDown, Edit2 } from 'lucide-react'
import { GEDSection } from './GEDSection'
import { CandidatoEntrevistaSection } from './CandidatoEntrevistaSection'
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
    isOpen: boolean;
    onClose: () => void;
    candidatoId?: string | null;
    onSave: () => void;
    initialData?: any;
    initialFile?: File | null;
    viewMode?: boolean;
    onEdit?: (id: string) => void;
}

export function CandidatoFormModal({ isOpen, onClose, candidatoId, onSave, initialData, initialFile, viewMode = false, onEdit }: CandidatoFormModalProps) {
    const navigate = useNavigate()
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const downloadLinkRef = React.useRef<HTMLAnchorElement>(null)

    const handleRequestClose = () => {
        setShowCancelConfirm(true)
    }

    const confirmClose = () => {
        setShowCancelConfirm(false)
        onClose()
    }

    useCloseOnEscape(isOpen, viewMode ? onClose : handleRequestClose)

    const [activeTab, setActiveTab] = useState(1)
    const [loading, setLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<any>>({})

    // Tagging system state
    const [isTagging, setIsTagging] = useState(false)
    const [tagSearch, setTagSearch] = useState('')
    const [tagInputValue, setTagInputValue] = useState('')
    const [availableTags, setAvailableTags] = useState<string[]>([])

    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false)
    const statusMenuRef = React.useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
                setIsStatusMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // GED State
    const [gedCategories] = useState([
        { id: 'Currículo', name: 'Currículo' },
        { id: 'Portfólio', name: 'Portfólio' },
        { id: 'Certificado', name: 'Certificado' },
        { id: 'Prova', name: 'Prova' },
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
            setAiLoading(false)
            if (candidatoId) {
                fetchCandidato(candidatoId)
                fetchGedDocs(candidatoId)
            } else if (initialData) {
                const mappedData: any = {
                    nome: initialData.nome || '',
                    name: initialData.nome || '',
                    email: initialData.email || '',
                    email_pessoal: initialData.email || '',
                    phone: initialData.telefone || '',
                    birth_date: initialData.data_nascimento || '',
                    zip_code: initialData.endereco?.cep || '',
                    address: initialData.endereco?.logradouro || '',
                    neighborhood: initialData.endereco?.bairro || '',
                    city: initialData.endereco?.cidade || '',
                    state: initialData.endereco?.estado || '',
                    resumo_cv: initialData.resumoProfissional || '',
                    role: initialData.sugestaoCargo || '',
                    linkedin_url: initialData.linkedin || '',
                    perfil: (initialData.perfilTags || []).join('\n'),
                    idiomas: initialData.idiomas || '',
                    atividades_academicas: initialData.atividades_academicas || '',
                    status_selecao: initialData.status_selecao || 'Aberto',
                    motivo_reprovacao: initialData.motivo_reprovacao || '',
                    entrevista_dados: initialData.entrevista_dados || {}
                };
                setFormData(mappedData);

                if (initialData.experiencias && Array.isArray(initialData.experiencias)) {
                    const mappedExp = initialData.experiencias.map((e: any) => ({
                        temp_id: Math.random().toString(36).substring(7),
                        empresa: e.empresa || '',
                        cargo: e.cargo || '',
                        data_inicio: e.inicio || '',
                        data_fim: e.fim || '',
                        perfil: e.descricao || ''
                    }));
                    setPendingExperiencias(mappedExp);
                }

                if (initialFile) {
                    setPendingGedDocs([{
                        file: initialFile,
                        category: 'Currículo',
                        label: initialFile.name,
                        tempId: Math.random().toString(36).substring(7)
                    }]);
                }
                setGedDocs([]);

                // Show AI review warning
                setTimeout(() => {
                    showAlert('Atenção', 'Os dados foram preenchidos pela Inteligência Artificial.\n\nPor favor, revise atentamente as informações em todas as abas antes de salvar o cadastro definitivo.', 'warning');
                }, 500);
            } else {
                setFormData({})
                setGedDocs([])
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, candidatoId, initialData, initialFile])

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
        const hasStoredCV = gedDocs.some(d => d.categoria === 'Currículo');
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
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch(
                `https://iewevhdtwlviudetxgax.supabase.co/functions/v1/analisar-curriculo-cv`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`
                    },
                    body: JSON.stringify({
                        candidatoId,
                        context: 'candidato'
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro desconhecido na Edge Function');
            }

            if (result.success && result.data) {
                const { resumoProfissional, perfilTags, sugestaoCargo, atividades_academicas, idiomas, email, telefone } = result.data;

                // Merge no formData
                setFormData((prev: any) => {
                    const currentTags = (prev.perfil || '').split('\n').filter(Boolean);
                    const newTagsArray = [...new Set([...currentTags, ...(perfilTags || [])])];

                    return {
                        ...prev,
                        email_pessoal: email || prev.email_pessoal,
                        phone: telefone || prev.phone,
                        resumo_cv: resumoProfissional || prev.resumo_cv,
                        atividades_academicas: atividades_academicas || prev.atividades_academicas,
                        idiomas: idiomas || prev.idiomas,
                        perfil: newTagsArray.join('\n'),
                        role: prev.role || sugestaoCargo // Só sugere cargo se estiver sem
                    };
                });

                showAlert('Sucesso', 'Currículo analisado! O resumo e as tags foram preenchidos (veja a aba "Dados Pessoais" e "Escolaridade" para informações complementares).', 'success');
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
                    const filePath = docToDelete.url.split('public/ged-colaboradores/')[1];
                    if (filePath) await supabase.storage.from('ged-colaboradores').remove([filePath]);
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

            // Date formatting
            if (payload.birthday && payload.birthday.includes('/')) {
                const parts = payload.birthday.split('/');
                if (parts.length === 3) {
                    payload.birthday = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }

            // Allowed fields based on the actual Candidato schema via OpenAPI
            const allowedFields = [
                'nome', 'email', 'telefone', 'linkedin', 'curriculo_url', 'perfil', 'resumo_cv', 'role', 'local', 'area', 'contract_type',
                'gender', 'rg', 'cpf', 'birthday', 'civil_status', 'email_pessoal', 'linkedin_url',
                'has_children', 'children_count', 'children_data', 'atividades_academicas', 'idiomas',
                'zip_code', 'address', 'address_number', 'address_complement', 'neighborhood', 'city', 'state',
                'forma_pagamento', 'banco_nome', 'banco_tipo_conta', 'banco_agencia', 'banco_conta', 'pix_tipo', 'pix_chave',
                'emergency_contacts', 'education_history', 'status_selecao', 'motivo_reprovacao', 'entrevista_dados', 'indicado_por'
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

            let finalCandidatoId = candidatoId;

            if (candidatoId) {
                const { error } = await supabase.from('candidatos').update(cleanPayload).eq('id', candidatoId)
                if (error) {
                    console.error('Erro no update do candidato:', error);
                    throw error;
                }
            } else {
                const { data: insertedData, error: insertError } = await supabase.from('candidatos').insert([cleanPayload]).select('id').single()
                if (insertError) {
                    console.error('Erro no insert do candidato:', insertError);
                    throw insertError;
                }
                finalCandidatoId = insertedData?.id || null;
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
            // finalCandidatoId is already captured during insert/update

            if (finalCandidatoId && pendingGedDocs.length > 0) {
                for (const doc of pendingGedDocs) {
                    const fileExt = doc.file.name.split('.').pop()
                    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
                    const filePath = `candidatos/${finalCandidatoId}/ged/${fileName}`

                    const { error: uploadError } = await supabase.storage.from('ged-colaboradores').upload(filePath, doc.file)
                    if (uploadError) console.error('Error uploading file:', uploadError.message)
                    else {
                        const { data: { publicUrl } } = supabase.storage.from('ged-colaboradores').getPublicUrl(filePath)
                        const { error: dbError } = await supabase.from('candidato_ged').insert({
                            candidato_id: finalCandidatoId,
                            nome_arquivo: doc.file.name,
                            tamanho: doc.file.size,
                            categoria: doc.category,
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

            if (finalCandidatoId && pendingExperiencias.length > 0) {
                const expPayload = pendingExperiencias.map(e => {
                    const { temp_id, ...rest } = e;
                    return {
                        ...rest,
                        candidato_id: finalCandidatoId,
                        data_inicio: rest.data_inicio || null,
                        data_fim: rest.data_fim || null
                    };
                });
                const { error: expError } = await supabase.from('candidato_experiencias').insert(expPayload);
                if (expError) {
                    console.error("Error saving pending experiencias", expError);
                    alert("Erro ao salvar experiências: " + JSON.stringify(expError));
                }

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
            if (formData.status_selecao === 'Aprovado') {
                if (window.confirm("Candidato salvo como Aprovado!\nDeseja ir para a tela de pré-cadastro de Colaborador agora?")) {
                    navigate('/rh/colaboradores', {
                        state: {
                            cadastrarCandidato: {
                                ...formData,
                                name: formData.nome,
                                hire_date: new Date().toISOString().split('T')[0],
                                candidato_id: finalCandidatoId,
                                status_selecao: undefined,
                                motivo_reprovacao: undefined
                            }
                        }
                    });
                }
            }
            onClose()
        } catch (error) {
            console.error('Error saving:', error)
        } finally {
            setLoading(false)
        }
    }



    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
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
        { id: 1, label: 'Dados Pessoais e Bancários', icon: User },
        { id: 4, label: 'Dados Corporativos', icon: Briefcase },
        { id: 3, label: 'Dados de Escolaridade', icon: BookOpen },
        { id: 10, label: 'Entrevista', icon: CalendarHeart },
        { id: 9, label: 'Perfil e Tags', icon: TagIcon },
        { id: 6, label: 'Histórico', icon: Clock },
        { id: 7, label: 'GED', icon: Files },
    ]

    const handleStatusSelecaoChange = (value: string) => {
        setFormData(prev => ({ ...prev, status_selecao: value }));
        setIsStatusMenuOpen(false);
        if (value === 'Reprovado' && !formData.motivo_reprovacao) {
            // Se precisar abrir modal de motivo específico, podemos definir alertConfig ou similar
            // Porém usando o proprio alert pra facilitar a UI
            let motivo = window.prompt("Por favor, digite o motivo da reprovação:");
            if (motivo) {
                setFormData(prev => ({ ...prev, motivo_reprovacao: motivo, status_selecao: 'Reprovado' }));
            } else {
                setFormData(prev => ({ ...prev, status_selecao: 'Aberto' }));
            }
        }
    };

    if (!isOpen) return null

    return (
        <CollaboratorModalLayout
            title={formData.nome || 'Novo Candidato'}
            onClose={handleRequestClose}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isEditMode={!viewMode}
            currentSteps={steps}
            footer={
                viewMode ? (
                    <div className="flex items-center justify-between w-full">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
                        >
                            Fechar
                        </button>
                        {candidatoId && onEdit && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose()
                                    onEdit(candidatoId)
                                }}
                                className="bg-[#1e3a8a] text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-[#1e3a8a]/90 transition-all flex items-center gap-2 shadow-lg shadow-[#1e3a8a]/20 active:scale-95 hover:-translate-y-0.5"
                            >
                                <Edit2 className="w-4 h-4" />
                                Editar Candidato
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col pr-4 sm:w-[220px] relative" ref={statusMenuRef}>
                            <div className="mb-1 text-right border-b border-gray-100 pb-1"></div>
                            <button
                                type="button"
                                onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                                className={`flex items-center justify-between w-full text-[10px] font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl border transition-all ${formData.status_selecao === 'Aprovado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' :
                                    formData.status_selecao === 'Reprovado' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                                        formData.status_selecao === 'Reaproveitamento' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' :
                                            'bg-blue-50 text-[#1e3a8a] border-blue-200 hover:bg-blue-100'
                                    }`}
                            >
                                <span>{formData.status_selecao || 'Aberto'}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isStatusMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isStatusMenuOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#33353A] rounded-xl shadow-xl border border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50">
                                    {['Aberto', 'Aprovado', 'Reprovado', 'Reaproveitamento'].map(status => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => handleStatusSelecaoChange(status)}
                                            className="w-full text-left px-5 py-3 text-sm font-medium text-gray-200 hover:bg-white/10 hover:text-white transition-colors"
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl shadow-lg hover:shadow-xl font-bold transition-all flex items-center gap-2 text-[10px] uppercase tracking-wider h-fit"
                        >
                            {loading ? 'Salvando...' : 'Salvar Cadastro'}
                        </button>
                    </div>
                )
            }
        >
            <fieldset disabled={viewMode} className="contents">
                {activeTab === 1 && (
                    <div className={`space-y-6 ${initialData && !candidatoId ? 'ai-highlight' : ''}`}>
                        {initialData && !candidatoId && (
                            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl mb-2 flex items-start gap-4 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 blur-sm scale-150 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                                    <Sparkles className="w-32 h-32 text-indigo-500" />
                                </div>
                                <div className="bg-white p-2.5 rounded-xl shadow-sm relative z-10 shrink-0">
                                    <Bot className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div className="relative z-10 w-full">
                                    <strong className="block text-sm font-black text-indigo-900 uppercase tracking-widest mb-1">Preenchimento Automático por IA</strong>
                                    <p className="text-xs font-medium text-indigo-700/80 leading-relaxed">
                                        Os dados abaixo foram extraídos do currículo. <strong className="text-indigo-900">Revise os campos</strong> preenchidos e altere o que for necessário.
                                    </p>
                                </div>
                            </div>
                        )}

                        <style>{`
                        .ai-highlight input:not([value=""]), 
                        .ai-highlight input[value]:not([value=""]),
                        .ai-highlight textarea:not(:empty) {
                            border-color: #c7d2fe !important;
                            background-color: #f8fafc !important;
                            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1) !important;
                            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z'/%3E%3C/svg%3E") !important;
                            background-repeat: no-repeat !important;
                            background-position: right 12px center !important;
                            padding-right: 36px !important;
                        }
                    `}</style>
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

                {activeTab === 4 && (
                    <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
                        <DadosProfissionaisCandidato
                            formData={formData}
                            setFormData={setFormData}
                            isViewMode={false}
                        />
                    </div>
                )}

                {activeTab === 3 && (
                    <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
                        <DadosEscolaridadeSection
                            formData={formData as any}
                            setFormData={setFormData}
                            isViewMode={false}
                            maskDate={maskDate}
                        />
                    </div>
                )}

                {activeTab === 10 && (
                    <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
                        <CandidatoEntrevistaSection
                            formData={formData}
                            setFormData={setFormData}
                            isViewMode={false}
                        />
                    </div>
                )}

                {activeTab === 9 && (
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
                                    <textarea
                                        className="w-full min-h-[50px] bg-transparent text-[#0a192f] text-sm focus:outline-none resize-none font-medium z-10 sticky top-0"
                                        placeholder="Comece a digitar uma habilidade ou competência... Cada linha formará uma tag."
                                        onKeyDown={handleTagInputKeyDown}
                                        value={tagInputValue}
                                        onChange={(e) => {
                                            setTagInputValue(e.target.value)
                                            if (e.target.value.startsWith('@')) {
                                                setIsTagging(true)
                                                setTagSearch(e.target.value.substring(1))
                                            } else {
                                                setIsTagging(false)
                                            }
                                        }}
                                    />

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

                                    <div className="flex flex-wrap gap-2 w-full mt-2">
                                        {(formData.perfil || '').split('\n').filter(Boolean).map((tag: string, index: number) => (
                                            <div key={index} className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-[#1e3a8a] px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm animate-in zoom-in-50 duration-200 group/tag">
                                                <Hash className="h-3 w-3 text-blue-400" />
                                                {tag}
                                                <button
                                                    onClick={() => removeTagFromFormData(index)}
                                                    className="ml-1 hover:bg-blue-200 p-0.5 rounded-full transition-colors text-blue-500 hover:text-blue-700 opacity-50 group-hover/tag:opacity-100"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 6 && (
                    <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
                        <CandidatoExperienciasSection
                            candidatoId={candidatoId || null}
                            isViewMode={false}
                            pendingExperiencias={pendingExperiencias}
                            setPendingExperiencias={setPendingExperiencias}
                            showAlert={showAlert}
                        />
                        <CandidatoHistoricoSection
                            candidatoId={candidatoId || null}
                            isViewMode={false}
                            pendingHistorico={pendingHistorico}
                            setPendingHistorico={setPendingHistorico}
                        />
                    </div>
                )}

                {activeTab === 7 && (
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

            </fieldset>

            {/* INVISIBLE LINK FOR ATTACHMENT */}
            <a ref={downloadLinkRef} style={{ display: 'none' }} href="#" />

            {/* Modal Dialog for alerts matching the system design */}
            {alertConfig.isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-500/20 backdrop-blur-sm animate-in fade-in duration-200">
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

            {showCancelConfirm && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <X className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black text-[#0a192f] mb-2">Descartar Cadastro?</h3>
                            <p className="text-sm text-gray-500 font-medium mb-6">
                                Tem certeza que deseja fechar? Todas as informações não salvas serão perdidas.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowCancelConfirm(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={confirmClose}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-red-700 shadow-lg hover:shadow-red-500/30 transition-all"
                                >
                                    Descartar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </CollaboratorModalLayout>
    )
}

