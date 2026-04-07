import { useState, useEffect, useRef } from 'react';
import { Calendar, X } from 'lucide-react';

interface DateFilterSelectProps {
  value: { start: string; end: string };
  onChange: (val: { start: string; end: string }) => void;
  placeholder?: string;
}

export function DateFilterSelect({ value, onChange, placeholder = 'Período' }: DateFilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const isActive = value.start !== '' || value.end !== '';

  let displayValue = placeholder;
  if (isActive) {
    if (value.start && value.end) {
      displayValue = `${new Date(value.start + 'T12:00:00').toLocaleDateString('pt-BR')} até ${new Date(value.end + 'T12:00:00').toLocaleDateString('pt-BR')}`;
    } else if (value.start) {
      displayValue = `A partir de ${new Date(value.start + 'T12:00:00').toLocaleDateString('pt-BR')}`;
    } else if (value.end) {
      displayValue = `Até ${new Date(value.end + 'T12:00:00').toLocaleDateString('pt-BR')}`;
    }
  }

  return (
    <div className="relative min-w-[200px]" ref={wrapperRef}>
      <div
        className={`flex items-center px-3 py-2 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors select-none shadow-sm h-[42px] ${isActive ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Calendar className={`w-4 h-4 mr-2 shrink-0 ${isActive ? 'text-[#1e3a8a]' : 'text-gray-400'}`} />
        <span className={`text-xs font-bold flex-1 truncate uppercase tracking-wider ${isActive ? 'text-[#1e3a8a]' : 'text-gray-600'}`}>
          {displayValue}
        </span>
        {isActive && (
          <div
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange({ start: '', end: '' });
            }}
            className="mr-2 p-0.5 hover:bg-blue-100 rounded-full transition-colors"
          >
            <X className="w-3 h-3 text-blue-400 hover:text-blue-600" />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full right-0 lg:left-0 lg:right-auto mt-1 w-[360px] bg-white border border-gray-100 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 overflow-hidden">
          <div className="p-5" onClick={(e) => e.stopPropagation()}>
            {/* Botões Rápidos */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => {
                  const today = new Date();
                  const day = today.getDay();
                  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                  const start = new Date(today.setDate(diff));
                  const end = new Date(start);
                  end.setDate(end.getDate() + 6);
                  onChange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] });
                  setIsOpen(false);
                }}
                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:border-[#1e3a8a]/30 hover:text-[#1e3a8a] ring-1 ring-transparent hover:ring-[#1e3a8a]/10 transition-all outline-none"
              >
                Semana Atual
              </button>
              <button
                onClick={() => {
                  const date = new Date();
                  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                  onChange({ start: firstDay.toISOString().split('T')[0], end: lastDay.toISOString().split('T')[0] });
                  setIsOpen(false);
                }}
                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:border-[#1e3a8a]/30 hover:text-[#1e3a8a] ring-1 ring-transparent hover:ring-[#1e3a8a]/10 transition-all outline-none"
              >
                Mês Atual
              </button>
            </div>

            {/* Campos de Início e Fim */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#1e3a8a] mb-2 text-center">Início</label>
                <input
                  type="date"
                  value={value.start}
                  onChange={(e) => onChange({ ...value, start: e.target.value })}
                  className="w-full text-xs font-bold text-gray-700 bg-white border border-gray-200 shadow-sm rounded-xl py-2.5 px-3 outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all cursor-pointer hover:border-blue-300"
                />
              </div>

              <div className="shrink-0 pt-6 text-gray-300 font-light flex items-center justify-center">
                —
              </div>

              <div className="flex-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#1e3a8a] mb-2 text-center">Fim</label>
                <input
                  type="date"
                  value={value.end}
                  onChange={(e) => onChange({ ...value, end: e.target.value })}
                  className="w-full text-xs font-bold text-gray-700 bg-white border border-gray-200 shadow-sm rounded-xl py-2.5 px-3 outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all cursor-pointer hover:border-blue-300"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
