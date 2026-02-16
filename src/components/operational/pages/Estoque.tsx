import { useState, useEffect } from 'react'
import { Package, Plus, Filter, Search, Boxes, Coffee, Building2, UserCircle, Sparkles, Flag, Calendar, Trash2, Minus, ShoppingCart } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { ConfirmationModal } from '../../ui/ConfirmationModal'
import { AlertModal } from '../../ui/AlertModal'

interface InventoryItem {
    id: string
    name: string
    quantity: number
    brand: string
    unit_price: number
    category: string
}

export function Estoque() {
    const [activeCategory, setActiveCategory] = useState('Todos')
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<string | null>(null)
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

    const showAlert = (title: string, description: string, variant: 'success' | 'error' | 'info' = 'info') => {
        setAlertConfig({ isOpen: true, title, description, variant })
    }

    const categories = [
        { id: 'Todos', label: 'Todos', icon: Boxes },
        { id: 'Suprimentos', label: 'Suprimentos', icon: Package },
        { id: 'Facility', label: 'Facility', icon: Building2 },
        { id: 'Papelaria', label: 'Papelaria', icon: Package },
        { id: 'Copa', label: 'Copa', icon: Coffee },
        { id: 'Socios', label: 'Sócios', icon: UserCircle },
        { id: 'Limpeza', label: 'Limpeza', icon: Sparkles },
        { id: 'Material Institucional', label: 'Material Inst.', icon: Flag },
        { id: 'Eventos', label: 'Eventos', icon: Calendar },
    ]

    useEffect(() => {
        fetchItems()
    }, [activeCategory])

    const fetchItems = async () => {
        try {
            setLoading(true)
            let query = supabase
                .from('operational_items')
                .select('*')
                .order('name')

            if (activeCategory !== 'Todos') {
                query = query.eq('category', activeCategory)
            }

            const { data, error } = await query

            if (error) throw error
            if (data) setInventoryItems(data)
        } catch (error) {
            console.error('Error fetching items:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleQuantityChange = async (id: string, delta: number) => {
        const item = inventoryItems.find((i: InventoryItem) => i.id === id)
        if (!item) return

        const newQuantity = Math.max(0, item.quantity + delta)

        // Optimistic update
        setInventoryItems((prev: InventoryItem[]) => prev.map((i: InventoryItem) => i.id === id ? { ...i, quantity: newQuantity } : i))

        try {
            const { error } = await supabase
                .from('operational_items')
                .update({ quantity: newQuantity })
                .eq('id', id)

            if (error) throw error
        } catch (error) {
            console.error('Error updating quantity:', error)
            fetchItems() // Revert on error
        }
    }

    const handleUpdateItem = async (id: string, field: keyof InventoryItem, value: string | number) => {
        // Optimistic update
        setInventoryItems((prev: InventoryItem[]) => prev.map((i: InventoryItem) => i.id === id ? { ...i, [field]: value } : i))

        try {
            const { error } = await supabase
                .from('operational_items')
                .update({ [field]: value })
                .eq('id', id)

            if (error) throw error
        } catch (error) {
            console.error('Error updating item:', error)
        }
    }

    const handleAddItem = async () => {
        const newItem = {
            name: 'Novo Item',
            quantity: 0,
            brand: '',
            unit_price: 0,
            category: activeCategory === 'Todos' ? 'Limpeza' : activeCategory // Default to Limpeza if in All
        }

        try {
            const { data, error } = await supabase
                .from('operational_items')
                .insert(newItem)
                .select()
                .single()

            if (error) throw error
            if (data) setInventoryItems((prev: InventoryItem[]) => [...prev, data])
        } catch (error) {
            console.error('Error adding item:', error)
        }
    }

    const handleRemoveItem = (id: string) => {
        setItemToDelete(id)
    }

    const confirmDelete = async () => {
        if (!itemToDelete) return

        // Optimistic update
        setInventoryItems((prev: InventoryItem[]) => prev.filter((i: InventoryItem) => i.id !== itemToDelete))

        try {
            const { error } = await supabase
                .from('operational_items')
                .delete()
                .eq('id', itemToDelete)

            if (error) throw error
        } catch (error) {
            console.error('Error deleting item:', error)
            fetchItems() // Revert on error
            showAlert('Erro', 'Erro ao excluir item.', 'error')
        } finally {
            setItemToDelete(null)
        }
    }

    const handleBuyItem = async (item: InventoryItem) => {
        try {
            const { error } = await supabase
                .from('shopping_list_items')
                .insert({
                    name: item.name,
                    brand: item.brand,
                    quantity: 1,
                    status: 'pending',
                    category: item.category,
                    unit_price: item.unit_price
                })

            if (error) throw error
            showAlert('Sucesso', `"${item.name}" adicionado à lista de compras.`, 'success')
        } catch (error) {
            console.error('Error adding to shopping list:', error)
            showAlert('Erro', 'Erro ao adicionar à lista de compras.', 'error')
        }
    }

    const filteredItems = activeCategory === 'Todos'
        ? inventoryItems
        : inventoryItems.filter((item: InventoryItem) => item.category === activeCategory)

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 rounded-lg">
                        <Package className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Controle de Estoque</h1>
                        <p className="text-gray-500">Gerenciamento de itens e insumos.</p>
                    </div>
                </div>

                <button
                    onClick={handleAddItem}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    NOVO ITEM
                </button>
            </div>

            {/* Category Tabs */}
            <div className="flex overflow-x-auto pb-4 gap-2 mb-6 custom-scrollbar">
                {categories.map((cat) => {
                    const Icon = cat.icon
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors border ${activeCategory === cat.id
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{cat.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder={`Buscar em ${activeCategory}...`}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100">
                    <Filter className="w-4 h-4" />
                    Filtros
                </button>
            </div>

            {/* Table or Placeholder */}
            {filteredItems.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estoque</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Marca</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Preço Unitário</th>
                                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                                            className="font-medium text-gray-900 bg-transparent border-none focus:ring-0 p-0 w-full"
                                        />
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleQuantityChange(item.id, -1)}
                                                className="p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-8 text-center font-medium text-gray-900">{item.quantity}</span>
                                            <button
                                                onClick={() => handleQuantityChange(item.id, 1)}
                                                className="p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <input
                                            type="text"
                                            value={item.brand}
                                            onChange={(e) => handleUpdateItem(item.id, 'brand', e.target.value)}
                                            placeholder="Marca..."
                                            className="text-sm text-gray-600 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md px-3 py-1.5 w-full transition-all"
                                        />
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                                            <input
                                                type="number"
                                                value={item.unit_price}
                                                onChange={(e) => handleUpdateItem(item.id, 'unit_price', parseFloat(e.target.value))}
                                                placeholder="0,00"
                                                className="text-sm text-gray-600 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md pl-9 pr-3 py-1.5 w-32 transition-all"
                                            />
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleBuyItem(item)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="Comprar"
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-12 text-center text-gray-500">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Nenhum item em {activeCategory}</h3>
                        <p className="mb-6 max-w-sm mx-auto">Comece adicionando itens para {activeCategory === 'Todos' ? 'o estoque' : `a categoria ${activeCategory}`}.</p>
                        <button
                            onClick={handleAddItem}
                            className="text-blue-600 font-medium hover:underline text-sm"
                        >
                            Adicionar primeiro item
                        </button>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={confirmDelete}
                title="Excluir Item"
                description="Tem certeza que deseja remover este item do estoque? Esta ação não pode ser desfeita."
                variant="danger"
                confirmText="Excluir"
                confirmText="Excluir"
                cancelText="Cancelar"
            />

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
