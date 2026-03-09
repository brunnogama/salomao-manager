import React, { useState, useEffect } from 'react'
import { Briefcase, Plus, Trash2, Loader2, Edit2, Check, Search } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

interface CandidatoExperienciasSectionProps {
    candidatoId: string | null
    isViewMode?: boolean
    pendingExperiencias: any[]
    setPendingExperiencias: React.Dispatch<React.SetStateAction<any[]>>
    showAlert: (title: string, message: string, type: 'success' | 'warning' | 'error') => void
}

export function CandidatoExperienciasSection({
    candidatoId,
    isViewMode = false,
    pendingExperiencias,
    setPendingExperiencias,
    showAlert
}: CandidatoExperienciasSectionProps) {
    const [experienciasList, setExperienciasList] = useState<any[]>([])
    const [loadingExp, setLoadingExp] = useState(false)
    const [isFormOpen, setIsFormOpen] = useState(false)

    // Form states for new/edit
    const [empresa, setEmpresa] = useState('')
    const [cargo, setCargo] = useState('')
    const [dataInicio, setDataInicio] = useState('')
    const [dataFim, setDataFim] = useState('')
    const [perfilExp, setPerfilExp] = useState('')

    // Tagging Exp states
    const [isTaggingExp, setIsTaggingExp] = useState(false)
    const [tagSearchExp, setTagSearchExp] = useState('')
    const [availableTags, setAvailableTags] = useState<string[]>([])
    const [cursorPositionExp, setCursorPositionExp] = useState(0)
    const [tagDropdownSearch, setTagDropdownSearch] = useState('')

    // Edit states
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingTempId, setEditingTempId] = useState<string | null>(null)

    useEffect(() => {
        fetchTags()
        if (candidatoId) {
            fetchExperiencias(candidatoId)
        } else {
            setExperienciasList([])
        }
    }, [candidatoId])

    const fetchTags = async () => {
        const { data, error } = await supabase.from('perfil_tags').select('tag').order('tag')
        if (data && !error) {
            setAvailableTags(data.map(d => d.tag))
        }
    }

    const fetchExperiencias = async (id: string) => {
        const { data } = await supabase.from('candidato_experiencias').select('*').eq('candidato_id', id).order('data_inicio', { ascending: false })
        if (data) setExperienciasList(data)
    }

    const handleDeleteExperiencia = async (id?: string, temp_id?: string) => {
        if (!confirm('Deseja realmente excluir esta experiência?')) return;

        if (temp_id) {
            setPendingExperiencias(prev => prev.filter(e => e.temp_id !== temp_id))
            return;
        }

        if (id) {
            setLoadingExp(true);
            try {
                const { error } = await supabase.from('candidato_experiencias').delete().eq('id', id);
                if (error) throw error;
                setExperienciasList(prev => prev.filter(e => e.id !== id));
            } catch (e: any) {
                showAlert('Erro', 'Erro ao excluir: ' + e.message, 'error');
            } finally {
                setLoadingExp(false)
            }
        }
    }

    const handleEditExperiencia = (item: any) => {
        setEmpresa(item.empresa || '')
        setCargo(item.cargo || '')
        setDataInicio(item.data_inicio || '')
        setDataFim(item.data_fim || '')
        setPerfilExp(item.perfil || '')

        if (item.temp_id) {
            setEditingTempId(item.temp_id)
            setEditingId(null)
        } else {
            setEditingId(item.id)
            setEditingTempId(null)
        }

        setIsFormOpen(true)
        setTimeout(() => {
            document.getElementById('form-experiencia')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }

    const clearFormExp = () => {
        setEmpresa('')
        setCargo('')
        setDataInicio('')
        setDataFim('')
        setPerfilExp('')
        setEditingId(null)
        setEditingTempId(null)
        setIsFormOpen(false)
    }

    const handleSaveExperiencia = async () => {
        if (!empresa || !cargo || !dataInicio) {
            showAlert('Atenção', 'Preencha a Empresa, Cargo e Data de Início para adicionar a experiência.', 'warning');
            return;
        }

        const payload: any = {
            empresa,
            cargo,
            data_inicio: dataInicio,
            data_fim: dataFim || null,
            perfil: perfilExp || null
        }

        if (!candidatoId) {
            if (editingTempId) {
                setPendingExperiencias(prev => prev.map(e => e.temp_id === editingTempId ? { ...payload, temp_id: editingTempId } : e))
            } else {
                setPendingExperiencias(prev => [{ ...payload, temp_id: Math.random().toString(36).substr(2, 9) }, ...prev])
            }
            showAlert('Atenção', 'Experiência adicionada temporariamente. Salve o candidato para concluir.', 'warning');
            clearFormExp();
            return;
        }

        setLoadingExp(true)
        try {
            if (editingId) {
                const { error } = await supabase.from('candidato_experiencias').update(payload).eq('id', editingId)
                if (error) throw error
            } else {
                const { error } = await supabase.from('candidato_experiencias').insert({ ...payload, candidato_id: candidatoId })
                if (error) throw error
            }

            if (perfilExp) {
                const lines = perfilExp.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
                if (lines.length > 0) {
                    const tagsToInsert = lines.map((t: string) => ({ tag: t }));
                    const { error: tagError } = await supabase.from('perfil_tags').upsert(tagsToInsert, { onConflict: 'tag' });
                    if (tagError) console.error("Error upserting tags", tagError);
                }
            }

            clearFormExp()
            fetchExperiencias(candidatoId)
        } catch (e: any) {
            showAlert('Erro', 'Erro ao salvar: ' + e.message, 'error');
        } finally {
            setLoadingExp(false)
        }
    }

    const handlePerfilExpChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        const position = e.target.selectionStart;
        setPerfilExp(text);

        const lastAtSymbol = text.lastIndexOf('@', position - 1);
        const lastNewLine = text.lastIndexOf('\n', position - 1);

        const bound = lastNewLine;
        if (lastAtSymbol > bound) {
            setIsTaggingExp(true);
            setTagSearchExp(text.substring(lastAtSymbol + 1, position));
            setCursorPositionExp(lastAtSymbol);
        } else {
            setIsTaggingExp(false);
        }
    }

    const insertTagExp = (tagText: string) => {
        const currentText = perfilExp;
        const beforeTag = currentText.substring(0, cursorPositionExp);
        const nextNewLine = currentText.indexOf('\n', cursorPositionExp);
        const afterTag = nextNewLine !== -1 ? currentText.substring(nextNewLine) : '';
        const newText = `${beforeTag}${tagText}${afterTag}`;
        setPerfilExp(newText);
        setIsTaggingExp(false);
        setTagSearchExp('');
        setTagDropdownSearch('');
    }

    const allExperiencias = [...pendingExperiencias, ...experienciasList]

    const parseDateForDisplay = (dateString?: string, isEnd?: boolean) => {
        if (!dateString) return isEnd ? 'Atual' : '';
        const parts = dateString.split('-');
        if (parts.length === 3) {
            const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
            const monthName = months[parseInt(parts[1], 10) - 1];
            return `${monthName} de ${parts[0]}`;
        }
        return dateString;
    }

    const calcTempo = (inicio: string, fim?: string) => {
        if (!inicio) return '';
        const dataFimVal = fim ? new Date(fim) : new Date();
        const dataInicioVal = new Date(inicio);
        if (isNaN(dataInicioVal.getTime())) return '';
        const diffMeses = (dataFimVal.getFullYear() - dataInicioVal.getFullYear()) * 12 + (dataFimVal.getMonth() - dataInicioVal.getMonth());
        if (diffMeses <= 0) return 'Menos de 1 mês';
        const anos = Math.floor(diffMeses / 12);
        const meses = diffMeses % 12;
        let ext = [];
        if (anos > 0) ext.push(`${anos} ano${anos > 1 ? 's' : ''}`);
        if (meses > 0) ext.push(`${meses} mês${meses > 1 ? 'es' : ''}`);
        return ext.join(' e ');
    }

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500 rounded-l-2xl"></div>

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider flex items-center gap-2 mb-2">
                        <Briefcase className="w-5 h-5 text-purple-500" />
                        Experiências Anteriores / Cargos
                    </h3>
                    <p className="text-xs text-gray-500 font-medium ml-7">Adicione as experiências profissionais, cargos ou estágios do talento.</p>
                </div>
                {!isViewMode && (
                    <button
                        type="button"
                        onClick={() => {
                            if (!isFormOpen) {
                                clearFormExp();
                            }
                            setIsFormOpen(!isFormOpen);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold uppercase text-xs tracking-wider transition-all active:scale-95 ${isFormOpen
                            ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            : 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'}`}
                    >
                        {isFormOpen ? <Trash2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {isFormOpen ? 'Cancelar' : 'Adicionar Experiência'}
                    </button>
                )}
            </div>

            {/* FORM (NOVO / EDITAR) */}
            {!isViewMode && isFormOpen && (
                <div id="form-experiencia" className={`bg-purple-50/50 p-6 rounded-2xl border ${editingId || editingTempId ? 'border-purple-400 ring-4 ring-purple-100 shadow-md' : 'border-purple-100'} mb-8 space-y-6 transition-all duration-300 animate-in fade-in slide-in-from-top-4`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Empresa / Instituição</label>
                            <input
                                type="text"
                                className="w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 block p-3 outline-none transition-all font-medium"
                                placeholder="Ex: Salomão Advogados"
                                value={empresa}
                                onChange={e => setEmpresa(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cargo Ocupado</label>
                            <input
                                type="text"
                                className="w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 block p-3 outline-none transition-all font-medium"
                                placeholder="Ex: Advogado Pleno"
                                value={cargo}
                                onChange={e => setCargo(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Início</label>
                            <input
                                type="date"
                                className="w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 block p-3 outline-none transition-all font-medium"
                                value={dataInicio}
                                onChange={e => setDataInicio(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Fim (ou atual)</label>
                            <input
                                type="date"
                                className="w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 block p-3 outline-none transition-all font-medium"
                                value={dataFim}
                                onChange={e => setDataFim(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex justify-between items-center">
                            Perfil e Atividades Desenvolvidas
                            <span className="text-[8px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">Use @ para pesquisar tags</span>
                        </label>
                        <div className="relative">
                            <textarea
                                className="w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl p-4 min-h-[100px] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all resize-none shadow-sm"
                                placeholder="Descreva as atividades, habilidades... Use @ para usar tags da nuvem de talentos"
                                value={perfilExp}
                                onChange={handlePerfilExpChange}
                            />
                            {isTaggingExp && (
                                <div className="absolute bottom-full mb-1 w-full bg-white rounded-xl shadow-xl border border-gray-100 z-10 max-h-64 overflow-hidden flex flex-col">
                                    <div className="px-2 py-2 border-b border-gray-100 sticky top-0 bg-white">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar por palavra-chave..."
                                                value={tagDropdownSearch}
                                                onChange={(e) => setTagDropdownSearch(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-medium bg-gray-50"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto flex-1">
                                        {availableTags
                                            .filter(t => t.toLowerCase().includes((tagDropdownSearch || tagSearchExp).toLowerCase()))
                                            .map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => insertTagExp(t)}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors border-b border-gray-50 last:border-0"
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        {availableTags
                                            .filter(t => t.toLowerCase().includes((tagDropdownSearch || tagSearchExp).toLowerCase()))
                                            .length === 0 && (
                                                <div className="px-4 py-3 text-xs text-gray-400 text-center font-medium">Nenhuma tag encontrada para "{tagDropdownSearch || tagSearchExp}"</div>
                                            )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        {editingId || editingTempId ? (
                            <button
                                onClick={clearFormExp}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-gray-200 transition-all"
                            >
                                Cancelar Edição
                            </button>
                        ) : <div></div>}
                        <button
                            onClick={handleSaveExperiencia}
                            disabled={loadingExp}
                            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-purple-700 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingExp ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId || editingTempId) ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            {(editingId || editingTempId) ? 'Salvar Alteração' : 'Adicionar Experiência'}
                        </button>
                    </div>
                </div>
            )}

            {/* LIST */}
            <div className="space-y-4">
                {allExperiencias.length > 0 ? (
                    allExperiencias.map((item, index) => (
                        <div key={item.id || item.temp_id || index} className="p-5 border border-purple-100 rounded-2xl bg-white hover:border-purple-300 transition-colors shadow-sm relative group overflow-hidden">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="text-md font-black text-[#0a192f] uppercase tracking-wider">{item.cargo}</h4>
                                    <p className="text-sm text-purple-600 font-bold">{item.empresa}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            {parseDateForDisplay(item.data_inicio, false)} a {parseDateForDisplay(item.data_fim, true)}
                                        </p>
                                        <p className="text-[9px] font-black text-purple-400 uppercase tracking-wider">{calcTempo(item.data_inicio, item.data_fim)}</p>
                                    </div>
                                    {!isViewMode && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditExperiencia(item)}
                                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteExperiencia(item.id, item.temp_id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {item.perfil && (
                                <div className="mt-4 pt-4 border-t border-purple-50">
                                    <p className="text-sm text-gray-600 font-medium whitespace-pre-wrap leading-relaxed">{item.perfil}</p>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <Briefcase className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 font-medium">Nenhuma experiência cadastrada</p>
                    </div>
                )}
            </div>
        </div>
    )
}
