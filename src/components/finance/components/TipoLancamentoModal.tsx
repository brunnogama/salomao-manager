import { X, Receipt, DollarSign } from 'lucide-react'

interface TipoLancamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDespesa: () => void;
  onSelectPagamento: () => void;
}

export function TipoLancamentoModal({ 
  isOpen, 
  onClose, 
  onSelectDespesa, 
  onSelectPagamento 
}: TipoLancamentoModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md transition-all">
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/20">
        
        {/* HEADER */}
        <div className="px-8 py-5 border-b border-gray-50 flex justify-between items-center bg-gradient-to-br from-blue-50/50 to-white">
          <div>
            <h3 className="text-xl font-black text-[#112240] tracking-tight leading-none">
              Novo Lançamento
            </h3>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              Selecione o tipo
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-xl transition-all group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-8 space-y-4">
          
          {/* BOTÃO DESPESA */}
          <button
            onClick={onSelectDespesa}
            className="w-full group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-600 hover:to-blue-700 border-2 border-blue-200 hover:border-blue-600 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white group-hover:bg-blue-500 rounded-xl shadow-md transition-all duration-300">
                <Receipt className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-lg font-black text-[#112240] group-hover:text-white tracking-tight transition-colors duration-300">
                  Despesa Operacional
                </h4>
                <p className="text-[10px] font-bold text-gray-500 group-hover:text-blue-100 uppercase tracking-widest mt-1 transition-colors duration-300">
                  Combustível, Taxas, Manutenção
                </p>
              </div>
              <div className="text-blue-600 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* BOTÃO PAGAMENTO */}
          <button
            onClick={onSelectPagamento}
            className="w-full group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:from-emerald-600 hover:to-emerald-700 border-2 border-emerald-200 hover:border-emerald-600 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white group-hover:bg-emerald-500 rounded-xl shadow-md transition-all duration-300">
                <DollarSign className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-lg font-black text-[#112240] group-hover:text-white tracking-tight transition-colors duration-300">
                  Pagamento / Recebimento
                </h4>
                <p className="text-[10px] font-bold text-gray-500 group-hover:text-emerald-100 uppercase tracking-widest mt-1 transition-colors duration-300">
                  Valores a Pagar ou Receber
                </p>
              </div>
              <div className="text-emerald-600 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

        </div>

        {/* FOOTER */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2 text-[9px] font-black text-gray-400 hover:text-gray-600 transition-all uppercase tracking-widest"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  )
}