import React from 'react';
import { LayoutDashboard, Users, MapPin, Loader2, Mail, ChevronDown } from 'lucide-react';

interface DashboardHeaderProps {
  userRole: 'admin' | 'editor' | 'viewer' | null;
  selectedPartner: string;
  setSelectedPartner: (val: string) => void;
  partnersList: { id: string, name: string }[];
  selectedLocation: string;
  setSelectedLocation: (val: string) => void;
  locationsList: string[];
  exporting: boolean;
  onExport: () => void;
}

export function DashboardHeader({
  userRole,
  selectedPartner,
  setSelectedPartner,
  partnersList,
  selectedLocation,
  setSelectedLocation,
  locationsList,
  exporting,
  onExport
}: DashboardHeaderProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all p-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        
        {/* Título e Subtítulo - Manager Style */}
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-[#0a192f] text-amber-500 shadow-xl shadow-[#0a192f]/20">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm font-black text-[#0a192f] uppercase tracking-[0.3em]">
                Business Intelligence
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Controladoria Jurídica • Ecossistema Salomão
              </p>
            </div>
          </div>
        </div>

        {/* Filtros e Botão de Exportar - Tipografia Densa */}
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          
          <div className="relative min-w-[220px]" id="dashboard-filters">
            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#0a192f] pointer-events-none transition-colors" />
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#0a192f] outline-none appearance-none focus:bg-white focus:border-[#0a192f] transition-all cursor-pointer shadow-inner"
            >
              <option value="">TODOS OS SÓCIOS</option>
              {partnersList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name.toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500 pointer-events-none" />
          </div>

          <div className="relative min-w-[220px]" id="dashboard-filters">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-colors" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#0a192f] outline-none appearance-none focus:bg-white focus:border-[#0a192f] transition-all cursor-pointer shadow-inner"
            >
              <option value="">TODAS AS UNIDADES</option>
              {locationsList.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500 pointer-events-none" />
          </div>

          <div id="export-button-container">
            <button
              onClick={onExport}
              disabled={exporting}
              className="flex items-center justify-center gap-3 px-8 py-3 bg-[#0a192f] text-white text-[10px] font-black rounded-xl hover:bg-slate-800 shadow-xl shadow-[#0a192f]/20 transition-all active:scale-95 uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 text-amber-500" />
                  Relatório via E-mail
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}