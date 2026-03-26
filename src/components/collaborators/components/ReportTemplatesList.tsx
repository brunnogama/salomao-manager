import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { FileSpreadsheet, Trash2, Download, Loader2, Calendar, User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { AlertModal } from '../../../components/ui/AlertModal';

export interface ReportTemplate {
  id: string;
  name: string;
  columns: string[];
  created_by: string;
  created_at: string;
  // joined info
  author_email?: string;
  author_name?: string;
}

interface ReportTemplatesListProps {
  onApplyTemplate: (template: ReportTemplate) => void;
  refreshTrigger?: number;
}

export function ReportTemplatesList({ onApplyTemplate, refreshTrigger = 0 }: ReportTemplatesListProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<ReportTemplate | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      // The 'profiles' relationship might not exist or be accessible directly via standard RLS, 
      // so we select * and gracefully handle author mapping.
      const { data, error } = await supabase
        .from('rh_export_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mapped = (data || []).map((t: any) => ({
        ...t,
        author_name: t.author_name || 'Usuário', // Will use the newly inserted author_name column
        author_email: 'N/A'
      }));

      setTemplates(mapped);
    } catch (err) {
      console.error('Erro ao buscar modelos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [refreshTrigger]);

  const confirmDelete = (e: React.MouseEvent, template: ReportTemplate) => {
    e.stopPropagation();
    setTemplateToDelete(template);
  };

  const executeDelete = async () => {
    if (!templateToDelete) return;
    
    try {
      setDeletingId(templateToDelete.id);
      const { error } = await supabase
        .from('rh_export_templates')
        .delete()
        .eq('id', templateToDelete.id)
        .eq('created_by', user?.id);

      if (error) throw error;
      setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
      setTemplateToDelete(null);
    } catch (err) {
      console.error('Erro ao deletar modelo:', err);
      alert('Não foi possível excluir o modelo. Verifique se você é o autor.');
      setTemplateToDelete(null);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#1e3a8a]" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="bg-gray-50/50 border border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <h4 className="text-gray-900 font-medium mb-1">Nenhum modelo salvo</h4>
        <p className="text-sm text-gray-500 max-w-sm">
          Crie um relatório personalizado e salve as colunas escolhidas para adicioná-lo aqui e facilitar o seu dia a dia.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Nome do Relatório</th>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Data de Criação</th>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Quem Criou</th>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Qde de Colunas</th>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {templates.map(template => {
            const isAuthor = user?.id === template.created_by;
            
            return (
              <tr 
                key={template.id}
                className="group hover:bg-[#1e3a8a]/5 cursor-pointer transition-colors"
                onClick={() => onApplyTemplate(template)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-[#0a192f] group-hover:text-[#1e3a8a] transition-colors">{template.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(template.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="truncate max-w-[150px]">{template.author_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                    {template.columns.length}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyTemplate(template);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white rounded-lg transition-colors text-xs font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Gerar
                    </button>
                    {isAuthor && (
                      <button 
                        onClick={(e) => confirmDelete(e, template)}
                        disabled={deletingId === template.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir Modelo"
                      >
                        {deletingId === template.id ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <AlertModal
        isOpen={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
        title="Excluir Modelo de Relatório"
        description={`Tem certeza que deseja excluir o modelo "${templateToDelete?.name}"? A configuração não poderá ser recuperada.`}
        variant="warning"
        confirmText="Excluir Modelo"
        onConfirm={executeDelete}
      />
    </div>
  );
}
