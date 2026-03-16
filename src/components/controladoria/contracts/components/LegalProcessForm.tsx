import React from 'react';
import { Check, Plus, Search, Loader2, Link as LinkIcon, AlertTriangle, Building2, Gavel, Scale, Briefcase, FileText } from 'lucide-react';
import { CustomSelect } from '../../ui/CustomSelect';
import { Contract, ContractProcess } from '../../../../types/controladoria';

interface LegalProcessFormProps {
    formData: Contract;
    setFormData: React.Dispatch<React.SetStateAction<Contract>>;
    currentProcess: ContractProcess;
    setCurrentProcess: React.Dispatch<React.SetStateAction<ContractProcess>>;
    isStandardCNJ: boolean;
    setIsStandardCNJ: (v: boolean) => void;
    otherProcessType: string;
    setOtherProcessType: (v: string) => void;
    duplicateProcessData: any | null;
    searchingCNJ: boolean;
    handleCNJSearch: () => void;
    handleOpenJusbrasil: () => void;
    ufOptions: { label: string; value: string }[];
    opponentOptions: string[];
    duplicateOpponentCases: any[];
    editingProcessIndex: number | null;
    handleProcessAction: () => void;
    localMaskCNJ: (v: string) => string;
    setActiveManager: (v: string) => void;
    clientSelectOptions: { label: string; value: string }[];
    clientCnpjMap: Record<string, string>;
    opponentCnpjMap: Record<string, string>;
}

export function LegalProcessForm(props: LegalProcessFormProps) {
    const {
        currentProcess, setCurrentProcess, isStandardCNJ, setIsStandardCNJ,
        otherProcessType, setOtherProcessType, duplicateProcessData, searchingCNJ, handleCNJSearch, handleOpenJusbrasil,
        ufOptions, opponentOptions, duplicateOpponentCases,
        editingProcessIndex, handleProcessAction, localMaskCNJ, setActiveManager,
        clientSelectOptions, clientCnpjMap, opponentCnpjMap
    } = props;

    // Local state to hold the CNPJ being typed for search
    const [localCNPJ, setLocalCNPJ] = React.useState('');
    const [searchingClient, setSearchingClient] = React.useState(false);
    const [hasNoClientCnpj, setHasNoClientCnpj] = React.useState(false);

    const [localOpponentCNPJ, setLocalOpponentCNPJ] = React.useState('');
    const [searchingOpponent, setSearchingOpponent] = React.useState(false);
    const [hasNoOpponentCnpj, setHasNoOpponentCnpj] = React.useState(false);

    // Simple auto-fill for existing clients list when CNPJ is typed (as a simulated search, though we might not have CNPJ in clientSelectOptions directly unless we fetch it. Usually it fetches from public API)
    const handleClientCNPJSearch = async () => {
        if (!localCNPJ) return;
        setSearchingClient(true);
        try {
            const cleanCNPJ = localCNPJ.replace(/\D/g, '');
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
            if (response.ok) {
                const data = await response.json();
                const name = data.razao_social || data.nome_fantasia;
                if (name) {
                    setCurrentProcess(prev => ({ ...prev, client_name: name }));
                }
            }
        } catch (error) {
            console.error('Erro ao buscar CNPJ:', error);
        } finally {
            setSearchingClient(false);
        }
    };

    const handleOpponentCNPJSearch = async () => {
        if (!localOpponentCNPJ || hasNoOpponentCnpj) return;
        setSearchingOpponent(true);
        try {
            const cleanCNPJ = localOpponentCNPJ.replace(/\D/g, '');
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
            if (response.ok) {
                const data = await response.json();
                const name = data.razao_social || data.nome_fantasia;
                if (name) {
                    setCurrentProcess(prev => ({ ...prev, opponent: name }));
                }
            }
        } catch (error) {
            console.error('Erro ao buscar CNPJ do Contrário:', error);
        } finally {
            setSearchingOpponent(false);
        }
    };

    const maskCNPJ = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,4})/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    // Auto-fill CNPJ when Client is selected from the dropdown
    React.useEffect(() => {
        if (hasNoClientCnpj) {
            setLocalCNPJ('');
        } else if (currentProcess.client_name && clientCnpjMap[currentProcess.client_name]) {
            setLocalCNPJ(maskCNPJ(clientCnpjMap[currentProcess.client_name]));
        } else if (!currentProcess.client_name) {
            setLocalCNPJ('');
        }
    }, [currentProcess.client_name, clientCnpjMap, hasNoClientCnpj]);

    // Auto-fill CNPJ when Opponent is selected from the dropdown
    React.useEffect(() => {
        if (hasNoOpponentCnpj) {
            setLocalOpponentCNPJ('');
        } else if (currentProcess.opponent && opponentCnpjMap[currentProcess.opponent]) {
            setLocalOpponentCNPJ(maskCNPJ(opponentCnpjMap[currentProcess.opponent]));
        } else if (!currentProcess.opponent) {
            setLocalOpponentCNPJ('');
        }
    }, [currentProcess.opponent, opponentCnpjMap, hasNoOpponentCnpj]);

    // Se nenhum tipo está preenchido, não mostra o form
    const isEditingMode = editingProcessIndex !== null;
    const showForm = isEditingMode || !!otherProcessType;
    const isSpecialCase = ['Consultoria', 'Assessoria Jurídica', 'Processo Administrativo', 'Outros'].includes(otherProcessType) && otherProcessType !== '';

    return (
        <div className="space-y-4">
            {/* Botões de Adicionar Novos Processos - Esconde quando o formulário está visível */}
            {!showForm && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 animate-in fade-in duration-300">
                    <ProcessTypeButton icon={Gavel} label="Processos Judiciais" onClick={() => { setOtherProcessType('Processo Judicial'); setIsStandardCNJ(true); }} colorClass="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" />
                    <ProcessTypeButton icon={Building2} label="Processos Adm." onClick={() => setOtherProcessType('Processo Administrativo')} colorClass="bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200" />
                    <ProcessTypeButton icon={Briefcase} label="Assessoria Jurídica" onClick={() => setOtherProcessType('Assessoria Jurídica')} colorClass="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200" />
                    <ProcessTypeButton icon={Scale} label="Consultoria" onClick={() => setOtherProcessType('Consultoria')} colorClass="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200" />
                    <ProcessTypeButton icon={FileText} label="Outros" onClick={() => setOtherProcessType('Outros')} colorClass="bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200" />
                </div>
            )}

            {/* Formulário Dinâmico */}
            {showForm && (
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm animate-in slide-in-from-top-4 duration-300 relative">
                    {/* Header: Titulo + Fechar */}
                    {!isEditingMode && (
                         <div className="flex justify-between flex-row items-center border-b border-gray-100 pb-3 mb-4">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                                {otherProcessType === 'Processo Judicial' ? 'Novo Processo Judicial' : `Novo(a) ${otherProcessType}`}
                            </h3>
                            <button
                                onClick={() => {
                                    setOtherProcessType('');
                                    setCurrentProcess({ process_number: '', uf: '', opponent: '', client_name: '' });
                                }}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                title="Cancelar"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    )}
                    
                    {isEditingMode && (
                        <h3 className="text-sm font-bold text-salomao-blue uppercase tracking-wider mb-4 border-b border-gray-100 pb-3">Editar Processo</h3>
                    )}

                    <div className="space-y-4">
                        {/* Linha 1: Número */}
                        {otherProcessType === 'Processo Judicial' ? (
                            <div className="w-full">
                                <label className="text-[10px] text-gray-500 uppercase font-bold flex justify-between mb-1">
                                    Número do Processo *
                                    {currentProcess.process_number && isStandardCNJ && (<button onClick={handleOpenJusbrasil} className="text-[10px] text-blue-500 hover:underline flex items-center" title="Abrir no Jusbrasil"><LinkIcon className="w-3 h-3 mr-1" /> Ver Externo</button>)}
                                </label>
                                <div className="flex items-center">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            className={`w-full border-b ${duplicateProcessData ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-gray-300'} focus:border-salomao-blue outline-none py-2 text-sm font-mono pr-8 bg-white`}
                                            placeholder={"0000000-00.0000.0.00.0000"}
                                            value={currentProcess.process_number || ''}
                                            onChange={(e) => setCurrentProcess({ ...currentProcess, process_number: localMaskCNJ(e.target.value) })}
                                            autoFocus
                                        />
                                        <button onClick={handleCNJSearch} disabled={searchingCNJ || !currentProcess.process_number || currentProcess.process_number.length < 20} className="absolute right-0 top-1/2 -translate-y-1/2 text-salomao-blue hover:text-salomao-gold disabled:opacity-30 transition-colors p-2">
                                            {searchingCNJ ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                {duplicateProcessData && (
                                    <div className="text-[10px] text-orange-700 mt-2 flex items-center font-bold bg-orange-50 border border-orange-200 p-1.5 rounded animate-in slide-in-from-top-1">
                                        <AlertTriangle className="w-3 h-3 mr-1.5 flex-shrink-0" />
                                        <span>Já cadastrado em: <a href={`/contracts/${duplicateProcessData.contract_id || duplicateProcessData.id}`} target="_blank" rel="noreferrer" className="ml-1 underline hover:text-orange-900">{duplicateProcessData.contracts?.client_name || duplicateProcessData.client_name}</a></span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-full">
                                <label className="text-[10px] text-gray-500 uppercase font-bold flex justify-between mb-1">
                                    {isSpecialCase ? 'Identificação / Assunto *' : 'Número do Processo *'}
                                </label>
                                <input
                                    type="text"
                                    className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-2 text-sm font-medium bg-white"
                                    placeholder={isSpecialCase ? "Descreva o assunto para identificação..." : "Digite o número..."}
                                    value={currentProcess.process_number || ''}
                                    onChange={(e) => setCurrentProcess({ ...currentProcess, process_number: e.target.value })}
                                    autoFocus={!isEditingMode}
                                />
                                {isSpecialCase && <p className="text-[10px] text-gray-400 mt-1">Este campo substitui o número do processo.</p>}
                            </div>
                        )}

                        {/* Linha 2: Cliente e UF */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="col-span-12 md:col-span-4">
                                <label className="text-[10px] text-gray-500 uppercase font-bold flex justify-between items-center mb-1">
                                    <span>Buscar Cliente por CNPJ</span>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="checkbox" checked={hasNoClientCnpj} onChange={(e) => setHasNoClientCnpj(e.target.checked)} className="rounded border-gray-300 text-salomao-blue focus:ring-salomao-blue" />
                                        <span className="text-[9px] font-medium text-gray-500 normal-case">Sem CNPJ</span>
                                    </label>
                                </label>
                                <div className="flex items-center relative">
                                    <input
                                        type="text"
                                        className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-2 text-sm font-medium pr-8 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                                        placeholder="00.000.000/0000-00"
                                        value={localCNPJ}
                                        onChange={(e) => setLocalCNPJ(maskCNPJ(e.target.value))}
                                        maxLength={18}
                                        disabled={hasNoClientCnpj}
                                    />
                                    <button onClick={handleClientCNPJSearch} disabled={hasNoClientCnpj || searchingClient || localCNPJ.length < 14} className="absolute right-0 top-1/2 -translate-y-1/2 text-salomao-blue hover:text-salomao-gold disabled:opacity-30 p-2 transition-colors">
                                        {searchingClient ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="col-span-12 md:col-span-5">
                                <CustomSelect label="Cliente *" value={currentProcess.client_name || ''} onChange={(val: string) => setCurrentProcess({ ...currentProcess, client_name: val })} options={clientSelectOptions} onAction={() => setActiveManager('client')} actionLabel="Gerenciar Clientes" placeholder="Selecione o Cliente..." />
                            </div>
                            <div className="col-span-12 md:col-span-3">
                                <CustomSelect label="Estado (UF) *" value={currentProcess.uf || ''} onChange={(val: string) => setCurrentProcess({ ...currentProcess, uf: val })} options={ufOptions} placeholder="UF" />
                            </div>
                        </div>

                        {/* Linha 3: Contrário */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="col-span-12 md:col-span-4">
                                <label className="text-[10px] text-gray-500 uppercase font-bold flex justify-between items-center mb-1">
                                    <span>Buscar Contrário por CNPJ</span>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="checkbox" checked={hasNoOpponentCnpj} onChange={(e) => setHasNoOpponentCnpj(e.target.checked)} className="rounded border-gray-300 text-salomao-blue focus:ring-salomao-blue" />
                                        <span className="text-[9px] font-medium text-gray-500 normal-case">Sem CNPJ</span>
                                    </label>
                                </label>
                                <div className="flex items-center relative">
                                    <input
                                        type="text"
                                        className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-2 text-sm font-medium pr-8 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                                        placeholder="00.000.000/0000-00"
                                        value={localOpponentCNPJ}
                                        onChange={(e) => setLocalOpponentCNPJ(maskCNPJ(e.target.value))}
                                        maxLength={18}
                                        disabled={hasNoOpponentCnpj}
                                    />
                                    <button onClick={handleOpponentCNPJSearch} disabled={hasNoOpponentCnpj || searchingOpponent || localOpponentCNPJ.length < 14} className="absolute right-0 top-1/2 -translate-y-1/2 text-salomao-blue hover:text-salomao-gold disabled:opacity-30 p-2 transition-colors">
                                        {searchingOpponent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="col-span-12 md:col-span-8">
                                <CustomSelect label="Contrário" value={currentProcess.opponent || ''} onChange={(val: string) => setCurrentProcess({ ...currentProcess, opponent: val })} options={(Array.isArray(opponentOptions) ? opponentOptions : []).map(o => ({ label: o, value: o }))} onAction={() => setActiveManager('opponent')} actionLabel="Gerenciar Contrário" placeholder="Selecione ou adicione novo..." />
                                {duplicateOpponentCases.length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        <span className="text-[10px] text-blue-600 font-bold mr-1">Similar:</span>
                                        {(Array.isArray(duplicateOpponentCases) ? duplicateOpponentCases : []).map(c => (<a key={c.contract_id} href={`/contracts/${c.contracts?.id}`} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 hover:bg-blue-100 truncate max-w-[150px]">{c.contracts?.client_name}</a>))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ações */}
                        <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
                            <button onClick={handleProcessAction} className="bg-salomao-blue text-white rounded-xl px-6 py-2.5 hover:bg-blue-900 transition-colors flex items-center justify-center shadow-md text-xs font-bold w-full sm:w-auto uppercase tracking-widest">
                                {isEditingMode ? <><Check className="w-4 h-4 mr-2" /> Salvar Edição</> : <><Plus className="w-4 h-4 mr-2" /> Incluir Este Item</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Icon Helper Component
function X(props: any) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
}

function ProcessTypeButton({ icon: Icon, label, onClick, colorClass }: { icon: any, label: string, onClick: () => void, colorClass: string }) {
    return (
        <button
            onClick={onClick}
            className={`border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md cursor-pointer group ${colorClass}`}
        >
            <div className="bg-white/80 p-2 rounded-lg group-hover:scale-110 transition-transform">
                <Icon size={24} />
            </div>
            <span className="text-xs font-bold text-center leading-tight mt-1">{label}</span>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus size={16} />
            </div>
        </button>
    );
}