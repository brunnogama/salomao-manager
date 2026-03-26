import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  Circle,
  User,
  Briefcase,
  GraduationCap,
  Building2,
  Clock,
  CheckSquare,
  Square
} from 'lucide-react';

interface ExportColumnSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedColumns: string[]) => void;
}

const EXPORT_COLUMN_CATEGORIES = [
  {
    name: 'Dados Pessoais e Bancários',
    icon: User,
    columns: [
      'CPF', 'RG', 'Data Nascimento', 'Gênero', 'Estado Civil', 'Possui Filhos?',
      'Quantidade de Filhos', 'Nome Emergência', 'Telefone Emergência', 'Parentesco Emergência',
      'Nome da Mãe', 'Nome do Pai', 'Nacionalidade', 'Naturalidade (Cidade)', 'Naturalidade (UF)',
      'Observações', 'CEP', 'Endereço', 'Número', 'Complemento', 'Bairro', 'Cidade', 'Estado',
      'Forma de Pagamento', 'Nome do Banco', 'Tipo de Conta', 'Agência', 'Conta', 'Tipo PIX', 'Chave PIX'
    ]
  },
  {
    name: 'Dados Profissionais e OAB',
    icon: Briefcase,
    columns: [
      'PIS/PASEP', 'Título de Eleitor', 'Matrícula e-Social', 'Dispensa Militar/Reservista',
      'CTPS', 'Série CTPS', 'UF CTPS', 'OAB Número', 'OAB UF', 'OAB Emissão', 'OAB Validade', 'Tipo Inscrição OAB'
    ]
  },
  {
    name: 'Dados de Escolaridade',
    icon: GraduationCap,
    columns: [
      'Nível Escolaridade', 'Subnível', 'Instituição', 'Curso', 'Matrícula Escolar', 'Semestre', 'Previsão Conclusão'
    ]
  },
  {
    name: 'Dados Corporativos e Transporte',
    icon: Building2,
    columns: [
      'Status', 'Rateio', 'Data Admissão', 'Motivo Contratação', 'Tipo Contrato',
      'Email Corporativo', 'Email Pessoal', 'Telefone', 'Área', 'Sócio Responsável',
      'Líder Direto', 'Equipe', 'Cargo', 'Atuação', 'Local', 'Tipo Transporte',
      'Quantidade Ida', 'Quantidade Volta', 'Total Ida', 'Total Volta', 'Custo Total Transporte'
    ]
  },
  {
    name: 'Desligamento / Histórico',
    icon: Clock,
    columns: [
      'Data Desligamento', 'Iniciativa Desligamento', 'Tipo Desligamento', 'Motivo Desligamento', 'Observações Histórico'
    ]
  }
];

export function ExportColumnSelectModal({ isOpen, onClose, onConfirm }: ExportColumnSelectModalProps) {
  const [selectedCols, setSelectedCols] = useState<Set<string>>(new Set());

  // Initialize with all columns selected when opened
  useEffect(() => {
    if (isOpen) {
      const allCols = new Set<string>();
      EXPORT_COLUMN_CATEGORIES.forEach(cat => {
        cat.columns.forEach(col => allCols.add(col));
      });
      setSelectedCols(allCols);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleColumn = (col: string) => {
    const newSelected = new Set(selectedCols);
    if (newSelected.has(col)) {
      newSelected.delete(col);
    } else {
      newSelected.add(col);
    }
    setSelectedCols(newSelected);
  };

  const toggleCategory = (categoryIndex: number) => {
    const category = EXPORT_COLUMN_CATEGORIES[categoryIndex];
    const categoryCols = category.columns;
    const allSelected = categoryCols.every(col => selectedCols.has(col));

    const newSelected = new Set(selectedCols);
    if (allSelected) {
      categoryCols.forEach(col => newSelected.delete(col));
    } else {
      categoryCols.forEach(col => newSelected.add(col));
    }
    setSelectedCols(newSelected);
  };

  const toggleAll = () => {
    let totalCols = 0;
    EXPORT_COLUMN_CATEGORIES.forEach(cat => totalCols += cat.columns.length);

    if (selectedCols.size === totalCols) {
      setSelectedCols(new Set()); // Deselect all (except mandatory ones handled later)
    } else {
      const allCols = new Set<string>();
      EXPORT_COLUMN_CATEGORIES.forEach(cat => {
        cat.columns.forEach(col => allCols.add(col));
      });
      setSelectedCols(allCols);
    }
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedCols));
  };

  let totalCols = 0;
  EXPORT_COLUMN_CATEGORIES.forEach(cat => totalCols += cat.columns.length);
  const isAllSelected = selectedCols.size === totalCols;
  const isSomeSelected = selectedCols.size > 0 && selectedCols.size < totalCols;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2A3F54]/10 flex items-center justify-center text-[#2A3F54]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[#2A3F54]">Exportar Integrantes</h2>
              <p className="text-sm text-gray-500">Selecione as colunas que deseja incluir no relatório</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <button
              onClick={toggleAll}
              className="flex items-center gap-2 text-sm font-medium text-[#2A3F54] hover:text-[#2A3F54]/80 transition-colors"
            >
              {isAllSelected ? (
                <CheckSquare className="w-5 h-5" />
              ) : isSomeSelected ? (
                <div className="w-5 h-5 border-[2px] border-[#2A3F54] rounded-md flex items-center justify-center bg-[#2A3F54]">
                  <div className="w-2.5 h-[2px] bg-white rounded-full" />
                </div>
              ) : (
                <Square className="w-5 h-5" />
              )}
              {isAllSelected ? 'Desmarcar Todas' : 'Selecionar Todas'}
            </button>
            <div className="text-sm text-gray-500">
              <span className="font-medium text-[#2A3F54]">{selectedCols.size + 2}</span> colunas selecionadas
            </div>
          </div>

          <div className="space-y-6">
            {/* Mandatory Section */}
            <div className="bg-white rounded-xl border border-emerald-100 overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-emerald-50/50 flex items-center gap-2 border-b border-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-medium text-emerald-900 text-sm">Informações Obrigatórias</h3>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/30 cursor-not-allowed">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-sm font-medium text-emerald-900">ID (COL - XXX)</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/30 cursor-not-allowed">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-sm font-medium text-emerald-900">Nome Completo</span>
                </div>
              </div>
            </div>

            {/* Optional Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {EXPORT_COLUMN_CATEGORIES.map((category, idx) => {
                const Icon = category.icon;
                const categoryCols = category.columns;
                const allSelected = categoryCols.every(col => selectedCols.has(col));
                const someSelected = categoryCols.some(col => selectedCols.has(col)) && !allSelected;

                return (
                  <div key={category.name} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div 
                      className="px-4 py-3 bg-gray-50 flex items-center justify-between border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => toggleCategory(idx)}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-500 group-hover:text-[#2A3F54] transition-colors" />
                        <h3 className="font-medium text-gray-700 group-hover:text-[#2A3F54] transition-colors text-sm">{category.name}</h3>
                      </div>
                      <button className="text-gray-400 group-hover:text-[#2A3F54] transition-colors">
                        {allSelected ? <CheckSquare className="w-5 h-5" /> : someSelected ? (
                          <div className="w-5 h-5 border-[2px] border-[#2A3F54] rounded-md flex items-center justify-center bg-[#2A3F54]">
                            <div className="w-2.5 h-[2px] bg-white rounded-full" />
                          </div>
                        ) : <Square className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto custom-scrollbar">
                      {category.columns.map(col => {
                        const isSelected = selectedCols.has(col);
                        return (
                          <div 
                            key={col}
                            onClick={() => toggleColumn(col)}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-[#2A3F54]/5 text-[#2A3F54] font-medium hover:bg-[#2A3F54]/10' 
                                : 'hover:bg-gray-50 text-gray-600'
                            }`}
                          >
                            {isSelected ? (
                              <CheckCircle2 className="w-4 h-4 text-[#2A3F54] shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                            )}
                            <span className="text-sm truncate" title={col}>{col}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2.5 text-sm font-medium text-white bg-[#2A3F54] rounded-xl hover:bg-[#1a2835] transition-colors flex items-center gap-2 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Gerar Relatório Excel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
