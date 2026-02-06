import { useState } from 'react'
import { 
  FileText, 
  UserCircle, 
  Grid, 
  LogOut,
  Upload,
  Search,
  Folder,
  ShieldCheck,
  Filter
} from 'lucide-react'

interface RHGEDProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function RHGED({ userName = 'Usuário', onModuleHome, onLogout }: RHGEDProps) {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">
      
      {/* PAGE HEADER - Padrão Salomão Design System */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <Folder className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              GED RH
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Gestão Eletrônica de Documentos e Prontuários Digitais
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
        
        {/* TOOLBAR */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar documento ou colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium text-sm"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-100 text-[#0a192f] rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-sm hover:bg-gray-50 transition-all">
              <Filter className="h-4 w-4" /> Categorias
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95">
              <Upload className="h-4 w-4" /> Upload Arquivo
            </button>
          </div>
        </div>

        {/* INFO BOX - LGPD */}
        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-center gap-4">
           <div className="p-2 bg-white rounded-lg shadow-sm">
              <ShieldCheck className="h-5 w-5 text-[#1e3a8a]" />
           </div>
           <p className="text-xs font-semibold text-[#1e3a8a]/80">
             Todos os documentos são armazenados com criptografia de ponta e em conformidade com a LGPD para dados sensíveis de colaboradores.
           </p>
        </div>

        {/* LISTA DE ARQUIVOS (PLACEHOLDER) */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-full bg-blue-50 mb-4">
              <FileText className="h-12 w-12 text-[#1e3a8a] opacity-20" />
            </div>
            <h2 className="text-xl font-black text-[#0a192f]">Nenhum arquivo digitalizado</h2>
            <p className="text-gray-500 max-w-sm mt-2">
              Comece fazendo o upload de contratos, termos ou documentos de identificação dos colaboradores.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}