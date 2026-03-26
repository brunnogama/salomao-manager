import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { FileSpreadsheet, Download, Calendar, Trash2, Loader2, User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

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
        author_name: 'Usuário', // Standard fallback as profiles table is not consistently linked
        author_email: 'N/A'
      }));

      setTemplates(mapped);
    } catch (err) {
      console.error('Erro ao buscar templates de relatórios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [refreshTrigger]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir este modelo de relatório?')) return;
    
    try {
      setDeletingId(id);
      const { error } = await supabase
        .from('rh_export_templates')
        .delete()
        .eq('id', id)
        .eq('created_by', user?.id); // Extra safety, RLS already handles it

      if (error) throw error;
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Erro ao deletar modelo:', err);
      alert('Não foi possível excluir o modelo. Verifique se você é o autor.');
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {templates.map(template => {
        const isAuthor = user?.id === template.created_by;
        
        return (
          <div 
            key={template.id}
            className="group relative bg-white border border-gray-200 rounded-xl p-5 hover:border-[#1e3a8a]/30 hover:shadow-md transition-all cursor-pointer flex flex-col h-full"
            onClick={() => onApplyTemplate(template)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 bg-[#1e3a8a]/5 text-[#1e3a8a] rounded-lg group-hover:bg-[#1e3a8a] group-hover:text-white transition-colors">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              
              {isAuthor && (
                <button 
                  onClick={(e) => handleDelete(e, template.id)}
                  disabled={deletingId === template.id}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                  title="Excluir Modelo"
                >
                  {deletingId === template.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              )}
            </div>

            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2" title={template.name}>
              {template.name}
            </h3>
            
            <p className="text-xs font-medium text-gray-500 mb-4">
              {template.columns.length} colunas mapeadas
            </p>

            <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <User className="w-3.5 h-3.5" />
                <span className="truncate">{template.author_name}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(template.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent p-5 pt-8 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="flex items-center gap-2 text-sm font-semibold text-[#1e3a8a] bg-blue-50 px-4 py-2 rounded-full border border-blue-100 shadow-sm pointer-events-auto">
                <Download className="w-4 h-4" />
                Gerar Relatório
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
