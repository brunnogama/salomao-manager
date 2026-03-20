import { useState, useEffect, useRef } from 'react'
import { Vaga } from '../../../types/controladoria'
import {
    Edit2,
    Briefcase,
    AlertCircle,
    Save,
    Tag,
    Search,
    Info,
    Users,
    FileText,
    CheckSquare,
    GraduationCap,
    Monitor,
    Calculator,
    Landmark,
    Coffee,
    Folder,
    Globe,
    Scale,
    UsersRound,
    ChartPie,
    Package,
    Baby,
    Mail,
    Car,
    Send,
    Headset,
    NotebookTabs
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { ManagedSelect } from '../../crm/ManagedSelect'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { SearchableMultiSelect } from '../../crm/SearchableMultiSelect'
import { differenceInDays, differenceInMonths, isValid } from 'date-fns'
import { ATUACOES_ADMINISTRATIVA, CARGOS_ADMINISTRATIVA, ATUACOES_JURIDICA, CARGOS_JURIDICA } from '../utils/cargosAtuacoesUtils'
import { CollaboratorModalLayout } from './CollaboratorLayouts'

interface VagaFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    vagaId?: string | null;
    onSuccess?: () => void;
    viewMode?: boolean;
    onEdit?: (id: string) => void;
}

const getRoleAppearance = (roleName: string, atuacaoStr?: string) => {
    const norm = ((roleName || '') + ' ' + (atuacaoStr || '')).toLowerCase();
    
    if (norm.includes('gerente de rh') || norm.includes('gerente recursos humanos')) {
      return { Icon: UsersRound, colorClass: 'bg-pink-50 text-pink-600 border-pink-200' };
    }
    if (norm.includes('controller')) {
      return { Icon: ChartPie, colorClass: 'bg-orange-50 text-orange-600 border-orange-200' };
    }
    if (norm.includes('gerente de operações') || norm.includes('gerente de operacoes')) {
      return { Icon: Package, colorClass: 'bg-amber-50 text-amber-600 border-amber-200' };
    }
    if (norm.includes('jovem aprendiz')) {
      return { Icon: Baby, colorClass: 'bg-green-50 text-green-600 border-green-200' };
    }
    if (norm.includes('mensageiro')) {
      return { Icon: Mail, colorClass: 'bg-blue-50 text-blue-600 border-blue-200' };
    }
    if (norm.includes('motorista')) {
      return { Icon: Car, colorClass: 'bg-slate-50 text-slate-600 border-slate-200' };
    }
    if (norm.includes('portador')) {
      return { Icon: Send, colorClass: 'bg-cyan-50 text-cyan-600 border-cyan-200' };
    }
    if (norm.includes('recepcionista') || norm.includes('recepção') || norm.includes('telefonista') || norm.includes('atendente')) {
      return { Icon: Headset, colorClass: 'bg-sky-50 text-sky-600 border-sky-200' };
    }
    if (norm.includes('secretária') || norm.includes('secretaria')) {
      return { Icon: NotebookTabs, colorClass: 'bg-indigo-50 text-indigo-600 border-indigo-200' };
    }
    if (norm.includes('advogad') || norm.includes('paralegal') || norm.includes('jurídic') || norm.includes('juridic') || norm.includes('sócio') || norm.includes('socio')) {
      return { Icon: Scale, colorClass: 'bg-indigo-50 text-indigo-600 border-indigo-200' };
    }
    if (norm.includes('estagiário') || norm.includes('estagiario') || norm.includes('trainee')) {
      return { Icon: GraduationCap, colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
    }
    if (norm.includes('ti ') || norm.includes('tecnologia') || norm.startsWith('ti') || norm.includes('dados') || norm.includes('desenvolvedor') || norm.includes('dev') || norm.includes('suporte')) {
      return { Icon: Monitor, colorClass: 'bg-purple-50 text-purple-600 border-purple-200' };
    }
    if (norm.includes('fiscal') || norm.includes('tributário') || norm.includes('tributario') || norm.includes('imposto')) {
      return { Icon: Calculator, colorClass: 'bg-amber-50 text-amber-600 border-amber-200' };
    }
    if (norm.includes('financeiro') || norm.includes('faturamento') || norm.includes('cobrança') || norm.includes('contabil') || norm.includes('contábil')) {
      return { Icon: Landmark, colorClass: 'bg-teal-50 text-teal-600 border-teal-200' };
    }
    if (norm.includes('rh') || norm.includes('gente') || norm.includes('departamento pessoal') || norm.includes('dp') || norm.includes('recrutamento')) {
      return { Icon: Users, colorClass: 'bg-pink-50 text-pink-600 border-pink-200' };
    }
    if (norm.includes('copeira') || norm.includes('limpeza') || norm.includes('serviços gerais')) {
      return { Icon: Coffee, colorClass: 'bg-stone-50 text-stone-600 border-stone-200' };
    }
    if (norm.includes('arquivo') || norm.includes('administrativo') || norm.includes('auxiliar') || norm.includes('assistente')) {
      return { Icon: Folder, colorClass: 'bg-blue-50 text-blue-600 border-blue-200' };
    }
    if (norm.includes('marketing') || norm.includes('comunicação') || norm.includes('designer')) {
      return { Icon: Globe, colorClass: 'bg-rose-50 text-rose-600 border-rose-200' };
    }
    
    return { Icon: Briefcase, colorClass: 'bg-slate-50 text-slate-600 border-slate-200' };
}

export function VagaFormModal({ isOpen, onClose, vagaId, onSuccess, viewMode, onEdit }: VagaFormModalProps) {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState(1)
    
    // Extendida com entrevistados cache UI se não tivermos no BD
    const [formData, setFormData] = useState<Partial<Vaga> & { entrevistados?: string[] }>({
        vaga_id_text: '',
        quantidade: 1,
        status: 'Aberta',
        perfil: '',
        entrevistados: []
    })

    // Tagging system state
    const [isTagging, setIsTagging] = useState(false)
    const [tagSearch, setTagSearch] = useState('')
    const [cursorPosition, setCursorPosition] = useState(0)
    const [availableTags, setAvailableTags] = useState<{ tag: string, area?: string }[]>([])
    const [tagDropdownSearch, setTagDropdownSearch] = useState('')
    const [dropdownTop, setDropdownTop] = useState(0)
    const perfilTextareaRef = useRef<HTMLTextAreaElement>(null)

    // Data for UI lookup
    const [rolesList, setRolesList] = useState<{id: string, name: string}[]>([])
    const [atuacoesList, setAtuacoesList] = useState<{id: string, name: string}[]>([])
    const [hiringReasons, setHiringReasons] = useState<{id: string, name: string}[]>([])
    const [availableCandidates, setAvailableCandidates] = useState<any[]>([])
    
    // UI state for Candidatos tab
    const [selectedCandidateToAdd, setSelectedCandidateToAdd] = useState('')

    // Recrutadoras options
    const recrutadorasOptions = [
        { id: 'Karina Reis dos Prazeres', name: 'Karina Reis dos Prazeres' },
        { id: 'Tatiana Gonçalves Gomes', name: 'Tatiana Gonçalves Gomes' }
    ]

    const areaOptions = [
        { id: 'Administrativa', name: 'Administrativa' },
        { id: 'Jurídica', name: 'Jurídica' }
    ]

    const tipoOptions = [
        { id: 'Temporária', name: 'Temporária' },
        { id: 'Definitiva', name: 'Definitiva' }
    ]

    const statusOptions = [
        { id: 'Aguardando Autorização', name: 'Aguardando Autorização' },
        { id: 'Aberta', name: 'Aberta' },
        { id: 'Congelada', name: 'Congelada' },
        { id: 'Fechada', name: 'Fechada' }
    ]

    const steps = [
        { id: 1, label: 'Informações Principais', icon: Info },
        { id: 2, label: 'Acompanhamento e Liderança', icon: Users },
        { id: 3, label: 'Detalhes e Perfil Desejado', icon: FileText },
        { id: 4, label: 'Entrevistados para a vaga', icon: CheckSquare },
    ]

    useEffect(() => {
        if (isOpen) {
            setActiveTab(1)
            fetchTags()
            loadLookupData()
            if (vagaId) {
                fetchVaga(vagaId)
            } else {
                setFormData({
                    vaga_id_text: '',
                    quantidade: 1,
                    status: 'Aberta',
                    perfil: '',
                    entrevistados: []
                })
                setError(null)
            }
        }
    }, [isOpen, vagaId])

    const fetchTags = async () => {
        try {
            const { data, error } = await supabase.from('perfil_tags').select('tag, area').order('tag')
            if (!error && data) {
                setAvailableTags(data)
            }
        } catch (e) {
            console.error('Error fetching tags:', e)
        }
    }

    const loadLookupData = async () => {
        try {
            const [rolesRes, atuacoesRes, hrRes, candRes] = await Promise.all([
                supabase.from('roles').select('id, name'),
                supabase.from('atuacoes').select('id, name'),
                supabase.from('hiring_reasons').select('id, name'),
                supabase.from('candidatos').select('id, nome, role').order('nome')
            ])
            if (rolesRes.data) setRolesList(rolesRes.data)
            if (atuacoesRes.data) setAtuacoesList(atuacoesRes.data)
            if (hrRes.data) setHiringReasons(hrRes.data)
            if (candRes.data) setAvailableCandidates(candRes.data)
        } catch(e) { console.error("Error loading lookups:", e) }
    }

    const fetchVaga = async (id: string) => {
        try {
            setLoading(true)
            setError(null)

            const { data, error: dbError } = await supabase
                .from('vagas')
                .select('*')
                .eq('id', id)
                .single()

            if (dbError) throw dbError

            setFormData(data || { entrevistados: [] })
        } catch (err: any) {
            console.error('Error fetching vaga:', err)
            setError('Erro ao carregar dados da vaga.')
        } finally {
            setLoading(false)
        }
    }

    const calculateSLA = () => {
        if (!formData.data_abertura) return '-'

        try {
            const [year, month, day] = formData.data_abertura.split('-').map(Number)
            const startDate = new Date(year, month - 1, day)

            let endDate = new Date()
            if (formData.data_fechamento) {
                const [eYear, eMonth, eDay] = formData.data_fechamento.split('-').map(Number)
                endDate = new Date(eYear, eMonth - 1, eDay)
            }

            if (!isValid(startDate) || !isValid(endDate)) return '-'

            let months = differenceInMonths(endDate, startDate)
            const tempDate = new Date(startDate)
            tempDate.setMonth(tempDate.getMonth() + months)
            let days = differenceInDays(endDate, tempDate)

            if (days < 0) {
                months -= 1
                tempDate.setMonth(tempDate.getMonth() - 1)
                days = differenceInDays(endDate, tempDate)
            }

            if (months === 0 && days === 0) return 'Hoje'

            let result = []
            if (months > 0) result.push(`${months} ${months === 1 ? 'mês' : 'meses'}`)
            if (days > 0) result.push(`${days} ${days === 1 ? 'dia' : 'dias'}`)

            return result.join(' e ')
        } catch (e) {
            return '-'
        }
    }

    const maskCurrency = (value: string | number | undefined) => {
        if (value === undefined || value === null || value === '') return '';
        const numValue = Number(value);
        if (isNaN(numValue)) return '';

        return numValue.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        const numValue = rawValue ? parseInt(rawValue, 10) / 100 : undefined;
        setFormData({ ...formData, remuneracao: numValue });
    }

    const handlePerfilChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        const position = e.target.selectionStart;
        setFormData({ ...formData, perfil: text });

        const lastAtSymbol = text.lastIndexOf('@', position - 1);
        const lastNewLine = text.lastIndexOf('\n', position - 1);

        const bound = lastNewLine;
        if (lastAtSymbol > bound) {
            setIsTagging(true);
            setTagSearch(text.substring(lastAtSymbol + 1, position));
            setCursorPosition(lastAtSymbol);

            const textBeforeCursor = text.substring(0, position);
            const lineNumber = textBeforeCursor.split('\n').length;
            const lineHeight = 20;
            const paddingTop = 12; 
            const scrollTop = e.target.scrollTop || 0;
            setDropdownTop(paddingTop + (lineNumber * lineHeight) - scrollTop);
        } else {
            setIsTagging(false);
        }
    }

    const insertTag = (tagText: string) => {
        if (!formData.perfil) return;
        const currentText = formData.perfil;
        const beforeTag = currentText.substring(0, cursorPosition);
        const nextNewLine = currentText.indexOf('\n', cursorPosition);
        const afterTag = nextNewLine !== -1 ? currentText.substring(nextNewLine) : '';
        const newText = `${beforeTag}${tagText}${afterTag}`;

        setFormData({ ...formData, perfil: newText });
        setIsTagging(false);
        setTagSearch('');
        setTagDropdownSearch('');
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            setError(null)

            const payload: any = { ...formData }
            if (!payload.id) {
                delete payload.id;
                delete payload.vaga_id_text;
            }

            if (vagaId) {
                const { error: updateError } = await supabase
                    .from('vagas')
                    .update({
                        ...payload,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', vagaId)
                if (updateError) throw updateError
            } else {
                const { error: insertError } = await supabase
                    .from('vagas')
                    .insert([payload])
                if (insertError) throw insertError
            }

            if (payload.perfil) {
                const lines = payload.perfil.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
                if (lines.length > 0) {
                    const areaForTags = payload.area || null;
                    const tagsToInsert = lines.map((t: string) => ({ tag: t, area: areaForTags }));
                    const { error: tagError } = await supabase.from('perfil_tags').upsert(tagsToInsert, { onConflict: 'tag' });
                    if (tagError) console.error("Error upserting tags", tagError);
                }
            }

            if (payload.status === 'Fechada' && payload.candidato_aprovado_id) {
                try {
                    const { data: candData } = await supabase
                        .from('candidatos')
                        .select('nome, email, perfil')
                        .eq('id', payload.candidato_aprovado_id)
                        .single();

                    if (candData) {
                        let query = supabase.from('collaborators').select('id');
                        if (candData.email) {
                            query = query.or(`email.eq.${candData.email},name.ilike.${candData.nome}`);
                        } else {
                            query = query.ilike('name', candData.nome);
                        }

                        const { data: existingColab } = await query.maybeSingle();

                        const commonFields = {
                            status: 'Pré-Cadastro',
                            role: payload.role_id ? payload.role_id.toString() : null,
                            atuacao: payload.atuacao_id ? payload.atuacao_id.toString() : null,
                            local: payload.location_id ? payload.location_id.toString() : null,
                            leader_id: payload.leader_id ? payload.leader_id.toString() : null,
                            lider_equipe: payload.leader_id ? payload.leader_id.toString() : null,
                            partner_id: payload.partner_id ? payload.partner_id.toString() : null,
                            hire_date: payload.data_aprovacao_gestor || new Date().toISOString().split('T')[0],
                            perfil: candData.perfil || null,
                            candidato_id: payload.candidato_aprovado_id
                        };

                        if (!existingColab) {
                            const newColab = {
                                ...commonFields,
                                name: candData.nome,
                                email: candData.email || null,
                            };
                            const { error: colabErr } = await supabase.from('collaborators').insert([newColab]);
                            if (colabErr) console.error("Error inserting auto colab", colabErr);
                        } else {
                            const { error: updateColabErr } = await supabase
                                .from('collaborators')
                                .update(commonFields)
                                .eq('id', existingColab.id);
                            if (updateColabErr) console.error("Error updating existing colab with candidate data", updateColabErr);
                        }
                    }
                } catch (e) {
                    console.error("Error auto-registering candidate as collaborator:", e);
                }
            }

            if (onSuccess) onSuccess()
            onClose()
        } catch (err: any) {
            console.error('Error saving vaga:', err)
            setError(err.message || 'Erro ao salvar a vaga. Verifique os dados.')
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null;

    const isSubstituicao = hiringReasons.find(hr => String(hr.id) === String(formData.hiring_reason_id))?.name?.toLowerCase().includes('substituição') || false

    const currentRoleName = rolesList.find(r => String(r.id) === String(formData.role_id))?.name || ''
    const currentAtuacaoName = atuacoesList.find(a => String(a.id) === String(formData.atuacao_id))?.name || ''
    const { Icon: HeaderIcon, colorClass: headerColorClass } = getRoleAppearance(currentRoleName, currentAtuacaoName)

    return (
        <CollaboratorModalLayout
            title={vagaId ? "Editar Vaga" : "Nova Vaga"}
            onClose={onClose}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentSteps={steps}
            isEditMode={!!vagaId}
            sidebarContent={
                <div className="flex flex-col items-center gap-4">
                    <div className={`p-6 rounded-3xl ${headerColorClass} shadow-inner flex items-center justify-center`}>
                        <HeaderIcon className="w-16 h-16" />
                    </div>
                    <div className="text-center w-full px-2">
                        <h3 className="font-black text-[#0a192f] text-sm uppercase tracking-[0.1em] text-center w-full overflow-hidden text-ellipsis px-1">{currentRoleName || 'Vaga'}</h3>
                        <div className="flex flex-col items-center justify-center gap-2 mt-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                {formData.vaga_id_text || 'ID AUTOMÁTICO'}
                            </p>
                            {formData.sigilosa && (
                                <span className="text-[8px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded uppercase font-black tracking-widest">
                                    Sigilosa
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            }
            footer={
                <div className="flex justify-end gap-3 w-full">
                    {viewMode ? (
                        <>
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                Fechar
                            </button>
                            {onEdit && vagaId && (
                                <button
                                    onClick={() => { onClose(); onEdit(vagaId); }}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/30 transition-all font-bold"
                                >
                                    <Edit2 className="h-4 w-4" />
                                    Editar Vaga
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || loading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/30 transition-all disabled:opacity-50"
                            >
                                {saving ? (
                                    <span className="flex items-center gap-2">
                                        <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Salvando...
                                    </span>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        {vagaId ? 'Salvar Alterações' : 'Criar Vaga'}
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            }
        >
                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex gap-3 text-red-600">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <p className="text-xs font-medium">{error}</p>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex justify-center items-center py-20 min-h-[650px]">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div>
                            </div>
                        ) : (
                            <div className="min-h-[650px]">
                                {/* TAB 1 */}
                                {activeTab === 1 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <section>
                                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-6">Status da Vaga</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <SearchableSelect
                                                        label="Status"
                                                        value={formData.status || 'Aberta'}
                                                        onChange={(v) => setFormData({ ...formData, status: v as any })}
                                                        options={statusOptions}
                                                        uppercase={false}
                                                    />
                                                </div>
                                                <div className="flex flex-col justify-end pb-[2px]">
                                                    <label className="flex items-center gap-2 cursor-pointer mt-1 ml-1 w-max bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 hover:bg-red-100 transition-colors shadow-sm focus-within:ring-2 focus-within:ring-red-200">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.sigilosa || false}
                                                            onChange={e => setFormData({ ...formData, sigilosa: e.target.checked })}
                                                            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-600 cursor-pointer"
                                                        />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-red-600 pt-[1px]">
                                                            Vaga Sigilosa
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                            
                                            {formData.status === 'Fechada' && (
                                                <div className="mt-6 p-5 bg-green-50/50 rounded-2xl border border-green-100/50 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <h3 className="text-[9px] font-black text-green-700 uppercase tracking-[0.2em] border-b border-green-200/50 pb-2 mb-4">Fechamento da Vaga</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Data Fechamento</label>
                                                            <input
                                                                type="date"
                                                                value={formData.data_fechamento || ''}
                                                                onChange={e => setFormData({ ...formData, data_fechamento: e.target.value || null as any })}
                                                                className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Data Aprovação Pelo Gestor</label>
                                                            <input
                                                                type="date"
                                                                value={formData.data_aprovacao_gestor || ''}
                                                                onChange={e => setFormData({ ...formData, data_aprovacao_gestor: e.target.value })}
                                                                className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
                                                            />
                                                        </div>

                                                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col justify-center">
                                                            <p className="text-[9px] font-black text-blue-800 uppercase tracking-widest mb-1">SLA</p>
                                                            <p className="text-sm font-bold text-[#1e3a8a]">{calculateSLA()}</p>
                                                        </div>

                                                        <ManagedSelect
                                                            label="Candidato Aprovado"
                                                            value={formData.candidato_aprovado_id || ''}
                                                            onChange={v => setFormData({ ...formData, candidato_aprovado_id: v })}
                                                            tableName="candidatos"
                                                            orderBy="nome"
                                                            nameColumn="nome"
                                                            placeholder="Selecione o candidato aprovado"
                                                        />

                                                        <ManagedSelect
                                                            label="Aprovado por (Sócio)"
                                                            value={formData.aprovador_id || ''}
                                                            onChange={v => setFormData({ ...formData, aprovador_id: v })}
                                                            tableName="partners"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </section>

                                        <section>
                                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-6">Detalhamento</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <SearchableSelect
                                                    label="Área"
                                                    value={formData.area || ''}
                                                    onChange={(v) => {
                                                        setFormData({ ...formData, area: v });
                                                    }}
                                                    options={areaOptions}
                                                    uppercase={false}
                                                />

                                                <ManagedSelect
                                                    label="Cargo"
                                                    value={formData.role_id?.toString() || ''}
                                                    onChange={async (v) => {
                                                        if (!v) {
                                                            setFormData({ ...formData, role_id: v });
                                                            return;
                                                        }
                                                        if (!formData.perfil || formData.perfil.trim() === '') {
                                                            try {
                                                                const { data, error } = await supabase
                                                                    .from('roles')
                                                                    .select('default_tags')
                                                                    .eq('id', v)
                                                                    .single();

                                                                if (!error && data && data.default_tags) {
                                                                    setFormData({ ...formData, role_id: v, perfil: data.default_tags });
                                                                } else {
                                                                    setFormData({ ...formData, role_id: v });
                                                                }
                                                            } catch (err) {
                                                                console.error("Error fetching role default tags:", err);
                                                                setFormData({ ...formData, role_id: v });
                                                            }
                                                        } else {
                                                            setFormData({ ...formData, role_id: v });
                                                        }
                                                    }}
                                                    tableName="roles"
                                                    disabled={viewMode || !formData.area}
                                                    clientFilter={(item: any) => {
                                                        const roleName = item.name;
                                                        if (formData.area === 'Jurídica') return CARGOS_JURIDICA.includes(roleName);
                                                        if (formData.area === 'Administrativa') return CARGOS_ADMINISTRATIVA.includes(roleName);
                                                        return true;
                                                    }}
                                                />

                                                <SearchableMultiSelect
                                                    label="Atuação"
                                                    value={formData.atuacao_id?.toString() || ''}
                                                    onChange={v => setFormData({ ...formData, atuacao_id: v })}
                                                    table="atuacoes"
                                                    allowCustom={true}
                                                    disabled={viewMode || !formData.area || !formData.role_id}
                                                    clientFilter={(item: any) => {
                                                        const name = item.name || item;
                                                        if (formData.area === 'Jurídica') return ATUACOES_JURIDICA.includes(name);
                                                        if (formData.area === 'Administrativa') return ATUACOES_ADMINISTRATIVA.includes(name);
                                                        return true;
                                                    }}
                                                />

                                                <ManagedSelect
                                                    label="Local"
                                                    value={formData.location_id?.toString() || ''}
                                                    onChange={v => setFormData({ ...formData, location_id: v })}
                                                    tableName="locations"
                                                    disabled={viewMode}
                                                />

                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Quantidade</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={formData.quantidade || 1}
                                                        onChange={e => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 1 })}
                                                        className={`w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none font-medium transition-all shadow-sm ${viewMode ? 'bg-gray-50' : ''}`}
                                                        disabled={viewMode}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Remuneração</label>
                                                    <input
                                                        type="text"
                                                        value={maskCurrency(formData.remuneracao)}
                                                        onChange={handleCurrencyChange}
                                                        placeholder="R$ 0,00"
                                                        className={`w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none font-medium transition-all shadow-sm ${viewMode ? 'bg-gray-50' : ''}`}
                                                        disabled={viewMode}
                                                    />
                                                </div>

                                                <ManagedSelect
                                                    label="Motivo da Contratação"
                                                    value={formData.hiring_reason_id?.toString() || ''}
                                                    onChange={v => setFormData({ ...formData, hiring_reason_id: v })}
                                                    tableName="hiring_reasons"
                                                    disabled={viewMode}
                                                />

                                                <SearchableSelect
                                                    label="Tipo"
                                                    value={formData.tipo || ''}
                                                    onChange={(v) => setFormData({ ...formData, tipo: v as any })}
                                                    options={tipoOptions}
                                                    uppercase={false}
                                                    disabled={viewMode}
                                                />

                                                {isSubstituicao && (
                                                    <ManagedSelect
                                                        label="Colaborador Substituído"
                                                        value={formData.replaced_collaborator_id || ''}
                                                        onChange={v => setFormData({ ...formData, replaced_collaborator_id: v })}
                                                        tableName="collaborators"
                                                        disabled={viewMode}
                                                    />
                                                )}

                                            </div>
                                        </section>
                                    </div>
                                )}

                                {/* TAB 2 */}
                                {activeTab === 2 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <section>
                                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-6">Acompanhamento e Liderança</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <ManagedSelect
                                                    label="Sócio Responsável"
                                                    value={formData.partner_id || ''}
                                                    onChange={v => setFormData({ ...formData, partner_id: v })}
                                                    tableName="partners"
                                                    disabled={viewMode}
                                                />

                                                <ManagedSelect
                                                    label="Líder Direto"
                                                    value={formData.leader_id || ''}
                                                    onChange={v => setFormData({ ...formData, leader_id: v })}
                                                    tableName="collaborators"
                                                    disabled={viewMode || !formData.partner_id}
                                                />

                                                <SearchableSelect
                                                    label="Recrutadora"
                                                    value={formData.recrutadora || ''}
                                                    onChange={(v) => setFormData({ ...formData, recrutadora: v })}
                                                    options={recrutadorasOptions}
                                                    uppercase={false}
                                                    disabled={viewMode}
                                                />

                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Data Abertura</label>
                                                    <input
                                                        type="date"
                                                        value={formData.data_abertura || ''}
                                                        onChange={e => setFormData({ ...formData, data_abertura: e.target.value || null as any })}
                                                        className={`w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${viewMode ? 'bg-gray-50' : ''}`}
                                                        disabled={viewMode}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Prazo</label>
                                                    <input
                                                        type="date"
                                                        value={formData.data_prazo || ''}
                                                        onChange={e => setFormData({ ...formData, data_prazo: e.target.value || null as any })}
                                                        className={`w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${viewMode ? 'bg-gray-50' : ''}`}
                                                        disabled={viewMode}
                                                    />
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {/* TAB 3 */}
                                {activeTab === 3 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <section>
                                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-6 flex items-center gap-2">Detalhes e Perfil Desejado</h3>
                                            <div className="grid grid-cols-1 gap-6">
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex justify-between items-center">
                                                        Perfil
                                                        <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">Use @ para pesquisar tags</span>
                                                    </label>
                                                    <div className="relative">
                                                        <textarea
                                                            ref={perfilTextareaRef}
                                                            value={formData.perfil || ''}
                                                            onChange={handlePerfilChange}
                                                            placeholder="Descreva o perfil (cada linha salva vira uma tag)&#10;Ex:&#10;Experiência no contencioso cível&#10;Legalone&#10;&#10;Dica: Use @ para buscar na nuvem de talentos"
                                                            className={`w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-3 outline-none font-medium transition-all shadow-sm min-h-[250px] resize-none ${viewMode ? 'bg-gray-50' : ''}`}
                                                            disabled={viewMode}
                                                        />

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
                                                                            if (!t.tag.toLowerCase().includes((tagDropdownSearch || tagSearch).toLowerCase())) return false;
                                                                            if (formData.area && t.area && t.area !== 'Ambas' && t.area !== formData.area) return false;
                                                                            return true;
                                                                        })
                                                                        .map(tagItem => (
                                                                            <button
                                                                                key={tagItem.tag}
                                                                                onClick={() => insertTag(tagItem.tag)}
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

                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Observações</label>
                                                    <textarea
                                                        value={formData.observacoes || ''}
                                                        onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                                                        className={`w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-3 outline-none font-medium transition-all shadow-sm min-h-[250px] resize-none ${viewMode ? 'bg-gray-50' : ''}`}
                                                        disabled={viewMode}
                                                    />
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {/* TAB 4 */}
                                {activeTab === 4 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <section>
                                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-6">Entrevistados para a vaga</h3>
                                            <div className="flex items-end gap-4 mb-6">
                                                <div className="flex-1">
                                                    <ManagedSelect
                                                        label="Adicionar Candidato"
                                                        value={selectedCandidateToAdd}
                                                        onChange={v => setSelectedCandidateToAdd(v)}
                                                        tableName="candidatos"
                                                        orderBy="nome"
                                                        nameColumn="nome"
                                                        placeholder="Busque pelo nome..."
                                                        disabled={viewMode}
                                                    />
                                                </div>
                                                {!viewMode && (
                                                    <button 
                                                        onClick={() => {
                                                            if(selectedCandidateToAdd && (!formData.entrevistados || !formData.entrevistados.includes(selectedCandidateToAdd))) {
                                                                setFormData({...formData, entrevistados: [...(formData.entrevistados || []), selectedCandidateToAdd]})
                                                                setSelectedCandidateToAdd('')
                                                            }
                                                        }}
                                                        className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold whitespace-nowrap h-[42px] hover:bg-[#1e3a8a]/90 transition-colors shadow-sm"
                                                    >
                                                        Adicionar
                                                    </button>
                                                )}
                                            </div>

                                            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
                                                <table className="w-full text-left text-sm text-gray-500">
                                                    <thead className="bg-gray-50 text-xs text-gray-500 font-medium uppercase tracking-wider">
                                                        <tr>
                                                            <th className="px-4 py-3">Nome do Candidato</th>
                                                            <th className="px-4 py-3">Cargo/Área</th>
                                                            <th className="px-4 py-3 text-right">Ação</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {(formData.entrevistados || []).map(candId => {
                                                            const cand = availableCandidates.find(c => c.id === candId)
                                                            if (!cand) return null
                                                            
                                                            return (
                                                                <tr key={cand.id} className="hover:bg-gray-50 transition-colors">
                                                                    <td className="px-4 py-3 font-medium text-gray-900">{cand.nome}</td>
                                                                    <td className="px-4 py-3 text-xs">{cand.role || '-'}</td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        {!viewMode && (
                                                                            <button 
                                                                                onClick={() => {
                                                                                    const newIds = (formData.entrevistados || []).filter(id => id !== cand.id)
                                                                                    setFormData({...formData, entrevistados: newIds})
                                                                                }}
                                                                                className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wider"
                                                                            >
                                                                                Remover
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                        {(!formData.entrevistados || formData.entrevistados.length === 0) && (
                                                            <tr>
                                                                <td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-xs">
                                                                    Nenhum candidato selecionado para entrevista.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </section>
                                    </div>
                                )}
                            </div>
                        )}
        </CollaboratorModalLayout>
    )
}
