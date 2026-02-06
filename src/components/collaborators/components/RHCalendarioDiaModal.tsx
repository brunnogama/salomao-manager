import { X, Edit2, Trash2, Cake, Calendar as CalendarIcon } from 'lucide-react'

interface RHCalendarioDiaModalProps {
  day: number;
  events: any[];
  onClose: () => void;
  onEdit: (event: any) => void;
  onDelete: (id: number) => void;
  formatName: (name: string) => string;
}

export function RHCalendarioDiaModal({ 
  day, 
  events, 
  onClose, 
  onEdit, 
  onDelete, 
  formatName 
}: RHCalendarioDiaModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#112240] to-[#1e3a8a] flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <h3 className="font-black text-base tracking-tight">Eventos do dia {day}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List Content */}
        <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
          {events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 font-bold text-sm italic">Nenhum evento agendado para este dia.</p>
            </div>
          ) : (
            events.map((ev, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-100 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${'colaborador' in ev ? 'bg-blue-100' : 'bg-green-100'}`}>
                    {'colaborador' in ev ? (
                      <Cake className="h-4 w-4 text-[#1e3a8a]" />
                    ) : (
                      <CalendarIcon className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#0a192f]">
                      {'colaborador' in ev ? formatName(ev.colaborador.nome) : ev.titulo}
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      {'colaborador' in ev ? 'Aniversariante' : ev.tipo}
                    </p>
                  </div>
                </div>

                {/* Actions - Only for custom events, not birthdays */}
                {!('colaborador' in ev) && (
                  <div className="flex gap-1">
                    <button 
                      onClick={() => onEdit(ev)} 
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Editar evento"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => onDelete(ev.id)} 
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Excluir evento"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 text-[10px] font-black text-gray-600 hover:text-gray-800 uppercase tracking-widest transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}