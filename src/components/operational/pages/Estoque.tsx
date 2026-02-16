import { useState } from 'react'
import { Package, Plus, Filter, Search, Boxes, Coffee, Building2, UserCircle, Sparkles, Flag, Calendar } from 'lucide-react'

export function Estoque() {
    const [activeCategory, setActiveCategory] = useState('Todos')

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

                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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

            {/* Table Placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-12 text-center text-gray-500">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Nenhum item em {activeCategory}</h3>
                    <p className="mb-6 max-w-sm mx-auto">Comece adicionando itens para {activeCategory === 'Todos' ? 'o estoque' : `a categoria ${activeCategory}`}.</p>
                    <button className="text-blue-600 font-medium hover:underline text-sm">
                        Adicionar primeiro item
                    </button>
                </div>
            </div>
        </div>
    )
}
