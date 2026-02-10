import React from 'react';
import { Settings, Check, Plus, Search, Loader2, Link as LinkIcon, AlertTriangle, Gavel, X } from 'lucide-react';
import { CustomSelect } from '../../ui/CustomSelect'; // Caminho corrigido
import { Contract, ContractProcess } from '../../../../types/controladoria';
import { maskMoney, maskCNPJ } from '../../utils/masks'; // Caminho corrigido

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
    <div className="space-y-6">
      {isSpecialCase ? (
        <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm animate-in fade-in duration-300">
            {otherProcessType === 'Processo Administrativo' ? (
                <div className="space-y-6 mb-6">
                    <div>
                        <label className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] flex justify-between mb-2 ml-1">Identificador Administrativo *</label>
                        <input type="text" className="w-full border-b border-gray-200 focus:border-[#0a192f] outline-none py-3 text-sm font-black text-[#0a192f] uppercase transition-all bg-transparent" placeholder="NÚMERO OU PROTOCOLO..." value={currentProcess.process_number || ''} onChange={(e) => setCurrentProcess({ ...currentProcess, process_number: e.target.value.toUpperCase() })} autoFocus />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] flex justify-between mb-2 ml-1">Assunto / Tese *</label>
                        <input type="text" className="w-full border-b border-gray-200 focus:border-[#0a192f] outline-none py-3 text-sm font-bold text-[#0a192f] transition-all bg-transparent" placeholder="DESCRIÇÃO DO OBJETO..." value={currentProcess.subject || ''} onChange={(e) => setCurrentProcess({ ...currentProcess, subject: e.target.value })} />
                    </div>
                </div>
            ) : (
                <div className="mb-6">
                    <label className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] flex justify-between mb-2 ml-1">Assunto ({otherProcessType}) *</label>
                    <input type="text" className="w-full border-b border-gray-200 focus:border-[#0a192f] outline-none py-3 text-sm font-black text-[#0a192f] transition-all bg-transparent" placeholder={`DESCREVA O ASSUNTO PARA ESTA DEMANDA...`} value={currentProcess.process_number || ''} onChange={(e) => setCurrentProcess({ ...currentProcess, process_number: e.target.value.toUpperCase() })} autoFocus />
                    <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest mt-3">Este campo substitui o número processual para fins de identificação interna.</p>
                </div>
            )}
            <div className="flex justify-end mt-6">
                <button onClick={handleProcessAction} className="bg-[#0a192f] text-white rounded-xl px-8 py-3 hover:bg-slate-800 transition-all flex items-center justify-center shadow-xl shadow-[#0a192f]/20 text-[10px] font-black uppercase tracking-widest w-full md:w-auto active:scale-95">
                    {editingProcessIndex !== null ? <><Check className="w-4 h-4 mr-2 text-amber-500" /> Atualizar Atividade</> : <><Plus className="w-4 h-4 mr-2 text-amber-500" /> Confirmar Atividade</>}
                </button>
            </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm animate-in fade-in duration-300">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 border-b border-gray-50 pb-4">Mapeamento de Processo Judicial</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6 items-end">
            <div className={isStandardCNJ ? "md:col-span-5" : "md:col-span-4"}>
                <label className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] flex justify-between mb-2 ml-1">
                    Número do Processo *
                    {currentProcess.process_number && isStandardCNJ && (<button onClick={handleOpenJusbrasil} className="text-[9px] text-blue-600 font-black hover:bg-blue-100 transition-all flex items-center bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100" title="Abrir no Jusbrasil"><LinkIcon className="w-3 h-3 mr-1.5" /> JUSBRASIL</button>)}
                </label>
                <div className="flex items-center gap-2">
                    <CustomSelect 
                        value={isStandardCNJ ? 'cnj' : 'other'}
                        onChange={(val: string) => {
                            setIsStandardCNJ(val === 'cnj');
                            setCurrentProcess({ ...currentProcess, process_number: '' });
                        }}
                        options={[{ label: 'CNJ', value: 'cnj' }, { label: 'OUTRO', value: 'other' }]}
                        className="w-28 h-[44px]"
                    />
                    <div className="flex-1 relative">
                          <input type="text" className={`w-full border-b py-3 text-sm font-mono tracking-widest uppercase outline-none transition-all bg-transparent ${duplicateProcessData ? 'border-amber-400 text-amber-700' : 'border-gray-200 text-[#0a192f] focus:border-[#0a192f]'}`} placeholder={isStandardCNJ ? "0000000-00..." : "Nº DO PROCESSO"} value={currentProcess.process_number || ''} onChange={(e) => setCurrentProcess({...currentProcess, process_number: isStandardCNJ ? localMaskCNJ(e.target.value) : e.target.value.toUpperCase()})} />
                          <button onClick={handleCNJSearch} disabled={!isStandardCNJ || searchingCNJ || !currentProcess.process_number} className="absolute right-0 top-1/2 -translate-y-1/2 text-[#0a192f] hover:text-amber-500 disabled:opacity-20 transition-all">
                              {searchingCNJ ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                          </button>
                    </div>
                </div>
                {duplicateProcessData && (
                  <div className="text-[9px] text-amber-700 mt-3 flex items-center font-black uppercase tracking-widest bg-amber-50 border border-amber-200 p-3 rounded-xl animate-in slide-in-from-top-2">
                      <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" /> 
                      <span>Registro Duplicado: <a href={`/controladoria/contracts?id=${duplicateProcessData.contract_id || duplicateProcessData.id}`} target="_blank" rel="noreferrer" className="ml-1 underline decoration-2 underline-offset-2 hover:text-amber-900">{duplicateProcessData.contracts?.client_name || duplicateProcessData.client_name}</a></span>
                  </div>
                )}
            </div>
            {!isStandardCNJ && (
                <div className="md:col-span-2">
                    <label className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2 ml-1">Tipo de Feito</label>
                    <input type="text" className="w-full border-b border-gray-200 focus:border-[#0a192f] outline-none py-3 text-[11px] font-black uppercase text-[#0a192f] transition-all bg-transparent" placeholder="EX: AGINT" value={otherProcessType} onChange={(e) => setOtherProcessType(e.target.value.toUpperCase())} />
                </div>
            )}
            <div className="md:col-span-2"><CustomSelect label="Tribunal *" value={currentProcess.court || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, court: val})} options={courtSelectOptions} onAction={() => setActiveManager('court')} actionLabel="Gerenciar" actionIcon={Settings} placeholder="SELECIONE" /></div>
            <div className="md:col-span-2"><CustomSelect label="Estado (UF) *" value={currentProcess.uf || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, uf: val})} options={ufOptions} placeholder="UF" /></div>
            <div className={isStandardCNJ ? "md:col-span-3" : "md:col-span-2"}><CustomSelect label="Posição Processual" value={currentProcess.position || formData.client_position || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, position: val})} options={positionOptions} onAction={() => setActiveManager('position')} actionLabel="Gerenciar" actionIcon={Settings} /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
            <div className="md:col-span-2">
                <label className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2 ml-1">CPF/CNPJ Autor</label>
                <div className="relative">
                    <input type="text" disabled={authorHasNoCnpj} className="w-full border-b border-gray-200 focus:border-[#0a192f] outline-none py-3 text-[11px] font-bold text-[#0a192f] disabled:opacity-40 bg-transparent transition-all" value={(currentProcess as any).author_cnpj || ''} onChange={(e) => setCurrentProcess({ ...currentProcess, author_cnpj: maskCNPJ(e.target.value) } as any)} placeholder={authorHasNoCnpj ? "N/A" : "DOCUMENTO"} />
                    <button onClick={() => handlePartyCNPJSearch('author')} disabled={authorHasNoCnpj} className="absolute right-0 top-1/2 -translate-y-1/2 text-[#0a192f] hover:text-amber-500 disabled:opacity-20"><Search className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center mt-3 ml-1"><input type="checkbox" id="no_cnpj_author" checked={authorHasNoCnpj} onChange={(e) => setAuthorHasNoCnpj(e.target.checked)} className="rounded text-[#0a192f] w-3.5 h-3.5 mr-2 focus:ring-[#0a192f]" /><label htmlFor="no_cnpj_author" className="text-[9px] font-black text-gray-400 uppercase tracking-widest cursor-pointer">Sem CNPJ</label></div>
            </div>
            <div className="md:col-span-4">
                <CustomSelect label="Parte Autora" value={(currentProcess as any).author || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, author: val} as any)} options={authorOptions.map(o => ({ label: o.toUpperCase(), value: o }))} onAction={() => setActiveManager('author')} actionLabel="Gerenciar" actionIcon={Settings} placeholder="SELECIONE OU ADICIONE" />
                {duplicateAuthorCases.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="text-[8px] text-blue-600 font-black uppercase tracking-widest">Coincidência:</span>
                        {duplicateAuthorCases.map(c => (<a key={c.contract_id} href={`/controladoria/contracts?id=${c.contracts?.id}`} target="_blank" rel="noopener noreferrer" className="text-[8px] font-black uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-all truncate max-w-[150px] shadow-sm">{c.contracts?.client_name}</a>))}
                    </div>
                )}
            </div>
            <div className="md:col-span-2">
                <label className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-2 ml-1">CPF/CNPJ Réu</label>
                <div className="relative">
                    <input type="text" disabled={opponentHasNoCnpj} className="w-full border-b border-gray-200 focus:border-[#0a192f] outline-none py-3 text-[11px] font-bold text-[#0a192f] disabled:opacity-40 bg-transparent transition-all" value={(currentProcess as any).opponent_cnpj || ''} onChange={(e) => setCurrentProcess({ ...currentProcess, opponent_cnpj: maskCNPJ(e.target.value) } as any)} placeholder={opponentHasNoCnpj ? "N/A" : "DOCUMENTO"} />
                    <button onClick={() => handlePartyCNPJSearch('opponent')} disabled={opponentHasNoCnpj} className="absolute right-0 top-1/2 -translate-y-1/2 text-[#0a192f] hover:text-amber-500 disabled:opacity-20"><Search className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center mt-3 ml-1"><input type="checkbox" id="no_cnpj_opponent" checked={opponentHasNoCnpj} onChange={(e) => setOpponentHasNoCnpj(e.target.checked)} className="rounded text-[#0a192f] w-3.5 h-3.5 mr-2 focus:ring-[#0a192f]" /><label htmlFor="no_cnpj_opponent" className="text-[9px] font-black text-gray-400 uppercase tracking-widest cursor-pointer">Sem CNPJ</label></div>
            </div>
            <div className="md:col-span-4">
                <CustomSelect label="Parte Contraria (Réu)" value={currentProcess.opponent || formData.company_name || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, opponent: val})} options={opponentOptions.map(o => ({ label: o.toUpperCase(), value: o }))} onAction={() => setActiveManager('opponent')} actionLabel="Gerenciar" actionIcon={Settings} placeholder="SELECIONE OU ADICIONE" />
                 {duplicateOpponentCases.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="text-[8px] text-blue-600 font-black uppercase tracking-widest">Coincidência:</span>
                        {duplicateOpponentCases.map(c => (<a key={c.contract_id} href={`/controladoria/contracts?id=${c.contracts?.id}`} target="_blank" rel="noopener noreferrer" className="text-[8px] font-black uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-all truncate max-w-[150px] shadow-sm">{c.contracts?.client_name}</a>))}
                    </div>
                )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
            <div className="md:col-span-12">
                <label className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-2 block ml-1">Composição do Juízo / Magistrado</label>
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="w-full md:w-48"><CustomSelect value={newMagistrateTitle} onChange={(val: string) => setNewMagistrateTitle(val)} options={magistrateTypes} /></div>
                    <div className="flex-1"><CustomSelect value={newMagistrateName} onChange={(val: string) => setNewMagistrateName(val)} options={magistrateOptions.map(m => ({ label: m.toUpperCase(), value: m }))} placeholder="SELECIONE MAGISTRADO" onAction={() => setActiveManager('magistrate')} actionLabel="Gerenciar" actionIcon={Settings} /></div>
                    <button onClick={() => addMagistrate(newMagistrateName)} className="bg-amber-500 text-[#0a192f] hover:bg-amber-600 font-black px-6 rounded-xl transition-all shadow-lg active:scale-95 h-[44px]">+</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                    {currentProcess.magistrates?.map((m, idx) => (
                        <span key={idx} className="bg-white text-[#0a192f] px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center gap-3 border border-gray-100 shadow-sm transition-all hover:border-amber-200">
                          <Gavel size={12} className="text-amber-500" />
                          <span>{m.title}: {m.name}</span>
                          <button onClick={() => removeMagistrate(idx)} className="ml-1 text-red-400 hover:text-red-600 transition-colors">
                            <X size={14} />
                          </button>
                        </span>
                    ))}
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
            <div className="md:col-span-3"><CustomSelect label="Numeral" value={(currentProcess as any).numeral || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, numeral: val} as any)} options={numeralOptions} placeholder="Nº" /></div>
            <div className="md:col-span-5"><CustomSelect label="Vara / Unidade Judiciária" value={currentProcess.vara || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, vara: val})} options={varaSelectOptions} onAction={() => setActiveManager('vara')} actionLabel="Gerenciar" actionIcon={Settings} placeholder="SELECIONE" /></div>
            <div className="md:col-span-4"><CustomSelect label="Comarca / Foro" value={currentProcess.comarca || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, comarca: val})} options={comarcaSelectOptions} onAction={() => setActiveManager('comarca')} actionLabel="Gerenciar" actionIcon={Settings} placeholder={currentProcess.uf ? "SELECIONE" : "ESCOLHA A UF PRIMEIRO"} disabled={!currentProcess.uf} /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
            <div className="md:col-span-3">
              <label className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-2 block ml-1">Data de Distribuição</label>
              <input type="date" className="w-full border-b border-gray-200 focus:border-[#0a192f] outline-none py-3 text-sm font-black text-[#0a192f] bg-transparent transition-all" value={ensureDateValue(currentProcess.distribution_date)} onChange={(e) => setCurrentProcess({...currentProcess, distribution_date: e.target.value})} />
            </div>
            <div className="md:col-span-4"><CustomSelect label="Competência / Justiça" value={currentProcess.justice_type || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, justice_type: val})} options={justiceSelectOptions} onAction={() => setActiveManager('justice')} actionLabel="Gerenciar" actionIcon={Settings} /></div>
            <div className="md:col-span-5">
              <label className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-2 block ml-1">Valor da Causa (R$)</label>
              <input type="text" className="w-full border-b border-gray-200 focus:border-[#0a192f] outline-none py-3 text-sm font-black text-emerald-600 transition-all bg-transparent" value={currentProcess.cause_value || ''} onChange={(e) => setCurrentProcess({...currentProcess, cause_value: maskMoney(e.target.value)})} placeholder="R$ 0,00" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <div><CustomSelect label="Classe Processual" value={currentProcess.process_class || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, process_class: val})} options={classSelectOptions} onAction={() => setActiveManager('class')} actionLabel="Gerenciar" actionIcon={Settings} placeholder="SELECIONE A CLASSE" /></div>
            <div>
                <label className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-2 block ml-1">Assuntos Relacionados</label>
                <div className="flex gap-3">
                    <div className="flex-1"><CustomSelect value={newSubject} onChange={(val: string) => setNewSubject(val)} options={subjectSelectOptions} placeholder="SELECIONE OU DIGITE" onAction={() => setActiveManager('subject')} actionLabel="Gerenciar" actionIcon={Settings} /></div>
                    <button onClick={addSubjectToProcess} className="bg-amber-500 text-[#0a192f] hover:bg-amber-600 font-black px-6 rounded-xl transition-all shadow-lg active:scale-95 h-[44px]">+</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                    {currentProcess.subject && currentProcess.subject.split(';').map(s => s.trim()).filter(s => s !== '').map((subj, idx) => (
                        <span key={idx} className="bg-white text-[#0a192f] px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center gap-3 border border-gray-100 shadow-sm transition-all hover:border-amber-200">
                          {subj}
                          <button onClick={() => removeSubject(subj)} className="ml-1 text-red-400 hover:text-red-600 transition-colors">
                            <X size={14} />
                          </button>
                        </span>
                    ))}
                </div>
            </div>
          </div>

          <div className="flex justify-end mt-10 pt-6 border-t border-gray-100">
                <button onClick={handleProcessAction} className="bg-[#0a192f] text-white rounded-xl px-10 py-4 hover:bg-slate-800 transition-all flex items-center justify-center shadow-2xl shadow-[#0a192f]/30 text-[10px] font-black uppercase tracking-[0.2em] w-full md:w-auto active:scale-95">
                    {editingProcessIndex !== null ? <><Check className="w-5 h-5 mr-3 text-amber-500" /> Atualizar Processo</> : <><Plus className="w-5 h-5 mr-3 text-amber-500" /> Vincular Processo ao Caso</>}
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