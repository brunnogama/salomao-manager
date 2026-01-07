import { useState } from 'react'
import { 
  LayoutDashboard, Users, CheckSquare, Settings, LogOut, 
  Menu, X, LayoutGrid, FileText, AlertTriangle 
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userEmail?: string;
}

export function Sidebar({ activeTab, setActiveTab, userEmail }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload() // Força o reload para voltar à tela de login/módulos
  }

  const handleSwitchModule = () => {
    // Recarrega a página para voltar à tela de Login/Seleção de Módulo
    window.location.reload()
  }

  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'kanban', label: 'Tarefas (Kanban)', icon: CheckSquare },
    { id: 'clientes', label: 'Base de Clientes', icon: Users },
    { id: 'incompletos', label: 'Cadastros Pendentes', icon: AlertTriangle },
    { id: 'config', label: 'Configurações', icon: Settings },
  ]

  return (
    <>
      {/* HEADER SUPERIOR (Mobile e Desktop) */}
      <div className="h-16 bg-[#112240] text-white flex items-center justify-between px-4 lg:px-6 shadow-md z-20 relative shrink-0">
        
        {/* LADO ESQUERDO: Menu Mobile + Título + TROCAR MÓDULO */}
        <div className="flex items-center gap-4">
          
          {/* Botão Hamburger (Só Mobile) */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1 rounded-md hover:bg-white/10"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Título do Sistema */}
          <div className="flex flex-col">
            <h1 className="text-lg font-bold leading-none tracking-tight">Salomão Manager</h1>
            <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Módulo Jurídico</span>
          </div>

          {/* --- NOVO LOCAL DO BOTÃO TROCAR MÓDULOS --- */}
          <div className="hidden sm:block h-6 w-px bg-white/20 mx-2"></div> {/* Separador vertical */}
          
          <button 
            onClick={handleSwitchModule}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold transition-all hover:scale-105"
            title="Voltar para seleção de módulos"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-blue-300" />
            <span>Trocar Módulo</span>
          </button>
        </div>

        {/* LADO DIREITO: Usuário + Sair */}
        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="hidden md:block text-xs text-gray-400">
              {userEmail}
            </span>
          )}
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-200 rounded-lg text-xs font-bold transition-colors border border-red-500/20"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>

      {/* SIDEBAR (Navegação Lateral) */}
      <div className={`
        fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:relative lg:translate-x-0 transition duration-200 ease-in-out
        w-64 bg-white border-r border-gray-200 z-10 flex flex-col pt-16 lg:pt-0
        h-full
      `}>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          
          {/* Item Mobile de Trocar Módulo (Aparece só no menu aberto em celular) */}
          <button 
            onClick={handleSwitchModule}
            className="lg:hidden w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg mb-4 border border-gray-100"
          >
            <LayoutGrid className="h-5 w-5 text-blue-600" />
            Trocar Módulo
          </button>

          {menuItems.map((item) => {
             const Icon = item.icon
             const isActive = activeTab === item.id
             
             return (
               <button
                 key={item.id}
                 onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                 className={`
                   w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all
                   ${isActive 
                     ? 'bg-[#112240] text-white shadow-md shadow-blue-900/20' 
                     : 'text-gray-500 hover:bg-gray-50 hover:text-[#112240]'}
                 `}
               >
                 <Icon className={`h-5 w-5 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
                 {item.label}
               </button>
             )
          })}
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
           <div className="flex items-center gap-3 px-2">
              <div className="h-8 w-8 rounded-full bg-[#112240] flex items-center justify-center text-white text-xs font-bold">
                SA
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-gray-900 truncate">Salomão Advogados</p>
                <p className="text-[10px] text-gray-500 truncate">© 2026 Flow Metrics</p>
              </div>
           </div>
        </div>
      </div>

      {/* Overlay para Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-0 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
