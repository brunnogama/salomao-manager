import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './Login'
import { Sidebar } from './components/Sidebar'
import { Clients } from './components/Clients'
import { Settings } from './components/Settings' // <--- IMPORTAR AQUI

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState('dashboard')

  const moduleDescriptions: Record<string, string> = {
    dashboard: 'Visão geral de performance e indicadores chave.',
    clientes: 'Gerencie a base de prospects e clientes ativos.',
    incompletos: 'Cadastros que necessitam de enriquecimento de dados.',
    kanban: 'Pipeline visual de negociações e status.',
    manual: 'Documentação e procedimentos operacionais padrão.',
    historico: 'Log de atividades e auditoria do sistema.',
    configuracoes: 'Preferências do sistema e gestão de acessos.'
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
    const namePart = session.user.email.split('@')[0]
    return namePart
      .split('.')
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#112240]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      <Sidebar 
        activePage={activePage} 
        onNavigate={setActivePage} 
        userName={getUserDisplayName()}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        <header className="bg-white border-b border-gray-200 h-20 flex items-center px-8 justify-between flex-shrink-0 z-10">
            <div className="flex flex-col justify-center">
                <h1 className="text-2xl font-bold text-[#112240] capitalize leading-tight">
                    {activePage}
                </h1>
                <span className="text-sm text-gray-500 font-normal">
                    {moduleDescriptions[activePage] || 'Gestão Estratégica'}
                </span>
            </div>
            <div></div>
        </header>

        <div className="p-8 flex-1 overflow-hidden h-full">
            
            {activePage === 'dashboard' && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full overflow-auto">
                    <h2 className="text-lg font-semibold mb-2">Resumo da Semana</h2>
                    <p className="text-gray-600">Seus gráficos de BI entrarão aqui em breve.</p>
                </div>
            )}

            {activePage === 'clientes' && <Clients />}

            {/* ADICIONADO AQUI: RENDERIZA CONFIGURAÇÕES */}
            {activePage === 'configuracoes' && <Settings />}

            {/* Outros módulos */}
            {activePage !== 'dashboard' && activePage !== 'clientes' && activePage !== 'configuracoes' && (
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
