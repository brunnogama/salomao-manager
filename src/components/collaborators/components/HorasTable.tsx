// src/components/collaborators/components/HorasTable.tsx

import { RegistroDiario } from '../types/presencial'

interface HorasTableProps {
  registros: RegistroDiario[]
  tableRef?: React.RefObject<HTMLDivElement>
}

export function HorasTable({ registros, tableRef }: HorasTableProps) {
  if (registros.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <p className="text-sm font-medium">Nenhum registro encontrado</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto custom-scrollbar">
      <div ref={tableRef} className="min-w-[1000px]">
        <table className="w-full">
          <thead className="bg-[#112240] sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-black text-white uppercase tracking-wider whitespace-nowrap">Colaborador</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-white uppercase tracking-wider whitespace-nowrap">Data</th>
              <th className="px-4 py-3 text-center text-[10px] font-black text-white uppercase tracking-wider whitespace-nowrap">Entrada</th>
              <th className="px-4 py-3 text-center text-[10px] font-black text-white uppercase tracking-wider whitespace-nowrap">Saída Almoço</th>
              <th className="px-4 py-3 text-center text-[10px] font-black text-white uppercase tracking-wider whitespace-nowrap">Volta Almoço</th>
              <th className="px-4 py-3 text-center text-[10px] font-black text-white uppercase tracking-wider whitespace-nowrap">Intervalo 1</th>
              <th className="px-4 py-3 text-center text-[10px] font-black text-white uppercase tracking-wider whitespace-nowrap">Intervalo 2</th>
              <th className="px-4 py-3 text-center text-[10px] font-black text-white uppercase tracking-wider whitespace-nowrap">Saída</th>
              <th className="px-4 py-3 text-center text-[10px] font-black text-white uppercase tracking-wider whitespace-nowrap">Tempo Útil</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-white uppercase tracking-wider whitespace-nowrap">Observações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {registros.map((reg, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-semibold text-[#0a192f] whitespace-nowrap">{reg.colaborador}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-600 whitespace-nowrap">{reg.data}</td>
                <td className="px-4 py-3 text-center text-sm font-mono font-semibold text-[#0a192f] whitespace-nowrap">{reg.entrada}</td>
                <td className={`px-4 py-3 text-center text-sm font-mono font-semibold whitespace-nowrap ${!reg.saida_almoco && reg.volta_almoco ? 'text-red-600 bg-red-50/50' : 'text-[#0a192f]'}`}>
                  {reg.saida_almoco || (!reg.saida_almoco && reg.volta_almoco ? 'Não marcou' : '-')}
                </td>
                <td className={`px-4 py-3 text-center text-sm font-mono font-semibold whitespace-nowrap ${reg.saida_almoco && !reg.volta_almoco ? 'text-red-600 bg-red-50/50' : 'text-[#0a192f]'}`}>
                  {reg.volta_almoco || (reg.saida_almoco && !reg.volta_almoco ? 'Não marcou' : '-')}
                </td>
                <td className="px-4 py-3 text-center text-sm font-mono font-semibold text-[#0a192f] whitespace-nowrap">
                  {reg.intervalo1 || '-'}
                </td>
                <td className={`px-4 py-3 text-center text-sm font-mono font-semibold whitespace-nowrap ${reg.intervalo1 && !reg.intervalo2 ? 'text-red-600 bg-red-50/50' : 'text-[#0a192f]'}`}>
                  {reg.intervalo2 || (reg.intervalo1 && !reg.intervalo2 ? 'Não marcou' : '-')}
                </td>
                <td className="px-4 py-3 text-center text-sm font-mono font-semibold text-[#0a192f] whitespace-nowrap">
                  {reg.saida || '-'}
                  {reg.saidas_extras && reg.saidas_extras.length > 0 && (
                    <div className="text-xs text-red-600 mt-1 flex flex-col gap-0.5">
                      {reg.saidas_extras.map((s, i) => <div key={i} className="bg-red-50 px-2 py-0.5 rounded-md inline-block whitespace-nowrap border border-red-100">{s}</div>)}
                    </div>
                  )}
                </td>
                <td className={`px-4 py-3 text-center text-sm font-mono font-black whitespace-nowrap ${reg.tem_inconsistencia ? 'text-red-600' : 'text-[#1e3a8a]'}`}>
                  {reg.tempo_util}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 min-w-[200px]">{reg.observacoes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}