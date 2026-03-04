import { useState, useEffect } from 'react'
import { Save, Loader2, History, MessageSquare, Trash2, Calendar } from 'lucide-react'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { supabase } from '../../../lib/supabase'

interface CandidatoHistoricoSectionProps {
    candidatoId: string | null
    isViewMode?: boolean
    pendingHistorico?: any[]
    setPendingHistorico?: React.Dispatch<React.SetStateAction<any[]>>
}

export function CandidatoHistoricoSection({
    candidatoId,
    isViewMode = false,
    pendingHistorico = [],
    setPendingHistorico
}: CandidatoHistoricoSectionProps) {
    const [historicoList, setHistoricoList] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [tipo, setTipo] = useState('Entrevista')
    const [descricao, setDescricao] = useState('')
    const [entrevistaData, setEntrevistaData] = useState('')
    const [entrevistaHora, setEntrevistaHora] = useState('')
    const [compareceu, setCompareceu] = useState<string>('Pendente')
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type: 'success' | 'warning' | 'error' }>({ isOpen: false, title: '', message: '', type: 'success' })

    const showAlert = (title: string, message: string, type: 'success' | 'warning' | 'error') => {
        setAlertConfig({ isOpen: true, title, message, type });
    }

    const allHistorico = [...pendingHistorico, ...historicoList]

    // --- EFFECT ---
    useEffect(() => {
        setLoading(false)
        if (candidatoId) {
            fetchHistorico()
        }
    }, [candidatoId])

    const fetchHistorico = async () => {
        if (!candidatoId) return
        const { data: historicoData } = await supabase
            .from('candidato_historico')
            .select('*')
            .eq('candidato_id', candidatoId)

        const { data: eventosData } = await supabase
            .from('eventos')
            .select('*')
            .contains('participantes_candidatos', [candidatoId])

        const combined = [
            ...(historicoData || []).map(h => ({
                ...h,
                id: `hist_${h.id}`,
                source: 'historico'
            })),
            ...(eventosData || []).map(e => ({
                id: `ev_${e.id}`,
                tipo: e.tipo || 'Entrevista',
                created_at: e.created_at,
                data_registro: e.created_at,
                entrevista_data: e.data_evento ? e.data_evento.split('T')[0] : null,
                entrevista_hora: e.data_evento && e.data_evento.includes('T') ? e.data_evento.split('T')[1].substring(0, 5) : null,
                descricao: e.descricao || `[Via Calendário] Evento agendado: ${e.titulo}`,
                compareceu: e.compareceu !== undefined ? e.compareceu : null,
                source: 'calendario'
            }))
        ]

        const sortedData = combined.sort((a: any, b: any) => {
            const dateA = new Date(a.created_at || a.data_registro || 0).getTime();
            const dateB = new Date(b.created_at || b.data_registro || 0).getTime();
            return dateB - dateA;
        });

        setHistoricoList(sortedData);
    }

    // --- DELETE HANDLER ---
    const handleDeleteHistorico = async (id?: string, temp_id?: string) => {
        if (!confirm('Deseja realmente excluir este registro de histórico?')) return;

        if (temp_id && setPendingHistorico) {
            setPendingHistorico(prev => prev.filter(item => item.temp_id !== temp_id));
            return;
        }

        if (!id) return;

        if (id.startsWith('ev_')) {
            alert('Este evento foi gerado pela Agenda e deve ser removido por lá.');
            return;
        }

        const realId = id.replace('hist_', '');

        setLoading(true);
        try {
            const { error } = await supabase.from('candidato_historico').delete().eq('id', realId);
            if (error) throw error;
            setHistoricoList(prev => prev.filter(item => item.id !== id));
        } catch (e: any) {
            alert('Erro ao excluir histórico: ' + e.message);
        } finally {
            setLoading(false);
        }
    }

    const handleUpdateCompareceu = async (id: string, value: string) => {
        if (id.startsWith('ev_')) {
            alert('A presença de eventos nativos do Calendário devem ser alteradas na aba de Reuniões da Agenda.');
            return;
        }
        const realId = id.replace('hist_', '');
        setLoading(true);
        try {
            const val = value === 'Pendente' ? null : value === 'Sim';
            const { error } = await supabase.from('candidato_historico').update({ compareceu: val }).eq('id', realId);
            if (error) throw error;
            setHistoricoList(prev => prev.map(item => item.id === id ? { ...item, compareceu: val } : item));
            showAlert('Sucesso', 'Presença atualizada!', 'success');
        } catch (e: any) {
            showAlert('Erro', 'Erro ao atualizar presença: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    // --- SAVE HANDLERS ---
    const handleSaveHistorico = async () => {
        if (!descricao) return

        const payload: any = {
            tipo: tipo,
            descricao: descricao
        }

        if (tipo === 'Entrevista') {
            const extraLines = `\nData: ${entrevistaData ? entrevistaData.split('-').reverse().join('/') : 'N/A'}${entrevistaHora ? ' às ' + entrevistaHora : ''}\nComparecimento: ${compareceu}`;
            payload.descricao = descricao + extraLines;
        }

        if (!candidatoId) {
            if (setPendingHistorico) setPendingHistorico(prev => [{ ...payload, temp_id: Math.random().toString(36).substr(2, 9) }, ...prev]);
            showAlert('Atenção', 'Registro adicionado temporariamente. Salve o candidato para concluir.', 'warning');
            setDescricao('');
            setEntrevistaData('');
            setEntrevistaHora('');
            setCompareceu('Pendente');
            return;
        }

        setLoading(true)
        try {
            const { error } = await supabase.from('candidato_historico').insert({
                candidato_id: candidatoId,
                ...payload
            })
            if (error) throw error
            showAlert('Sucesso', 'Registro salvo com sucesso!', 'success')
            setDescricao('')
            setEntrevistaData('');
            setEntrevistaHora('');
            setCompareceu('Pendente');
            fetchHistorico()
        } catch (e: any) {
            showAlert('Erro', 'Erro ao salvar: ' + e.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 w-full max-w-4xl mx-auto relative">
            {/* Modal Dialog for alerts matching the system design */}
            {alertConfig.isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-500/20 backdrop-blur-sm animate-in fade-in duration-200">
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

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[300px] relative p-8">
                {/* INTERVIEWS PANEL directly shown */}
                <div className="space-y-8">
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
                                {tipo === 'Entrevista' && (
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Data da Entrevista</label>
                                            <input type="date" value={entrevistaData} onChange={e => setEntrevistaData(e.target.value)} disabled={isViewMode} className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm disabled:opacity-70 disabled:bg-gray-50" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Hora</label>
                                            <input type="time" value={entrevistaHora} onChange={e => setEntrevistaHora(e.target.value)} disabled={isViewMode} className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm disabled:opacity-70 disabled:bg-gray-50" />
                                        </div>
                                        <div className="flex-1">
                                            <SearchableSelect
                                                label="Compareceu?"
                                                placeholder="Selecione..."
                                                value={compareceu}
                                                onChange={setCompareceu}
                                                disabled={isViewMode}
                                                options={[
                                                    { id: 'Pendente', name: 'Pendente' },
                                                    { id: 'Sim', name: 'Sim' },
                                                    { id: 'Não', name: 'Não' }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                )}
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
                                                <p className="text-sm text-gray-700 font-medium whitespace-pre-wrap leading-relaxed mt-2">
                                                    {item.descricao}
                                                </p>

                                                {item.tipo === 'Entrevista' && (item.entrevista_data || item.entrevista_hora || item.compareceu !== undefined) && (
                                                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4">
                                                        {(item.entrevista_data || item.entrevista_hora) && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agendado:</span>
                                                                <span className="text-xs font-bold text-[#0a192f] bg-gray-50 px-2 py-1 rounded-md">
                                                                    {item.entrevista_data ? new Date(item.entrevista_data + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
                                                                    {item.entrevista_data && item.entrevista_hora ? ' às ' : ''}
                                                                    {item.entrevista_hora ? item.entrevista_hora : ''}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compareceu:</span>
                                                            {!isViewMode ? (
                                                                <select
                                                                    value={item.compareceu === true ? 'Sim' : item.compareceu === false ? 'Não' : 'Pendente'}
                                                                    onChange={(e) => handleUpdateCompareceu(item.id, e.target.value)}
                                                                    className={`text-xs font-bold px-2 py-1 rounded-md outline-none transition-colors border cursor-pointer ${item.compareceu === true ? 'bg-green-50 text-green-700 border-green-200' :
                                                                        item.compareceu === false ? 'bg-red-50 text-red-700 border-red-200' :
                                                                            'bg-gray-50 text-gray-600 border-gray-200 focus:border-blue-500'
                                                                        }`}
                                                                    disabled={!item.id} // Disabled se não foi salvo (temp_id)
                                                                >
                                                                    <option value="Pendente">Pendente</option>
                                                                    <option value="Sim">Sim</option>
                                                                    <option value="Não">Não</option>
                                                                </select>
                                                            ) : (
                                                                <span className={`text-xs font-bold px-2 py-1 rounded-md border ${item.compareceu === true ? 'bg-green-50 text-green-700 border-green-200' :
                                                                    item.compareceu === false ? 'bg-red-50 text-red-700 border-red-200' :
                                                                        'bg-gray-50 text-gray-600 border-gray-200'
                                                                    }`}>
                                                                    {item.compareceu === true ? 'Sim' : item.compareceu === false ? 'Não' : 'Pendente'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
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
            </div>
        </div>
    )
}
