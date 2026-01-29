import { X, Edit, Trash2, Calendar, User, Truck, FileText, Tag, Layers, DollarSign, Hash, Percent, ArrowRight, CheckCircle, Paperclip } from 'lucide-react'

interface FamiliaViewModalProps {
  item: any
  isOpen: boolean
  onClose: () => void
  onDelete: (id: string) => void
  onEdit: (item: any) => void
}

export function FamiliaViewModal({ item, isOpen, onClose, onDelete, onEdit }: FamiliaViewModalProps) {
  if (!isOpen || !item) return null

  const InfoField = ({ icon: Icon, label, value, color }: any) => (
    <div className="flex flex-col p-3 rounded-lg border border-gray-100 bg-gray-50/50">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color || 'text-gray-400'}`} />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-semibold text-[#112240] truncate">
        {value || '---'}
      </p>
    </div>
  )

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---'
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-[#112240]">Detalhes do Lançamento</h3>
            <p className="text-xs text-gray-500">ID: {item.id?.substring(0, 8)}...</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoField icon={Calendar} label="Vencimento" value={formatDate(item.vencimento)} color="text-blue-500" />
          <InfoField icon={User} label="Titular" value={item.titular} color="text-purple-500" />
          <InfoField icon={Truck} label="Fornecedor" value={item.fornecedor} color="text-orange-500" />
          <InfoField icon={DollarSign} label="Valor" value={formatCurrency(item.valor)} color="text-green-600" />
          
          <div className="md:col-span-2">
            <InfoField icon={FileText} label="Descrição do Serviço" value={item.descricao_servico} />
          </div>
          <InfoField icon={Tag} label="Tipo" value={item.tipo} />
          <InfoField icon={Layers} label="Categoria" value={item.categoria} />

          <InfoField icon={Hash} label="Nota Fiscal" value={item.nota_fiscal} />
          <InfoField icon={FileText} label="Documentos" value={`${item.recibo ? 'Recibo' : ''} ${item.boleto ? 'Boleto' : ''} ${item.os ? 'O.S.' : ''}`.trim() || 'Nenhum'} />
          <InfoField icon={Percent} label="Rateio" value={item.rateio ? `${item.rateio} (${item.rateio_porcentagem}%)` : 'Não se aplica'} />
          <InfoField icon={ArrowRight} label="Fator Gerador" value={item.fator_gerador} />

          <InfoField icon={Calendar} label="Data de Envio" value={formatDate(item.data_envio)} />
          <InfoField icon={CheckCircle} label="Status" value={item.status} color={item.status === 'Pago' ? 'text-green-500' : 'text-amber-500'} />
          <div className="md:col-span-2">
            <InfoField icon={Paperclip} label="Comprovante" value={item.comprovante || 'Nenhum anexo'} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <button
            onClick={() => onDelete(item.id)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Excluir Registro
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={() => onEdit(item)}
              className="flex items-center gap-2 px-6 py-2 bg-[#1e3a8a] text-white text-sm font-medium rounded-lg hover:bg-[#1e3a8a]/90 shadow-md transition-all active:scale-95"
            >
              <Edit className="w-4 h-4" /> Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}