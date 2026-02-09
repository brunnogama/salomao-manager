import React from 'react';
import { FileText, AlertCircle, Upload, Download, Trash2 } from 'lucide-react';
import { ContractDocument } from '../types'; // Caminho corrigido
import { maskHon } from '../../utils/masks'; // Caminho corrigido para subir dois níveis

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
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
          <FileText className="w-4 h-4 mr-2 text-[#0a192f]" />
          Acervo de Documentos & PDFs
        </label>
        {!isEditing ? (
          <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest flex items-center bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
            <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Salve o registro para habilitar anexos
          </span>
        ) : (
          <label className="cursor-pointer bg-[#0a192f] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center shadow-lg shadow-[#0a192f]/20 active:scale-95">
            {uploading ? (
              <span className="animate-pulse">Sincronizando...</span>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 mr-2 text-amber-500" /> Anexar PDF
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 bg-white rounded-[1.5rem] border border-gray-100 group hover:border-amber-200 hover:shadow-xl transition-all">
              <div className="flex items-center overflow-hidden">
                <div className="bg-red-50 p-3 rounded-2xl text-red-500 mr-4 border border-red-100 shadow-inner">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-[#0a192f] uppercase tracking-tight truncate" title={doc.file_name}>
                    {doc.file_name}
                  </p>
                  <div className="flex items-center text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                    <span className="bg-gray-50 px-1.5 py-0.5 rounded">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                    {doc.hon_number_ref && (
                      <span className="ml-2 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100 font-black">
                        HON: {maskHon(doc.hon_number_ref)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                <button 
                  onClick={() => onDownload(doc.file_path)} 
                  className="p-2 text-blue-500 hover:bg-white hover:shadow-md rounded-xl transition-all"
                  title="Baixar Arquivo"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onDelete(doc.id, doc.file_path)} 
                  className="p-2 text-red-500 hover:bg-white hover:shadow-md rounded-xl transition-all"
                  title="Remover permanentemente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        isEditing && (
          <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/30">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Custódia de arquivos vazia</p>
          </div>
        )
      )}
    </div>
  );
}