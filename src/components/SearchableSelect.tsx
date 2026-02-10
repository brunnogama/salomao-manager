// src/components/SearchableSelect.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, Settings, ChevronDown, Plus, X, Pencil, Trash2, Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase'; // AJUSTADO: de ../../ para ../

interface Option {
  id?: number;
  nome?: string;
  name?: string;
  value?: string;
  label?: string;
}

interface SearchableSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  table?: string; // Nome da tabela no Supabase para gerenciar opções
  nameField?: string; // Campo do nome na tabela (padrão: 'nome')
  options?: Option[]; // Opções estáticas (se não usar tabela)
  onRefresh?: () => void; // Callback para atualizar lista após mudanças
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  label,
  value,
  onChange,
  placeholder = "Selecione",
  table,
  nameField = 'nome',
  options: externalOptions = [],
  onRefresh,
  disabled = false,
  className = ""
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para gerenciamento (Add/Edit)
  const [newOptionValue, setNewOptionValue] = useState('');
  const [editingOption, setEditingOption] = useState<{ id: number; name: string } | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const managingRef = useRef<HTMLDivElement>(null); // Ref para o modal de gerenciamento

  const toTitleCase = (str: string) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
      return (word.length > 2) ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    }).join(' ');
  };

  // Carrega opções
  useEffect(() => {
    if (table) {
      if (isOpen) { // Só busca se estiver aberto para economizar recursos e evitar loops
          fetchOptions();
      }
    } else {
      setOptions(externalOptions);
    }
  }, [table, isOpen]); // Dependências controladas

  const fetchOptions = async () => {
    if (!table) return;
    setLoading(true);
    const { data } = await supabase.from(table).select('*').order(nameField);
    if (data) setOptions(data);
    setLoading(false);
  };

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Se estiver gerenciando, verifica se clicou dentro do modal de gerenciamento
      if (isManaging && managingRef.current && managingRef.current.contains(event.target as Node)) {
        return; 
      }

      // Se clicou fora do dropdown e não está no modal de gerenciamento
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Se estiver gerenciando, não fecha o dropdown principal ainda, apenas se não for clique no modal
        if (!isManaging) {
            setIsOpen(false);
            setSearchTerm('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isManaging]);

  const getName = (opt: Option) => opt.nome || opt.name || opt.label || '';
  const getId = (opt: Option) => opt.id || 0;

  const filteredOptions = options.filter(opt => 
    getName(opt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => getName(opt).toLowerCase() === value.toLowerCase());

  // --- CRUD OPÇÕES ---
  const handleAddOption = async () => {
    if (!newOptionValue.trim() || !table) return;
    const val = toTitleCase(newOptionValue.trim());
    
    const { error } = await supabase.from(table).insert({ [nameField]: val });
    if (error) {
        alert('Erro ao adicionar: ' + error.message);
        return;
    }

    setNewOptionValue('');
    await fetchOptions();
    if (onRefresh) onRefresh();
  };

  const handleUpdateOption = async () => {
    if (!editingOption || !editingOption.name.trim() || !table) return;
    
    const { error } = await supabase.from(table).update({ [nameField]: toTitleCase(editingOption.name.trim()) }).eq('id', editingOption.id);
    if (error) {
        alert('Erro ao atualizar: ' + error.message);
        return;
    }

    setEditingOption(null);
    await fetchOptions();
    if (onRefresh) onRefresh();
  };

  const handleDeleteOption = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta opção?')) return;
    if (!table) return;
    
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
        alert('Erro ao excluir: ' + error.message);
        return;
    }

    await fetchOptions();
    if (onRefresh) onRefresh();
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {label && <label className="block text-xs font-bold text-gray-700 uppercase mb-1">{label}</label>}
      
      {/* TRIGGER DO DROPDOWN */}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full border border-gray-300 rounded-lg p-2.5 text-left bg-white 
          flex items-center justify-between cursor-pointer transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 focus-within:ring-2 focus-within:ring-[#112240]'}
        `}
      >
        <span className={`text-sm truncate ${value ? "text-gray-900" : "text-gray-400"}`}>
          {selectedOption ? toTitleCase(getName(selectedOption)) : (value || placeholder)}
        </span>
        
        <div className="flex items-center gap-1">
            {value && !disabled && (
                <button 
                    onClick={handleClearSelection}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors mr-1"
                    title="Limpar seleção"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* DROPDOWN MENU */}
      {isOpen && !isManaging && (
        <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-[99999]">
          
          <div className="p-2 border-b border-gray-100 bg-gray-50 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-[#112240] focus:border-[#112240] outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar max-h-60">
            {loading ? (
                <div className="flex items-center justify-center py-4 text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                </div>
            ) : (
                <>
                    {filteredOptions.map((opt, idx) => (
                    <button
                        key={getId(opt) || idx}
                        type="button"
                        onClick={() => {
                        onChange(getName(opt));
                        setIsOpen(false);
                        setSearchTerm('');
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors border-b border-gray-50 last:border-0 hover:bg-gray-50 ${
                        value.toLowerCase() === getName(opt).toLowerCase()
                            ? 'bg-blue-50 text-blue-900 font-bold' 
                            : 'text-gray-700'
                        }`}
                    >
                        {toTitleCase(getName(opt))}
                    </button>
                    ))}

                    {filteredOptions.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center italic">
                        Nenhum resultado
                    </div>
                    )}
                </>
            )}
          </div>

          {table && (
            <div className="border-t border-gray-200 bg-gray-50 p-1.5 shrink-0 z-10">
                <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsManaging(true);
                    setSearchTerm('');
                }}
                className="w-full px-3 py-2 text-center text-xs font-bold text-[#112240] bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-md shadow-sm flex items-center justify-center gap-2 transition-all uppercase tracking-wide"
                >
                <Settings className="h-3.5 w-3.5" />
                Gerenciar Opções
                </button>
            </div>
          )}
        </div>
      )}

       {/* MODAL DE GERENCIAMENTO (Add/Edit/Delete) */}
      {isManaging && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100000] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsManaging(false)}
        >
          <div 
            ref={managingRef} // REF AQUI para controlar cliques
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 flex justify-between items-center border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-base text-gray-800 flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-500"/>
                Gerenciar: {label}
              </h3>
              <button 
                onClick={() => {
                  setIsManaging(false);
                  setEditingOption(null);
                  setNewOptionValue('');
                }} 
                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-white"
              >
                <X className="h-5 w-5"/>
              </button>
            </div>
            
            <div className="p-5">
              <div className="flex gap-2 mb-4">
                <input 
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#112240] focus:border-transparent placeholder:text-gray-400" 
                  placeholder="Nova opção..."
                  value={newOptionValue}
                  onChange={e => setNewOptionValue(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddOption()}
                  autoFocus
                />
                <button 
                  onClick={handleAddOption} 
                  className="bg-[#112240] text-white p-2.5 rounded-lg hover:bg-[#1a3a6c] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  disabled={!newOptionValue.trim()}
                  title="Adicionar"
                >
                  <Plus className="h-5 w-5"/>
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {options.map(opt => (
                  <div 
                    key={getId(opt)} 
                    className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all group"
                  >
                    {editingOption?.id === getId(opt) ? (
                      <>
                        <input 
                          className="flex-1 border border-blue-300 rounded px-2 py-1 text-sm mr-2 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                          value={editingOption.name}
                          onChange={e => setEditingOption({...editingOption, name: e.target.value})}
                          onKeyPress={e => e.key === 'Enter' && handleUpdateOption()}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button 
                            onClick={handleUpdateOption}
                            className="bg-green-100 text-green-700 hover:bg-green-200 p-1.5 rounded-md transition-colors"
                            title="Salvar"
                          >
                            <Save className="h-4 w-4"/>
                          </button>
                          <button 
                            onClick={() => setEditingOption(null)}
                            className="bg-gray-200 text-gray-600 hover:bg-gray-300 p-1.5 rounded-md transition-colors"
                            title="Cancelar"
                          >
                            <X className="h-4 w-4"/>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-gray-700 flex-1 font-medium">{toTitleCase(getName(opt))}</span>
                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setEditingOption({ id: getId(opt), name: getName(opt) })}
                            className="text-blue-600 hover:bg-blue-100 p-1.5 rounded-md transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4"/>
                          </button>
                          <button 
                            onClick={() => handleDeleteOption(getId(opt))}
                            className="text-red-600 hover:bg-red-100 p-1.5 rounded-md transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4"/>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                
                {options.length === 0 && (
                  <div className="text-center py-6 text-sm text-gray-400 italic">
                    Nenhum item cadastrado ainda.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}