import React, { useState } from 'react';
import { X, Loader2, Check, Plus, Pencil, Trash2 } from 'lucide-react';

interface OptionManagerProps {
  title: string;
  options: string[];
  onAdd: (val: string) => Promise<boolean>;
  onRemove: (val: string) => void;
  onEdit: (oldVal: string, newVal: string) => Promise<boolean>;
  onClose: () => void;
  placeholder?: string;
}

export const OptionManager = ({ 
  title, 
  options, 
  onAdd, 
  onRemove, 
  onEdit,
  onClose,
  placeholder = "Digite o nome"
}: OptionManagerProps) => {
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingItem, setEditingItem] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!inputValue.trim()) return;
        setLoading(true);
        let success = false;
        
        if (editingItem) {
            success = await onEdit(editingItem, inputValue.trim());
            if (success) setEditingItem(null);
        } else {
            success = await onAdd(inputValue.trim());
            if (success) onClose();
        }
        
        setLoading(false);
        if (success) setInputValue('');
    };

    const handleEditClick = (item: string) => {
        setEditingItem(item);
        setInputValue(item);
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
        setInputValue('');
    };

    return (
        <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 animate-in zoom-in-95">
            {/* Header - Navy Estilizado */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#0a192f]">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{title}</h3>
              <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8">
              {/* Input Area */}
              <div className="flex gap-2 mb-8">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none transition-all placeholder:text-gray-300 shadow-sm bg-gray-50/50 uppercase"
                    placeholder={placeholder.toUpperCase()}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                </div>
                {editingItem && (
                    <button 
                        onClick={handleCancelEdit}
                        className="bg-white text-gray-400 p-3 rounded-xl hover:bg-gray-100 transition-all border border-gray-200 shadow-sm"
                        title="Cancelar edição"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
                <button 
                  onClick={handleSubmit}
                  disabled={loading || !inputValue.trim()}
                  className={`${editingItem ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-[#0a192f] hover:bg-slate-800'} text-white px-4 py-3 rounded-xl disabled:opacity-50 transition-all shadow-lg active:scale-95 flex items-center justify-center min-w-[50px]`}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : (editingItem ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5 text-amber-500" />)}
                </button>
              </div>

              {/* List Area */}
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {options.length > 0 ? (
                  options.map((opt, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl transition-all group border ${editingItem === opt ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-transparent hover:border-amber-200 hover:bg-white hover:shadow-md'}`}>
                      <span className="text-[11px] font-black text-[#0a192f] truncate flex-1 mr-3 uppercase tracking-widest">{opt}</span>
                      <div className="flex items-center gap-1">
                          <button 
                              onClick={() => handleEditClick(opt)} 
                              className="text-blue-500 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-white rounded-xl shadow-sm"
                              title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button 
                              onClick={() => onRemove(opt)} 
                              className="text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-white rounded-xl shadow-sm"
                              title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                    <div className="p-4 bg-white rounded-2xl mb-3 shadow-sm">
                      <Plus className="w-6 h-6 text-gray-200" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base de dados vazia</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-6 bg-gray-50/80 border-t border-gray-100 flex justify-end">
              <button 
                onClick={onClose}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-[#0a192f] px-6 py-2 transition-all active:scale-95"
              >
                Concluir & Fechar
              </button>
            </div>
          </div>
        </div>
    );
};