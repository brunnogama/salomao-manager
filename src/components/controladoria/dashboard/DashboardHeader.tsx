import { useState } from 'react';
import { LayoutDashboard, Users, MapPin, Maximize2, Minimize2, Camera, Loader2 } from 'lucide-react';
import { usePresentation } from '../../../contexts/PresentationContext';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface DashboardHeaderProps {
  userRole: 'admin' | 'editor' | 'viewer' | null;
  selectedPartner: string;
  setSelectedPartner: (val: string) => void;
  partnersList: { id: string, name: string }[];
  selectedLocation: string;
  setSelectedLocation: (val: string) => void;
  locationsList: string[];
  hideTitle?: boolean;
  className?: string;
}

import { FilterSelect } from '../ui/FilterSelect';

export function DashboardHeader({
  selectedPartner,
  setSelectedPartner,
  partnersList,
  selectedLocation,
  setSelectedLocation,
  locationsList,
  hideTitle = false,
  className = ""
}: DashboardHeaderProps) {
  const { isPresentationMode, togglePresentationMode } = usePresentation();
  const [isCapturing, setIsCapturing] = useState(false);

  const handleScreenshot = async () => {
    const targetElement = document.getElementById('dashboard-content-to-capture');
    if (!targetElement) {
      toast.error('Conteúdo do dashboard não encontrado para captura.');
      return;
    }

    setIsCapturing(true);
    try {
      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#F8FAFC', // Match existing bg-gray-50
        windowWidth: 1920,
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Erro ao gerar imagem para área de transferência.');
          return;
        }
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]).then(() => {
          toast.success('Screenshot do dashboard copiado para a área de transferência!');
        }).catch(err => {
          console.error("Erro ao copiar para clipboard:", err);
          toast.error('Erro ao acessar a área de transferência.');
        });
      }, 'image/png');

    } catch (error) {
      console.error("Erro ao gerar screenshot:", error);
      toast.error('Ocorreu um erro ao capturar o dashboard.');
    } finally {
      setIsCapturing(false);
    }
  };

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
          <div className="flex flex-col">
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

          {/* Botão de Screenshot */}
          <button
            onClick={handleScreenshot}
            disabled={isCapturing}
            title="Copiar Screenshot do Dashboard"
            className="flex justify-center items-center w-10 h-10 rounded-xl shadow-lg transition-all active:scale-95 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCapturing ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#1e3a8a]" />
            ) : (
              <Camera className="w-5 h-5" />
            )}
          </button>

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
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}