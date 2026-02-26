// src/components/collaborators/modals/PartnerManagerModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2, Search, UserCheck, UserMinus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Partner } from '../../../types/controladoria';
import { useEscKey } from '../../../hooks/useEscKey';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function PartnerManagerModal({ isOpen, onClose, onUpdate }: Props) {
  useEscKey(isOpen, onClose);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) fetchPartners();
  }, [isOpen]);

  const fetchPartners = async () => {
    setLoading(true);
    const { data } = await supabase.from('partners').select('*').order('name');
    if (data) setPartners(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('partners').insert([{ name: newName.trim(), status: 'active' }]);
    if (!error) {
      setNewName('');
      fetchPartners();
      if (onUpdate) onUpdate();
    }
    setLoading(false);
  };

  const toggleStatus = async (partner: Partner) => {
    const newStatus = partner.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('partners').update({ status: newStatus }).eq('id', partner.id);
    if (!error) {
      fetchPartners();
      if (onUpdate) onUpdate();
    }
  };

  const filteredPartners = partners.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">

        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-black text-[#0a192f] uppercase tracking-tight">Gerenciar Sócios</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-all">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-8 pb-4">
          {/* Adicionar Novo */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              className="flex-1 bg-gray-100/50 border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
              placeholder="Nome do novo sócio"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <button
              onClick={handleAdd}
              disabled={loading || !newName.trim()}
              className="bg-[#1e3a8a] text-white p-3 rounded-xl hover:bg-[#112240] transition-all disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de Busca Interna */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-10 py-2 text-xs font-bold uppercase tracking-widest outline-none focus:border-[#1e3a8a] transition-all"
              placeholder="Filtrar sócios..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {filteredPartners.length > 0 ? (
              filteredPartners.map(p => (
                <div key={p.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-blue-200 transition-all">
                  <div>
                    <p className={`text-sm font-bold ${p.status === 'inactive' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {p.name}
                    </p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{p.status === 'active' ? 'Ativo' : 'Inativo'}</p>
                  </div>
                  <button
                    onClick={() => toggleStatus(p)}
                    className={`p-2 rounded-lg transition-all ${p.status === 'active' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-500 hover:bg-amber-50'}`}
                  >
                    {p.status === 'active' ? <UserCheck className="w-5 h-5" /> : <UserMinus className="w-5 h-5" />}
                  </button>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nenhum sócio encontrado</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-[9px] font-black text-center text-gray-400 uppercase tracking-tighter">
            Gerenciamento centralizado de Sócios
          </p>
        </div>
      </div>
    </div>
  );
}