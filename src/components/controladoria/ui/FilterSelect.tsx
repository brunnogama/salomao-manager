import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterSelectProps {
    icon?: React.ElementType;
    value: string;
    onChange: (val: string) => void;
    options: { label: string; value: string }[];
    placeholder: string;
}

export function FilterSelect({ icon: Icon, value, onChange, options, placeholder }: FilterSelectProps) {
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

    const displayValue = options.find((opt) => opt.value === value)?.label || placeholder;

    return (
        <div className="relative min-w-[200px]" ref={wrapperRef}>
            <div
                className="flex items-center bg-white px-3 py-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors select-none shadow-sm h-[42px]"
                onClick={() => setIsOpen(!isOpen)}
            >
                {Icon && <Icon className="w-4 h-4 text-gray-400 mr-2 shrink-0" />}
                <span className="text-xs font-bold text-gray-600 flex-1 truncate uppercase tracking-wider">{displayValue}</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 ml-2 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto flex flex-col animate-in fade-in zoom-in-95">
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            className={`px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-blue-50 cursor-pointer ${value === opt.value ? 'bg-blue-50 text-[#1e3a8a]' : ''}`}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
