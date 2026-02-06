import { Code, AlertTriangle, Trash2, FileText, Clock } from 'lucide-react'

interface ChangelogEntry {
  version: string
  date: string
  type: 'feature' | 'fix' | 'breaking'
  title: string
  changes: string[]
}

interface SystemSectionProps {
  changelog: ChangelogEntry[]
  isAdmin: boolean
  onSystemReset: () => void
}

export function SystemSection({ changelog, isAdmin, onSystemReset }: SystemSectionProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'fix': return 'bg-green-100 text-green-700 border-green-200'
      case 'breaking': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'feature': return 'Nova Feature'
      case 'fix': return 'Correção'
      case 'breaking': return 'Breaking Change'
      default: return 'Atualização'
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-6 w-6 text-gray-700" />
          <h3 className="text-xl font-bold text-gray-900">Changelog do Sistema</h3>
        </div>

        <div className="space-y-4">
          {changelog.map((entry, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-bold text-gray-900">v{entry.version}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTypeColor(entry.type)}`}>
                    {getTypeLabel(entry.type)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Clock className="h-4 w-4" />
                  {entry.date}
                </div>
              </div>

              <h4 className="font-bold text-gray-800 mb-3">{entry.title}</h4>

              <ul className="space-y-2">
                {entry.changes.map((change, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-bold text-red-900">Reset Total do Sistema</h3>
          </div>
          
          <p className="text-red-700 mb-4">
            Esta ação irá apagar <span className="font-bold">TODOS os dados do sistema</span>, incluindo clientes, histórico e configurações. 
            Use apenas para desenvolvimento ou em casos extremos.
          </p>

          <div className="bg-white border border-red-300 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 mb-2 font-medium">Será excluído:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-red-600">•</span>
                Todos os clientes e dados do CRM
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-600">•</span>
                Histórico completo de ações
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-600">•</span>
                Configurações e personalizações
              </li>
            </ul>
          </div>

          <button
            onClick={onSystemReset}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
            Resetar Sistema Completo
          </button>
        </div>
      )}
    </div>
  )
}