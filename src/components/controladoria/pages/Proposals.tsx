import React, { useState, useEffect } from 'react';
import { FileText, Plus, Download, Printer, Loader2, Shield } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { supabase } from '../../../lib/supabase'; // Rota corrigida para o Manager central
import { ProposalDocument } from '../proposals/ProposalDocument'; // Rota ajustada para a estrutura modular

interface ProposalsProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

// CORREÇÃO: Nome da função exportada definido como Proposals para alinhar com o App.tsx
export function Proposals({ userName, onModuleHome, onLogout }: ProposalsProps) {
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);

  const [formData, setFormData] = useState({
    clientName: '',
    partners: '', 
    object: '',
    value: '',
    date: new Date().toLocaleDateString('pt-BR'),
    template: '' 
  });

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    checkUserRole();
  }, []);

  // --- ROLE CHECK ---
  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        if (profile) {
            setUserRole(profile.role as 'admin' | 'editor' | 'viewer');
        }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isViewer = userRole === 'viewer';

  return (
    <div className="p-8 animate-in fade-in duration-500 bg-[#f8fafc] min-h-screen">
      
      {/* Cabeçalho Padronizado Manager */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-sm font-black text-[#0a192f] uppercase tracking-[0.4em] flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-[#0a192f] text-white shadow-lg">
                <FileText className="w-6 h-6 text-amber-500" />
            </div>
            Propostas & Minutas
          </h1>
          <div className="flex items-center gap-3 mt-4 ml-[60px]">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Motor de automação documental para contratos e propostas comerciais.</p>
            {userRole && (
                <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase border flex items-center gap-1.5 ${
                    userRole === 'admin' 
                        ? 'bg-purple-50 text-purple-700 border-purple-100' 
                        : 'bg-blue-50 text-blue-700 border-blue-100'
                }`}>
                    <Shield className="w-3 h-3" />
                    {userRole === 'admin' ? 'Administrador' : userRole === 'editor' ? 'Editor' : 'Visualizador'}
                </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Formulário Estilo Manager */}
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 h-fit">
          <h2 className="text-[11px] font-black text-[#0a192f] uppercase tracking-[0.3em] mb-8 border-b border-gray-50 pb-6">Configuração da Minuta</h2>
          <div className="space-y-8">
            
            {/* Campo para Texto Padrão (Template) */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Cópia da Cláusula / Texto Padrão</label>
              <textarea 
                name="template"
                value={formData.template}
                onChange={handleChange}
                disabled={isViewer}
                rows={5}
                placeholder={isViewer ? "CONTEÚDO RESTRITO" : "INSIRA O TEXTO BASE DA MINUTA PARA PROCESSAMENTO..."}
                className="w-full border border-gray-100 rounded-2xl p-5 text-[12px] font-medium text-[#0a192f] focus:border-amber-500 outline-none shadow-inner transition-all bg-gray-50/50 placeholder:text-gray-300 resize-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Destinatário Principal</label>
              <input 
                type="text" 
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                disabled={isViewer}
                placeholder="RAZÃO SOCIAL OU NOME COMPLETO"
                className="w-full border-b-2 border-gray-100 py-3 text-sm font-black text-[#0a192f] focus:border-[#0a192f] outline-none transition-all bg-transparent placeholder:text-gray-200 uppercase tracking-tighter"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Representantes (A/C)</label>
              <input 
                type="text" 
                name="partners"
                value={formData.partners}
                onChange={handleChange}
                disabled={isViewer}
                placeholder="SÓCIOS E GESTORES"
                className="w-full border-b-2 border-gray-100 py-3 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none transition-all bg-transparent placeholder:text-gray-200 uppercase"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Escopo da Prestação</label>
              <textarea 
                name="object"
                value={formData.object}
                onChange={handleChange}
                disabled={isViewer}
                rows={3}
                placeholder="DETALHAMENTO DO OBJETO JURÍDICO..."
                className="w-full border border-gray-100 rounded-2xl p-5 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all bg-white resize-none disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Valuation Estimado</label>
                <input 
                  type="text" 
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  disabled={isViewer}
                  placeholder="R$ 0,00"
                  className="w-full bg-transparent border-none p-0 text-md font-black text-emerald-600 focus:ring-0 outline-none"
                />
              </div>
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Data do Documento</label>
                <input 
                  type="text" 
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  disabled={isViewer}
                  className="w-full bg-transparent border-none p-0 text-md font-black text-[#0a192f] focus:ring-0 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-50 flex justify-end">
            {isViewer ? (
                <button disabled className="bg-gray-100 text-gray-400 px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center border border-gray-200 shadow-inner">
                    <Shield className="w-4 h-4 mr-3" /> Modo Somente Leitura
                </button>
            ) : formData.clientName && formData.object ? (
              <PDFDownloadLink
                document={<ProposalDocument data={formData} />}
                fileName={`PROPOSTA_SALOMAO_${formData.clientName.replace(/\s+/g, '_').toUpperCase()}.pdf`}
                className="bg-[#0a192f] hover:bg-slate-800 text-white px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-[#0a192f]/30 flex items-center transition-all active:scale-95 no-underline border border-white/10"
              >
                {({ loading }) => (
                  <div className="flex items-center">
                      {loading ? <Loader2 className="w-4 h-4 mr-3 animate-spin" /> : <Download className="w-4 h-4 mr-3 text-amber-500" />} 
                      Compilar e Baixar PDF
                  </div>
                )}
              </PDFDownloadLink>
            ) : (
              <button disabled className="bg-gray-50 text-gray-300 px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center cursor-not-allowed border border-gray-100">
                <Printer className="w-4 h-4 mr-3" /> Validar Campos para PDF
              </button>
            )}
          </div>
        </div>

        {/* Preview Visual Manager */}
        <div className="bg-[#0a192f] p-12 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center text-center h-[800px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] -mt-20 -mr-20" />
            
            <div className="w-full max-w-sm bg-white shadow-[0_50px_100px_rgba(0,0,0,0.4)] p-12 text-left text-[9px] text-gray-400 h-full overflow-hidden relative z-10 border border-gray-100">
              <div className="absolute top-0 left-0 right-0 h-2 bg-amber-500"></div>
              
              <div className="flex justify-between items-start mb-10">
                <p className="font-black text-[#0a192f] text-[11px] tracking-tighter uppercase">Salomão Advogados</p>
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                  <FileText className="w-5 h-5 text-amber-600" />
                </div>
              </div>

              <p className="text-center font-black text-[#0a192f] text-[10px] uppercase tracking-[0.4em] my-10 border-y-2 border-gray-50 py-3">Proposta Estratégica</p>
              
              <div className="space-y-6">
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="font-black uppercase tracking-tighter text-[7px] text-gray-300">Emissão:</span>
                  <span className="text-[#0a192f] font-black">{formData.date}</span>
                </div>
                <div className="flex flex-col gap-2 border-b border-gray-50 pb-2">
                  <span className="font-black uppercase tracking-tighter text-[7px] text-gray-300">Cliente:</span>
                  <span className="text-[#0a192f] font-black text-[12px] uppercase tracking-tighter leading-none">{formData.clientName || 'NOME DO DESTINATÁRIO'}</span>
                </div>
                
                <div className="flex flex-col gap-2 border-b border-gray-50 pb-2">
                  <span className="font-black uppercase tracking-tighter text-[7px] text-gray-300">Atenção:</span>
                  <span className="text-[#0a192f] font-bold italic text-[9px]">{formData.partners || 'Representantes...'}</span>
                </div>
                
                <div className="mt-10">
                  <span className="font-black uppercase tracking-widest text-[8px] text-amber-600 block mb-3">Objeto do Contrato:</span>
                  <p className="text-[#0a192f] font-medium leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 line-clamp-5 shadow-inner italic">{formData.object || 'Descrição do escopo jurídico...'}</p>
                </div>
                
                <div className="mt-8 p-5 bg-[#0a192f] rounded-2xl shadow-xl">
                  <span className="font-black uppercase tracking-widest text-[7px] text-white/30 block mb-1">Totalização de Honorários:</span>
                  <p className="text-amber-500 font-black text-lg tracking-tighter">{formData.value || 'R$ 0,00'}</p>
                </div>
              </div>
            </div>
            <p className="mt-8 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] relative z-10">Live Document Processor</p>
        </div>
      </div>
    </div>
  );
}