import { Volumetry } from './Volumetry';
import { Database } from 'lucide-react';

export function PublicVolumetry() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-8">
            <div className="w-full max-w-7xl mx-auto px-6 mb-8 flex items-center gap-3">
                <div className="bg-[#1e3a8a] text-white p-2.5 rounded-xl shadow-lg">
                    <Database className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-[#0a192f] tracking-tight">Salomão Manager</h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Acesso de Convidado • Volumetria</p>
                </div>
            </div>
            
            {/* 
              Injetamos o Volumetry normal.
              O próprio Volumetry dentro dele renderiza os gráficos responsivamente e até a aba de Base de Processos.
              Como não estamos em <MainLayout>, a navegação esquerda do Salomao não existe aqui, é 100% full screen focado nos dados.
            */}
            <main className="flex-1 w-full max-w-7xl mx-auto pb-12 rounded-2xl overflow-hidden">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform scale-[0.98] lg:scale-100 origin-top">
                    <Volumetry isPublicView={true} />
                </div>
            </main>
        </div>
    );
}
