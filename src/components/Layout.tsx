import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, DollarSign,
  KanbanSquare, FileSpreadsheet, FolderOpen, Share2,
  BarChart3, History, Settings, LogOut, Menu, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ============================================
// 🔍 SISTEMA DE DEBUG
// ============================================
console.log('📦 Layout.tsx - Arquivo carregado');

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileText, label: 'Casos', path: '/contracts' },
  { icon: Users, label: 'Clientes', path: '/clients' },
  { icon: DollarSign, label: 'Financeiro', path: '/finance' },
  { icon: KanbanSquare, label: 'Kanban', path: '/kanban' },
  { icon: FileSpreadsheet, label: 'Propostas', path: '/proposals' },
  { icon: FolderOpen, label: 'GED', path: '/ged' },
  { icon: Share2, label: 'Jurimetria', path: '/jurimetria' },
  { icon: BarChart3, label: 'Volumetria', path: '/volumetry' },
  { icon: History, label: 'Histórico', path: '/history' },
  { icon: Settings, label: 'Configurações', path: '/settings' }
];

console.log('📋 Menu items configurados:', menuItems.map(m => m.label));

export function Layout() {
  console.log('🔄 Layout - Componente renderizando');

  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email?: string } | null>(null);

  console.log('📍 Localização atual:', location.pathname);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          name: data.user.user_metadata?.name || 'Usuário',
          email: data.user.email
        });
      }
    });
  }, []);

  const currentModule = menuItems.find(m => m.path === location.pathname) || { label: 'Módulo', icon: LayoutDashboard };

  const handleLogout = async () => {
    console.log('🚪 Logout iniciado');
    try {
      await supabase.auth.signOut();
      console.log('✅ Logout bem-sucedido');
      navigate('/login');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  console.log('✅ Layout - Render concluído, retornando JSX');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#0a192f] text-white shadow-2xl transition-all duration-300">
        {/* Top: Favicon + Module Name */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-4 mb-6">
            <img src="/logo-branca.png" alt="Icon" className="h-8 w-8 drop-shadow-lg" />
            <div className="px-3 py-1.5 bg-white/10 rounded-lg border border-white/10 backdrop-blur-sm shadow-inner">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100 block text-center min-w-[80px]">
                {currentModule.label}
              </span>
            </div>
          </div>
          {/* Separator */}
          <div className="h-px bg-gradient-to-r from-transparent via-blue-800 to-transparent mb-2" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${isActive
                  ? 'bg-[#1e3a8a] text-white shadow-lg shadow-blue-900/50 translate-x-1'
                  : 'text-blue-200 hover:bg-white/5 hover:text-white hover:translate-x-1'
                  }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-sm font-bold tracking-wide">{item.label}</span>
                {isActive && (
                  <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: User Card */}
        <div className="p-4 mt-auto">
          <div className="bg-gradient-to-b from-white/5 to-black/20 rounded-2xl p-4 border border-white/5 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4 pt-1">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1e3a8a] to-blue-600 flex items-center justify-center text-white border-2 border-white/10 shadow-lg">
                <span className="font-bold text-sm">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{user?.name || 'Usuário'}</p>
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
                <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-300 mb-1" />
                <span className="text-[8px] uppercase tracking-wider text-red-400 group-hover:text-red-300 font-bold">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar Mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
        <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#0a192f] text-white shadow-2xl flex flex-col">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo-branca.png" alt="Logo" className="h-8 w-8" />
              <span className="font-bold text-lg">Menu</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-white/5 rounded-lg text-white/70 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => {
                    handleNavigate(item.path);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                    ? 'bg-[#1e3a8a] text-white shadow-lg'
                    : 'text-blue-100 hover:bg-white/5'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/5">
            {/* Mobile User Info Simplified */}
            <div className="flex items-center justify-between gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#1e3a8a] flex items-center justify-center font-bold text-xs">{user?.name?.charAt(0) || 'U'}</div>
                <div className="text-xs">
                  <p className="font-bold text-white max-w-[100px] truncate">{user?.name || 'Usuário'}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 text-red-400 bg-red-500/10 rounded-lg">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#f0f2f5]">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between lg:hidden shadow-sm z-10 relative">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-700">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-gray-800 uppercase tracking-widest text-xs">{currentModule.label}</span>
          <img src="/logo-branca.png" alt="Logo" className="h-8 w-8" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

console.log('✅ Layout.tsx - Arquivo completamente carregado');