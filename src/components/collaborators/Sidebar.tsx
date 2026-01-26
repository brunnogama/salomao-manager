import { 
  LayoutDashboard, 
  MapPin, 
  KanbanSquare, 
  History, 
  X 
} from 'lucide-react'

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ activePage, onNavigate, isOpen, onClose }: SidebarProps) {
  
  const mainItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'presencial', label: 'Presencial', icon: MapPin },
    { id: 'kanban', label: 'Kanban', icon: KanbanSquare },
    { id: 'historico', label: 'Histórico', icon: History },
  ]

  return (
    <>
      {/* Overlay Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity" 
          onClick={onClose} 
        />
      )}
      
      <aside className={`fixed md:static inset-y-0 left-0 z-50 h-[100dvh] w-64 bg-[#112240] text-gray-300 flex flex-col font-sans border-r border-gray-800 flex-shrink-0 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-2xl md:shadow-none`}>
      
        {/* 1. HEADER LOGO */}
        <div className="flex flex-col flex-shrink-0 relative bg-[#112240] pt-6 pb-4 px-6">
          <div className="flex flex-col items-center w-full gap-4">
            <img src="/logo-branca.png" alt="Salomão" className="h-11 w-auto object-contain block" />
            <div className="bg-green-950/30 border border-green-800/30 rounded-lg px-4 py-2 w-full">
                <span className="text-[10px] text-green-300 font-bold tracking-[0.25em] uppercase leading-none whitespace-nowrap block text-center">Módulo RH</span>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden absolute right-4 top-6 p-1 hover:bg-white/10 rounded text-gray-400 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* 2. MENU PRINCIPAL */}
        <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1 custom-scrollbar pt-6">
          {mainItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => { onNavigate(item.id); onClose(); }} 
              className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all group ${
                activePage === item.id 
                  ? 'bg-[#1e3a8a] text-white font-medium shadow-md border-l-4 border-yellow-500' 
                  : 'hover:bg-white/5 hover:text-white border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center">
                <item.icon className={`h-5 w-5 mr-3 ${activePage === item.id ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                <span className="text-sm">{item.label}</span>
              </div>
            </button>
          ))}
        </div>
        
      </aside>
    </>
  )
}