import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { X, Plus, Edit, Trash2, Save } from 'lucide-react';
import { Analyst } from '../../../types/controladoria';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (newId?: string) => void;
}

export function AnalystManagerModal({ isOpen, onClose, onUpdate }: Props) {
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '' });

  useEffect(() => {
    if (isOpen) {
      fetchAnalysts();
    }
  }, [isOpen]);

  const fetchAnalysts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('analysts')
      .select('*')
      .order('name', { ascending: true });
    
    if (data) setAnalysts(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('analysts')
          .update({ 
            name: formData.name.trim(),
            email: formData.email.trim()
          })
          .eq('id', editingId);
        
        if (error) throw error;

        setFormData({ name: '', email: '' });
        setEditingId(null);
        fetchAnalysts();
        onUpdate();
      } else {
        const { data, error } = await supabase
          .from('analysts')
          .insert([{ 
            name: formData.name.trim(),
            email: formData.email.trim(),
            active: true
          }])
          .select()
          .single();
        
        if (error) throw error;

        setFormData({ name: '', email: '' });
        // Passa o ID do novo item e fecha o modal
        onUpdate(data.id);
        onClose();
      }
    } catch (error: any) {
      console.error('Erro ao salvar analista:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (analyst: Analyst) => {
    setEditingId(analyst.id);
    setFormData({ 
      name: analyst.name,
      email: analyst.email || ''
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este analista?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('analysts')
        .update({ active: false })
        .eq('id', id);
      
      if (error) throw error;
      
      fetchAnalysts();
      onUpdate();
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-white/20">
        {/* Header - Navy Estilizado */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#0a192f]">
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Gerenciar Analistas</h2>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form - Estilo Densa */}
        <div className="p-8 border-b border-gray-100 bg-gray-50/30">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                Nome do Analista <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all bg-white"
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="md:col-span-5">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                E-mail Corporativo
              </label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all bg-white"
                placeholder="email@salomao.com.br"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                onClick={handleSave}
                disabled={loading || !formData.name.trim()}
                className="w-full bg-[#0a192f] text-white p-3 rounded-xl hover:bg-slate-800 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                {editingId ? <><Save className="w-4 h-4 text-amber-500" /> Salvar</> : <><Plus className="w-4 h-4 text-amber-500" /> Add</>}
              </button>
            </div>
          </div>
        </div>

        {/* List - Custom Scrollbar */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading && analysts.length === 0 ? (
            <div className="text-center py-12">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a192f] mx-auto"></div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">Sincronizando base...</p>
            </div>
          ) : analysts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nenhum analista cadastrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analysts.map((analyst) => (
                <div
                  key={analyst.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl group hover:border-amber-200 hover:shadow-md transition-all"
                >
                  <div className="flex-1">
                    <h3 className="text-xs font-black text-[#0a192f] uppercase tracking-tight">{analyst.name}</h3>
                    {analyst.email && (
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{analyst.email}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button
                      onClick={() => handleEdit(analyst)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(analyst.id)}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Navy Estilizado */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-white border border-gray-200 text-[#0a192f] rounded-xl hover:bg-gray-100 text-[10px] font-black uppercase tracking-widest shadow-sm transition-all active:scale-95"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
}