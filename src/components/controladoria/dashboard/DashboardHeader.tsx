import { useState } from 'react';
import { LayoutDashboard, Users, MapPin, Maximize2, Minimize2, Camera, Loader2, Download, FileDown } from 'lucide-react';
import { usePresentation } from '../../../contexts/PresentationContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface DashboardHeaderProps {
  userRole: 'admin' | 'editor' | 'viewer' | null;
  selectedPartner: string;
  setSelectedPartner: (val: string) => void;
  partnersList: { id: string, name: string }[];
  selectedLocation: string;
  setSelectedLocation: (val: string) => void;
  locationsList: string[];
  selectedPeriod?: { start: string; end: string };
  setSelectedPeriod?: (val: { start: string; end: string }) => void;
  onExportXLSX?: () => void;
  hideTitle?: boolean;
  className?: string;
}

import { FilterSelect } from '../ui/FilterSelect';
import { DateFilterSelect } from '../ui/DateFilterSelect';

export function DashboardHeader({
  selectedPartner,
  setSelectedPartner,
  partnersList,
  selectedLocation,
  setSelectedLocation,
  locationsList,
  selectedPeriod,
  setSelectedPeriod,
  onExportXLSX,
  hideTitle = false,
  className = ""
}: DashboardHeaderProps) {
  const { isPresentationMode, togglePresentationMode } = usePresentation();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    const loadingToast = toast.loading('Gerando PDF multipáginas... Isso pode levar alguns segundos.');

    // Salvar scroll position
    const originalScrollY = window.scrollY;
    
    // Rolar para o topo. Resolve bug crítico do html2canvas (1.4.1) cortar o topo dos elementos dentro de flexbox quando a página está rolada para baixo.
    window.scrollTo({ top: 0, behavior: 'instant' });

    try {
      const sections = ['pdf-section-1', 'pdf-section-2', 'pdf-section-3'];
      let pdf: jsPDF | null = null;
      
      // Delay pro navegador repintar no topo
      await new Promise(resolve => setTimeout(resolve, 300));

      for (let i = 0; i < sections.length; i++) {
        const targetElement = document.getElementById(sections[i]);
        if (!targetElement) continue;

        const canvas = await html2canvas(targetElement, {
          scale: 2, // Double resolution for sharpness
          useCORS: true,
          backgroundColor: '#F8FAFC', // Background cor do dashboard
          // IMPORTANT: não travar com windowWidth: 1920 senão força um reflow interno e causa corte superior nos childs
          scrollY: 0, 
        });

        const imgData = canvas.toDataURL('image/png');
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        if (!pdf) {
          // Primeira página dita o formado inicial
          pdf = new jsPDF({
            orientation: canvasWidth > canvasHeight ? 'l' : 'p',
            unit: 'px',
            format: [canvasWidth, canvasHeight]
          });
          pdf.addImage(imgData, 'PNG', 0, 0, canvasWidth, canvasHeight);
        } else {
          // Adiciona nova página com dimensões personalizadas para esta seção
          pdf.addPage([canvasWidth, canvasHeight], canvasWidth > canvasHeight ? 'l' : 'p');
          pdf.setPage(i + 1);
          pdf.addImage(imgData, 'PNG', 0, 0, canvasWidth, canvasHeight);
        }
      }
      
      if (pdf) {
        pdf.save('Dashboard_Controladoria.pdf');
        toast.success('PDF do Dashboard gerado com sucesso!', { id: loadingToast });
      } else {
        toast.error('Conteúdo do dashboard não encontrado para exportação.', { id: loadingToast });
      }
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error('Ocorreu um erro ao gerar o PDF.', { id: loadingToast });
    } finally {
      setIsExportingPDF(false);
      // Restaurar o scroll pra onde o usuário estava
      window.scrollTo({ top: originalScrollY, behavior: 'instant' });
    }
  };

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

          {/* Filtro de Período */}
          {selectedPeriod && setSelectedPeriod && (
            <DateFilterSelect
              value={selectedPeriod}
              onChange={setSelectedPeriod}
            />
          )}

          {/* Botão de Screenshot */}
          <button
            onClick={handleScreenshot}
            disabled={isCapturing || isExportingPDF}
            title="Copiar Screenshot do Dashboard"
            className="flex justify-center items-center w-10 h-10 rounded-xl shadow-lg transition-all active:scale-95 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCapturing ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#1e3a8a]" />
            ) : (
              <Camera className="w-5 h-5" />
            )}
          </button>

          {/* Botão de Exportar XLSX */}
          {onExportXLSX && (
            <button
              onClick={onExportXLSX}
              title="Exportar Planilha Excel com Dados Brutos"
              className="flex justify-center items-center w-10 h-10 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 bg-[#00b87c] text-white hover:bg-[#00a36e] shrink-0"
            >
              <FileDown className="w-5 h-5" />
            </button>
          )}

          {/* Botão de Exportar PDF */}
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF || isCapturing}
            title="Exportar Dashboard em PDF (Alta Resolução)"
            className="flex justify-center items-center w-10 h-10 rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-95 bg-[#ff4d4f] text-white hover:bg-[#ff3030] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExportingPDF ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
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