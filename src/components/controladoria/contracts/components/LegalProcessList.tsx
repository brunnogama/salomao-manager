import { Eye, Edit, Trash2 } from 'lucide-react';
import { ContractProcess } from '../../../../types/controladoria';

interface LegalProcessListProps {
  processes: ContractProcess[];
  clientName: string;
  setViewProcess: (p: ContractProcess) => void;
  setViewProcessIndex: (i: number) => void;
  editProcess: (idx: number) => void;
  removeProcess: (idx: number) => void;
}

export function LegalProcessList({ processes, clientName, setViewProcess, setViewProcessIndex, editProcess, removeProcess }: LegalProcessListProps) {
  if (!processes || !Array.isArray(processes) || processes.length === 0) return null;

  return (
    <div className="space-y-3 mt-4 animate-in slide-in-from-bottom-2 duration-300">
      {processes.map((p, idx) => (
        <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-salomao-blue/50 transition-all group flex justify-between items-start relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-salomao-blue" />
          
          <div className="flex-1 min-w-0 pr-4 pl-2 space-y-1">
            {/* Linha 1: Número | Cliente */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
                <span 
                    onClick={() => { setViewProcess(p); setViewProcessIndex(idx); }} 
                    className="font-black text-salomao-blue hover:text-salomao-gold cursor-pointer flex items-center transition-colors"
                >
                    <Eye className="w-4 h-4 mr-1.5" />
                    {p.process_number || 'Sem Número'}
                </span>
                <span className="text-gray-300 hidden sm:inline">|</span>
                <span className="font-medium text-gray-700 truncate">{p.client_name || clientName || 'Cliente não informado'}</span>
            </div>
            
            {/* Linha 2: Contrário | Estado */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-medium">
                <span className="truncate max-w-[200px] sm:max-w-xs">{p.opponent || 'Contrário não informado'}</span>
                <span className="text-gray-300 hidden sm:inline">|</span>
                <span className="bg-gray-100 px-2 py-0.5 rounded-md text-gray-600">{p.uf || 'UF'}</span>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur pl-2">
            <button onClick={() => editProcess(idx)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Editar"><Edit className="w-4 h-4" /></button>
            <button onClick={() => removeProcess(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Remover"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}