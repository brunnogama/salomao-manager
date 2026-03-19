import { Receipt } from 'lucide-react'

export function EmissaoNF() {
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <Receipt className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Emissão de NF
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Gestão e emissão de notas fiscais
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-400">Em desenvolvimento...</h2>
            <p className="text-gray-500 text-sm mt-2">A funcionalidade de Emissão de Notas Fiscais estará disponível em breve.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
