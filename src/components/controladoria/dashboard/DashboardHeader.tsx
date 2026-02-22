import React from 'react';
import { LayoutDashboard, Users, MapPin, Loader2, Mail, Maximize2, Minimize2 } from 'lucide-react';
import { usePresentation } from '../../../contexts/PresentationContext';

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
  hideTitle?: boolean;
  className?: string;
}

import { FilterSelect } from '../ui/FilterSelect';

export function DashboardHeader({
  userRole,
  selectedPartner,
  setSelectedPartner,
  partnersList,
  selectedLocation,
  setSelectedLocation,
  locationsList,
  exporting,
  onExport,
  hideTitle = false,
  className = ""
}: DashboardHeaderProps) {
  const { isPresentationMode, togglePresentationMode } = usePresentation();

  const partnerOptions = [
    { label: 'Todos os Sócios', value: '' },
    ...partnersList.map(p => ({ label: p.name, value: p.id }))
  ];

  const locationOptions = [
    { label: 'Todos os Locais', value: '' },
    ...locationsList.map(l => ({ label: l, value: l }))
  ];

  return (
    <div className={`bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-6 ${className}`}>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">

        {/* Título e Subtítulo */}
        {!hideTitle && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#112240] to-[#1e3a8a] text-white shadow-lg">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight">
                Controladoria Jurídica
              </h1>
            </div>
            <p className="text-sm font-semibold text-gray-500 ml-[52px]">
              Visão estratégica de contratos e resultados
            </p>
          </div>
        )}

        {/* Filtros e Botão de Exportar */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">

          {/* Filtro de Sócio */}
          <FilterSelect
            icon={Users}
            value={selectedPartner}
            onChange={setSelectedPartner}
            options={partnerOptions}
            placeholder="Sócios"
          />

          {/* Filtro de Localização */}
          <FilterSelect
            icon={MapPin}
            value={selectedLocation}
            onChange={setSelectedLocation}
            options={locationOptions}
            placeholder="Locais"
          />

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

          {/* Botão de Exportar */}
          <div id="export-button-container" className="w-full sm:w-auto mt-2 sm:mt-0">
            <button
              onClick={onExport}
              disabled={exporting}
              title="Enviar E-mail"
              className="flex justify-center items-center w-10 h-10 bg-[#1e3a8a] text-white rounded-xl hover:bg-[#112240] shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}