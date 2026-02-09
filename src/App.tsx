//src/App.tsx
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './Login'
import ResetPassword from './ResetPassword'
import { ModuleSelector } from './components/ModuleSelector'
import { Sidebar as CrmSidebar } from './components/crm/Sidebar'
import { Sidebar as RhSidebar } from './components/collaborators/Sidebar'
import { Sidebar as ExecutiveSidebar } from './components/secretaria/Sidebar'
import { SidebarFinanceiro } from './components/finance/SidebarFinanceiro'

// Componentes CRM
import { Clients } from './components/crm/Clients'
import { Magistrados } from './components/crm/Magistrados'
import { Settings } from './components/Settings'
import { IncompleteClients } from './components/crm/IncompleteClients'
import { Kanban } from './components/crm/Kanban'
import { Dashboard } from './components/crm/Dashboard'
import { History } from './components/crm/History'
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
import { GestaoAeronave } from './pages/GestaoAeronave' // Nova importação
import { GED } from './components/finance/pages/GED'
import { Calendario as CalendarioFinanceiro } from './components/finance/pages/Calendario'
import { ListaOAB } from './components/finance/pages/ListaOAB'
import { FinanceDashboard } from './components/finance/pages/FinanceDashboard'
import { FinanceContasPagar } from './components/finance/pages/FinanceContasPagar'
import { FinanceContasReceber } from './components/finance/contasareceber/pages/FinanceContasReceber'

import { Menu, LogOut, Grid } from 'lucide-react'

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [currentModule, setCurrentModule] = useState<'home' | 'crm' | 'family' | 'collaborators' | 'financial' | 'operational' | 'settings' | 'executive' | 'legal-control'>('home')
  const [activePage, setActivePage] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [clientFilters, setClientFilters] = useState<{ socio?: string; brinde?: string }>({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setLoading(false);
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true)
      }
    })
    
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
  
  if (isResettingPassword) return <ResetPassword />
  if (!session) return <Login />
  
  if (currentModule === 'home') return <ModuleSelector onSelect={(m:any) => { setCurrentModule(m); setActivePage('dashboard') }} userName={getUserDisplayName()} />
  
  if (currentModule === 'settings') {
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
          <div className="md:hidden bg-white border-b px-4 py-3 flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Menu className="h-5 w-5 text-gray-600" /></button>
          </div>

          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
            
            {/* --- MÓDULO CRM --- */}
            {currentModule === 'crm' && (
              <>
                {activePage === 'dashboard' && (
                  <Dashboard 
                    userName={getUserDisplayName()}
                    onModuleHome={() => setCurrentModule('home')}
                    onLogout={handleLogout}
                    onNavigateWithFilter={(p:any, f:any) => { setClientFilters(f); setActivePage(p); }} 
                  />
                )}
                {activePage === 'clientes' && (
                  <Clients 
                    initialFilters={clientFilters} 
                    userName={getUserDisplayName()} 
                    onModuleHome={() => setCurrentModule('home')} 
                    onLogout={handleLogout} 
                    />
                )}
                {activePage === 'magistrados' && (
                  <Magistrados 
                    userName={getUserDisplayName()} 
                    onModuleHome={() => setCurrentModule('home')} 
                    onLogout={handleLogout} 
                  />
                )}
                {activePage === 'incompletos' && (
                  <IncompleteClients 
                    userName={getUserDisplayName()} 
                    onModuleHome={() => setCurrentModule('home')} 
                    onLogout={handleLogout} 
                  />
                )}
                {activePage === 'manual' && <Manual />}
                {activePage === 'kanban' && (
                  <Kanban 
                    userName={getUserDisplayName()} 
                    onModuleHome={() => setCurrentModule('home')} 
                    onLogout={handleLogout} 
                  />
                )}
                {activePage === 'historico' && <History />}
              </>
            )}

            {/* --- MÓDULO RH (COLABORADORES) --- */}
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
                {activePage === 'kanban' && (
                  <Kanban 
                    userName={getUserDisplayName()} 
                    onModuleHome={() => setCurrentModule('home')} 
                    onLogout={handleLogout} 
                  />
                )}
              </>
            )}

            {/* --- MÓDULO FINANCEIRO --- */}
            {currentModule === 'financial' && (
              <>
                {activePage === 'dashboard' && (
                  <FinanceDashboard 
                    userName={getUserDisplayName()} 
                    onModuleHome={() => setCurrentModule('home')} 
                    onLogout={handleLogout} 
                  />
                )}
                {activePage === 'calendario' && <CalendarioFinanceiro userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'contas-pagar' && (
                  <FinanceContasPagar 
                    userName={getUserDisplayName()} 
                    onModuleHome={() => setCurrentModule('home')} 
                    onLogout={handleLogout} 
                  />
                )}
                {activePage === 'contas-receber' && (
                  <FinanceContasReceber 
                    userName={getUserDisplayName()} 
                    userEmail={session?.user?.email}
                    onModuleHome={() => setCurrentModule('home')} 
                    onLogout={handleLogout} 
                  />
                )}
                {activePage === 'oab' && (
                  <ListaOAB 
                    userName={getUserDisplayName()} 
                    onModuleHome={() => setCurrentModule('home')} 
                    onLogout={handleLogout} 
                  />
                )}
                
                {/* Gestão da Aeronave (Atualizado) */}
                {activePage === 'gestao-aeronave' && (
                  <GestaoAeronave 
                    userName={getUserDisplayName()} 
                    onModuleHome={() => setCurrentModule('home')} 
                    onLogout={handleLogout} 
                  />
                )}

                {activePage === 'ged' && (
                  <GED 
                    userName={getUserDisplayName()} 
                    onModuleHome={() => setCurrentModule('home')} 
                    onLogout={handleLogout} 
                  />
                )}
                {activePage === 'historico' && <History />}
              </>
            )}

            {/* --- MÓDULO EXECUTIVO --- */}
            {currentModule === 'executive' && (
              <>
                {activePage === 'dashboard' && <SecretariaExecutivaDashboard userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {/* ALTERAÇÃO AQUI: Aceita 'agenda' ou 'calendario' para evitar tela branca */}
                {(activePage === 'agenda' || activePage === 'calendario') && <SecretariaExecutivaCalendario userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'despesas' && <SecretariaExecutivaDespesas userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'ged' && <SecretariaExecutivaGED userName={getUserDisplayName()} onModuleHome={() => setCurrentModule('home')} onLogout={handleLogout} />}
                {activePage === 'gestao-familia' && (
                  <GestaoFamilia 
                    userName={getUserDisplayName()} 
                    onModuleHome={() => setCurrentModule('home')} 
                    onLogout={handleLogout} 
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  )
}