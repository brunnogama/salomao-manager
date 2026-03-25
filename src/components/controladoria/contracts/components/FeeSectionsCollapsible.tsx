import React, { useState } from 'react';
import { Plus, CheckCircle, DollarSign, Award, Save, Edit, Trash2, Settings, AlertTriangle } from 'lucide-react';
import { Contract } from '../../../../types/controladoria';
import { CustomSelect } from '../../ui/CustomSelect';
import { FinancialInputWithInstallments } from './FinancialInputWithInstallments';

interface FeeSectionsCollapsibleProps {
    formData: Contract;
    setFormData: React.Dispatch<React.SetStateAction<Contract>>;
    isTimesheet: boolean;
    safeString: (val: string | number | undefined) => string;
    formatForInput: (val: string | number | undefined) => string | number;
    handleAddToList: (listField: string, valueField: any, installmentsListField?: string, installmentsSourceField?: any, ruleListField?: string, ruleSourceField?: any, readyListField?: string, readySourceField?: any) => void;
    handleEditExtra: (listField: string, valueField: keyof Contract, installmentsListField: string, installmentsSourceField: keyof Contract, clauseListField: string, clauseSourceField: keyof Contract, ruleListField: string, ruleSourceField: keyof Contract, readyListField: string, readySourceField: keyof Contract, index: number) => void;
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

// Componente de item de honorário salvo
const SavedFeeItem = ({ val, clause, installment, rule, isReady, onEdit, onDelete }: {
    val: string; clause?: string; installment?: string; rule?: string; isReady?: boolean;
    onEdit: () => void; onDelete: () => void;
}) => (
    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 group hover:border-blue-200 transition-colors">
        <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
                {clause && <span className="text-gray-500 font-bold text-[10px] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">Cl. {clause}</span>}
                <span className="font-bold text-sm text-[#0a192f]">{val}</span>
                {installment && installment !== '1x' && <span className="text-gray-400 text-[10px] font-medium">({installment})</span>}
                {isReady && <span className="flex items-center gap-0.5 text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200 uppercase tracking-wider"><CheckCircle className="w-2.5 h-2.5" /> Faturar</span>}
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



export function FeeSectionsCollapsible(props: FeeSectionsCollapsibleProps) {
    const {
        formData, setFormData, isTimesheet, safeString, formatForInput,
        handleAddToList, handleEditExtra, ensureArray,
        newIntermediateFee, setNewIntermediateFee, interimInstallments, setInterimInstallments,
        handleAddIntermediateFee, interimClause, setInterimClause, interimRule, setInterimRule,
        interimReady, setInterimReady, handleRemoveIntermediateFee,
        renderInstallmentBreakdown, renderInterimBreakdownEditable,
        billingOptions, maskHon, setActiveManager, signatureOptions, duplicateHonCase, getStatusLabel
    } = props;

    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

    const toggleSection = (key: string) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Helper para remover extra com confirmação visual
    const removeExtra = (field: string, index: number, installmentsListField?: string) => {
        setFormData((prev: any) => {
            const newList = [...(prev[field] || [])];
            const newClausesList = [...(ensureArray(prev[field + '_clauses']))];
            const newRulesList = [...(ensureArray(prev[field + '_rules']))];
            const newReadyList = prev[field + '_ready'] ? [...prev[field + '_ready']] : [];
            newList.splice(index, 1);
            if (newClausesList.length > index) newClausesList.splice(index, 1);
            if (newRulesList.length > index) newRulesList.splice(index, 1);
            if (newReadyList.length > index) newReadyList.splice(index, 1);
            const updates: any = { [field]: newList, [field + '_clauses']: newClausesList, [field + '_rules']: newRulesList, [field + '_ready']: newReadyList };
            if (installmentsListField) {
                const newInstList = [...ensureArray(prev[installmentsListField])];
                if (newInstList.length > index) newInstList.splice(index, 1);
                updates[installmentsListField] = newInstList;
            }
            return { ...prev, ...updates };
        });
    };

    // Renderiza uma categoria genérica de honorário (Pró-labore, Fixo Mensal, Êxito Final, Outros)
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
        const extras = ensureArray((formData as any)[extrasField]);
        const extrasClauses = ensureArray((formData as any)[extrasClausesField]);
        const extrasInstallments = ensureArray((formData as any)[extrasInstallmentsField]);
        const extrasRules = ensureArray((formData as any)[extrasRulesField]);
        const extrasReady = (formData as any)[extrasReadyField] || [];

        const isOpen = openSections[key] || false;

        return (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white/80 backdrop-blur-sm">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2.5">
                        {React.createElement(icon, { className: 'w-4 h-4 text-[#1e3a8a]' })}
                        <span className="text-sm font-bold text-[#0a192f]">{title}</span>
                        {extras.length > 0 && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{extras.length}</span>}
                    </div>
                    <button
                        type="button"
                        onClick={() => toggleSection(key)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar {title}
                    </button>
                </div>

                <div className="px-5 py-3">
                    {/* Itens salvos */}
                    {extras.length > 0 && (
                        <div className="flex flex-col gap-2 mb-3">
                            {extras.map((val: string, idx: number) => (
                                <SavedFeeItem
                                    key={idx}
                                    val={val}
                                    clause={extrasClauses[idx]}
                                    installment={extrasInstallments[idx]}
                                    rule={extrasRules[idx]}
                                    isReady={extrasReady[idx]}
                                    onEdit={() => handleEditExtra(extrasField, valueField, extrasInstallmentsField, installmentsField, extrasClausesField, clauseField as keyof Contract, extrasRulesField, ruleField, extrasReadyField, readyField, idx)}
                                    onDelete={() => removeExtra(extrasField, idx, extrasInstallmentsField)}
                                />
                            ))}
                        </div>
                    )}

                    {extras.length === 0 && !isOpen && (
                        <p className="text-xs text-gray-400 italic">Nenhum valor cadastrado.</p>
                    )}

                    {/* Formulário inline */}
                    {isOpen && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200 bg-gray-50/50 border border-gray-200 rounded-lg p-4 mt-1">
                            <FinancialInputWithInstallments
                                label={`Valor - ${title}`}
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
                            <div className="flex justify-end mt-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleAddToList(extrasField, valueField, extrasInstallmentsField, installmentsField, extrasRulesField, ruleField as any, extrasReadyField, readyField as any);
                                        toggleSection(key);
                                    }}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-[#112240] transition-colors shadow-sm"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    Salvar
                                </button>
                            </div>
                            {renderInstallmentBreakdown(title, valueField, breakdownField, installmentsField)}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Renderiza a seção do Êxito Intermediário (lógica especial com state próprio)
    const renderIntermediateSection = () => {
        const fees = ensureArray(formData.intermediate_fees);
        const clauses = ensureArray((formData as any).intermediate_fees_clauses);
        const installments = ensureArray((formData as any).intermediate_fees_installments);
        const rules = ensureArray((formData as any).intermediate_fees_rules);
        const readyFlags = (formData as any).intermediate_fees_ready || [];
        const isOpen = openSections['intermediate'] || false;

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
                        onClick={() => toggleSection('intermediate')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar Êxito Intermediário
                    </button>
                </div>

                <div className="px-5 py-3">
                    {fees.length > 0 && (
                        <div className="flex flex-col gap-2 mb-3">
                            {fees.map((fee: string, idx: number) => (
                                <SavedFeeItem
                                    key={idx}
                                    val={fee}
                                    clause={clauses[idx]}
                                    installment={installments[idx]}
                                    rule={rules[idx]}
                                    isReady={readyFlags[idx]}
                                    onEdit={() => {
                                        setNewIntermediateFee(fee);
                                        setInterimInstallments(installments[idx] || '1x');
                                        setInterimClause(clauses[idx] || '');
                                        setInterimRule?.(rules[idx] || '');
                                        setInterimReady?.(readyFlags[idx] || false);
                                        handleRemoveIntermediateFee(idx);
                                        setOpenSections(prev => ({ ...prev, intermediate: true }));
                                    }}
                                    onDelete={() => handleRemoveIntermediateFee(idx)}
                                />
                            ))}
                        </div>
                    )}

                    {fees.length === 0 && !isOpen && (
                        <p className="text-xs text-gray-400 italic">Nenhum valor cadastrado.</p>
                    )}

                    {isOpen && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200 bg-gray-50/50 border border-gray-200 rounded-lg p-4 mt-1">
                            <FinancialInputWithInstallments
                                label="Valor - Êxito Intermediário"
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
                            <div className="flex justify-end mt-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleAddIntermediateFee();
                                        toggleSection('intermediate');
                                    }}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-[#112240] transition-colors shadow-sm"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    Salvar
                                </button>
                            </div>
                            {renderInterimBreakdownEditable()}
                        </div>
                    )}
                </div>
            </div>
        );
    };



    return (
        <div className="space-y-6 animate-in slide-in-from-top-2 pt-4 border-t border-gray-100">
            {/* Campos de Contrato Fechado (HON, Faturamento, Assinatura) */}
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

            {/* Categorias de Honorários */}
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

            {/* Timesheet */}
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
                {isTimesheet && <div className="px-5 pb-3"><p className="text-[10px] text-orange-600 animate-in fade-in">* Ao ativar o Timesheet, os honorários fixos serão zerados no salvamento.</p></div>}
            </div>
        </div>
    );
}
