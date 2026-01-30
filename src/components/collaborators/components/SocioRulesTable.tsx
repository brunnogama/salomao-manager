// src/components/collaborators/components/SocioRulesTable.tsx

import { Users, Pencil, X } from 'lucide-react'
import { SocioRule } from '../types/presencial'
import { toTitleCase } from '../utils/presencialUtils'

interface SocioRulesTableProps {
  filteredRules: SocioRule[];
  onEdit: (rule: SocioRule) => void;
  onDelete: (id: string) => void;
}

export function SocioRulesTable({ filteredRules, onEdit, onDelete }: SocioRulesTableProps) {
  if (filteredRules.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-400">
        <Users className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">Nenhuma regra encontrada</p>
        <p className="text-sm">Crie uma nova regra ou ajuste os filtros</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
          <tr className="border-b-2 border-gray-200">
            <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Colaborador</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Sócio Responsável</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Meta Semanal</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filteredRules.map((rule) => {
            const displayName = toTitleCase(rule.nome_colaborador)
            return (
              <tr key={rule.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {displayName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <p className="font-semibold text-[#112240] text-base">{displayName}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700">{toTitleCase(rule.socio_responsavel)}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 font-bold text-sm min-w-[60px]">
                    {rule.meta_semanal}x
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit(rule)} 
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(rule.id)} 
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}