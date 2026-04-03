import React, { useEffect } from 'react';
import { Plus, Settings, AlertTriangle, AlertCircle } from 'lucide-react';
import { Contract } from '../../../../types/controladoria';
import { CustomSelect } from '../../ui/CustomSelect';
import { parseCurrency } from '../../utils/masks';
import { addMonths } from 'date-fns';
import { FeeSectionsCollapsible } from './FeeSectionsCollapsible';
import { maskMoney } from '../../utils/masks';

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
    handleAddToList: (listField: string, valueField: any, installmentsListField?: string, installmentsSourceField?: any, ruleListField?: string, ruleSourceField?: any, readyListField?: string, readySourceField?: any) => void;
    removeExtra: (field: string, index: number, installmentsListField?: string) => void;
    newIntermediateFee: string;
    setNewIntermediateFee: (v: string) => void;
    interimInstallments: string;
    setInterimInstallments: (v: string) => void;
    handleAddIntermediateFee: () => void;
    interimClause: string;
    setInterimClause: (v: string) => void;
    interimRule?: string;
    setInterimRule?: (v: string) => void;
    interimReady?: boolean;
    setInterimReady?: (v: boolean) => void;
    handleRemoveIntermediateFee: (idx: number) => void;
    ensureArray: (val: any) => string[];
    dateWarningMessage?: string | null;
    duplicateHonCase?: any | null;
    getStatusLabel: (status: string) => string;
}

export function StatusAndDatesSection(props: StatusAndDatesSectionProps) {
    const {
        formData, setFormData, statusOptions, handleCreateStatus, ensureDateValue,
        analystSelectOptions, onOpenAnalystManager, rejectionByOptions, rejectionReasonOptions,
        partnerSelectOptions, billingOptions, maskHon, setActiveManager, signatureOptions,
        formatForInput, handleAddToList,
        newIntermediateFee, setNewIntermediateFee, interimInstallments, setInterimInstallments,
        handleAddIntermediateFee, interimClause, setInterimClause, interimRule, setInterimRule, interimReady, setInterimReady, handleRemoveIntermediateFee, ensureArray,
        dateWarningMessage, duplicateHonCase, getStatusLabel
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
        ruleListField: string,
        ruleSourceField: keyof Contract,
        readyListField: string,
        readySourceField: keyof Contract,
        index: number
    ) => {
        setFormData((prev: any) => {
            const valueToEdit = prev[listField][index];
            const installmentToEdit = prev[installmentsListField]?.[index] || '1x';
            const clauseToEdit = prev[clauseListField]?.[index] || '';
            const ruleToEdit = prev[ruleListField]?.[index] || '';
            const readyToEdit = prev[readyListField]?.[index] || false;

            const newList = [...(prev[listField] || [])];
            const newClausesList = [...ensureArray(prev[clauseListField])];
            const newInstList = [...ensureArray(prev[installmentsListField])];
            const newRulesList = [...ensureArray(prev[ruleListField])];
            const newReadyList = prev[readyListField] ? [...prev[readyListField]] : [];

            // Prevent data loss: if main slot has a non-zero value, move it to the extra list before overwriting it
            const currentMainValue = prev[valueField];
            if (currentMainValue && currentMainValue !== 'R$ 0,00' && currentMainValue !== '') {
                newList.push(currentMainValue);
                newInstList.push(prev[installmentsSourceField] || '1x');
                newClausesList.push(prev[clauseSourceField] || '');
                newRulesList.push(prev[ruleSourceField] || '');
                newReadyList.push(prev[readySourceField] || false);
            }

            newList.splice(index, 1);
            newClausesList.splice(index, 1);
            newInstList.splice(index, 1);
            if (newRulesList.length > index) newRulesList.splice(index, 1);
            if (newReadyList.length > index) newReadyList.splice(index, 1);

            return {
                ...prev,
                [valueField]: valueToEdit,
                [installmentsSourceField]: installmentToEdit,
                [clauseSourceField]: clauseToEdit,
                [ruleSourceField]: ruleToEdit,
                [readySourceField]: readyToEdit,
                [listField]: newList,
                [clauseListField]: newClausesList,
                [installmentsListField]: newInstList,
                [ruleListField]: newRulesList,
                [readyListField]: newReadyList
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
        if (!Array.isArray(breakdown) || breakdown.length <= 1) return null;

        const totalCalculated = breakdown.reduce((acc, curr) => acc + parseCurrency(curr.value), 0);
        const diff = Math.abs(totalOriginal - totalCalculated);
        const hasError = diff > 0.1;

        return (
            <div className="mt-3 bg-gray-50/80 border border-gray-200 rounded-lg p-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
                <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Parcelamento - {label}</h4>
                    <span className="text-[10px] font-medium text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">Total: {totalValueStr}</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                    {breakdown.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-xs mb-1">
                            <span className="w-6 font-bold text-gray-500 text-right">{idx + 1}x</span>
                            <div className="flex-1">
                                <input
                                    type="date"
                                    className="w-full border border-gray-300 rounded px-2 py-1.5 focus:border-salomao-blue outline-none text-gray-600 bg-white"
                                    value={item.date}
                                    onChange={(e) => {
                                        const newBreakdown = [...breakdown];
                                        newBreakdown[idx].date = e.target.value;
                                        setFormData(prev => ({ ...prev, [breakdownField]: newBreakdown } as any));
                                    }}
                                />
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    className={`w-full border rounded px-2 py-1.5 outline-none font-medium text-right ${hasError ? 'border-red-300 text-red-600 bg-red-50' : 'border-gray-300 text-gray-700 bg-white focus:border-salomao-blue'}`}
                                    value={item.value}
                                    onChange={(e) => {
                                        const newBreakdown = [...breakdown];
                                        const rawValue = e.target.value.replace(/\D/g, '');
                                        newBreakdown[idx].value = maskMoney(rawValue);
                                        setFormData(prev => ({ ...prev, [breakdownField]: newBreakdown } as any));
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {hasError && (
                    <div className="mt-3 flex items-start gap-2 text-[11px] text-red-600 bg-red-50 p-2 rounded border border-red-100">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>Soma das parcelas difere do total. Diferença: R$ {diff.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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

        if (!totalOriginal || totalOriginal <= 0 || !countStr || countStr === '1x' || !Array.isArray(breakdown) || breakdown.length === 0) return null;

        const totalValueStr = totalOriginal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const totalCalculated = breakdown.reduce((acc, curr) => acc + parseCurrency(curr.value), 0);
        const diff = Math.abs(totalOriginal - totalCalculated);
        const hasError = diff > 0.1;

        return (
            <div className="mt-3 bg-orange-50/50 border border-orange-200 rounded-lg p-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
                <div className="flex items-center justify-between mb-3 border-b border-orange-200 pb-2">
                    <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wide">Parcelamento (Novo)</h4>
                    <span className="text-[10px] font-medium text-orange-600 bg-white px-2 py-0.5 rounded border border-orange-200">Total: {totalValueStr}</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                    {breakdown.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-xs mb-1">
                            <span className="w-6 font-bold text-gray-500 text-right">{idx + 1}x</span>
                            <div className="flex-1">
                                <input
                                    type="date"
                                    className="w-full border border-gray-300 rounded px-2 py-1.5 focus:border-orange-500 outline-none text-gray-600 bg-white"
                                    value={item.date}
                                    onChange={(e) => {
                                        const newBreakdown = [...breakdown];
                                        newBreakdown[idx].date = e.target.value;
                                        setFormData(prev => ({ ...prev, interim_breakdown: newBreakdown } as any));
                                    }}
                                />
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    className={`w-full border rounded px-2 py-1.5 outline-none font-medium text-right ${hasError ? 'border-red-300 text-red-600 bg-red-50' : 'border-gray-300 text-gray-700 bg-white focus:border-orange-500'}`}
                                    value={item.value}
                                    onChange={(e) => {
                                        const newBreakdown = [...breakdown];
                                        const rawValue = e.target.value.replace(/\D/g, '');
                                        newBreakdown[idx].value = maskMoney(rawValue);
                                        setFormData(prev => ({ ...prev, interim_breakdown: newBreakdown } as any));
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                {hasError && (
                    <div className="mt-3 flex items-start gap-2 text-[11px] text-red-600 bg-red-50 p-2 rounded border border-red-100">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>Soma difere do total. Diferença: R$ {diff.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white/60 p-6 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm relative z-40 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <CustomSelect label="Status Atual do Caso" value={formData.status} onChange={(val: any) => setFormData({ ...formData, status: val })} options={statusOptions} onAction={handleCreateStatus} actionIcon={Plus} actionLabel="Adicionar Novo Status" />
                {formData.status && (
                    <div className="animate-in fade-in slide-in-from-left-2">
                        <label className="text-xs font-medium block mb-1">
                            {formData.status === 'analysis' ? 'Data do Prospect' :
                                formData.status === 'proposal' ? 'Data da Proposta' :
                                    formData.status === 'active' ? 'Data da Assinatura' :
                                        formData.status === 'rejected' ? 'Data da Rejeição' :
                                            formData.status === 'probono' ? 'Data Probono' : 'Data do Status'}
                        </label>
                        <input
                            type="date"
                            className={`w-full border p-2.5 rounded-lg text-sm bg-white outline-none transition-colors ${dateWarningMessage ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-gray-300 focus:border-salomao-blue'}`}
                            value={ensureDateValue(
                                formData.status === 'analysis' ? formData.prospect_date :
                                    formData.status === 'proposal' ? formData.proposal_date :
                                        formData.status === 'active' ? formData.contract_date :
                                            formData.status === 'rejected' ? formData.rejection_date :
                                                formData.status === 'probono' ? formData.probono_date : ''
                            )}
                            onChange={e => {
                                const val = e.target.value;
                                if (formData.status === 'analysis') setFormData({ ...formData, prospect_date: val });
                                else if (formData.status === 'proposal') setFormData({ ...formData, proposal_date: val });
                                else if (formData.status === 'active') setFormData({ ...formData, contract_date: val });
                                else if (formData.status === 'rejected') setFormData({ ...formData, rejection_date: val });
                                else if (formData.status === 'probono') setFormData({ ...formData, probono_date: val });
                            }}
                        />

                        {/* --- CAMPO CÓDIGO DA PROPOSTA (Novo) --- */}
                        {formData.status === 'proposal' && (
                            <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                                <label className="text-xs font-medium block mb-1 text-blue-800">Código da Proposta</label>
                                <input
                                    type="text"
                                    className="w-full border border-blue-200 p-2.5 rounded-lg text-sm bg-blue-50/50 outline-none focus:border-blue-500 font-mono text-blue-900 placeholder-blue-300"
                                    placeholder="Ex: PROP-2024/001"
                                    value={formData.proposal_code || ''}
                                    onChange={e => setFormData({ ...formData, proposal_code: e.target.value })}
                                />
                            </div>
                        )}

                        {dateWarningMessage && (
                            <div className="flex items-center gap-2 mt-1 text-xs text-red-600 animate-in slide-in-from-top-1 font-medium bg-red-100/50 p-1.5 rounded">
                                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                <span>{dateWarningMessage}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {(formData.status === 'proposal' || formData.status === 'active') && (
                <div className="mb-5 animate-in fade-in slide-in-from-top-1">
                    <label className="text-xs font-medium block mb-1">Referência</label>
                    <textarea 
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm h-20 focus:border-salomao-blue outline-none bg-white resize-none" 
                        value={(formData as any).reference || ''} 
                        onChange={e => {
                            const val = e.target.value.replace(/[\r\n]+/g, ' ');
                            setFormData({ ...formData, reference: val } as any);
                        }} 
                        placeholder="Ex: Proposta 123/2025" 
                    />
                </div>
            )}

            {formData.status === 'analysis' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-2">
                    <div><CustomSelect label="Analisado Por" value={formData.analyst_id || ''} onChange={(val: string) => setFormData({ ...formData, analyst_id: val })} options={analystSelectOptions} onAction={onOpenAnalystManager} actionIcon={Settings} actionLabel="Gerenciar Analistas" /></div>
                </div>
            )}

            {formData.status === 'rejected' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in slide-in-from-top-2">
                    <div><CustomSelect label="Analisado por" value={formData.analyst_id || ''} onChange={(val: string) => setFormData({ ...formData, analyst_id: val })} options={analystSelectOptions} onAction={onOpenAnalystManager} actionIcon={Settings} actionLabel="Gerenciar Analistas" /></div>
                    <div><CustomSelect label="Quem rejeitou" value={formData.rejection_by || ''} onChange={(val: string) => setFormData({ ...formData, rejection_by: val })} options={rejectionByOptions} /></div>
                    <div><CustomSelect label="Motivo da Rejeição" value={formData.rejection_reason || ''} onChange={(val: string) => setFormData({ ...formData, rejection_reason: val })} options={rejectionReasonOptions} /></div>
                </div>
            )}

            {formData.status === 'probono' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-2">
                    <div><CustomSelect label="Enviado Por" value={formData.partner_id || ''} onChange={(val: string) => setFormData({ ...formData, partner_id: val })} options={partnerSelectOptions} /></div>
                </div>
            )}

            {(formData.status === 'proposal' || formData.status === 'active') && (
                <FeeSectionsCollapsible
                    formData={formData}
                    setFormData={setFormData}
                    isTimesheet={isTimesheet}
                    safeString={safeString}
                    formatForInput={formatForInput}
                    handleAddToList={handleAddToList}
                    handleEditExtra={handleEditExtra}
                    ensureArray={ensureArray}
                    newIntermediateFee={newIntermediateFee}
                    setNewIntermediateFee={setNewIntermediateFee}
                    interimInstallments={interimInstallments}
                    setInterimInstallments={setInterimInstallments}
                    handleAddIntermediateFee={handleAddIntermediateFee}
                    interimClause={interimClause}
                    setInterimClause={setInterimClause}
                    interimRule={interimRule}
                    setInterimRule={setInterimRule}
                    interimReady={interimReady}
                    setInterimReady={setInterimReady}
                    handleRemoveIntermediateFee={handleRemoveIntermediateFee}
                    renderInstallmentBreakdown={renderInstallmentBreakdown}
                    renderInterimBreakdownEditable={renderInterimBreakdownEditable}
                    billingOptions={billingOptions}
                    maskHon={maskHon}
                    setActiveManager={setActiveManager}
                    signatureOptions={signatureOptions}
                    duplicateHonCase={duplicateHonCase}
                    getStatusLabel={getStatusLabel}
                    partnerSelectOptions={partnerSelectOptions}
                />
            )}
        </div>
    );
}