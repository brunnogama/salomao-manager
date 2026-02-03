import { useState, useRef, useEffect } from 'react'
import { 
  Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, 
  Users, Pencil, Trash2, Save, RefreshCw, 
  AlertTriangle, History as HistoryIcon, Code, Shield, UserPlus, Ban, Check, Lock, Building,
  Plus, X, Tag, Briefcase, EyeOff, LayoutGrid, ArrowRight, MessageSquare, Heart, Plane, DollarSign, Grid, Loader2
} from 'lucide-react'
import { utils, read, writeFile } from 'xlsx'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/logger'
import { History } from './crm/History'

// --- INTERFACES ---
interface UserPermissions {
  geral: boolean;
  crm: boolean;
  family: boolean;
  collaborators: boolean;
  operational: boolean;
  financial: boolean;
}

interface AppUser {
  id: string;
  user_id: string | null;
  nome: string;
  email: string;
  cargo: string;
  role: string;
  ativo: boolean;
  allowed_modules: string[];
}

interface GenericItem {
  id: number;
  nome: string;
  ativo?: boolean;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  geral: true,
  crm: true,
  family: false,
  collaborators: false,
  operational: false,
  financial: false
}

const SUPER_ADMIN_EMAIL = 'marcio.gama@salomaoadv.com.br';

const CHANGELOG = [
  {
    version: '2.9.2',
    date: '03/02/2026',
    type: 'fix',
    title: '🔐 Sincronização de Usuários',
    changes: [
      'Correção na lógica de vinculação de perfis via e-mail',
      'Sincronização automática com Supabase Auth Trigger'
    ]
  },
  {
    version: '2.9.1',
    date: '02/02/2026',
    type: 'minor',
    title: '✈️ Manutenção Financeiro',
    changes: [
      'Adicionado reset de dados da Gestão de Aeronave em Settings',
      'Nova aba de manutenção para o módulo Financeiro'
    ]
  }
]

export function Settings({ onModuleHome }: { onModuleHome?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' })
  
  const [activeModule, setActiveModule] = useState<'menu' | 'geral' | 'crm' | 'juridico' | 'rh' | 'family' | 'financial' | 'historico' | 'sistema'>('menu')
  
  const [users, setUsers] = useState<AppUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  
  const [userForm, setUserForm] = useState({ 
    nome: '', 
    email: '', 
    cargo: 'Colaborador',
    allowed_modules: ['crm']
  })

  const [magistradosConfig, setMagistradosConfig] = useState({ pin: '', emails: '' })
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [showAllVersions, setShowAllVersions] = useState(false)
    
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [currentUserPermissions, setCurrentUserPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS)
  const [sessionUserId, setSessionUserId] = useState<string>('')
  
  const isSuperAdmin = currentUserEmail === SUPER_ADMIN_EMAIL;
  const isAdmin = currentUserRole.toLowerCase() === 'admin' || isSuperAdmin;

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [brindes, setBrindes] = useState<GenericItem[]>([])
  const [newBrinde, setNewBrinde] = useState('')
  const [isAddingBrinde, setIsAddingBrinde] = useState(false)
  const [socios, setSocios] = useState<GenericItem[]>([])
  const [newSocio, setNewSocio] = useState('')
  const [isAddingSocio, setIsAddingSocio] = useState(false)

  useEffect(() => {
    fetchCurrentUserMetadata();
    fetchUsers();
    fetchMagistradosConfig();
    fetchBrindes();
    fetchSocios();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const newUserId = session?.user?.id || ''
        if (sessionUserId && sessionUserId !== newUserId) {
          setActiveModule('menu')
        }
        setSessionUserId(newUserId)
        fetchCurrentUserMetadata()
      } else if (event === 'SIGNED_OUT') {
        setActiveModule('menu')
        setSessionUserId('')
      }
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [sessionUserId])

  useEffect(() => {
    setActiveModule('menu')
  }, [])

  const fetchBrindes = async () => {
    const { data } = await supabase.from('tipos_brinde').select('*').order('nome')
    if (data) setBrindes(data)
  }
  const handleAddBrinde = async () => {
    if (!newBrinde.trim()) return
    const { error } = await supabase.from('tipos_brinde').insert({ nome: newBrinde, ativo: true })
    if (!error) {
        await logAction('CREATE', 'TIPOS_BRINDE', `Criou ${newBrinde}`)
        setNewBrinde('')
        setIsAddingBrinde(false)
        fetchBrindes()
    } else { alert('Erro: ' + error.message) }
  }
  const handleDeleteBrinde = async (id: number, nome: string) => {
    if (!isAdmin) return alert('Apenas Admin')
    if (!confirm(`Excluir ${nome}?`)) return
    const { error } = await supabase.from('tipos_brinde').delete().eq('id', id)
    if (!error) { await logAction('DELETE', 'TIPOS_BRINDE', `Excluiu ${nome}`); fetchBrindes() }
  }

  const fetchSocios = async () => {
    const { data } = await supabase.from('socios').select('*').order('nome')
    if (data) setSocios(data)
  }
  const handleAddSocio = async () => {
    if (!newSocio.trim()) return
    const { error } = await supabase.from('socios').insert({ nome: newSocio, ativo: true })
    if (!error) {
        await logAction('CREATE', 'SOCIOS', `Criou ${newSocio}`)
        setNewSocio('')
        setIsAddingSocio(false)
        fetchSocios()
    } else { alert('Erro: ' + error.message) }
  }
  const handleDeleteSocio = async (id: number, nome: string) => {
    if (!isAdmin) return alert('Apenas Admin')
    if (!confirm(`Excluir ${nome}?`)) return
    const { error } = await supabase.from('socios').delete().eq('id', id)
    if (!error) { await logAction('DELETE', 'SOCIOS', `Excluiu ${nome}`); fetchSocios() }
  }

  const fetchCurrentUserMetadata = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setCurrentUserEmail(user.email);
        setSessionUserId(user.id);
        
        if (user.email === SUPER_ADMIN_EMAIL) {
            setCurrentUserRole('admin');
            setCurrentUserPermissions({
                geral: true, 
                crm: true, 
                family: true, 
                collaborators: true, 
                operational: true, 
                financial: true
            });
            return;
        }

        const { data } = await supabase
          .from('user_profiles')
          .select('role, allowed_modules')
          .eq('email', user.email)
          .maybeSingle()
          
        if (data) {
          setCurrentUserRole(data.role || 'user')
          const modules = data.allowed_modules || []
          setCurrentUserPermissions({
            geral: true,
            crm: modules.includes('crm'),
            family: modules.includes('family'),
            collaborators: modules.includes('collaborators'),
            operational: modules.includes('operational'),
            financial: modules.includes('financial')
          })
        }
      }
    } catch (error) {
      console.error("Erro ao verificar permissão:", error)
    }
  }

  const fetchMagistradosConfig = async () => {
    const { data } = await supabase.from('config_magistrados').select('*').single()
    if (data) {
        setMagistradosConfig({
            pin: data.pin_acesso,
            emails: (data.emails_permitidos || []).join(', ')
        })
    }
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, role, allowed_modules, created_at')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      if (data) {
        setUsers(data.map((u: any) => ({
          id: u.id || `pre-${u.email}`,
          user_id: u.id,
          nome: u.email.split('@')[0],
          email: u.email,
          cargo: u.role === 'admin' ? 'Administrador' : 'Colaborador',
          role: u.role || 'user',
          ativo: !!u.id,
          allowed_modules: u.allowed_modules || []
        })))
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const openUserModal = (user?: AppUser) => {
    if (!isAdmin) return alert("Apenas administradores podem gerenciar usuários.");
    if (user) {
      setEditingUser(user)
      setUserForm({ 
        nome: user.nome, 
        email: user.email, 
        cargo: user.role === 'admin' ? 'Administrador' : 'Colaborador',
        allowed_modules: user.allowed_modules || ['crm']
      })
    } else {
      setEditingUser(null)
      setUserForm({ 
        nome: '', 
        email: '', 
        cargo: 'Colaborador',
        allowed_modules: ['crm']
      })
    }
    setIsUserModalOpen(true)
  }

  const handleToggleModule = (moduleKey: string) => {
    setUserForm(prev => {
      const modules = [...prev.allowed_modules]
      const index = modules.indexOf(moduleKey)
      if (index > -1) {
        modules.splice(index, 1)
      } else {
        modules.push(moduleKey)
      }
      return { ...prev, allowed_modules: modules }
    })
  }

  const handleSaveUser = async () => {
    if (!isAdmin) return;
    if (!userForm.email) return alert("E-mail obrigatório");
      
    setLoading(true);
    const emailNormalizado = userForm.email.toLowerCase().trim();
    const role = userForm.cargo === 'Administrador' ? 'admin' : 'user';
    
    try {
      // 1. Verificar se o perfil já existe (por email)
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('email', emailNormalizado)
        .maybeSingle();

      if (existing) {
        // Atualiza perfil (identificado pelo e-mail para garantir sincronia)
        const { error } = await supabase
          .from('user_profiles')
          .update({
            role: role,
            allowed_modules: userForm.allowed_modules
          })
          .eq('email', emailNormalizado);

        if (error) throw error;
        await logAction('UPDATE', 'USER_PROFILES', `Atualizou permissões de ${emailNormalizado}`);
      } else {
        // Cria novo perfil para pré-cadastro
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            email: emailNormalizado,
            role: role,
            allowed_modules: userForm.allowed_modules
          });
        
        if (error) throw error;
        await logAction('CREATE', 'USER_PROFILES', `Pré-cadastrou ${emailNormalizado}`);
      }
          
      setStatus({ type: 'success', message: 'Usuário configurado com sucesso!' });
      setIsUserModalOpen(false);
      fetchUsers();
    } catch (e: any) {
      console.error('Erro ao salvar usuário:', e);
      setStatus({ type: 'error', message: 'Erro ao salvar: ' + e.message });
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteUser = async (user: AppUser) => {
    if (!isAdmin) return alert("Apenas administradores podem excluir usuários.");
    if (user.email === SUPER_ADMIN_EMAIL) return alert("Não é possível excluir o Super Admin!");
    if (confirm(`Excluir usuário ${user.email}?`)) {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('email', user.email)
      if (error) {
        alert('Erro: ' + error.message)
      } else {
        await logAction('DELETE', 'USER_PROFILES', `Excluiu ${user.email}`)
        fetchUsers()
        setStatus({ type: 'success', message: 'Usuário excluído!' })
      }
    }
  }

  const handleSystemReset = async () => {
    if (!isAdmin) return alert("Ação restrita a administradores.");
    if (!confirm('PERIGO: Isso apagará TODOS os dados do SISTEMA. Tem certeza?')) return;
    const confirmText = prompt('Digite APAGAR para confirmar:')
    if (confirmText !== 'APAGAR') return;
    setLoading(true)
    setStatus({ type: null, message: 'Limpando base de dados...' })
    try {
        try { await supabase.from('tasks').delete().neq('id', 0) } catch (e) { console.warn(e) }
        await supabase.from('magistrados').delete().neq('id', 0)
        await supabase.from('clientes').delete().neq('id', 0)
        setStatus({ type: 'success', message: 'Sistema resetado!' })
        await logAction('RESET', 'SISTEMA', 'Resetou toda a base')
    } catch (error: any) {
        setStatus({ type: 'error', message: 'Erro: ' + error.message })
    } finally { setLoading(false) }
  }

  const handleResetPresence = async () => {
    if (!isAdmin) return alert("Ação restrita a administradores.");
    if (!confirm('ATENÇÃO: Apagar todo o histórico de PRESENÇA?')) return;
    const confirmText = prompt('Digite APAGAR para confirmar:')
    if (confirmText !== 'APAGAR') return;
    setLoading(true)
    try {
        const { error } = await supabase.from('presenca_portaria').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        if (error) throw error
        setStatus({ type: 'success', message: 'Base de Presença resetada!' })
        await logAction('RESET', 'RH', 'Resetou base de presença')
    } catch (error: any) {
        setStatus({ type: 'error', message: 'Erro: ' + error.message })
    } finally { setLoading(false) }
  }

  const handleResetCollaborators = async () => {
    if (!isAdmin) return alert("Ação restrita a administradores.");
    if (!confirm('ATENÇÃO: Apagar todo o cadastro de COLABORADORES?')) return;
    const confirmText = prompt('Digite APAGAR para confirmar:')
    if (confirmText !== 'APAGAR') return;
    setLoading(true)
    try {
        const { error } = await supabase.from('colaboradores').delete().neq('id', 0)
        if (error) throw error
        setStatus({ type: 'success', message: 'Base de Colaboradores resetada!' })
        await logAction('RESET', 'RH', 'Resetou base de colaboradores')
    } catch (error: any) {
        setStatus({ type: 'error', message: 'Erro: ' + error.message })
    } finally { setLoading(false) }
  }

  const handleResetFamily = async () => {
    if (!isAdmin) return alert("Ação restrita a administradores.");
    if (!confirm('ATENÇÃO: Isso apagará TODOS os dados da Gestão de Família. Prosseguir?')) return;
    const confirmText = prompt('Digite APAGAR para confirmar:')
    if (confirmText !== 'APAGAR') return;
    setLoading(true)
    try {
        await supabase.from('familia_salomao_dados').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('familia_config_opcoes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        setStatus({ type: 'success', message: 'Base da Família resetada!' })
        await logAction('RESET', 'FAMILY', 'Resetou base da família e configurações')
    } catch (error: any) {
        setStatus({ type: 'error', message: 'Erro: ' + error.message })
    } finally { setLoading(false) }
  }

  const handleResetFinancial = async () => {
    if (!isAdmin) return alert("Ação restrita a administradores.");
    if (!confirm('ATENÇÃO: Isso apagará TODOS os dados da Gestão de Aeronave. Prosseguir?')) return;
    const confirmText = prompt('Digite APAGAR para confirmar:')
    if (confirmText !== 'APAGAR') return;
    setLoading(true)
    try {
        await supabase.from('financeiro_aeronave').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('aeronave_fornecedores').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        setStatus({ type: 'success', message: 'Base do Financeiro resetada!' })
        await logAction('RESET', 'FINANCIAL', 'Resetou base da aeronave e fornecedores')
    } catch (error: any) {
        setStatus({ type: 'error', message: 'Erro: ' + error.message })
    } finally { setLoading(false) }
  }

  const handleModuleChange = (newModule: any) => {
    setActiveModule(newModule)
  }

  // Helper para verificar permissão específica
  const userHasAccess = (modId: string) => {
    if (isAdmin) return true;
    if (modId === 'menu' || modId === 'historico' || modId === 'geral' || modId === 'juridico') return true;
    
    const keyMap: Record<string, keyof UserPermissions> = {
      crm: 'crm',
      rh: 'collaborators',
      family: 'family',
      financial: 'financial'
    };

    const permKey = keyMap[modId];
    return permKey ? currentUserPermissions[permKey] : false;
  }

  if (activeModule !== 'menu' && !userHasAccess(activeModule)) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
               <button onClick={() => handleModuleChange('menu')} className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"><LayoutGrid className="h-4 w-4" /> Menu</button>
          </div>
          <div className="flex flex-col items-center justify-center h-[500px] bg-white rounded-2xl shadow-sm border border-gray-200">
              <EyeOff className="h-16 w-16 text-red-400 mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
              <button onClick={() => handleModuleChange('menu')} className="px-6 py-2 bg-gray-900 text-white rounded-lg font-bold flex items-center gap-2"><LayoutGrid className="h-4 w-4" /> Voltar para o Menu</button>
          </div>
      </div>
    )
  }

  if (activeModule === 'menu') {
      const modules = [
          { id: 'geral', label: 'Geral', icon: Shield, desc: 'Gestão de Usuários', color: 'bg-gray-900', perm: currentUserPermissions.geral },
          { id: 'crm', label: 'CRM', icon: Briefcase, desc: 'Clientes e Brindes', color: 'bg-blue-600', perm: currentUserPermissions.crm },
          { id: 'juridico', label: 'Brindes', icon: Lock, desc: 'Área de Autoridades', color: 'bg-[#112240]', perm: true },
          { id: 'rh', label: 'RH', icon: Users, desc: 'Controle de Pessoal', color: 'bg-green-600', perm: currentUserPermissions.collaborators },
          { id: 'family', label: 'Família', icon: Heart, desc: 'Gestão Secretaria', color: 'bg-purple-600', perm: currentUserPermissions.family },
          { id: 'financial', label: 'Financeiro', icon: DollarSign, desc: 'Gestão de Aeronave', color: 'bg-blue-800', perm: currentUserPermissions.financial },
          { id: 'historico', label: 'Histórico', icon: HistoryIcon, desc: 'Log de Atividades', color: 'bg-purple-600', perm: true },
          { id: 'sistema', label: 'Sistema', icon: Code, desc: 'Configurações Globais', color: 'bg-red-600', perm: currentUserPermissions.geral },
      ]

      return (
          <div className="max-w-5xl mx-auto py-12">
              <div className="text-center mb-10">
                  <h1 className="text-3xl font-bold text-gray-900">Painel de Controle</h1>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {modules.map((m) => {
                      const hasAccess = isAdmin || m.perm;
                      return (
                          <button key={m.id} onClick={() => handleModuleChange(m.id)} className={`relative flex flex-col items-start p-6 rounded-2xl border transition-all duration-300 text-left ${hasAccess ? 'bg-white border-gray-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer' : 'bg-gray-50 border-gray-200 opacity-80 cursor-pointer'}`}>
                              <div className={`p-3 rounded-xl mb-4 text-white shadow-md ${hasAccess ? m.color : 'bg-gray-400 grayscale'}`}><m.icon className="h-6 w-6" /></div>
                              <h3 className="text-lg font-bold text-gray-900 mb-1">{m.label}</h3>
                              <p className="text-sm text-gray-500">{m.desc}</p>
                              {!hasAccess && <Lock className="absolute top-6 right-6 h-5 w-5 text-red-300" />}
                          </button>
                      )
                  })}
              </div>
          </div>
      )
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2 justify-between items-center">
          <button onClick={() => handleModuleChange('menu')} className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"><LayoutGrid className="h-4 w-4" /> Menu</button>
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => handleModuleChange('geral')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeModule === 'geral' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}><Shield className="h-4 w-4" /> Geral</button>
            <button onClick={() => handleModuleChange('crm')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeModule === 'crm' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-blue-50'}`}><Briefcase className="h-4 w-4" /> CRM</button>
            <button onClick={() => handleModuleChange('juridico')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeModule === 'juridico' ? 'bg-[#112240] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}><Lock className="h-4 w-4" /> Jurídico</button>
            <button onClick={() => handleModuleChange('rh')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeModule === 'rh' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-green-50'}`}><Users className="h-4 w-4" /> RH</button>
            <button onClick={() => handleModuleChange('family')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeModule === 'family' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-purple-50'}`}><Heart className="h-4 w-4" /> Família</button>
            <button onClick={() => handleModuleChange('financial')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeModule === 'financial' ? 'bg-blue-800 text-white' : 'bg-white text-gray-600 hover:bg-blue-50'}`}><DollarSign className="h-4 w-4" /> Financeiro</button>
            <button onClick={() => handleModuleChange('historico')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeModule === 'historico' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-purple-50'}`}><HistoryIcon className="h-4 w-4" /> Histórico</button>
            <button onClick={() => handleModuleChange('sistema')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeModule === 'sistema' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-red-50'}`}><Code className="h-4 w-4" /> Sistema</button>
            
            {onModuleHome && (
              <button onClick={onModuleHome} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg ml-2 border border-gray-200" title="Mudar Módulo">
                <Grid className="h-5 w-5" />
              </button>
            )}
          </div>
      </div>
      
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
              <div className="bg-gray-900 p-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5"/></button>
              </div>
              <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-600 uppercase">Nome</label>
                        <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 mt-1" value={userForm.nome} onChange={e => setUserForm({...userForm, nome: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-600 uppercase">Cargo</label>
                        <select className="w-full border border-gray-300 rounded-lg p-2.5 mt-1" value={userForm.cargo} onChange={e => setUserForm({...userForm, cargo: e.target.value})}>
                            <option>Administrador</option>
                            <option>Sócio</option>
                            <option>Colaborador</option>
                        </select>
                    </div>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-gray-600 uppercase">E-mail (Login)</label>
                      <input type="email" className="w-full border border-gray-300 rounded-lg p-2.5 mt-1" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} disabled={!!editingUser} />
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="text-xs font-bold text-gray-900 uppercase flex items-center gap-2 mb-3"><Lock className="h-3 w-3" /> Módulos Permitidos</label>
                    <div className="grid grid-cols-2 gap-3">
                        {['crm', 'collaborators', 'family', 'operational', 'financial'].map(m => (
                            <label key={m} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded cursor-pointer hover:bg-blue-50 transition-colors">
                                <input type="checkbox" checked={userForm.allowed_modules.includes(m)} onChange={() => handleToggleModule(m)} className="text-blue-600 rounded" />
                                <span className="text-sm font-medium text-gray-700 capitalize">{m === 'collaborators' ? 'RH' : m === 'family' ? 'Família' : m}</span>
                            </label>
                        ))}
                    </div>
                  </div>
              </div>
              <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-200">
                  <button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-gray-700 font-medium">Cancelar</button>
                  <button onClick={handleSaveUser} disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Alterações'}
                  </button>
              </div>
          </div>
        </div>
      )}

      {status.type && (
        <div className={`p-4 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex-shrink-0">{status.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}</div>
            <p className={`text-sm font-medium ${status.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{status.message}</p>
        </div>
      )}

      {activeModule === 'geral' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg"><Users className="h-5 w-5 text-gray-700" /></div>
                      <h3 className="font-bold text-gray-900 text-base">Gestão de Usuários</h3>
                  </div>
                  <button onClick={() => openUserModal()} disabled={!isAdmin} className="bg-gray-900 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-2 text-xs hover:bg-gray-800 disabled:opacity-50"><UserPlus className="h-4 w-4" /> Novo Usuário</button>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans">
                      <thead>
                          <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              <th className="py-2 px-2 text-left">Email</th>
                              <th className="py-2 px-2">Role</th>
                              <th className="py-2 px-2">Módulos</th>
                              <th className="py-2 px-2">Status</th>
                              <th className="py-2 px-2 text-right">Ações</th>
                          </tr>
                      </thead>
                      <tbody className="text-sm">
                          {users.map(user => (
                              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 group">
                                  <td className="py-3 px-2 text-xs font-bold text-[#112240]">{user.email}</td>
                                  <td className="py-3 px-2 capitalize"><span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-black text-gray-500">{user.role}</span></td>
                                  <td className="py-3 px-2 flex flex-wrap gap-1">{user.allowed_modules.map(m => (<span key={m} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold uppercase tracking-tighter">{m === 'collaborators' ? 'RH' : m}</span>))}</td>
                                  <td className="py-3 px-2">{user.ativo ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Loader2 className="h-3.5 w-3.5 text-orange-400 animate-spin" />}</td>
                                  <td className="py-3 px-2 text-right opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => openUserModal(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => handleDeleteUser(user)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {activeModule === 'family' && (
          <div className="animate-in fade-in">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-purple-50 rounded-lg"><Heart className="h-5 w-5 text-purple-700" /></div><div><h3 className="font-bold text-gray-900 text-base">Manutenção Gestão de Família</h3><p className="text-xs text-gray-500">Controle de dados da Secretaria Executiva</p></div></div>
                  <div className="border border-red-200 rounded-xl overflow-hidden">
                      <div className="bg-red-50 p-4 border-b border-red-200 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-600" /><h4 className="font-bold text-red-800 text-sm">Zona de Perigo - Dados da Família</h4></div>
                      <div className="p-6">
                          <p className="text-sm text-gray-600 mb-4">Esta ação irá apagar <strong>todos</strong> os registros de lançamentos e opções de menus configurados na Gestão de Família.</p>
                          <button onClick={handleResetFamily} disabled={!isAdmin} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white transition-colors ${isAdmin ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300 cursor-not-allowed'}`}>
                              <Trash2 className="h-4 w-4" /> Resetar Base da Família (Secretaria)
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeModule === 'financial' && (
          <div className="animate-in fade-in">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-blue-50 rounded-lg"><Plane className="h-5 w-5 text-blue-700" /></div><div><h3 className="font-bold text-gray-900 text-base">Manutenção Financeiro</h3><p className="text-xs text-gray-500">Controle de dados da Gestão de Aeronave</p></div></div>
                  <div className="border border-red-200 rounded-xl overflow-hidden">
                      <div className="bg-red-50 p-4 border-b border-red-200 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-600" /><h4 className="font-bold text-red-800 text-sm">Zona de Perigo - Dados da Aeronave</h4></div>
                      <div className="p-6">
                          <p className="text-sm text-gray-600 mb-4">Esta ação irá apagar <strong>todos</strong> os registros de voos, despesas e fornecedores configurados na Gestão de Aeronave.</p>
                          <button onClick={handleResetFinancial} disabled={!isAdmin} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white transition-colors ${isAdmin ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300 cursor-not-allowed'}`}>
                              <Trash2 className="h-4 w-4" /> Resetar Base da Aeronave
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeModule === 'rh' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-green-50 rounded-lg"><Users className="h-5 w-5 text-green-700" /></div><h3 className="font-bold text-gray-900 text-base">Manutenção RH</h3></div>
              <div className="space-y-6">
                <div className="border border-red-200 rounded-xl overflow-hidden">
                    <div className="bg-red-50 p-4 border-b border-red-200 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-600" /><h4 className="font-bold text-red-800 text-sm">Presença</h4></div>
                    <div className="p-6"><button onClick={handleResetPresence} disabled={!isAdmin} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Trash2 className="h-4 w-4" /> Resetar Presença</button></div>
                </div>
                <div className="border border-red-200 rounded-xl overflow-hidden">
                    <div className="bg-red-50 p-4 border-b border-red-200 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-600" /><h4 className="font-bold text-red-800 text-sm">Colaboradores</h4></div>
                    <div className="p-6"><button onClick={handleResetCollaborators} disabled={!isAdmin} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Trash2 className="h-4 w-4" /> Resetar Colaboradores</button></div>
                </div>
              </div>
          </div>
      )}

      {activeModule === 'sistema' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6"><HistoryIcon className="h-5 w-5" /><h3 className="font-bold text-gray-900 text-base">Changelog</h3></div>
                  <div className="space-y-4">{CHANGELOG.map(log => (<div key={log.version} className="border-l-2 border-gray-200 pl-4"><p className="text-xs font-bold text-blue-600">v{log.version}</p><h4 className="font-bold text-sm">{log.title}</h4><ul className="text-xs text-gray-500">{log.changes.map((c, i) => <li key={i}>• {c}</li>)}</ul></div>))}</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-6">
                  <button onClick={handleSystemReset} disabled={!isAdmin} className="w-full bg-red-600 text-white p-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-50"><Trash2 /> Resetar Sistema Completo</button>
              </div>
          </div>
      )}

      {activeModule === 'historico' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <History />
          </div>
      )}
      
      {activeModule === 'crm' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold mb-4">Brindes</h3>
                <div className="space-y-2">{brindes.map(b => <div key={b.id} className="flex justify-between text-xs p-2 bg-gray-50 rounded"><span>{b.nome}</span><button onClick={() => handleDeleteBrinde(b.id, b.nome)} className="text-red-500"><Trash2 className="h-3 w-3"/></button></div>)}</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold mb-4">Sócios</h3>
                <div className="space-y-2">{socios.map(s => <div key={s.id} className="flex justify-between text-xs p-2 bg-gray-50 rounded"><span>{s.nome}</span><button onClick={() => handleDeleteSocio(s.id, s.nome)} className="text-red-500"><Trash2 className="h-3 w-3"/></button></div>)}</div>
              </div>
          </div>
      )}
    </div>
  )
}