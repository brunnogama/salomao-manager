import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { User, GraduationCap, BookOpen, Briefcase, Files, CheckCircle, AlertTriangle, Save, Loader2 } from 'lucide-react'
import { DadosPessoaisSection } from '../components/collaborators/components/DadosPessoaisSection'
import { EnderecoSection } from '../components/collaborators/components/EnderecoSection'
import { InformacoesProfissionaisSection } from '../components/collaborators/components/InformacoesProfissionaisSection'
import { DadosEscolaridadeSection } from '../components/collaborators/components/DadosEscolaridadeSection'
import { PhotoUploadSection } from '../components/collaborators/components/PhotoUploadSection'
import { DadosCorporativosSection } from '../components/collaborators/components/DadosCorporativosSection'
import { SearchableSelect } from '../components/crm/SearchableSelect'

// Default empty collaborator state
const initialFormData = {
    status: 'active',
    state: '',
    // Initialize with empty strings to avoid uncontrolled/controlled warnings if components expect them
    name: '',
    email: '',
    cpf: '',
    rg: '',
    birthday: '',
    gender: '',
    civil_status: '',
    has_children: false,
    children_count: 0,
    zip_code: '',
    address: '',
    address_number: '',
    address_complement: '',
    neighborhood: '',
    city: '',
    emergencia_nome: '',
    emergencia_telefone: '',
    emergencia_parentesco: '',
    oab_numero: '',
    oab_uf: '',
    oab_emissao: '',
    pis: '',
    ctps: '',
    ctps_serie: '',
    ctps_uf: '',
    escolaridade_nivel: '',
    escolaridade_instituicao: '',
    escolaridade_curso: '',
    escolaridade_matricula: '',
    escolaridade_semestre: '',
    escolaridade_previsao_conclusao: ''
}

export default function FichaCadastral() {
    const [activeTab, setActiveTab] = useState(1)
    const [formData, setFormData] = useState<any>(initialFormData)
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const photoInputRef = useRef<HTMLInputElement>(null)

    // Photo State
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)

    // Lookup data placeholders (if needed by child components, though some fetch their own or receive props)
    // Most child sections in this codebase seem to accept direct props or have internal logic.
    // Checking usage in Colaboradores.tsx, they take formData and setFormData.

    const steps = [
        { id: 1, label: 'Dados Pessoais', icon: User },
        { id: 2, label: 'Profissional', icon: GraduationCap },
        { id: 3, label: 'Escolaridade', icon: BookOpen },
        { id: 4, label: 'Corporativo', icon: Briefcase },
        { id: 5, label: 'Documentos', icon: Files }
    ]

    const gedCategories = [
        { id: 'Carteira de Trabalho', label: 'Carteira de Trabalho', value: 'Carteira de Trabalho' },
        { id: 'CNH', label: 'CNH', value: 'CNH' },
        { id: 'Comprovante de Matrícula', label: 'Comprovante de Matrícula', value: 'Comprovante de Matrícula' },
        { id: 'Comprovante de Residência', label: 'Comprovante de Residência', value: 'Comprovante de Residência' },
        { id: 'CPF', label: 'CPF', value: 'CPF' },
        { id: 'Diploma', label: 'Diploma', value: 'Diploma' },
        { id: 'Identidade', label: 'Identidade', value: 'Identidade' },
        { id: 'OAB', label: 'OAB', value: 'OAB' }
    ]

    const [selectedGedCategory, setSelectedGedCategory] = useState('')
    const [pendingGedDocs, setPendingGedDocs] = useState<{ file: File, category: string, tempId: string }[]>([])

    const maskCEP = (v: string) => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9)
    const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14)
    const maskDate = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 10)

    const handleCepBlur = async () => {
        const cep = formData.zip_code?.replace(/\D/g, '')
        if (cep?.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
                const data = await response.json()
                if (!data.erro) {
                    setFormData((prev: any) => ({
                        ...prev,
                        address: data.logradouro,
                        neighborhood: data.bairro,
                        city: data.localidade,
                        state: data.uf // Note: Child component might expect 'state' as UF or full name, Colaboradores.tsx handles mapping.
                    }))
                }
            } catch (error) { console.error("Erro CEP:", error) }
        }
    }

    const validateForm = () => {
        if (!formData.name) return 'Nome é obrigatório.'
        if (!formData.cpf) return 'CPF é obrigatório.'
        if (!formData.email) return 'Email é obrigatório.'
        return null
    }

    const handleSubmit = async () => {
        const validationError = validateForm()
        if (validationError) {
            setError(validationError)
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Format dates for DB (DD/MM/YYYY -> YYYY-MM-DD)
            const formatDateToISO = (displayDate: string | undefined | null) => {
                if (!displayDate) return null
                if (displayDate.includes('-')) return displayDate
                const [d, m, y] = displayDate.split('/')
                return `${y}-${m}-${d}`
            }

            const dataToSave = {
                ...formData,
                birthday: formatDateToISO(formData.birthday),
                oab_emissao: formatDateToISO(formData.oab_emissao),
                escolaridade_previsao_conclusao: formatDateToISO(formData.escolaridade_previsao_conclusao),
                status: 'active', // Defaulting to active as requested
                // Exclude sensitive/corporate fields that shouldn't be publicly set
                salary: undefined,
                cost_center: undefined,
                rateio_id: undefined,
                role: undefined,
                leader_id: undefined,
                partner_id: undefined
            }

            // Remove undefined keys
            Object.keys(dataToSave).forEach(key => dataToSave[key] === undefined && delete dataToSave[key])

            const { error: insertError } = await supabase.from('collaborators').insert(dataToSave)
            if (insertError) throw insertError

            setSubmitted(true)
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar ficha cadastral.')
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-black text-[#0a192f] mb-2">Cadastro Realizado!</h1>
                    <p className="text-gray-600 mb-8">
                        Suas informações foram enviadas com sucesso para o banco de dados da Salomão Advogados.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-sm font-bold text-[#1e3a8a] hover:underline"
                    >
                        Preencher novo cadastro
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0a192f] md:py-10 p-4">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[80vh]">

                {/* Sidebar */}
                <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 flex flex-col p-6">
                    <div className="mb-8">
                        <h1 className="text-xl font-black text-[#0a192f] tracking-tight">Ficha Cadastral</h1>
                        <p className="text-xs text-gray-500 mt-1">Preencha seus dados completos</p>
                    </div>

                    <div className="space-y-2 flex-1">
                        {steps.map(step => {
                            const Icon = step.icon
                            const isActive = activeTab === step.id
                            const isCompleted = false // simplified for now

                            return (
                                <button
                                    key={step.id}
                                    onClick={() => setActiveTab(step.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${isActive
                                        ? 'bg-[#1e3a8a] text-white shadow-md'
                                        : 'text-gray-500 hover:bg-white hover:shadow-sm'
                                        }`}
                                >
                                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                    <span className="text-xs font-bold uppercase tracking-wider">{step.label}</span>
                                </button>
                            )
                        })}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-gray-400">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Sistema Online</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col bg-white">
                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {activeTab === 1 && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-[#0a192f] mb-6">Dados Pessoais</h2>
                                    <DadosPessoaisSection
                                        formData={formData}
                                        setFormData={setFormData}
                                        maskCPF={maskCPF}
                                        maskDate={maskDate}
                                    />
                                    <EnderecoSection
                                        formData={formData}
                                        setFormData={setFormData}
                                        maskCEP={maskCEP}
                                        handleCepBlur={handleCepBlur}
                                    />
                                </div>
                            )}

                            {activeTab === 2 && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-[#0a192f] mb-6">Informações Profissionais</h2>
                                    <InformacoesProfissionaisSection
                                        formData={formData}
                                        setFormData={setFormData}
                                        maskDate={maskDate}
                                    />
                                </div>
                            )}

                            {activeTab === 3 && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-[#0a192f] mb-6">Escolaridade</h2>
                                    <DadosEscolaridadeSection
                                        formData={formData}
                                        setFormData={setFormData}
                                        maskDate={maskDate}
                                        handleRefresh={() => { }}
                                    />
                                </div>
                            )}

                            {activeTab === 4 && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-[#0a192f] mb-6">Dados Corporativos</h2>
                                    <DadosCorporativosSection
                                        formData={formData}
                                        setFormData={setFormData}
                                        maskDate={maskDate}
                                    />
                                </div>
                            )}

                            {activeTab === 5 && (
                                <div className="space-y-8">
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-bold text-[#0a192f] mb-6">Foto de Perfil</h2>
                                        <PhotoUploadSection
                                            photoPreview={photoPreview || formData.photo_url || formData.foto_url}
                                            setPhotoPreview={(val: string | null) => {
                                                setPhotoPreview(val)
                                                if (val) setFormData({ ...formData, photo_url: val })
                                            }}
                                            uploadingPhoto={false}
                                            photoInputRef={photoInputRef}
                                        />
                                    </div>

                                    <div className="space-y-6 pt-8 border-t border-gray-100">
                                        <h2 className="text-xl font-bold text-[#0a192f] mb-6">Documentos (GED)</h2>
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                            <div className="flex flex-col md:flex-row items-end gap-3">
                                                <div className="flex-1 w-full">
                                                    <SearchableSelect
                                                        label="Tipo de Documento"
                                                        placeholder="Selecione..."
                                                        value={selectedGedCategory}
                                                        onChange={setSelectedGedCategory}
                                                        options={gedCategories}
                                                        uppercase={false}
                                                    />
                                                </div>
                                                <button
                                                    disabled={!selectedGedCategory}
                                                    onClick={() => {
                                                        const input = document.createElement('input');
                                                        input.type = 'file';
                                                        input.accept = '.pdf,image/*';
                                                        input.onchange = (e: any) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                setPendingGedDocs(prev => [...prev, {
                                                                    file,
                                                                    category: selectedGedCategory,
                                                                    tempId: Math.random().toString(36).substr(2, 9)
                                                                }]);
                                                                setSelectedGedCategory('');
                                                            }
                                                        };
                                                        input.click();
                                                    }}
                                                    className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#112240] transition-all disabled:opacity-50"
                                                >
                                                    Anexar
                                                </button>
                                            </div>

                                            <div className="mt-4 space-y-2">
                                                {pendingGedDocs.map(doc => (
                                                    <div key={doc.tempId} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded"><Files className="h-4 w-4" /></div>
                                                            <div>
                                                                <p className="text-xs font-bold text-[#0a192f]">{doc.file.name}</p>
                                                                <span className="text-[9px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded uppercase">{doc.category}</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setPendingGedDocs(prev => prev.filter(p => p.tempId !== doc.tempId))}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <CheckCircle className="h-4 w-4 rotate-45 text-red-500" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                        <button
                            onClick={() => setActiveTab(prev => Math.max(1, prev - 1))}
                            disabled={activeTab === 1}
                            className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-[#1e3a8a] disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
                        >
                            Voltar
                        </button>

                        {activeTab < 5 ? (
                            <button
                                onClick={() => setActiveTab(prev => Math.min(5, prev + 1))}
                                className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#112240] transition-colors shadow-lg shadow-blue-900/10"
                            >
                                Próximo
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-8 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-green-700 transition-colors shadow-lg shadow-green-900/10 flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Finalizar Cadastro
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
