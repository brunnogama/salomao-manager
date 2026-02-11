// src/components/collaborators/CollaboratorFormModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Save, Settings2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Collaborator, Partner } from '../../types/controladoria';
import { SearchableSelect } from '../SearchableSelect'; // Ajustado para o caminho correto do componente
import { PartnerManagerModal } from './modals/PartnerManagerModal';
import { CollaboratorManagerModal } from './modals/CollaboratorManagerModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  collaborator?: Collaborator;
  onSave: () => void;
}

export function CollaboratorFormModal({ isOpen, onClose, collaborator, onSave }: Props) {
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [leaders, setLeaders] = useState<Collaborator[]>([]);
  
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<Collaborator>>({
    name: '',
    partner_id: '',
    leader_id: '',
    status: 'active',
    role: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (collaborator) {
        setFormData({
          ...collaborator,
          partner_id: collaborator.partner_id || '',
          leader_id: collaborator.leader_id || ''
        });
      } else {
        setFormData({ name: '', partner_id: '', leader_id: '', status: 'active', role: '' });
      }
      fetchData();
    }
  }, [isOpen, collaborator]);

  const fetchData = async () => {
    try {
      // Busca dados de Sócios e Colaboradores (Líderes) simultaneamente
      const [partnersRes, leadersRes] = await Promise.all([
        supabase.from('partners').select('id, name').eq('status', 'active').order('name'),
        supabase.from('collaborators').select('id, name').eq('status', 'active').order('name')
      ]);
      
      if (partnersRes.data) setPartners(partnersRes.data);
      if (leadersRes.data) setLeaders(leadersRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleSave = async () => {
    if (!formData.name) return alert("Nome é obrigatório");
    
    setLoading(true);
    try {
      const payload = {
        ...formData,
        partner_id: formData.partner_id || null,
        leader_id: formData.leader_id || null
      };

      if (collaborator?.id) {
        const { error } = await supabase.from('collaborators').update(payload).eq('id', collaborator.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('collaborators').insert([payload]);
        if (error) throw error;
      }
      onSave();
      onClose();
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">
            {collaborator ? 'Editar Colaborador' : 'Novo Colaborador'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-all">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
            <input 
              type="text"
              className="w-full bg-gray-100/50 border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a]"
              value={formData.name || ''}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sócio Responsável */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sócio Responsável</label>
                <button 
                  type="button"
                  onClick={() => setIsPartnerModalOpen(true)}
                  className="text-[9px] font-black text-[#1e3a8a] uppercase tracking-tighter flex items-center gap-1 hover:underline"
                >
                  <Settings2 className="w-3 h-3" /> Gerenciar
                </button>
              </div>
              <SearchableSelect 
                placeholder="Selecione o Sócio"
                value={formData.partner_id || ''}
                onChange={(val) => setFormData({...formData, partner_id: val})}
                options={partners.map(p => ({ id: p.id, name: p.name }))}
              />
            </div>

            {/* Líder Direto */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Líder Direto</label>
                <button 
                  type="button"
                  onClick={() => setIsLeaderModalOpen(true)}
                  className="text-[9px] font-black text-[#1e3a8a] uppercase tracking-tighter flex items-center gap-1 hover:underline"
                >
                  <Settings2 className="w-3 h-3" /> Gerenciar
                </button>
              </div>
              <SearchableSelect 
                placeholder="Selecione o Líder"
                value={formData.leader_id || ''}
                onChange={(val) => setFormData({...formData, leader_id: val})}
                options={leaders
                  .filter(l => l.id !== collaborator?.id)
                  .map(l => ({ id: l.id, name: l.name }))
                }
              />
            </div>
          </div>

          {/* Cargo */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Cargo / Função</label>
            <input 
              type="text"
              className="w-full bg-gray-100/50 border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a]"
              value={formData.role || ''}
              onChange={e => setFormData({...formData, role: e.target.value})}
              placeholder="Ex: Advogado Pleno"
            />
          </div>
        </div>

        <div className="px-8 py-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button onClick={onClose} className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cancelar</button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="flex items-center gap-2 px-8 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Registro
          </button>
        </div>
      </div>

      <PartnerManagerModal 
        isOpen={isPartnerModalOpen} 
        onClose={() => setIsPartnerModalOpen(false)} 
        onUpdate={fetchData} 
      />

      <CollaboratorManagerModal 
        isOpen={isLeaderModalOpen} 
        onClose={() => setIsLeaderModalOpen(false)} 
        onUpdate={fetchData} 
      />
    </div>
  );
}