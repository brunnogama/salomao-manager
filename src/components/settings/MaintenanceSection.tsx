// src/components/settings/MaintenanceSection.tsx

import { Trash2, AlertTriangle, Users, Heart, Plane } from 'lucide-react'

interface MaintenanceSectionProps {
  type: 'rh' | 'family' | 'financial'
  isAdmin: boolean
  onReset: () => void
  onResetSecondary?: () => void
  onResetTertiary?: () => void
}

export function MaintenanceSection({ type, isAdmin, onReset, onResetSecondary, onResetTertiary }: MaintenanceSectionProps) {
  const config = {
    rh: {
      icon: Users,
      title: 'Manutenção - Recursos Humanos',
      primaryLabel: 'Resetar Presencial',
      primaryDesc: 'Apaga TODOS os registros de presença da portaria',
      secondaryLabel: 'Resetar Colaboradores',
      secondaryDesc: 'Apaga TODOS os dados de colaboradores',
      tertiaryLabel: 'Resetar Controle de Horas',
      tertiaryDesc: 'Apaga TODAS as marcações de ponto'
    },
    family: {
      icon: Heart,
      title: 'Manutenção - Gestão Familiar',
      primaryLabel: 'Resetar Base Família',
      primaryDesc: 'Apaga TODOS os dados financeiros da família'
    },
    financial: {
      icon: Plane,
      title: 'Manutenção - Financeiro',
      primaryLabel: 'Resetar Aeronave',
      primaryDesc: 'Apaga TODOS os dados da aeronave'
    }
  }

  const Icon = config[type].icon

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b">
        <Icon className="h-6 w-6 text-gray-700" />
        <h2 className="text-xl font-bold">{config[type].title}</h2>
      </div>

      {!isAdmin ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">Apenas administradores podem resetar dados do sistema.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Primary Reset */}
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-red-900 mb-1">{config[type].primaryLabel}</h3>
                <p className="text-sm text-red-700">{config[type].primaryDesc}</p>
              </div>
              <button
                onClick={onReset}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <Trash2 className="h-4 w-4" />
                Resetar
              </button>
            </div>
          </div>

          {/* Secondary Reset */}
          {onResetSecondary && config[type].secondaryLabel && (
            <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-orange-900 mb-1">{config[type].secondaryLabel}</h3>
                  <p className="text-sm text-orange-700">{config[type].secondaryDesc}</p>
                </div>
                <button
                  onClick={onResetSecondary}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Trash2 className="h-4 w-4" />
                  Resetar
                </button>
              </div>
            </div>
          )}

          {/* Tertiary Reset */}
          {onResetTertiary && config[type].tertiaryLabel && (
            <div className="p-4 border border-rose-200 rounded-lg bg-rose-50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-rose-900 mb-1">{config[type].tertiaryLabel}</h3>
                  <p className="text-sm text-rose-700">{config[type].tertiaryDesc}</p>
                </div>
                <button
                  onClick={onResetTertiary}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Trash2 className="h-4 w-4" />
                  Resetar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}