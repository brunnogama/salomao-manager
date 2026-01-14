import { useState, useRef, useEffect } from 'react'
import { 
  Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, 
  Users, Pencil, Trash2, Save, RefreshCw, 
  AlertTriangle, History, Copyright, Code,
  Shield, UserPlus, Ban, Check, Lock, Building
} from 'lucide-react'
import { utils, read, writeFile } from 'xlsx'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/logger'

interface AppUser {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  ativo: boolean;
}

const CHANGELOG = [
  {
    version: '1.5.0',
    date: '08/01/2026',
    type: 'minor',
    title: 'Modal LGPD e Simplificação de Interface',
    changes: [
      'Adicionado modal de boas-vindas com informações sobre LGPD',
      'Simplificação dos cards de clientes',
      'Modo visualização/edição no modal',
      'Removida gestão de sócios'
    ]
  },
  {
    version: '1.4.2',
    date: '07/01/2026',
    type: 'patch',
    title: 'Correções e Melhorias de UX',
    changes: [
      'Botão "Limpar Filtros" com destaque visual',
      'Padronização de fontes',
      'Cards do dashboard melhorados'
    ]
  },
  {
    version: '1.4.1',
    date: '07/01/2026',
    type: 'patch',
    title: 'Correções de Build',
    changes: [
      'Fix de build no Cloudflare',
      'Atualização de dependências'
    ]
  },
  {
    version: '1.4.0',
    date: '07/01/2026',
    type: 'minor',
    title: 'Sistema de Tipos de Brinde',
    changes: [
      'CRUD completo para tipos de brinde',
      'BrindeSelector avançado'
    ]
  },
  {
    version: '1.3.0',
    date: '07/01/2026',
    type: 'minor',
    title: 'Melhorias Visuais',
    changes: [
      'Redesign dos cards',
      'Avatares com gradientes'
    ]
  },
  {
    version: '1.2.0',
    date: '18/12/2025',
    type: 'minor',
    title: 'Restauração de Funcionalidades',
    changes: [
      'Templates WhatsApp/Email',
      'Dashboard otimizado'
    ]
  },
  {
    version: '1.1.0',
    date: '07/12/2025',
    type: 'minor',
    title: 'Módulo Magistrados',
    changes: [
      'Sistema de PIN',
      'Controle de acesso'
    ]
  },
  {
    version: '1.0.0',
    date: '29/11/2025',
    type: 'major',
    title: 'Lançamento Inicial',
    changes: [
      'Sistema CRM completo',
      'Dashboard com métricas'
    ]
  }
]

export function Settings() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' })
  
  const [users, setUsers] = useState<AppUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [userForm, setUserForm] = useState({ nome: '', email: '', cargo: 'Colaborador' })

  const [magistradosConfig, setMagistradosConfig] = useState({ pin: '', emails: '' })
  const [loadingConfig, setLoadingConfig] = useState(false)

  const [showAllVersions, setShowAllVersions] = useState(false)
  
  // --- CONTROLE DE PERMISSÃO ---
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  // Define se o usuário é admin
  const isAdmin = currentUserRole === 'Administrador'

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchCurrentUserRole(); // Busca a permissão ao carregar
    fetchUsers();
    fetchMagistradosConfig();
  }, [])

  // Função para checar o cargo do usuário logado
  const fetchCurrentUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const { data } = await supabase
          .from('usuarios_permitidos')
          .select('cargo')
          .eq('email', user.email)
          .single()
          
        if (data) {
          setCurrentUserRole(data.cargo)
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
    const { data } = await supabase.from('usuarios_permitidos').select('*')
    if (data) {
        setUsers(data.map((u: any) => ({
            id: u.id,
            nome: u.nome || u.email.split('@')[0],
            email: u.email,
            cargo: u.cargo || 'Colaborador',
            ativo: u.ativo !== false 
        })))
    }
    setLoadingUsers(false)
  }

  const openUserModal = (user?: AppUser) => {
    // Bloqueia abertura do modal se não for admin
    if (!isAdmin) return alert("Apenas administradores podem gerenciar usuários.");

    if (user) {
        setEditingUser(user)
        setUserForm({ nome: user.nome, email: user.email, cargo: user.cargo })
    } else {
        setEditingUser(null)
        setUserForm({ nome: '', email: '', cargo: 'Colaborador' })
    }
    setIsUserModalOpen(true)
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
    if (!isAdmin) return; // Segurança extra

    if (!userForm.email) return alert("E-mail obrigatório")
    try {
        if (editingUser) {
             await supabase.from('usuarios_permitidos').update(userForm).eq('id', editingUser.id)
        } else {
             await supabase.from('usuarios_permitidos').insert({ ...userForm, ativo: true })
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

    if (!confirm('PERIGO: Isso apagará TODOS os dados. Tem certeza?')) return;
    
    const confirmText = prompt('Digite APAGAR para confirmar:')
    if (confirmText !== 'APAGAR') return;

    setLoading(true)
    setStatus({ type: null, message: 'Limpando base de dados...' })

    try {
        const { error: errTasks } = await supabase.from('tasks').delete().neq('id', 0);
        if (errTasks) console.warn("Aviso tarefas:", errTasks);

        const { error: err1 } = await supabase.from('magistrados').delete().neq('id', 0)
        if (err1) throw err1

        const { error: err2 } = await supabase.from('clientes').delete().neq('id', 0)
        if (err2) throw err2

        setStatus({ type: 'success', message: 'Sistema resetado!' })
        await logAction('RESET', 'SISTEMA', 'Resetou toda a base')
        
    } catch (error: any) {
        console.error("Erro:", error)
        setStatus({ type: 'error', message: 'Erro: ' + error.message })
    } finally {
        setLoading(false)
    }
  }

  const handleDownloadTemplate = () => {
    const ws = utils.json_to_sheet([
      { nome: 'Cliente Exemplo', empresa: 'Empresa SA', cargo: 'Diretor', email: 'email@teste.com', telefone: '11999999999', socio: 'Dr. João', tipo_brinde: 'Brinde VIP', quantidade: 1, cep: '01001000', endereco: 'Praça da Sé', numero: '1', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP' }
    ])
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, "Template")
    writeFile(wb, "template_importacao_salomao.xlsx")
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Bloqueia upload se não for admin
    if (!isAdmin) {
        alert("Apenas administradores podem importar dados.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setStatus({ type: null, message: 'Processando arquivo...' })

    try {
      const data = await file.arrayBuffer()
      const workbook = read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = utils.sheet_to_json(worksheet)

      if (jsonData.length === 0) throw new Error('Arquivo vazio')

      const clientsToInsert = jsonData.map((row: any) => ({
        nome: row.nome || row.Nome,
        empresa: row.empresa || row.Empresa || '',
        cargo: row.cargo || row.Cargo || '',
        email: row.email || row.Email || '',
        telefone: row.telefone || row.Telefone || '',
        socio: row.socio || row.Socio || '',
        tipo_brinde: row.tipo_brinde || row['Tipo Brinde'] || 'Brinde Médio',
        quantidade: row.quantidade || row.Quantidade || 1,
        cep: row.cep || row.CEP || '',
        endereco: row.endereco || row.Endereco || '',
        numero: row.numero || row.Numero || '',
        bairro: row.bairro || row.Bairro || '',
        cidade: row.cidade || row.Cidade || '',
        estado: row.estado || row.Estado || ''
      }))
      
      const { error } = await supabase.from('clientes').insert(clientsToInsert)
      
      if (error) throw error
      
      setStatus({ type: 'success', message: `${clientsToInsert.length} clientes importados!` })
      await logAction('IMPORTAR', 'SISTEMA', `Importou ${clientsToInsert.length} clientes`)

    } catch (error: any) {
      console.error('Erro:', error)
      setStatus({ type: 'error', message: 'Erro: ' + error.message })
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">

      {/* Aviso se não for admin */}
      {!isAdmin && currentUserRole && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                  <div className="flex-shrink-0">
                      <Lock className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                          Modo de Visualização: Você está logado como <strong>{currentUserRole}</strong>. Apenas Administradores podem realizar alterações nesta página.
                      </p>
                  </div>
              </div>
          </div>
      )}
      
      {/* MODAL USUÁRIO */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
             <h3 className="text-lg font-bold text-gray-900 mb-4">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
             <div className="space-y-3">
                 <div>
                     <label className="text-xs font-bold text-gray-600 uppercase">Nome</label>
                     <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 mt-1" value={userForm.nome} onChange={e => setUserForm({...userForm, nome: e.target.value})} />
                 </div>
                 <div>
                     <label className="text-xs font-bold text-gray-600 uppercase">E-mail</label>
                     <input type="email" className="w-full border border-gray-300 rounded-lg p-2.5 mt-1" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
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
             <div className="flex justify-end gap-3 mt-6">
                 <button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                 <button onClick={handleSaveUser} className="px-4 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800">Salvar</button>
             </div>
          </div>
        </div>
      )}

      {/* LINHA 1: GESTÃO USUÁRIOS + SEGURANÇA MAGISTRADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GESTÃO DE USUÁRIOS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg"><Users className="h-5 w-5 text-gray-700" /></div>
                  <div>
                      <h3 className="font-bold text-gray-900 text-base">Gestão de Usuários</h3>
                      <p className="text-xs text-gray-500">Controle de acesso ao sistema</p>
                  </div>
              </div>
              <button 
                onClick={() => openUserModal()} 
                disabled={!isAdmin}
                className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg font-bold transition-colors ${isAdmin ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'}`}
              >
                  <UserPlus className="h-4 w-4" /> Novo
              </button>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
                          <th className="py-2 px-2 font-semibold">Nome</th>
                          <th className="py-2 px-2 font-semibold">Email</th>
                          <th className="py-2 px-2 font-semibold">Status</th>
                          <th className="py-2 px-2 text-right font-semibold">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="text-sm">
                      {loadingUsers ? (
                          <tr><td colSpan={4} className="py-4 text-center text-gray-400 text-xs">Carregando...</td></tr>
                      ) : users.map(user => (
                          <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="py-2.5 px-2 font-medium text-gray-900 text-xs">{user.nome}</td>
                              <td className="py-2.5 px-2 text-gray-600 text-xs">{user.email}</td>
                              <td className="py-2.5 px-2">
                                  {user.ativo ? 
                                    <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium"><Check className="h-3 w-3" /> Ativo</span> : 
                                    <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium"><Ban className="h-3 w-3" /> Bloqueado</span>
                                  }
                              </td>
                              <td className="py-2.5 px-2 text-right">
                                  <div className={`inline-flex gap-1 ${!isAdmin ? 'opacity-50 pointer-events-none' : ''}`}>
                                      <button onClick={(e) => { e.stopPropagation(); handleToggleActive(user); }} disabled={!isAdmin} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title={user.ativo ? "Bloquear" : "Ativar"}>
                                          <Shield className="h-3.5 w-3.5" />
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); openUserModal(user); }} disabled={!isAdmin} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Editar">
                                          <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(user); }} disabled={!isAdmin} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Excluir">
                                          <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
        </div>

        {/* SEGURANÇA MAGISTRADOS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-100 rounded-lg"><Lock className="h-5 w-5 text-gray-700" /></div>
              <div>
                  <h3 className="font-bold text-gray-900 text-base">Segurança: Módulo Magistrados</h3>
                  <p className="text-xs text-gray-500">Controle de acesso à área restrita</p>
              </div>
          </div>

          <div className="space-y-4">
              <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">PIN de Acesso (4 dígitos)</label>
                  <input 
                      type="text" 
                      maxLength={4}
                      value={magistradosConfig.pin}
                      readOnly={!isAdmin}
                      onChange={e => setMagistradosConfig({...magistradosConfig, pin: e.target.value.replace(/\D/g,'')})}
                      className={`w-full border border-gray-300 rounded-lg p-3 font-mono text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-gray-900 ${!isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder="0000"
                  />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Emails Permitidos (separar por vírgula)</label>
                  <textarea 
                      rows={4}
                      value={magistradosConfig.emails}
                      readOnly={!isAdmin}
                      onChange={e => setMagistradosConfig({...magistradosConfig, emails: e.target.value})}
                      className={`w-full border border-gray-300 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900 ${!isAdmin ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder="email1@salomao.adv.br, email2@salomao.adv.br"
                  />
              </div>
          </div>
          <div className="mt-6 flex justify-end">
              <button 
                  onClick={handleSaveConfigMagistrados}
                  disabled={loadingConfig || !isAdmin}
                  className={`px-4 py-2.5 font-bold rounded-lg flex items-center gap-2 ${isAdmin ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                  <Save className="h-4 w-4" /> Salvar
              </button>
          </div>
        </div>
      </div>

      {/* LINHA 2: IMPORTAR DADOS + ZONA PERIGO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* IMPORTAR DADOS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gray-100 rounded-lg"><FileSpreadsheet className="h-5 w-5 text-gray-700" /></div>
                <div>
                    <h3 className="font-bold text-gray-900 text-base">Importar Dados</h3>
                    <p className="text-xs text-gray-500">Adicione clientes em massa via Excel</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Botões lado a lado */}
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={handleDownloadTemplate}
                        className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-green-300 bg-green-50 rounded-lg text-green-700 hover:border-green-400 hover:bg-green-100 font-medium"
                    >
                        <Download className="h-6 w-6" />
                        <div className="text-center">
                            <p className="font-bold text-xs">Baixar Modelo</p>
                            <p className="text-[10px] text-green-600">Template Excel</p>
                        </div>
                    </button>

                    <div className="relative">
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload}
                            disabled={loading || !isAdmin}
                            className={`absolute inset-0 w-full h-full z-10 ${!isAdmin ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        />
                        <div className={`flex flex-col items-center justify-center gap-2 p-4 h-full rounded-lg ${loading || !isAdmin ? 'bg-gray-300 text-gray-500 opacity-70' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                            {loading ? (
                                <>
                                    <RefreshCw className="h-6 w-6 animate-spin" />
                                    <p className="font-bold text-xs">Importando...</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="h-6 w-6" />
                                    <div className="text-center">
                                        <p className="font-bold text-xs">Selecionar Arquivo</p>
                                        <p className="text-[10px] opacity-70">Excel (.xlsx, .xls)</p>
                                        {!isAdmin && <p className="text-[9px] mt-1 text-red-300">(Apenas Admin)</p>}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {status.type && (
                    <div className={`p-4 rounded-lg flex items-start gap-3 ${
                        status.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                        <div className="flex-shrink-0">
                            {status.type === 'success' ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-red-600" />
                            )}
                        </div>
                        <p className={`text-sm font-medium ${status.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                            {status.message}
                        </p>
                    </div>
                )}
            </div>
        </div>

        {/* ZONA DE PERIGO */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-50 rounded-lg"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
                <div>
                    <h3 className="font-bold text-gray-900 text-base">Zona de Perigo</h3>
                    <p className="text-xs text-gray-500">Ações irreversíveis</p>
                </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-xs font-bold text-red-900 mb-2">⚠️ Atenção</p>
                <ul className="text-xs text-red-700 space-y-1">
                    <li>• Apagará TODOS os dados do sistema</li>
                    <li>• Clientes, magistrados e tarefas serão removidos</li>
                    <li>• Não é possível recuperar após confirmação</li>
                </ul>
            </div>

            <button 
              onClick={handleSystemReset}
              disabled={!isAdmin}
              className={`w-full flex items-center justify-center gap-3 py-4 font-bold rounded-lg ${isAdmin ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              <Trash2 className="h-5 w-5" />
              <div className="text-left">
                  <p>Resetar Sistema</p>
                  <p className={`text-xs font-normal ${isAdmin ? 'text-red-100' : 'text-gray-400'}`}>
                    {isAdmin ? 'Apagar todos os dados' : 'Apenas Administradores'}
                  </p>
              </div>
            </button>

            {isAdmin && (
                <p className="text-center text-xs text-gray-500 mt-3">
                    Você precisará digitar "APAGAR" para confirmar
                </p>
            )}
        </div>
      </div>

      

      {/* LINHA 3: CRÉDITOS + CHANGELOG */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CRÉDITOS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <Code className="h-5 w-5 text-gray-700" />
                <h3 className="font-bold text-gray-900 text-base">Créditos e Informações</h3>
            </div>

            <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-black">M</div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">Marcio Gama</p>
                            <p className="text-xs text-gray-600">Desenvolvedor Full Stack</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Building className="h-4 w-4 text-gray-600" />
                        <p className="font-bold text-gray-900 text-xs">Empresa</p>
                    </div>
                    <p className="font-bold text-gray-900">Flow Metrics</p>
                    <p className="text-xs text-gray-600 mt-1">Análise de Dados e Desenvolvimento</p>
                </div>

                {/* Tecnologias */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                        <Code className="h-4 w-4 text-gray-600" />
                        <p className="font-bold text-gray-900 text-xs">Stack Tecnológica</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Frontend</p>
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                                    <span className="text-xs text-gray-700">React 18</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                                    <span className="text-xs text-gray-700">TypeScript</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                                    <span className="text-xs text-gray-700">Tailwind CSS</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                                    <span className="text-xs text-gray-700">Vite</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Backend</p>
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-green-500"></div>
                                    <span className="text-xs text-gray-700">Supabase</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-green-500"></div>
                                    <span className="text-xs text-gray-700">PostgreSQL</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-green-500"></div>
                                    <span className="text-xs text-gray-700">Cloudflare</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2">
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Bibliotecas</p>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-purple-500"></div>
                                    <span className="text-xs text-gray-700">Headless UI</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-purple-500"></div>
                                    <span className="text-xs text-gray-700">Lucide Icons</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-purple-500"></div>
                                    <span className="text-xs text-gray-700">Recharts</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-purple-500"></div>
                                    <span className="text-xs text-gray-700">SheetJS</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-purple-500"></div>
                                    <span className="text-xs text-gray-700">IMask</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full bg-purple-500"></div>
                                    <span className="text-xs text-gray-700">DnD Kit</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-900 rounded-lg text-white">
                    <div className="flex items-center gap-2">
                        <Copyright className="h-4 w-4" />
                        <div>
                            <p className="text-sm font-bold">© 2025-2026 Flow Metrics</p>
                            <p className="text-xs text-gray-400 mt-1">Sistema para Salomão Advogados</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-600" />
                        <span className="text-xs font-medium text-gray-600">Versão</span>
                    </div>
                    <span className="px-3 py-1 bg-gray-900 text-white rounded-full text-xs font-bold">v1.5.0</span>
                </div>
            </div>
        </div>

        {/* HISTÓRICO DE VERSÕES */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <History className="h-5 w-5 text-gray-700" />
                <h3 className="font-bold text-gray-900 text-base">Histórico de Versões</h3>
            </div>

            <div className="space-y-4">
                {CHANGELOG.slice(0, showAllVersions ? CHANGELOG.length : 3).map((log) => (
                    <div key={log.version} className="border-l-2 border-gray-300 pl-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                                log.type === 'major' ? 'bg-red-100 text-red-700' :
                                log.type === 'minor' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                            }`}>
                                v{log.version}
                            </span>
                            <span className="text-xs text-gray-500">{log.date}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm mb-2">{log.title}</h4>
                        <ul className="space-y-1">
                            {log.changes.map((change, idx) => (
                                <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                                    <span className="text-gray-400 mt-1">•</span>
                                    <span>{change}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {CHANGELOG.length > 3 && (
                <button
                    onClick={() => setShowAllVersions(!showAllVersions)}
                    className="w-full mt-4 py-2.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                    {showAllVersions ? 'Mostrar Menos' : `Ver Todas (${CHANGELOG.length})`}
                </button>
            )}
        </div>
      </div>

    </div>
  )
}