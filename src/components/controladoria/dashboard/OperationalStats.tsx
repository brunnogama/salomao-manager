import React from 'react';
import { Ban, FileSignature, CheckCircle2, AlertCircle, Percent, TrendingDown, Lightbulb } from 'lucide-react';

interface OperationalStatsProps {
  rejectionData: {
    reasons: any[];
    sources: any[];
  };
  metrics: any;
}

export function OperationalStats({ rejectionData, metrics }: OperationalStatsProps) {
  // Cálculo de Assinatura
  const totalAssinaturasCalculo = (metrics?.geral?.assinados || 0) + (metrics?.geral?.naoAssinados || 0);
  const percentualSemAssinatura = totalAssinaturasCalculo > 0
    ? ((metrics?.geral?.naoAssinados || 0) / totalAssinaturasCalculo) * 100
    : 0;

  return (
    <>
      {/* --- ANÁLISE DE REJEIÇÕES --- */}
      <div className='bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6'>

        {/* Header */}
        <div className='mb-6 pb-5 border-b border-gray-100 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='p-2 rounded-xl bg-[#0a192f] text-white shadow-sm'>
              <Ban className='w-5 h-5' />
            </div>
            <div>
              <h2 className='text-[20px] font-black text-[#0a192f] tracking-tight'>
                Análise de Rejeições
              </h2>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                Motivos e origens dos casos declinados
              </p>
            </div>
          </div>
        </div>

        {/* Explicação Dinâmica */}
        <div className="mb-6 bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-[13px] text-blue-900 leading-relaxed shadow-sm flex gap-3 items-start">
          <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            {rejectionData.reasons.length === 0 ? (
              'Não há dados de propostas declinadas para análise.'
            ) : (
              <>
                Do total de propostas que não avançaram, a principal causa foi <strong>{rejectionData.reasons[0]?.label || 'não informada'}</strong>, representando <strong>{rejectionData.reasons[0]?.percent?.toFixed(1) || 0}%</strong> das recusas, sendo que a maior fonte de declínio partiu de <strong>{rejectionData.sources[0]?.label || 'não identificada'}</strong> (com <strong>{rejectionData.sources[0]?.percent?.toFixed(1) || 0}%</strong>).
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Por Motivo */}
          <div className="bg-white rounded-xl p-5 border border-red-100 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-100">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <h4 className="text-[11px] font-black text-red-600 uppercase tracking-[0.15em]">
                Por Motivo
              </h4>
            </div>

            <div className="space-y-4">
              {rejectionData.reasons.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm font-semibold text-gray-400">Nenhum dado disponível</p>
                </div>
              ) : (
                rejectionData.reasons.map((item, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-xs font-bold text-gray-700 flex-1 truncate" title={item.label}>
                        {item.label}
                      </span>
                      <div className="flex items-baseline gap-2 ml-2">
                        <span className="text-sm font-black text-red-600">
                          {item.value}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400">
                          {item.percent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-red-500 to-red-400 h-full rounded-full transition-all duration-300 group-hover:from-red-600 group-hover:to-red-500"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quem Rejeitou */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
              <AlertCircle className="w-4 h-4 text-gray-600" />
              <h4 className="text-[11px] font-black text-gray-600 uppercase tracking-[0.15em]">
                Quem Rejeitou
              </h4>
            </div>

            <div className="space-y-4">
              {rejectionData.sources.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm font-semibold text-gray-400">Nenhum dado disponível</p>
                </div>
              ) : (
                rejectionData.sources.map((item, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-xs font-bold text-gray-700 flex-1 truncate" title={item.label}>
                        {item.label}
                      </span>
                      <div className="flex items-baseline gap-2 ml-2">
                        <span className="text-sm font-black text-gray-700">
                          {item.value}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400">
                          {item.percent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-gray-500 to-gray-400 h-full rounded-full transition-all duration-300 group-hover:from-gray-600 group-hover:to-gray-500"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- STATUS DE ASSINATURA --- */}
      <div className='bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6'>

        {/* Header */}
        <div className='mb-6 pb-5 border-b border-gray-100 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='p-2 rounded-xl bg-[#0a192f] text-white shadow-sm'>
              <FileSignature className='w-5 h-5' />
            </div>
            <div>
              <h2 className='text-[20px] font-black text-[#0a192f] tracking-tight'>
                Status de Assinatura
              </h2>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                Contratos fechados
              </p>
            </div>
          </div>
        </div>

        {/* Explicação Dinâmica */}
        <div className="mb-6 bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-[13px] text-blue-900 leading-relaxed shadow-sm flex gap-3 items-start">
          <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            {totalAssinaturasCalculo === 0 ? (
              'Não há contratos fechados recentemente para análise de assinatura.'
            ) : (
              <>
                Dos <strong>{totalAssinaturasCalculo}</strong> contratos fechados recentemente, {metrics?.geral?.assinados === 0 ? 'nenhum teve assinatura física confirmada' : <><strong>{metrics?.geral?.assinados}</strong> já tiveram suas assinaturas físicas confirmadas</>}, enquanto {metrics?.geral?.naoAssinados === 0 ? 'não há contratos aguardando assinatura' : <><strong>{metrics?.geral?.naoAssinados}</strong> (cerca de <strong>{percentualSemAssinatura.toFixed(1)}%</strong>) ainda aguardam a conclusão dessa etapa</>}.
              </>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>

          {/* Card 1: Assinados */}
          <div className='bg-white p-5 rounded-xl border border-gray-200 border-l-4 border-l-green-600 shadow-sm hover:shadow-md transition-all'>
            <div className='flex items-start justify-between mb-4'>
              <div className='flex-1'>
                <p className='text-[9px] text-gray-500 font-black uppercase tracking-widest mb-3'>
                  Contratos Assinados
                </p>
                <p className='text-[30px] font-black text-[#0a192f] tracking-tight leading-none'>
                  {metrics.geral.assinados}
                </p>
              </div>
              <div className='p-2.5 bg-green-50 rounded-xl'>
                <CheckCircle2 className='w-6 h-6 text-green-600' />
              </div>
            </div>
            <div className='pt-3 border-t border-gray-100'>
              <p className='text-[9px] text-gray-400 font-semibold leading-tight'>
                Assinatura física confirmada
              </p>
            </div>
          </div>

          {/* Card 2: Pendentes */}
          <div className='bg-white p-5 rounded-xl border border-gray-200 border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all'>
            <div className='flex items-start justify-between mb-4'>
              <div className='flex-1'>
                <p className='text-[9px] text-gray-500 font-black uppercase tracking-widest mb-3'>
                  Pendentes
                </p>
                <p className='text-[30px] font-black text-[#0a192f] tracking-tight leading-none'>
                  {metrics.geral.naoAssinados}
                </p>
              </div>
              <div className='p-2.5 bg-orange-50 rounded-xl'>
                <AlertCircle className='w-6 h-6 text-orange-500' />
              </div>
            </div>
            <div className='pt-3 border-t border-gray-100'>
              <p className='text-[9px] text-gray-400 font-semibold leading-tight'>
                Aguardando assinatura física
              </p>
            </div>
          </div>

          {/* Card 3: Percentual */}
          <div className='bg-white p-5 rounded-xl border border-gray-200 border-l-4 border-l-gray-600 shadow-sm hover:shadow-md transition-all'>
            <div className='flex items-start justify-between mb-4'>
              <div className='flex-1'>
                <p className='text-[9px] text-gray-500 font-black uppercase tracking-widest mb-3'>
                  % Pendente
                </p>
                <p className='text-[30px] font-black text-[#0a192f] tracking-tight leading-none'>
                  {percentualSemAssinatura.toFixed(1)}%
                </p>
              </div>
              <div className='p-2.5 bg-gray-50 rounded-xl'>
                <Percent className='w-6 h-6 text-gray-600' />
              </div>
            </div>
            <div className='pt-3 border-t border-gray-100'>
              <p className='text-[9px] text-gray-400 font-semibold leading-tight'>
                Do total de contratos fechados
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}