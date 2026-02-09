import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Calendar, User, AlignLeft, Flag, Link as LinkIcon, FileText } from 'lucide-react';
import { KanbanTask, Contract } from '../types'; // Caminho corrigido para a estrutura da controladoria

interface Props {
  isOpen: boolean;
  onClose: () => void;
  task: KanbanTask | null;
  onSave: (task: Partial<KanbanTask>) => void;
  onDelete: (id: string) => void;
  contracts: Contract[];
}

export function KanbanTaskModal({ isOpen, onClose, task, onSave, onDelete, contracts }: Props) {
  const [formData, setFormData] = useState<Partial<KanbanTask>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'Média',
    due_date: '',
    contract_id: '',
    observation: ''
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        contract_id: task.contract_id || '',
        observation: task.observation || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'Média',
        due_date: '',
        contract_id: '',
        observation: ''
      });
    }
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert('O título é obrigatório.');
      return;
    }
    
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 overflow-hidden border border-white/20">
        
        {/* HEADER - Navy Estilizado */}
        <div className="p-6 bg-[#0a192f] border-b border-white/10 flex justify-between items-center">
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
            {task ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h2>
          <button onClick={onClose} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* CONTENT */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-gray-50/30">
          
          {/* TÍTULO */}
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Título da Tarefa *</label>
            <input 
              type="text" 
              className="w-full border border-gray-200 rounded-xl p-4 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all"
              placeholder="Ex: Elaborar minuta de defesa..."
              value={formData.title || ''}
              onChange={e => setFormData({...formData, title: e.target.value})}
              autoFocus
            />
          </div>

          {/* DESCRIÇÃO */}
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center">
              <AlignLeft className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Descrição Detalhada
            </label>
            <textarea 
              className="w-full border border-gray-200 rounded-xl p-4 text-sm font-medium h-28 focus:border-[#0a192f] outline-none resize-none shadow-sm transition-all bg-white"
              placeholder="Descreva os detalhes da atividade..."
              value={formData.description || ''}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* STATUS E PRIORIDADE */}
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Status do Workflow</label>
                <select 
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs font-bold uppercase tracking-wider bg-white focus:border-[#0a192f] outline-none cursor-pointer shadow-sm transition-all"
                  value={formData.status || 'todo'}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="todo">A Fazer</option>
                  <option value="doing">Em Andamento</option>
                  <option value="signature">Assinatura</option>
                  <option value="done">Concluído</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center">
                  <Flag className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Nível de Prioridade
                </label>
                <select 
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs font-bold uppercase tracking-wider bg-white focus:border-[#0a192f] outline-none cursor-pointer shadow-sm transition-all"
                  value={formData.priority || 'Média'}
                  onChange={e => setFormData({...formData, priority: e.target.value as any})}
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
            </div>

            {/* PRAZO */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Prazo de Entrega
                </label>
                <input 
                  type="date" 
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all bg-white"
                  value={formData.due_date || ''}
                  onChange={e => setFormData({...formData, due_date: e.target.value})}
                />
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-2 ml-1">Opcional para tarefas recorrentes</p>
              </div>
            </div>
          </div>

          {/* VÍNCULO COM CONTRATO */}
          <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 shadow-inner">
            <label className="block text-[10px] font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center">
              <LinkIcon className="w-3.5 h-3.5 mr-1.5" /> Vinculação a Caso Ativo
            </label>
            <select 
              className="w-full border border-amber-200 rounded-xl p-3 text-xs font-bold text-amber-900 bg-white focus:border-[#0a192f] outline-none cursor-pointer shadow-sm transition-all"
              value={formData.contract_id || ''}
              onChange={e => setFormData({...formData, contract_id: e.target.value})}
            >
              <option value="">Sem vínculo direto</option>
              {contracts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.client_name} {c.hon_number ? `(HON: ${c.hon_number})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* OBSERVAÇÃO */}
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Notas de Controle (Observação)
            </label>
            <input 
              type="text" 
              className="w-full border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-700 focus:border-[#0a192f] outline-none shadow-sm transition-all bg-white"
              placeholder="Notas internas rápidas..."
              value={formData.observation || ''}
              onChange={e => setFormData({...formData, observation: e.target.value})}
            />
          </div>

        </form>

        {/* FOOTER - Navy Estilizado */}
        <div className="p-6 border-t border-white/10 flex justify-between bg-[#0a192f] rounded-b-[2rem]">
          {task ? (
            <button 
              onClick={() => onDelete(task.id)}
              className="text-red-400 hover:text-red-300 font-black uppercase text-[11px] tracking-widest flex items-center px-4 py-2 rounded-xl hover:bg-white/5 transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Excluir Tarefa
            </button>
          ) : (
            <div></div> 
          )}
          
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={onClose} 
              className="px-6 py-2.5 text-white/60 hover:text-white font-black uppercase text-[11px] tracking-widest transition-all"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              className="px-8 py-2.5 bg-white text-[#0a192f] rounded-xl hover:bg-gray-100 shadow-xl flex items-center transition-all transform active:scale-95 font-black uppercase text-[11px] tracking-widest"
            >
              <Save className="w-4 h-4 mr-2" /> Salvar Alterações
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}