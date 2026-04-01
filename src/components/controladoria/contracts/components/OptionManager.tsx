import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Check, Plus, Pencil, Trash2 } from 'lucide-react';

interface OptionManagerProps {
  type: string;
  lists: {
    legalAreas: string[];
    billingLocations: string[];
    courtOptions: string[];
    classOptions: string[];
    subjectOptions: string[];
    positionsList: string[];
    varaOptions: string[];
    justiceOptions: string[];
    comarcaOptions: string[];
    magistrateOptions: string[];
    opponentOptions: string[];
    authorOptions: string[];
    clientOptions: string[];
  };
  maps?: {
    clientCnpjMap?: Record<string, string>;
    opponentCnpjMap?: Record<string, string>;
  };
  onAdd: (val: string, extra?: any) => Promise<boolean>;
  onRemove: (val: string) => void;
  onEdit: (oldVal: string, newVal: string, extra?: any) => Promise<boolean>;
  onClose: () => void;
  isOpen: boolean;
  editingValue: string | null;
  setEditingValue: React.Dispatch<React.SetStateAction<string | null>>;
  placeholder?: string;
}

export const OptionManager = ({
  type,
  lists,
  maps,
  onAdd,
  onRemove,
  onEdit,
  onClose,
  isOpen,
  editingValue,
  setEditingValue,
  placeholder = "Digite o nome"
}: OptionManagerProps) => {
    const [inputValue, setInputValue] = useState('');
    const [inputCnpj, setInputCnpj] = useState('');
    const [loading, setLoading] = useState(false);
    
    const isCnpjEnabled = type === 'client' || type === 'opponent';

    const getCnpjMap = () => {
        if (type === 'client') return maps?.clientCnpjMap || {};
        if (type === 'opponent') return maps?.opponentCnpjMap || {};
        return {};
    };

    const maskCNPJ = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,4})/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };
    
    // Get the right list
    const getOptionsList = () => {
        switch (type) {
            case 'area': return lists.legalAreas;
            case 'location': return lists.billingLocations;
            case 'court': return lists.courtOptions;
            case 'class': return lists.classOptions;
            case 'subject': return lists.subjectOptions;
            case 'position': return lists.positionsList;
            case 'vara': return lists.varaOptions;
            case 'justice': return lists.justiceOptions;
            case 'comarca': return lists.comarcaOptions;
            case 'magistrate': return lists.magistrateOptions;
            case 'opponent': return lists.opponentOptions;
            case 'author': return lists.authorOptions;
            case 'client': return lists.clientOptions;
            default: return [];
        }
    };
    
    const getTitle = () => {
        switch (type) {
            case 'area': return 'Gerenciar Áreas';
            case 'location': return 'Gerenciar Locais';
            case 'court': return 'Gerenciar Tribunais';
            case 'class': return 'Gerenciar Classes';
            case 'subject': return 'Gerenciar Assuntos';
            case 'position': return 'Gerenciar Posições';
            case 'vara': return 'Gerenciar Varas';
            case 'justice': return 'Gerenciar Justiças';
            case 'comarca': return 'Gerenciar Comarcas';
            case 'magistrate': return 'Gerenciar Magistrados';
            case 'opponent': return 'Gerenciar Contrário';
            case 'author': return 'Gerenciar Autores';
            case 'client': return 'Gerenciar Clientes';
            default: return 'Gerenciar';
        }
    };

    const options = getOptionsList();
    const title = getTitle();

    React.useEffect(() => {
        if (isOpen) {
            if (editingValue) {
                setInputValue(editingValue);
                if (isCnpjEnabled) {
                    const cnpjMap = getCnpjMap();
                    setInputCnpj(maskCNPJ(cnpjMap[editingValue] || ''));
                }
            } else {
                setInputValue('');
                setInputCnpj('');
            }
        }
    }, [isOpen, editingValue, type, maps]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!inputValue.trim()) return;
        setLoading(true);
        let success = false;
        
        const extraArgs = isCnpjEnabled ? { cnpj: inputCnpj } : undefined;

        if (editingValue) {
            success = await onEdit(editingValue, inputValue.trim(), extraArgs);
            if (success) setEditingValue(null);
        } else {
            success = await onAdd(inputValue.trim(), extraArgs);
            if (success) onClose();
        }
        
        setLoading(false);
        if (success) {
            setInputValue('');
            setInputCnpj('');
        }
    };

    const handleEditClick = (item: string) => {
        setEditingValue(item);
        setInputValue(item);
        if (isCnpjEnabled) {
             const cnpjMap = getCnpjMap();
             setInputCnpj(maskCNPJ(cnpjMap[item] || ''));
        }
    };

    const handleCancelEdit = () => {
        setEditingValue(null);
        setInputValue('');
        setInputCnpj('');
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">{title}</h3>
              <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            
            <div className="p-4">
              <div className={`flex gap-2 mb-4 ${isCnpjEnabled ? 'flex-col sm:flex-row' : ''}`}>
                <input 
                  type="text" 
                  className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                  placeholder={placeholder}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                />
                {isCnpjEnabled && (
                  <input 
                    type="text" 
                    className="w-full sm:w-48 border border-gray-300 rounded-lg p-2 text-sm"
                    placeholder="CNPJ (opcional)"
                    value={inputCnpj}
                    onChange={(e) => setInputCnpj(maskCNPJ(e.target.value))}
                    maxLength={18}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                )}
                <div className="flex gap-2 shrink-0">
                    {editingValue && (
                        <button 
                            onClick={handleCancelEdit}
                            className="bg-gray-200 text-gray-600 p-2 rounded-lg hover:bg-gray-300 flex-1 sm:flex-none justify-center"
                            title="Cancelar edição"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                    <button 
                      onClick={handleSubmit}
                      disabled={loading}
                      className={`${editingValue ? 'bg-green-600 hover:bg-green-700' : 'bg-salomao-blue'} flex-1 sm:flex-none justify-center text-white p-2 rounded-lg disabled:opacity-50 transition-colors flex items-center`}
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : (editingValue ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />)}
                    </button>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {options.map((opt, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-2 rounded-lg group ${editingValue === opt ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                    <div className="flex flex-col flex-1 truncate mr-2">
                        <span className="text-sm font-medium text-gray-800 truncate">{opt}</span>
                        {isCnpjEnabled && getCnpjMap()[opt] && (
                            <span className="text-[10px] text-gray-500 font-mono mt-0.5">{maskCNPJ(getCnpjMap()[opt])}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button 
                            onClick={() => handleEditClick(opt)} 
                            className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-100 rounded"
                            title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => onRemove(opt)} 
                            className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                            title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </div>
                ))}
                {options.length === 0 && <p className="text-xs text-center text-gray-400 py-4">Nenhum item cadastrado.</p>}
              </div>
            </div>
          </div>
        </div>,
        document.body
    );
};