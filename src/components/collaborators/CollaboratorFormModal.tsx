// src/components/collaborators/CollaboratorFormModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Save, Settings2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Collaborator, Partner } from '../../types/controladoria';
import { createPortal } from 'react-dom';
import { useEscKey } from '../../hooks/useEscKey';
import { ManagedMultiSelect } from '../crm/ManagedMultiSelect';
import { PartnerManagerModal } from './modals/PartnerManagerModal';
import { CollaboratorManagerModal } from './modals/CollaboratorManagerModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  collaborator?: Collaborator;
  onSave: () => void;
}

export function CollaboratorFormModal({ isOpen, onClose, collaborator, onSave }: Props) {
  useEscKey(isOpen, onClose);
  const [loading, setLoading] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);
  const [roleChangeDate, setRoleChangeDate] = useState('');

  const [formData, setFormData] = useState<Partial<Collaborator>>({
    name: '',
    partner_ids: [],
    leader_ids: [],
    status: 'active',
    role: '',
    linkedin_url: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (collaborator) {
        setFormData({
          ...collaborator,
          partner_ids: collaborator.partner_ids || [],
          leader_ids: collaborator.leader_ids || []
        });
      } else {
        setFormData({ name: '', partner_ids: [], leader_ids: [], status: 'active', role: '', linkedin_url: '' });
      }
      setRoleChangeDate('');
      fetchData();
    }
  }, [isOpen, collaborator]);

  const fetchData = async () => {
    // Other fetching logic if needed in the future
  };

  const handleSave = async () => {
    if (!formData.name) return alert("Nome é obrigatório");

    setLoading(true);
    try {
      // Remove campos relacionais que não existem na tabela
      const {
        // @ts-ignore
        leader,
        // @ts-ignore
        partner,
        // @ts-ignore
        roles,
        // @ts-ignore
        locations,
        // @ts-ignore
        teams,
        ...rest
      } = formData;

      const payload = {
        ...rest,
        partner_ids: formData.partner_ids && formData.partner_ids.length > 0 ? formData.partner_ids : null,
        leader_ids: formData.leader_ids && formData.leader_ids.length > 0 ? formData.leader_ids : null,
        partner_id: formData.partner_ids?.[0] || null,
        leader_id: formData.leader_ids?.[0] || null
      };

      console.log('DEBUG: Payload being sent:', payload);


      if (collaborator?.id) {
        if (collaborator.role !== formData.role) {
          try {
            // Find the last role change to calculate duration
            const { data: lastChange } = await supabase
              .from('collaborator_role_history')
              .select('change_date')
              .eq('collaborator_id', collaborator.id)
              .order('change_date', { ascending: false })
              .limit(1)
              .single();

            const startDateStr = lastChange?.change_date || collaborator.hire_date || collaborator.created_at || new Date().toISOString();
            const startDate = new Date(startDateStr);
            const today = new Date();
            const diffTime = Math.abs(today.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const changeDateToUse = roleChangeDate || today.toISOString();

            const historyPayload = {
              collaborator_id: collaborator.id,
              previous_role: collaborator.role || 'Não preenchido',
              new_role: formData.role || 'Não preenchido',
              duration_days: diffDays,
              change_date: changeDateToUse
            };

            const { error: histError } = await supabase.from('collaborator_role_history').insert([historyPayload]);
            if (histError) console.error('Erro ao salvar histórico de cargo:', histError);
          } catch (err) {
            console.error('Erro ao processar histórico de cargo:', err);
          }
        }

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

  return createPortal(
    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">

        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-[20px] font-black text-[#0a192f] tracking-tight">
            {collaborator ? 'Editando Integrante' : 'Novo Integrante'}
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
              onChange={e => setFormData({ ...formData, name: toTitleCase(e.target.value) })}
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
              <ManagedMultiSelect
                placeholder="Selecione o(s) Sócio(s)"
                value={formData.partner_ids || []}
                onChange={(val) => setFormData({ ...formData, partner_ids: val })}
                tableName="partners"
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
              <ManagedMultiSelect
                placeholder="Selecione o(s) Líder(es)"
                value={formData.leader_ids || []}
                onChange={(val) => setFormData({ ...formData, leader_ids: val })}
                tableName="collaborators"
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
              onChange={e => setFormData({ ...formData, role: toTitleCase(e.target.value) })}
              placeholder="Ex: Advogado Pleno"
            />
          </div>

          {collaborator?.id && collaborator.role !== formData.role && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-2 ml-1">Data da Mudança de Cargo</label>
              <input
                type="date"
                className="w-full bg-blue-50/50 border border-blue-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] text-[#0a192f]"
                value={roleChangeDate}
                onChange={e => setRoleChangeDate(e.target.value)}
                required
              />
              <p className="text-[9px] text-gray-500 mt-1 ml-1 font-medium">
                Informe a data em que o integrante assumirá o novo cargo.
              </p>
            </div>
          )}
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
    </div>,
    document.body
  );
}
