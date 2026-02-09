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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 border border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <h3 className="text-xs font-black text-[#0a192f] uppercase tracking-widest">{title}</h3>
              <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Input Area */}
              <div className="flex gap-2 mb-6">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-medium focus:border-[#0a192f] outline-none transition-all placeholder:text-gray-300 shadow-sm"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                </div>
                {editingItem && (
                    <button 
                        onClick={handleCancelEdit}
                        className="bg-gray-100 text-gray-500 p-2.5 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200"
                        title="Cancelar edição"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
                <button 
                  onClick={handleSubmit}
                  disabled={loading || !inputValue.trim()}
                  className={`${editingItem ? 'bg-green-600 hover:bg-green-700' : 'bg-[#0a192f] hover:bg-slate-800'} text-white p-2.5 rounded-lg disabled:opacity-50 transition-all shadow-md active:scale-95`}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : (editingItem ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />)}
                </button>
              </div>

              {/* List Area */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {options.length > 0 ? (
                  options.map((opt, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-3 rounded-xl transition-all group border ${editingItem === opt ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-transparent hover:border-gray-200 hover:bg-white'}`}>
                      <span className="text-[11px] font-bold text-gray-700 truncate flex-1 mr-3 uppercase tracking-tight">{opt}</span>
                      <div className="flex items-center gap-1">
                          <button 
                              onClick={() => handleEditClick(opt)} 
                              className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-blue-100 rounded-lg"
                              title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                              onClick={() => onRemove(opt)} 
                              className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-100 rounded-lg"
                              title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="p-3 bg-gray-50 rounded-full mb-2">
                      <Plus className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nenhum item cadastrado</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={onClose}
                className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-800 px-4 py-2 transition-colors"
              >
                Fechar Gerenciador
              </button>
            </div>
          </div>
        </div>
    );
};