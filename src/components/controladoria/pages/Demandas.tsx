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
            const [collabRes, rolesRes, contractRes] = await Promise.all([
                supabase
                    .from('collaborators')
                    .select('id, name, role, hire_date, area, status')
                    .gte('hire_date', startDate)
                    .lte('hire_date', endDate),
                supabase
                    .from('roles')
                    .select('id, name'),
                supabase
                    .from('contracts')
                    .select('id, client_name, contract_date, status, pro_labore, pro_labore_extras, final_success_fee, intermediate_fees, final_success_extras, timesheet, percent_extras, final_success_percent')
                    .eq('status', 'active') // Status active mean it's closed/signed
                    .gte('contract_date', startDate)
                    .lte('contract_date', endDate)
            ]);

            if (collabRes.error) throw collabRes.error;
            if (contractRes.error) throw contractRes.error;

            const rolesMap = new Map(rolesRes.data?.map((r: any) => [String(r.id), r.name]) || []);

            // Filtrar apenas da área jurídica
            // Tabela também tem as 'roles' em inglês ou português? Geralmente role no RH é o Cargo. 
            // Em Utils vimos as roles da jurídica, estão salvos na string do cargo, ou na Area='Jurídica'
            const juridicaCollabs = (collabRes.data as any[] || []).filter(c => {
                // Check if 'area' is 'Jurídica' or the role name matches Juridica terms
                const mappedRoleName = rolesMap.get(String(c.role)) || (typeof c.role === 'string' ? c.role : '');
                const isJuridica = c.area === 'Jurídica' ||
                    (typeof mappedRoleName === 'string' && (mappedRoleName.includes('Advogado') || mappedRoleName.includes('Sócio') || mappedRoleName.includes('Jurídico') || mappedRoleName.includes('Paralegal') || mappedRoleName.includes('Estagiário')));

                // Map it so it's a flat format
                return isJuridica;
            }).map(c => ({
                ...c,
                role: rolesMap.get(String(c.role)) || c.role
            }));
            setCollaborators(juridicaCollabs);
            setContracts((contractRes.data as any[]) || []);

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

        // Handle array of strings (like tags used in Contracts)
        if (Array.isArray(val)) {
            return val.reduce((acc: number, curr: any) => acc + parseCurrency(curr), 0);
        }

        // Garantir que é string antes de tentar usar .replace
        let strVal = typeof val === 'string' ? val : String(val);

        // Se for um percentual, retornamos 0 para não somar como valor financeiro
        if (strVal.includes('%')) return 0;

        // Se a string parece um JSON array, tentar parsear
        if (strVal.trim().startsWith('[') && strVal.trim().endsWith(']')) {
            try {
                const parsedArray = JSON.parse(strVal);
                if (Array.isArray(parsedArray)) {
                    return parsedArray.reduce((acc: number, curr: any) => acc + parseCurrency(curr), 0);
                }
            } catch (e) {
                // If it fails to parse (e.g., "[Not an array"), just fall through to normal currency parse
            }
        }

        // Remove "R$", pontos e troca vírgula por ponto
        const cleanStr = strVal.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
        const num = parseFloat(cleanStr);
        return isNaN(num) ? 0 : num;
    };

    const hasPercentageFees = (c: any): boolean => {
        let hasPercent = false;
        if (c.percent_extras && Array.isArray(c.percent_extras) && c.percent_extras.some((p: string) => p.trim() !== '')) {
            hasPercent = true;
        }
        if (c.final_success_percent && c.final_success_percent.trim() !== '') {
            hasPercent = true;
        }

        // As vezes o percentual é salvo direto no pro_labore ou êxito
        const checkPercent = (val: any) => {
            if (!val) return false;
            if (typeof val === 'string' && val.includes('%')) return true;
            if (Array.isArray(val) && val.some(v => typeof v === 'string' && v.includes('%'))) return true;
            if (typeof val === 'string' && val.startsWith('[')) {
                try {
                    const parsed = JSON.parse(val);
                    if (Array.isArray(parsed) && parsed.some(v => typeof v === 'string' && v.includes('%'))) return true;
                } catch { return false; }
            }
            return false;
        };

        if (checkPercent(c.pro_labore) || checkPercent(c.pro_labore_extras) ||
            checkPercent(c.final_success_fee) || checkPercent(c.final_success_extras) ||
            checkPercent(c.intermediate_fees)) {
            hasPercent = true;
        }

        return hasPercent;
    };

    const isOnlyPercentage = (c: any): boolean => {
        const totalMonetary = calculateTotalProLabore(c) + calculateTotalSuccess(c);
        return totalMonetary === 0 && hasPercentageFees(c);
    };

    const calculateTotalProLabore = (c: any): number => {
        let total = parseCurrency(c.pro_labore);

        if (c.pro_labore_extras && Array.isArray(c.pro_labore_extras)) {
            c.pro_labore_extras.forEach((fee: string) => total += parseCurrency(fee));
        }
        return total;
    };

    const calculateTotalSuccess = (c: any): number => {
        let total = parseCurrency(c.final_success_fee);

        if (c.final_success_extras && Array.isArray(c.final_success_extras)) {
            c.final_success_extras.forEach((fee: string) => total += parseCurrency(fee));
        }

        if (c.intermediate_fees && Array.isArray(c.intermediate_fees)) {
            c.intermediate_fees.forEach((fee: string) => total += parseCurrency(fee));
        }
        return total;
    };

    const formatCurrency = (val: number): string => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    // Metrics calculation
    const metrics = useMemo(() => {
        const totalAdvogados = collaborators.length;
        const totalEstagiarios = collaborators.filter(c => c.role?.toLowerCase().includes('estagiário') || c.role?.toLowerCase().includes('estagiario')).length;
        const totalOutros = totalAdvogados - totalEstagiarios;
        const totalContratos = contracts.length;

        let totalProLaboreNum = 0;
        let totalExitoNum = 0;

        contracts.forEach(c => {
            totalProLaboreNum += calculateTotalProLabore(c);
            totalExitoNum += calculateTotalSuccess(c);
        });

        return {
            totalAdvogados,
            totalEstagiarios,
            totalOutros,
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

    // Metrics By Leader
    const hiresByLeader = useMemo(() => {
        const leaderData: Record<string, { total: number, estagiarios: number, advogados: number }> = {};
        collaborators.forEach(c => {
            const leaderName = (c as any).leader_name || 'Sem Líder Direto';
            if (!leaderData[leaderName]) {
                leaderData[leaderName] = { total: 0, estagiarios: 0, advogados: 0 };
            }
            leaderData[leaderName].total += 1;

            const isEstagiario = typeof c.role === 'string' && (c.role.toLowerCase().includes('estagiário') || c.role.toLowerCase().includes('estagiario'));
            if (isEstagiario) {
                leaderData[leaderName].estagiarios += 1;
            } else {
                leaderData[leaderName].advogados += 1;
            }
        });

        return Object.entries(leaderData).sort((a, b) => b[1].total - a[1].total);
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
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Contratações Jud.</h3>
                            </div>
                            <div className="flex items-baseline gap-2 mt-2 relative z-10">
                                <span className="text-3xl font-black text-[#0a192f]">{metrics.totalAdvogados}</span>
                                <span className="text-[11px] font-bold text-gray-500">({metrics.totalEstagiarios} Estagiários / {metrics.totalOutros} Demais)</span>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-[#1e3a8a]/30 transition-all">
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <Briefcase className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Contratos Fechados</h3>
                            </div>
                            <p className="text-3xl font-black text-emerald-700 mt-2 relative z-10">{metrics.totalContratos}</p>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-[#1e3a8a]/30 transition-all">
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-[#0a192f]" />
                                </div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Total Pró-labore</h3>
                            </div>
                            <p className="text-2xl font-black text-[#0a192f] mt-2 truncate relative z-10">{metrics.totalProLabore}</p>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-[#1e3a8a]/30 transition-all">
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                        {/* Bloco 1: Jurídicos por Nível (Menor) */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:col-span-1">
                            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider">Jurídicos Contratados por Nível</h3>
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

                            {/* Divisão por Líder */}
                            <div className="p-5 border-t border-gray-100 flex items-center gap-3">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <Users className="w-5 h-5 text-purple-600" />
                                </div>
                                <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider">Divisão por Líder Direto</h3>
                            </div>
                            <div className="p-2 overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/80 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                            <th className="p-4 rounded-tl-lg">Líder</th>
                                            <th className="p-4 text-center">Advogados</th>
                                            <th className="p-4 text-center">Estagiários</th>
                                            <th className="p-4 text-right rounded-tr-lg">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hiresByLeader.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-sm text-gray-400 font-medium">Nenhum dado encontrado.</td>
                                            </tr>
                                        ) : (
                                            hiresByLeader.map(([leader, data], idx) => (
                                                <tr key={idx} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                    <td className="p-4 font-bold text-gray-700 text-xs">{leader}</td>
                                                    <td className="p-4 text-center text-xs font-semibold text-gray-600">{data.advogados}</td>
                                                    <td className="p-4 text-center text-xs font-semibold text-gray-600">{data.estagiarios}</td>
                                                    <td className="p-4 text-right">
                                                        <span className="inline-flex items-center justify-center px-3 py-1 bg-purple-50 text-purple-700 rounded-full font-black text-[11px] min-w-[32px]">
                                                            {data.total}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Bloco 2: Contratos Fechados (Maior) */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:col-span-2">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 rounded-lg">
                                        <FileSignature className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider">Detalhamento de Contratos Fechados</h3>
                                </div>
                            </div>
                            <div className="p-2 overflow-x-auto max-h-[700px] overflow-y-auto custom-scrollbar flex-1 relative">
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                    <thead className="sticky top-0 z-20 shadow-[0_1px_0_0_#f3f4f6]">
                                        <tr className="bg-white text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                            <th className="p-4 rounded-tl-lg bg-gray-50">Cliente / Contrato</th>
                                            <th className="p-4 text-right bg-gray-50">Data</th>
                                            <th className="p-4 text-right bg-gray-50">Pró-labore</th>
                                            <th className="p-4 text-right bg-gray-50">Êxito</th>
                                            <th className="p-4 text-center bg-gray-50">Timesheet</th>
                                            <th className="p-4 text-center rounded-tr-lg bg-gray-50">Hon. %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contracts.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-sm text-gray-400 font-medium">Nenhum contrato fechado no período selecionado.</td>
                                            </tr>
                                        ) : (
                                            contracts.sort((a, b) => new Date(b.contract_date || 0).getTime() - new Date(a.contract_date || 0).getTime()).map((c: any) => (
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
                                                        {calculateTotalProLabore(c) > 0 ? formatCurrency(calculateTotalProLabore(c)) : '-'}
                                                    </td>
                                                    <td className="p-4 text-right text-xs font-bold text-emerald-600">
                                                        {calculateTotalSuccess(c) > 0 ? formatCurrency(calculateTotalSuccess(c)) : '-'}
                                                    </td>
                                                    <td className="p-4 text-center text-xs font-bold text-gray-500">
                                                        {c.timesheet ? <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Sim</span> : '-'}
                                                    </td>
                                                    <td className="p-4 text-center text-xs font-bold text-gray-500">
                                                        {isOnlyPercentage(c) ? <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Sim</span> : '-'}
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
