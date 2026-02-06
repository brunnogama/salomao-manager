import { Briefcase, Gift, Users, Trash2, Plus } from 'lucide-react'

interface GenericItem {
  id: number
  nome: string
  ativo?: boolean
}

interface CRMSectionProps {
  brindes: GenericItem[]
  socios: GenericItem[]
  onDeleteBrinde: (id: number, nome: string) => void
  onDeleteSocio: (id: number, nome: string) => void
}

export function CRMSection({ brindes, socios, onDeleteBrinde, onDeleteSocio }: CRMSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Gift className="h-6 w-6 text-blue-700" />
          <h3 className="text-xl font-bold text-gray-900">Tipos de Brindes</h3>
        </div>

        {brindes.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <Gift className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum tipo de brinde cadastrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {brindes.map((brinde) => (
              <div
                key={brinde.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Gift className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-900">{brinde.nome}</span>
                </div>
                <button
                  onClick={() => onDeleteBrinde(brinde.id, brinde.nome)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir brinde"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-6 w-6 text-blue-700" />
          <h3 className="text-xl font-bold text-gray-900">Sócios</h3>
        </div>

        {socios.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum sócio cadastrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {socios.map((socio) => (
              <div
                key={socio.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-900">{socio.nome}</span>
                </div>
                <button
                  onClick={() => onDeleteSocio(socio.id, socio.nome)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir sócio"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <Briefcase className="h-5 w-5 text-blue-700" />
          <h4 className="font-bold text-blue-900">Nota sobre o CRM</h4>
        </div>
        <p className="text-sm text-blue-700">
          Os cadastros de brindes e sócios são gerenciados diretamente no módulo CRM. 
          Esta seção permite apenas visualização e exclusão dos itens existentes.
        </p>
      </div>
    </div>
  )
}