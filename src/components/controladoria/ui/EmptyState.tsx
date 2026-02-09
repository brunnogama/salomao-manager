import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center h-full min-h-[450px] animate-in fade-in zoom-in-95 duration-500 ${className}`}>
      {/* Ícone com gradiente Navy sutil */}
      <div className="bg-gradient-to-b from-gray-50 to-white p-8 rounded-[2.5rem] mb-6 border border-gray-100 shadow-sm relative group">
        <div className="absolute inset-0 bg-[#0a192f]/5 rounded-[2.5rem] scale-0 group-hover:scale-100 transition-transform duration-500" />
        <Icon className="w-12 h-12 text-[#0a192f]/30 relative z-10" strokeWidth={1.2} />
      </div>

      {/* Título em Navy com tipografia pesada */}
      <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-[0.2em] mb-3">
        {title}
      </h3>

      {/* Descrição com melhor legibilidade */}
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest max-w-xs mb-8 leading-loose">
        {description}
      </p>
      
      {/* Botão de ação padronizado */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-[#0a192f] text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-[0.15em] py-3 px-8 rounded-xl transition-all shadow-lg shadow-[#0a192f]/20 flex items-center gap-2 active:scale-95 border border-white/10"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}