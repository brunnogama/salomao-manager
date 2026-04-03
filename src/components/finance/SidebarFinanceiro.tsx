// src/components/finance/SidebarFinanceiro.tsx
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  Plane,
  Folder,
  X,
  GraduationCap,
  Receipt,
  DollarSign,
  Users
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SidebarFinanceiro({ isOpen, onClose }: SidebarProps) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [userName, setUserName] = useState('Carregando...')
  const [radarCount, setRadarCount] = useState(0)
  const location = useLocation()
  const activePage = location.pathname

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.email) {
        const emailName = user.email.split('@')[0]
        const formattedName = emailName.split('.').map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
        setUserName(formattedName)
      }
    } catch (error) {
      console.error('Erro:', error)
      setUserName('Usuário')
    }
  }

  const handleLogout = async () => {
    await signOut()
  }

  useEffect(() => {
    fetchUserProfile()

    // Busca Faturas no Radar (Contas a Receber)
    const fetchRadarCount = async () => {
      try {
        const { count, error } = await supabase
          .from('finance_faturas')
          .select('*', { count: 'exact', head: true })
          .or('status.eq.radar,status.eq.contato_direto')

        if (!error && count !== null) {
          setRadarCount(count)
        }
      } catch (error) {
        console.error('Erro ao contar faturas no radar:', error)
      }
    }

    fetchRadarCount()
  }, [])

  const mainItems = [
    { path: '/financeiro/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/financeiro/calendario', label: 'Calendário', icon: Calendar },
    { path: '/financeiro/contas-pagar', label: 'Contas a Pagar', icon: ArrowUpCircle },
    { path: '/financeiro/emissao-nf', label: 'Emissão de NF', icon: Receipt },
    { path: '/financeiro/controle-financeiro', label: 'Controle Financeiro', icon: DollarSign },
    { path: '/financeiro/contas-receber', label: 'Contas a Receber', icon: ArrowDownCircle },
    { path: '/financeiro/oab', label: 'OAB', icon: GraduationCap },
    { path: '/financeiro/gestao-aeronave', label: 'Gestão da Aeronave', icon: Plane },
    { path: '/financeiro/clientes', label: 'Clientes Vínculo', icon: Users },
    { path: '/financeiro/ged', label: 'GED', icon: Folder },
  ]

  const isActive = (path: string) => activePage === path

  return (
    <>
      {/* Backdrop Escuro (Apenas Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static top-0 left-0 z-50 md:z-auto h-screen bg-[#0a192f] text-gray-300 flex flex-col font-sans border-r border-gray-800 shadow-2xl md:shadow-none
        transition-all duration-300 ease-in-out group/sidebar overflow-x-hidden
        w-64 md:w-[80px] md:hover:w-64 md:hover:delay-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}>

        {/* Botão Fechar (Apenas Mobile) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white md:hidden z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 1. HEADER - BRAND + MÓDULO */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-6">
            <img src="/so_logo-branca.png" alt="S" className="h-6 w-6 drop-shadow-md shrink-0" />
            <div className="opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 md:group-hover/sidebar:delay-300 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
              <h2 className="text-sm font-bold text-white leading-none tracking-wide">DEPARTAMENTO</h2>
              <h2 className="text-xl font-black text-white leading-none tracking-wide mt-0.5">FINANCEIRO</h2>
            </div>
          </div>
          {/* Separator */}
          <div className="h-px bg-gray-800 mb-2" />
        </div>

        {/* 2. MENU PRINCIPAL */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 no-scrollbar">
          {mainItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${isActive(item.path)
                ? 'bg-[#1e3a8a] text-white font-medium shadow-md'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
            >
              <item.icon className={`h-5 w-5 shrink-0 transition-transform duration-300 ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-sm font-medium flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 md:group-hover/sidebar:delay-300 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
                {item.label}
              </span>
              {isActive(item.path) && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-400 opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 md:group-hover/sidebar:delay-300 transition-opacity duration-300" />
              )}



              {/* Badge Contas a Receber (Radar/Atenção) */}
              {item.path.includes('contas-receber') && radarCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-lg shadow-amber-900/20">
                  {radarCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* 3. AÇÕES INFERIORES */}
        <div className="p-4 mt-auto">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group overflow-hidden"
              title="Mudar Módulo"
            >
              <LayoutDashboard className="w-5 h-5 shrink-0 text-blue-300 group-hover:text-white" />
              <span className="text-[10px] uppercase tracking-wider text-blue-300 group-hover:text-white font-bold opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 md:group-hover/sidebar:delay-300 transition-opacity duration-300 whitespace-nowrap">Módulos</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all group overflow-hidden"
              title="Sair"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0 text-red-400 group-hover:text-red-300"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
              <span className="text-[10px] uppercase tracking-wider text-red-400 group-hover:text-red-300 font-bold opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 md:group-hover/sidebar:delay-300 transition-opacity duration-300 whitespace-nowrap">Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}