import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Clock, Briefcase, CheckCircle2, TrendingUp, Layers, Banknote, XCircle, HeartHandshake, PieChart, FileSignature
} from 'lucide-react';
import { formatMoney } from './dashboardHelpers';

interface PortfolioFinancialOverviewProps {
  metrics: any;
}

export function PortfolioFinancialOverview({ metrics }: PortfolioFinancialOverviewProps) {
  const navigate = useNavigate();

  const handleDrillDown = (status: string) => {
    navigate('/controladoria/contratos', { state: { status } });
  };

  // Cálculos protegidos
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
      <div className='lg:col-span-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6 h-full flex flex-col'>

        {/* Header */}
        <div className='mb-6 pb-5 border-b border-gray-100 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='p-2 rounded-xl bg-[#0a192f] text-white shadow-sm'>
              <PieChart className='w-5 h-5' />
            </div>
            <div>
              <h2 className='text-[20px] font-black text-[#0a192f] tracking-tight'>
                Fotografia da Carteira Atual
              </h2>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                Distribuição dos casos por fase
              </p>
            </div>
          </div>
        </div>
        {/* Cards de Status */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>

          {/* 1. Ativos */}
          <div
            onClick={() => handleDrillDown('Ativo')}
            className='bg-white group p-5 rounded-xl border border-gray-200 border-l-4 border-l-green-600 shadow-sm hover:shadow-md cursor-pointer transition-all'
          >
            <div className='flex justify-between items-start mb-3'>
              <p className='text-[10px] text-gray-500 font-black uppercase tracking-widest'>
                Contratos Ativos
              </p>
              <div className='p-1.5 bg-green-50 rounded-lg text-green-600 group-hover:scale-110 transition-transform'>
                <CheckCircle2 className='w-4 h-4' />
              </div>
            </div>
            <p className='text-[34px] font-black text-[#0a192f] tracking-tight leading-none mb-1'>
              {metrics.geral.active}
            </p>
            <p className='text-[10px] font-bold text-gray-400'>casos em andamento</p>
          </div>

          {/* 2. Em Análise */}
          <div
            onClick={() => handleDrillDown('Análise')}
            className='bg-white group p-5 rounded-xl border border-gray-200 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md cursor-pointer transition-all'
          >
            <div className='flex justify-between items-start mb-3'>
              <p className='text-[10px] text-gray-500 font-black uppercase tracking-widest'>
                Em Análise
              </p>
              <div className='p-1.5 bg-amber-50 rounded-lg text-amber-600 group-hover:scale-110 transition-transform'>
                <Clock className='w-4 h-4' />
              </div>
            </div>
            <p className='text-[34px] font-black text-[#0a192f] tracking-tight leading-none mb-1'>
              {metrics.geral.analysis}
            </p>
            <p className='text-[10px] font-bold text-gray-400'>aguardando proposta</p>
          </div>

          {/* 3. Proposta Formulada */}
          <div
            onClick={() => handleDrillDown('Proposta Formulada')}
            className='bg-white group p-5 rounded-xl border border-gray-200 border-l-4 border-l-blue-600 shadow-sm hover:shadow-md cursor-pointer transition-all'
          >
            <div className='flex justify-between items-start mb-3'>
              <p className='text-[10px] text-gray-500 font-black uppercase tracking-widest'>
                Propostas
              </p>
              <div className='p-1.5 bg-blue-50 rounded-lg text-blue-600 group-hover:scale-110 transition-transform'>
                <FileSignature className='w-4 h-4' />
              </div>
            </div>
            <p className='text-[34px] font-black text-[#0a192f] tracking-tight leading-none mb-1'>
              {metrics.geral.proposal}
            </p>
            <p className='text-[10px] font-bold text-gray-400'>enviadas ao cliente</p>
          </div>

          {/* 4. Total Fotografia */}
          <div className='bg-[#0a192f] text-white p-5 rounded-xl shadow-md flex flex-col justify-between'>
            <div className='flex justify-between items-start mb-3'>
              <p className='text-[10px] text-gray-300 font-black uppercase tracking-widest'>
                Volume Total
              </p>
              <div className='p-1.5 bg-white/10 rounded-lg text-white'>
                <Layers className='w-4 h-4' />
              </div>
            </div>
            <div>
              <p className='text-[34px] font-black text-white tracking-tight leading-none mb-1'>
                {metrics.geral.active + metrics.geral.analysis + metrics.geral.proposal}
              </p>
              <p className='text-[10px] font-bold text-gray-400'>demandas ativas no momento</p>
            </div>
          </div>
        </div>
      </div>

      {/* Direita: Fotografia Financeira Total */}
      <div className='lg:col-span-7 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6 h-full flex flex-col'>

        {/* Header */}
        <div className='mb-6 pb-5 border-b border-gray-100'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='p-2 rounded-xl bg-[#0a192f] text-white shadow-lg'>
              <Camera className='w-5 h-5' />
            </div>
            <h2 className='text-[20px] font-black text-[#0a192f] tracking-tight'>
              Fotografia Financeira Total
            </h2>
          </div>
          <p className='text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-[48px]'>
            Visão consolidada de oportunidades e receita garantida
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-8 flex-1'>

          {/* Coluna Propostas Enviadas */}
          <div className="flex flex-col justify-between h-full">
            <div>
              <p className='text-[9px] font-black text-blue-600 uppercase tracking-widest mb-4'>
                Valores das Propostas Enviadas
              </p>
              <div className='space-y-3'>
                {/* Items */}
                <div className="flex justify-between items-baseline">
                  <span className='text-xs font-semibold text-gray-500'>Pró-labore</span>
                  <span className='text-[20px] font-black text-gray-700 tracking-tight'>
                    {formatMoney(metrics.geral.valorEmNegociacaoPL)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className='text-xs font-semibold text-gray-500'>Êxito Total</span>
                  <span className='text-[20px] font-black text-gray-700 tracking-tight'>
                    {formatMoney(metrics.geral.valorEmNegociacaoExito)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className='text-xs font-semibold text-gray-500'>Fixo Mensal</span>
                  <span className='text-[20px] font-black text-gray-700 tracking-tight'>
                    {formatMoney((metrics.geral as any).valorEmNegociacaoMensal || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className='text-xs font-semibold text-gray-500'>Outros Honorários</span>
                  <span className='text-[20px] font-black text-gray-700 tracking-tight'>
                    {formatMoney((metrics.geral as any).valorEmNegociacaoOutros || 0)}
                  </span>
                </div>

                {/* Total */}
                <div className='flex justify-between items-end border-t border-gray-200 pt-3 mt-4'>
                  <span className='text-[9px] font-black text-gray-500 uppercase tracking-widest'>
                    Total Geral
                  </span>
                  <span className='text-[24px] font-black text-[#1e3a8a] tracking-tight'>
                    {formatMoney(totalNegociacao)}
                  </span>
                </div>
              </div>
            </div>

            {/* Médias */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className='text-[9px] font-black text-gray-400 uppercase tracking-wider'>
                  Média Pró-labore (12m)
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {formatMoney(metrics.geral.mediaMensalNegociacaoPL)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className='text-[9px] font-black text-gray-400 uppercase tracking-wider'>
                  Média Êxito (12m)
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {formatMoney(metrics.geral.mediaMensalNegociacaoExito)}
                </span>
              </div>
            </div>
          </div>

          {/* Coluna Contratos Fechados */}
          <div className='md:border-l md:pl-8 border-gray-100 flex flex-col justify-between h-full'>
            <div>
              <p className='text-[9px] font-black text-green-600 uppercase tracking-widest mb-4'>
                Valores dos Contratos Fechados
              </p>
              <div className='space-y-3'>
                {/* Items */}
                <div className="flex justify-between items-baseline">
                  <span className='text-xs font-semibold text-gray-500'>Pró-labore</span>
                  <span className='text-[20px] font-black text-green-700 tracking-tight'>
                    {formatMoney(metrics.geral.totalFechadoPL)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className='text-xs font-semibold text-gray-500'>Êxito Total</span>
                  <span className='text-[20px] font-black text-green-700 tracking-tight'>
                    {formatMoney(metrics.geral.totalFechadoExito)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className='text-xs font-semibold text-gray-500'>Fixo Mensal</span>
                  <span className='text-[20px] font-black text-green-700 tracking-tight'>
                    {formatMoney(metrics.geral.receitaRecorrenteAtiva)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className='text-xs font-semibold text-gray-500'>Outros Honorários</span>
                  <span className='text-[20px] font-black text-green-700 tracking-tight'>
                    {formatMoney((metrics.geral as any).totalFechadoOutros || 0)}
                  </span>
                </div>

                {/* Total */}
                <div className='flex justify-between items-end border-t border-gray-200 pt-3 mt-4'>
                  <span className='text-[9px] font-black text-gray-500 uppercase tracking-widest'>
                    Total Geral
                  </span>
                  <span className='text-[24px] font-black text-green-700 tracking-tight'>
                    {formatMoney(totalCarteira)}
                  </span>
                </div>
              </div>
            </div>

            {/* Médias */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className='text-[9px] font-black text-gray-400 uppercase tracking-wider'>
                  Média Pró-labore (12m)
                </span>
                <span className="text-sm font-bold text-green-600">
                  {formatMoney(metrics.geral.mediaMensalCarteiraPL)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className='text-[9px] font-black text-gray-400 uppercase tracking-wider'>
                  Média Êxito (12m)
                </span>
                <span className="text-sm font-bold text-green-600">
                  {formatMoney(metrics.geral.mediaMensalCarteiraExito)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}