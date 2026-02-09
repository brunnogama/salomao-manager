import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Menu } from 'lucide-react';

export function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* Header Mobile - Visível apenas em telas pequenas */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0a192f] border-b border-white/10 px-4 h-16 flex items-center shadow-lg">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="p-2 -ml-2 rounded-xl hover:bg-white/10 text-white transition-all active:scale-95"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-3 font-black text-white text-xs uppercase tracking-[0.2em]">Salomão Advogados</span>
      </div>

      {/* Sidebar com controle de estado */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Conteúdo Principal com padding ajustado para o header mobile */}
      <main className="flex-1 p-4 md:p-8 pt-24 md:pt-8 md:ml-64 transition-all duration-300">
        <div className="max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}