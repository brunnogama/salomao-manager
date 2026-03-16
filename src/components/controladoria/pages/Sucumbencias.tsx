import { useState, useEffect } from 'react';
import { 
    Award, 
    Calendar,
    Loader2,
    TrendingUp,
    DollarSign,
    Scale,
    FileSignature
} from 'lucide-react';

export function Sucumbencias() {
    const [loading, setLoading] = useState(true);
    
    // Filtros de Data. Default: 1 de Janeiro deste ano até hoje.
    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-01-01`;
    });

    const [endDate, setEndDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });

    useEffect(() => {
        // Simulando carregamento inicial
        const timer = setTimeout(() => {
            setLoading(false);
        }, 600);
        return () => clearTimeout(timer);
    }, [startDate, endDate]);

    const handleQuickSelect = (type: '30_days' | '6_months' | 'this_year') => {
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
        } else if (type === 'this_year') {
            setStartDate(`${today.getFullYear()}-01-01`);
            setEndDate(todayStr);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 p-4 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-2 sm:p-3 shadow-lg shrink-0">
                        <Award className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Honorários de Sucumbência</h1>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">Gestão e acompanhamento de valores sucumbenciais</p>
                    </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto relative">
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
                            onClick={() => handleQuickSelect('this_year')}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-colors bg-white shadow-sm text-[#1e3a8a]"
                        >
                            Este Ano
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
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carregando dados de sucumbência...</p>
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Indicadores Principais (Placeholders) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-[#1e3a8a]/30 transition-all">
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Scale className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Processos Ativos</h3>
                            </div>
                            <div className="flex items-baseline gap-2 mt-2 relative z-10">
                                <span className="text-3xl font-black text-[#0a192f]">0</span>
                                <span className="text-[11px] font-bold text-gray-500">com sucumbência</span>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-[#1e3a8a]/30 transition-all">
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Valor Total Esperado</h3>
                            </div>
                            <p className="text-2xl font-black text-emerald-700 mt-2 relative z-10">R$ 0,00</p>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-[#1e3a8a]/30 transition-all">
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-amber-50 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-amber-600" />
                                </div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Valor Recebido</h3>
                            </div>
                            <p className="text-2xl font-black text-amber-700 mt-2 truncate relative z-10">R$ 0,00</p>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-[#1e3a8a]/30 transition-all">
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <FileSignature className="w-5 h-5 text-purple-600" />
                                </div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Em Fase de Execução</h3>
                            </div>
                            <p className="text-3xl font-black text-purple-700 mt-2 truncate relative z-10">0</p>
                        </div>
                    </div>

                    {/* Area principal de conteúdo */}
                    <div className="grid grid-cols-1 gap-6 items-start">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[400px]">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-50 rounded-lg">
                                        <Award className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider">Detalhamento de Sucumbências</h3>
                                </div>
                            </div>
                            
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400">
                                <Award className="w-16 h-16 text-gray-200 mb-4" />
                                <h4 className="text-lg font-bold text-gray-600 mb-2">Página em Construção</h4>
                                <p className="text-sm max-w-md">O módulo de gestão de sucumbências está sendo desenvolvido. Em breve você poderá visualizar aqui o detalhamento de processos, valores previstos e recebidos, rateios e fases de execução.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
