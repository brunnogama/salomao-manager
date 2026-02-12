import {
    KanbanSquare,
    Plus
} from 'lucide-react'

export function RHKanban() {

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">

            {/* PAGE HEADER - Padrão Salomão Design System */}
            <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
                        <KanbanSquare className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
                            Kanban RH
                        </h1>
                        <p className="text-sm font-semibold text-gray-500 mt-0.5">
                            Gestão visual de tarefas e processos do departamento
                        </p>
                    </div>
                </div>

                {/* Action Buttons moved to header */}
                <div className="flex items-center gap-3 shrink-0">
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95">
                        <Plus className="h-4 w-4" /> Nova Tarefa
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-6 w-full h-full">
                {/* CONTEÚDO (Placeholder) */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 h-[calc(100vh-200px)] p-8 flex flex-col items-center justify-center text-center">
                    <div className="p-4 rounded-full bg-blue-50 mb-4">
                        <KanbanSquare className="h-12 w-12 text-[#1e3a8a] opacity-20" />
                    </div>
                    <h2 className="text-xl font-black text-[#0a192f]">Quadro Kanban em desenvolvimento</h2>
                    <p className="text-gray-500 max-w-sm mt-2">
                        Em breve você poderá gerenciar processos seletivos e tarefas internas visualmente.
                    </p>
                </div>
            </div>
        </div>
    )
}
