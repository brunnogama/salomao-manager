import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  Users, 
  KanbanSquare, 
  BookOpen, 
  History, 
  Settings, 
  LogOut,
  UserCircle,
  FileWarning,
  X 
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ activePage, onNavigate, userName, isOpen, onClose }: SidebarProps) {
  const [incompleteCount, setIncompleteCount] = useState(0)

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
        if (!c.socio) missing.push('Sócio')
        
        return missing.filter(f => !ignored.includes(f)).length > 0
      }).length
      setIncompleteCount(count)
    }
  }

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 5000)
    return () => clearInterval(interval)
  }, [])

  // --- LOGOUT BLINDADO ---
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    // 1. Tenta avisar o Supabase (SignOut)
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Erro silencioso ao deslogar:", error)
    } finally {
      // 2. INDEPENDENTE de erro ou sucesso, força a limpeza local e o reload
      localStorage.clear() // Limpa qualquer lixo local
      window.location.href = '/' // Força o reload para a tela de login
    }
  }
  
  const mainItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'incompletos', label: 'Incompletos', icon: FileWarning, badge: incompleteCount },
    { id: 'kanban', label: 'Kanban', icon: KanbanSquare },
  ]

  const bottomItems = [
    { id: 'manual', label: 'Manual do Sistema', icon: BookOpen },
    { id: 'historico', label: 'Histórico', icon: History },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ]

  return (
    <>
      {/* OVERLAY MOBILE */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        h-screen w-64 bg-[#112240] text-gray-300 flex flex-col font-sans border-r border-gray-800 flex-shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 shadow-2xl md:shadow-none
      `}>
      
        {/* LOGO */}
        <div className="h-24 flex items-center justify-between px-6 bg-[#112240] flex-shrink-0">
          <img src="/logo-branca.png" alt="Salomão" className="h-12 w-auto object-contain" />
          <button onClick={onClose} className="md:hidden p-1 hover:bg-white/10 rounded text-gray-400">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* MENU TOPO */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
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
                <item.icon className={`h-5 w-5 mr-3 ${activePage === item.id ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                <span className="text-sm">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* MENU BASE */}
        <div className="pt-4 pb-2 px-3 bg-[#112240] flex-shrink-0">
          <div className="border-t border-gray-700/50 mb-4 mx-2"></div>
          {bottomItems.map((item) => (
             <button
             key={item.id}
             onClick={() => { onNavigate(item.id); onClose(); }}
             className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors group ${
               activePage === item.id ? 'bg-[#1e3a8a] text-white' : 'hover:bg-white/5 hover:text-white'
             }`}
           >
             <item.icon className="h-5 w-5 mr-3 text-gray-400 group-hover:text-white" />
             <span className="text-sm">{item.label}</span>
           </button>
          ))}
        </div>

        {/* USUÁRIO & LOGOUT */}
        <div className="p-4 bg-[#0d1b33] flex-shrink-0">
          <div className="flex items-center justify-between rounded-lg bg-[#112240] p-3 border border-gray-800/50">
              <div className="flex items-center gap-3">
                  <UserCircle className="h-8 w-8 text-gray-400" />
                  <span className="text-sm font-medium text-white truncate capitalize leading-none">
                    {userName}
                  </span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-red-500 hover:text-red-400 transition-colors p-1 hover:bg-white/5 rounded"
                title="Sair do Sistema"
              >
                  <LogOut className="h-5 w-5" />
              </button>
          </div>
        </div>
      </aside>
    </>
  )
}
