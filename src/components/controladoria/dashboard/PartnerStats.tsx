import React from 'react';
import { Briefcase, Banknote, TrendingUp, Users } from 'lucide-react';
import { formatMoney } from './dashboardHelpers';

interface PartnerStatsProps {
  contractsByPartner: any[];
}

export function PartnerStats({ contractsByPartner }: PartnerStatsProps) {
  return (
    <>
      {/* 7. CONTRATOS POR SÓCIO - MANAGER STYLE */}
      <div className='bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all p-8'>
        
        {/* Header */}
        <div className='mb-8 pb-6 border-b border-gray-50'>
          <div className='flex items-center gap-4 mb-2'>
            <div className='p-3 rounded-2xl bg-[#0a192f] text-white shadow-xl'>
              <Briefcase className='w-6 h-6 text-amber-500' />
            </div>
            <div>
              <h2 className='text-sm font-black text-[#0a192f] uppercase tracking-[0.3em]'>
                Portfólio por Sócio
              </h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Distribuição quantitativa por estágio de contrato
              </p>
            </div>
          </div>
        </div>

        {/* Grid de Sócios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contractsByPartner.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base de dados indisponível</p>
            </div>
          ) : (
            contractsByPartner.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-[1.5rem] p-6 border border-gray-100 hover:shadow-xl hover:border-amber-200 transition-all group"
              >
                {/* Header do Card */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-50">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-[#0a192f] text-xs uppercase truncate mb-2 tracking-tight" title={item.name}>
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">
                        Market Share
                      </span>
                      <span className="text-xs font-black text-[#0a192f]">
                        {item.total} Casos
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Grid - Manager Typography */}
                <div className="grid grid-cols-2 gap-4">
                  {item.analysis > 0 && (
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Análise</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-amber-500 tracking-tighter">{item.analysis}</span>
                        <span className="text-[9px] font-bold text-gray-300">{Math.round((item.analysis / item.total) * 100)}%</span>
                      </div>
                    </div>
                  )}

                  {item.proposal > 0 && (
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Proposta</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-blue-600 tracking-tighter">{item.proposal}</span>
                        <span className="text-[9px] font-bold text-gray-300">{Math.round((item.proposal / item.total) * 100)}%</span>
                      </div>
                    </div>
                  )}

                  {item.active > 0 && (
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Ativo</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-emerald-600 tracking-tighter">{item.active}</span>
                        <span className="text-[9px] font-bold text-gray-300">{Math.round((item.active / item.total) * 100)}%</span>
                      </div>
                    </div>
                  )}

                  {item.rejected > 0 && (
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Retido</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-red-600 tracking-tighter">{item.rejected}</span>
                        <span className="text-[9px] font-bold text-gray-300">{Math.round((item.rejected / item.total) * 100)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 8. VISÃO FINANCEIRA POR SÓCIO */}
      <div className='bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all p-8'>
        
        {/* Header */}
        <div className='mb-8 pb-6 border-b border-gray-50'>
          <div className='flex items-center gap-4 mb-2'>
            <div className='p-3 rounded-2xl bg-[#0a192f] text-white shadow-xl'>
              <Banknote className='w-6 h-6 text-amber-500' />
            </div>
            <div>
              <h2 className='text-sm font-black text-[#0a192f] uppercase tracking-[0.3em]'>
                Performance Financeira por Sócio
              </h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Volume de honorários realizados e projeções
              </p>
            </div>
          </div>
        </div>

        {/* Grid de Sócios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contractsByPartner.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
              <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aguardando dados financeiros</p>
            </div>
          ) : (
            contractsByPartner.map((item: any, idx) => {
              const totalSocio = (item.pl || 0) + (item.exito || 0) + (item.fixo || 0);
              
              return (
                <div 
                  key={idx} 
                  className="bg-white rounded-[1.5rem] p-6 border border-gray-100 hover:shadow-xl hover:border-amber-200 transition-all group"
                >
                  {/* Header do Card */}
                  <div className="mb-6 pb-5 border-b border-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-black text-[#0a192f] text-xs uppercase truncate flex-1 tracking-tight" title={item.name}>
                        {item.name}
                      </h3>
                      <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest">
                        {item.active} Ativos
                      </span>
                    </div>
                    {/* Total Geral */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">
                        Receita Acumulada
                      </span>
                      <span className="text-2xl font-black text-[#0a192f] tracking-tighter">
                        {formatMoney(totalSocio)}
                      </span>
                    </div>
                  </div>

                  {/* Breakdown Financeiro - Manager Style */}
                  <div className="space-y-1">
                    {(item.pl || 0) > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#0a192f]"></div>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em]">
                            Pró-labore
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-black text-[#0a192f]">
                            {formatMoney(item.pl || 0)}
                          </span>
                          <span className="text-[8px] font-bold text-gray-300">
                            {Math.round(((item.pl || 0) / totalSocio) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {(item.exito || 0) > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em]">
                            Êxito
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-black text-emerald-700">
                            {formatMoney(item.exito || 0)}
                          </span>
                          <span className="text-[8px] font-bold text-gray-300">
                            {Math.round(((item.exito || 0) / totalSocio) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {(item.fixo || 0) > 0 && (
                      <div className="flex justify-between items-center py-2 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em]">
                            Fixo Mensal
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-black text-blue-600">
                            {formatMoney(item.fixo || 0)}
                          </span>
                          <span className="text-[8px] font-bold text-gray-300">
                            {Math.round(((item.fixo || 0) / totalSocio) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}