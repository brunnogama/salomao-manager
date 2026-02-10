import React from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { maskMoney } from '../../utils/masks';

const MinimalSelect = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: string[] }) => {
    return (
        <div className="relative h-full w-full">
            <select
                className="w-full h-full appearance-none bg-transparent pl-3 pr-8 text-[10px] font-black text-[#0a192f] outline-none cursor-pointer focus:bg-gray-100 transition-colors uppercase tracking-widest"
                value={value || '1x'}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500 pointer-events-none" />
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
}

export const FinancialInputWithInstallments = ({ 
  label, value, onChangeValue, installments, onChangeInstallments, onAdd, clause, onChangeClause
}: FinancialInputProps) => {
  const installmentOptions = Array.from({ length: 24 }, (_, i) => `${i + 1}x`);
  return (
    <div className="w-full">
      <label className="text-[10px] font-black block mb-2 text-gray-400 uppercase tracking-[0.15em] ml-1">{label}</label>
      <div className="flex rounded-xl shadow-sm h-[44px] overflow-hidden border border-gray-200 focus-within:border-[#0a192f] transition-all">
        {onChangeClause && (
             <input 
                type="text" 
                className="w-16 border-r border-gray-100 p-2.5 text-[10px] font-black text-[#0a192f] bg-gray-50 focus:bg-white outline-none placeholder:text-gray-300 text-center uppercase tracking-tighter"
                value={clause || ''} 
                onChange={(e) => onChangeClause(e.target.value)}
                placeholder="CL."
                title="Cláusula contratual"
             />
        )}
        <input 
          type="text" 
          className="flex-1 p-3 text-sm font-bold text-[#0a192f] bg-white outline-none min-w-0 placeholder:text-gray-300"
          value={value || ''} 
          onChange={(e) => onChangeValue(maskMoney(e.target.value))}
          placeholder="R$ 0,00"
        />
        <div className="w-20 bg-gray-50 border-l border-gray-100 transition-colors hover:bg-gray-100">
           <MinimalSelect value={installments || '1x'} onChange={onChangeInstallments} options={installmentOptions} />
        </div>
        {onAdd && (
          <button 
            onClick={onAdd}
            className="bg-[#0a192f] text-white px-4 hover:bg-slate-800 transition-all flex items-center justify-center border-l border-white/10 active:scale-95"
            type="button"
            title="Adicionar valor ao contrato"
          >
            <Plus className="w-4 h-4 text-amber-500" />
          </button>
        )}
      </div>
    </div>
  );
};