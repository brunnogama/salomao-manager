import { useState } from 'react'
import { X, Save, Paperclip, Percent, FileText, ClipboardList, Receipt } from 'lucide-react'
import { FamiliaMenuSelector } from './FamiliaMenuSelector'

interface FamiliaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export function FamiliaFormModal({ isOpen, onClose, onSave }: FamiliaFormModalProps) {
  const [formData, setFormData] = useState({
    vencimento: '',
    titular: '',
    fornecedor: '',
    descricao_servico: '',
    tipo: '',
    categoria: '',
    valor: '',
    nota_fiscal: '',
    recibo: '',
    boleto: '',
    os: '',
    rateio: '',
    rateio_porcentagem: '',
    fator_gerador: '',
    data_envio: '',
    status: 'Pendente',
    comprovante: ''
  })

  const [showRateio, setShowRateio] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-[#112240]">Novo Lançamento</h3>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Gestão Família Salomão</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Formulário */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Datas e Valores */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">Vencimento</label>
              <input 
                type="date" 
                className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.vencimento}
                onChange={e => setFormData({...formData, vencimento: e.target.value})}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">Data de Envio</label>
              <input 
                type="date" 
                className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.data_envio}
                onChange={e => setFormData({...formData, data_envio: e.target.value})}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">Valor (R$)</label>
              <input 
                type="text" 
                placeholder="R$ 0,00"
                className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-[#1e3a8a] outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.valor}
                onChange={e => setFormData({...formData, valor: e.target.value})}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">Nota Fiscal</label>
              <input 
                type="text" 
                placeholder="XXXXXXX"
                className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.nota_fiscal}
                onChange={e => setFormData({...formData, nota_fiscal: e.target.value})}
              />
            </div>

            {/* Menus Suspensos Gerenciáveis */}
            <FamiliaMenuSelector label="Titular" tipoMenu="titular" value={formData.titular} onChange={v => setFormData({...formData, titular: v})} />
            <FamiliaMenuSelector label="Fornecedor" tipoMenu="fornecedor" value={formData.fornecedor} onChange={v => setFormData({...formData, fornecedor: v})} />
            <FamiliaMenuSelector label="Tipo" tipoMenu="tipo" value={formData.tipo} onChange={v => setFormData({...formData, tipo: v})} />
            <FamiliaMenuSelector label="Categoria" tipoMenu="categoria" value={formData.categoria} onChange={v => setFormData({...formData, categoria: v})} />
            <FamiliaMenuSelector label="Fator Gerador" tipoMenu="fator_gerador" value={formData.fator_gerador} onChange={v => setFormData({...formData, fator_gerador: v})} />
            <FamiliaMenuSelector label="Status" tipoMenu="status" value={formData.status} onChange={v => setFormData({...formData, status: v})} />

            {/* Documentos Rápidos */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">Recibo / Boleto / O.S.</label>
              <div className="flex gap-2">
                <input type="text" placeholder="Recibo" className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500" value={formData.recibo} onChange={e => setFormData({...formData, recibo: e.target.value})} />
                <input type="text" placeholder="Boleto" className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500" value={formData.boleto} onChange={e => setFormData({...formData, boleto: e.target.value})} />
              </div>
            </div>

            <div className="flex items-end pb-1">
              <button 
                onClick={() => setShowRateio(!showRateio)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${showRateio ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-600 border-gray-200'} border`}
              >
                <Percent className="w-4 h-4" />
                {showRateio ? 'Remover Rateio' : 'Configurar Rateio'}
              </button>
            </div>

            {/* Campos de Rateio */}
            {showRateio && (
              <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-purple-50/30 rounded-xl border border-purple-100 animate-in slide-in-from-top-2">
                <FamiliaMenuSelector label="Rateio (Item)" tipoMenu="rateio" value={formData.rateio} onChange={v => setFormData({...formData, rateio: v})} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-purple-600 uppercase tracking-tighter">Porcentagem (%)</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    className="bg-white border border-purple-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    value={formData.rateio_porcentagem}
                    onChange={e => setFormData({...formData, rateio_porcentagem: e.target.value})}
                  />
                </div>
              </div>
            )}

            {/* Descrição */}
            <div className="flex flex-col gap-1.5 lg:col-span-4">
              <label className="text-xs font-bold text-gray-600 uppercase">Descrição do Serviço</label>
              <textarea 
                rows={2}
                className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={formData.descricao_servico}
                onChange={e => setFormData({...formData, descricao_servico: e.target.value})}
              />
            </div>
          </div>

          {/* Área de Comprovante (GED) */}
          <div className="mt-8 p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 flex flex-col items-center justify-center gap-2 hover:border-[#1e3a8a] transition-all cursor-pointer group">
            <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform text-[#1e3a8a]">
              <Paperclip className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#112240]">Comprovante (GED)</p>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Arraste ou clique para anexar</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors uppercase tracking-widest">
            Cancelar
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="flex items-center gap-2 bg-[#1e3a8a] text-white px-10 py-2.5 rounded-lg text-sm font-bold hover:bg-[#1e3a8a]/90 shadow-lg shadow-blue-900/20 transition-all active:scale-95 uppercase tracking-widest"
          >
            <Save className="w-4 h-4" />
            Salvar Lançamento
          </button>
        </div>
      </div>
    </div>
  )
}