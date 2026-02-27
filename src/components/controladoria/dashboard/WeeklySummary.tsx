import React from 'react';
import {
  CalendarDays, Layers, ArrowUpRight, GitCommit, Lightbulb
} from 'lucide-react';
import { FinItem } from './FinItem';

interface WeeklySummaryProps {
  metrics: any;
}

export function WeeklySummary({ metrics }: WeeklySummaryProps) {


  return (
    <div className='bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6'>

      {/* Header */}
      <div className='mb-6 pb-5 border-b border-gray-100 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='p-2 rounded-xl bg-[#0a192f] text-white shadow-sm'>
            <CalendarDays className='w-5 h-5' />
          </div>
          <div>
            <h2 className='text-[20px] font-black text-[#0a192f] tracking-tight'>
              Resumo da Semana
            </h2>
            <p className='text-[9px] font-black text-gray-400 uppercase tracking-wider'>
              Movimentações e atividades recentes
            </p>
          </div>
        </div>
      </div>

      {/* Explicação Dinâmica */}
      <div className="mb-6 bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-[13px] text-blue-900 leading-relaxed shadow-sm flex gap-3 items-start">
        <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          Nesta semana, {metrics.semana.totalUnico === 0 ? 'não registramos movimentações em casos únicos no sistema' : <>registramos movimentações em <strong>{metrics.semana.totalUnico}</strong> casos únicos no sistema</>}, {metrics.semana.novos === 0 ? 'e nenhum prospect entrou para análise.' : <>incluindo <strong>{metrics.semana.novos}</strong> novos prospects que entraram para análise.</>} Em termos de produtividade, {metrics.semana.propQtd === 0 ? 'nossa equipe não formulou propostas e' : <>nossa equipe formulou <strong>{metrics.semana.propQtd}</strong> propostas e</>} {metrics.semana.fechQtd === 0 ? 'não fechamos novos contratos.' : <>fechamos com sucesso <strong>{metrics.semana.fechQtd}</strong> contratos.</>} {metrics.semana.rejeitados === 0 ? 'Não houve recusas (negociações perdidas)' : <>Houve <strong>{metrics.semana.rejeitados}</strong> recusas (negociações perdidas)</>} e {metrics.semana.probono === 0 ? 'não tivemos atuações pro bono.' : <>trabalhamos em <strong>{metrics.semana.probono}</strong> atuações pro bono.</>}
        </div>
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
              {metrics.semana.totalUnico}
            </p>
          </div>
          <div className='mt-2 pt-2 border-t border-gray-100'>
            <p className='text-[9px] text-gray-400 font-semibold leading-tight'>
              Movimentados na semana
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
              {metrics.semana.novos}
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
              {metrics.semana.propQtd}
            </p>
          </div>
          <div className='bg-gray-50 p-2.5 rounded-lg border border-gray-100 space-y-1.5'>
            <FinItem label='PL + Fixos' value={(metrics.semana.propPL || 0) + (metrics.semana.propMensal || 0)} colorClass='text-blue-600' />
            <FinItem label='Êxito' value={metrics.semana.propExito} colorClass='text-blue-600' />
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
              {metrics.semana.fechQtd}
            </p>
          </div>
          <div className='bg-gray-50 p-2.5 rounded-lg border border-gray-100 space-y-1.5'>
            <FinItem label='PL + Fixos' value={(metrics.semana.fechPL || 0) + (metrics.semana.fechMensal || 0)} colorClass='text-green-600' />
            <FinItem label='Êxito' value={metrics.semana.fechExito} colorClass='text-green-600' />
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
              {metrics.semana.rejeitados}
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
              {metrics.semana.probono}
            </p>
          </div>
        </div>
      </div>


    </div>
  );
}