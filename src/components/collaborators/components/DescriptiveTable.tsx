// src/components/collaborators/components/DescriptiveTable.tsx

import { FileText } from 'lucide-react'
import { PresenceRecord } from '../types/presencial'
import { toTitleCase, normalizeKey } from '../utils/presencialUtils'

interface DescriptiveTableProps {
  descriptiveData: PresenceRecord[];
  socioMap: Map<string, string>;
}

export function DescriptiveTable({ descriptiveData, socioMap }: DescriptiveTableProps) {
  if (descriptiveData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-400">
        <FileText className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-base font-bold text-gray-500">Sem registros detalhados</p>
        <p className="text-sm font-medium text-gray-400 mt-1">Nenhum dado encontrado para os filtros selecionados</p>
      </div>
    )
  }

  const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-left border-collapse">
        
        {/* THEAD - Design System */}
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
          <tr className="border-b-2 border-gray-200">
            <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Colaborador
            </th>
            <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Sócio
            </th> 
            <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Data
            </th>
            <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Dia da Semana
            </th>
          </tr>
        </thead>
        
        {/* TBODY - Design System */}
        <tbody className="divide-y divide-gray-100">
          {descriptiveData.map((record, idx) => {
            const normName = normalizeKey(record.nome_colaborador)
            const socioRaw = socioMap.get(normName) || '-'
            const socioFormatted = toTitleCase(socioRaw)
            const dateObj = new Date(record.data_hora)
            const displayName = toTitleCase(record.nome_colaborador)

            return (
              <tr key={record.id || idx} className="hover:bg-blue-50/40 transition-colors">
                
                {/* Colaborador com Avatar Navy */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white font-black text-sm shadow-md">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-[#0a192f] text-base tracking-tight">{displayName}</p>
                    </div>
                  </div>
                </td>
                
                {/* Sócio */}
                <td className="px-6 py-4">
                  <span className="text-gray-700 text-sm font-semibold">
                    {socioFormatted !== '-' ? socioFormatted : <span className="text-red-500 italic font-medium">Sem Sócio</span>}
                  </span>
                </td>
                
                {/* Data */}
                <td className="px-6 py-4">
                  <span className="text-[#0a192f] font-bold text-sm">
                    {dateObj.toLocaleDateString('pt-BR')}
                  </span>
                </td>
                
                {/* Dia da Semana */}
                <td className="px-6 py-4">
                  <span className="text-gray-500 text-sm font-medium capitalize">
                    {weekDays[dateObj.getUTCDay()]}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
