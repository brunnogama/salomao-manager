import React from 'react';
import { Check, Plus, Search, Loader2, Link as LinkIcon, AlertTriangle, Building2, Gavel, Scale, Briefcase, FileText, Bot } from 'lucide-react';
import { CustomSelect } from '../../ui/CustomSelect';
import { Contract, ContractProcess } from '../../../../types/controladoria';
import { supabase } from '../../../../lib/supabase';

export interface LegalProcessFormProps {
    formData: Contract;
    setFormData: React.Dispatch<React.SetStateAction<Contract>>;
    currentProcess: ContractProcess;
    setCurrentProcess: React.Dispatch<React.SetStateAction<ContractProcess>>;
    isStandardCNJ: boolean;
    setIsStandardCNJ: (v: boolean) => void;
    otherProcessType: string;
    duplicateProcessData: any | null;
    handleOpenJusbrasil: () => void;
    ufOptions: { label: string; value: string }[];
    opponentOptions: string[];
    duplicateOpponentCases: any[];
    editingProcessIndex: number | null;
    handleProcessAction: () => void;
    cancelEditProcess?: () => void;
    localMaskCNJ: (v: string) => string;
    setActiveManager: (v: string) => void;
    clientSelectOptions?: { label: string; value: string }[];
    clientCnpjMap?: Record<string, string>;
    opponentCnpjMap: Record<string, string>;
}

export function LegalProcessForm(props: LegalProcessFormProps) {
    const {
        currentProcess, setCurrentProcess, isStandardCNJ, setIsStandardCNJ,
        otherProcessType, setOtherProcessType, duplicateProcessData, handleOpenJusbrasil,
        ufOptions, opponentOptions, duplicateOpponentCases,
        editingProcessIndex, handleProcessAction, cancelEditProcess, localMaskCNJ, setActiveManager,
        opponentCnpjMap
    } = props;
    const [localOpponentCNPJ, setLocalOpponentCNPJ] = React.useState('');
    const [searchingOpponent, setSearchingOpponent] = React.useState(false);
    const [hasNoOpponentCnpj, setHasNoOpponentCnpj] = React.useState(false);

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

    const [isMagicFilling, setIsMagicFilling] = React.useState(false);

    const handleMagicFill = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!currentProcess.process_number || currentProcess.process_number.length < 20) return;
        setIsMagicFilling(true);
        try {
            const { data, error } = await supabase.functions.invoke('resumir-processo-tj', {
                body: { processNumber: currentProcess.process_number }
            });
            if (error) throw new Error(error.message);
            if (!data?.success) throw new Error(data?.error || 'Erro desconhecido na IA');

            if (data.extractedData) {
                const ed = data.extractedData;
                setCurrentProcess(prev => ({
                    ...prev,
                    subject: ed.subject || prev.subject,
                    value_of_cause: typeof ed.value_of_cause === 'number' && ed.value_of_cause > 0 ? ed.value_of_cause : prev.value_of_cause,
                    court: ed.court || prev.court,
                    vara: ed.vara || prev.vara,
                    comarca: ed.comarca || prev.comarca,
                    uf: ed.uf || prev.uf,
                    opponent: ed.opponent || prev.opponent,
                    ia_summary: data.summary || prev.ia_summary
                }));
            }
        } catch (err: any) {
            console.error('Magic Fill Error:', err);
        } finally {
            setIsMagicFilling(false);
        }
    };

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

    // Regra de Auto-preenchimento de UF pelo Padrão CNJ
    React.useEffect(() => {
        if (!currentProcess.process_number || currentProcess.process_number.length < 25) return;
        
        // Só auto-preenche se o usuário ainda não tiver escolhido uma UF
        if (currentProcess.uf && currentProcess.uf.trim() !== '') return;

        const partes = currentProcess.process_number.split('.');
        if (partes.length === 5) {
            const ramo = partes[2];
            const tribunal = partes[3];
            
            // Justiça Estadual (8)
            if (ramo === '8') {
                const ufMap: Record<string, string> = {
                    '01': 'AC', '02': 'AL', '03': 'AP', '04': 'AM', '05': 'BA',
                    '06': 'CE', '07': 'DF', '08': 'ES', '09': 'GO', '10': 'MA',
                    '11': 'MT', '12': 'MS', '13': 'MG', '14': 'PA', '15': 'PB',
                    '16': 'PR', '17': 'PE', '18': 'PI', '19': 'RJ', '20': 'RN',
                    '21': 'RS', '22': 'RO', '23': 'RR', '24': 'SC', '25': 'SE',
                    '26': 'SP', '27': 'TO'
                };
                if (ufMap[tribunal]) {
                    setCurrentProcess(prev => ({ ...prev, uf: ufMap[tribunal] }));
                }
            }
            // Justiça do Trabalho (5)
            else if (ramo === '5') {
                const trtMap: Record<string, string> = {
                    '01': 'RJ', '02': 'SP', '03': 'MG', '04': 'RS', '05': 'BA',
                    '06': 'PE', '07': 'CE', '08': 'PA', '09': 'PR', '10': 'DF',
                    '11': 'AM', '12': 'SC', '13': 'PB', '14': 'RO', '15': 'SP',
                    '16': 'MA', '17': 'ES', '18': 'GO', '19': 'AL', '20': 'SE',
                    '21': 'RN', '22': 'PI', '23': 'MT', '24': 'MS'
                };
                if (trtMap[tribunal]) {
                    setCurrentProcess(prev => ({ ...prev, uf: trtMap[tribunal] }));
                }
            }
        }
    }, [currentProcess.process_number, currentProcess.uf]);

    // Se nenhum tipo está preenchido, não mostra o form
    const isEditingMode = editingProcessIndex !== null;
    const isJudicial = otherProcessType === 'Processo Judicial' || (isEditingMode && (!otherProcessType || otherProcessType === 'Processo Judicial' || (currentProcess.process_number && currentProcess.process_number.length >= 15)));
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
                    <div className="flex justify-between flex-row items-center border-b border-gray-100 pb-3 mb-4">
                        <h3 className={`text-sm font-bold uppercase tracking-wider ${isEditingMode ? 'text-salomao-blue' : 'text-gray-700'}`}>
                            {isEditingMode ? 'Editar Processo' : (otherProcessType === 'Processo Judicial' ? 'Novo Processo Judicial' : `Novo(a) ${otherProcessType}`)}
                        </h3>
                        <button
                            onClick={() => {
                                if (cancelEditProcess) {
                                    cancelEditProcess();
                                }
                                setOtherProcessType('');
                                setCurrentProcess({ process_number: '', uf: '', opponent: '', client_name: '' } as any);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            title={isEditingMode ? "Cancelar Edição" : "Cancelar"}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Linha 1: Número e UF */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="col-span-12 md:col-span-8">
                                <label className="text-[10px] text-gray-500 uppercase font-bold flex justify-between items-end mb-1">
                                    <span>{isJudicial ? 'Número do Processo *' : (isSpecialCase ? 'Identificação / Assunto *' : 'Número do Processo *')}</span>
                                    {currentProcess.process_number && isStandardCNJ && isJudicial && (<button onClick={handleOpenJusbrasil} className="text-[10px] text-blue-500 hover:underline flex items-center" title="Abrir no Jusbrasil"><LinkIcon className="w-3 h-3 mr-1" /> Ver Externo</button>)}
                                </label>
                                <div className="flex items-center">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            className={`w-full border-b ${duplicateProcessData ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-gray-300'} focus:border-salomao-blue outline-none py-2 text-sm ${isJudicial ? 'font-mono pr-20' : 'font-medium'} bg-white`}
                                            placeholder={isJudicial ? "0000000-00.0000.0.00.0000" : (isSpecialCase ? "Descreva o assunto para identificação..." : "Digite o número...")}
                                            value={currentProcess.process_number || ''}
                                            onChange={(e) => setCurrentProcess({ ...currentProcess, process_number: isJudicial ? localMaskCNJ(e.target.value) : e.target.value })}
                                            autoFocus={!isEditingMode}
                                        />
                                        {isJudicial && (
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center pr-1">
                                                {/* Preenchimento Mágico (IA) Destaque */}
                                                <button 
                                                    onClick={handleMagicFill} 
                                                    disabled={isMagicFilling || !currentProcess.process_number || currentProcess.process_number.length < 20} 
                                                    className="text-white hover:bg-indigo-700 disabled:opacity-50 px-2.5 py-1.5 transition-all bg-indigo-600 rounded-lg shadow-sm flex items-center gap-1.5 font-bold text-xs group"
                                                    title="Preencher com Inteligência Artificial"
                                                >
                                                    {isMagicFilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                                                    <span className="hidden sm:inline">IA</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {isSpecialCase && !isJudicial && <p className="text-[10px] text-gray-400 mt-1">Este campo substitui o número do processo.</p>}
                                {duplicateProcessData && isJudicial && (
                                    <div className="text-[10px] text-orange-700 mt-2 flex items-center font-bold bg-orange-50 border border-orange-200 p-1.5 rounded animate-in slide-in-from-top-1">
                                        <AlertTriangle className="w-3 h-3 mr-1.5 flex-shrink-0" />
                                        <span>Já cadastrado em: <a href={`/contracts/${duplicateProcessData.contract_id || duplicateProcessData.id}`} target="_blank" rel="noreferrer" className="ml-1 underline hover:text-orange-900">{duplicateProcessData.contracts?.client_name || duplicateProcessData.client_name}</a></span>
                                    </div>
                                )}
                            </div>
                            <div className="col-span-12 md:col-span-4 flex flex-col justify-end">
                                <CustomSelect label="Estado (UF) *" value={currentProcess.uf || ''} onChange={(val: string) => setCurrentProcess({ ...currentProcess, uf: val })} options={ufOptions} placeholder="UF" />
                            </div>
                        </div>

                        {/* Linha 2 e 3 (Combinada): Contrário */}
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
                            <div className="col-span-12 md:col-span-5">
                                <CustomSelect label="Contrário" value={currentProcess.opponent || ''} onChange={(val: string) => setCurrentProcess({ ...currentProcess, opponent: val })} options={(Array.isArray(opponentOptions) ? opponentOptions : []).map(o => ({ label: o, value: o }))} onAction={() => setActiveManager('opponent')} actionLabel="Gerenciar Contrário" placeholder="Selecione ou adicione novo..." />
                                {duplicateOpponentCases.length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        <span className="text-[10px] text-blue-600 font-bold mr-1">Similar:</span>
                                        {(Array.isArray(duplicateOpponentCases) ? duplicateOpponentCases : []).map(c => (<a key={c.contract_id} href={`/contracts/${c.contracts?.id}`} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 hover:bg-blue-100 truncate max-w-[150px]">{c.contracts?.client_name}</a>))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Linha Oculta para Exibir Objeto / Valor preenchido automaticamente pela IA caso contenha valor */}
                        {((currentProcess.subject && currentProcess.subject.trim() !== '') || (currentProcess.value_of_cause && currentProcess.value_of_cause > 0)) && (
                            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 flex flex-col gap-4">
                                <div className="flex flex-wrap gap-4 items-center">
                                    {currentProcess.subject && (
                                        <div className="flex-1">
                                            <label className="text-[10px] text-indigo-500 uppercase font-black mb-1 flex items-center gap-1.5"><Bot className="w-3.5 h-3.5"/> Assunto / Objeto</label>
                                            <input type="text" value={currentProcess.subject} onChange={(e) => setCurrentProcess({...currentProcess, subject: e.target.value})} className="w-full bg-transparent text-sm border-b border-indigo-200 focus:border-indigo-400 outline-none p-1 font-medium text-indigo-900" />
                                        </div>
                                    )}
                                    {currentProcess.value_of_cause && currentProcess.value_of_cause > 0 ? (
                                        <div className="w-32">
                                            <label className="text-[10px] text-indigo-500 uppercase font-black mb-1 flex items-center gap-1.5"><Bot className="w-3.5 h-3.5"/> Valor da Causa</label>
                                            <div className="text-sm border-b border-indigo-200 outline-none p-1 font-medium text-emerald-600 bg-transparent flex items-center">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentProcess.value_of_cause)}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        )}

                        {/* Campo Resumo do Processo (Sempre Visível) */}
                        <div className="w-full mt-4">
                            <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 flex items-center gap-1.5">
                                <Bot className="w-3.5 h-3.5 text-indigo-500"/> Resumo do Processo (IA)
                            </label>
                            <textarea
                                value={currentProcess.ia_summary || ''}
                                onChange={(e) => setCurrentProcess({...currentProcess, ia_summary: e.target.value})}
                                className="w-full bg-white/60 border border-gray-200 rounded-lg p-3 text-sm font-medium text-gray-700 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 resize-none"
                                rows={4}
                                placeholder="Clique no robôzinho azul ao lado do número do processo ou digite um resumo manualmente..."
                            />
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