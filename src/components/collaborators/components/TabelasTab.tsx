import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Loader2, Save, Trash2, Edit2, X, ArrowRight, ArrowLeft, Tag, Briefcase, GraduationCap, Search } from 'lucide-react';
import { formatDbMoneyToDisplay, parseRoleTags, stringifyRoleTags } from '../utils/colaboradoresUtils';
import { ConfirmationModal } from '../../ui/ConfirmationModal';
import { AlertModal } from '../../ui/AlertModal';
import { ManagedSelect } from '../../crm/ManagedSelect';

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
    default_tags?: string;
    created_at?: string;
    active?: boolean;
}

interface TagData {
    tag: string;
    area?: 'Jurídica' | 'Administrativa' | 'Ambas';
    created_at?: string;
}

export function TabelasTab() {
    type ViewState = 'menu' | 'bolsas' | 'cargos' | 'tags';
    const [activeView, setActiveView] = useState<ViewState>('menu');

    const [rules, setRules] = useState<BolsaEstagioRule[]>([]);
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
    const [availableTags, setAvailableTags] = useState<{ tag: string, area?: string }[]>([]);
    const [tagDropdownSearch, setTagDropdownSearch] = useState('');
    const [dropdownTop, setDropdownTop] = useState(0);
    const tagsTextareaRef = useRef<HTMLTextAreaElement>(null);

    const [rolesJuridico, setRolesJuridico] = useState<Role[]>([]);
    const [rolesAdmin, setRolesAdmin] = useState<Role[]>([]);
    
    // Cargo Tabs & Filters
    const [cargosTab, setCargosTab] = useState<'Judiciário' | 'Administrativo'>('Judiciário');
    const [cargoFilterType, setCargoFilterType] = useState<'Geral' | 'Sócio' | 'Líder'>('Geral');
    const [cargoFilterValue, setCargoFilterValue] = useState<string>('');
    const [editingTagsValue, setEditingTagsValue] = useState<string>('');

    // Tags Management State
    const [tagDataList, setTagDataList] = useState<TagData[]>([]);
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<{ oldTag: string, newTag: string, area?: 'Jurídica' | 'Administrativa' | 'Ambas' } | null>(null);
    const [tagToDelete, setTagToDelete] = useState<string | null>(null);
    const [isDeleteTagModalOpen, setIsDeleteTagModalOpen] = useState(false);

    // Alert Modal State
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, description?: string, variant?: 'success' | 'error' | 'warning' | 'info' }>({ isOpen: false, title: '' });
    const showAlert = (title: string, description?: string, variant: 'success' | 'error' | 'warning' | 'info' = 'error') => {
        setAlertConfig({ isOpen: true, title, description, variant });
    };
    const hideAlert = () => setAlertConfig(prev => ({ ...prev, isOpen: false }));

    useEffect(() => {
        if (activeView === 'bolsas') {
            fetchRules();
        } else if (activeView === 'cargos') {
            fetchRoles();
            fetchTags();
        } else if (activeView === 'tags') {
            fetchTagSet();
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
            const { data, error } = await supabase.from('perfil_tags').select('tag, area').order('tag');
            if (!error && data) {
                setAvailableTags(data);
            }
        } catch (e) {
            console.error('Error fetching tags:', e);
        }
    };

    const fetchTagSet = async (backgroundLoad = false) => {
        if (!backgroundLoad) setLoading(true);
        try {
            const { data, error } = await supabase.from('perfil_tags').select('*').order('tag', { ascending: true });
            if (!error && data) {
                setTagDataList(data);
            }
        } catch (e) {
            console.error('Error fetching tag data:', e);
        } finally {
            if (!backgroundLoad) setLoading(false);
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
            showAlert('Erro', 'Ocorreu um erro ao salvar a regra. Tente novamente.', 'error');
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
            showAlert('Erro', 'Ocorreu um erro ao excluir a regra. Tente novamente.', 'error');
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

    const getTagsForSelection = (roleText: string | undefined | null) => {
        const parsed = parseRoleTags(roleText);
        let key = 'general';
        if (cargoFilterType === 'Sócio' && cargoFilterValue) key = `socio:${cargoFilterValue}`;
        if (cargoFilterType === 'Líder' && cargoFilterValue) key = `lider:${cargoFilterValue}`;
        return parsed[key] || '';
    };

    const handleOpenRoleModal = (role: Role) => {
        setEditingRole({ ...role });
        setEditingTagsValue(getTagsForSelection(role.default_tags));
        setIsRoleModalOpen(true);
    };

    const handleCloseRoleModal = () => {
        setIsRoleModalOpen(false);
        setEditingRole(null);
        setIsTagging(false);
        setTagSearch('');
        setEditingTagsValue('');
    };

    const handleTagsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!editingRole) return;

        const text = e.target.value;
        const position = e.target.selectionStart;
        setEditingTagsValue(text);

        const lastAtSymbol = text.lastIndexOf('@', position - 1);
        const lastNewLine = text.lastIndexOf('\n', position - 1);

        const bound = lastNewLine;
        if (lastAtSymbol > bound) {
            setIsTagging(true);
            setTagSearch(text.substring(lastAtSymbol + 1, position));
            setCursorPosition(lastAtSymbol);

            // Calcular posição vertical do cursor
            const textBeforeCursor = text.substring(0, position);
            const lineNumber = textBeforeCursor.split('\n').length;
            const lineHeight = 20;
            const paddingTop = 12; // p-3
            const scrollTop = e.target.scrollTop || 0;
            setDropdownTop(paddingTop + (lineNumber * lineHeight) - scrollTop);
        } else {
            setIsTagging(false);
        }
    };

    const insertRoleTag = (tagText: string) => {
        if (!editingRole || typeof editingRole.default_tags !== 'string') return;

        const currentText = editingTagsValue;
        const beforeTag = currentText.substring(0, cursorPosition);
        const nextNewLine = currentText.indexOf('\n', cursorPosition);
        const afterTag = nextNewLine !== -1 ? currentText.substring(nextNewLine) : '';

        const newText = `${beforeTag}${tagText}${afterTag}`;

        setEditingTagsValue(newText);
        setIsTagging(false);
        setTagSearch('');
        setTagDropdownSearch('');
    };

    const handleSaveRole = async () => {
        if (!editingRole) return;

        setSaving(true);
        try {
            const parsed = parseRoleTags(editingRole.default_tags);
            let key = 'general';
            if (cargoFilterType === 'Sócio' && cargoFilterValue) key = `socio:${cargoFilterValue}`;
            if (cargoFilterType === 'Líder' && cargoFilterValue) key = `lider:${cargoFilterValue}`;
            parsed[key] = editingTagsValue;
            
            const newDefaultTagsStr = stringifyRoleTags(parsed);

            const payload = {
                default_tags: newDefaultTagsStr,
            };

            const { error } = await supabase.from('roles').update(payload).eq('id', editingRole.id);
            if (error) throw error;

            // Save tags to perfil_tags dictionary if they are new
            if (editingTagsValue) {
                // Determine the area of this role
                const isJuridico = rolesJuridico.some(r => r.id === editingRole.id);
                const area = isJuridico ? 'Jurídica' : 'Administrativa';

                const lines = editingTagsValue.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                if (lines.length > 0) {
                    const tagsToInsert = lines.map(t => ({ tag: t, area: area }));
                    const { error: tagError } = await supabase.from('perfil_tags').upsert(tagsToInsert, { onConflict: 'tag' });
                    if (tagError) console.error("Error upserting tags", tagError);
                }
            }

            await fetchRoles();
            handleCloseRoleModal();
        } catch (error) {
            console.error('Erro ao salvar cargos:', error);
            showAlert('Erro', 'Ocorreu um erro ao salvar as tags do cargo. Tente novamente.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // --- Tags Management Handlers ---

    const handleOpenTagModal = (tagItem?: TagData) => {
        if (tagItem) {
            setEditingTag({ oldTag: tagItem.tag, newTag: tagItem.tag, area: tagItem.area });
        } else {
            setEditingTag({ oldTag: '', newTag: '', area: 'Jurídica' });
        }
        setIsTagModalOpen(true);
    };

    const handleCloseTagModal = () => {
        setIsTagModalOpen(false);
        setEditingTag(null);
    };

    const handleSaveTag = async () => {
        if (!editingTag || !editingTag.newTag.trim() || !editingTag.area) return;

        setSaving(true);
        try {
            const newTagName = editingTag.newTag.trim();
            if (editingTag.oldTag) {
                // Update
                const { error } = await supabase
                    .from('perfil_tags')
                    .update({ tag: newTagName, area: editingTag.area })
                    .eq('tag', editingTag.oldTag);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('perfil_tags')
                    .insert([{ tag: newTagName, area: editingTag.area }]);
                if (error) throw error;
            }

            await fetchTagSet(true);

            // Only keep the modal open if we are inserting a NEW bag (so we can type multiple).
            // If editing an existing one, close it normally.
            if (!editingTag.oldTag) {
                setEditingTag({ oldTag: '', newTag: '', area: editingTag.area });
            } else {
                handleCloseTagModal();
            }
        } catch (error: any) {
            console.error('Erro ao salvar tag:', error);
            if (error.code === '23505') {
                showAlert('Tag Duplicada', 'Esta tag já existe na base de dados.', 'warning');
            } else {
                showAlert('Erro', 'Ocorreu um erro ao salvar a tag. Tente novamente.', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmDeleteTag = (tag: string) => {
        setTagToDelete(tag);
        setIsDeleteTagModalOpen(true);
    };

    const executeDeleteTag = async () => {
        if (!tagToDelete) return;

        try {
            const { error } = await supabase
                .from('perfil_tags')
                .delete()
                .eq('tag', tagToDelete);

            if (error) throw error;
            await fetchTagSet(true);
            setTagToDelete(null);
            setIsDeleteTagModalOpen(false);
        } catch (error) {
            console.error('Erro ao excluir tag:', error);
            showAlert('Erro', 'Ocorreu um erro ao excluir a tag. Tente novamente.', 'error');
        }
    };


    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 animate-in slide-in-from-top-4 duration-500 overflow-auto custom-scrollbar">
            {activeView === 'menu' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-fit">
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

                    <button
                        onClick={() => setActiveView('tags')}
                        className="group relative flex flex-col p-8 bg-white rounded-2xl border border-gray-200 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 text-left overflow-hidden h-full"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 w-14 h-14 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-inner group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                            <Tag className="h-7 w-7" />
                        </div>
                        <h3 className="relative z-10 text-xl font-black text-[#1e3a8a] mb-2 group-hover:text-[#112240]">Tags de Perfil - Gestão</h3>
                        <p className="relative z-10 text-sm text-gray-500 font-medium flex-1">Visualize, edite ou exclua tags cadastradas no banco de talentos (perfil_tags).</p>

                        <div className="relative z-10 mt-8 flex items-center gap-2 text-purple-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            Acessar Nuvem de Tags <ArrowRight className="h-4 w-4" />
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

                            <div className="flex space-x-4 mb-6 border-b border-gray-100">
                                <button onClick={() => setCargosTab('Judiciário')} className={cargosTab === 'Judiciário' ? "py-2 border-b-2 border-[#1e3a8a] text-[#1e3a8a] font-bold transition-all" : "py-2 text-gray-500 font-medium hover:text-[#1e3a8a] transition-all"}>Área Judiciária</button>
                                <button onClick={() => setCargosTab('Administrativo')} className={cargosTab === 'Administrativo' ? "py-2 border-b-2 border-[#1e3a8a] text-[#1e3a8a] font-bold transition-all" : "py-2 text-gray-500 font-medium hover:text-[#1e3a8a] transition-all"}>Área Administrativa</button>
                            </div>

                            {/* Judiciária */}
                            {cargosTab === 'Judiciário' && (
                            <div className="mb-8 animate-in fade-in duration-300">
                                <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
                                    <div className="w-full md:w-56">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Filtro de Exigência</label>
                                        <select 
                                            value={cargoFilterType} 
                                            onChange={e => { setCargoFilterType(e.target.value as any); setCargoFilterValue(''); }}
                                            className="w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl px-3 py-2.5 outline-none font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        >
                                            <option value="Geral">Cargo Geral (Padrão)</option>
                                            <option value="Sócio">Específico por Sócio</option>
                                            <option value="Líder">Específico por Líder</option>
                                        </select>
                                    </div>
                                    
                                    {cargoFilterType === 'Sócio' && (
                                        <div className="w-full md:w-72">
                                            <ManagedSelect
                                                label="Selecione o Sócio"
                                                value={cargoFilterValue}
                                                onChange={v => setCargoFilterValue(v)}
                                                tableName="partners"
                                                placeholder="Escolha um sócio..."
                                            />
                                        </div>
                                    )}
                                    
                                    {cargoFilterType === 'Líder' && (
                                        <div className="w-full md:w-72">
                                            <ManagedSelect
                                                label="Selecione o Líder"
                                                value={cargoFilterValue}
                                                onChange={v => setCargoFilterValue(v)}
                                                tableName="collaborators"
                                                placeholder="Escolha um líder..."
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider w-1/3">Cargo</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Tags (Perfil p/ {cargoFilterType})</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-right w-24">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {rolesJuridico.map((role) => (
                                                <tr key={role.id} className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-bold text-[#0a192f]">{role.name}</td>
                                                    <td className="px-6 py-4">
                                                        {(() => {
                                                            const tags = getTagsForSelection(role.default_tags);
                                                            return tags ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {tags.split('\n').filter(l => l.trim()).map((tag, i) => (
                                                                    <span key={i} className="px-1.5 py-0.5 bg-blue-50/50 text-blue-600 border border-blue-100/50 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 max-w-xs truncate">
                                                                        {tag.trim()}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">Nenhuma tag p/ este filtro</span>
                                                            )
                                                        })()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleOpenRoleModal(role)}
                                                            className={`p-1.5 rounded-lg transition-colors ${!getTagsForSelection(role.default_tags) && cargoFilterType !== 'Geral' ? 'text-gray-400 hover:bg-gray-100' : 'text-blue-600 hover:bg-blue-100'}`}
                                                            title="Editar Tags"
                                                            disabled={cargoFilterType !== 'Geral' && !cargoFilterValue}
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
                            )}

                            {/* Administrativa */}
                            {cargosTab === 'Administrativo' && (
                            <div className="mb-8 animate-in fade-in duration-300">
                                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm mt-8">
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
                                                        {(() => {
                                                            const parsed = parseRoleTags(role.default_tags);
                                                            const tags = parsed.general;
                                                            return tags ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {tags.split('\n').filter(l => l.trim()).map((tag, i) => (
                                                                    <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 max-w-xs truncate">
                                                                        {tag.trim()}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">Nenhuma tag cadastrada</span>
                                                            )
                                                        })()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={async () => {
                                                                // Temporarily force filter to Geral when opening modal in Administrativo tab
                                                                setCargoFilterType('Geral');
                                                                setCargoFilterValue('');
                                                                setEditingRole({ ...role });
                                                                setEditingTagsValue(parseRoleTags(role.default_tags).general || '');
                                                                setIsRoleModalOpen(true);
                                                            }}
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
                            )}

                        </div>
                    )}

                    {!loading && activeView === 'tags' && (
                        <div className="flex-1 overflow-auto mt-6">
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-[#0a192f]">Tags de Perfil - Nuvem de Talentos</h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Estas tags são usadas nos formulários de Perfil (Vagas, Cargos, Colaboradores). Edite ou exclua opções indesejadas.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleOpenTagModal()}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                                    >
                                        <Plus className="h-4 w-4" /> Nova Tag
                                    </button>
                                </div>

                                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Nome da Tag</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Área</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-right w-24">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {tagDataList.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                                                        Nenhuma tag cadastrada.
                                                    </td>
                                                </tr>
                                            ) : (
                                                tagDataList.map((tagItem) => (
                                                    <tr key={tagItem.tag} className="hover:bg-purple-50/30 transition-colors">
                                                        <td className="px-6 py-4 text-sm font-bold text-[#0a192f]">
                                                            <div className="flex items-center gap-2">
                                                                <Tag className="h-4 w-4 text-purple-500" />
                                                                {tagItem.tag}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {tagItem.area === 'Jurídica' && (
                                                                <span className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                                                                    Jurídica
                                                                </span>
                                                            )}
                                                            {tagItem.area === 'Administrativa' && (
                                                                <span className="px-2 py-1 bg-orange-50 text-orange-600 border border-orange-200 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                                                                    Administrativa
                                                                </span>
                                                            )}
                                                            {tagItem.area === 'Ambas' && (
                                                                <span className="px-2 py-1 bg-purple-50 text-purple-600 border border-purple-200 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                                                                    Ambas
                                                                </span>
                                                            )}
                                                            {!tagItem.area && (
                                                                <span className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                                                                    Geral
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleOpenTagModal(tagItem)}
                                                                    className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                                                                    title="Editar Tag"
                                                                >
                                                                    <Edit2 className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleConfirmDeleteTag(tagItem.tag)}
                                                                    className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                                    title="Excluir Tag"
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
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex justify-between items-center">
                                    Tags Padrão {cargoFilterType !== 'Geral' ? `(${cargoFilterType} específico)` : ''}
                                    <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">Use @ para pesquisar tags</span>
                                </label>
                                <div className="relative">
                                <textarea
                                    ref={tagsTextareaRef}
                                    value={editingTagsValue}
                                    onChange={handleTagsChange}
                                    placeholder="Descreva as tags (cada linha salva vira uma tag)&#10;Ex:&#10;Experiência no contencioso cível&#10;Legalone&#10;&#10;Dica: Use @ para buscar na nuvem de talentos"
                                    className="w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-3 outline-none font-medium transition-all shadow-sm h-48 resize-none"
                                />

                                {/* Sub-menu for @ tags */}
                                {isTagging && (
                                    <div className="absolute left-0 w-full bg-white rounded-xl shadow-xl border border-gray-100 z-10 max-h-64 overflow-hidden flex flex-col" style={{ top: `${dropdownTop}px` }}>
                                        <div className="px-2 py-2 border-b border-gray-100 sticky top-0 bg-white">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar por palavra-chave..."
                                                    value={tagDropdownSearch}
                                                    onChange={(e) => setTagDropdownSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none font-medium bg-gray-50"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div className="overflow-y-auto flex-1">
                                            {availableTags
                                                .filter(t => {
                                                    // Filter by text match
                                                    if (!t.tag.toLowerCase().includes((tagDropdownSearch || tagSearch).toLowerCase())) return false;
                                                    // Filter by area match
                                                    if (editingRole) {
                                                        const isJuridico = rolesJuridico.some(r => r.id === editingRole.id);
                                                        const roleArea = isJuridico ? 'Jurídica' : 'Administrativa';
                                                        if (t.area && t.area !== 'Ambas' && t.area !== roleArea) return false;
                                                    }
                                                    return true;
                                                })
                                                .map(tagItem => (
                                                    <button
                                                        key={tagItem.tag}
                                                        onClick={() => insertRoleTag(tagItem.tag)}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-sm text-[#0a192f] font-medium border-b border-gray-50 last:border-0"
                                                    >
                                                        <Tag className="h-4 w-4 text-blue-500" />
                                                        {tagItem.tag}
                                                    </button>
                                                ))
                                            }
                                            {availableTags.filter(t => t.tag.toLowerCase().includes((tagDropdownSearch || tagSearch).toLowerCase())).length === 0 && (
                                                <div className="px-4 py-3 text-sm text-gray-500 italic">
                                                    Nenhuma tag cadastrada com "{tagDropdownSearch || tagSearch}"... Quando você salvar, ela será criada!
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                </div>
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

            {/* Modal - Tag Gestao */}
            {isTagModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-lg font-bold text-[#1e3a8a]">
                                {editingTag?.oldTag ? 'Editar Tag' : 'Nova Tag'}
                            </h3>
                            <button
                                onClick={handleCloseTagModal}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-purple-600">Nome da Tag</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2.5 mt-1.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#0a192f] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                                        value={editingTag?.newTag || ''}
                                        onChange={(e) => setEditingTag({ ...editingTag!, newTag: e.target.value })}
                                        placeholder="Ex: Experiência em Contencioso"
                                        autoFocus
                                    />
                                    {editingTag?.oldTag && (
                                        <p className="text-[10px] font-medium text-amber-600 mt-2">
                                            * Alterar o nome desta tag só mudará como ela aparece nas futuras buscas (@). Perfis antigos salvos continuam com o texto anterior.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-purple-600">Área de Atuação</label>
                                    <div className="mt-2 flex gap-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="tagArea"
                                                value="Jurídica"
                                                checked={editingTag?.area === 'Jurídica'}
                                                onChange={() => setEditingTag({ ...editingTag!, area: 'Jurídica' })}
                                                className="text-purple-600 focus:ring-purple-500 w-4 h-4"
                                            />
                                            <span className="text-sm font-medium text-gray-700">Jurídica</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="tagArea"
                                                value="Administrativa"
                                                checked={editingTag?.area === 'Administrativa'}
                                                onChange={() => setEditingTag({ ...editingTag!, area: 'Administrativa' })}
                                                className="text-purple-600 focus:ring-purple-500 w-4 h-4"
                                            />
                                            <span className="text-sm font-medium text-gray-700">Administrativa</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="tagArea"
                                                value="Ambas"
                                                checked={editingTag?.area === 'Ambas'}
                                                onChange={() => setEditingTag({ ...editingTag!, area: 'Ambas' })}
                                                className="text-purple-600 focus:ring-purple-500 w-4 h-4"
                                            />
                                            <span className="text-sm font-medium text-gray-700">Ambas</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
                            <button
                                onClick={handleCloseTagModal}
                                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveTag}
                                disabled={saving || !editingTag?.newTag.trim()}
                                className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Salvar Tag
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

            <ConfirmationModal
                isOpen={isDeleteTagModalOpen}
                onClose={() => setIsDeleteTagModalOpen(false)}
                onConfirm={executeDeleteTag}
                title="Excluir Tag"
                description={`Tem certeza que deseja excluir a tag "${tagToDelete}"? Ela não aparecerá mais como sugestão, mas perfis antigos não serão alterados.`}
                confirmText="Excluir"
                cancelText="Cancelar"
                variant="danger"
            />

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={hideAlert}
                title={alertConfig.title}
                description={alertConfig.description}
                variant={alertConfig.variant}
            />
        </div>
    );
}
