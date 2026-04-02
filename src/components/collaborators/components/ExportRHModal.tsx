import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, FileText, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';

export interface ExportChart {
  id: string;
  label: string;
}

export interface ExportSection {
  title: string;
  charts: ExportChart[];
}

export const EXPORT_SECTIONS: ExportSection[] = [
  {
    title: 'Evolução Pessoal (Headcount e Turnover)',
    charts: [
      { id: 'export-kpis-evolucao', label: 'Evolução Pessoal: KPIs' },
      { id: 'export-evolucao-acumulada', label: 'Evolução Acumulada do Headcount' },
      { id: 'export-distribuicao-cargo', label: 'Distribuição por Cargo (Ativos)' },
      { id: 'export-ranking-contratacoes', label: 'Contratações por Cargo (Ranking)' },
      { id: 'export-fluxo-contratacoes', label: 'Fluxo de Contratações' },
      { id: 'export-fluxo-desligamentos', label: 'Fluxo de Desligamentos' },
      { id: 'export-origem-iniciativa', label: 'Origem (Contratação) e Iniciativa (Desligamento)' },
      { id: 'export-motivos-desligamento', label: 'Top Motivos de Desligamento' },
    ]
  },
  {
    title: 'Análise de Tempo de Casa',
    charts: [
      { id: 'export-kpis-tempo', label: 'Tempo de Casa: KPIs' },
      { id: 'export-evolucao-estabilidade', label: 'Evolução da Estabilidade Média' },
      { id: 'export-tempo-area', label: 'Tempo Médio por Área' },
      { id: 'export-concentracao-experiencia', label: 'Concentração Jurídico por Experiência' },
      { id: 'export-tempo-lider', label: 'Tempo Médio por Líder' },
      { id: 'export-insights-tempo', label: 'Insights e Ações Estratégicas' },
    ]
  },
  {
    title: 'Volumetria de Headcount',
    charts: [
      { id: 'export-kpis-headcount', label: 'Headcount: KPIs' },
      { id: 'export-headcount-mapa', label: 'Distribuição por Local' },
      { id: 'export-headcount-lideres', label: 'Integrantes por Líder' },
      { id: 'export-headcount-demografico', label: 'Gênero e Faixa Etária' },
      { id: 'export-headcount-cargos', label: 'Distribuição por Cargo e Nível' },
      { id: 'export-insights-headcount', label: 'Insights e Ações Estratégicas' },
    ]
  },
  {
    title: 'Análise de Turnover',
    charts: [
      { id: 'export-kpis-turnover', label: 'Turnover & Retenção: KPIs' },
      { id: 'export-turnover-evolucao', label: 'Evolução do Turnover e Tipos de Desligamento' },
      { id: 'export-turnover-risco-cargos', label: 'Risco por Tempo de Casa e Cargos Afetados' },
      { id: 'export-insights-turnover', label: 'Insights e Ações Estratégicas' },
    ]
  },
  {
    title: 'Recrutamento & Seleção',
    charts: [
      { id: 'export-vagas', label: 'Dashboard de Vagas e Talentos (Completo)' },
    ]
  },
  {
    title: 'Ações e Notificações de RH',
    charts: [
      { id: 'export-acoes', label: 'Lista de Ações Institucionais (Completo)' },
    ]
  }
];

// Resolvido: Constante estática movida para o escopo un-renderizado evitando alocamento em cascata nos updates
const ALL_CHART_IDS = EXPORT_SECTIONS.flatMap(s => s.charts.map(c => c.id));

interface ExportRHModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (selectedSectionIds: string[]) => void;
  isExporting: boolean;
}

export function ExportRHModal({ isOpen, onClose, onExport, isExporting }: ExportRHModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(ALL_CHART_IDS);
  const [expandedSections, setExpandedSections] = useState<string[]>(EXPORT_SECTIONS.map(s => s.title)); 

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(ALL_CHART_IDS);
      setExpandedSections(EXPORT_SECTIONS.map(s => s.title));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isExporting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isExporting]);

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleToggleSection = (section: ExportSection) => {
    const sectionIds = section.charts.map(c => c.id);
    const areAllSelected = sectionIds.every(id => selectedIds.includes(id));
    
    if (areAllSelected) {
      setSelectedIds(prev => prev.filter(id => !sectionIds.includes(id)));
    } else {
      setSelectedIds(prev => {
        const newIds = new Set(prev);
        sectionIds.forEach(id => newIds.add(id));
        return Array.from(newIds);
      });
    }
  };

  const handleToggleAll = () => {
    if (selectedIds.length === ALL_CHART_IDS.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(ALL_CHART_IDS);
    }
  };

  const toggleExpand = (title: string) => {
    setExpandedSections(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const allSelected = selectedIds.length === ALL_CHART_IDS.length;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-6">
        <div 
          className="absolute inset-0 bg-[#0a192f]/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => !isExporting && onClose()}
        />

        <div
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden transition-all duration-300 transform scale-100 opacity-100"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-red-100 text-red-600 shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#0a192f] leading-none">Exportar Relatório PDF</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Selecione exatamente quais gráficos deseja incluir</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isExporting}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
            
            <button
              onClick={handleToggleAll}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-blue-50/50 hover:bg-blue-50 border border-blue-100 transition-colors group"
            >
              <div className={`p-0.5 rounded flex items-center justify-center shrink-0 transition-colors ${allSelected ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`}>
                {allSelected ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
              </div>
              <span className={`text-base font-bold transition-colors ${allSelected ? 'text-blue-800' : 'text-gray-600'}`}>
                {allSelected ? 'Desmarcar Todos os Gráficos' : 'Selecionar Todos (Exportação Completa)'}
              </span>
            </button>

            <div className="space-y-4">
              {EXPORT_SECTIONS.map(section => {
                const sectionIds = section.charts.map(c => c.id);
                const isAllSectionSelected = sectionIds.every(id => selectedIds.includes(id));
                const isSomeSectionSelected = sectionIds.some(id => selectedIds.includes(id));
                const isExpanded = expandedSections.includes(section.title);

                return (
                  <div key={section.title} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    {/* Section Header */}
                    <div className="flex items-center justify-between bg-gray-50/80 p-3 sm:px-4 sm:py-3 border-b border-gray-200">
                      <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => handleToggleSection(section)}>
                        <div className={`p-0.5 flex items-center justify-center shrink-0 transition-colors ${isAllSectionSelected ? 'text-blue-600' : isSomeSectionSelected ? 'text-blue-400' : 'text-gray-400'}`}>
                          {isAllSectionSelected ? <CheckSquare className="w-5 h-5" /> : (
                             isSomeSectionSelected ? <div className="w-5 h-5 flex items-center justify-center"><div className="w-3 h-3 bg-blue-400 rounded-sm"></div></div> : <Square className="w-5 h-5" />
                          )}
                        </div>
                        <span className="font-bold text-gray-800 select-none text-sm sm:text-base">
                          {section.title}
                          <span className="ml-2 text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                            {sectionIds.filter(id => selectedIds.includes(id)).length} de {section.charts.length}
                          </span>
                        </span>
                      </div>
                      <button 
                        onClick={() => toggleExpand(section.title)}
                        className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors ml-2 shrink-0"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Section Items */}
                    {isExpanded && (
                      <div className="p-2 sm:p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white">
                        {section.charts.map(chart => {
                          const isSelected = selectedIds.includes(chart.id);
                          return (
                            <button
                              key={chart.id}
                              onClick={() => handleToggle(chart.id)}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group text-left border border-transparent hover:border-gray-100"
                            >
                              <div className={`mt-0.5 shrink-0 transition-colors ${isSelected ? 'text-blue-600' : 'text-gray-300 group-hover:text-blue-400'}`}>
                                {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                              </div>
                              <span className={`text-xs sm:text-sm font-medium leading-tight transition-colors ${isSelected ? 'text-[#0a192f]' : 'text-gray-500 group-hover:text-gray-700'}`}>
                                {chart.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

          {/* Footer */}
          <div className="p-5 sm:p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
            <span className="text-sm font-medium text-gray-500">
              {selectedIds.length} gráficos selecionados
            </span>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isExporting}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 bg-white border border-gray-200 hover:border-gray-300 rounded-xl transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => onExport(selectedIds)}
                disabled={isExporting || selectedIds.length === 0}
                className="px-5 py-2.5 flex items-center gap-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all disabled:opacity-50 shadow-md shadow-red-600/20"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exportando...' : 'Gerar PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
