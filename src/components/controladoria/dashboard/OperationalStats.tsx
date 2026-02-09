import React from 'react';
import { Ban, FileSignature, CheckCircle2, AlertCircle, Percent, TrendingDown } from 'lucide-react';

interface OperationalStatsProps {
  rejectionData: {
    reasons: any[];
    sources: any[];
  };
  metrics: any;
}

export function OperationalStats({ rejectionData, metrics }: OperationalStatsProps) {
  // Cálculo de Assinatura mantido integralmente
  const totalAssinaturasCalculo = (metrics?.geral?.assinados || 0) + (metrics?.geral?.naoAssinados || 0);
  const percentualSemAssinatura = totalAssinaturasCalculo > 0 
    ? ((metrics?.geral?.naoAssinados || 0) / totalAssinaturasCalculo) * 100 
    : 0;

  return (
    <>
      {/* --- ANÁLISE DE REJEIÇÕES --- */}
      <div className='bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all p-8'>
        
        {/* Header Manager Style */}
        <div className='mb-8 pb-6 border-b border-gray-50'>
          <div className='flex items-center gap-4 mb-2'>
            <div className='p-3 rounded-2xl bg-[#0a192f] text-white shadow-xl'>
              <Ban className='w-6 h-6 text-red-500' />
            </div>
            <div>
              <h2 className='text-sm font-black text-[#0a192f] uppercase tracking-[0.3em]'>
                Inteligência de Rejeições
              </h2>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Mapeamento de perdas e origens de declínio comercial
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Por Motivo */}
          <div className="bg-gray-50/50 rounded-[1.5rem] p-6 border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <h4 className="text-[10px] font-black text-[#0a192f] uppercase tracking-[0.2em]">
                Segmentação por Causa
              </h4>
            </div>
            
            <div className="space-y-5">
              {rejectionData.reasons.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Base de dados vazia</p>
                </div>
              ) : (
                rejectionData.reasons.map((item, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-[11px] font-black text-[#0a192f] uppercase tracking-tighter truncate flex-1" title={item.label}>
                        {item.label}
                      </span>
                      <div className="flex items-baseline gap-2 ml-4">
                        <span className="text-xs font-black text-red-600 tracking-tighter">
                          {item.value}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">
                          {item.percent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden shadow-inner">
                      <div 
                        className="bg-red-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(239,68,68,0.3)]" 
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quem Rejeitou */}
          <div className="bg-gray-50/50 rounded-[1.5rem] p-6 border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h4 className="text-[10px] font-black text-[#0a192f] uppercase tracking-[0.2em]">
                Origem da Decisão
              </h4>
            </div>
            
            <div className="space-y-5">
              {rejectionData.sources.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Base de dados vazia</p>
                </div>
              ) : (
                rejectionData.sources.map((item, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-[11px] font-black text-[#0a192f] uppercase tracking-tighter truncate flex-1" title={item.label}>
                        {item.label}
                      </span>
                      <div className="flex items-baseline gap-2 ml-4">
                        <span className="text-xs font-black text-[#0a192f] tracking-tighter">
                          {item.value}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">
                          {item.percent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden shadow-inner">
                      <div 
                        className="bg-[#0a192f] h-full rounded-full transition-all duration-1000 ease-out" 
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
      <div className='bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all p-8'>
        
        {/* Header Manager Style */}
        <div className='mb-8 pb-6 border-b border-gray-50'>
          <div className='flex items-center gap-4 mb-2'>
            <div className='p-3 rounded-2xl bg-[#0a192f] text-white shadow-xl'>
              <FileSignature className='w-6 h-6 text-amber-500' />
            </div>
            <div>
              <h2 className='text-sm font-black text-[#0a192f] uppercase tracking-[0.3em]'>
                Rastreamento de Assinaturas
              </h2>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Controle de integridade física dos instrumentos contratuais
              </p>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          
          {/* Card 1: Assinados */}
          <div className='bg-emerald-600 p-6 rounded-[1.5rem] border border-white/10 shadow-xl hover:scale-[1.02] transition-all group overflow-hidden relative'>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
            <div className='flex items-start justify-between mb-6 relative z-10'>
              <div className='flex-1'>
                <p className='text-[9px] text-emerald-100 font-black uppercase tracking-[0.2em] mb-4 opacity-80'>
                  Liquidados
                </p>
                <p className='text-4xl font-black text-white tracking-tighter leading-none'>
                  {metrics.geral.assinados}
                </p>
              </div>
              <div className='p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner'>
                <CheckCircle2 className='w-6 h-6 text-white' />
              </div>
            </div>
            <div className='pt-4 border-t border-white/10 relative z-10'>
              <p className='text-[9px] text-white font-black uppercase tracking-widest leading-tight'>
                Documentação Confirmada
              </p>
            </div>
          </div>
          
          {/* Card 2: Pendentes */}
          <div className='bg-[#0a192f] p-6 rounded-[1.5rem] border border-white/10 shadow-xl hover:scale-[1.02] transition-all group overflow-hidden relative'>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl"></div>
            <div className='flex items-start justify-between mb-6 relative z-10'>
              <div className='flex-1'>
                <p className='text-[9px] text-amber-500 font-black uppercase tracking-[0.2em] mb-4'>
                  Fluxo Pendente
                </p>
                <p className='text-4xl font-black text-white tracking-tighter leading-none'>
                  {metrics.geral.naoAssinados}
                </p>
              </div>
              <div className='p-3 bg-amber-500/20 backdrop-blur-md rounded-2xl shadow-inner border border-amber-500/20'>
                <AlertCircle className='w-6 h-6 text-amber-500' />
              </div>
            </div>
            <div className='pt-4 border-t border-white/5 relative z-10'>
              <p className='text-[9px] text-gray-400 font-black uppercase tracking-widest leading-tight'>
                Aguardando Protocolo Físico
              </p>
            </div>
          </div>

          {/* Card 3: Percentual */}
          <div className='bg-gray-100 p-6 rounded-[1.5rem] border border-gray-200 shadow-sm hover:scale-[1.02] transition-all group overflow-hidden relative'>
            <div className='flex items-start justify-between mb-6 relative z-10'>
              <div className='flex-1'>
                <p className='text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mb-4'>
                  Exposure Rate
                </p>
                <p className='text-4xl font-black text-[#0a192f] tracking-tighter leading-none'>
                  {percentualSemAssinatura.toFixed(1)}%
                </p>
              </div>
              <div className='p-3 bg-white rounded-2xl shadow-sm border border-gray-200'>
                <Percent className='w-6 h-6 text-[#0a192f]' />
              </div>
            </div>
            <div className='pt-4 border-t border-gray-200 relative z-10'>
              <p className='text-[9px] text-gray-500 font-black uppercase tracking-widest leading-tight'>
                Sobre o Portfólio Ativo
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}