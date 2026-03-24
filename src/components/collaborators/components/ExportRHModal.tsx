import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, FileText, CheckSquare, Square } from 'lucide-react';

export interface ExportSection {
  id: string;
  label: string;
}

export const EXPORT_SECTIONS: ExportSection[] = [
  { id: 'export-evolucao-pessoal', label: 'Evolução Acumulada do Headcount' },
  { id: 'export-tempo-casa', label: 'Tempo de Casa' },
  { id: 'export-headcount', label: 'Volumetria de Headcount' },
  { id: 'export-turnover', label: 'Análise de Turnover' },
  { id: 'export-vagas', label: 'Eficiência de Recrutamento' },
  { id: 'export-acoes', label: 'Ações e Notificações de RH' },
];

interface ExportRHModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (selectedSectionIds: string[]) => void;
  isExporting: boolean;
}

export function ExportRHModal({ isOpen, onClose, onExport, isExporting }: ExportRHModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(EXPORT_SECTIONS.map(s => s.id));

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

  const handleToggleAll = () => {
    if (selectedIds.length === EXPORT_SECTIONS.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(EXPORT_SECTIONS.map(s => s.id));
    }
  };

  const allSelected = selectedIds.length === EXPORT_SECTIONS.length;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
        <div 
          className="absolute inset-0 bg-[#0a192f]/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => !isExporting && onClose()}
        />

        <div
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-all duration-300 transform scale-100 opacity-100"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 text-red-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#0a192f]">Exportar Relatório PDF</h2>
                <p className="text-sm text-gray-500">Selecione os gráficos que deseja exportar</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isExporting}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
            
            <button
              onClick={handleToggleAll}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-200 transition-colors group"
            >
              <div className={`p-0.5 rounded flex items-center justify-center shrink-0 transition-colors ${allSelected ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`}>
                {allSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              </div>
              <span className={`font-bold transition-colors ${allSelected ? 'text-[#0a192f]' : 'text-gray-600'}`}>
                Selecionar Todos
              </span>
            </button>

            <div className="w-full h-px bg-gray-100"></div>

            <div className="space-y-2">
              {EXPORT_SECTIONS.map(section => {
                const isSelected = selectedIds.includes(section.id);
                return (
                  <button
                    key={section.id}
                    onClick={() => handleToggle(section.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className={`p-0.5 rounded flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`}>
                      {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </div>
                    <span className={`text-sm sm:text-base font-medium transition-colors ${isSelected ? 'text-[#0a192f]' : 'text-gray-600'}`}>
                      {section.label}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
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
    </>,
    document.body
  );
}
