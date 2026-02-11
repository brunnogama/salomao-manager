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

  console.log('📍 Localização atual:', location.pathname);

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
    console.log('🧭 Navegação solicitada para:', path);
    console.log('🧭 De:', location.pathname);
    
    try {
      console.log('🧭 Chamando navigate...');
      navigate(path);
      console.log('✅ Navigate executado com sucesso');
      setIsSidebarOpen(false);
      console.log('✅ Sidebar fechada');
    } catch (error) {
      console.error('❌ ERRO na navegação:', error);
      console.error('❌ Stack:', (error as Error).stack);
    }
  };

  console.log('✅ Layout - Render concluído, retornando JSX');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-salomao-blue text-white shadow-2xl">
        <div className="p-6 border-b border-blue-900/30">
          <div className="flex items-center gap-3">
            <img src="/logo.fm.png" alt="FlowMetrics" className="h-10 w-auto" />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            console.log(`📌 Renderizando menu item ${index}:`, item.label, 'Ativo:', isActive);
            
            return (
              <button
                key={item.path}
                onClick={() => {
                  console.log(`🖱️ CLICK detectado no item: ${item.label}`);
                  console.log(`🖱️ Path de destino: ${item.path}`);
                  handleNavigate(item.path);
                }}
                className={`w-full flex items-center gap-3 px-6 py-3 transition-all ${
                  isActive 
                    ? 'bg-white/10 border-r-4 border-salomao-gold text-white font-semibold' 
                    : 'text-blue-100 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-blue-900/30">
          <button
            onClick={() => {
              console.log('🖱️ CLICK detectado no LOGOUT');
              handleLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-blue-100 hover:bg-white/5 hover:text-white rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)}></div>
        <aside className="absolute left-0 top-0 bottom-0 w-64 bg-salomao-blue text-white shadow-2xl">
          <div className="p-6 border-b border-blue-900/30 flex justify-between items-center">
            <img src="/logo.fm.png" alt="FlowMetrics" className="h-10 w-auto" />
            <button onClick={() => setIsSidebarOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    console.log(`🖱️ MOBILE CLICK: ${item.label}`);
                    handleNavigate(item.path);
                  }}
                  className={`w-full flex items-center gap-3 px-6 py-3 transition-all ${
                    isActive 
                      ? 'bg-white/10 border-r-4 border-salomao-gold text-white font-semibold' 
                      : 'text-blue-100 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-blue-900/30">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-blue-100 hover:bg-white/5 hover:text-white rounded-lg transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Sair</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between lg:hidden">
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <img src="/logo.fm.png" alt="FlowMetrics" className="h-8 w-auto" />
          <div className="w-6"></div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="h-full">
            {console.log('🎬 Renderizando Outlet')}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

console.log('✅ Layout.tsx - Arquivo completamente carregado');