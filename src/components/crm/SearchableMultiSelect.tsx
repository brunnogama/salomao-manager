import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, X, Loader2, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Option {
  id?: string | number;
  nome?: string;
  name?: string;
  value?: string;
  label?: string;
}

interface SearchableMultiSelectProps {
  label?: string;
  value: string; // Valores selecionados, separados por vírgula e espaço (ex: "Cível, Trabalhista")
  onChange: (value: string) => void;
  placeholder?: string;
  table?: string;
  nameField?: string;
  options?: Option[];
  disabled?: boolean;
  className?: string;
  onRefresh?: () => void;
  uppercase?: boolean;
  disableFormatting?: boolean;
  dropdownWidth?: string | number;
  align?: 'left' | 'right';
  icon?: React.ReactNode;
  allowCustom?: boolean;
  clientFilter?: (item: any) => boolean;
}

export function SearchableMultiSelect({
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
  align = 'left',
  icon,
  allowCustom = false,
  clientFilter
}: SearchableMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ top: 0 as number | undefined, bottom: undefined as number | undefined, left: 0, width: 0 });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const isFetchedRef = useRef(false);

  // Detect if inside a disabled fieldset
  const isFieldsetDisabled = dropdownRef.current?.closest('fieldset[disabled]') !== null && dropdownRef.current?.closest('fieldset[disabled]') !== undefined;
  const isDisabled = disabled || isFieldsetDisabled;

  const formatText = (str: any) => {
    if (!str) return '';
    const safeStr = String(str);
    if (uppercase) return safeStr.toUpperCase();
    if (disableFormatting) return safeStr;

    const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi'];
    const acronyms = ['clt', 'pj', 'cpf', 'cnpj', 'rg', 'cnh', 'oab', 'rh', 'ti', 'ceo', 'cfo', 'pis', 'pasep', 'ctps'];

    return safeStr.toLowerCase().split(' ').map(word => {
      if (romanNumerals.includes(word) || acronyms.includes(word)) return word.toUpperCase();
      return (word.length > 2) ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    }).join(' ');
  };

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

  useEffect(() => {
    isFetchedRef.current = false;
  }, [table]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const menuPortal = document.getElementById('select-portal-root-multi');
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        (!menuPortal || !menuPortal.contains(event.target as Node))) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getName = (opt: Option) => formatText(String(opt.name || opt.nome || opt.label || opt.value || ''));
  const getId = (opt: Option) => opt.id || opt.value || Math.random();

  const filteredOptions = options.filter(opt => {
    // 1. Appy clientFilter from props if provided
    if (clientFilter && !clientFilter(opt)) {
      return false;
    }
    // 2. Apply search term text filter
    const searchTarget = getName(opt).toLowerCase();
    return searchTarget.includes((searchTerm || '').toLowerCase());
  });

  // Tratar os valores selecionados como um array
  const selectedValuesArray = value ? value.split(',').map(v => v.trim()).filter(v => v) : [];

  const toggleSelection = (optionName: string) => {
    const nameFormatted = formatText(optionName);
    const set = new Set(selectedValuesArray.map(v => v.toLowerCase()));

    if (set.has(nameFormatted.toLowerCase())) {
      // Remover
      const newArray = selectedValuesArray.filter(v => v.toLowerCase() !== nameFormatted.toLowerCase());
      onChange(newArray.join(', '));
    } else {
      // Adicionar
      const newArray = [...selectedValuesArray, nameFormatted];
      onChange(newArray.join(', '));
    }
    setSearchTerm(''); // Limpar busca após selecionar
  };

  const isSelected = (optionName: string) => {
    const nameFormatted = formatText(optionName);
    return selectedValuesArray.some(v => v.toLowerCase() === nameFormatted.toLowerCase());
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const removeValue = (e: React.MouseEvent, valToRemove: string) => {
    e.stopPropagation();
    const newArray = selectedValuesArray.filter(v => v.toLowerCase() !== valToRemove.toLowerCase());
    onChange(newArray.join(', '));
  };

  const DropdownMenu = (
    <div
      id="select-portal-root-multi"
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
            onKeyDown={(e) => {
              if (allowCustom && e.key === 'Enter' && searchTerm.trim() !== '') {
                toggleSelection(searchTerm.trim());
              }
            }}
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
              const selected = isSelected(getName(opt));
              return (
                <button
                  key={getId(opt)}
                  type="button"
                  onClick={() => toggleSelection(getName(opt))}
                  className={`
                    w-full px-4 py-2.5 flex items-center justify-between text-left text-sm font-medium rounded-xl transition-all
                    ${selected
                      ? 'bg-blue-50 text-[#1e3a8a]'
                      : 'text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  {getName(opt)}
                  {selected && <Check className="h-4 w-4 text-[#1e3a8a]" />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            {allowCustom && searchTerm.trim() ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelection(searchTerm.trim());
                  setSearchTerm('');
                }}
                className="w-full px-4 py-2.5 text-left text-sm font-medium rounded-xl transition-all text-[#1e3a8a] bg-blue-50 hover:bg-blue-100"
              >
                Adicionar "{searchTerm}"
              </button>
            ) : (
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nenhum resultado</p>
            )}
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
          if (!isDisabled) {
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
              const dropdownMaxHeight = 250;

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
          w-full bg-gray-100/50 border rounded-xl p-2 min-h-[46px] text-left flex items-center justify-between cursor-pointer transition-all
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:border-[#1e3a8a]'}
          ${isOpen ? 'border-[#1e3a8a] bg-white ring-2 ring-[#1e3a8a]/10' : 'border-gray-200'}
        `}
      >
        <div className="flex items-center gap-2 flex-1 flex-wrap min-w-0 pr-2">
          {icon && <div className="flex-shrink-0 ml-1">{icon}</div>}

          {selectedValuesArray.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedValuesArray.slice(0, 2).map((val, index) => (
                <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-md shadow-sm max-w-[140px]">
                  <span className="truncate">{val}</span>
                  {!isDisabled && (
                    <button
                      onClick={(e) => removeValue(e, val)}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0 rounded focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
              {selectedValuesArray.length > 2 && (
                <span 
                  className="inline-flex items-center px-2 py-1 bg-blue-50/80 border border-blue-200 text-[10px] uppercase font-black tracking-widest text-[#1e3a8a] rounded-md shadow-sm cursor-help"
                  title={selectedValuesArray.slice(2).join(', ')}
                >
                  +{selectedValuesArray.length - 2}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm font-medium text-gray-400 ml-1 truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedValuesArray.length > 0 && !isDisabled && (
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

      {isOpen && createPortal(DropdownMenu, document.body)}
    </div>
  );
}
