// brunnogama/salomao-manager/salomao-manager-3e743876de4fb5af74c8aedf5b89ce1e3913c795/src/components/controladoria/clients/ClientFormModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Save, Search, Loader2, AlertTriangle, Plus, Trash2, UserPlus, User, MapPin, Users, FileText } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Client, Partner, ClientContact } from '../../../types/controladoria';
import { maskCNPJ, toTitleCase } from '../utils/masks';
import { CustomSelect } from '../ui/CustomSelect';

const UFS = [{ sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' }, { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' }, { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' }, { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' }, { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' }, { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' }, { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' }, { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' }, { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' }];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  client?: Client;
  onSave: (savedClient?: Client) => void;
}

export function ClientFormModal({ isOpen, onClose, client, onSave }: Props) {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [activeTab, setActiveTab] = useState('dados');

  // Estado para duplicidade
  const [duplicateClients, setDuplicateClients] = useState<Client[]>([]);

  // Estado para múltiplos contatos
  const [contacts, setContacts] = useState<Partial<ClientContact>[]>([]);

  const emptyClient: Client = {
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    number: '',
    complement: '',
    city: '',
    uf: 'RJ',
    is_person: false,
    active: true,
    notes: ''
  };

  const [formData, setFormData] = useState<Client>(emptyClient);

  useEffect(() => {
    if (isOpen) {
      setFormData(client ? { ...client, notes: client.notes || '' } : emptyClient);
      setDuplicateClients([]);
      setActiveTab('dados');
      fetchPartners();
      if (client?.id) {
        fetchContacts(client.id);
      } else {
        setContacts([]);
      }
    }
  }, [isOpen, client]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // EFEITO: Checagem de Duplicidade de Cliente (Nome)
  useEffect(() => {
    const checkDuplicates = async () => {
      if (!formData.name || formData.name.length < 3) return setDuplicateClients([]);

      const { data } = await supabase
        .from('clients')
        .select('*')
        .ilike('name', `%${formData.name}%`)
        .neq('id', client?.id || '00000000-0000-0000-0000-000000000000') // Não comparar consigo mesmo
        .limit(3);

      if (data) setDuplicateClients(data);
    };

    const timer = setTimeout(checkDuplicates, 500);
    return () => clearTimeout(timer);
  }, [formData.name, client?.id]);

  const fetchPartners = async () => {
    const { data } = await supabase
      .from('partners')
      .select('*')
      .eq('status', 'active')
      .order('name');
    if (data) setPartners(data);
  };

  const fetchContacts = async (clientId: string) => {
    const { data } = await supabase
      .from('client_contacts')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at');
    if (data) setContacts(data);
  };

  const handleAddContact = () => {
    setContacts([...contacts, { name: '', email: '', phone: '', role: '', is_main_contact: contacts.length === 0 }]);
  };

  const handleRemoveContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const handleContactChange = (index: number, field: keyof ClientContact, value: any) => {
    const newContacts = [...contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };

    // Se marcar como principal, desmarca os outros
    if (field === 'is_main_contact' && value === true) {
      newContacts.forEach((c, i) => {
        if (i !== index) c.is_main_contact = false;
      });
    }

    setContacts(newContacts);
  };

  const handleSave = async () => {
    if (!formData.name) return alert('Nome é obrigatório');

    setLoading(true);
    try {
      const payload = { ...formData };
      // Remove computed/virtual fields that don't exist in database
      delete (payload as any).contacts;
      delete (payload as any).active_contracts_count;
      delete (payload as any).partner_name;

      // Limpeza de dados
      if (payload.cnpj) payload.cnpj = payload.cnpj.replace(/\D/g, '');
      if (!payload.cnpj) delete payload.cnpj;

      let clientId = client?.id;

      if (clientId) {
        const { error } = await supabase.from('clients').update(payload).eq('id', clientId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('clients').insert(payload).select().single();
        if (error) throw error;
        clientId = data.id;
      }

      // Salvar contatos (Deleta atuais e insere novos para simplificar a sincronização)
      if (clientId) {
        await supabase.from('client_contacts').delete().eq('client_id', clientId);
        if (contacts.length > 0) {
          const contactsPayload = contacts.map(c => ({
            client_id: clientId,
            name: c.name || '',
            email: c.email || '',
            phone: c.phone || '',
            role: c.role || '',
            is_main_contact: c.is_main_contact || false
          }));
          const { error: contactsError } = await supabase.from('client_contacts').insert(contactsPayload);
          if (contactsError) throw contactsError;
        }
      }

      onSave({ ...payload, id: clientId || client?.id });
      onClose();
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCNPJSearch = async () => {
    if (!formData.cnpj) return;
    const cnpjLimpo = formData.cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) return alert('CNPJ inválido');

    setSearching(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!response.ok) throw new Error('CNPJ não encontrado');
      const data = await response.json();

      setFormData((prev: Client) => ({
        ...prev,
        name: toTitleCase(data.razao_social || data.nome_fantasia || ''),
        address: toTitleCase(data.logradouro || ''),
        number: data.numero || '',
        complement: toTitleCase(data.complemento || ''),
        city: toTitleCase(data.municipio || ''),
        uf: data.uf || prev.uf,
        email: data.email || prev.email,
        phone: data.ddd_telefone_1 || prev.phone
      }));
    } catch (error) {
      alert('Erro ao buscar CNPJ');
    } finally {
      setSearching(false);
    }
  };

  const tabs = [
    { id: 'dados', label: 'Dados do Cliente', icon: User },
    { id: 'endereco', label: 'Endereço', icon: MapPin },
    { id: 'contatos', label: 'Contatos', icon: Users },
    { id: 'obs', label: 'Observações', icon: FileText },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 relative">

        {/* Left Sidebar */}
        <div className="w-72 bg-white border-r border-gray-100 flex flex-col py-8 px-5 shrink-0 overflow-y-auto">
          <div className="mb-8 px-2">
            <h2 className="text-xl font-black text-[#0a192f] tracking-tight leading-tight">
              {client ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <p className="text-xs text-gray-400 mt-1 font-medium">
              {client ? 'Gerencie os dados do cliente' : 'Cadastre um novo cliente'}
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
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">

            {activeTab === 'dados' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="flex gap-4 items-start">
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">CPF/CNPJ</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        disabled={formData.is_person}
                        className="flex-1 bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] disabled:bg-gray-100 transition-all"
                        value={formData.cnpj || ''}
                        onChange={e => setFormData({ ...formData, cnpj: maskCNPJ(e.target.value) })}
                        placeholder="00.000.000/0000-00"
                      />
                      <button
                        onClick={handleCNPJSearch}
                        disabled={formData.is_person || !formData.cnpj}
                        className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all"
                      >
                        {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="mt-3 flex items-center ml-1">
                      <input
                        type="checkbox"
                        id="is_person"
                        checked={formData.is_person}
                        onChange={e => setFormData({ ...formData, is_person: e.target.checked, cnpj: undefined })}
                        className="rounded text-[#1e3a8a] focus:ring-[#1e3a8a]"
                      />
                      <label htmlFor="is_person" className="ml-2 text-xs font-bold text-gray-500">Pessoa Física</label>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Sócio Responsável</label>
                    <CustomSelect
                      value={formData.partner_id || ''}
                      onChange={val => setFormData({ ...formData, partner_id: val })}
                      options={[{ label: 'Selecione', value: '' }, ...partners.map(p => ({ label: p.name, value: p.id }))]}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome Completo / Razão Social *</label>
                  <input
                    type="text"
                    className={`w-full bg-white border rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all ${duplicateClients.length > 0 ? 'border-amber-400 bg-amber-50' : 'border-gray-200'}`}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: toTitleCase(e.target.value) })}
                    placeholder="Digite o nome do cliente"
                  />
                  {duplicateClients.length > 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-amber-700">Possível Duplicidade Encontrada:</span>
                      </div>
                      <ul className="space-y-1 ml-6 list-disc">
                        {duplicateClients.map(dup => (
                          <li key={dup.id} className="text-[11px] text-amber-800 font-medium">
                            {dup.name} {dup.cnpj ? ` - ${maskCNPJ(dup.cnpj)}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">E-mail Principal</label>
                    <input
                      type="email"
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contato@empresa.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Telefone Principal</label>
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

            {activeTab === 'endereco' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
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
                      value={formData.number || ''}
                      onChange={e => setFormData({ ...formData, number: e.target.value })}
                      placeholder="123"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Complemento</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
                    value={formData.complement || ''}
                    onChange={e => setFormData({ ...formData, complement: toTitleCase(e.target.value) })}
                    placeholder="Sala, Apto..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
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

            {activeTab === 'contatos' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#0a192f]">Pessoas de Contato</h3>
                    <p className="text-[11px] text-gray-400 font-medium">Contatos internos deste cliente</p>
                  </div>
                  <button
                    onClick={handleAddContact}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] text-white rounded-xl text-[10px] font-black uppercase hover:bg-[#112240] transition-all shadow-md active:scale-95"
                  >
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                </div>

                {contacts.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    <UserPlus className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-xs text-gray-400 font-bold">Nenhum contato adicionado</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {contacts.map((contact, index) => (
                      <div key={index} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 relative group hover:border-blue-100 transition-all">
                        <button
                          onClick={() => handleRemoveContact(index)}
                          className="absolute top-3 right-3 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
                            <input
                              type="text"
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-[#1e3a8a] focus:bg-white transition-all"
                              value={contact.name || ''}
                              onChange={e => handleContactChange(index, 'name', e.target.value)}
                              placeholder="Ex: João Diretor"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Cargo</label>
                            <input
                              type="text"
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-[#1e3a8a] focus:bg-white transition-all"
                              value={contact.role || ''}
                              onChange={e => handleContactChange(index, 'role', e.target.value)}
                              placeholder="Ex: Diretor Financeiro"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Telefone</label>
                            <input
                              type="text"
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-[#1e3a8a] focus:bg-white transition-all"
                              value={contact.phone || ''}
                              onChange={e => handleContactChange(index, 'phone', e.target.value)}
                              placeholder="(00) 00000-0000"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">E-mail</label>
                            <input
                              type="email"
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-[#1e3a8a] focus:bg-white transition-all"
                              value={contact.email || ''}
                              onChange={e => handleContactChange(index, 'email', e.target.value)}
                              placeholder="email@empresa.com"
                            />
                          </div>
                        </div>

                        <div className="flex items-center pt-2">
                          <label className="flex items-center gap-2 cursor-pointer group/check">
                            <input
                              type="checkbox"
                              checked={contact.is_main_contact}
                              onChange={e => handleContactChange(index, 'is_main_contact', e.target.checked)}
                              className="w-4 h-4 rounded text-[#1e3a8a] focus:ring-[#1e3a8a] border-gray-300"
                            />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover/check:text-[#1e3a8a] transition-colors">Contato Principal</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'obs' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                <div className="flex-1 flex flex-col">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Observações Gerais</label>
                  <textarea
                    className="flex-1 w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all resize-none"
                    value={formData.notes || ''}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Adicione observações importantes sobre este cliente..."
                  />
                </div>
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
              Salvar Registro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}