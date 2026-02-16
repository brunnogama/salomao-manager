import { LayoutDashboard } from 'lucide-react'

export function Dashboard() {
    return (
        <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-100 rounded-lg">
                    <LayoutDashboard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard Operacional</h1>
                    <p className="text-gray-500">Visão geral do setor operacional.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Placeholder cards */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Pedidos Pendentes</h3>
                    <p className="text-3xl font-bold text-blue-600">0</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Itens em Baixo Estoque</h3>
                    <p className="text-3xl font-bold text-orange-500">0</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Solicitações Hoje</h3>
                    <p className="text-3xl font-bold text-green-600">0</p>
                </div>
            </div>
        </div>
    )
}
