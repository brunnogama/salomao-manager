// src/components/crm/NewClientModal.tsx
import { Fragment, useState, useEffect, useRef, useMemo } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Save, Gift, Calendar, Clock, UserCircle, ChevronDown, Plus, Trash2, Loader2, MapPin, Info, Building2, Mail, Phone, User, Briefcase } from 'lucide-react'
import { IMaskInput } from 'react-imask'
import { supabase } from '../../lib/supabase'
import { logAction } from '../../lib/logger'
import { ClientData, GiftHistoryItem } from '../../types/client'

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
        <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-md" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100">
              <Dialog.Panel className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200/50">
                
                {/* HEADER - Navy Gradient */}
                <header className="bg-gradient-to-r from-[#0a192f] to-[#112240] px-8 py-5 flex justify-between items-center text-white rounded-t-[2rem]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
                      <User className="h-5 w-5" />
                    </div>
                    <Dialog.Title className="text-[20px] font-black tracking-tight">{clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}</Dialog.Title>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all group">
                    <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
                  </button>
                </header>

                {/* TABS - Design System */}
                <nav className="flex border-b border-gray-200 px-8 bg-white">
                  {[
                    { id: 'geral', label: 'Geral', icon: User },
                    { id: 'endereco', label: 'Endereço', icon: MapPin },
                    { id: 'historico', label: 'Histórico', icon: Gift }
                  ].map((tab: any) => (
                    <button 
                      key={tab.id} 
                      onClick={() => setActiveTab(tab.id)} 
                      className={`flex items-center gap-2 px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] border-b-2 transition-all ${
                        activeTab === tab.id 
                          ? 'border-[#1e3a8a] text-[#1e3a8a]' 
                          : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <tab.icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </nav>

                {/* BODY */}
                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-white">
                  {activeTab === 'geral' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" />
                          Telefone
                        </label>
                        <IMaskInput 
                          mask="(00) 00000-0000" 
                          value={formData.telefone} 
                          onAccept={(v: any) => setFormData({...formData, telefone: v})} 
                          className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
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
                      
                      <div className="relative" ref={socioMenuRef}>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <UserCircle className="h-3.5 w-3.5" />
                          Sócio Responsável
                        </label>
                        <button 
                          onClick={() => setIsSocioMenuOpen(!isSocioMenuOpen)} 
                          className="w-full bg-gray-100/50 border border-gray-200 rounded-xl p-2.5 text-sm flex justify-between items-center hover:border-[#1e3a8a]/30 transition-all"
                        >
                          <span className={formData.socio ? "text-[#0a192f] font-bold" : "text-gray-400"}>{formData.socio || "Selecione um sócio..."}</span>
                          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isSocioMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isSocioMenuOpen && (
                          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                            {sociosList.map(s => (
                              <button 
                                key={s.id} 
                                onClick={() => { setFormData({...formData, socio: s.nome}); setIsSocioMenuOpen(false) }} 
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors font-bold text-[#0a192f]"
                              >
                                {s.nome}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Gift className="h-3.5 w-3.5" />
                          Tipo Brinde
                        </label>
                        <select 
                          value={formData.tipo_brinde} 
                          onChange={e => setFormData({...formData, tipo_brinde: e.target.value})} 
                          className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-bold"
                        >
                          {brindeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTab === 'endereco' && (
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" />
                          CEP
                        </label>
                        <IMaskInput 
                          mask="00000-000" 
                          value={formData.cep} 
                          onAccept={(v: any) => setFormData({...formData, cep: v})} 
                          onBlur={handleCepBlur} 
                          className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
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
                        <div key={item.ano} className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-200 hover:border-[#1e3a8a]/30 hover:shadow-sm transition-all">
                          <div className="flex items-center gap-2 font-black text-[#0a192f] text-base mb-4 pb-3 border-b border-gray-100">
                            <Calendar className="h-4 w-4 text-[#1e3a8a]" /> 
                            <span>{item.ano}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Tipo de Brinde</label>
                              <select 
                                value={item.tipo} 
                                onChange={e => {
                                  const h = [...formData.historico_brindes!]; h[idx].tipo = e.target.value; setFormData({...formData, historico_brindes: h})
                                }} 
                                className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-bold"
                              >
                                <option value="">Selecione...</option>
                                {brindeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Observações</label>
                              <input 
                                type="text" 
                                value={item.obs} 
                                placeholder="Detalhes adicionais..." 
                                onChange={e => {
                                  const h = [...formData.historico_brindes!]; h[idx].obs = e.target.value; setFormData({...formData, historico_brindes: h})
                                }} 
                                className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* FOOTER */}
                <footer className="bg-gray-50 px-8 py-5 border-t border-gray-200 flex flex-col gap-4 rounded-b-[2rem]">
                   {clientToEdit && (
                     <div className="flex gap-3 justify-center pb-4 border-b border-gray-200">
                        <AuditBadge label="Criado" date={clientToEdit.created_at} user={clientToEdit.created_by} />
                        <AuditBadge label="Editado" date={clientToEdit.updated_at} user={clientToEdit.updated_by} />
                     </div>
                   )}
                   <div className="flex justify-end gap-3">
                    <button 
                      onClick={onClose} 
                      className="px-6 py-2.5 text-[9px] font-black text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all uppercase tracking-[0.2em]"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSave} 
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
                    >
                      <Save className="h-4 w-4" /> Salvar
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

function FormInput({ label, value, onChange, type = "text", icon, placeholder }: any) {
  return (
    <div>
      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
        {icon && <icon className="h-3.5 w-3.5" />}
        {label}
      </label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
      />
    </div>
  )
}

function AuditBadge({ label, date, user }: any) {
  if (!date) return null
  return (
    <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
      <Clock className="h-3.5 w-3.5 text-gray-400" />
      <div className="flex flex-col">
        <span className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">{label}</span>
        <span className="text-xs font-bold text-[#0a192f]">{new Date(date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
        {user && <span className="text-xs text-gray-600 font-medium">{user}</span>}
      </div>
    </div>
  )
}
