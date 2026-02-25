import { AlertTriangle, Trash2, Database, Users, DollarSign } from 'lucide-react'

interface MaintenanceSectionProps {
  type: 'rh' | 'financial'
  isAdmin: boolean
  onReset: () => void
  onResetSecondary?: () => void
  onResetTertiary?: () => void
}

export function MaintenanceSection({ type, isAdmin, onReset, onResetSecondary, onResetTertiary }: MaintenanceSectionProps) {
  if (!isAdmin) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Apenas administradores podem acessar esta seção.</p>
      </div>
    )
  }

  const configs = {
    rh: {
      title: 'Manutenção RH',
      icon: Users,
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      sections: [
        {
          title: 'Presença Portaria',
          description: 'Remove todos os registros de presença da portaria',
          table: 'presenca_portaria',
          buttonLabel: 'Resetar Presença',
          buttonColor: 'bg-green-600 hover:bg-green-700',
          action: onReset
        },
        {
          title: 'Colaboradores',
          description: 'Remove todos os dados cadastrais de colaboradores',
          table: 'colaboradores',
          buttonLabel: 'Resetar Colaboradores',
          buttonColor: 'bg-green-600 hover:bg-green-700',
          action: onResetSecondary
        },
        {
          title: 'Controle de Horas',
          description: 'Remove todos os registros de marcações de ponto',
          table: 'marcacoes_ponto',
          buttonLabel: 'Resetar Ponto',
          buttonColor: 'bg-green-600 hover:bg-green-700',
          action: onResetTertiary
        }
      ]
    },
    financial: {
      title: 'Manutenção Financeiro',
      icon: DollarSign,
      color: 'text-blue-800',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      sections: [
        {
          title: 'Financeiro Aeronave',
          description: 'Remove todos os lançamentos financeiros da aeronave',
          table: 'financeiro_aeronave',
          buttonLabel: 'Resetar Financeiro',
          buttonColor: 'bg-blue-800 hover:bg-blue-900',
          action: onReset
        }
      ]
    }
  }

  const config = configs[type]
  const Icon = config.icon

  return (
    <div className="space-y-6">
      <div className={`${config.bgColor} border ${config.borderColor} rounded-xl p-6`}>
        <div className="flex items-center gap-3 mb-2">
          <Database className={`h-5 w-5 ${config.color}`} />
          <h3 className={`text-lg font-bold ${config.color}`}>Zona de Perigo</h3>
        </div>
        <p className="text-gray-600 text-sm">As ações abaixo são irreversíveis e apagarão dados permanentemente do sistema.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {config.sections.map((section, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-5 w-5 ${config.color}`} />
                  <h4 className="font-bold text-gray-900">{section.title}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-1">{section.description}</p>
                <p className="text-xs text-gray-500 font-mono">Tabela: {section.table}</p>
              </div>
              <button
                onClick={section.action}
                className={`${section.buttonColor} text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors whitespace-nowrap`}
              >
                <Trash2 className="h-4 w-4" />
                {section.buttonLabel}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}