import { useEffect, useState } from 'react'
import { UserCog, Briefcase, LogOut, Banknote, Package, Lock, Loader2, Settings, Scale, Users, ShieldCheck } from 'lucide-react'

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
            .from('user_profiles')
            .select('allowed_modules, role')
            .eq('id', user.id)
            .maybeSingle()

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
        className={`
          relative overflow-hidden rounded-xl border transition-all duration-300 flex flex-col items-center text-center justify-between group
          ${allowed
            ? 'bg-white/5 backdrop-blur-md shadow-lg border-white/10 hover:shadow-2xl hover:bg-white/10 hover:-translate-y-1 cursor-pointer hover:border-[#d4af37]/50'
            : 'bg-gray-100/5 backdrop-blur-sm border-white/5 opacity-50 cursor-not-allowed grayscale'
          }
          h-[180px] w-full
        `}
      >
        {/* Background Gradients */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />

        {/* Top Highlight Line */}
        {allowed && (
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}

        {/* Lock Badge */}
        {!allowed && (
          <div className="absolute top-4 right-4 p-1.5 rounded-lg bg-gray-900/50 backdrop-blur-md">
            <Lock className="h-3.5 w-3.5 text-gray-400" />
          </div>
        )}

        {/* Content Container */}
        <div className="flex flex-col items-center justify-center flex-1 p-5 w-full z-10">

          {/* Icon Container with Glow */}
          <div className={`
            relative p-3.5 rounded-xl mb-3.5 transition-all duration-300 group-hover:scale-105
            ${allowed
              ? `bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-lg shadow-${gradientFrom}/20`
              : 'bg-gray-800/50 text-gray-500'}
          `}>
            <Icon className="h-6 w-6" strokeWidth={1.5} />

            {/* Inner Glow Effect */}
            {allowed && (
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
            )}
          </div>

          <h2 className="text-sm font-bold text-white mb-2 tracking-wide group-hover:text-[#d4af37] transition-colors">
            {title}
          </h2>

          <p className="text-[10px] text-gray-400 font-medium leading-relaxed max-w-[200px] line-clamp-2 group-hover:text-gray-300 transition-colors">
            {description}
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#f8fafc] flex flex-col items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
            <img
              src="/logo-salomao.png"
              alt="Carregando..."
              className="h-16 w-auto relative z-10 animate-pulse grayscale opacity-50"
            />
          </div>
          <div className="flex items-center gap-3 text-[#0a192f]">
            <Loader2 className="h-5 w-5 animate-spin text-[#d4af37]" />
            <p className="text-sm font-bold tracking-widest uppercase">Carregando Ecossistema</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-[#0a192f] flex flex-col relative overflow-hidden">

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#0a192f] to-[#112240] z-0" />

      {/* Header */}
      <header className="relative z-50 px-6 lg:px-8 h-20 flex items-center justify-between w-full shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-4 group cursor-default">
          <div className="relative">
            <div className="absolute inset-0 bg-white/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <img
              src="/logo-salomao.png"
              alt="Salomão Advogados"
              className="h-11 w-auto object-contain filter brightness-0 invert drop-shadow-lg transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </div>

        {/* User Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-lg transition-all hover:bg-white/20">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4af37] to-amber-700 flex items-center justify-center shadow-inner ring-1 ring-white/20">
              <span className="text-[10px] font-black text-white">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col pr-1">
              <span className="text-white text-xs font-bold tracking-wide leading-tight">
                {userName}
              </span>
              {isAdmin && (
                <div className="flex items-center gap-1 text-[#d4af37]">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="text-[9px] font-black uppercase tracking-wider leading-tight">
                    Admin
                  </span>
                </div>
              )}
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => onSelect('settings')}
              className="p-2.5 text-white/70 hover:text-white transition-all rounded-full hover:bg-white/10 active:scale-95"
              title="Configurações"
            >
              <Settings className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 text-red-100 hover:bg-red-500/20 hover:text-white hover:border-red-500/50 transition-all active:scale-95 ml-1"
            title="Sair"
          >
            <LogOut className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline-block">Sair</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 h-full min-h-0">

        {/* Hero Section */}
        <div className="text-center mb-8 shrink-0">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight drop-shadow-2xl">
            Ecossistema <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#fcc200]">Salomão</span>
          </h1>
          <p className="text-sm text-blue-100/90 font-medium max-w-xl mx-auto leading-relaxed shadow-sm">
            Selecione um módulo para acessar suas ferramentas.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl w-full">

          {renderCard(
            'crm',
            'Gestão de Clientes',
            'Gestão completa de relacionamento com clientes e brindes.',
            Users,
            'from-blue-600',
            'to-blue-700'
          )}

          {renderCard(
            'executive',
            'Secretaria Executiva',
            'Gerenciamento de agendas, viagens e demandas dos sócios.',
            Briefcase,
            'from-purple-600',
            'to-purple-700'
          )}

          {renderCard(
            'collaborators',
            'Recursos Humanos',
            'Gestão estratégica de pessoas, benefícios e departamento pessoal.',
            UserCog,
            'from-green-600',
            'to-green-700'
          )}

          {renderCard(
            'operational',
            'Operacional',
            'Controle de insumos, papelaria e processos operacionais.',
            Package,
            'from-orange-600',
            'to-orange-700'
          )}

          {renderCard(
            'financial',
            'Financeiro',
            'Gestão financeira, notas fiscais, boletos e fluxo de caixa.',
            Banknote,
            'from-emerald-600',
            'to-emerald-700'
          )}

          {renderCard(
            'legal-control',
            'Controladoria Jurídica',
            'Análise indicativa e controle de prazos processuais.',
            Scale,
            'from-[#1e3a8a]',
            'to-[#0a192f]'
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-white/10 bg-[#0a192f]/50 backdrop-blur-sm relative z-10 shrink-0">
        <div className="text-center">
          <p className="text-[10px] font-black text-blue-200/50 uppercase tracking-[0.3em] hover:text-[#d4af37] transition-colors cursor-default">
            © 2026 Salomão Advogados
          </p>
        </div>
      </footer>
    </div>
  )
}