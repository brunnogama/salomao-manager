import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Loader2, Save, Trash2, Edit2, X, Table as TableIcon } from 'lucide-react';
import { formatDbMoneyToDisplay } from '../utils/colaboradoresUtils';
import { ConfirmationModal } from '../../ui/ConfirmationModal';

interface BolsaEstagioRule {
    id: string;
    ano_inicio: number;
    ano_fim: number;
    periodo_inicio: number;
    periodo_fim: number;
    valor_bolsa: number;
    created_at: string;
    updated_at: string;
}

export function TabelasTab() {
    const [rules, setRules] = useState<BolsaEstagioRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<Partial<BolsaEstagioRule> | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bolsa_estagio_rules')
                .select('*')
                .order('ano_inicio', { ascending: true })
                .order('periodo_inicio', { ascending: true });

            if (error) throw error;
            setRules(data || []);
        } catch (error) {
            console.error('Erro ao buscar regras de bolsa:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (rule?: BolsaEstagioRule) => {
        if (rule) {
            setEditingRule({ ...rule });
        } else {
            setEditingRule({
                ano_inicio: 1,
                ano_fim: 1,
                periodo_inicio: 1,
                periodo_fim: 1,
                valor_bolsa: 0
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRule(null);
    };

    const handleSaveRule = async () => {
        if (!editingRule) return;

        setSaving(true);
        try {
            const payload = {
                ano_inicio: editingRule.ano_inicio,
                ano_fim: editingRule.ano_fim,
                periodo_inicio: editingRule.periodo_inicio,
                periodo_fim: editingRule.periodo_fim,
                valor_bolsa: editingRule.valor_bolsa,
            };

            if (editingRule.id) {
                // Update
                const { error } = await supabase
                    .from('bolsa_estagio_rules')
                    .update(payload)
                    .eq('id', editingRule.id);

                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('bolsa_estagio_rules')
                    .insert([payload]);

                if (error) throw error;
            }

            await fetchRules();
            handleCloseModal();
        } catch (error) {
            console.error('Erro ao salvar regra:', error);
            alert('Erro ao salvar a regra. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmDelete = (id: string) => {
        setRuleToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const executeDeleteRule = async () => {
        if (!ruleToDelete) return;

        try {
            const { error } = await supabase
                .from('bolsa_estagio_rules')
                .delete()
                .eq('id', ruleToDelete);

            if (error) throw error;
            await fetchRules();
            setRuleToDelete(null);
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error('Erro ao excluir regra:', error);
            alert('Erro ao excluir a regra. Tente novamente.');
        }
    };

    const formatPeriodo = (inicio: number, fim: number) => {
        if (inicio === fim) return `${inicio}º período`;
        return `${inicio}º ao ${fim}º períodos`;
    };

    const formatAno = (inicio: number, fim: number) => {
        if (inicio === fim) return `${inicio}º ano`;
        return `${inicio}º e ${fim}º anos`;
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 text-[#1e3a8a] animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Carregando tabelas de regras...</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                <div>
                    <h2 className="text-xl font-black text-[#1e3a8a] flex items-center gap-2">
                        <TableIcon className="h-6 w-6" /> Tabelas de Regras
                    </h2>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                        Gerencie os valores e métricas padrão para o sistema
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-[#0a192f]">Bolsa Auxílio - Estagiários</h3>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                        >
                            <Plus className="h-4 w-4" /> Nova Regra
                        </button>
                    </div>

                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Ano de Casa</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Período Acadêmico</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Valor da Bolsa</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-right w-24">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rules.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                            Nenhuma regra cadastrada. Adicione a primeira regra.
                                        </td>
                                    </tr>
                                ) : (
                                    rules.map((rule) => (
                                        <tr key={rule.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold text-[#1e3a8a]">
                                                {formatAno(rule.ano_inicio, rule.ano_fim)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-700">
                                                {formatPeriodo(rule.periodo_inicio, rule.periodo_fim)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">
                                                R$ {formatDbMoneyToDisplay(rule.valor_bolsa)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenModal(rule)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleConfirmDelete(rule.id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <strong>* Como funciona:</strong> O sistema utiliza a coluna <strong>Ano</strong> comparando com a Data de Admissão do colaborador.
                        A coluna <strong>Período</strong> é obtida através do campo <em>"Período Atual"</em> na aba Dados de Escolaridade (Nível Graduação, com status Cursando).
                        A combinação dessas duas variáveis define o valor sugerido da bolsa na aba Dados Corporativos.
                    </p>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-lg font-bold text-[#1e3a8a]">
                                {editingRule?.id ? 'Editar Regra' : 'Nova Regra de Bolsa'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Ano Inicial (de casa)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none"
                                        value={editingRule?.ano_inicio || ''}
                                        onChange={(e) => setEditingRule({ ...editingRule, ano_inicio: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Ano Final (de casa)</label>
                                    <input
                                        type="number"
                                        min={editingRule?.ano_inicio || 1}
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none"
                                        value={editingRule?.ano_fim || ''}
                                        onChange={(e) => setEditingRule({ ...editingRule, ano_fim: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Período Inicial</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none"
                                        value={editingRule?.periodo_inicio || ''}
                                        onChange={(e) => setEditingRule({ ...editingRule, periodo_inicio: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Período Final</label>
                                    <input
                                        type="number"
                                        min={editingRule?.periodo_inicio || 1}
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none"
                                        value={editingRule?.periodo_fim || ''}
                                        onChange={(e) => setEditingRule({ ...editingRule, periodo_fim: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black tracking-widest text-emerald-600">Valor da Bolsa (R$)</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#0a192f] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                    value={editingRule?.valor_bolsa === undefined ? '' : formatDbMoneyToDisplay(editingRule.valor_bolsa!)}
                                    onChange={(e) => {
                                        let val = e.target.value.replace(/\D/g, '');
                                        if (val === '') val = '0';
                                        const numValue = Number(val) / 100;
                                        setEditingRule({ ...editingRule, valor_bolsa: numValue });
                                    }}
                                    placeholder="0,00"
                                />
                            </div>

                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveRule}
                                disabled={saving || !editingRule?.ano_inicio || !editingRule?.ano_fim || !editingRule?.periodo_inicio || !editingRule?.periodo_fim}
                                className="flex items-center gap-2 px-5 py-2 bg-[#1e3a8a] text-white text-sm font-bold rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Salvar Regra
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={executeDeleteRule}
                title="Excluir Regra"
                description="Tem certeza que deseja excluir esta regra? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
}
