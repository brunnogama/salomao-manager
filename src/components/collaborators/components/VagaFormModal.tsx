import { useState, useEffect } from 'react'
import { Vaga } from '../../../types/controladoria'
import {
    X,
    Briefcase,
    AlertCircle,
    Save,
    Tag,
    Search
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { ManagedSelect } from '../../crm/ManagedSelect'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { SearchableMultiSelect } from '../../crm/SearchableMultiSelect'
import { differenceInDays, differenceInMonths, isValid } from 'date-fns'

interface VagaFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    vagaId?: string | null;
    onSuccess?: () => void;
}

export function VagaFormModal({ isOpen, onClose, vagaId, onSuccess }: VagaFormModalProps) {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState<Partial<Vaga>>({
        vaga_id_text: '',
        quantidade: 1,
        status: 'Aberta',
        perfil: ''
    })

    // Tagging system state
    const [isTagging, setIsTagging] = useState(false)
    const [tagSearch, setTagSearch] = useState('')
    const [cursorPosition, setCursorPosition] = useState(0)
    const [availableTags, setAvailableTags] = useState<{ tag: string, area?: string }[]>([])
    const [tagDropdownSearch, setTagDropdownSearch] = useState('')

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

    useEffect(() => {
        if (isOpen) {
            fetchTags()
            if (vagaId) {
                fetchVaga(vagaId)
            } else {
                setFormData({
                    vaga_id_text: '', // Generated on server
                    quantidade: 1,
                    status: 'Aberta',
                    perfil: ''
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

            // Parse and format dates correctly if needed
            setFormData(data || {})
        } catch (err: any) {
            console.error('Error fetching vaga:', err)
            setError('Erro ao carregar dados da vaga.')
        } finally {
            setLoading(false)
        }
    }

    // Calculate SLA
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

            // Calculate exact difference in months and remaining days
            let months = differenceInMonths(endDate, startDate)

            // Calculate remaining days after subtracting months
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

    // Currency Mask (R$ X.XXX,XX)
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

    // Tagging Logic
    const handlePerfilChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        const position = e.target.selectionStart;
        setFormData({ ...formData, perfil: text });

        // Check if we just typed '@'
        const lastAtSymbol = text.lastIndexOf('@', position - 1);
        const lastNewLine = text.lastIndexOf('\n', position - 1);

        // Determine if we are actively tagging (bound to current line)
        const bound = lastNewLine;
        if (lastAtSymbol > bound) {
            setIsTagging(true);
            setTagSearch(text.substring(lastAtSymbol + 1, position));
            setCursorPosition(lastAtSymbol);
        } else {
            setIsTagging(false);
        }
    }

    const insertTag = (tagText: string) => {
        if (!formData.perfil) return;
        const currentText = formData.perfil;
        const beforeTag = currentText.substring(0, cursorPosition);

        // Find where the current line ends
        const nextNewLine = currentText.indexOf('\n', cursorPosition);
        const afterTag = nextNewLine !== -1 ? currentText.substring(nextNewLine) : '';

        // Format tag (just insert text cleanly without @)
        const newText = `${beforeTag}${tagText}${afterTag}`;

        setFormData({ ...formData, perfil: newText });
        setIsTagging(false);
        setTagSearch('');
        setTagDropdownSearch('');

        // Ideally we'd refocus the textarea here, omitted for brevity
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            setError(null)

            const payload = { ...formData }
            // The trigger handles vaga_id_text on insert
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

            // Extract tags from form data and upsert to perfil_tags
            if (payload.perfil) {
                const lines = payload.perfil.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                if (lines.length > 0) {
                    const areaForTags = payload.area || null;
                    const tagsToInsert = lines.map(t => ({ tag: t, area: areaForTags }));
                    const { error: tagError } = await supabase.from('perfil_tags').upsert(tagsToInsert, { onConflict: 'tag' });
                    if (tagError) console.error("Error upserting tags", tagError);
                }
            }

            // Auto-register Candidate as Collaborator when Vaga is Fechada
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
                            lider_equipe: payload.leader_id ? payload.leader_id.toString() : null, // Legacy compatibility
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
                            // Se já existir, atualizar status e campos profissionais
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
            setError(err.message || 'Erro ao salvar a vaga.')
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">

                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-[#1e3a8a]">
                            <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-[16px] font-black text-[#0a192f] uppercase tracking-tight">
                                {vagaId ? 'Editar Vaga' : 'Nova Vaga'}
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${formData.sigilosa ? 'text-red-600' : 'text-gray-400'}`}>
                                    {formData.vaga_id_text || 'ID Automático'}
                                </p>
                                {formData.sigilosa && (
                                    <span className="text-[8px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded uppercase font-black tracking-widest">
                                        Sigilosa
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex gap-3 text-red-600">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p className="text-xs font-medium">{error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div>
                        </div>
                    ) : (
                        <div className="space-y-8">

                            {/* STATUS & IDENTIFICATION */}
                            <section>
                                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Informações Principais</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <ManagedSelect
                                        label="Cargo"
                                        value={formData.role_id?.toString() || ''}
                                        onChange={async (v) => {
                                            if (!v) {
                                                setFormData({ ...formData, role_id: v });
                                                return;
                                            }

                                            // Fetch default tags for the selected role
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
                                    />

                                    <SearchableSelect
                                        label="Área"
                                        value={formData.area || ''}
                                        onChange={(v) => setFormData({ ...formData, area: v })}
                                        options={areaOptions}
                                        uppercase={false}
                                    />

                                    <SearchableMultiSelect
                                        label="Atuação"
                                        value={formData.atuacao_id?.toString() || ''}
                                        onChange={v => setFormData({ ...formData, atuacao_id: v })}
                                        table="atuacoes"
                                        allowCustom={true}
                                    />

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Remuneração</label>
                                        <input
                                            type="text"
                                            value={maskCurrency(formData.remuneracao)}
                                            onChange={handleCurrencyChange}
                                            placeholder="R$ 0,00"
                                            className="w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none font-medium transition-all shadow-sm"
                                        />
                                    </div>

                                    <ManagedSelect
                                        label="Local"
                                        value={formData.location_id?.toString() || ''}
                                        onChange={v => setFormData({ ...formData, location_id: v })}
                                        tableName="locations"
                                    />

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Quantidade</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.quantidade || 1}
                                            onChange={e => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 1 })}
                                            className="w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none font-medium transition-all shadow-sm"
                                        />
                                    </div>

                                    <ManagedSelect
                                        label="Motivo da Contratação"
                                        value={formData.hiring_reason_id?.toString() || ''}
                                        onChange={v => setFormData({ ...formData, hiring_reason_id: v })}
                                        tableName="hiring_reasons"
                                    />

                                    <SearchableSelect
                                        label="Tipo"
                                        value={formData.tipo || ''}
                                        onChange={(v) => setFormData({ ...formData, tipo: v as any })}
                                        options={tipoOptions}
                                        uppercase={false}
                                    />

                                    <div className="flex flex-col gap-2">
                                        <ManagedSelect
                                            label="Colaborador Substituído"
                                            value={formData.replaced_collaborator_id || ''}
                                            onChange={v => setFormData({ ...formData, replaced_collaborator_id: v })}
                                            tableName="collaborators"
                                        />
                                        <label className="flex items-center gap-2 cursor-pointer mt-1 ml-1 w-max">
                                            <input
                                                type="checkbox"
                                                checked={formData.sigilosa || false}
                                                onChange={e => setFormData({ ...formData, sigilosa: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
                                            />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-red-600">
                                                Vaga Sigilosa
                                            </span>
                                        </label>
                                    </div>

                                </div>
                            </section>

                            {/* TIMELINE & RECRUITMENT */}
                            <section className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">Acompanhamento e Liderança</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <ManagedSelect
                                        label="Líder Direto"
                                        value={formData.leader_id || ''}
                                        onChange={v => setFormData({ ...formData, leader_id: v })}
                                        tableName="collaborators"
                                    />

                                    <ManagedSelect
                                        label="Sócio Responsável"
                                        value={formData.partner_id || ''}
                                        onChange={v => setFormData({ ...formData, partner_id: v })}
                                        tableName="partners"
                                    />

                                    <SearchableSelect
                                        label="Recrutadora"
                                        value={formData.recrutadora || ''}
                                        onChange={(v) => setFormData({ ...formData, recrutadora: v })}
                                        options={recrutadorasOptions}
                                        uppercase={false}
                                    />

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Data Abertura</label>
                                        <input
                                            type="date"
                                            value={formData.data_abertura || ''}
                                            onChange={e => setFormData({ ...formData, data_abertura: e.target.value || null as any })}
                                            className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Prazo</label>
                                        <input
                                            type="date"
                                            value={formData.data_prazo || ''}
                                            onChange={e => setFormData({ ...formData, data_prazo: e.target.value || null as any })}
                                            className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <div className="w-1/2">
                                            <SearchableSelect
                                                label="Status"
                                                value={formData.status || 'Aberta'}
                                                onChange={(v) => setFormData({ ...formData, status: v as any })}
                                                options={statusOptions}
                                                uppercase={false}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* DETAILS & PROFILE */}
                            <section>
                                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">Detalhes e Perfil Desejado</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex justify-between items-center">
                                            Perfil
                                            <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">Use @ para pesquisar tags</span>
                                        </label>
                                        <textarea
                                            value={formData.perfil || ''}
                                            onChange={handlePerfilChange}
                                            placeholder="Descreva o perfil (cada linha salva vira uma tag)&#10;Ex:&#10;Experiência no contencioso cível&#10;Legalone&#10;&#10;Dica: Use @ para buscar na nuvem de talentos"
                                            className="w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-3 outline-none font-medium transition-all shadow-sm h-32 resize-none"
                                        />

                                        {/* Sub-menu for @ tags */}
                                        {isTagging && (
                                            <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-gray-100 z-10 max-h-64 overflow-hidden flex flex-col">
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

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Observações</label>
                                        <textarea
                                            value={formData.observacoes || ''}
                                            onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                                            className="w-full bg-white border border-gray-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-3 outline-none font-medium transition-all shadow-sm h-32 resize-none"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* CLOSURE */}
                            {formData.status === 'Fechada' && (
                                <section className="p-5 bg-green-50/50 rounded-2xl border border-green-100/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <h3 className="text-[9px] font-black text-green-700 uppercase tracking-[0.2em] border-b border-green-200/50 pb-2 mb-4">Fechamento da Vaga</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                </section>
                            )}

                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-end px-6 py-4 bg-gray-50/50 border-t border-gray-100 shrink-0 gap-3">
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
                </div>

            </div>
        </div>
    )
}
