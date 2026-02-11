// src/components/collaborators/components/SocioRuleModal.tsx

import { X, Save } from 'lucide-react'
import { SocioRule } from '../types/presencial'
import { SearchableSelect } from '../../crm/SearchableSelect'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a192f]/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header - Navy Gradient */}
        <div className="px-8 py-5 bg-gradient-to-r from-[#112240] to-[#1e3a8a] flex items-center justify-between">
          <h3 className="text-white font-black text-base tracking-tight">
            {editingRule.id ? 'Editar Regra' : 'Nova Regra'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all group"
          >
            <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>
        
        {/* Body */}
        <div className="px-8 py-6 space-y-5">
          
          {/* Colaborador - Seleção via Tabela */}
          <SearchableSelect 
            label="Colaborador"
            placeholder="Selecione o colaborador"
            value={editingRule.colaborador_id || ''}
            onChange={val => setEditingRule({...editingRule, colaborador_id: val})}
            table="collaborators"
          />
          
          {/* Sócio Responsável - Seleção via Tabela */}
          <SearchableSelect 
            label="Sócio Responsável"
            placeholder="Selecione o sócio"
            value={editingRule.partner_id || ''}
            onChange={val => setEditingRule({...editingRule, partner_id: val})}
            table="partners"
          />
          
          {/* Meta Semanal - Mapeado para 'weekly_goal' */}
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">
              Meta Semanal (dias)
            </label>
            <input 
              type="number" 
              min="0"
              max="7"
              className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" 
              value={editingRule.weekly_goal || 0} 
              onChange={e => setEditingRule({...editingRule, weekly_goal: Number(e.target.value)})} 
            />
          </div>
        </div>

        {/* Footer - Actions */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 text-[9px] font-black text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-xl transition-all uppercase tracking-[0.2em]"
          >
            Cancelar
          </button>
          <button 
            onClick={onSave} 
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white font-black text-[9px] rounded-xl hover:shadow-lg transition-all shadow-md uppercase tracking-[0.2em] active:scale-95"
          >
            <Save className="h-4 w-4" />
            Salvar Regra
          </button>
        </div>
      </div>
    </div>
  )
}