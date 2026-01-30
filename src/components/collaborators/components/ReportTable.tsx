// src/components/collaborators/components/ReportTable.tsx

import { BarChart3, Briefcase, X } from 'lucide-react'
import { ReportItem } from '../types/presencial'

interface ReportTableProps {
  reportData: ReportItem[];
  reportRef: React.RefObject<HTMLDivElement>;
  startDate: string;
  endDate: string;
}

export function ReportTable({ reportData, reportRef, startDate, endDate }: ReportTableProps) {
  if (reportData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-400">
        <BarChart3 className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">Sem dados correspondentes aos filtros</p>
        <p className="text-sm">Importe uma planilha ou ajuste os filtros</p>
      </div>
    )
  }

  return (
    <div ref={reportRef} className="bg-white p-4">
      <div className="mb-4 text-center block md:hidden">
        <h3 className="text-lg font-bold text-[#112240]">Relatório de Presença</h3>
        <p className="text-sm text-gray-500">
          Período: {new Date(startDate).toLocaleDateString()} a {new Date(endDate).toLocaleDateString()}
        </p>
      </div>
      <table className="w-full text-left border-collapse">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
          <tr className="border-b-2 border-gray-200">
            <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Colaborador</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Sócio</th> 
            <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Frequência</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Distribuição Semanal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {reportData.map((item, idx) => (
            <tr key={idx} className="hover:bg-blue-50/40 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {item.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-[#112240] text-base">{item.nome}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                {item.socio !== '-' ? (
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium">
                    <Briefcase className="h-3.5 w-3.5" />
                    {item.socio}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-red-500 text-sm italic bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                    <X className="h-3.5 w-3.5" />
                    Sem Sócio
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#112240]">{item.diasPresentes}</span>
                    <span className="text-sm text-gray-500 font-medium">dias</span>
                  </div>
                  <div className="w-full max-w-[120px] h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        item.diasPresentes >= 20 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                        item.diasPresentes >= 15 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 
                        item.diasPresentes >= 10 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                        'bg-gradient-to-r from-red-500 to-rose-500'
                      }`} 
                      style={{ width: `${Math.min((item.diasPresentes / 22) * 100, 100)}%` }} 
                    />
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map(day => (
                    <div 
                      key={day} 
                      className={`flex flex-col items-center justify-center min-w-[44px] h-14 rounded-lg border-2 transition-all ${
                        item.diasSemana[day] 
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-sm' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${
                        item.diasSemana[day] ? 'text-green-700' : 'text-gray-400'
                      }`}>
                        {day}
                      </span>
                      <span className={`text-lg font-bold ${
                        item.diasSemana[day] ? 'text-green-600' : 'text-gray-300'
                      }`}>
                        {item.diasSemana[day] || '–'}
                      </span>
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}