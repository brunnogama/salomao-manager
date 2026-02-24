import { useState, useEffect } from 'react'
import { Boxes, Search, Filter, ArrowUpRight, ArrowDownLeft, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

interface StockItem {
    id: string
    product_name: string
    entries: number
    exits: number
    balance: number
    min_stock: number
    status: string
    total_revenue: number
    total_cost: number
    total_profit_loss: number
}

export function Estoque() {
    const [activeStatus, setActiveStatus] = useState('Todos')
    const [stockItems, setStockItems] = useState<StockItem[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)

    const statusFilters = [
        { id: 'Todos', label: 'Todos', icon: Boxes },
        { id: 'Estoque Confortável', label: 'Confortável', icon: CheckCircle2 },
        { id: 'Estoque Perigoso', label: 'Perigoso', icon: AlertCircle },
        { id: 'Sem Estoque', label: 'Sem Estoque', icon: XCircle },
    ]

    useEffect(() => {
        fetchStock()
    }, [])

    const fetchStock = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('operational_stock')
                .select('*')
                .order('product_name')

            if (error) throw error
            if (data) setStockItems(data)
        } catch (error) {
            console.error('Error fetching stock:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredItems = stockItems.filter(item => {
        const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = activeStatus === 'Todos' || item.status === activeStatus
        return matchesSearch && matchesStatus
    })

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Estoque Confortável':
                return 'bg-green-50 text-green-700 border-green-100'
            case 'Estoque Perigoso':
                return 'bg-orange-50 text-orange-700 border-orange-100'
            case 'Sem Estoque':
                return 'bg-red-50 text-red-700 border-red-100'
            default:
                return 'bg-gray-50 text-gray-700 border-gray-100'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Estoque Confortável':
                return <CheckCircle2 className="w-3.5 h-3.5" />
            case 'Estoque Perigoso':
                return <AlertCircle className="w-3.5 h-3.5" />
            case 'Sem Estoque':
                return <XCircle className="w-3.5 h-3.5" />
            default:
                return null
        }
    }

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
                    <div className="p-3 bg-blue-100 rounded-lg shrink-0">
                        <Boxes className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Visão Geral de Estoque</h1>
                        <p className="text-xs md:text-sm font-semibold text-gray-500 mt-1 md:mt-0.5">Status, entradas, saídas e rentabilidade por produto.</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                {/* Status Tabs */}
                <div className="flex overflow-x-auto pb-4 gap-2 custom-scrollbar">
                    {statusFilters.map((filter) => {
                        const Icon = filter.icon
                        return (
                            <button
                                key={filter.id}
                                onClick={() => setActiveStatus(filter.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all border ${activeStatus === filter.id
                                    ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{filter.label}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar produto no estoque..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                        <Filter className="w-4 h-4" />
                        Filtros
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <div className="min-w-[1200px]">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produto</th>
                                        <th className="text-center py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entradas</th>
                                        <th className="text-center py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Saídas</th>
                                        <th className="text-center py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Saldo</th>
                                        <th className="text-center py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Est. Mínimo</th>
                                        <th className="text-center py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receita Total</th>
                                        <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Custo Total</th>
                                        <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lucro/Prejuízo</th>
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
                                                    <span className="font-semibold text-gray-900">{item.product_name}</span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <div className="flex items-center justify-center gap-1.5 text-green-600 font-medium">
                                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                                        {item.entries}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <div className="flex items-center justify-center gap-1.5 text-red-600 font-medium">
                                                        <ArrowDownLeft className="w-3.5 h-3.5" />
                                                        {item.exits}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${item.balance > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {item.balance}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center text-gray-500 font-medium">
                                                    {item.min_stock}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex justify-center">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyles(item.status)}`}>
                                                            {getStatusIcon(item.status)}
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right font-medium text-gray-600">
                                                    {formatCurrency(item.total_revenue)}
                                                </td>
                                                <td className="py-4 px-6 text-right font-medium text-gray-600">
                                                    {formatCurrency(item.total_cost)}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <span className={`font-bold ${item.total_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {formatCurrency(item.total_profit_loss)}
                                                    </span>
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
