import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { ContractProcess } from '../../../../types/controladoria';

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
    <div className="space-y-3 mt-6">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Processos Vinculados</label>
      {processes.map((p, idx) => (
        <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-amber-200 hover:shadow-md transition-all group">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-center">
            {/* NÚMERO CLICÁVEL - ESTILO MANAGER */}
            <button 
              type="button"
              onClick={() => { setViewProcess(p); setViewProcessIndex(idx); }} 
              className="font-mono text-[11px] font-black text-[#0a192f] flex items-center gap-3 w-fit group/btn"
              title="Clique para ver detalhes do processo"
            >
              <div className="p-2 rounded-xl bg-gray-50 border border-gray-100 group-hover/btn:border-[#0a192f] group-hover/btn:bg-white transition-all shadow-inner">
                <Eye className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <span className="hover:underline decoration-2 underline-offset-4 tracking-wider">
                {p.process_number}
              </span>
            </button>
            
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1.5">Jurisdição</span>
              <span className="text-[10px] font-black text-[#0a192f] uppercase tracking-tight">{p.court} • {p.uf}</span>
            </div>

            <div className="flex flex-col overflow-hidden">
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1.5">Parte Adversa</span>
              <span className="text-[10px] font-black text-gray-500 truncate uppercase tracking-tighter" title={p.opponent}>
                {p.opponent || 'NÃO INFORMADO'}
              </span>
            </div>
          </div>

          <div className="flex gap-1 ml-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
            <button 
              onClick={() => editProcess(idx)} 
              className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button 
              onClick={() => removeProcess(idx)} 
              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
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