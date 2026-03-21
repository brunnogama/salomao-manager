import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronRight, Check } from 'lucide-react';

export interface FilterCategory {
  key: string;
  label: string;
  icon: React.ElementType;
  type: 'single' | 'multi';
  options: { value: string; label: string }[];
  value: string | string[];
  onChange: (val: any) => void;
}

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  categories: FilterCategory[];
  activeFilterChips: { key: string; label: string; onClear: () => void }[];
  activeFilterCount: number;
  onClearAll: () => void;
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  categories,
  activeFilterChips,
  activeFilterCount,
  onClearAll,
}: FilterBarProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [optionSearch, setOptionSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
        setSelectedCategory(null);
        setOptionSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputFocus = () => {
    setIsPopoverOpen(true);
    setSelectedCategory(null);
    setOptionSearch('');
  };

  const handleSelectCategory = (categoryKey: string) => {
    setSelectedCategory(categoryKey);
    setOptionSearch('');
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setOptionSearch('');
  };

  const activeCat = categories.find((c) => c.key === selectedCategory);

  const filteredOptions = activeCat
    ? activeCat.options.filter((opt) =>
        opt.label.toLowerCase().includes(optionSearch.toLowerCase())
      )
    : [];

  const handleSelectSingleOption = (cat: FilterCategory, optVal: string) => {
    // Se já está selecionado, desseleciona
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

  // Conta quantas opções estão selecionadas para cada categoria (para mostrar badge)
  const getCategoryBadge = (cat: FilterCategory) => {
    if (cat.type === 'single') return cat.value ? 1 : 0;
    return (cat.value as string[]).length;
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex-none" ref={containerRef}>
      {/* Input wrapper com tags */}
      <div
        className={`flex items-center flex-wrap gap-2 bg-gray-50 border rounded-xl px-4 py-2.5 min-h-[42px] cursor-text transition-all ${
          isPopoverOpen
            ? 'ring-2 ring-[#1e3a8a]/20 border-[#1e3a8a]'
            : 'border-gray-200 focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 focus-within:border-[#1e3a8a]'
        }`}
        onClick={() => inputRef.current?.focus()}
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
          ref={inputRef}
          type="text"
          placeholder={activeFilterChips.length > 0 ? 'Buscar...' : 'Buscar ou filtrar por categoria...'}
          className="bg-transparent border-none text-sm outline-none text-gray-700 font-medium placeholder:text-gray-400 flex-1 min-w-[120px]"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={handleInputFocus}
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

      {/* Popover / Dropdown */}
      {isPopoverOpen && (
        <div className="relative mt-2">
          <div className="absolute top-0 left-0 w-full max-w-md bg-white border border-gray-100 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
            {!selectedCategory ? (
              /* Lista de categorias */
              <div className="py-1">
                <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">
                  Filtrar por
                </div>
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const badge = getCategoryBadge(cat);
                  return (
                    <div
                      key={cat.key}
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors group"
                      onClick={() => handleSelectCategory(cat.key)}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${badge > 0 ? 'text-[#1e3a8a]' : 'text-gray-400 group-hover:text-[#1e3a8a]'} transition-colors`} />
                        <span className={`text-xs font-bold uppercase tracking-wider ${badge > 0 ? 'text-[#1e3a8a]' : 'text-gray-600'}`}>
                          {cat.label}
                        </span>
                        {badge > 0 && (
                          <span className="min-w-[18px] text-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-[#1e3a8a] text-white">
                            {badge}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#1e3a8a] transition-colors" />
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Opções da categoria selecionada */
              <div>
                {/* Header com botão voltar */}
                <div
                  className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 cursor-pointer hover:bg-gray-100/50 transition-colors"
                  onClick={handleBackToCategories}
                >
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 rotate-180" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    {activeCat?.label}
                  </span>
                </div>

                {/* Busca interna */}
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Buscar..."
                    value={optionSearch}
                    onChange={(e) => setOptionSearch(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all"
                  />
                </div>

                {/* Lista de opções */}
                <div className="max-h-60 overflow-y-auto py-1">
                  {filteredOptions.length === 0 ? (
                    <div className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-center text-gray-400">
                      Nenhum resultado
                    </div>
                  ) : activeCat?.type === 'single' ? (
                    filteredOptions.map((opt) => {
                      const isSelected = activeCat.value === opt.value;
                      return (
                        <div
                          key={opt.value}
                          className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-blue-50 transition-colors truncate ${
                            isSelected ? 'bg-blue-50 text-[#1e3a8a]' : 'text-gray-600'
                          }`}
                          onClick={() => handleSelectSingleOption(activeCat, opt.value)}
                        >
                          {opt.label}
                        </div>
                      );
                    })
                  ) : (
                    filteredOptions.map((opt) => {
                      const isSelected = (activeCat!.value as string[]).includes(opt.value);
                      return (
                        <div
                          key={opt.value}
                          className={`flex items-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-blue-50 transition-colors ${
                            isSelected ? 'bg-blue-50/50 text-[#1e3a8a]' : 'text-gray-600'
                          }`}
                          onClick={() => handleToggleMultiOption(activeCat!, opt.value)}
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
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
