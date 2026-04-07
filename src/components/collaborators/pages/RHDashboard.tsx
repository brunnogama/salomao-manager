import {
  LayoutDashboard,
  Maximize2,
  Minimize2,
  Download,
  FileDown,
  Loader2
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
import XLSX from 'xlsx-js-style'
import { useColaboradores } from '../hooks/useColaboradores'
import { getSegment, isActiveAtDate, calculateTenure } from '../utils/rhChartUtils'

export function RHDashboard() {
  const { isPresentationMode, togglePresentationMode } = usePresentation()
  const [showExportModal, setShowExportModal] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  
  const { colaboradores } = useColaboradores()

  const handleExportXLSX = () => {
    if (!colaboradores || colaboradores.length === 0) {
      toast.error('Nenhum dado carregado para exportar.');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();
      const applyHeaderStyle = (ws: any) => {
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
          if (ws[cellRef]) ws[cellRef].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0A192F" } }, alignment: { horizontal: "center", vertical: "center" } };
        }
      }

      // 1. Base Completa
      const rawData = colaboradores.map(c => ({
        "Nome": c.name,
        "Segmento": getSegment(c),
        "Área": c.area,
        "Local": c.locations?.name || String(c.local),
        "Cargo": c.roles?.name || String(c.role),
        "Status": isActiveAtDate(c, new Date()) ? "Ativo" : "Inativo",
        "Data de Contratação": c.hire_date ? new Date(c.hire_date + 'T12:00:00').toLocaleDateString('pt-BR') : '',
        "Data de Desligamento": c.termination_date ? new Date(c.termination_date + 'T12:00:00').toLocaleDateString('pt-BR') : '',
        "Tempo de Casa (Anos)": c.hire_date ? calculateTenure(c.hire_date, new Date(), c.termination_date).toFixed(1).replace('.', ',') : ''
      }));
      const wsRaw = XLSX.utils.json_to_sheet(rawData);
      applyHeaderStyle(wsRaw);
      wsRaw['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsRaw, "Base de Colaboradores");

      // 2. Headcount Resumo
      const ativos = colaboradores.filter(c => isActiveAtDate(c, new Date()));
      const admCount = ativos.filter(c => getSegment(c) === 'Administrativo').length;
      const jurCount = ativos.filter(c => getSegment(c) === 'Jurídico').length;
      const tercCount = ativos.filter(c => getSegment(c) === 'Terceirizada').length;

      const wsHeadcount = XLSX.utils.json_to_sheet([
         { "Métrica": "Total de Ativos", "Quantidade": ativos.length },
         { "Métrica": "Ativos Administrativo", "Quantidade": admCount },
         { "Métrica": "Ativos Jurídico", "Quantidade": jurCount },
         { "Métrica": "Ativos Terceirizados", "Quantidade": tercCount },
      ]);
      applyHeaderStyle(wsHeadcount);
      wsHeadcount['!cols'] = [{ wch: 30 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsHeadcount, "Headcount Atual");

      // 3. Cargos
      const cargoCount = ativos.reduce((acc, c) => {
        const cargo = c.roles?.name || String(c.role) || 'Não definido';
        acc[cargo] = (acc[cargo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const cargoData = Object.entries(cargoCount).map(([cargo, qtd]) => ({
         "Cargo": cargo,
         "Quantidade": qtd
      })).sort((a,b) => b.Quantidade - a.Quantidade);

      const wsCargos = XLSX.utils.json_to_sheet(cargoData);
      applyHeaderStyle(wsCargos);
      wsCargos['!cols'] = [{ wch: 40 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsCargos, "Distribuição por Cargo");

      XLSX.writeFile(wb, `Dados_Dashboard_RH_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel com dados dos gráficos gerado!');
    } catch(err) {
      console.error(err);
      toast.error('Erro ao gerar o arquivo XLSX.');
    }
  }

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
      } catch(error) {
        console.warn('Falha silenciosa evitada - Erro ao integrar logo no canvas PDF', error);
      }

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

          {/* Botão de Exportar XLSX */}
          <button
            onClick={handleExportXLSX}
            title="Exportar Planilha Excel com Dados Brutos"
            className="flex justify-center items-center w-10 h-10 rounded-xl shadow-lg transition-all active:scale-95 bg-[#00b87c] text-white hover:bg-[#00a36e] shrink-0"
          >
            <FileDown className="w-5 h-5" />
          </button>

          {/* Botão de Exportar PDF */}
          <button
            onClick={() => setShowExportModal(true)}
            disabled={isExportingPDF}
            title="Exportar Dashboard em PDF (Alta Resolução)"
            className="flex justify-center items-center w-10 h-10 rounded-xl shadow-lg transition-all active:scale-95 bg-[#ff4d4f] text-white hover:bg-[#ff3030] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExportingPDF ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto w-full pb-10 flex flex-col gap-6">

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