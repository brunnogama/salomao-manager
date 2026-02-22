import { LayoutDashboard } from 'lucide-react'

export function Dashboard() {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="p-3 bg-blue-100 rounded-lg shrink-0">
                    <LayoutDashboard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl sm:text-[30px] font-bold text-gray-800 tracking-tight leading-none">Dashboard Operacional</h1>
                    <p className="text-sm text-gray-500 mt-1">Visão geral do setor operacional.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
