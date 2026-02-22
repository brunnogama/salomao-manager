import React, { useState } from 'react';
import { Briefcase, Banknote, TrendingUp, Users } from 'lucide-react';
import { formatMoney } from './dashboardHelpers';
import { PartnerDetailModal } from './PartnerDetailModal';

interface PartnerStatsProps {
  contractsByPartner: any[];
}

export function PartnerStats({ contractsByPartner }: PartnerStatsProps) {
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);

  return (
    <>
      <div className='bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6'>
        {/* Header */}
        <div className='mb-6 pb-5 border-b border-gray-100 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='p-2 rounded-xl bg-[#0a192f] text-white shadow-sm'>
              <Briefcase className='w-5 h-5' />
            </div>
            <div>
              <h2 className='text-[20px] font-black text-[#0a192f] tracking-tight'>
                Contratos por Sócio
              </h2>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                Visão Financeira e Distribuição por status
              </p>
            </div>
          </div>
        </div>

        {/* Grid de Sócios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contractsByPartner.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-400">Nenhum dado disponível</p>
            </div>
          ) : (
            [...contractsByPartner].sort((a, b) => {
              const totalA = (a.pl || 0) + (a.exito || 0) + (a.fixo || 0);
              const totalB = (b.pl || 0) + (b.exito || 0) + (b.fixo || 0);
              return totalB - totalA;
            }).map((item: any, idx) => {
              const totalSocio = (item.pl || 0) + (item.exito || 0) + (item.fixo || 0);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedPartner(item)}
                  className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-[#0a192f] hover:shadow-lg transition-all flex flex-col cursor-pointer group"
                >
                  <div className="p-5 flex-1 group-hover:bg-gray-50/30 transition-colors">
                    {/* Header do Card com Foto e Nome */}
                    <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.photo_url ? (
                          <img
                            src={item.photo_url}
                            alt={item.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white shrink-0 font-bold text-sm">
                            {item.name ? item.name.substring(0, 2).toUpperCase() : 'NA'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-black text-gray-800 text-sm truncate mb-1" title={item.name}>
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                              Total Honorários
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className="text-lg font-black text-[#1e3a8a] tracking-tight block">
                          {formatMoney(totalSocio)}
                        </span>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                          {item.active} Ativos
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Financeiro - Principal */}
                    <div className="space-y-3 mb-4">
                      {/* Pró-labore */}
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                            Pró-labore
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-black text-gray-800">
                            {formatMoney(item.pl || 0)}
                          </span>
                          {totalSocio > 0 && (
                            <span className="text-[9px] font-semibold text-gray-400">
                              {Math.round(((item.pl || 0) / totalSocio) * 100)}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Êxito */}
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                            Êxito
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-black text-gray-800">
                            {formatMoney(item.exito || 0)}
                          </span>
                          {totalSocio > 0 && (
                            <span className="text-[9px] font-semibold text-gray-400">
                              {Math.round(((item.exito || 0) / totalSocio) * 100)}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fixo */}
                      <div className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                            Fixo Mensal
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-black text-gray-800">
                            {formatMoney(item.fixo || 0)}
                          </span>
                          {totalSocio > 0 && (
                            <span className="text-[9px] font-semibold text-gray-400">
                              {Math.round(((item.fixo || 0) / totalSocio) * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé - Quantidades por Fase */}
                  <div className="bg-gray-50 p-4 border-t border-gray-100 rounded-b-xl flex-shrink-0">
                    <div className="flex justify-between items-center text-center">
                      <div className="flex flex-col flex-1" title={`${item.analysis} em Análise`}>
                        <span className="text-[10px] font-black text-amber-600 block mb-0.5">{item.analysis}</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Análise</span>
                      </div>
                      <div className="w-px h-6 bg-gray-200 mx-1"></div>
                      <div className="flex flex-col flex-1" title={`${item.proposal} em Proposta`}>
                        <span className="text-[10px] font-black text-blue-600 block mb-0.5">{item.proposal}</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Proposta</span>
                      </div>
                      <div className="w-px h-6 bg-gray-200 mx-1"></div>
                      <div className="flex flex-col flex-1" title={`${item.active} Fechados`}>
                        <span className="text-[10px] font-black text-green-600 block mb-0.5">{item.active}</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Fechados</span>
                      </div>
                      <div className="w-px h-6 bg-gray-200 mx-1"></div>
                      <div className="flex flex-col flex-1" title={`${item.rejected} Rejeitados`}>
                        <span className="text-[10px] font-black text-red-600 block mb-0.5">{item.rejected}</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Rej/Perda</span>
                      </div>
                      <div className="w-px h-6 bg-gray-200 mx-1"></div>
                      <div className="flex flex-col flex-1" title={`${item.probono} Probono`}>
                        <span className="text-[10px] font-black text-purple-600 block mb-0.5">{item.probono}</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Probono</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Detalhes do Sócio */}
      {selectedPartner && (
        <PartnerDetailModal
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
        />
      )}
    </>
  );
}