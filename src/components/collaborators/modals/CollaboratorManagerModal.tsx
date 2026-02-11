// src/components/collaborators/modals/CollaboratorManagerModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Loader2, UserCheck, UserMinus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Collaborator } from '../../../types/controladoria';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function CollaboratorManagerModal({ isOpen, onClose, onUpdate }: Props) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (isOpen) fetchCollaborators();
  }, [isOpen]);

  const fetchCollaborators = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('collaborators')
      .select('*')
      .order('name');
    if (data) setCollaborators(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    const { error } = await supabase
      .from('collaborators')
      .insert([{ name: newName.trim(), status: 'active' }]);
    
    if (!error) {
      setNewName('');
      fetchCollaborators();
      if (onUpdate) onUpdate();
    }
    setLoading(false);
  };

  const toggleStatus = async (collab: Collaborator) => {
    const newStatus = collab.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase
      .from('collaborators')
      .update({ status: newStatus })
      .eq('id', collab.id);

    if (!error) {
      fetchCollaborators();
      if (onUpdate) onUpdate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-black text-[#0a192f] uppercase tracking-tight">Gerenciar Líderes</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-all">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-8">
          <div className="flex gap-2 mb-6">
            <input 
              type="text"
              className="flex-1 bg-gray-100/50 border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
              placeholder="Nome do colaborador/líder"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <button 
              onClick={handleAdd}
              disabled={loading || !newName.trim()}
              className="bg-[#1e3a8a] text-white p-3 rounded-xl hover:bg-[#112240] transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {collaborators.map(collab => (
              <div key={collab.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-blue-200 transition-all">
                <div>
                  <p className={`text-sm font-bold ${collab.status === 'inactive' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {collab.name}
                  </p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{collab.status === 'active' ? 'Ativo' : 'Inativo'}</p>
                </div>
                <button 
                  onClick={() => toggleStatus(collab)}
                  className={`p-2 rounded-lg transition-all ${collab.status === 'active' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-500 hover:bg-amber-50'}`}
                >
                  {collab.status === 'active' ? <UserCheck className="w-5 h-5" /> : <UserMinus className="w-5 h-5" />}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="px-8 py-4 bg-gray-50 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Alterações refletem em todos os menus suspensos
          </p>
        </div>
      </div>
    </div>
  );
}