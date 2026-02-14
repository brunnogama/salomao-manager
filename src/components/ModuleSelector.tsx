import { useEffect, useState } from 'react'
import { Gift, UserCog, Briefcase, LogOut, Banknote, Package, Lock, Loader2, Settings, Scale } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ModuleSelectorProps {
  onSelect: (module: 'crm' | 'family' | 'collaborators' | 'operational' | 'financial' | 'settings' | 'executive' | 'legal-control') => void;
  userName: string;
}

export function ModuleSelector({ onSelect, userName }: ModuleSelectorProps) {
  const [allowedModules, setAllowedModules] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function fetchPermissions() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { data, error } = await supabase
            .from('user_profiles') // Tabela correta
            .select('allowed_modules, role')
            .eq('id', user.id)
            .maybeSingle() // CORREÇÃO: maybeSingle evita o erro "Uncaught Error" se o perfil for nulo

          if (data && !error) {
            const userRole = data.role || ''
            const isUserAdmin = userRole.toLowerCase() === 'admin'

            setIsAdmin(isUserAdmin)

            if (isUserAdmin) {
              setAllowedModules(['crm', 'family', 'collaborators', 'operational', 'financial', 'executive', 'legal-control'])
            } else {
              setAllowedModules(data.allowed_modules || [])
            }
          } else {
            console.warn('Perfil de usuário não encontrado.')
            setAllowedModules([])
            setIsAdmin(false)
          }
        }
      } catch (error) {
        console.error('Erro ao buscar permissões:', error)
        setAllowedModules([])
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [])

  const handleLogout = async () => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeModal')
    localStorage.clear()
    sessionStorage.clear()
    if (hasSeenWelcome) {
      localStorage.setItem('hasSeenWelcomeModal', hasSeenWelcome)
    }
    await supabase.auth.signOut()
    window.location.reload()
  }

  const isModuleAllowed = (moduleKey: string) => {
    if (isAdmin) return true
    return allowedModules.includes(moduleKey)
  }

  const renderCard = (
    key: 'crm' | 'family' | 'collaborators' | 'operational' | 'financial' | 'executive' | 'legal-control',
    title: string,
    description: string,
    Icon: any,
    gradientFrom: string,
    gradientTo: string
  ) => {
    const allowed = isModuleAllowed(key)

    return (
      <div
        key={key}
        onClick={() => allowed && onSelect(key)}
        className={`relative overflow-hidden rounded-xl border transition-all duration-300 h-64 flex flex-col items-center text-center justify-center group
          ${allowed
            ? 'bg-white shadow-sm border-gray-100 hover:shadow-2xl hover:-translate-y-2 cursor-pointer hover:border-gray-200'
            : 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
          }
        `}
      >
        {/* Gradiente de fundo sutil no hover */}
        {allowed && (
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br ${gradientFrom} ${gradientTo}`} />
        )}

        {/* Lock Badge */}
        {!allowed && (
          <div className="absolute top-4 right-4 p-2 rounded-lg bg-gray-200">
            <Lock className="h-4 w-4 text-gray-500" />
          </div>
        )}

        {/* Icon Container */}
        <div className={`relative z-10 p-5 rounded-2xl mb-6 transition-all duration-300 ${allowed
            ? `bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-lg group-hover:scale-110 group-hover:shadow-xl`
            : 'bg-gray-200 text-gray-400'
          }`}>
          <Icon className="h-10 w-10" />
        </div>

        {/* Content */}
        <div className="relative z-10 px-6">
          <h2 className="text-lg font-black text-[#0a192f] mb-2 tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed font-medium line-clamp-3">
            {description}
          </p>
        </div>

        {/* Status Badge */}
        {!allowed && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em] bg-red-50 px-3 py-1 rounded-full border border-red-200">
              Bloqueado
            </span>
          </div>
        )}

        {/* Active indicator */}
        {allowed && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-[#1e3a8a] animate-spin" />
          <p className="text-sm font-semibold text-gray-500">Carregando módulos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">

      {/* Header - Design System Navy */}
      <header className="bg-gradient-to-r from-[#0a192f] to-[#112240] border-b border-white/10 shadow-xl">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* Logo - Esquerda */}
          <img
            src="/so_logo-branca.png"
            alt="Salomão Advogados"
            className="h-11 w-auto object-contain"
          />

          {/* Controles - Direita */}
          <div className="flex items-center gap-3">
            {/* User Info */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-amber-600 flex items-center justify-center shadow-lg">
                <span className="text-xs font-black text-white">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-sm font-bold tracking-tight">
                  {userName}
                </span>
                {isAdmin && (
                  <span className="text-[#d4af37] text-[9px] font-black uppercase tracking-[0.15em]">
                    Administrador
                  </span>
                )}
              </div>
            </div>

            {/* Settings Button (Admin only) */}
            {isAdmin && (
              <button
                onClick={() => onSelect('settings')}
                className="p-2.5 text-gray-400 hover:text-white transition-all rounded-xl hover:bg-white/10 border border-transparent hover:border-white/20"
                title="Configurações"
              >
                <Settings className="h-5 w-5" />
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2.5 text-gray-400 hover:text-red-400 transition-all rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-400/20"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">

        {/* Title Section */}
        <div className="text-center mb-12 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-black text-[#0a192f] mb-4 tracking-tight">
            Ecossistema Salomão
          </h1>
          <p className="text-base text-gray-500 font-medium">
            Selecione o módulo que deseja acessar para começar
          </p>

          {/* Decorative line */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="h-0.5 w-12 bg-gradient-to-r from-transparent to-[#1e3a8a]"></div>
            <div className="w-2 h-2 rounded-full bg-[#d4af37]"></div>
            <div className="h-0.5 w-12 bg-gradient-to-l from-transparent to-[#1e3a8a]"></div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl w-full">

          {renderCard(
            'crm',
            'Brindes de Clientes',
            'Gestão de clientes e controle de brindes de final de ano',
            Gift,
            'from-blue-600',
            'to-blue-700'
          )}

          {renderCard(
            'executive',
            'Secretaria Executiva',
            'Suporte e gestão de agendas, viagens e demandas dos sócios',
            Briefcase,
            'from-purple-600',
            'to-purple-700'
          )}

          {renderCard(
            'collaborators',
            'Recursos Humanos',
            'Gestão estratégica de pessoas, benefícios e departamento pessoal',
            UserCog,
            'from-green-600',
            'to-green-700'
          )}

          {renderCard(
            'operational',
            'Operacional',
            'Gestão de insumos, papelaria e operacional do escritório',
            Package,
            'from-orange-600',
            'to-orange-700'
          )}

          {renderCard(
            'financial',
            'Financeiro',
            'Controle de notas fiscais, emissão de boletos e gestão financeira',
            Banknote,
            'from-emerald-600',
            'to-emerald-700'
          )}

          {renderCard(
            'legal-control',
            'Controladoria Jurídica',
            'Análise e controle estratégico de processos e métricas jurídicas',
            Scale,
            'from-[#1e3a8a]',
            'to-[#112240]'
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="text-center">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
            © 2026 Salomão Advogados · Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}