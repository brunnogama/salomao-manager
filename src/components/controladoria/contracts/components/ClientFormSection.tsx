import React from 'react';
import { Search, Settings, AlertCircle, Link as LinkIcon, X } from 'lucide-react';
import { Contract } from '../../../../types/controladoria'; 
import { CustomSelect } from '../../ui/CustomSelect'; 
import { CustomMultiSelect } from '../../ui/CustomMultiSelect'; 

interface ClientFormSectionProps {
  formData: Contract;
  setFormData: React.Dispatch<React.SetStateAction<Contract>>;
  maskCNPJ: (value: string) => string;
  handleCNPJSearch: () => void;
  clientSelectOptions: { label: string; value: string }[];
  handleClientChange: (name: string) => void;
  setActiveManager: (manager: string) => void;
  duplicateClientCases: any[];
  getStatusLabel: (status: string) => string;
  areaOptions: { label: string; value: string }[];
  partnerSelectOptions: { label: string; value: string }[];
  onOpenPartnerManager: () => void;
}

export function ClientFormSection(props: ClientFormSectionProps) {
  const {
    formData, setFormData, maskCNPJ, handleCNPJSearch,
    clientSelectOptions, handleClientChange, setActiveManager,
    duplicateClientCases, getStatusLabel, areaOptions,
    partnerSelectOptions, onOpenPartnerManager
  } = props;

  const filteredPartnerOptions = partnerSelectOptions.filter(o => o.value !== '' && o.value !== formData.partner_id);

  return (
    <section className="space-y-5">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-black/5 pb-2">Dados do Cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {formData.has_no_cnpj ? 'CPF' : 'CNPJ/CPF'}
            </label>
            <div className="flex gap-2 items-center">
              <input 
                type="text" 
                className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:border-salomao-blue outline-none min-w-0" 
                placeholder={formData.has_no_cnpj ? '000.000.000-00' : '00.000.000/0000-00'} 
                value={formData.cnpj || ''}
                maxLength={formData.has_no_cnpj ? 14 : 18} 
                onChange={(e) => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})}
              />
              <button 
                type="button" 
                onClick={handleCNPJSearch} 
                disabled={formData.has_no_cnpj || !formData.cnpj} 
                className="bg-white hover:bg-gray-50 text-gray-600 p-2.5 rounded-lg border border-gray-300 disabled:opacity-50 shrink-0"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center mt-2">
              <input 
                type="checkbox" 
                id="no_cnpj" 
                className="rounded text-salomao-blue focus:ring-salomao-blue" 
                checked={formData.has_no_cnpj || false} 
                onChange={(e) => {
                  const checked = e.target.checked;
                  const newCnpj = checked && formData.cnpj ? formData.cnpj.replace(/\D/g, '').substring(0, 11) : formData.cnpj;
                  setFormData({...formData, has_no_cnpj: checked, cnpj: newCnpj ? maskCNPJ(newCnpj) : ''});
                }}
              />
              <label htmlFor="no_cnpj" className="ml-2 text-xs text-gray-500">Sem CNPJ (Pessoa Física)</label>
            </div>
          </div>
          <div className="md:col-span-9">
            <CustomSelect 
                label="Nome do Cliente *" 
                value={formData.client_name} 
                onChange={handleClientChange} 
                options={clientSelectOptions}
                onAction={() => setActiveManager('client')}
                actionIcon={Settings}
                actionLabel="Gerenciar Clientes"
                placeholder="Selecione ou digite o nome"
            />
            {duplicateClientCases.length > 0 && (
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex flex-col gap-1">
                    <span className="text-xs text-blue-700 font-bold flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" /> Já há casos para este cliente:
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {(Array.isArray(duplicateClientCases) ? duplicateClientCases : []).map(c => (
                            <a key={c.id} href={`/contracts/${c.id}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline bg-white px-2 py-0.5 rounded border border-blue-100 flex items-center">
                                <LinkIcon className="w-2.5 h-2.5 mr-1"/> {c.hon_number || 'Sem HON'} ({getStatusLabel(c.status)})
                            </a>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <CustomSelect 
              label="Área do Direito" 
              value={formData.area || ''} 
              onChange={(val: string) => setFormData({...formData, area: val})} 
              options={areaOptions} 
              onAction={() => setActiveManager('area')} 
              actionIcon={Settings} 
              actionLabel="Gerenciar Áreas" 
              placeholder="Selecione" 
            />
          </div>
          <div>
            <CustomSelect 
              label="Responsável Principal *" 
              value={formData.partner_id || ''} 
              onChange={(val: string) => setFormData({...formData, partner_id: val})} 
              options={partnerSelectOptions} 
              onAction={onOpenPartnerManager} 
              actionIcon={Settings} 
              actionLabel="Gerenciar Sócios" 
            />
          </div>
          <div>
            <CustomMultiSelect 
              label="Sócios Adicionais" 
              values={formData.co_partner_ids || []} 
              onChange={(vals: string[]) => setFormData({...formData, co_partner_ids: vals})} 
              options={filteredPartnerOptions} 
              onAction={onOpenPartnerManager} 
              actionIcon={Settings} 
              actionLabel="Gerenciar Sócios" 
              placeholder="Adicionar sócio"
            />
            
            {formData.co_partner_ids && formData.co_partner_ids.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                {formData.co_partner_ids.map(id => {
                  const partner = partnerSelectOptions.find(p => p.value === id);
                  return (
                    <div key={id} className="flex items-center justify-between bg-blue-50 text-salomao-blue text-xs px-2.5 py-1.5 rounded-md border border-blue-100 animate-in fade-in zoom-in-95 duration-200">
                      <span className="font-medium truncate" title={partner?.label || id}>{partner?.label || id}</span>
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, co_partner_ids: formData.co_partner_ids!.filter(p => p !== id)})}
                        className="p-0.5 hover:bg-blue-100 rounded text-blue-400 hover:text-blue-600 transition-colors"
                        title="Remover sócio"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
    </section>
  );
}