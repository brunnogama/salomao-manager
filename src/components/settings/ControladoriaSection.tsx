import { Briefcase, Layout, DollarSign, Users, AlertTriangle, Trash2, Settings as SettingsIcon } from 'lucide-react';

interface ControladoriaSectionProps {
    isAdmin: boolean;
    onReset: (module: 'contracts' | 'clients' | 'financial' | 'kanban') => void;
    onFactoryReset: () => void;
    loading: boolean;
}

export function ControladoriaSection({ isAdmin, onReset, onFactoryReset, loading }: ControladoriaSectionProps) {
    if (!isAdmin) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center animate-in fade-in zoom-in duration-300">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-700">Acesso Restrito</h3>
                <p className="text-red-600 mt-2 max-w-md mx-auto">
                    Esta área contém funções críticas do sistema e é restrita a Administradores.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">

            {/* RESET MODULAR */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <SettingsIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Reset Modular - Controladoria</h2>
                        <p className="text-sm text-gray-500">Limpeza seletiva de dados por módulo específico.</p>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button onClick={() => onReset('financial')} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50 transition-colors group">
                        <div className="p-3 bg-gray-100 rounded-full text-gray-500 group-hover:text-red-500 group-hover:bg-white mb-3 transition-colors">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-gray-700 group-hover:text-red-700">Limpar Financeiro</span>
                        <span className="text-xs text-gray-400 mt-1">Apenas parcelas</span>
                    </button>

                    <button onClick={() => onReset('kanban')} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50 transition-colors group">
                        <div className="p-3 bg-gray-100 rounded-full text-gray-500 group-hover:text-red-500 group-hover:bg-white mb-3 transition-colors">
                            <Layout className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-gray-700 group-hover:text-red-700">Limpar Tarefas</span>
                        <span className="text-xs text-gray-400 mt-1">Todas do Kanban</span>
                    </button>

                    <button onClick={() => onReset('contracts')} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50 transition-colors group">
                        <div className="p-3 bg-gray-100 rounded-full text-gray-500 group-hover:text-red-500 group-hover:bg-white mb-3 transition-colors">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-gray-700 group-hover:text-red-700">Limpar Contratos</span>
                        <span className="text-xs text-center text-gray-400 mt-1">+ Docs, Timeline e Parcelas</span>
                    </button>

                    <button onClick={() => onReset('clients')} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50 transition-colors group">
                        <div className="p-3 bg-gray-100 rounded-full text-gray-500 group-hover:text-red-500 group-hover:bg-white mb-3 transition-colors">
                            <Users className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-gray-700 group-hover:text-red-700">Limpar Clientes</span>
                        <span className="text-xs text-center text-gray-400 mt-1">Apenas sem vínculo</span>
                    </button>
                </div>
            </div>

            {/* ZONA DE PERIGO */}
            <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
                <div className="p-6 bg-red-50 border-b border-red-100 flex items-start gap-4">
                    <div className="p-3 bg-red-100 rounded-full text-red-600">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-red-800">Zona de Perigo - Controladoria</h2>
                        <p className="text-sm text-red-600 mt-1">
                            Ações nesta área são destrutivas e irreversíveis. Prossiga com extrema cautela.
                        </p>
                    </div>
                </div>
                <div className="p-8">
                    <div className="border border-red-100 rounded-lg p-6 flex flex-col sm:flex-row justify-between items-center gap-6 bg-white hover:bg-red-50/30 transition-colors">
                        <div>
                            <h3 className="font-bold text-gray-800">Reset Completo da Controladoria</h3>
                            <p className="text-sm text-gray-500 mt-1 max-w-xl">
                                Esta ação irá <strong>excluir permanentemente</strong> todos os contratos, clientes, sócios, analistas, arquivos e dados financeiros do banco de dados.
                                O módulo retornará ao estado inicial (vazio).
                            </p>
                        </div>
                        <button
                            onClick={onFactoryReset}
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg font-bold shadow-lg flex items-center whitespace-nowrap transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <SettingsIcon className="w-5 h-5 animate-spin mr-2" /> : <Trash2 className="w-5 h-5 mr-2" />}
                            RESETAR TUDO
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
