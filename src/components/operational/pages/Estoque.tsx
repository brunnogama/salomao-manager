import { useState, useEffect } from 'react'
import { Boxes, Search, Calendar, Store, Hash, Tag, DollarSign } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

interface StockLedgerItem {
    id: string
    sale_date: string
    product: string
    store: string
    quantity: number
    returned_quantity: number
    return_date: string
    sold_quantity: number
    accumulated_stock: number
    unit_price: number
    total_sale_value: number
}

export function Estoque() {
    const [stockItems, setStockItems] = useState<StockLedgerItem[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStock()
    }, [])

    const fetchStock = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('operational_stock_ledger')
                .select('*')
                .order('sale_date', { ascending: false })

            if (error) throw error
            if (data) setStockItems(data)
        } catch (error) {
            console.error('Error fetching stock ledger:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredItems = stockItems.filter(item => {
        const matchesSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.store && item.store.toLowerCase().includes(searchTerm.toLowerCase()))
        return matchesSearch
    })

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const formatDate = (date: string) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('pt-BR')
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
                        <p className="text-xs md:text-sm font-semibold text-gray-500 mt-1 md:mt-0.5">Histórico de movimentações e saldo (Ledger).</p>
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
                            placeholder="Buscar por produto ou loja..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <div className="min-w-[1400px]">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
                                        <th className="text-left py-2 px-6 text-[10px] font-black text-white uppercase tracking-widest"><Calendar className="inline w-3 h-3 mr-1" /> Data Venda</th>
                                        <th className="text-left py-2 px-6 text-[10px] font-black text-white uppercase tracking-widest"><Tag className="inline w-3 h-3 mr-1" /> Produto</th>
                                        <th className="text-left py-2 px-6 text-[10px] font-black text-white uppercase tracking-widest"><Store className="inline w-3 h-3 mr-1" /> Loja</th>
                                        <th className="text-center py-2 px-6 text-[10px] font-black text-white uppercase tracking-widest"><Hash className="inline w-3 h-3 mr-1" /> Qtd</th>
                                        <th className="text-center py-2 px-6 text-[10px] font-black text-white uppercase tracking-widest">Qtd Dev.</th>
                                        <th className="text-center py-2 px-6 text-[10px] font-black text-white uppercase tracking-widest">Data Dev.</th>
                                        <th className="text-center py-2 px-6 text-[10px] font-black text-white uppercase tracking-widest">Qtd Vend.</th>
                                        <th className="text-center py-2 px-6 text-[10px] font-black text-white uppercase tracking-widest">Est. Acum.</th>
                                        <th className="text-right py-2 px-6 text-[10px] font-black text-white uppercase tracking-widest"><DollarSign className="inline w-3 h-3 mr-1" /> Preço Unit.</th>
                                        <th className="text-right py-2 px-6 text-[10px] font-black text-white uppercase tracking-widest">Venda Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={10} className="py-12 text-center text-gray-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                    <span className="text-sm">Carregando estoque...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredItems.length > 0 ? (
                                        filteredItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 px-6 text-sm text-gray-600 font-medium">
                                                    {formatDate(item.sale_date)}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="font-semibold text-gray-900">{item.product}</span>
                                                </td>
                                                <td className="py-4 px-6 text-sm text-gray-600">
                                                    {item.store || '-'}
                                                </td>
                                                <td className="py-4 px-6 text-center text-sm font-bold text-blue-600">
                                                    {item.quantity}
                                                </td>
                                                <td className="py-4 px-6 text-center text-sm text-red-500 font-medium">
                                                    {item.returned_quantity}
                                                </td>
                                                <td className="py-4 px-6 text-center text-sm text-gray-500 italic">
                                                    {formatDate(item.return_date)}
                                                </td>
                                                <td className="py-4 px-6 text-center text-sm font-bold text-emerald-600">
                                                    {item.sold_quantity}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                                                        {item.accumulated_stock}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right font-medium text-gray-600">
                                                    {formatCurrency(item.unit_price)}
                                                </td>
                                                <td className="py-4 px-6 text-right font-black text-[#1e3a8a]">
                                                    {formatCurrency(item.total_sale_value)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={10} className="py-12 text-center text-gray-400">
                                                Nenhuma movimentação encontrada.
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
