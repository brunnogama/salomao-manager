import React from 'react';
import { Search, Settings, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { Contract } from '../../../../types/controladoria';
import { CustomSelect } from '../../ui/CustomSelect';

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
    <section className="space-y-6">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-3">Identificação do Cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-3">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">CNPJ / CPF</label>
            <div className="flex gap-2 items-center">
              <input 
                type="text" 
                disabled={formData.has_no_cnpj} 
                className="flex-1 border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#0a192f] bg-white focus:border-[#0a192f] outline-none shadow-sm transition-all disabled:bg-gray-100/50" 
                placeholder="00.000.000/0000-00" 
                value={formData.cnpj || ''} 
                onChange={(e) => setFormData({...formData, cnpj: maskCNPJ(e.target.value)})}
              />
              <button 
                type="button" 
                onClick={handleCNPJSearch} 
                disabled={formData.has_no_cnpj || !formData.cnpj} 
                className="bg-[#0a192f] hover:bg-slate-800 text-white p-3 rounded-xl shadow-lg disabled:opacity-30 shrink-0 transition-all active:scale-95"
              >
                <Search className="w-4 h-4 text-amber-500" />
              </button>
            </div>
            <div className="flex items-center mt-3 ml-1">
              <input 
                type="checkbox" 
                id="no_cnpj" 
                className="w-4 h-4 rounded border-gray-300 text-[#0a192f] focus:ring-[#0a192f]" 
                checked={formData.has_no_cnpj || false} 
                onChange={(e) => setFormData({...formData, has_no_cnpj: e.target.checked, cnpj: ''})}
              />
              <label htmlFor="no_cnpj" className="ml-2 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer">PF / Sem documento</label>
            </div>
          </div>
          <div className="md:col-span-9">
            <CustomSelect 
                label="Nome do Cliente / Terceiro *" 
                value={formData.client_name} 
                onChange={handleClientChange} 
                options={clientSelectOptions}
                onAction={() => setActiveManager('client')}
                actionIcon={Settings}
                actionLabel="Configurar Clientes"
                placeholder="SELECIONE OU DIGITE O NOME"
            />
            {duplicateClientCases.length > 0 && (
                <div className="mt-3 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-top-2">
                    <span className="text-[10px] text-amber-700 font-black uppercase flex items-center tracking-widest">
                        <AlertCircle className="w-3.5 h-3.5 mr-2" /> Registros de Casos Existentes:
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {duplicateClientCases.map(c => (
                            <a 
                              key={c.id} 
                              href={`/controladoria/contracts?id=${c.id}`}
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[9px] font-black text-[#0a192f] uppercase tracking-widest hover:bg-amber-500 hover:text-white bg-white px-3 py-1.5 rounded-lg border border-amber-200 flex items-center transition-all shadow-sm"
                            >
                                <LinkIcon className="w-2.5 h-2.5 mr-2"/> {c.hon_number || 'SEM HON'} • {getStatusLabel(c.status).toUpperCase()}
                            </a>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <CustomSelect 
              label="Área de Atuação Jurídica" 
              value={formData.area || ''} 
              onChange={(val: string) => setFormData({...formData, area: val})} 
              options={areaOptions} 
              onAction={() => setActiveManager('area')} 
              actionIcon={Settings} 
              actionLabel="Gerenciar Áreas" 
              placeholder="SELECIONE A ÁREA" 
            />
          </div>
          <div>
            <CustomSelect 
              label="Sócio Responsável (Banca) *" 
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