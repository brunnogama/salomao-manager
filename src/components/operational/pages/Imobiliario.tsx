import { useState } from 'react'
import { Armchair, Plus, Filter, Search, MapPin, Tag, Box } from 'lucide-react'

export function Imobiliario() {
    const [activeLocation, setActiveLocation] = useState('Todos')

    const locations = [
        { id: 'Todos', label: 'Todas as Salas' },
        { id: 'Recepcao', label: 'Recepção' },
        { id: 'Reuniao1', label: 'Reunião 1' },
        { id: 'Reuniao2', label: 'Reunião 2' },
        { id: 'Operacional', label: 'Área Operacional' },
        { id: 'Copa', label: 'Copa' },
        { id: 'Socios', label: 'Salas Sócios' },
    ]

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                        <Armchair className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Controle Imobiliário</h1>
                        <p className="text-gray-500">Gestão de móveis e ativos fixos do escritório.</p>
                    </div>
                </div>

                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    NOVO ATIVO
                </button>
            </div>

            {/* Location Filter */}
            <div className="flex overflow-x-auto pb-4 gap-2 mb-6 custom-scrollbar">
                {locations.map((loc) => (
                    <button
                        key={loc.id}
                        onClick={() => setActiveLocation(loc.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors border ${activeLocation === loc.id
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">{loc.label}</span>
                    </button>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por patrimônio, descrição ou sala..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100">
                    <Filter className="w-4 h-4" />
                    Filtros
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Box className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total de Itens</p>
                        <h4 className="text-2xl font-bold text-gray-800">0</h4>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <Tag className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Patrimônio Total</p>
                        <h4 className="text-2xl font-bold text-gray-800">R$ 0,00</h4>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                        <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Salas/Locais</p>
                        <h4 className="text-2xl font-bold text-gray-800">{locations.length - 1}</h4>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-12 text-center text-gray-500">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Armchair className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Nenhum ativo registrado</h3>
                    <p className="mb-6 max-w-sm mx-auto">Cadastre o mobiliário e equipamentos do escritório para controle patrimonial.</p>
                    <button className="text-indigo-600 font-medium hover:underline text-sm">
                        Cadastrar primeiro ativo
                    </button>
                </div>
            </div>
        </div>
    )
}
