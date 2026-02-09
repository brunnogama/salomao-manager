import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  X 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Carregando...');
  const [userRole, setUserRole] = useState('');

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Casos', path: '/contratos', icon: FileSignature },
    { label: 'Propostas', path: '/propostas', icon: FileText },
    { label: 'Financeiro', path: '/financeiro', icon: DollarSign },
    { label: 'Jurimetria', path: '/jurimetria', icon: Share2 },
    { label: 'Volumetria', path: '/volumetria', icon: BarChart3 },
    { label: 'Compliance', path: '/compliance', icon: ShieldCheck },
    { label: 'Clientes', path: '/clientes', icon: Users },
    { label: 'Kanban', path: '/kanban', icon: KanbanSquare },
    { label: 'GED', path: '/ged', icon: FolderOpen },
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, role')
            .eq('id', user.id)
            .single();

          if (profile) {
            if (profile.name) {
                setUserName(profile.name);
            } else if (user.email) {
                const emailName = user.email.split('@')[0];
                const formattedName = emailName
                  .split('.')
                  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(' ');
                setUserName(formattedName);
            }

            const roleLabels: Record<string, string> = {
                admin: 'Administrador',
                editor: 'Editor',
                viewer: 'Visualizador'
            };
            setUserRole(roleLabels[profile.role] || 'Usuário');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        setUserName('Usuário');
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <>
      {/* Backdrop Escuro (Apenas Mobile) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-[#0a192f]/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Estilo Manager Navy */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-[#0a192f] text-gray-100 flex flex-col font-sans border-r border-white/10 shadow-2xl
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}>
        
        {/* Botão Fechar (Apenas Mobile) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors md:hidden rounded-lg hover:bg-white/5"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 1. HEADER LOGO - Padronizado Gold */}
        <div className="flex flex-col flex-shrink-0 relative pt-8 pb-6 px-6 border-b border-white/5">
          <div className="flex flex-col items-center w-full gap-5">
            <img 
              src="/logo-branca.png" 
              alt="Salomão Advogados" 
              className="h-10 w-auto object-contain block"
            />
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-full backdrop-blur-sm">
              <span className="text-[9px] text-amber-500 font-black tracking-[0.3em] uppercase leading-none whitespace-nowrap block text-center">
                Módulo Controladoria
              </span>
            </div>
          </div>
        </div>

        {/* 2. MENU PRINCIPAL - Estilo Densa */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `w-full flex items-center px-4 py-3 rounded-xl transition-all group border-l-4 ${
                  isActive
                    ? 'bg-white/10 text-white font-bold border-amber-500 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon 
                    className={`h-4 w-4 mr-3 transition-colors flex-shrink-0 ${
                      isActive ? 'text-amber-500' : 'text-gray-500 group-hover:text-amber-400'
                    }`} 
                  />
                  <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* 3. MENU BASE / PROFILE */}
        <div className="pt-4 pb-8 px-4 bg-[#0a192f] flex-shrink-0 mt-auto border-t border-white/5">
          
          <NavLink 
            to="/historico" 
            onClick={onClose}
            className={({ isActive }) => 
              `w-full flex items-center px-4 py-2.5 rounded-xl transition-all group mb-1 ${
                isActive ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:text-white'
              }`
            }
          >
            <History className="h-4 w-4 mr-3 text-gray-500 group-hover:text-amber-400 flex-shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest">Histórico</span>
          </NavLink>
          
          <NavLink 
            to="/configuracoes" 
            onClick={onClose}
            className={({ isActive }) => 
              `w-full flex items-center px-4 py-2.5 rounded-xl transition-all group ${
                isActive ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:text-white'
              }`
            }
          >
            <Settings className="h-4 w-4 mr-3 text-gray-500 group-hover:text-amber-400 flex-shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest">Ajustes</span>
          </NavLink>

          {/* User Profile Card */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 group transition-all">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-[2px]">
                    <div className="w-full h-full rounded-[10px] bg-[#0a192f] flex items-center justify-center">
                      <span className="text-xs font-black text-white">
                        {userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white truncate uppercase tracking-tighter" title={userName}>
                    {userName}
                  </p>
                  <p className="text-[8px] text-amber-500/70 uppercase tracking-[0.2em] font-black">
                    {userRole}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all flex-shrink-0 ml-2"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}