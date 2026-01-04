import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

// Interface dos dados do cliente
export interface ClientData {
  id?: number;
  nome: string;
  empresa: string;
  cargo: string;
  tipoBrinde: string;
  outroBrinde?: string;
  quantidade: number;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  email: string;
  socio: string;
  observacoes: string;
}

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: ClientData) => void;
  clientToEdit?: ClientData | null;
}

export function NewClientModal({ isOpen, onClose, onSave, clientToEdit }: NewClientModalProps) {
  const initialData: ClientData = {
    nome: '',
    empresa: '',
    cargo: '',
    tipoBrinde: 'Brinde Médio',
    outroBrinde: '',
    quantidade: 1,
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    email: '',
    socio: '',
    observacoes: ''
  }

  const [formData, setFormData] = useState<ClientData>(initialData)
  const [loadingCep, setLoadingCep] = useState(false)
  const [isNewSocio, setIsNewSocio] = useState(false)

  // REMOVIDO "Outro Sócio" DA LISTA
  const socios = ['Marcio Gama', 'Rodrigo Salomão']

  useEffect(() => {
    if (isOpen) {
      if (clientToEdit) {
        setFormData(clientToEdit)
      } else {
        setFormData(initialData)
      }
    }
  }, [isOpen, clientToEdit])

  if (!isOpen) return null

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 5) {
      value = value.replace(/^(\d{5})(\d)/, '$1-$2')
    }
    setFormData({ ...formData, cep: value })
  }

  const handleCepBlur = async () => {
    const cepClean = formData.cep.replace(/\D/g, '')
    if (cepClean.length === 8) {
      setLoadingCep(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`)
        const data = await response.json()
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
          }))
        }
      } catch (error) {
        console.error("Erro ao buscar CEP", error)
      }
      setLoadingCep(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl my-8 transform transition-all">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-[#112240]">
              {clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {clientToEdit ? 'Atualize as informações abaixo.' : 'Preencha os dados obrigatórios marcados com *.'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Coluna 1 */}
          <div className="space-y-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Dados Corporativos</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input required type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#112240] focus:ring-1 focus:ring-[#112240] outline-none transition-all" 
                value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: João da Silva" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empresa <span className="text-red-500">*</span>
                </label>
                <input required type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#112240] focus:ring-1 focus:ring-[#112240] outline-none" 
                  value={formData.empresa} onChange={e => setFormData({...formData, empresa: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <input type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#112240] focus:ring-1 focus:ring-[#112240] outline-none" 
                  value={formData.cargo} onChange={e => setFormData({...formData, cargo: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail Corporativo <span className="text-red-500">*</span>
              </label>
              <input required type="email" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#112240] focus:ring-1 focus:ring-[#112240] outline-none" 
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sócio Responsável <span className="text-red-500">*</span>
              </label>
              {!isNewSocio ? (
                <select 
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#112240] focus:ring-1 focus:ring-[#112240] outline-none bg-white"
                  value={formData.socio}
                  onChange={(e) => {
                    if(e.target.value === 'new') setIsNewSocio(true)
                    else setFormData({...formData, socio: e.target.value})
                  }}
                >
                  <option value="">Selecione um sócio...</option>
                  {socios.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="new" className="font-bold text-blue-600">+ Adicionar Novo</option>
                </select>
              ) : (
                <div className="flex gap-2 animate-fadeIn">
                   <input required type="text" placeholder="Nome do novo sócio" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#112240] outline-none" autoFocus
                     onChange={e => setFormData({...formData, socio: e.target.value})} />
                   <button type="button" onClick={() => setIsNewSocio(false)} className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-100">Cancelar</button>
                </div>
              )}
            </div>
          </div>

          {/* Coluna 2 */}
          <div className="space-y-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Logística de Brindes</h3>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria <span className="text-red-500">*</span>
                  </label>
                  <select 
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#112240] focus:ring-1 focus:ring-[#112240] outline-none bg-white"
                    value={formData.tipoBrinde}
                    onChange={e => setFormData({...formData, tipoBrinde: e.target.value})}
                  >
                    <option value="Brinde Médio">Brinde Médio</option>
                    <option value="Brinde VIP">Brinde VIP</option>
                    <option value="Outro">Outro</option>
                  </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Qtd. <span className="text-red-500">*</span>
                 </label>
                 <input required type="number" min="1" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#112240] outline-none" 
                   value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: Number(e.target.value)})} />
               </div>
            </div>

            {formData.tipoBrinde === 'Outro' && (
               <div className="animate-fadeIn">
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Especifique <span className="text-red-500">*</span>
                 </label>
                 <input required type="text" className="w-full rounded-md border border-yellow-300 px-3 py-2 bg-yellow-50 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none" 
                   value={formData.outroBrinde} onChange={e => setFormData({...formData, outroBrinde: e.target.value})} placeholder="Ex: Cesta de Natal Premium" />
               </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input required type="text" maxLength={9} className="w-full rounded-md border border-gray-300 pl-3 pr-8 py-2 focus:border-[#112240] outline-none" 
                    value={formData.cep} onChange={handleCepChange} onBlur={handleCepBlur} placeholder="00000-000" />
                  {loadingCep && <div className="absolute right-2 top-2.5 h-4 w-4 border-2 border-[#112240] border-t-transparent rounded-full animate-spin"></div>}
                </div>
              </div>
              <div className="col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Endereço <span className="text-red-500">*</span>
                 </label>
                 <input required type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 focus:bg-white focus:border-[#112240] outline-none transition-colors" 
                   value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Número <span className="text-red-500">*</span>
                 </label>
                 <input required type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#112240] outline-none" 
                   value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                 <input type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#112240] outline-none" 
                   value={formData.complemento} onChange={e => setFormData({...formData, complemento: e.target.value})} />
               </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Bairro <span className="text-red-500">*</span>
                 </label>
                 <input required type="text" className="w-full rounded-md border border-gray-300 px-2 py-2 bg-gray-50" 
                   value={formData.bairro} onChange={e => setFormData({...formData, bairro: e.target.value})} />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Cidade <span className="text-red-500">*</span>
                 </label>
                 <input required type="text" className="w-full rounded-md border border-gray-300 px-2 py-2 bg-gray-50" 
                   value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   UF <span className="text-red-500">*</span>
                 </label>
                 <input required type="text" maxLength={2} className="w-full rounded-md border border-gray-300 px-2 py-2 bg-gray-50 uppercase" 
                   value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} />
               </div>
            </div>
          </div>

          {/* Observações */}
          <div className="md:col-span-2">
             <label className="block text-sm font-medium text-gray-700 mb-1">Observações Internas</label>
             <textarea rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#112240] outline-none resize-none" 
               value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} placeholder="Ex: Cliente prefere contato via WhatsApp..."></textarea>
          </div>

          {/* Footer */}
          <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t border-gray-100">
             <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">
               Cancelar
             </button>
             <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-[#112240] hover:bg-[#1a3a6c] rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5">
               {clientToEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}
             </button>
          </div>

        </form>
      </div>
    </div>
  )
}
