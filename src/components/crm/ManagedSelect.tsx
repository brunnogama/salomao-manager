import { useState, useEffect, useRef } from 'react'
import { Search, Settings, ChevronDown, X, Plus, Pencil, Trash2, Save, Loader2, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface ManagedSelectProps {
    label?: string
    value: string | undefined | null
    onChange: (value: string) => void
    tableName: string // Table name in Supabase
    placeholder?: string
    disabled?: boolean
    showManageButton?: boolean
    orderBy?: string
    // Optional filter for the dropdown list (e.g. show only reasons for a specific initiative)
    filter?: { column: string, value: string }
    // For 'managed' items that need a foreign key (e.g. adding a reason that needs an initiative_id)
    extraInsertFields?: Record<string, any>
}

interface Item {
    id: string
    name: string
    // Allow other dynamic fields if needed, but primarily we use id/name
    [key: string]: any
}

export function ManagedSelect({
    label,
    value,
    onChange,
    tableName,
    placeholder = 'Selecione...',
    disabled = false,
    showManageButton = true,
    orderBy = 'name',
    filter,
    extraInsertFields
}: ManagedSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isManaging, setIsManaging] = useState(false)
    const [items, setItems] = useState<Item[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(false)

    // Management States
    const [newItemName, setNewItemName] = useState('')
    const [editingItem, setEditingItem] = useState<Item | null>(null)
    const [openUpwards, setOpenUpwards] = useState(false)

    const dropdownRef = useRef<HTMLDivElement>(null)
    const managingRef = useRef<HTMLDivElement>(null)
    const isFetchedRef = useRef(false)

    const fetchItems = async () => {
        setLoading(true)
        let query = supabase.from(tableName).select('*').order(orderBy, { ascending: true })

        if (filter && filter.value) {
            query = query.eq(filter.column, filter.value)
        }

        const { data, error } = await query

        if (error) {
            console.error(`Error fetching ${tableName}:`, error)
        } else {
            setItems(data || [])
        }
        setLoading(false)
    }

    // Fetch when opening dropdown or managing, or when filter changes
    useEffect(() => {
        if ((isOpen || isManaging || value) && !isFetchedRef.current) {
            fetchItems()
            isFetchedRef.current = true
        }
    }, [isOpen, isManaging, value, filter?.value, tableName])

    useEffect(() => {
        isFetchedRef.current = false
    }, [tableName, filter?.value])

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // If managing modal is open, only close if clicking outside the modal content
            if (isManaging && managingRef.current && !managingRef.current.contains(event.target as Node)) {
                // Do not close managing here, usually modals have their own backdrop click handler or close button.
                // But for this implementation let's rely on the backdrop div's onClick.
                return
            }

            // If dropdown is open (and not managing), close if clicking outside dropdown
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                if (!isManaging) {
                    setIsOpen(false)
                    setSearchTerm('')
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isManaging])

    // Calculate dropdown direction
    useEffect(() => {
        if (isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow < 250 && rect.top > 250) {
                setOpenUpwards(true);
            } else {
                setOpenUpwards(false);
            }
        }
    }, [isOpen]);

    const selectedItem = items.find(i => value && String(i.id) === String(value))

    const filteredItems = items.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAddItem = async () => {
        if (!newItemName.trim()) return

        const payload = {
            name: newItemName.trim(),
            ...extraInsertFields
        }

        const { error } = await supabase.from(tableName).insert(payload)

        if (error) {
            alert('Erro ao adicionar: ' + error.message)
            return
        }

        setNewItemName('')
        fetchItems()
    }

    const handleUpdateItem = async () => {
        if (!editingItem || !editingItem.name.trim()) return

        const { error } = await supabase
            .from(tableName)
            .update({ name: editingItem.name.trim() })
            .eq('id', editingItem.id)

        if (error) {
            alert('Erro ao atualizar: ' + error.message)
            return
        }

        setEditingItem(null)
        fetchItems()
    }

    const handleDeleteItem = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este item?')) return

        const { error } = await supabase.from(tableName).delete().eq('id', id)

        if (error) {
            alert('Erro ao excluir: ' + error.message)
            return
        }

        // If deleted item was selected, clear selection
        if (value === id) {
            onChange('')
        }

        fetchItems()
    }

    return (
        <div className="w-full">
            {label && (
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    {label}
                </label>
            )}

            <div className="flex gap-2 w-full">
                <div ref={dropdownRef} className="relative flex-1">
                    {/* TRIGGER */}
                    <div
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        className={`
              w-full px-3 py-2.5 bg-[#f9fafb] border border-gray-200 rounded-xl text-sm font-medium 
              flex items-center justify-between transition-all outline-none
              ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-blue-300'}
              ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/10' : ''}
            `}
                    >
                        <span className={value ? 'text-gray-700' : 'text-gray-400'}>
                            {selectedItem ? selectedItem.name : placeholder}
                        </span>
                        <div className="flex items-center gap-1">
                            {value && !disabled && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onChange('')
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                            <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                    </div>

                    {/* DROPDOWN */}
                    {isOpen && (
                        <div className={`absolute left-0 w-full bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[50] ${openUpwards ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                            <div className="p-2 border-b border-gray-100 bg-gray-50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Buscar..."
                                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium outline-none focus:border-blue-500 transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </div>

                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                {loading ? (
                                    <div className="p-4 text-center text-xs text-gray-400">Carregando...</div>
                                ) : filteredItems.length > 0 ? (
                                    <div className="p-1.5 space-y-1">
                                        {filteredItems.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    onChange(item.id)
                                                    setIsOpen(false)
                                                    setSearchTerm('')
                                                }}
                                                className={`
                          w-full text-left px-3 py-2 rounded-lg transition-all text-sm
                          ${value && String(value) === String(item.id) ? 'bg-blue-50 border border-blue-200 text-blue-700 font-semibold' : 'hover:bg-gray-50 border border-transparent text-gray-600'}
                        `}
                                            >
                                                {item.name}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-xs text-gray-400 italic">Nenhum item encontrado</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* BOTÃO GERENCIAR */}
                {showManageButton && !disabled && (
                    <button
                        onClick={() => setIsManaging(true)}
                        className="px-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-xl transition-all border border-gray-200 flex items-center justify-center shadow-sm"
                        title="Gerenciar Itens"
                        type="button"
                    >
                        <Settings className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* MODAL GERENCIAMENTO */}
            {isManaging && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100000] flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => !loading && setIsManaging(false)}
                >
                    <div
                        ref={managingRef}
                        className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-5 py-4 flex justify-between items-center border-b border-gray-100 bg-gray-50 rounded-t-xl">
                            <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                <Settings className="h-4 w-4 text-gray-500" />
                                Gerenciar: {label || 'Itens'}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsManaging(false)
                                    setEditingItem(null)
                                    setNewItemName('')
                                }}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {/* Form Adicionar */}
                            <div className="mb-4 flex gap-2">
                                <input
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    placeholder="Novo item..."
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                />
                                <button
                                    onClick={handleAddItem}
                                    disabled={!newItemName.trim()}
                                    className="px-4 bg-[#112240] text-white rounded-lg hover:bg-[#1a3a6c] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Lista */}
                            <div className="space-y-2">
                                {items.length > 0 ? (
                                    items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:border-blue-200 transition-all group"
                                        >
                                            {editingItem?.id === item.id ? (
                                                <>
                                                    <input
                                                        className="flex-1 border border-blue-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                                        value={editingItem.name}
                                                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={handleUpdateItem}
                                                        className="bg-green-100 text-green-700 p-1.5 rounded-md hover:bg-green-200 transition-colors"
                                                    >
                                                        <Save className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingItem(null)}
                                                        className="bg-gray-200 text-gray-600 p-1.5 rounded-md hover:bg-gray-300 transition-colors"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="flex-1 text-sm font-medium text-gray-700">{item.name}</span>
                                                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => setEditingItem(item)}
                                                            className="text-blue-600 hover:bg-blue-100 p-1.5 rounded-md transition-colors"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteItem(item.id)}
                                                            className="text-red-600 hover:bg-red-100 p-1.5 rounded-md transition-colors"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-xs text-gray-400 italic">
                                        Nenhum item cadastrado.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
