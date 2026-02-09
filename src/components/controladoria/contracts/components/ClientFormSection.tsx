import React from 'react';
import { Search, Settings, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { Contract } from '../types'; // Caminho corrigido para subir um nível
import { CustomSelect } from '../ui/CustomSelect'; // Caminho corrigido para subir um nível

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

  return (
    <section className="space-y-5">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-black/5 pb-2">Dados do Cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">CNPJ/CPF</label>
            <div className="flex gap-2 items-center">
              <input 
                type="text" 
                disabled={formData.has_no_cnpj} 
                className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:border-[#0a192f] outline-none min-w-0" 
                placeholder="00.000.000/0000-00" 
                value={formData.cnpj || ''} 
                onChange={(e) => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})}
              />
              <button 
                type="button" 
                onClick={handleCNPJSearch} 
                disabled={formData.has_no_cnpj || !formData.cnpj} 
                className="bg-gray-50 hover:bg-gray-100 text-gray-600 p-2.5 rounded-lg border border-gray-300 disabled:opacity-50 shrink-0 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center mt-2">
              <input 
                type="checkbox" 
                id="no_cnpj" 
                className="rounded text-[#0a192f] focus:ring-[#0a192f]" 
                checked={formData.has_no_cnpj || false} 
                onChange={(e) => setFormData({...formData, has_no_cnpj: e.target.checked, cnpj: ''})}
              />
              <label htmlFor="no_cnpj" className="ml-2 text-[11px] font-medium text-gray-500 uppercase">Sem CNPJ (Pessoa Física)</label>
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
                <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-3 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1">
                    <span className="text-[10px] text-blue-700 font-bold uppercase flex items-center tracking-wider">
                        <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Já há casos para este cliente:
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {duplicateClientCases.map(c => (
                            <a 
                              key={c.id} 
                              href={`/legal-control/contracts?id=${c.id}`} // Rota ajustada para o módulo legal-control no Manager
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-white px-2 py-1 rounded border border-blue-200 flex items-center transition-colors shadow-sm"
                            >
                                <LinkIcon className="w-2.5 h-2.5 mr-1.5"/> {c.hon_number || 'Sem HON'} ({getStatusLabel(c.status)})
                            </a>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              label="Responsável (Sócio) *" 
              value={formData.partner_id || ''} 
              onChange={(val: string) => setFormData({...formData, partner_id: val})} 
              options={partnerSelectOptions} 
              onAction={onOpenPartnerManager} 
              actionIcon={Settings} 
              actionLabel="Gerenciar Sócios" 
            />
          </div>
        </div>
    </section>
  );
}