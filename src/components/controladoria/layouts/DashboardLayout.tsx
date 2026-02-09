import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar'; // Rota mantida/conferida para a estrutura da controladoria
import { Menu } from 'lucide-react';

export function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      
      {/* Header Mobile - Manager Style */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0a192f] border-b border-white/10 px-6 h-20 flex items-center shadow-2xl">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="p-2.5 -ml-2 rounded-xl bg-white/5 border border-white/10 text-white transition-all active:scale-95 shadow-inner"
          >
            <Menu className="w-6 h-6 text-amber-500" />
          </button>
          <div className="ml-4 flex flex-col">
            <span className="font-black text-white text-[10px] uppercase tracking-[0.3em] leading-none">Salomão Advogados</span>
            <span className="font-bold text-amber-500/50 text-[8px] uppercase tracking-[0.2em] mt-1">Controladoria</span>
          </div>
      </div>

      {/* Sidebar - Passando controle de estado para navegação modular */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Conteúdo Principal - Layout Adaptativo Manager */}
      <main className="flex-1 p-4 md:p-10 pt-28 md:pt-10 md:ml-64 transition-all duration-500 ease-in-out">
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-700">
          <Outlet />
        </div>
      </main>
    </div>
  );
}