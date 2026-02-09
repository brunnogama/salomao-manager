import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Plus } from 'lucide-react';

interface CustomSelectProps {
  label?: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  options: { label: string; value: string }[] | string[];
  placeholder?: string;
  disabled?: boolean;
  onAction?: () => void;
  actionLabel?: string;
  actionIcon?: React.ElementType;
  className?: string;
}

export function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  disabled = false,
  onAction,
  actionLabel,
  actionIcon: ActionIcon = Plus,
  className = ''
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const filteredOptions = normalizedOptions.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para calcular posição
  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();

      // Fecha o menu se houver scroll em qualquer lugar (evita o menu flutuando)
      const handleScroll = (event: Event) => {
        // Se o scroll não for dentro da própria lista de opções, fecha o menu
        const target = event.target as HTMLElement;
        if (target.id !== 'select-options-list') {
          setIsOpen(false);
        }
      };

      // O 'true' no final captura o evento de scroll em qualquer container pai (como o modal)
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', updateCoords);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', updateCoords);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const portalContent = document.getElementById('select-portal-root');
        if (portalContent && portalContent.contains(event.target as Node)) return;
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const selectedOption = normalizedOptions.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : value;

  const dropdownMenu = (
    <div 
      id="select-portal-root"
      className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 origin-top overflow-hidden"
      style={{ 
        top: coords.top + 4 - window.scrollY, // Ajuste para a posição fixa
        left: coords.left, 
        width: coords.width 
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-3 border-b border-gray-100 bg-gray-50/80">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            className="w-full pl-8 pr-3 py-2 text-xs font-bold border border-gray-200 rounded-lg focus:border-[#0a192f] outline-none bg-white uppercase tracking-wider"
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <div 
        id="select-options-list" 
        className="max-h-64 overflow-y-auto custom-scrollbar"
      >
        {filteredOptions.length > 0 ? (
          filteredOptions.map((opt) => (
            <div
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight cursor-pointer hover:bg-blue-50 transition-all flex items-center justify-between border-l-4 ${
                value === opt.value 
                  ? 'bg-blue-50/50 text-[#0a192f] border-[#0a192f]' 
                  : 'text-gray-600 border-transparent hover:border-blue-200'
              }`}
            >
              {opt.label}
              {value === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]" />}
            </div>
          ))
        ) : (
          <div className="px-3 py-6 text-[10px] font-black uppercase tracking-widest text-center text-gray-300">
            Nenhuma opção
          </div>
        )}
      </div>

      {onAction && (
        <div 
          onClick={() => { onAction(); setIsOpen(false); }}
          className="border-t border-gray-100 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors group"
        >
          <div className="flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-[#0a192f] group-hover:text-blue-800">
            <ActionIcon className="w-3.5 h-3.5 mr-2 text-amber-500" />
            {actionLabel || 'Gerenciar'}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1.5 ml-1">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full border border-gray-200 rounded-xl p-3 text-sm font-bold bg-white focus:border-[#0a192f] outline-none flex justify-between items-center transition-all shadow-sm ${
          disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-gray-400'
        } ${isOpen ? 'border-[#0a192f] ring-2 ring-[#0a192f]/5' : ''}`}
      >
        <span className={`truncate uppercase tracking-tight ${!displayValue ? 'text-gray-300' : 'text-[#0a192f]'}`}>
          {displayValue || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#0a192f]' : ''}`} />
      </button>

      {isOpen && createPortal(dropdownMenu, document.body)}
    </div>
  );
}