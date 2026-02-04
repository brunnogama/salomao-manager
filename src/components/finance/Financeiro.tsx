import { useState } from 'react'
import { Menu } from 'lucide-react'
import { SidebarFinanceiro } from './SidebarFinanceiro'
import { GestaoAeronave } from './pages/GestaoAeronave'
import { Calendario } from './pages/Calendario'
import { GED } from './pages/GED'

export function Financeiro() {
  const [activePage, setActivePage] = useState('gestao-aeronave')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isPresentationMode, setIsPresentationMode] = useState(false)

  const handleTogglePresentationMode = (isPresenting: boolean) => {
    setIsPresentationMode(isPresenting)
    if (isPresenting) {
      setIsSidebarOpen(false)
    }
  }

  const renderActivePage = () => {
    switch (activePage) {
      case 'gestao-aeronave':
        return (
          <GestaoAeronave
            userName="Bruno Silva"
            onModuleHome={() => {
              // TODO: Implementar navegação para seleção de módulos
              console.log('Voltar para seleção de módulos')
            }}
            onLogout={() => {
              // TODO: Implementar lógica de logout
              console.log('Logout')
            }}
            onTogglePresentationMode={handleTogglePresentationMode}
          />
        )
      
      case 'calendario':
        return <Calendario />
      
      case 'ged':
        return <GED />
      
      case 'dashboard':
        return (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center">
              <h2 className="text-2xl font-black text-[#112240] mb-2">Dashboard Financeiro</h2>
              <p className="text-gray-500">Em desenvolvimento...</p>
            </div>
          </div>
        )
      
      case 'contas-pagar':
        return (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center">
              <h2 className="text-2xl font-black text-[#112240] mb-2">Contas a Pagar</h2>
              <p className="text-gray-500">Em desenvolvimento...</p>
            </div>
          </div>
        )
      
      case 'contas-receber':
        return (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center">
              <h2 className="text-2xl font-black text-[#112240] mb-2">Contas a Receber</h2>
              <p className="text-gray-500">Em desenvolvimento...</p>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center">
              <h2 className="text-2xl font-black text-red-600 mb-2">Página não encontrada</h2>
              <p className="text-gray-500">A página "{activePage}" não existe.</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      
      {/* SIDEBAR - Esconde em modo apresentação */}
      {!isPresentationMode && (
        <SidebarFinanceiro
          activePage={activePage}
          onNavigate={setActivePage}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Botão Menu Mobile - Esconde em modo apresentação */}
        {!isPresentationMode && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden fixed top-4 left-4 z-30 p-3 bg-[#112240] text-white rounded-xl shadow-lg hover:bg-[#1e3a8a] transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}

        {/* Área de Conteúdo com Scroll */}
        <main className="flex-1 overflow-auto">
          {renderActivePage()}
        </main>
      </div>
    </div>
  )
}