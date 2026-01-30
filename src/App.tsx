// src/App.tsx
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './Login'
import { Sidebar as CrmSidebar } from './components/crm/Sidebar'
import { Sidebar as RhSidebar } from './components/collaborators/Sidebar'
import { Sidebar as ExecutiveSidebar } from './components/secretaria/Sidebar'
import { SidebarFinanceiro } from './components/SidebarFinanceiro'

// Componentes
import { Clients } from './components/crm/Clients'
import { Magistrados } from './components/crm/Magistrados'
import { Settings } from './components/Settings'
import { IncompleteClients } from './components/crm/IncompleteClients'
import { Kanban } from './components/crm/Kanban'
import { Dashboard } from './components/crm/Dashboard'
import { History } from './components/crm/History'
import { Manual } from './components/crm/Manual'
import { WelcomeModal } from './components/WelcomeModal'
import { ModuleSelector } from './components/ModuleSelector'
import { UnderConstruction } from './components/UnderConstruction'
import { Presencial } from './components/collaborators/Presencial' 
import { Colaboradores } from './pages/Colaboradores'
import { Calendario } from './components/collaborators/Calendario'
import { GestaoFamilia } from './components/secretaria/GestaoFamilia'

import { Menu, LogOut, Grid, UserCircle } from 'lucide-react'
import { MODULE_CONFIG } from './config/modules'

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [currentModule, setCurrentModule] = useState<'home' | 'crm' | 'family' | 'collaborators' | 'financial' | 'operational' | 'settings' | 'executive' | 'legal-control'>('home')
  const [activePage, setActivePage] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [clientFilters, setClientFilters] = useState<{ socio?: string; brinde?: string }>({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setLoading(false);
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeModal')
      localStorage.clear(); sessionStorage.clear()
      if (hasSeenWelcome) localStorage.setItem('hasSeenWelcomeModal', hasSeenWelcome)
      await supabase.auth.signOut(); window.location.reload()
    } catch (error) { window.location.reload() }
  }

  const getUserDisplayName = () => {
    if (!session?.user?.email) return 'Usuário'
    return session.user.email.split('@')[0].split('.').map((p: any) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }

  // Lógica de metadados dinâmica
  const config = (MODULE_CONFIG as any)[currentModule] || MODULE_CONFIG.crm
  const CurrentIcon = config.icons[activePage]
  const currentTitle = config.titles[activePage] || activePage
  const currentDesc = config.descriptions[activePage]

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#112240]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>
  if (loggingOut) return <div className="h-screen w-full flex items-center justify-center bg-[#112240]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>
  if (!session) return <Login />
  if (currentModule === 'home') return <ModuleSelector onSelect={(m:any) => { setCurrentModule(m); setActivePage('dashboard') }} userName={getUserDisplayName()} />
  
  if (currentModule === 'settings') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-[#112240] h-20 flex items-center justify-between px-8 shadow-md text-white">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentModule('home')} className="p-2 hover:bg-white/10 rounded-lg"><Grid className="h-5 w-5" /></button>
            <img src="/logo-branca.png" alt="Salomão" className="h-10" />
            <span className="text-[10px] font-bold uppercase border border-yellow-700/30 px-3 py-1 rounded-lg">Configurações</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{getUserDisplayName()}</span>
            <button onClick={handleLogout}><LogOut className="h-5 w-5" /></button>
          </div>
        </header>
        <div className="p-8"><Settings /></div>
      </div>
    )
  }

  if (['family', 'operational', 'legal-control'].includes(currentModule)) {
    return <UnderConstruction moduleName={currentModule} onBack={() => setCurrentModule('home')} />
  }

  return (
    <>
      <WelcomeModal />
      <div className="flex h-screen bg-gray-100 overflow-hidden w-full">
        {currentModule === 'collaborators' ? (
          <RhSidebar activePage={activePage} onNavigate={setActivePage} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        ) : currentModule === 'financial' ? (
          <SidebarFinanceiro activePage={activePage} onNavigate={setActivePage} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        ) : currentModule === 'executive' ? (
          <ExecutiveSidebar activePage={activePage} onNavigate={setActivePage} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        ) : (
          <CrmSidebar activePage={activePage} onNavigate={setActivePage} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        )}

        <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
          <header className="bg-white border-b h-20 flex items-center px-4 md:px-8 justify-between flex-shrink-0 z-10">
            <div className="flex items-center gap-3 overflow-hidden">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2"><Menu /></button>
              {CurrentIcon && <div className="hidden md:flex h-10 w-10 rounded-lg bg-[#112240]/5 items-center justify-center text-[#112240]"><CurrentIcon /></div>}
              <div className="flex flex-col min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-[#112240] truncate">{currentTitle}</h1>
                <span className="text-xs text-gray-500 truncate hidden sm:block">{currentDesc}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="hidden md:flex flex-col items-end text-[#112240]"><span className="text-sm font-bold">{getUserDisplayName()}</span><span className="text-[10px] text-gray-500">Conectado</span></div>
              <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center border"><UserCircle /></div>
              <button onClick={() => setCurrentModule('home')} className="p-2 hover:bg-gray-100 rounded-lg"><Grid /></button>
              <button onClick={handleLogout} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><LogOut /></button>
            </div>
          </header>

          <div className="p-4 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
            {currentModule === 'crm' && (
              <>
                {activePage === 'dashboard' && <Dashboard onNavigateWithFilter={(p:any, f:any) => { setClientFilters(f); setActivePage(p); }} />}
                {activePage === 'clientes' && <Clients initialFilters={clientFilters} />}
                {activePage === 'magistrados' && <Magistrados />}
                {activePage === 'incompletos' && <IncompleteClients />}
                {activePage === 'logistica' && <UnderConstruction moduleName={activePage} onBack={() => setActivePage('dashboard')} />}
                {activePage === 'manual' && <Manual />}
                {activePage === 'kanban' && <Kanban />}
                {activePage === 'historico' && <History />}
              </>
            )}

            {currentModule === 'collaborators' && (
              <>
                {activePage === 'dashboard' && <UnderConstruction moduleName="Dash RH" onBack={() => {}} showBackButton={false} />}
                {activePage === 'calendario' && <Calendario />}
                {activePage === 'presencial' && <Presencial />}
                {activePage === 'colaboradores' && <Colaboradores />}
                {activePage === 'kanban' && <Kanban />}
                {['evolucao', 'tempo-casa', 'headcount', 'turnover', 'vagas', 'remuneracao', 'acoes', 'ged'].includes(activePage) && <UnderConstruction moduleName={activePage} onBack={() => setActivePage('dashboard')} />}
              </>
            )}

            {currentModule === 'financial' && (
              <>
                {activePage === 'dashboard' && <UnderConstruction moduleName="Dash Financeiro" onBack={() => {}} showBackButton={false} />}
                {activePage === 'historico' && <History />}
                {['contas-pagar', 'contas-receber', 'gestao-aeronave', 'ged'].includes(activePage) && <UnderConstruction moduleName={activePage} onBack={() => setActivePage('dashboard')} />}
              </>
            )}

            {currentModule === 'executive' && (
              <>
                {activePage === 'gestao-familia' && <GestaoFamilia />}
                {['dashboard', 'calendario', 'despesas', 'ged'].includes(activePage) && (
                  <UnderConstruction moduleName={`Secretaria: ${activePage}`} onBack={() => setActivePage('dashboard')} />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  )
}