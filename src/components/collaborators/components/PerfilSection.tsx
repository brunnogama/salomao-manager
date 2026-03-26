import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { Tag, Save, AlertCircle, Loader2, Sparkles, Search } from 'lucide-react';

interface PerfilSectionProps {
    collaboratorId: string;
    showAlert?: (title: string, description: string, variant?: 'success' | 'error' | 'info') => void;
}

const PerfilSection: React.FC<PerfilSectionProps> = ({ collaboratorId, showAlert }) => {
    const [perfil, setPerfil] = useState<string>('');
    const [resumoCv, setResumoCv] = useState<string>('');
    const [competencias, setCompetencias] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [extractingAI, setExtractingAI] = useState(false);
    const [isTagging, setIsTagging] = useState(false);
    const [tagSearch, setTagSearch] = useState('');
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [tagDropdownSearch, setTagDropdownSearch] = useState('');
    const [dropdownTop, setDropdownTop] = useState(0);
    const perfilTextareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        fetchPerfil();
        fetchAvailableTags();
    }, [collaboratorId]);

    const fetchPerfil = async () => {
        if (!collaboratorId || collaboratorId === 'novo') {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('collaborators')
                .select('perfil, competencias, resumo_cv')
                .eq('id', collaboratorId)
                .single();

            if (error) throw error;
            setPerfil(data?.perfil || '');
            setResumoCv(data?.resumo_cv || '');
            setCompetencias(data?.competencias || '');
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            if (showAlert) showAlert('Erro', 'Erro ao carregar os dados de perfil.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableTags = async () => {
        const { data } = await supabase.from('perfil_tags').select('tag').order('tag');
        if (data) setAvailableTags(data.map((t: { tag: string }) => t.tag));
    };

    const handlePerfilChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        const position = e.target.selectionStart;
        setPerfil(text);

        const lastAtSymbol = text.lastIndexOf('@', position - 1);
        const lastNewLine = text.lastIndexOf('\n', position - 1);

        if (lastAtSymbol > lastNewLine) {
            setIsTagging(true);
            setTagSearch(text.substring(lastAtSymbol + 1, position));
            setCursorPosition(lastAtSymbol);

            // Calcular posição vertical do cursor no textarea
            const textBeforeCursor = text.substring(0, position);
            const lineNumber = textBeforeCursor.split('\n').length;
            const lineHeight = 20; // text-sm line-height aprox
            const paddingTop = 16; // p-4
            const scrollTop = e.target.scrollTop || 0;
            setDropdownTop(paddingTop + (lineNumber * lineHeight) - scrollTop);
        } else {
            setIsTagging(false);
        }
    };

    const insertTag = (tagText: string) => {
        const currentText = perfil;
        const beforeTag = currentText.substring(0, cursorPosition);
        const nextNewLine = currentText.indexOf('\n', cursorPosition);
        const afterTag = nextNewLine !== -1 ? currentText.substring(nextNewLine) : '';

        const newText = `${beforeTag}${tagText}${afterTag}`;
        setPerfil(newText);
        setIsTagging(false);
        setTagSearch('');
        setTagDropdownSearch('');
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const { error } = await supabase
                .rpc('update_collaborator_perfil', {
                    p_id: collaboratorId,
                    p_perfil: perfil,
                    p_competencias: competencias,
                    p_resumo_cv: resumoCv
                });

            if (error) {
                if (error.code === 'PGRST202') {
                    const fallback = await supabase
                        .from('collaborators')
                        .update({
                            perfil: perfil,
                            competencias: competencias,
                            resumo_cv: resumoCv
                        })
                        .eq('id', collaboratorId)
                        .select();
                    if (fallback.error) throw fallback.error;
                } else {
                    throw error;
                }
            }

            const lines = perfil.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length > 0) {
                const tagsToInsert = lines.map(t => ({ tag: t }));
                await supabase.from('perfil_tags').upsert(tagsToInsert, { onConflict: 'tag' });
            }

            if (showAlert) showAlert('Sucesso', 'Perfil e Competências atualizados com sucesso!', 'success');
        } catch (error: any) {
            console.error('Falha crítica ao salvar perfil:', error);
            if (showAlert) showAlert('Erro', `Erro ao salvar: ${error.message || 'Houve um erro no servidor'}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleExtractResumeAI = async () => {
        if (!collaboratorId || collaboratorId === 'novo') {
            if (showAlert) showAlert('Atenção', 'Você precisa salvar o integrante antes de usar a IA.', 'info');
            return;
        }

        try {
            setExtractingAI(true);
            if (showAlert) showAlert('IA Analisando...', 'A IA está lendo o currículo do integrante (Isso pode levar alguns segundos).', 'info');

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
                        candidatoId: collaboratorId,
                        context: 'colaborador'
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro desconhecido ao chamar IA');
            }

            if (result.success && result.data) {
                setResumoCv(result.data.resumoProfissional || '');
                setPerfil((result.data.perfilTags || []).join('\n'));
                if (showAlert) showAlert('Extraído com Sucesso', `Os dados foram inferidos do documento: ${result.cvProcessado}`, 'success');
            }

        } catch (error: any) {
            console.error('Erro na IA:', error);
            if (showAlert) showAlert('Falha na IA', `Erro ao ler currículo: ${error.message}`, 'error');
        } finally {
            setExtractingAI(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#1e3a8a]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-[#1e3a8a]">
                            <Tag className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-tight">Perfil e Habilidades</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                Gerencie as competências e histórico técnico do integrante
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExtractResumeAI}
                            disabled={extractingAI || loading}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg"
                        >
                            {extractingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            Extrair com IA
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#112240] transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Salvar
                        </button>
                    </div>
                </div>

                <div className="mt-6">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                        Resumo Profissional (IA)
                    </label>
                    <textarea
                        value={resumoCv}
                        onChange={(e) => setResumoCv(e.target.value)}
                        placeholder="Um resumo super potente sobre a carreira e perfil em 1 parágrafo..."
                        className="w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-4 outline-none font-medium transition-all shadow-sm h-28 resize-none"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 flex justify-between">
                        Tags de Perfil
                        <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">Dica: Use @ para buscar na nuvem</span>
                    </label>
                    <div className="relative">
                    <textarea
                        ref={perfilTextareaRef}
                        value={perfil}
                        onChange={handlePerfilChange}
                        placeholder="Adicione habilidades, experiências e competências...&#10;Cada linha vira uma tag técnica automaticamente."
                        className="w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-4 outline-none font-medium transition-all shadow-sm h-64 resize-none"
                    />

                    {isTagging && (
                        <div className="absolute left-0 w-full bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] max-h-64 overflow-hidden ring-1 ring-black/5 flex flex-col" style={{ top: `${dropdownTop}px` }}>
                            <div className="px-2 py-2 border-b border-gray-100 sticky top-0 bg-white">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por palavra-chave..."
                                        value={tagDropdownSearch}
                                        onChange={(e) => setTagDropdownSearch(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none font-medium bg-gray-50"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="overflow-y-auto flex-1">
                                {availableTags
                                    .filter(t => t.toLowerCase().includes((tagDropdownSearch || tagSearch).toLowerCase()))
                                    .map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => insertTag(tag)}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-sm text-[#0a192f] font-medium border-b border-gray-50 last:border-0"
                                        >
                                            <Tag className="h-4 w-4 text-blue-500" />
                                            {tag}
                                        </button>
                                    ))
                                }
                                {availableTags
                                    .filter(t => t.toLowerCase().includes((tagDropdownSearch || tagSearch).toLowerCase()))
                                    .length === 0 && (
                                        <div className="px-4 py-3 text-xs text-gray-400 text-center font-medium">Nenhuma tag encontrada para "{tagDropdownSearch || tagSearch}"</div>
                                    )}
                            </div>
                        </div>
                    )}
                    </div>
                </div>

                {/* Tag Cloud Visualization */}
                {perfil && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {perfil.split('\n').filter(line => line.trim()).map((tag, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f8fafc] text-[#1e3a8a] border border-[#e2e8f0] rounded-lg text-xs font-bold uppercase tracking-wider animate-in zoom-in-95 duration-200 shadow-sm"
                            >
                                <Tag className="h-3 w-3 text-[#3b82f6]" />
                                {tag.trim()}
                            </div>
                        ))}
                    </div>
                )}

                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-3 text-blue-700">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <div className="text-[10px] font-medium leading-relaxed uppercase tracking-wider">
                        As tags inseridas aqui ajudam no cruzamento de dados para futuras promoções ou realocações de equipe.
                        Elas foram migradas automaticamente da fase de recrutamento se o integrante foi aprovado pelo sistema.
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                    <label className="block text-[10px] font-black text-[#0a192f] uppercase tracking-widest mb-2 ml-1">
                        Competências Exercidas (Organograma)
                    </label>
                    <textarea
                        value={competencias}
                        onChange={(e) => setCompetencias(e.target.value)}
                        placeholder="Descreva as competências deste integrante..."
                        className="w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-4 outline-none font-medium transition-all shadow-sm h-32 resize-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-2 ml-1 font-medium">
                        Estas informações serão refletidas no Organograma e vice-versa.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PerfilSection;
