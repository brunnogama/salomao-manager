import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle2, User, Save, ShieldCheck } from 'lucide-react';
import { Collaborator } from '../types/controladoria';
import { DadosPessoaisSection } from '../components/collaborators/components/DadosPessoaisSection';
import { EnderecoSection } from '../components/collaborators/components/EnderecoSection';
import { DadosEscolaridadeSection } from '../components/collaborators/components/DadosEscolaridadeSection';
import { TransporteSection } from '../components/collaborators/components/TransporteSection';
import { GEDSection } from '../components/collaborators/components/GEDSection';
import { GEDDocument } from '../types/controladoria';

const maskCEP = (v: string) => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9)
const maskCPF = (v: string) => {
    v = v.replace(/\D/g, '')
    v = v.replace(/(\d{3})(\d)/, '$1.$2')
    v = v.replace(/(\d{3})(\d)/, '$1.$2')
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    return v.slice(0, 14)
}
const maskDate = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 10)
const maskRG = (v: string) => {
    v = v.replace(/\D/g, '')
    v = v.replace(/(\d{8})(\d{1})/, '$1-$2')
    return v.slice(0, 10)
}
const maskPhone = (v: string) => {
    const raw = v.replace(/\D/g, '')
    return raw.replace(/(\d{2})(\d{1,5})?(\d{1,4})?/, (_, p1, p2, p3) => {
        let result = `(${p1}`
        if (p2) result += `) ${p2}`
        if (p3) result += `-${p3}`
        return result
    }).slice(0, 15)
}
const maskCNPJ = (v: string) => {
    let val = v.replace(/\D/g, '')
    val = val.replace(/^(\d{2})(\d)/, '$1.$2')
    val = val.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    val = val.replace(/\.(\d{3})(\d)/, '.$1/$2')
    val = val.replace(/(\d{4})(\d)/, '$1-$2')
    return val.slice(0, 18)
}

const ESTADOS_BRASIL = [
    { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' },
    { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
    { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' },
    { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
    { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' },
    { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' },
    { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' },
    { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },
    { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' }
]

const toTitleCase = (str: string) => {
    if (!str) return ''
    const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi'];
    const acronyms = ['clt', 'pj', 'cpf', 'cnpj', 'rg', 'cnh', 'oab', 'rh', 'ti', 'ceo', 'cfo', 'pis', 'pasep', 'ctps'];
    return str.toLowerCase().split(' ').map(word => {
        if (romanNumerals.includes(word) || acronyms.includes(word)) return word.toUpperCase();
        return (word.length > 2) ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    }).join(' ');
}

export default function AtualizacaoCadastral() {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // GED States
    const [gedDocs, setGedDocs] = useState<GEDDocument[]>([]);
    const [selectedGedCategory, setSelectedGedCategory] = useState('');
    const [pendingGedDocs, setPendingGedDocs] = useState<{ file: File, category: string, label?: string, tempId: string, atestadoDatas?: { inicio: string, fim: string } }[]>([]);
    const gedInputRef = React.useRef<HTMLInputElement>(null);
    const [atestadoDatas, setAtestadoDatas] = useState({ inicio: '', fim: '' });
    const gedCategories = [
        { id: 'Atestado de Saúde Ocupacional (ASO)', name: 'Atestado de Saúde Ocupacional (ASO)' },
        { id: 'Atestado Médico', name: 'Atestado Médico' },
        { id: 'Carteira de Trabalho (CTPS)', name: 'Carteira de Trabalho (CTPS)' },
        { id: 'Certidão de Nascimento/Casamento', name: 'Certidão de Nascimento/Casamento' },
        { id: 'Certificado de Escolaridade/Diploma', name: 'Certificado de Escolaridade/Diploma' },
        { id: 'Certificado de Reservista', name: 'Certificado de Reservista' },
        { id: 'Comprovante de Residência', name: 'Comprovante de Residência' },
        { id: 'CPF', name: 'CPF' },
        { id: 'Documento de Identificação (RG/CNH)', name: 'Documento de Identificação (RG/CNH)' },
        { id: 'Outros', name: 'Outros' },
        { id: 'PIS/PASEP', name: 'PIS/PASEP' },
        { id: 'Título de Eleitor', name: 'Título de Eleitor' }
    ];

    const [formData, setFormData] = useState<Partial<Collaborator>>({});

    useEffect(() => {
        // Força o scroll para o topo de forma assíncrona para garantir que ocorra após o browser renderizar a view inicial (útil para mobile)
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);

        const fetchCollaboratorData = async () => {
            try {
                if (!token) {
                    setError('Link inválido ou ausente.');
                    setLoading(false);
                    return;
                }

                // Carrega lookups de escolaridade (Não mais necessários no magic link, agora a section usa API própria)
                /* // Removido
                const [instRes, coursesRes] = await Promise.all([
                    supabase.rpc('get_education_institutions'),
                    supabase.rpc('get_education_courses')
                ]);
                */

                const { data, error } = await supabase.rpc('get_collaborator_by_token', {
                    p_token: token
                });

                if (error) {
                    throw error;
                }

                if (!data) {
                    throw new Error('Colaborador não encontrado ou link expirado.');
                }

                // Corrigir formato de data para DD/MM/YYYY para exibição no form
                const formatDateToDisplay = (isoDate: string | undefined | null) => {
                    if (!isoDate) return ''
                    if (isoDate.includes('/')) return isoDate
                    const cleanDate = isoDate.split('T')[0]
                    const [y, m, d] = cleanDate.split('-')
                    return `${d}/${m}/${y}`
                }

                // Mapear dados antigos de emergência para o novo array se existir os antigos mas o array estiver vazio
                let em_contacts = data.emergency_contacts || [];
                if (!em_contacts.length && (data.emergencia_nome || data.emergencia_telefone || data.emergencia_parentesco)) {
                    em_contacts = [{
                        id: crypto.randomUUID(),
                        nome: data.emergencia_nome || '',
                        telefone: data.emergencia_telefone || '',
                        parentesco: data.emergencia_parentesco || ''
                    }];
                }

                const formattedColaborador = {
                    ...data,
                    emergency_contacts: em_contacts,
                    birthday: formatDateToDisplay(data.birthday),
                    children_data: data.children_data?.map((child: any) => ({
                        ...child,
                        birth_date: formatDateToDisplay(child.birth_date)
                    })) || [],
                    education_history: data.education_history?.map((edu: any) => ({
                        ...edu,
                        previsao_conclusao: formatDateToDisplay(edu.previsao_conclusao)
                    })) || []
                };

                setFormData(formattedColaborador);

                // Fetch existing GED docs using the found collaborator id
                const fetchGedDocs = async (colabId: string) => {
                    const { data } = await supabase.from('ged_colaboradores').select('*').eq('colaborador_id', colabId).order('created_at', { ascending: false });
                    if (data) setGedDocs(data);
                };
                fetchGedDocs(data.id);
            } catch (err: any) {
                console.error('Erro ao buscar dados:', err);
                setError('Este link é inválido, já foi utilizado ou expirou. Por favor, solicite um novo link ao RH.');
            } finally {
                setLoading(false);
            }
        };

        fetchCollaboratorData();
    }, [token]);

    useEffect(() => {
        const fetchCepData = async (cepValue: string) => {
            try {
                const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepValue}`);
                const data = await response.json();
                if (!data.errors && !data.message) {
                    const estadoEncontrado = ESTADOS_BRASIL.find(e => e.sigla === (data.state || data.uf));
                    setFormData(prev => ({
                        ...prev,
                        address: toTitleCase(data.street || data.logradouro || ''),
                        neighborhood: toTitleCase(data.neighborhood || data.bairro || ''),
                        city: toTitleCase(data.city || data.localidade || ''),
                        state: estadoEncontrado ? estadoEncontrado.nome : (data.state || data.uf || '')
                    }));
                }
            } catch (error) {
                console.error("Erro CEP automático:", error);
            }
        };

        const cepRaw = formData.zip_code?.replace(/\D/g, '');
        if (cepRaw?.length === 8) {
            // Se já tivermos o endereço preenchido, podemos evitar o fetch desnecessário a menos que o usuário esteja digitando um novo CEP do zero.
            // Para garantir a reatividade ao digitar 8 números:
            fetchCepData(cepRaw);
        }
    }, [formData.zip_code]);

    const handleCepBlur = async () => {
        const cep = formData.zip_code?.replace(/\D/g, '')
        if (cep?.length === 8) {
            try {
                const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`)
                const data = await response.json()
                if (!data.errors && !data.message) {
                    const estadoEncontrado = ESTADOS_BRASIL.find(e => e.sigla === (data.state || data.uf))
                    setFormData(prev => ({
                        ...prev,
                        address: toTitleCase(data.street || data.logradouro || ''),
                        neighborhood: toTitleCase(data.neighborhood || data.bairro || ''),
                        city: toTitleCase(data.city || data.localidade || ''),
                        state: estadoEncontrado ? estadoEncontrado.nome : (data.state || data.uf || '')
                    }))
                }
            } catch (error) { console.error("Erro CEP:", error) }
        }
    }

    const handleGedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedGedCategory) {
            // Need a category to upload
            return;
        }

        try {
            let categoryLabel = selectedGedCategory;
            if (selectedGedCategory === 'Atestado Médico' && atestadoDatas.inicio && atestadoDatas.fim) {
                categoryLabel = `Atestado Médico (${maskDate(atestadoDatas.inicio)} a ${maskDate(atestadoDatas.fim)})`;
            }

            const newItem = {
                file,
                category: selectedGedCategory,
                label: categoryLabel !== selectedGedCategory ? categoryLabel : undefined,
                tempId: Math.random().toString(36).substring(7),
                atestadoDatas: selectedGedCategory === 'Atestado Médico' ? { ...atestadoDatas } : undefined
            };

            setPendingGedDocs(prev => [...prev, newItem]);
            setSelectedGedCategory('');
            if (selectedGedCategory === 'Atestado Médico') {
                setAtestadoDatas({ inicio: '', fim: '' });
            }
        } catch (error: any) {
            console.error('Erro ao processar arquivo:', error);
            setError('Falha ao preparar o arquivo para envio. Tente novamente.');
        } finally {
            if (gedInputRef.current) gedInputRef.current.value = '';
        }
    };

    const handleDeleteGed = async (doc: GEDDocument) => {
        if (!window.confirm(`Tem certeza que deseja excluir o documento: ${doc.nome_arquivo}?`)) return;

        try {
            const path = doc.url.split('/ged-colaboradores/')[1];
            if (path) {
                await supabase.storage.from('ged-colaboradores').remove([path]);
            }
            await supabase.from('ged_colaboradores').delete().eq('id', doc.id);
            if (formData.id) {
                const { data } = await supabase.from('ged_colaboradores').select('*').eq('colaborador_id', formData.id).order('created_at', { ascending: false });
                if (data) setGedDocs(data);
            }
        } catch (error: any) {
            console.error('Erro ao excluir documento:', error);
            setError('Falha ao excluir o documento. Tente novamente.');
        }
    };

    const handleSave = async () => {
        try {
            if (!formData.name) {
                setError('O campo Nome é obrigatório.');
                return;
            }

            setSaving(true);
            setError(null);

            const formatDateToISO = (displayDate: string | undefined | null) => {
                if (!displayDate) return ''
                if (displayDate.includes('-')) return displayDate
                const [d, m, y] = displayDate.split('/')
                return `${y}-${m}-${d}`
            }

            // Preparar apenas os dados permitidos
            const dataToSave = {
                name: formData.name,
                cpf: formData.cpf,
                rg: formData.rg,
                birthday: formatDateToISO(formData.birthday) || null,
                gender: formData.gender,
                civil_status: formData.civil_status,
                has_children: formData.has_children,
                children_count: formData.children_count,
                children_data: formData.children_data?.map(c => ({
                    ...c,
                    birth_date: formatDateToISO(c.birth_date) || null
                })),
                emergency_contacts: formData.emergency_contacts,
                zip_code: formData.zip_code,
                address: formData.address,
                address_number: formData.address_number,
                address_complement: formData.address_complement,
                neighborhood: formData.neighborhood,
                city: formData.city,
                state: formData.state,
                email_pessoal: formData.email_pessoal,
                forma_pagamento: formData.forma_pagamento,
                banco_nome: formData.banco_nome,
                banco_tipo_conta: formData.banco_tipo_conta,
                banco_agencia: formData.banco_agencia,
                banco_conta: formData.banco_conta,
                pix_tipo: formData.pix_tipo,
                pix_chave: formData.pix_chave,

                // Escolaridade
                escolaridade_nivel: formData.escolaridade_nivel,
                escolaridade_subnivel: formData.escolaridade_subnivel,
                escolaridade_instituicao: formData.escolaridade_instituicao,
                escolaridade_matricula: formData.escolaridade_matricula,
                escolaridade_semestre: formData.escolaridade_semestre,
                escolaridade_previsao_conclusao: formatDateToISO(formData.escolaridade_previsao_conclusao) || null,
                escolaridade_curso: formData.escolaridade_curso,
                education_history: formData.education_history?.map(edu => ({
                    ...edu,
                    instituicao_uf: edu.instituicao_uf || null,
                    previsao_conclusao: formatDateToISO(edu.previsao_conclusao) || null
                })),
                transportes: formData.transportes || []
            };

            const { error: updateError } = await supabase.rpc('update_collaborator_by_token', {
                p_token: token,
                p_data: dataToSave
            });

            if (updateError) throw updateError;

            // Upload pending GED docs
            if (formData && formData.id && pendingGedDocs.length > 0) {
                for (const doc of pendingGedDocs) {
                    const extension = doc.file.name.includes('.') ? `.${doc.file.name.split('.').pop()}` : '';
                    const categoryLabel = doc.label || doc.category;
                    const storageFileName = `${categoryLabel.replace(/[^a-zA-Z0-9]/g, '_')}${extension}`;

                    const filePath = `ged/${formData.id}/${Date.now()}_${storageFileName}`;

                    const { error: upErr } = await supabase.storage.from('ged-colaboradores').upload(filePath, doc.file);

                    if (upErr) {
                        console.error('Erro no upload do storage:', upErr);
                        throw new Error(`Erro ao enviar arquivo ${doc.file.name}: ${upErr.message}`);
                    }

                    const { data: { publicUrl } } = supabase.storage.from('ged-colaboradores').getPublicUrl(filePath);
                    const { error: insertErr } = await supabase.from('ged_colaboradores').insert({
                        colaborador_id: formData.id,
                        nome_arquivo: `${categoryLabel}${extension}`,
                        url: publicUrl,
                        categoria: doc.category,
                        tamanho: doc.file.size,
                        tipo_arquivo: doc.file.type,
                        dados_atestado: doc.atestadoDatas?.inicio ? doc.atestadoDatas : null
                    });

                    if (insertErr) {
                        console.error('Erro no insert_ged:', insertErr);
                        throw new Error(`Erro ao vincular arquivo ${doc.file.name}: ${insertErr.message}`);
                    }
                }
                setPendingGedDocs([]);
            }

            if (updateError) throw updateError;

            setSuccess(true);
        } catch (err: any) {
            console.error('Erro ao salvar:', err);
            setError(err.message || 'Ocorreu um erro ao salvar suas informações. Tente novamente mais tarde.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 text-[#1e3a8a] animate-spin mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-[#0a192f]">Carregando suas informações...</h2>
                    <p className="text-sm text-gray-500 mt-2">Por favor, aguarde um momento.</p>
                </div>
            </div>
        );
    }

    if (error && !success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-gray-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-black text-[#0a192f] mb-2 tracking-tight">Acesso Indisponível</h2>
                    <p className="text-gray-500 mb-8">{error}</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-gray-100 animate-in zoom-in-50 duration-500">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-black text-[#0a192f] mb-2 tracking-tight">Atualização Concluída!</h2>
                    <p className="text-gray-500 mb-8">Seus dados foram atualizados com sucesso no sistema. Agradecemos sua colaboração.</p>
                    <p className="text-xs text-gray-400">Você já pode fechar esta janela.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Horizontal */}
                <div className="flex items-center gap-5 mb-8">
                    <div className="shrink-0 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                        <img src="/logo-salomao.png" alt="Salomão" className="h-[55px] object-contain" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-[#0a192f] tracking-tight leading-none mb-1">Atualização Cadastral</h1>
                        <p className="text-gray-500 text-sm sm:text-base">Por favor, revise seus dados e atualize o que for necessário.</p>
                    </div>
                </div>

                {/* LGPD Banner Destaque Topo */}
                <div className="bg-emerald-50 border border-emerald-200 shadow-sm rounded-2xl p-4 sm:p-5 flex items-start gap-4 mb-8 transition-transform duration-300 max-w-2xl mx-auto">
                    <div className="bg-emerald-100 p-2.5 rounded-full text-emerald-600 shrink-0 shadow-inner">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="pt-0.5">
                        <h3 className="text-emerald-900 font-bold text-sm mb-1">Privacidade e Proteção de Dados (LGPD)</h3>
                        <p className="text-emerald-700/90 text-xs sm:text-sm leading-relaxed">
                            Estes dados são confidenciais e utilizados apenas para fins de gestão interna.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden relative">

                    <div className="px-8 py-8 md:px-12 md:py-10 space-y-10">
                        {/* Header Section */}
                        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] text-white flex items-center justify-center text-xl font-bold font-serif shadow-lg">
                                {formData.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[#0a192f]">{formData.name}</h2>
                                <p className="text-sm font-medium text-gray-500">{formData.email}</p>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">

                            <DadosPessoaisSection
                                formData={formData}
                                setFormData={setFormData}
                                maskCPF={maskCPF}
                                maskDate={maskDate}
                                maskRG={maskRG}
                                maskPhone={maskPhone}
                                maskCNPJ={maskCNPJ}
                                isViewMode={false}
                            />
                            <EnderecoSection
                                formData={formData}
                                setFormData={setFormData}
                                maskCEP={maskCEP}
                                handleCepBlur={handleCepBlur}
                                isViewMode={false}
                            />
                            <TransporteSection
                                transportes={formData.transportes || []}
                                setTransportes={(newT) => setFormData(prev => ({ ...prev, transportes: newT }))}
                                isViewMode={false}
                            />
                            <DadosEscolaridadeSection
                                formData={formData}
                                setFormData={setFormData}
                                maskDate={maskDate}
                                isViewMode={false}
                            />
                            <GEDSection
                                gedCategories={gedCategories}
                                selectedGedCategory={selectedGedCategory}
                                setSelectedGedCategory={setSelectedGedCategory}
                                atestadoDatas={atestadoDatas}
                                setAtestadoDatas={setAtestadoDatas}
                                gedInputRef={gedInputRef}
                                handleGedUpload={handleGedUpload}
                                gedDocs={gedDocs}
                                pendingGedDocs={pendingGedDocs}
                                setPendingGedDocs={setPendingGedDocs}
                                handleDeleteGed={handleDeleteGed}
                                hideDeleteButton={true}
                            />
                        </div>
                    </div>

                    {/* Footer Action */}
                    <div className="px-8 py-6 md:px-12 bg-gray-50 border-t border-gray-100 flex items-center justify-between sticky bottom-0 z-10">
                        <p className="text-xs text-gray-400 font-medium hidden sm:block">
                            Estes dados são confidenciais e utilizados apenas para fins de gestão interna.
                        </p>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1e3a8a] text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-wider text-xs hover:bg-[#112240] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                        >
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            {saving ? 'Salvando...' : 'Salvar Informações'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
