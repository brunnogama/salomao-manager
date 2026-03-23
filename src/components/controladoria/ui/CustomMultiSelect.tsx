import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Plus, Check } from 'lucide-react';

interface CustomMultiSelectProps {
  label?: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: { label: string; value: string }[] | string[];
  placeholder?: string;
  disabled?: boolean;
  onAction?: () => void;
  actionLabel?: string;
  actionIcon?: React.ElementType;
  className?: string;
}

export function CustomMultiSelect({
  label,
  values = [],
  onChange,
  options,
  placeholder = 'Selecione...',
  disabled = false,
  onAction,
  actionLabel,
  actionIcon: ActionIcon = Plus,
  className = ''
}: CustomMultiSelectProps) {
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

      const handleScroll = (event: Event) => {
        const target = event.target as HTMLElement;
        if (target.id !== 'multi-select-options-list') {
          setIsOpen(false);
        }
      };

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
        const portalContent = document.getElementById('multi-select-portal-root');
        if (portalContent && portalContent.contains(event.target as Node)) return;
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (val: string) => {
    if (val === '') return;
    const newValues = values.includes(val) 
      ? values.filter(v => v !== val)
      : [...values, val];
    onChange(newValues);
  };

  const getDisplayValue = () => {
    if (!values || values.length === 0) return '';
    const labels = values.map(v => {
      const opt = normalizedOptions.find(o => o.value === v);
      return opt ? opt.label : v;
    });
    return labels.join(', ');
  };

  const displayValue = getDisplayValue();

  const dropdownMenu = (
    <div
      id="multi-select-portal-root"
      className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl animate-in fade-in zoom-in-95 origin-top"
      style={{
        top: coords.top + 4 - window.scrollY,
        left: coords.left,
        width: coords.width
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-2 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:border-salomao-blue outline-none bg-white"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <div
        id="multi-select-options-list"
        className="max-h-60 overflow-y-auto scrollbar-thin"
      >
        {filteredOptions.length > 0 ? (
          filteredOptions.map((opt) => {
            if (opt.value === '') return null;
            const isSelected = values.includes(opt.value);
            return (
              <div
                key={opt.value}
                onClick={() => toggleOption(opt.value)}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-between ${isSelected ? 'bg-blue-50 text-salomao-blue font-medium' : 'text-gray-700'
                  }`}
              >
                {opt.label}
                {isSelected && <Check className="w-4 h-4 text-salomao-blue" />}
              </div>
            );
          })
        ) : (
          <div className="px-3 py-4 text-xs text-center text-gray-400">
            Nenhuma opção encontrada
          </div>
        )}
      </div>

      {
        onAction && (
          <div
            onClick={() => { onAction(); setIsOpen(false); }}
            className="border-t border-gray-100 p-2 bg-gray-50 rounded-b-lg cursor-pointer hover:bg-gray-100 transition-colors group"
          >
            <div className="flex items-center justify-center text-xs font-medium text-salomao-blue group-hover:text-blue-700">
              <ActionIcon className="w-3.5 h-3.5 mr-1.5" />
              {actionLabel || 'Gerenciar'}
            </div>
          </div>
        )
      }
    </div >
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="text-xs font-medium block mb-1 text-gray-600">{label}</label>}

      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
        className={`w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:border-salomao-blue outline-none flex justify-between items-center transition-all ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-gray-400'
          } ${isOpen ? 'border-salomao-blue ring-1 ring-salomao-blue' : ''}`}
      >
        <span className={`truncate ${!displayValue ? 'text-gray-400' : 'text-gray-700'}`}>
          {displayValue || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(dropdownMenu, document.body)}
    </div>
  );
}
