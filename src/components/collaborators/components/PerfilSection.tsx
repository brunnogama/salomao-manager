import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Tag, Save, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PerfilSectionProps {
    collaboratorId: string;
}

const PerfilSection: React.FC<PerfilSectionProps> = ({ collaboratorId }) => {
    const [perfil, setPerfil] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isTagging, setIsTagging] = useState(false);
    const [tagSearch, setTagSearch] = useState('');
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [cursorPosition, setCursorPosition] = useState(0);

    useEffect(() => {
        fetchPerfil();
        fetchAvailableTags();
    }, [collaboratorId]);

    const fetchPerfil = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('collaborators')
                .select('perfil')
                .eq('id', collaboratorId)
                .single();

            if (error) throw error;
            setPerfil(data?.perfil || '');
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            toast.error('Erro ao carregar os dados de perfil.');
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
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const { error } = await supabase
                .from('collaborators')
                .update({ perfil })
                .eq('id', collaboratorId);

            if (error) throw error;

            // Upsert tags
            const lines = perfil.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length > 0) {
                const tagsToInsert = lines.map(t => ({ tag: t }));
                await supabase.from('perfil_tags').upsert(tagsToInsert, { onConflict: 'tag' });
            }

            toast.success('Perfil atualizado com sucesso!');
        } catch (error: any) {
            console.error('Erro ao salvar perfil:', error);
            toast.error(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setSaving(false);
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
                                Gerencie as competências e histórico técnico do colaborador
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#112240] transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Salvar
                    </button>
                </div>

                <div className="relative">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 flex justify-between">
                        Tags de Perfil
                        <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">Dica: Use @ para buscar na nuvem</span>
                    </label>
                    <textarea
                        value={perfil}
                        onChange={handlePerfilChange}
                        placeholder="Adicione habilidades, experiências e competências...&#10;Cada linha vira uma tag técnica automaticamente."
                        className="w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-4 outline-none font-medium transition-all shadow-sm h-64 resize-none"
                    />

                    {isTagging && (
                        <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] max-h-48 overflow-y-auto ring-1 ring-black/5">
                            {availableTags
                                .filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()))
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
                        </div>
                    )}
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
                        Elas foram migradas automaticamente da fase de recrutamento se o colaborador foi aprovado pelo sistema.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerfilSection;
