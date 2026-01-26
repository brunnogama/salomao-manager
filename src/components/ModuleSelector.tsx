import { useEffect, useState } from 'react'
import { Gift, UserCog, Home, LogOut, Banknote, Package, Lock, Loader2, Settings } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ModuleSelectorProps {
  onSelect: (module: 'crm' | 'family' | 'collaborators' | 'operational' | 'financial' | 'settings') => void;
  userName: string;
}

export function ModuleSelector({ onSelect, userName }: ModuleSelectorProps) {
  const [allowedModules, setAllowedModules] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // 1. Busca permissões do usuário ao carregar
  useEffect(() => {
    async function fetchPermissions() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('allowed_modules, role')
            .eq('user_id', user.id)
            .single()

          if (data && !error) {
            const userRole = data.role || ''
            const isUserAdmin = userRole.toLowerCase() === 'admin'
            
            setIsAdmin(isUserAdmin)
            
            // Se for admin, libera TODOS os módulos
            if (isUserAdmin) {
              setAllowedModules(['crm', 'family', 'collaborators', 'operational', 'financial'])
            } else {
              // Se não for admin, usa os módulos definidos na gestão de usuários
              setAllowedModules(data.allowed_modules || [])
            }
          } else {
            // Fallback se não tiver perfil criado ainda
            console.warn('Perfil de usuário não encontrado.')
            setAllowedModules([])
            setIsAdmin(false)
          }
        }
      } catch (error) {
        console.error('Erro ao buscar permissões:', error)
        // Em caso de erro, não libera nenhum módulo
        setAllowedModules([])
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [])
  
  // 2. Função de Logout aprimorada
  const handleLogout = async () => {
    // ✅ SALVAR o flag do modal de boas-vindas antes de limpar
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeModal')
    
    // Limpa storage local para esquecer estados anteriores
    localStorage.clear()
    sessionStorage.clear()
    
    // ✅ RESTAURAR o flag do modal depois de limpar
    if (hasSeenWelcome) {
      localStorage.setItem('hasSeenWelcomeModal', hasSeenWelcome)
    }
    
    // Desloga do Supabase
    await supabase.auth.signOut()
    
    // Recarrega a página para limpar estados de memória do React
    window.location.reload()
  }

  // 3. Verifica se o módulo está liberado
  const isModuleAllowed = (moduleKey: string) => {
    // Admin sempre tem acesso a tudo
    if (isAdmin) return true
    
    // Usuários normais seguem as permissões definidas na gestão
    return allowedModules.includes(moduleKey)
  }

  const renderCard = (
    key: 'crm' | 'family' | 'collaborators' | 'operational' | 'financial' | 'settings',
    title: string,
    description: string,
    Icon: any,
    colorClass: string,
    bgClass: string,
    adminOnly: boolean = false
  ) => {
    // Se for adminOnly, só mostra para admins
    if (adminOnly && !isAdmin) return null
    
    const allowed = adminOnly ? isAdmin : isModuleAllowed(key)

    return (
      <div 
        onClick={() => allowed && onSelect(key)}
        className={`relative p-8 rounded-2xl border transition-all h-64 flex flex-col items-center text-center justify-center group
          ${allowed 
            ? `bg-white shadow-sm border-gray-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer hover:border-${colorClass}-200` 
            : 'bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed grayscale'
          }
        `}
      >
        {!allowed && (
          <div className="absolute top-4 right-4 text-gray-400">
            <Lock className="h-5 w-5" />
          </div>
        )}

        <div className={`p-4 rounded-full mb-6 transition-transform ${allowed ? `${bgClass} ${colorClass} group-hover:scale-110` : 'bg-gray-200 text-gray-500'}`}>
          <Icon className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-[#112240] mb-2">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
        
        {!allowed && (
          <span className="mt-2 text-xs font-bold text-red-400 uppercase tracking-widest">Bloqueado</span>
        )}
        
        {adminOnly && allowed && (
          <span className="mt-2 text-xs font-bold text-yellow-600 uppercase tracking-widest">Admin</span>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#112240] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Simples */}
      <header className="bg-[#112240] h-20 flex items-center justify-between px-8 shadow-md">
        <img src="/logo-branca.png" alt="Salomão" className="h-10 w-auto object-contain" />
        <div className="flex items-center gap-4">
            <span className="text-white text-sm font-medium">
              Olá, {userName} {isAdmin && <span className="text-yellow-400 ml-1">(Admin)</span>}
            </span>
            <button 
                onClick={handleLogout}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                title="Sair"
            >
                <LogOut className="h-5 w-5" />
            </button>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 animate-fadeIn">
        <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-[#112240] mb-3">Bem-vindo ao Ecossistema Salomão</h1>
            <p className="text-gray-500">Selecione o módulo que deseja acessar hoje.</p>
        </div>

        {/* Grid de Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-8 max-w-7xl w-full">
            
            {renderCard(
              'crm', 
              'Brindes de Clientes', 
              'Gestão de clientes e controle de brindes de final de ano.', 
              Gift, 
              'text-blue-700', 
              'bg-blue-50'
            )}

            {renderCard(
              'family', 
              'Gestão da Família', 
              'Administração patrimonial e familiar.', 
              Home, 
              'text-purple-700', 
              'bg-purple-50'
            )}

            {renderCard(
              'collaborators', 
              'Recursos Humanos', 
              'Gestão estratégica de pessoas, benefícios e DP.', 
              UserCog, 
              'text-green-700', 
              'bg-green-50'
            )}

            {renderCard(
              'operational', 
              'Operacional', 
              'Gestão de insumos, papelaria e operacional do escritório.', 
              Package, 
              'text-orange-700', 
              'bg-orange-50'
            )}

            {renderCard(
              'financial', 
              'Financeiro', 
              'Controle de notas fiscais, emissão, boletos etc.', 
              Banknote, 
              'text-emerald-700', 
              'bg-emerald-50'
            )}

            {/* NOVO: Card de Configurações (apenas para admins) */}
            {renderCard(
              'settings', 
              'Configurações', 
              'Gestão centralizada de usuários, permissões e sistema.', 
              Settings, 
              'text-gray-700', 
              'bg-gray-50',
              true // adminOnly
            )}

        </div>
      </main>

      <footer className="text-center py-6 text-xs text-gray-400">
        © 2026 Salomão Advogados. Todos os direitos reservados.
      </footer>
    </div>
  )
}