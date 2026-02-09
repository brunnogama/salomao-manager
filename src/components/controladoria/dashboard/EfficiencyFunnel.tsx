import React from 'react';
import { ArrowRight, XCircle, Clock, TrendingDown } from 'lucide-react';

interface EfficiencyFunnelProps {
  funil: any;
}

export function EfficiencyFunnel({ funil }: EfficiencyFunnelProps) {
  return (
    <div className='bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all p-8'>
      
      {/* Header Manager Style */}
      <div className='mb-8 pb-6 border-b border-gray-50'>
        <div className='flex items-center gap-4 mb-2'>
          <div className='p-3 rounded-2xl bg-[#0a192f] text-amber-500 shadow-xl shadow-[#0a192f]/20'>
            <TrendingDown className='w-6 h-6' />
          </div>
          <h2 className='text-sm font-black text-[#0a192f] uppercase tracking-[0.3em]'>
            Funil de Conversão e Eficiência
          </h2>
        </div>
        <p className='text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-[60px]'>
          Performance de prospecção, qualificação e lead time médio por etapa
        </p>
      </div>

      {/* Funil de Vendas Corporativo */}
      <div className='grid grid-cols-1 md:grid-cols-5 gap-6 items-center'>
        
        {/* Etapa 1 - Prospects */}
        <div className='md:col-span-1 relative group'>
          <div className='bg-[#0a192f] p-6 rounded-[1.5rem] border border-white/10 shadow-xl text-center transition-all group-hover:scale-105'>
            <p className='text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] mb-2 opacity-80'>
              01. Prospects
            </p>
            <p className='text-4xl font-black text-white tracking-tighter'>
              {funil.totalEntrada}
            </p>
          </div>
          <div className='hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 z-10'>
            <ArrowRight className='w-6 h-6 text-amber-500/30' />
          </div>
        </div>

        {/* Conversão 1 -> 2 */}
        <div className='md:col-span-1 flex flex-col items-center justify-center space-y-4'>
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-blue-50 text-blue-700 border-blue-100 shadow-sm'>
            {funil.taxaConversaoProposta}% Qualificam
          </div>
          
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-red-50 text-red-700 border-red-100'>
            <XCircle className='w-3.5 h-3.5' />
            {funil.perdaAnalise} Declinados
          </div>
          
          <div className='flex flex-col items-center gap-1 p-3 rounded-2xl bg-gray-50 border border-gray-100 w-full max-w-[140px]'>
            <span className='text-[8px] font-black text-gray-400 uppercase tracking-widest'>
              Lead Time Médio
            </span>
            <div className='flex items-center gap-2'>
              <Clock className='w-3 h-3 text-amber-500' />
              <span className='text-[11px] font-black text-[#0a192f] uppercase'>
                {funil.tempoMedioProspectProposta} Dias
              </span>
            </div>
          </div>
        </div>

        {/* Etapa 2 - Propostas */}
        <div className='md:col-span-1 relative group'>
          <div className='bg-[#1e3a8a] p-6 rounded-[1.5rem] border border-white/10 shadow-xl text-center transition-all group-hover:scale-105'>
            <p className='text-[9px] font-black text-blue-200 uppercase tracking-[0.2em] mb-2 opacity-80'>
              02. Propostas
            </p>
            <p className='text-4xl font-black text-white tracking-tighter'>
              {funil.qualificadosProposta}
            </p>
          </div>
          <div className='hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 z-10'>
            <ArrowRight className='w-6 h-6 text-amber-500/30' />
          </div>
        </div>

        {/* Conversão 2 -> 3 */}
        <div className='md:col-span-1 flex flex-col items-center justify-center space-y-4'>
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm'>
            {funil.taxaConversaoFechamento}% Ativados
          </div>
          
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-red-50 text-red-700 border-red-100'>
            <XCircle className='w-3.5 h-3.5' />
            {funil.perdaNegociacao} Retidos
          </div>
          
          <div className='flex flex-col items-center gap-1 p-3 rounded-2xl bg-gray-50 border border-gray-100 w-full max-w-[140px]'>
            <span className='text-[8px] font-black text-gray-400 uppercase tracking-widest'>
              Negotiation Time
            </span>
            <div className='flex items-center gap-2'>
              <Clock className='w-3 h-3 text-amber-500' />
              <span className='text-[11px] font-black text-[#0a192f] uppercase'>
                {funil.tempoMedioPropostaFechamento} Dias
              </span>
            </div>
          </div>
        </div>

        {/* Etapa 3 - Fechados */}
        <div className='md:col-span-1 group'>
          <div className='bg-emerald-600 p-6 rounded-[1.5rem] border border-white/10 shadow-2xl text-center transition-all group-hover:scale-105'>
            <p className='text-[9px] font-black text-emerald-100 uppercase tracking-[0.2em] mb-2 opacity-80'>
              03. Fechados
            </p>
            <p className='text-4xl font-black text-white tracking-tighter'>
              {funil.fechados}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}