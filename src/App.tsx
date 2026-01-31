import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './Login'
import ResetPassword from './ResetPassword'
import ModuleSelector from './components/ModuleSelector'
import SidebarCRM from './components/crm/Sidebar'
import SidebarSecretaria from './components/secretaria/Sidebar'
import SidebarFinanceiro from './components/finance/SidebarFinanceiro'
import SidebarColaboradores from './components/collaborators/Sidebar'
import Settings from './components/Settings'

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  useEffect(() => {
    // 1. Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // 2. Ouvir mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      
      // Detecta se o usuário clicou no link de recuperação de senha
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Se estiver no fluxo de reset, mostra a tela de nova senha
  if (isResettingPassword) {
    return <ResetPassword />
  }

  if (!session) {
    return <Login />
  }

  if (showSettings) {
    return <Settings onBack={() => setShowSettings(false)} />
  }

  if (!activeModule) {
    return <ModuleSelector onSelectModule={setActiveModule} onShowSettings={() => setShowSettings(true)} />
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'crm': return <SidebarCRM onBack={() => setActiveModule(null)} />
      case 'secretaria': return <SidebarSecretaria onBack={() => setActiveModule(null)} />
      case 'financeiro': return <SidebarFinanceiro onBack={() => setActiveModule(null)} />
      case 'colaboradores': return <SidebarColaboradores onBack={() => setActiveModule(null)} />
      default: return <ModuleSelector onSelectModule={setActiveModule} onShowSettings={() => setShowSettings(true)} />
    }
  }

  return renderModule()
}
