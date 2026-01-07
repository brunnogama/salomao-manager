import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './Login'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { Kanban } from './components/Kanban'
import { Clients } from './components/Clients'
import { IncompleteClients } from './components/IncompleteClients'
import { Settings } from './components/Settings'

// Componente para seleção de módulo (placeholder simples para lógica futura)
function ModuleSelector({ onSelect }: { onSelect: (module: string) => void }) {
    return (
        <div className="min-h-screen bg-[#112240] flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <h1 className="text-3xl font-bold text-white mb-8 text-center">Selecione o Módulo de Acesso</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button onClick={() => onSelect('CRM')} className="bg-white p-8 rounded-xl hover:scale-105 transition-transform group text-left">
                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">CRM</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Jurídico (CRM)</h3>
                        <p className="text-sm text-gray-500">Gestão de clientes, brindes e tarefas do escritório.</p>
                    </button>
                    <button disabled className="bg-gray-100 p-8 rounded-xl opacity-60 cursor-not-allowed text-left">
                        <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center mb-4 text-gray-400 font-bold">FAM</div>
                        <h3 className="text-xl font-bold text-gray-500 mb-2">Família</h3>
                        <p className="text-sm text-gray-400">Em desenvolvimento.</p>
                    </button>
                    <button disabled className="bg-gray-100 p-8 rounded-xl opacity-60 cursor-not-allowed text-left">
                        <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center mb-4 text-gray-400 font-bold">RH</div>
                        <h3 className="text-xl font-bold text-gray-500 mb-2">Colaboradores</h3>
                        <p className="text-sm text-gray-400">Em desenvolvimento.</p>
                    </button>
                </div>
            </div>
        </div>
    )
}

function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [clientFilters, setClientFilters] = useState<{socio?: string, brinde?: string} | undefined>(undefined)

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

  const handleNavigateToClients = (filters?: {socio?: string, brinde?: string}) => {
      setClientFilters(filters);
      setActiveTab('clientes');
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] text-[#112240] font-bold">Carregando Salomão Manager...</div>

  if (!session) return <Login />

  if (!selectedModule) return <ModuleSelector onSelect={setSelectedModule} />

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden flex-col lg:flex-row">
      {/* CORREÇÃO AQUI: Passando as props corretas para a nova Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userEmail={session.user.email} 
      />

      <main className="flex-1 overflow-auto p-4 lg:p-8 w-full relative">
        <div className="max-w-7xl mx-auto h-full">
          {activeTab === 'dashboard' && <Dashboard onNavigate={handleNavigateToClients} />}
          {activeTab === 'kanban' && <Kanban />}
          {activeTab === 'clientes' && <Clients initialFilters={clientFilters} />}
          {activeTab === 'incompletos' && <IncompleteClients />}
          {activeTab === 'config' && <Settings />}
        </div>
      </main>
    </div>
  )
}

export default App