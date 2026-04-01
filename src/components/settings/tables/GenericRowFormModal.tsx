import { useState, useEffect } from 'react';
import { X, AlertTriangle, Key, Save } from 'lucide-react';
import type { TableSchema, ColumnSchema } from '../../../lib/schemaService';

interface GenericRowFormModalProps {
  isOpen: boolean;
  schema: TableSchema;
  initialData?: any;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
}

export function GenericRowFormModal({
  isOpen,
  schema,
  initialData,
  onClose,
  onSubmit,
  loading
}: GenericRowFormModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        // Initialize empty strings for required inputs
        const initData: any = {};
        schema.columns.forEach(c => {
          if (!c.isPrimaryKey) {
            initData[c.name] = c.type === 'boolean' ? false : (c.type === 'number' ? '' : '');
          }
        });
        setFormData(initData);
      }
    }
  }, [isOpen, initialData, schema]);

  if (!isOpen) return null;

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const renderInput = (col: ColumnSchema) => {
    if (col.isPrimaryKey) {
      return (
        <div key={col.name} className="flex flex-col gap-1 opacity-60">
          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
            <Key className="w-3 h-3 text-red-500" />
            {col.name} {col.isRequired ? '*' : ''}
          </label>
          <input 
            type="text" 
            value={formData[col.name] || 'Será gerado (Auto)'} 
            disabled 
            className="p-2 border rounded-md bg-gray-100 text-sm"
          />
        </div>
      );
    }

    if (col.type === 'boolean') {
      return (
        <div key={col.name} className="flex items-center gap-3 py-2">
          <input
            type="checkbox"
            id={`chk_${col.name}`}
            checked={!!formData[col.name]}
            onChange={(e) => handleChange(col.name, e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor={`chk_${col.name}`} className="text-sm font-bold text-gray-700 uppercase">
            {col.name}
          </label>
        </div>
      );
    }

    if (col.type === 'jsonb') {
      return (
        <div key={col.name} className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-700 uppercase">
            {col.name} (JSON) {col.isRequired ? '*' : ''}
          </label>
          <textarea
            rows={3}
            value={typeof formData[col.name] === 'object' ? JSON.stringify(formData[col.name], null, 2) : formData[col.name] || ''}
            onChange={(e) => {
              try {
                handleChange(col.name, JSON.parse(e.target.value));
              } catch (_) {
                handleChange(col.name, e.target.value);
              }
            }}
            className="p-2 border border-gray-300 rounded-md font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="{}"
          />
        </div>
      );
    }
    
    // Default text/number/uuid
    return (
      <div key={col.name} className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-700 uppercase flex justify-between items-center">
          <span>{col.name} {col.isRequired ? '*' : ''}</span>
          {col.isForeignKey && <span className="text-[9px] bg-red-100 text-red-600 px-1 py-0.5 rounded font-black">Chave Estrangeira (FK)</span>}
        </label>
        <input
          type={col.type === 'number' ? 'number' : col.type === 'timestamp' ? 'datetime-local' : 'text'}
          value={formData[col.name] || ''}
          onChange={(e) => handleChange(col.name, col.type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={col.isForeignKey ? 'Insira o UUID correto' : `Ex: valor para ${col.name}`}
          className="p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        {col.isForeignKey && (
          <p className="text-[10px] text-red-500 font-medium">Aviso: Inserir um ID que não existe na tabela de destino causará um erro.</p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-800 p-4 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Save className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{initialData ? 'Editar Registro' : 'Novo Registro'}</h3>
              <p className="text-blue-100 text-xs font-medium">Tabela: <span className="font-bold font-mono bg-black/20 px-1 rounded">{schema.tableName}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuidado */}
        {schema.columns.some(col => col.isForeignKey) && (
          <div className="bg-yellow-50 border-b border-yellow-200 p-3 shrink-0 flex gap-2 items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
            <p className="text-xs text-yellow-800 font-medium">
              Esta tabela exige relacionamentos rígidos (Foreign Keys). Certifique-se de inserir IDs (UUIDs) corretos, caso contrário o banco recusará a gravação.
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
          {schema.columns.map(col => renderInput(col))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={loading}
            className="px-4 py-2 font-bold text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            onClick={() => onSubmit(formData)} 
            disabled={loading}
            className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? 'Salvando...' : 'Salvar Dados'}
          </button>
        </div>
      </div>
    </div>
  );
}
