import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './Login'
import ResetPassword from './ResetPassword'
import { ErrorBoundary } from './components/ErrorBoundary';
import { ModuleSelector } from './components/ModuleSelector'
import { Sidebar as CrmSidebar } from './components/crm/Sidebar'
import { Sidebar as RhSidebar } from './components/collaborators/Sidebar'
import { Sidebar as ExecutiveSidebar } from './components/secretaria/Sidebar'
import { SidebarFinanceiro } from './components/finance/SidebarFinanceiro'

// ============================================
// 🔍 SISTEMA DE DEBUG
// ============================================
console.log('📦 App.tsx - Arquivo carregado');

// Sidebar da Controladoria (Componente de Layout)
import { Sidebar as ControladoriaSidebar } from './components/layout/Sidebar.tsx'

// Componentes CRM
import { Clients } from './components/crm/Clients'
import { Magistrados } from './components/crm/Magistrados'
import { Settings } from './components/Settings'
import { IncompleteClients } from './components/crm/IncompleteClients'
import { Kanban as CrmKanban } from './components/crm/Kanban' 
import { Dashboard as CrmDashboard } from './components/crm/Dashboard' 
import { History as CrmHistory } from './components/crm/History' 
import { Manual } from './components/crm/Manual'
import { WelcomeModal } from './components/WelcomeModal'
import { UnderConstruction } from './components/UnderConstruction'

// Componentes RH
import { Presencial } from './components/collaborators/pages/Presencial' 
import { Colaboradores } from './components/collaborators/pages/Colaboradores'
import { Calendario as CalendarioRH } from './components/collaborators/pages/Calendario'
import { RHDashboard } from './components/collaborators/pages/RHDashboard'
import { RHEvolucaoPessoal } from './components/collaborators/pages/RHEvolucaoPessoal'
import { RHTempoCasa } from './components/collaborators/pages/RHTempoCasa'
import { RHHeadcount } from './components/collaborators/pages/RHHeadcount'
import { RHTurnover } from './components/collaborators/pages/RHTurnover'
import { RHVagas } from './components/collaborators/pages/RHVagas'
import { RHRemuneracao } from './components/collaborators/pages/RHRemuneracao'
import { RHAcoes } from './components/collaborators/pages/RHAcoes'
import { RHGED } from './components/collaborators/pages/RHGED'

// Componentes Executivo
import { GestaoFamilia } from './components/secretaria/GestaoFamilia'
import { SecretariaExecutivaDashboard } from './components/secretaria/pages/SecretariaExecutivaDashboard'
import { SecretariaExecutivaCalendario } from './components/secretaria/pages/SecretariaExecutivaCalendario'
import { SecretariaExecutivaDespesas } from './components/secretaria/pages/SecretariaExecutivaDespesas'
import { SecretariaExecutivaGED } from './components/secretaria/pages/SecretariaExecutivaGED'

// Componentes Financeiro
import { GestaoAeronave } from './pages/GestaoAeronave'
import { GED as FinanceGED } from './components/finance/pages/GED'
import { Calendario as CalendarioFinanceiro } from './components/finance/pages/Calendario'
import { ListaOAB } from './components/finance/pages/ListaOAB'
import { FinanceDashboard } from './components/finance/pages/FinanceDashboard'
import { FinanceContasPagar } from './components/finance/pages/FinanceContasPagar'
import { FinanceContasReceber } from './components/finance/contasareceber/pages/FinanceContasReceber'

// --- PÁGINAS DA CONTROLADORIA ---
import { Dashboard as ControlDashboard } from './components/controladoria/pages/Dashboard'
import { Contracts as ControlContracts } from './components/controladoria/pages/Contracts'
import { Clients as ControlClients } from './components/controladoria/pages/Clients'
import { Kanban as ControlKanban } from './components/controladoria/pages/Kanban'
import { Finance as ControlFinance } from './components/controladoria/pages/Finance'
import { GED as ControlGED } from './components/controladoria/pages/GED'
import { Proposals as ControlProposals } from './components/controladoria/pages/Proposals'
import { Jurimetria as ControlJurimetria } from './components/controladoria/pages/Jurimetria'
import { Volumetry as ControlVolumetry } from './components/controladoria/pages/Volumetry'
import { History as ControlHistory } from './components/controladoria/pages/History'
import { Settings as ControlSettings } from './components/controladoria/pages/Settings'

import { Menu, LogOut, Grid } from 'lucide-react'
import { Toaster } from 'sonner'

console.log('✅ Todos os componentes importados');

export default function App() {
  console.log('🔄 App - Renderizando');
  
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [currentModule, setCurrentModule] = useState<'home' | 'crm' | 'family' | 'collaborators' | 'financial' | 'operational' | 'settings' | 'executive' | 'legal-control'>('home')
  const [activePage, setActivePage] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [clientFilters, setClientFilters] = useState<{ socio?: string; brinde?: string }>({})

  console.log('📊 Estado atual:', { currentModule, activePage, isSidebarOpen });

  useEffect(() => {
    console.log('🔐 Verificando sessão...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('✅ Sessão obtida:', !!session);
      setSession(session); setLoading(false);
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event);
      setSession(session)
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    console.log('🚪 Logout iniciado');
    setLoggingOut(true)
    try {
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeModal')
      localStorage.clear(); sessionStorage.clear()
      if (hasSeenWelcome) localStorage.setItem('hasSeenWelcomeModal', hasSeenWelcome)
      await supabase.auth.signOut(); window.location.reload()
    } catch (error) { 
      console.error('❌ Erro no logout:', error);
      window.location.reload() 
    }
  }

  const getUserDisplayName = () => {
    if (!session?.user?.email) return 'Usuário'
    return session.user.email.split('@')[0].split('.').map((p: any) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }

  if (loading || loggingOut) {
    console.log('⏳ Carregando...');
    return <div className="h-screen w-full flex items-center justify-center bg-[#112240]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>
  }
  
  if (isResettingPassword) {
    console.log('🔑 Resetando senha');
    return <ResetPassword />
  }
  
  if (!session) {
    console.log('🔓 Sem sessão - Mostrando login');
    return <Login />
  }
  
  if (currentModule === 'home') {
    console.log('🏠 Mostrando seletor de módulos');
    return <ModuleSelector onSelect={(m:any) => { 
      console.log('📌 Módulo selecionado:', m);
      setCurrentModule(m); 
      setActivePage('dashboard') 
    }} userName={getUserDisplayName()} />
  }
  
  if (currentModule === 'settings') {
    console.log('⚙️ Mostrando configurações');
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-[#112240] h-20 flex items-center justify-between px-8 shadow-md text-white">
          <div className="flex items-center gap-4">
            <img src="/logo-branca.png" alt="Salomão" className="h-10" />
            <span className="text-[10px] font-bold uppercase border border-yellow-700/30 px-3 py-1 rounded-lg">Configurações</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-medium">{getUserDisplayName()}</span>
            <div className="h-8 w-[1px] bg-white/20 mx-2" />
            <button onClick={() => setCurrentModule('home')} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Mudar Módulo">
              <Grid className="h-5 w-5" />
            </button>
            <button onClick={handleLogout} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors" title="Sair">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>
        <div className="p-8">
          <Settings onModuleHome={() => setCurrentModule('home')} />
        </div>
      </div>
    )
  }

  if (['family', 'operational'].includes(currentModule)) {
    console.log('🚧 Módulo em construção:', currentModule);
    return <UnderConstruction moduleName={currentModule} onBack={() => setCurrentModule('home')} />
  }

  console.log('✅ Renderizando módulo:', currentModule);

  return (
    <ErrorBoundary>
      <Toaster position="top-right" richColors closeButton />
      <WelcomeModal />
      <div className="flex h-screen bg-gray-100 overflow-hidden w-full">
        {currentModule === 'collaborators' ? (
          <RhSidebar activePage={activePage} onNavigate={setActivePage} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        ) : currentModule === 'financial' ? (
          <SidebarFinanceiro activePage={activePage} onNavigate={setActivePage} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        ) : currentModule === 'executive' ? (
          <ExecutiveSidebar activePage={activePage} onNavigate={setActivePage} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        ) : currentModule === 'legal-control' ? (
          <ErrorBoundary>
            {console.log('🔍 Renderizando ControladoriaSidebar')}
            <ControladoriaSidebar 
              activePage={activePage} 
              onNavigate={(page) => {
                console.log('🧭 ControladoriaSidebar - Navegação solicitada:', page);
                console.log('🧭 Página anterior:', activePage);
                try {
                  setActivePage(page);
                  console.log('✅ setActivePage executado');
                } catch (error) {
                  console.error('❌ ERRO ao mudar página:', error);
                }
              }} 
              isOpen={isSidebarOpen} 
              onClose={() => {
                console.log('🚪 Fechando sidebar');
                setIsSidebarOpen(false);
              }} 
            />
          </ErrorBoundary>
        ) : (
          <CrmSidebar activePage={activePage} onNavigate={setActivePage} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        )}

        <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
          <div className="md:hidden bg-white border-b px-4 py-3 flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Menu className="h-5 w-5 text-gray-600" /></button>
          </div>

          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
            
            {currentModule === 'crm' && (
              <>
                {activePage === 'dashboard' && (<CrmDashboard userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} onNavigateWithFilter={(p:any, f:any) => { setClientFilters(f); setActivePage(p); }} />)}
                {activePage === 'clientes' && (<Clients initialFilters={clientFilters} userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />)}
                {activePage === 'magistrados' && (<Magistrados userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />)}
                {activePage === 'incompletos' && (<IncompleteClients userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />)}
                {activePage === 'manual' && <Manual />}
                {activePage === 'kanban' && (<CrmKanban userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />)}
                {activePage === 'historico' && <CrmHistory />}
              </>
            )}

            {currentModule === 'collaborators' && (
              <>
                {activePage === 'dashboard' && <RHDashboard userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'calendario' && <CalendarioRH userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'presencial' && <Presencial userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'colaboradores' && <Colaboradores userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'evolucao' && <RHEvolucaoPessoal userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'tempo-casa' && <RHTempoCasa userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'headcount' && <RHHeadcount userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'turnover' && <RHTurnover userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'vagas' && <RHVagas userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'remuneracao' && <RHRemuneracao userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'acoes' && <RHAcoes userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'ged' && <RHGED userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
              </>
            )}

            {currentModule === 'financial' && (
              <>
                {activePage === 'dashboard' && (<FinanceDashboard userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />)}
                {activePage === 'calendario' && <CalendarioFinanceiro userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'contas-pagar' && (<FinanceContasPagar userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />)}
                {activePage === 'contas-receber' && (<FinanceContasReceber userName={getUserDisplayName()} userEmail={session?.user?.email} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />)}
                {activePage === 'oab' && (<ListaOAB userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />)}
                {activePage === 'gestao-aeronave' && (<GestaoAeronave userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />)}
                {activePage === 'ged' && (<FinanceGED userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />)}
              </>
            )}

            {currentModule === 'executive' && (
              <>
                {activePage === 'dashboard' && <SecretariaExecutivaDashboard userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {(activePage === 'agenda' || activePage === 'calendario') && <SecretariaExecutivaCalendario userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'despesas' && <SecretariaExecutivaDespesas userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'ged' && <SecretariaExecutivaGED userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'gestao-familia' && (<GestaoFamilia userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />)}
              </>
            )}

            {/* --- MÓDULO CONTROLADORIA JURÍDICA --- */}
            {currentModule === 'legal-control' && (
              <ErrorBoundary>
                {console.log('🎬 Renderizando página da Controladoria:', activePage)}
                {activePage === 'dashboard' && (<ErrorBoundary><ControlDashboard userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} /></ErrorBoundary>)}
                {activePage === 'contratos' && (<ErrorBoundary><ControlContracts userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} /></ErrorBoundary>)}
                {activePage === 'clientes' && (<ErrorBoundary><ControlClients userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} /></ErrorBoundary>)}
                {activePage === 'kanban' && (<ErrorBoundary><ControlKanban userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} /></ErrorBoundary>)}
                {activePage === 'financeiro' && (<ErrorBoundary><ControlFinance userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} /></ErrorBoundary>)}
                {activePage === 'ged' && (<ErrorBoundary><ControlGED userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} /></ErrorBoundary>)}
                {activePage === 'propostas' && (<ErrorBoundary><ControlProposals userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} /></ErrorBoundary>)}
                {activePage === 'jurimetria' && (<ErrorBoundary><ControlJurimetria userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} /></ErrorBoundary>)}
                {activePage === 'volumetria' && (<ErrorBoundary><ControlVolumetry userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} /></ErrorBoundary>)}
                {activePage === 'historico' && (<ErrorBoundary><ControlHistory userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} /></ErrorBoundary>)}
                {activePage === 'configuracoes' && (<ErrorBoundary><ControlSettings userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} /></ErrorBoundary>)}
              </ErrorBoundary>
            )}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}

console.log('✅ App.tsx - Arquivo completamente carregado');