import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { ContractProcess } from '../types'; // Caminho corrigido para a estrutura da controladoria

interface LegalProcessListProps {
  processes: ContractProcess[];
  setViewProcess: (p: ContractProcess) => void;
  setViewProcessIndex: (i: number) => void;
  editProcess: (idx: number) => void;
  removeProcess: (idx: number) => void;
}

export function LegalProcessList({ processes, setViewProcess, setViewProcessIndex, editProcess, removeProcess }: LegalProcessListProps) {
  if (processes.length === 0) return null;

  return (
    <div className="space-y-2 mt-4">
      {processes.map((p, idx) => (
        <div key={idx} className="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100 shadow-sm hover:border-[#0a192f]/30 hover:bg-white transition-all group">
          <div className="grid grid-cols-3 gap-4 flex-1 items-center">
            {/* NÚMERO CLICÁVEL */}
            <button 
              type="button"
              onClick={() => { setViewProcess(p); setViewProcessIndex(idx); }} 
              className="font-mono text-[11px] font-bold text-[#0a192f] hover:text-blue-700 flex items-center gap-2 w-fit group/btn"
              title="Clique para ver detalhes do processo"
            >
              <div className="p-1.5 rounded-lg bg-white border border-gray-200 group-hover/btn:border-[#0a192f] transition-colors">
                <Eye className="w-3 h-3" />
              </div>
              <span className="hover:underline decoration-2 underline-offset-4">
                {p.process_number}
              </span>
            </button>
            
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Tribunal</span>
              <span className="text-[11px] font-bold text-gray-700">{p.court} ({p.uf})</span>
            </div>

            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Parte Contrária</span>
              <span className="text-[11px] font-bold text-gray-600 truncate uppercase" title={p.opponent}>
                {p.opponent || '-'}
              </span>
            </div>
          </div>

          <div className="flex gap-1 ml-4">
            <button 
              onClick={() => editProcess(idx)} 
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button 
              onClick={() => removeProcess(idx)} 
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Remover"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}