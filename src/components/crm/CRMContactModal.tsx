// CRM Contact Modal - For Gift Distribution
// Focused on contact details, delivery address, and gift preferences

import React, { useState, useEffect } from 'react';
import { X, Save, Search, Loader2, MapPin, Gift, User, Building2, History } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CRMContact, GIFT_TYPES } from '../../types/crmContact';
import { Client, Partner } from '../../types/controladoria';
import { toTitleCase, maskCNPJ } from '../controladoria/utils/masks';
import { CustomSelect } from '../controladoria/ui/CustomSelect';

const UFS = [{ sigla: '', nome: 'Selecione' }, { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' }, { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' }, { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' }, { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' }, { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' }, { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' }, { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' }, { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' }, { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' }];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    contact?: CRMContact;
    onSave: () => void;
}

export function CRMContactModal({ isOpen, onClose, contact, onSave }: Props) {
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [activeTab, setActiveTab] = useState('contato');

    const emptyContact: CRMContact = {
        client_id: '',
        name: '',
        role: '',
        email: '',
        phone: '',
        gift_type: '',
        gift_quantity: 1,
        address: '',
        address_number: '',
        neighborhood: '',
        city: '',
        uf: '',
        zip_code: ''
    };

    const [formData, setFormData] = useState<CRMContact>(emptyContact);

    useEffect(() => {
        if (isOpen) {
            setFormData(contact || emptyContact);
            setActiveTab('empresa');
            fetchClients();
        }
    }, [isOpen, contact]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const fetchClients = async () => {
        const { data } = await supabase
            .from('clients')
            .select('*, partner:partners(name)')
            .order('name');
        if (data) setClients(data);
    };

    const handleSave = async () => {
        if (!formData.name) return alert('Nome do contato é obrigatório');
        if (!formData.client_id) return alert('Selecione a empresa');

        setLoading(true);
        try {
            const payload = { ...formData };
            delete (payload as any).client;

            if (contact?.id) {
                const { error } = await supabase
                    .from('client_contacts')
                    .update(payload)
                    .eq('id', contact.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('client_contacts')
                    .insert(payload);
                if (error) throw error;
            }

            onSave();
            onClose();
        } catch (error: any) {
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCEPSearch = async () => {
        if (!formData.zip_code) return;
        const cep = formData.zip_code.replace(/\D/g, '');
        if (cep.length !== 8) return alert('CEP inválido');

        setLoading(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            if (!response.ok) throw new Error('CEP não encontrado');
            const data = await response.json();

            setFormData(prev => ({
                ...prev,
                address: toTitleCase(data.logradouro || ''),
                neighborhood: toTitleCase(data.bairro || ''),
                city: toTitleCase(data.localidade || ''),
                uf: data.uf || prev.uf
            }));
        } catch (error) {
            alert('Erro ao buscar CEP');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'empresa', label: 'Empresa', icon: Building2 },
        { id: 'contato', label: 'Dados do Contato', icon: User },
        { id: 'endereco', label: 'Endereço Entrega', icon: MapPin },
        { id: 'brinde', label: 'Preferências Brinde', icon: Gift },
        { id: 'historico', label: 'Histórico', icon: History },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 relative">

                {/* Left Sidebar */}
                <div className="w-72 bg-white border-r border-gray-100 flex flex-col py-8 px-5 shrink-0 overflow-y-auto">
                    <div className="mb-8 px-2">
                        <h2 className="text-xl font-black text-[#0a192f] tracking-tight leading-tight">
                            {contact ? 'Editar Contato' : 'Novo Contato'}
                        </h2>
                        <p className="text-xs text-gray-400 mt-1 font-medium">
                            Cadastro para distribuição de brindes
                        </p>
                    </div>

                    <div className="space-y-1 w-full flex-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-left relative group ${isActive
                                        ? 'text-[#1e3a8a] bg-blue-50 font-bold shadow-sm'
                                        : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                                        }`}
                                >
                                    <div className={`p-1 rounded-lg transition-colors ${isActive ? 'text-[#1e3a8a]' : 'text-gray-300 group-hover:text-gray-500'}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-[10px] uppercase tracking-[0.1em] font-bold">{tab.label}</span>
                                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[#1e3a8a] rounded-r-full" />}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-auto pt-6 border-t border-gray-100">
                        <button onClick={onClose} className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-red-500 hover:bg-red-50 p-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">
                            <X className="w-4 h-4" /> Fechar
                        </button>
                    </div>
                </div>

                {/* Right Content */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#fafafa]">
                    <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">

                        {/* Tab 1: Contact Info */}
                        {activeTab === 'contato' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome Completo *</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: toTitleCase(e.target.value) })}
                                        placeholder="Ex: Maria Silva"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Cargo / Posição</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
                                        value={formData.role || ''}
                                        onChange={e => setFormData({ ...formData, role: toTitleCase(e.target.value) })}
                                        placeholder="Ex: Diretora Financeira"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">E-mail</label>
                                        <input
                                            type="email"
                                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
                                            value={formData.email || ''}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="contato@email.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Telefone</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
                                            value={formData.phone || ''}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Company Selection */}
                        {activeTab === 'empresa' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Empresa (Cliente) *</label>
                                    <CustomSelect
                                        value={formData.client_id}
                                        onChange={val => setFormData({ ...formData, client_id: val })}
                                        options={[
                                            { label: 'Selecione a empresa', value: '' },
                                            ...clients.map(c => ({
                                                label: `${c.name}${c.partner?.name ? ` - ${c.partner.name}` : ''}`,
                                                value: c.id!
                                            }))
                                        ]}
                                    />
                                    <p className="text-xs text-gray-400 mt-2 ml-1">Selecione a empresa onde este contato trabalha</p>
                                </div>

                                {formData.client_id && (
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                        <p className="text-xs font-bold text-blue-700 mb-1">Empresa Selecionada:</p>
                                        <p className="text-sm font-black text-blue-900">
                                            {clients.find(c => c.id === formData.client_id)?.name}
                                        </p>
                                        {clients.find(c => c.id === formData.client_id)?.partner?.name && (
                                            <p className="text-xs text-blue-600 mt-1">
                                                Sócio: {clients.find(c => c.id === formData.client_id)?.partner?.name}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab 3: Delivery Address */}
                        {activeTab === 'endereco' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">CEP</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
                                            value={formData.zip_code || ''}
                                            onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
                                            placeholder="00000-000"
                                            maxLength={9}
                                        />
                                        <button
                                            onClick={handleCEPSearch}
                                            disabled={loading}
                                            className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Logradouro</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
                                            value={formData.address || ''}
                                            onChange={e => setFormData({ ...formData, address: toTitleCase(e.target.value) })}
                                            placeholder="Rua, Avenida..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Número</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
                                            value={formData.address_number || ''}
                                            onChange={e => setFormData({ ...formData, address_number: e.target.value })}
                                            placeholder="123"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Complemento</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
                                        value={formData.address_complement || ''}
                                        onChange={e => setFormData({ ...formData, address_complement: toTitleCase(e.target.value) })}
                                        placeholder="Sala, Apto..."
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Bairro</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
                                            value={formData.neighborhood || ''}
                                            onChange={e => setFormData({ ...formData, neighborhood: toTitleCase(e.target.value) })}
                                            placeholder="Bairro"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Cidade</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
                                            value={formData.city || ''}
                                            onChange={e => setFormData({ ...formData, city: toTitleCase(e.target.value) })}
                                            placeholder="Cidade"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Estado</label>
                                        <CustomSelect
                                            value={formData.uf || ''}
                                            onChange={val => setFormData({ ...formData, uf: val })}
                                            options={UFS.map(u => ({ label: u.nome, value: u.sigla }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 4: Gift Preferences */}
                        {activeTab === 'brinde' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Tipo de Brinde</label>
                                        <CustomSelect
                                            value={formData.gift_type || ''}
                                            onChange={val => setFormData({ ...formData, gift_type: val })}
                                            options={[
                                                { label: 'Selecione', value: '' },
                                                ...GIFT_TYPES.map(t => ({ label: t, value: t }))
                                            ]}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Quantidade</label>
                                        <input
                                            type="number"
                                            min="1"
                                            disabled={formData.gift_type === 'Não recebe'}
                                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                                            value={formData.gift_type === 'Não recebe' ? 0 : (formData.gift_quantity || 1)}
                                            onChange={e => setFormData({ ...formData, gift_quantity: parseInt(e.target.value) || 1 })}
                                        />
                                        {formData.gift_type === 'Não recebe' && (
                                            <p className="text-xs text-gray-400 mt-1 ml-1">Quantidade desativada para "Não recebe"</p>
                                        )}
                                    </div>
                                </div>

                                {formData.gift_type === 'Outro' && (
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Especifique o Brinde</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
                                            value={formData.gift_other || ''}
                                            onChange={e => setFormData({ ...formData, gift_other: e.target.value })}
                                            placeholder="Descreva o brinde"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Observações sobre Preferências</label>
                                    <textarea
                                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all resize-none h-32"
                                        value={formData.gift_notes || ''}
                                        onChange={e => setFormData({ ...formData, gift_notes: e.target.value })}
                                        placeholder="Preferências, restrições, observações..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* Tab 5: Gift History */}
                        {activeTab === 'historico' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                {(!formData.gift_history || formData.gift_history.length === 0) ? (
                                    <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                                        <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-xs text-gray-400 font-bold">Nenhum histórico de brindes ainda</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {formData.gift_history.map((item: any, index: number) => (
                                            <div key={index} className="bg-white p-4 rounded-xl border border-gray-100">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">{item.gift_type}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{item.date}</p>
                                                    </div>
                                                    <span className="text-xs font-bold text-blue-600">Qtd: {item.quantity}</span>
                                                </div>
                                                {item.notes && (
                                                    <p className="text-xs text-gray-600 mt-2">{item.notes}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="px-10 py-6 border-t border-gray-100 flex justify-end gap-3 bg-white shrink-0">
                        <button onClick={onClose} className="px-6 py-2.5 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">Cancelar</button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-[#112240] hover:shadow-xl active:scale-95 disabled:opacity-50 transition-all"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Salvar Contato
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
