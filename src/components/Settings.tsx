import { useState, useRef, useEffect } from 'react'
import { 
  Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, 
  Users, Pencil, Trash2, Save, X, RefreshCw, 
  AlertTriangle, History, Code, Building, User, Copyright,
  Shield, UserPlus, Ban, Check
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
  
  // Estados para Gestão de Sócios
  const [sociosStats, setSociosStats] = useState<SocioStats[]>([])
  const [loadingSocios, setLoadingSocios] = useState(false)
  const [editingSocio, setEditingSocio] = useState<string | null>(null)
  const [newSocioName, setNewSocioName] = useState('')

  // Estados para Gestão de Usuários
  const [users, setUsers] = useState<AppUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  
  // Form de Usuário
  const [userForm, setUserForm] = useState({ nome: '', email: '', cargo: 'Colaborador' })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- CHANGELOG ATUALIZADO ---
  const changelog = [
    {
      version: '1.5',
      date: '06/01/2026',
      type: 'feat',
      title: 'Ecossistema e Histórico',
      items: [
        'Novo módulo de Histórico Anual de Brindes (visualização e edição).',
        'Tela de Login renovada com acesso ao Ecossistema (CRM, Família, Colaboradores).',
        'Inclusão do Manual do Sistema integrado.',
        'Correções críticas de build e estabilidade no Kanban e Modal de Clientes.'
      ]
    },
    {
      version: '1.4',
      date: '05/01/2026',
      type: 'feat',
      title: 'Gestão de Acessos e Segurança',
      items: [
        'Novo painel administrativo para Gestão de Usuários.',
        'Funcionalidade de criar, editar e excluir acessos ao sistema.',
        'Controle de bloqueio/desbloqueio imediato de usuários (Inativar).',
        'Definição de níveis de cargo (Admin, Sócio, Colaborador).'
      ]
    },
    {
      version: '1.3.1',
      date: '05/01/2026',
      type: 'fix',
      title: 'Estabilidade e UX Mobile',
      items: [
        'Correção crítica no Logout: Saída do sistema agora é instantânea.',
        'Ajuste na Sidebar Mobile: Botão fechar reposicionado e altura corrigida.',
        'Correção de sobreposição do rodapé do usuário em telas pequenas.'
      ]
    },
    {
      version: '1.3',
      date: '05/01/2026',
      type: 'feat',
      title: 'Interatividade e Mobilidade',
      items: [
        'Suporte completo a dispositivos móveis (Menu Responsivo).',
        'Impressão de Fichas Cadastrais (PDF) e Relatórios em Lista.',
        'Interatividade no Dashboard (Drill-down).',
        'Filtros por Data no Histórico.'
      ]
    },
    {
      version: '1.2.1',
      date: '05/01/2026',
      type: 'fix',
      title: 'Polimento Visual',
      items: ['Correção de tooltips no Dashboard', 'Ajuste de cards', 'Formatação de e-mail']
    },
    {
      version: '1.2',
      date: '05/01/2026',
      type: 'feat',
      title: 'Auditoria',
      items: ['Sistema de Logs', 'Rastreabilidade de ações']
    },
    {
      version: '1.0',
      date: '01/01/2026',
      type: 'major',
      title: 'Lançamento',
      items: ['Estrutura inicial', 'Autenticação', 'Kanban', 'Gestão de Clientes']
    }
  ];

  // --- BUSCAS INICIAIS ---
  useEffect(() => { 
    fetchSocios();
    fetchUsers();
  }, [])

  // --- GESTÃO DE SÓCIOS ---
  const fetchSocios = async () => {
    setLoadingSocios(true)
    try {
      const { data, error } = await supabase.from('clientes').select('socio')
      if (error) throw error
      if (data) {
        const counts: Record<string, number> = {}
        data.forEach(item => { if (item.socio) counts[item.socio] = (counts[item.socio] || 0) + 1 })
        const statsArray = Object.entries(counts).map(([nome, count]) => ({ nome, count }))
        statsArray.sort((a, b) => a.nome.localeCompare(b.nome))
        setSociosStats(statsArray)
      }
    } catch (error) {
      console.error('Erro ao buscar sócios:', error)
    } finally {
      setLoadingSocios(false)
    }
  }

  const handleUpdateSocio = async (oldName: string) => {
    if (!newSocioName.trim() || newSocioName === oldName) {
      setEditingSocio(null)
      return
    }
    if (confirm(`Confirmar alteração de "${oldName}" para "${newSocioName}"?`)) {
      setLoadingSocios(true)
      try {
        const { error } = await supabase.from('clientes').update({ socio: newSocioName }).eq('socio', oldName)
        if (error) throw error
        await logAction('EDITAR', 'CONFIG', `Renomeou sócio: ${oldName} -> ${newSocioName}`)
        fetchSocios()
      } catch (error: any) {
        alert(`Erro: ${error.message}`)
      } finally {
        setEditingSocio(null)
        setLoadingSocios(false)
      }
    }
  }

  const handleDeleteSocio = async (name: string) => {
    if (confirm(`ATENÇÃO: Remover vínculo do sócio "${name}"?`)) {
      setLoadingSocios(true)
      try {
        const { error } = await supabase.from('clientes').update({ socio: null }).eq('socio', name)
        if (error) throw error
        await logAction('EXCLUIR', 'CONFIG', `Removeu vínculo do sócio: ${name}`)
        fetchSocios()
      } catch (error: any) {
        alert(`Erro: ${error.message}`)
      } finally {
        setLoadingSocios(false)
      }
    }
  }

  // --- GESTÃO DE USUÁRIOS ---
  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const { data, error } = await supabase.from('usuarios_permitidos').select('*').order('nome')
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleSaveUser = async () => {
    if (!userForm.nome || !userForm.email) {
      alert("Preencha nome e email.")
      return
    }

    try {
      if (editingUser) {
        const { error } = await supabase
          .from('usuarios_permitidos')
          .update({ nome: userForm.nome, email: userForm.email, cargo: userForm.cargo })
          .eq('id', editingUser.id)
        
        if (error) throw error
        await logAction('EDITAR', 'USUARIOS', `Editou usuário: ${userForm.email}`)
      } else {
        const { error } = await supabase
          .from('usuarios_permitidos')
          .insert([{ nome: userForm.nome, email: userForm.email, cargo: userForm.cargo, ativo: true }])
        
        if (error) throw error
        await logAction('CRIAR', 'USUARIOS', `Novo usuário cadastrado: ${userForm.email}`)
      }
      
      setIsUserModalOpen(false)
      setUserForm({ nome: '', email: '', cargo: 'Colaborador' })
      setEditingUser(null)
      fetchUsers()
    } catch (error: any) {
      alert(`Erro ao salvar: ${error.message}`)
    }
  }

  const handleToggleActive = async (user: AppUser) => {
    try {
      const newState = !user.ativo
      const { error } = await supabase
        .from('usuarios_permitidos')
        .update({ ativo: newState })
        .eq('id', user.id)
      
      if (error) throw error
      await logAction('EDITAR', 'USUARIOS', `${newState ? 'Ativou' : 'Inativou'} usuário: ${user.email}`)
      fetchUsers()
    } catch (error: any) {
      alert(`Erro: ${error.message}`)
    }
  }

  const handleDeleteUser = async (user: AppUser) => {
    if (!confirm(`Tem certeza que deseja remover ${user.nome} do sistema? Ele perderá o acesso.`)) return

    try {
      const { error } = await supabase.from('usuarios_permitidos').delete().eq('id', user.id)
      if (error) throw error
      await logAction('EXCLUIR', 'USUARIOS', `Removeu usuário: ${user.email}`)
      fetchUsers()
    } catch (error: any) {
      alert(`Erro: ${error.message}`)
    }
  }

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

  // --- RESET TOTAL ---
  const handleSystemReset = async () => {
    const confirmation = prompt("ATENÇÃO: ISSO APAGARÁ TODOS OS DADOS!\n\nDigite 'DELETAR' para confirmar o reset completo do sistema.");
    
    if (confirmation === 'DELETAR') {
        setLoading(true);
        try {
            await supabase.from('clientes').delete().neq('id', 0);
            await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
            await supabase.from('logs').delete().neq('id', 0);
            
            await logAction('EXCLUIR', 'SISTEMA', 'Realizou RESET TOTAL do sistema');
            alert('Sistema resetado com sucesso.');
            window.location.reload();
        } catch (error: any) {
            alert(`Erro ao resetar: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }
  }

  // --- IMPORTAÇÃO ---
  const handleDownloadTemplate = () => {
    const templateData = [{ "Nome Completo": "Exemplo Silva", "Empresa": "Empresa Teste", "Sócio Responsável": "Sócio" }]
    const ws = utils.json_to_sheet(templateData)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, "Modelo")
    writeFile(wb, "Modelo_Importacao.xlsx")
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setStatus({ type: null, message: '' })

    try {
      const data = await file.arrayBuffer()
      const workbook = read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData: any[] = utils.sheet_to_json(worksheet)
      if (jsonData.length === 0) throw new Error("A planilha está vazia.")

      const clientsToInsert = jsonData.map((row) => ({
        nome: row["Nome Completo"],
        empresa: row["Empresa"],
        cargo: row["Cargo"],
        telefone: row["Telefone"],
        tipo_brinde: row["Tipo de Brinde"] || "Brinde Médio",
        outro_brinde: row["Outro Brinde"],
        quantidade: row["Quantidade"] || 1,
        cep: row["CEP"],
        endereco: row["Endereço"],
        numero: row["Número"] ? String(row["Número"]) : null,
        complemento: row["Complemento"],
        bairro: row["Bairro"],
        cidade: row["Cidade"],
        estado: row["Estado"],
        email: row["Email"],
        socio: row["Sócio Responsável"],
        observacoes: row["Observações"]
      }))

      const { error } = await supabase.from('clientes').insert(clientsToInsert)
      if (error) throw error

      await logAction('CRIAR', 'CONFIG', `Importou ${clientsToInsert.length} clientes via Excel`)
      setStatus({ type: 'success', message: `${clientsToInsert.length} clientes importados!` })
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchSocios()
    } catch (error: any) {
      setStatus({ type: 'error', message: `Erro: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const getVersionColor = (type: string) => {
      if (type === 'major') return 'bg-purple-100 text-purple-700 border-purple-200';
      if (type === 'feat') return 'bg-blue-100 text-blue-700 border-blue-200';
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8 relative">
      
      {/* MODAL DE USUÁRIO */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-[#112240] mb-4">
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={userForm.nome}
                  onChange={e => setUserForm({...userForm, nome: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">E-mail de Login</label>
                <input 
                  type="email" 
                  value={userForm.email}
                  onChange={e => setUserForm({...userForm, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                  placeholder="email@salomao.adv.br"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cargo / Permissão</label>
                <select 
                  value={userForm.cargo}
                  onChange={e => setUserForm({...userForm, cargo: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                >
                  <option value="Colaborador">Colaborador</option>
                  <option value="Admin">Admin (Acesso Total)</option>
                  <option value="Sócio">Sócio</option>
                </select>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button onClick={handleSaveUser} className="px-4 py-2 bg-[#112240] text-white rounded-lg hover:bg-[#1a3a6c]">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- GESTÃO DE USUÁRIOS --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-700"><Shield className="h-6 w-6" /></div>
                <div>
                  <h3 className="font-bold text-[#112240] text-lg">Gestão de Usuários</h3>
                  <p className="text-sm text-gray-500">Controle quem tem acesso ao sistema.</p>
                </div>
            </div>
            <button onClick={() => openUserModal()} className="flex items-center gap-2 px-4 py-2 bg-[#112240] text-white rounded-lg hover:bg-[#1a3a6c] transition-colors text-sm font-bold shadow-sm">
                <UserPlus className="h-4 w-4" /> Novo Usuário
            </button>
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
              <tr>
                <th className="px-4 py-3">Nome / Email</th>
                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/50 group">
                  <td className="px-4 py-3">
                    <p className="font-bold text-[#112240]">{user.nome}</p>
                    <p className="text-gray-500 text-xs">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.cargo === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                      {user.cargo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${user.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.ativo ? <Check className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                      {user.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleToggleActive(user)}
                        title={user.ativo ? "Bloquear Acesso" : "Liberar Acesso"}
                        className={`p-1.5 rounded-md border ${user.ativo ? 'text-orange-500 border-orange-100 hover:bg-orange-50' : 'text-green-600 border-green-100 hover:bg-green-50'}`}
                      >
                        {user.ativo ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                      <button onClick={() => openUserModal(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-100"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteUser(user)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md border border-red-100"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loadingUsers && (
                <tr><td colSpan={4} className="p-4 text-center text-gray-400">Nenhum usuário cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEÇÃO 2: GESTÃO SÓCIOS E IMPORTAÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Gestão de Sócios */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-700"><Users className="h-6 w-6" /></div>
                    <h3 className="font-bold text-[#112240] text-lg">Sócios (Cadastro)</h3>
                </div>
                <button onClick={fetchSocios} className="p-2 text-gray-400 hover:text-[#112240]"><RefreshCw className={`h-4 w-4 ${loadingSocios ? 'animate-spin' : ''}`} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-64 custom-scrollbar pr-2">
                {loadingSocios && sociosStats.length === 0 ? <p className="text-gray-400 text-sm">Carregando...</p> : (
                    <div className="space-y-3">
                        {sociosStats.map((item) => (
                            <div key={item.nome} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:border-gray-300 transition-all">
                                {editingSocio === item.nome ? (
                                    <div className="flex gap-2 w-full">
                                        <input type="text" className="flex-1 px-2 py-1 text-sm border rounded" value={newSocioName} onChange={e => setNewSocioName(e.target.value)} autoFocus />
                                        <button onClick={() => handleUpdateSocio(item.nome)} className="text-green-600"><Save className="h-4 w-4" /></button>
                                        <button onClick={() => setEditingSocio(null)} className="text-gray-400"><X className="h-4 w-4" /></button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">{item.nome.charAt(0)}</div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{item.nome}</p>
                                                <p className="text-[10px] text-gray-500">{item.count} clientes</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingSocio(item.nome); setNewSocioName(item.nome); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-3 w-3" /></button>
                                            <button onClick={() => handleDeleteSocio(item.nome)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3 w-3" /></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Importação */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-700"><FileSpreadsheet className="h-6 w-6" /></div>
                <h3 className="font-bold text-[#112240] text-lg">Importação em Lote</h3>
            </div>
            
            <div className="space-y-4">
                <button onClick={handleDownloadTemplate} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700">
                    <span>1. Baixar Planilha Modelo</span>
                    <Download className="h-4 w-4" />
                </button>
                
                <div className="relative">
                    <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} ref={fileInputRef} className="hidden" id="file-upload" disabled={loading} />
                    <label htmlFor="file-upload" className={`w-full flex items-center justify-between px-4 py-3 ${loading ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'bg-[#112240] hover:bg-[#1a3a6c] cursor-pointer text-white'} rounded-lg transition-colors text-sm font-bold shadow-sm`}>
                        <span>{loading ? 'Processando...' : '2. Enviar Arquivo Preenchido'}</span>
                        <Upload className="h-4 w-4" />
                    </label>
                </div>

                {status.message && (
                    <div className={`p-3 rounded-lg flex items-center gap-2 text-xs font-bold ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {status.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        {status.message}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* SEÇÃO 3: CRÉDITOS E ZONA DE PERIGO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div className="md:col-span-2 bg-[#112240] text-white rounded-xl shadow-lg p-8 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                    <Code className="h-6 w-6 text-blue-400" />
                    <h3 className="font-bold text-xl">Sobre o Sistema</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Desenvolvedor</p>
                                <p className="font-bold text-lg">Marcio Gama</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Empresa</p>
                                <p className="font-bold text-lg">Flow Metrics</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Copyright className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Direitos</p>
                                <p className="font-medium text-sm text-gray-300">Todos os direitos reservados © 2026</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-3">Stack Tecnológico</p>
                        <div className="flex flex-wrap gap-2">
                            {['React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Recharts', 'Lucide Icons', 'XLSX'].map(tech => (
                                <span key={tech} className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium border border-white/10 text-blue-200">
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        <div className="bg-red-50 rounded-xl border border-red-100 p-6 flex flex-col justify-center items-center text-center">
            <div className="p-3 bg-red-100 rounded-full text-red-600 mb-4">
                <AlertTriangle className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-red-900 text-lg mb-2">Zona de Perigo</h3>
            <p className="text-xs text-red-700/80 mb-6 leading-relaxed">
                Esta ação apagará <strong>todos</strong> os clientes, tarefas e logs do sistema permanentemente. Não há como desfazer.
            </p>
            <button 
                onClick={handleSystemReset}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
            >
                <Trash2 className="h-4 w-4" /> RESETAR SISTEMA
            </button>
        </div>
      </div>

      {/* SEÇÃO 4: CHANGELOG */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-gray-100 rounded-lg text-gray-600"><History className="h-6 w-6" /></div>
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
  )
}
