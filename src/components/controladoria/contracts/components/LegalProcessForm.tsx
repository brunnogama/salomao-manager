import React from 'react';
import { Settings, Check, Plus, Search, Loader2, Link as LinkIcon, AlertTriangle, Gavel, X } from 'lucide-react';
import { CustomSelect } from '../ui/CustomSelect'; // Caminho corrigido
import { Contract, ContractProcess } from '../types'; // Caminho corrigido
import { maskMoney, maskCNPJ } from '../utils/masks'; // Caminho corrigido

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
  courtSelectOptions: { label: string; value: string }[];
  ufOptions: { label: string; value: string }[];
  positionOptions: { label: string; value: string }[];
  authorOptions: string[];
  opponentOptions: string[];
  duplicateOpponentCases: any[];
  duplicateAuthorCases: any[]; 
  magistrateTypes: { label: string; value: string }[];
  magistrateOptions: string[];
  newMagistrateTitle: string;
  setNewMagistrateTitle: (v: string) => void;
  newMagistrateName: string;
  setNewMagistrateName: (v: string) => void;
  addMagistrate: (name: string) => void;
  removeMagistrate: (index: number) => void;
  numeralOptions: { label: string; value: string }[];
  varaSelectOptions: { label: string; value: string }[];
  comarcaSelectOptions: { label: string; value: string }[];
  justiceSelectOptions: { label: string; value: string }[];
  classSelectOptions: { label: string; value: string }[];
  subjectSelectOptions: { label: string; value: string }[];
  newSubject: string;
  setNewSubject: (v: string) => void;
  addSubjectToProcess: () => void;
  removeSubject: (subject: string) => void;
  editingProcessIndex: number | null;
  handleProcessAction: () => void;
  handlePartyCNPJSearch: (type: 'author' | 'opponent') => void;
  localMaskCNJ: (v: string) => string;
  ensureDateValue: (v?: string | null) => string;
  setActiveManager: (v: string) => void;
  authorHasNoCnpj: boolean;
  setAuthorHasNoCnpj: (v: boolean) => void;
  opponentHasNoCnpj: boolean;
  setOpponentHasNoCnpj: (v: boolean) => void;
}

export function LegalProcessForm(props: LegalProcessFormProps) {
  const {
    formData, setFormData, currentProcess, setCurrentProcess, isStandardCNJ, setIsStandardCNJ,
    otherProcessType, setOtherProcessType, duplicateProcessData, searchingCNJ, handleCNJSearch, handleOpenJusbrasil,
    courtSelectOptions, ufOptions, positionOptions, authorOptions, opponentOptions, duplicateOpponentCases, duplicateAuthorCases,
    magistrateTypes, magistrateOptions, newMagistrateTitle, setNewMagistrateTitle, newMagistrateName, setNewMagistrateName,
    addMagistrate, removeMagistrate, numeralOptions, varaSelectOptions, comarcaSelectOptions, justiceSelectOptions,
    classSelectOptions, subjectSelectOptions, newSubject, setNewSubject, addSubjectToProcess, removeSubject,
    editingProcessIndex, handleProcessAction, handlePartyCNPJSearch, localMaskCNJ, ensureDateValue, setActiveManager,
    authorHasNoCnpj, setAuthorHasNoCnpj, opponentHasNoCnpj, setOpponentHasNoCnpj
  } = props;

  const isSpecialCase = ['Consultoria', 'Assessoria Jurídica', 'Processo Administrativo', 'Outros', 'CONSULTORIA', 'ASSESSORIA JURÍDICA', 'PROCESSO ADMINISTRATIVO'].includes(otherProcessType);

  return (
    <div className="space-y-4">
      {isSpecialCase ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-in fade-in duration-300">
            {otherProcessType === 'Processo Administrativo' ? (
                <div className="space-y-4 mb-4">
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest flex justify-between mb-1">Número *</label>
                        <input type="text" className="w-full border-b border-gray-300 focus:border-[#0a192f] outline-none py-2 text-sm font-bold text-gray-800" placeholder="Número do processo..." value={currentProcess.process_number || ''} onChange={(e) => setCurrentProcess({ ...currentProcess, process_number: e.target.value })} autoFocus />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest flex justify-between mb-1">Assunto *</label>
                        <input type="text" className="w-full border-b border-gray-300 focus:border-[#0a192f] outline-none py-2 text-sm font-medium" placeholder="Descreva o assunto..." value={currentProcess.subject || ''} onChange={(e) => setCurrentProcess({ ...currentProcess, subject: e.target.value })} />
                    </div>
                </div>
            ) : (
                <div className="mb-4">
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest flex justify-between mb-1">Assunto ({otherProcessType}) *</label>
                    <input type="text" className="w-full border-b border-gray-300 focus:border-[#0a192f] outline-none py-2 text-sm font-bold text-gray-800" placeholder={`Descreva o assunto...`} value={currentProcess.process_number || ''} onChange={(e) => setCurrentProcess({ ...currentProcess, process_number: e.target.value })} autoFocus />
                    <p className="text-[10px] text-gray-400 font-medium mt-2">Este campo substitui o número do processo para fins de identificação.</p>
                </div>
            )}
            <div className="flex justify-end mt-4">
                <button onClick={handleProcessAction} className="bg-[#0a192f] text-white rounded-lg px-6 py-2.5 hover:bg-slate-800 transition-all flex items-center justify-center shadow-lg text-[11px] font-black uppercase tracking-wider w-full md:w-auto active:scale-95">
                    {editingProcessIndex !== null ? <><Check className="w-4 h-4 mr-2" /> Atualizar {toTitleCase(otherProcessType)}</> : <><Plus className="w-4 h-4 mr-2" /> Adicionar {toTitleCase(otherProcessType)}</>}
                </button>
            </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-in fade-in duration-300">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 border-b border-gray-100 pb-3">Detalhes do Processo Judicial</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5 items-end">
            <div className={isStandardCNJ ? "md:col-span-5" : "md:col-span-4"}>
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest flex justify-between mb-1">
                    Número do Processo *
                    {currentProcess.process_number && isStandardCNJ && (<button onClick={handleOpenJusbrasil} className="text-[9px] text-blue-600 font-bold hover:underline flex items-center bg-blue-50 px-1.5 py-0.5 rounded" title="Abrir no Jusbrasil"><LinkIcon className="w-3 h-3 mr-1" /> JUSBRASIL</button>)}
                </label>
                <div className="flex items-center">
                    <CustomSelect 
                        value={isStandardCNJ ? 'cnj' : 'other'}
                        onChange={(val: string) => {
                            setIsStandardCNJ(val === 'cnj');
                            setCurrentProcess({ ...currentProcess, process_number: '' });
                        }}
                        options={[{ label: 'CNJ', value: 'cnj' }, { label: 'OUTRO', value: 'other' }]}
                        className="mr-2 w-28 h-[42px]"
                    />
                    <div className="flex-1 relative">
                          <input type="text" className={`w-full border-b ${duplicateProcessData ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-gray-300'} focus:border-[#0a192f] outline-none py-2 text-sm font-mono pr-8`} placeholder={isStandardCNJ ? "0000000-00..." : "Nº Processo"} value={currentProcess.process_number || ''} onChange={(e) => setCurrentProcess({...currentProcess, process_number: isStandardCNJ ? localMaskCNJ(e.target.value) : e.target.value})} />
                          <button onClick={handleCNJSearch} disabled={!isStandardCNJ || searchingCNJ || !currentProcess.process_number} className="absolute right-0 top-1/2 -translate-y-1/2 text-[#0a192f] hover:text-amber-600 disabled:opacity-30 transition-colors">
                              {searchingCNJ ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          </button>
                    </div>
                </div>
                {duplicateProcessData && (
                  <div className="text-[10px] text-orange-700 mt-2 flex items-center font-bold bg-orange-50 border border-orange-200 p-2 rounded-lg animate-in slide-in-from-top-1 shadow-sm">
                      <AlertTriangle className="w-3.5 h-3.5 mr-2 flex-shrink-0" /> 
                      <span>Já cadastrado: <a href={`/legal-control/contracts?id=${duplicateProcessData.contract_id || duplicateProcessData.id}`} target="_blank" rel="noreferrer" className="ml-1 underline hover:text-orange-900">{duplicateProcessData.contracts?.client_name || duplicateProcessData.client_name}</a></span>
                  </div>
                )}
            </div>
            {!isStandardCNJ && (
                <div className="md:col-span-2">
                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Tipo (ex: AgInt)</label>
                    <input type="text" className="w-full border-b border-gray-300 focus:border-[#0a192f] outline-none py-2 text-sm font-bold" value={otherProcessType} onChange={(e) => setOtherProcessType(e.target.value)} />
                </div>
            )}
            <div className="md:col-span-2"><CustomSelect label="Tribunal *" value={currentProcess.court || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, court: val})} options={courtSelectOptions} onAction={() => setActiveManager('court')} actionLabel="Gerenciar Tribunais" actionIcon={Settings} placeholder="Selecione" /></div>
            <div className="md:col-span-2"><CustomSelect label="Estado (UF) *" value={currentProcess.uf || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, uf: val})} options={ufOptions} placeholder="UF" /></div>
            <div className={isStandardCNJ ? "md:col-span-3" : "md:col-span-2"}><CustomSelect label="Posição do Cliente" value={currentProcess.position || formData.client_position || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, position: val})} options={positionOptions} onAction={() => setActiveManager('position')} actionLabel="Gerenciar Posições" actionIcon={Settings} /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5">
            <div className="md:col-span-2">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">CNPJ Autor</label>
                <div className="relative">
                    <input type="text" disabled={authorHasNoCnpj} className="w-full border-b border-gray-300 focus:border-[#0a192f] outline-none py-2 text-sm font-bold disabled:bg-gray-50" value={(currentProcess as any).author_cnpj || ''} onChange={(e) => setCurrentProcess({ ...currentProcess, author_cnpj: maskCNPJ(e.target.value) } as any)} placeholder={authorHasNoCnpj ? "Sem CNPJ" : ""} />
                    <button onClick={() => handlePartyCNPJSearch('author')} disabled={authorHasNoCnpj} className="absolute right-0 top-1/2 -translate-y-1/2 text-[#0a192f] hover:text-amber-600 disabled:opacity-30"><Search className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center mt-2"><input type="checkbox" id="no_cnpj_author" checked={authorHasNoCnpj} onChange={(e) => setAuthorHasNoCnpj(e.target.checked)} className="rounded text-[#0a192f] w-3 h-3 mr-1.5 focus:ring-[#0a192f]" /><label htmlFor="no_cnpj_author" className="text-[10px] font-bold text-gray-400 uppercase cursor-pointer">Sem CNPJ</label></div>
            </div>
            <div className="md:col-span-4">
                <CustomSelect label="Autor" value={(currentProcess as any).author || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, author: val} as any)} options={authorOptions.map(o => ({ label: o, value: o }))} onAction={() => setActiveManager('author')} actionLabel="Gerenciar Autores" actionIcon={Settings} placeholder="Selecione ou adicione" />
                {duplicateAuthorCases.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-[9px] text-blue-600 font-black uppercase mr-1">Similar:</span>
                        {duplicateAuthorCases.map(c => (<a key={c.contract_id} href={`/legal-control/contracts?id=${c.contracts?.id}`} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 hover:bg-blue-100 truncate max-w-[150px] shadow-sm">{c.contracts?.client_name}</a>))}
                    </div>
                )}
            </div>
            <div className="md:col-span-2">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">CNPJ Contrário</label>
                <div className="relative">
                    <input type="text" disabled={opponentHasNoCnpj} className="w-full border-b border-gray-300 focus:border-[#0a192f] outline-none py-2 text-sm font-bold disabled:bg-gray-50" value={(currentProcess as any).opponent_cnpj || ''} onChange={(e) => setCurrentProcess({ ...currentProcess, opponent_cnpj: maskCNPJ(e.target.value) } as any)} placeholder={opponentHasNoCnpj ? "Sem CNPJ" : ""} />
                    <button onClick={() => handlePartyCNPJSearch('opponent')} disabled={opponentHasNoCnpj} className="absolute right-0 top-1/2 -translate-y-1/2 text-[#0a192f] hover:text-amber-600 disabled:opacity-30"><Search className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center mt-2"><input type="checkbox" id="no_cnpj_opponent" checked={opponentHasNoCnpj} onChange={(e) => setOpponentHasNoCnpj(e.target.checked)} className="rounded text-[#0a192f] w-3 h-3 mr-1.5 focus:ring-[#0a192f]" /><label htmlFor="no_cnpj_opponent" className="text-[10px] font-bold text-gray-400 uppercase cursor-pointer">Sem CNPJ</label></div>
            </div>
            <div className="md:col-span-4">
                <CustomSelect label="Contrário" value={currentProcess.opponent || formData.company_name || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, opponent: val})} options={opponentOptions.map(o => ({ label: o, value: o }))} onAction={() => setActiveManager('opponent')} actionLabel="Gerenciar Contrário" actionIcon={Settings} placeholder="Selecione ou adicione" />
                 {duplicateOpponentCases.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-[9px] text-blue-600 font-black uppercase mr-1">Similar:</span>
                        {duplicateOpponentCases.map(c => (<a key={c.contract_id} href={`/legal-control/contracts?id=${c.contracts?.id}`} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 hover:bg-blue-100 truncate max-w-[150px] shadow-sm">{c.contracts?.client_name}</a>))}
                    </div>
                )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5">
            <div className="md:col-span-12">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 block">Magistrado</label>
                <div className="flex gap-3">
                    <div className="w-40"><CustomSelect value={newMagistrateTitle} onChange={(val: string) => setNewMagistrateTitle(val)} options={magistrateTypes} /></div>
                    <div className="flex-1"><CustomSelect value={newMagistrateName} onChange={(val: string) => setNewMagistrateName(val)} options={magistrateOptions.map(m => ({ label: m, value: m }))} placeholder="Selecione magistrado" onAction={() => setActiveManager('magistrate')} actionLabel="Gerenciar Magistrados" actionIcon={Settings} /></div>
                    <button onClick={() => addMagistrate(newMagistrateName)} className="bg-blue-50 text-[#0a192f] border border-blue-100 hover:bg-blue-100 font-black px-4 rounded-lg transition-colors">+</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                    {currentProcess.magistrates?.map((m, idx) => (
                        <span key={idx} className="bg-gray-50 text-gray-700 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-2 border border-gray-100 shadow-sm"><Gavel size={11} className="text-amber-500" /><span className="uppercase text-gray-400">{m.title}:</span> {m.name}<button onClick={() => removeMagistrate(idx)} className="ml-1 text-red-400 hover:text-red-600 transition-colors"><X size={12} /></button></span>
                    ))}
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5">
            <div className="md:col-span-3"><CustomSelect label="Numeral" value={(currentProcess as any).numeral || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, numeral: val} as any)} options={numeralOptions} placeholder="Nº" /></div>
            <div className="md:col-span-5"><CustomSelect label="Vara" value={currentProcess.vara || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, vara: val})} options={varaSelectOptions} onAction={() => setActiveManager('vara')} actionLabel="Gerenciar Varas" actionIcon={Settings} placeholder="Selecione ou adicione" /></div>
            <div className="md:col-span-4"><CustomSelect label="Comarca" value={currentProcess.comarca || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, comarca: val})} options={comarcaSelectOptions} onAction={() => setActiveManager('comarca')} actionLabel="Gerenciar Comarcas" actionIcon={Settings} placeholder={currentProcess.uf ? "Selecione a Comarca" : "Selecione o Estado Primeiro"} disabled={!currentProcess.uf} /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5">
            <div className="md:col-span-3"><label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 block">Distribuição</label><input type="date" className="w-full border-b border-gray-300 focus:border-[#0a192f] outline-none py-2 text-sm font-bold bg-transparent text-gray-800" value={ensureDateValue(currentProcess.distribution_date)} onChange={(e) => setCurrentProcess({...currentProcess, distribution_date: e.target.value})} /></div>
            <div className="md:col-span-4"><CustomSelect label="Justiça" value={currentProcess.justice_type || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, justice_type: val})} options={justiceSelectOptions} onAction={() => setActiveManager('justice')} actionLabel="Gerenciar Justiças" actionIcon={Settings} /></div>
            <div className="md:col-span-5"><label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 block">Valor da Causa (R$)</label><input type="text" className="w-full border-b border-gray-300 focus:border-[#0a192f] outline-none py-2 text-sm font-bold text-gray-800" value={currentProcess.cause_value || ''} onChange={(e) => setCurrentProcess({...currentProcess, cause_value: maskMoney(e.target.value)})} /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
            <div><CustomSelect label="Classe" value={currentProcess.process_class || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, process_class: val})} options={classSelectOptions} onAction={() => setActiveManager('class')} actionLabel="Gerenciar Classes" actionIcon={Settings} placeholder="Selecione a Classe" /></div>
            <div>
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 block">Assunto</label>
                <div className="flex gap-3">
                    <div className="flex-1"><CustomSelect value={newSubject} onChange={(val: string) => setNewSubject(val)} options={subjectSelectOptions} placeholder="Selecione ou digite novo" onAction={() => setActiveManager('subject')} actionLabel="Gerenciar Assuntos" actionIcon={Settings} /></div>
                    <button onClick={addSubjectToProcess} className="bg-blue-50 text-[#0a192f] border border-blue-100 hover:bg-blue-100 font-black px-4 rounded-lg transition-colors">+</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                    {currentProcess.subject && currentProcess.subject.split(';').map(s => s.trim()).filter(s => s !== '').map((subj, idx) => (
                        <span key={idx} className="bg-gray-50 text-gray-700 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-2 border border-gray-100 shadow-sm">{subj}<button onClick={() => removeSubject(subj)} className="ml-1 text-red-400 hover:text-red-600 transition-colors"><X size={12} /></button></span>
                    ))}
                </div>
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t border-gray-50">
                <button onClick={handleProcessAction} className="bg-[#0a192f] text-white rounded-lg px-6 py-3 hover:bg-slate-800 transition-all flex items-center justify-center shadow-lg text-[11px] font-black uppercase tracking-widest w-full md:w-auto active:scale-95">
                    {editingProcessIndex !== null ? <><Check className="w-4 h-4 mr-2" /> Atualizar Processo</> : <><Plus className="w-4 h-4 mr-2" /> Adicionar Processo</>}
                </button>
          </div>
        </div>
      )}
    </div>
  );
}

function toTitleCase(str: string) {
    if (!str) return '';
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}