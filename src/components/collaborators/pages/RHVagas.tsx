import { useState } from 'react'
import {
  Briefcase,
  Plus,
  Search,
  Users,
  Clock,
  CheckCircle2
} from 'lucide-react'

export function RHVagas() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-6 relative p-6">

      {/* PAGE HEADER - Padrão Salomão Design System */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <Briefcase className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Recrutamento & Seleção
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Gestão de vagas abertas, candidatos e processos seletivos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95">
            <Plus className="h-4 w-4" /> Nova Vaga
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 w-full">

        {/* TOOLBAR & STATS */}
        <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 w-full xl:w-auto">
            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max">
              <div className="p-2 rounded-lg bg-blue-50 text-[#1e3a8a]">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[8px] text-gray-400 uppercase font-black tracking-[0.1em]">Vagas Abertas</p>
                <p className="text-sm font-bold text-[#0a192f]">0</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-gray-100 min-w-max">
              <div className="p-2 rounded-lg bg-blue-50 text-[#1e3a8a]">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[8px] text-gray-400 uppercase font-black tracking-[0.1em]">Total Candidatos</p>
                <p className="text-sm font-bold text-[#0a192f]">0</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full xl:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar vagas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium text-xs"
              />
            </div>
            {/* Nova Vaga button moved to header */}
          </div>
        </div>

        {/* LISTA DE VAGAS (PLACEHOLDER) */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-full bg-blue-50 mb-4">
              <CheckCircle2 className="h-12 w-12 text-[#1e3a8a] opacity-20" />
            </div>
            <h2 className="text-xl font-black text-[#0a192f]">Nenhum processo seletivo ativo</h2>
            <p className="text-gray-500 max-w-sm mt-2">
              Clique em "Nova Vaga" para iniciar um recrutamento ou importe candidatos de planilhas externas.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}