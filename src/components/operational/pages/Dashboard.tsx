import { LayoutDashboard, Boxes, ShoppingCart } from 'lucide-react'

export function Dashboard() {
    return (
        <div className="flex flex-col h-full space-y-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100">
            {/* PAGE HEADER */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
                        <LayoutDashboard className="h-6 w-6 md:h-7 md:w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
                            Dashboard Operacional
                        </h1>
                        <p className="text-xs md:text-sm font-semibold text-gray-500 mt-1 md:mt-0.5">
                            Visão geral do setor operacional
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Stat Cards */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <LayoutDashboard className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-wider">Ativo</span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Pedidos Pendentes</h3>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-[#0a192f]">0</p>
                            <span className="text-xs font-semibold text-gray-400">solicitações</span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                <Boxes className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full uppercase tracking-wider">Atenção</span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Baixo Estoque</h3>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-[#0a192f]">0</p>
                            <span className="text-xs font-semibold text-gray-400">itens</span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                                <ShoppingCart className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-wider">Hoje</span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Novas Compras</h3>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-[#0a192f]">0</p>
                            <span className="text-xs font-semibold text-gray-400">pedidos</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
