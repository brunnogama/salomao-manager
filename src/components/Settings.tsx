import { useState, useRef, useEffect } from 'react'
import { 
  Shield, Users, History as HistoryIcon, Code, Lock, 
  Briefcase, EyeOff, LayoutGrid, Heart, Plane, DollarSign, Grid, 
  CheckCircle, AlertCircle, Trash2, AlertTriangle, ChevronRight
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
    version: '2.9.9', date: '04/02/2026', type: 'fix', title: '🛡️ Ajuste Permissão RH/Collaborators',
    changes: ['Unificação de flags de acesso para o módulo de colaboradores', 'Correção de bypass emergencial']
  },
  {
    version: '2.9.8', date: '03/02/2026', type: 'fix', title: '🛡️ Reset de Segurança e Bypass',
    changes: ['Remoção de políticas RLS conflitantes (Erro 500)', 'Bypass local prioritário para marcio.gama', 'Sincronização forçada de UUID via Upsert']
  }
]

export function Settings({ onModuleHome }: { onModuleHome?: () => void }) {
  // --- STATES ---
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' })
  const [activeModule, setActiveModule] = useState<'menu' | 'geral' | 'crm' | 'juridico' | 'rh' | 'family' | 'financial' | 'historico' | 'sistema'>('menu')
  
  const [users, setUsers] = useState<AppUser[]>([])
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [userForm, setUserForm] = useState({ nome: '', email: '', cargo: 'Colaborador', allowed_modules: ['crm'] })

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
    if (['menu', 'historico', 'juridico', 'geral'].includes(modId)) return true;
    const keyMap: any = { crm: 'crm', rh: 'collaborators', family: 'family', financial: 'financial' };
    return currentUserPermissions[keyMap[modId] as keyof UserPermissions] || false;
  }

  const getModuleConfig = (modId: string) => {
    const configs: Record<string, { label: string; icon: any; color: string; bgColor: string; description: string }> = {
      geral: { label: 'Geral', icon: Shield, color: 'text-gray-700', bgColor: 'bg-gray-50', description: 'Gerenciamento de usuários e permissões' },
      crm: { label: 'CRM Brindes', icon: Briefcase, color: 'text-blue-700', bgColor: 'bg-blue-50', description: 'Manutenção da base de dados do CRM' },
      rh: { label: 'RH', icon: Users, color: 'text-green-700', bgColor: 'bg-green-50', description: 'Gestão de colaboradores e presença' },
      family: { label: 'Família', icon: Heart, color: 'text-purple-700', bgColor: 'bg-purple-50', description: 'Controle familiar e financeiro' },
      financial: { label: 'Financeiro', icon: DollarSign, color: 'text-blue-800', bgColor: 'bg-blue-50', description: 'Gestão financeira da aeronave' },
      historico: { label: 'Histórico', icon: HistoryIcon, color: 'text-purple-700', bgColor: 'bg-purple-50', description: 'Registro de atividades do sistema' },
      sistema: { label: 'Sistema', icon: Code, color: 'text-red-700', bgColor: 'bg-red-50', description: 'Informações técnicas e manutenção' },
    };
    return configs[modId] || configs.geral;
  }

  const menuItems = [
    { id: 'geral', label: 'Geral', icon: Shield },
    { id: 'crm', label: 'CRM Brindes', icon: Briefcase },
    { id: 'rh', label: 'RH', icon: Users },
    { id: 'family', label: 'Família', icon: Heart },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'historico', label: 'Histórico', icon: HistoryIcon },
    { id: 'sistema', label: 'Sistema', icon: Code, adminOnly: true },
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

  const currentModuleConfig = getModuleConfig(activeModule);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sticky top-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
              <Shield className="h-5 w-5 text-gray-700" />
              <h3 className="font-bold text-gray-900">Configurações</h3>
            </div>

            <nav className="space-y-1">
              {menuItems.map(item => (
                (!item.adminOnly || isAdmin) && hasAccessToModule(item.id) && (
                  <button
                    key={item.id}
                    onClick={() => setActiveModule(item.id as any)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeModule === item.id
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    {activeModule === item.id && <ChevronRight className="h-4 w-4" />}
                  </button>
                )
              ))}
            </nav>

            {onModuleHome && (
              <button 
                onClick={onModuleHome} 
                className="w-full mt-6 pt-4 border-t border-gray-200 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                <Grid className="h-4 w-4" />
                Voltar ao Início
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-6">
          {activeModule !== 'menu' && (
            <div className={`${currentModuleConfig.bgColor} border border-gray-200 rounded-xl p-6`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${currentModuleConfig.color} bg-white border`}>
                  <currentModuleConfig.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${currentModuleConfig.color}`}>{currentModuleConfig.label}</h2>
                  <p className="text-gray-600 text-sm">{currentModuleConfig.description}</p>
                </div>
              </div>
            </div>
          )}

          {status.type && (
            <div className={`p-4 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {status.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
              <p className={`text-sm font-medium ${status.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{status.message}</p>
            </div>
          )}

          {activeModule === 'menu' && (
            <div className="grid grid-cols-1 gap-6 py-12">
              <p className="text-center text-gray-400 italic">Selecione uma opção no menu lateral.</p>
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
          setUserForm({...userForm, allowed_modules: mods});
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