import { useState, useMemo, useEffect } from 'react'
import {
  LayoutDashboard,
  Users,
  Maximize2,
  Minimize2,
  Cake,
  TrendingUp,
  Award,
  MapPin,
  DoorOpen,
  PieChart as PieChartIcon
} from 'lucide-react'
import { usePresentation } from '../../../contexts/PresentationContext'
import { useColaboradores } from '../hooks/useColaboradores'
import { Collaborator } from '../../../types/controladoria'
import { RHEvolucaoPessoal } from './RHEvolucaoPessoal'
import { RHTempoCasa } from './RHTempoCasa'
import { RHHeadcount } from './RHHeadcount'
import { RHTurnover } from './RHTurnover'
import { RHVagas } from './RHVagas'
import { RHAcoes } from './RHAcoes'

// --- Helper Functions ---
// --- Main component ---
export function RHDashboard() {
  const { isPresentationMode, togglePresentationMode } = usePresentation()

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <LayoutDashboard className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Dashboard RH
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Visão geral estratégica e indicadores chave
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Botão de Apresentação */}
          <button
            onClick={togglePresentationMode}
            title={isPresentationMode ? "Sair da Apresentação" : "Modo Apresentação"}
            className={`flex justify-center items-center w-10 h-10 rounded-xl shadow-lg transition-all active:scale-95 ${isPresentationMode
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
          >
            {isPresentationMode ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto w-full pb-10 flex flex-col gap-6">

        {/* Master Dashboards Included Here */}
        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
          <RHEvolucaoPessoal />
        </div>

        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
          <RHTempoCasa />
        </div>

        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
          <RHHeadcount />
        </div>

        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
          <RHTurnover />
        </div>

        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
          <RHVagas />
        </div>

        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
          <RHAcoes />
        </div>

      </div>
    </div >
  )
}