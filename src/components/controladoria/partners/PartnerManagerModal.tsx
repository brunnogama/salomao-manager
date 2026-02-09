import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit, Save, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase'; // Caminho corrigido
import { Partner } from '../../../types/controladoria'; // Caminho corrigido

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (newId?: string) => void;
}

export function PartnerManagerModal({ isOpen, onClose, onUpdate }: Props) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estado unificado para formulário (nome e email)
  const [formData, setFormData] = useState({ name: '', email: '' });

  useEffect(() => {
    if (isOpen) fetchPartners();
  }, [isOpen]);

  const fetchPartners = async () => {
    setLoading(true);
    const { data } = await supabase.from('partners').select('*').order('name');
    if (data) setPartners(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
        if (editingId) {
            // Atualizar
            const { error } = await supabase
                .from('partners')
                .update({ 
                    name: formData.name.trim(),
                    email: formData.email.trim() 
                })
                .eq('id', editingId);
            if (error) throw error;

            setFormData({ name: '', email: '' });
            setEditingId(null);
            fetchPartners();
            if (onUpdate) onUpdate();
        } else {
            // Criar novo
            const { data, error } = await supabase
                .from('partners')
                .insert([{ 
                    name: formData.name.trim(), 
                    email: formData.email.trim(),
                    active: true 
                }])
                .select()
                .single();
            
            if (error) throw error;

            // Limpa formulário
            setFormData({ name: '', email: '' });
            
            // Passa o ID do novo item e fecha o modal
            if (onUpdate) onUpdate(data.id);
            onClose();
        }
    } catch (error: any) {
        console.error('Erro ao salvar sócio:', error);
        alert('Erro ao salvar: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleEdit = (partner: Partner) => {
    setEditingId(partner.id);
    setFormData({ 
        name: partner.name,
        email: partner.email || '' 
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', email: '' });
  };

  const handleToggleActive = async (partner: Partner) => {
    try {
        await supabase.from('partners').update({ active: !partner.active }).eq('id', partner.id);
        fetchPartners();
        if (onUpdate) onUpdate();
    } catch (error) {
        console.error("Erro ao alterar status:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-white/20">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#0a192f]">
          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Gerenciar Sócios</h3>
          <button onClick={onClose} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Formulário */}
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
             <div className="md:col-span-5">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Nome do Sócio *</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all bg-white" 
                  placeholder="Nome completo" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  disabled={loading}
                />
             </div>
             <div className="md:col-span-5">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">E-mail Corporativo</label>
                <input 
                  type="email" 
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all bg-white" 
                  placeholder="email@salomao.com.br" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  disabled={loading}
                />
             </div>
             <div className="md:col-span-2 flex items-end">
                {editingId ? (
                    <div className="flex gap-2 w-full">
                        <button onClick={handleSave} disabled={loading} className="flex-1 bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 shadow-md transition-all active:scale-95 flex justify-center"><Save className="w-5 h-5" /></button>
                        <button onClick={handleCancelEdit} disabled={loading} className="flex-1 bg-gray-200 text-gray-600 p-3 rounded-xl hover:bg-gray-300 transition-all active:scale-95 flex justify-center"><X className="w-5 h-5" /></button>
                    </div>
                ) : (
                    <button onClick={handleSave} disabled={loading || !formData.name.trim()} className="w-full bg-[#0a192f] text-white p-3 rounded-xl hover:bg-slate-800 shadow-lg flex justify-center items-center gap-1 text-[11px] font-black uppercase tracking-widest transition-all active:scale-95">
                        <Plus className="w-4 h-4" /> Add
                    </button>
                )}
             </div>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           {loading && partners.length === 0 ? (
               <div className="text-center py-12">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a192f] mx-auto"></div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">Carregando base de dados...</p>
               </div>
           ) : partners.length === 0 ? (
               <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nenhum sócio cadastrado</p>
               </div>
           ) : (
            <div className="space-y-3">
                {partners.map(partner => (
                <div key={partner.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl group hover:border-[#0a192f]/20 hover:shadow-md transition-all">
                    <div className="flex-1">
                        <h3 className={`text-sm font-black uppercase tracking-tight ${!partner.active ? 'text-gray-300 line-through' : 'text-[#0a192f]'}`}>{partner.name}</h3>
                        {partner.email && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{partner.email}</p>}
                    </div>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button onClick={() => handleEdit(partner)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Editar"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleToggleActive(partner)} className={`p-2 rounded-xl transition-colors ${partner.active ? "text-red-500 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`} title={partner.active ? "Desativar" : "Ativar"}>
                          {partner.active ? <Trash2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                    </div>
                </div>
                ))}
            </div>
           )}
        </div>
      </div>
    </div>
  );
}