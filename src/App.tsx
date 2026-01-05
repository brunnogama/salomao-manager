import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { Clients } from './components/Clients'
import { IncompleteClients } from './components/IncompleteClients'
import { Auth } from './components/Auth'
import { supabase } from './lib/supabase'

function App() {
  const [session, setSession] = useState<any>(null)
  // Estado unificado para controle de abas
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'incomplete'>('dashboard')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription }, } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    return <Auth />
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Passando as props corretas conforme definido na interface SidebarProps */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userName={session.user.email} 
        onLogout={handleLogout} 
      />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto h-full">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'clients' && <Clients />}
          {activeTab === 'incomplete' && <IncompleteClients />}
        </div>
      </main>
    </div>
  )
}

export default App
