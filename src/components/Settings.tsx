import { useState, useRef, useEffect } from 'react'
import { 
  Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, 
  Users, Pencil, Trash2, Save, RefreshCw, 
  AlertTriangle, History, Code, Shield, UserPlus, Ban, Check, Lock, Building,
  Plus, X, Tag, Briefcase, EyeOff, LayoutGrid, ArrowRight, MessageSquare
} from 'lucide-react'
import { utils, read, writeFile } from 'xlsx'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/logger'

// --- INTERFACES ---
interface UserPermissions {
  geral: boolean;
  crm: boolean;
  juridico: boolean;
  rh: boolean;
  sistema: boolean;
}

interface AppUser {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  ativo: boolean;
  modulos_acesso: UserPermissions;
}

interface GenericItem {
  id: number;
  nome: string;
  ativo?: boolean;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  geral: true,
  crm: true,
  juridico: true,
  rh: true,
  sistema: true
}

const SUPER_ADMIN_EMAIL = 'marcio.gama@salomaoadv.com.br';

const CHANGELOG = [
  {
    version: '1.8.0',
    date: '26/01/2026',
    type: 'major',
    title: 'Super Admin & UX Flow',
    changes: [
      'Fluxo obrigatório de seleção de módulos no login',
      'Feedback visual de permissão negada',
      'Hardcode de Super Administrador implementado'
    ]
  },
  {
    version: '1.7.0',
    date: '26/01/2026',
    type: 'major',
    title: 'Dashboard de Módulos',
    changes: [
      'Nova tela inicial de seleção de módulos',
      'Navegação centralizada'
    ]
  }
]

export function Settings() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' })
  
  // Controle de Módulos (Tabs) - 'menu' é o estado inicial OBRIGATÓRIO
  const [activeModule, setActiveModule] = useState<'menu' | 'geral' | 'crm' | 'juridico' | 'rh' | 'sistema'>('menu')
  
  const [users, setUsers] = useState<AppUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  
  // Form state
  const [userForm, setUserForm] = useState({ 
    nome: '', 
    email: '', 
    cargo: 'Colaborador',
    modulos_acesso: DEFAULT_PERMISSIONS
  })

  const [magistradosConfig, setMagistradosConfig] = useState({ pin: '', emails: '' })
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [showAllVersions, setShowAllVersions] = useState(false)
   
  // Permissões do Usuário LOGADO
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [currentUserPermissions, setCurrentUserPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS)
  
  // Lógica de Admin: Verifica Cargo no banco OU se é o Super Admin hardcoded
  const isSuperAdmin = currentUserEmail === SUPER_ADMIN_EMAIL;
  const isAdmin = ['Administrador', 'Admin'].includes(currentUserRole) || isSuperAdmin;

  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- ESTADOS PARA TIPOS DE BRINDE E SÓCIOS ---
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
  }, [])

  // --- FUNÇÕES DE BRINDE ---
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

  // --- FUNÇÕES DE SÓCIOS ---
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

  // --- FUNÇÕES GERAIS ---
  const fetchCurrentUserMetadata = async () => {
    try {
      const { data: { user } } = await (supabase.auth as any).getUser()
      if (user?.email) {
        setCurrentUserEmail(user.email);
        
        // Se for Super Admin, força permissões totais localmente
        if (user.email === SUPER_ADMIN_EMAIL) {
            setCurrentUserRole('Administrador');
            setCurrentUserPermissions({
                geral: true, crm: true, juridico: true, rh: true, sistema: true
            });
            return; // Retorna cedo, não precisa buscar do banco para o Super Admin
        }

        const { data } = await supabase
          .from('usuarios_permitidos')
          .select('cargo, modulos_acesso')
          .eq('email', user.email)
          .single()
          
        if (data) {
          setCurrentUserRole(data.cargo)
          if (data.modulos_acesso) {
            setCurrentUserPermissions(data.modulos_acesso)
          }
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
    const { data } = await supabase.from('usuarios_permitidos').select('*').order('nome')
    if (data) {
        setUsers(data.map((u: any) => ({
            id: u.id,
            nome: u.nome || u.email.split('@')[0],
            email: u.email,
            cargo: u.cargo || 'Colaborador',
            ativo: u.ativo !== false,
            modulos_acesso: u.modulos_acesso || DEFAULT_PERMISSIONS
        })))
    }
    setLoadingUsers(false)
  }

  const openUserModal = (user?: AppUser) => {
    if (!isAdmin) return alert("Apenas administradores podem gerenciar usuários.");
    if (user) {
        setEditingUser(user)
        setUserForm({ 
            nome: user.nome, 
            email: user.email, 
            cargo: user.cargo,
            modulos_acesso: user.modulos_acesso || DEFAULT_PERMISSIONS
        })
    } else {
        setEditingUser(null)
        setUserForm({ 
            nome: '', 
            email: '', 
            cargo: 'Colaborador',
            modulos_acesso: DEFAULT_PERMISSIONS 
        })
    }
    setIsUserModalOpen(true)
  }

  const handleTogglePermission = (module: keyof UserPermissions) => {
      setUserForm(prev => ({
          ...prev,
          modulos_acesso: {
              ...prev.modulos_acesso,
              [module]: !prev.modulos_acesso[module]
          }
      }))
  }

  const handleSaveConfigMagistrados = async () => {
    if (!isAdmin) return alert("Acesso negado.");
    setLoadingConfig(true)
    const emailsArray = magistradosConfig.emails.split(',').map(e => e.trim()).filter(e => e)
    
    const { data: current } = await supabase.from('config_magistrados').select('id').single()
    
    if (current) {
        await supabase.from('config_magistrados').update({
            pin_acesso: magistradosConfig.pin,
            emails_permitidos: emailsArray
        }).eq('id', current.id)
    } else {
        await supabase.from('config_magistrados').insert({
            pin_acesso: magistradosConfig.pin,
            emails_permitidos: emailsArray
        })
    }
    alert('Configurações salvas!')
    setLoadingConfig(false)
  }

  const handleSaveUser = async () => {
    if (!isAdmin) return;
    if (!userForm.email) return alert("E-mail obrigatório")
    try {
        const payload = {
            nome: userForm.nome,
            email: userForm.email,
            cargo: userForm.cargo,
            modulos_acesso: userForm.modulos_acesso
        }

        if (editingUser) {
             await supabase.from('usuarios_permitidos').update(payload).eq('id', editingUser.id)
        } else {
             await supabase.from('usuarios_permitidos').insert({ ...payload, ativo: true })
        }
        setIsUserModalOpen(false)
        fetchUsers()
    } catch (e: any) {
        alert("Erro: " + e.message)
    }
  }

  const handleToggleActive = async (user: AppUser) => {
    if (!isAdmin) return alert("Apenas administradores podem alterar status.");
    await supabase.from('usuarios_permitidos').update({ ativo: !user.ativo }).eq('id', user.id)
    fetchUsers()
  }

  const handleDeleteUser = async (user: AppUser) => {
    if (!isAdmin) return alert("Apenas administradores podem excluir usuários.");
    if (confirm(`Excluir usuário ${user.email}?`)) {
        await supabase.from('usuarios_permitidos').delete().eq('id', user.id)
        fetchUsers()
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
        console.error("Erro:", error)
        setStatus({ type: 'error', message: 'Erro: ' + error.message })
    } finally { setLoading(false) }
  }

  const handleResetPresence = async () => {
    if (!isAdmin) return alert("Ação restrita a administradores.");
    if (!confirm('ATENÇÃO: Apagar todo o histórico de Presença?')) return;
    const confirmText = prompt('Digite APAGAR para confirmar:')
    if (confirmText !== 'APAGAR') return;
    setLoading(true)
    setStatus({ type: null, message: 'Limpando registros...' })
    try {
        const { error } = await supabase.from('presenca_portaria').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        if (error) throw error
        setStatus({ type: 'success', message: 'Base de Presença resetada!' })
        await logAction('RESET', 'RH', 'Resetou base de presença')
    } catch (error: any) {
        setStatus({ type: 'error', message: 'Erro: ' + error.message })
    } finally { setLoading(false) }
  }

  const handleDownloadTemplate = () => {
    const ws = utils.json_to_sheet([{ nome: 'Cliente Exemplo', empresa: 'Empresa SA', cargo: 'Diretor', email: 'email@teste.com', telefone: '11999999999', socio: 'Dr. João', tipo_brinde: 'Brinde VIP', quantidade: 1, cep: '01001000', endereco: 'Praça da Sé', numero: '1', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP' }])
    const wb = utils.book_new(); utils.book_append_sheet(wb, ws, "Template")
    writeFile(wb, "template_importacao.xlsx")
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) { alert("Apenas administradores."); if (fileInputRef.current) fileInputRef.current.value = ''; return; }
    const file = e.target.files?.[0]; if (!file) return
    setLoading(true); setStatus({ type: null, message: 'Processando...' })
    try {
      const data = await file.arrayBuffer(); const workbook = read(data)
      const jsonData = utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) as any[]
      const clientsToInsert = jsonData.map((row) => ({
        nome: row.nome || row.Nome, empresa: row.empresa || row.Empresa || '', cargo: row.cargo || row.Cargo || '', email: row.email || row.Email || '', telefone: row.telefone || row.Telefone || '', socio: row.socio || row.Socio || '', tipo_brinde: row.tipo_brinde || row['Tipo Brinde'] || 'Brinde Médio', quantidade: row.quantidade || row.Quantidade || 1, cep: row.cep || row.CEP || '', endereco: row.endereco || row.Endereco || '', numero: row.numero || row.Numero || '', bairro: row.bairro || row.Bairro || '', cidade: row.cidade || row.Cidade || '', estado: row.estado || row.Estado || ''
      }))
      const { error } = await supabase.from('clientes').insert(clientsToInsert); if (error) throw error
      setStatus({ type: 'success', message: `${clientsToInsert.length} importados!` })
      await logAction('IMPORTAR', 'SISTEMA', `Importou ${clientsToInsert.length}`)
    } catch (error: any) { setStatus({ type: 'error', message: 'Erro: ' + error.message }) } 
    finally { setLoading(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  // 

[Image of access control system flow chart]

  // --- RENDERIZAR BLOQUEIO DE ACESSO (MENSAGEM ELEGANTE) ---
  if (activeModule !== 'menu' && !currentUserPermissions[activeModule] && !isAdmin) {
      return (
          <div className="max-w-7xl mx-auto space-y-6">
               {/* HEADER DE NAVEGAÇÃO */}
              <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
                   <button onClick={() => setActiveModule('menu')} className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"><LayoutGrid className="h-4 w-4" /> Menu</button>
              </div>

              {/* TELA DE BLOQUEIO */}
              <div className="flex flex-col items-center justify-center h-[500px] bg-white rounded-2xl shadow-sm border border-gray-200 animate-in zoom-in-95 duration-300">
                  <div className="bg-red-50 p-6 rounded-full mb-6 relative">
                      <EyeOff className="h-16 w-16 text-red-400" />
                      <div className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-sm border border-red-100">
                          <Lock className="h-6 w-6 text-red-600" />
                      </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
                  <p className="text-gray-500 text-center max-w-md mb-8 px-4">
                      Você não possui as permissões necessárias para acessar o módulo <strong>{activeModule.toUpperCase()}</strong>.<br/><br/>
                      <span className="text-sm bg-gray-50 p-2 rounded-lg border border-gray-200 inline-block">
                          <MessageSquare className="h-3 w-3 inline mr-1"/>
                          Por favor, contacte o administrador do sistema.
                      </span>
                  </p>
                  <button onClick={() => setActiveModule('menu')} className="px-6 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4" /> Voltar para o Menu
                  </button>
              </div>
          </div>
      )
  }

  // --- RENDERIZAR MENU INICIAL (DASHBOARD) ---
  if (activeModule === 'menu') {
      const modules = [
          { id: 'geral', label: 'Geral', icon: Shield, desc: 'Gestão de Usuários', color: 'bg-gray-900', perm: currentUserPermissions.geral },
          { id: 'crm', label: 'CRM', icon: Briefcase, desc: 'Clientes e Brindes', color: 'bg-blue-600', perm: currentUserPermissions.crm },
          { id: 'juridico', label: 'Jurídico', icon: Lock, desc: 'Área de Magistrados', color: 'bg-[#112240]', perm: currentUserPermissions.juridico },
          { id: 'rh', label: 'RH', icon: Users, desc: 'Controle de Pessoal', color: 'bg-green-600', perm: currentUserPermissions.rh },
          { id: 'sistema', label: 'Sistema', icon: Code, desc: 'Configurações Globais', color: 'bg-red-600', perm: currentUserPermissions.sistema },
      ]

      return (
          <div className="max-w-5xl mx-auto py-12 animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center mb-10">
                  <h1 className="text-3xl font-bold text-gray-900">Painel de Controle</h1>
                  <p className="text-gray-500 mt-2">
                      {isSuperAdmin ? 
                        <span className="text-blue-600 font-bold flex items-center justify-center gap-1"><Shield className="h-3 w-3"/> Super Administrador Logado</span> : 
                        "Selecione um módulo para acessar"
                      }
                  </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {modules.map((m) => {
                      const hasAccess = isAdmin || m.perm;
                      return (
                          <button 
                              key={m.id}
                              // IMPORTANTE: Permitimos o clique mesmo sem acesso para mostrar a mensagem "Elegante" de bloqueio
                              onClick={() => setActiveModule(m.id as any)}
                              className={`relative group flex flex-col items-start p-6 rounded-2xl border transition-all duration-300 text-left ${hasAccess ? 'bg-white border-gray-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer' : 'bg-gray-50 border-gray-200 opacity-80 cursor-pointer hover:bg-gray-100'}`}
                          >
                              <div className={`p-3 rounded-xl mb-4 text-white shadow-md ${hasAccess ? m.color : 'bg-gray-400 grayscale'}`}>
                                  <m.icon className="h-6 w-6" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 mb-1">{m.label}</h3>
                              <p className="text-sm text-gray-500">{m.desc}</p>
                              
                              {hasAccess ? (
                                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <ArrowRight className="h-5 w-5 text-gray-400" />
                                  </div>
                              ) : (
                                  <div className="absolute top-6 right-6">
                                      <Lock className="h-5 w-5 text-red-300" />
                                  </div>
                              )}
                          </button>
                      )
                  })}
              </div>
          </div>
      )
  }

  // --- RENDERIZAR CONTEÚDO DOS MÓDULOS ---
  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      
      {/* SELETOR DE MÓDULOS (NAVBAR - Para navegação rápida) */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
          <button onClick={() => setActiveModule('menu')} className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors mr-2"><LayoutGrid className="h-4 w-4" /> Menu</button>
          
          <button onClick={() => setActiveModule('geral')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeModule === 'geral' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}><Shield className="h-4 w-4" /> Geral</button>
          <button onClick={() => setActiveModule('crm')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeModule === 'crm' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-blue-50'}`}><Briefcase className="h-4 w-4" /> CRM</button>
          <button onClick={() => setActiveModule('juridico')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeModule === 'juridico' ? 'bg-[#112240] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}><Lock className="h-4 w-4" /> Jurídico</button>
          <button onClick={() => setActiveModule('rh')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeModule === 'rh' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-green-50'}`}><Users className="h-4 w-4" /> RH</button>
          <button onClick={() => setActiveModule('sistema')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeModule === 'sistema' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-red-50'}`}><Code className="h-4 w-4" /> Sistema</button>
      </div>
      
      {/* MODAL USUÁRIO COM PERMISSÕES */}
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
                     <input type="email" className="w-full border border-gray-300 rounded-lg p-2.5 mt-1" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                 </div>

                 {/* SELEÇÃO DE PERMISSÕES */}
                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="text-xs font-bold text-gray-900 uppercase flex items-center gap-2 mb-3">
                        <Lock className="h-3 w-3" /> Permissões de Acesso
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded cursor-pointer hover:bg-blue-50 transition-colors">
                            <input type="checkbox" checked={userForm.modulos_acesso.geral} disabled className="text-gray-400 rounded focus:ring-0" />
                            <span className="text-sm font-medium text-gray-400">Geral (Padrão)</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded cursor-pointer hover:bg-blue-50 transition-colors">
                            <input type="checkbox" checked={userForm.modulos_acesso.crm} onChange={() => handleTogglePermission('crm')} className="text-blue-600 rounded focus:ring-blue-500" />
                            <span className="text-sm font-medium text-gray-700">Módulo CRM</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded cursor-pointer hover:bg-blue-50 transition-colors">
                            <input type="checkbox" checked={userForm.modulos_acesso.juridico} onChange={() => handleTogglePermission('juridico')} className="text-blue-600 rounded focus:ring-blue-500" />
                            <span className="text-sm font-medium text-gray-700">Módulo Jurídico</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded cursor-pointer hover:bg-blue-50 transition-colors">
                            <input type="checkbox" checked={userForm.modulos_acesso.rh} onChange={() => handleTogglePermission('rh')} className="text-blue-600 rounded focus:ring-blue-500" />
                            <span className="text-sm font-medium text-gray-700">Módulo RH</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded cursor-pointer hover:bg-blue-50 transition-colors">
                            <input type="checkbox" checked={userForm.modulos_acesso.sistema} onChange={() => handleTogglePermission('sistema')} className="text-blue-600 rounded focus:ring-blue-500" />
                            <span className="text-sm font-medium text-gray-700">Módulo Sistema</span>
                        </label>
                    </div>
                 </div>
             </div>
             
             <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-200">
                 <button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium">Cancelar</button>
                 <button onClick={handleSaveUser} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-sm">Salvar Alterações</button>
             </div>
          </div>
        </div>
      )}

      {/* FEEDBACK STATUS */}
      {status.type && (
        <div className={`p-4 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex-shrink-0">{status.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}</div>
            <p className={`text-sm font-medium ${status.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{status.message}</p>
        </div>
      )}

      {/* --- CONTEÚDO: MÓDULO GERAL --- */}
      {activeModule === 'geral' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg"><Users className="h-5 w-5 text-gray-700" /></div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-base">Gestão de Usuários</h3>
                            <p className="text-xs text-gray-500">Controle de acesso e permissões</p>
                        </div>
                    </div>
                    <button onClick={() => openUserModal()} disabled={!isAdmin} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg font-bold transition-colors ${isAdmin ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}><UserPlus className="h-4 w-4" /> Novo Usuário</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
                                <th className="py-2 px-2 font-semibold">Nome/Email</th>
                                <th className="py-2 px-2 font-semibold">Cargo</th>
                                <th className="py-2 px-2 font-semibold">Acessos</th>
                                <th className="py-2 px-2 font-semibold">Status</th>
                                <th className="py-2 px-2 text-right font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loadingUsers ? (
                                <tr><td colSpan={5} className="py-4 text-center text-gray-400 text-xs">Carregando...</td></tr>
                            ) : users.map(user => (
                                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 group">
                                    <td className="py-3 px-2">
                                        <p className="font-medium text-gray-900 text-xs">{user.nome}</p>
                                        <p className="text-[10px] text-gray-500">{user.email}</p>
                                    </td>
                                    <td className="py-3 px-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.cargo === 'Administrador' ? 'bg-purple-100 text-purple-700' : user.cargo === 'Sócio' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{user.cargo}</span>
                                    </td>
                                    <td className="py-3 px-2">
                                        <div className="flex gap-1">
                                            {user.modulos_acesso?.crm && <span className="w-2 h-2 rounded-full bg-blue-500" title="CRM"></span>}
                                            {user.modulos_acesso?.juridico && <span className="w-2 h-2 rounded-full bg-[#112240]" title="Jurídico"></span>}
                                            {user.modulos_acesso?.rh && <span className="w-2 h-2 rounded-full bg-green-500" title="RH"></span>}
                                            {user.modulos_acesso?.sistema && <span className="w-2 h-2 rounded-full bg-red-500" title="Sistema"></span>}
                                        </div>
                                    </td>
                                    <td className="py-3 px-2">
                                        {user.ativo ? <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium"><Check className="h-3 w-3" /> Ativo</span> : <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium"><Ban className="h-3 w-3" /> Bloqueado</span>}
                                    </td>
                                    <td className="py-3 px-2 text-right">
                                        <div className={`inline-flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${!isAdmin ? 'hidden' : ''}`}>
                                            <button onClick={(e) => { e.stopPropagation(); handleToggleActive(user); }} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title={user.ativo ? "Bloquear" : "Ativar"}><Shield className="h-3.5 w-3.5" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); openUserModal(user); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Editar Permissões"><Pencil className="h-3.5 w-3.5" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(user); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
      )}

      {/* --- OUTROS MÓDULOS (CONTEÚDO) --- */}
      {activeModule === 'juridico' && (
          <div className="animate-in fade-in">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gray-100 rounded-lg"><Lock className="h-5 w-5 text-gray-700" /></div>
                    <div><h3 className="font-bold text-gray-900 text-base">Segurança: Módulo Magistrados</h3><p className="text-xs text-gray-500">Controle de acesso à área restrita</p></div>
                </div>
                <div className="space-y-4">
                    <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">PIN de Acesso (4 dígitos)</label><input type="text" maxLength={4} value={magistradosConfig.pin} readOnly={!isAdmin} onChange={e => setMagistradosConfig({...magistradosConfig, pin: e.target.value.replace(/\D/g,'')})} className={`w-full border border-gray-300 rounded-lg p-3 font-mono text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${!isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="0000" /></div>
                    <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Emails Permitidos (separar por vírgula)</label><textarea rows={4} value={magistradosConfig.emails} readOnly={!isAdmin} onChange={e => setMagistradosConfig({...magistradosConfig, emails: e.target.value})} className={`w-full border border-gray-300 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900 ${!isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="email1@salomao.adv.br, email2@salomao.adv.br" /></div>
                </div>
                <div className="mt-6 flex justify-end"><button onClick={handleSaveConfigMagistrados} disabled={loadingConfig || !isAdmin} className={`px-4 py-2.5 font-bold rounded-lg flex items-center gap-2 ${isAdmin ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}><Save className="h-4 w-4" /> Salvar</button></div>
            </div>
          </div>
      )}

      {activeModule === 'crm' && (
          <div className="space-y-6 animate-in fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className="p-2 bg-gray-100 rounded-lg"><Tag className="h-5 w-5 text-gray-700" /></div><h3 className="font-bold text-gray-900 text-sm">Tipos de Brinde</h3></div>{isAdmin && (<button onClick={() => setIsAddingBrinde(!isAddingBrinde)} className={`p-1.5 rounded-lg transition-colors ${isAddingBrinde ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>{isAddingBrinde ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</button>)}</div>
                    {isAddingBrinde && (<div className="flex gap-2 mb-4 animate-in fade-in"><input value={newBrinde} onChange={(e) => setNewBrinde(e.target.value)} placeholder="Novo tipo..." className="flex-1 text-xs border border-blue-200 rounded-lg px-3 py-2 outline-none" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAddBrinde()} /><button onClick={handleAddBrinde} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold">OK</button></div>)}
                    <div className="flex-1 overflow-y-auto max-h-48 custom-scrollbar space-y-1">{brindes.map(item => (<div key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group"><span className="text-xs text-gray-700 font-medium">{item.nome}</span>{isAdmin && (<button onClick={() => handleDeleteBrinde(item.id, item.nome)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"><Trash2 className="h-3.5 w-3.5" /></button>)}</div>))}{brindes.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Nenhum registro</p>}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className="p-2 bg-gray-100 rounded-lg"><Briefcase className="h-5 w-5 text-gray-700" /></div><h3 className="font-bold text-gray-900 text-sm">Sócios Cadastrados</h3></div>{isAdmin && (<button onClick={() => setIsAddingSocio(!isAddingSocio)} className={`p-1.5 rounded-lg transition-colors ${isAddingSocio ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>{isAddingSocio ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</button>)}</div>
                    {isAddingSocio && (<div className="flex gap-2 mb-4 animate-in fade-in"><input value={newSocio} onChange={(e) => setNewSocio(e.target.value)} placeholder="Nome do sócio..." className="flex-1 text-xs border border-blue-200 rounded-lg px-3 py-2 outline-none" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAddSocio()} /><button onClick={handleAddSocio} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold">OK</button></div>)}
                    <div className="flex-1 overflow-y-auto max-h-48 custom-scrollbar space-y-1">{socios.map(item => (<div key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group"><span className="text-xs text-gray-700 font-medium">{item.nome}</span>{isAdmin && (<button onClick={() => handleDeleteSocio(item.id, item.nome)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"><Trash2 className="h-3.5 w-3.5" /></button>)}</div>))}{socios.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Nenhum registro</p>}</div>
                </div>
             </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-gray-100 rounded-lg"><FileSpreadsheet className="h-5 w-5 text-gray-700" /></div><div><h3 className="font-bold text-gray-900 text-base">Importar Dados</h3><p className="text-xs text-gray-500">Adicione clientes em massa via Excel</p></div></div>
                <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><button onClick={handleDownloadTemplate} className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-green-300 bg-green-50 rounded-lg text-green-700 hover:border-green-400 hover:bg-green-100 font-medium"><Download className="h-6 w-6" /><div className="text-center"><p className="font-bold text-xs">Baixar Modelo</p><p className="text-[10px] text-green-600">Template Excel</p></div></button><div className="relative"><input ref={fileInputRef} type="file" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={loading || !isAdmin} className={`absolute inset-0 w-full h-full z-10 ${!isAdmin ? 'cursor-not-allowed' : 'cursor-pointer'}`} /><div className={`flex flex-col items-center justify-center gap-2 p-4 h-full rounded-lg ${loading || !isAdmin ? 'bg-gray-300 text-gray-500 opacity-70' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>{loading ? (<><RefreshCw className="h-6 w-6 animate-spin" /><p className="font-bold text-xs">Importando...</p></>) : (<><Upload className="h-6 w-6" /><div className="text-center"><p className="font-bold text-xs">Selecionar Arquivo</p><p className="text-[10px] opacity-70">Excel (.xlsx, .xls)</p>{!isAdmin && <p className="text-[9px] mt-1 text-red-300">(Apenas Admin)</p>}</div></>)}</div></div></div></div>
            </div>
          </div>
      )}

      {activeModule === 'rh' && (
          <div className="animate-in fade-in">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-green-50 rounded-lg"><Users className="h-5 w-5 text-green-700" /></div><div><h3 className="font-bold text-gray-900 text-base">Manutenção do RH</h3><p className="text-xs text-gray-500">Gestão avançada de dados de pessoal</p></div></div>
                  <div className="border border-red-200 rounded-xl overflow-hidden"><div className="bg-red-50 p-4 border-b border-red-200 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-600" /><h4 className="font-bold text-red-800 text-sm">Zona de Perigo - Presença</h4></div><div className="p-6"><p className="text-sm text-gray-600 mb-4">Esta ação irá apagar <strong>todos</strong> os registros de entrada e saída do banco de dados (tabela <code>presenca_portaria</code>). As regras de sócios e colaboradores cadastrados serão mantidas.</p><button onClick={handleResetPresence} disabled={!isAdmin} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white transition-colors ${isAdmin ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300 cursor-not-allowed'}`}><Trash2 className="h-4 w-4" /> Resetar Base de Presença</button></div></div>
              </div>
          </div>
      )}

      {activeModule === 'sistema' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-gray-100 rounded-lg"><History className="h-5 w-5 text-gray-700" /></div><h3 className="font-bold text-gray-900 text-base">Histórico de Versões</h3></div>
                  <div className="space-y-4">{CHANGELOG.slice(0, showAllVersions ? CHANGELOG.length : 3).map((log) => (<div key={log.version} className="border-l-2 border-gray-300 pl-4"><div className="flex items-center gap-2 mb-2"><span className={`px-2 py-0.5 text-xs font-bold rounded ${log.type === 'major' ? 'bg-red-100 text-red-700' : log.type === 'minor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>v{log.version}</span><span className="text-xs text-gray-500">{log.date}</span></div><h4 className="font-bold text-gray-900 text-sm mb-2">{log.title}</h4><ul className="space-y-1">{log.changes.map((change, idx) => (<li key={idx} className="text-xs text-gray-600 flex items-start gap-2"><span className="text-gray-400 mt-1">•</span><span>{change}</span></li>))}</ul></div>))}{CHANGELOG.length > 3 && (<button onClick={() => setShowAllVersions(!showAllVersions)} className="w-full mt-4 py-2.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50">{showAllVersions ? 'Mostrar Menos' : `Ver Todas (${CHANGELOG.length})`}</button>)}</div>
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-6"><div className="flex items-center gap-3 mb-6"><div className="p-2 bg-red-50 rounded-lg"><AlertTriangle className="h-5 w-5 text-red-600" /></div><div><h3 className="font-bold text-gray-900 text-base">Reset Geral do Sistema</h3><p className="text-xs text-gray-500">Ações irreversíveis</p></div></div><div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"><p className="text-xs font-bold text-red-900 mb-2">⚠️ Atenção</p><ul className="text-xs text-red-700 space-y-1"><li>• Apagará TODOS os dados do sistema</li><li>• Clientes, magistrados e tarefas serão removidos</li></ul></div><button onClick={handleSystemReset} disabled={!isAdmin} className={`w-full flex items-center justify-center gap-3 py-4 font-bold rounded-lg ${isAdmin ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}><Trash2 className="h-5 w-5" /><div className="text-left"><p>Resetar Sistema Completo</p><p className="text-xs font-normal text-red-100">{isAdmin ? 'Apagar todos os dados' : 'Apenas Administradores'}</p></div></button></div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><div className="flex items-center gap-3 mb-6"><Code className="h-5 w-5 text-gray-700" /><h3 className="font-bold text-gray-900 text-base">Créditos</h3></div><div className="p-4 bg-gray-50 rounded-lg border border-gray-200"><div className="flex items-center gap-2 mb-2"><Building className="h-4 w-4 text-gray-600" /><p className="font-bold text-gray-900 text-xs">Empresa</p></div><p className="font-bold text-gray-900">Flow Metrics</p><p className="text-xs text-gray-600 mt-1">Análise de Dados e Desenvolvimento</p></div><div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"><div className="flex items-center gap-2"><Shield className="h-4 w-4 text-gray-600" /><span className="text-xs font-medium text-gray-600">Versão</span></div><span className="px-3 py-1 bg-gray-900 text-white rounded-full text-xs font-bold">v1.8.0</span></div></div>
              </div>
          </div>
      )}
    </div>
  )
}
