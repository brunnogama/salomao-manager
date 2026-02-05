import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  Calendar,
  ArrowUpCircle, 
  ArrowDownCircle, 
  Plane, 
  FolderSearch, 
  X,
  Briefcase,
  GraduationCap
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function SidebarFinanceiro({ activePage, onNavigate, isOpen, onClose }: SidebarProps) {
  const [vencidosCount, setVencidosCount] = useState(0)

  useEffect(() => {
    const fetchVencidosOAB = async () => {
      try {
        const { data } = await supabase.from('colaboradores').select('cargo, data_admissao')
        
        if (data) {
          const hoje = new Date()
          hoje.setHours(0, 0, 0, 0)

          const count = data.filter((v: any) => {
            if (!v.data_admissao) return false
            const cargoLimpo = v.cargo?.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || ''
            const ehCargoValido = cargoLimpo === 'advogado' || cargoLimpo === 'socio'
            if (!ehCargoValido) return false

            let dia, mes, ano
            if (v.data_admissao.includes('/')) {
              [dia, mes, ano] = v.data_admissao.split('/').map(Number)
            } else {
              [ano, mes, dia] = v.data_admissao.split('-').map(Number)
            }

            const dataVenc = new Date(ano, (mes - 1) + 6, dia)
            dataVenc.setDate(dataVenc.getDate() - 1)
            
            return dataVenc < hoje
          }).length

          setVencidosCount(count)
        }
      } catch (error) {
        console.error('Erro ao contar OAB vencidas:', error)
      }
    }

    fetchVencidosOAB()
  }, [])

  const mainItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendario', label: 'Calendário', icon: Calendar },
    { id: 'contas-pagar', label: 'Contas a Pagar', icon: ArrowUpCircle },
    { id: 'oab', label: 'OAB', icon: GraduationCap },
    { id: 'contas-receber', label: 'Contas a Receber', icon: ArrowDownCircle },
    { id: 'gestao-aeronave', label: 'Gestão da Aeronave', icon: Plane }, // Item adicionado
    { id: 'ged', label: 'GED', icon: FolderSearch },
  ]

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
        fixed md:static top-0 left-0 z-50 md:z-auto h-screen w-64 bg-[#112240] text-gray-300 flex flex-col font-sans border-r border-gray-800 shadow-2xl md:shadow-none
        transition-transform duration-300 ease-in-out
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

        {/* 1. HEADER LOGO */}
        <div className="flex flex-col flex-shrink-0 relative bg-[#112240] pt-8 pb-4 px-6">
          <div className="flex flex-col items-center w-full">
            <img 
              src="/logo-branca.png" 
              alt="Salomão Advogados" 
              className="h-12 w-auto object-contain block"
            />
          </div>
        </div>

        {/* 2. MENU PRINCIPAL */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {mainItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { 
                onNavigate(item.id); 
                onClose(); 
              }}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all group ${
                activePage === item.id
                  ? 'bg-[#1e3a8a] text-white font-medium shadow-md border-l-4 border-salomao-gold' 
                  : 'hover:bg-white/5 hover:text-white border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center">
                <item.icon 
                  className={`h-5 w-5 mr-3 transition-colors ${
                    activePage === item.id ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  }`} 
                />
                <span className="text-sm">{item.label}</span>
              </div>

              {item.id === 'oab' && vencidosCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white animate-pulse shadow-lg shadow-red-900/20">
                  {vencidosCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* 3. CARD DO MÓDULO (FINANCEIRO) */}
        <div className="p-4 bg-[#112240] flex-shrink-0 mt-auto">
          <div className="bg-gradient-to-br from-[#1a2c4e] to-[#0a192f] border border-gray-700/50 rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-900/40 flex items-center justify-center border border-blue-500/30">
                <Briefcase className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-0.5 leading-none">Módulo</p>
                <p className="text-sm font-semibold text-white leading-tight">Financeiro</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}