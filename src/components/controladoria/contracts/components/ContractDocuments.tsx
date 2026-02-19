import { FileText, Upload, Download, Trash2 } from 'lucide-react';
import { ContractDocument } from '../../../../types/controladoria';

// ROTA CORRIGIDA: Sobe 2 níveis para sair de /components/contracts e entrar em /utils
import { maskHon } from '../../utils/masks';

interface ContractDocumentsProps {
  documents: ContractDocument[];
  tempFiles?: { file: File, type: string }[];
  uploading: boolean;
  status: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, type: string) => void;
  onDownload: (path: string) => void;
  onDelete: (id: string, path: string) => void;
  onRemoveTemp?: (index: number) => void;
}

export function ContractDocuments({
  documents,
  tempFiles = [],
  uploading,
  status,
  onUpload,
  onDownload,
  onDelete,
  onRemoveTemp
}: ContractDocumentsProps) {
  const hasFiles = documents.length > 0 || tempFiles.length > 0;

  return (
    <div className="mb-8 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center">
          <FileText className="w-4 h-4 mr-2" />
          Arquivos & Documentos
        </h3>

        <label className="cursor-pointer bg-white border border-dashed border-salomao-blue text-salomao-blue px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-50 transition-colors flex items-center">
          {uploading ? (
            'Enviando...'
          ) : (
            <>
              <Upload className="w-3 h-3 mr-2" /> Anexar PDF
            </>
          )}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => onUpload(e, status === 'active' ? 'contract' : 'proposal')}
          />
        </label>
      </div>

      {hasFiles ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Arquivos Já Salvos */}
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 group">
              <div className="flex items-center overflow-hidden">
                <div className="bg-red-100 p-2 rounded text-red-600 mr-3">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 break-all" title={doc.file_name}>
                    {doc.file_name}
                  </p>
                  <div className="flex items-center text-[10px] text-gray-400 mt-0.5">
                    <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                    {doc.hon_number_ref && (
                      <span className="ml-2 bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">
                        HON: {maskHon(doc.hon_number_ref)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onDownload(doc.file_path)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(doc.id, doc.file_path)} className="p-1.5 text-red-600 hover:bg-red-100 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Arquivos Temporários (Novos) */}
          {tempFiles.map((item, idx) => (
            <div key={`temp-${idx}`} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100 group">
              <div className="flex items-center overflow-hidden">
                <div className="bg-blue-100 p-2 rounded text-blue-600 mr-3">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-blue-700 break-all" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <div className="flex items-center text-[10px] text-blue-400 mt-0.5">
                    <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">Agendado p/ Upload</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onRemoveTemp?.(idx)} className="p-1.5 text-red-600 hover:bg-red-100 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-lg text-xs text-gray-400 font-medium">
          Nenhum arquivo anexado.
        </div>
      )}
    </div>
  );
}