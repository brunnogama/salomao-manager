import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Upload, Settings2, ChevronDown } from 'lucide-react';
import { SearchableSelect } from '../../SearchableSelect';
import { CertificateNameManagerModal } from './modals/CertificateNameManagerModal';
import { CertificateAgencyManagerModal } from './modals/CertificateAgencyManagerModal';
import { maskCNPJ } from '../utils/masks';

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
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CertificateFormData) => void;
    locationsList: string[];
    initialData?: CertificateFormData;
}

export function CertificateFormModal({ isOpen, onClose, onSave, locationsList, initialData }: Props) {
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
    });

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
            });
        }
    }, [initialData]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsLocalDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isOpen) return null;

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
                                onChange={(val) => setFormData({ ...formData, name: val })}
                                table="certificate_names"
                                nameField="name"
                            />
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

                        <div className="grid grid-cols-2 gap-4">
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
                                                    key={loc}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({ ...formData, location: loc });
                                                        setIsLocalDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-gray-50 flex items-center justify-between ${formData.location === loc ? 'bg-blue-50 text-[#1e3a8a] font-bold' : 'text-gray-700 font-medium'
                                                        }`}
                                                >
                                                    {loc}
                                                    {formData.location === loc && (
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
                                    {formData.file ? formData.file.name : (initialData?.fileUrl ? 'Arquivo enviado anteriormente. Clique para substituir.' : (isDragging ? 'Solte o arquivo aqui' : 'Clique ou arraste o arquivo aqui'))}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG (Max. 10MB)</p>
                            </div>
                        </div>
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
