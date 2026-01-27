import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  MapPin, 
  KanbanSquare, 
  History, 
  X,
  LogOut,
  Users,
  TrendingUp,
  Clock,
  BarChart3,
  RefreshCw,
  Briefcase,
  Banknote,
  Megaphone,
  FolderSearch 
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ activePage, onNavigate, isOpen, onClose }: SidebarProps) {
  const [userName, setUserName] = useState('Carregando...')
  const [userRole, setUserRole] = useState('')

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Busca dados na tabela usuarios_permitidos (ajustado para a tabela correta usada no Settings.tsx)
        const { data: profile } = await supabase
          .from('usuarios_permitidos')
          .select('cargo')
          .eq('email', user.email)
          .single()

        if (user.email) {
          const emailName = user.email.split('@')[0]
          const formattedName = emailName
            .split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')
          setUserName(formattedName)
        }

        if (profile) {
          setUserRole(profile.cargo || 'Colaborador')
        } else {
          setUserRole('Colaborador')
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
      setUserName('Usuário')
    }
  }

  useEffect(() => {
    fetchUserProfile()
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
    { id: 'presencial', label: 'Presencial', icon: MapPin },
    
    // Novo item Colaboradores
    { id: 'colaboradores', label: 'Colaboradores', icon: Users },
    
    { id: 'evolucao', label: 'Evolução de Pessoal', icon: TrendingUp },
    { id: 'tempo-casa', label: 'Tempo de casa', icon: Clock },
    { id: 'headcount', label: 'Headcount', icon: BarChart3 },
    { id: 'turnover', label: 'Turnover', icon: RefreshCw },
    { id: 'vagas', label: 'Vagas', icon: Briefcase },
    { id: 'remuneracao', label: 'Remuneração', icon: Banknote },
    { id: 'acoes', label: 'Ações', icon: Megaphone },
    { id: 'kanban', label: 'Kanban', icon: KanbanSquare },
    { id: 'ged', label: 'GED', icon: FolderSearch },
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
            <div className="bg-green-950/30 border border-green-800/30 rounded-lg px-4 py-2 w-full">
              <span className="text-[10px] text-green-300 font-bold tracking-[0.25em] uppercase leading-none whitespace-nowrap block text-center">
                Módulo RH
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
            </button>
          ))}
        </nav>

        {/* 3. MENU BASE COM HISTÓRICO E USER PROFILE */}
        <div className="pt-4 pb-6 px-3 bg-[#112240] flex-shrink-0 mt-auto">
          <div className="border-t border-gray-700/50 mb-4 mx-2"></div>

          {/* Histórico */}
          <button 
            onClick={() => { onNavigate('historico'); onClose(); }} 
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors group mb-1 ${
              activePage === 'historico' ? 'bg-[#1e3a8a] text-white' : 'hover:bg-white/5 hover:text-white'
            }`}
          >
            <History className="h-5 w-5 mr-3 text-gray-400 group-hover:text-white" />
            <span className="text-sm">Histórico</span>
          </button>

          <div className="border-t border-gray-700/50 my-4 mx-2"></div>

          {/* User Profile */}
          <div className="flex items-center justify-between group cursor-pointer px-2">
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