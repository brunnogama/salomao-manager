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
      <div className='relative pt-8 pb-32'>
        <div className='hidden md:block absolute top-[92px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-indigo-200 via-blue-200 to-green-200 z-0 -translate-y-1/2'></div>

        <div className='grid grid-cols-1 md:grid-cols-5 gap-4 items-center relative z-10'>

          {/* Etapa 1 - Prospects */}
          <div className='md:col-span-1 flex flex-col items-center group relative'>
            <div className='bg-white w-full h-[120px] p-5 rounded-2xl border border-gray-200 border-x-4 border-x-indigo-600 shadow-sm flex flex-col items-center justify-center group-hover:shadow-md transition-all relative'>
              <div className='w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center absolute -top-3 left-1/2 -translate-x-1/2 border-4 border-white shadow-sm text-[10px]'>
                1
              </div>
              <p className='text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 mt-1'>
                Prospects
              </p>
              <p className='text-[32px] font-black text-[#0a192f] tracking-tight leading-none'>
                {funil.totalEntrada}
              </p>
            </div>

            {/* Linhas conectando Prospects direto para Rejeitadas (Desktop) */}
            <div className='hidden md:block absolute w-[2px] h-[52px] bg-gradient-to-b from-indigo-200 to-red-200 left-1/2 top-[120px] z-0'></div>
            <div className='hidden md:block absolute h-[2px] w-[calc(150%+32px)] bg-red-200 left-1/2 top-[172px] z-0'></div>
            <div className='hidden md:block absolute border-y-[4px] border-y-transparent border-l-[6px] border-l-red-200 left-[calc(200%+32px)] top-[169px] z-0'></div>

            {/* Seta Móvel */}
            <div className='md:hidden text-indigo-300 my-2'>
              <ArrowRight className='w-6 h-6 rotate-90' />
            </div>
          </div>

          {/* Conversão 1 -> 2 */}
          <div className='md:col-span-1 flex flex-col items-center justify-center relative h-full'>

            {/* Secção Superior: Texo Acima da Linha */}
            <div className='absolute bottom-[calc(50%+24px)] w-full text-center'>
              <div className='text-[10px] font-black uppercase text-indigo-700 tracking-wider bg-white/80 py-1 px-2 rounded-md inline-block'>
                {funil.taxaConversaoProposta}% Avançam
              </div>
            </div>

            {/* Centro: Seta no Meio da Linha */}
            <div className='w-10 h-10 bg-white rounded-full border-2 border-indigo-100 shadow-sm flex items-center justify-center text-indigo-400 z-10 my-4 md:my-0'>
              <ArrowRight className='w-5 h-5' />
            </div>

            {/* Secção Inferior: Texto Abaixo da Linha */}
            <div className='absolute top-[calc(50%+24px)] w-full flex justify-center'>
              <div className='flex items-center justify-center gap-1.5 text-gray-500 bg-white/80 py-1 px-2 rounded-md'>
                <Clock className='w-3 h-3' />
                <span className='text-[10px] font-bold text-[#112240]'>
                  {funil.tempoMedioProspectProposta} dias
                </span>
              </div>
            </div>
          </div>

          {/* Etapa 2 - Propostas + Rejeitadas  */}
          <div className='md:col-span-1 flex flex-col items-center relative w-full h-[120px]'>

            {/* Propostas */}
            <div className='bg-white w-full h-full p-5 rounded-2xl border border-gray-200 border-x-4 border-x-blue-600 shadow-sm flex flex-col items-center justify-center group-hover:shadow-md transition-all relative z-10'>
              <div className='w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center absolute -top-3 left-1/2 -translate-x-1/2 border-4 border-white shadow-sm text-[10px]'>
                2
              </div>
              <p className='text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 mt-1'>
                Propostas
              </p>
              <p className='text-[32px] font-black text-[#0a192f] tracking-tight leading-none'>
                {funil.qualificadosProposta}
              </p>
            </div>

            {/* Seta Móvel */}
            <div className='md:hidden text-blue-300 my-2'>
              <ArrowRight className='w-6 h-6 rotate-90' />
            </div>

            {/* Rejeitadas (Abaixo de Propostas) */}
            <div className='md:absolute md:top-[140px] md:left-0 md:right-0 bg-[#fef2f2] w-full p-3 rounded-xl border border-red-100 shadow-sm text-center flex flex-col justify-center opacity-90 mt-4 md:mt-0 z-10 hover:shadow-md transition-all'>
              <p className='text-[9px] font-black text-red-600 uppercase tracking-[0.2em] mb-1'>
                Rejeitadas
              </p>
              <p className='text-[20px] font-black text-red-700 tracking-tight leading-none'>
                {funil.perdaAnalise + funil.perdaNegociacao}
              </p>
            </div>
          </div>

          {/* Conversão 2 -> 3 */}
          <div className='md:col-span-1 flex flex-col items-center justify-center relative h-full'>

            {/* Secção Superior: Texo Acima da Linha */}
            <div className='absolute bottom-[calc(50%+24px)] w-full text-center'>
              <div className='text-[10px] font-black uppercase text-blue-700 tracking-wider bg-white/80 py-1 px-2 rounded-md inline-block'>
                {funil.taxaConversaoFechamento}% Fecham
              </div>
            </div>

            {/* Centro: Seta no Meio da Linha */}
            <div className='w-10 h-10 bg-white rounded-full border-2 border-blue-100 shadow-sm flex items-center justify-center text-blue-400 z-10 my-4 md:my-0'>
              <ArrowRight className='w-5 h-5' />
            </div>

            {/* Secção Inferior: Texto Abaixo da Linha */}
            <div className='absolute top-[calc(50%+24px)] w-full flex justify-center'>
              <div className='flex items-center justify-center gap-1.5 text-gray-500 bg-white/80 py-1 px-2 rounded-md'>
                <Clock className='w-3 h-3' />
                <span className='text-[10px] font-bold text-[#112240]'>
                  {funil.tempoMedioPropostaFechamento} dias
                </span>
              </div>
            </div>
          </div>

          {/* Etapas Finais - Fechados */}
          <div className='md:col-span-1 flex flex-col items-center relative w-full h-[120px]'>
            {/* Fechados */}
            <div className='bg-[#f2fdf5] w-full h-full p-5 rounded-2xl border border-green-200 shadow-sm flex flex-col items-center justify-center group hover:shadow-md transition-all relative border-x-4 border-x-green-500 z-10'>
              <div className='w-6 h-6 rounded-full bg-green-500 text-white font-bold flex items-center justify-center absolute -top-3 left-1/2 -translate-x-1/2 border-4 border-[#f2fdf5] shadow-sm text-[10px]'>
                3
              </div>
              <p className='text-[10px] font-black text-green-700 uppercase tracking-[0.2em] mb-1 mt-1'>
                Fechados
              </p>
              <p className='text-[32px] font-black text-[#0a192f] tracking-tight leading-none'>
                {funil.fechados}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}