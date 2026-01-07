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

// === CHANGELOG COM VERSIONAMENTO SEMÂNTICO ===
// Versão Atual: 1.5.0
// Formato: MAJOR.MINOR.PATCH
// - MAJOR (X): Mudanças radicais na arquitetura ou breaking changes
// - MINOR (X.X): Novas funcionalidades
// - PATCH (X.X.X): Correções de bugs

const CHANGELOG = [
  {
    version: '1.5.0',
    date: '08/01/2026',
    type: 'minor',
    title: 'Modal LGPD e Simplificação de Interface',
    changes: [
      'Adicionado modal de boas-vindas com informações sobre LGPD e confidencialidade',
      'Simplificação dos cards de clientes (removida empresa duplicada e barra lateral)',
      'Modo visualização/edição no modal de clientes',
      'Histórico do modal com design elegante (cards coloridos)',
      'Removida gestão de sócios de configurações'
    ]
  },
  {
    version: '1.4.2',
    date: '07/01/2026',
    type: 'patch',
    title: 'Correções e Melhorias de UX',
    changes: [
      'Botão "Limpar Filtros" com destaque visual (pulsante)',
      'Padronização de fontes entre BrindeSelector e SocioSelector',
      'Tick de seleção movido para o lado correto',
      'Cards do dashboard maiores e melhor distribuídos'
    ]
  },
  {
    version: '1.4.1',
    date: '07/01/2026',
    type: 'patch',
    title: 'Correções de Build e Dependências',
    changes: [
      'Correção de erro de dependências (@hello-pangea/dnd)',
      'Fix de build no Cloudflare Pages',
      'Atualização do package.json'
    ]
  },
  {
    version: '1.4.0',
    date: '07/01/2026',
    type: 'minor',
    title: 'Sistema de Tipos de Brinde Dinâmico',
    changes: [
      'CRUD completo para tipos de brinde (criar, editar, excluir)',
      'BrindeSelector com menu dropdown avançado',
      'Cascade update ao editar tipos',
      'Soft delete para preservar histórico'
    ]
  },
  {
    version: '1.3.0',
    date: '07/01/2026',
    type: 'minor',
    title: 'Melhorias Visuais nos Cards',
    changes: [
      'Redesign premium dos cards de clientes',
      'Avatares com gradientes coloridos',
      'Sidebar colorida por tipo de brinde',
      'Animações hover melhoradas',
      'Cards mais compactos e eficientes'
    ]
  },
  {
    version: '1.2.0',
    date: '18/12/2025',
    type: 'minor',
    title: 'Restauração de Funcionalidades',
    changes: [
      'Restauração de templates WhatsApp e Email completos',
      'SocioSelector reintegrado ao NewClientModal',
      'Dashboard com layout de linha única',
      'Filtro de tipos de brinde antigos'
    ]
  },
  {
    version: '1.1.0',
    date: '07/12/2025',
    type: 'minor',
    title: 'Módulo Magistrados e Segurança',
    changes: [
      'Novo módulo restrito para Magistrados',
      'Sistema de PIN e controle de acesso',
      'Auditoria visual aprimorada',
      'Tela de PIN com design moderno'
    ]
  },
  {
    version: '1.0.0',
    date: '29/11/2025',
    type: 'major',
    title: 'Lançamento Inicial',
    changes: [
      'Sistema CRM completo',
      'Gestão de clientes e brindes',
      'Dashboard com métricas',
      'Sistema de autenticação',
      'Kanban de tarefas'
    ]
  }
]

export function Settings() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' })
  
  // --- GESTÃO DE USUÁRIOS ---
  const [users, setUsers] = useState<AppUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [userForm, setUserForm] = useState({ nome: '', email: '', cargo: 'Colaborador' })

  // --- GESTÃO MAGISTRADOS ---
  const [magistradosConfig, setMagistradosConfig] = useState({ pin: '', emails: '' })
  const [loadingConfig, setLoadingConfig] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchUsers();
    fetchMagistradosConfig();
  }, [])

  // --- FETCH FUNCTIONS ---

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

  // --- ACTIONS ---

  const openUserModal = (user?: AppUser) => {
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
    alert('Configurações de segurança salvas!')
    setLoadingConfig(false)
  }

  const handleSaveUser = async () => {
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
    await supabase.from('usuarios_permitidos').update({ ativo: !user.ativo }).eq('id', user.id)
    fetchUsers()
  }

  const handleDeleteUser = async (user: AppUser) => {
    if (confirm(`Excluir usuário ${user.email}?`)) {
        await supabase.from('usuarios_permitidos').delete().eq('id', user.id)
        fetchUsers()
    }
  }

  // --- ACTIONS: SYSTEM RESET (CORRIGIDO) ---

  const handleSystemReset = async () => {
    if (!confirm('PERIGO: Isso apagará TODOS os dados (Clientes e Magistrados). Tem certeza absoluta?')) return;
    
    const confirmText = prompt('Digite APAGAR para confirmar a exclusão total:')
    if (confirmText !== 'APAGAR') return;

    setLoading(true)
    setStatus({ type: null, message: 'Limpando base de dados...' })

    try {
        // 1. Tenta apagar TUDO da tabela de tarefas (sem .catch para evitar erro de TS, usando try/catch do bloco)
        // Isso remove as dependências que travam a exclusão
        const { error: errTasks } = await supabase.from('tasks').delete().neq('id', 0);
        if (errTasks) console.warn("Aviso tarefas:", errTasks);

        // 2. Apaga Magistrados
        const { error: err1 } = await supabase.from('magistrados').delete().neq('id', 0)
        if (err1) throw err1

        // 3. Apaga Clientes
        const { error: err2 } = await supabase.from('clientes').delete().neq('id', 0)
        if (err2) throw err2

        setStatus({ type: 'success', message: 'Sistema resetado com sucesso!' })
        await logAction('RESET', 'SISTEMA', 'Resetou toda a base de dados')
        
        fetchSocios()
        
    } catch (error: any) {
        console.error("Erro no reset:", error)
        setStatus({ type: 'error', message: 'Erro: ' + error.message })
        alert("Erro ao resetar: " + error.message);
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
      
      setStatus({ type: 'success', message: `${clientsToInsert.length} clientes importados com sucesso!` })
      await logAction('IMPORTAR', 'SISTEMA', `Importou ${clientsToInsert.length} clientes via Excel`)
      
      fetchSocios()

    } catch (error: any) {
      console.error('Erro na importação:', error)
      setStatus({ type: 'error', message: 'Erro ao importar: ' + error.message })
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8 relative">
      
      {/* --- MODAL USUÁRIO --- */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
             <h3 className="text-lg font-bold text-[#112240] mb-4">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
             <div className="space-y-3">
                 <div>
                     <label className="text-xs font-bold text-gray-500">Nome</label>
                     <input type="text" className="w-full border rounded p-2" value={userForm.nome} onChange={e => setUserForm({...userForm, nome: e.target.value})} />
                 </div>
                 <div>
                     <label className="text-xs font-bold text-gray-500">E-mail</label>
                     <input type="email" className="w-full border rounded p-2" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                 </div>
                 <div>
                     <label className="text-xs font-bold text-gray-500">Cargo</label>
                     <select className="w-full border rounded p-2" value={userForm.cargo} onChange={e => setUserForm({...userForm, cargo: e.target.value})}>
                         <option>Administrador</option>
                         <option>Sócio</option>
                         <option>Colaborador</option>
                     </select>
                 </div>
             </div>
             <div className="flex justify-end gap-3 mt-6">
                 <button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancelar</button>
                 <button onClick={handleSaveUser} className="px-4 py-2 bg-[#112240] text-white rounded font-bold hover:bg-blue-900">Salvar</button>
             </div>
          </div>
        </div>
      )}

      {/* --- CONFIGURAÇÃO: MAGISTRADOS --- */}
      <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-50 rounded-lg text-orange-700"><Lock className="h-6 w-6" /></div>
            <div>
                <h3 className="font-bold text-[#112240] text-lg">Segurança: Módulo Magistrados</h3>
                <p className="text-sm text-gray-500">Controle de acesso à área restrita.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">PIN de Acesso (4 dígitos)</label>
                <input 
                    type="text" 
                    maxLength={4}
                    value={magistradosConfig.pin}
                    onChange={e => setMagistradosConfig({...magistradosConfig, pin: e.target.value.replace(/\D/g,'')})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-orange-500 font-mono text-center tracking-widest text-lg"
                    placeholder="0000"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Emails Permitidos (separar por vírgula)</label>
                <textarea 
                    rows={3}
                    value={magistradosConfig.emails}
                    onChange={e => setMagistradosConfig({...magistradosConfig, emails: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-orange-500 text-xs"
                    placeholder="email1@salomao.adv.br, email2@salomao.adv.br"
                />
            </div>
        </div>
        <div className="mt-4 flex justify-end">
            <button 
                onClick={handleSaveConfigMagistrados}
                disabled={loadingConfig}
                className="px-4 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
                <Save className="h-4 w-4" /> Salvar Segurança
            </button>
        </div>
      </div>

      {/* --- GESTÃO DE USUÁRIOS --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-700"><Users className="h-6 w-6" /></div>
                  <div>
                      <h3 className="font-bold text-[#112240] text-lg">Gestão de Usuários</h3>
                      <p className="text-sm text-gray-500">Controle quem tem acesso ao sistema.</p>
                  </div>
              </div>
              <button onClick={() => openUserModal()} className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-lg font-bold hover:bg-blue-100 transition-colors">
                  <UserPlus className="h-4 w-4" /> Novo Usuário
              </button>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                          <th className="py-3 pl-2">Nome</th>
                          <th className="py-3">Email</th>
                          <th className="py-3">Cargo</th>
                          <th className="py-3">Status</th>
                          <th className="py-3 text-right pr-2">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="text-sm">
                      {loadingUsers ? (
                          <tr><td colSpan={5} className="py-4 text-center text-gray-400">Carregando...</td></tr>
                      ) : users.map(user => (
                          <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                              <td className="py-3 pl-2 font-bold text-gray-700">{user.nome}</td>
                              <td className="py-3 text-gray-600">{user.email}</td>
                              <td className="py-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-bold">{user.cargo}</span></td>
                              <td className="py-3">
                                  {user.ativo ? 
                                    <span className="flex items-center gap-1 text-green-600 text-xs font-bold"><Check className="h-3 w-3" /> Ativo</span> : 
                                    <span className="flex items-center gap-1 text-red-500 text-xs font-bold"><Ban className="h-3 w-3" /> Bloqueado</span>
                                  }
                              </td>
                              <td className="py-3 text-right pr-2 flex justify-end gap-2">
                                  <button onClick={() => handleToggleActive(user)} title={user.ativo ? "Bloquear" : "Ativar"} className={`p-1.5 rounded hover:bg-gray-200 ${user.ativo ? 'text-green-600' : 'text-red-500'}`}>
                                      <Shield className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => openUserModal(user)} title="Editar" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                                      <Pencil className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => handleDeleteUser(user)} title="Excluir" className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                                      <Trash2 className="h-4 w-4" />
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- GESTÃO DE SÓCIOS --- */}

        {/* --- IMPORTAÇÃO DE DADOS --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-50 rounded-lg text-green-700"><FileSpreadsheet className="h-6 w-6" /></div>
                <div>
                    <h3 className="font-bold text-[#112240] text-lg">Importar Dados</h3>
                    <p className="text-sm text-gray-500">Adicione clientes em massa via Excel.</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-4">
                <button 
                    onClick={handleDownloadTemplate}
                    className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all font-medium text-sm"
                >
                    <Download className="h-4 w-4" /> Baixar Planilha Modelo
                </button>

                <div className="relative">
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                        disabled={loading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`flex items-center justify-center gap-2 w-full py-3 bg-[#112240] text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 ${loading ? 'opacity-70' : 'hover:bg-[#1a3a6c]'}`}>
                        {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {loading ? 'Importando...' : 'Selecionar Arquivo Excel'}
                    </div>
                </div>

                {status.type && (
                    <div className={`p-3 rounded-lg flex items-center gap-2 text-xs font-bold animate-fadeIn ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {status.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        {status.message}
                    </div>
                )}
            </div>
        </div>

      </div>

      {/* --- ZONA DE PERIGO --- */}
      <div className="bg-red-50 rounded-xl border border-red-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg text-red-600 shadow-sm"><AlertTriangle className="h-6 w-6" /></div>
              <div>
                  <h3 className="font-bold text-red-900">Zona de Perigo</h3>
                  <p className="text-xs text-red-700/80">Ações irreversíveis que afetam todo o sistema.</p>
              </div>
          </div>
          <button 
            onClick={handleSystemReset}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Trash2 className="h-4 w-4" /> Resetar Sistema
          </button>
      </div>

      {/* --- SEÇÃO DE CRÉDITOS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* SEÇÃO DE CRÉDITOS */}
        <div className="md:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <Code className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-[#112240] text-lg">Créditos e Informações</h3>
            </div>

            <div className="space-y-6">
                {/* Desenvolvedor */}
                <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                            M
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-base">Marcio Gama</h4>
                            <p className="text-sm text-gray-600">Desenvolvedor Full Stack</p>
                        </div>
                    </div>
                </div>

                {/* Empresa */}
                <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Building className="h-5 w-5 text-blue-600" />
                        <h4 className="font-bold text-gray-900 text-sm">Empresa</h4>
                    </div>
                    <p className="text-base font-bold text-blue-600 ml-8">Flow Metrics</p>
                    <p className="text-xs text-gray-500 ml-8 mt-1">Soluções em Análise de Dados e Desenvolvimento</p>
                </div>

                {/* Tecnologias */}
                <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <Code className="h-5 w-5 text-blue-600" />
                        <h4 className="font-bold text-gray-900 text-sm">Tecnologias Utilizadas</h4>
                    </div>
                    <div className="ml-8 grid grid-cols-2 gap-3">
                        {/* Frontend */}
                        <div>
                            <p className="text-xs font-bold text-gray-700 mb-2">Frontend</p>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                    <span className="text-xs text-gray-600">React 18</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                    <span className="text-xs text-gray-600">TypeScript</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                    <span className="text-xs text-gray-600">Tailwind CSS</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                    <span className="text-xs text-gray-600">Vite</span>
                                </div>
                            </div>
                        </div>

                        {/* Backend */}
                        <div>
                            <p className="text-xs font-bold text-gray-700 mb-2">Backend & Infra</p>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <span className="text-xs text-gray-600">Supabase</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <span className="text-xs text-gray-600">PostgreSQL</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <span className="text-xs text-gray-600">Cloudflare Pages</span>
                                </div>
                            </div>
                        </div>

                        {/* Bibliotecas */}
                        <div className="col-span-2">
                            <p className="text-xs font-bold text-gray-700 mb-2">Bibliotecas</p>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                                    <span className="text-xs text-gray-600">Headless UI</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                                    <span className="text-xs text-gray-600">Lucide Icons</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                                    <span className="text-xs text-gray-600">Recharts</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                                    <span className="text-xs text-gray-600">SheetJS (XLSX)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                                    <span className="text-xs text-gray-600">React IMask</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                                    <span className="text-xs text-gray-600">DnD Kit</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-4 border border-gray-700 shadow-md">
                    <div className="flex items-center gap-3 text-white">
                        <Copyright className="h-5 w-5" />
                        <div>
                            <p className="text-sm font-bold">© 2025-2026 Flow Metrics</p>
                            <p className="text-xs text-gray-300 mt-1">Todos os direitos reservados</p>
                            <p className="text-xs text-gray-400 mt-2">
                                Sistema desenvolvido para <span className="font-semibold text-white">Salomão Advogados</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Versão do Sistema */}
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-medium text-gray-600">Versão do Sistema</span>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                            v1.5.0
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* SEÇÃO DE CHANGELOG */}
        <div className="md:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <History className="h-5 w-5 text-gray-600" />
                <h3 className="font-bold text-[#112240] text-lg">Histórico de Versões</h3>
            </div>

            <div className="space-y-6">
                {CHANGELOG.map((log) => (
                    <div key={log.version} className="border-l-4 border-blue-200 pl-4 relative">
                        {/* Badge de Versão */}
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2.5 py-1 text-xs font-black rounded-lg ${
                                log.type === 'major' ? 'bg-red-100 text-red-700 border border-red-200' :
                                log.type === 'minor' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                'bg-green-100 text-green-700 border border-green-200'
                            }`}>
                                v{log.version}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">{log.date}</span>
                        </div>

                        {/* Título */}
                        <h4 className="font-bold text-gray-900 text-sm mb-3">{log.title}</h4>

                        {/* Lista de mudanças */}
                        <ul className="space-y-1.5">
                            {log.changes.map((change, idx) => (
                                <li key={idx} className="text-xs text-gray-600 flex items-start gap-2 leading-relaxed">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                                    <span>{change}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Legenda */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs font-bold text-gray-600 mb-2">Legenda de Versionamento:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded border border-red-200">MAJOR</span>
                        <span className="text-xs text-gray-600">Mudanças radicais</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded border border-blue-200">MINOR</span>
                        <span className="text-xs text-gray-600">Novas funcionalidades</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded border border-green-200">PATCH</span>
                        <span className="text-xs text-gray-600">Correções de bugs</span>
                    </div>
                </div>
            </div>
        </div>

      </div>

    </div>
  )
}