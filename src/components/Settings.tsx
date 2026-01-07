import { useState, useRef, useEffect } from 'react'
import { 
  Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, 
  Users, Pencil, Trash2, Save, RefreshCw, 
  AlertTriangle, History, Code, Building, Copyright,
  Shield, UserPlus, Ban, Check, Lock
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
            'Sistema de PIN e controle de acesso por e-mail.',
            'Auditoria visual aprimorada com data/hora.'
        ]
    },
    {
        version: '1.3.0',
        date: '05/01/2026',
        type: 'feature',
        title: 'Gestão de Usuários',
        items: [
            'Painel administrativo para controle de usuários.',
            'Bloqueio/Desbloqueio de acesso.',
            'Níveis de permissão.'
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

  // --- ACTIONS: MAGISTRADOS ---

  const handleSaveConfigMagistrados = async () => {
    setLoadingConfig(true)
    const emailsArray = magistradosConfig.emails.split(',').map(e => e.trim()).filter(e => e)
    
    const { data: current } = await supabase.from('config_magistrados').select('id').single()
    
    if (current) {
        await supabase.from('config_magistrados').update({
            pin_acesso: magistradosConfig.pin,
            emails_permitidos: emailsArray
        }).eq('id', current.id)
        
        await logAction('CONFIG', 'SEGURANCA', 'Atualizou PIN/Acessos de Magistrados')
        alert('Configurações de segurança atualizadas!')
    } else {
        await supabase.from('config_magistrados').insert({
            pin_acesso: magistradosConfig.pin,
            emails_permitidos: emailsArray
        })
        alert('Configurações de segurança criadas!')
    }
    setLoadingConfig(false)
  }

  // --- ACTIONS: SÓCIOS ---

  const handleUpdateSocio = async (oldName: string) => {
    if (!newSocioName.trim() || newSocioName === oldName) {
        setEditingSocio(null)
        return
    }

    if (confirm(`Deseja renomear "${oldName}" para "${newSocioName}" em TODOS os clientes?`)) {
        setLoadingSocios(true)
        const { error } = await supabase
            .from('clientes')
            .update({ socio: newSocioName })
            .eq('socio', oldName)
        
        if (!error) {
            await logAction('EDITAR', 'SOCIOS', `Renomeou sócio: ${oldName} -> ${newSocioName}`)
            fetchSocios()
        } else {
            alert('Erro ao atualizar sócio.')
        }
        setEditingSocio(null)
        setLoadingSocios(false)
    }
  }

  const handleDeleteSocio = async (name: string) => {
    if (confirm(`ATENÇÃO: Isso removerá o sócio "${name}" de todos os clientes vinculados. Eles ficarão "Sem Sócio". Continuar?`)) {
        setLoadingSocios(true)
        const { error } = await supabase
            .from('clientes')
            .update({ socio: null })
            .eq('socio', name)

        if (!error) {
            await logAction('EXCLUIR', 'SOCIOS', `Removeu sócio: ${name}`)
            fetchSocios()
        }
        setLoadingSocios(false)
    }
  }

  // --- ACTIONS: USUÁRIOS ---

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

  const handleSaveUser = async () => {
    if (!userForm.email) return alert("E-mail obrigatório")

    try {
        if (editingUser) {
             const { error } = await supabase.from('usuarios_permitidos').update({
                 nome: userForm.nome,
                 email: userForm.email,
                 cargo: userForm.cargo
             }).eq('id', editingUser.id)
             if(error) throw error
             await logAction('EDITAR', 'USUARIOS', `Atualizou usuário: ${userForm.email}`)
        } else {
             const { error } = await supabase.from('usuarios_permitidos').insert({
                 nome: userForm.nome,
                 email: userForm.email,
                 cargo: userForm.cargo,
                 ativo: true
             })
             if(error) throw error
             await logAction('CRIAR', 'USUARIOS', `Criou usuário: ${userForm.email}`)
        }
        setIsUserModalOpen(false)
        fetchUsers()
    } catch (e: any) {
        alert("Erro ao salvar usuário: " + e.message)
    }
  }

  const handleToggleActive = async (user: AppUser) => {
    const newState = !user.ativo
    const { error } = await supabase.from('usuarios_permitidos').update({ ativo: newState }).eq('id', user.id)
    if (!error) {
        await logAction('EDITAR', 'USUARIOS', `${newState ? 'Ativou' : 'Bloqueou'} usuário: ${user.email}`)
        fetchUsers()
    }
  }

  const handleDeleteUser = async (user: AppUser) => {
    if (confirm(`Excluir usuário ${user.email}?`)) {
        const { error } = await supabase.from('usuarios_permitidos').delete().eq('id', user.id)
        if (!error) {
            await logAction('EXCLUIR', 'USUARIOS', `Excluiu usuário: ${user.email}`)
            fetchUsers()
        }
    }
  }

  // --- ACTIONS: SYSTEM (RESET) ---

  const handleSystemReset = async () => {
    if (confirm('PERIGO: Isso apagará TODOS os dados (Clientes e Magistrados) do sistema. Tem certeza absoluta?')) {
        const confirmText = prompt('Digite APAGAR para confirmar a exclusão total:')
        
        if (confirmText === 'APAGAR') {
            setLoading(true)
            setStatus({ type: null, message: 'Limpando base de dados...' })

            try {
                // 1. Apagar Magistrados
                const { error: err1 } = await supabase.from('magistrados').delete().neq('id', 0)
                if (err1) throw err1

                // 2. Apagar Clientes (Isso deve apagar as tarefas em cascata se o SQL foi rodado)
                const { error: err2 } = await supabase.from('clientes').delete().neq('id', 0)
                if (err2) throw err2

                setStatus({ type: 'success', message: 'Sistema resetado com sucesso!' })
                await logAction('RESET', 'SISTEMA', 'Resetou toda a base de dados')
                
                fetchSocios()
                
            } catch (error: any) {
                console.error("Erro no reset:", error)
                setStatus({ type: 'error', message: 'Erro: ' + (error.message || 'Verifique permissões no Supabase') })
            } finally {
                setLoading(false)
            }
        }
    }
  }

  const handleDownloadTemplate = () => {
    const ws = utils.json_to_sheet([
      { nome: 'Exemplo Cliente', empresa: 'Empresa SA', cargo: 'Diretor', email: 'email@teste.com', telefone: '11999999999', socio: 'Dr. João', tipo_brinde: 'Brinde VIP', quantidade: 1, cep: '01001000', endereco: 'Praça da Sé', numero: '1', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP' }
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

  const getVersionColor = (type: string) => {
      switch(type) {
          case 'feature': return 'bg-green-100 text-green-700 border-green-200'
          default: return 'bg-gray-100 text-gray-700 border-gray-200'
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

      {/* --- CONFIGURAÇÃO: MAGISTRADOS (NOVO) --- */}
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
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Trash2 className="h-4 w-4" /> Resetar Sistema
          </button>
      </div>

      {/* --- CRÉDITOS, VERSÃO E RODAPÉ (RESTAURADO) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-200">
        
        {/* LOGO & DIREITOS */}
        <div className="flex flex-col justify-between gap-4 h-full">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-[#112240]">
                    <img src="/logo-salomao.png" alt="Salomão" className="h-8 w-auto opacity-80" />
                </div>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
                    Sistema de gestão desenvolvido exclusivamente para Salomão Advogados.
                    Todos os direitos reservados.
                </p>
            </div>
            
            {/* RODAPÉ COM ÍCONES RESTAURADOS */}
            <div className="flex flex-col gap-2 mt-auto">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                    <Copyright className="h-3 w-3" /> 
                    <span>{new Date().getFullYear()} Todos os direitos reservados.</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                     <Code className="h-3 w-3" />
                     <span>Desenvolvido por <strong>Brunno Gama</strong></span>
                </div>
            </div>
        </div>

        {/* CHANGELOG (HISTÓRICO) */}
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

    </div>
  )
}
