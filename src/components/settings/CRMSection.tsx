import { AlertTriangle, Trash2, Database, Briefcase } from 'lucide-react'

interface CRMSectionProps {
  isAdmin: boolean
  onReset: () => void
}

export function CRMSection({ isAdmin, onReset }: CRMSectionProps) {
  if (!isAdmin) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Apenas administradores podem acessar esta seção.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-5 w-5 text-blue-700" />
          <h3 className="text-lg font-bold text-blue-900">Zona de Perigo</h3>
        </div>
        <p className="text-gray-600 text-sm">A ação abaixo é irreversível e apagará dados permanentemente do sistema.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-5 w-5 text-blue-700" />
              <h4 className="font-bold text-gray-900">Base de Dados do CRM</h4>
            </div>
            <p className="text-sm text-gray-600 mb-1">Remove todos os clientes, brindes, sócios e histórico do CRM</p>
            <p className="text-xs text-gray-500 font-mono">Tabelas: clientes, tipos_brinde, socios</p>
          </div>
          <button
            onClick={onReset}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Trash2 className="h-4 w-4" />
            Resetar CRM
          </button>
        </div>
      </div>
    </div>
  )
}