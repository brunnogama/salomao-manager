import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './Login'
import { Sidebar } from './components/Sidebar'
import { Clients } from './components/Clients' // Importação da nova tela

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState('dashboard')

  useEffect(() => {
    // 1. Verificar sessão atual ao carregar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // 2. Escutar mudanças (Login ou Logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Função para formatar o nome do usuário baseado no email
  const getUserDisplayName = () => {
    if (!session?.user?.email) return 'Usuário'
    
    // Pega a parte antes do @ (ex: joao.silva)
    const namePart = session.user.email.split('@')[0]
    
    // Remove pontos e capitaliza (ex: Joao Silva)
    return namePart
      .split('.')
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }

  // TELA DE CARREGAMENTO
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#112240]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  // SE NÃO TIVER SESSÃO, MOSTRA LOGIN
  if (!session) {
    return <Login />
  }

  // SE TIVER SESSÃO, MOSTRA O SISTEMA
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* Sidebar Fixa */}
      <Sidebar 
        activePage={activePage} 
        onNavigate={setActivePage} 
        userName={getUserDisplayName()}
      />

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header Superior */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 justify-between flex-shrink-0 z-10">
            <h1 className="text-xl font-bold text-[#112240] capitalize flex items-center gap-2">
                {activePage}
            </h1>
            <div className="text-sm text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                Salomão Advogados
            </div>
        </header>

        {/* Conteúdo Variável */}
        <div className="p-8 flex-1 overflow-hidden h-full">
            
            {/* PÁGINA: DASHBOARD */}
            {activePage === 'dashboard' && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full overflow-auto">
                    <h2 className="text-lg font-semibold mb-2">Resumo da Semana</h2>
                    <p className="text-gray-600">Seus gráficos de BI entrarão aqui em breve.</p>
                </div>
            )}

            {/* PÁGINA: CLIENTES */}
            {activePage === 'clientes' && <Clients />}

            {/* PÁGINA: OUTROS (Placeholder) */}
            {activePage !== 'dashboard' && activePage !== 'clientes' && (
                <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center h-full overflow-auto">
                    <h2 className="text-lg font-semibold mb-2 text-gray-400">Módulo em Desenvolvimento</h2>
                    <p className="text-gray-500">A página <strong>{activePage}</strong> será implementada na próxima etapa.</p>
                </div>
            )}
        </div>
      </main>
    </div>
  )
}
