import { useNavigate } from 'react-router-dom';
import {
  Camera, Clock, CheckCircle2, PieChart, FileSignature, HeartHandshake, XCircle
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
    <div className="flex flex-col gap-6">

      {/* Linha 1: Fotografia da Carteira Atual (Cards) */}
      <div className='bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6'>

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
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3'>

          {/* 1. Em Análise */}
          <div
            onClick={() => handleDrillDown('analysis')}
            className='bg-white group p-4 rounded-xl border border-gray-200 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-center'
          >
            <div className='flex justify-between items-start mb-2'>
              <p className='text-[9px] text-gray-500 font-black uppercase tracking-widest'>
                Sob Análise
              </p>
              <div className='p-1.5 bg-amber-50 rounded-lg text-amber-600 group-hover:scale-110 transition-transform'>
                <Clock className='w-4 h-4' />
              </div>
            </div>
            <p className='text-[28px] font-black text-[#0a192f] tracking-tight leading-none mb-1'>
              {metrics.geral?.emAnalise || 0}
            </p>
            <p className='text-[9px] font-bold text-gray-400'>aguardando elaboração</p>
          </div>

          {/* 2. Propostas */}
          <div
            onClick={() => handleDrillDown('proposal')}
            className='bg-white group p-4 rounded-xl border border-gray-200 border-l-4 border-l-blue-600 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-center'
          >
            <div className='flex justify-between items-start mb-2'>
              <p className='text-[9px] text-gray-500 font-black uppercase tracking-widest'>
                Propostas
              </p>
              <div className='p-1.5 bg-blue-50 rounded-lg text-blue-600 group-hover:scale-110 transition-transform'>
                <FileSignature className='w-4 h-4' />
              </div>
            </div>
            <p className='text-[28px] font-black text-[#0a192f] tracking-tight leading-none mb-1'>
              {metrics.geral?.propostasAtivas || 0}
            </p>
            <p className='text-[9px] font-bold text-gray-400'>enviadas ao cliente</p>
          </div>

          {/* 3. Contratos Fechados */}
          <div
            onClick={() => handleDrillDown('active')}
            className='bg-white group p-4 rounded-xl border border-gray-200 border-l-4 border-l-green-600 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-center'
          >
            <div className='flex justify-between items-start mb-2'>
              <p className='text-[9px] text-gray-500 font-black uppercase tracking-widest'>
                Fechados
              </p>
              <div className='p-1.5 bg-green-50 rounded-lg text-green-600 group-hover:scale-110 transition-transform'>
                <CheckCircle2 className='w-4 h-4' />
              </div>
            </div>
            <p className='text-[28px] font-black text-[#0a192f] tracking-tight leading-none mb-1'>
              {metrics.geral?.fechados || 0}
            </p>
            <p className='text-[9px] font-bold text-gray-400'>casos em andamento</p>
          </div>

          {/* 4. Rejeitados */}
          <div
            onClick={() => handleDrillDown('rejected')}
            className='bg-white group p-4 rounded-xl border border-gray-200 border-l-4 border-l-red-600 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-center'
          >
            <div className='flex justify-between items-start mb-2'>
              <p className='text-[9px] text-gray-500 font-black uppercase tracking-widest'>
                Rejeitados
              </p>
              <div className='p-1.5 bg-red-50 rounded-lg text-red-600 group-hover:scale-110 transition-transform'>
                <XCircle className='w-4 h-4' />
              </div>
            </div>
            <p className='text-[28px] font-black text-[#0a192f] tracking-tight leading-none mb-1'>
              {metrics.geral?.rejeitados || 0}
            </p>
            <p className='text-[9px] font-bold text-gray-400'>propostas não aceitas</p>
          </div>

          {/* 5. Probono */}
          <div
            onClick={() => handleDrillDown('probono')}
            className='bg-white group p-4 rounded-xl border border-gray-200 border-l-4 border-l-purple-600 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-center'
          >
            <div className='flex justify-between items-start mb-2'>
              <p className='text-[9px] text-gray-500 font-black uppercase tracking-widest'>
                Probono
              </p>
              <div className='p-1.5 bg-purple-50 rounded-lg text-purple-600 group-hover:scale-110 transition-transform'>
                <HeartHandshake className='w-4 h-4' />
              </div>
            </div>
            <p className='text-[28px] font-black text-[#0a192f] tracking-tight leading-none mb-1'>
              {metrics.geral?.probono || 0}
            </p>
            <p className='text-[9px] font-bold text-gray-400'>serviço gratuito</p>
          </div>

        </div>
      </div>

      {/* Linha 2: Fotografia Financeira Total */}
      <div className='bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6'>

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