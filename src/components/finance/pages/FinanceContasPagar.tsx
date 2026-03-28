import { ArrowUpCircle } from 'lucide-react'
import { ReembolsosTab } from './ReembolsosTab'

export function FinanceContasPagar() {
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6">
      {/* PAGE HEADER - Padrão Salomão Design System */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <ArrowUpCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Contas a Pagar
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Gestão de saídas, fornecedores e reembolsos
            </p>
          </div>
        </div>

        {/* Action buttons area handled inside tabs if needed */}
      </div>

      <div className="w-full space-y-4 sm:space-y-6 flex-1">
        <div className="animate-in fade-in zoom-in-[0.98] duration-300">
          <ReembolsosTab />
        </div>
      </div>
    </div>
  )
}
