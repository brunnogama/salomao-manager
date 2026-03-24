import {
  LayoutDashboard,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { usePresentation } from '../../../contexts/PresentationContext'
import { RHEvolucaoPessoal } from './RHEvolucaoPessoal'
import { RHTempoCasa } from './RHTempoCasa'
import { RHHeadcount } from './RHHeadcount'
import { RHTurnover } from './RHTurnover'
import { RHVagas } from './RHVagas'
import { RHAcoes } from './RHAcoes'
import { ExportRHModal } from '../components/ExportRHModal'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useState } from 'react'

// --- Helper Functions ---
// --- Main component ---
export function RHDashboard() {
  const { isPresentationMode, togglePresentationMode } = usePresentation()
  const [showExportModal, setShowExportModal] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const handleExportPDF = async (selectedIds: string[]) => {
    setIsExportingPDF(true);
    setShowExportModal(false);
    const loadingToast = toast.loading('Gerando PDF Executivo de RH... Isso pode levar alguns segundos.');

    const originalScrollY = window.scrollY;
    window.scrollTo({ top: 0, behavior: 'instant' });

    try {
      let pdf: jsPDF | null = null;
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const pdfWidth = 1190;
      const pdfHeight = 1684;
      
      pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [pdfWidth, pdfHeight]
      });

      pdf.setFillColor(10, 25, 47);
      pdf.rect(0, 0, pdfWidth, 120, 'F');
      
      const img = new Image();
      img.src = '/logo-salomao.png';
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      
      try {
        if (img.width > 0) {
          pdf.addImage(img, 'PNG', 40, 30, 200, 60);
        }
      } catch(e) {}

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RELATÓRIO EXECUTIVO DE RECURSOS HUMANOS', pdfWidth - 40, 65, { align: 'right' });
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(200, 210, 230);
      const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
      pdf.text(`Gerado em: ${dateStr}`, pdfWidth - 40, 90, { align: 'right' });

      let currentY = 160;

      for (let i = 0; i < selectedIds.length; i++) {
        const targetElement = document.getElementById(selectedIds[i]);
        if (!targetElement) continue;

        const canvas = await html2canvas(targetElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#F8FAFC',
          scrollY: 0,
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pdfWidth - 80;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (currentY + imgHeight > pdfHeight - 40) {
          pdf.addPage([pdfWidth, pdfHeight], 'p');
          pdf.setFillColor(10, 25, 47);
          pdf.rect(0, 0, pdfWidth, 40, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('SALOMÃO KAIUCA - RELATÓRIO EXECUTIVO RH', 40, 25);
          currentY = 80;
        }

        pdf.addImage(imgData, 'PNG', 40, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 40;
      }

      pdf.save(`Relatorio_Executivo_RH_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
      toast.success('Relatório Executivo PDF gerado com sucesso!', { id: loadingToast });

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error('Ocorreu um erro ao gerar o PDF.', { id: loadingToast });
    } finally {
      setIsExportingPDF(false);
      window.scrollTo({ top: originalScrollY, behavior: 'instant' });
    }
  };

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

        <div className="flex flex-wrap items-center gap-3">
          {/* Botão de Exportar PDF */}
          <button
            onClick={() => setShowExportModal(true)}
            disabled={isExportingPDF}
            title="Exportar Dashboard em PDF (Relatório Executivo)"
            className="flex justify-center items-center h-10 px-4 rounded-xl transition-all active:scale-95 bg-red-600 text-white hover:bg-red-700 border-none disabled:opacity-50 disabled:cursor-not-allowed gap-2"
            style={{ boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)' }}
          >
            {isExportingPDF ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            )}
            <span className="text-sm font-bold hidden sm:block">Exportar PDF</span>
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
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto w-full pb-10 flex flex-col gap-6">

        {/* Master Dashboards Included Here */}
        <div id="export-evolucao-pessoal" className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
          <RHEvolucaoPessoal />
        </div>

        <div id="export-tempo-casa" className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
          <RHTempoCasa />
        </div>

        <div id="export-headcount" className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
          <RHHeadcount />
        </div>

        <div id="export-turnover" className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
          <RHTurnover />
        </div>

        <div id="export-vagas" className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
          <RHVagas />
        </div>

        <div id="export-acoes" className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
          <RHAcoes />
        </div>

      </div>

      <ExportRHModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportPDF}
        isExporting={isExportingPDF}
      />
    </div >
  )
}