import { Fragment, useState, useEffect, useRef, useMemo } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Save, Gift, Calendar, Clock, UserCircle, ChevronDown, Plus, Trash2, Loader2, MapPin, Info } from 'lucide-react'
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100">
              <Dialog.Panel className="w-full max-w-2xl bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
                
                <header className="bg-[#112240] px-6 py-4 flex justify-between items-center text-white">
                  <Dialog.Title className="text-lg font-bold">{clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}</Dialog.Title>
                  <button onClick={onClose}><X className="h-5 w-5" /></button>
                </header>

                <nav className="flex border-b px-6 pt-4 gap-6 bg-gray-50">
                  {['geral', 'endereco', 'historico'].map((tab: any) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-bold border-b-2 capitalize ${activeTab === tab ? 'border-[#112240] text-[#112240]' : 'border-transparent text-gray-400'}`}>
                      {tab === 'historico' && <Gift className="h-4 w-4 inline mr-1" />} {tab === 'endereco' ? 'Endereço' : tab}
                    </button>
                  ))}
                </nav>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                  {activeTab === 'geral' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nome Completo</label>
                        <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm" />
                      </div>
                      <FormInput label="Empresa" value={formData.empresa} onChange={v => setFormData({...formData, empresa: v})} />
                      <FormInput label="Cargo" value={formData.cargo} onChange={v => setFormData({...formData, cargo: v})} />
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Telefone</label>
                        <IMaskInput mask="(00) 00000-0000" value={formData.telefone} onAccept={(v: any) => setFormData({...formData, telefone: v})} className="w-full border rounded-lg p-2.5 text-sm" />
                      </div>
                      <FormInput label="E-mail" value={formData.email} onChange={v => setFormData({...formData, email: v})} type="email" />
                      
                      {/* Seletor de Sócio */}
                      <div className="relative" ref={socioMenuRef}>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Sócio Responsável</label>
                        <button onClick={() => setIsSocioMenuOpen(!isSocioMenuOpen)} className="w-full border rounded-lg p-2.5 text-sm bg-white flex justify-between items-center">
                          <span className={formData.socio ? "text-gray-900" : "text-gray-400"}>{formData.socio || "Selecione..."}</span>
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </button>
                        {isSocioMenuOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-white border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                            {sociosList.map(s => (
                              <button key={s.id} onClick={() => { setFormData({...formData, socio: s.nome}); setIsSocioMenuOpen(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50">
                                {s.nome}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Tipo Brinde</label>
                        <select value={formData.tipo_brinde} onChange={e => setFormData({...formData, tipo_brinde: e.target.value})} className="w-full border rounded-lg p-2.5 text-sm">
                          {brindeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTab === 'endereco' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-1">
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">CEP</label>
                        <IMaskInput mask="00000-000" value={formData.cep} onAccept={(v: any) => setFormData({...formData, cep: v})} onBlur={handleCepBlur} className="w-full border rounded-lg p-2.5 text-sm" />
                      </div>
                      <div className="md:col-span-3"><FormInput label="Endereço" value={formData.endereco} onChange={v => setFormData({...formData, endereco: v})} /></div>
                      <FormInput label="Número" value={formData.numero} onChange={v => setFormData({...formData, numero: v})} />
                      <div className="md:col-span-2"><FormInput label="Bairro" value={formData.bairro} onChange={v => setFormData({...formData, bairro: v})} /></div>
                      <FormInput label="Cidade" value={formData.cidade} onChange={v => setFormData({...formData, cidade: v})} />
                    </div>
                  )}

                  {activeTab === 'historico' && (
                    <div className="space-y-3">
                      {formData.historico_brindes?.map((item, idx) => (
                        <div key={item.ano} className="bg-gray-50 p-4 rounded-lg border flex flex-col gap-3">
                          <div className="flex items-center gap-2 font-bold text-[#112240] text-sm"><Calendar className="h-4 w-4 text-blue-600" /> {item.ano}</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <select value={item.tipo} onChange={e => {
                              const h = [...formData.historico_brindes!]; h[idx].tipo = e.target.value; setFormData({...formData, historico_brindes: h})
                            }} className="border rounded p-2 text-sm">
                              <option value="">Selecione...</option>
                              {brindeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <input type="text" value={item.obs} placeholder="Observações..." onChange={e => {
                              const h = [...formData.historico_brindes!]; h[idx].obs = e.target.value; setFormData({...formData, historico_brindes: h})
                            }} className="border rounded p-2 text-sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <footer className="bg-gray-50 p-4 border-t flex flex-col gap-3">
                   {clientToEdit && (
                     <div className="flex gap-4 justify-center">
                        <AuditBadge label="Criado" date={clientToEdit.created_at} user={clientToEdit.created_by} />
                        <AuditBadge label="Editado" date={clientToEdit.updated_at} user={clientToEdit.updated_by} />
                     </div>
                   )}
                   <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-500">Cancelar</button>
                    <button onClick={handleSave} className="bg-[#112240] text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg"><Save className="h-4 w-4" /> Salvar Cliente</button>
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
function FormInput({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#112240]/20" />
    </div>
  )
}

function AuditBadge({ label, date, user }: any) {
  if (!date) return null
  return (
    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border text-[10px]">
      <div className="flex flex-col">
        <span className="text-gray-400 font-bold uppercase">{label}</span>
        <span className="font-bold text-gray-700">{new Date(date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
        {user && <span className="text-blue-500">{user}</span>}
      </div>
    </div>
  )
}