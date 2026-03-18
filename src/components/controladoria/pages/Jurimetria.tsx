import { Share2, Construction } from 'lucide-react';

export function Jurimetria() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6">

      {/* 1. Header - Salomão Design System */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-2.5 sm:p-3 shadow-lg shrink-0">
            <Share2 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Jurimetria</h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">Análise de Conexões & Processos</p>
          </div>
        </div>
      </div>

      {/* Conteúdo - Em Construção */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 shadow-sm">
            <Construction className="h-10 w-10 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#0a192f] tracking-tight">Ainda em Construção</h2>
            <p className="text-sm text-gray-500 mt-1 max-w-md">Esta funcionalidade está sendo desenvolvida e estará disponível em breve.</p>
          </div>
        </div>
      </div>
    </div>
  );
}