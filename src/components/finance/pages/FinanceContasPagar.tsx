import { useState } from 'react'
import {
  ArrowUpCircle,
  Plus,
  FileText,
  Receipt
} from 'lucide-react'
import { ReembolsosTab } from './ReembolsosTab'

export function FinanceContasPagar() {
  const [activeTab, setActiveTab] = useState<'geral' | 'reembolsos'>('reembolsos')

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

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0 justify-end flex-wrap">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95">
            <Plus className="h-4 w-4" /> Nova Conta
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full flex-1">
        
        {/* TABS NAVEGAÇÃO */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('geral')}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-sm tracking-wide transition-all border-b-2 ${
              activeTab === 'geral' 
                ? 'border-[#1e3a8a] text-[#1e3a8a]' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" /> Geral / Fornecedores
          </button>
          
          <button
            onClick={() => setActiveTab('reembolsos')}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-sm tracking-wide transition-all border-b-2 ${
              activeTab === 'reembolsos' 
                ? 'border-[#1e3a8a] text-[#1e3a8a]' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Receipt className="w-4 h-4" /> Solicitações de Reembolso
          </button>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <div className="animate-in fade-in zoom-in-[0.98] duration-300">
          {activeTab === 'geral' && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-blue-50 mb-4">
                  <FileText className="h-12 w-12 text-[#1e3a8a] opacity-20" />
                </div>
                <h2 className="text-xl font-black text-[#0a192f]">Em breve!</h2>
                <p className="text-gray-500 max-w-sm mt-2">
                  Gestão Geral de Contas a Pagar em Construção.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'reembolsos' && (
             <ReembolsosTab />
          )}
        </div>

      </div>
    </div>
  )
}
