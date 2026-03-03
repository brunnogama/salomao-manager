import React from 'react'
import { Briefcase, Plus, Trash2, Loader2 } from 'lucide-react'
import { ManagedSelect } from '../../crm/ManagedSelect'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { supabase } from '../../../lib/supabase'

interface DadosProfissionaisCandidatoProps {
    formData: any
    setFormData: (data: any) => void
    isViewMode?: boolean
    candidatoId: string | null
    pendingExperiencias: any[]
    setPendingExperiencias: React.Dispatch<React.SetStateAction<any[]>>
    showAlert: (title: string, message: string, type: 'success' | 'warning' | 'error') => void
}

export function DadosProfissionaisCandidato({
    formData, setFormData, isViewMode = false,
    candidatoId, pendingExperiencias, setPendingExperiencias, showAlert
}: DadosProfissionaisCandidatoProps) {

    const [empresa, setEmpresa] = React.useState('')
    const [cargo, setCargo] = React.useState('')
    const [dataInicio, setDataInicio] = React.useState('')
    const [dataFim, setDataFim] = React.useState('')
    const [perfilExp, setPerfilExp] = React.useState('')
    const [isTaggingExp, setIsTaggingExp] = React.useState(false)
    const [tagSearchExp, setTagSearchExp] = React.useState('')
    const [cursorPositionExp, setCursorPositionExp] = React.useState(0)
    const [experienciasList, setExperienciasList] = React.useState<any[]>([])
    const [loadingExp, setLoadingExp] = React.useState(false)
    const [availableTags, setAvailableTags] = React.useState<string[]>([])

    React.useEffect(() => {
        if (candidatoId) {
            fetchExperiencias(candidatoId)
        } else {
            setExperienciasList([])
        }
        fetchTags()
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

    const fetchExperiencias = async (id: string) => {
        const { data } = await supabase
            .from('candidato_experiencias')
            .select('*')
            .eq('candidato_id', id)
            .order('data_inicio', { ascending: false })

        if (data) setExperienciasList(data)
    }

    const handleDeleteExperiencia = async (id?: string, temp_id?: string) => {
        if (!confirm('Deseja realmente excluir esta experiência?')) return;

        if (temp_id && setPendingExperiencias) {
            setPendingExperiencias(prev => prev.filter(item => item.temp_id !== temp_id));
            return;
        }

        if (!id) return;
        setLoadingExp(true);
        try {
            const { error } = await supabase.from('candidato_experiencias').delete().eq('id', id);
            if (error) throw error;
            setExperienciasList(prev => prev.filter(item => item.id !== id));
        } catch (e: any) {
            showAlert('Erro', 'Erro ao excluir experiência: ' + e.message, 'error');
        } finally {
            setLoadingExp(false);
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
            setPendingExperiencias(prev => [{ ...payload, temp_id: Math.random().toString(36).substring(2, 9) }, ...prev]);
            showAlert('Atenção', 'Experiência adicionada temporariamente. Salve o candidato para concluir.', 'warning');
            setEmpresa('')
            setCargo('')
            setDataInicio('')
            setDataFim('')
            setTagSearchExp('')
            setPerfilExp('')
            return;
        }

        setLoadingExp(true)
        try {
            const { error } = await supabase.from('candidato_experiencias').insert({ ...payload, candidato_id: candidatoId })
            if (error) throw error

            if (perfilExp) {
                const lines = perfilExp.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
                if (lines.length > 0) {
                    const tagsToInsert = lines.map((t: string) => ({ tag: t }));
                    const { error: tagError } = await supabase.from('perfil_tags').upsert(tagsToInsert, { onConflict: 'tag' });
                    if (tagError) console.error("Error upserting tags", tagError);
                }
            }

            showAlert('Sucesso', 'Experiência salva com sucesso!', 'success');
            setEmpresa('')
            setCargo('')
            setDataInicio('')
            setDataFim('')
            setPerfilExp('')
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
    }

    const allExperiencias = [...pendingExperiencias, ...experienciasList]

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
        <div className="space-y-6">
            {/* INFORMAÇÕES GERAIS */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 rounded-l-2xl"></div>

                <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-500" />
                    Informações da Vaga
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SearchableSelect
                        label="Área"
                        value={formData.area || ''}
                        onChange={v => setFormData({ ...formData, area: v })}
                        options={[{ id: 'Administrativa', name: 'Administrativa' }, { id: 'Jurídica', name: 'Jurídica' }]}
                        disabled={isViewMode}
                    />

                    <ManagedSelect
                        label="Cargo Pretendido"
                        value={formData.role || ''}
                        onChange={v => setFormData({ ...formData, role: v })}
                        tableName="roles"
                        disabled={isViewMode}
                    />

                    <SearchableSelect
                        label="Tipo da Contratação"
                        value={formData.contract_type || ''}
                        onChange={v => setFormData({ ...formData, contract_type: v })}
                        options={[{ id: 'ADVOGADO', name: 'ADVOGADO' }, { id: 'CLT', name: 'CLT' }, { id: 'ESTAGIÁRIO', name: 'ESTAGIÁRIO' }, { id: 'JOVEM APRENDIZ', name: 'JOVEM APRENDIZ' }, { id: 'PJ', name: 'PJ' }]}
                        uppercase={false}
                        disabled={isViewMode}
                    />

                    <ManagedSelect
                        label="Local"
                        value={formData.local || ''}
                        onChange={v => setFormData({ ...formData, local: v })}
                        tableName="locations"
                        disabled={isViewMode}
                    />
                </div>
            </div>

            {/* EXPERIÊNCIAS ANTERIORES */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500 rounded-l-2xl"></div>

                <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-purple-500" />
                    Experiências Anteriores
                </h3>

                {!isViewMode && (
                    <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100 mb-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Empresa *</label>
                                <input
                                    type="text"
                                    className="w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 block p-3 outline-none transition-all font-medium"
                                    value={empresa}
                                    onChange={e => setEmpresa(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cargo *</label>
                                <input
                                    type="text"
                                    className="w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 block p-3 outline-none transition-all font-medium"
                                    value={cargo}
                                    onChange={e => setCargo(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Início *</label>
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
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleSaveExperiencia}
                                disabled={loadingExp || !empresa || !cargo || !dataInicio}
                                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-purple-700 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loadingExp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Adicionar Experiência
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
                                                {new Date(item.data_inicio).toLocaleDateString('pt-BR')} - {item.data_fim ? new Date(item.data_fim).toLocaleDateString('pt-BR') : 'Atual'}
                                            </p>
                                            <p className="text-[9px] font-black text-purple-400 uppercase tracking-wider">{calcTempo(item.data_inicio, item.data_fim)}</p>
                                        </div>
                                        {!isViewMode && (
                                            <button
                                                onClick={() => handleDeleteExperiencia(item.id, item.temp_id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                                title="Excluir"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
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
        </div>
    )
} 
