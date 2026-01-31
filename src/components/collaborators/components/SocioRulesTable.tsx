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
        <p className="text-base font-bold text-gray-500">Nenhuma regra encontrada</p>
        <p className="text-sm font-medium text-gray-400 mt-1">Crie uma nova regra ou ajuste os filtros</p>
      </div>
    )
  }

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
              Sócio Responsável
            </th>
            <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">
              Meta Semanal
            </th>
            <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">
              Ações
            </th>
          </tr>
        </thead>
        
        {/* TBODY - Design System */}
        <tbody className="divide-y divide-gray-100">
          {filteredRules.map((rule) => {
            const displayName = toTitleCase(rule.nome_colaborador)
            return (
              <tr key={rule.id} className="hover:bg-blue-50/30 transition-colors group">
                
                {/* Colaborador com Avatar Navy */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white font-black text-sm shadow-md">
                      {displayName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <p className="font-bold text-[#0a192f] text-base tracking-tight">{displayName}</p>
                  </div>
                </td>
                
                {/* Sócio Responsável */}
                <td className="px-6 py-4">
                  <span className="text-gray-700 font-semibold text-sm">
                    {toTitleCase(rule.socio_responsavel)}
                  </span>
                </td>
                
                {/* Meta Semanal - Navy Badge */}
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center bg-[#1e3a8a]/10 text-[#1e3a8a] px-4 py-2 rounded-xl border border-[#1e3a8a]/30 font-black text-sm min-w-[60px] shadow-sm">
                    {rule.meta_semanal}x
                  </span>
                </td>
                
                {/* Ações */}
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit(rule)} 
                      className="p-2 text-[#1e3a8a] hover:bg-[#1e3a8a]/10 rounded-xl transition-all hover:scale-110 active:scale-95"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(rule.id)} 
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-110 active:scale-95"
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