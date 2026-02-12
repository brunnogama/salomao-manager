import { useState, useRef, useEffect } from 'react'
import {
  Shield, Users, History as HistoryIcon, Code, Lock,
  Briefcase, EyeOff, LayoutGrid, Heart, Plane, DollarSign, Grid,
  CheckCircle, AlertCircle, Trash2, AlertTriangle, ChevronRight,
  UserCircle, LogOut, Settings as SettingsIcon, Database, Layout, Mail, Save, User, Info
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/logger'
import { History } from './crm/History'

// Importação dos Novos Módulos
import { UserManagement } from './settings/UserManagement'
import { UserModal } from './settings/UserModal'
import { CRMSection } from './settings/CRMSection'
import { MaintenanceSection } from './settings/MaintenanceSection'
import { SystemSection } from './settings/SystemSection'

// --- INTERFACES & CONSTANTS ---
interface UserPermissions {
  geral: boolean; crm: boolean; family: boolean;
  collaborators: boolean; operational: boolean; financial: boolean;
}

interface AppUser {
  id: string; user_id: string | null; nome: string; email: string;
  cargo: string; role: string; ativo: boolean; allowed_modules: string[];
}

interface GenericItem { id: number; nome: string; ativo?: boolean; }

const DEFAULT_PERMISSIONS: UserPermissions = {
  geral: true, crm: true, family: false, collaborators: false, operational: false, financial: false
}

const SUPER_ADMIN_EMAIL = 'marcio.gama@salomaoadv.com.br';

const CHANGELOG = [
  {
    version: '3.0.0', date: '11/02/2026', type: 'radical', title: '🚀 Padronização e Recuperação',
    changes: [
      'Padronização de Cabeçalho Geral (Settings)',
      'Migração de Configurações da Controladoria',
      'Correção no Display de Colaboradores (Nomes ao invés de IDs)',
      'Recuperação de Dados de Colaboradores (Fix Join Query)'
    ]
  },
  {
    version: '2.9.9', date: '04/02/2026', type: 'fix', title: '🛡️ Ajuste Permissão RH/Collaborators',
    changes: ['Unificação de flags de acesso para o módulo de colaboradores', 'Correção de bypass emergencial']
  },
  {
    version: '2.9.8', date: '03/02/2026', type: 'fix', title: '🛡️ Reset de Segurança e Bypass',
    changes: ['Remoção de políticas RLS conflitantes (Erro 500)', 'Bypass local prioritário para marcio.gama', 'Sincronização forçada de UUID via Upsert']
  }
]

export function Settings({ onModuleHome, onLogout }: { onModuleHome?: () => void, onLogout?: () => void }) {
  // --- STATES ---
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' })
  const [activeModule, setActiveModule] = useState<'menu' | 'geral' | 'crm' | 'juridico' | 'rh' | 'family' | 'financial' | 'historico' | 'sistema' | 'about'>('menu')

  const [users, setUsers] = useState<AppUser[]>([])
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [userForm, setUserForm] = useState<{ nome: string, email: string, cargo: string, allowed_modules: string[] }>({ nome: '', email: '', cargo: 'Colaborador', allowed_modules: ['crm'] })

  const [currentUserEmail, setCurrentUserEmail] = useState<string>('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [currentUserPermissions, setCurrentUserPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS)
  const [sessionUserId, setSessionUserId] = useState<string>('')

  const [brindes, setBrindes] = useState<GenericItem[]>([])
  const [socios, setSocios] = useState<GenericItem[]>([])

  const [resetModal, setResetModal] = useState<{ isOpen: boolean; table: string; moduleName: string; logMsg: string; description: string } | null>(null)
  const [confirmText, setConfirmText] = useState('')

  const isSuperAdmin = currentUserEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  const isAdmin = currentUserRole.toLowerCase() === 'admin' || isSuperAdmin;

  // --- EFFECTS ---
  useEffect(() => {
    fetchCurrentUserMetadata();
    fetchUsers();
    fetchBrindes();
    fetchSocios();
  }, [sessionUserId])

  // --- DATA FETCHING ---
  const fetchCurrentUserMetadata = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      const emailLower = user.email.toLowerCase();
      setCurrentUserEmail(emailLower);
      setSessionUserId(user.id);

      if (emailLower === SUPER_ADMIN_EMAIL.toLowerCase()) {
        setCurrentUserRole('admin');
        setCurrentUserPermissions({ geral: true, crm: true, family: true, collaborators: true, operational: true, financial: true });
        return;
      }

      const { data } = await supabase.from('user_profiles').select('role, allowed_modules').eq('email', emailLower).maybeSingle()
      if (data) {
        setCurrentUserRole(data.role || 'user')
        const modules = data.allowed_modules || []
        setCurrentUserPermissions({
          geral: true,
          crm: modules.includes('crm'),
          family: modules.includes('family'),
          collaborators: modules.includes('collaborators') || modules.includes('rh'),
          operational: modules.includes('operational'),
          financial: modules.includes('financial')
        })
      }
    }
  }

  const fetchUsers = async () => {
    const { data } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false })
    if (data) {
      setUsers(data.map((u: any) => ({
        id: u.id, user_id: u.user_id, nome: u.email.split('@')[0],
        email: u.email, cargo: u.role === 'admin' ? 'Administrador' : 'Colaborador',
        role: u.role || 'user', ativo: !!u.user_id, allowed_modules: u.allowed_modules || []
      })))
    }
  }

  const fetchBrindes = async () => {
    const { data } = await supabase.from('tipos_brinde').select('*').order('nome')
    if (data) setBrindes(data)
  }

  const fetchSocios = async () => {
    const { data } = await supabase.from('socios').select('*').order('nome')
    if (data) setSocios(data)
  }

  // --- ACTIONS ---
  const handleSaveUser = async () => {
    if (!isAdmin || !userForm.email) return;
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const emailNormalizado = userForm.email.toLowerCase().trim();
      const roleFinal = userForm.cargo === 'Administrador' ? 'admin' : 'user';

      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', emailNormalizado)
        .maybeSingle();

      let error;

      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            role: roleFinal,
            allowed_modules: userForm.allowed_modules
          })
          .eq('email', emailNormalizado);
        error = updateError;
      } else {
        const specialUsers: Record<string, string> = {
          'bruna.cardoso@salomaoadv.com.br': '6c9be206-8a36-4f18-8557-5d28d80929a4',
          'kaua.mombrine@salomaoadv.com.br': 'bcb197e1-2480-4c8e-81ec-1aa8bb3a98fc'
        };
        const targetId = specialUsers[emailNormalizado];

        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: targetId,
            user_id: targetId,
            email: emailNormalizado,
            role: roleFinal,
            allowed_modules: userForm.allowed_modules
          });
        error = insertError;
      }

      if (error) throw error;

      await logAction('UPDATE', 'USER_PROFILES', `Configurou perfil de ${emailNormalizado}`);
      setStatus({ type: 'success', message: 'Usuário salvo com sucesso!' });

      setTimeout(() => {
        setIsUserModalOpen(false);
        fetchUsers();
      }, 800);

    } catch (e: any) {
      console.error('Erro ao salvar usuário:', e);
      setStatus({ type: 'error', message: 'Erro: ' + (e.message || 'Falha ao processar no banco') });
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteUser = async (user: AppUser) => {
    if (!isAdmin || user.email === SUPER_ADMIN_EMAIL) return;
    if (confirm(`Excluir usuário ${user.email}?`)) {
      const { error } = await supabase.from('user_profiles').delete().eq('email', user.email)
      if (!error) { await logAction('DELETE', 'USER_PROFILES', `Excluiu ${user.email}`); fetchUsers(); }
    }
  }

  const openResetModal = (table: string, moduleName: string, logMsg: string, description: string) => {
    if (!isAdmin) return;
    setResetModal({ isOpen: true, table, moduleName, logMsg, description });
    setConfirmText('');
  }

  const handleResetAction = async () => {
    if (!resetModal || confirmText !== 'APAGAR') return;
    setLoading(true);
    try {
      const uuidTables = [
        'aeronave_lancamentos',
        'financeiro_aeronave',
        'presenca_portaria',
        'marcacoes_ponto',
        'colaboradores'
      ];

      if (uuidTables.includes(resetModal.table)) {
        const { error } = await supabase
          .from(resetModal.table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(resetModal.table)
          .delete()
          .not('id', 'eq', 0);
        if (error) throw error;
      }

      setStatus({ type: 'success', message: `${resetModal.moduleName} resetado com sucesso!` });
      await logAction('RESET', resetModal.moduleName.toUpperCase(), resetModal.logMsg);
      setResetModal(null);
      setConfirmText('');
    } catch (e: any) {
      console.error('Erro ao resetar:', e);
      setStatus({ type: 'error', message: 'Erro ao resetar: ' + (e.message || 'Falha ao processar no banco') });
    } finally {
      setLoading(false);
    }
  }

  const hasAccessToModule = (modId: string) => {
    if (isSuperAdmin || isAdmin) return true;
    if (['menu', 'historico', 'juridico', 'geral', 'about'].includes(modId)) return true;
    const keyMap: any = { crm: 'crm', rh: 'collaborators', family: 'family', financial: 'financial' };
    return currentUserPermissions[keyMap[modId] as keyof UserPermissions] || false;
  }

  const menuItems = [
    { id: 'geral', label: 'Geral', icon: Shield },
    { id: 'crm', label: 'CRM Brindes', icon: Briefcase },
    { id: 'rh', label: 'RH', icon: Users },
    { id: 'family', label: 'Família', icon: Heart },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'historico', label: 'Histórico', icon: HistoryIcon },
    { id: 'sistema', label: 'Sistema', icon: Code, adminOnly: true },
    { id: 'about', label: 'Sobre', icon: Info },
  ];

  if (activeModule !== 'menu' && !hasAccessToModule(activeModule)) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center h-[500px] bg-white rounded-2xl border text-center">
        <EyeOff className="h-16 w-16 text-red-400 mb-6" />
        <h2 className="text-2xl font-bold mb-4">Acesso Restrito</h2>
        <button onClick={() => setActiveModule('menu')} className="px-6 py-2 bg-gray-900 text-white rounded-lg font-bold flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" /> Voltar ao Menu
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6 overflow-hidden">

      {/* 1. Header - Salomão Design System */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-3 shadow-lg">
            <SettingsIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Configurações</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Gerenciamento e Sistema</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-sm font-bold text-[#0a192f]">{currentUserEmail.split('@')[0]}</span>
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

        {/* SIDEBAR DE NAVEGAÇÃO REESTRUTURADA */}
        <div className="w-full lg:w-64 flex-shrink-0 flex flex-col space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-col space-y-1">
            {menuItems.map(item => (
              (!item.adminOnly || isAdmin) && hasAccessToModule(item.id) && (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id as any)}
                  className={`w-full flex items-center px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeModule === item.id
                      ? 'bg-[#1e3a8a] text-white shadow-md'
                      : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                </button>
              )
            ))}
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

          {status.type && (
            <div className={`mb-4 p-4 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {status.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
              <p className={`text-sm font-medium ${status.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{status.message}</p>
            </div>
          )}

          {activeModule === 'menu' && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <SettingsIcon className="h-16 w-16 text-gray-200 mb-4" />
              <h2 className="text-xl font-bold text-gray-900">Bem-vindo às Configurações</h2>
              <p className="text-gray-500 mt-2 text-sm max-w-md text-center">Utilize o menu lateral para acessar o gerenciamento de usuários, sistema e manutenção.</p>
            </div>
          )}

          {activeModule === 'geral' && (
            <UserManagement
              users={users}
              isAdmin={isAdmin}
              onOpenModal={(user) => {
                setEditingUser(user || null);
                setUserForm(user ? { nome: user.nome, email: user.email, cargo: user.cargo, allowed_modules: user.allowed_modules } : { nome: '', email: '', cargo: 'Colaborador', allowed_modules: ['crm'] });
                setIsUserModalOpen(true);
              }}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeModule === 'about' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 col-span-2 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#1e3a8a]"></div>
                <div className="mx-auto flex items-center justify-center mb-6">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
                    <Layout className="h-16 w-16 text-[#0a192f]" />
                  </div>
                </div>
                <h2 className="text-xl font-black text-[#0a192f] uppercase tracking-[0.2em]">FlowMetrics</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Versão 3.0.0 • Build 2026.02</p>

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
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2"><Code className="w-4 h-4 text-[#1e3a8a]" /> Frontend Stack</h3>
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

          {activeModule === 'crm' && (
            <CRMSection
              isAdmin={isAdmin}
              onReset={() => openResetModal('clientes', 'CRM Brindes', 'Resetou base do CRM', 'Remove TODOS os clientes, brindes e histórico do CRM')}
            />
          )}

          {activeModule === 'rh' && (
            <MaintenanceSection
              type="rh" isAdmin={isAdmin}
              onReset={() => openResetModal('presenca_portaria', 'Presencial', 'Resetou presenças', 'Remove todos os registros de presença da portaria')}
              onResetSecondary={() => openResetModal('colaboradores', 'Colaboradores', 'Resetou colaboradores', 'Remove todos os dados cadastrais de colaboradores')}
              onResetTertiary={() => openResetModal('marcacoes_ponto', 'Controle de Horas', 'Resetou marcações de ponto', 'Remove todos os registros de marcações de ponto')}
            />
          )}

          {activeModule === 'family' && (
            <MaintenanceSection type="family" isAdmin={isAdmin} onReset={() => openResetModal('familia_salomao_dados', 'Família', 'Resetou base da família', 'Remove todos os dados financeiros da família')} />
          )}

          {activeModule === 'financial' && (
            <MaintenanceSection type="financial" isAdmin={isAdmin} onReset={() => openResetModal('financeiro_aeronave', 'Financeiro', 'Resetou base da aeronave', 'Remove todos os lançamentos financeiros da aeronave')} />
          )}

          {activeModule === 'sistema' && (
            <SystemSection changelog={CHANGELOG} isAdmin={isAdmin} onSystemReset={() => openResetModal('clientes', 'SISTEMA', 'Reset Total', 'Remove TODOS os dados do sistema (clientes, histórico, etc.)')} />
          )}

          {activeModule === 'historico' && <div className="bg-white rounded-xl shadow-sm border p-6"><History /></div>}
        </div>
      </div>

      <UserModal
        isOpen={isUserModalOpen} loading={loading} editingUser={editingUser} userForm={userForm}
        setUserForm={setUserForm} onClose={() => setIsUserModalOpen(false)} onSave={handleSaveUser}
        onToggleModule={(mod) => {
          const mods = [...userForm.allowed_modules];
          const idx = mods.indexOf(mod);
          idx > -1 ? mods.splice(idx, 1) : mods.push(mod);
          setUserForm({ ...userForm, allowed_modules: mods });
        }}
      />

      {resetModal?.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirmar Reset de Dados</h3>
                <p className="text-gray-600">Esta ação é <span className="font-bold text-red-600">IRREVERSÍVEL</span></p>
              </div>
            </div>

            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Trash2 className="h-5 w-5 text-red-600" />
                <p className="font-bold text-red-900">Base a ser excluída:</p>
              </div>
              <p className="text-2xl font-bold text-red-700 mb-2">{resetModal.moduleName}</p>
              <p className="text-sm text-red-700">{resetModal.description}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digite <span className="font-mono bg-gray-100 px-2 py-1 rounded text-red-600 font-bold">APAGAR</span> para confirmar:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Digite APAGAR"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono text-lg"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setResetModal(null); setConfirmText(''); }}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetAction}
                disabled={loading || confirmText !== 'APAGAR'}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>Processando...</>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5" />
                    Confirmar Reset
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}