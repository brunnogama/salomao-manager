import React, { useState, useEffect } from 'react';
import { X, Save, Search, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Client, Partner } from '../../../types/controladoria';
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
    const { data } = await supabase.from('partners').select('*').eq('active', true).order('name');
    if (data) setPartners(data);
  };

  const handleSave = async () => {
    if (!formData.name) return alert('Nome é obrigatório');

    setLoading(true);
    try {
      const payload = { ...formData };
      
      // Limpeza de dados
      if (payload.cnpj) payload.cnpj = payload.cnpj.replace(/\D/g, '');
      if (!payload.cnpj) delete payload.cnpj;

      if (client?.id) {
        const { error } = await supabase.from('clients').update(payload).eq('id', client.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clients').insert(payload);
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
    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-in zoom-in-95">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#0a192f]">
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">{client ? 'Atualizar Registro' : 'Novo Registro de Terceiro'}</h2>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-all"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[75vh] custom-scrollbar bg-gray-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CNPJ / Tipo */}
            <div className="md:col-span-2 flex flex-col md:flex-row gap-6 items-start">
               <div className="flex-1 w-full">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">CPF ou CNPJ</label>
                  <div className="flex gap-2">
                    <input 
                        type="text" 
                        disabled={formData.is_person}
                        className="flex-1 border border-gray-200 rounded-xl p-4 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all bg-white disabled:bg-gray-100/50"
                        value={formData.cnpj || ''}
                        onChange={e => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})}
                        placeholder="00.000.000/0000-00"
                    />
                    <button 
                        onClick={handleCNPJSearch}
                        disabled={formData.is_person || !formData.cnpj}
                        className="p-4 bg-[#0a192f] text-white rounded-xl hover:bg-slate-800 disabled:opacity-30 transition-all shadow-lg active:scale-95"
                    >
                        {searching ? <Loader2 className="w-5 h-5 animate-spin"/> : <Search className="w-5 h-5 text-amber-500"/>}
                    </button>
                  </div>
                  <div className="mt-3 flex items-center ml-1">
                    <input 
                        type="checkbox" 
                        id="is_person" 
                        checked={formData.is_person} 
                        onChange={e => setFormData({...formData, is_person: e.target.checked, cnpj: undefined})}
                        className="w-4 h-4 rounded border-gray-300 text-[#0a192f] focus:ring-[#0a192f]"
                    />
                    <label htmlFor="is_person" className="ml-2 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer">Pessoa Física / Sem documento</label>
                  </div>
               </div>
               <div className="flex-1 w-full">
                  <CustomSelect 
                    label="Sócio Responsável"
                    value={formData.partner_id || ''}
                    onChange={val => setFormData({...formData, partner_id: val})}
                    options={[{label: 'NÃO ATRIBUÍDO', value: ''}, ...partners.map(p => ({label: p.name.toUpperCase(), value: p.id}))]}
                  />
               </div>
            </div>

            {/* Nome */}
            <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome Completo ou Razão Social *</label>
                <input 
                    type="text" 
                    className={`w-full border rounded-xl p-4 text-sm font-bold uppercase tracking-tight outline-none transition-all shadow-sm ${duplicateClients.length > 0 ? 'border-amber-400 bg-amber-50/50 text-amber-900' : 'border-gray-200 bg-white text-[#0a192f] focus:border-[#0a192f]'}`}
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: toTitleCase(e.target.value)})}
                    placeholder="DIGITE O NOME PARA IDENTIFICAÇÃO"
                />
                
                {/* AVISO DE DUPLICIDADE */}
                {duplicateClients.length > 0 && (
                    <div className="mt-3 p-4 bg-amber-100 border border-amber-200 rounded-2xl animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Alerta de Integridade - Registros Similares:</span>
                        </div>
                        <ul className="space-y-1.5">
                            {duplicateClients.map(dup => (
                                <li key={dup.id} className="text-[10px] font-bold text-amber-800 bg-white/50 px-3 py-1.5 rounded-lg border border-amber-200/50">
                                    {dup.name.toUpperCase()} {dup.cnpj ? ` • ${maskCNPJ(dup.cnpj)}` : ''}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Contato */}
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">E-mail de Contato</label>
                <input 
                    type="email" 
                    className="w-full border border-gray-200 rounded-xl p-4 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all bg-white"
                    value={formData.email || ''}
                    onChange={e => setFormData({...formData, email: e.target.value.toLowerCase()})}
                    placeholder="exemplo@dominio.com"
                />
            </div>
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Telefone Principal</label>
                <input 
                    type="text" 
                    className="w-full border border-gray-200 rounded-xl p-4 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all bg-white"
                    value={formData.phone || ''}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="(00) 00000-0000"
                />
            </div>

            {/* Endereço */}
            <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Logradouro</label>
                <input 
                    type="text" 
                    className="w-full border border-gray-200 rounded-xl p-4 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all bg-white"
                    value={formData.address || ''}
                    onChange={e => setFormData({...formData, address: toTitleCase(e.target.value)})}
                    placeholder="RUA, AVENIDA, ETC"
                />
            </div>
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Número</label>
                <input 
                    type="text" 
                    className="w-full border border-gray-200 rounded-xl p-4 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all bg-white"
                    value={formData.number || ''}
                    onChange={e => setFormData({...formData, number: e.target.value})}
                    placeholder="S/N"
                />
            </div>
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Complemento</label>
                <input 
                    type="text" 
                    className="w-full border border-gray-200 rounded-xl p-4 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all bg-white"
                    value={formData.complement || ''}
                    onChange={e => setFormData({...formData, complement: toTitleCase(e.target.value)})}
                    placeholder="SALA, BLOCO, ETC"
                />
            </div>
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Cidade</label>
                <input 
                    type="text" 
                    className="w-full border border-gray-200 rounded-xl p-4 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all bg-white"
                    value={formData.city || ''}
                    onChange={e => setFormData({...formData, city: toTitleCase(e.target.value)})}
                    placeholder="MUNICÍPIO"
                />
            </div>
            <div>
                <CustomSelect 
                    label="Estado (UF)"
                    value={formData.uf || ''}
                    onChange={val => setFormData({...formData, uf: val})}
                    options={UFS.map(u => ({label: u.nome.toUpperCase(), value: u.sigla}))}
                />
            </div>

          </div>
        </div>

        <div className="p-8 border-t border-gray-100 flex justify-end gap-4 bg-white">
            <button onClick={onClose} className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all">Descartar</button>
            <button 
                onClick={handleSave} 
                disabled={loading}
                className="px-10 py-4 bg-[#0a192f] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-xl shadow-[#0a192f]/30 transition-all active:scale-95 disabled:opacity-50"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-3"/> : <Save className="w-4 h-4 mr-3 text-amber-500" />} 
                Confirmar Registro
            </button>
        </div>
      </div>
    </div>
  );
}