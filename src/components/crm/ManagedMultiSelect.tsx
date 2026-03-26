import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, X, Loader2, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Option {
  id?: string | number;
  name?: string;
  [key: string]: any;
}

interface ManagedMultiSelectProps {
  label?: string;
  value: string[]; // Array of UUIDs
  onChange: (value: string[]) => void;
  tableName?: string;
  options?: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  nameColumn?: string;
  dropdownWidth?: string | number;
  align?: 'left' | 'right';
  icon?: React.ReactNode;
  filter?: { column: string; value: any };
}

export function ManagedMultiSelect({
  label,
  value,
  onChange,
  tableName,
  options: externalOptions,
  placeholder = "Selecione...",
  disabled = false,
  className = "",
  nameColumn = 'name',
  dropdownWidth,
  align = 'left',
  icon,
  filter
}: ManagedMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ top: 0 as number | undefined, bottom: undefined as number | undefined, left: 0, width: 0 });
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Safely default incoming value to array
  const selectedValuesArray = Array.isArray(value) ? value : [];

  const isFieldsetDisabled = dropdownRef.current?.closest('fieldset[disabled]') !== null && dropdownRef.current?.closest('fieldset[disabled]') !== undefined;
  const isDisabled = disabled || isFieldsetDisabled;

  useEffect(() => {
    if (externalOptions) {
      setOptions(externalOptions);
    } else if (tableName && (isOpen || selectedValuesArray.length > 0)) {
      fetchOptions();
    }
  }, [tableName, isOpen, filter?.value, externalOptions]);

  const fetchOptions = async () => {
    if (!tableName) return;
    setLoading(true);
    try {
      let query = supabase
        .from(tableName)
        .select(`id, ${nameColumn}`)
        .order(nameColumn);

      if (filter) {
        query = query.eq(filter.column, filter.value);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        setOptions(data as Option[]);
      }
    } catch (error) {
      console.error('Erro ao buscar opções:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const menuPortal = document.getElementById(`select-portal-${tableName}-multi`);
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        (!menuPortal || !menuPortal.contains(event.target as Node))) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [tableName]);

  const filteredOptions = options.filter(opt => {
    const name = String(opt[nameColumn] || '').toLowerCase();
    return name.includes((searchTerm || '').toLowerCase());
  });

  const toggleSelection = (optionId: string) => {
    if (selectedValuesArray.includes(optionId)) {
      onChange(selectedValuesArray.filter(v => v !== optionId));
    } else {
      onChange([...selectedValuesArray, optionId]);
    }
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
    setIsOpen(false);
  };

  const removeValue = (e: React.MouseEvent, valToRemove: string) => {
    e.stopPropagation();
    onChange(selectedValuesArray.filter(v => v !== valToRemove));
  };

  // Render Display Names for the selected tags
  const getSelectedNames = () => {
    return selectedValuesArray.map(id => {
      const opt = options.find(o => String(o.id) === String(id));
      return opt ? String(opt[nameColumn]) : 'Carregando...';
    });
  };

  const namesToDisplay = getSelectedNames();

  const DropdownMenu = (
    <div
      id={`select-portal-${tableName}-multi`}
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
              const strId = String(opt.id);
              const isSelected = selectedValuesArray.includes(strId);
              return (
                <button
                  key={strId}
                  type="button"
                  onClick={() => toggleSelection(strId)}
                  className={`
                    w-full px-4 py-2.5 flex items-center justify-between text-left text-sm font-medium rounded-xl transition-all
                    ${isSelected
                      ? 'bg-blue-50 text-[#1e3a8a]'
                      : 'text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  {String(opt[nameColumn])}
                  {isSelected && <Check className="h-4 w-4 text-[#1e3a8a]" />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
            Nenhum resultado
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
              {(isTagsExpanded ? namesToDisplay : namesToDisplay.slice(0, 2)).map((name, index) => (
                <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-md shadow-sm max-w-[140px]">
                  <span className="truncate">{name}</span>
                  {!isDisabled && (
                    <button
                      onClick={(e) => removeValue(e, selectedValuesArray[index])}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0 rounded focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
              {selectedValuesArray.length > 2 && (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTagsExpanded(!isTagsExpanded);
                  }}
                  className="inline-flex items-center px-2 py-1 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 text-[10px] uppercase font-black tracking-widest text-[#1e3a8a] rounded-md shadow-sm transition-colors cursor-pointer"
                >
                  {!isTagsExpanded && <span className="mr-0.5">+{selectedValuesArray.length - 2}</span>}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isTagsExpanded ? 'rotate-180' : ''}`} />
                </button>
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
