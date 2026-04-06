import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, X, Loader2, FileText, Server, AlertTriangle, Download, Copy } from 'lucide-react';
import { toast } from 'sonner';

export type NFStatus = 'idle' | 'preparing' | 'transmitting' | 'processing' | 'success' | 'error';

interface EmissaoNFStatusModalProps {
  isOpen: boolean;
  status: NFStatus;
  errorDetails?: { message: string; traceback?: string } | null;
  successData?: { xml?: string; pdfUrl?: string; chaveAcesso?: string } | null;
  onClose: () => void;
}

export function EmissaoNFStatusModal({ isOpen, status, errorDetails, successData, onClose }: EmissaoNFStatusModalProps) {
  if (!isOpen) return null;

  const getStepStatus = (step: 'preparing' | 'transmitting' | 'processing') => {
    const order = ['idle', 'preparing', 'transmitting', 'processing', 'success'];
    
    if (status === 'error') {
      // If error occurred, all current items should just stay pending/idle
      return 'idle'; 
    }
    
    const currentIndex = order.indexOf(status);
    const stepIndex = order.indexOf(step);

    if (status === 'success') return 'completed';
    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'current';
    return 'pending';
  };

  const renderIcon = (stepStatus: string, CurrentIcon: any) => {
    if (stepStatus === 'completed') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (stepStatus === 'current') return <Loader2 className="w-5 h-5 text-[#1e3a8a] animate-spin" />;
    return <CurrentIcon className="w-5 h-5 text-gray-300" />;
  };

  return createPortal(
    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#0a192f] p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-wide">Status da Emissão</h3>
              <p className="text-[11px] text-blue-100 font-medium opacity-90">Acompanhamento em tempo real</p>
            </div>
          </div>
          {(status === 'success' || status === 'error') && (
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'error' ? (
            <div className="flex flex-col items-center text-center animate-in fade-in pb-2">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h4 className="text-lg font-black text-gray-900 mb-1">Falha na Emissão</h4>
              <p className="text-sm font-semibold text-gray-500 mb-4 px-4">
                {errorDetails?.message || 'Ocorreu um erro inesperado ao conectar com a prefeitura.'}
              </p>
              
              {errorDetails?.traceback && (
                <div className="w-full text-left bg-gray-50 rounded-xl border border-gray-200 p-3 mb-4 max-h-32 overflow-y-auto custom-scrollbar relative">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black tracking-widest text-gray-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" /> DETALHES TÉCNICOS
                    </span>
                    <button
                      onClick={() => {
                        const text = `ERRO:\n${errorDetails.message}\n\nTRACEBACK:\n${errorDetails.traceback}`;
                        navigator.clipboard.writeText(text);
                        toast.success('Erro técnico copiado com sucesso!');
                      }}
                      className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-[#1e3a8a] transition-colors"
                      title="Copiar log de erro"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <pre className="text-[10px] text-red-800 font-mono whitespace-pre-wrap leading-tight mt-1">
                    {errorDetails.traceback}
                  </pre>
                </div>
              )}

              <button 
                onClick={onClose}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-all"
              >
                Fechar e Tentar Novamente
              </button>
            </div>
          ) : status === 'success' ? (
            <div className="flex flex-col items-center text-center animate-in fade-in pb-2">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h4 className="text-lg font-black text-gray-900 mb-1">Nota Emitida com Sucesso!</h4>
              <p className="text-sm font-semibold text-gray-500 mb-6">
                O documento foi protocolado e registrado no sistema.
              </p>

              {successData?.chaveAcesso && (
                <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-center mb-4">
                  <p className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-1">Chave de Acesso (DNA)</p>
                  <p className="text-[12px] font-mono font-bold text-gray-800 break-all">{successData.chaveAcesso}</p>
                </div>
              )}

              {successData?.pdfUrl && (
                <a
                  href={successData.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 mb-2 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[12px] uppercase tracking-widest rounded-xl hover:bg-emerald-100 transition-all shadow-sm"
                >
                  <FileText className="w-4 h-4" /> Acessar DANFSE Nacional
                </a>
              )}

              {successData?.xml && (
                <button
                  onClick={() => {
                    const blob = new Blob([successData.xml!], { type: 'text/xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `DPS_assinado_${new Date().getTime()}.xml`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 mb-3 bg-blue-50 text-[#1e3a8a] border border-blue-200 font-bold text-[12px] uppercase tracking-widest rounded-xl hover:bg-blue-100 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" /> Baixar XML da DPS
                </button>
              )}

              <button 
                onClick={onClose}
                className="w-full py-2.5 bg-[#1e3a8a] hover:bg-[#112240] text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                Concluir
              </button>
            </div>
          ) : (
            <div className="space-y-6 relative py-4">
              
              {/* Line behind steps */}
              <div className="absolute left-4 top-10 bottom-10 w-0.5 bg-gray-100 z-0"></div>

              {/* Step 1 */}
              <div className="flex items-center gap-4 relative z-10 bg-white">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white
                  ${getStepStatus('preparing') === 'current' ? 'border-[#1e3a8a] shadow-sm' : 
                    getStepStatus('preparing') === 'completed' ? 'border-emerald-500' : 'border-gray-200'}
                `}>
                  {renderIcon(getStepStatus('preparing'), FileText)}
                </div>
                <div className="flex flex-col">
                  <span className={`text-sm font-bold ${getStepStatus('preparing') === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>
                    Preparando Lote RPS
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400">
                    Gerando XML e calculando dados da nota
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-4 relative z-10 bg-white pt-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white
                  ${getStepStatus('transmitting') === 'current' ? 'border-[#1e3a8a] shadow-sm' : 
                    getStepStatus('transmitting') === 'completed' ? 'border-emerald-500' : 'border-gray-200'}
                `}>
                  {renderIcon(getStepStatus('transmitting'), Server)}
                </div>
                <div className="flex flex-col">
                  <span className={`text-sm font-bold ${getStepStatus('transmitting') === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>
                    Transmitindo ao WebService
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400">
                    Enviando assinatura digital e comunicação
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-4 relative z-10 bg-white pt-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white
                  ${getStepStatus('processing') === 'current' ? 'border-[#1e3a8a] shadow-sm' : 
                    getStepStatus('processing') === 'completed' ? 'border-emerald-500' : 'border-gray-200'}
                `}>
                  {renderIcon(getStepStatus('processing'), Loader2)}
                </div>
                <div className="flex flex-col">
                  <span className={`text-sm font-bold ${getStepStatus('processing') === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>
                    Processando Retorno
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400">
                    Aguardando recibo de protocolo da prefeitura
                  </span>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
