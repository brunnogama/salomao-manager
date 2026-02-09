import React from 'react';
import { formatMoney } from './dashboardHelpers';

interface FinItemProps {
  label: string;
  value: number;
  colorClass?: string;
}

export const FinItem = ({ label, value, colorClass = 'text-[#0a192f]' }: FinItemProps) => {
  // Mantém a lógica de não renderizar se o valor for zero ou nulo
  if (!value || value === 0) return null;
  
  return (
    <div className='flex justify-between items-baseline gap-4 border-b border-gray-50 pb-2 last:border-0 last:pb-0'>
      <span className='text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]'>
        {label}
      </span>
      <span className={`text-[11px] font-black ${colorClass} tracking-tighter uppercase`}>
        {formatMoney(value)}
      </span>
    </div>
  );
};