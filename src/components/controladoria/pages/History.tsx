import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  History as HistoryIcon,
  Search,
  Filter,
  Clock,
  User,
  FileText,
  Trash2,
  PlusCircle,
  Edit3,
  ArrowRight,
  Database,
  Shield,
  Ban,
  Plane,
  UserCircle,
  LogOut,
  Grid
} from 'lucide-react';
import { FilterSelect } from '../ui/FilterSelect';

interface LogItem {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: any;
  new_data: any;
  changed_at: string;
  user_id: string;
  user_email?: string;
}

interface HistoryProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function History({
  userName = 'Usuário',
  onModuleHome,
  onLogout
}: HistoryProps) {
  // --- ROLE STATE ---
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);

  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    checkUserRole();
  }, []);

  // Busca histórico apenas se for admin
  useEffect(() => {
    if (userRole === 'admin') {
      fetchHistory();
    }
  }, [userRole]);

  // --- ROLE CHECK ---
  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (profile) {
        setUserRole(profile.role as 'admin' | 'editor' | 'viewer');
      }
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTableName = (table: string) => {
    switch (table) {
      case 'contracts': return 'Contratos';
      case 'clients': return 'Clientes';
      case 'kanban_tasks': return 'Tarefas Kanban';
      case 'financial_installments': return 'Financeiro';
      default: return table;
    }
  };

  const getActionStyle = (action: string) => {
    switch (action) {
      case 'INSERT': return { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: PlusCircle, label: 'Criação' };
      case 'DELETE': return { color: 'text-red-600', bg: 'bg-red-50', icon: Trash2, label: 'Exclusão' };
      case 'UPDATE': return { color: 'text-blue-600', bg: 'bg-blue-50', icon: Edit3, label: 'Edição' };
      default: return { color: 'text-gray-600', bg: 'bg-gray-50', icon: Database, label: 'Sistema' };
    }
  };

  const formatDiff = (log: LogItem) => {
    if (log.action === 'DELETE') {
      return <span className="text-gray-500 italic font-medium uppercase text-[10px] tracking-widest">Item excluído permanentemente do banco de dados.</span>;
    }

    if (log.action === 'INSERT') {
      const name = log.new_data?.client_name || log.new_data?.title || log.new_data?.name || 'Novo Registro';
      return <span className="font-black text-[#0a192f] uppercase text-xs tracking-tight">Novo item criado: "{name}"</span>;
    }

    if (log.action === 'UPDATE' && log.old_data && log.new_data) {
      const changes: string[] = [];
      Object.keys(log.new_data).forEach(key => {
        if (JSON.stringify(log.new_data[key]) !== JSON.stringify(log.old_data[key])) {
          if (['updated_at', 'created_at'].includes(key)) return;
          changes.push(key);
        }
      });

      if (changes.length === 0) return <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Atualização interna do sistema.</span>;

      return (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Alterou:</span>
          {changes.slice(0, 3).map(key => (
            <span key={key} className="px-2 py-0.5 bg-white text-[#1e3a8a] text-[9px] font-black uppercase tracking-widest rounded border border-blue-100">
              {key}
            </span>
          ))}
          {changes.length > 3 && <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">+{changes.length - 3} outros</span>}
        </div>
      );
    }
    return null;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.record_id && log.record_id.includes(searchTerm));
    const matchesFilter = filterAction === '' || log.action === filterAction;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6">

      {/* 1. Header - Salomão Design System */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-2.5 sm:p-3 shadow-lg shrink-0">
            <HistoryIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Audit Log</h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">Histórico de Atividades</p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Online</span>
              {userRole && (
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                  • {userRole === 'admin' ? 'Administrador' : userRole === 'editor' ? 'Editor' : 'Visualizador'}
                </span>
              )}
            </div>
          </div>
          <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-[#1e3a8a]">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && (
            <button onClick={onModuleHome} className="p-2 text-gray-400 hover:text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-colors">
              <Grid className="h-5 w-5" />
            </button>
          )}
          {onLogout && (
            <button onClick={onLogout} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* CONTEÚDO: APENAS ADMIN VÊ */}
      {userRole === 'admin' ? (
        <>
          {/* 2. Toolbar - Salomão Design System */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por módulo ou ID do registro..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <FilterSelect
                  icon={Filter}
                  value={filterAction}
                  onChange={setFilterAction}
                  options={[
                    { label: 'Todos', value: '' },
                    { label: 'Criações', value: 'INSERT' },
                    { label: 'Edições', value: 'UPDATE' },
                    { label: 'Exclusões', value: 'DELETE' }
                  ]}
                  placeholder="Filtrar por Ação"
                />
              </div>
            </div>
          </div>

          {/* 3. Timeline de Logs */}
          <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Carregando histórico de auditoria...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <HistoryIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nenhum registro de auditoria encontrado</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const style = getActionStyle(log.action);
                const date = new Date(log.changed_at);

                return (
                  <div key={log.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                    <div className={`absolute right-0 top-0 h-full w-1 ${style.bg.replace('bg-', 'bg-').replace('50', '600')}`}></div>

                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      {/* Data/Hora Side */}
                      <div className="flex-shrink-0 flex flex-col items-center min-w-[120px] bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center mb-2 shadow-sm`}>
                          <style.icon className={`w-5 h-5 ${style.color}`} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-black text-[#0a192f] uppercase tracking-tight">{date.toLocaleDateString()}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{date.toLocaleTimeString()}</p>
                        </div>
                      </div>

                      {/* Info Side */}
                      <div className="flex-1 w-full space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${style.bg} ${style.color} border-current opacity-80`}>
                              {style.label}
                            </span>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">em</span>
                            <span className="text-xs font-black text-[#1e3a8a] uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg">
                              {formatTableName(log.table_name)}
                            </span>
                          </div>

                          <div className="flex items-center text-[10px] font-black text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 uppercase tracking-widest">
                            <UserCircle className="w-3.5 h-3.5 mr-2 text-[#1e3a8a]" />
                            <span className="truncate max-w-[200px]" title={log.user_id}>
                              {log.user_email || 'Sistema'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 shadow-inner">
                          {formatDiff(log)}
                          <div className="mt-2 text-[9px] font-mono text-gray-400 uppercase tracking-tighter opacity-50">
                            ID: {log.record_id}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* TELA DE ACESSO RESTRITO */
        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-red-100 p-12 text-center shadow-sm">
          <div className="bg-red-50 p-6 rounded-2xl mb-6 shadow-inner">
            <Ban className="w-16 h-16 text-red-500" />
          </div>
          <h3 className="text-2xl font-black text-[#0a192f] mb-2 uppercase tracking-tight">Acesso Restrito</h3>
          <p className="text-sm font-semibold text-gray-500 max-w-md mx-auto mb-8">
            O histórico de auditoria contém informações sensíveis e é restrito exclusivamente a <strong>Administradores</strong> do sistema.
          </p>
          <div className="text-[10px] font-black text-red-600 bg-red-50 px-4 py-2 rounded-xl border border-red-100 uppercase tracking-widest">
            Seu perfil atual: {userRole || 'Carregando...'}
          </div>
        </div>
      )}
    </div>
  );
}