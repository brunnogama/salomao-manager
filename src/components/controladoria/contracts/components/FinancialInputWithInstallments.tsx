import React, { useState } from 'react';
import { Plus, ChevronDown, CheckCircle } from 'lucide-react';
import { maskMoney, maskPercent } from '../../utils/masks';

const MinimalSelect = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: string[] }) => {
  return (
    <div className="relative h-full w-full">
      <select
        className="w-full h-full appearance-none bg-transparent pl-3 pr-8 text-xs font-medium text-gray-700 outline-none cursor-pointer focus:bg-gray-50 transition-colors"
        value={value || '1x'}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
    </div>
  );
};

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

export const FinancialInputWithInstallments = ({
  label, value, onChangeValue, installments, onChangeInstallments, onAdd, clause, onChangeClause, rule, onChangeRule, readyToInvoice, onToggleReady
}: FinancialInputProps) => {
  const installmentOptions = Array.from({ length: 24 }, (_, i) => `${i + 1}x`);
  const showRule = !!rule;

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
      <div className="flex rounded-lg shadow-sm">
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

        {/* Currency/Percent Prefix Toggle */}
        <div className={`relative ${!onChangeClause ? 'rounded-l-lg' : ''} border border-gray-300 border-r-0 bg-gray-50 hover:bg-gray-100 transition-colors`}>
          <select
            value={format}
            onChange={(e) => handleFormatChange(e.target.value as 'R$' | '%')}
            className="h-full pl-2 pr-6 appearance-none bg-transparent outline-none text-sm font-semibold text-gray-600 cursor-pointer"
            title="Formato do valor"
          >
            <option value="R$">R$</option>
            <option value="%">%</option>
          </select>
          <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
        </div>

        <input
          type="text"
          className={`flex-1 border border-gray-300 p-2.5 text-sm bg-white focus:border-salomao-blue outline-none min-w-0 ${!onAdd ? 'rounded-r-none border-r-0' : ''}`}
          value={value || ''}
          onChange={handleValueChange}
          placeholder={format === 'R$' ? "0,00" : "0,00%"}
        />

        <div className={`w-16 border-y border-r border-gray-300 bg-gray-50 ${!onAdd ? 'rounded-r-lg' : ''}`}>
          <MinimalSelect value={installments || '1x'} onChange={onChangeInstallments} options={installmentOptions} />
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
      
      {/* Caixa da Regra Separada */}
      {onChangeRule && (
        <div className="mt-2 bg-gray-50/50 p-2.5 rounded-lg border border-gray-200">
          <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center mb-1.5">
            Regra para recebimento:
          </label>
          <textarea
            className="w-full text-xs p-2 border border-gray-300 rounded bg-white focus:border-salomao-blue outline-none resize-none leading-relaxed"
            placeholder="Ex: Condição exigida para que este valor seja cobrado (Somente após sentença, etc.)..."
            rows={2}
            value={rule || ''}
            onChange={(e) => onChangeRule(e.target.value)}
          />
        </div>
      )}

      {/* Caixa Faturar como Checkbox "Tick" separada */}
      {onToggleReady && (
        <div className="mt-2 flex items-center justify-between border border-green-200 bg-green-50/50 px-3 py-2 rounded-lg">
          <label htmlFor={`faturar-${label.replace(/\s+/g, '-')}`} className="flex items-center gap-2 cursor-pointer w-full group">
            <input
              type="checkbox"
              id={`faturar-${label.replace(/\s+/g, '-')}`}
              checked={readyToInvoice || false}
              onChange={onToggleReady}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 transition-all cursor-pointer"
            />
            <span className="text-xs font-bold text-green-800 group-hover:text-green-900 transition-colors">
              Pronto para Faturar (Notificar no envio do e-mail)
            </span>
          </label>
        </div>
      )}
    </div>
  );
};