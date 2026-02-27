import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle2, User, Save } from 'lucide-react';
import { Collaborator } from '../types/controladoria';
import { DadosPessoaisSection } from '../components/collaborators/components/DadosPessoaisSection';
import { EnderecoSection } from '../components/collaborators/components/EnderecoSection';
import { DadosEscolaridadeSection } from '../components/collaborators/components/DadosEscolaridadeSection';

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
    if (raw.length <= 10) return raw.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').slice(0, 14)
    return raw.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').slice(0, 15)
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

    const [formData, setFormData] = useState<Partial<Collaborator>>({});

    useEffect(() => {
        window.scrollTo(0, 0);

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

                const formattedColaborador = {
                    ...data,
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
            } catch (err: any) {
                console.error('Erro ao buscar dados:', err);
                setError('Este link é inválido, já foi utilizado ou expirou. Por favor, solicite um novo link ao RH.');
            } finally {
                setLoading(false);
            }
        };

        fetchCollaboratorData();
    }, [token]);

    const handleCepBlur = async () => {
        const cep = formData.zip_code?.replace(/\D/g, '')
        if (cep?.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
                const data = await response.json()
                if (!data.erro) {
                    const estadoEncontrado = ESTADOS_BRASIL.find(e => e.sigla === data.uf)
                    setFormData(prev => ({
                        ...prev,
                        address: toTitleCase(data.logradouro),
                        neighborhood: toTitleCase(data.bairro),
                        city: toTitleCase(data.localidade),
                        state: estadoEncontrado ? estadoEncontrado.nome : data.uf
                    }))
                }
            } catch (error) { console.error("Erro CEP:", error) }
        }
    }

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
                emergencia_nome: formData.emergencia_nome,
                emergencia_parentesco: formData.emergencia_parentesco,
                emergencia_telefone: formData.emergencia_telefone,
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
                }))
            };

            const { error: updateError } = await supabase.rpc('update_collaborator_by_token', {
                p_token: token,
                p_data: dataToSave
            });

            if (updateError) throw updateError;

            setSuccess(true);
        } catch (err: any) {
            console.error('Erro ao salvar:', err);
            setError('Ocorreu um erro ao salvar suas informações. Tente novamente mais tarde.');
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
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center mb-6">
                        <img src="/logo-salomao.png" alt="Salomão" className="h-[74px] object-contain" />
                    </div>
                    <h1 className="text-3xl font-black text-[#0a192f] tracking-tight">Atualização Cadastral</h1>
                    <p className="text-gray-500 mt-2 max-w-lg mx-auto">Por favor, revise atentamente suas informações pessoais, endereço e escolaridade abaixo. Atualize o que for necessário e clique em salvar.</p>
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
                            <DadosEscolaridadeSection
                                formData={formData}
                                setFormData={setFormData}
                                maskDate={maskDate}
                                isViewMode={false}
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
