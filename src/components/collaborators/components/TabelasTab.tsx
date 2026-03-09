import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Loader2, Save, Trash2, Edit2, X, Table as TableIcon, ArrowRight, ArrowLeft, Tag, Briefcase, GraduationCap } from 'lucide-react';
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

interface Role {
    id: string;
    name: string;
    default_tags?: string; // New field added
    created_at?: string;
    active?: boolean;
}

export function TabelasTab() {
    type ViewState = 'menu' | 'bolsas' | 'cargos';
    const [activeView, setActiveView] = useState<ViewState>('menu');

    const [rules, setRules] = useState<BolsaEstagioRule[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Modal State - Bolsas
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<Partial<BolsaEstagioRule> | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

    // Modal State - Cargos (Tags)
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [isTagging, setIsTagging] = useState(false);
    const [tagSearch, setTagSearch] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const [availableTags, setAvailableTags] = useState<string[]>([]);

    // Derived state for Roles
    const [rolesJuridico, setRolesJuridico] = useState<Role[]>([]);
    const [rolesAdmin, setRolesAdmin] = useState<Role[]>([]);

    useEffect(() => {
        if (activeView === 'bolsas') {
            fetchRules();
        } else if (activeView === 'cargos') {
            fetchRoles();
            fetchTags();
        }
    }, [activeView]);

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

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('roles')
                .select('*')
                // .eq('active', true) // assuming we only want active ones, or maybe all
                .order('name', { ascending: true });

            if (error) throw error;

            const rolesData = data || [];
            setRoles(rolesData);

            // Separação entre Jurídico e Administrativo
            // Baseado na lógica já existente (VagaFormModal/DadosCorporativos):
            const jud = [];
            const adm = [];

            for (const r of rolesData) {
                const lower = r.name.toLowerCase();
                const isJuridico = lower.includes('advogado') ||
                    lower.includes('sócio') ||
                    lower.includes('socio') ||
                    lower.includes('estagiário') ||
                    lower.includes('estagiario') ||
                    lower.includes('jurídico') ||
                    lower.includes('juridico');
                if (isJuridico) {
                    jud.push(r);
                } else {
                    adm.push(r);
                }
            }

            setRolesJuridico(jud);
            setRolesAdmin(adm);

        } catch (error) {
            console.error('Erro ao buscar cargos:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTags = async () => {
        try {
            const { data, error } = await supabase.from('perfil_tags').select('tag').order('tag');
            if (!error && data) {
                setAvailableTags(data.map(d => d.tag));
            }
        } catch (e) {
            console.error('Error fetching tags:', e);
        }
    };

    // Rule Handlers
    const handleOpenRuleModal = (rule?: BolsaEstagioRule) => {
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
        setIsRuleModalOpen(true);
    };

    const handleCloseRuleModal = () => {
        setIsRuleModalOpen(false);
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
                const { error } = await supabase.from('bolsa_estagio_rules').update(payload).eq('id', editingRule.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('bolsa_estagio_rules').insert([payload]);
                if (error) throw error;
            }

            await fetchRules();
            handleCloseRuleModal();
        } catch (error) {
            console.error('Erro ao salvar regra:', error);
            alert('Erro ao salvar a regra. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmDeleteRule = (id: string) => {
        setRuleToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const executeDeleteRule = async () => {
        if (!ruleToDelete) return;
        try {
            const { error } = await supabase.from('bolsa_estagio_rules').delete().eq('id', ruleToDelete);
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

    // Role Handlers
    const handleOpenRoleModal = (role: Role) => {
        setEditingRole({ ...role });
        setIsRoleModalOpen(true);
    };

    const handleCloseRoleModal = () => {
        setIsRoleModalOpen(false);
        setEditingRole(null);
        setIsTagging(false);
        setTagSearch('');
    };

    const handleTagsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!editingRole) return;

        const text = e.target.value;
        const position = e.target.selectionStart;
        setEditingRole({ ...editingRole, default_tags: text });

        const lastAtSymbol = text.lastIndexOf('@', position - 1);
        const lastNewLine = text.lastIndexOf('\n', position - 1);

        const bound = lastNewLine;
        if (lastAtSymbol > bound) {
            setIsTagging(true);
            setTagSearch(text.substring(lastAtSymbol + 1, position));
            setCursorPosition(lastAtSymbol);
        } else {
            setIsTagging(false);
        }
    };

    const insertRoleTag = (tagText: string) => {
        if (!editingRole || typeof editingRole.default_tags !== 'string') return;

        const currentText = editingRole.default_tags;
        const beforeTag = currentText.substring(0, cursorPosition);
        const nextNewLine = currentText.indexOf('\n', cursorPosition);
        const afterTag = nextNewLine !== -1 ? currentText.substring(nextNewLine) : '';

        const newText = `${beforeTag}${tagText}${afterTag}`;

        setEditingRole({ ...editingRole, default_tags: newText });
        setIsTagging(false);
        setTagSearch('');
    };

    const handleSaveRole = async () => {
        if (!editingRole) return;

        setSaving(true);
        try {
            const payload = {
                default_tags: editingRole.default_tags,
            };

            const { error } = await supabase.from('roles').update(payload).eq('id', editingRole.id);
            if (error) throw error;

            // Save tags to perfil_tags dictionary if they are new
            if (editingRole.default_tags) {
                const lines = editingRole.default_tags.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                if (lines.length > 0) {
                    const tagsToInsert = lines.map(t => ({ tag: t }));
                    const { error: tagError } = await supabase.from('perfil_tags').upsert(tagsToInsert, { onConflict: 'tag' });
                    if (tagError) console.error("Error upserting tags", tagError);
                }
            }

            await fetchRoles();
            handleCloseRoleModal();
        } catch (error) {
            console.error('Erro ao salvar cargos:', error);
            alert('Erro ao salvar as tags do cargo. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };


    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 animate-in slide-in-from-top-4 duration-500 overflow-auto custom-scrollbar">
            {activeView === 'menu' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-fit">
                    <button
                        onClick={() => setActiveView('bolsas')}
                        className="group relative flex flex-col p-8 bg-white rounded-2xl border border-gray-200 hover:border-emerald-400 hover:shadow-2xl transition-all duration-300 text-left overflow-hidden h-full"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                            <GraduationCap className="h-7 w-7" />
                        </div>
                        <h3 className="relative z-10 text-xl font-black text-[#1e3a8a] mb-2 group-hover:text-[#112240]">Bolsa Auxílio - Estagiários</h3>
                        <p className="relative z-10 text-sm text-gray-500 font-medium flex-1">Gerencie os valores e métricas padrão para o sistema da bolsa de estágio.</p>

                        <div className="relative z-10 mt-8 flex items-center gap-2 text-emerald-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            Acessar Tabela <ArrowRight className="h-4 w-4" />
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveView('cargos')}
                        className="group relative flex flex-col p-8 bg-white rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 text-left overflow-hidden h-full"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                            <Briefcase className="h-7 w-7" />
                        </div>
                        <h3 className="relative z-10 text-xl font-black text-[#1e3a8a] mb-2 group-hover:text-[#112240]">Cargos - Informações</h3>
                        <p className="relative z-10 text-sm text-gray-500 font-medium flex-1">Configure o perfil (tags padrão) de cada cargo para pré-preenchimento das vagas.</p>

                        <div className="relative z-10 mt-8 flex items-center gap-2 text-blue-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            Acessar Cargos <ArrowRight className="h-4 w-4" />
                        </div>
                    </button>
                </div>
            ) : (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300 relative">
                    <div className="pb-6 mb-2 border-b border-gray-100 flex items-center justify-between shrink-0">
                        <button
                            onClick={() => setActiveView('menu')}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-[#1e3a8a] rounded-xl transition-colors text-xs font-bold border border-gray-200 shadow-sm"
                        >
                            <ArrowLeft className="h-4 w-4" /> Voltar para Menu de Tabelas
                        </button>
                    </div>

                    {loading && (
                        <div className="flex-1 flex flex-col items-center justify-center mt-10">
                            <Loader2 className="h-8 w-8 text-[#1e3a8a] animate-spin mb-4" />
                            <p className="text-gray-500 font-medium">Carregando dados...</p>
                        </div>
                    )}

                    {!loading && activeView === 'bolsas' && (
                        <div className="flex-1 overflow-auto mt-6">
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-[#0a192f]">Bolsa Auxílio - Estagiários</h3>
                                    <button
                                        onClick={() => handleOpenRuleModal()}
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
                                                                    onClick={() => handleOpenRuleModal(rule)}
                                                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                                    title="Editar"
                                                                >
                                                                    <Edit2 className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleConfirmDeleteRule(rule.id)}
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
                    )}

                    {!loading && activeView === 'cargos' && (
                        <div className="flex-1 overflow-auto mt-6">
                            <h3 className="text-lg font-bold text-[#0a192f] mb-6">Cargos - Informações e Perfis</h3>

                            {/* Jurídica */}
                            <div className="mb-8">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1e3a8a] mb-4 flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" /> Área Jurídica
                                </h4>
                                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider w-1/3">Cargo</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Tags (Perfil Padrão)</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-right w-24">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {rolesJuridico.map((role) => (
                                                <tr key={role.id} className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-bold text-[#0a192f]">{role.name}</td>
                                                    <td className="px-6 py-4">
                                                        {role.default_tags ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {role.default_tags.split('\n').filter(l => l.trim()).map((tag, i) => (
                                                                    <span key={i} className="px-1.5 py-0.5 bg-blue-50/50 text-blue-600 border border-blue-100/50 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 max-w-xs truncate">
                                                                        {tag.trim()}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">Nenhuma tag cadastrada</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleOpenRoleModal(role)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                            title="Editar Tags"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Administrativa */}
                            <div className="mb-8">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" /> Área Administrativa
                                </h4>
                                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider w-1/3">Cargo</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Tags (Perfil Padrão)</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-right w-24">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {rolesAdmin.map((role) => (
                                                <tr key={role.id} className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-bold text-[#0a192f]">{role.name}</td>
                                                    <td className="px-6 py-4">
                                                        {role.default_tags ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {role.default_tags.split('\n').filter(l => l.trim()).map((tag, i) => (
                                                                    <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 max-w-xs truncate">
                                                                        {tag.trim()}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">Nenhuma tag cadastrada</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleOpenRoleModal(role)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                            title="Editar Tags"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            )}

            {/* Modal - Bolsa Estágio Rules */}
            {isRuleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-lg font-bold text-[#1e3a8a]">
                                {editingRule?.id ? 'Editar Regra' : 'Nova Regra de Bolsa'}
                            </h3>
                            <button
                                onClick={handleCloseRuleModal}
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
                                onClick={handleCloseRuleModal}
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

            {/* Modal - Roles Tags */}
            {isRoleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-lg font-bold text-[#1e3a8a]">
                                Perfil: {editingRole?.name}
                            </h3>
                            <button
                                onClick={handleCloseRoleModal}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="relative">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex justify-between items-center">
                                    Tags Padrão
                                    <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">Use @ para pesquisar tags</span>
                                </label>
                                <textarea
                                    value={editingRole?.default_tags || ''}
                                    onChange={handleTagsChange}
                                    placeholder="Descreva as tags (cada linha salva vira uma tag)&#10;Ex:&#10;Experiência no contencioso cível&#10;Legalone&#10;&#10;Dica: Use @ para buscar na nuvem de talentos"
                                    className="w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-3 outline-none font-medium transition-all shadow-sm h-48 resize-none"
                                />

                                {/* Sub-menu for @ tags */}
                                {isTagging && (
                                    <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-gray-100 z-10 max-h-48 overflow-y-auto">
                                        {availableTags
                                            .filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()))
                                            .map(tag => (
                                                <button
                                                    key={tag}
                                                    onClick={() => insertRoleTag(tag)}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-sm text-[#0a192f] font-medium border-b border-gray-50 last:border-0"
                                                >
                                                    <Tag className="h-4 w-4 text-blue-500" />
                                                    {tag}
                                                </button>
                                            ))
                                        }
                                        {availableTags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase())).length === 0 && (
                                            <div className="px-4 py-3 text-sm text-gray-500 italic">
                                                Nenhuma tag cadastrada com "{tagSearch}"... Quando você salvar, ela será criada!
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                                Estas tags serão preenchidas automaticamente no campo <strong>Perfil</strong> ao criar uma nova Vaga vinculada a este Cargo.
                            </p>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
                            <button
                                onClick={handleCloseRoleModal}
                                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveRole}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2 bg-[#1e3a8a] text-white text-sm font-bold rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Salvar Perfil
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
