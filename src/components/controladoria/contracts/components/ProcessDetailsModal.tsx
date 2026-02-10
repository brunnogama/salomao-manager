import React from 'react';
import { X, Gavel, Edit } from 'lucide-react';
import { ContractProcess } from '../../../../types/controladoria';

interface ProcessDetailsModalProps {
  process: ContractProcess | null;
  onClose: () => void;
  onEdit: () => void;
}

export function ProcessDetailsModal({ process, onClose, onEdit }: ProcessDetailsModalProps) {
  if (!process) return null;

  return (
    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh] border border-white/20">
        {/* Header - Navy Estilizado Manager */}
        <div className="bg-[#0a192f] text-white p-8 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-1">Dossiê de Processo Judicial</h3>
            <p className="text-xl font-black font-mono tracking-widest">{process.process_number}</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar bg-gray-50/30">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1.5 tracking-widest">Esfera / Tribunal</span>
              <span className="text-[11px] font-black text-[#0a192f] uppercase">{process.court || '-'}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1.5 tracking-widest">Unidade Federativa</span>
              <span className="text-[11px] font-black text-[#0a192f] uppercase">{process.uf || '-'}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1.5 tracking-widest">Vara / Juízo</span>
              <span className="text-[11px] font-black text-[#0a192f] uppercase">{process.vara || '-'}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1.5 tracking-widest">Comarca / Foro</span>
              <span className="text-[11px] font-black text-[#0a192f] uppercase">{process.comarca || '-'}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
            <span className="block text-[9px] uppercase font-black text-gray-400 mb-3 tracking-widest">Magistrados & Composição</span>
            {process.magistrates && process.magistrates.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {process.magistrates.map((m, idx) => (
                  <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-[10px] text-[#0a192f] transition-all hover:border-amber-200">
                    <Gavel size={11} className="mr-2 text-amber-500" />
                    <span className="font-black uppercase text-gray-400 mr-2">{m.title}:</span> <span className="font-bold">{m.name}</span>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-gray-300 font-bold uppercase italic tracking-widest">Nenhuma composição vinculada.</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1.5 tracking-widest">Parte Adversa</span>
              <span className="text-[11px] font-black text-gray-800 uppercase tracking-tighter">{process.opponent || '-'}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1.5 tracking-widest">Posição</span>
              <span className="text-[11px] font-black text-gray-800 uppercase tracking-tighter">{process.position || '-'}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1.5 tracking-widest">Natureza da Ação</span>
              <span className="text-[11px] font-black text-gray-800 uppercase tracking-tighter">{process.action_type || '-'}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1.5 tracking-widest">Data de Distribuição</span>
              <span className="text-[11px] font-black text-gray-800">{process.distribution_date ? new Date(process.distribution_date).toLocaleDateString('pt-BR') : '-'}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1.5 tracking-widest">Competência</span>
              <span className="text-[11px] font-black text-gray-800 uppercase tracking-tighter">{process.justice_type || '-'}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-1.5 tracking-widest">Grau de Jurisdição</span>
              <span className="text-[11px] font-black text-gray-800 uppercase tracking-tighter">{process.instance || '-'}</span>
            </div>
            <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <span className="block text-[9px] uppercase font-black text-gray-400 mb-2 tracking-widest">Classe Processual & Assunto</span>
              <span className="text-[11px] font-black text-gray-600 uppercase leading-relaxed block border-l-4 border-amber-500 pl-3 bg-gray-50/50 py-2 rounded">
                {process.process_class || '-'} {process.subject ? `• ${process.subject}` : ''}
              </span>
            </div>
          </div>

          <div className="bg-[#0a192f] p-6 rounded-[1.5rem] border border-white/10 flex justify-between items-center shadow-2xl">
            <span className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em]">Valor de Causa</span>
            <span className="text-xl font-black text-amber-500 tracking-tight">{process.cause_value || 'R$ 0,00'}</span>
          </div>
        </div>
        
        <div className="p-8 bg-white border-t border-gray-100 flex justify-end gap-4 shrink-0">
          <button 
            onClick={onClose} 
            className="px-8 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
          >
            Fechar
          </button>
          <button 
            onClick={onEdit} 
            className="px-10 py-3 bg-[#0a192f] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center shadow-xl shadow-[#0a192f]/20 active:scale-95"
          >
            <Edit className="w-4 h-4 mr-3 text-amber-500" />
            Ajustar Registro
          </button>
        </div>
      </div>
    </div>
  );
}