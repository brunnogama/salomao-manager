import { X, Receipt, DollarSign } from 'lucide-react'

interface TipoLancamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDespesa: () => void;
  onSelectPagamento: () => void;
}

export function TipoLancamentoModal({ isOpen, onClose, onSelectDespesa, onSelectPagamento }: TipoLancamentoModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md transition-all">
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/20">
        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-2xl font-black text-[#112240] tracking-tight leading-none">
              Novo Lançamento
            </h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-1.5">Selecione o tipo</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-2xl transition-all group">
            <X className="h-6 w-6 text-gray-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={onSelectDespesa}
            className="group relative bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 border-2 border-blue-200 hover:border-blue-400 rounded-2xl p-8 transition-all hover:scale-105 hover:shadow-xl"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-2xl shadow-md group-hover:shadow-lg transition-all">
                <Receipt className="h-12 w-12 text-blue-600" />
              </div>
              <h4 className="text-xl font-black text-[#112240] tracking-tight">Custo Missões</h4>
            </div>
          </button>

          <button
            onClick={onSelectPagamento}
            className="group relative bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:from-emerald-100 hover:to-emerald-200/50 border-2 border-emerald-200 hover:border-emerald-400 rounded-2xl p-8 transition-all hover:scale-105 hover:shadow-xl"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-2xl shadow-md group-hover:shadow-lg transition-all">
                <DollarSign className="h-12 w-12 text-emerald-600" />
              </div>
              <h4 className="text-xl font-black text-[#112240] tracking-tight">Despesas Fixas</h4>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
