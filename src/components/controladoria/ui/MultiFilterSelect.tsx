import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

interface MultiFilterSelectProps {
    icon?: React.ElementType;
    value: string[];
    onChange: (val: string[]) => void;
    options: { label: string; value: string }[];
    placeholder: string;
}

export function MultiFilterSelect({ icon: Icon, value, onChange, options, placeholder }: MultiFilterSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    let displayValue = placeholder;
    if (value.length === 1) {
        displayValue = options.find((opt) => opt.value === value[0])?.label || value[0];
    } else if (value.length > 1) {
        displayValue = `${value.length} selecionados`;
    }

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleOption = (optValue: string) => {
        if (value.includes(optValue)) {
            onChange(value.filter(v => v !== optValue));
        } else {
            onChange([...value, optValue]);
        }
    };

    const clearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    return (
        <div className="relative min-w-[200px]" ref={wrapperRef}>
            <div
                className="flex items-center bg-white px-3 py-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors select-none shadow-sm h-[42px]"
                onClick={() => setIsOpen(!isOpen)}
            >
                {Icon && <Icon className="w-4 h-4 text-gray-400 mr-2 shrink-0" />}
                <span className="text-xs font-bold text-gray-600 flex-1 truncate uppercase tracking-wider">{displayValue}</span>
                {value.length > 0 && (
                    <div
                        role="button"
                        onClick={clearAll}
                        className="mr-2 p-0.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                    </div>
                )}
                <ChevronDown className={`w-3 h-3 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 min-w-full w-max max-w-[400px] bg-white border border-gray-100 rounded-xl shadow-xl z-50 flex flex-col animate-in fade-in zoom-in-95 overflow-hidden">
                    <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                        <input
                            type="text"
                            autoFocus
                            placeholder="Buscar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all"
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-center text-gray-400">
                                Nenhum resultado
                            </div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = value.includes(opt.value);
                                return (
                                    <div
                                        key={opt.value}
                                        className={`flex items-center justify-between px-4 py-2.5 text-[10px] font-black uppercase tracking-widest cursor-pointer truncate ${isSelected ? 'bg-blue-50 text-[#1e3a8a]' : 'text-gray-600 hover:bg-blue-50'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleOption(opt.value);
                                        }}
                                    >
                                        <span>{opt.label}</span>
                                        {isSelected && <Check className="w-3 h-3 text-[#1e3a8a] shrink-0 ml-2" />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
