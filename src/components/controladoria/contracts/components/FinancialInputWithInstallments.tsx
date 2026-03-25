import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { maskMoney, maskPercent } from '../../utils/masks';

interface FinancialInputProps {
  label: string;
  value: string | undefined;
  onChangeValue: (val: string) => void;
  installments: string | undefined;
  onChangeInstallments: (val: string) => void;
  onAdd?: () => void;
  clause?: string;
  onChangeClause?: (val: string) => void;
  rule?: string;
  onChangeRule?: (val: string) => void;
  readyToInvoice?: boolean;
  onToggleReady?: () => void;
}

// Custom dropdown para parcelas - design moderno
const InstallmentDropdown = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const options = Array.from({ length: 24 }, (_, i) => `${i + 1}x`);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative h-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-full w-16 flex items-center justify-between px-2.5 bg-transparent text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors outline-none"
      >
        <span>{value || '1x'}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-20 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 max-h-[180px] overflow-y-auto scrollbar-thin">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setIsOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${opt === (value || '1x') ? 'bg-[#1e3a8a] text-white font-bold' : 'text-gray-700 hover:bg-gray-50 font-medium'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Custom dropdown para formato R$/% - design moderno
const FormatDropdown = ({ value, onChange }: { value: 'R$' | '%'; onChange: (val: 'R$' | '%') => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative h-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-full px-2.5 flex items-center gap-1 bg-transparent text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors outline-none"
        title="Formato do valor"
      >
        <span>{value}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-16 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
          {(['R$', '%'] as const).map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setIsOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${opt === value ? 'bg-[#1e3a8a] text-white font-bold' : 'text-gray-700 hover:bg-gray-50 font-medium'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const FinancialInputWithInstallments = ({
  label, value, onChangeValue, installments, onChangeInstallments, onAdd, clause, onChangeClause, rule, onChangeRule, readyToInvoice, onToggleReady
}: FinancialInputProps) => {
  // Decide whether the current value looks like a percentage
  const isPercentInitial = value?.includes('%');
  const [format, setFormat] = useState<'R$' | '%'>((isPercentInitial) ? '%' : 'R$');

  const handleFormatChange = (newFormat: 'R$' | '%') => {
    setFormat(newFormat);
    if (!value) return;

    // Quick conversion logic to swap format string visually 
    // Usually one might clear the field or just apply the new mask to the raw digits
    if (newFormat === '%') {
      onChangeValue(maskPercent(value));
    } else {
      onChangeValue(maskMoney(value));
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (format === '%') {
      onChangeValue(maskPercent(rawVal));
    } else {
      onChangeValue(maskMoney(rawVal));
    }
  };

  return (
    <div>
      <label className="text-xs font-medium block mb-1 text-gray-600">{label}</label>
      <div className="flex items-stretch rounded-lg shadow-sm">
        {onChangeClause && (
          <input
            type="text"
            className="w-14 border border-gray-300 rounded-l-lg p-2.5 text-sm bg-gray-50 focus:border-salomao-blue outline-none border-r-0 placeholder-gray-400 text-center"
            value={clause || ''}
            onChange={(e) => onChangeClause(e.target.value)}
            placeholder="Cl."
            title="Cláusula (ex: 2.1)"
          />
        )}

        {/* Currency/Percent Prefix Toggle - Custom Dropdown */}
        <div className={`${!onChangeClause ? 'rounded-l-lg' : ''} border border-gray-300 border-r-0 bg-gray-50 hover:bg-gray-100 transition-colors`}>
          <FormatDropdown value={format} onChange={handleFormatChange} />
        </div>

        <input
          type="text"
          className="flex-1 border border-gray-300 p-2.5 text-sm bg-white focus:border-salomao-blue outline-none min-w-0"
          value={value || ''}
          onChange={handleValueChange}
          placeholder={format === 'R$' ? "0,00" : "0,00%"}
        />

        {/* Pronto para Faturar - ao lado do valor */}
        {onToggleReady && (
          <label
            className={`flex items-center gap-1.5 px-3 border-y border-gray-300 cursor-pointer select-none transition-colors ${readyToInvoice ? 'bg-green-50 border-green-200' : 'bg-gray-50 hover:bg-gray-100'}`}
            title="Pronto para Faturar"
          >
            <input
              type="checkbox"
              checked={readyToInvoice || false}
              onChange={onToggleReady}
              className="w-3.5 h-3.5 rounded border-gray-300 text-green-600 focus:ring-green-500 transition-all cursor-pointer"
            />
            <span className={`text-[10px] font-bold whitespace-nowrap ${readyToInvoice ? 'text-green-700' : 'text-gray-500'}`}>
              Faturar
            </span>
          </label>
        )}

        <div className={`w-16 border-y border-r border-gray-300 bg-gray-50 ${!onAdd ? 'rounded-r-lg' : ''}`}>
          <InstallmentDropdown value={installments || '1x'} onChange={onChangeInstallments} />
        </div>
        {onAdd && (
          <button
            onClick={onAdd}
            className="bg-salomao-blue text-white px-2 rounded-r-lg hover:bg-blue-900 transition-colors flex items-center justify-center border-l border-blue-800"
            type="button"
            title="Adicionar valor"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};