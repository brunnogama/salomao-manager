import React from 'react';
import { FileText, AlertCircle, Upload, Download, Trash2 } from 'lucide-react';
import { ContractDocument } from '../types'; // Caminho corrigido
import { maskHon } from '../utils/masks'; // Caminho corrigido

interface ContractDocumentsProps {
  documents: ContractDocument[];
  isEditing: boolean;
  uploading: boolean;
  status: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, type: string) => void;
  onDownload: (path: string) => void;
  onDelete: (id: string, path: string) => void;
}

export function ContractDocuments({ 
  documents, 
  isEditing, 
  uploading, 
  status, 
  onUpload, 
  onDownload, 
  onDelete 
}: ContractDocumentsProps) {
  return (
    <div className="mb-8 mt-6">
      <div className="flex items-center justify-between mb-4">
        <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center">
          <FileText className="w-4 h-4 mr-2 text-[#0a192f]" />
          Arquivos & Documentos
        </label>
        {!isEditing ? (
          <span className="text-[10px] font-bold text-amber-600 uppercase flex items-center bg-amber-50 px-2 py-1 rounded border border-amber-100">
            <AlertCircle className="w-3 h-3 mr-1" /> Salve o caso para anexar arquivos
          </span>
        ) : (
          <label className="cursor-pointer bg-white border border-dashed border-[#0a192f] text-[#0a192f] px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-50 transition-colors flex items-center shadow-sm">
            {uploading ? (
              <span className="animate-pulse">Enviando...</span>
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
        )}
      </div>
      
      {documents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 group hover:border-[#0a192f]/30 hover:shadow-md transition-all">
              <div className="flex items-center overflow-hidden">
                <div className="bg-red-50 p-2 rounded-lg text-red-600 mr-3 border border-red-100">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-gray-800 truncate" title={doc.file_name}>
                    {doc.file_name}
                  </p>
                  <div className="flex items-center text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-tighter">
                    <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                    {doc.hon_number_ref && (
                      <span className="ml-2 bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100">
                        HON: {maskHon(doc.hon_number_ref)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onDownload(doc.file_path)} 
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Baixar"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onDelete(doc.id, doc.file_path)} 
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        isEditing && (
          <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50/30">
            Nenhum arquivo anexado.
          </div>
        )
      )}
    </div>
  );
}