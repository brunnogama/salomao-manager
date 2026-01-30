// src/components/collaborators/components/SocioRuleModal.tsx

import { X } from 'lucide-react'
import { SocioRule } from '../types/presencial'

interface SocioRuleModalProps {
  isOpen: boolean;
  editingRule: Partial<SocioRule> | null;
  onClose: () => void;
  onSave: () => void;
  setEditingRule: (rule: Partial<SocioRule> | null) => void;
}

export function SocioRuleModal({ 
  isOpen, 
  editingRule, 
  onClose, 
  onSave, 
  setEditingRule 
}: SocioRuleModalProps) {
  if (!isOpen || !editingRule) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
        <div className="bg-[#112240] px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold">
            {editingRule.id ? 'Editar Regra' : 'Nova Regra'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5"/>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Colaborador</label>
            <input 
              type="text" 
              className="w-full border p-2 rounded" 
              value={editingRule.nome_colaborador || ''} 
              onChange={e => setEditingRule({...editingRule, nome_colaborador: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sócio Responsável</label>
            <input 
              type="text" 
              className="w-full border p-2 rounded" 
              value={editingRule.socio_responsavel || ''} 
              onChange={e => setEditingRule({...editingRule, socio_responsavel: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Semanal</label>
            <input 
              type="number" 
              className="w-full border p-2 rounded" 
              value={editingRule.meta_semanal || 0} 
              onChange={e => setEditingRule({...editingRule, meta_semanal: Number(e.target.value)})} 
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button 
              onClick={onClose} 
              className="flex-1 py-2 border rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button 
              onClick={onSave} 
              className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}