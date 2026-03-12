import { Demandas } from './Demandas';
import { Database } from 'lucide-react';

export function PublicDemandas() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-6 sm:pt-8">
            <div className="w-full px-4 sm:px-8 mb-6 sm:mb-8 flex items-center gap-3">
                <div className="bg-[#1e3a8a] text-white p-2.5 rounded-xl shadow-lg">
                    <Database className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-[#0a192f] tracking-tight">Salomão Manager</h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Acesso de Convidado • Demandas vs Contratações</p>
                </div>
            </div>
            
            <main className="flex-1 w-full px-4 sm:px-8 pb-12 rounded-2xl overflow-hidden">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <Demandas isPublicView={true} />
                </div>
            </main>
        </div>
    );
}
