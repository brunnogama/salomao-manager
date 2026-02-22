import React from 'react';
import { Filter, ArrowRight, XCircle, Clock, TrendingDown } from 'lucide-react';

interface EfficiencyFunnelProps {
  funil: any;
}

export function EfficiencyFunnel({ funil }: EfficiencyFunnelProps) {
  return (
    <div className='bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6'>

      {/* Header */}
      <div className='mb-6 pb-5 border-b border-gray-100 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='p-2 rounded-xl bg-[#0a192f] text-white shadow-sm'>
            <TrendingDown className='w-5 h-5' />
          </div>
          <div>
            <h2 className='text-[20px] font-black text-[#0a192f] tracking-tight'>
              Funil de Eficiência
            </h2>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
              Taxa de conversão e tempo médio
            </p>
          </div>
        </div>
      </div>

      {/* Funil */}
      <div className='grid grid-cols-1 md:grid-cols-5 gap-4 items-center'>

        {/* Etapa 1 - Prospects */}
        <div className='md:col-span-1 relative'>
          <div className='bg-white p-5 rounded-xl border border-gray-200 border-l-4 border-l-indigo-600 shadow-sm text-center group hover:shadow-md transition-all'>
            <p className='text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2'>
              1. Prospects
            </p>
            <p className='text-[30px] font-black text-[#0a192f] tracking-tight'>
              {funil.totalEntrada}
            </p>
          </div>
          <div className='hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 z-10'>
            <ArrowRight className='w-5 h-5 text-gray-400' />
          </div>
        </div>

        {/* Conversão 1 -> 2 */}
        <div className='md:col-span-1 flex flex-col items-center justify-center space-y-3'>
          {/* Taxa de Conversão */}
          <div className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-blue-50 text-blue-700 border-blue-100 shadow-sm'>
            {funil.taxaConversaoProposta}% Avançam
          </div>

          {/* Rejeições */}
          <div className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-red-50 text-red-700 border-red-100'>
            <XCircle className='w-3 h-3' />
            {funil.perdaAnalise} Rejeições
          </div>

          {/* Tempo Médio */}
          <div className='flex flex-col items-center gap-1 p-2.5 rounded-xl bg-gray-50/50 border border-gray-100/80 min-w-[120px]'>
            <span className='text-[9px] font-black text-gray-400 uppercase tracking-wider'>
              Tempo Médio
            </span>
            <div className='flex items-center gap-1.5'>
              <Clock className='w-3 h-3 text-gray-500' />
              <span className='text-xs font-bold text-[#112240]'>
                {funil.tempoMedioProspectProposta} dias
              </span>
            </div>
          </div>
        </div>

        {/* Etapa 2 - Propostas */}
        <div className='md:col-span-1 relative'>
          <div className='bg-white p-5 rounded-xl border border-gray-200 border-l-4 border-l-blue-600 shadow-sm text-center group hover:shadow-md transition-all'>
            <p className='text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2'>
              2. Propostas
            </p>
            <p className='text-[30px] font-black text-[#0a192f] tracking-tight'>
              {funil.qualificadosProposta}
            </p>
          </div>
          <div className='hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 z-10'>
            <ArrowRight className='w-5 h-5 text-gray-400' />
          </div>
        </div>

        {/* Conversão 2 -> 3 */}
        <div className='md:col-span-1 flex flex-col items-center justify-center space-y-3'>
          {/* Taxa de Conversão */}
          <div className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-green-50 text-green-700 border-green-100 shadow-sm'>
            {funil.taxaConversaoFechamento}% Fecham
          </div>

          {/* Rejeições */}
          <div className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-red-50 text-red-700 border-red-100'>
            <XCircle className='w-3 h-3' />
            {funil.perdaNegociacao} Rejeições
          </div>

          {/* Tempo Médio */}
          <div className='flex flex-col items-center gap-1 p-2.5 rounded-xl bg-gray-50/50 border border-gray-100/80 min-w-[120px]'>
            <span className='text-[9px] font-black text-gray-400 uppercase tracking-wider'>
              Tempo Médio
            </span>
            <div className='flex items-center gap-1.5'>
              <Clock className='w-3 h-3 text-gray-500' />
              <span className='text-xs font-bold text-[#112240]'>
                {funil.tempoMedioPropostaFechamento} dias
              </span>
            </div>
          </div>
        </div>

        {/* Etapas Finais - Fechados e Rejeitados */}
        <div className='md:col-span-1 flex flex-col gap-3 h-full justify-center'>
          <div className='bg-white p-4 rounded-xl border border-gray-200 border-l-4 border-l-green-600 shadow-sm text-center group hover:shadow-md transition-all flex flex-col justify-center flex-1'>
            <p className='text-[10px] font-black text-green-600 uppercase tracking-[0.2em] mb-1'>
              3. Fechados
            </p>
            <p className='text-[28px] font-black text-[#0a192f] tracking-tight leading-none'>
              {funil.fechados}
            </p>
          </div>
          <div className='bg-white p-4 rounded-xl border border-gray-200 border-l-4 border-l-red-600 shadow-sm text-center group hover:shadow-md transition-all flex flex-col justify-center flex-1'>
            <p className='text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mb-1'>
              Rejeitados
            </p>
            <p className='text-[28px] font-black text-[#0a192f] tracking-tight leading-none'>
              {funil.perdaAnalise + funil.perdaNegociacao}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}