import React from 'react';
import { X, Gavel, Edit } from 'lucide-react';
import { ContractProcess } from '../types'; // Caminho corrigido para a estrutura da controladoria

interface ProcessDetailsModalProps {
  process: ContractProcess | null;
  onClose: () => void;
  onEdit: () => void;
}

export function ProcessDetailsModal({ process, onClose, onEdit }: ProcessDetailsModalProps) {
  if (!process) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header - Navy Estilizado */}
        <div className="bg-[#0a192f] text-white p-6 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-amber-400 mb-1">Detalhes do Processo</h3>
            <p className="text-lg font-bold font-mono tracking-tight">{process.process_number}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1 tracking-wider">Tribunal</span>
              <span className="text-xs font-bold text-[#0a192f]">{process.court || '-'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1 tracking-wider">Estado (UF)</span>
              <span className="text-xs font-bold text-[#0a192f]">{process.uf || '-'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1 tracking-wider">Vara</span>
              <span className="text-xs font-bold text-[#0a192f]">{process.vara || '-'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1 tracking-wider">Comarca</span>
              <span className="text-xs font-bold text-[#0a192f]">{process.comarca || '-'}</span>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <span className="block text-[9px] uppercase font-black text-gray-400 mb-2 tracking-wider">Magistrados</span>
            {process.magistrates && process.magistrates.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {process.magistrates.map((m, idx) => (
                  <span key={idx} className="inline-flex items-center px-2 py-1 rounded-lg bg-white border border-gray-200 text-[10px] text-gray-700 shadow-sm">
                    <Gavel size={10} className="mr-1.5 text-amber-500" />
                    <span className="font-black uppercase text-gray-400 mr-1">{m.title}:</span> <span className="font-bold">{m.name}</span>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-gray-400 italic">Nenhum magistrado cadastrado.</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1 tracking-wider">Parte Oposta</span>
              <span className="text-xs font-bold text-gray-800 uppercase">{process.opponent || '-'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1 tracking-wider">Posição</span>
              <span className="text-xs font-bold text-gray-800 uppercase">{process.position || '-'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1 tracking-wider">Tipo de Ação</span>
              <span className="text-xs font-bold text-gray-800 uppercase">{process.action_type || '-'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1 tracking-wider">Data Distribuição</span>
              <span className="text-xs font-bold text-gray-800">{process.distribution_date ? new Date(process.distribution_date).toLocaleDateString('pt-BR') : '-'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1 tracking-wider">Justiça</span>
              <span className="text-xs font-bold text-gray-800 uppercase">{process.justice_type || '-'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1 tracking-wider">Instância</span>
              <span className="text-xs font-bold text-gray-800 uppercase">{process.instance || '-'}</span>
            </div>
            <div className="md:col-span-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1 tracking-wider">Classe / Assunto</span>
              <span className="text-xs font-bold text-gray-800 uppercase leading-relaxed">
                {process.process_class || '-'} {process.subject ? `• ${process.subject}` : ''}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center shadow-inner">
            <span className="text-[10px] uppercase font-black text-blue-700 tracking-widest">Valor da Causa</span>
            <span className="text-lg font-black text-[#0a192f]">{process.cause_value || 'R$ 0,00'}</span>
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl text-[11px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-100 transition-all active:scale-95"
          >
            Fechar
          </button>
          <button 
            onClick={onEdit} 
            className="px-6 py-2.5 bg-[#0a192f] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center shadow-lg active:scale-95"
          >
            <Edit className="w-3.5 h-3.5 mr-2" />
            Editar Processo
          </button>
        </div>
      </div>
    </div>
  );
}