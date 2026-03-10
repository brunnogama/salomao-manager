import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import {
    TrendingUp,
    Users,
    Briefcase,
    DollarSign,
    Calendar,
    Loader2,
    FileSignature
} from 'lucide-react';

interface Collaborator {
    id: string;
    name: string;
    role: string | null;
    hire_date: string | null;
    area: string | null; // Jurídica ou Administrativa
    status: string;
}

interface Contract {
    id: string;
    client_name: string;
    contract_date: string | null;
    status: string;
    pro_labore: string | null;
    final_success_fee: string | null;
}

export function Demandas() {
    const [loading, setLoading] = useState(true);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);

    // Filtros de Data. Default: 1 de Julho de 2025 até hoje.
    const [startDate, setStartDate] = useState(() => {
        // Para testar, manter a lógica pedida pelo usuário: Julho/2025 até hoje
        return '2025-07-01';
    });

    const [endDate, setEndDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Collaborators (Advogados) hired in the period
            // Considerando que queremos Área Jurídica e status ativo (ou inativo desde que contratado no período)
            // Buscamos todos e filtramos no JS, ou filtramos no supabase.
            // A tabela é "collaborators". Área pode estar no campo 'area' ou 'atuacao'.
            // Como o DB pode ter nuances, vamos buscar e filtrar em memoria para ser seguro no começo.
            const { data: collabData, error: collabError } = await supabase
                .from('collaborators')
                .select(`
                    id, 
                    name, 
                    role:role_id(id, name), 
                    hire_date, 
                    area, 
                    status
                `)
                .gte('hire_date', startDate)
                .lte('hire_date', endDate);

            if (collabError) throw collabError;

            // Filtrar apenas da área jurídica
            // Tabela também tem as 'roles' em inglês ou português? Geralmente role no RH é o Cargo. 
            // Em Utils vimos as roles da jurídica, estão salvos na string do cargo, ou na Area='Jurídica'
            const juridicaCollabs = (collabData as any[] || []).filter(c => {
                // Check if 'area' is 'Jurídica' or the role name matches Juridica terms
                const roleName = c.role?.name || typeof c.role === 'string' ? c.role : '';
                const isJuridica = c.area === 'Jurídica' ||
                    (typeof roleName === 'string' && (roleName.includes('Advogado') || roleName.includes('Sócio') || roleName.includes('Jurídico') || roleName.includes('Paralegal') || roleName.includes('Estagiário')));

                // Map it so it's a flat format
                return isJuridica;
            }).map(c => ({
                ...c,
                role: c.role?.name || c.role
            }));
            setCollaborators(juridicaCollabs);

            // Fetch Contracts closed in the period
            const { data: contractData, error: contractError } = await supabase
                .from('contracts')
                .select('id, client_name, contract_date, status, pro_labore, final_success_fee')
                .eq('status', 'active') // Status active mean it's closed/signed
                .gte('contract_date', startDate)
                .lte('contract_date', endDate);

            if (contractError) throw contractError;
            setContracts((contractData as any[]) || []);

        } catch (error) {
            console.error('Error fetching Demandas data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickSelect = (type: '30_days' | '6_months' | 'july_2025') => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        if (type === '30_days') {
            const past30 = new Date();
            past30.setDate(today.getDate() - 30);
            setStartDate(past30.toISOString().split('T')[0]);
            setEndDate(todayStr);
        } else if (type === '6_months') {
            const past6 = new Date();
            past6.setMonth(today.getMonth() - 6);
            setStartDate(past6.toISOString().split('T')[0]);
            setEndDate(todayStr);
        } else if (type === 'july_2025') {
            setStartDate('2025-07-01');
            setEndDate(todayStr);
        }
    };

    // Helper para limpar formatação monetária padrão BRL ex: "R$ 1.000,00" para número math.
    const parseCurrency = (val: any): number => {
        if (!val) return 0;
        // Garantir que é string antes de tentar usar .replace
        const strVal = typeof val === 'string' ? val : String(val);
        // Remove "R$", pontos e troca vírgula por ponto
        const cleanStr = strVal.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
        const num = parseFloat(cleanStr);
        return isNaN(num) ? 0 : num;
    };

    const formatCurrency = (val: number): string => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    // Metrics calculation
    const metrics = useMemo(() => {
        const totalAdvogados = collaborators.length;
        const totalContratos = contracts.length;

        let totalProLaboreNum = 0;
        let totalExitoNum = 0;

        contracts.forEach(c => {
            totalProLaboreNum += parseCurrency(c.pro_labore);
            totalExitoNum += parseCurrency(c.final_success_fee);
        });

        return {
            totalAdvogados,
            totalContratos,
            totalProLabore: formatCurrency(totalProLaboreNum),
            totalExito: formatCurrency(totalExitoNum)
        };
    }, [collaborators, contracts]);

    // Group Lawyers by level (role)
    const lawyersByLevel = useMemo(() => {
        const counts: Record<string, number> = {};
        collaborators.forEach(c => {
            const role = c.role || 'Não Informado';
            counts[role] = (counts[role] || 0) + 1;
        });
        // Sort by count descending
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [collaborators]);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 p-4 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-2 sm:p-3 shadow-lg shrink-0">
                        <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Demandas vs Contratações</h1>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">Comparativo Histórico Jurídico</p>
                    </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => handleQuickSelect('30_days')}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-colors hover:bg-gray-200 text-gray-600"
                        >
                            30 Dias
                        </button>
                        <button
                            onClick={() => handleQuickSelect('6_months')}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-colors hover:bg-gray-200 text-gray-600"
                        >
                            6 Meses
                        </button>
                        <button
                            onClick={() => handleQuickSelect('july_2025')}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-colors bg-white shadow-sm text-[#1e3a8a]"
                        >
                            Desde Julho 2025
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1 sm:ml-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-xs border-none outline-none text-gray-600 cursor-pointer bg-transparent w-28"
                        />
                        <span className="text-gray-300">até</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-xs border-none outline-none text-gray-600 cursor-pointer bg-transparent w-28"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-20 text-center flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin mb-4" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carregando comparativo...</p>
                </div>
            ) : (
                <>
                    {/* Indicadores Principais */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-[#1e3a8a]/30 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Users className="w-16 h-16 text-[#1e3a8a] -mr-4 -mt-4 transform rotate-12" />
                            </div>
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Contratações Jud.</h3>
                            </div>
                            <p className="text-3xl font-black text-[#0a192f] mt-2 relative z-10">{metrics.totalAdvogados}</p>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-[#1e3a8a]/30 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Briefcase className="w-16 h-16 text-emerald-600 -mr-4 -mt-4 transform rotate-12" />
                            </div>
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <Briefcase className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Contratos Fechados</h3>
                            </div>
                            <p className="text-3xl font-black text-emerald-700 mt-2 relative z-10">{metrics.totalContratos}</p>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-[#1e3a8a]/30 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <DollarSign className="w-16 h-16 text-[#0a192f] -mr-4 -mt-4 transform rotate-12" />
                            </div>
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-[#0a192f]" />
                                </div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Total Pró-labore</h3>
                            </div>
                            <p className="text-2xl font-black text-[#0a192f] mt-2 truncate relative z-10">{metrics.totalProLabore}</p>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-[#1e3a8a]/30 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingUp className="w-16 h-16 text-emerald-600 -mr-4 -mt-4 transform rotate-12" />
                            </div>
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Total de Êxito</h3>
                            </div>
                            <p className="text-2xl font-black text-emerald-700 mt-2 truncate relative z-10">{metrics.totalExito}</p>
                        </div>
                    </div>

                    {/* Tabelas Lado a Lado */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                        {/* Bloco 1: Advogados por Nível */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider">Advogados Contratados por Nível</h3>
                            </div>
                            <div className="p-2 overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/80 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                            <th className="p-4 rounded-tl-lg">Cargo / Nível</th>
                                            <th className="p-4 text-right rounded-tr-lg">Quantidade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lawyersByLevel.length === 0 ? (
                                            <tr>
                                                <td colSpan={2} className="p-8 text-center text-sm text-gray-400 font-medium">Nenhum profissional contratado no período selecionado.</td>
                                            </tr>
                                        ) : (
                                            lawyersByLevel.map(([role, count], idx) => (
                                                <tr key={idx} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                    <td className="p-4 font-bold text-gray-700 text-xs">{role}</td>
                                                    <td className="p-4 text-right">
                                                        <span className="inline-flex items-center justify-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-black text-[11px] min-w-[32px]">
                                                            {count}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Bloco 2: Contratos Fechados */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 rounded-lg">
                                        <FileSignature className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider">Detalhamento de Contratos Fechados</h3>
                                </div>
                            </div>
                            <div className="p-2 overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                            <th className="p-4 rounded-tl-lg">Cliente / Contrato</th>
                                            <th className="p-4 text-right">Data</th>
                                            <th className="p-4 text-right">Pró-labore</th>
                                            <th className="p-4 text-right rounded-tr-lg">Êxito</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contracts.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-sm text-gray-400 font-medium">Nenhum contrato fechado no período selecionado.</td>
                                            </tr>
                                        ) : (
                                            contracts.sort((a, b) => new Date(b.contract_date || 0).getTime() - new Date(a.contract_date || 0).getTime()).map((c) => (
                                                <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                    <td className="p-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-800 text-xs">{c.client_name || 'Sem Cliente'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right text-xs text-gray-500">
                                                        {c.contract_date ? new Date(c.contract_date).toLocaleDateString('pt-BR') : '-'}
                                                    </td>
                                                    <td className="p-4 text-right text-xs font-bold text-[#0a192f]">
                                                        {c.pro_labore ? formatCurrency(parseCurrency(c.pro_labore)) : '-'}
                                                    </td>
                                                    <td className="p-4 text-right text-xs font-bold text-emerald-600">
                                                        {c.final_success_fee ? formatCurrency(parseCurrency(c.final_success_fee)) : '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </>
            )}
        </div>
    );
}
