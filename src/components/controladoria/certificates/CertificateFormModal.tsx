import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Upload, Settings2, ChevronDown, Trash2, Plus, ExternalLink } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { SearchableSelect } from '../../SearchableSelect';
import { CertificateNameManagerModal } from './modals/CertificateNameManagerModal';
import { CertificateAgencyManagerModal } from './modals/CertificateAgencyManagerModal';
import { useEscKey } from '../../../hooks/useEscKey';
import { maskCNPJ } from '../utils/masks';

const ESTADOS_BRASIL_UF = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

interface CertificateFormData {
    id?: string;
    name: string;
    cnpj: string; // Novo campo
    issueDate: string;
    dueDate: string;
    agency: string;
    location: string;
    file?: File;
    fileUrl?: string;
    observations?: string;
    alteration?: string;
    contract_partners?: any[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CertificateFormData) => void;
    locationsList: { name: string; cnpj?: string }[];
    initialData?: CertificateFormData;
    nameDict?: Record<string, string>;
}

export function CertificateFormModal({ isOpen, onClose, onSave, locationsList, initialData, nameDict = {} }: Props) {
    const [isLocalDropdownOpen, setIsLocalDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState<CertificateFormData>({
        name: '',
        cnpj: '',
        issueDate: '',
        dueDate: '',
        agency: '',
        location: '',
        observations: '',
        alteration: '',
        contract_partners: [],
    });

    const [activeTab, setActiveTab] = useState<'geral' | 'informacoes'>('geral');
    const [isNameModalOpen, setIsNameModalOpen] = useState(false);
    const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                name: '',
                cnpj: '',
                issueDate: '',
                dueDate: '',
                agency: '',
                location: '',
                observations: '',
                alteration: '',
                contract_partners: [],
            });
        }
    }, [initialData]);

    useEscKey(isOpen, onClose);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsLocalDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getRealName = (idOrName: string) => nameDict[idOrName] || idOrName;

    if (!isOpen) return null;

    const fetchPartnerOabs = async (partnerIndex: number, collaboratorId: string) => {
        try {
            const { data, error } = await supabase
                .from('oab_number')
                .select('*')
                .eq('colaborador_id', collaboratorId)
                .order('tipo', { ascending: true }); // Assume 'Principal' comes first usually or handles it in UI. 

            if (error) throw error;

            const newPartners = [...(formData.contract_partners || [])];

            if (data && data.length > 0) {
                // Mapeia para o formato esperado no form
                newPartners[partnerIndex].oabs = data.map((oab: any) => ({
                    numero: oab.numero,
                    uf: oab.uf,
                    tipo: oab.tipo || 'Suplementar'
                }));
            } else {
                // Se não tem OAB, deixa um em branco Principal
                newPartners[partnerIndex].oabs = [{ numero: '', uf: '', tipo: 'Principal' }];
            }

            setFormData(prev => ({ ...prev, contract_partners: newPartners }));
        } catch (err) {
            console.error('Erro ao buscar OABs do sócio:', err);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFormData({ ...formData, file: e.target.files[0] });
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFormData({ ...formData, file: e.dataTransfer.files[0] });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-start sm:items-center bg-gray-50 rounded-t-2xl shrink-0">
                    <div className="pr-4">
                        <h2 className="text-lg sm:text-xl font-black text-[#0a192f] tracking-tight">
                            {initialData ? 'Editar Certidão' : 'Nova Certidão'}
                        </h2>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-500 mt-1 uppercase tracking-widest">
                            PREENCHA OS DADOS ABAIXO
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 sm:p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600 shrink-0"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-black text-gray-700 uppercase tracking-widest">Nome da Certidão *</label>
                                <button
                                    type="button"
                                    onClick={() => setIsNameModalOpen(true)}
                                    className="text-[9px] font-black text-[#1e3a8a] uppercase tracking-tighter flex items-center gap-1 hover:underline"
                                >
                                    <Settings2 className="w-3 h-3" /> Gerenciar
                                </button>
                            </div>
                            <SearchableSelect
                                placeholder="Selecione ou busque a certidão"
                                value={formData.name}
                                onChange={(val) => {
                                    setFormData({ ...formData, name: val });
                                    if (getRealName(val) !== 'Contrato Social') setActiveTab('geral');
                                }}
                                table="certificate_names"
                                nameField="name"
                            />
                        </div>

                        {getRealName(formData.name) === 'Contrato Social' && (
                            <div className="flex space-x-2 border-b border-gray-100 mb-6">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('geral')}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'geral' ? 'border-[#1e3a8a] text-[#1e3a8a]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                >
                                    Geral
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('informacoes')}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'informacoes' ? 'border-[#1e3a8a] text-[#1e3a8a]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                >
                                    Informações
                                </button>
                            </div>
                        )}

                        {activeTab === 'geral' ? (
                            <>
                                {getRealName(formData.name) === 'Contrato Social' && (
                                    <div>
                                        <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Alteração</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: 20ª Alteração ou Consolidado"
                                            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:border-[#1e3a8a] outline-none transition-colors"
                                            value={formData.alteration || ''}
                                            onChange={e => setFormData({ ...formData, alteration: e.target.value })}
                                        />
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative" ref={dropdownRef}>
                                        <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Local *</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsLocalDropdownOpen(!isLocalDropdownOpen)}
                                            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:border-[#1e3a8a] outline-none transition-all bg-white flex items-center justify-between group hover:border-[#1e3a8a]"
                                        >
                                            <span className={formData.location ? "text-gray-900 font-medium" : "text-gray-400"}>
                                                {formData.location || "Selecione um local"}
                                            </span>
                                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isLocalDropdownOpen ? 'rotate-180' : ''} group-hover:text-[#1e3a8a]`} />
                                        </button>

                                        {isLocalDropdownOpen && (
                                            <div className="absolute z-[100] w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                    {locationsList.map((loc) => (
                                                        <button
                                                            key={loc.name}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({
                                                                    ...formData,
                                                                    location: loc.name,
                                                                    cnpj: loc.cnpj ? maskCNPJ(loc.cnpj) : formData.cnpj
                                                                });
                                                                setIsLocalDropdownOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-gray-50 flex items-center justify-between ${formData.location === loc.name ? 'bg-blue-50 text-[#1e3a8a] font-bold' : 'text-gray-700 font-medium'
                                                                }`}
                                                        >
                                                            {loc.name}
                                                            {formData.location === loc.name && (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a]" />
                                                            )}
                                                        </button>
                                                    ))}
                                                    {locationsList.length === 0 && (
                                                        <div className="px-4 py-8 text-center text-gray-400 text-xs italic">
                                                            Nenhum local disponível
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">CNPJ da Certidão</label>
                                        <input
                                            type="text"
                                            placeholder="00.000.000/0000-00"
                                            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:border-[#1e3a8a] outline-none transition-colors"
                                            value={formData.cnpj}
                                            onChange={e => setFormData({ ...formData, cnpj: maskCNPJ(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Data Emissão *</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:border-[#1e3a8a] outline-none transition-colors"
                                            value={formData.issueDate}
                                            onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Data Vencimento *</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:border-[#1e3a8a] outline-none transition-colors"
                                            value={formData.dueDate}
                                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-black text-gray-700 uppercase tracking-widest">Cartório/Órgão *</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsAgencyModalOpen(true)}
                                            className="text-[9px] font-black text-[#1e3a8a] uppercase tracking-tighter flex items-center gap-1 hover:underline"
                                        >
                                            <Settings2 className="w-3 h-3" /> Gerenciar
                                        </button>
                                    </div>
                                    <SearchableSelect
                                        placeholder="Selecione ou busque o órgão"
                                        value={formData.agency}
                                        onChange={(val) => setFormData({ ...formData, agency: val })}
                                        table="certificate_agencies"
                                        nameField="name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Observações Internas</label>
                                    <textarea
                                        rows={3}
                                        className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:border-[#1e3a8a] outline-none transition-colors resize-none"
                                        placeholder="Notas adicionais sobre esta certidão..."
                                        value={formData.observations}
                                        onChange={e => setFormData({ ...formData, observations: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Arquivo da Certidão (GED) *</label>
                                    <div
                                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer relative ${isDragging ? 'border-[#1e3a8a] bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            required={!initialData} // Só é obrigatório se for novo
                                            accept=".pdf,.png,.jpg,.jpeg"
                                        />
                                        <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-[#1e3a8a]' : 'text-gray-400'}`} />
                                        <p className="text-sm font-semibold text-gray-600">
                                            {formData.file ? formData.file.name : (initialData?.fileUrl ? 'Arquivo enviado anteriormente. Clique ou arraste para substituir.' : (isDragging ? 'Solte o arquivo aqui' : 'Clique ou arraste o arquivo aqui'))}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG (Max. 10MB)</p>
                                    </div>
                                    {!formData.file && initialData?.fileUrl && (
                                        <div className="mt-3 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => window.open(initialData.fileUrl, '_blank')}
                                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#1e3a8a] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                Visualizar Arquivo Atual
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-widest">
                                        Sócios no Contato Social
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentPartners = formData.contract_partners || [];
                                            setFormData({
                                                ...formData,
                                                contract_partners: [
                                                    ...currentPartners,
                                                    { collaborator_id: '', name: '', oabs: [{ numero: '', uf: '', tipo: 'Principal' }] }
                                                ]
                                            });
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" /> Adicionar Sócio
                                    </button>
                                </div>

                                {(!formData.contract_partners || formData.contract_partners.length === 0) ? (
                                    <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nenhum sócio adicionado</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {formData.contract_partners.map((partner, pIndex) => (
                                            <div key={pIndex} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newPartners = [...(formData.contract_partners || [])];
                                                        newPartners.splice(pIndex, 1);
                                                        setFormData({ ...formData, contract_partners: newPartners });
                                                    }}
                                                    className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors"
                                                    title="Remover sócio"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>

                                                <div className="mb-4 pr-8">
                                                    <SearchableSelect
                                                        label="Nome do Sócio"
                                                        placeholder="Buscar sócio..."
                                                        value={partner.collaborator_id || partner.name}
                                                        onChange={(val, item) => {
                                                            console.log("Selecionado:", val, item);
                                                            const newPartners = [...(formData.contract_partners || [])];

                                                            // O SearchableSelect modificado agora passa o item completo
                                                            const collaboratorId = item?.colaborador_id || item?.collaborator_id || item?.id || val;
                                                            const collaboratorName = item?.name || val;

                                                            newPartners[pIndex] = {
                                                                ...newPartners[pIndex],
                                                                collaborator_id: collaboratorId,
                                                                name: collaboratorName
                                                            };
                                                            setFormData({ ...formData, contract_partners: newPartners });

                                                            // Busca as OABs preexistentes do colaborador
                                                            if (collaboratorId) {
                                                                fetchPartnerOabs(pIndex, collaboratorId);
                                                            }
                                                        }}
                                                        table="partners"
                                                        nameField="name"
                                                    />
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                            Inscrições OAB do Sócio
                                                        </h4>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newPartners = [...(formData.contract_partners || [])];
                                                                const partnerToUpdate = { ...newPartners[pIndex] };
                                                                const currentOabs = partnerToUpdate.oabs || [];
                                                                partnerToUpdate.oabs = [...currentOabs, { numero: '', uf: '', tipo: 'Suplementar' }];
                                                                newPartners[pIndex] = partnerToUpdate;
                                                                setFormData({ ...formData, contract_partners: newPartners });
                                                            }}
                                                            className="text-[9px] font-black text-[#1e3a8a] hover:underline"
                                                        >
                                                            + Suplementar
                                                        </button>
                                                    </div>

                                                    {partner.oabs && partner.oabs.map((oab: any, oIndex: number) => (
                                                        <div key={oIndex} className="grid grid-cols-12 gap-3 items-end">
                                                            <div className="col-span-5 relative">
                                                                {oab.tipo === 'Principal' && (
                                                                    <div className="absolute -top-2 left-2 bg-[#1e3a8a] text-white text-[8px] font-black uppercase px-1 rounded z-10">Principal</div>
                                                                )}
                                                                {oab.tipo !== 'Principal' && (
                                                                    <div className="absolute -top-2 left-2 bg-gray-500 text-white text-[8px] font-black uppercase px-1 rounded z-10">Suplementar</div>
                                                                )}
                                                                <input
                                                                    type="text"
                                                                    placeholder="Número OAB"
                                                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#1e3a8a] outline-none"
                                                                    value={oab.numero || ''}
                                                                    onChange={(e) => {
                                                                        const newPartners = [...(formData.contract_partners || [])];
                                                                        const newOabs = [...newPartners[pIndex].oabs];
                                                                        newOabs[oIndex] = { ...newOabs[oIndex], numero: e.target.value };
                                                                        newPartners[pIndex].oabs = newOabs;
                                                                        setFormData({ ...formData, contract_partners: newPartners });
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="col-span-5">
                                                                <SearchableSelect
                                                                    placeholder="UF"
                                                                    value={oab.uf || ''}
                                                                    onChange={(val) => {
                                                                        const newPartners = [...(formData.contract_partners || [])];
                                                                        const newOabs = [...newPartners[pIndex].oabs];
                                                                        newOabs[oIndex] = { ...newOabs[oIndex], uf: val };
                                                                        newPartners[pIndex].oabs = newOabs;
                                                                        setFormData({ ...formData, contract_partners: newPartners });
                                                                    }}
                                                                    options={ESTADOS_BRASIL_UF.map(uf => ({ name: uf, id: uf }))}
                                                                />
                                                            </div>
                                                            <div className="col-span-2 text-center pb-2">
                                                                {oab.tipo !== 'Principal' && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newPartners = [...(formData.contract_partners || [])];
                                                                            const newOabs = [...newPartners[pIndex].oabs];
                                                                            newOabs.splice(oIndex, 1);
                                                                            newPartners[pIndex].oabs = newOabs;
                                                                            setFormData({ ...formData, contract_partners: newPartners });
                                                                        }}
                                                                        className="text-red-400 hover:text-red-600"
                                                                    >
                                                                        <X className="w-5 h-5 mx-auto" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </form>

                <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 sm:py-2.5 text-xs font-black text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest w-full sm:w-auto text-center"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-3 sm:py-2.5 text-xs font-black text-white bg-gradient-to-r from-[#1e3a8a] to-[#112240] rounded-xl shadow-lg hover:shadow-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                        <Save className="w-4 h-4" />
                        Salvar Certidão
                    </button>
                </div>
            </div>

            <CertificateNameManagerModal
                isOpen={isNameModalOpen}
                onClose={() => setIsNameModalOpen(false)}
            />

            <CertificateAgencyManagerModal
                isOpen={isAgencyModalOpen}
                onClose={() => setIsAgencyModalOpen(false)}
            />
        </div>
    );
}
