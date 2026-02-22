import { useState } from 'react'
import {
  GraduationCap
} from 'lucide-react'
import { ListaVencimentosOAB } from '../components/ListaVencimentosOAB'

export function ListaOAB() {
  const [selectedMonth] = useState(new Date().getMonth())
  const [selectedYear] = useState(new Date().getFullYear())

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Vencimentos OAB
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Gestão de anuidades e obrigações profissionais
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Navigation buttons removed as per new UI requirements */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
          {/* COMPONENTE DE LISTA DE VENCIMENTOS OAB */}
          <ListaVencimentosOAB
            mesAtual={selectedMonth}
            anoAtual={selectedYear}
          />
        </div>
      </div>
    </div>
  )
}