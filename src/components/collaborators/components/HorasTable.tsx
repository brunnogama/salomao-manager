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
    <div className="flex-1 overflow-auto">
      <div ref={tableRef} className="min-w-full">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-[#1e3a8a] to-[#112240] sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-[9px] font-black text-white uppercase tracking-[0.2em]">Colaborador</th>
              <th className="px-4 py-3 text-left text-[9px] font-black text-white uppercase tracking-[0.2em]">Data</th>
              <th className="px-4 py-3 text-center text-[9px] font-black text-white uppercase tracking-[0.2em]">Entrada</th>
              <th className="px-4 py-3 text-center text-[9px] font-black text-white uppercase tracking-[0.2em]">Saída Almoço</th>
              <th className="px-4 py-3 text-center text-[9px] font-black text-white uppercase tracking-[0.2em]">Volta Almoço</th>
              <th className="px-4 py-3 text-center text-[9px] font-black text-white uppercase tracking-[0.2em]">Intervalo 1</th>
              <th className="px-4 py-3 text-center text-[9px] font-black text-white uppercase tracking-[0.2em]">Intervalo 2</th>
              <th className="px-4 py-3 text-center text-[9px] font-black text-white uppercase tracking-[0.2em]">Saída</th>
              <th className="px-4 py-3 text-center text-[9px] font-black text-white uppercase tracking-[0.2em]">Tempo Útil</th>
              <th className="px-4 py-3 text-left text-[9px] font-black text-white uppercase tracking-[0.2em]">Observações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {registros.map((reg, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-semibold text-gray-800">{reg.colaborador}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-600">{reg.data}</td>
                <td className="px-4 py-3 text-center text-sm font-mono font-semibold text-gray-800">{reg.entrada}</td>
                <td className={`px-4 py-3 text-center text-sm font-mono font-semibold ${!reg.saida_almoco && reg.volta_almoco ? 'text-red-600 bg-red-50' : 'text-gray-800'}`}>
                  {reg.saida_almoco || (!reg.saida_almoco && reg.volta_almoco ? 'Não marcou' : '-')}
                </td>
                <td className={`px-4 py-3 text-center text-sm font-mono font-semibold ${reg.saida_almoco && !reg.volta_almoco ? 'text-red-600 bg-red-50' : 'text-gray-800'}`}>
                  {reg.volta_almoco || (reg.saida_almoco && !reg.volta_almoco ? 'Não marcou' : '-')}
                </td>
                <td className="px-4 py-3 text-center text-sm font-mono font-semibold text-gray-800">
                  {reg.intervalo1 || '-'}
                </td>
                <td className={`px-4 py-3 text-center text-sm font-mono font-semibold ${reg.intervalo1 && !reg.intervalo2 ? 'text-red-600 bg-red-50' : 'text-gray-800'}`}>
                  {reg.intervalo2 || (reg.intervalo1 && !reg.intervalo2 ? 'Não marcou' : '-')}
                </td>
                <td className="px-4 py-3 text-center text-sm font-mono font-semibold text-gray-800">
                  {reg.saida || '-'}
                  {reg.saidas_extras && reg.saidas_extras.length > 0 && (
                    <div className="text-xs text-red-600 mt-1">
                      {reg.saidas_extras.map((s, i) => <div key={i} className="bg-red-50 px-2 py-0.5 rounded">{s}</div>)}
                    </div>
                  )}
                </td>
                <td className={`px-4 py-3 text-center text-sm font-mono font-bold ${reg.tem_inconsistencia ? 'text-red-600' : 'text-emerald-600'}`}>
                  {reg.tempo_util}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{reg.observacoes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}