import React, { useState } from 'react';
import { Plus, CheckCircle, DollarSign, Award, Save, Edit, Trash2, Settings, AlertTriangle } from 'lucide-react';
import { Contract } from '../../../../types/controladoria';
import { CustomSelect } from '../../ui/CustomSelect';
import { FinancialInputWithInstallments } from './FinancialInputWithInstallments';
import { parseCurrency } from '../../utils/masks';
import { supabase } from '../../../../lib/supabase';
import { CheckCircle2 } from 'lucide-react';

interface FeeSectionsCollapsibleProps {
    formData: Contract;
    setFormData: React.Dispatch<React.SetStateAction<Contract>>;
    isTimesheet: boolean;
    safeString: (val: string | number | undefined) => string;
    formatForInput: (val: string | number | undefined) => string | number;
    ensureArray: (val: any) => string[];
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
    renderInstallmentBreakdown: (label: string, valueField: keyof Contract, breakdownField: string, installmentField: keyof Contract) => React.ReactNode;
    renderInterimBreakdownEditable: () => React.ReactNode;
    billingOptions: { label: string; value: string }[];
    maskHon: (value: string) => string;
    setActiveManager: (manager: string) => void;
    signatureOptions: { label: string; value: string }[];
    duplicateHonCase?: any | null;
    getStatusLabel: (status: string) => string;
    partnerSelectOptions: { label: string; value: string }[];
}

const SavedFeeItem = ({ val, clause, installment, rule, isReady, feeType: _feeType, onEdit, onDelete, paidInstallments = [] }: {
    val: string; clause?: string; installment?: string; rule?: string; isReady?: boolean; feeType?: string;
    onEdit: () => void; onDelete: () => void; paidInstallments?: any[];
}) => {
    const titleParts = [
        clause ? clause : null,
        val,
        installment ? installment : '1x'
    ].filter(Boolean).join(' - ');

    return (
    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 group hover:border-blue-200 transition-colors">
        <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-[#0a192f]">{titleParts}</span>
                {isReady && <span className="flex items-center gap-0.5 text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200 uppercase tracking-wider"><CheckCircle className="w-2.5 h-2.5" /> Faturar</span>}
                {paidInstallments.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {paidInstallments.map((pi: any, idx: number) => (
                      <span key={idx} className="inline-flex items-center text-[7px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded border border-emerald-200 shadow-sm">
                        <CheckCircle2 className="w-2 h-2 mr-0.5" strokeWidth={3} />
                        Pago ({pi.installment_number || idx + 1})
                      </span>
                    ))}
                  </div>
                )}
            </div>
            {rule && <span className="text-[11px] text-gray-500 italic mt-1 line-clamp-1">{rule}</span>}
        </div>
        <div className="flex items-center gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={onEdit} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                <Edit className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={onDelete} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Deletar">
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    </div>
    );
};

export function FeeSectionsCollapsible(props: FeeSectionsCollapsibleProps) {
    const {
        formData, setFormData, isTimesheet, safeString, formatForInput,
        ensureArray,
        newIntermediateFee, setNewIntermediateFee, interimInstallments, setInterimInstallments,
        handleAddIntermediateFee, interimClause, setInterimClause, interimRule, setInterimRule,
        interimReady, setInterimReady, handleRemoveIntermediateFee,
        renderInstallmentBreakdown, renderInterimBreakdownEditable,
        billingOptions, maskHon, setActiveManager, signatureOptions, duplicateHonCase, getStatusLabel
    } = props;

    const [financialInstallments, setFinancialInstallments] = useState<any[]>([]);
    const [editingKey, setEditingKey] = useState<string | null>(null);

    React.useEffect(() => {
        const fetchFinanceInstallments = async () => {
            if (!formData.id) return;
            try {
                const { data, error } = await supabase.from('financial_installments')
                    .select('type, status, clause, installment_number')
                    .eq('contract_id', formData.id);
                if (!error && data) {
                    setFinancialInstallments(data as any);
                }
            } catch (err) {
                console.error('Error fetching installments', err);
            }
        };
        fetchFinanceInstallments();
    }, [formData.id]);

    const getInternalType = (ft: string) => {
        if (!ft) return '';
        if (ft.includes('Pró-labore')) return 'pro_labore';
        if (ft.includes('Fixo Mensal')) return 'fixed_monthly_fee';
        if (ft.includes('Intermediário')) return 'intermediate_fee';
        if (ft.includes('Final')) return 'final_success_fee';
        if (ft.includes('Outros')) return 'other_fees';
        return '';
    };

    const getPaidInstallments = (feeTypeRaw: string, clauseStr: string | undefined) => {
        const internalFeeType = getInternalType(feeTypeRaw);
        return financialInstallments
            .filter((i: any) => i.status === 'paid' && i.type === internalFeeType && (i.clause || '') === (clauseStr || ''))
            .sort((a: any, b: any) => (a.installment_number || 0) - (b.installment_number || 0));
    };

    const removeExtra = (field: string, index: number, installmentsListField: string, clauseListField: string, ruleListField: string, readyListField: string) => {
        setFormData((prev: any) => {
            const newList = [...ensureArray(prev[field])];
            const newClausesList = [...ensureArray(prev[clauseListField])];
            const newRulesList = [...ensureArray(prev[ruleListField])];
            const newReadyList = prev[readyListField] ? [...prev[readyListField]] : [];
            const newInstList = [...ensureArray(prev[installmentsListField])];

            newList.splice(index, 1);
            if (newClausesList.length > index) newClausesList.splice(index, 1);
            if (newRulesList.length > index) newRulesList.splice(index, 1);
            if (newReadyList.length > index) newReadyList.splice(index, 1);
            if (newInstList.length > index) newInstList.splice(index, 1);

            return { 
                ...prev, 
                [field]: newList, 
                [clauseListField]: newClausesList, 
                [ruleListField]: newRulesList, 
                [readyListField]: newReadyList,
                [installmentsListField]: newInstList
            };
        });
        if (editingKey === `${field}_ext_${index}`) {
            setEditingKey(null);
        }
    };

    const addNewExtra = (extrasField: string, installmentsField: string, clausesField: string, rulesField: string, readyField: string) => {
        setFormData((prev: any) => {
            const newList = [...ensureArray(prev[extrasField]), ''];
            const newClausesList = [...ensureArray(prev[clausesField]), ''];
            const newRulesList = [...ensureArray(prev[rulesField]), ''];
            const newInstList = [...ensureArray(prev[installmentsField]), '1x'];
            const newReadyList = prev[readyField] ? [...prev[readyField], false] : [false];
            return {
                ...prev,
                [extrasField]: newList,
                [clausesField]: newClausesList,
                [rulesField]: newRulesList,
                [installmentsField]: newInstList,
                [readyField]: newReadyList
            }
        });
        const currentExtras = ensureArray((formData as any)[extrasField]);
        setEditingKey(`${extrasField}_ext_${currentExtras.length}`);
    };

    const clearMain = (valueField: string, clauseField: string, installmentsField: string, ruleField: string, readyField: string) => {
        setFormData(prev => ({ ...prev, [valueField]: '', [clauseField]: '', [installmentsField]: '1x', [ruleField]: '', [readyField]: false } as any));
        if (editingKey === `${valueField}_main`) setEditingKey(null);
    };

    const renderGenericFeeCategory = (config: {
        key: string;
        title: string;
        icon: React.ElementType;
        valueField: keyof Contract;
        extrasField: string;
        installmentsField: keyof Contract;
        extrasInstallmentsField: string;
        extrasClausesField: string;
        clauseField: string;
        ruleField: keyof Contract;
        extrasRulesField: string;
        readyField: keyof Contract;
        extrasReadyField: string;
        breakdownField: string;
    }) => {
        const { key, title, icon, valueField, extrasField, installmentsField, extrasInstallmentsField, extrasClausesField, clauseField, ruleField, extrasRulesField, readyField, extrasReadyField, breakdownField } = config;
        
        const mainValue = safeString(formatForInput((formData as any)[valueField]));
        let hasMain = parseCurrency(mainValue) > 0 || mainValue !== '';
        // Treat as not having main if it's strictly empty or "R$ 0,00" but we only trust strictly empty for logic
        if (mainValue === '' || mainValue === 'R$ 0,00') hasMain = false;

        const extras = ensureArray((formData as any)[extrasField]);
        const extrasClauses = ensureArray((formData as any)[extrasClausesField]);
        const extrasInstallments = ensureArray((formData as any)[extrasInstallmentsField]);
        const extrasRules = ensureArray((formData as any)[extrasRulesField]);
        const extrasReady = (formData as any)[extrasReadyField] || [];

        // Verifica se há algo ativo
        const totalItemsCount = (hasMain ? 1 : 0) + extras.length;
        const defaultOpen = totalItemsCount > 0;
        
        return (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white/80 backdrop-blur-sm">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2.5">
                        {React.createElement(icon, { className: 'w-4 h-4 text-[#1e3a8a]' })}
                        <span className="text-sm font-bold text-[#0a192f]">{title}</span>
                        {totalItemsCount > 0 && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{totalItemsCount}</span>}
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (!hasMain) {
                                setEditingKey(`${valueField}_main`);
                            } else {
                                addNewExtra(extrasField, extrasInstallmentsField, extrasClausesField, extrasRulesField, extrasReadyField);
                            }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar {title}
                    </button>
                </div>

                <div className="px-5 py-3">
                    <div className="flex flex-col gap-2 mb-3">
                        {/* Render Main Item */}
                        {hasMain || editingKey === `${valueField}_main` ? (
                            editingKey === `${valueField}_main` ? (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-200 bg-blue-50/30 border border-blue-200 rounded-lg p-4 mt-1 mb-2">
                                    <FinancialInputWithInstallments
                                        label={`Valor - ${title} (Principal)`}
                                        value={safeString(formatForInput((formData as any)[valueField]))}
                                        onChangeValue={(v: any) => setFormData({ ...formData, [valueField]: v })}
                                        installments={(formData as any)[installmentsField]}
                                        onChangeInstallments={(v: any) => setFormData({ ...formData, [installmentsField]: v })}
                                        clause={(formData as any)[clauseField]}
                                        onChangeClause={(v: any) => setFormData({ ...formData, [clauseField]: v } as any)}
                                        rule={(formData as any)[ruleField]}
                                        onChangeRule={(v: any) => setFormData({ ...formData, [ruleField]: v })}
                                        readyToInvoice={(formData as any)[readyField]}
                                        onToggleReady={() => setFormData({ ...formData, [readyField]: !(formData as any)[readyField] })}
                                    />
                                    {renderInstallmentBreakdown(title, valueField, breakdownField, installmentsField)}
                                    <div className="mt-2 bg-white/50 p-2.5 rounded-lg border border-gray-200">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center mb-1.5">Regra para recebimento:</label>
                                        <textarea
                                            className="w-full text-xs p-2 border border-gray-300 rounded bg-white focus:border-salomao-blue outline-none resize-none leading-relaxed"
                                            placeholder="Ex: Condição exigida para que este valor seja cobrado (Somente após sentença, etc.)..."
                                            rows={2}
                                            value={(formData as any)[ruleField] || ''}
                                            onChange={(e) => setFormData({ ...formData, [ruleField]: e.target.value.replace(/[\r\n]+/g, ' ') })}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 mt-3">
                                        <button type="button" onClick={() => setEditingKey(null)} className="flex items-center gap-1.5 px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-[#112240] transition-colors shadow-sm">
                                            <Save className="w-3.5 h-3.5" /> Concluir Edição
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <SavedFeeItem
                                    val={safeString(formatForInput((formData as any)[valueField]))}
                                    clause={(formData as any)[clauseField]}
                                    installment={(formData as any)[installmentsField]}
                                    rule={(formData as any)[ruleField]}
                                    isReady={(formData as any)[readyField]}
                                    feeType={title}
                                    paidInstallments={getPaidInstallments(title, (formData as any)[clauseField])}
                                    onEdit={() => setEditingKey(`${valueField}_main`)}
                                    onDelete={() => clearMain(valueField as string, clauseField, installmentsField as string, ruleField as string, readyField as string)}
                                />
                            )
                        ) : null}

                        {/* Render Extra Items */}
                        {extras.map((val: string, idx: number) => (
                            editingKey === `${extrasField}_ext_${idx}` ? (
                                <div key={`edit_ext_${idx}`} className="animate-in fade-in slide-in-from-top-2 duration-200 bg-blue-50/30 border border-blue-200 rounded-lg p-4 mt-1 mb-2">
                                    <FinancialInputWithInstallments
                                        label={`Valor - ${title} (Listagem)`}
                                        value={val}
                                        onChangeValue={(v: any) => {
                                            const n = [...extras]; n[idx] = v;
                                            setFormData({ ...formData, [extrasField]: n });
                                        }}
                                        installments={extrasInstallments[idx]}
                                        onChangeInstallments={(v: any) => {
                                            const n = [...extrasInstallments]; n[idx] = v;
                                            setFormData({ ...formData, [extrasInstallmentsField]: n });
                                        }}
                                        clause={extrasClauses[idx]}
                                        onChangeClause={(v: any) => {
                                            const n = [...extrasClauses]; n[idx] = v;
                                            setFormData({ ...formData, [extrasClausesField]: n } as any);
                                        }}
                                        rule={extrasRules[idx]}
                                        onChangeRule={(v: any) => {
                                            const n = [...extrasRules]; n[idx] = v;
                                            setFormData({ ...formData, [extrasRulesField]: n });
                                        }}
                                        readyToInvoice={extrasReady[idx]}
                                        onToggleReady={() => {
                                            const n = [...extrasReady]; n[idx] = !n[idx];
                                            setFormData({ ...formData, [extrasReadyField]: n });
                                        }}
                                    />
                                    <div className="mt-2 bg-white/50 p-2.5 rounded-lg border border-gray-200">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center mb-1.5">Regra para recebimento:</label>
                                        <textarea
                                            className="w-full text-xs p-2 border border-gray-300 rounded bg-white focus:border-salomao-blue outline-none resize-none leading-relaxed"
                                            placeholder="Ex: Condição exigida para que este valor seja cobrado (Somente após sentença, etc.)..."
                                            rows={2}
                                            value={extrasRules[idx] || ''}
                                            onChange={(e) => {
                                                const n = [...extrasRules]; n[idx] = e.target.value.replace(/[\r\n]+/g, ' ');
                                                setFormData({ ...formData, [extrasRulesField]: n });
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 mt-3">
                                        <button type="button" onClick={() => setEditingKey(null)} className="flex items-center gap-1.5 px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-[#112240] transition-colors shadow-sm">
                                            <Save className="w-3.5 h-3.5" /> Concluir Edição
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <SavedFeeItem
                                    key={`ext_${idx}`}
                                    val={val}
                                    clause={extrasClauses[idx]}
                                    installment={extrasInstallments[idx]}
                                    rule={extrasRules[idx]}
                                    isReady={extrasReady[idx]}
                                    feeType={title}
                                    paidInstallments={getPaidInstallments(title, extrasClauses[idx])}
                                    onEdit={() => setEditingKey(`${extrasField}_ext_${idx}`)}
                                    onDelete={() => removeExtra(extrasField, idx, extrasInstallmentsField, extrasClausesField, extrasRulesField, extrasReadyField)}
                                />
                            )
                        ))}
                    </div>

                    {!hasMain && extras.length === 0 && editingKey !== `${valueField}_main` && (
                        <p className="text-xs text-gray-400 italic">Nenhum valor cadastrado.</p>
                    )}
                </div>
            </div>
        );
    };

    // Renderiza a seção do Êxito Intermediário (lógica especial com states separados para o draft)
    const renderIntermediateSection = () => {
        const fees = ensureArray(formData.intermediate_fees);
        const clauses = ensureArray((formData as any).intermediate_fees_clauses);
        const installments = ensureArray((formData as any).intermediate_fees_installments);
        const rules = ensureArray((formData as any).intermediate_fees_rules);
        const readyFlags = (formData as any).intermediate_fees_ready || [];

        return (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white/80 backdrop-blur-sm">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2.5">
                        <Award className="w-4 h-4 text-[#1e3a8a]" />
                        <span className="text-sm font-bold text-[#0a192f]">Êxito Intermediário</span>
                        {fees.length > 0 && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{fees.length}</span>}
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            // Clear new draft fields
                            setNewIntermediateFee('');
                            setInterimInstallments('1x');
                            setInterimClause('');
                            setInterimRule?.('');
                            setInterimReady?.(false);
                            setEditingKey('intermediate_new');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar Êxito Intermediário
                    </button>
                </div>

                <div className="px-5 py-3">
                    <div className="flex flex-col gap-2 mb-3">
                        {fees.map((fee: string, idx: number) => (
                            editingKey === `intermediate_ext_${idx}` ? (
                                <div key={`edit_inter_${idx}`} className="animate-in fade-in slide-in-from-top-2 duration-200 bg-blue-50/30 border border-blue-200 rounded-lg p-4 mt-1 mb-2">
                                    <FinancialInputWithInstallments
                                        label="Valor - Êxito Intermediário"
                                        value={fee}
                                        onChangeValue={(v: any) => {
                                            const n = [...fees]; n[idx] = v;
                                            setFormData({ ...formData, intermediate_fees: n });
                                        }}
                                        installments={installments[idx] || '1x'}
                                        onChangeInstallments={(v: any) => {
                                            const n = [...installments]; n[idx] = v;
                                            setFormData({ ...formData, intermediate_fees_installments: n } as any);
                                        }}
                                        clause={clauses[idx]}
                                        onChangeClause={(v: any) => {
                                            const n = [...clauses]; n[idx] = v;
                                            setFormData({ ...formData, intermediate_fees_clauses: n } as any);
                                        }}
                                        rule={rules[idx]}
                                        onChangeRule={(v: any) => {
                                            const n = [...rules]; n[idx] = v;
                                            setFormData({ ...formData, intermediate_fees_rules: n } as any);
                                        }}
                                        readyToInvoice={readyFlags[idx]}
                                        onToggleReady={() => {
                                            const n = [...readyFlags]; n[idx] = !n[idx];
                                            setFormData({ ...formData, intermediate_fees_ready: n } as any);
                                        }}
                                    />
                                    <div className="mt-2 bg-white/50 p-2.5 rounded-lg border border-gray-200">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center mb-1.5">Regra para recebimento:</label>
                                        <textarea
                                            className="w-full text-xs p-2 border border-gray-300 rounded bg-white focus:border-salomao-blue outline-none resize-none leading-relaxed"
                                            placeholder="Ex: Condição exigida para que este valor seja cobrado (Somente após sentença, etc.)..."
                                            rows={2}
                                            value={rules[idx] || ''}
                                            onChange={(e) => {
                                                const n = [...rules]; n[idx] = e.target.value.replace(/[\r\n]+/g, ' ');
                                                setFormData({ ...formData, intermediate_fees_rules: n } as any);
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 mt-3">
                                        <button type="button" onClick={() => setEditingKey(null)} className="flex items-center gap-1.5 px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-[#112240] transition-colors shadow-sm">
                                            <Save className="w-3.5 h-3.5" /> Concluir Edição
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <SavedFeeItem
                                    key={idx}
                                    val={fee}
                                    clause={clauses[idx]}
                                    installment={installments[idx]}
                                    rule={rules[idx]}
                                    isReady={readyFlags[idx]}
                                    feeType="Êxito Intermediário"
                                    paidInstallments={getPaidInstallments('Êxito Intermediário', clauses[idx])}
                                    onEdit={() => setEditingKey(`intermediate_ext_${idx}`)}
                                    onDelete={() => handleRemoveIntermediateFee(idx)}
                                />
                            )
                        ))}
                    </div>

                    {fees.length === 0 && editingKey !== 'intermediate_new' && (
                        <p className="text-xs text-gray-400 italic">Nenhum valor cadastrado.</p>
                    )}

                    {editingKey === 'intermediate_new' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200 bg-gray-50/50 border border-gray-200 rounded-lg p-4 mt-1">
                            <FinancialInputWithInstallments
                                label="Novo Valor - Êxito Intermediário"
                                value={newIntermediateFee}
                                onChangeValue={setNewIntermediateFee}
                                installments={interimInstallments}
                                onChangeInstallments={setInterimInstallments}
                                clause={interimClause}
                                onChangeClause={setInterimClause}
                                rule={interimRule}
                                onChangeRule={setInterimRule}
                                readyToInvoice={interimReady}
                                onToggleReady={() => setInterimReady?.(!interimReady)}
                            />
                            {renderInterimBreakdownEditable()}
                            <div className="mt-2 bg-gray-50/50 p-2.5 rounded-lg border border-gray-200">
                                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center mb-1.5">Regra para recebimento:</label>
                                <textarea
                                    className="w-full text-xs p-2 border border-gray-300 rounded bg-white focus:border-salomao-blue outline-none resize-none leading-relaxed"
                                    placeholder="Ex: Condição exigida para que este valor seja cobrado (Somente após sentença, etc.)..."
                                    rows={2}
                                    value={interimRule || ''}
                                    onChange={(e) => setInterimRule?.(e.target.value.replace(/[\r\n]+/g, ' '))}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-3">
                                <button type="button" onClick={() => setEditingKey(null)} className="px-4 py-2 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors">
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleAddIntermediateFee();
                                        setEditingKey(null);
                                    }}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-[#112240] transition-colors shadow-sm"
                                >
                                    <Save className="w-3.5 h-3.5" /> Adicionar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-top-2 pt-4 border-t border-gray-100">
            {formData.status === 'active' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-4 animate-in fade-in">
                    <div className="md:col-span-4">
                        <label className="text-xs font-medium block mb-1 text-green-800">Número HON <span className="text-red-500">*</span></label>
                        <input type="text" className={`w-full border-2 p-2.5 rounded-lg font-mono font-bold bg-white outline-none ${duplicateHonCase ? 'border-yellow-400 text-yellow-800 bg-yellow-50' : 'border-green-200 text-green-900 focus:border-green-500'}`} placeholder="00.000.000/000" value={formData.hon_number} onChange={e => setFormData({ ...formData, hon_number: maskHon(e.target.value) })} />
                        {duplicateHonCase && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-yellow-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis" title={`ID: ${duplicateHonCase.display_id} - ${duplicateHonCase.client_name} (${getStatusLabel(duplicateHonCase.status)})`}>
                                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                <span>Em uso por: {duplicateHonCase.display_id} - {duplicateHonCase.client_name} ({getStatusLabel(duplicateHonCase.status)})</span>
                            </div>
                        )}
                    </div>
                    <div className="md:col-span-4"><CustomSelect label="Local Faturamento *" value={formData.billing_location || ''} onChange={(val: string) => setFormData({ ...formData, billing_location: val })} options={billingOptions} onAction={() => setActiveManager('location')} actionLabel="Gerenciar Locais" actionIcon={Settings} /></div>
                    <div className="md:col-span-4"><CustomSelect label="Possui Assinatura Física? *" value={formData.physical_signature === true ? 'true' : formData.physical_signature === false ? 'false' : ''} onChange={(val: string) => { setFormData({ ...formData, physical_signature: val === 'true' ? true : val === 'false' ? false : undefined }); }} options={signatureOptions} /></div>
                </div>
            )}

            <div className={`space-y-4 ${isTimesheet ? 'opacity-40 pointer-events-none filter grayscale' : ''}`}>
                {renderGenericFeeCategory({
                    key: 'pro_labore', title: 'Pró-Labore', icon: DollarSign,
                    valueField: 'pro_labore', extrasField: 'pro_labore_extras',
                    installmentsField: 'pro_labore_installments', extrasInstallmentsField: 'pro_labore_extras_installments',
                    extrasClausesField: 'pro_labore_extras_clauses', clauseField: 'pro_labore_clause',
                    ruleField: 'pro_labore_rule', extrasRulesField: 'pro_labore_extras_rules',
                    readyField: 'pro_labore_ready', extrasReadyField: 'pro_labore_extras_ready',
                    breakdownField: 'pro_labore_breakdown'
                })}

                {renderIntermediateSection()}

                {renderGenericFeeCategory({
                    key: 'final_success', title: 'Êxito Final', icon: Award,
                    valueField: 'final_success_fee', extrasField: 'final_success_extras',
                    installmentsField: 'final_success_fee_installments', extrasInstallmentsField: 'final_success_extras_installments',
                    extrasClausesField: 'final_success_extras_clauses', clauseField: 'final_success_fee_clause',
                    ruleField: 'final_success_fee_rule', extrasRulesField: 'final_success_extras_rules',
                    readyField: 'final_success_ready', extrasReadyField: 'final_success_extras_ready',
                    breakdownField: 'final_success_fee_breakdown'
                })}

                {renderGenericFeeCategory({
                    key: 'fixed_monthly', title: 'Fixo Mensal', icon: DollarSign,
                    valueField: 'fixed_monthly_fee', extrasField: 'fixed_monthly_extras',
                    installmentsField: 'fixed_monthly_fee_installments', extrasInstallmentsField: 'fixed_monthly_extras_installments',
                    extrasClausesField: 'fixed_monthly_extras_clauses', clauseField: 'fixed_monthly_fee_clause',
                    ruleField: 'fixed_monthly_fee_rule', extrasRulesField: 'fixed_monthly_extras_rules',
                    readyField: 'fixed_monthly_ready', extrasReadyField: 'fixed_monthly_extras_ready',
                    breakdownField: 'fixed_monthly_fee_breakdown'
                })}

                {renderGenericFeeCategory({
                    key: 'other_fees', title: 'Outros', icon: DollarSign,
                    valueField: 'other_fees', extrasField: 'other_fees_extras',
                    installmentsField: 'other_fees_installments', extrasInstallmentsField: 'other_fees_extras_installments',
                    extrasClausesField: 'other_fees_extras_clauses', clauseField: 'other_fees_clause',
                    ruleField: 'other_fees_rule', extrasRulesField: 'other_fees_extras_rules',
                    readyField: 'other_fees_ready', extrasReadyField: 'other_fees_extras_ready',
                    breakdownField: 'other_fees_breakdown'
                })}
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white/80 backdrop-blur-sm">
                <div className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                        <DollarSign className="w-4 h-4 text-[#1e3a8a]" />
                        <span className="text-sm font-bold text-[#0a192f]">Timesheet</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="timesheet_check_new" checked={(formData as any).timesheet || false} onChange={(e) => setFormData({ ...formData, timesheet: e.target.checked } as any)} className="w-4 h-4 text-salomao-blue rounded cursor-pointer" />
                        <label htmlFor="timesheet_check_new" className="text-sm text-gray-700 cursor-pointer select-none">Utilizar Timesheet</label>
                    </div>
                </div>
                {isTimesheet && (
                    <div className="px-5 pb-5 space-y-4 animate-in fade-in">
                        <p className="text-[10px] text-orange-600">* Ao ativar o Timesheet, os honorários fixos serão zerados no salvamento.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Valor Previsto</label>
                                <input 
                                    type="text" 
                                    placeholder="R$ 0,00" 
                                    className="w-full border border-gray-300 p-2.5 rounded-lg font-mono text-sm" 
                                    value={safeString(formatForInput(formData.timesheet_forecast_value))} 
                                    onChange={(e) => setFormData({ ...formData, timesheet_forecast_value: formatForInput(e.target.value) } as any)} 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Total Realizado</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-200 p-2.5 rounded-lg font-mono text-sm bg-gray-50 text-gray-500 cursor-not-allowed select-none" 
                                    readOnly 
                                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Object.values(formData.timesheet_breakdown || {}).reduce((acc: number, val: any) => acc + parseCurrency(val), 0))} 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Data do Pagamento</label>
                                <input 
                                    type="date"
                                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:border-[#1e3a8a] outline-none"
                                    value={safeString((formData as any).timesheet_payment_date)}
                                    onChange={(e) => setFormData({ ...formData, timesheet_payment_date: e.target.value } as any)}
                                />
                            </div>
                        </div>

                        <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-bold text-xs text-[#0a192f] flex justify-between items-center">
                                Detalhamento do Realizado por Nível
                                <span className="text-[10px] text-gray-500 font-normal">Preencha os níveis para gerar o total realizado.</span>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[
                                    { label: 'Sócio', key: 'socio' as const },
                                    { label: 'Consultor', key: 'consultor' as const },
                                    { label: 'Advogado Sênior', key: 'advogado_senior' as const },
                                    { label: 'Advogado Pleno', key: 'advogado_pleno' as const },
                                    { label: 'Advogado Júnior', key: 'advogado_junior' as const },
                                    { label: 'Estagiário', key: 'estagiario' as const }
                                ].map((level) => (
                                    <div key={level.key}>
                                        <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-1">{level.label}</label>
                                        <input 
                                            type="text" 
                                            placeholder="R$ 0,00" 
                                            className="w-full border border-gray-300 p-2 rounded text-xs font-mono focus:border-[#1e3a8a] outline-none" 
                                            value={safeString(formatForInput(formData.timesheet_breakdown?.[level.key]))} 
                                            onChange={(e) => {
                                                const updatedBreakdown = { ...(formData.timesheet_breakdown || {}), [level.key]: formatForInput(e.target.value) };
                                                const sumRealized = Object.values(updatedBreakdown).reduce((acc: number, val: any) => acc + parseCurrency(val), 0);
                                                setFormData({ 
                                                    ...formData, 
                                                    timesheet_breakdown: updatedBreakdown as any,
                                                    timesheet_realized_value: sumRealized > 0 ? (new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sumRealized)) : ''
                                                } as any);
                                            }} 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

