import { X, Calendar as CalendarIcon, Users, Cake, Star } from 'lucide-react'
import { useEscKey } from '../../../hooks/useEscKey'

export type EventCreationType = 'Reunião' | 'Entrevista' | 'Aniversário' | 'Outros'

interface EventSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (tipo: EventCreationType) => void;
}

export function EventSelectionModal({ isOpen, onClose, onSelect }: EventSelectionModalProps) {
    useEscKey(isOpen, onClose)

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">Selecione o Tipo de Evento</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => onSelect('Reunião')}
                        className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-blue-100 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-300 hover:scale-105 transition-all group"
                    >
                        <div className="h-12 w-12 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white shadow-lg group-hover:shadow-blue-300/50 transition-all">
                            <CalendarIcon className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-[#1e3a8a]">Reunião</span>
                    </button>

                    <button
                        onClick={() => onSelect('Entrevista')}
                        className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100 hover:border-emerald-300 hover:scale-105 transition-all group"
                    >
                        <div className="h-12 w-12 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-lg group-hover:shadow-emerald-300/50 transition-all">
                            <Users className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-800">Entrevista</span>
                    </button>

                    <button
                        onClick={() => onSelect('Aniversário')}
                        className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-amber-100 bg-amber-50/50 hover:bg-amber-100 hover:border-amber-300 hover:scale-105 transition-all group"
                    >
                        <div className="h-12 w-12 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-lg group-hover:shadow-amber-300/50 transition-all">
                            <Cake className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-amber-700">Aniversário</span>
                    </button>

                    <button
                        onClick={() => onSelect('Outros')}
                        className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-purple-100 bg-purple-50/50 hover:bg-purple-100 hover:border-purple-300 hover:scale-105 transition-all group"
                    >
                        <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg group-hover:shadow-purple-300/50 transition-all">
                            <Star className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-purple-800">Outros</span>
                    </button>
                </div>

                <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 font-medium">Escolha o tipo de evento para abrir o formulário compatível</p>
                </div>
            </div>
        </div>
    )
}
