import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Save, Gift, Calendar } from 'lucide-react'
import { IMaskInput } from 'react-imask'

export interface GiftHistoryItem {
  ano: string;
  tipo: string;
  obs: string;
}

export interface ClientData {
  nome: string;
  empresa: string;
  cargo: string;
  telefone: string;
  tipoBrinde: string;
  outroBrinde: string;
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
  ignored_fields?: string[] | null;
  historico_brindes?: GiftHistoryItem[] | null;
}

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: ClientData) => void;
  clientToEdit?: ClientData | null;
}

const BRINDE_OPTIONS = ['Brinde VIP', 'Brinde Médio', 'Brinde Pequeno', 'Não Recebe', 'Outro']

export function NewClientModal({ isOpen, onClose, onSave, clientToEdit }: NewClientModalProps) {
  const [activeTab, setActiveTab] = useState<'geral' | 'endereco' | 'historico'>('geral')
  
  const [formData, setFormData] = useState<ClientData>({
    nome: '', empresa: '', cargo: '', telefone: '',
    tipoBrinde: 'Brinde Médio', outroBrinde: '', quantidade: 1,
    cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
    email: '', socio: '', observacoes: '', ignored_fields: [],
    historico_brindes: []
  })

  const initializeHistory = (currentHistory?: GiftHistoryItem[] | null) => {
    const defaultYears = ['2025', '2024'];
    let newHistory = currentHistory ? [...currentHistory] : [];

    defaultYears.forEach(year => {
      if (!newHistory.find(h => h.ano === year)) {
        newHistory.push({ ano: year, tipo: '', obs: '' });
      }
    });

    return newHistory.sort((a, b) => Number(b.ano) - Number(a.ano));
  };

  useEffect(() => {
    if (clientToEdit) {
      setFormData({
        ...clientToEdit,
        historico_brindes: initializeHistory(clientToEdit.historico_brindes)
      })
    } else {
      setFormData({
        nome: '', empresa: '', cargo: '', telefone: '',
        tipoBrinde: 'Brinde Médio', outroBrinde: '', quantidade: 1,
        cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
        email: '', socio: '', observacoes: '', ignored_fields: [],
        historico_brindes: initializeHistory([])
      })
    }
    setActiveTab('geral')
  }, [clientToEdit, isOpen])

  const handleSave = () => {
    onSave(formData)
    onClose()
  }

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '')
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
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
        console.error('Erro ao buscar CEP')
      }
    }
  }

  const updateHistoryItem = (index: number, field: keyof GiftHistoryItem, value: string) => {
    const currentHistory = formData.historico_brindes ? [...formData.historico_brindes] : [];
    if (currentHistory[index]) {
        currentHistory[index] = { ...currentHistory[index], [field]: value };
        setFormData({ ...formData, historico_brindes: currentHistory });
    }
  }

  // --- NOVA LÓGICA DE ADICIONAR ANO ---
  const addHistoryYear = () => {
    const yearInput = window.prompt("Digite o ano que deseja adicionar (ex: 2026):");
    
    if (!yearInput) return; // Usuário cancelou

    // Validação simples de 4 dígitos
    if (!/^\d{4}$/.test(yearInput)) {
        alert("Por favor, digite um ano válido (4 dígitos).");
        return;
    }

    // Verificar se já existe
    const exists = formData.historico_brindes?.some(h => h.ano === yearInput);
    if (exists) {
        alert("Este ano já existe no histórico.");
        return;
    }

    setFormData(prev => ({
        ...prev,
        historico_brindes: [
            { ano: yearInput, tipo: '', obs: '' }, 
            ...(prev.historico_brindes || [])
        ].sort((a, b) => Number(b.ano) - Number(a.ano)) // Ordena decrescente
    }));
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all flex flex-col max-h-[90vh]">
                
                <div className="bg-[#112240] px-6 py-4 flex justify-between items-center shrink-0">
                  <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-white">
                    {clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-300 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
                </div>

                <div className="flex border-b border-gray-200 px-6 pt-4 gap-6 shrink-0 bg-gray-50">
                    <button onClick={() => setActiveTab('geral')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'geral' ? 'border-[#112240] text-[#112240]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Dados Gerais</button>
                    <button onClick={() => setActiveTab('endereco')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'endereco' ? 'border-[#112240] text-[#112240]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Endereço</button>
                    <button onClick={() => setActiveTab('historico')} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'historico' ? 'border-[#112240] text-[#112240]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                        <Gift className="h-4 w-4" /> Histórico Brindes
                    </button>
                </div>

                <div className="px-6 py-6 overflow-y-auto custom-scrollbar flex-1">
                    {activeTab === 'geral' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                                <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#112240] outline-none" placeholder="Nome do cliente" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Empresa</label>
                                <input type="text" value={formData.empresa} onChange={e => setFormData({...formData, empresa: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#112240] outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cargo</label>
                                <input type="text" value={formData.cargo} onChange={e => setFormData({...formData, cargo: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#112240] outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telefone</label>
                                <IMaskInput mask="(00) 00000-0000" value={formData.telefone} onAccept={(value: any) => setFormData({...formData, telefone: value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#112240] outline-none" placeholder="(99) 99999-9999" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">E-mail</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#112240] outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sócio Responsável</label>
                                <input type="text" value={formData.socio} onChange={e => setFormData({...formData, socio: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#112240] outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Brinde (Atual)</label>
                                <select value={formData.tipoBrinde} onChange={e => setFormData({...formData, tipoBrinde: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#112240] outline-none">
                                    {BRINDE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            {formData.tipoBrinde === 'Outro' && (
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Especifique o Brinde</label>
                                    <input type="text" value={formData.outroBrinde} onChange={e => setFormData({...formData, outroBrinde: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#112240] outline-none" />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantidade</label>
                                <input type="number" min="1" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: parseInt(e.target.value)})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#112240] outline-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Observações Gerais</label>
                                <textarea rows={3} value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#112240] outline-none resize-none"></textarea>
                            </div>
                        </div>
                    )}

                    {activeTab === 'endereco' && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CEP</label>
                                <IMaskInput mask="00000-000" value={formData.cep} onAccept={(value: any) => setFormData({...formData, cep: value})} onBlur={handleCepBlur} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#112240] outline-none" placeholder="00000-000" />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Endereço</label>
                                <input type="text" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#112240] outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Número</label>
                                <input type="text" value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#112240] outline-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Complemento</label>
                                <input type="text" value={formData.complemento} onChange={e => setFormData({...formData, complemento: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#112240] outline-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bairro</label>
                                <input type="text" value={formData.bairro} onChange={e => setFormData({...formData, bairro: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#112240] outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cidade</label>
                                <input type="text" value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#112240] outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">UF</label>
                                <input type="text" maxLength={2} value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value.toUpperCase()})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#112240] outline-none" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'historico' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-sm text-gray-500">Registro anual de presentes enviados.</p>
                                <button onClick={addHistoryYear} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">+ Adicionar Ano Futuro</button>
                            </div>
                            <div className="space-y-3">
                                {(formData.historico_brindes || []).map((item, idx) => (
                                    <div key={item.ano} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="h-4 w-4 text-blue-600" />
                                            <span className="font-bold text-[#112240] text-sm">Ano: {item.ano}</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tipo de Brinde</label>
                                                {/* CAMPO ALTERADO PARA SELECT */}
                                                <select 
                                                    value={item.tipo} 
                                                    onChange={(e) => updateHistoryItem(idx, 'tipo', e.target.value)}
                                                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#112240] outline-none bg-white"
                                                >
                                                    <option value="">Selecione...</option>
                                                    {BRINDE_OPTIONS.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Observações</label>
                                                <input type="text" value={item.obs} onChange={(e) => updateHistoryItem(idx, 'obs', e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#112240] outline-none bg-white" placeholder="Obs sobre o envio..." />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 shrink-0 border-t border-gray-200">
                  <button onClick={onClose} className="px-4 py-2 text-gray-700 font-bold hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
                  <button onClick={handleSave} className="px-6 py-2 bg-[#112240] text-white font-bold rounded-lg hover:bg-[#1a3a6c] transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20">
                    <Save className="h-4 w-4" /> Salvar Cliente
                  </button>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
