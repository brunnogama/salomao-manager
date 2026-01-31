import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  FileSignature, 
  DollarSign, 
  BarChart3, 
  ShieldCheck, 
  Users, 
  KanbanSquare, 
  FolderOpen,
  History,
  Settings,
  LogOut,
  Share2,
  X,
  Grid
} from 'lucide-react';
import { supabase } from '../../../lib/supabase'; // Caminho ajustado para a lib do Manager

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: string;      // Adicionado para controle de estado
  onNavigate: (page: string) => void; // Adicionado para navegação interna
}

export function Sidebar({ isOpen, onClose, activePage, onNavigate }: SidebarProps) {
  const [userName, setUserName] = useState('Carregando...');
  const [userRole, setUserRole] = useState('Administrador');

  const menuItems = [
    { label: 'Dashboard', id: 'dashboard', icon: LayoutDashboard },
    { label: 'Casos', id: 'contratos', icon: FileSignature },
    { label: 'Propostas', id: 'propostas', icon: FileText },
    { label: 'Financeiro', id: 'financeiro', icon: DollarSign },
    { label: 'Jurimetria', id: 'jurimetria', icon: Share2 },
    { label: 'Volumetria', id: 'volumetria', icon: BarChart3 },
    { label: 'Compliance', id: 'compliance', icon: ShieldCheck },
    { label: 'Clientes', id: 'clientes', icon: Users },
    { label: 'Kanban', id: 'kanban', icon: KanbanSquare },
    { label: 'GED', id: 'ged', icon: FolderOpen },
  ];

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const emailName = user.email.split('@')[0];
        const formattedName = emailName
          .split('.')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
        setUserName(formattedName);
      }
    };
    getUserData();
  }, []);

  const handleLogout = async () => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeModal');
    localStorage.clear();
    sessionStorage.clear();
    if (hasSeenWelcome) localStorage.setItem('hasSeenWelcomeModal', hasSeenWelcome);
    await supabase.auth.signOut();
    window.location.reload();
  };

  const NavItem = ({ item }: { item: any }) => {
    const isActive = activePage === item.id;
    return (
      <button
        onClick={() => { onNavigate(item.id); onClose(); }}
        className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all group ${
          isActive
            ? 'bg-[#1e3a8a] text-white font-medium shadow-md border-l-4 border-amber-500' 
            : 'hover:bg-white/5 hover:text-white border-l-4 border-transparent text-gray-400'
        }`}
      >
        <div className="flex items-center">
          <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
          <span className="text-sm">{item.label}</span>
        </div>
      </button>
    );
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}

      <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-[#112240] text-gray-300 flex flex-col border-r border-gray-800 shadow-2xl transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white md:hidden">
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col pt-6 pb-4 px-6 gap-4">
          <img src="/logo-branca.png" alt="Salomão" className="h-11 w-auto object-contain mx-auto" />
          
          {/* Botão para voltar ao Seletor de Módulos */}
          <button 
            onClick={() => window.location.reload()} 
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-xs font-bold py-2 rounded-lg border border-white/10 transition-colors"
          >
            <Grid className="w-3 h-3" /> VOLTAR AO MENU
          </button>

          <div className="bg-blue-950/30 border border-blue-800/30 rounded-lg px-2 py-2 text-center">
            <span className="text-[9px] text-blue-300 font-bold tracking-[0.2em] uppercase">Controladoria Jurídica</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1 custom-scrollbar">
          {menuItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </nav>

        <div className="pt-4 pb-6 px-3 bg-[#112240] mt-auto">
          <div className="border-t border-gray-700/50 mb-4 mx-2" />
          
          <button 
            onClick={() => { onNavigate('historico'); onClose(); }}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors group mb-1 ${activePage === 'historico' ? 'bg-[#1e3a8a] text-white' : 'hover:bg-white/5 text-gray-400'}`}
          >
            <History className="h-5 w-5 mr-3" /> <span className="text-sm">Histórico</span>
          </button>
          
          <button 
            onClick={() => { onNavigate('configuracoes'); onClose(); }}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors group ${activePage === 'configuracoes' ? 'bg-[#1e3a8a] text-white' : 'hover:bg-white/5 text-gray-400'}`}
          >
            <Settings className="h-5 w-5 mr-3" /> <span className="text-sm">Configurações</span>
          </button>

          <div className="mt-4 pt-4 border-t border-gray-700/50 flex items-center justify-between px-2">
            <div className="flex items-center overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">{userName.charAt(0)}</span>
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-xs font-medium text-gray-300 truncate w-24">{userName}</p>
                <p className="text-[9px] text-gray-500 uppercase">{userRole}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-400 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}