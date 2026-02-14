import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  FileWarning,
  X,
  Gavel,
  Truck,
  Briefcase
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const [incompleteCount, setIncompleteCount] = useState(0)
  const [userName, setUserName] = useState('Carregando...')
  const location = useLocation()
  const activePage = location.pathname

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.email) {
        const emailName = user.email.split('@')[0]
        const formattedName = emailName.split('.').map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
        setUserName(formattedName)
      }
    } catch (error) {
      console.error('Erro:', error)
      setUserName('Usuário')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const fetchCount = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*, contracts!inner(status)')
      .in('contracts.status', ['proposal_sent', 'closed'])
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

  useEffect(() => {
    fetchUserProfile()
    fetchCount()
    const interval = setInterval(fetchCount, 5000)
    return () => clearInterval(interval)
  }, [])

  const mainItems = [
    { path: '/crm/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/crm/clientes', label: 'Clientes', icon: Users },
    { path: '/crm/magistrados', label: 'Autoridades', icon: Gavel },
    { path: '/crm/incompletos', label: 'Incompletos', icon: FileWarning, badge: incompleteCount },
    { path: '/crm/logistica', label: 'Logística', icon: Truck },
    { path: '/crm/kanban', label: 'Kanban', icon: KanbanSquare },
  ]

  const isActive = (path: string) => activePage === path

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
        fixed md:static top-0 left-0 z-50 md:z-auto h-screen w-64 bg-[#0a192f] text-gray-300 flex flex-col font-sans border-r border-gray-800 shadow-2xl md:shadow-none
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

        {/* 1. HEADER - BRAND + MÓDULO */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-6">
            <img src="/so_logo-branca.png" alt="S" className="h-6 w-6 drop-shadow-md" />
            <div>
              <h2 className="text-sm font-bold text-white leading-none tracking-wide">GESTÃO</h2>
              <h2 className="text-xl font-black text-white leading-none tracking-wide mt-0.5">CLIENTES</h2>
            </div>
          </div>
          {/* Separator */}
          <div className="h-px bg-gray-800 mb-2" />
        </div>

        {/* 2. MENU PRINCIPAL */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {mainItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative ${isActive(item.path)
                ? 'bg-[#1e3a8a] text-white font-medium shadow-md'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
            >
              <div className="flex items-center">
                <item.icon
                  className={`h-5 w-5 mr-3 transition-colors ${isActive(item.path) ? 'text-white' : 'text-gray-400 group-hover:text-white'
                    }`}
                />
                <span className="text-sm">{item.label}</span>
              </div>

              {/* Badge para Incompletos */}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* 3. CARD DO USUÁRIO */}
        <div className="p-4 mt-auto">
          <div className="bg-gradient-to-b from-white/5 to-black/20 rounded-2xl p-4 border border-white/5 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4 pt-1">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1e3a8a] to-blue-600 flex items-center justify-center text-white border-2 border-white/10 shadow-lg">
                <span className="font-bold text-sm">{userName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{userName}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-[10px] text-blue-200 uppercase tracking-wider font-medium">Online</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                title="Mudar Módulo"
              >
                <LayoutDashboard className="w-4 h-4 text-blue-300 group-hover:text-white mb-1" />
                <span className="text-[8px] uppercase tracking-wider text-blue-300 group-hover:text-white font-bold">Módulos</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all group"
                title="Sair"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-red-400 group-hover:text-red-300 mb-1"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                <span className="text-[8px] uppercase tracking-wider text-red-400 group-hover:text-red-300 font-bold">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}