import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './Login'
import { Sidebar } from './components/Sidebar'
import { Clients } from './components/Clients'
import { Magistrados } from './components/Magistrados'
import { Settings } from './components/Settings'
import { IncompleteClients } from './components/IncompleteClients'
import { Kanban } from './components/Kanban'
import { Dashboard } from './components/Dashboard'
import { History } from './components/History'
import { Manual } from './components/Manual'
import { WelcomeModal } from './components/WelcomeModal'
import { Menu, LogOut, Grid, UserCircle } from 'lucide-react'
import { ModuleSelector } from './components/ModuleSelector'
import { UnderConstruction } from './components/UnderConstruction'


export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  
  const [currentModule, setCurrentModule] = useState<'home' | 'crm' | 'family' | 'collaborators'>('home')
  const [activePage, setActivePage] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [clientFilters, setClientFilters] = useState<{ socio?: string; brinde?: string }>({})

  const moduleDescriptions: Record<string, string> = {
    dashboard: 'Visão geral de performance e indicadores chave.',
    clientes: 'Gerencie a base de prospects e clientes ativos.',
    magistrados: 'Área restrita para relacionamento com magistrados.',
    incompletos: 'Atenção: Cadastros que necessitam de preenchimento.',
    kanban: 'Gerencie suas tarefas de forma visual.',
    configuracoes: 'Preferências do sistema e gestão de acessos.',
    historico: 'Audit Log: Rastreabilidade de ações no sistema.',
    manual: 'Documentação completa e guias de uso.'
  }

  const pageTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    clientes: 'Clientes',
    magistrados: 'Magistrados',
    incompletos: 'Cadastros Incompletos',
    kanban: 'Kanban',
    configuracoes: 'Configurações',
    historico: 'Histórico de Atividades',
    manual: 'Manual do Sistema'
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const getUserDisplayName = () => {
    if (!session?.user?.email) return 'Usuário'
    return session.user.email.split('@')[0].split('.').map((p:any) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    
    try {
      // Limpar localStorage
      localStorage.clear()
      
      // Fazer signOut (aguarda conclusão)
      await supabase.auth.signOut()
      
      // Atualizar estado (mostra Login sem flash)
      setSession(null)
    } catch (error) {
      console.error("Erro ao deslogar:", error)
      setSession(null)
    } finally {
      setLoggingOut(false)
    }
  }

  const navigateWithFilter = (page: string, filters: { socio?: string; brinde?: string }) => {
    setClientFilters(filters)
    setActivePage(page)
  }

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#112240]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>
  if (loggingOut) return <div className="h-screen w-full flex items-center justify-center bg-[#112240]"><div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div><p className="text-white text-sm">Saindo...</p></div></div>
  if (!session) return <Login />

  if (currentModule === 'home') return <ModuleSelector onSelect={setCurrentModule} userName={getUserDisplayName()} />
  if (currentModule === 'family') return <UnderConstruction moduleName="Gestão da Família" onBack={() => setCurrentModule('home')} />
  if (currentModule === 'collaborators') return <UnderConstruction moduleName="Colaboradores" onBack={() => setCurrentModule('home')} />

  return (
    <>
      {/* Modal de Boas-Vindas LGPD */}
      <WelcomeModal />

      <div className="flex h-screen bg-gray-100 overflow-hidden w-full">
        <Sidebar activePage={activePage} onNavigate={setActivePage} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 relative">
          <header className="bg-white border-b border-gray-200 h-20 flex items-center px-4 md:px-8 justify-between flex-shrink-0 z-10 gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                  <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg shrink-0"><Menu className="h-6 w-6" /></button>
                  <div className="flex flex-col justify-center min-w-0">
                      <h1 className="text-xl md:text-2xl font-bold text-[#112240] capitalize leading-tight truncate">{pageTitles[activePage] || activePage}</h1>
                      <span className="text-xs md:text-sm text-gray-500 font-normal truncate hidden sm:block">{moduleDescriptions[activePage]}</span>
                  </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
                  <div className="hidden md:flex flex-col items-end"><span className="text-sm font-bold text-[#112240] leading-none">{getUserDisplayName()}</span><span className="text-[10px] text-gray-500 mt-0.5">Conectado</span></div>
                  <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center text-[#112240] border border-blue-100"><UserCircle className="h-5 w-5" /></div>
                  <div className="h-8 w-px bg-gray-200 mx-1"></div>
                  <div className="flex items-center gap-2">
                      <button onClick={() => setCurrentModule('home')} className="p-2 text-gray-500 hover:text-[#112240] hover:bg-gray-100 rounded-lg transition-colors" title="Trocar Módulo"><Grid className="h-5 w-5" /></button>
                      <button onClick={handleLogout} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sair do Sistema"><LogOut className="h-5 w-5" /></button>
                  </div>
              </div>
          </header>
          
          <div className="p-4 md:p-8 flex-1 overflow-hidden h-full">
              <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                  {activePage === 'dashboard' && <Dashboard onNavigateWithFilter={navigateWithFilter} />}
                  {activePage === 'clientes' && <Clients initialFilters={clientFilters} />}
                  {activePage === 'magistrados' && <Magistrados />} 
                  {activePage === 'incompletos' && <IncompleteClients />}
                  {activePage === 'kanban' && <Kanban />}
                  {activePage === 'historico' && <History />} 
                  {activePage === 'manual' && <Manual />} 
                  {activePage === 'configuracoes' && <Settings />}
              </div>
          </div>
        </main>
      </div>
    </>
  )
}