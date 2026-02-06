import { useState } from 'react'
import { 
  DollarSign, 
  UserCircle, 
  Grid, 
  LogOut,
  Wallet,
  TrendingUp,
  PieChart,
  FileText,
  Search
} from 'lucide-react'

interface RHRemuneracaoProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function RHRemuneracao({ userName = 'Usuário', onModuleHome, onLogout }: RHRemuneracaoProps) {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">
      
      {/* PAGE HEADER - Padrão Salomão Design System */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <DollarSign className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Remuneração & Benefícios
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Gestão de folha de pagamento, encargos e política de benefícios
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Recursos Humanos</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white shadow-md">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && (
            <button 
              onClick={onModuleHome} 
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title="Voltar aos módulos"
            >
              <Grid className="h-5 w-5" />
            </button>
          )}
          {onLogout && (
            <button 
              onClick={onLogout} 
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 w-full">
        
        {/* CARDS DE CUSTO FINANCEIRO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-[#1e3a8a]">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Folha Mensal Estimada</p>
              <p className="text-xl font-black text-[#0a192f]">R$ 0,00</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-[#1e3a8a]">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Encargos & Provisões</p>
              <p className="text-xl font-black text-[#0a192f]">R$ 0,00</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-[#1e3a8a]">
              <PieChart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em]">Benefícios Totais</p>
              <p className="text-xl font-black text-[#0a192f]">R$ 0,00</p>
            </div>
          </div>
        </div>

        {/* ÁREA DE BUSCA E LISTAGEM */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Buscar por colaborador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium text-xs"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-[#1e3a8a] font-black text-[9px] uppercase tracking-widest hover:bg-blue-50 rounded-lg transition-all">
              <FileText className="h-4 w-4" /> Exportar Relatório
            </button>
          </div>

          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-full bg-blue-50 mb-4">
              <DollarSign className="h-12 w-12 text-[#1e3a8a] opacity-20" />
            </div>
            <h2 className="text-xl font-black text-[#0a192f]">Folha de Pagamento não processada</h2>
            <p className="text-gray-500 max-w-sm mt-2">
              Os dados de remuneração serão exibidos assim que as tabelas de salários e benefícios forem vinculadas.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}