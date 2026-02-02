// src/components/crm/Sidebar.tsx
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
import { supabase } from '../../lib/supabase'

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
    const { data } = await supabase.from('clientes').select('*')
    
    if (data) {
      const count = data.filter((c: any) => {
        const ignored = c.ignored_fields || []
        const missing = []
        
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
        
        return missing.filter(f => !ignored.includes(f)).length > 0
      }).length
      
      setIncompleteCount(count)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role, allowed_modules')
          .eq('user_id', user.id)
          .single()

        if (profile) {
          if (user.email) {
            const emailName = user.email.split('@')[0]
            const formattedName = emailName
              .split('.')
              .map(part => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' ')
            setUserName(formattedName)
          }

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
    const interval = setInterval(fetchCount, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeModal')
    
    localStorage.clear()
    sessionStorage.clear()
    
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
          className="fixed inset-0 z-40 bg-[#0a192f]/60 backdrop-blur-md md:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static top-0 left-0 z-50 md:z-auto h-screen w-64 
        bg-gradient-to-b from-[#0a192f] to-[#112240] 
        text-gray-300 flex flex-col font-sans 
        border-r border-gray-800/50 shadow-2xl md:shadow-none
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}>
        
        {/* Botão Fechar (Apenas Mobile) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 md:hidden z-10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. HEADER LOGO */}
        <div className="flex flex-col flex-shrink-0 relative pt-6 pb-4 px-6">
          <div className="flex flex-col items-center w-full gap-4">
            <img 
              src="/logo-branca.png" 
              alt="Salomão Advogados" 
              className="h-11 w-auto object-contain block"
            />
            <div className="bg-[#1e3a8a]/20 border border-[#1e3a8a]/30 rounded-xl px-4 py-2.5 w-full backdrop-blur-sm">
              <span className="text-[9px] text-blue-300 font-black tracking-[0.25em] uppercase leading-none whitespace-nowrap block text-center">
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
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${
                activePage === item.id
                  ? 'bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white font-bold shadow-lg shadow-[#1e3a8a]/20' 
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              {/* Borda lateral animada (só no item ativo) */}
              {activePage === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r"></div>
              )}
              
              <div className="flex items-center relative z-10">
                <item.icon 
                  className={`h-5 w-5 mr-3 transition-all ${
                    activePage === item.id ? 'text-white scale-110' : 'text-gray-400 group-hover:text-white group-hover:scale-105'
                  }`} 
                />
                <span className={`text-sm transition-all ${
                  activePage === item.id ? 'font-black' : 'font-semibold'
                }`}>
                  {item.label}
                </span>
              </div>
              
              {/* Badge Contador */}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full ml-2 animate-pulse shadow-lg shadow-red-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* 3. MENU BASE */}
        <div className="pt-4 pb-6 px-3 flex-shrink-0 mt-auto">
          <div className="border-t border-gray-700/30 mb-4 mx-2"></div>
          
          {bottomItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => { onNavigate(item.id); onClose(); }} 
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all group mb-1 ${
                activePage === item.id 
                  ? 'bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white font-bold shadow-lg' 
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className={`h-5 w-5 mr-3 transition-all ${
                activePage === item.id ? 'text-white scale-110' : 'text-gray-400 group-hover:text-white group-hover:scale-105'
              }`} />
              <span className={`text-sm ${activePage === item.id ? 'font-black' : 'font-semibold'}`}>
                {item.label}
              </span>
            </button>
          ))}

          {/* User Profile */}
          <div className="mt-4 pt-4 border-t border-gray-700/30">
            <div className="flex items-center justify-between group cursor-pointer px-2 py-2 rounded-xl hover:bg-white/5 transition-all">
              <div className="flex items-center flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg flex items-center justify-center">
                    <span className="text-sm font-black text-white">
                      {userName.charAt(0)}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#0a192f] rounded-full shadow-sm"></div>
                </div>
                
                <div className="ml-3 overflow-hidden flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors truncate" title={userName}>
                    {userName}
                  </p>
                  <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-black">
                    {userRole}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0"
                title="Sair do Sistema"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
