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

// Custom dropdown para formato R$/%/US$/€ - design moderno
const FormatDropdown = ({ value, onChange }: { value: 'R$' | '%' | 'US$' | '€'; onChange: (val: 'R$' | '%' | 'US$' | '€') => void }) => {
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
          {(['R$', '%', 'US$', '€'] as const).map(opt => (
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
  label, value, onChangeValue, installments, onChangeInstallments, onAdd, clause, onChangeClause, readyToInvoice, onToggleReady
}: FinancialInputProps) => {
  
  const valueParts = (value || '').split(' | ');
  const mainVal = valueParts[0];
  const convertedVal = valueParts[1];

  const isPercentInitial = mainVal?.includes('%');
  const isUSDInitial = mainVal?.includes('US$');
  const isEURInitial = mainVal?.includes('€');
  
  const initialFormat = isPercentInitial ? '%' : isUSDInitial ? 'US$' : isEURInitial ? '€' : 'R$';
  const [format, setFormat] = useState<'R$' | '%' | 'US$' | '€'>(initialFormat);
  const [rates, setRates] = useState({ USD: 0, EUR: 0 });

  useEffect(() => {
    fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL')
      .then(res => res.json())
      .then(data => {
        setRates({
          USD: parseFloat(data.USDBRL.ask),
          EUR: parseFloat(data.EURBRL.ask)
        });
      })
      .catch(console.error);
  }, []);

  const formatValueAndConverted = (rawVal: string, targetFormat: 'R$' | '%' | 'US$' | '€', curRates = rates) => {
    if (targetFormat === '%') {
      return maskPercent(rawVal);
    } 
    
    if (targetFormat === 'US$') {
      const mainFormatted = maskMoney(rawVal, 'US$');
      const numericVal = parseFloat(mainFormatted.replace(/\D/g, '')) / 100;
      if (!isNaN(numericVal) && curRates.USD > 0) {
        const converted = numericVal * curRates.USD;
        const convertedStr = converted.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        return `${mainFormatted} | ${convertedStr}`;
      }
      return mainFormatted;
    }
    
    if (targetFormat === '€') {
      const mainFormatted = maskMoney(rawVal, '€');
      const numericVal = parseFloat(mainFormatted.replace(/\D/g, '')) / 100;
      if (!isNaN(numericVal) && curRates.EUR > 0) {
        const converted = numericVal * curRates.EUR;
        const convertedStr = converted.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        return `${mainFormatted} | ${convertedStr}`;
      }
      return mainFormatted;
    }
    
    return maskMoney(rawVal);
  };

  // Re-calculate the converted value when rates load, if currently on a foreign format
  useEffect(() => {
    if ((format === 'US$' || format === '€') && mainVal) {
        const expectedVal = formatValueAndConverted(mainVal, format, rates);
        if (expectedVal !== value) {
            onChangeValue(expectedVal);
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rates, format]); // do not add mainVal or value here to avoid loops

  const handleFormatChange = (newFormat: 'R$' | '%' | 'US$' | '€') => {
    setFormat(newFormat);
    if (!value) return;
    const newVal = formatValueAndConverted(mainVal, newFormat);
    onChangeValue(newVal);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const newVal = formatValueAndConverted(rawVal, format);
    onChangeValue(newVal);
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
          value={mainVal || ''}
          onChange={handleValueChange}
          placeholder={format === 'R$' ? "0,00" : format === '%' ? "0,00%" : format === 'US$' ? "US$ 0,00" : "€ 0,00"}
        />

        {/* Converted Value Readonly display */}
        {(format === 'US$' || format === '€') && convertedVal && (
          <div className="flex items-center bg-gray-50 border-y border-gray-300 px-3 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]" title={`Convertido: ${convertedVal}`}>
            <span className="text-xs font-bold text-gray-600 truncate">{convertedVal}</span>
          </div>
        )}

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