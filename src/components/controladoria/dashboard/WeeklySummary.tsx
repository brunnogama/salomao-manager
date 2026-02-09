import React from 'react';
import { 
  CalendarDays, Layers, ArrowUpRight, GitCommit, Lightbulb 
} from 'lucide-react';
import { formatMoney, calcDelta, getTrendText } from './dashboardHelpers';
import { FinItem } from './FinItem';

interface WeeklySummaryProps {
  metrics: any;
}

export function WeeklySummary({ metrics }: WeeklySummaryProps) {
  // Cálculos Locais mantidos integralmente
  const valPropSemana = (metrics?.semana?.propPL || 0) + (metrics?.semana?.propExito || 0) + (metrics?.semana?.propMensal || 0);
  const valPropSemanaAnt = (metrics?.semanaAnterior?.propPL || 0) + (metrics?.semanaAnterior?.propExito || 0) + (metrics?.semanaAnterior?.propMensal || 0);
  const deltaPropSemana = calcDelta(valPropSemana, valPropSemanaAnt);

  const valFechSemana = (metrics?.semana?.fechPL || 0) + (metrics?.semana?.fechExito || 0) + (metrics?.semana?.fechMensal || 0);
  const valFechSemanaAnt = (metrics?.semanaAnterior?.fechPL || 0) + (metrics?.semanaAnterior?.fechExito || 0) + (metrics?.semanaAnterior?.fechMensal || 0);
  const deltaFechSemana = calcDelta(valFechSemana, valFechSemanaAnt);

  const maxSemanaChart = Math.max(valPropSemana, valPropSemanaAnt, valFechSemana, valFechSemanaAnt, 100);

  const insightSemana = `${getTrendText(deltaFechSemana, 'fechamento de contratos')} ${getTrendText(deltaPropSemana, 'envio de propostas')}`;

  return (
    <div className='bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all p-8'>
      
      {/* Header Manager Style */}
      <div className='mb-8 pb-6 border-b border-gray-50'>
        <div className='flex items-center gap-4 mb-2'>
          <div className='p-3 rounded-2xl bg-[#0a192f] text-white shadow-xl'>
            <CalendarDays className='w-6 h-6 text-amber-500' />
          </div>
          <h2 className='text-sm font-black text-[#0a192f] uppercase tracking-[0.3em]'>
            Análise de Performance Semanal
          </h2>
        </div>
        <p className='text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-[60px]'>
          Movimentações e volumetria do ciclo atual vs anterior
        </p>
      </div>
      
      {/* Cards Grid - Tipografia Densa Manager */}
      <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8'>
        
        {/* Card 1: Geral - Navy Gradient */}
        <div className='bg-[#0a192f] p-6 rounded-[1.5rem] border border-white/10 shadow-xl flex flex-col justify-between transition-all hover:scale-[1.02] relative overflow-hidden group'>
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white/5 rounded-full blur-xl transition-all group-hover:bg-white/10"></div>
          <div className='relative z-10'>
            <div className='flex justify-between items-start mb-4'>
              <p className='text-[9px] text-white/50 font-black uppercase tracking-widest'>
                Activity Score
              </p>
              <span className="text-[8px] bg-white/10 text-white px-2 py-0.5 rounded-lg font-black uppercase border border-white/10 tracking-tighter">
                Geral
              </span>
            </div>
            <p className='text-4xl font-black text-white tracking-tighter'>
              {metrics.semana.totalUnico}
            </p>
          </div>
          <div className='mt-4 pt-4 border-t border-white/5 relative z-10'>
            <p className='text-[8px] text-white/40 leading-relaxed font-bold uppercase tracking-tighter'>
              Casos com movimentação ativa no período.
            </p>
          </div>
        </div>
        
        {/* Card 2: Novos */}
        <div className='bg-gray-50 p-6 rounded-[1.5rem] border border-gray-100 flex flex-col justify-between hover:bg-white hover:shadow-md transition-all'>
          <div>
            <div className='flex justify-between items-start mb-4'>
              <p className='text-[9px] text-gray-400 font-black uppercase tracking-widest'>
                Novos Prospects
              </p>
              <ArrowUpRight className='w-3.5 h-3.5 text-amber-500' />
            </div>
            <p className='text-4xl font-black text-[#0a192f] tracking-tighter'>
              {metrics.semana.novos}
            </p>
          </div>
        </div>

        {/* Card 3: Propostas */}
        <div className='bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all'>
          <div className='mb-4'>
            <div className='flex justify-between items-start mb-4'>
              <p className='text-[9px] text-blue-600 font-black uppercase tracking-widest'>
                Propostas
              </p>
              <GitCommit className='w-3.5 h-3.5 text-blue-500' />
            </div>
            <p className='text-4xl font-black text-[#0a192f] tracking-tighter'>
              {metrics.semana.propQtd}
            </p>
          </div>
          <div className='bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 space-y-2'>
            <FinItem label='Fixos' value={(metrics.semana.propPL || 0) + (metrics.semana.propMensal || 0)} colorClass='text-blue-700' />
            <FinItem label='Êxito' value={metrics.semana.propExito} colorClass='text-blue-700' />
          </div>
        </div>

        {/* Card 4: Fechados */}
        <div className='bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all'>
          <div className='mb-4'>
            <div className='flex justify-between items-start mb-4'>
              <p className='text-[9px] text-emerald-600 font-black uppercase tracking-widest'>
                Fechados
              </p>
              <GitCommit className='w-3.5 h-3.5 text-emerald-500' />
            </div>
            <p className='text-4xl font-black text-[#0a192f] tracking-tighter'>
              {metrics.semana.fechQtd}
            </p>
          </div>
          <div className='bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 space-y-2'>
            <FinItem label='Fixos' value={(metrics.semana.fechPL || 0) + (metrics.semana.fechMensal || 0)} colorClass='text-emerald-700' />
            <FinItem label='Êxito' value={metrics.semana.fechExito} colorClass='text-emerald-700' />
          </div>
        </div>

        {/* Card 5: Rejeitados */}
        <div className='bg-white p-6 rounded-[1.5rem] border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all'>
          <div>
            <div className='flex justify-between items-start mb-4'>
              <p className='text-[9px] text-red-600 font-black uppercase tracking-widest'>
                Retidos
              </p>
              <span className="text-[8px] bg-red-50 text-red-700 px-2 py-0.5 rounded-lg font-black uppercase border border-red-100 tracking-tighter">
                Cancel
              </span>
            </div>
            <p className='text-4xl font-black text-red-700 tracking-tighter'>
              {metrics.semana.rejeitados}
            </p>
          </div>
        </div>

        {/* Card 6: Probono */}
        <div className='bg-white p-6 rounded-[1.5rem] border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all'>
          <div>
            <div className='flex justify-between items-start mb-4'>
              <p className='text-[9px] text-purple-600 font-black uppercase tracking-widest'>
                Social
              </p>
              <span className="text-[8px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg font-black uppercase border border-purple-100 tracking-tighter">
                PB
              </span>
            </div>
            <p className='text-4xl font-black text-purple-700 tracking-tighter'>
              {metrics.semana.probono}
            </p>
          </div>
        </div>
      </div>
      
      {/* Gráfico Semana + Insights - Manager Analytics Style */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Gráfico Comparativo */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all flex-1">
          <div className="flex justify-between items-start mb-8 pb-4 border-b border-gray-50">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Matriz de Desempenho Financeiro
            </h3>
            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
              Ciclo Atual vs Anterior
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-12 h-64">
            
            {/* Propostas */}
            <div className="flex flex-col justify-end relative border-r border-gray-50 pr-6">
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-4 text-center">
                Volume Proposto
              </p>
              <div className="flex items-end justify-center gap-8 h-full">
                {/* Anterior */}
                <div className="flex flex-col items-center justify-end h-full w-20">
                  <span className="text-[9px] text-gray-400 mb-2 font-black tracking-tighter">
                    {formatMoney(valPropSemanaAnt)}
                  </span>
                  <div 
                    className="w-full bg-gray-100 rounded-t-2xl transition-all duration-700 shadow-inner" 
                    style={{ height: `${valPropSemanaAnt > 0 ? (valPropSemanaAnt / maxSemanaChart) * 100 : 4}%` }}
                  />
                  <span className="text-[8px] text-gray-300 mt-3 font-black uppercase tracking-widest">
                    Prev.
                  </span>
                </div>
                
                {/* Atual */}
                <div className="flex flex-col items-center justify-end h-full w-20 relative">
                  <div className={`text-[8px] font-black px-2 py-0.5 rounded-lg mb-2 shadow-sm ${deltaPropSemana >= 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {deltaPropSemana > 0 ? '+' : ''}{deltaPropSemana.toFixed(0)}%
                  </div>
                  <span className={`text-[9px] mb-2 font-black tracking-tighter ${deltaPropSemana >= 0 ? 'text-[#0a192f]' : 'text-red-600'}`}>
                    {formatMoney(valPropSemana)}
                  </span>
                  <div 
                    className="w-full bg-[#0a192f] rounded-t-2xl transition-all duration-700 shadow-2xl shadow-[#0a192f]/20" 
                    style={{ height: `${valPropSemana > 0 ? (valPropSemana / maxSemanaChart) * 100 : 4}%` }}
                  />
                  <span className="text-[8px] text-[#0a192f] mt-3 font-black uppercase tracking-widest">
                    Atual
                  </span>
                </div>
              </div>
            </div>

            {/* Fechados */}
            <div className="flex flex-col justify-end relative">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-4 text-center">
                Volume Realizado
              </p>
              <div className="flex items-end justify-center gap-8 h-full">
                {/* Anterior */}
                <div className="flex flex-col items-center justify-end h-full w-20">
                  <span className="text-[9px] text-gray-400 mb-2 font-black tracking-tighter">
                    {formatMoney(valFechSemanaAnt)}
                  </span>
                  <div 
                    className="w-full bg-gray-100 rounded-t-2xl transition-all duration-700 shadow-inner" 
                    style={{ height: `${valFechSemanaAnt > 0 ? (valFechSemanaAnt / maxSemanaChart) * 100 : 4}%` }}
                  />
                  <span className="text-[8px] text-gray-300 mt-3 font-black uppercase tracking-widest">
                    Prev.
                  </span>
                </div>
                
                {/* Atual */}
                <div className="flex flex-col items-center justify-end h-full w-20 relative">
                  <div className={`text-[8px] font-black px-2 py-0.5 rounded-lg mb-2 shadow-sm ${deltaFechSemana >= 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {deltaFechSemana > 0 ? '+' : ''}{deltaFechSemana.toFixed(0)}%
                  </div>
                  <span className={`text-[9px] mb-2 font-black tracking-tighter ${deltaFechSemana >= 0 ? 'text-[#0a192f]' : 'text-red-600'}`}>
                    {formatMoney(valFechSemana)}
                  </span>
                  <div 
                    className="w-full bg-emerald-600 rounded-t-2xl transition-all duration-700 shadow-2xl shadow-emerald-600/20" 
                    style={{ height: `${valFechSemana > 0 ? (valFechSemana / maxSemanaChart) * 100 : 4}%` }}
                  />
                  <span className="text-[8px] text-emerald-600 mt-3 font-black uppercase tracking-widest">
                    Atual
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insight Box - Manager Executive Style */}
        <div className="bg-[#0a192f] p-8 rounded-[2rem] shadow-2xl flex flex-col justify-center w-full lg:w-72 transition-all border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl transition-all group-hover:bg-amber-500/20"></div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Lightbulb className='w-5 h-5 text-amber-500' />
            </div>
            <span className="text-[10px] text-white font-black uppercase tracking-[0.2em]">
              Executive Insights
            </span>
          </div>
          <div className="space-y-4 relative z-10">
            <p className="text-[11px] text-slate-300 leading-relaxed font-bold uppercase tracking-tight">
              {getTrendText(deltaFechSemana, 'fechamento de contratos')}.
            </p>
            <p className="text-[11px] text-slate-300 leading-relaxed font-bold uppercase tracking-tight">
              {getTrendText(deltaPropSemana, 'envio de propostas')}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}