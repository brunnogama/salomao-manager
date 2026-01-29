import { Fragment, useState, useEffect, useRef, useMemo } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Save, Gift, Calendar, Clock, UserCircle, ChevronDown, Plus, Trash2, Loader2, MapPin, Info, Building2, Mail, Phone, User, Briefcase } from 'lucide-react'
import { IMaskInput } from 'react-imask'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/logger'
import { ClientData, GiftHistoryItem } from '../types/client'

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: ClientData) => void;
  clientToEdit?: ClientData | null;
  tableName?: string;
}

export function NewClientModal({ isOpen, onClose, onSave, clientToEdit, tableName = 'clientes' }: NewClientModalProps) {
  const [activeTab, setActiveTab] = useState<'geral' | 'endereco' | 'historico'>('geral')
  const [brindeOptions, setBrindeOptions] = useState<string[]>(['Brinde VIP', 'Brinde Médio', 'Não Recebe', 'Outro'])
  
  const [sociosList, setSociosList] = useState<{ id: number, nome: string }[]>([])
  const [isSocioMenuOpen, setIsSocioMenuOpen] = useState(false)
  const [newSocioName, setNewSocioName] = useState('')
  const [loadingSocios, setLoadingSocios] = useState(false)
  const socioMenuRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState<ClientData>({
    nome: '', empresa: '', cargo: '', telefone: '',
    tipo_brinde: 'Brinde Médio', outro_brinde: '', quantidade: 1,
    cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
    email: '', socio: '', observacoes: '', historico_brindes: []
  })

  // --- EFEITOS E BUSCA DE DADOS ---
  useEffect(() => {
    if (isOpen) {
      fetchBrindes()
      fetchSocios()
    }
  }, [isOpen])

  useEffect(() => {
    if (clientToEdit) {
      setFormData({
        ...clientToEdit,
        historico_brindes: initializeHistory(clientToEdit.historico_brindes)
      })
    } else {
      setFormData({
        nome: '', empresa: '', cargo: '', telefone: '',
        tipo_brinde: 'Brinde Médio', outro_brinde: '', quantidade: 1,
        cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
        email: '', socio: '', observacoes: '', historico_brindes: initializeHistory([])
      })
    }
    setActiveTab('geral')
    setIsSocioMenuOpen(false)
  }, [clientToEdit, isOpen])

  const fetchBrindes = async () => {
    const { data } = await supabase.from('tipos_brinde').select('nome').eq('ativo', true).order('nome')
    if (data && data.length > 0) {
      setBrindeOptions([...new Set([...data.map(d => d.nome), 'Não Recebe', 'Outro'])])
    }
  }

  const fetchSocios = async () => {
    setLoadingSocios(true)
    const { data } = await supabase.from('socios').select('*').order('nome')
    if (data) setSociosList(data)
    setLoadingSocios(false)
  }

  // --- HANDLERS ---
  const handleSave = async () => {
    if (!formData.nome) return alert('Nome é obrigatório')
    try {
      const { error } = clientToEdit?.id 
        ? await supabase.from(tableName).update(formData).eq('id', clientToEdit.id)
        : await supabase.from(tableName).insert([formData])
      
      if (error) throw error
      await logAction(clientToEdit ? 'UPDATE' : 'CREATE', tableName.toUpperCase(), `${clientToEdit ? 'Editou' : 'Criou'} ${formData.nome}`)
      onSave(formData); onClose()
    } catch (error: any) { alert('Erro ao salvar: ' + error.message) }
  }

  const handleCepBlur = async (e: any) => {
    const cep = e.target.value.replace(/\D/g, '')
    if (cep.length === 8) {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setFormData(prev => ({ ...prev, endereco: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf }))
      }
    }
  }

  const initializeHistory = (current?: GiftHistoryItem[] | null) => {
    const years = ['2025', '2024'];
    let history = current ? [...current] : [];
    years.forEach(y => { if (!history.find(h => h.ano === y)) history.push({ ano: y, tipo: '', obs: '' }) });
    return history.sort((a, b) => Number(b.ano) - Number(a.ano));
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100">
              <Dialog.Panel className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                
                <header className="bg-gradient-to-r from-[#112240] to-[#1a3a6c] px-6 py-5 flex justify-between items-center text-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <User className="h-5 w-5" />
                    </div>
                    <Dialog.Title className="text-lg font-bold">{clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}</Dialog.Title>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </header>

                <nav className="flex border-b px-6 pt-2 gap-1 bg-gray-50">
                  {[
                    { id: 'geral', label: 'Geral', icon: User },
                    { id: 'endereco', label: 'Endereço', icon: MapPin },
                    { id: 'historico', label: 'Histórico', icon: Gift }
                  ].map((tab: any) => (
                    <button 
                      key={tab.id} 
                      onClick={() => setActiveTab(tab.id)} 
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-t-lg transition-all ${
                        activeTab === tab.id 
                          ? 'bg-white text-[#112240] shadow-sm -mb-px border-b-2 border-[#112240]' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  ))}
                </nav>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-gray-50">
                  {activeTab === 'geral' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <FormInput 
                          label="Nome Completo" 
                          icon={User}
                          value={formData.nome} 
                          onChange={v => setFormData({...formData, nome: v})} 
                          placeholder="Digite o nome completo"
                        />
                      </div>
                      
                      <FormInput 
                        label="Empresa" 
                        icon={Building2}
                        value={formData.empresa} 
                        onChange={v => setFormData({...formData, empresa: v})} 
                        placeholder="Nome da empresa"
                      />
                      
                      <FormInput 
                        label="Cargo" 
                        icon={Briefcase}
                        value={formData.cargo} 
                        onChange={v => setFormData({...formData, cargo: v})} 
                        placeholder="Cargo do cliente"
                      />
                      
                      <div>
                        <label className="text-xs font-bold text-gray-600 uppercase block mb-2 flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          Telefone
                        </label>
                        <IMaskInput 
                          mask="(00) 00000-0000" 
                          value={formData.telefone} 
                          onAccept={(v: any) => setFormData({...formData, telefone: v})} 
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      
                      <FormInput 
                        label="E-mail" 
                        icon={Mail}
                        value={formData.email} 
                        onChange={v => setFormData({...formData, email: v})} 
                        type="email"
                        placeholder="email@exemplo.com"
                      />
                      
                      {/* Seletor de Sócio */}
                      <div className="relative" ref={socioMenuRef}>
                        <label className="text-xs font-bold text-gray-600 uppercase block mb-2 flex items-center gap-2">
                          <UserCircle className="h-3.5 w-3.5 text-gray-400" />
                          Sócio Responsável
                        </label>
                        <button 
                          onClick={() => setIsSocioMenuOpen(!isSocioMenuOpen)} 
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-white flex justify-between items-center hover:border-gray-400 transition-all"
                        >
                          <span className={formData.socio ? "text-gray-900 font-medium" : "text-gray-400"}>{formData.socio || "Selecione um sócio..."}</span>
                          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isSocioMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isSocioMenuOpen && (
                          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                            {sociosList.map(s => (
                              <button 
                                key={s.id} 
                                onClick={() => { setFormData({...formData, socio: s.nome}); setIsSocioMenuOpen(false) }} 
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors font-medium text-gray-700 hover:text-blue-700"
                              >
                                {s.nome}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-600 uppercase block mb-2 flex items-center gap-2">
                          <Gift className="h-3.5 w-3.5 text-gray-400" />
                          Tipo Brinde
                        </label>
                        <select 
                          value={formData.tipo_brinde} 
                          onChange={e => setFormData({...formData, tipo_brinde: e.target.value})} 
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white font-medium"
                        >
                          {brindeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTab === 'endereco' && (
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-600 uppercase block mb-2 flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          CEP
                        </label>
                        <IMaskInput 
                          mask="00000-000" 
                          value={formData.cep} 
                          onAccept={(v: any) => setFormData({...formData, cep: v})} 
                          onBlur={handleCepBlur} 
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                          placeholder="00000-000"
                        />
                      </div>
                      
                      <div className="md:col-span-4">
                        <FormInput 
                          label="Endereço" 
                          value={formData.endereco} 
                          onChange={v => setFormData({...formData, endereco: v})} 
                          placeholder="Rua, Avenida..."
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <FormInput 
                          label="Número" 
                          value={formData.numero} 
                          onChange={v => setFormData({...formData, numero: v})} 
                          placeholder="Nº"
                        />
                      </div>
                      
                      <div className="md:col-span-4">
                        <FormInput 
                          label="Bairro" 
                          value={formData.bairro} 
                          onChange={v => setFormData({...formData, bairro: v})} 
                          placeholder="Bairro"
                        />
                      </div>
                      
                      <div className="md:col-span-4">
                        <FormInput 
                          label="Cidade" 
                          value={formData.cidade} 
                          onChange={v => setFormData({...formData, cidade: v})} 
                          placeholder="Cidade"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <FormInput 
                          label="UF" 
                          value={formData.estado} 
                          onChange={v => setFormData({...formData, estado: v})} 
                          placeholder="UF"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'historico' && (
                    <div className="space-y-4">
                      {formData.historico_brindes?.map((item, idx) => (
                        <div key={item.ano} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 font-bold text-[#112240] text-base mb-4">
                            <Calendar className="h-5 w-5 text-blue-600" /> 
                            <span>{item.ano}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Tipo de Brinde</label>
                              <select 
                                value={item.tipo} 
                                onChange={e => {
                                  const h = [...formData.historico_brindes!]; h[idx].tipo = e.target.value; setFormData({...formData, historico_brindes: h})
                                }} 
                                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                              >
                                <option value="">Selecione...</option>
                                {brindeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Observações</label>
                              <input 
                                type="text" 
                                value={item.obs} 
                                placeholder="Detalhes adicionais..." 
                                onChange={e => {
                                  const h = [...formData.historico_brindes!]; h[idx].obs = e.target.value; setFormData({...formData, historico_brindes: h})
                                }} 
                                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <footer className="bg-white p-5 border-t flex flex-col gap-4">
                   {clientToEdit && (
                     <div className="flex gap-4 justify-center pb-4 border-b">
                        <AuditBadge label="Criado" date={clientToEdit.created_at} user={clientToEdit.created_by} />
                        <AuditBadge label="Editado" date={clientToEdit.updated_at} user={clientToEdit.updated_by} />
                     </div>
                   )}
                   <div className="flex justify-end gap-3">
                    <button 
                      onClick={onClose} 
                      className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSave} 
                      className="bg-gradient-to-r from-[#112240] to-[#1a3a6c] text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                    >
                      <Save className="h-4 w-4" /> Salvar Cliente
                    </button>
                   </div>
                </footer>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

// --- HELPER COMPONENTS ---
function FormInput({ label, value, onChange, type = "text", icon, placeholder }: any) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-600 uppercase block mb-2 flex items-center gap-2">
        {icon && <icon className="h-3.5 w-3.5 text-gray-400" />}
        {label}
      </label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
      />
    </div>
  )
}

function AuditBadge({ label, date, user }: any) {
  if (!date) return null
  return (
    <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
      <Clock className="h-4 w-4 text-gray-400" />
      <div className="flex flex-col">
        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">{label}</span>
        <span className="text-xs font-bold text-gray-700">{new Date(date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
        {user && <span className="text-xs text-blue-600">{user}</span>}
      </div>
    </div>
  )
}