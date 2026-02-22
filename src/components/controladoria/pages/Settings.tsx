import React, { useState, useEffect } from 'react';
import {
  Users, Info, History, Save, Plus, Trash2, Edit, CheckCircle2,
  XCircle, Shield, Code2, Database, Layout, Search, Lock, Mail, AlertTriangle, Settings as SettingsIcon,
  DollarSign, Briefcase, User, Ban, LogOut, Plane, UserCircle, Grid
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// --- TIPOS ---
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  active: boolean;
  last_login?: string;
}

interface ChangeLogItem {
  version: string;
  date: string;
  type: 'radical' | 'feature' | 'fix';
  title: string;
  changes: string[];
}

interface SettingsProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

// --- DADOS MOCK ---
const INITIAL_CHANGELOG: ChangeLogItem[] = [
  {
    version: '0.1.06',
    date: '11/01/2026',
    type: 'feature',
    title: 'Gerenciamento de Dados',
    changes: [
      'Adicionado reset modular (exclusão por módulo).',
      'Refinamento da área de configurações do sistema.',
      'Melhoria na segurança de exclusão de dados.'
    ]
  },
  {
    version: '0.1.05',
    date: '11/01/2026',
    type: 'fix',
    title: 'Estabilização do Sistema',
    changes: [
      'Correção crítica no salvamento de Contratos (Erro PGRST204).',
      'Correção na persistência de valores financeiros (Pró-labore, Êxito).',
      'Correção no cadastro de Clientes sem CNPJ (erro de chave única).',
      'Ajuste nos cards de Clientes para permitir edição ao clicar.',
      'Correção da máscara de moeda no modal de Contratos.',
      'Implementação de upload de arquivos na fase "Sob Análise".'
    ]
  },
  {
    version: '0.10',
    date: '11/01/2026',
    type: 'feature',
    title: 'Módulo de Notificações e Financeiro',
    changes: [
      'Adicionado botão de notificações no módulo Contratos.',
      'Integração de alertas de cobrança de assinatura.',
      'Visualização de totais financeiros nos cards de contrato.',
      'Dashboard com funil de vendas e evolução financeira.'
    ]
  },
  {
    version: '0.01',
    date: '04/01/2026',
    type: 'feature',
    title: 'Lançamento Inicial (MVP)',
    changes: [
      'Estrutura base do sistema.',
      'Módulos de Contratos e Clientes.',
      'Configuração do Supabase.'
    ]
  }
];

export function Settings({
  userName = 'Usuário',
  onModuleHome,
  onLogout
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'about' | 'changelog' | 'system'>('users');
  const [loading, setLoading] = useState(false);

  // --- ESTADOS DE USUÁRIOS E PERMISSÃO ---
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'editor', active: true });

  // --- LÓGICA DE PERMISSÃO ---
  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserEmail(user.email || '');

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setCurrentUserRole(profile.role as 'admin' | 'editor' | 'viewer');
        }
      }
    } catch (error) {
      console.error("Erro ao verificar permissão:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('name');

      if (error) throw error;
      if (data) setUsers(data as any);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleSaveUser = async () => {
    if (!['admin', 'editor'].includes(currentUserRole || '')) {
      return alert("Permissão negada. Você não tem permissão para gerenciar usuários.");
    }

    setLoading(true);
    try {
      const userData = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        active: userForm.active,
        last_login: editingUser?.last_login || '-'
      };

      if (editingUser) {
        const { error } = await supabase
          .from('user_profiles')
          .update(userData)
          .eq('id', editingUser.id);

        if (error) throw error;
      } else {
        const newId = crypto.randomUUID();
        const { error } = await supabase
          .from('user_profiles')
          .insert([{ ...userData, id: newId }]);

        if (error) throw error;
      }

      await fetchUsers();
      setIsUserModalOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      alert('Erro ao salvar usuário: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openUserModal = (user?: UserProfile) => {
    if (!['admin', 'editor'].includes(currentUserRole || '')) {
      return alert("Apenas Administradores e Editores podem gerenciar usuários.");
    }

    if (user) {
      setEditingUser(user);
      setUserForm({ name: user.name, email: user.email, role: user.role as any, active: user.active });
    } else {
      setEditingUser(null);
      setUserForm({ name: '', email: '', role: 'editor', active: true });
    }
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (currentUserRole !== 'admin') return alert("Permissão negada. Apenas Administradores podem excluir usuários.");

    if (confirm("Tem certeza que deseja remover este usuário?")) {
      try {
        const { error } = await supabase.from('user_profiles').delete().eq('id', id);
        if (error) throw error;
        await fetchUsers();
      } catch (error: any) {
        alert('Erro ao excluir usuário: ' + error.message);
      }
    }
  };

  const handleModuleReset = async (module: 'contracts' | 'clients' | 'financial' | 'kanban') => {
    if (currentUserRole !== 'admin') return alert("Permissão negada.");

    const labels = {
      contracts: 'CONTRATOS',
      clients: 'CLIENTES',
      financial: 'FINANCEIRO',
      kanban: 'TAREFAS'
    };

    const confirmation = window.prompt(`🚨 EXCLUSÃO DO MÓDULO: ${labels[module]} 🚨\n\nDigite "CONFIRMAR" para apagar todos os dados deste módulo.`);

    if (confirmation !== "CONFIRMAR") return alert("Ação cancelada.");

    setLoading(true);
    try {
      if (module === 'financial') {
        await supabase.from('financial_installments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      else if (module === 'kanban') {
        await supabase.from('kanban_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      else if (module === 'contracts') {
        await supabase.from('financial_installments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('contract_timeline').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('contract_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('contract_processes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('kanban_tasks').delete().not('contract_id', 'is', null);
        await supabase.from('contracts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      else if (module === 'clients') {
        const { error } = await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw new Error("Não é possível excluir clientes que possuem contratos vinculados.");
      }

      alert(`✅ Módulo ${labels[module]} limpo com sucesso!`);
      window.location.reload();
    } catch (error: any) {
      console.error(`Erro ao limpar ${module}:`, error);
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFactoryReset = async () => {
    if (currentUserRole !== 'admin') return alert("Permissão negada.");

    const confirmation = window.prompt("🚨 ATENÇÃO: ZONA DE PERIGO 🚨\n\nEssa ação apagará TODOS os dados do sistema.\n\nPara confirmar, digite:\nDELETAR TUDO");
    if (confirmation !== "DELETAR TUDO") return alert("Ação cancelada.");

    setLoading(true);
    try {
      await supabase.from('financial_installments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('contract_timeline').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('contract_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('contract_processes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('kanban_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('contracts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('partners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('analysts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      alert("✅ Sistema resetado com sucesso!");
      window.location.reload();
    } catch (error: any) {
      alert("Erro ao resetar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6 overflow-hidden">

      {/* 1. Header - Salomão Design System */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-2.5 sm:p-3 shadow-lg shrink-0">
            <SettingsIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Configurações</h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">Gerenciamento e Sistema</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Online</span>
              {currentUserRole && (
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">• {currentUserRole}</span>
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

      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">

        {/* SIDEBAR DE NAVEGAÇÃO */}
        <div className="w-full lg:w-64 flex-shrink-0 flex flex-col space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-row lg:flex-col gap-2 lg:gap-0 lg:space-y-1 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 lg:flex-none flex items-center px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap shrink-0 ${activeTab === 'users' ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Users className="mr-3 h-4 w-4" /> Usuários
            </button>

            <button
              onClick={() => setActiveTab('changelog')}
              className={`flex-1 lg:flex-none flex items-center px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap shrink-0 ${activeTab === 'changelog' ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <History className="mr-3 h-4 w-4" /> Versões
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`flex-1 lg:flex-none flex items-center px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap shrink-0 ${activeTab === 'about' ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Info className="mr-3 h-4 w-4" /> Sobre
            </button>

            {currentUserRole === 'admin' && (
              <div className="lg:pt-2 lg:mt-2 lg:border-t lg:border-gray-100 flexshrink-0">
                <button
                  onClick={() => setActiveTab('system')}
                  className={`flex-1 lg:flex-none flex items-center px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap shrink-0 ${activeTab === 'system' ? 'bg-red-50 text-red-600 border border-red-100' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                  <SettingsIcon className="mr-3 h-4 w-4" /> Sistema
                </button>
              </div>
            )}
          </div>

          <div className="p-4 bg-white rounded-2xl border border-gray-100 text-[9px] font-black uppercase tracking-widest text-gray-400 shadow-sm">
            <p className="text-[#0a192f] mb-3 border-b border-gray-50 pb-2">Diagnóstico</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <Mail className="w-3 h-3 text-[#1e3a8a]" />
                <span className="truncate">{currentUserEmail || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-[#1e3a8a]" />
                <span>Nível: {currentUserRole || '...'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">

          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-sm font-black text-[#0a192f] uppercase tracking-widest">Usuários do Sistema</h2>
                  <p className="text-xs font-semibold text-gray-500 mt-1">Gerenciamento de equipe e permissões</p>
                </div>
                {['admin', 'editor'].includes(currentUserRole || '') && (
                  <button onClick={() => openUserModal()} className="bg-[#1e3a8a] hover:bg-[#112240] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center transition-all shadow-md active:scale-95">
                    <Plus className="w-4 h-4 mr-2" /> Novo Usuário
                  </button>
                )}
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <div className="min-w-[800px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Membro</th>
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Email</th>
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Perfil</th>
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Status</th>
                        {['admin', 'editor'].includes(currentUserRole || '') && <th className="p-4 text-right text-[10px] font-black text-white uppercase tracking-widest">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1e3a8a] flex items-center justify-center font-black text-xs border border-blue-100 shadow-sm">
                                {(user.name || user.email || '?').charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs font-black text-[#0a192f] uppercase tracking-tight">{user.name || 'Sem nome'}</span>
                            </div>
                          </td>
                          <td className="p-4 text-xs font-semibold text-gray-500">{user.email}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${user.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-100'
                              : user.role === 'editor'
                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                : 'bg-gray-50 text-gray-600 border-gray-100'
                              }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-4">
                            {user.active ? (
                              <span className="flex items-center text-emerald-600 text-[9px] font-black uppercase tracking-widest"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Ativo</span>
                            ) : (
                              <span className="flex items-center text-gray-400 text-[9px] font-black uppercase tracking-widest"><XCircle className="w-3.5 h-3.5 mr-1.5" /> Inativo</span>
                            )}
                          </td>
                          {['admin', 'editor'].includes(currentUserRole || '') && (
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openUserModal(user)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Editar"><Edit className="w-4 h-4" /></button>
                                {currentUserRole === 'admin' && (
                                  <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 col-span-2 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#1e3a8a]"></div>
                <div className="mx-auto flex items-center justify-center mb-6">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
                    <Layout className="h-16 w-16 text-[#0a192f]" />
                  </div>
                </div>
                <h2 className="text-xl font-black text-[#0a192f] uppercase tracking-[0.2em]">FlowMetrics</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Versão 1.2.0 • Build 2026.01</p>

                <div className="mt-10 flex justify-center gap-12 border-t border-gray-50 pt-10">
                  <div className="text-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Engenharia</p>
                    <p className="text-sm font-black text-[#1e3a8a] uppercase">Marcio Gama</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Licenciamento</p>
                    <p className="text-sm font-black text-[#0a192f] uppercase">Copyright © 2026</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1 bg-blue-500"></div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2"><Code2 className="w-4 h-4 text-[#1e3a8a]" /> Frontend Stack</h3>
                <ul className="space-y-2">
                  {['React.js (v18)', 'TypeScript', 'Tailwind CSS', 'Vite Engine'].map(tech => (
                    <li key={tech} className="flex items-center text-[11px] font-bold text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100 uppercase tracking-tight">{tech}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1 bg-emerald-500"></div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2"><Database className="w-4 h-4 text-emerald-600" /> Infrastructure</h3>
                <ul className="space-y-2">
                  {['Supabase (PostgreSQL)', 'Row Level Security', 'Edge Functions', 'Storage Buckets'].map(tech => (
                    <li key={tech} className="flex items-center text-[11px] font-bold text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100 uppercase tracking-tight">{tech}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'changelog' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="border-l-2 border-gray-100 ml-4 space-y-12">
                {INITIAL_CHANGELOG.map((log, idx) => (
                  <div key={idx} className="relative pl-10">
                    <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-md
                                ${log.type === 'radical' ? 'bg-red-500' : log.type === 'feature' ? 'bg-[#1e3a8a]' : 'bg-emerald-500'}
                            `}></div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                      <h3 className="text-lg font-black text-[#0a192f] uppercase tracking-tighter">{log.version}</h3>
                      <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border
                                    ${log.type === 'radical' ? 'bg-red-50 text-red-700 border-red-100' :
                          log.type === 'feature' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            'bg-emerald-50 text-emerald-700 border-emerald-100'}
                                `}>
                        {log.type === 'radical' ? 'Major' : log.type === 'feature' ? 'New' : 'Patch'}
                      </span>
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{log.date}</span>
                    </div>
                    <h4 className="text-xs font-black text-gray-700 mb-4 uppercase tracking-widest">{log.title}</h4>
                    <ul className="space-y-3">
                      {log.changes.map((change, cIdx) => (
                        <li key={cIdx} className="text-[11px] font-semibold text-gray-500 flex items-start leading-relaxed bg-gray-50/50 p-2 rounded-lg">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-200 mt-1 mr-3 shrink-0"></div>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            currentUserRole === 'admin' ? (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-sm font-black text-[#0a192f] uppercase tracking-widest">Reset Modular</h2>
                    <p className="text-xs font-semibold text-gray-500 mt-1">Limpeza seletiva de bancos de dados.</p>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { id: 'financial', label: 'Financeiro', icon: DollarSign, sub: 'Apenas parcelas' },
                      { id: 'kanban', label: 'Tarefas', icon: Layout, sub: 'Quadro completo' },
                      { id: 'contracts', label: 'Contratos', icon: Briefcase, sub: 'Docs e Histórico' },
                      { id: 'clients', label: 'Clientes', icon: Users, sub: 'Somente órfãos' }
                    ].map(mod => (
                      <button key={mod.id} onClick={() => handleModuleReset(mod.id as any)} className="flex flex-col items-center justify-center p-6 border border-gray-100 rounded-2xl hover:border-red-200 hover:bg-red-50 transition-all group shadow-sm bg-gray-50/50">
                        <div className="p-3 bg-white rounded-xl text-gray-400 group-hover:text-red-500 shadow-sm mb-3 transition-colors">
                          <mod.icon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest group-hover:text-red-700">{mod.label}</span>
                        <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{mod.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <AlertTriangle className="w-20 h-20 text-red-600" />
                  </div>
                  <div className="p-6 bg-red-50 border-b border-red-100 flex items-start gap-4">
                    <div className="p-2.5 bg-red-600 rounded-xl text-white shadow-lg shadow-red-200">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-red-800 uppercase tracking-widest">Zona de Perigo</h2>
                      <p className="text-[10px] font-black text-red-600 mt-1 uppercase tracking-widest">
                        Ações destrutivas e irreversíveis.
                      </p>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="border border-red-100 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-6 bg-white hover:bg-red-50/30 transition-colors group">
                      <div>
                        <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Reset de Fábrica (Wipe Data)</h3>
                        <p className="text-[11px] font-semibold text-gray-500 mt-2 max-w-xl">
                          Esta ação irá <strong className="text-red-600">excluir permanentemente</strong> todos os dados. O sistema retornará ao estado inicial vazio.
                        </p>
                      </div>
                      <button
                        onClick={handleFactoryReset}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-lg shadow-red-100 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {loading ? 'Processando...' : 'RESETAR TUDO'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-12 text-center shadow-sm">
                <Ban className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xs font-black text-red-700 uppercase tracking-widest">Acesso Restrito</h3>
                <p className="text-[10px] font-black text-red-600 mt-2 uppercase tracking-widest">Área exclusiva para Administradores.</p>
              </div>
            )
          )}

        </div>
      </div>

      {/* MODAL DE USUÁRIO */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-[#0a192f]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border border-gray-100 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xs font-black text-[#0a192f] uppercase tracking-widest">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-lg transition-colors"><XCircle className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" className="w-full pl-10 border border-gray-200 rounded-xl p-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#1e3a8a] bg-gray-50/50" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" className="w-full pl-10 border border-gray-200 rounded-xl p-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#1e3a8a] bg-gray-50/50" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nível de Acesso</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select className="w-full pl-10 border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-700 outline-none bg-gray-50/50 appearance-none" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value as any })}>
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
                  <div className="flex items-center h-[46px] px-3 bg-gray-50/50 border border-gray-200 rounded-xl">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={userForm.active} onChange={e => setUserForm({ ...userForm, active: e.target.checked })} />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1e3a8a]"></div>
                      <span className="ml-3 text-[10px] font-black uppercase tracking-widest text-gray-500">{userForm.active ? 'On' : 'Off'}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">Cancelar</button>
              <button onClick={handleSaveUser} disabled={loading} className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-[#112240] transition-all flex items-center active:scale-95">
                {loading ? 'Aguarde...' : <><Save className="w-4 h-4 mr-2" /> Salvar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}