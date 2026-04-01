import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { SchemaService, TableSchema } from '../../../lib/schemaService';
import { GenericRowFormModal } from './GenericRowFormModal';
import { CORE_TABLES, getModulesForTable } from '../../../data/tableMappings';
import {
  Database, Plus, RefreshCw, Edit, Trash2, Search,
  AlertOctagon, ChevronLeft, Lock, Key
} from 'lucide-react';
import { toast } from 'sonner';

export function GenericTableEditor({ tableName, onBack }: { tableName: string, onBack: () => void }) {
  const [schema, setSchema] = useState<TableSchema | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);

  const isCore = CORE_TABLES.includes(tableName);
  const modules = getModulesForTable(tableName);

  useEffect(() => {
    fetchSchemaAndData();
  }, [tableName]);

  const fetchSchemaAndData = async () => {
    setLoading(true);
    try {
      // Fetch schema
      const fetchedSchema = await SchemaService.getTableSchema(tableName);
      if (fetchedSchema) {
        setSchema(fetchedSchema);
      } else {
        // Fallback: inference not possible initially if table empty and OpenAPI fails
        console.warn(`Não foi possível ler OpenAPI spec para ${tableName}`);
      }

      // Fetch latest 100 rows for preview
      let response: any;
      try {
        response = await supabase
          .from(tableName)
          .select('*')
          .limit(100)
          .order('id', { ascending: false });
      } catch (e) {
        response = { error: { message: "no 'id' column" }, data: [] };
      }

      if (response.error) {
        // If it failed because of ordering by id (table has no id), fallback
        const { data: fallbackRows, error: err2 } = await supabase.from(tableName).select('*').limit(100);
        if (!err2) setData(fallbackRows || []);
      } else {
        setData(response.data || []);
      }
    } catch (e: any) {
      toast.error('Erro ao ler tabela', { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: any) => {
    if (isCore) return;
    setSaving(true);
    try {
      if (editingRow) {
        // Update
        const pkCol = schema?.columns.find(c => c.isPrimaryKey)?.name || 'id';
        const pkVal = editingRow[pkCol];
        if (!pkVal) throw new Error("A tabela não possui chave primária legível para Update.");
        
        const updatePayload = { ...formData };
        delete updatePayload[pkCol]; // Não tentar atualizar PK

        const { error } = await supabase.from(tableName).update(updatePayload).eq(pkCol, pkVal);
        if (error) throw error;
        toast.success('Registro atualizado com sucesso!');
      } else {
        // Insert
        const { error } = await supabase.from(tableName).insert(formData);
        if (error) throw error;
        toast.success('Registro criado com sucesso!');
      }
      setIsFormOpen(false);
      fetchSchemaAndData();
    } catch (e: any) {
      console.error(e);
      toast.error('O Banco de Dados recusou a operação.', {
        description: e.message || 'Verifique as chaves estrangeiras informadas.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: any) => {
    if (isCore) return;
    const pkCol = schema?.columns.find(c => c.isPrimaryKey)?.name || 'id';
    const pkVal = row[pkCol];
    if (!pkVal) {
      toast.error('Impossível excluir', { description: 'Linha sem Chave Primária' });
      return;
    }
    
    if (window.confirm(`Você tem CERTEZA de excluir permanentemente o registro ${pkVal}?\n\nIsso pode quebrar relatórios e o banco de dados se houver referências a ele!`)) {
      setSaving(true);
      try {
        const { error } = await supabase.from(tableName).delete().eq(pkCol, pkVal);
        if (error) throw error;
        toast.success('Registro excluído do banco de dados.');
        fetchSchemaAndData();
      } catch (e: any) {
        toast.error('Falha ao excluir.', { description: e.message });
      } finally {
        setSaving(false);
      }
    }
  };

  const filteredData = data.filter(r => 
    Object.values(r).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative animate-in fade-in slide-in-from-right-4">
      {/* HEADER */}
      <div className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b shrink-0 ${isCore ? 'bg-gradient-to-r from-gray-900 to-gray-800' : 'bg-gradient-to-r from-blue-900 to-indigo-900'}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-5 h-5 text-blue-200" />
              <h2 className="text-xl font-black text-white">{tableName}</h2>
              {isCore && (
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-red-500 text-white px-2 py-0.5 rounded ml-2 shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                  <Lock className="w-3 h-3" /> Core
                </span>
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {modules.map(m => (
                <span key={m} className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-white/20 text-white/80 shrink-0">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isCore && (
            <button 
              onClick={() => { setEditingRow(null); setIsFormOpen(true); }}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all border border-emerald-400/30"
            >
              <Plus className="w-4 h-4" /> Nova Linha
            </button>
          )}
          <button onClick={fetchSchemaAndData} disabled={loading} className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* CORE WARNING BANNER */}
      {isCore ? (
        <div className="bg-red-50 border-b border-red-200 p-4 shrink-0 flex gap-3 items-start">
          <Lock className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-red-900 font-bold">Modo Somente Leitura (Proteção de Integridade)</h4>
            <p className="text-sm text-red-800 font-medium">
              A tabela <b>{tableName}</b> faz parte do coração transacional do sistema. Modificá-la via CRUD genérico quebraria regras de negócio. Utilize o Módulo Oficial para editar estes dados.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border-b border-amber-200 p-3 shrink-0 flex gap-3 items-center">
          <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800 font-medium">
            <b>Atenção:</b> Edições diretas bypassam regras do Front-End (Zod). Preencha UUIDs Estrangeiros corretamente. Erros serão barrados pelo BD.
          </p>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="p-4 border-b flex items-center justify-between bg-gray-50 shrink-0">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar entre os últimos 100 registros..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-xs font-bold text-gray-500 uppercase">
          Mostrando {filteredData.length} de {data.length} records.
        </p>
      </div>

      {/* DATA GRID */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-50">
            <Database className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900">Tabela Vazia</h3>
            <p className="text-sm font-medium text-gray-500">Nenhum dado encontrado no Supabase para esta tabela.</p>
          </div>
        ) : (
          <table className="w-full min-w-max text-left border-collapse">
            <thead className="sticky top-0 bg-gray-100 z-10 shadow-sm outline outline-1 outline-gray-200">
              <tr>
                <th className="px-4 py-3 font-black text-[10px] uppercase text-gray-500 tracking-wider w-16 text-center">Ações</th>
                {schema?.columns.map(col => (
                  <th key={col.name} className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-black text-[10px] uppercase text-gray-500 tracking-wider">
                      {col.isPrimaryKey && <Key className="w-3 h-3 text-red-500 shrink-0" />}
                      {col.name}
                      {col.isForeignKey && <span className="text-[8px] bg-red-100 text-red-600 px-1 rounded-sm ml-1 shrink-0">FK</span>}
                    </div>
                  </th>
                )) || Object.keys(data[0] || {}).map(k => (
                  <th key={k} className="px-4 py-3 font-black text-[10px] uppercase text-gray-500 tracking-wider">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredData.map((row, idx) => (
                <tr key={idx} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="px-4 py-2 border-r border-gray-50 whitespace-nowrap bg-gray-50/30 group-hover:bg-blue-50/80 transition-colors text-center shrink-0">
                    <div className="flex justify-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingRow(row); setIsFormOpen(true); }}
                        disabled={isCore}
                        className="p-1.5 bg-white text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white rounded shadow-sm disabled:opacity-30 transition-colors"
                        title="Editar Linha"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleDelete(row)}
                        disabled={isCore}
                        className="p-1.5 bg-white text-red-600 border border-red-200 hover:bg-red-600 hover:text-white rounded shadow-sm disabled:opacity-30 transition-colors"
                        title="Deletar permanentemente"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  {schema?.columns.map(col => (
                    <td key={col.name} className="px-4 py-2 align-top text-xs font-mono text-gray-700 max-w-[300px] truncate overflow-hidden bg-white/50">
                      {row[col.name] === null ? (
                        <span className="text-gray-400 italic font-sans text-[10px]">NULL</span>
                      ) : typeof row[col.name] === 'boolean' ? (
                        row[col.name] ? 
                          <span className="bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded text-[10px] font-bold font-sans">TRUE</span> 
                          : <span className="bg-red-100 text-red-700 px-1 py-0.5 rounded text-[10px] font-bold font-sans">FALSE</span>
                      ) : typeof row[col.name] === 'object' ? (
                        <span className="text-blue-500 font-sans text-[10px] p-1 bg-blue-50 rounded">JSON DATA</span>
                      ) : (
                        <span title={String(row[col.name])}>{String(row[col.name])}</span>
                      )}
                    </td>
                  )) || Object.values(row).map((val: any, i) => (
                    <td key={i} className="px-4 py-2 text-xs font-mono truncate max-w-[200px]">
                      {String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isFormOpen && schema && (
        <GenericRowFormModal
          isOpen={isFormOpen}
          schema={schema}
          initialData={editingRow}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSave}
          loading={saving}
        />
      )}
    </div>
  );
}
