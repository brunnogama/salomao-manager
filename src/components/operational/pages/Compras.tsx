import { useState, useEffect } from 'react'
import { Plus, Trash2, ShoppingCart, Check, Filter } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { AlertModal } from '../../ui/AlertModal'
import { ConfirmationModal } from '../../ui/ConfirmationModal'

interface ShoppingItem {
    id: string
    name: string
    quantity: number
    brand?: string
    status: 'pending' | 'purchased'
    created_at: string
}

export function Compras() {
    const [items, setItems] = useState<ShoppingItem[]>([])
    const [loading, setLoading] = useState(false)
    const [newItemName, setNewItemName] = useState('')
    const [itemToDelete, setItemToDelete] = useState<ShoppingItem | null>(null)
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

    useEffect(() => {
        fetchItems()
    }, [])

    const fetchItems = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('shopping_list_items')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            if (data) setItems(data)
        } catch (error) {
            console.error('Error fetching shopping list:', error)
            showAlert('Erro', 'Erro ao carregar lista de compras.', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleAddItem = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!newItemName.trim()) return

        const newItem = {
            name: newItemName.trim(),
            quantity: 1,
            status: 'pending'
        }

        try {
            const { data, error } = await supabase
                .from('shopping_list_items')
                .insert(newItem)
                .select()
                .single()

            if (error) throw error
            if (data) {
                setItems(prev => [data, ...prev])
                setNewItemName('')
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

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                        <ShoppingCart className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Lista de Compras</h1>
                        <p className="text-gray-500">Gerencie itens a serem adquiridos.</p>
                    </div>
                </div>
            </div>

            {/* Add Item Form */}
            <form onSubmit={handleAddItem} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-2">
                <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Adicionar novo item à lista..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                    type="submit"
                    disabled={!newItemName.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar
                </button>
            </form>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {items.length > 0 ? (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">Status</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantidade</th>
                                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((item) => (
                                <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors ${item.status === 'purchased' ? 'bg-gray-50' : ''}`}>
                                    <td className="py-4 px-6">
                                        <button
                                            onClick={() => toggleItemStatus(item)}
                                            className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${item.status === 'purchased'
                                                    ? 'bg-green-500 border-green-500 text-white'
                                                    : 'border-gray-300 hover:border-blue-500 text-transparent hover:text-blue-200'
                                                }`}
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`font-medium ${item.status === 'purchased' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                            {item.name}
                                        </span>
                                        {item.brand && (
                                            <span className="ml-2 text-xs text-gray-500">({item.brand})</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-sm text-gray-600">
                                        {item.quantity}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <button
                                            onClick={() => setItemToDelete(item)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title="Remover"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-12 text-center text-gray-500">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingCart className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Lista vazia</h3>
                        <p className="mb-6 max-w-sm mx-auto">Sua lista de compras está vazia.</p>
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
    )
}
