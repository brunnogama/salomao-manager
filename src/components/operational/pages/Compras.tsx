import { useState, useEffect } from 'react'
import { Plus, Trash2, ShoppingCart, Check, X, ChevronRight, ChevronDown } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { AlertModal } from '../../ui/AlertModal'
import { ConfirmationModal } from '../../ui/ConfirmationModal'

interface ShoppingItem {
    id: string
    name: string
    quantity: number
    brand?: string
    unit_price: number
    category: string
    status: 'pending' | 'purchased'
    created_at: string
    supplier?: string
}

export function Compras() {
    const [items, setItems] = useState<ShoppingItem[]>([])
    const [itemToDelete, setItemToDelete] = useState<ShoppingItem | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalStep, setModalStep] = useState(1) // 1: Category, 2: Details
    const [newItem, setNewItem] = useState({
        name: '',
        category: '',
        quantity: 1,
        brand: '',
        unit_price: 0,
        supplier: '',
        customName: ''
    })
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
    const [categoryProducts, setCategoryProducts] = useState<string[]>([])
    const [suppliers, setSuppliers] = useState<string[]>([])

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

    // Handle ESC key for form modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                resetModal()
            }
        }
        if (isModalOpen) {
            window.addEventListener('keydown', handleKeyDown)
        }
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isModalOpen])

    const categories = [
        'Suprimentos',
        'Facility',
        'Papelaria',
        'Copa',
        'Sócios',
        'Limpeza',
        'Material Institucional',
        'Eventos',
        'Outros'
    ]

    const showAlert = (title: string, description: string, variant: 'success' | 'error' | 'info' = 'info') => {
        setAlertConfig({ isOpen: true, title, description, variant })
    }

    useEffect(() => {
        fetchItems()
        fetchSuppliers()
    }, [])

    const fetchSuppliers = async () => {
        try {
            const { data, error } = await supabase
                .from('operational_fornecedores')
                .select('nome')
                .order('nome')
            if (error) throw error
            if (data) setSuppliers(data.map(s => s.nome))
        } catch (error) {
            console.error('Error fetching suppliers:', error)
        }
    }

    const fetchCategoryProducts = async (category: string) => {
        try {
            const { data, error } = await supabase
                .from('operational_items')
                .select('name')
                .eq('category', category)
                .order('name')
            if (error) throw error
            if (data) setCategoryProducts(data.map(i => i.name))
        } catch (error) {
            console.error('Error fetching category products:', error)
        }
    }

    const fetchItems = async () => {
        try {
            const { data, error } = await supabase
                .from('shopping_list_items')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            if (data) {
                setItems(data)
                // Initialize all categories as expanded
                const initialExpanded: Record<string, boolean> = {}
                data.forEach((item: ShoppingItem) => {
                    const cat = item.category || 'Outros'
                    initialExpanded[cat] = true
                })
                setExpandedCategories(initialExpanded)
            }
        } catch (error) {
            console.error('Error fetching shopping list:', error)
            showAlert('Erro', 'Erro ao carregar lista de compras.', 'error')
        }
    }

    const resetModal = () => {
        setIsModalOpen(false)
        setModalStep(1)
        setNewItem({ name: '', category: '', quantity: 1, brand: '', unit_price: 0, supplier: '', customName: '' })
        setCategoryProducts([])
    }

    const handleCategorySelect = (category: string) => {
        setNewItem(prev => ({ ...prev, category }))
        fetchCategoryProducts(category)
        setModalStep(2)
    }

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newItem.name.trim()) return

        try {
            const finalName = newItem.name === 'Outro' ? newItem.customName : newItem.name
            const { customName, ...restOfItem } = newItem

            const { data, error } = await supabase
                .from('shopping_list_items')
                .insert({
                    ...restOfItem,
                    name: finalName,
                    status: 'pending'
                })
                .select()
                .single()

            if (error) throw error
            if (data) {
                setItems(prev => [data, ...prev])
                // Ensure category is expanded
                const cat = data.category || 'Outros'
                setExpandedCategories(prev => ({ ...prev, [cat]: true }))

                resetModal()
                showAlert('Sucesso', 'Item adicionado à lista.', 'success')
            }
        } catch (error) {
            console.error('Error adding item:', error)
            showAlert('Erro', 'Erro ao adicionar item.', 'error')
        }
    }

    const handleDeleteItem = async () => {
        if (!itemToDelete) return

        try {
            const { error } = await supabase
                .from('shopping_list_items')
                .delete()
                .eq('id', itemToDelete.id)

            if (error) throw error

            setItems(prev => prev.filter(i => i.id !== itemToDelete.id))
            showAlert('Sucesso', 'Item removido da lista.', 'success')
        } catch (error) {
            console.error('Error deleting item:', error)
            showAlert('Erro', 'Erro ao remover item.', 'error')
        } finally {
            setItemToDelete(null)
        }
    }

    const toggleItemStatus = async (item: ShoppingItem) => {
        const newStatus = item.status === 'pending' ? 'purchased' : 'pending'

        // Optimistic update
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i))

        try {
            const { error } = await supabase
                .from('shopping_list_items')
                .update({ status: newStatus })
                .eq('id', item.id)

            if (error) throw error
        } catch (error) {
            console.error('Error updating status:', error)
            fetchItems() // Revert
            showAlert('Erro', 'Erro ao atualizar status.', 'error')
        }
    }

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))
    }

    const groupedItems = items.reduce((acc, item) => {
        const cat = item.category || 'Outros'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(item)
        return acc
    }, {} as Record<string, ShoppingItem[]>)

    return (
        <div className="flex flex-col h-full space-y-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100">
            {/* PAGE HEADER */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
                        <ShoppingCart className="h-6 w-6 md:h-7 md:w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
                            Lista de Compras
                        </h1>
                        <p className="text-xs md:text-sm font-semibold text-gray-500 mt-1 md:mt-0.5">
                            Gerencie itens a serem adquiridos
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-2 bg-[#1e3a8a] hover:bg-[#112240] text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    ADICIONAR ITEM
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">

                {/* List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {items.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {Object.entries(groupedItems).map(([category, categoryItems]) => (
                                <div key={category} className="bg-white">
                                    <button
                                        onClick={() => toggleCategory(category)}
                                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 font-semibold text-gray-700">
                                            {expandedCategories[category] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                            {category}
                                            <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                                                {categoryItems.length}
                                            </span>
                                        </div>
                                    </button>

                                    {expandedCategories[category] && (
                                        <div className="overflow-x-auto custom-scrollbar">
                                            <div className="min-w-[600px]">
                                                <table className="w-full">
                                                    <thead className="bg-white border-b border-gray-100">
                                                        <tr>
                                                            <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">Status</th>
                                                            <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                                                            <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Marca</th>
                                                            <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Qtd</th>
                                                            <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fornecedor</th>
                                                            <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Preço Unit.</th>
                                                            <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {categoryItems.map((item) => (
                                                            <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors ${item.status === 'purchased' ? 'bg-gray-50' : ''}`}>
                                                                <td className="py-3 px-6">
                                                                    <button
                                                                        onClick={() => toggleItemStatus(item)}
                                                                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.status === 'purchased'
                                                                            ? 'bg-green-500 border-green-500 text-white'
                                                                            : 'border-gray-300 hover:border-blue-500 text-transparent hover:text-blue-200'
                                                                            }`}
                                                                    >
                                                                        <Check className="w-3 h-3" />
                                                                    </button>
                                                                </td>
                                                                <td className="py-3 px-6">
                                                                    <span className={`font-medium ${item.status === 'purchased' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                                        {item.name}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-6 text-sm text-gray-600">
                                                                    {item.brand || '-'}
                                                                </td>
                                                                <td className="py-3 px-6 text-sm text-gray-600">
                                                                    {item.quantity}
                                                                </td>
                                                                <td className="py-3 px-6 text-sm text-gray-600">
                                                                    {item.supplier || '-'}
                                                                </td>
                                                                <td className="py-3 px-6 text-sm text-gray-600">
                                                                    {item.unit_price ? `R$ ${item.unit_price.toFixed(2)}` : '-'}
                                                                </td>
                                                                <td className="py-3 px-6 text-right">
                                                                    <button
                                                                        onClick={() => setItemToDelete(item)}
                                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                        title="Remover"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-gray-500">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShoppingCart className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Lista vazia</h3>
                            <p className="mb-6 max-w-sm mx-auto">Sua lista de compras está vazia.</p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="text-[#1e3a8a] font-medium hover:underline text-sm"
                            >
                                Adicionar primeiro item
                            </button>
                        </div>
                    )}
                </div>

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
                                                key={cat}
                                                onClick={() => handleCategorySelect(cat)}
                                                className="p-3 border border-gray-200 rounded-xl hover:border-[#1e3a8a] hover:bg-blue-50 text-gray-700 font-medium text-sm transition-all text-left"
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <form onSubmit={handleAddItem} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Categoria</label>
                                            <div className="text-sm font-semibold text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 flex justify-between items-center">
                                                {newItem.category}
                                                <button type="button" onClick={() => setModalStep(1)} className="text-[#1e3a8a] text-xs hover:underline">Alterar</button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Nome do Item *</label>
                                            <select
                                                required
                                                value={newItem.name}
                                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                                            >
                                                <option value="">Selecione um produto...</option>
                                                {categoryProducts.map(prod => (
                                                    <option key={prod} value={prod}>{prod}</option>
                                                ))}
                                                <option value="Outro">Outro...</option>
                                            </select>
                                        </div>

                                        {newItem.name === 'Outro' && (
                                            <div className="animate-in slide-in-from-top-2 duration-200">
                                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Especifique o Nome *</label>
                                                <input
                                                    required
                                                    type="text"
                                                    value={newItem.customName}
                                                    onChange={e => setNewItem({ ...newItem, customName: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    placeholder="Digite o nome do produto"
                                                    autoFocus
                                                />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Quantidade</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={newItem.quantity}
                                                    onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Marca (Opcional)</label>
                                                <input
                                                    type="text"
                                                    value={newItem.brand}
                                                    onChange={e => setNewItem({ ...newItem, brand: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    placeholder="Ex: Ypê"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Fornecedor</label>
                                                <select
                                                    value={newItem.supplier}
                                                    onChange={e => setNewItem({ ...newItem, supplier: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                                                >
                                                    <option value="">Selecione...</option>
                                                    {suppliers.map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={!newItem.name || (newItem.name === 'Outro' && !newItem.customName?.trim())}
                                            className="w-full py-3 bg-[#1e3a8a] text-white rounded-xl hover:bg-[#112240] disabled:opacity-50 font-bold shadow-lg shadow-blue-500/20 transition-all mt-2"
                                        >
                                            Salvar Item
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <AlertModal
                    isOpen={alertConfig.isOpen}
                    onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                    title={alertConfig.title}
                    description={alertConfig.description}
                    variant={alertConfig.variant}
                />

                <ConfirmationModal
                    isOpen={!!itemToDelete}
                    onClose={() => setItemToDelete(null)}
                    onConfirm={handleDeleteItem}
                    title="Remover Item"
                    description={`Tem certeza que deseja remover "${itemToDelete?.name}" da lista?`}
                    confirmText="Remover"
                    cancelText="Cancelar"
                    variant="danger"
                />
            </div>
        </div>
    )
}
