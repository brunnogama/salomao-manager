import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  Users, 
  KanbanSquare, 
  BookOpen, 
  History, 
  FileWarning,
  X,
  Gavel,
  Truck,
  LogOut
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ activePage, onNavigate, isOpen, onClose }: SidebarProps) {
  const [incompleteCount, setIncompleteCount] = useState(0)
  const [userName, setUserName] = useState('Carregando...')
  const [userRole, setUserRole] = useState('')

  const fetchCount = async () => {
    // Busca apenas na tabela de clientes padrão para o contador de alertas
    const { data } = await supabase.from('clientes').select('*')
    
    if (data) {
      const count = data.filter((c: any) => {
        const ignored = c.ignored_fields || []
        const missing = []
        
        // Validação completa dos campos obrigatórios
        if (!c.nome) missing.push('Nome')
        if (!c.empresa) missing.push('Empresa')
        if (!c.cargo) missing.push('Cargo')
        if (!c.tipo_brinde) missing.push('Tipo Brinde')
        if (!c.cep) missing.push('CEP')
        if (!c.endereco) missing.push('Endereço')
        if (!c.numero) missing.push('Número')
        if (!c.bairro) missing.push('Bairro')
        if (!c.cidade) missing.push('Cidade')
        if (!c.estado) missing.push('UF')
        if (!c.email) missing.push('Email')
        
        // Retorna verdadeiro se houver campos faltando que não foram ignorados
        return missing.filter(f => !ignored.includes(f)).length > 0
      }).length
      
      setIncompleteCount(count)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Busca dados na tabela user_profiles
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role, allowed_modules')
          .eq('user_id', user.id)
          .single()

        if (profile) {
          // Define o nome formatado do email
          if (user.email) {
            const emailName = user.email.split('@')[0]
            const formattedName = emailName
              .split('.')
              .map(part => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' ')
            setUserName(formattedName)
          }

          // Define o cargo traduzido
          const roleLabels: Record<string, string> = {
            admin: 'Administrador',
            user: 'Usuário'
          }
          setUserRole(roleLabels[profile.role] || 'Usuário')
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
      setUserName('Usuário')
    }
  }

  useEffect(() => {
    fetchCount()
    fetchUserProfile()
    // Atualiza a cada 5 segundos para manter o badge sincronizado
    const interval = setInterval(fetchCount, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    // Salvar o flag do modal de boas-vindas
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeModal')
    
    localStorage.clear()
    sessionStorage.clear()
    
    // Restaurar o flag
    if (hasSeenWelcome) {
      localStorage.setItem('hasSeenWelcomeModal', hasSeenWelcome)
    }
    
    await supabase.auth.signOut()
    window.location.reload()
  }
  
  const mainItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'magistrados', label: 'Autoridades', icon: Gavel }, 
    { id: 'incompletos', label: 'Incompletos', icon: FileWarning, badge: incompleteCount },
    { id: 'logistica', label: 'Logística', icon: Truck },
    { id: 'kanban', label: 'Kanban', icon: KanbanSquare },
  ]

  const bottomItems = [
    { id: 'manual', label: 'Manual do Sistema', icon: BookOpen },
    { id: 'historico', label: 'Histórico', icon: History },
  ]

  return (
    <>
      {/* Backdrop Escuro (Apenas Mobile) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
   <aside className={`
  fixed md:static top-0 left-0 z-50 md:z-auto h-screen w-64 bg-[#112240] text-gray-300 flex flex-col font-sans border-r border-gray-800 shadow-2xl md:shadow-none
  transition-transform duration-300 ease-in-out
  ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
  md:translate-x-0
`}>
        
        {/* Botão Fechar (Apenas Mobile) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white md:hidden z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 1. HEADER LOGO */}
        <div className="flex flex-col flex-shrink-0 relative bg-[#112240] pt-6 pb-4 px-6">
          <div className="flex flex-col items-center w-full gap-4">
            <img 
              src="/logo-branca.png" 
              alt="Salomão Advogados" 
              className="h-11 w-auto object-contain block"
            />
            <div className="bg-blue-950/30 border border-blue-800/30 rounded-lg px-4 py-2 w-full">
              <span className="text-[10px] text-blue-300 font-bold tracking-[0.25em] uppercase leading-none whitespace-nowrap block text-center">
                Módulo CRM
              </span>
            </div>
          </div>
        </div>

        {/* 2. MENU PRINCIPAL */}
        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1 custom-scrollbar pt-6">
          {mainItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onClose(); }}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all group ${
                activePage === item.id
                  ? 'bg-[#1e3a8a] text-white font-medium shadow-md border-l-4 border-salomao-gold' 
                  : 'hover:bg-white/5 hover:text-white border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center">
                <item.icon 
                  className={`h-5 w-5 mr-3 transition-colors ${
                    activePage === item.id ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  }`} 
                />
                <span className="text-sm">{item.label}</span>
              </div>
              
              {/* Badge Contador */}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* 3. MENU BASE */}
        <div className="pt-4 pb-6 px-3 bg-[#112240] flex-shrink-0 mt-auto">
          <div className="border-t border-gray-700/50 mb-4 mx-2"></div>
          
          {bottomItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => { onNavigate(item.id); onClose(); }} 
              className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors group mb-1 ${
                activePage === item.id ? 'bg-[#1e3a8a] text-white' : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3 text-gray-400 group-hover:text-white" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}

          {/* User Profile */}
          <div className="mt-4 pt-4 border-t border-gray-700/50 flex items-center justify-between group cursor-pointer px-2">
            <div className="flex items-center">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-salomao-gold to-yellow-600 p-[1px]">
                  <div className="w-full h-full rounded-full bg-[#112240] flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {userName.charAt(0)}
                    </span>
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-[#112240] rounded-full"></div>
              </div>
              
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors truncate max-w-[100px]" title={userName}>
                  {userName}
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">{userRole}</p>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
              title="Sair do Sistema"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
