import React, { useState, useEffect, useRef } from 'react';
import { Search, Settings, ChevronDown, Plus, X, Pencil, Trash2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Option {
  id?: number;
  nome?: string;
  name?: string;
  value?: string;
  label?: string;
}

interface SearchableSelectProps {
  label: string;
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
  const [newOptionValue, setNewOptionValue] = useState('');
  const [editingOption, setEditingOption] = useState<{ id: number; name: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toTitleCase = (str: string) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
      return (word.length > 2) ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    }).join(' ');
  };

  // Carrega opções da tabela ou usa as externas
  useEffect(() => {
    if (table) {
      fetchOptions();
    } else {
      setOptions(externalOptions);
    }
  }, [table, externalOptions]);

  const fetchOptions = async () => {
    if (!table) return;
    const { data } = await supabase.from(table).select('*').order(nameField);
    if (data) setOptions(data);
  };

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getName = (opt: Option) => opt.nome || opt.name || opt.label || '';
  const getId = (opt: Option) => opt.id || 0;

  const filteredOptions = options.filter(opt => 
    getName(opt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => getName(opt) === value);

  const handleAddOption = async () => {
    if (!newOptionValue.trim() || !table) return;
    const val = toTitleCase(newOptionValue.trim());
    await supabase.from(table).insert({ [nameField]: val });
    setNewOptionValue('');
    await fetchOptions();
    if (onRefresh) onRefresh();
  };

  const handleUpdateOption = async () => {
    if (!editingOption || !editingOption.name.trim() || !table) return;
    await supabase.from(table).update({ [nameField]: toTitleCase(editingOption.name.trim()) }).eq('id', editingOption.id);
    setEditingOption(null);
    await fetchOptions();
    if (onRefresh) onRefresh();
  };

  const handleDeleteOption = async (id: number) => {
    if (!confirm('Deseja excluir este item?') || !table) return;
    await supabase.from(table).delete().eq('id', id);
    await fetchOptions();
    if (onRefresh) onRefresh();
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {label && <label className="block text-xs font-bold text-gray-700 uppercase mb-1">{label}</label>}
      
      {/* Campo principal */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full border border-gray-300 rounded-lg p-2.5 text-left focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all hover:border-blue-400 flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={value ? "text-gray-900 text-sm" : "text-gray-400 text-sm"}>
          {selectedOption ? toTitleCase(getName(selectedOption)) : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown com busca */}
      {isOpen && !isManaging && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Campo de busca */}
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>

          {/* Lista de opções */}
          <div className="max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
                setSearchTerm('');
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-400 hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              Selecione
            </button>
            {filteredOptions.map(opt => (
              <button
                key={getId(opt)}
                type="button"
                onClick={() => {
                  onChange(getName(opt));
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                  value === getName(opt) 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {toTitleCase(getName(opt))}
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                Nenhum resultado encontrado
              </div>
            )}
          </div>

          {/* Botão Gerenciar no rodapé */}
          {table && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsManaging(true);
                setSearchTerm('');
              }}
              className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 border-t border-gray-200 flex items-center gap-2 transition-colors bg-white"
            >
              <Settings className="h-4 w-4 text-gray-600" />
              <span>Gerenciar {label || 'Opções'}</span>
            </button>
          )}
        </div>
      )}

      {/* Modal de Gerenciamento */}
      {isManaging && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsManaging(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-200">
              <h3 className="font-semibold text-lg text-gray-900">
                Gerenciar {label}
              </h3>
              <button 
                onClick={() => {
                  setIsManaging(false);
                  setEditingOption(null);
                  setNewOptionValue('');
                }} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5"/>
              </button>
            </div>
            
            <div className="p-6">
              {/* Input para adicionar */}
              <div className="flex gap-2 mb-4">
                <input 
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Digite o nome"
                  value={newOptionValue}
                  onChange={e => setNewOptionValue(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddOption()}
                />
                <button 
                  onClick={handleAddOption} 
                  className="bg-gray-800 text-white p-2 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
                  disabled={!newOptionValue.trim()}
                >
                  <Plus className="h-5 w-5"/>
                </button>
              </div>

              {/* Lista de itens */}
              <div className="max-h-72 overflow-y-auto space-y-1">
                {options.map(opt => (
                  <div 
                    key={getId(opt)} 
                    className="flex items-center justify-between p-3 rounded hover:bg-gray-50 transition-colors group"
                  >
                    {editingOption?.id === getId(opt) ? (
                      <>
                        <input 
                          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm mr-2 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={editingOption.name}
                          onChange={e => setEditingOption({...editingOption, name: e.target.value})}
                          onKeyPress={e => e.key === 'Enter' && handleUpdateOption()}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button 
                            onClick={handleUpdateOption}
                            className="text-green-600 hover:bg-green-50 p-1 rounded"
                            title="Salvar"
                          >
                            <Save className="h-4 w-4"/>
                          </button>
                          <button 
                            onClick={() => setEditingOption(null)}
                            className="text-gray-500 hover:bg-gray-100 p-1 rounded"
                            title="Cancelar"
                          >
                            <X className="h-4 w-4"/>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-gray-700 flex-1">{toTitleCase(getName(opt))}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setEditingOption({ id: getId(opt), name: getName(opt) })}
                            className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4"/>
                          </button>
                          <button 
                            onClick={() => handleDeleteOption(getId(opt))}
                            className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
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
                  <div className="text-center py-8 text-sm text-gray-500">
                    Nenhum item cadastrado
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
