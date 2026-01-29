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
    <div className="flex flex-col gap-1.5 p-4 rounded-[1.5rem] bg-gray-50/50 border border-gray-100/80 transition-all hover:bg-white hover:shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${colorClass?.bg || 'bg-gray-100'} ${colorClass?.text || 'text-gray-500'}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{label}</span>
      </div>
      <p className="text-sm font-bold text-[#112240] truncate pl-1">
        {value || '---'}
      </p>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md transition-all">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col border border-white/20">
        
        {/* Header Elegante */}
        <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-start bg-white flex-shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-[#112240] tracking-tight">Detalhes do Registro</h3>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] ml-12">Protocolo Interno: {item.id?.substring(0, 12).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all group">
            <X className="w-6 h-6 text-gray-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Content com Scroll Suave */}
        <div className="px-10 py-8 overflow-y-auto space-y-8 custom-scrollbar">
          
          {/* Seção Principal: Destaque de Valor e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100/50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest mb-1">Valor Total</p>
                <p className="text-3xl font-black text-[#1e3a8a]">{formatCurrency(item.valor)}</p>
              </div>
              <div className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest ${
                item.status === 'Pago' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {item.status}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <BadgeField icon={Calendar} label="Vencimento" value={formatDate(item.vencimento)} colorClass={{bg: 'bg-blue-100', text: 'text-blue-600'}} />
              <BadgeField icon={Calendar} label="Envio" value={formatDate(item.data_envio)} colorClass={{bg: 'bg-purple-100', text: 'text-purple-600'}} />
            </div>
          </div>

          {/* Grid de Informações Secundárias */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Classificação e Origem</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <BadgeField icon={User} label="Titular" value={item.titular} />
              <BadgeField icon={Truck} label="Fornecedor" value={item.fornecedor} />
              <BadgeField icon={Tag} label="Tipo" value={item.tipo} />
              <BadgeField icon={Layers} label="Categoria" value={item.categoria} />
            </div>
          </div>

          {/* Seção de Documentos e Rastreio */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Documentação e Rastreio</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <BadgeField icon={Hash} label="NF" value={item.nota_fiscal} />
              <BadgeField icon={FileText} label="Fatura" value={item.fatura} />
              <BadgeField icon={ArrowRight} label="Fator Gerador" value={item.fator_gerador} />
              <BadgeField icon={Percent} label="Rateio" value={item.rateio ? `${item.rateio} (${item.rateio_porcentagem}%)` : 'N/A'} />
            </div>
          </div>

          {/* Anexos Rápidos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <BadgeField icon={Paperclip} label="Recibo" value={item.recibo} />
              <BadgeField icon={Paperclip} label="Boleto" value={item.boleto} />
              <BadgeField icon={Paperclip} label="O.S." value={item.os} />
              <BadgeField icon={Paperclip} label="Comprovante" value={item.comprovante} />
          </div>

          {/* Descrição em Bloco de Destaque */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-2 px-1">
              <FileText className="w-4 h-4 text-blue-600" />
              <h4 className="text-[11px] font-black text-[#112240] uppercase tracking-[0.2em]">Descrição Detalhada</h4>
            </div>
            <div className="p-6 bg-gray-50/80 border border-gray-100 rounded-[2rem]">
              <p className="text-sm text-[#112240] leading-relaxed font-medium whitespace-pre-wrap">
                {item.descricao_servico || 'Nenhuma descrição informada para este lançamento.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer com Ações Separadas */}
        <div className="px-10 py-8 border-t border-gray-50 bg-white flex justify-between items-center flex-shrink-0">
          <button
            onClick={() => onDelete(item.id)}
            className="flex items-center gap-2 px-6 py-3 text-[10px] font-black text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all uppercase tracking-widest"
          >
            <Trash2 className="w-4 h-4" /> Remover Registro
          </button>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-8 py-3 text-[10px] font-black text-gray-400 hover:text-gray-600 transition-all uppercase tracking-widest"
            >
              Fechar
            </button>
            <button
              onClick={() => onEdit(item)}
              className="flex items-center gap-3 px-10 py-3 bg-[#1e3a8a] text-white text-[10px] font-black rounded-2xl hover:bg-[#112240] shadow-xl shadow-blue-900/10 transition-all active:scale-95 uppercase tracking-widest"
            >
              <Edit className="w-4 h-4" /> Editar Dados
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}