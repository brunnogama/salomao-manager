// src/components/crm/SearchableSelect.tsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Option {
  id?: string | number;
  nome?: string;
  name?: string;
  value?: string;
  label?: string;
}

interface SearchableSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  table?: string; // Nome da tabela no Supabase para buscar opções
  nameField?: string; // Campo do nome na tabela (padrão: 'name')
  options?: Option[]; // Opções estáticas
  disabled?: boolean;
  className?: string;
  onRefresh?: () => void;
  uppercase?: boolean;
  disableFormatting?: boolean;
  dropdownWidth?: string | number; // Largura personalizada do dropdown
  align?: 'left' | 'right'; // Alinhamento do dropdown
}

export function SearchableSelect({
  label,
  value,
  onChange,
  placeholder = "Selecione",
  table,
  nameField = 'name',
  options: externalOptions = [],
  disabled = false,
  className = "",
  onRefresh,
  uppercase = false,
  disableFormatting = false,
  dropdownWidth,
  align = 'left'
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ top: 0 as number | undefined, bottom: undefined as number | undefined, left: 0, width: 0 });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const isFetchedRef = useRef(false);

  const formatText = (str: any) => {
    if (!str) return '';
    const safeStr = String(str);
    if (uppercase) return safeStr.toUpperCase();
    if (disableFormatting) return safeStr;

    // Explicit exclusions that must be uppercase
    const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi'];
    const acronyms = ['clt', 'pj', 'cpf', 'rg', 'cnh', 'oab', 'rh', 'ti', 'ceo', 'cfo', 'pis', 'pasep', 'ctps'];

    return safeStr.toLowerCase().split(' ').map(word => {
      if (romanNumerals.includes(word) || acronyms.includes(word)) return word.toUpperCase();
      return (word.length > 2) ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    }).join(' ');
  };

  // Carrega opções dinâmicas apenas quando abrir ou houver valor inicial e se ainda não buscou
  useEffect(() => {
    if (table) {
      if ((isOpen || value) && !isFetchedRef.current) {
        fetchOptions();
      }
    } else {
      if (JSON.stringify(externalOptions) !== JSON.stringify(options)) {
        setOptions(externalOptions);
      }
    }
  }, [table, isOpen, externalOptions, value]);

  const fetchOptions = async () => {
    if (!table) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(table)
        .select(`id, ${nameField}`)
        .order(nameField);

      if (error) throw error;
      if (data) {
        setOptions(data as Option[]);
        isFetchedRef.current = true;
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error('Erro ao buscar opções:', error);
    } finally {
      setLoading(false);
    }
  };

  /* Removed redundant useEffect for coords */

  useEffect(() => {
    isFetchedRef.current = false;
  }, [table]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Verifica se o clique não foi no trigger nem no menu renderizado via portal
      const menuPortal = document.getElementById('select-portal-root');
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        (!menuPortal || !menuPortal.contains(event.target as Node))) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getName = (opt: Option) => String(opt.name || opt.nome || opt.label || opt.value || '');
  const getId = (opt: Option) => opt.id || opt.value || Math.random();

  const filteredOptions = options.filter(opt => {
    const searchTarget = String(opt.label || getName(opt)).toLowerCase();
    return searchTarget.includes((searchTerm || '').toLowerCase());
  });

  const selectedOption = options.find(opt =>
    (opt.id?.toString() === String(value)) || (getName(opt).toLowerCase() === String(value || '').toLowerCase())
  );

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const DropdownMenu = (
    <div
      id="select-portal-root"
      className="fixed bg-white border border-gray-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[10000]"
      style={{
        top: coords.top !== undefined ? `${coords.top + 8}px` : undefined,
        bottom: coords.bottom !== undefined ? `${coords.bottom + 8}px` : undefined,
        left: `${coords.left}px`,
        width: dropdownWidth ? (typeof dropdownWidth === 'number' ? `${dropdownWidth}px` : dropdownWidth) : `${coords.width}px`,
        maxHeight: '300px'
      }}
    >
      <div className="p-3 border-b border-gray-50 bg-gray-50/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filtrar opções..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-[#1e3a8a] outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        </div>
      </div>

      <div className="overflow-y-auto p-2 custom-scrollbar" style={{ maxHeight: '220px' }}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 text-[#1e3a8a] animate-spin" />
          </div>
        ) : filteredOptions.length > 0 ? (
          <div className="space-y-1">
            {filteredOptions.map((opt) => {
              const isSelected = (opt.id?.toString() === String(value)) || (getName(opt).toLowerCase() === String(value || '').toLowerCase());
              return (
                <button
                  key={getId(opt)}
                  type="button"
                  onClick={() => {
                    onChange(opt.id?.toString() || getName(opt));
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`
                    w-full px-4 py-2.5 text-left text-sm font-medium rounded-xl transition-all
                    ${isSelected
                      ? 'bg-[#1e3a8a] text-white'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-[#1e3a8a]'
                    }
                  `}
                >
                  {formatText(getName(opt))}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nenhum resultado</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      {label && <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{label}</label>}

      <div
        onClick={() => {
          if (!disabled) {
            if (!isOpen && dropdownRef.current) {
              const rect = dropdownRef.current.getBoundingClientRect();

              let left = rect.left;
              if (align === 'right') {
                const width = dropdownWidth && typeof dropdownWidth === 'number' ? dropdownWidth : rect.width;
                left = rect.right - width;
              }

              let top: number | undefined = rect.bottom;
              let bottom: number | undefined = undefined;

              const spaceBelow = window.innerHeight - rect.bottom;
              const spaceAbove = rect.top;
              const dropdownMaxHeight = 250; // Approximated max height for the dropdown

              if (spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow) {
                top = undefined;
                bottom = window.innerHeight - rect.top;
              }

              setCoords({
                top,
                bottom,
                left,
                width: rect.width
              });
            }
            setIsOpen(!isOpen);
          }
        }}

        className={`
          w-full bg-gray-100/50 border rounded-xl p-3 text-left flex items-center justify-between cursor-pointer transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:border-[#1e3a8a]'}
          ${isOpen ? 'border-[#1e3a8a] bg-white ring-2 ring-[#1e3a8a]/10' : 'border-gray-200'}
        `}
      >
        <span className={`text-sm font-medium truncate ${value ? "text-gray-900" : "text-gray-400"}`}>
          {selectedOption ? formatText(getName(selectedOption)) : placeholder}
        </span>

        <div className="flex items-center gap-1">
          {value && !disabled && (
            <button
              onClick={handleClearSelection}
              className="p-1 text-gray-400 hover:text-red-500 rounded-full transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Renders the menu outside the DOM hierarchy of the modal */}
      {isOpen && createPortal(DropdownMenu, document.body)}
    </div >
  );
}