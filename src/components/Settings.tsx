import { useState, useRef, useEffect } from 'react'
import { 
  Shield, Users, History as HistoryIcon, Code, Lock, 
  Briefcase, EyeOff, LayoutGrid, Heart, Plane, DollarSign, Grid, 
  CheckCircle, AlertCircle
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

  const handleResetAction = async (table: string, moduleName: string, logMsg: string) => {
    if (!isAdmin || !confirm(`ATENÇÃO: Isso apagará TODOS os dados de ${moduleName}. Prosseguir?`)) return;
    const confirmText = prompt('Digite APAGAR para confirmar:');
    if (confirmText !== 'APAGAR') return;
    setLoading(true);
    try {
      // Tabelas que usam UUID
      const uuidTables = [
        'aeronave_lancamentos', 
        'financeiro_aeronave', 
        'presenca_portaria', 
        'marcacoes_ponto', 
        'colaboradores'
      ];

      if (uuidTables.includes(table)) {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); 
        if (error) throw error;
      } else {
        // Lógica padrão para tabelas legadas (INT ID)
        const { error } = await supabase
          .from(table)
          .delete()
          .not('id', 'eq', 0);
        if (error) throw error;
      }
      
      setStatus({ type: 'success', message: `${moduleName} resetado com sucesso!` });
      await logAction('RESET', moduleName.toUpperCase(), logMsg);
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
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2 justify-between items-center">
        <button onClick={() => setActiveModule('menu')} className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
          <LayoutGrid className="h-4 w-4" /> Menu
        </button>
        <div className="flex flex-wrap gap-2 items-center">
          {[
            { id: 'geral', label: 'Geral', icon: Shield, color: 'bg-gray-900' },
            { id: 'crm', label: 'CRM', icon: Briefcase, color: 'bg-blue-600' },
            { id: 'rh', label: 'RH', icon: Users, color: 'bg-green-600' },
            { id: 'family', label: 'Família', icon: Heart, color: 'bg-purple-600' },
            { id: 'financial', label: 'Financeiro', icon: DollarSign, color: 'bg-blue-800' },
            { id: 'historico', label: 'Histórico', icon: HistoryIcon, color: 'bg-purple-600' },
            { id: 'sistema', label: 'Sistema', icon: Code, color: 'bg-red-600', adminOnly: true },
          ].map(m => (
            (!m.adminOnly || isAdmin) && hasAccessToModule(m.id) && (
              <button 
                key={m.id} 
                onClick={() => setActiveModule(m.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeModule === m.id ? `${m.color} text-white` : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'}`}
              >
                <m.icon className="h-4 w-4" /> {m.label}
              </button>
            )
          ))}
          {onModuleHome && (
            <button onClick={onModuleHome} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg ml-2 border border-gray-200"><Grid className="h-5 w-5" /></button>
          )}
        </div>
      </div>

      {status.type && (
        <div className={`p-4 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {status.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
          <p className={`text-sm font-medium ${status.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{status.message}</p>
        </div>
      )}

      {activeModule === 'menu' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
            <p className="col-span-full text-center text-gray-400 italic">Módulo de configurações. Selecione uma opção acima.</p>
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
          brindes={brindes} socios={socios} 
          onDeleteBrinde={(id, nome) => isAdmin && confirm(`Excluir ${nome}?`) && supabase.from('tipos_brinde').delete().eq('id', id).then(fetchBrindes)}
          onDeleteSocio={(id, nome) => isAdmin && confirm(`Excluir ${nome}?`) && supabase.from('socios').delete().eq('id', id).then(fetchSocios)}
        />
      )}

      {activeModule === 'rh' && (
        <MaintenanceSection 
          type="rh" isAdmin={isAdmin} 
          onReset={() => handleResetAction('presenca_portaria', 'Presencial', 'Resetou presenças')}
          onResetSecondary={() => handleResetAction('colaboradores', 'Colaboradores', 'Resetou colaboradores')}
          onResetTertiary={() => handleResetAction('marcacoes_ponto', 'Controle de Horas', 'Resetou marcações de ponto')}
        />
      )}

      {activeModule === 'family' && (
        <MaintenanceSection type="family" isAdmin={isAdmin} onReset={() => handleResetAction('familia_salomao_dados', 'Família', 'Resetou base da família')} />
      )}

      {activeModule === 'financial' && (
        <MaintenanceSection type="financial" isAdmin={isAdmin} onReset={() => handleResetAction('financeiro_aeronave', 'Financeiro', 'Resetou base da aeronave')} />
      )}

      {activeModule === 'sistema' && (
        <SystemSection changelog={CHANGELOG} isAdmin={isAdmin} onSystemReset={() => handleResetAction('clientes', 'SISTEMA', 'Reset Total')} />
      )}

      {activeModule === 'historico' && <div className="bg-white rounded-xl shadow-sm border p-6"><History /></div>}

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
    </div>
  )
}
