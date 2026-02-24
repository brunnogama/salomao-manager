import { useState, useEffect } from 'react'
import { Package, Plus, Filter, Search, Boxes, Coffee, Building2, UserCircle, Sparkles, Flag, Calendar, Trash2, ShoppingCart, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { ConfirmationModal } from '../../ui/ConfirmationModal'
import { AlertModal } from '../../ui/AlertModal'
import { useEscKey } from '../../../hooks/useEscKey'

interface InventoryItem {
    id: string
    name: string
    quantity: number
    brand: string
    unit_price: number
    category: string
    product_code: string
    unit_of_measure: string
    minimum_stock: number
    unit_cost: number
}

export function Produtos() {
    const [activeCategory, setActiveCategory] = useState('Todos')
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
    const [itemToDelete, setItemToDelete] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalStep, setModalStep] = useState(1)
    const [newItem, setNewItem] = useState({
        name: '',
        product_code: '',
        unit_of_measure: 'Unidade',
        minimum_stock: 0,
        unit_cost: 0,
        unit_price: 0,
        category: ''
    })
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

    const resetModal = () => {
        setIsModalOpen(false)
        setModalStep(1)
        setNewItem({
            name: '',
            product_code: '',
            unit_of_measure: 'Unidade',
            minimum_stock: 0,
            unit_cost: 0,
            unit_price: 0,
            category: ''
        })
    }

    useEscKey(isModalOpen, resetModal)

    const handleCategorySelect = (category: string) => {
        setNewItem(prev => ({ ...prev, category }))
        setModalStep(2)
    }

    const handleAddItem = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!newItem.name.trim()) return

        try {
            const { data, error } = await supabase
                .from('operational_items')
                .insert({
                    ...newItem,
                    quantity: 0
                })
                .select()
                .single()

            if (error) throw error
            if (data) {
                setInventoryItems((prev: InventoryItem[]) => [...prev, data])
                resetModal()
                showAlert('Sucesso', 'Item adicionado ao estoque.', 'success')
            }
        } catch (error) {
            console.error('Error adding item:', error)
            showAlert('Erro', 'Erro ao adicionar item.', 'error')
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

    const filteredItems = inventoryItems.filter((item: InventoryItem) => {
        const matchesCategory = activeCategory === 'Todos' || item.category === activeCategory
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesCategory && matchesSearch
    })

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
                            Controle de Produtos
                        </h1>
                        <p className="text-xs md:text-sm font-semibold text-gray-500 mt-1 md:mt-0.5">
                            Gestão de itens do estoque e insumos
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-2 bg-[#1e3a8a] hover:bg-[#112240] text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    NOVO ITEM
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                {/* Category Tabs */}
                <div className="flex overflow-x-auto pb-4 gap-2 custom-scrollbar">
                    {categories.map((cat) => {
                        const Icon = cat.icon
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all border ${activeCategory === cat.id
                                    ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md'
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
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={`Buscar em ${activeCategory}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                        <Filter className="w-4 h-4" />
                        Filtros
                    </button>
                </div>

                {/* Table or Placeholder */}
                {filteredItems.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto custom-scrollbar">
                            <div className="min-w-[800px]">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Código do Produto</th>
                                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unidade de Medida</th>
                                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estoque Mínimo</th>
                                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Custo Unitário</th>
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
                                                    <input
                                                        type="text"
                                                        value={item.product_code || ''}
                                                        onChange={(e) => handleUpdateItem(item.id, 'product_code', e.target.value)}
                                                        placeholder="Cód..."
                                                        className="text-sm text-gray-600 bg-transparent border-none focus:ring-0 p-0 w-full"
                                                    />
                                                </td>
                                                <td className="py-4 px-6">
                                                    <input
                                                        type="text"
                                                        value={item.unit_of_measure || ''}
                                                        onChange={(e) => handleUpdateItem(item.id, 'unit_of_measure', e.target.value)}
                                                        placeholder="Un..."
                                                        className="text-sm text-gray-600 bg-transparent border-none focus:ring-0 p-0 w-full"
                                                    />
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="number"
                                                            value={item.minimum_stock || 0}
                                                            onChange={(e) => handleUpdateItem(item.id, 'minimum_stock', parseInt(e.target.value))}
                                                            className="text-sm text-gray-600 bg-transparent border-none focus:ring-0 p-0 w-16"
                                                        />
                                                        <span className="text-[10px] text-gray-400 font-medium">/{item.quantity}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="relative">
                                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.unit_cost || 0}
                                                            onChange={(e) => handleUpdateItem(item.id, 'unit_cost', parseFloat(e.target.value))}
                                                            className="text-sm text-gray-600 bg-transparent border-none focus:ring-0 pl-6 pr-0 py-0 w-24"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="relative">
                                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.unit_price || 0}
                                                            onChange={(e) => handleUpdateItem(item.id, 'unit_price', parseFloat(e.target.value))}
                                                            className="text-sm text-gray-600 bg-transparent border-none focus:ring-0 pl-6 pr-0 py-0 w-24"
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
                        </div>
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
                                className="text-[#1e3a8a] font-medium hover:underline text-sm"
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
                    cancelText="Cancelar"
                />

                <AlertModal
                    isOpen={alertConfig.isOpen}
                    onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                    title={alertConfig.title}
                    description={alertConfig.description}
                    variant={alertConfig.variant}
                />

                {/* Add Item Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                                <h2 className="text-lg font-bold text-gray-800">
                                    {modalStep === 1 ? 'Selecione a Categoria' : 'Detalhes do Item'}
                                </h2>
                                <button onClick={resetModal} className="p-1 hover:bg-gray-200 rounded-lg text-gray-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                                {modalStep === 1 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {categories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => handleCategorySelect(cat.id)}
                                                className="p-3 border border-gray-200 rounded-xl hover:border-[#1e3a8a] hover:bg-blue-50 text-gray-700 font-medium text-sm transition-all text-left flex items-center gap-2"
                                            >
                                                <cat.icon className="w-4 h-4 text-gray-400" />
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <form onSubmit={handleAddItem} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Categoria</label>
                                            <div className="text-sm font-semibold text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 flex justify-between items-center">
                                                {categories.find(c => c.id === newItem.category)?.label}
                                                <button type="button" onClick={() => setModalStep(1)} className="text-[#1e3a8a] text-xs hover:underline uppercase font-bold">Alterar</button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Nome do Item *</label>
                                            <input
                                                required
                                                type="text"
                                                value={newItem.name}
                                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                placeholder="Ex: Resma Papel A4"
                                                autoFocus
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Código do Produto</label>
                                            <input
                                                type="text"
                                                value={newItem.product_code}
                                                onChange={e => setNewItem({ ...newItem, product_code: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                placeholder="Ex: PAP-001"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Unid. Medida</label>
                                                <select
                                                    value={newItem.unit_of_measure}
                                                    onChange={e => setNewItem({ ...newItem, unit_of_measure: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                                                >
                                                    <option value="Unidade">Unidade</option>
                                                    <option value="Caixa">Caixa</option>
                                                    <option value="Pacote">Pacote</option>
                                                    <option value="Litro">Litro</option>
                                                    <option value="Kg">Kg</option>
                                                    <option value="Outro">Outro</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Estoque Mínimo</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={newItem.minimum_stock}
                                                    onChange={e => setNewItem({ ...newItem, minimum_stock: parseInt(e.target.value) || 0 })}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Custo Unit. (R$)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={newItem.unit_cost}
                                                    onChange={e => setNewItem({ ...newItem, unit_cost: parseFloat(e.target.value) || 0 })}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Preço Unit. (R$)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={newItem.unit_price}
                                                    onChange={e => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full py-3 bg-[#1e3a8a] text-white rounded-xl hover:bg-[#112240] font-bold shadow-lg shadow-blue-500/20 transition-all mt-4"
                                        >
                                            Cadastrar Item
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
