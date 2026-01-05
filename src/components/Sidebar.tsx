import { 
  LayoutDashboard, 
  Users, 
  KanbanSquare, 
  BookOpen, 
  History, 
  Settings, 
  LogOut,
  UserCircle,
  FileWarning // Ícone para Incompletos
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  userName: string;
}

export function Sidebar({ activePage, onNavigate, userName }: SidebarProps) {
  
  // Lista Principal (Focada no CRM)
  const mainItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'incompletos', label: 'Incompletos', icon: FileWarning },
    { id: 'kanban', label: 'Kanban', icon: KanbanSquare },
  ]

  // Lista Inferior (Utilitários)
  const bottomItems = [
    { id: 'manual', label: 'Manual do Sistema', icon: BookOpen },
    { id: 'historico', label: 'Histórico', icon: History },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ]

  return (
    <div className="h-screen w-64 bg-[#112240] text-gray-300 flex flex-col font-sans border-r border-gray-800 flex-shrink-0">
      
      {/* 1. Logo */}
      <div className="h-24 flex items-center px-6 bg-[#112240] flex-shrink-0">
        <img src="/logo-branca.png" alt="Salomão" className="h-12 w-auto object-contain" />
      </div>

      {/* 2. Menu Principal (Topo) */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {mainItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-all group ${
              activePage === item.id 
                ? 'bg-[#1e3a8a] text-white font-medium shadow-md border-l-4 border-salomao-gold' 
                : 'hover:bg-white/5 hover:text-white border-l-4 border-transparent'
            }`}
          >
            <item.icon className={`h-5 w-5 mr-3 ${activePage === item.id ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </div>

      {/* 3. Menu Inferior (Manual, Histórico, Config) */}
      <div className="pt-4 pb-2 px-3 bg-[#112240] flex-shrink-0">
        <div className="border-t border-gray-700/50 mb-4 mx-2"></div>
        
        {bottomItems.map((item) => (
           <button
           key={item.id}
           onClick={() => onNavigate(item.id)}
           className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors group ${
               activePage === item.id ? 'bg-[#1e3a8a] text-white' : 'hover:bg-white/5 hover:text-white'
           }`}
         >
           <item.icon className="h-5 w-5 mr-3 text-gray-400 group-hover:text-white" />
           <span className="text-sm">{item.label}</span>
         </button>
        ))}
      </div>

      {/* 4. Rodapé do Usuário */}
      <div className="p-4 bg-[#0d1b33] flex-shrink-0">
        <div className="flex items-center justify-between rounded-lg bg-[#112240] p-3 border border-gray-800/50">
            
            {/* Lado Esquerdo: Ícone e Nome */}
            <div className="flex items-center gap-3">
                <UserCircle className="h-8 w-8 text-gray-400" />
                <span className="text-sm font-medium text-white truncate capitalize leading-none">
                  {userName}
                </span>
            </div>

            {/* Lado Direito: Botão de Sair */}
            <button 
              onClick={() => supabase.auth.signOut()}
              className="text-red-500 hover:text-red-400 transition-colors p-1 hover:bg-white/5 rounded"
              title="Sair do Sistema"
            >
                <LogOut className="h-5 w-5" />
            </button>
        </div>
      </div>
    </div>
  )
}
