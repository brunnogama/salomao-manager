import { useState, useEffect } from 'react'
import { FileText, Save, Loader2, History, ChevronRight, MessageSquare, Trash2, Calendar } from 'lucide-react'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { supabase } from '../../../lib/supabase'

interface CandidatoHistoricoSectionProps {
    candidatoId: string | null
    isViewMode?: boolean
}

export function CandidatoHistoricoSection({ candidatoId, isViewMode = false }: CandidatoHistoricoSectionProps) {
    const [activeSection, setActiveSection] = useState<'none' | 'interviews'>('interviews')
    const [loading, setLoading] = useState(false)

    // --- INTERVIEWS/OBSERVATIONS STATE ---
    const [historicoList, setHistoricoList] = useState<any[]>([])
    const [tipo, setTipo] = useState('Entrevista')
    const [descricao, setDescricao] = useState('')

    // --- EFFECT ---
    useEffect(() => {
        if (candidatoId) {
            fetchHistorico()
        }
    }, [candidatoId])

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
    const handleDeleteHistorico = async (id: string) => {
        if (!confirm('Deseja realmente excluir este registro de histórico?')) return;
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

    // --- SAVE HANDLERS ---
    const handleSaveHistorico = async () => {
        if (!candidatoId || !descricao) return
        setLoading(true)
        try {
            const { error } = await supabase.from('candidato_historico').insert({
                candidato_id: candidatoId,
                tipo: tipo,
                descricao: descricao
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

    if (!candidatoId) {
        return (
            <div className="flex flex-col items-center justify-center text-gray-400 py-12 bg-white rounded-2xl border border-gray-100 shadow-sm min-h-[300px]">
                <History className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-sm font-medium">Salve o candidato primeiro para gerenciar o histórico.</p>
            </div>
        )
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

                            {historicoList.length > 0 ? (
                                <div className="space-y-4">
                                    {historicoList.map((item, index) => {
                                        return (
                                            <div key={item.id || index} className="flex items-start gap-4 p-5 border border-gray-100 rounded-2xl bg-white hover:border-blue-200 transition-colors shadow-sm relative group overflow-hidden">
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
                                                            </div>
                                                        </div>
                                                        {!isViewMode && (
                                                            <button
                                                                onClick={() => handleDeleteHistorico(item.id)}
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
            </div>
        </div >
    )
}
