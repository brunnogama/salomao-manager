import { useState, useEffect } from 'react'
import { X, Save, AlertCircle, Search, Loader2 } from 'lucide-react'

export interface ClientData {
  nome: string
  empresa: string
  cargo: string
  telefone: string
  tipoBrinde: string
  outroBrinde: string
  quantidade: number
  cep: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  email: string
  socio: string
  observacoes: string
  ignored_fields?: string[]
}

interface NewClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (client: ClientData) => Promise<void>
  clientToEdit?: ClientData | null
}

export function NewClientModal({ isOpen, onClose, onSave, clientToEdit }: NewClientModalProps) {
  const [formData, setFormData] = useState<ClientData>({
    nome: '', empresa: '', cargo: '', telefone: '', tipoBrinde: '', outroBrinde: '',
    quantidade: 1, cep: '', endereco: '', numero: '', complemento: '', bairro: '',
    cidade: '', estado: '', email: '', socio: '', observacoes: '', ignored_fields: []
  })
  
  const [loadingCep, setLoadingCep] = useState(false)

  useEffect(() => {
    if (clientToEdit) {
      setFormData(clientToEdit)
    } else {
      setFormData({
        nome: '', empresa: '', cargo: '', telefone: '', tipoBrinde: '', outroBrinde: '',
        quantidade: 1, cep: '', endereco: '', numero: '', complemento: '', bairro: '',
        cidade: '', estado: '', email: '', socio: '', observacoes: '', ignored_fields: []
      })
    }
  }, [clientToEdit, isOpen])

  if (!isOpen) return null

  // Função para buscar o CEP
  const handleSearchCep = async () => {
    const cep = formData.cep.replace(/\D/g, '')

    if (cep.length !== 8) {
      alert('Por favor, digite um CEP válido com 8 números.')
      return
    }

    setLoadingCep(true)

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (data.erro) {
        alert('CEP não encontrado na base de dados.')
      } else {
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf
        }))
      }
    } catch (error) {
      alert('Erro ao buscar o CEP. Verifique sua conexão.')
      console.error(error)
    } finally {
      setLoadingCep(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    if (!formData.nome || !formData.tipoBrinde || !formData.socio) {
      alert('Para cadastrar, apenas Nome, Tipo de Brinde e Sócio são obrigatórios. O restante pode ser preenchido depois.')
      return
    }

    // Validação específica para "Outro"
    if (formData.tipoBrinde === 'Outro' && !formData.outroBrinde) {
      alert('Por favor, especifique qual é o brinde.')
      return
    }

    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
        <div className="bg-[#112240] p-6 flex justify-between items-center text-white shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}
            <span className="text-xs font-normal bg-white/20 px-2 py-1 rounded text-gray-200">
              * Mínimo Obrigatório: Nome, Brinde, Sócio
            </span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="h-6 w-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <form id="client-form" onSubmit={handleSubmit} className="space-y-8">
            {/* SEÇÃO 1: DADOS ESSENCIAIS E BRINDES */}
            <section>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Dados Essenciais
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo *</label>
                  <input 
                    type="text" 
                    value={formData.nome} 
                    onChange={e => setFormData({...formData, nome: e.target.value})} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#112240] focus:border-transparent outline-none transition-all" 
                    placeholder="Ex: João Silva" 
                  />
                </div>
                
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Sócio Responsável *</label>
                  <select 
                    value={formData.socio} 
                    onChange={e => setFormData({...formData, socio: e.target.value})} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#112240] outline-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="Rodrigo Salomão">Rodrigo Salomão</option>
                    <option value="Livia Sancio">Livia Sancio</option>
                    <option value="Rodrigo Cotta">Rodrigo Cotta</option>
                    <option value="Luis Felipe Salomão">Luis Felipe Salomão</option>
                    <option value="Luiz Pavan">Luiz Pavan</option>
                    <option value="Alice Studart">Alice Studart</option>
                  </select>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Categoria do Brinde *</label>
                  <select 
                    value={formData.tipoBrinde} 
                    onChange={e => setFormData({...formData, tipoBrinde: e.target.value})} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#112240] outline-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="Brinde VIP">Brinde VIP</option>
                    <option value="Brinde Médio">Brinde Médio</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                {formData.tipoBrinde === 'Outro' && (
                  <div className="md:col-span-3 animate-fadeIn">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Qual Brinde? *</label>
                    <input 
                      type="text" 
                      value={formData.outroBrinde} 
                      onChange={e => setFormData({...formData, outroBrinde: e.target.value})} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#112240] outline-none bg-blue-50/50" 
                      placeholder="Especifique o tipo de brinde..." 
                    />
                  </div>
                )}

                <div className="md:col-span-1">
                   <label className="block text-sm font-bold text-gray-700 mb-1">Quantidade</label>
                   <input 
                    type="number" 
                    min="1" 
                    value={formData.quantidade} 
                    onChange={e => setFormData({...formData, quantidade: Number(e.target.value)})} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#112240] outline-none" 
                   />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-4">Informações Complementares</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                  <input type="text" value={formData.empresa} onChange={e => setFormData({...formData, empresa: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#112240] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                  <input type="text" value={formData.cargo} onChange={e => setFormData({...formData, cargo: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#112240] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone/WhatsApp</label>
                  <input type="text" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#112240] outline-none" placeholder="(00) 00000-0000" />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#112240] outline-none" />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-4">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                
                {/* CAMPO CEP COM LUPA */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.cep} 
                      onChange={e => setFormData({...formData, cep: e.target.value})} 
                      className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#112240] outline-none"
                      placeholder="00000-000"
                    />
                    <button 
                      type="button" 
                      onClick={handleSearchCep} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                      title="Buscar CEP"
                      disabled={loadingCep}
                    >
                      {loadingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço (Rua/Av)</label>
                  <input type="text" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#112240] outline-none" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <input type="text" value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#112240] outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                  <input type="text" value={formData.bairro} onChange={e => setFormData({...formData, bairro: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#112240] outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input type="text" value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#112240] outline-none" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                  <input type="text" value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#112240] outline-none" maxLength={2} />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                  <input type="text" value={formData.complemento} onChange={e => setFormData({...formData, complemento: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#112240] outline-none" />
                </div>
              </div>
            </section>

            <section>
               <label className="block text-sm font-bold text-gray-700 mb-1">Observações Internas</label>
               <textarea rows={3} value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#112240] outline-none resize-none"></textarea>
            </section>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-gray-700 font-bold hover:bg-gray-200 transition-colors">Cancelar</button>
          <button form="client-form" type="submit" className="px-6 py-2.5 rounded-lg bg-[#112240] text-white font-bold hover:bg-[#1a3a6c] transition-all shadow-lg flex items-center gap-2">
            <Save className="h-5 w-5" /> Salvar Cliente
          </button>
        </div>
      </div>
    </div>
  )
}
