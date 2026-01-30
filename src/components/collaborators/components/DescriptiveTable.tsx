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
        <p className="text-lg font-medium">Sem registros detalhados</p>
        <p className="text-sm">Nenhum dado encontrado para os filtros selecionados</p>
      </div>
    )
  }

  const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
          <tr className="border-b-2 border-gray-200">
            <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Colaborador</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Sócio</th> 
            <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Data</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Dia da Semana</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {descriptiveData.map((record, idx) => {
            const normName = normalizeKey(record.nome_colaborador)
            const socioRaw = socioMap.get(normName) || '-'
            const socioFormatted = toTitleCase(socioRaw)
            const dateObj = new Date(record.data_hora)
            const displayName = toTitleCase(record.nome_colaborador)

            return (
              <tr key={record.id || idx} className="hover:bg-blue-50/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {displayName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-[#112240] text-base">{displayName}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-700 text-sm">
                    {socioFormatted !== '-' ? socioFormatted : <span className="text-red-400 italic">Sem Sócio</span>}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-700 font-medium">
                    {dateObj.toLocaleDateString('pt-BR')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-500 text-sm capitalize">
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