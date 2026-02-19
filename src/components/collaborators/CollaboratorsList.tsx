// src/components/collaborators/CollaboratorsList.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Collaborator } from '../../types/controladoria';
import { Edit, Trash2, User, Crown, Briefcase, Loader2 } from 'lucide-react';
import { CollaboratorFormModal } from './CollaboratorFormModal';

export function CollaboratorsList() {
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCollab, setSelectedCollab] = useState<Collaborator | undefined>();

  useEffect(() => {
    fetchCollaborators();
  }, []);

  const fetchCollaborators = async () => {
    setLoading(true);
    // Realizamos o join com partners e com a própria tabela collaborators (líder)
    const { data, error } = await supabase
      .from('collaborators')
      .select(`
        *,
        partner:partners(name),
        leader:collaborators!collaborators_leader_id_fkey(name)
      `)
      .order('name');

    if (error) console.error('Erro:', error);
    else setCollaborators(data || []);
    setLoading(false);
  };

  const handleEdit = (collab: Collaborator) => {
    setSelectedCollab(collab);
    setIsModalOpen(true);
  };

  if (loading) return (
    <div className="flex justify-center p-12">
      <Loader2 className="w-8 h-8 animate-spin text-[#1e3a8a]" />
    </div>
  );

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
            <th className="p-5 text-[10px] font-black text-white uppercase tracking-widest">Colaborador</th>
            <th className="p-5 text-[10px] font-black text-white uppercase tracking-widest">Sócio Responsável</th>
            <th className="p-5 text-[10px] font-black text-white uppercase tracking-widest">Líder Direto</th>
            <th className="p-5 text-[10px] font-black text-white uppercase tracking-widest">Status</th>
            <th className="p-5 text-[10px] font-black text-white uppercase tracking-widest text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {collaborators.map((collab) => (
            <tr key={collab.id} className="hover:bg-blue-50/30 transition-all group">
              <td className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1e3a8a]/10 flex items-center justify-center text-[#1e3a8a]">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#0a192f] uppercase tracking-tight">{collab.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{collab.role || 'Não definido'}</p>
                  </div>
                </div>
              </td>
              <td className="p-5 text-xs font-bold text-gray-600">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3 h-3 text-blue-500" />
                  {collab.partner?.name || '-'}
                </div>
              </td>
              <td className="p-5 text-xs font-bold text-gray-600">
                <div className="flex items-center gap-2">
                  <Crown className="w-3 h-3 text-amber-500" />
                  {collab.leader?.name || '-'}
                </div>
              </td>
              <td className="p-5">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${collab.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                  {collab.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="p-5">
                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(collab)}
                    className="p-2 hover:bg-white rounded-lg text-blue-600 shadow-sm border border-transparent hover:border-gray-100 transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <CollaboratorFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        collaborator={selectedCollab}
        onSave={fetchCollaborators}
      />
    </div>
  );
}