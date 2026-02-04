import { X, Edit2, Trash2, DollarSign, Calendar, Info, Building2, AlignLeft, Receipt } from 'lucide-react'

interface PagamentoViewModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
}

export function AeronavePagamentoViewModal({ item, isOpen, onClose, onEdit, onDelete }: PagamentoViewModalProps) {
  if (!isOpen || !item) return null

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  const formatDateBR = (dateString: string) => {
    if (!dateString) return '---'
    try {
      if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-')
        return `${day}/${month}/${year}`
      }
      return dateString
    } catch (e) {
      return dateString
    }
  }

  const DataField = ({ icon: Icon, label, value, color = "emerald", className = "" }: any) => (
    <div className={`bg-gray-50/50 p-4 rounded-xl border border-gray-100 h-full ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 text-${color}-600`} />
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-sm font-bold text-[#112240] break-words" title={value}>{value || '---'}</p>
    </div>
  )

  // Calcular diferença entre bruto e líquido
  const diferenca = (item.valor_bruto || 0) - (item.valor_liquido_realizado || 0)
  const percentualLiquido = item.valor_bruto > 0 
    ? ((item.valor_liquido_realizado / item.valor_bruto) * 100).toFixed(1) 
    : 0

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col animate-in zoom-in duration-300">
        
        {/* HEADER */}
        <div className="px-10 py-6 border-b border-gray-50 flex justify-between items-center bg-gradient-to-br from-emerald-50/50 to-white flex-shrink-0">
          <div className="flex items-center gap-5">
            <div className="p-3.5 bg-emerald-100 rounded-2xl">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#112240] tracking-tight leading-none">Detalhes do Pagamento</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-1.5">
                Gestão Financeira da Aeronave
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-2xl transition-all group">
            <X className="h-6 w-6 text-gray-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="px-10 py-8 space-y-8 overflow-auto max-h-[calc(95vh-180px)]">
          
          {/* ID DO REGISTRO */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 rounded-2xl border border-emerald-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Registro de Pagamento</p>
                  <p className="text-xl font-black text-[#112240] tracking-tight">
                    #{String(item.index_id || 0).padStart(6, '0')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 rounded-full mt-1">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-black text-emerald-700 uppercase tracking-wide">Ativo</span>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO: DATAS */}
          <div>
            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4" /> Cronograma
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DataField 
                icon={Calendar} 
                label="Data de Emissão" 
                value={formatDateBR(item.emissao)} 
                color="blue"
              />
              <DataField 
                icon={Calendar} 
                label="Data de Vencimento" 
                value={formatDateBR(item.vencimento)} 
                color="orange"
              />
            </div>
          </div>

          {/* SEÇÃO: VALORES */}
          <div>
            <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4" /> Valores e Análise
            </h4>
            
            {/* Cards de Valores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 rounded-2xl border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-amber-600" />
                  <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Valor Bruto</span>
                </div>
                <p className="text-2xl font-black text-amber-700">{formatCurrency(item.valor_bruto)}</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 rounded-2xl border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Valor Líquido</span>
                </div>
                <p className="text-2xl font-black text-emerald-700">{formatCurrency(item.valor_liquido_realizado)}</p>
                <p className="text-[8px] font-bold text-emerald-600 mt-1 uppercase tracking-widest">
                  {percentualLiquido}% do bruto
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-5 rounded-2xl border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-red-600" />
                  <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Diferença</span>
                </div>
                <p className="text-2xl font-black text-red-700">{formatCurrency(diferenca)}</p>
                <p className="text-[8px] font-bold text-red-600 mt-1 uppercase tracking-widest">
                  Descontos/Taxas
                </p>
              </div>
            </div>

            {/* Barra de Progresso Visual */}
            <div className="bg-gray-100 p-4 rounded-xl">
              <div className="flex justify-between mb-2">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                  Composição do Valor
                </span>
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                  {percentualLiquido}% Líquido
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                  style={{ width: `${percentualLiquido}%` }}
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO: IDENTIFICAÇÃO */}
          <div>
            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
              <Info className="h-4 w-4" /> Identificação
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DataField 
                icon={Receipt} 
                label="Tipo de Pagamento" 
                value={item.tipo} 
                color="indigo"
              />
              <DataField 
                icon={Building2} 
                label="Devedor" 
                value={item.devedor} 
                color="indigo"
              />
            </div>
          </div>

          {/* SEÇÃO: DESCRIÇÃO */}
          {item.descricao && (
            <div>
              <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
                <AlignLeft className="h-4 w-4" /> Descrição e Observações
              </h4>
              <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100">
                <p className="text-sm font-semibold text-gray-700 leading-relaxed break-words">
                  {item.descricao}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="px-10 py-6 border-t border-gray-50 bg-gray-50/50 flex justify-between items-center flex-shrink-0">
          <button 
            onClick={() => onDelete(item)} 
            className="flex items-center gap-2 px-6 py-3 text-red-500 hover:bg-red-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Trash2 className="h-4 w-4" /> Excluir Pagamento
          </button>

          <div className="flex gap-4">
            <button 
              onClick={onClose} 
              className="px-6 py-3 text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Fechar
            </button>
            <button 
              onClick={() => onEdit(item)} 
              className="flex items-center gap-3 px-10 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all transform active:scale-95"
            >
              <Edit2 className="h-4 w-4" /> Editar Pagamento
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}