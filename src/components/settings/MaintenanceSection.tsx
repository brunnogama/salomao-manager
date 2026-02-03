import React from 'react'
import { AlertTriangle, Trash2, Heart, Plane, Users } from 'lucide-react'

interface MaintenanceProps {
  type: 'family' | 'financial' | 'rh';
  isAdmin: boolean;
  onReset: () => void;
  onResetSecondary?: () => void; // Para RH que tem dois resets
}

export function MaintenanceSection({ type, isAdmin, onReset, onResetSecondary }: MaintenanceProps) {
  const configs = {
    family: {
      icon: Heart,
      color: 'purple',
      title: 'Manutenção Gestão de Família',
      desc: 'Controle de dados da Secretaria Executiva',
      label: 'Resetar Base da Família (Secretaria)'
    },
    financial: {
      icon: Plane,
      color: 'blue',
      title: 'Manutenção Financeiro',
      desc: 'Controle de dados da Gestão de Aeronave',
      label: 'Resetar Base da Aeronave'
    },
    rh: {
      icon: Users,
      color: 'green',
      title: 'Manutenção RH',
      desc: 'Controle de Presença e Colaboradores',
      label: 'Resetar Presença'
    }
  }[type];

  const Icon = configs.icon;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-in fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 bg-${configs.color}-50 rounded-lg`}>
          <Icon className={`h-5 w-5 text-${configs.color}-700`} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-base">{configs.title}</h3>
          <p className="text-xs text-gray-500">{configs.desc}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border border-red-200 rounded-xl overflow-hidden">
          <div className="bg-red-50 p-4 border-b border-red-200 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h4 className="font-bold text-red-800 text-sm">Zona de Perigo</h4>
          </div>
          <div className="p-6">
            <button 
              onClick={onReset} 
              disabled={!isAdmin} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white transition-colors ${isAdmin ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300 cursor-not-allowed'}`}
            >
              <Trash2 className="h-4 w-4" /> {configs.label}
            </button>
            
            {type === 'rh' && onResetSecondary && (
              <button 
                onClick={onResetSecondary} 
                disabled={!isAdmin} 
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:bg-gray-300"
              >
                <Trash2 className="h-4 w-4" /> Resetar Colaboradores
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}