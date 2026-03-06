import { X, Users, Briefcase, Bot, UserPlus, UploadCloud, Loader2, ArrowLeft } from 'lucide-react'
import { useEscKey } from '../../../hooks/useEscKey'
import { useState, useRef } from 'react'
import { supabase } from '../../../lib/supabase'

export type VagasCreationType = 'vaga' | 'candidato' | { type: 'candidato_ia', data: any, file: File }

interface VagasSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (tipo: VagasCreationType) => void;
}

export function VagasSelectionModal({ isOpen, onClose, onSelect }: VagasSelectionModalProps) {
    const [step, setStep] = useState<'tipo' | 'metodo' | 'upload'>('tipo')
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [alertMsg, setAlertMsg] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEscKey(isOpen, () => {
        if (step === 'tipo') onClose()
        else setStep('tipo')
    })

    if (!isOpen) {
        if (step !== 'tipo') setStep('tipo')
        return null
    }

    const handleSelectTipo = (tipo: 'vaga' | 'candidato') => {
        if (tipo === 'vaga') {
            onSelect('vaga')
        } else {
            setStep('metodo')
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 10 * 1024 * 1024) {
            setAlertMsg('Arquivo muito grande! Máximo de 10MB.')
            return
        }

        setAlertMsg('')
        setLoading(true)
        setProgress(0)

        // Simulate progress bar while API call runs
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev;
                return prev + Math.floor(Math.random() * 15) + 5;
            })
        }, 800)

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `temp_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
            const filePath = `candidatos/temp_cvs/${fileName}`

            const { error: uploadError } = await supabase.storage.from('ged-colaboradores').upload(filePath, file)
            if (uploadError) throw new Error('Falha ao fazer upload do currículo: ' + uploadError.message)

            const { data, error } = await supabase.functions.invoke('analisar-curriculo-cv', {
                body: { tempObjectPath: filePath }
            });

            if (error) throw new Error(error.message || 'Erro na extração via IA')
            if (data?.error) throw new Error(data.error)

            if (data?.data) {
                clearInterval(progressInterval);
                setProgress(100);
                setTimeout(() => {
                    onSelect({ type: 'candidato_ia', data: data.data, file })
                    setStep('tipo')
                    setLoading(false)
                }, 500);
            } else {
                throw new Error('Resposta inválida da Inteligência Artificial.')
            }
        } catch (err: any) {
            clearInterval(progressInterval);
            setAlertMsg(err.message)
            setLoading(false)
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        {step !== 'tipo' && !loading && (
                            <button onClick={() => setStep(step === 'upload' ? 'metodo' : 'tipo')} className="text-gray-400 hover:text-[#1e3a8a] transition-colors p-1 rounded-lg hover:bg-blue-50">
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                        )}
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#0a192f]">
                            {step === 'tipo' ? 'Selecione o Tipo' : step === 'metodo' ? 'Método de Cadastro' : 'Inteligência Artificial'}
                        </h3>
                    </div>
                    <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {alertMsg && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                        {alertMsg}
                    </div>
                )}

                <div className="p-6">
                    {step === 'tipo' && (
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleSelectTipo('candidato')}
                                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-amber-100 bg-amber-50/50 hover:bg-amber-100 hover:border-amber-300 hover:scale-105 transition-all group"
                            >
                                <div className="h-12 w-12 rounded-full bg-amber-600 flex items-center justify-center text-white shadow-lg group-hover:shadow-amber-300/50 transition-all">
                                    <Users className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-amber-900">Candidato</span>
                            </button>

                            <button
                                onClick={() => handleSelectTipo('vaga')}
                                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-blue-100 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-300 hover:scale-105 transition-all group"
                            >
                                <div className="h-12 w-12 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white shadow-lg group-hover:shadow-blue-300/50 transition-all">
                                    <Briefcase className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-[#1e3a8a]">Vaga</span>
                            </button>
                        </div>
                    )}

                    {step === 'metodo' && (
                        <div className="flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300">
                            <button
                                onClick={() => onSelect('candidato')}
                                className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-[#1e3a8a] hover:bg-blue-50/50 transition-all group text-left"
                            >
                                <div className="h-10 w-10 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center text-gray-500 group-hover:text-[#1e3a8a] transition-colors shrink-0">
                                    <UserPlus className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-[#0a192f] uppercase tracking-wide">Cadastro Manual</p>
                                    <p className="text-[10px] text-gray-500 font-medium mt-0.5 leading-tight">Preencha os dados do candidato manualmente.</p>
                                </div>
                            </button>

                            <div className="relative overflow-hidden group">
                                <button
                                    onClick={() => setStep('upload')}
                                    className="flex w-full items-center gap-4 p-4 rounded-xl border-2 border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-300 transition-all text-left"
                                >
                                    <div className="absolute -right-4 -top-4 opacity-10 blur-sm scale-150 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                                        <Bot className="w-24 h-24 text-indigo-500" />
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0 z-10 transition-transform group-hover:scale-110">
                                        <Bot className="h-5 w-5" />
                                    </div>
                                    <div className="z-10">
                                        <p className="text-sm font-black text-indigo-900 uppercase tracking-wide flex items-center gap-2">
                                            Cadastro por IA <span className="text-[8px] bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded-full">Automático</span>
                                        </p>
                                        <p className="text-[10px] text-indigo-700/70 font-medium mt-0.5 leading-tight pr-6">Anexe o currículo e deixe a IA extrair os dados.</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'upload' && (
                        <div className="flex flex-col items-center justify-center animate-in slide-in-from-right-4 duration-300 text-center">
                            {loading ? (
                                <div className="py-8 w-full flex flex-col items-center focus:outline-none">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
                                        <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 animate-bounce">
                                            <Bot className="h-8 w-8 text-white" />
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-black text-indigo-900 uppercase tracking-wide mb-1 flex items-center gap-2">
                                        Lendo Documento <Loader2 className="w-4 h-4 animate-spin outline-none" />
                                    </h4>
                                    <p className="text-[10px] text-indigo-600/70 font-medium mb-4 max-w-[250px]">Aguarde enquanto nossa inteligência artificial processa o currículo...</p>

                                    <div className="w-full max-w-[250px] bg-indigo-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                                        <div
                                            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out flex items-center justify-end"
                                            style={{ width: `${progress}%` }}
                                        >
                                            <div className="w-2 h-2 bg-white/40 rounded-full mr-0.5 shadow-[0_0_4px_rgba(255,255,255,0.8)]"></div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-indigo-900 mt-2">{Math.min(progress, 100)}%</span>
                                </div>
                            ) : (
                                <div className="w-full">
                                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-dashed border-indigo-200 rounded-2xl p-8 hover:bg-indigo-100/50 hover:border-indigo-400 transition-colors cursor-pointer group flex flex-col items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                                        <div className="h-14 w-14 bg-white rounded-full shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform mb-4">
                                            <UploadCloud className="h-6 w-6" />
                                        </div>
                                        <h4 className="text-sm font-black text-indigo-900 uppercase tracking-wide mb-1">Anexar Currículo</h4>
                                        <p className="text-[10px] text-indigo-700/70 font-medium">PDF ou Documentos (Max 10MB)</p>
                                        <input
                                            type="file"
                                            className="hidden"
                                            ref={fileInputRef}
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleFileUpload}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 font-medium">
                        {step === 'tipo' ? 'Escolha o que deseja cadastrar para iniciar' :
                            step === 'metodo' ? 'Selecione a forma de entrada de dados' :
                                'O arquivo será lido com segurança pelo nosso motor ATS.'}
                    </p>
                </div>
            </div>
        </div>
    )
}
