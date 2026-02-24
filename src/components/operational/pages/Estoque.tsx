import { useState } from 'react'
import {
    Package,
    Plus,
    Search,
    TrendingUp,
    AlertTriangle,
    DollarSign
} from 'lucide-react'
import { AlertModal } from '../../ui/AlertModal'

interface EstoqueItem {
    produto: string;
    entradas: number;
    saidas: number;
    saldo: number;
    estoqueMinimo: number;
    status: 'Conforme' | 'Crítico';
    receitaTotal: number;
    custoTotal: number;
    lucroPrejuizo: number;
}

const INITIAL_DATA: EstoqueItem[] = [
    { produto: 'Bacalhau', entradas: 50, saidas: 20, saldo: 30, estoqueMinimo: 10, status: 'Conforme', receitaTotal: 5000, custoTotal: 2000, lucroPrejuizo: 3000 },
    { produto: 'Azeite', entradas: 100, saidas: 80, saldo: 20, estoqueMinimo: 15, status: 'Conforme', receitaTotal: 8000, custoTotal: 6400, lucroPrejuizo: 1600 },
    { produto: 'Vinho', entradas: 200, saidas: 190, saldo: 10, estoqueMinimo: 20, status: 'Crítico', receitaTotal: 40000, custoTotal: 38000, lucroPrejuizo: 2000 },
    { produto: 'Cesta Básica', entradas: 30, saidas: 5, saldo: 25, estoqueMinimo: 5, status: 'Conforme', receitaTotal: 3000, custoTotal: 500, lucroPrejuizo: 2500 },
    { produto: 'Kit Churrasco', entradas: 40, saidas: 35, saldo: 5, estoqueMinimo: 10, status: 'Crítico', receitaTotal: 12000, custoTotal: 10500, lucroPrejuizo: 1500 },
]

export function Estoque() {
    const [items] = useState<EstoqueItem[]>(INITIAL_DATA)
    const [searchTerm, setSearchTerm] = useState('')

    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        variant: 'success' | 'error' | 'info';
    }>({
        isOpen: false,
        title: '',
        description: '',
        variant: 'info'
    })

    const filteredItems = items.filter(item =>
        item.produto.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    return (
        <div className="flex flex-col h-full space-y-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100">
            {/* PAGE HEADER */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
                        <Package className="h-6 w-6 md:h-7 md:w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
                            Controle de Estoque
                        </h1>
                        <p className="text-xs md:text-sm font-semibold text-gray-500 mt-1 md:mt-0.5">
                            Gestão de produtos, entradas, saídas e rentabilidade
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar produto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all w-64"
                        />
                    </div>
                    <button
                        className="flex items-center gap-2 px-6 py-2 bg-[#1e3a8a] hover:bg-[#112240] text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        NOVA ENTRADA
                    </button>
                </div>
            </div>

            {/* STATS OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Package className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Itens</p>
                        <p className="text-xl font-black text-[#0a192f]">{items.length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lucro Total</p>
                        <p className="text-xl font-black text-[#0a192f]">{formatCurrency(items.reduce((acc, i) => acc + i.lucroPrejuizo, 0))}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                        <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Receita Total</p>
                        <p className="text-xl font-black text-[#0a192f]">{formatCurrency(items.reduce((acc, i) => acc + i.receitaTotal, 0))}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Críticos</p>
                        <p className="text-xl font-black text-[#0a192f]">{items.filter(i => i.status === 'Crítico').length}</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Produto</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Entradas</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Saídas</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Saldo</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estoque Mínimo</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Receita Total</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Custo Total</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Lucro/Prejuízo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredItems.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-[#0a192f]">{item.produto}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-semibold text-blue-600">{item.entradas}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-semibold text-orange-600">{item.saidas}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-sm font-bold ${item.saldo <= item.estoqueMinimo ? 'text-red-600' : 'text-gray-700'}`}>
                                            {item.saldo}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-medium text-gray-500">{item.estoqueMinimo}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.status === 'Conforme'
                                                ? 'bg-green-50 text-green-600 border border-green-100'
                                                : 'bg-red-50 text-red-600 border border-red-100'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-bold text-gray-700">{formatCurrency(item.receitaTotal)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-bold text-gray-700">{formatCurrency(item.custoTotal)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-sm font-black ${item.lucroPrejuizo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {formatCurrency(item.lucroPrejuizo)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredItems.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <div className="p-4 bg-gray-50 rounded-full mb-4">
                            <Search className="h-8 w-8 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">Nenhum produto encontrado.</p>
                    </div>
                )}
            </div>

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                description={alertConfig.description}
                variant={alertConfig.variant}
            />
        </div>
    )
}
