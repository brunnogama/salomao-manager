import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './Login'
import { Sidebar } from './components/Sidebar'
import { Clients } from './components/Clients'
import { Settings } from './components/Settings'
import { IncompleteClients } from './components/IncompleteClients'
import { Kanban } from './components/Kanban'
import { Dashboard } from './components/Dashboard'
import { History } from './components/History'
import { Menu } from 'lucide-react'
import { ModuleSelector } from './components/ModuleSelector' // Novo
import { UnderConstruction } from './components/UnderConstruction' // Novo

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Controle de Navegação Principal
  const [currentModule, setCurrentModule] = useState<'home' | 'crm' | 'family' | 'collaborators'>('home')
  
  // Controle do CRM
  const [activePage, setActivePage] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [clientFilters, setClientFilters] = useState<{ socio?: string; brinde?: string }>({})

  const moduleDescriptions: Record<string, string> = {
    dashboard: 'Visão geral de performance e indicadores chave.',
    clientes: 'Gerencie a base de prospects e clientes ativos.',
    incompletos: 'Atenção: Cadastros que necessitam de preenchimento.',
    kanban: 'Gerencie suas tarefas de forma visual.',
    configuracoes: 'Preferências do sistema e gestão de acessos.',
    historico: 'Audit Log: Rastreabilidade de ações no sistema.'
  }

  const pageTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    clientes: 'Clientes',
    incompletos: 'Cadastros Incompletos',
    kanban: 'Kanban',
    configuracoes: 'Configurações',
    historico: 'Histórico de Atividades'
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

  const navigateWithFilter = (page: string, filters: { socio?: string; brinde?: string }) => {
    setClientFilters(filters)
    setActivePage(page)
  }

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#112240]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>
  
  // 1. Se não tiver sessão, mostra Login
  if (!session) return <Login />

  // 2. Se tiver sessão mas nenhum módulo escolhido, mostra o Seletor
  if (currentModule === 'home') {
    return <ModuleSelector onSelect={setCurrentModule} userName={getUserDisplayName()} />
  }

  // 3. Se escolheu Família ou Colaboradores, mostra Em Construção
  if (currentModule === 'family') {
    return <UnderConstruction moduleName="Gestão da Família" onBack={() => setCurrentModule('home')} />
  }
  if (currentModule === 'collaborators') {
    return <UnderConstruction moduleName="Colaboradores" onBack={() => setCurrentModule('home')} />
  }

  // 4. Se escolheu CRM, mostra o sistema completo
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden w-full">
      <Sidebar 
        activePage={activePage} 
        onNavigate={setActivePage} 
        userName={getUserDisplayName()} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSwitchModule={() => setCurrentModule('home')} // Passando a função de voltar
      />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 relative">
        <header className="bg-white border-b border-gray-200 h-20 flex items-center px-4 md:px-8 justify-between flex-shrink-0 z-10 gap-3">
            
            <div className="flex items-center gap-3 overflow-hidden">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg shrink-0"
                >
                  <Menu className="h-6 w-6" />
                </button>

                <div className="flex flex-col justify-center min-w-0">
                    <h1 className="text-xl md:text-2xl font-bold text-[#112240] capitalize leading-tight truncate">
                        {pageTitles[activePage] || activePage}
                    </h1>
                    <span className="text-xs md:text-sm text-gray-500 font-normal truncate hidden sm:block">
                        {moduleDescriptions[activePage]}
                    </span>
                </div>
            </div>

            <div className="flex-shrink-0">
                <span className="text-2xl font-extrabold text-[#112240] tracking-tighter opacity-90 select-none">
                    CRM
                </span>
            </div>

        </header>
        
        <div className="p-4 md:p-8 flex-1 overflow-hidden h-full">
            {activePage === 'dashboard' && <Dashboard onNavigateWithFilter={navigateWithFilter} />}
            {activePage === 'clientes' && <Clients initialFilters={clientFilters} />}
            {activePage === 'incompletos' && <IncompleteClients />}
            {activePage === 'kanban' && <Kanban />}
            {activePage === 'historico' && <History />} 
            {activePage === 'configuracoes' && (
                <div className="h-full overflow-y-auto pr-2 custom-scrollbar"><Settings /></div>
            )}
        </div>
      </main>
    </div>
  )
}
