import { useState, useEffect } from 'react'
import { Vaga } from '../../../types/controladoria'
import {
    Briefcase,
    AlertCircle,
    Edit2,
    Calendar,
    Users,
    MapPin,
    Clock,
    User,
    Tag,
    FileText
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

interface VagaViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    vagaId: string | null;
    onEdit: (id: string) => void;
}

export function VagaViewModal({ isOpen, onClose, vagaId, onEdit }: VagaViewModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [vaga, setVaga] = useState<Vaga | null>(null)

    useEffect(() => {
        if (isOpen && vagaId) {
            fetchVaga(vagaId)
        } else {
            setVaga(null)
        }
    }, [isOpen, vagaId])

    const fetchVaga = async (id: string) => {
        try {
            setLoading(true)
            setError(null)

            const { data, error: dbError } = await supabase
                .from('vagas')
                .select(`
                    *,
                    role:role_id(name),
                    location:location_id(name),
                    atuacao:atuacao_id(name),
                    hiring_reason:hiring_reason_id(name),
                    leader:leader_id(name),
                    partner:partner_id(name),
                    replaced:replaced_collaborator_id(name)
                `)
                .eq('id', id)
                .single()

            if (dbError) throw dbError
            setVaga(data)
        } catch (err: any) {
            console.error('Error fetching vaga:', err)
            setError('Erro ao carregar dados da vaga.')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    }

    const formatCurrency = (val?: number) => {
        if (!val) return '-'
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Aberta': return 'bg-green-50 text-green-700 border-green-200'
            case 'Congelada': return 'bg-amber-50 text-amber-700 border-amber-200'
            case 'Aguardando Autorização': return 'bg-purple-50 text-purple-700 border-purple-200'
            default: return 'bg-gray-50 text-gray-600 border-gray-200'
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-all duration-300">
            <div
                className="w-[90%] md:w-[60%] lg:w-[45%] bg-white h-full shadow-2xl flex flex-col border-l border-gray-100"
                onClick={e => e.stopPropagation()}
            >
                {/* HEAD */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-[#f8fafc]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100/50 rounded-2xl flex items-center justify-center border border-blue-200/50 shadow-sm">
                            <Briefcase className="w-6 h-6 text-[#1e3a8a] stroke-[2.5]" />
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${vaga?.sigilosa ? 'text-red-600' : 'text-[#0a192f]'}`}>
                                Visualizar Vaga
                                {vaga && (
                                    <span className={`text-[10px] px-2.5 py-1 rounded-md tracking-widest font-black uppercase border ${vaga.sigilosa ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                        {vaga.vaga_id_text}
                                        {vaga.sigilosa ? ' (Sigilosa)' : ''}
                                    </span>
                                )}
                            </h2>
                            <p className="text-sm text-gray-500 font-medium">Detalhes e acompanhamento do cargo</p>
                        </div>
                    </div>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto bg-gray-50/30">
                    <div className="p-8 space-y-8">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="w-8 h-8 border-4 border-blue-200 border-t-[#1e3a8a] rounded-full animate-spin" />
                            </div>
                        ) : vaga ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 relative">

                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className={`text-xl font-bold ${vaga.sigilosa ? 'text-red-600' : 'text-[#0a192f]'}`}>{vaga.role?.name || 'Cargo não definido'}</h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                            <span>{vaga.area || 'Sem área'}</span>
                                            {vaga.atuacao?.name && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                    <span>{vaga.atuacao.name}</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border ${getStatusColor(vaga.status)}`}>
                                        {vaga.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Abertura</span>
                                        <span className="text-sm font-semibold text-gray-700">{formatDate(vaga.data_abertura)}</span>
                                    </div>
                                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Prazo</span>
                                        <span className="text-sm font-semibold text-gray-700">{formatDate(vaga.data_prazo)}</span>
                                    </div>
                                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Quantidade</span>
                                        <span className="text-sm font-semibold text-gray-700">{vaga.quantidade} vaga(s)</span>
                                    </div>
                                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Local</span>
                                        <span className="text-sm font-semibold text-gray-700">{vaga.location?.name || '-'}</span>
                                    </div>
                                </div>

                                <section>
                                    <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Informações Complementares</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                                        <div>
                                            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Remuneração</span>
                                            <p className="text-sm font-semibold text-gray-700 ml-1">{formatCurrency(vaga.remuneracao)}</p>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Motivo / Tipo</span>
                                            <p className="text-sm font-semibold text-gray-700 ml-1">
                                                {vaga.hiring_reason?.name || '-'} {vaga.tipo ? `(${vaga.tipo})` : ''}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Acompanhamento e Liderança</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6">
                                        <div>
                                            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Líder Direto</span>
                                            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2"><User className="w-3.5 h-3.5 text-gray-400" /> {vaga.leader?.name || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Sócio Responsável</span>
                                            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Briefcase className="w-3.5 h-3.5 text-gray-400" /> {vaga.partner?.name || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Recrutadora</span>
                                            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Tag className="w-3.5 h-3.5 text-gray-400" /> {vaga.recrutadora || '-'}</p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Perfil e Observações</h3>
                                    <div className="space-y-6">
                                        <div>
                                            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Perfil Desejado (Tags)</span>
                                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                                                {vaga.perfil ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {vaga.perfil.split('\n').filter(t => t.trim()).map((t, i) => (
                                                            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                                                                <Tag className="w-3 h-3" /> {t.trim()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : '-'}
                                            </div>
                                        </div>
                                        {vaga.observacoes && (
                                            <div>
                                                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Observações</span>
                                                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                    {vaga.observacoes}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>

                            </div>
                        ) : null}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-white shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all"
                    >
                        Fechar
                    </button>
                    {vaga && (
                        <button
                            type="button"
                            onClick={() => {
                                onClose()
                                onEdit(vaga.id)
                            }}
                            className="bg-[#1e3a8a] text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-900 transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 hover:-translate-y-0.5"
                        >
                            <Edit2 className="w-4 h-4" />
                            Editar Vaga
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
