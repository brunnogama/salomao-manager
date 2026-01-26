import { Gift, UserCog, Home, LogOut, Banknote, Package } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ModuleSelectorProps {
  onSelect: (module: 'crm' | 'family' | 'collaborators' | 'operational' | 'financial') => void;
  userName: string;
}

export function ModuleSelector({ onSelect, userName }: ModuleSelectorProps) {
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Simples */}
      <header className="bg-[#112240] h-20 flex items-center justify-between px-8 shadow-md">
        <img src="/logo-branca.png" alt="Salomão" className="h-10 w-auto object-contain" />
        <div className="flex items-center gap-4">
            <span className="text-white text-sm font-medium">Olá, {userName}</span>
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

        {/* Ajustado grid para acomodar 5 itens harmonicamente em telas grandes (xl) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 max-w-7xl w-full">
            
            {/* CARD CRM */}
            <div 
                onClick={() => onSelect('crm')}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 transition-all cursor-pointer group flex flex-col items-center text-center h-64 justify-center"
            >
                <div className="p-4 bg-blue-50 text-blue-700 rounded-full mb-6 group-hover:scale-110 transition-transform">
                    <Gift className="h-10 w-10" />
                </div>
                <h2 className="text-xl font-bold text-[#112240] mb-2">Brindes de Clientes</h2>
                <p className="text-sm text-gray-500">Gestão de clientes e controle de brindes de final de ano.</p>
            </div>

            {/* CARD FAMÍLIA */}
            <div 
                onClick={() => onSelect('family')}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 hover:border-purple-200 transition-all cursor-pointer group flex flex-col items-center text-center h-64 justify-center"
            >
                <div className="p-4 bg-purple-50 text-purple-700 rounded-full mb-6 group-hover:scale-110 transition-transform">
                    <Home className="h-10 w-10" />
                </div>
                <h2 className="text-xl font-bold text-[#112240] mb-2">Gestão da Família</h2>
                <p className="text-sm text-gray-500">Administração patrimonial e familiar.</p>
            </div>

            {/* CARD RECURSOS HUMANOS */}
            <div 
                onClick={() => onSelect('collaborators')}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 hover:border-green-200 transition-all cursor-pointer group flex flex-col items-center text-center h-64 justify-center"
            >
                <div className="p-4 bg-green-50 text-green-700 rounded-full mb-6 group-hover:scale-110 transition-transform">
                    <UserCog className="h-10 w-10" />
                </div>
                <h2 className="text-xl font-bold text-[#112240] mb-2">Recursos Humanos</h2>
                <p className="text-sm text-gray-500">Gestão estratégica de pessoas, benefícios e departamento pessoal.</p>
            </div>

            {/* CARD OPERACIONAL (NOVO) */}
            <div 
                onClick={() => onSelect('operational')}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 hover:border-orange-200 transition-all cursor-pointer group flex flex-col items-center text-center h-64 justify-center"
            >
                <div className="p-4 bg-orange-50 text-orange-700 rounded-full mb-6 group-hover:scale-110 transition-transform">
                    <Package className="h-10 w-10" />
                </div>
                <h2 className="text-xl font-bold text-[#112240] mb-2">Operacional</h2>
                <p className="text-sm text-gray-500">Gestão de insumos, papelaria e operacional do escritório.</p>
            </div>

            {/* CARD FINANCEIRO */}
            <div 
                onClick={() => onSelect('financial')}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 transition-all cursor-pointer group flex flex-col items-center text-center h-64 justify-center"
            >
                <div className="p-4 bg-emerald-50 text-emerald-700 rounded-full mb-6 group-hover:scale-110 transition-transform">
                    <Banknote className="h-10 w-10" />
                </div>
                <h2 className="text-xl font-bold text-[#112240] mb-2">Financeiro</h2>
                <p className="text-sm text-gray-500">Controle de notas fiscais, emissão, boletos etc.</p>
            </div>

        </div>
      </main>

      <footer className="text-center py-6 text-xs text-gray-400">
        © 2026 Salomão Advogados. Todos os direitos reservados.
      </footer>
    </div>
  )
}
