import { Construction, ArrowLeft } from 'lucide-react'

interface UnderConstructionProps {
  moduleName: string;
  onBack: () => void;
  showBackButton?: boolean;
}

export function UnderConstruction({ moduleName, onBack, showBackButton = true }: UnderConstructionProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-lg border border-gray-100 max-w-md w-full text-center animate-scaleIn">
        <div className="flex justify-center mb-6">
            <div className="p-6 bg-yellow-50 rounded-full text-yellow-600">
                <Construction className="h-12 w-12" />
            </div>
        </div>
        
        <h1 className="text-2xl font-bold text-[#112240] mb-2">{moduleName}</h1>
        <div className="h-1 w-16 bg-yellow-400 mx-auto mb-6 rounded-full"></div>
        
        <p className="text-gray-500 mb-8 leading-relaxed">
          Este módulo está em desenvolvimento. <br/>
          Em breve novidades incríveis por aqui!
        </p>

        {showBackButton && (
          <button 
              onClick={onBack}
              className="w-full py-3 bg-[#112240] hover:bg-[#1a3a6c] text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 group"
          >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Voltar aos Módulos
          </button>
        )}
      </div>
    </div>
  )
}