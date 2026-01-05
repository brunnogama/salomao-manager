import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, AlertCircle, UserCircle, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'

// Interface alinhada com a chamada no App.tsx
interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  userName?: string; 
  onLogout?: () => void;
}

export function Sidebar({ activeTab, setActiveTab, userName, onLogout }: SidebarProps) {
  const [incompleteCount, setIncompleteCount] = useState(0)

  const fetchCount = async () => {
    const { data } = await supabase.from('clientes').select('*')
    if (data) {
      const count = data.filter((c: any) => {
        const ignored = c.ignored_fields || []
        const missing = []
        if (!c.nome) missing.push('Nome')
        if (!c.empresa) missing.push('Empresa')
        if (!c.cargo) missing.push('Cargo')
        if (!c.telefone) missing.push('Telefone')
        if (!c.tipo_brinde) missing.push('Tipo Brinde')
        if (!c.cep) missing.push('CEP')
        if (!c.endereco) missing.push('Endereço')
        if (!c.numero) missing.push('Número')
        if (!c.bairro) missing.push('Bairro')
        if (!c.cidade) missing.push('Cidade')
        if (!c.estado) missing.push('UF')
        if (!c.email) missing.push('Email')
        if (!c.socio) missing.push('Sócio')
        
        // Filtra se a pendência não foi ignorada
        return missing.filter(f => !ignored.includes(f)).length > 0
      }).length
      setIncompleteCount(count)
    }
  }

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-[#112240]">Salomão <span className="text-blue-600">CRM</span></h1>
      </div>
      
      <div className="p-4 border-b border-gray-100 flex items-center gap-3">
        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
          <UserCircle className="h-6 w-6" />
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-bold text-gray-900 truncate">{userName || 'Usuário'}</p>
          <p className="text-xs text-gray-500">Online</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'dashboard' ? 'bg-[#112240] text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}>
          <LayoutDashboard className="h-5 w-5" /> Dashboard
        </button>
        <button onClick={() => setActiveTab('clients')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'clients' ? 'bg-[#112240] text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}>
          <Users className="h-5 w-5" /> Clientes
        </button>
        <button onClick={() => setActiveTab('incomplete')} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'incomplete' ? 'bg-[#112240] text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}>
          <div className="flex items-center gap-3"><AlertCircle className="h-5 w-5" /> Incompletos</div>
          {incompleteCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{incompleteCount}</span>}
        </button>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm">
          <LogOut className="h-4 w-4" /> Sair do Sistema
        </button>
      </div>
    </div>
  )
}
