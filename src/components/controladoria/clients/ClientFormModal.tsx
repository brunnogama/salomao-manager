// brunnogama/salomao-manager/salomao-manager-3e743876de4fb5af74c8aedf5b89ce1e3913c795/src/components/controladoria/clients/ClientFormModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Save, Search, Loader2, AlertTriangle, Plus, Trash2, UserPlus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Client, Partner, ClientContact } from '../../../types/controladoria';
import { maskCNPJ, toTitleCase } from '../utils/masks';
import { CustomSelect } from '../ui/CustomSelect';

const UFS = [ { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' }, { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' }, { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' }, { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' }, { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' }, { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' }, { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' }, { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' }, { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' } ];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  client?: Client;
  onSave: () => void;
}

export function ClientFormModal({ isOpen, onClose, client, onSave }: Props) {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  
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
    active: true
  };

  const [formData, setFormData] = useState<Client>(emptyClient);

  useEffect(() => {
    if (isOpen) {
      setFormData(client ? { ...client } : emptyClient);
      setDuplicateClients([]);
      fetchPartners();
      if (client?.id) {
        fetchContacts(client.id);
      } else {
        setContacts([]);
      }
    }
  }, [isOpen, client]);

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
      delete (payload as any).contacts; // Remove virtual field if exists
      
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
      
      onSave();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">{client ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* COLUNA 1: DADOS CADASTRAIS */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-salomao-blue border-b pb-2">Informações Principais</h3>
              
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">CPF/CNPJ</label>
                    <div className="flex gap-2">
                      <input 
                          type="text" 
                          disabled={formData.is_person}
                          className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-salomao-blue disabled:bg-gray-100"
                          value={formData.cnpj || ''}
                          onChange={e => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})}
                          placeholder="00.000.000/0000-00"
                      />
                      <button 
                          onClick={handleCNPJSearch} 
                          disabled={formData.is_person || !formData.cnpj}
                          className="p-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                      >
                          {searching ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
                      </button>
                    </div>
                    <div className="mt-2 flex items-center">
                      <input 
                          type="checkbox" 
                          id="is_person" 
                          checked={formData.is_person} 
                          onChange={e => setFormData({...formData, is_person: e.target.checked, cnpj: undefined})}
                          className="rounded text-salomao-blue"
                      />
                      <label htmlFor="is_person" className="ml-2 text-xs text-gray-500">Pessoa Física</label>
                    </div>
                </div>
                <div className="flex-1">
                  <CustomSelect 
                    label="Sócio Responsável"
                    value={formData.partner_id || ''}
                    onChange={val => setFormData({...formData, partner_id: val})}
                    options={[{label: 'Selecione', value: ''}, ...partners.map(p => ({label: p.name, value: p.id}))]}
                  />
                </div>
              </div>

              <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome Completo/Razão Social *</label>
                  <input 
                      type="text" 
                      className={`w-full border rounded-lg p-2.5 text-sm outline-none focus:border-salomao-blue ${duplicateClients.length > 0 ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: toTitleCase(e.target.value)})}
                  />
                  {duplicateClients.length > 0 && (
                      <div className="mt-2 p-2 bg-yellow-100 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                              <span className="text-xs font-bold text-yellow-700">Duplicidade encontrada:</span>
                          </div>
                          <ul className="space-y-1">
                              {duplicateClients.map(dup => (
                                  <li key={dup.id} className="text-[10px] text-yellow-800 bg-white/50 p-1 rounded">
                                      {dup.name} {dup.cnpj ? ` - ${maskCNPJ(dup.cnpj)}` : ''}
                                  </li>
                              ))}
                          </ul>
                      </div>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">E-mail Principal</label>
                    <input 
                        type="email" 
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                        value={formData.email || ''}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Telefone Principal</label>
                    <input 
                        type="text" 
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                        value={formData.phone || ''}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-salomao-blue border-b pb-2">Endereço</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Logradouro</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" value={formData.address || ''} onChange={e => setFormData({...formData, address: toTitleCase(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Número</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" value={formData.number || ''} onChange={e => setFormData({...formData, number: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" value={formData.city || ''} onChange={e => setFormData({...formData, city: toTitleCase(e.target.value)})} />
                  </div>
                  <div>
                    <CustomSelect 
                        label="Estado"
                        value={formData.uf || ''}
                        onChange={val => setFormData({...formData, uf: val})}
                        options={UFS.map(u => ({label: u.nome, value: u.sigla}))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA 2: MULTI-CONTATOS */}
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-salomao-blue">Pessoas de Contato</h3>
                  <p className="text-[10px] text-gray-500 mt-1">Contatos internos deste cliente</p>
                </div>
                <button 
                  onClick={handleAddContact}
                  className="flex items-center gap-2 px-3 py-1.5 bg-salomao-blue text-white rounded-lg text-[10px] font-black uppercase hover:bg-blue-900 transition-colors shadow-sm"
                >
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              </div>

              {contacts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <UserPlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-medium">Nenhum contato específico adicionado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contacts.map((contact, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 relative group">
                      <button 
                        onClick={() => handleRemoveContact(index)}
                        className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nome Completo</label>
                          <input 
                            type="text" 
                            className="w-full border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-salomao-blue"
                            value={contact.name || ''}
                            onChange={e => handleContactChange(index, 'name', e.target.value)}
                            placeholder="Ex: João Diretor"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cargo</label>
                          <input 
                            type="text" 
                            className="w-full border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-salomao-blue"
                            value={contact.role || ''}
                            onChange={e => handleContactChange(index, 'role', e.target.value)}
                            placeholder="Ex: Diretor Financeiro"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Telefone</label>
                          <input 
                            type="text" 
                            className="w-full border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-salomao-blue"
                            value={contact.phone || ''}
                            onChange={e => handleContactChange(index, 'phone', e.target.value)}
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">E-mail</label>
                          <input 
                            type="email" 
                            className="w-full border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-salomao-blue"
                            value={contact.email || ''}
                            onChange={e => handleContactChange(index, 'email', e.target.value)}
                            placeholder="email@empresa.com"
                          />
                        </div>
                      </div>

                      <div className="flex items-center pt-1">
                        <input 
                          type="checkbox" 
                          id={`main-${index}`}
                          checked={contact.is_main_contact}
                          onChange={e => handleContactChange(index, 'is_main_contact', e.target.checked)}
                          className="rounded text-salomao-blue h-3 w-3"
                        />
                        <label htmlFor={`main-${index}`} className="ml-2 text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Contato Principal</label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Cancelar</button>
            <button 
                onClick={handleSave} 
                disabled={loading}
                className="px-8 py-2 bg-salomao-blue text-white rounded-lg hover:bg-blue-900 flex items-center shadow-lg transition-transform active:scale-95 font-bold"
            >
                {loading ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" /> Salvar Cadastro</>}
            </button>
        </div>
      </div>
    </div>
  );
}