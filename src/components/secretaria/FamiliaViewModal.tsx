import { X, Edit, Trash2, Calendar, User, Truck, FileText, Tag, Layers, DollarSign, Hash, Percent, ArrowRight, CheckCircle, Paperclip, Info } from 'lucide-react'

interface FamiliaViewModalProps {
  item: any
  isOpen: boolean
  onClose: () => void
  onDelete: (id: string) => void
  onEdit: (item: any) => void
}

export function FamiliaViewModal({ item, isOpen, onClose, onDelete, onEdit }: FamiliaViewModalProps) {
  if (!isOpen || !item) return null

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---'
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }

  const BadgeField = ({ icon: Icon, label, value, colorClass }: any) => (
    <div className="flex flex-col gap-1 p-2.5 rounded-2xl bg-gray-50/50 border border-gray-100/80 transition-all hover:bg-white hover:shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`p-1 rounded-md ${colorClass?.bg || 'bg-gray-100'} ${colorClass?.text || 'text-gray-500'}`}>
          <Icon className="w-3 h-3" />
        </div>
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs font-bold text-[#112240] truncate pl-1">
        {value || '---'}
      </p>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md transition-all">
      <div className="bg-white w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[95vh] flex flex-col border border-white/20">
        
        {/* Header Compacto */}
        <div className="px-8 py-5 border-b border-gray-50 flex justify-between items-center bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#112240] tracking-tight leading-none">Detalhes do Registro</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">ID: {item.id?.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all group">
            <X className="w-5 h-5 text-gray-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Content Ajustado para caber sem scroll */}
        <div className="px-8 py-6 space-y-5 overflow-hidden">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card de Valor Menor */}
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-center justify-between col-span-1">
              <div>
                <p className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest">Valor Total</p>
                <p className="text-2xl font-black text-[#1e3a8a]">{formatCurrency(item.valor)}</p>
              </div>
              <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                item.status === 'Pago' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {item.status}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 col-span-2">
              <BadgeField icon={Calendar} label="Vencimento" value={formatDate(item.vencimento)} colorClass={{bg: 'bg-blue-100', text: 'text-blue-600'}} />
              <BadgeField icon={Calendar} label="Envio" value={formatDate(item.data_envio)} colorClass={{bg: 'bg-purple-100', text: 'text-purple-600'}} />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Classificação e Origem</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <BadgeField icon={User} label="Titular" value={item.titular} />
              <BadgeField icon={Truck} label="Fornecedor" value={item.fornecedor} />
              <BadgeField icon={Tag} label="Tipo" value={item.tipo} />
              <BadgeField icon={Layers} label="Categoria" value={item.categoria} />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Documentação e Rastreio</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <BadgeField icon={Hash} label="NF" value={item.nota_fiscal} />
              <BadgeField icon={FileText} label="Fatura" value={item.fatura} />
              <BadgeField icon={ArrowRight} label="Fator Gerador" value={item.fator_gerador} />
              <BadgeField icon={Percent} label="Rateio" value={item.rateio ? `${item.rateio} (${item.rateio_porcentagem}%)` : 'N/A'} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <BadgeField icon={Paperclip} label="Recibo" value={item.recibo} />
              <BadgeField icon={Paperclip} label="Boleto" value={item.boleto} />
              <BadgeField icon={Paperclip} label="O.S." value={item.os} />
              <BadgeField icon={Paperclip} label="Comprovante" value={item.comprovante} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <h4 className="text-[10px] font-black text-[#112240] uppercase tracking-widest">Descrição</h4>
            </div>
            <div className="p-4 bg-gray-50/80 border border-gray-100 rounded-xl">
              <p className="text-xs text-[#112240] leading-relaxed font-medium line-clamp-2 whitespace-pre-wrap">
                {item.descricao_servico || 'Nenhuma descrição informada.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Compacto */}
        <div className="px-8 py-5 border-t border-gray-50 bg-white flex justify-between items-center flex-shrink-0">
          <button
            onClick={() => onDelete(item.id)}
            className="flex items-center gap-2 px-4 py-2 text-[9px] font-black text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all uppercase tracking-widest"
          >
            <Trash2 className="w-3.5 h-4" /> Excluir
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-[9px] font-black text-gray-400 hover:text-gray-600 transition-all uppercase tracking-widest"
            >
              Fechar
            </button>
            <button
              onClick={() => onEdit(item)}
              className="flex items-center gap-2 px-8 py-2 bg-[#1e3a8a] text-white text-[9px] font-black rounded-xl hover:bg-[#112240] shadow-lg transition-all active:scale-95 uppercase tracking-widest"
            >
              <Edit className="w-3.5 h-3.5" /> Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}