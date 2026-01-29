import { useState } from 'react'
import { LayoutDashboard, Database, Users, Heart, Star, Calendar } from 'lucide-react'

export function GestaoFamilia() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dados'>('dashboard')

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header com Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <h2 className="text-lg font-bold text-[#112240]">Família Salomão</h2>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-white text-[#112240] shadow-sm'
                : 'text-gray-500 hover:text-[#112240]'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('dados')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'dados'
                ? 'bg-white text-[#112240] shadow-sm'
                : 'text-gray-500 hover:text-[#112240]'
            }`}
          >
            <Database className="h-4 w-4" />
            Dados
          </button>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      <div className="flex-1">
        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cards de Resumo */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-50 rounded-lg text-red-600">
                  <Heart className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase">Membros</span>
              </div>
              <p className="text-3xl font-bold text-[#112240]">--</p>
              <p className="text-sm text-gray-500 mt-1">Total de familiares cadastrados</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                  <Star className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase">Eventos</span>
              </div>
              <p className="text-3xl font-bold text-[#112240]">--</p>
              <p className="text-sm text-gray-500 mt-1">Próximos marcos importantes</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Calendar className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase">Ações</span>
              </div>
              <p className="text-3xl font-bold text-[#112240]">--</p>
              <p className="text-sm text-gray-500 mt-1">Demandas em aberto</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-[#112240]">Base de Dados Familiar</h3>
              <button className="bg-[#1e3a8a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1e3a8a]/90 transition-colors">
                Adicionar Registro
              </button>
            </div>
            <div className="p-12 text-center text-gray-400">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Carregando registros da família...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}