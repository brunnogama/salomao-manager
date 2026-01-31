import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './Login'
import { Sidebar as CrmSidebar } from './components/crm/Sidebar'
import { Sidebar as RhSidebar } from './components/collaborators/Sidebar'
import { Sidebar as ExecutiveSidebar } from './components/secretaria/Sidebar'
import { SidebarFinanceiro } from './components/finance/SidebarFinanceiro'

// CORREÇÃO: Caminho da Sidebar da Controladoria incluindo a subpasta /src
import { Sidebar as ControladoriaSidebar } from './components/controladoria/components/Sidebar'
// Componentes CRM/Base
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

// Componentes RH
import { Presencial } from './components/collaborators/pages/Presencial' 
import { Colaboradores } from './components/collaborators/pages/Colaboradores'
import { Calendario } from './components/collaborators/pages/Calendario'

// Componentes Secretaria
import { GestaoFamilia } from './components/secretaria/GestaoFamilia'

// CORREÇÃO: Componentes Controladoria (Caminhos atualizados para incluir /src)
import { Dashboard as ControlDashboard } from './components/controladoria/pages/Dashboard'
import { Contracts as ControlContracts } from './components/controladoria/pages/Contracts'
import { Clients as ControlClients } from './components/controladoria/pages/Clients'
import { Kanban as ControlKanban } from './components/controladoria/pages/Kanban'
import { Finance as ControlFinance } from './components/controladoria/pages/Finance'
import { GED as ControlGED } from './components/controladoria/src/GED'
import { Proposals as ControlProposals } from './components/controladoria/pages/Proposals'
import { Jurimetria as ControlJurimetria } from './components/controladoria/pages/Jurimetria'
import { Volumetry as ControlVolumetry } from './components/controladoria/pages/Volumetry'
import { History as ControlHistory } from './components/controladoria/pages/History'

import { Menu, LogOut, Grid } from 'lucide-react'
import { Toaster } from 'sonner'

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

  if (loading || loggingOut) return <div className="h-screen w-full flex items-center justify-center bg-[#112240]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>
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

  if (['family', 'operational'].includes(currentModule)) {
    return <UnderConstruction moduleName={currentModule} onBack={() => setCurrentModule('home')} />
  }

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <WelcomeModal />
      <div className="flex h-screen bg-gray-100 overflow-hidden w-full">
        {/* SIDEBARS */}
        {currentModule === 'collaborators' ? (
          <RhSidebar activePage={activePage} onNavigate={setActivePage} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        ) : currentModule === 'financial' ? (
          <SidebarFinanceiro activePage={activePage} onNavigate={setActivePage} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        ) : currentModule === 'executive' ? (
          <ExecutiveSidebar activePage={activePage} onNavigate={setActivePage} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        ) : currentModule === 'legal-control' ? (
          <ControladoriaSidebar activePage={activePage} onNavigate={setActivePage} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        ) : (
          <CrmSidebar activePage={activePage} onNavigate={setActivePage} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        )}

        <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
          <div className="md:hidden bg-white border-b px-4 py-3 flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
            {/* RENDERIZAÇÃO CRM */}
            {currentModule === 'crm' && (
              <>
                {activePage === 'dashboard' && <Dashboard onNavigateWithFilter={(p:any, f:any) => { setClientFilters(f); setActivePage(p); }} />}
                {activePage === 'clientes' && <Clients initialFilters={clientFilters} />}
                {activePage === 'magistrados' && <Magistrados />}
                {activePage === 'incompletos' && <IncompleteClients />}
                {activePage === 'manual' && <Manual />}
                {activePage === 'kanban' && <Kanban />}
                {activePage === 'historico' && <History />}
              </>
            )}

            {/* RENDERIZAÇÃO CONTROLADORIA */}
            {currentModule === 'legal-control' && (
              <>
                {activePage === 'dashboard' && <ControlDashboard />}
                {activePage === 'contratos' && <ControlContracts />}
                {activePage === 'clientes' && <ControlClients />}
                {activePage === 'kanban' && <ControlKanban />}
                {activePage === 'financeiro' && <ControlFinance />}
                {activePage === 'ged' && <ControlGED />}
                {activePage === 'propostas' && <ControlProposals />}
                {activePage === 'jurimetria' && <ControlJurimetria />}
                {activePage === 'volumetria' && <ControlVolumetry />}
                {activePage === 'historico' && <ControlHistory />}
                {activePage === 'compliance' && <UnderConstruction moduleName="Compliance & Riscos" onBack={() => setActivePage('dashboard')} />}
              </>
            )}

            {/* MÓDULOS RH / FINANCEIRO / SECRETARIA (MANTIDOS) */}
            {currentModule === 'collaborators' && (
              <>
                {activePage === 'dashboard' && <UnderConstruction moduleName="Dash RH" onBack={() => {}} showBackButton={false} />}
                {activePage === 'calendario' && <Calendario userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'presencial' && <Presencial userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'colaboradores' && <Colaboradores userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'kanban' && <Kanban />}
              </>
            )}

            {currentModule === 'financial' && (
              <>
                {activePage === 'dashboard' && <UnderConstruction moduleName="Dash Financeiro" onBack={() => {}} showBackButton={false} />}
                {activePage === 'historico' && <History />}
              </>
            )}

            {currentModule === 'executive' && (
              <>
                {activePage === 'gestao-familia' && <GestaoFamilia />}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  )
}