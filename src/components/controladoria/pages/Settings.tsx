import React, { useState, useEffect } from 'react';
import { 
  Users, Info, History, Save, Plus, Trash2, Edit, CheckCircle2, 
  XCircle, Shield, Code2, Database, Layout, Search, Lock, Mail, AlertTriangle, Settings as SettingsIcon,
  DollarSign, Briefcase, User, Ban, LogOut
} from 'lucide-react';
import { supabase } from '../../../lib/supabase'; // Caminho centralizado no Manager

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

interface SettingsProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function Settings({ userName, onModuleHome, onLogout }: SettingsProps) {
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
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            
            if (profile) {
                setCurrentUserRole(profile.role as 'admin' | 'editor' | 'viewer');
            }
        }
    } catch (error) {
        console.error("Erro ao verificar permissão:", error);
    }
  };

  // --- LÓGICA DE USUÁRIOS (SUPABASE) ---
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
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
          .from('profiles')
          .update(userData)
          .eq('id', editingUser.id);
        
        if (error) throw error;
      } else {
        const newId = crypto.randomUUID();
        const { error } = await supabase
          .from('profiles')
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

      if(confirm("Tem certeza que deseja remover este usuário?")) {
        try {
          const { error } = await supabase.from('profiles').delete().eq('id', id);
          if (error) throw error;
          await fetchUsers();
        } catch (error: any) {
          alert('Erro ao excluir usuário: ' + error.message);
        }
      }
  };

  // --- LÓGICA DE RESET POR MÓDULO ---
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
    <div className="p-8 animate-in fade-in duration-500 bg-gray-50/50 min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <div>
            <h1 className="text-sm font-black text-[#0a192f] uppercase tracking-[0.3em] flex items-center gap-3">
              <SettingsIcon className="w-6 h-6 text-amber-500" /> Preferências do Sistema
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configurações globais e controle de privilégios.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden">
        {/* SIDEBAR DE NAVEGAÇÃO MANAGER */}
        <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-6">
          <nav className="space-y-1.5 flex-1 overflow-y-auto">
            <button 
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'users' ? 'bg-[#0a192f] text-white shadow-xl shadow-[#0a192f]/20' : 'text-gray-500 hover:bg-white'}`}
            >
                <Users className={`mr-4 h-5 w-5 ${activeTab === 'users' ? 'text-amber-500' : 'text-gray-300'}`} /> Gerenciar Equipe
            </button>

            <button 
              onClick={() => setActiveTab('changelog')}
              className={`w-full flex items-center px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'changelog' ? 'bg-[#0a192f] text-white shadow-xl shadow-[#0a192f]/20' : 'text-gray-500 hover:bg-white'}`}
            >
              <History className={`mr-4 h-5 w-5 ${activeTab === 'changelog' ? 'text-amber-500' : 'text-gray-300'}`} /> Versões do Build
            </button>
            <button 
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'about' ? 'bg-[#0a192f] text-white shadow-xl shadow-[#0a192f]/20' : 'text-gray-500 hover:bg-white'}`}
            >
              <Info className={`mr-4 h-5 w-5 ${activeTab === 'about' ? 'text-amber-500' : 'text-gray-300'}`} /> Sobre o Core
            </button>
            
            {currentUserRole === 'admin' && (
                <div className="pt-6 mt-6 border-t border-gray-100">
                    <button 
                    onClick={() => setActiveTab('system')}
                    className={`w-full flex items-center px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'system' ? 'bg-red-50 text-red-600 border border-red-100' : 'text-red-400 hover:bg-red-50/50'}`}
                    >
                    <SettingsIcon className={`mr-4 h-5 w-5 ${activeTab === 'system' ? 'text-red-500' : 'text-red-300'}`} /> Manutenção
                    </button>
                </div>
            )}
          </nav>

          <div className="p-6 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm">
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-4">Autenticado como</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xs">
                  {currentUserEmail?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-[#0a192f] uppercase truncate">{currentUserEmail.split('@')[0]}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{currentUserRole}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL MANAGER */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
          
          {/* --- ABA USUÁRIOS --- */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-[#0a192f]">
                    <div>
                        <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Operadores do Ecossistema</h2>
                    </div>
                    {['admin', 'editor'].includes(currentUserRole || '') && (
                        <button onClick={() => openUserModal()} className="bg-amber-500 hover:bg-amber-600 text-[#0a192f] px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center transition-all active:scale-95 shadow-lg">
                            <Plus className="w-4 h-4 mr-2" /> Adicionar Perfil
                        </button>
                    )}
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                        <tr>
                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-8">Usuário</th>
                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Endereço de Acesso</th>
                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Privilégio</th>
                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                        {['admin', 'editor'].includes(currentUserRole || '') && <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right pr-8">Ações</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.map(user => (
                        <tr key={user.id} className="hover:bg-amber-50/20 transition-colors group">
                            <td className="p-5 pl-8">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-xs border border-slate-200 group-hover:bg-white transition-colors uppercase">
                                      {(user.name || user.email || '?').substring(0, 2)}
                                  </div>
                                  <span className="text-xs font-black text-[#0a192f] uppercase tracking-tight">{user.name || 'Sem nome'}</span>
                                </div>
                            </td>
                            <td className="p-5 text-[11px] font-bold text-gray-500 uppercase tracking-tighter">{user.email}</td>
                            <td className="p-5">
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                    user.role === 'admin' 
                                        ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                        : user.role === 'editor' 
                                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                                            : 'bg-gray-50 text-gray-400 border-gray-100'
                                }`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="p-5">
                                {user.active ? (
                                    <span className="flex items-center text-emerald-600 text-[9px] font-black uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 w-fit"><CheckCircle2 className="w-3 h-3 mr-1.5" /> Ativo</span>
                                ) : (
                                    <span className="flex items-center text-gray-400 text-[9px] font-black uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-lg border border-gray-200 w-fit"><XCircle className="w-3 h-3 mr-1.5" /> Inativo</span>
                                )}
                            </td>
                            {['admin', 'editor'].includes(currentUserRole || '') && (
                                <td className="p-5 text-right pr-8">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                        <button onClick={() => openUserModal(user)} className="p-2 text-blue-500 hover:bg-white rounded-xl transition-all shadow-sm" title="Editar"><Edit className="w-4 h-4" /></button>
                                        {currentUserRole === 'admin' && (
                                            <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-red-500 hover:bg-white rounded-xl transition-all shadow-sm" title="Remover"><Trash2 className="w-4 h-4" /></button>
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
          )}

          {/* --- ABA SOBRE --- */}
          {activeTab === 'about' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#0a192f] p-12 rounded-[2.5rem] shadow-2xl col-span-2 text-center border border-white/5">
                    <div className="mx-auto flex items-center justify-center mb-10 scale-125">
                        <img src="/logo-salomao.png" alt="Salomão Advogados" className="h-24 w-auto brightness-0 invert" />
                    </div>
                    <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] mb-10">Versão 2.5.0 • Enterprise Core Build 2026</p>
                    <div className="mt-8 flex flex-col sm:flex-row justify-center gap-10">
                        <div className="text-center px-10 border-r border-white/10 last:border-0">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Arquiteto de Sistema</p>
                            <p className="text-sm font-black text-white uppercase tracking-widest">Marcio Gama</p>
                        </div>
                        <div className="text-center px-10">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Data de Lançamento</p>
                            <p className="text-sm font-black text-amber-500 uppercase tracking-widest">Janeiro de 2026</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                    <h3 className="text-[10px] font-black text-[#0a192f] uppercase tracking-[0.2em] mb-6 flex items-center gap-3 border-l-4 border-blue-500 pl-4">Interface & UX</h3>
                    <ul className="space-y-3">
                        <li className="flex items-center text-[11px] font-bold text-gray-600 uppercase tracking-tight bg-gray-50 p-3 rounded-xl border border-gray-100"><span className="w-2 h-2 bg-blue-500 rounded-full mr-4 shadow-lg shadow-blue-200"></span>React.js v18 Functional</li>
                        <li className="flex items-center text-[11px] font-bold text-gray-600 uppercase tracking-tight bg-gray-50 p-3 rounded-xl border border-gray-100"><span className="w-2 h-2 bg-teal-400 rounded-full mr-4 shadow-lg shadow-teal-200"></span>Tailwind Dynamic UI</li>
                        <li className="flex items-center text-[11px] font-bold text-gray-600 uppercase tracking-tight bg-gray-50 p-3 rounded-xl border border-gray-100"><span className="w-2 h-2 bg-orange-500 rounded-full mr-4 shadow-lg shadow-orange-200"></span>Vite HMR Architecture</li>
                    </ul>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                    <h3 className="text-[10px] font-black text-[#0a192f] uppercase tracking-[0.2em] mb-6 flex items-center gap-3 border-l-4 border-emerald-500 pl-4">Backend Ops</h3>
                    <ul className="space-y-3">
                        <li className="flex items-center text-[11px] font-bold text-gray-600 uppercase tracking-tight bg-gray-50 p-3 rounded-xl border border-gray-100"><span className="w-2 h-2 bg-emerald-500 rounded-full mr-4 shadow-lg shadow-emerald-200"></span>Supabase SQL Cluster</li>
                        <li className="flex items-center text-[11px] font-bold text-gray-600 uppercase tracking-tight bg-gray-50 p-3 rounded-xl border border-gray-100"><span className="w-2 h-2 bg-amber-500 rounded-full mr-4 shadow-lg shadow-amber-200"></span>Row-Level Auth Filter</li>
                        <li className="flex items-center text-[11px] font-bold text-gray-600 uppercase tracking-tight bg-gray-50 p-3 rounded-xl border border-gray-100"><span className="w-2 h-2 bg-purple-500 rounded-full mr-4 shadow-lg shadow-purple-200"></span>S3 Document Custody</li>
                    </ul>
                </div>
            </div>
          )}

          {/* --- ABA CHANGELOG --- */}
          {activeTab === 'changelog' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-10">
                <div className="border-l-2 border-gray-100 ml-4 space-y-12">
                    {INITIAL_CHANGELOG.map((log, idx) => (
                        <div key={idx} className="relative pl-10">
                            <div className={`absolute -left-[13px] top-0 w-6 h-6 rounded-full border-4 border-white shadow-xl flex items-center justify-center
                                ${log.type === 'radical' ? 'bg-red-500' : log.type === 'feature' ? 'bg-[#0a192f]' : 'bg-emerald-500'}
                            `}></div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                                <h3 className="text-xl font-black text-[#0a192f] tracking-tighter uppercase">{log.version}</h3>
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border
                                    ${log.type === 'radical' ? 'bg-red-50 text-red-700 border-red-100' : 
                                      log.type === 'feature' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                      'bg-emerald-50 text-emerald-700 border-emerald-100'}
                                `}>
                                    {log.type === 'radical' ? 'Major' : log.type === 'feature' ? 'Feature' : 'Hotfix'}
                                </span>
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{log.date}</span>
                            </div>
                            <h4 className="text-xs font-black text-gray-600 mb-4 uppercase tracking-widest border-b border-gray-50 pb-2 w-fit">{log.title}</h4>
                            <ul className="space-y-3">
                                {log.changes.map((change, cIdx) => (
                                    <li key={cIdx} className="text-[11px] font-bold text-gray-500 flex items-start uppercase tracking-tighter">
                                        <span className="mr-3 text-amber-500 font-black">»</span>
                                        {change}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {/* --- ABA SISTEMA (RESET) --- */}
          {activeTab === 'system' && (
            currentUserRole === 'admin' ? (
                <div className="space-y-8 animate-in slide-in-from-bottom-4">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                            <h2 className="text-[10px] font-black text-[#0a192f] uppercase tracking-[0.2em]">Sanitização Modular</h2>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <button onClick={() => handleModuleReset('financial')} className="flex flex-col items-center justify-center p-8 border border-gray-100 rounded-3xl hover:border-red-200 hover:bg-red-50/30 transition-all group shadow-sm bg-white">
                                <div className="p-4 bg-gray-50 rounded-2xl text-gray-400 group-hover:text-red-500 group-hover:bg-white transition-all mb-4 shadow-inner">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black text-[#0a192f] uppercase tracking-widest">Financeiro</span>
                            </button>

                            <button onClick={() => handleModuleReset('kanban')} className="flex flex-col items-center justify-center p-8 border border-gray-100 rounded-3xl hover:border-red-200 hover:bg-red-50/30 transition-all group shadow-sm bg-white">
                                <div className="p-4 bg-gray-50 rounded-2xl text-gray-400 group-hover:text-red-500 group-hover:bg-white transition-all mb-4 shadow-inner">
                                    <Layout className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black text-[#0a192f] uppercase tracking-widest">Workflow</span>
                            </button>

                            <button onClick={() => handleModuleReset('contracts')} className="flex flex-col items-center justify-center p-8 border border-gray-100 rounded-3xl hover:border-red-200 hover:bg-red-50/30 transition-all group shadow-sm bg-white">
                                <div className="p-4 bg-gray-50 rounded-2xl text-gray-400 group-hover:text-red-500 group-hover:bg-white transition-all mb-4 shadow-inner">
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black text-[#0a192f] uppercase tracking-widest">Casos</span>
                            </button>

                            <button onClick={() => handleModuleReset('clients')} className="flex flex-col items-center justify-center p-8 border border-gray-100 rounded-3xl hover:border-red-200 hover:bg-red-50/30 transition-all group shadow-sm bg-white">
                                <div className="p-4 bg-gray-50 rounded-2xl text-gray-400 group-hover:text-red-500 group-hover:bg-white transition-all mb-4 shadow-inner">
                                    <Users className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black text-[#0a192f] uppercase tracking-widest">Terceiros</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-red-100 overflow-hidden">
                        <div className="p-10 bg-red-600 flex items-start gap-6">
                            <div className="p-4 bg-white/20 rounded-2xl text-white backdrop-blur-md shadow-2xl">
                                <AlertTriangle className="w-10 h-10" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white uppercase tracking-[0.2em]">Protocolo de Extermínio</h2>
                                <p className="text-red-100 text-[11px] font-bold uppercase tracking-widest mt-2 leading-relaxed opacity-80">
                                    Esta ação remove toda a integridade física do banco de dados deste ecossistema. 
                                    Não há pontos de restauração automática após o início do processo.
                                </p>
                            </div>
                        </div>
                        <div className="p-10 bg-red-50/50 flex flex-col md:flex-row justify-between items-center gap-10">
                            <div className="max-w-xl">
                                <h3 className="text-xs font-black text-red-900 uppercase tracking-widest">Reset Total de Instância</h3>
                                <p className="text-[11px] font-bold text-red-700/60 uppercase tracking-tighter mt-2">
                                    WIPE DATA: Todos os contratos, registros de auditoria, arquivos GED e parâmetros financeiros serão destruídos.
                                </p>
                            </div>
                            <button 
                                onClick={handleFactoryReset}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_15px_40px_-10px_rgba(220,38,38,0.4)] transition-all active:scale-95 disabled:opacity-50 flex items-center"
                            >
                                {loading ? <SettingsIcon className="w-5 h-5 animate-spin mr-3" /> : <Trash2 className="w-5 h-5 mr-3" />}
                                Executar Wipe Total
                            </button>
                        </div>
                    </div>
                </div>
            ) : null
          )}

        </div>
      </div>

      {/* MODAL DE USUÁRIO MANAGER */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-[#0a192f]/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 animate-in zoom-in-95">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#0a192f]">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{editingUser ? 'Atualizar Perfil' : 'Provisionar Acesso'}</h3>
                    <button onClick={() => setIsUserModalOpen(false)} className="p-2 text-white/40 hover:text-white transition-all"><XCircle className="w-6 h-6" /></button>
                </div>
                <div className="p-10 space-y-8 bg-gray-50/30">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Identificação Nominal</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#0a192f] transition-all" />
                            <input type="text" className="w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-[#0a192f] outline-none focus:border-[#0a192f] shadow-sm transition-all" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} placeholder="NOME COMPLETO" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">E-mail Corporativo</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#0a192f] transition-all" />
                            <input type="email" className="w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-[#0a192f] outline-none focus:border-[#0a192f] shadow-sm transition-all" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} placeholder="USUARIO@SALOMAO.COM.BR" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Privilégio</label>
                            <div className="relative group">
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                <select className="w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#0a192f] outline-none appearance-none" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as any})}>
                                    <option value="admin">Administrador</option>
                                    <option value="editor">Editor</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Status</label>
                            <button 
                                onClick={() => setUserForm({...userForm, active: !userForm.active})}
                                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${userForm.active ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-100 border-gray-200 text-gray-400'}`}
                            >
                                {userForm.active ? 'ATIVO' : 'BLOQUEADO'}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="p-8 border-t border-gray-100 flex justify-end gap-4 bg-white">
                    <button onClick={() => setIsUserModalOpen(false)} className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all">Descartar</button>
                    <button onClick={handleSaveUser} disabled={loading} className="px-10 py-4 bg-[#0a192f] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-xl shadow-[#0a192f]/30 active:scale-95 transition-all">
                        {loading ? 'PROCESSANDO...' : <><Save className="w-4 h-4 mr-3 text-amber-500" /> Confirmar Perfil</>}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}