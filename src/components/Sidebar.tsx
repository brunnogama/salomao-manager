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
  X,
  Grid // Ícone para "Módulos"
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onSwitchModule: () => void;
}

export function Sidebar({ activePage, onNavigate, userName, isOpen, onClose, onSwitchModule }: SidebarProps) {
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

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Erro silencioso ao deslogar:", error)
    } finally {
      localStorage.clear()
      window.location.href = '/'
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
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        h-[100dvh] w-64 bg-[#112240] text-gray-300 flex flex-col font-sans border-r border-gray-800 flex-shrink-0
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

        {/* USUÁRIO & AÇÕES (REDESENHADO) */}
        <div className="p-4 bg-[#0d1b33] flex-shrink-0 pb-8 md:pb-4">
          <div className="rounded-xl bg-[#112240] border border-gray-800/50 p-3 shadow-sm">
              
              {/* Linha 1: Identificação (Avatar + Nome) */}
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-700/50">
                  <div className="h-10 w-10 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-200 border border-blue-800/30 shrink-0">
                    <UserCircle className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate leading-tight" title={userName}>{userName}</p>
                    <p className="text-[10px] text-gray-500 font-medium truncate">Usuário Conectado</p>
                  </div>
              </div>

              {/* Linha 2: Botões de Ação (Módulos | Sair) */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={onSwitchModule} 
                  className="flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg bg-gray-800/50 hover:bg-blue-600/20 text-gray-400 hover:text-blue-300 transition-all border border-transparent hover:border-blue-500/30 text-xs font-medium group"
                  title="Trocar Módulo"
                >
                    <Grid className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                    <span>Módulos</span>
                </button>
                <button 
                  onClick={handleLogout} 
                  className="flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg bg-gray-800/50 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all border border-transparent hover:border-red-500/30 text-xs font-medium group"
                  title="Sair"
                >
                    <LogOut className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                    <span>Sair</span>
                </button>
              </div>
          </div>
        </div>
      </aside>
    </>
  )
}
