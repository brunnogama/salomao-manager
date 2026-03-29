import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';

export interface FilterCategory {
  key: string;
  label: string;
  icon: React.ElementType;
  type: 'single' | 'multi' | 'date_range';
  options?: { value: string; label: string }[];
  value: any;
  onChange: (val: any) => void;
}

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  categories: FilterCategory[];
  activeFilterChips: { key: string; label: string; onClear: () => void }[];
  activeFilterCount: number;
  onClearAll: () => void;
  extraContent?: React.ReactNode;
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  categories,
  activeFilterChips,
  activeFilterCount,
  onClearAll,
}: FilterBarProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [optionSearch, setOptionSearch] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setSelectedCategory(null);
        setOptionSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  const handleSelectSingleOption = (cat: FilterCategory, optVal: string) => {
    if (cat.value === optVal) {
      cat.onChange('');
    } else {
      cat.onChange(optVal);
    }
    setSelectedCategory(null);
    setOptionSearch('');
  };

  const handleToggleMultiOption = (cat: FilterCategory, optVal: string) => {
    const arr = cat.value as string[];
    if (arr.includes(optVal)) {
      cat.onChange(arr.filter((v) => v !== optVal));
    } else {
      cat.onChange([...arr, optVal]);
    }
  };

  const getCategoryBadge = (cat: FilterCategory) => {
    if (cat.type === 'date_range') {
      const v = cat.value as { start?: string, end?: string };
      return (v && (v.start || v.end)) ? 1 : 0;
    }
    if (cat.type === 'single') return cat.value ? 1 : 0;
    return (cat.value as string[]).length;
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex-none">
      {/* Linha principal: Input com tags + Botão Filtros */}
      <div className="flex items-center gap-3">
        {/* Input wrapper com tags */}
        <div
          className="flex items-center flex-wrap gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 min-h-[42px] cursor-text transition-all flex-1 focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 focus-within:border-[#1e3a8a]"
          onClick={(e) => {
            const input = e.currentTarget.querySelector('input');
            if (input) input.focus();
          }}
        >
          <Search className="h-4 w-4 text-gray-400 shrink-0" />

          {/* Tags ativas */}
          {activeFilterChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1e3a8a] text-white rounded-lg text-[10px] font-black uppercase tracking-wider animate-in fade-in zoom-in-95 duration-200"
            >
              {chip.label}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  chip.onClear();
                }}
                className="p-0.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}

          {/* Input de busca */}
          <input
            type="text"
            placeholder={activeFilterChips.length > 0 ? 'Buscar...' : 'Buscar por nome, cargo, local...'}
            className="bg-transparent border-none text-sm outline-none text-gray-700 font-medium placeholder:text-gray-400 flex-1 min-w-[120px]"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />

          {/* Botão limpar tudo */}
          {(searchTerm || activeFilterCount > 0) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSearchChange('');
                onClearAll();
              }}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
              title="Limpar tudo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Categorias como botões separados */}
        <div className="flex items-center gap-2 flex-wrap" ref={popoverRef}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const badge = getCategoryBadge(cat);
            const isOpen = selectedCategory === cat.key;

            return (
              <div key={cat.key} className="relative flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isOpen) {
                      setSelectedCategory(null);
                      setOptionSearch('');
                    } else {
                      setSelectedCategory(cat.key);
                      setOptionSearch('');
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all h-[42px] ${
                    isOpen || badge > 0
                      ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md shadow-blue-500/20'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {cat.label}
                  {badge > 0 && (
                    <span className="min-w-[20px] text-center px-1.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white">
                      {badge}
                    </span>
                  )}
                </button>

                {/* Popover / Dropdown para esta categoria específica */}
                {isOpen && (
                  <div className={`absolute top-full right-0 mt-2 ${cat.type === 'date_range' ? 'w-[320px]' : 'w-72'} bg-white border border-gray-100 rounded-2xl shadow-xl shadow-[#1e3a8a]/5 z-[9999] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden`}>
                    {cat.type === 'date_range' ? (
                      <div className="p-5" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Botões Rápidos (Pill Style) */}
                        <div className="flex bg-gray-100/80 p-1 rounded-xl mb-5 border border-gray-50 shadow-inner">
                          <button
                            onClick={() => {
                              const today = new Date();
                              const day = today.getDay(); // 0 is Sunday
                              const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
                              const start = new Date(today.setDate(diff));
                              const end = new Date(start);
                              end.setDate(end.getDate() + 6);
                              cat.onChange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] });
                              setSelectedCategory(null);
                            }}
                            className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-[#1e3a8a] bg-transparent hover:bg-white rounded-lg transition-all shadow-none hover:shadow-[0_2px_8px_-2px_rgba(30,58,138,0.1)] focus:outline-none"
                          >
                            Semana Atual
                          </button>
                          <button
                            onClick={() => {
                              const date = new Date();
                              const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                              const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                              cat.onChange({ start: firstDay.toISOString().split('T')[0], end: lastDay.toISOString().split('T')[0] });
                              setSelectedCategory(null);
                            }}
                            className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-[#1e3a8a] bg-transparent hover:bg-white rounded-lg transition-all shadow-none hover:shadow-[0_2px_8px_-2px_rgba(30,58,138,0.1)] focus:outline-none"
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
                              value={cat.value?.start || ''}
                              onChange={(e) => {
                                cat.onChange({ ...cat.value, start: e.target.value });
                              }}
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
                              value={cat.value?.end || ''}
                              onChange={(e) => {
                                cat.onChange({ ...cat.value, end: e.target.value });
                              }}
                              className="w-full text-xs font-bold text-gray-700 bg-white border border-gray-200 shadow-sm rounded-xl py-2.5 px-3 outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all cursor-pointer hover:border-blue-300"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Busca interna */}
                        <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                        <input
                          type="text"
                          autoFocus
                          placeholder={`Buscar ${cat.label.toLowerCase()}...`}
                          value={optionSearch}
                          onChange={(e) => setOptionSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all"
                        />
                      </div>
  
                      {/* Lista de opções */}
                      <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar w-full bg-white">
                        {(() => {
                          const filteredOptions = (cat.options || []).filter((opt) =>
                            opt.label.toLowerCase().includes(optionSearch.toLowerCase())
                          );
  
                          if (filteredOptions.length === 0) {
                            return (
                              <div className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-center text-gray-400">
                                Nenhum resultado
                              </div>
                            );
                          }
  
                          if (cat.type === 'single') {
                            return filteredOptions.map((opt) => {
                              const isSelected = cat.value === opt.value;
                              return (
                                <div
                                  key={opt.value}
                                  className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-blue-50 transition-colors truncate ${
                                    isSelected ? 'bg-blue-50 text-[#1e3a8a]' : 'text-gray-600'
                                  }`}
                                  onClick={() => handleSelectSingleOption(cat, opt.value)}
                                >
                                  {opt.label}
                                </div>
                              );
                            });
                          } else {
                            return filteredOptions.map((opt) => {
                              const isSelected = Array.isArray(cat.value) && cat.value.includes(opt.value);
                              return (
                                <div
                                  key={opt.value}
                                  className={`flex items-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-blue-50 transition-colors ${
                                    isSelected ? 'bg-blue-50/50 text-[#1e3a8a]' : 'text-gray-600'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleMultiOption(cat, opt.value);
                                  }}
                                >
                                  <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center mr-3 flex-shrink-0 transition-colors ${
                                      isSelected ? 'bg-[#1e3a8a] border-[#1e3a8a]' : 'border-gray-300'
                                    }`}
                                  >
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                  <span className="truncate">{opt.label}</span>
                                </div>
                              );
                            });
                          }
                        })()}
                      </div>
                    </>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
