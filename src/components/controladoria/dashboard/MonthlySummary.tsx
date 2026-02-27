import React from 'react';
import {
  CalendarRange, Layers, ArrowUpRight, GitCommit
} from 'lucide-react';
import { FinItem } from './FinItem';

interface MonthlySummaryProps {
  metrics: any;
}

export function MonthlySummary({ metrics }: MonthlySummaryProps) {


  return (
    <div className='bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6'>

      {/* Header */}
      <div className='mb-6 pb-5 border-b border-gray-100 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='p-2 rounded-xl bg-[#0a192f] text-white shadow-sm'>
            <CalendarRange className='w-5 h-5' />
          </div>
          <div>
            <h2 className='text-[20px] font-black text-[#0a192f] tracking-tight'>
              Resumo do Mês
            </h2>
            <p className='text-[9px] font-black text-gray-400 uppercase tracking-wider'>
              Performance mensal consolidada
            </p>
          </div>
        </div>
      </div>

      {/* Explicação Dinâmica */}
      <div className="mb-6 bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-[13px] text-blue-900 leading-relaxed shadow-sm">
        Neste mês, registramos movimentações em <strong>{metrics.mes.totalUnico || 0}</strong> casos únicos no sistema, incluindo <strong>{metrics.mes.analysis || 0}</strong> novos prospectos que entraram para análise. Em termos de produtividade, formulamos <strong>{metrics.mes.propQtd || 0}</strong> propostas e fechamos com sucesso <strong>{metrics.mes.fechQtd || 0}</strong> novos contratos. Além disto, registramos <strong>{metrics.mes.rejected || 0}</strong> oportunidades perdidas e prestamos apoio a <strong>{metrics.mes.probono || 0}</strong> casos na categoria pro bono.
      </div>

      {/* Cards Grid */}
      <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6'>

        {/* Card 1: Geral */}
        <div className='bg-white p-5 rounded-xl border border-gray-200 border-l-4 border-l-[#0a192f] shadow-sm flex flex-col justify-between transition-all hover:shadow-md'>
          <div>
            <div className='flex justify-between items-start mb-3'>
              <p className='text-[9px] text-gray-500 font-black uppercase tracking-widest'>
                Casos com Atividade
              </p>
              <div className='p-1.5 bg-gray-50 rounded-lg text-gray-600'>
                <Layers className='w-3 h-3' />
              </div>
            </div>
            <p className='text-[30px] font-black text-[#0a192f] tracking-tight'>
              {metrics.mes.totalUnico}
            </p>
          </div>
          <div className='mt-2 pt-2 border-t border-gray-100'>
            <p className='text-[9px] text-gray-400 font-semibold leading-tight'>
              Movimentados no mês
            </p>
          </div>
        </div>

        {/* Card 2: Novos */}
        <div className='bg-white p-5 rounded-xl border border-gray-200 border-l-4 border-l-amber-500 shadow-sm flex flex-col justify-between hover:shadow-md transition-all'>
          <div>
            <div className='flex justify-between items-start mb-3'>
              <p className='text-[9px] text-gray-500 font-black uppercase tracking-widest'>
                Sob Análise (Novos)
              </p>
              <div className='p-1.5 bg-amber-50 rounded-lg text-amber-600'>
                <ArrowUpRight className='w-3 h-3' />
              </div>
            </div>
            <p className='text-[30px] font-black text-[#0a192f] tracking-tight'>
              {metrics.mes.analysis}
            </p>
          </div>
        </div>

        {/* Card 3: Propostas */}
        <div className='bg-white p-5 rounded-xl border border-gray-200 border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between'>
          <div className='mb-3'>
            <div className='flex justify-between items-start mb-3'>
              <p className='text-[9px] text-gray-500 font-black uppercase tracking-widest'>
                Propostas Formu.
              </p>
              <div className='p-1.5 bg-blue-50 rounded-lg text-blue-600'>
                <GitCommit className='w-3 h-3' />
              </div>
            </div>
            <p className='text-[30px] font-black text-[#0a192f] tracking-tight mb-3 leading-none mt-2'>
              {metrics.mes.propQtd}
            </p>
          </div>
          <div className='bg-gray-50 p-2.5 rounded-lg border border-gray-100 space-y-1.5'>
            <FinItem label='PL + Fixos' value={(metrics.mes.propPL || 0) + (metrics.mes.propMensal || 0)} colorClass='text-blue-600' />
            <FinItem label='Êxito' value={metrics.mes.propExito} colorClass='text-blue-600' />
          </div>
        </div>

        {/* Card 4: Fechados */}
        <div className='bg-white p-5 rounded-xl border border-gray-200 border-l-4 border-l-green-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between'>
          <div className='mb-3'>
            <div className='flex justify-between items-start mb-3'>
              <p className='text-[9px] text-gray-500 font-black uppercase tracking-widest'>
                Fechados
              </p>
              <div className='p-1.5 bg-green-50 rounded-lg text-green-600'>
                <GitCommit className='w-3 h-3' />
              </div>
            </div>
            <p className='text-[30px] font-black text-[#0a192f] tracking-tight mb-3 leading-none mt-2'>
              {metrics.mes.fechQtd}
            </p>
          </div>
          <div className='bg-gray-50 p-2.5 rounded-lg border border-gray-100 space-y-1.5'>
            <FinItem label='PL + Fixos' value={(metrics.mes.fechPL || 0) + (metrics.mes.fechMensal || 0)} colorClass='text-green-600' />
            <FinItem label='Êxito' value={metrics.mes.fechExito} colorClass='text-green-600' />
          </div>
        </div>

        {/* Card 5: Rejeitados */}
        <div className='bg-white p-5 rounded-xl border border-gray-200 border-l-4 border-l-red-600 shadow-sm flex flex-col justify-between hover:shadow-md transition-all'>
          <div>
            <div className='flex justify-between items-start mb-3'>
              <p className='text-[9px] text-gray-500 font-black uppercase tracking-widest'>
                Rejeitados
              </p>
              <div className='p-1.5 bg-red-50 rounded-lg text-red-600'>
                <GitCommit className='w-3 h-3' />
              </div>
            </div>
            <p className='text-[30px] font-black text-[#0a192f] tracking-tight'>
              {metrics.mes.rejected}
            </p>
          </div>
        </div>

        {/* Card 6: Probono */}
        <div className='bg-white p-5 rounded-xl border border-gray-200 border-l-4 border-l-purple-600 shadow-sm flex flex-col justify-between hover:shadow-md transition-all'>
          <div>
            <div className='flex justify-between items-start mb-3'>
              <p className='text-[9px] text-gray-500 font-black uppercase tracking-widest'>
                Probono
              </p>
              <div className='p-1.5 bg-purple-50 rounded-lg text-purple-600'>
                <GitCommit className='w-3 h-3' />
              </div>
            </div>
            <p className='text-[30px] font-black text-[#0a192f] tracking-tight'>
              {metrics.mes.probono}
            </p>
          </div>
        </div>
      </div>


    </div>
  );
}