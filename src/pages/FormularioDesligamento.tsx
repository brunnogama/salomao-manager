import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle2, AlertTriangle, Send, LogOut } from 'lucide-react';

export default function FormularioDesligamento() {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    
    const [interviewData, setInterviewData] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [comments, setComments] = useState<Record<string, string>>({}); // For grid "has_comments"

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const fetchInterviewData = async () => {
            try {
                if (!token) {
                    setError('Link inválido ou ausente.');
                    setLoading(false);
                    return;
                }

                const { data, error } = await supabase.rpc('get_exit_interview_public', {
                    p_token: token
                });

                if (error) {
                    throw error;
                }

                if (!data) {
                    throw new Error('Entrevista não encontrada ou link expirado.');
                }
                
                if (data.status === 'completed') {
                    setSuccess(true);
                }

                setInterviewData(data);
                if (data.answers && Object.keys(data.answers).length > 0) {
                   setAnswers(data.answers);
                   if (data.answers._comments) {
                      setComments(data.answers._comments);
                   }
                }
            } catch (err: any) {
                console.error('Erro ao buscar dados:', err);
                setError('Este link é inválido ou ocorreu um erro na busca dos dados.');
            } finally {
                setLoading(false);
            }
        };

        fetchInterviewData();
    }, [token]);

    const handleSave = async () => {
        try {
            // Validation: ensure at least some answers are filled
            if (Object.keys(answers).length === 0) {
               setError('Por favor, responda pelo menos a algumas perguntas do formulário.');
               return;
            }
            
            setSaving(true);
            setError(null);

            const payloadToSave = {
               ...answers,
               _comments: comments
            };

            const { error: updateError } = await supabase
                .from('exit_interviews')
                .update({
                    answers: payloadToSave,
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('token', token)
                .select()
                .single();

            if (updateError) throw updateError;

            setSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            console.error('Erro ao salvar:', err);
            setError(err.message || 'Ocorreu um erro ao enviar suas respostas. Tente novamente mais tarde.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSaving(false);
        }
    };

    const handleAnswerChange = (questionId: string, value: any) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };
    
    const handleCommentChange = (gridId: string, value: string) => {
        setComments(prev => ({
            ...prev,
            [gridId]: value
        }));
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 text-[#1e3a8a] animate-spin mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-[#0a192f]">Carregando formulário...</h2>
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
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-black text-[#0a192f] mb-2 tracking-tight">Ops! Algo deu errado</h2>
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
                    <h2 className="text-2xl font-black text-[#0a192f] mb-2 tracking-tight">Formulário Enviado!</h2>
                    <p className="text-gray-500 mb-8">Suas respostas foram enviadas com sucesso e o formulário de desligamento foi concluído. Agradecemos sua colaboração.</p>
                    <p className="text-xs text-gray-400">Você já pode fechar esta janela.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#112240] to-[#0a192f] py-10 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-6 animate-in slide-in-from-bottom-6 duration-700">
                {/* Header Horizontal */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl">
                    <div className="shrink-0 p-4">
                        <img src="/logo-branca.png" alt="Salomão" className="h-[65px] object-contain" />
                    </div>
                    <div className="text-center sm:text-left flex-1 min-w-0 md:pt-4">
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mb-2">Entrevista de Desligamento</h1>
                        <p className="text-blue-200 text-sm sm:text-base opacity-80 mb-6">{interviewData?.template_name}</p>
                        
                        <div className="inline-flex items-center gap-3 bg-white/10 px-5 py-3 rounded-2xl border border-white/5">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4af37] to-yellow-600 text-white flex items-center justify-center text-lg font-bold font-serif shadow-inner border border-white/20">
                                {interviewData?.collaborator_name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">{interviewData?.collaborator_name}</p>
                                <p className="text-[10px] uppercase font-black tracking-widest text-[#d4af37]">{interviewData?.collaborator_position}</p>
                                {interviewData?.collaborator_termination_date && (
                                    <p className="text-[10px] font-medium text-gray-400 mt-0.5">
                                        Data de Saída: {new Date(interviewData.collaborator_termination_date).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden relative border border-gray-100">
                    <div className="px-5 py-8 md:px-12 md:py-12 space-y-12">
                        {interviewData?.template_schema?.map((section: any, idx: number) => (
                            <div key={section.id || idx} className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-black text-[#1e3a8a] flex items-center gap-3">
                                       <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e3a8a]/10 text-[#1e3a8a] text-sm tabular-nums">
                                        {idx + 1}
                                       </span>
                                       {section.title}
                                    </h3>
                                    {section.description && (
                                        <p className="mt-2 text-sm font-medium text-gray-500 ml-11">{section.description}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-8 ml-1 sm:ml-11">
                                    {section.questions?.map((q: any) => {
                                        if (q.dependsOn) {
                                            const dependentAnswer = answers[q.dependsOn.questionId];
                                            if (dependentAnswer !== q.dependsOn.value) {
                                                return null;
                                            }
                                        }

                                        return (
                                        <div key={q.id} className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100/50 animate-in fade-in zoom-in-95">
                                            <label className="text-sm font-bold text-[#0a192f] mb-4 block leading-relaxed">
                                                {q.label}
                                            </label>
                                            
                                            {q.type === 'text' && (
                                                <input 
                                                    type="text"
                                                    value={answers[q.id] || ''}
                                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                    className="w-full bg-white border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all"
                                                    placeholder="Sua resposta..."
                                                />
                                            )}
                                            
                                            {q.type === 'textarea' && (
                                                <textarea 
                                                    value={answers[q.id] || ''}
                                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                    rows={4}
                                                    className="w-full bg-white border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all resize-y"
                                                    placeholder="Digite suas considerações..."
                                                />
                                            )}
                                            
                                            {q.type === 'radio' && (
                                                <div className="space-y-3">
                                                    {q.options?.map((opt: string) => (
                                                        <label key={opt} className="flex items-start gap-3 cursor-pointer group">
                                                            <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 bg-white group-hover:border-[#1e3a8a] transition-colors mt-0.5 shrink-0">
                                                                <input 
                                                                    type="radio" 
                                                                    name={q.id}
                                                                    className="peer opacity-0 absolute inset-0 cursor-pointer"
                                                                    checked={answers[q.id] === opt}
                                                                    onChange={() => handleAnswerChange(q.id, opt)}
                                                                />
                                                                <div className="w-2.5 h-2.5 rounded-full bg-[#1e3a8a] opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-700 group-hover:text-[#0a192f] transition-colors">
                                                                {opt}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {q.type === 'checkbox' && (
                                                <div className="space-y-3">
                                                    {q.options?.map((opt: string) => {
                                                        const isChecked = Array.isArray(answers[q.id]) && answers[q.id].includes(opt);
                                                        return (
                                                            <label key={opt} className="flex items-start gap-3 cursor-pointer group">
                                                                <div className="relative flex items-center justify-center w-5 h-5 rounded border border-gray-300 bg-white group-hover:border-[#1e3a8a] transition-colors mt-0.5 shrink-0 overflow-hidden">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        className="peer opacity-0 absolute inset-0 cursor-pointer"
                                                                        checked={isChecked}
                                                                        onChange={(e) => {
                                                                            const current = Array.isArray(answers[q.id]) ? [...answers[q.id]] : [];
                                                                            if (e.target.checked) current.push(opt);
                                                                            else {
                                                                                const idx = current.indexOf(opt);
                                                                                if (idx > -1) current.splice(idx, 1);
                                                                            }
                                                                            handleAnswerChange(q.id, current);
                                                                        }}
                                                                    />
                                                                    <div className="absolute inset-0 bg-[#1e3a8a] opacity-0 peer-checked:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                                                    </div>
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-700 group-hover:text-[#0a192f] transition-colors">
                                                                    {opt}
                                                                </span>
                                                            </label>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                            
                                            {q.type === 'grid' && (
                                                <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden bg-white">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm text-left">

                                                            <thead className="bg-[#f8fafc] text-[10px] uppercase font-black text-gray-500 tracking-wider">
                                                                <tr>
                                                                    <th className="px-4 py-4 min-w-[200px]">Item</th>
                                                                    {q.options?.map((opt: string) => (
                                                                        <th key={opt} className="px-4 py-4 text-center min-w-[100px] border-l border-gray-100">{opt}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {q.items?.map((item: any, iIdx: number) => {
                                                                    const itemAnswerId = `${q.id}_${item.id}`;
                                                                    return (
                                                                        <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                                                            <td className="px-4 py-4 font-medium text-gray-700">
                                                                               <span className="mr-2 text-gray-300 font-bold">{iIdx + 1}.</span> 
                                                                               {item.label}
                                                                            </td>
                                                                            {q.options?.map((opt: string) => (
                                                                                <td key={opt} className="px-4 py-4 text-center border-l border-gray-100 cursor-pointer" onClick={() => handleAnswerChange(itemAnswerId, opt)}>
                                                                                    <div className="inline-flex relative items-center justify-center w-5 h-5 rounded-full border border-gray-300 bg-white">
                                                                                        <input 
                                                                                            type="radio"
                                                                                            name={itemAnswerId}
                                                                                            checked={answers[itemAnswerId] === opt}
                                                                                            onChange={() => handleAnswerChange(itemAnswerId, opt)}
                                                                                            className="peer opacity-0 absolute inset-0 cursor-pointer"
                                                                                        />
                                                                                        <div className="w-2.5 h-2.5 rounded-full bg-[#1e3a8a] opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                                                                                    </div>
                                                                                </td>
                                                                            ))}
                                                                        </tr>
                                                                    )
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    
                                                    {q.has_comments && (
                                                        <div className="p-4 bg-gray-50 border-t border-gray-100">
                                                            <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider block mb-2">Comentários (Opcional)</label>
                                                            <textarea 
                                                                value={comments[q.id] || ''}
                                                                onChange={(e) => handleCommentChange(q.id, e.target.value)}
                                                                className="w-full bg-white border border-gray-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#1e3a8a]"
                                                                rows={2}
                                                                placeholder="Deseja acrescentar algum comentário sobre esta seção?"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer Action */}
                    <div className="px-6 py-6 md:px-12 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between sticky bottom-0 z-10 gap-4">
                        <div className="flex items-center gap-2 text-[#b91c1c] bg-red-50 px-4 py-2 rounded-lg border border-red-100 w-full sm:w-auto">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">
                                Atenção: Após enviar, não será possível<br className="hidden sm:block" /> alterar suas respostas.
                            </p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-[11px] hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-900/20 active:scale-95"
                        >
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                            {saving ? 'Enviando...' : 'Finalizar Entrega'}
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="mt-12 text-center text-[10px] font-bold text-white/30 uppercase tracking-widest">
                Salomão Manager © {new Date().getFullYear()} • Entrevista de Desligamento Segura
            </div>
        </div>
    );
}

