import { Clock, ArrowRight, XCircle, CheckCircle2, FileText, Users, TrendingDown } from 'lucide-react';

interface EfficiencyFunnelProps {
  funil: any;
}

export function EfficiencyFunnel({ funil }: EfficiencyFunnelProps) {
  return (
    <div className='bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all p-6 md:p-8'>
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

        {/* Taxa de Sucesso Global */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Conversão Global</span>
          <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-100 font-bold text-sm shadow-sm flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            {funil.totalEntrada > 0 ? ((funil.fechados / funil.totalEntrada) * 100).toFixed(1) : '0'}%
          </div>
        </div>
      </div>

      {/* Grid Layout Principal do Pipeline */}
      <div className='relative w-full max-w-5xl mx-auto'>

        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6 lg:gap-2 relative z-10 w-full">

          {/* ETAPA 1: START - PROSPECTS */}
          <div className="flex-1 flex flex-col relative group">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm group-hover:shadow-md group-hover:border-indigo-200 transition-all z-20 relative h-full min-h-[140px] flex flex-col justify-center border-t-4 border-t-indigo-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Prospects</h3>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-0.5 mt-2 ml-1">
                  <span className="text-4xl font-black text-[#0a192f] tracking-tighter leading-none">{funil.totalEntrada}</span>
                  <span className="text-xs font-bold text-gray-400">análises</span>
                </div>
              </div>
            </div>

            {/* Drop-off Análise (Mobile: baixo, Desktop: em baixo do card) */}
            {funil.perdaAnalise > 0 && (
              <div className="mt-3 lg:absolute lg:-bottom-[80px] lg:left-4 lg:right-4 bg-red-50/50 border border-red-100/50 rounded-xl p-3 flex items-center justify-between text-red-800 z-10 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Rejeitadas</span>
                </div>
                <span className="text-sm font-black text-red-600">{funil.perdaAnalise}</span>
              </div>
            )}
          </div>

          {/* CONEXÃO 1 -> 2 */}
          <div className="hidden lg:flex flex-col items-center justify-center w-12 shrink-0 z-10 text-gray-300">
            <div className="bg-white border border-indigo-100 shadow-sm rounded-full px-2 py-1 mb-2 text-[10px] font-black text-indigo-600 uppercase tracking-wider whitespace-nowrap z-10">
              {funil.taxaConversaoProposta}%
            </div>
            <ArrowRight className="w-8 h-8 text-indigo-200" />
            <div className="flex items-center gap-1 mt-2 text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full z-10">
              <Clock className="w-3 h-3" />
              <span className="text-[10px] font-bold">{funil.tempoMedioProspectProposta}d</span>
            </div>
          </div>

          {/* Seta Mobile */}
          <div className="lg:hidden flex flex-col items-center justify-center py-4 text-gray-300">
            <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full mb-3">
              <span>{funil.taxaConversaoProposta}% convertem</span>
              <div className="w-1 h-1 rounded-full bg-gray-300"></div>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {funil.tempoMedioProspectProposta}d</span>
            </div>
            <ArrowRight className="w-5 h-5 rotate-90" />
          </div>

          {/* ETAPA 2: PROPOSTAS */}
          <div className="flex-1 flex flex-col relative group">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm group-hover:shadow-md group-hover:border-blue-200 transition-all z-20 relative h-full min-h-[140px] flex flex-col justify-center border-t-4 border-t-blue-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest">Propostas</h3>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-0.5 mt-2 ml-1">
                  <span className="text-4xl font-black text-[#0a192f] tracking-tighter leading-none">{funil.qualificadosProposta}</span>
                  <span className="text-xs font-bold text-gray-400">enviadas</span>
                </div>
              </div>

              {/* Barra de Progresso vs Entrada */}
              <div className="mt-2 text-right">
                <span className="text-[10px] font-bold text-blue-500">{funil.taxaConversaoProposta}% do total</span>
                <div className="h-1.5 w-full bg-blue-50 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full transition-all duration-1000" style={{ width: `${funil.taxaConversaoProposta}%` }}></div>
                </div>
              </div>
            </div>

            {/* Drop-off Negociação */}
            {funil.perdaNegociacao > 0 && (
              <div className="mt-3 lg:absolute lg:-bottom-[80px] lg:left-4 lg:right-4 bg-red-50/50 border border-red-100/50 rounded-xl p-3 flex items-center justify-between text-red-800 z-10 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Propostas Recusadas</span>
                </div>
                <span className="text-sm font-black text-red-600">{funil.perdaNegociacao}</span>
              </div>
            )}
          </div>

          {/* CONEXÃO 2 -> 3 */}
          <div className="hidden lg:flex flex-col items-center justify-center w-12 shrink-0 z-10 text-gray-300">
            <div className="bg-white border border-blue-100 shadow-sm rounded-full px-2 py-1 mb-2 text-[10px] font-black text-blue-600 uppercase tracking-wider whitespace-nowrap z-10">
              {funil.taxaConversaoFechamento}%
            </div>
            <ArrowRight className="w-8 h-8 text-blue-200" />
            <div className="flex items-center gap-1 mt-2 text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full z-10">
              <Clock className="w-3 h-3" />
              <span className="text-[10px] font-bold">{funil.tempoMedioPropostaFechamento}d</span>
            </div>
          </div>

          {/* Seta Mobile */}
          <div className="lg:hidden flex flex-col items-center justify-center py-4 text-gray-300">
            <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full mb-3">
              <span>{funil.taxaConversaoFechamento}% assinam</span>
              <div className="w-1 h-1 rounded-full bg-gray-300"></div>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {funil.tempoMedioPropostaFechamento}d</span>
            </div>
            <ArrowRight className="w-5 h-5 rotate-90" />
          </div>

          {/* ETAPA 3: FECHADOS */}
          <div className="flex-1 flex flex-col relative group">
            <div className="bg-[#f8fdf9] border border-green-200 rounded-2xl p-6 shadow-sm group-hover:shadow-md group-hover:border-green-300 transition-all z-20 relative h-full min-h-[140px] flex flex-col justify-center border-t-4 border-t-green-500 group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-green-800 uppercase tracking-widest">Contratos Fechados</h3>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-0.5 mt-2 ml-1">
                  <span className="text-4xl font-black text-[#0a192f] tracking-tighter leading-none">{funil.fechados}</span>
                  <span className="text-xs font-bold text-gray-400">assinados</span>
                </div>
              </div>

              {/* Barra de Progresso vs Entrada */}
              <div className="mt-2 text-right">
                <span className="text-[10px] font-bold text-green-500">{(funil.totalEntrada > 0 ? (funil.fechados / funil.totalEntrada) * 100 : 0).toFixed(1)}% do total</span>
                <div className="h-1.5 w-full bg-green-50 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${funil.totalEntrada > 0 ? (funil.fechados / funil.totalEntrada) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>

            {/* Tempo Médio Global (Opcional - Info Box) */}
            <div className="mt-3 lg:absolute lg:-bottom-[80px] lg:left-4 lg:right-4 bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center justify-between text-gray-600 z-10">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Ciclo Médio</span>
              </div>
              <span className="text-sm font-black text-[#0a192f]">{funil.tempoMedioProspectProposta + funil.tempoMedioPropostaFechamento}d</span>
            </div>
          </div>

        </div>

        {/* Helper visual para criar espaço para as boxes de drop-off no desktop */}
        <div className="hidden lg:block h-[100px] w-full pointer-events-none"></div>

      </div>
    </div>
  );
}