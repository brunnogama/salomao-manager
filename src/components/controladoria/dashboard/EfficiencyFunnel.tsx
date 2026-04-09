import { Clock, XCircle, CheckCircle2, FileText, Users, TrendingDown, Lightbulb, Search } from 'lucide-react';
import { CopyChartButton } from '../ui/CopyChartButton';

interface EfficiencyFunnelProps {
  funil: any;
  evolucaoMensal?: any[];
  periodLabel: string;
}

export function EfficiencyFunnel({ funil, evolucaoMensal, periodLabel }: EfficiencyFunnelProps) {
  const emAnalise = funil.emAnalise || 0;
  const emNegociacao = funil.emNegociacao || 0;

  const mesesCount = evolucaoMensal && evolucaoMensal.length > 0 ? evolucaoMensal.length : 1;
  const mediaEntrada = (funil.totalEntrada / mesesCount).toFixed(1);
  const totalRejeitadas = funil.perdaAnalise + (funil.perdaNegociacao || 0);
  const rejectPercent = funil.totalEntrada > 0 ? ((totalRejeitadas / funil.totalEntrada) * 100).toFixed(1) : '0';
  const analisePercent = funil.totalEntrada > 0 ? ((emAnalise / funil.totalEntrada) * 100).toFixed(1) : '0';

  return (
    <div id="chart-funil-captacao" className='bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all p-6 md:p-8 relative'>
      {/* Header */}
      <div className='mb-8 flex items-center justify-between border-b border-gray-100 pb-5'>
        <div className='flex items-center gap-4'>
          <div className='p-2.5 rounded-xl bg-gradient-to-br from-[#0a192f] to-[#112240] text-white shadow-md'>
            <TrendingDown className='w-6 h-6' />
          </div>
          <div>
            <h2 className='text-[22px] font-black text-[#0a192f] tracking-tight'>
              Funil de Captação Jurídica
            </h2>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              Conversão e Ciclo de Vida
            </p>
          </div>
        </div>

        <CopyChartButton targetId="chart-funil-captacao" />
      </div>

      {/* Explicação Dinâmica */}
      <div className="mb-8 bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-[13px] text-blue-900 leading-relaxed shadow-sm flex gap-3 items-start">
        <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          {funil.totalEntrada === 0 ? (
            `No período de ${periodLabel}, não recebemos nenhum prospect.`
          ) : (
            <>
              <p>Neste período analisado (<strong>{periodLabel}</strong>), a operação do escritório consolidou as seguintes movimentações isoladas: recebemos <strong>{funil.totalEntrada} {funil.totalEntrada === 1 ? 'novo prospect' : 'novos prospects'}</strong> em nosso radar, e enviamos <strong>{funil.qualificadosProposta}</strong> {funil.qualificadosProposta === 1 ? 'nova proposta jurídica' : 'novas propostas jurídicas'}. Simultaneamente, dentro deste mesmo limite de datas, confirmamos a assinatura de <strong>{funil.fechados}</strong> {funil.fechados === 1 ? 'novo contrato' : 'novos contratos'}. Quanto à carteira retida e ativa gerada, possuímos atualmente <strong>{emAnalise}</strong> {emAnalise === 1 ? 'caso' : 'casos'} sob análise interna, e <strong>{emNegociacao}</strong> {emNegociacao === 1 ? 'proposta viva' : 'propostas vivas'} com os clientes, {funil.perdaNegociacao > 0 || funil.perdaAnalise > 0 ? <>sendo que <strong>{funil.perdaAnalise + funil.perdaNegociacao}</strong> negócios no total não vingaram no período.</> : 'sem registrar nenhuma interrupção oficial de negócios no horizonte atual.'}</p>
              <p className="mt-2 text-[11px] text-blue-600/80 italic border-t border-blue-100/50 pt-2">
                *Nota: As métricas acima retratam a movimentação consolidada do período em volumes absolutos. Como a captação jurídica engloba trâmites de trato contínuo (ex: o fechamento atual de honorários oriundos de consultas de anos anteriores), as etapas contabilizam as atividades de forma autônoma e não representam deduções percentuais de uma mesma safra de entrada.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Grid Layout Principal do Pipeline */}
      <div className='relative w-full max-w-6xl mx-auto'>

        {/* Cards principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10 w-full mb-12">

          {/* ETAPA 1: START - PROSPECTS */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-center border-t-4 border-t-amber-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-amber-900 uppercase tracking-widest">Prospects</h3>
            </div>
            <div className="flex flex-col gap-0.5 mt-2 ml-1">
              <span className="text-4xl font-black text-[#0a192f] tracking-tighter leading-none">{funil.totalEntrada}</span>
              <span className="text-xs font-bold text-gray-400">análises totais</span>
            </div>

            <div className="mt-4 pt-4 border-t border-amber-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block mb-0.5">Média Mensal</span>
                <span className="text-lg font-black text-amber-600 leading-none">{mediaEntrada}</span>
              </div>
            </div>
          </div>

          {/* ETAPA 2: SOB ANÁLISE */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-center border-t-4 border-t-indigo-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Search className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Sob Análise</h3>
            </div>
            <div className="flex flex-col gap-0.5 mt-2 ml-1">
              <span className="text-4xl font-black text-[#0a192f] tracking-tighter leading-none">{emAnalise}</span>
              <span className="text-xs font-bold text-gray-400">casos em andamento</span>
            </div>

            <div className="mt-4 pt-4 border-t border-indigo-50 flex items-end justify-between gap-1">
              <div>
                <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider block mb-0.5">Proporção Local</span>
                <span className="text-xl font-black text-indigo-600 leading-none">
                  {analisePercent}%
                </span>
              </div>
              <div className="w-[55%] flex flex-col justify-end">
                <span className="text-[8px] font-bold text-indigo-500 text-right block mb-1 whitespace-nowrap">do total de análises</span>
                <div className="h-1.5 w-full bg-indigo-50 rounded-full overflow-hidden shrink-0">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${analisePercent}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* ETAPA 3: PROPOSTAS */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-center border-t-4 border-t-blue-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest">Propostas</h3>
            </div>
            <div className="flex flex-col gap-0.5 mt-2 ml-1">
              <span className="text-4xl font-black text-[#0a192f] tracking-tighter leading-none">{funil.qualificadosProposta}</span>
              <span className="text-xs font-bold text-gray-400">enviadas</span>
            </div>

            <div className="mt-4 pt-4 border-t border-blue-50 flex items-end justify-between gap-1">
              <div>
                <span className="text-[9px] font-black text-blue-700 uppercase tracking-wider block mb-0.5">Conversão Local</span>
                <span className="text-xl font-black text-blue-600 leading-none">
                  {funil.taxaConversaoProposta}%
                </span>
              </div>
              <div className="w-[55%] flex flex-col justify-end">
                <span className="text-[8px] font-bold text-blue-500 text-right block mb-1 whitespace-nowrap">do total de análises</span>
                <div className="h-1.5 w-full bg-blue-50 rounded-full overflow-hidden shrink-0">
                  <div className="h-full bg-blue-400 rounded-full transition-all duration-1000" style={{ width: `${funil.taxaConversaoProposta}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* ETAPA 4: FECHADOS */}
          <div className="bg-[#f8fdf9] border border-green-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-green-300 transition-all flex flex-col justify-center border-t-4 border-t-green-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-green-800 uppercase tracking-widest">Fechados</h3>
            </div>
            <div className="flex flex-col gap-0.5 mt-2 ml-1">
              <span className="text-4xl font-black text-[#0a192f] tracking-tighter leading-none">{funil.fechados}</span>
              <span className="text-xs font-bold text-gray-400">contratos assinados</span>
            </div>

            <div className="mt-4 pt-4 border-t border-green-100 flex items-end justify-between gap-1">
              <div>
                <span className="text-[9px] font-black text-green-700 uppercase tracking-wider block mb-0.5">Conversão Global</span>
                <span className="text-xl font-black text-green-600 leading-none">
                  {funil.totalEntrada > 0 ? ((funil.fechados / funil.totalEntrada) * 100).toFixed(1) : '0'}%
                </span>
              </div>
              <div className="w-[55%] flex flex-col justify-end">
                <span className="text-[8px] font-bold text-green-500 text-right block mb-1 whitespace-nowrap">do total de análises</span>
                <div className="h-1.5 w-full bg-green-100 rounded-full overflow-hidden shrink-0">
                  <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${funil.totalEntrada > 0 ? (funil.fechados / funil.totalEntrada) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* ETAPA 5: REJEITADAS */}
          <div className="bg-white border border-red-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-red-300 transition-all flex flex-col justify-center border-t-4 border-t-red-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <XCircle className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-red-900 uppercase tracking-widest">Rejeitadas</h3>
            </div>
            <div className="flex flex-col gap-0.5 mt-2 ml-1">
              <span className="text-4xl font-black text-[#0a192f] tracking-tighter leading-none">{totalRejeitadas}</span>
              <span className="text-xs font-bold text-gray-400">prospects rejeitados</span>
            </div>

            <div className="mt-4 pt-4 border-t border-red-50 flex items-end justify-between gap-1">
              <div>
                <span className="text-[9px] font-black text-red-700 uppercase tracking-wider block mb-0.5">Taxa de Rejeição</span>
                <span className="text-xl font-black text-red-600 leading-none">
                  {rejectPercent}%
                </span>
              </div>
              <div className="w-[55%] flex flex-col justify-end">
                <span className="text-[8px] font-bold text-red-400 text-right block mb-1 whitespace-nowrap">do total de análises</span>
                <div className="h-1.5 w-full bg-red-50 rounded-full overflow-hidden shrink-0">
                  <div className="h-full bg-red-500 rounded-full transition-all duration-1000" style={{ width: `${rejectPercent}%` }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* SECÇÃO EXTRA: CICLO DE VIDA (GLOBAL) DESAMARRADO */}
        <div className="mt-8 bg-gray-50/50 border border-gray-100 rounded-2xl p-6 md:p-8">
          <div className="mb-8 text-center">
            <h3 className="text-lg font-black text-[#0a192f] tracking-tight">Ciclo de Vida Global Histórico</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Tempo médio de resposta independente de período</p>
          </div>

          {/* Timeline do Ciclo Médio */}
          <div className="relative flex items-center justify-between w-full max-w-3xl mx-auto px-4 sm:px-12">
            {/* Linha de fundo */}
            <div className="absolute left-8 sm:left-16 right-8 sm:right-16 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded-full z-0"></div>

            {/* Node 1: Prospects */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-500 ring-4 ring-amber-50"></div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest hidden sm:block">Entrada</span>
            </div>

            {/* Info 1 -> 2 */}
            <div className="relative z-10 flex flex-col items-center bg-white px-4 sm:px-5 py-2 rounded-xl border border-gray-100 shadow-sm text-center transform hover:-translate-y-0.5 transition-all">
              <div className="flex items-center gap-1.5 text-indigo-600 mb-0.5">
                <Clock className="w-4 h-4" />
                <span className="text-sm sm:text-base font-black">{funil.tempoMedioProspectProposta} dias</span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">Até Proposta</span>
            </div>

            {/* Node 2: Propostas */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-50"></div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest hidden sm:block">Propostas</span>
            </div>

            {/* Info 2 -> 3 */}
            <div className="relative z-10 flex flex-col items-center bg-white px-4 sm:px-5 py-2 rounded-xl border border-gray-100 shadow-sm text-center transform hover:-translate-y-0.5 transition-all">
              <div className="flex items-center gap-1.5 text-blue-600 mb-0.5">
                <Clock className="w-4 h-4" />
                <span className="text-sm sm:text-base font-black">{funil.tempoMedioPropostaFechamento} dias</span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">Até Fechar</span>
            </div>

            {/* Node 3: Fechados */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 ring-4 ring-green-50"></div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest hidden sm:block">Assinado</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}