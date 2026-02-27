import { BookOpen, Search, Loader2 } from 'lucide-react'
import { Collaborator } from '../../../types/controladoria'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { toast } from 'sonner'

const ESTADOS_BRASIL_UF = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

interface OABSectionProps {
    formData: Partial<Collaborator>
    setFormData: (data: Partial<Collaborator>) => void
    maskDate: (value: string) => string
    isViewMode?: boolean
}

export function OABSection({
    formData,
    setFormData,
    maskDate,
    isViewMode = false
}: OABSectionProps) {
    const [isConsultingCNA, setIsConsultingCNA] = useState(false);

    const handleConsultarCNA = async () => {
        if (!formData.name && !formData.cpf) {
            toast.error('Preencha o Nome ou CPF na aba Inicial para consultar o CNA.');
            return;
        }

        setIsConsultingCNA(true);
        try {
            const { data, error } = await supabase.functions.invoke('consultar-cna', {
                body: {
                    nome: formData.name,
                    cpf: formData.cpf
                }
            });

            if (error) throw error;

            const advogados = data;

            if (!advogados || advogados.length === 0) {
                toast.error('Nenhum resultado encontrado no CNA para os dados informados.');
                return;
            }

            if (advogados.length > 1 && !formData.cpf) {
                toast.warning('Foram encontrados múltiplos resultados com este nome. Por favor, preencha o CPF na aba Inicial para uma busca exata.');
                return;
            }

            const advogado = advogados[0];
            const inscricoes = advogado.inscricoes || [];

            if (inscricoes.length === 0) {
                toast.error('Resultados encontrados, mas sem inscrições detalhadas.');
                return;
            }

            const mappedOabs = inscricoes.map((insc: any) => ({
                numero: insc.numero || insc.numeroInscricao || '',
                uf: insc.uf || '',
                tipo: insc.tipo === 'Principal' || insc.tipo === 'Transferencia' ? 'Principal' : 'Suplementar',
                validade: ''
            }));

            let hasPrincipal = false;
            const finalOabs = mappedOabs.map((o: any) => {
                if (['Principal', 'Transferencia', 'Originaria'].includes(o.tipo)) {
                    if (!hasPrincipal) {
                        hasPrincipal = true;
                        return { ...o, tipo: 'Principal' };
                    }
                    return { ...o, tipo: 'Suplementar' };
                }
                return { ...o, tipo: 'Suplementar' };
            });

            if (finalOabs.length > 0 && !hasPrincipal) {
                finalOabs[0].tipo = 'Principal';
            }

            setFormData({
                ...formData,
                oabs: finalOabs
            });

            toast.success(`Dados atualizados com sucesso (${advogado.nome}).`);
        } catch (err: any) {
            console.error('Erro ao consultar CNA:', err);
            toast.error('Falha ao consultar o CNA. Tente novamente mais tarde.');
        } finally {
            setIsConsultingCNA(false);
        }
    }

    return (
        <section className="space-y-4">
            <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> OAB
            </h3>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 mb-4">
                    <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            PIS/PASEP
                        </label>
                        <input
                            className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                            value={formData.pis_pasep || ''}
                            onChange={e => setFormData({ ...formData, pis_pasep: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                            maxLength={11}
                            placeholder="99999999999"
                            disabled={isViewMode}
                            readOnly={isViewMode}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h4 className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest flex items-center gap-2">
                            Inscrições OAB
                        </h4>
                        {!isViewMode && (
                            <button
                                type="button"
                                onClick={handleConsultarCNA}
                                disabled={isConsultingCNA}
                                className="flex items-center gap-2 text-[9px] font-black uppercase text-white bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 px-3 py-1.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                title="Consultar dados no Cadastro Nacional dos Advogados"
                            >
                                {isConsultingCNA ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                                Consultar no CNA
                            </button>
                        )}
                    </div>
                    {!isViewMode && (
                        <button
                            type="button"
                            onClick={() => {
                                const currentOabs = formData.oabs || [];
                                setFormData({
                                    ...formData,
                                    oabs: [...currentOabs, { numero: '', uf: '', tipo: 'Suplementar', validade: '' }]
                                });
                            }}
                            className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded transition-colors"
                            title="Adicionar OAB Suplementar"
                        >
                            + Suplementar
                        </button>
                    )}
                </div>

                {(formData.oabs?.length ? formData.oabs : [{ numero: '', uf: '', tipo: 'Principal', validade: '' }]).map((oab, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100 relative group">
                        {oab.tipo === 'Principal' ? (
                            <div className="absolute -top-2 -left-2 bg-[#1e3a8a] text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm z-10">
                                Principal
                            </div>
                        ) : (
                            <div className="absolute -top-2 -left-2 bg-gray-500 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm z-10">
                                Suplementar
                            </div>
                        )}

                        {!isViewMode && oab.tipo !== 'Principal' && (
                            <button
                                type="button"
                                onClick={() => {
                                    const newOabs = [...(formData.oabs || [])];
                                    newOabs.splice(index, 1);
                                    setFormData({ ...formData, oabs: newOabs });
                                }}
                                className="absolute -top-2 -right-2 bg-white text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-full shadow-sm border border-gray-200 transition-all z-10"
                                title="Remover OAB Suplementar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        )}

                        <div className="md:col-span-1">
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                Número
                            </label>
                            <input
                                className={`w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                value={oab.numero || ''}
                                onChange={e => {
                                    let newOabs = [...(formData.oabs || [])];
                                    if (newOabs.length === 0) newOabs = [{ numero: '', uf: '', tipo: 'Principal', validade: '' }];
                                    newOabs[index] = { ...newOabs[index], numero: e.target.value };
                                    setFormData({ ...formData, oabs: newOabs });
                                }}
                                placeholder="Ex: 123456"
                                disabled={isViewMode}
                                readOnly={isViewMode}
                            />
                        </div>

                        <div className="md:col-span-1">
                            <SearchableSelect
                                label="UF"
                                value={oab.uf || ''}
                                onChange={v => {
                                    let newOabs = [...(formData.oabs || [])];
                                    if (newOabs.length === 0) newOabs = [{ numero: '', uf: '', tipo: 'Principal', validade: '' }];
                                    newOabs[index] = { ...newOabs[index], uf: v.toUpperCase() };
                                    setFormData({ ...formData, oabs: newOabs });
                                }}
                                options={ESTADOS_BRASIL_UF.map(uf => ({ name: uf }))}
                                placeholder="UF"
                                uppercase={true}
                                disabled={isViewMode}
                            />
                        </div>

                        <div className="md:col-span-1">
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                Emissão
                            </label>
                            <input
                                className={`w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                value={oab.validade || ''}
                                onChange={e => {
                                    let newOabs = [...(formData.oabs || [])];
                                    if (newOabs.length === 0) newOabs = [{ numero: '', uf: '', tipo: 'Principal', validade: '' }];
                                    newOabs[index] = { ...newOabs[index], validade: maskDate(e.target.value) };
                                    setFormData({ ...formData, oabs: newOabs });
                                }}
                                maxLength={10}
                                placeholder="DD/MM/AAAA"
                                disabled={isViewMode}
                                readOnly={isViewMode}
                            />
                        </div>
                    </div>
                ))}


            </div>
        </section>
    )
}
