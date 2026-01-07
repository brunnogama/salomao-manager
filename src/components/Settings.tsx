import { useState, useRef, useEffect } from 'react'
import { 
  Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, 
  Users, Pencil, Trash2, Save, RefreshCw, 
  AlertTriangle, History, Copyright, Code,
  Shield, UserPlus, Ban, Check, Lock, Building, X
} from 'lucide-react'
import { utils, read, writeFile } from 'xlsx'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/logger'

interface SocioStats {
  nome: string;
  count: number;
}

interface AppUser {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  ativo: boolean;
}

export function Settings() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' })
  
  // --- GESTÃO DE SÓCIOS ---
  const [sociosStats, setSociosStats] = useState<SocioStats[]>([])
  const [loadingSocios, setLoadingSocios] = useState(false)
  const [editingSocio, setEditingSocio] = useState<string | null>(null)
  const [newSocioName, setNewSocioName] = useState('')

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

  const changelog = [
    {
        version: '1.4.0',
        date: '07/01/2026',
        type: 'feature',
        title: 'Módulo Magistrados & Segurança',
        items: [
            'Novo módulo restrito para Magistrados.',
            'Sistema de PIN e controle de acesso.',
            'Auditoria visual aprimorada.'
        ]
    }
  ]

  useEffect(() => { 
    fetchSocios();
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

  const fetchSocios = async () => {
    setLoadingSocios(true)
    const { data: clients } = await supabase.from('clientes').select('socio')
    
    if (clients) {
        const counts: Record<string, number> = {}
        clients.forEach((c: any) => {
            const socio = c.socio || 'Sem Sócio'
            counts[socio] = (counts[socio] || 0) + 1
        })
        const stats = Object.entries(counts)
            .map(([nome, count]) => ({ nome, count }))
            .sort((a, b) => b.count - a.count)
        setSociosStats(stats)
    }
    setLoadingSocios(false)
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

  const handleUpdateSocio = async (oldName: string) => {
    if (!newSocioName.trim() || newSocioName === oldName) {
        setEditingSocio(null)
        return
    }
    if (confirm(`Renomear "${oldName}" para "${newSocioName}"?`)) {
        setLoadingSocios(true)
        await supabase.from('clientes').update({ socio: newSocioName }).eq('socio', oldName)
        fetchSocios()
        setEditingSocio(null)
        setLoadingSocios(false)
    }
  }

  const handleDeleteSocio = async (name: string) => {
    if (confirm(`Remover sócio "${name}"?`)) {
        setLoadingSocios(true)
        await supabase.from('clientes').update({ socio: null }).eq('socio', name)
        fetchSocios()
        setLoadingSocios(false)
    }
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

  // --- FUNÇÃO RESETAR SISTEMA (CORRIGIDA) ---
  const handleSystemReset = async () => {
    if (!confirm('⚠️ PERIGO: Isso apagará TODOS os dados (Clientes, Magistrados e Tarefas). Tem certeza absoluta?')) return;
    
    const confirmText = prompt('Digite "APAGAR" (em maiúsculas) para confirmar a exclusão total:')
    if (confirmText !== 'APAGAR') {
        alert('Operação cancelada.')
        return;
    }

    setLoading(true)
    setStatus({ type: null, message: 'Iniciando limpeza da base de dados...' })

    try {
        console.log('🔥 Iniciando reset do sistema...')

        // PASSO 1: Limpar TODAS as tarefas (remove dependências FK)
        setStatus({ type: null, message: '1/3: Removendo tarefas do Kanban...' })
        const { error: errTasks } = await supabase
            .from('tasks')
            .delete()
            .neq('id', 0) // Trick: deleta tudo onde id != 0
        
        if (errTasks) {
            console.error('Erro ao limpar tasks:', errTasks)
            throw new Error(`Falha ao limpar tarefas: ${errTasks.message}`)
        }
        console.log('✅ Tarefas removidas')

        // PASSO 2: Limpar Magistrados
        setStatus({ type: null, message: '2/3: Removendo magistrados...' })
        const { error: errMag } = await supabase
            .from('magistrados')
            .delete()
            .neq('id', 0)
        
        if (errMag) {
            console.error('Erro ao limpar magistrados:', errMag)
            throw new Error(`Falha ao limpar magistrados: ${errMag.message}`)
        }
        console.log('✅ Magistrados removidos')

        // PASSO 3: Limpar Clientes
        setStatus({ type: null, message: '3/3: Removendo clientes...' })
        const { error: errClientes } = await supabase
            .from('clientes')
            .delete()
            .neq('id', 0)
        
        if (errClientes) {
            console.error('Erro ao limpar clientes:', errClientes)
            throw new Error(`Falha ao limpar clientes: ${errClientes.message}`)
        }
        console.log('✅ Clientes removidos')

        // Sucesso!
        setStatus({ type: 'success', message: '✅ Sistema resetado com sucesso! Todos os dados foram removidos.' })
        await logAction('RESET', 'SISTEMA', 'Resetou toda a base de dados (Clientes, Magistrados, Tasks)')
        
        // Recarrega os sócios para atualizar a interface
        setTimeout(() => {
            fetchSocios()
            fetchUsers()
        }, 1000)
        
    } catch (error: any) {
        console.error("❌ Erro crítico no reset:", error)
        setStatus({ 
            type: 'error', 
            message: `Erro ao resetar: ${error.message || 'Erro desconhecido'}. Verifique as permissões RLS.` 
        })
        alert(`❌ Falha no reset do sistema:\n\n${error.message}\n\nPossíveis causas:\n- Permissões RLS bloqueando DELETE\n- Foreign Keys ativas\n- Conexão com banco perdida`)
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

      if (jsonData.length === 0) throw new Error('Arquivo vazio.')

      // ✅ CORREÇÃO: Usa getUser() que existe no Supabase v2
      const { data: { user } } = await supabase.auth.getUser()
      const userEmail = user?.email || 'Importação'

      const normalizeKeys = (obj: any) => {
          const newObj: any = {};
          Object.keys(obj).forEach(key => {
              newObj[key.trim().toLowerCase()] = obj[key];
          });
          return newObj;
      }

      const itemsToInsert = jsonData.map((rawRow: any) => {
        const row = normalizeKeys(rawRow);
        if (!row.nome && !row['nome completo']) return null;

        return {
            nome: row.nome || row['nome completo'] || 'Sem Nome',
            empresa: row.empresa || '',
            cargo: row.cargo || '',
            email: row.email || row['e-mail'] || '',
            telefone: row.telefone || row.celular || '',
            socio: row.socio || row['sócio'] || '',
            tipo_brinde: row.tipo_brinde || row['tipo de brinde'] || row.brinde || 'Brinde Médio',
            quantidade: row.quantidade || 1,
            cep: row.cep || '',
            endereco: row.endereco || row['endereço'] || '',
            numero: row.numero || row['número'] || '',
            bairro: row.bairro || '',
            cidade: row.cidade || '',
            estado: row.estado || row.uf || '',
            created_by: userEmail,
            updated_by: userEmail
        }
      }).filter(Boolean)

      if (itemsToInsert.length === 0) throw new Error('Nenhum item válido.')

      const { error } = await supabase.from('clientes').insert(itemsToInsert)

      if (error) throw error

      setStatus({ type: 'success', message: `${itemsToInsert.length} clientes importados com sucesso!` })
      await logAction('IMPORTAR', 'CLIENTES', `Importou ${itemsToInsert.length} registros`)

      setTimeout(() => setStatus({ type: null, message: '' }), 5000)
      
    } catch (error: any) {
      console.error(error)
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const getVersionColor = (type: string) => {
    switch(type) {
        case 'feature': return 'bg-blue-100 text-blue-700 border-blue-200'
        case 'fix': return 'bg-orange-100 text-orange-700 border-orange-200'
        case 'security': return 'bg-red-100 text-red-700 border-red-200'
        default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-700"><Shield className="h-6 w-6" /></div>
            <div>
                <h3 className="font-bold text-[#112240] text-lg">Módulo Magistrados</h3>
                <p className="text-sm text-gray-500">Controle de PIN e e-mails autorizados.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">PIN de Acesso (4 dígitos)</label>
                <input 
                    type="text" 
                    maxLength={4}
                    value={magistradosConfig.pin}
                    onChange={(e) => setMagistradosConfig({...magistradosConfig, pin: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#112240]"
                    placeholder="1234"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">E-mails Permitidos (separados por vírgula)</label>
                <input 
                    type="text"
                    value={magistradosConfig.emails}
                    onChange={(e) => setMagistradosConfig({...magistradosConfig, emails: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#112240]"
                    placeholder="usuario1@email.com, usuario2@email.com"
                />
            </div>
        </div>

        <button 
            onClick={handleSaveConfigMagistrados}
            disabled={loadingConfig}
            className="mt-4 px-4 py-2 bg-[#112240] hover:bg-[#1a3a6c] text-white rounded-lg text-sm font-bold transition-all disabled:opacity-70 flex items-center gap-2"
        >
            {loadingConfig ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Salvar Configurações
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-700"><Users className="h-6 w-6" /></div>
                  <div>
                      <h3 className="font-bold text-[#112240] text-lg">Usuários do Sistema</h3>
                      <p className="text-sm text-gray-500">Gerencie quem pode acessar a plataforma.</p>
                  </div>
              </div>
              <button 
                  onClick={() => openUserModal()}
                  className="px-4 py-2 bg-[#112240] hover:bg-[#1a3a6c] text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
              >
                  <UserPlus className="h-4 w-4" /> Novo Usuário
              </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                      <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nome</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">E-mail</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cargo</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                      {loadingUsers ? (
                          <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Carregando usuários...</td></tr>
                      ) : users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.nome}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-xs">
                                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold uppercase">{user.cargo}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-xs">
                                  <span className={`px-2 py-1 rounded font-bold flex items-center gap-1 w-fit ${user.ativo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                      {user.ativo ? <Check className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                                      {user.ativo ? 'ATIVO' : 'BLOQUEADO'}
                                  </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center gap-2">
                                      <button onClick={() => openUserModal(user)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                                          <Pencil className="h-4 w-4" />
                                      </button>
                                      <button onClick={() => handleToggleActive(user)} className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded" title={user.ativo ? 'Bloquear' : 'Desbloquear'}>
                                          {user.ativo ? <Ban className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                      </button>
                                      <button onClick={() => handleDeleteUser(user)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Excluir">
                                          <Trash2 className="h-4 w-4" />
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- GESTÃO DE SÓCIOS --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-700"><Building className="h-6 w-6" /></div>
                <div>
                    <h3 className="font-bold text-[#112240] text-lg">Gestão de Sócios</h3>
                    <p className="text-sm text-gray-500">Renomeie ou remova sócios da base.</p>
                </div>
            </div>

            <div className="max-h-64 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                {loadingSocios ? <p className="text-center text-sm text-gray-400 py-4">Carregando...</p> : sociosStats.map((socio) => (
                    <div key={socio.nome} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {socio.nome.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                {editingSocio === socio.nome ? (
                                    <input 
                                        autoFocus
                                        className="text-sm font-bold bg-white border border-purple-300 rounded px-2 py-0.5 w-full outline-none"
                                        defaultValue={socio.nome}
                                        onBlur={() => handleUpdateSocio(socio.nome)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                setNewSocioName(e.currentTarget.value)
                                                handleUpdateSocio(socio.nome)
                                            }
                                        }}
                                        onChange={(e) => setNewSocioName(e.target.value)}
                                    />
                                ) : (
                                    <>
                                        <p className="text-sm font-bold text-gray-800 truncate">{socio.nome}</p>
                                        <p className="text-xs text-gray-500">{socio.count} clientes vinculados</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => { setEditingSocio(socio.nome); setNewSocioName(socio.nome); }}
                                className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-md" 
                                title="Renomear"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button 
                                onClick={() => handleDeleteSocio(socio.nome)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md" 
                                title="Remover Sócio"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

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
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-70"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {loading ? 'Limpando...' : 'Resetar Sistema'}
          </button>
      </div>

      {/* --- CRÉDITOS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-200">
        
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-[#112240]">
                <img src="/logo-salomao.png" alt="Salomão" className="h-8 w-auto opacity-80" />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
                Sistema de gestão desenvolvido exclusivamente para Salomão Advogados.
            </p>
            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                <Copyright className="h-3 w-3" /> 2024-2026
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                <Code className="h-3 w-3" /><span>Desenvolvido por <strong>Brunno Gama</strong></span>
            </div>
        </div>

        <div className="md:col-span-2 bg-gray-50 rounded-xl p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
                <History className="h-4 w-4 text-gray-400" />
                <h3 className="font-bold text-[#112240] text-lg">Histórico de Versões</h3>
            </div>

            <div className="space-y-8 relative before:absolute before:left-2.5 before:top-2 before:h-full before:w-0.5 before:bg-gray-100">
                {changelog.map((log) => (
                    <div key={log.version} className="relative pl-10">
                        <div className="absolute left-0 top-1.5 h-5 w-5 rounded-full border-4 border-white bg-gray-300 shadow-sm z-10"></div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                            <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase border w-fit ${getVersionColor(log.type)}`}>
                                v{log.version}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">{log.date}</span>
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm mb-2">{log.title}</h4>
                        <ul className="space-y-1">
                            {log.items.map((item, idx) => (
                                <li key={idx} className="text-xs text-gray-500 flex items-start gap-2">
                                    <span className="mt-1.5 h-1 w-1 rounded-full bg-gray-400 flex-shrink-0"></span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>

      </div>

      {/* MODAL DE USUÁRIO */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn">
            <div className="bg-[#112240] p-6 text-white flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button onClick={() => setIsUserModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }} className="p-6 space-y-4">
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nome Completo</label>
                  <input 
                      type="text"
                      required
                      value={userForm.nome}
                      onChange={(e) => setUserForm({...userForm, nome: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#112240]"
                  />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">E-mail</label>
                  <input 
                      type="email"
                      required
                      value={userForm.email}
                      onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#112240]"
                  />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cargo</label>
                  <select 
                      value={userForm.cargo}
                      onChange={(e) => setUserForm({...userForm, cargo: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#112240]"
                  >
                      <option value="Colaborador">Colaborador</option>
                      <option value="Advogado">Advogado</option>
                      <option value="Sócio">Sócio</option>
                      <option value="Administrador">Administrador</option>
                  </select>
              </div>
              <button type="submit" className="w-full bg-[#112240] text-white py-3 rounded-xl font-bold hover:bg-[#1a3a6c] transition-all flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" /> Salvar Usuário
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}