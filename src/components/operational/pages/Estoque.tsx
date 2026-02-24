import { useState, useEffect } from 'react'
import { Boxes, Search, Tag, Hash, TrendingUp, TrendingDown, MinusCircle, DollarSign, Wallet, PieChart } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

interface StockItem {
    id: string
    product: string
    entries: number
    outputs: number
    balance: number
    min_stock: number
    status: string
    total_revenue: number
    total_cost: number
    total_profit_loss: number
}

export function Estoque() {
    const [stockItems, setStockItems] = useState<StockItem[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStock()
    }, [])

    const fetchStock = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('operational_stock')
                .select('*')
                .order('product', { ascending: true })

            if (error) throw error
            if (data) setStockItems(data)
        } catch (error) {
            console.error('Error fetching stock:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredItems = stockItems.filter(item => {
        const matchesSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesSearch
    })

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Estoque Confortável':
                return 'bg-emerald-100 text-emerald-700'
            case 'Estoque Perigoso':
                return 'bg-amber-100 text-amber-700'
            case 'Sem Estoque':
                return 'bg-red-100 text-red-700'
            default:
                return 'bg-gray-100 text-gray-700'
        }
    }

    return (
        <div className="flex flex-col h-full space-y-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100">
            {/* PAGE HEADER */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg shrink-0">
                        <Boxes className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Controle de Estoque</h1>
                        <p className="text-xs md:text-sm font-semibold text-gray-500 mt-1 md:mt-0.5">Visão geral do inventário, entradas, saídas e lucro/prejuízo.</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                {/* Search */}
                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar por produto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <div className="min-w-[1600px]">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
                                        <th className="text-left py-3 px-6 text-[10px] font-black text-white uppercase tracking-widest"><Tag className="inline w-3 h-3 mr-1" /> Produto</th>
                                        <th className="text-center py-3 px-6 text-[10px] font-black text-white uppercase tracking-widest"><TrendingUp className="inline w-3 h-3 mr-1" /> Entradas</th>
                                        <th className="text-center py-3 px-6 text-[10px] font-black text-white uppercase tracking-widest"><TrendingDown className="inline w-3 h-3 mr-1" /> Saídas</th>
                                        <th className="text-center py-3 px-6 text-[10px] font-black text-white uppercase tracking-widest"><Hash className="inline w-3 h-3 mr-1" /> Saldo</th>
                                        <th className="text-center py-3 px-6 text-[10px] font-black text-white uppercase tracking-widest"><MinusCircle className="inline w-3 h-3 mr-1" /> Estoque Mínimo</th>
                                        <th className="text-center py-3 px-6 text-[10px] font-black text-white uppercase tracking-widest">Status</th>
                                        <th className="text-right py-3 px-6 text-[10px] font-black text-white uppercase tracking-widest"><DollarSign className="inline w-3 h-3 mr-1" /> Receita Total</th>
                                        <th className="text-right py-3 px-6 text-[10px] font-black text-white uppercase tracking-widest"><Wallet className="inline w-3 h-3 mr-1" /> Custo Total</th>
                                        <th className="text-right py-3 px-6 text-[10px] font-black text-white uppercase tracking-widest"><PieChart className="inline w-3 h-3 mr-1" /> Lucro/Prejuízo Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={9} className="py-12 text-center text-gray-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                    <span className="text-sm">Carregando estoque...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredItems.length > 0 ? (
                                        filteredItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <span className="font-semibold text-gray-900">{item.product}</span>
                                                </td>
                                                <td className="py-4 px-6 text-center text-sm font-bold text-emerald-600">
                                                    {item.entries}
                                                </td>
                                                <td className="py-4 px-6 text-center text-sm font-bold text-red-600">
                                                    {item.outputs}
                                                </td>
                                                <td className="py-4 px-6 text-center text-sm font-bold text-blue-600">
                                                    {item.balance}
                                                </td>
                                                <td className="py-4 px-6 text-center text-sm text-gray-600">
                                                    {item.min_stock}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusStyles(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right font-medium text-gray-600">
                                                    {formatCurrency(item.total_revenue)}
                                                </td>
                                                <td className="py-4 px-6 text-right font-medium text-gray-600">
                                                    {formatCurrency(item.total_cost)}
                                                </td>
                                                <td className={`py-4 px-6 text-right font-black ${item.total_profit_loss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {formatCurrency(item.total_profit_loss)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={9} className="py-12 text-center text-gray-400">
                                                Nenhum produto encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
