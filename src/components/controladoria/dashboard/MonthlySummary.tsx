import React from 'react';
import { 
  CalendarRange, Layers, ArrowUpRight, GitCommit, Lightbulb 
} from 'lucide-react';
import { formatMoney, calcDelta, getTrendText } from './dashboardHelpers';
import { FinItem } from './FinItem';

interface MonthlySummaryProps {
  metrics: any;
}

export function MonthlySummary({ metrics }: MonthlySummaryProps) {
  // Cálculos Locais mantidos integralmente
  const valPropMes = (metrics?.executivo?.mesAtual?.propPL || 0) + (metrics?.executivo?.mesAtual?.propExito || 0) + (metrics?.executivo?.mesAtual?.propMensal || 0);
  const valPropMesAnt = (metrics?.executivo?.mesAnterior?.propPL || 0) + (metrics?.executivo?.mesAnterior?.propExito || 0) + (metrics?.executivo?.mesAnterior?.propMensal || 0);
  const deltaPropMes = calcDelta(valPropMes, valPropMesAnt);

  const valFechMes = (metrics?.executivo?.mesAtual?.fechPL || 0) + (metrics?.executivo?.mesAtual?.fechExito || 0) + (metrics?.executivo?.mesAtual?.fechMensal || 0);
  const valFechMesAnt = (metrics?.executivo?.mesAnterior?.fechPL || 0) + (metrics?.executivo?.mesAnterior?.fechExito || 0) + (metrics?.executivo?.mesAnterior?.fechMensal || 0);
  const deltaFechMes = calcDelta(valFechMes, valFechMesAnt);

  const maxMesChart = Math.max(valPropMes, valPropMesAnt, valFechMes, valFechMesAnt, 100);

  const deltaNovos = calcDelta(metrics?.executivo?.mesAtual?.novos || 0, metrics?.executivo?.mesAnterior?.novos || 0);
  
  const insightMes = `${getTrendText(deltaNovos, 'novas demandas')} ${getTrendText(deltaFechMes, 'faturamento fechado')}`;

  return (
    <div className='bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all p-8'>
      
      {/* Header Manager Style */}
      <div className='mb-8 pb-6 border-b border-gray-50'>
        <div className='flex items-center gap-4 mb-2'>
          <div className='p-3 rounded-2xl bg-[#0a192f] text-white shadow-xl'>
            <CalendarRange className='w-6 h-6 text-amber-500' />
          </div>
          <h2 className='text-sm font-black text-[#0a192f] uppercase tracking-[0.3em]'>
            Performance Mensal Consolidada
          </h2>
        </div>
        <p className='text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-[60px]'>
          Comparativo estratégico em relação ao período anterior
        </p>
      </div>
      
      {/* Cards Grid - Tipografia Densa */}
      <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8'>
        
        {/* Card 1: Geral - Navy Gradient */}
        <div className='bg-[#0a192f] p-6 rounded-[1.5rem] border border-white/10 shadow-xl flex flex-col justify-between transition-all hover:scale-[1.02]'>
          <div>
            <div className='flex justify-between items-start mb-4'>
              <p className='text-[9px] text-white/50 font-black uppercase tracking-widest'>
                Atividades
              </p>
              <span className="text-[8px] bg-white/10 text-white px-2 py-0.5 rounded-lg font-black uppercase border border-white/10">
                Geral
              </span>
            </div>
            <p className='text-4xl font-black text-white tracking-tighter'>
              {metrics.mes.totalUnico}
            </p>
          </div>
          <div className='mt-4 pt-4 border-t border-white/5'>
            <p className='text-[8px] text-white/40 leading-relaxed font-bold uppercase tracking-tighter'>
              Fluxo total de casos movimentados.
            </p>
          </div>
        </div>

        {/* Card 2: Novos */}
        <div className='bg-gray-50 p-6 rounded-[1.5rem] border border-gray-100 flex flex-col justify-between hover:bg-white hover:shadow-md transition-all'>
          <div>
            <div className='flex justify-between items-start mb-4'>
              <p className='text-[9px] text-gray-400 font-black uppercase tracking-widest'>
                Sob Análise
              </p>
              <ArrowUpRight className='w-3.5 h-3.5 text-amber-500' />
            </div>
            <p className='text-4xl font-black text-[#0a192f] tracking-tighter'>
              {metrics.mes.analysis}
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
              {metrics.mes.propQtd}
            </p>
          </div>
          <div className='bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 space-y-2'>
            <FinItem label='Fixos' value={(metrics.mes.propPL || 0) + (metrics.mes.propMensal || 0)} colorClass='text-blue-700' />
            <FinItem label='Êxito' value={metrics.mes.propExito} colorClass='text-blue-700' />
          </div>
        </div>

        {/* Card 4: Fechados */}
        <div className='bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all'>
          <div className='mb-4'>
            <div className='flex justify-between items-start mb-4'>
              <p className='text-[9px] text-emerald-600 font-black uppercase tracking-widest'>
                Contratos
              </p>
              <GitCommit className='w-3.5 h-3.5 text-emerald-500' />
            </div>
            <p className='text-4xl font-black text-[#0a192f] tracking-tighter'>
              {metrics.mes.fechQtd}
            </p>
          </div>
          <div className='bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 space-y-2'>
            <FinItem label='Fixos' value={(metrics.mes.fechPL || 0) + (metrics.mes.fechMensal || 0)} colorClass='text-emerald-700' />
            <FinItem label='Êxito' value={metrics.mes.fechExito} colorClass='text-emerald-700' />
          </div>
        </div>

        {/* Card 5: Rejeitados */}
        <div className='bg-white p-6 rounded-[1.5rem] border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all'>
          <div>
            <div className='flex justify-between items-start mb-4'>
              <p className='text-[9px] text-red-600 font-black uppercase tracking-widest'>
                Retidos
              </p>
              <span className="text-[8px] bg-red-50 text-red-700 px-2 py-0.5 rounded-lg font-black uppercase border border-red-100">
                Cancel
              </span>
            </div>
            <p className='text-4xl font-black text-red-700 tracking-tighter'>
              {metrics.mes.rejected}
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
              <span className="text-[8px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg font-black uppercase border border-purple-100">
                PB
              </span>
            </div>
            <p className='text-4xl font-black text-purple-700 tracking-tighter'>
              {metrics.mes.probono}
            </p>
          </div>
        </div>
      </div>
      
      {/* Gráfico Mês + Insights */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Gráfico Comparativo Manager Style */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all flex-1">
          <div className="flex justify-between items-start mb-8 pb-4 border-b border-gray-50">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Benchmarking Financeiro
            </h3>
            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded">
              {metrics.executivo.periodoAnteriorLabel} vs {metrics.executivo.periodoAtualLabel}
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
                    {formatMoney(valPropMesAnt)}
                  </span>
                  <div 
                    className="w-full bg-gray-100 rounded-t-2xl transition-all duration-700 shadow-inner" 
                    style={{ height: `${valPropMesAnt > 0 ? (valPropMesAnt / maxMesChart) * 100 : 4}%` }}
                  />
                  <span className="text-[8px] text-gray-300 mt-3 font-black uppercase tracking-widest">
                    Prev.
                  </span>
                </div>
                
                {/* Atual */}
                <div className="flex flex-col items-center justify-end h-full w-20 relative">
                  <div className={`text-[8px] font-black px-2 py-0.5 rounded-lg mb-2 shadow-sm ${deltaPropMes >= 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {deltaPropMes > 0 ? '+' : ''}{deltaPropMes.toFixed(0)}%
                  </div>
                  <span className={`text-[9px] mb-2 font-black tracking-tighter ${deltaPropMes >= 0 ? 'text-[#0a192f]' : 'text-red-600'}`}>
                    {formatMoney(valPropMes)}
                  </span>
                  <div 
                    className="w-full bg-[#0a192f] rounded-t-2xl transition-all duration-700 shadow-2xl shadow-[#0a192f]/20" 
                    style={{ height: `${valPropMes > 0 ? (valPropMes / maxMesChart) * 100 : 4}%` }}
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
                    {formatMoney(valFechMesAnt)}
                  </span>
                  <div 
                    className="w-full bg-gray-100 rounded-t-2xl transition-all duration-700 shadow-inner" 
                    style={{ height: `${valFechMesAnt > 0 ? (valFechMesAnt / maxMesChart) * 100 : 4}%` }}
                  />
                  <span className="text-[8px] text-gray-300 mt-3 font-black uppercase tracking-widest">
                    Prev.
                  </span>
                </div>
                
                {/* Atual */}
                <div className="flex flex-col items-center justify-end h-full w-20 relative">
                  <div className={`text-[8px] font-black px-2 py-0.5 rounded-lg mb-2 shadow-sm ${deltaFechMes >= 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {deltaFechMes > 0 ? '+' : ''}{deltaFechMes.toFixed(0)}%
                  </div>
                  <span className={`text-[9px] mb-2 font-black tracking-tighter ${deltaFechMes >= 0 ? 'text-[#0a192f]' : 'text-red-600'}`}>
                    {formatMoney(valFechMes)}
                  </span>
                  <div 
                    className="w-full bg-emerald-600 rounded-t-2xl transition-all duration-700 shadow-2xl shadow-emerald-600/20" 
                    style={{ height: `${valFechMes > 0 ? (valFechMes / maxMesChart) * 100 : 4}%` }}
                  />
                  <span className="text-[8px] text-emerald-600 mt-3 font-black uppercase tracking-widest">
                    Atual
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insight Box - Manager Style */}
        <div className="bg-[#0a192f] p-8 rounded-[2rem] shadow-2xl flex flex-col justify-center w-full lg:w-72 transition-all border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl transition-all group-hover:bg-amber-500/20"></div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Lightbulb className='w-5 h-5 text-amber-500' />
            </div>
            <span className="text-[10px] text-white font-black uppercase tracking-[0.2em]">
              Data Insights
            </span>
          </div>
          <div className="space-y-4 relative z-10">
            <p className="text-[11px] text-slate-300 leading-relaxed font-bold uppercase tracking-tight">
              {getTrendText(deltaNovos, 'novas demandas')}.
            </p>
            <p className="text-[11px] text-slate-300 leading-relaxed font-bold uppercase tracking-tight">
              {getTrendText(deltaFechMes, 'faturamento fechado')}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}