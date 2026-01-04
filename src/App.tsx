import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './Login'
import { Sidebar } from './components/Sidebar'

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState('dashboard') // Controla qual página aparece

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

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#112240]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  // Se NÃO estiver logado, mostra Login
  if (!session) {
    return <Login />
  }

  // Se ESTIVER logado, mostra o Layout do Sistema
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* Sidebar Fixa */}
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 overflow-auto">
        
        {/* Header Superior (Título da Página) */}
        <header className="bg-white shadow-sm h-16 flex items-center px-8 justify-between">
            <h1 className="text-xl font-bold text-[#112240] capitalize">
                {activePage}
            </h1>
            <div className="text-sm text-gray-500">
                Salomão Advogados
            </div>
        </header>

        {/* Conteúdo Variável */}
        <div className="p-8">
            {activePage === 'dashboard' && (
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h2 className="text-lg font-semibold mb-2">Resumo da Semana</h2>
                    <p className="text-gray-600">O conteúdo dos gráficos entrará aqui.</p>
                </div>
            )}

            {activePage === 'clientes' && (
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h2 className="text-lg font-semibold mb-2">Gestão de Clientes</h2>
                    <p className="text-gray-600">Lista de clientes entrará aqui.</p>
                </div>
            )}
            
            {activePage === 'kanban' && (
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h2 className="text-lg font-semibold mb-2">Kanban de Processos</h2>
                    <p className="text-gray-600">Quadro visual entrará aqui.</p>
                </div>
            )}
        </div>
      </main>
    </div>
  )
}
