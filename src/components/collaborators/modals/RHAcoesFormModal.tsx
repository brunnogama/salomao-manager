import { useState, useEffect } from 'react'
import {
    X,
    AlignLeft,
    Save,
    Megaphone,
    MapPin,
    Users
} from 'lucide-react'

export interface RHAction {
    id?: string;
    title: string;
    event_date: string;
    result?: string;
    participants?: string;
    medium: 'Online' | 'Presencial';
    location?: string;
}

interface RHAcoesFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: RHAction) => Promise<void>;
    initialData?: RHAction | null;
}

export function RHAcoesFormModal({ isOpen, onClose, onSave, initialData }: RHAcoesFormModalProps) {
    const [formData, setFormData] = useState<RHAction>({
        title: '',
        event_date: new Date().toISOString().split('T')[0],
        result: '',
        participants: '',
        medium: 'Online',
        location: ''
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (initialData) {
            setFormData(initialData)
        } else {
            setFormData({
                title: '',
                event_date: new Date().toISOString().split('T')[0],
                result: '',
                participants: '',
                medium: 'Online',
                location: ''
            })
        }
    }, [initialData, isOpen])

    const handleSubmit = async () => {
        if (!formData.title || !formData.event_date) return

        setLoading(true)
        try {
            await onSave(formData)
            onClose()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 bg-gradient-to-r from-[#112240] to-[#1e3a8a] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <Megaphone className="h-5 w-5" />
                        <h3 className="font-black text-base tracking-tight">{initialData ? 'Editar Ação' : 'Nova Ação'}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Ação/Evento</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all font-medium"
                            placeholder="Descreva a ação..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Data</label>
                            <input
                                type="date"
                                value={formData.event_date}
                                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Meio</label>
                            <select
                                value={formData.medium}
                                onChange={(e) => setFormData({ ...formData, medium: e.target.value as 'Online' | 'Presencial' })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all bg-white font-medium"
                            >
                                <option value="Online">Online</option>
                                <option value="Presencial">Presencial</option>
                            </select>
                        </div>
                    </div>

                    {formData.medium === 'Presencial' && (
                        <div className="animate-in slide-in-from-top-2 duration-200">
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> Local
                            </label>
                            <input
                                type="text"
                                value={formData.location || ''}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all font-medium"
                                placeholder="Sala de reuniões, Auditório..."
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                            <Users className="h-3 w-3" /> Participantes
                        </label>
                        <input
                            type="text"
                            value={formData.participants || ''}
                            onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all font-medium"
                            placeholder="Nomes ou quantidade..."
                        />
                    </div>

                    <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                            <AlignLeft className="h-3 w-3" /> Resultado
                        </label>
                        <textarea
                            value={formData.result || ''}
                            onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all resize-none font-medium"
                            placeholder="Descreva o resultado da ação..."
                        />
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-[9px] font-black text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-xl transition-all uppercase tracking-[0.2em]"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !formData.title}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white font-black text-[9px] rounded-xl hover:shadow-lg transition-all disabled:opacity-50 shadow-md uppercase tracking-[0.2em] active:scale-95"
                    >
                        {loading ? (
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    )
}
