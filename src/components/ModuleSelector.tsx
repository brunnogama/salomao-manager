import { useEffect, useState } from 'react'
import { Gift, UserCog, Briefcase, LogOut, Banknote, Package, Lock, Loader2, Settings, Scale, Users, ChevronRight, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ModuleSelectorProps {
  onSelect: (module: 'crm' | 'family' | 'collaborators' | 'operational' | 'financial' | 'settings' | 'executive' | 'legal-control') => void;
  userName: string;
}

export function ModuleSelector({ onSelect, userName }: ModuleSelectorProps) {
  const [allowedModules, setAllowedModules] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

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
    gradientTo: string,
    delay: number
  ) => {
    const allowed = isModuleAllowed(key)
    const isHovered = hoveredCard === key

    return (
      <div
        key={key}
        onMouseEnter={() => setHoveredCard(key)}
        onMouseLeave={() => setHoveredCard(null)}
        onClick={() => allowed && onSelect(key)}
        style={{ animationDelay: `${delay}ms` }}
        className={`
          relative overflow-hidden rounded-2xl border transition-all duration-500 flex flex-col items-center text-center justify-between group animate-in fade-in slide-in-from-bottom-8 fill-mode-forwards opacity-0
          ${allowed
            ? 'bg-white/80 backdrop-blur-xl shadow-lg border-white/50 hover:shadow-2xl hover:-translate-y-2 cursor-pointer hover:border-[#d4af37]/30'
            : 'bg-gray-100/50 backdrop-blur-sm border-gray-200/50 opacity-70 cursor-not-allowed grayscale-[0.5]'
          }
          h-[280px] w-full
        `}
      >
        {/* Background Gradients */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

        {/* Top Highlight Line */}
        {allowed && (
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        )}

        {/* Lock Badge */}
        {!allowed && (
          <div className="absolute top-4 right-4 p-2 rounded-lg bg-gray-200/50 backdrop-blur-md">
            <Lock className="h-4 w-4 text-gray-500" />
          </div>
        )}

        {/* Content Container */}
        <div className="flex flex-col items-center justify-center flex-1 p-6 w-full z-10">

          {/* Icon Container with Glow */}
          <div className={`
            relative p-5 rounded-2xl mb-6 transition-all duration-500 group-hover:scale-110
            ${allowed
              ? `bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-lg shadow-${gradientFrom}/20`
              : 'bg-gray-200 text-gray-400'}
          `}>
            <Icon className="h-8 w-8" strokeWidth={1.5} />

            {/* Inner Glow Effect */}
            {allowed && (
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
            )}
          </div>

          <h2 className="text-xl font-black text-[#0a192f] mb-3 tracking-tight group-hover:text-[#1e3a8a] transition-colors">
            {title}
          </h2>

          <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[240px] line-clamp-3 group-hover:text-gray-600 transition-colors">
            {description}
          </p>
        </div>

        {/* Bottom Action Area */}
        <div className={`
          w-full py-4 px-6 border-t border-gray-100/50 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300
          ${allowed ? 'bg-gray-50/50 group-hover:bg-blue-50/30 text-gray-400 group-hover:text-[#1e3a8a]' : 'bg-gray-100/50 text-gray-400'}
        `}>
          {allowed ? (
            <>
              <span>Acessar Módulo</span>
              <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isHovered ? 'translate-x-1 text-[#d4af37]' : ''}`} />
            </>
          ) : (
            <span className="text-red-400 flex items-center gap-2 mx-auto">
              <Lock className="w-3 h-3" />
              Acesso Restrito
            </span>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col relative overflow-hidden">

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#0a192f] to-[#112240] z-0" />
      <div className="absolute top-[400px] left-0 right-0 h-32 bg-gradient-to-b from-[#112240] to-[#f8fafc] z-0" />

      {/* Header */}
      <header className="relative z-50 px-6 lg:px-12 h-24 flex items-center justify-between max-w-[1920px] mx-auto w-full">
        {/* Logo */}
        <div className="flex items-center gap-4 group cursor-default">
          <div className="relative">
            <div className="absolute inset-0 bg-white/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <img
              src="/logo-salomao.png"
              alt="Salomão Advogados"
              className="h-14 w-auto object-contain filter brightness-0 invert drop-shadow-lg transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </div>

        {/* User Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-xl transition-all hover:bg-white/20">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d4af37] to-amber-700 flex items-center justify-center shadow-inner ring-2 ring-white/20">
              <span className="text-xs font-black text-white">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col pr-2">
              <span className="text-white text-xs font-bold tracking-wide">
                {userName}
              </span>
              {isAdmin && (
                <div className="flex items-center gap-1 text-[#d4af37]">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="text-[9px] font-black uppercase tracking-wider">
                    Admin
                  </span>
                </div>
              )}
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => onSelect('settings')}
              className="p-3 text-white/70 hover:text-white transition-all rounded-full hover:bg-white/10 active:scale-95"
              title="Configurações"
            >
              <Settings className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 text-red-100 hover:bg-red-500/20 hover:text-white hover:border-red-500/50 transition-all active:scale-95 ml-2"
            title="Sair"
          >
            <LogOut className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline-block">Sair</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start pt-12 pb-20 px-6 animate-in fade-in duration-700">

        {/* Hero Section */}
        <div className="text-center mb-16 max-w-4xl w-full">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-2xl">
            Ecossistema <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#fcc200]">Salomão</span>
          </h1>
          <p className="text-lg text-blue-100/80 font-medium max-w-2xl mx-auto leading-relaxed">
            Selecione um módulo para acessar suas ferramentas de gestão, controle e operação jurídica.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl w-full perspective-1000">

          {renderCard(
            'crm',
            'Gestão de Clientes',
            'Gestão completa de relacionamento com clientes, controle de brindes e histórico de interações.',
            Users,
            'from-blue-600',
            'to-blue-700',
            100
          )}

          {renderCard(
            'executive',
            'Secretaria Executiva',
            'Gerenciamento de agendas executivas, viagens corporativas e demandas administrativas dos sócios.',
            Briefcase,
            'from-purple-600',
            'to-purple-700',
            200
          )}

          {renderCard(
            'collaborators',
            'Recursos Humanos',
            'Gestão estratégica de pessoas, administração de benefícios e processos de departamento pessoal.',
            UserCog,
            'from-green-600',
            'to-green-700',
            300
          )}

          {renderCard(
            'operational',
            'Operacional',
            'Controle de insumos de escritório, gestão de papelaria e processos operacionais do dia a dia.',
            Package,
            'from-orange-600',
            'to-orange-700',
            400
          )}

          {renderCard(
            'financial',
            'Financeiro',
            'Gestão financeira completa, incluindo controle de notas fiscais, emissão de boletos e fluxo de caixa.',
            Banknote,
            'from-emerald-600',
            'to-emerald-700',
            500
          )}

          {renderCard(
            'legal-control',
            'Controladoria Jurídica',
            'Análise de dados jurídicos, controle de prazos processuais e métricas de desempenho da banca.',
            Scale,
            'from-[#1e3a8a]',
            'to-[#0a192f]',
            600
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 bg-white/50 backdrop-blur-sm relative z-10">
        <div className="text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] hover:text-[#1e3a8a] transition-colors cursor-default">
            © 2026 Salomão Advogados · Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}