import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, Clock, Briefcase, CheckCircle2, XCircle, HeartHandshake, Layers 
} from 'lucide-react';
import { formatMoney } from './dashboardHelpers';

interface PortfolioFinancialOverviewProps {
  metrics: any;
}

export function PortfolioFinancialOverview({ metrics }: PortfolioFinancialOverviewProps) {
  const navigate = useNavigate();

  const handleDrillDown = (status: string) => {
    navigate('/controladoria/contracts', { state: { status } });
  };

  // Cálculos protegidos mantidos integralmente
  const totalCarteira = (metrics?.geral?.totalFechadoPL || 0) + 
                        (metrics?.geral?.totalFechadoExito || 0) + 
                        (metrics?.geral?.receitaRecorrenteAtiva || 0) + 
                        ((metrics?.geral as any)?.totalFechadoOutros || 0);

  const totalNegociacao = (metrics?.geral?.valorEmNegociacaoPL || 0) + 
                          (metrics?.geral?.valorEmNegociacaoExito || 0) +
                          ((metrics?.geral as any)?.valorEmNegociacaoMensal || 0) +
                          ((metrics?.geral as any)?.valorEmNegociacaoOutros || 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Esquerda: Fotografia da Carteira Atual (Cards) */}
      <div className='lg:col-span-5 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all p-8 h-full flex flex-col'>
        
        {/* Header Manager Style */}
        <div className='mb-8 pb-6 border-b border-gray-50'>
          <div className='flex items-center gap-4 mb-2'>
            <div className='p-3 rounded-2xl bg-[#0a192f] text-white shadow-xl'>
              <Camera className='w-6 h-6 text-amber-500' />
            </div>
            <h2 className='text-sm font-black text-[#0a192f] uppercase tracking-[0.3em]'>
              Status do Portfólio
            </h2>
          </div>
          <p className='text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-[60px]'>
            Quantidade de registros ativos por estágio
          </p>
        </div>

        {/* Cards Clicáveis para Drill-Down - Tipografia Densa */}
        <div className='grid grid-cols-2 gap-4 flex-1'>
          
          {/* Sob Análise */}
          <button 
            onClick={() => handleDrillDown('analysis')} 
            className='bg-amber-500 p-5 rounded-[1.5rem] shadow-xl text-center cursor-pointer hover:bg-amber-600 transition-all hover:scale-[1.03] active:scale-95 group'
          >
            <Clock className='mx-auto text-[#0a192f] mb-3 group-hover:rotate-12 transition-transform' size={24} />
            <p className='text-3xl font-black text-white tracking-tighter'>
              {metrics.geral.emAnalise}
            </p>
            <p className='text-[10px] text-white font-black uppercase tracking-[0.2em] mt-2 opacity-80'>
              Análise
            </p>
          </button>

          {/* Propostas */}
          <button 
            onClick={() => handleDrillDown('proposal')} 
            className='bg-[#0a192f] p-5 rounded-[1.5rem] shadow-xl text-center cursor-pointer hover:bg-slate-800 transition-all hover:scale-[1.03] active:scale-95 group border border-white/10'
          >
            <Briefcase className='mx-auto text-amber-500 mb-3 group-hover:rotate-12 transition-transform' size={24} />
            <p className='text-3xl font-black text-white tracking-tighter'>
              {metrics.geral.propostasAtivas}
            </p>
            <p className='text-[10px] text-white font-black uppercase tracking-[0.2em] mt-2 opacity-80'>
              Propostas
            </p>
          </button>

          {/* Fechados */}
          <button 
            onClick={() => handleDrillDown('active')} 
            className='bg-emerald-600 p-5 rounded-[1.5rem] shadow-xl text-center cursor-pointer hover:bg-emerald-700 transition-all hover:scale-[1.03] active:scale-95 group'
          >
            <CheckCircle2 className='mx-auto text-white mb-3 group-hover:rotate-12 transition-transform' size={24} />
            <p className='text-3xl font-black text-white tracking-tighter'>
              {metrics.geral.fechados}
            </p>
            <p className='text-[10px] text-white font-black uppercase tracking-[0.2em] mt-2 opacity-80'>
              Fechados
            </p>
          </button>

          {/* Rejeitados */}
          <button 
            onClick={() => handleDrillDown('rejected')} 
            className='bg-red-600 p-5 rounded-[1.5rem] shadow-xl text-center cursor-pointer hover:bg-red-700 transition-all hover:scale-[1.03] active:scale-95 group'
          >
            <XCircle className='mx-auto text-white mb-3 group-hover:rotate-12 transition-transform' size={24} />
            <p className='text-3xl font-black text-white tracking-tighter'>
              {metrics.geral.rejeitados}
            </p>
            <p className='text-[10px] text-white font-black uppercase tracking-[0.2em] mt-2 opacity-80'>
              Retidos
            </p>
          </button>

          {/* Probono */}
          <div className='col-span-2 grid grid-cols-2 gap-4 mt-2'>
              <button 
                onClick={() => handleDrillDown('probono')} 
                className='bg-purple-700 p-5 rounded-[1.5rem] shadow-xl text-center cursor-pointer hover:bg-purple-800 transition-all hover:scale-[1.03] active:scale-95 group'
              >
                <HeartHandshake className='mx-auto text-white mb-3' size={24} />
                <p className='text-3xl font-black text-white tracking-tighter'>{metrics.geral.probono}</p>
                <p className='text-[10px] text-white font-black uppercase tracking-[0.2em] mt-2'>Social</p>
              </button>

              <button 
                onClick={() => handleDrillDown('all')} 
                className='bg-gray-100 p-5 rounded-[1.5rem] border border-gray-200 text-center cursor-pointer hover:bg-white hover:shadow-xl transition-all hover:scale-[1.03] active:scale-95 group'
              >
                <Layers className='mx-auto text-[#0a192f] mb-3' size={24} />
                <p className='text-3xl font-black text-[#0a192f] tracking-tighter'>{metrics.geral.totalCasos}</p>
                <p className='text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-2'>Universo</p>
              </button>
          </div>
        </div>
      </div>

      {/* Direita: Fotografia Financeira Total */}
      <div className='lg:col-span-7 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all p-8 h-full flex flex-col'>
        
        {/* Header */}
        <div className='mb-8 pb-6 border-b border-gray-50'>
          <div className='flex items-center gap-4 mb-2'>
            <div className='p-3 rounded-2xl bg-[#0a192f] text-white shadow-xl'>
              <Camera className='w-6 h-6 text-amber-500' />
            </div>
            <h2 className='text-sm font-black text-[#0a192f] uppercase tracking-[0.3em]'>
              Consolidado Financeiro
            </h2>
          </div>
          <p className='text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-[60px]'>
            Valuation de propostas e receita bruta garantida
          </p>
        </div>
        
        <div className='grid grid-cols-1 md:grid-cols-2 gap-10 flex-1'>
          
          {/* Coluna Propostas Enviadas */}
          <div className="flex flex-col justify-between h-full bg-gray-50/50 p-6 rounded-[1.5rem] border border-gray-100">
            <div>
              <p className='text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2'>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Pipeline em Negociação
              </p>
              <div className='space-y-4'>
                <div className="flex justify-between items-baseline border-b border-gray-100 pb-2">
                  <span className='text-[10px] font-black text-gray-400 uppercase tracking-widest'>Pró-labore</span>
                  <span className='text-lg font-black text-[#0a192f] tracking-tighter'>{formatMoney(metrics.geral.valorEmNegociacaoPL)}</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-gray-100 pb-2">
                  <span className='text-[10px] font-black text-gray-400 uppercase tracking-widest'>Êxitos</span>
                  <span className='text-lg font-black text-[#0a192f] tracking-tighter'>{formatMoney(metrics.geral.valorEmNegociacaoExito)}</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-gray-100 pb-2">
                  <span className='text-[10px] font-black text-gray-400 uppercase tracking-widest'>Fixos</span>
                  <span className='text-lg font-black text-[#0a192f] tracking-tighter'>{formatMoney((metrics.geral as any).valorEmNegociacaoMensal || 0)}</span>
                </div>
                
                <div className='flex flex-col items-end pt-4'>
                  <span className='text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1'>Potencial Estimado</span>
                  <span className='text-3xl font-black text-blue-600 tracking-tighter'>{formatMoney(totalNegociacao)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className='text-[9px] font-black text-gray-400 uppercase tracking-wider'>Ticket Médio PL</span>
                <span className="text-[11px] font-black text-blue-600 tracking-tight">{formatMoney(metrics.geral.mediaMensalNegociacaoPL)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className='text-[9px] font-black text-gray-400 uppercase tracking-wider'>Ticket Médio Êxito</span>
                <span className="text-[11px] font-black text-blue-600 tracking-tight">{formatMoney(metrics.geral.mediaMensalNegociacaoExito)}</span>
              </div>
            </div>
          </div>

          {/* Coluna Contratos Fechados */}
          <div className='flex flex-col justify-between h-full bg-[#0a192f] p-6 rounded-[1.5rem] border border-white/10 shadow-2xl relative overflow-hidden'>
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <div>
              <p className='text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2'>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Receita Bruta Contratada
              </p>
              <div className='space-y-4'>
                <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                  <span className='text-[10px] font-black text-white/40 uppercase tracking-widest'>Pró-labore</span>
                  <span className='text-lg font-black text-white tracking-tighter'>{formatMoney(metrics.geral.totalFechadoPL)}</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                  <span className='text-[10px] font-black text-white/40 uppercase tracking-widest'>Êxitos</span>
                  <span className='text-lg font-black text-white tracking-tighter'>{formatMoney(metrics.geral.totalFechadoExito)}</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                  <span className='text-[10px] font-black text-white/40 uppercase tracking-widest'>Recorrência</span>
                  <span className='text-lg font-black text-white tracking-tighter'>{formatMoney(metrics.geral.receitaRecorrenteAtiva)}</span>
                </div>

                <div className='flex flex-col items-end pt-4'>
                  <span className='text-[8px] font-black text-white/30 uppercase tracking-widest mb-1'>Patrimônio Sob Gestão</span>
                  <span className='text-3xl font-black text-emerald-500 tracking-tighter'>{formatMoney(totalCarteira)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className='text-[9px] font-black text-white/30 uppercase tracking-wider'>Benchmark PL</span>
                <span className="text-[11px] font-black text-emerald-400 tracking-tight">{formatMoney(metrics.geral.mediaMensalCarteiraPL)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className='text-[9px] font-black text-white/30 uppercase tracking-wider'>Benchmark Êxito</span>
                <span className="text-[11px] font-black text-emerald-400 tracking-tight">{formatMoney(metrics.geral.mediaMensalCarteiraExito)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}