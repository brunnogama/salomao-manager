import { Pencil, Trash2 } from 'lucide-react';
import { Colaborador } from '../../../types/colaborador';
import { Avatar } from './ColaboradorUI';
import { toTitleCase } from '../utils/colaboradoresUtils';

interface ListProps {
  colaboradores: Colaborador[];
  onEdit: (c: Colaborador) => void;
  onDelete: (id: number, url?: string) => void;
  onSelect: (c: Colaborador) => void;
}

export function ColaboradoresList({ colaboradores, onEdit, onDelete, onSelect }: ListProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b-2 border-gray-200">
          <tr>
            <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Colaborador</th>
            <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Cargo</th>
            <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Equipe</th>
            <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
            <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {colaboradores.map(c => (
            <tr 
              key={c.id} 
              onClick={() => onSelect(c)} 
              className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <Avatar src={c.foto_url} name={c.nome} />
                  <p className="font-bold text-sm text-[#0a192f]">{toTitleCase(c.nome)}</p>
                </div>
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-[#0a192f]">{toTitleCase(c.cargo)}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{toTitleCase(c.equipe)}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border ${c.status === 'Ativo' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {c.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); onEdit(c); }} className="p-2 text-[#1e3a8a] hover:bg-white rounded-xl shadow-sm border border-gray-100">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(c.id, c.foto_url); }} className="p-2 text-red-600 hover:bg-white rounded-xl shadow-sm border border-gray-100">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}