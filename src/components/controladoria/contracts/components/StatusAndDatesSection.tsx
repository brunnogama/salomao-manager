import React, { useEffect } from 'react';
import { Plus, X, Settings, AlertTriangle, AlertCircle } from 'lucide-react';
import { Contract } from '../../../../types/controladoria';
import { CustomSelect } from '../../ui/CustomSelect'; // Caminho corrigido
import { FinancialInputWithInstallments } from './FinancialInputWithInstallments';
import { maskMoney, parseCurrency } from '../../utils/masks'; // Caminho corrigido
import { addMonths } from 'date-fns';

interface StatusAndDatesSectionProps {
  formData: Contract;
  setFormData: React.Dispatch<React.SetStateAction<Contract>>;
  statusOptions: { label: string; value: string }[];
  handleCreateStatus: () => void;
  ensureDateValue: (dateStr?: string | null) => string;
  analystSelectOptions: { label: string; value: string }[];
  onOpenAnalystManager: () => void;
  rejectionByOptions: { label: string; value: string }[];
  rejectionReasonOptions: { label: string; value: string }[];
  partnerSelectOptions: { label: string; value: string }[];
  billingOptions: { label: string; value: string }[];
  maskHon: (value: string) => string;
  setActiveManager: (manager: string) => void;
  signatureOptions: { label: string; value: string }[];
  formatForInput: (val: string | number | undefined) => string | number;
  handleAddToList: (listField: string, valueField: any, installmentsListField?: string, installmentsSourceField?: any) => void;
  removeExtra: (field: string, index: number, installmentsListField?: string) => void;
  newIntermediateFee: string;
  setNewIntermediateFee: (v: string) => void;
  interimInstallments: string;
  setInterimInstallments: (v: string) => void;
  handleAddIntermediateFee: () => void;
  interimClause: string;
  setInterimClause: (v: string) => void;
  handleRemoveIntermediateFee: (idx: number) => void;
  ensureArray: (val: any) => string[];
  dateWarningMessage?: string | null;
  duplicateHonCase?: any | null; 
}

export function StatusAndDatesSection(props: StatusAndDatesSectionProps) {
  const {
    formData, setFormData, statusOptions, handleCreateStatus, ensureDateValue,
    analystSelectOptions, onOpenAnalystManager, rejectionByOptions, rejectionReasonOptions,
    partnerSelectOptions, billingOptions, maskHon, setActiveManager, signatureOptions,
    formatForInput, handleAddToList, removeExtra,
    newIntermediateFee, setNewIntermediateFee, interimInstallments, setInterimInstallments,
    handleAddIntermediateFee, interimClause, setInterimClause, handleRemoveIntermediateFee, ensureArray,
    dateWarningMessage, duplicateHonCase
  } = props;

  const isTimesheet = (formData as any).timesheet === true;

  const safeString = (val: string | number | undefined) => {
      if (val === undefined || val === null) return '';
      return String(val);
  };

  const handleEditExtra = (
    listField: string,
    valueField: keyof Contract,
    installmentsListField: string,
    installmentsSourceField: keyof Contract,
    clauseListField: string,
    clauseSourceField: keyof Contract,
    index: number
  ) => {
    setFormData((prev: any) => {
        const valueToEdit = prev[listField][index];
        const installmentToEdit = prev[installmentsListField]?.[index] || '1x';
        const clauseToEdit = prev[clauseListField]?.[index] || '';

        const newList = [...(prev[listField] || [])];
        const newClausesList = [...ensureArray(prev[clauseListField])];
        const newInstList = [...ensureArray(prev[installmentsListField])];

        newList.splice(index, 1);
        newClausesList.splice(index, 1);
        newInstList.splice(index, 1);

        return {
            ...prev,
            [valueField]: valueToEdit,
            [installmentsSourceField]: installmentToEdit,
            [clauseSourceField]: clauseToEdit,
            [listField]: newList,
            [clauseListField]: newClausesList,
            [installmentsListField]: newInstList
        };
    });
  };

  useEffect(() => {
    const rawVal = newIntermediateFee;
    const countStr = interimInstallments;
    
    if (!rawVal || !countStr || countStr === '1x') {
        if ((formData as any).interim_breakdown) {
             setFormData(prev => {
                const newData = { ...prev };
                delete (newData as any).interim_breakdown;
                return newData;
             });
        }
        return;
    }

    const totalOriginal = parseCurrency(rawVal);
    if (totalOriginal <= 0) return;

    const count = parseInt(countStr.replace(/\D/g, '')) || 1;
    const currentBreakdown = (formData as any).interim_breakdown || [];

    if (currentBreakdown.length !== count) {
        const partValue = totalOriginal / count;
        const newBreakdown = Array.from({ length: count }, (_, i) => ({
            date: addMonths(new Date(), i).toISOString().split('T')[0], 
            value: maskMoney(partValue.toFixed(2))
        }));
        
        setFormData(prev => ({ ...prev, interim_breakdown: newBreakdown } as any));
    }
  }, [newIntermediateFee, interimInstallments]);

  const renderInstallmentBreakdown = (
      label: string, 
      valueField: keyof Contract, 
      breakdownField: string, 
      installmentField: keyof Contract
  ) => {
    const breakdown = (formData as any)[breakdownField] as { date: string, value: string }[] | undefined;
    const rawVal = formData[valueField];
    let totalOriginal = 0;
    if (typeof rawVal === 'number') totalOriginal = rawVal;
    else if (typeof rawVal === 'string') totalOriginal = rawVal ? parseCurrency(rawVal) : 0;

    const installmentsStr = formData[installmentField] as string;
    
    if (!totalOriginal || isNaN(totalOriginal) || totalOriginal <= 0 || !installmentsStr || installmentsStr === '1x') {
        return null;
    }
    
    const totalValueStr = totalOriginal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (!breakdown || breakdown.length <= 1) return null;

    const totalCalculated = breakdown.reduce((acc, curr) => acc + parseCurrency(curr.value), 0);
    const diff = Math.abs(totalOriginal - totalCalculated);
    const hasError = diff > 0.1;

    return (
        <div className="mt-3 bg-gray-50/80 border border-gray-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                <h4 className="text-[10px] font-black text-[#0a192f] uppercase tracking-widest">Parcelamento - {label}</h4>
                <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200 uppercase tracking-tighter">Total: {totalValueStr}</span>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {breakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 mb-1">
                        <span className="w-6 font-black text-gray-400 text-[10px] text-right">{idx + 1}x</span>
                        <div className="flex-1">
                            <input 
                                type="date" 
                                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 focus:border-[#0a192f] outline-none text-xs font-medium text-gray-600 bg-white"
                                value={item.date}
                                onChange={(e) => {
                                    const newBreakdown = [...breakdown];
                                    newBreakdown[idx].date = e.target.value;
                                    setFormData(prev => ({...prev, [breakdownField]: newBreakdown} as any));
                                }}
                            />
                        </div>
                        <div className="flex-1">
                            <input 
                                type="text" 
                                className={`w-full border rounded-lg px-2 py-1.5 outline-none text-xs font-bold text-right ${hasError ? 'border-red-300 text-red-600 bg-red-50' : 'border-gray-200 text-[#0a192f] bg-white focus:border-[#0a192f]'}`}
                                value={item.value}
                                onChange={(e) => {
                                    const newBreakdown = [...breakdown];
                                    const rawValue = e.target.value.replace(/\D/g, ''); 
                                    newBreakdown[idx].value = maskMoney(rawValue);
                                    setFormData(prev => ({...prev, [breakdownField]: newBreakdown} as any));
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {hasError && (
                <div className="mt-3 flex items-start gap-2 text-[10px] font-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 uppercase tracking-tight">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Soma das parcelas difere do total. Diferença: R$ {diff.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
            )}
        </div>
    );
  };

  const renderInterimBreakdownEditable = () => {
    const breakdown = (formData as any).interim_breakdown as { date: string, value: string }[] | undefined;
    const rawVal = newIntermediateFee;
    let totalOriginal = 0;
    if (typeof rawVal === 'string') totalOriginal = rawVal ? parseCurrency(rawVal) : 0;
    const countStr = interimInstallments;
    
    if (!totalOriginal || totalOriginal <= 0 || !countStr || countStr === '1x' || !breakdown || breakdown.length === 0) return null;

    const totalValueStr = totalOriginal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const totalCalculated = breakdown.reduce((acc, curr) => acc + parseCurrency(curr.value), 0);
    const diff = Math.abs(totalOriginal - totalCalculated);
    const hasError = diff > 0.1;

    return (
        <div className="mt-3 bg-amber-50/30 border border-amber-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 shadow-sm">
             <div className="flex items-center justify-between mb-3 border-b border-amber-100 pb-2">
                <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Parcelamento (Novo)</h4>
                <span className="text-[10px] font-bold text-amber-600 bg-white px-2 py-0.5 rounded border border-amber-200 uppercase tracking-tighter">Total: {totalValueStr}</span>
            </div>
             
             <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {breakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 mb-1">
                        <span className="w-6 font-black text-amber-400 text-[10px] text-right">{idx + 1}x</span>
                        <div className="flex-1">
                             <input 
                                type="date" 
                                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 focus:border-amber-500 outline-none text-xs font-medium text-gray-600 bg-white" 
                                value={item.date} 
                                onChange={(e) => {
                                    const newBreakdown = [...breakdown];
                                    newBreakdown[idx].date = e.target.value;
                                    setFormData(prev => ({...prev, interim_breakdown: newBreakdown} as any));
                                }}
                             />
                        </div>
                        <div className="flex-1">
                             <input 
                                type="text" 
                                className={`w-full border rounded-lg px-2 py-1.5 outline-none text-xs font-bold text-right ${hasError ? 'border-red-300 text-red-600 bg-red-50' : 'border-gray-200 text-amber-900 bg-white focus:border-amber-500'}`}
                                value={item.value} 
                                onChange={(e) => {
                                    const newBreakdown = [...breakdown];
                                    const rawValue = e.target.value.replace(/\D/g, ''); 
                                    newBreakdown[idx].value = maskMoney(rawValue);
                                    setFormData(prev => ({...prev, interim_breakdown: newBreakdown} as any));
                                }}
                             />
                        </div>
                    </div>
                ))}
             </div>
             {hasError && (
                <div className="mt-3 flex items-start gap-2 text-[10px] font-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 uppercase tracking-tight">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Soma difere do total. Diferença: R$ {diff.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative z-40 mb-8">
      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-4 mb-6">Ciclo de Vida & Parâmetros Financeiros</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <CustomSelect label="Estado Atual do Caso" value={formData.status} onChange={(val: any) => setFormData({...formData, status: val})} options={statusOptions} onAction={handleCreateStatus} actionIcon={Plus} actionLabel="Novo Status" />
          {formData.status && (
            <div className="animate-in fade-in slide-in-from-left-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 ml-1">
                      {formData.status === 'analysis' ? 'Data do Prospect' :
                      formData.status === 'proposal' ? 'Data da Proposta' :
                      formData.status === 'active' ? 'Data da Assinatura' :
                      formData.status === 'rejected' ? 'Data da Rejeição' :
                      formData.status === 'probono' ? 'Data Probono' : 'Data do Evento'}
                </label>
                <input 
                    type="date" 
                    className={`w-full border p-3 rounded-xl text-sm bg-white outline-none transition-all font-bold ${dateWarningMessage ? 'border-red-300 bg-red-50/50 text-red-900' : 'border-gray-200 text-[#0a192f] focus:border-[#0a192f]'}`}
                    value={ensureDateValue(
                        formData.status === 'analysis' ? formData.prospect_date :
                        formData.status === 'proposal' ? formData.proposal_date :
                        formData.status === 'active' ? formData.contract_date :
                        formData.status === 'rejected' ? formData.rejection_date :
                        formData.status === 'probono' ? formData.probono_date : ''
                    )} 
                    onChange={e => {
                        const val = e.target.value;
                        if(formData.status === 'analysis') setFormData({...formData, prospect_date: val});
                        else if(formData.status === 'proposal') setFormData({...formData, proposal_date: val});
                        else if(formData.status === 'active') setFormData({...formData, contract_date: val});
                        else if(formData.status === 'rejected') setFormData({...formData, rejection_date: val});
                        else if(formData.status === 'probono') setFormData({...formData, probono_date: val});
                    }} 
                />
                {dateWarningMessage && (
                    <div className="flex items-center gap-2 mt-2 text-[9px] text-red-600 animate-in slide-in-from-top-1 font-black uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{dateWarningMessage}</span>
                    </div>
                )}
            </div>
          )}
      </div>

      {formData.status === 'analysis' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 mb-8">
            <div><CustomSelect label="Consultor / Analista" value={formData.analyst_id || ''} onChange={(val: string) => setFormData({...formData, analyst_id: val})} options={analystSelectOptions} onOpenManager={onOpenAnalystManager} actionIcon={Settings} actionLabel="Gerenciar" /></div>
        </div>
      )}

      {formData.status === 'rejected' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 mb-8">
            <div><CustomSelect label="Responsável Análise" value={formData.analyst_id || ''} onChange={(val: string) => setFormData({...formData, analyst_id: val})} options={analystSelectOptions} onOpenManager={onOpenAnalystManager} actionIcon={Settings} actionLabel="Gerenciar" /></div>
            <div><CustomSelect label="Instância de Rejeição" value={formData.rejection_by || ''} onChange={(val: string) => setFormData({...formData, rejection_by: val})} options={rejectionByOptions} /></div>
            <div><CustomSelect label="Motivação" value={formData.rejection_reason || ''} onChange={(val: string) => setFormData({...formData, rejection_reason: val})} options={rejectionReasonOptions} /></div>
        </div>
      )}

      {formData.status === 'probono' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 mb-8">
            <div><CustomSelect label="Sócio Proponente" value={formData.partner_id || ''} onChange={(val: string) => setFormData({...formData, partner_id: val})} options={partnerSelectOptions} /></div>
        </div>
      )}

      {(formData.status === 'proposal' || formData.status === 'active') && (
      <div className="space-y-8 animate-in slide-in-from-top-2 pt-8 border-t border-gray-100">
        {formData.status === 'active' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end mb-6 animate-in fade-in">
                <div className="md:col-span-4">
                    <label className="text-[10px] font-black text-[#0a192f] uppercase tracking-[0.2em] block mb-2 ml-1">Identificador HON <span className="text-red-500">*</span></label>
                    <input type="text" className={`w-full border-2 p-3 rounded-xl text-sm font-mono font-black bg-white outline-none transition-all ${duplicateHonCase ? 'border-amber-400 text-amber-800 bg-amber-50' : 'border-gray-100 text-[#0a192f] focus:border-[#0a192f]'}`} placeholder="00.000.000/000" value={formData.hon_number} onChange={e => setFormData({...formData, hon_number: maskHon(e.target.value)})} />
                    {duplicateHonCase && (
                        <div className="flex items-center gap-2 mt-2 text-[9px] text-amber-700 font-black uppercase tracking-widest bg-amber-100/50 p-2 rounded-lg border border-amber-200"><AlertTriangle className="w-3.5 h-3.5" /><span>CONFLITO COM: {duplicateHonCase.display_id}</span></div>
                    )}
                </div>
                <div className="md:col-span-4"><CustomSelect label="Domicílio Fiscal *" value={formData.billing_location || ''} onChange={(val: string) => setFormData({...formData, billing_location: val})} options={billingOptions} onAction={() => setActiveManager('location')} actionLabel="Configurar" actionIcon={Settings} /></div>
                <div className="md:col-span-4"><CustomSelect label="Validação de Assinatura *" value={formData.physical_signature === true ? 'true' : formData.physical_signature === false ? 'false' : ''} onChange={(val: string) => { setFormData({...formData, physical_signature: val === 'true' ? true : val === 'false' ? false : undefined}); }} options={signatureOptions} /></div>
            </div>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 items-start ${isTimesheet ? 'opacity-30 pointer-events-none filter grayscale' : ''}`}>
            <div className="space-y-4">
              <FinancialInputWithInstallments label="Pró-Labore (R$)" value={safeString(formatForInput(formData.pro_labore))} onChangeValue={(v: any) => setFormData({...formData, pro_labore: v})} installments={formData.pro_labore_installments} onChangeInstallments={(v: any) => setFormData({...formData, pro_labore_installments: v})} onAdd={() => handleAddToList('pro_labore_extras', 'pro_labore', 'pro_labore_extras_installments', 'pro_labore_installments')} clause={(formData as any).pro_labore_clause} onChangeClause={(v: any) => setFormData({...formData, pro_labore_clause: v} as any)} />
              <div className="flex flex-col gap-2.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                {(formData as any).pro_labore_extras?.map((val: string, idx: number) => {
                   const clauses = ensureArray((formData as any).pro_labore_extras_clauses);
                   const installments = ensureArray((formData as any).pro_labore_extras_installments);
                   return (
                      <div key={idx} onClick={() => handleEditExtra('pro_labore_extras', 'pro_labore', 'pro_labore_extras_installments', 'pro_labore_installments', 'pro_labore_extras_clauses', 'pro_labore_clause', idx)} className="bg-white border border-gray-100 px-4 py-3 rounded-2xl text-[10px] text-[#0a192f] flex items-center justify-between shadow-sm cursor-pointer hover:border-amber-200 hover:bg-amber-50 transition-all group" title="Clique para editar">
                          <div className="flex items-center gap-3">{clauses[idx] && <span className="text-[#0a192f] font-black text-[8px] bg-white px-2 py-0.5 rounded-lg border border-gray-200 uppercase tracking-tighter">CL. {clauses[idx]}</span>}<span className="font-black">{val}</span>{installments[idx] && <span className="text-gray-400 font-bold uppercase tracking-tighter">({installments[idx]})</span>}</div>
                          <div className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-50 rounded-lg"><X className="w-3.5 h-3.5" /></div>
                      </div>
                   );
                })}
              </div>
              {renderInstallmentBreakdown('Pró-Labore', 'pro_labore', 'pro_labore_breakdown', 'pro_labore_installments')}
            </div>

            <div className="space-y-4">
                <FinancialInputWithInstallments label="Verbas Assessórias (R$)" value={safeString(formatForInput(formData.other_fees))} onChangeValue={(v: any) => setFormData({...formData, other_fees: v})} installments={formData.other_fees_installments} onChangeInstallments={(v: any) => setFormData({...formData, other_fees_installments: v})} onAdd={() => handleAddToList('other_fees_extras', 'other_fees', 'other_fees_extras_installments', 'other_fees_installments')} clause={(formData as any).other_fees_clause} onChangeClause={(v: any) => setFormData({...formData, other_fees_clause: v} as any)} />
                <div className="flex flex-col gap-2.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                    {(formData as any).other_fees_extras?.map((val: string, idx: number) => {
                       const clauses = ensureArray((formData as any).other_fees_extras_clauses);
                       const installments = ensureArray((formData as any).other_fees_extras_installments);
                       return (
                          <div key={idx} onClick={() => handleEditExtra('other_fees_extras', 'other_fees', 'other_fees_extras_installments', 'other_fees_installments', 'other_fees_extras_clauses', 'other_fees_clause', idx)} className="bg-white border border-gray-100 px-4 py-3 rounded-2xl text-[10px] text-[#0a192f] flex items-center justify-between shadow-sm cursor-pointer hover:border-amber-200 hover:bg-amber-50 transition-all group" title="Clique para editar">
                              <div className="flex items-center gap-3">{clauses[idx] && <span className="text-[#0a192f] font-black text-[8px] bg-white px-2 py-0.5 rounded-lg border border-gray-200 uppercase tracking-tighter">CL. {clauses[idx]}</span>}<span className="font-black">{val}</span>{installments[idx] && <span className="text-gray-400 font-bold uppercase tracking-tighter">({installments[idx]})</span>}</div>
                              <div className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-50 rounded-lg"><X className="w-3.5 h-3.5" /></div>
                          </div>
                       );
                    })}
                  </div>
                  {renderInstallmentBreakdown('Outros', 'other_fees', 'other_fees_breakdown', 'other_fees_installments')}
            </div>

            <div className="space-y-4">
                <FinancialInputWithInstallments label="Mensalidade Fixa (R$)" value={safeString(formatForInput(formData.fixed_monthly_fee))} onChangeValue={(v: any) => setFormData({...formData, fixed_monthly_fee: v})} installments={formData.fixed_monthly_fee_installments} onChangeInstallments={(v: any) => setFormData({...formData, fixed_monthly_fee_installments: v})} onAdd={() => handleAddToList('fixed_monthly_extras', 'fixed_monthly_fee', 'fixed_monthly_extras_installments', 'fixed_monthly_fee_installments')} clause={(formData as any).fixed_monthly_fee_clause} onChangeClause={(v: any) => setFormData({...formData, fixed_monthly_fee_clause: v} as any)} />
                <div className="flex flex-col gap-2.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                    {(formData as any).fixed_monthly_extras?.map((val: string, idx: number) => {
                       const clauses = ensureArray((formData as any).fixed_monthly_extras_clauses);
                       const installments = ensureArray((formData as any).fixed_monthly_extras_installments);
                       return (
                          <div key={idx} onClick={() => handleEditExtra('fixed_monthly_extras', 'fixed_monthly_fee', 'fixed_monthly_extras_installments', 'fixed_monthly_fee_installments', 'fixed_monthly_extras_clauses', 'fixed_monthly_fee_clause', idx)} className="bg-white border border-gray-100 px-4 py-3 rounded-2xl text-[10px] text-[#0a192f] flex items-center justify-between shadow-sm cursor-pointer hover:border-amber-200 hover:bg-amber-50 transition-all group" title="Clique para editar">
                              <div className="flex items-center gap-3">{clauses[idx] && <span className="text-[#0a192f] font-black text-[8px] bg-white px-2 py-0.5 rounded-lg border border-gray-200 uppercase tracking-tighter">CL. {clauses[idx]}</span>}<span className="font-black">{val}</span>{installments[idx] && <span className="text-gray-400 font-bold uppercase tracking-tighter">({installments[idx]})</span>}</div>
                              <div className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-50 rounded-lg"><X className="w-3.5 h-3.5" /></div>
                          </div>
                       );
                    })}
                  </div>
                  {renderInstallmentBreakdown('Mensalidade', 'fixed_monthly_fee', 'fixed_monthly_fee_breakdown', 'fixed_monthly_fee_installments')}
            </div>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 items-start ${isTimesheet ? 'opacity-30 pointer-events-none filter grayscale' : ''}`}>
            <div className="space-y-4">
              <FinancialInputWithInstallments label="Êxito Intermediário (R$)" value={newIntermediateFee} onChangeValue={setNewIntermediateFee} installments={interimInstallments} onChangeInstallments={setInterimInstallments} onAdd={handleAddIntermediateFee} clause={interimClause} onChangeClause={setInterimClause} />
              <div className="flex flex-col gap-2.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                {formData.intermediate_fees?.map((fee: string, idx: number) => {
                  const clauses = ensureArray((formData as any).intermediate_fees_clauses);
                  const installments = ensureArray((formData as any).intermediate_fees_installments);
                  return (
                      <div key={idx} onClick={() => { setNewIntermediateFee(fee); setInterimInstallments(installments[idx] || '1x'); setInterimClause(clauses[idx] || ''); handleRemoveIntermediateFee(idx); }} className="bg-white border border-amber-100 px-4 py-3 rounded-2xl text-[10px] text-amber-900 flex items-center justify-between shadow-sm cursor-pointer hover:bg-amber-50 hover:border-amber-400 transition-all group" title="Clique para editar">
                          <div className="flex items-center gap-3">{clauses[idx] && <span className="text-amber-800 font-black text-[8px] bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200 uppercase tracking-tighter">CL. {clauses[idx]}</span>}<span className="font-black">{fee}</span>{installments[idx] && <span className="text-amber-500 font-bold uppercase tracking-tighter">({installments[idx]})</span>}</div>
                          <div className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-50 rounded-lg"><X className="w-3.5 h-3.5" /></div>
                      </div>
                  );
                })}
              </div>
              {renderInterimBreakdownEditable()}
            </div>

            <div className="space-y-4">
              <FinancialInputWithInstallments label="Êxito de Encerramento (R$)" value={safeString(formatForInput(formData.final_success_fee))} onChangeValue={(v: any) => setFormData({...formData, final_success_fee: v})} installments={formData.final_success_fee_installments} onChangeInstallments={(v: any) => setFormData({...formData, final_success_fee_installments: v})} onAdd={() => handleAddToList('final_success_extras', 'final_success_fee', 'final_success_extras_installments', 'final_success_fee_installments')} clause={(formData as any).final_success_fee_clause} onChangeClause={(v: any) => setFormData({...formData, final_success_fee_clause: v} as any)} />
              <div className="flex flex-col gap-2.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                {(formData as any).final_success_extras?.map((val: string, idx: number) => {
                   const clauses = ensureArray((formData as any).final_success_extras_clauses);
                   const installments = ensureArray((formData as any).final_success_extras_installments);
                   return (
                      <div key={idx} onClick={() => handleEditExtra('final_success_extras', 'final_success_fee', 'final_success_extras_installments', 'final_success_fee_installments', 'final_success_extras_clauses', 'final_success_fee_clause', idx)} className="bg-white border border-gray-100 px-4 py-3 rounded-2xl text-[10px] text-[#0a192f] flex items-center justify-between shadow-sm cursor-pointer hover:border-amber-200 hover:bg-amber-50 transition-all group" title="Clique para editar">
                          <div className="flex items-center gap-3">{clauses[idx] && <span className="text-[#0a192f] font-black text-[8px] bg-white px-2 py-0.5 rounded-lg border border-gray-200 uppercase tracking-tighter">CL. {clauses[idx]}</span>}<span className="font-black">{val}</span>{installments[idx] && <span className="text-gray-400 font-bold uppercase tracking-tighter">({installments[idx]})</span>}</div>
                          <div className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-50 rounded-lg"><X className="w-3.5 h-3.5" /></div>
                      </div>
                   );
                })}
              </div>
              {renderInstallmentBreakdown('Êxito Final', 'final_success_fee', 'final_success_fee_breakdown', 'final_success_fee_installments')}
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Percentual de Êxito (%)</label>
                <div className="flex rounded-xl shadow-sm h-[44px] border border-gray-200 focus-within:border-[#0a192f] overflow-hidden transition-all bg-white">
                  <input type="text" className="w-16 border-r border-gray-100 p-2.5 text-[10px] font-black text-[#0a192f] bg-gray-50/50 outline-none text-center uppercase placeholder:text-gray-300" value={(formData as any).final_success_percent_clause || ''} onChange={(e) => setFormData({...formData, final_success_percent_clause: e.target.value} as any)} placeholder="CL." />
                  <input type="text" className="flex-1 px-4 text-sm font-black text-amber-600 outline-none bg-transparent placeholder:text-gray-300" placeholder="EX: 20%" value={formData.final_success_percent} onChange={e => setFormData({...formData, final_success_percent: e.target.value})} />
                  <button className="bg-[#0a192f] text-white px-5 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center border-l border-white/10" type="button" onClick={() => handleAddToList('percent_extras', 'final_success_percent')}><Plus className="w-4 h-4 text-amber-500" /></button>
                </div>
                <div className="flex flex-col gap-2.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                    {(formData as any).percent_extras?.map((val: string, idx: number) => {
                       const clauses = ensureArray((formData as any).percent_extras_clauses);
                       return (
                          <div key={idx} onClick={() => { const newList = [...(formData as any).percent_extras]; const newClausesList = [...ensureArray((formData as any).percent_extras_clauses)]; const valToEdit = newList[idx]; const clauseToEdit = newClausesList[idx]; newList.splice(idx, 1); newClausesList.splice(idx, 1); setFormData({...formData, final_success_percent: valToEdit, final_success_percent_clause: clauseToEdit, percent_extras: newList, percent_extras_clauses: newClausesList} as any); }} className="bg-white border border-gray-100 px-4 py-3 rounded-2xl text-[10px] text-[#0a192f] flex items-center justify-between shadow-sm cursor-pointer hover:border-amber-200 hover:bg-amber-50 transition-all group" title="Clique para editar">
                              <div className="flex items-center gap-3">{clauses[idx] && <span className="text-[#0a192f] font-black text-[8px] bg-white px-2 py-0.5 rounded-lg border border-gray-200 uppercase tracking-tighter">CL. {clauses[idx]}</span>}<span className="font-black">{val}</span></div>
                              <div className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-50 rounded-lg"><X className="w-3.5 h-3.5" /></div>
                          </div>
                       );
                    })}
                  </div>
            </div>
        </div>
          
        <div className="pt-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3 ml-1">Faturamento Variável</label>
              <div className="flex items-center h-[54px] border border-gray-200 rounded-[1.5rem] px-6 bg-gray-50/50 transition-all hover:bg-white hover:border-[#0a192f]/20 hover:shadow-sm cursor-pointer group">
                <input type="checkbox" id="timesheet_check" checked={(formData as any).timesheet || false} onChange={(e) => setFormData({...formData, timesheet: e.target.checked} as any)} className="w-4 h-4 text-[#0a192f] rounded border-gray-300 focus:ring-[#0a192f] cursor-pointer" />
                <label htmlFor="timesheet_check" className="ml-4 text-[10px] font-black text-[#0a192f] uppercase tracking-widest cursor-pointer select-none group-hover:text-amber-600 transition-colors">Vincular Horas do Timesheet ao Faturamento</label>
              </div>
              {isTimesheet && <div className="mt-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200 p-3 rounded-xl animate-in fade-in shadow-sm"><AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5"/><p className="text-[10px] font-bold text-amber-700 uppercase tracking-tight leading-relaxed">Configuração Estratégica: Honorários fixos e pro-labore serão substituídos automaticamente pela volumetria de horas registradas.</p></div>}
        </div>
      </div>
      )}
    </div>
  );
}