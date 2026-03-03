import { useState, useEffect } from 'react'
import { Save, Loader2, History, ChevronRight, MessageSquare, Trash2, Calendar, Briefcase } from 'lucide-react'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { supabase } from '../../../lib/supabase'

interface CandidatoHistoricoSectionProps {
    candidatoId: string | null
    isViewMode?: boolean
    pendingHistorico?: any[]
    setPendingHistorico?: React.Dispatch<React.SetStateAction<any[]>>
    pendingExperiencias?: any[]
    setPendingExperiencias?: React.Dispatch<React.SetStateAction<any[]>>
}

export function CandidatoHistoricoSection({
    candidatoId,
    isViewMode = false,
    pendingHistorico = [],
    setPendingHistorico,
    pendingExperiencias = [],
    setPendingExperiencias
}: CandidatoHistoricoSectionProps) {
    const [historicoList, setHistoricoList] = useState<any[]>([])
    const [tipo, setTipo] = useState('Entrevista')
    const [descricao, setDescricao] = useState('')

    // --- EXPERIENCES STATE ---
    const [activeSection, setActiveSection] = useState<'none' | 'interviews' | 'experiences'>('none')
    const [loading, setLoading] = useState(false)
    const [experienciasList, setExperienciasList] = useState<any[]>([])
    const [empresa, setEmpresa] = useState('')
    const [cargo, setCargo] = useState('')
    const [dataInicio, setDataInicio] = useState('')
    const [dataFim, setDataFim] = useState('')
    const [perfilExp, setPerfilExp] = useState('')
    const [availableTags, setAvailableTags] = useState<string[]>([])
    const [isTaggingExp, setIsTaggingExp] = useState(false)
    const [tagSearchExp, setTagSearchExp] = useState('')
    const [cursorPositionExp, setCursorPositionExp] = useState(0)

    const allHistorico = [...pendingHistorico, ...historicoList]
    const allExperiencias = [...pendingExperiencias, ...experienciasList]

    // --- EFFECT ---
    useEffect(() => {
        setLoading(false)
        if (candidatoId) {
            fetchHistorico()
            fetchExperiencias()
            fetchTags()
        }
    }, [candidatoId])

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

    const fetchExperiencias = async () => {
        if (!candidatoId) return
        const { data } = await supabase
            .from('candidato_experiencias')
            .select('*')
            .eq('candidato_id', candidatoId)
            .order('data_inicio', { ascending: false })

        if (data) setExperienciasList(data)
    }

    const fetchHistorico = async () => {
        if (!candidatoId) return
        const { data } = await supabase
            .from('candidato_historico')
            .select('*')
            .eq('candidato_id', candidatoId)
            .order('data_registro', { ascending: false })

        if (data) setHistoricoList(data)
    }

    // --- DELETE HANDLER ---
    const handleDeleteHistorico = async (id?: string, temp_id?: string) => {
        if (!confirm('Deseja realmente excluir este registro de histórico?')) return;

        if (temp_id && setPendingHistorico) {
            setPendingHistorico(prev => prev.filter(item => item.temp_id !== temp_id));
            return;
        }

        if (!id) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('candidato_historico').delete().eq('id', id);
            if (error) throw error;
            setHistoricoList(prev => prev.filter(item => item.id !== id));
        } catch (e: any) {
            alert('Erro ao excluir histórico: ' + e.message);
        } finally {
            setLoading(false);
        }
    }

    const handleDeleteExperiencia = async (id?: string, temp_id?: string) => {
        if (!confirm('Deseja realmente excluir esta experiência?')) return;

        if (temp_id && setPendingExperiencias) {
            setPendingExperiencias(prev => prev.filter(item => item.temp_id !== temp_id));
            return;
        }

        if (!id) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('candidato_experiencias').delete().eq('id', id);
            if (error) throw error;
            setExperienciasList(prev => prev.filter(item => item.id !== id));
        } catch (e: any) {
            alert('Erro ao excluir experiência: ' + e.message);
        } finally {
            setLoading(false);
        }
    }

    // --- SAVE HANDLERS ---
    const handleSaveHistorico = async () => {
        if (!descricao) return

        const payload = {
            tipo: tipo,
            descricao: descricao,
            data_registro: new Date().toISOString()
        }

        if (!candidatoId) {
            if (setPendingHistorico) setPendingHistorico(prev => [{ ...payload, temp_id: Math.random().toString(36).substr(2, 9) }, ...prev]);
            alert('Registro adicionado temporariamente. Salve o candidato para concluir.');
            setDescricao('');
            return;
        }

        setLoading(true)
        try {
            const { error } = await supabase.from('candidato_historico').insert({
                candidato_id: candidatoId,
                ...payload
            })
            if (error) throw error
            alert('Registro salvo com sucesso!')
            setDescricao('')
            fetchHistorico()
        } catch (e: any) {
            alert('Erro ao salvar: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveExperiencia = async () => {
        if (!empresa || !cargo || !dataInicio) return

        const payload = {
            empresa,
            cargo,
            data_inicio: dataInicio,
            data_fim: dataFim || null,
            perfil: perfilExp
        }

        if (!candidatoId) {
            if (setPendingExperiencias) setPendingExperiencias(prev => [{ ...payload, temp_id: Math.random().toString(36).substr(2, 9) }, ...prev]);
            alert('Experiência adicionada temporariamente. Salve o candidato para concluir.');
            setEmpresa('')
            setCargo('')
            setDataInicio('')
            setDataFim('')
            setPerfilExp('')
            return;
        }

        setLoading(true)
        try {
            const { error } = await supabase.from('candidato_experiencias').insert({ ...payload, candidato_id: candidatoId })
            if (error) throw error

            // Upsert tags
            if (perfilExp) {
                const lines = perfilExp.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
                if (lines.length > 0) {
                    const tagsToInsert = lines.map((t: string) => ({ tag: t }));
                    const { error: tagError } = await supabase.from('perfil_tags').upsert(tagsToInsert, { onConflict: 'tag' });
                    if (tagError) console.error("Error upserting tags", tagError);
                }
            }

            alert('Experiência salva com sucesso!')
            setEmpresa('')
            setCargo('')
            setDataInicio('')
            setDataFim('')
            setPerfilExp('')
            fetchExperiencias()
        } catch (e: any) {
            alert('Erro ao salvar: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    // --- TAGGING LOGIC FOR EXPERIENCES ---
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
    }

    // Helper for time calculation
    const calcTempo = (inicio: string, fim?: string) => {
        if (!inicio) return '';
        const dataFimVal = fim ? new Date(fim) : new Date();
        const dataInicioVal = new Date(inicio);
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
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            {/* BUTTONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Entrevistas */}
                <button
                    onClick={() => setActiveSection(activeSection === 'interviews' ? 'none' : 'interviews')}
                    className={`
                        relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 text-left group
                        ${activeSection === 'interviews'
                            ? 'bg-blue-50 border-blue-200 shadow-md transform scale-[1.02]'
                            : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-lg'
                        }
                    `}
                >
                    <div className={`p-3 rounded-xl w-fit mb-3 transition-colors ${activeSection === 'interviews' ? 'bg-blue-200 text-blue-700' : 'bg-blue-50 text-blue-500 group-hover:bg-blue-100'}`}>
                        <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider mb-1">Entrevistas e Anotações</h3>
                    <p className="text-[10px] text-gray-500 font-medium">Histórico de conversas com o candidato</p>
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${activeSection === 'interviews' ? 'rotate-90 opacity-100' : 'opacity-0 -translate-x-2'}`}>
                        <ChevronRight className="h-5 w-5 text-blue-500" />
                    </div>
                </button>

                {/* Trabalhos Anteriores */}
                <button
                    onClick={() => setActiveSection(activeSection === 'experiences' ? 'none' : 'experiences')}
                    className={`
                        relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 text-left group
                        ${activeSection === 'experiences'
                            ? 'bg-purple-50 border-purple-200 shadow-md transform scale-[1.02]'
                            : 'bg-white border-gray-100 hover:border-purple-200 hover:shadow-lg'
                        }
                    `}
                >
                    <div className={`p-3 rounded-xl w-fit mb-3 transition-colors ${activeSection === 'experiences' ? 'bg-purple-200 text-purple-700' : 'bg-purple-50 text-purple-500 group-hover:bg-purple-100'}`}>
                        <Briefcase className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider mb-1">Trabalhos Anteriores</h3>
                    <p className="text-[10px] text-gray-500 font-medium">Experiência profissional do candidato</p>
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${activeSection === 'experiences' ? 'rotate-90 opacity-100' : 'opacity-0 -translate-x-2'}`}>
                        <ChevronRight className="h-5 w-5 text-purple-500" />
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

                {/* INTERVIEWS PANEL */}
                {activeSection === 'interviews' && (
                    <div className="p-8 animate-in fade-in slide-in-from-top-4 duration-300 space-y-8">
                        {/* REGISTER NEW INTERVIEW */}
                        {!isViewMode && (
                            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><MessageSquare className="h-5 w-5" /></div>
                                    <h4 className="text-md font-black text-[#0a192f] uppercase tracking-wider">Novo Registro</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <SearchableSelect
                                        label="Tipo de Registro"
                                        placeholder="Selecione..."
                                        value={tipo}
                                        onChange={setTipo}
                                        disabled={isViewMode}
                                        options={[
                                            { id: 'Entrevista', name: 'Entrevista' },
                                            { id: 'Observação', name: 'Observação' },
                                            { id: 'Teste Prático', name: 'Teste Prático' },
                                            { id: 'Dinâmica', name: 'Dinâmica' },
                                            { id: 'Outros', name: 'Outros' }
                                        ]}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição e Feedbacks</label>
                                    <textarea
                                        className={`w-full bg-white border border-gray-200 rounded-xl p-4 text-sm min-h-[120px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none shadow-sm ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        placeholder="Descreva como foi a entrevista, pontos fortes, fracos, etc..."
                                        value={descricao}
                                        onChange={e => setDescricao(e.target.value)}
                                        disabled={isViewMode}
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleSaveHistorico}
                                        disabled={loading || !descricao}
                                        className="flex items-center gap-2 px-6 py-3 bg-[#1e3a8a] text-white rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-blue-800 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Salvar Registro
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* HISTORICO LIST */}
                        <div>
                            <h4 className="text-sm font-black text-[#0a192f] uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Linha do Tempo</h4>

                            {allHistorico.length > 0 ? (
                                <div className="space-y-4">
                                    {allHistorico.map((item, index) => {
                                        return (
                                            <div key={item.id || item.temp_id || index} className="flex items-start gap-4 p-5 border border-gray-100 rounded-2xl bg-white hover:border-blue-200 transition-colors shadow-sm relative group overflow-hidden">
                                                <div className={`absolute top-0 left-0 w-1.5 h-full ${item.tipo === 'Entrevista' ? 'bg-blue-500' :
                                                    item.tipo === 'Observação' ? 'bg-amber-500' :
                                                        item.tipo === 'Teste Prático' ? 'bg-purple-500' :
                                                            'bg-gray-400'
                                                    }`} />

                                                <div className="p-3 bg-gray-50 text-gray-500 rounded-xl mt-1 shrink-0">
                                                    <Calendar className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                                    {new Date(item.data_registro).toLocaleDateString('pt-BR')} às {new Date(item.data_registro).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.tipo === 'Entrevista' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                    item.tipo === 'Observação' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                        item.tipo === 'Teste Prático' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                                            'bg-gray-50 text-gray-600 border-gray-200'
                                                                    }`}>
                                                                    {item.tipo}
                                                                </span>
                                                                {item.temp_id && (
                                                                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-orange-50 text-orange-700 border-orange-200">Não Salvo</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {!isViewMode && (
                                                            <button
                                                                onClick={() => handleDeleteHistorico(item.id, item.temp_id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                                                title="Excluir histórico"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-700 font-medium whitespace-pre-wrap leading-relaxed">
                                                        {item.descricao}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                    <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-gray-500">Nenhum registro encontrado na linha do tempo.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* EXPERIENCES PANEL */}
                {activeSection === 'experiences' && (
                    <div className="p-8 animate-in fade-in slide-in-from-top-4 duration-300 space-y-8">
                        {!isViewMode && (
                            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
                                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Briefcase className="h-5 w-5" /></div>
                                    <h4 className="text-md font-black text-[#0a192f] uppercase tracking-wider">Nova Experiência</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Empresa/Escritório</label>
                                        <input
                                            list="empresas-list"
                                            value={empresa}
                                            onChange={e => setEmpresa(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all shadow-sm"
                                            placeholder="Digite ou selecione..."
                                            disabled={isViewMode}
                                        />
                                        <datalist id="empresas-list">
                                            {Array.from(new Set(experienciasList.map(e => e.empresa))).map((e: any, i) => (
                                                <option key={i} value={e} />
                                            ))}
                                        </datalist>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cargo</label>
                                        <input
                                            list="cargos-list"
                                            value={cargo}
                                            onChange={e => setCargo(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all shadow-sm"
                                            placeholder="Digite ou selecione..."
                                            disabled={isViewMode}
                                        />
                                        <datalist id="cargos-list">
                                            {Array.from(new Set(experienciasList.map(e => e.cargo))).map((c: any, i) => (
                                                <option key={i} value={c} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data Início</label>
                                        <input
                                            type="date"
                                            value={dataInicio}
                                            onChange={e => setDataInicio(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all shadow-sm"
                                            disabled={isViewMode}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data Fim (deixe vazio se atual)</label>
                                        <input
                                            type="date"
                                            value={dataFim}
                                            onChange={e => setDataFim(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all shadow-sm"
                                            disabled={isViewMode}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-end pb-2">
                                    {dataInicio && (
                                        <div className="bg-purple-50 text-purple-700 text-xs px-3 py-2 rounded-lg font-bold border border-purple-100 flex items-center">
                                            Tempo: &nbsp;<span className="text-purple-900">{calcTempo(dataInicio, dataFim)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 relative">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between items-center">
                                        Perfil / Tags da Experiência
                                        <span className="text-[8px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-bold">Use @ para pesquisar tags</span>
                                    </label>
                                    <textarea
                                        className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm min-h-[120px] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all resize-none shadow-sm"
                                        placeholder="Descreva atividades ou insira tags (cada linha salva vira uma tag)&#10;Dica: Use @ para buscar na nuvem de talentos"
                                        value={perfilExp}
                                        onChange={handlePerfilExpChange}
                                        disabled={isViewMode}
                                    />
                                    {isTaggingExp && (
                                        <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-gray-100 z-10 max-h-48 overflow-y-auto">
                                            {availableTags
                                                .filter(t => t.toLowerCase().includes(tagSearchExp.toLowerCase()))
                                                .map(t => (
                                                    <button
                                                        key={t}
                                                        onClick={() => insertTagExp(t)}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors border-b border-gray-50 last:border-0"
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            {availableTags.filter(t => t.toLowerCase().includes(tagSearchExp.toLowerCase())).length === 0 && (
                                                <div className="px-4 py-3 text-sm text-gray-400 text-center">Nenhuma tag encontrada para "{tagSearchExp}"</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleSaveExperiencia}
                                        disabled={loading || !empresa || !cargo || !dataInicio}
                                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-purple-700 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Salvar Experiência
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* EXPERIENCIAS LIST */}
                        <div>
                            <h4 className="text-sm font-black text-[#0a192f] uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Histórico de Trabalhos Anteriores</h4>

                            {allExperiencias.length > 0 ? (
                                <div className="space-y-4">
                                    {allExperiencias.map((item, index) => {
                                        return (
                                            <div key={item.id || item.temp_id || index} className="flex items-start gap-4 p-5 border border-gray-100 rounded-2xl bg-white hover:border-purple-200 transition-colors shadow-sm relative group overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />

                                                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl mt-1 shrink-0">
                                                    <Briefcase className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                <h5 className="font-bold text-[#0a192f] text-base">{item.cargo}</h5>
                                                                <span className="text-gray-400 text-sm">em</span>
                                                                <span className="font-bold text-gray-700 text-base">{item.empresa}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                                    {new Date(item.data_inicio).toLocaleDateString('pt-BR')} - {item.data_fim ? new Date(item.data_fim).toLocaleDateString('pt-BR') : 'Atual'}
                                                                </span>
                                                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                                                                    {calcTempo(item.data_inicio, item.data_fim)}
                                                                </span>
                                                                {item.temp_id && (
                                                                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-orange-50 text-orange-700 border-orange-200">Não Salvo</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {!isViewMode && (
                                                            <button
                                                                onClick={() => handleDeleteExperiencia(item.id, item.temp_id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                                                title="Excluir experiência"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    {item.perfil && (
                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            {item.perfil.split('\n').filter((p: string) => p.trim() !== '').map((tag: string, i: number) => (
                                                                <span key={i} className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded-full border border-indigo-100">
                                                                    {tag.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                    <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-gray-500">Nenhuma experiência profissional cadastrada.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )
                }
            </div >
        </div >
    )
}
