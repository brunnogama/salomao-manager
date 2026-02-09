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
  Ban
} from 'lucide-react';

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

export function History({ userName, onModuleHome, onLogout }: HistoryProps) {
  // --- ROLE STATE ---
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);

  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

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
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
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
      return <span className="text-gray-400 italic uppercase text-[10px] font-bold">Registro removido definitivamente.</span>;
    }
    
    if (log.action === 'INSERT') {
      const name = log.new_data?.client_name || log.new_data?.title || log.new_data?.name || 'Novo Registro';
      return <span className="font-bold text-[#0a192f] uppercase text-[11px] tracking-tight">Nova entrada: "{name}"</span>;
    }

    if (log.action === 'UPDATE' && log.old_data && log.new_data) {
      const changes: string[] = [];
      Object.keys(log.new_data).forEach(key => {
        if (JSON.stringify(log.new_data[key]) !== JSON.stringify(log.old_data[key])) {
          if (['updated_at', 'created_at'].includes(key)) return;
          changes.push(key);
        }
      });

      if (changes.length === 0) return <span className="text-gray-300 uppercase text-[10px] font-black">Sincronização de metadados.</span>;

      return (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alterou:</span>
          {changes.slice(0, 3).map(key => (
            <span key={key} className="px-2 py-1 bg-white text-[#0a192f] text-[9px] font-black rounded-lg border border-gray-100 uppercase tracking-tighter shadow-sm">
              {key}
            </span>
          ))}
          {changes.length > 3 && <span className="text-[9px] font-black text-amber-600 uppercase">+{changes.length - 3} campos</span>}
        </div>
      );
    }
    return null;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.record_id && log.record_id.includes(searchTerm));
    const matchesFilter = filterAction === 'ALL' || log.action === filterAction;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 animate-in fade-in duration-500 h-full flex flex-col bg-gray-50/50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-sm font-black text-[#0a192f] uppercase tracking-[0.3em] flex items-center gap-3">
              <HistoryIcon className="w-6 h-6 text-amber-500" /> Audit Log & Rastreabilidade
            </h1>
            <div className="flex items-center gap-3 mt-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monitoramento integral de transações em banco de dados.</p>
                {/* Badge de Perfil */}
                {userRole && (
                    <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase border flex items-center gap-1.5 ${
                        userRole === 'admin' 
                            ? 'bg-purple-50 text-purple-700 border-purple-100' 
                            : 'bg-gray-50 text-gray-500 border-gray-100'
                    }`}>
                        <Shield className="w-3 h-3" />
                        {userRole === 'admin' ? 'Administrador' : 'Acesso Negado'}
                    </span>
                )}
            </div>
        </div>
      </div>

      {/* CONTEÚDO: APENAS ADMIN VÊ */}
      {userRole === 'admin' ? (
        <>
            {/* Filtros */}
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input 
                      type="text" 
                      placeholder="BUSCAR POR MÓDULO OU ID..." 
                      className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-[#0a192f] transition-all text-[#0a192f] placeholder:text-gray-300"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar pb-2 md:pb-0">
                {['ALL', 'INSERT', 'UPDATE', 'DELETE'].map(type => (
                    <button
                    key={type}
                    onClick={() => setFilterAction(type)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap active:scale-95 ${
                        filterAction === type 
                        ? 'bg-[#0a192f] text-white shadow-xl shadow-[#0a192f]/20' 
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }`}
                    >
                    {type === 'ALL' ? 'Geral' : type === 'INSERT' ? 'Entradas' : type === 'UPDATE' ? 'Edições' : 'Remoções'}
                    </button>
                ))}
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                {loading ? (
                <div className="flex flex-col justify-center items-center py-20 gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a192f]"></div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando logs...</p>
                </div>
                ) : filteredLogs.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                    <Ban className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Nenhum evento registrado no período.</p>
                </div>
                ) : (
                filteredLogs.map((log) => {
                    const style = getActionStyle(log.action);
                    const date = new Date(log.changed_at);
                    
                    return (
                    <div key={log.id} className="bg-white rounded-[1.5rem] border border-gray-100 p-6 shadow-sm hover:border-amber-200 transition-all relative overflow-hidden group">
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.bg.replace('bg-', 'bg-').replace('50', '500')}`}></div>
                        
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-shrink-0 flex flex-col items-center min-w-[120px] border-r border-gray-50 pr-6">
                            <div className={`w-12 h-12 rounded-2xl ${style.bg} flex items-center justify-center mb-3 shadow-inner`}>
                              <style.icon className={`w-6 h-6 ${style.color}`} />
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black text-[#0a192f] uppercase">{date.toLocaleDateString()}</p>
                              <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{date.toLocaleTimeString()}</p>
                            </div>
                        </div>

                        <div className="flex-1 w-full">
                            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                              <div className="flex items-center gap-3">
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border ${style.bg} ${style.color}`}>
                                    {style.label}
                                </span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">no módulo</span>
                                <span className="text-[11px] font-black text-[#0a192f] uppercase tracking-widest">{formatTableName(log.table_name)}</span>
                              </div>
                              <div className="flex items-center text-[9px] font-black text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 uppercase tracking-widest">
                                  <User className="w-3.5 h-3.5 mr-2 text-amber-500" />
                                  <span className="truncate max-w-[200px]" title={log.user_id}>
                                  {log.user_email || 'System_Core'}
                                  </span>
                              </div>
                            </div>

                            <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                              {formatDiff(log)}
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
        // TELA DE ACESSO RESTRITO - Estilo Manager
        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-gray-100 p-12 text-center animate-in fade-in zoom-in duration-500 shadow-sm">
            <div className="bg-red-50 p-6 rounded-[2rem] mb-6 shadow-inner">
                <Ban className="w-16 h-16 text-red-500" />
            </div>
            <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-[0.2em] mb-3">Protocolo de Segurança Ativo</h3>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                O acesso aos registros de auditoria é exclusivo para a <span className="text-red-500">Administração Central</span> do Ecossistema Salomão.
            </p>
            <div className="mt-10 pt-10 border-t border-gray-50 w-full max-w-xs">
                <div className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-2">Seu Perfil Autenticado</div>
                <div className="bg-[#0a192f] text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-block shadow-xl">
                  {userRole || 'Anônimo'}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}