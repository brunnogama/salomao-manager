import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
    TrendingUp,
    Users,
    Briefcase,
    DollarSign,
    Calendar,
    Loader2,
    FileSignature,
    Download
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    LabelList
} from 'recharts';

interface Collaborator {
    id: string;
    name: string;
    role: string | null;
    hire_date: string | null;
    area: string | null; // Jurídica ou Administrativa
    status: string;
    termination_date: string | null;
}

interface Contract {
    id: string;
    client_name: string;
    contract_date: string | null;
    status: string;
    pro_labore: string | null;
    final_success_fee: string | null;
}

interface HeadcountData {
    month: string;
    hires: number;
    terminations: number;
    balance: number;
}

export function Demandas() {
    const [loading, setLoading] = useState(true);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]); // Hired in period
    const [allCollaborators, setAllCollaborators] = useState<Collaborator[]>([]); // All juridica (active + recent terminated)
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    const pageRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

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
            const [collabRes, rolesRes, contractRes, partnersRes] = await Promise.all([
                supabase
                    .from('collaborators')
                    .select('id, name, role, hire_date, area, status, termination_date, leader:leader_id(name)')
                    // We need to fetch ALL juridical collaborators to compute the headcount properly. 
                    // We avoid filtering by hire_date here to get historical data for the chart, 
                    // To be safe and get accurate headcount for the period, let's fetch all active, OR terminated after the startDate.
                    .or(`status.eq.active,termination_date.gte.${startDate}`),
                supabase
                    .from('roles')
                    .select('id, name'),
                supabase
                    .from('contracts')
                    .select('id, client_name, contract_date, status, pro_labore, pro_labore_extras, final_success_fee, intermediate_fees, final_success_extras, timesheet, percent_extras, final_success_percent, partner_id')
                    .eq('status', 'active') // Status active mean it's closed/signed
                    .gte('contract_date', startDate)
                    .lte('contract_date', endDate),
                supabase
                    .from('partners')
                    .select('id, name')
            ]);

            if (collabRes.error) throw collabRes.error;
            if (contractRes.error) throw contractRes.error;

            const rolesMap = new Map(rolesRes.data?.map((r: any) => [String(r.id), r.name]) || []);

            // Filtrar apenas da área jurídica
            // Tabela também tem as 'roles' em inglês ou português? Geralmente role no RH é o Cargo. 
            // Em Utils vimos as roles da jurídica, estão salvos na string do cargo, ou na Area='Jurídica'
            const partnersMap = new Map(partnersRes.data?.map((p: any) => [String(p.id), p.name]) || []);

            const juridicaCollabs = (collabRes.data as any[] || []).filter(c => {
                // Check if 'area' is 'Jurídica' or the role name matches Juridica terms
                const mappedRoleName = rolesMap.get(String(c.role)) || (typeof c.role === 'string' ? c.role : '');
                const isJuridica = c.area === 'Jurídica' ||
                    (typeof mappedRoleName === 'string' && (mappedRoleName.includes('Advogado') || mappedRoleName.includes('Sócio') || mappedRoleName.includes('Jurídico') || mappedRoleName.includes('Paralegal') || mappedRoleName.includes('Estagiário')));

                return isJuridica;
            }).map(c => ({
                ...c,
                role: rolesMap.get(String(c.role)) || c.role,
                leader_name: c.leader?.name || 'Sem Líder Direto'
            }));

            // The dashboard cards and tables expect `collaborators` to be those HIRED in the selected period.
            // The chart needs historical data. 
            // We will store all fetched in `allJuridicaCollabs` and filter `collaborators` for the UI cards.
            const hiredInPeriod = juridicaCollabs.filter(c => {
                if (!c.hire_date) return false;
                const hDate = c.hire_date;
                return hDate >= startDate && hDate <= endDate;
            });

            setCollaborators(hiredInPeriod);
            setAllCollaborators(juridicaCollabs);

            const contractsWithPartners = (contractRes.data as any[] || []).map(c => ({
                ...c,
                partner_name: partnersMap.get(String(c.partner_id)) || 'Não Informado'
            }));
            setContracts(contractsWithPartners);

        } catch (error) {
            console.error('Error fetching Demandas data', error);
        } finally {
            setLoading(false);
            setIsFirstLoad(false);
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

        const checkTextForPercent = (text: any) => {
            if (!text || typeof text !== 'string') return false;
            const lower = text.toLowerCase();
            return lower.includes('%') || lower.includes('percent') || lower.includes('porcentagem') || lower.includes('êxito de') || lower.includes('exito de') || lower.includes('sobre o valor');
        }

        if (checkTextForPercent(c.pro_labore_clause) || checkTextForPercent(c.final_success_fee_clause) || checkTextForPercent(c.other_fees_clause)) {
            hasPercent = true;
        }

        if (c.pro_labore_extras_clauses && Array.isArray(c.pro_labore_extras_clauses) && c.pro_labore_extras_clauses.some(checkTextForPercent)) hasPercent = true;
        if (c.final_success_extras_clauses && Array.isArray(c.final_success_extras_clauses) && c.final_success_extras_clauses.some(checkTextForPercent)) hasPercent = true;
        if (c.intermediate_fees_clauses && Array.isArray(c.intermediate_fees_clauses) && c.intermediate_fees_clauses.some(checkTextForPercent)) hasPercent = true;

        return hasPercent;
    };

    const isOnlyPercentage = (c: any): boolean => {
        if (c.timesheet) return false;
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
    // Metrics By Leader (Based on active headcount in period + hires + terminations)
    const hiresByLeader = useMemo(() => {
        const leaderData: Record<string, { ativos: number, entradas: number, saidas: number }> = {};

        allCollaborators.forEach(c => {
            const leaderName = (c as any).leader_name || 'Sem Líder Direto';
            if (!leaderData[leaderName]) {
                leaderData[leaderName] = { ativos: 0, entradas: 0, saidas: 0 };
            }

            // Ativos (Active right now, or active within the period depending on definition, but user wants 'total de ativos atual por lider')
            // If they are not terminated, or terminated in the future, they are active now.
            if (c.status === 'ativo' || !c.termination_date) {
                leaderData[leaderName].ativos += 1;
            }

            // Entradas no periodo
            if (c.hire_date && c.hire_date >= startDate && c.hire_date <= endDate) {
                leaderData[leaderName].entradas += 1;
            }

            // Saídas no periodo
            if (c.termination_date && c.termination_date >= startDate && c.termination_date <= endDate) {
                leaderData[leaderName].saidas += 1;
            }
        });

        return Object.entries(leaderData).sort((a, b) => b[1].ativos - a[1].ativos);
    }, [allCollaborators, startDate, endDate]);

    // Headcount Evolution Logic
    const headcountEvolution = useMemo(() => {
        // Build a list of months from startDate to EndDate
        if (!allCollaborators || allCollaborators.length === 0) return [];

        const startDateObj = new Date(startDate + 'T12:00:00'); 
        const endDateObj = new Date(endDate + 'T12:00:00');

        let currentDate = new Date(startDateObj);
        const months: string[] = [];

        while (currentDate <= endDateObj) {
            const m = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            if (!months.includes(m)) months.push(m);
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        const data: Record<string, HeadcountData> = {};
        months.forEach(m => {
            const [year, month] = m.split('-');
            const displayMonth = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            data[m] = { month: displayMonth.replace('. de ', '/'), hires: 0, terminations: 0, balance: 0 };
        });

        // We calculate balance as a running total.
        let baseline = 0;
        const startMonthStr = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}`;

        allCollaborators.forEach(c => {
            const hDateStr = c.hire_date ? c.hire_date.substring(0, 7) : null;
            const tDateStr = c.termination_date ? c.termination_date.substring(0, 7) : null;

            // Baseline: Hired before the startMonth and (Still active OR terminated in or after startMonth)
            if (hDateStr && hDateStr < startMonthStr) {
                baseline += 1;
            } else if (hDateStr && data[hDateStr]) {
                data[hDateStr].hires += 1;
            }

            if (tDateStr && data[tDateStr]) {
                data[tDateStr].terminations -= 1; // Negative for visualizing leaving
            }
        });

        let currentBalance = baseline;
        const result: HeadcountData[] = [];
        months.forEach(m => {
            currentBalance += data[m].hires;
            currentBalance += data[m].terminations; // It's negative already
            data[m].balance = currentBalance;
            result.push(data[m]);
        });

        return result;
    }, [allCollaborators, startDate, endDate]);

    const exportToPDF = async (elementRef: React.RefObject<HTMLDivElement>, filename: string) => {
        if (!elementRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(elementRef.current, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            const pageHeight = pdf.internal.pageSize.getHeight();

            let heightLeft = pdfHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position -= pageHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`${filename}.pdf`);
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            alert('Não foi possível gerar o PDF.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div ref={pageRef} className="flex flex-col min-h-screen bg-gray-50 p-4 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-2.5 sm:p-3 shadow-lg shrink-0">
                        <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Demandas vs Contratações</h1>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">Comparativo Histórico Jurídico</p>
                    </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto relative">
                    {loading && !isFirstLoad && (
                        <div className="absolute -left-6 top-1/2 -translate-y-1/2 hidden lg:flex">
                            <Loader2 className="w-4 h-4 text-[#1e3a8a] animate-spin" />
                        </div>
                    )}
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

            {isFirstLoad ? (
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-20 text-center flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin mb-4" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carregando comparativo...</p>
                </div>
            ) : (
                <div className={`space-y-4 sm:space-y-6 transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
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
                                            <th className="p-4 text-center">Entradas</th>
                                            <th className="p-4 text-center">Saídas</th>
                                            <th className="p-4 text-right rounded-tr-lg">Total Ativos (Atual)</th>
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
                                                    <td className="p-4 text-center text-xs font-semibold text-emerald-600">{data.entradas > 0 ? `+${data.entradas}` : '-'}</td>
                                                    <td className="p-4 text-center text-xs font-semibold text-red-600">{data.saidas > 0 ? `-${data.saidas}` : '-'}</td>
                                                    <td className="p-4 text-right">
                                                        <span className="inline-flex items-center justify-center px-3 py-1 bg-purple-50 text-purple-700 rounded-full font-black text-[11px] min-w-[32px]">
                                                            {data.ativos}
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
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:col-span-2 space-y-6">

                            {/* Gráfico de Headcount */}
                            <div className="flex flex-col flex-1 border-b border-gray-100 pb-4">
                                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 rounded-lg">
                                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider">Evolução do Headcount (Jurídico)</h3>
                                    </div>
                                </div>
                                <div className="p-4 h-[300px] w-full">
                                    {headcountEvolution.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-sm text-gray-400 font-medium">Sem dados para exibir.</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={headcountEvolution} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                                />
                                                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                                                <Area type="monotone" name="Saldo Ativos" dataKey="balance" stroke="#1e3a8a" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)">
                                                    <LabelList dataKey="balance" position="top" offset={10} fontSize={10} fontWeight="bold" fill="#1e3a8a" />
                                                </Area>
                                                <Area type="monotone" name="Entradas" dataKey="hires" stroke="#10b981" strokeWidth={2} fillOpacity={0}>
                                                    <LabelList dataKey="hires" position="top" offset={10} fontSize={10} fontWeight="bold" fill="#10b981" />
                                                </Area>
                                                <Area type="monotone" name="Saídas" dataKey="terminations" stroke="#ef4444" strokeWidth={2} fillOpacity={0}>
                                                    <LabelList dataKey="terminations" position="bottom" offset={10} fontSize={10} fontWeight="bold" fill="#ef4444" />
                                                </Area>
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Tabela de Contratos */}
                            <div ref={tableRef} className="flex flex-col flex-1 bg-white">
                                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-50 rounded-lg">
                                            <FileSignature className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider">Detalhamento de Contratos Fechados</h3>
                                    </div>
                                    <button
                                        onClick={() => exportToPDF(tableRef, 'Detalhamento_Contratos')}
                                        disabled={isExporting}
                                        data-html2canvas-ignore
                                        className="text-gray-500 hover:text-[#1e3a8a] p-2 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                                        title="Exportar Tabela"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span className="text-xs font-bold hidden sm:block">PDF</span>
                                    </button>
                                </div>
                                <div className="p-2 overflow-x-auto flex-1 relative">
                                    <table className="w-full text-left border-collapse whitespace-nowrap">
                                        <thead className="sticky top-0 z-20 shadow-[0_1px_0_0_#f3f4f6]">
                                            <tr className="bg-white text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                                <th className="p-4 rounded-tl-lg bg-gray-50">Cliente / Contrato</th>
                                                <th className="p-4 bg-gray-50">Sócio Responsável</th>
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
                                                        <td className="p-4 max-w-[180px] lg:max-w-[250px]">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-800 text-xs truncate" title={c.client_name || 'Sem Cliente'}>{c.client_name || 'Sem Cliente'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-xs font-semibold text-gray-600">
                                                            {c.partner_name}
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
                    </div>
                </div>
            )}
        </div>
    );
}
