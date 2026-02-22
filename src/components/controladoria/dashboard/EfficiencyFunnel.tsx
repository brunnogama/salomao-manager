import { ArrowRight, Clock, TrendingDown } from 'lucide-react';

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

      {/* Funil visualmente conectado */}
      <div className='relative pt-6 pb-2'>
        {/* Linha conectora de fluxo de fundo (apenas visível em displays maiores) */}
        <div className='hidden md:block absolute top-[68px] left-[10%] right-[10%] h-2 bg-gradient-to-r from-indigo-100 via-blue-100 to-green-100 rounded-full z-0'></div>

        <div className='grid grid-cols-1 md:grid-cols-5 gap-4 items-start relative z-10'>

          {/* Etapa 1 - Prospects */}
          <div className='md:col-span-1 flex flex-col items-center group relative mt-4'>
            <div className='bg-white w-full p-5 rounded-2xl border border-gray-200 border-x-4 border-x-indigo-600 shadow-sm text-center group-hover:shadow-md transition-all relative'>
              <div className='w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center absolute -top-4 left-1/2 -translate-x-1/2 border-4 border-white shadow-sm text-xs'>
                1
              </div>
              <p className='text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 mt-2'>
                Prospects
              </p>
              <p className='text-[30px] font-black text-[#0a192f] tracking-tight leading-none'>
                {funil.totalEntrada}
              </p>
            </div>
            {/* Seta Móvel */}
            <div className='md:hidden text-indigo-300 my-2'>
              <ArrowRight className='w-6 h-6 rotate-90' />
            </div>
          </div>

          {/* Conversão 1 -> 2 */}
          <div className='md:col-span-1 flex flex-col items-center justify-start pt-[44px] space-y-2 relative'>
            <div className='hidden md:flex w-10 h-10 bg-white rounded-full border border-indigo-100 shadow-sm items-center justify-center text-indigo-400 mb-1 z-10'>
              <ArrowRight className='w-5 h-5' />
            </div>

            {/* Taxa de Conversão */}
            <div className='text-[10px] font-black uppercase text-indigo-700 tracking-wider'>
              {funil.taxaConversaoProposta}% Avançam
            </div>

            {/* Linha Fina Central */}
            <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-200 to-transparent my-2'></div>

            {/* Tempo Médio */}
            <div className='flex items-center gap-1.5 text-gray-500'>
              <Clock className='w-3 h-3' />
              <span className='text-[10px] font-bold text-[#112240]'>
                {funil.tempoMedioProspectProposta} dias
              </span>
            </div>
          </div>

          {/* Etapa 2 - Propostas */}
          <div className='md:col-span-1 flex flex-col items-center group relative mt-4'>
            <div className='bg-white w-full p-5 rounded-2xl border border-gray-200 border-x-4 border-x-blue-600 shadow-sm text-center group-hover:shadow-md transition-all relative'>
              <div className='w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center absolute -top-4 left-1/2 -translate-x-1/2 border-4 border-white shadow-sm text-xs'>
                2
              </div>
              <p className='text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 mt-2'>
                Propostas
              </p>
              <p className='text-[30px] font-black text-[#0a192f] tracking-tight leading-none'>
                {funil.qualificadosProposta}
              </p>
            </div>
            {/* Seta Móvel */}
            <div className='md:hidden text-blue-300 my-2'>
              <ArrowRight className='w-6 h-6 rotate-90' />
            </div>
          </div>

          {/* Conversão 2 -> 3 */}
          <div className='md:col-span-1 flex flex-col items-center justify-start pt-[44px] space-y-2 relative'>
            <div className='hidden md:flex w-10 h-10 bg-white rounded-full border border-blue-100 shadow-sm items-center justify-center text-blue-400 mb-1 z-10'>
              <ArrowRight className='w-5 h-5' />
            </div>

            {/* Taxa de Conversão */}
            <div className='text-[10px] font-black uppercase text-blue-700 tracking-wider'>
              {funil.taxaConversaoFechamento}% Fecham
            </div>

            {/* Linha Fina Central */}
            <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-blue-200 to-transparent my-2'></div>

            {/* Tempo Médio */}
            <div className='flex items-center gap-1.5 text-gray-500'>
              <Clock className='w-3 h-3' />
              <span className='text-[10px] font-bold text-[#112240]'>
                {funil.tempoMedioPropostaFechamento} dias
              </span>
            </div>
          </div>

          {/* Etapas Finais - Fechados e Rejeitados */}
          <div className='md:col-span-1 flex flex-col gap-4 h-full justify-start relative mt-4'>
            {/* Fechados */}
            <div className='bg-[#f2fdf5] w-full p-5 rounded-2xl border border-green-200 shadow-sm text-center group hover:shadow-md transition-all relative flex flex-col justify-center border-x-4 border-x-green-500'>
              <div className='w-8 h-8 rounded-full bg-green-500 text-white font-bold flex items-center justify-center absolute -top-4 left-1/2 -translate-x-1/2 border-4 border-[#f2fdf5] shadow-sm text-xs'>
                3
              </div>
              <p className='text-[10px] font-black text-green-700 uppercase tracking-[0.2em] mb-1 mt-2'>
                Fechados
              </p>
              <p className='text-[30px] font-black text-[#0a192f] tracking-tight leading-none'>
                {funil.fechados}
              </p>
            </div>

            {/* Rejeitados Totais */}
            <div className='bg-[#fef2f2] w-full p-4 rounded-xl border border-red-100 shadow-sm text-center flex flex-col justify-center opacity-90'>
              <p className='text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mb-1'>
                Rejeitadas
              </p>
              <p className='text-[20px] font-black text-red-700 tracking-tight leading-none'>
                {funil.perdaAnalise + funil.perdaNegociacao}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}