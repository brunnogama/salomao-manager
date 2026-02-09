import React, { useState, useEffect } from 'react';
import { FileText, Plus, Download, Printer, Loader2, Shield } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { supabase } from '../../../lib/supabase'; // Rota corrigida para o Manager central
import { ProposalDocument } from '../proposals/ProposalDocument'; // Rota ajustada para pasta irmã

interface ProposalsProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function Proposals ({ userName, onModuleHome, onLogout }: ProposalsProps) {
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);

  const [formData, setFormData] = useState({
    clientName: '',
    partners: '', // Novo campo: Sócios
    object: '',
    value: '',
    date: new Date().toLocaleDateString('pt-BR'),
    template: '' // Novo campo: Texto Padrão para mala direta
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
    <div className="p-8 animate-in fade-in duration-500 bg-gray-50/50 min-h-screen">
      
      {/* Cabeçalho Padronizado Manager */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-sm font-black text-[#0a192f] uppercase tracking-[0.3em] flex items-center gap-3">
            <FileText className="w-6 h-6 text-amber-500" /> Propostas & Minutas
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gerador automatizado de propostas e minutas (Mala Direta).</p>
            {/* Badge de Perfil */}
            {userRole && (
                <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase border flex items-center gap-1.5 ${
                    userRole === 'admin' 
                        ? 'bg-purple-50 text-purple-700 border-purple-100' 
                        : userRole === 'editor' 
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : 'bg-gray-50 text-gray-500 border-gray-100'
                }`}>
                    <Shield className="w-3 h-3" />
                    {userRole === 'admin' ? 'Administrador' : userRole === 'editor' ? 'Editor' : 'Visualizador'}
                </span>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo da página */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário Estilo Manager */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 h-fit">
          <h2 className="text-[10px] font-black text-[#0a192f] uppercase tracking-[0.2em] mb-6 border-b border-gray-50 pb-4">Parâmetros da Proposta</h2>
          <div className="space-y-6">
            
            {/* Campo para Texto Padrão (Template) */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Modelo / Texto Padrão da Minuta</label>
              <textarea 
                name="template"
                value={formData.template}
                onChange={handleChange}
                disabled={isViewer}
                rows={6}
                placeholder={isViewer ? "CONTEÚDO RESTRITO PARA LEITURA" : "COLE AQUI O TEXTO PADRÃO DA SUA MINUTA PARA PROCESSAMENTO..."}
                className="w-full border border-gray-200 rounded-xl p-4 text-[13px] font-medium text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all bg-gray-50/50 placeholder:text-gray-300 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Cliente / Razão Social</label>
              <input 
                type="text" 
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                disabled={isViewer}
                placeholder="NOME COMPLETO DO DESTINATÁRIO"
                className="w-full border border-gray-200 rounded-xl p-4 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all bg-white disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Campo: Sócios */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Sócios / Representantes Legais</label>
              <input 
                type="text" 
                name="partners"
                value={formData.partners}
                onChange={handleChange}
                disabled={isViewer}
                placeholder="NOMES PARA A/C DA PROPOSTA"
                className="w-full border border-gray-200 rounded-xl p-4 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all bg-white disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Objeto da Prestação de Serviço</label>
              <textarea 
                name="object"
                value={formData.object}
                onChange={handleChange}
                disabled={isViewer}
                rows={4}
                placeholder="DESCREVA DETALHADAMENTE O ESCOPO JURÍDICO..."
                className="w-full border border-gray-200 rounded-xl p-4 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all bg-white resize-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Honorários Estimados</label>
                <input 
                  type="text" 
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  disabled={isViewer}
                  placeholder="R$ 0,00"
                  className="w-full border border-gray-200 rounded-xl p-4 text-sm font-black text-emerald-600 focus:border-[#0a192f] outline-none shadow-sm transition-all bg-white disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Data de Emissão</label>
                <input 
                  type="text" 
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  disabled={isViewer}
                  className="w-full border border-gray-200 rounded-xl p-4 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all bg-gray-50/50 disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-50 flex justify-end">
            {isViewer ? (
                <button disabled className="bg-gray-100 text-gray-400 px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center cursor-not-allowed border border-gray-200">
                    <Shield className="w-4 h-4 mr-3" /> Acesso Restrito
                </button>
            ) : formData.clientName && formData.object ? (
              <PDFDownloadLink
                document={<ProposalDocument data={formData} />}
                fileName={`Proposta_${formData.clientName.replace(/\s+/g, '_')}.pdf`}
                className="bg-[#0a192f] hover:bg-slate-800 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[#0a192f]/20 flex items-center transition-all active:scale-95 no-underline"
              >
                {({ loading }) => (
                  <div className="flex items-center">
                      {loading ? <Loader2 className="w-4 h-4 mr-3 animate-spin" /> : <Download className="w-4 h-4 mr-3 text-amber-500" />} 
                      Gerar Documento PDF
                  </div>
                )}
              </PDFDownloadLink>
            ) : (
              <button disabled className="bg-gray-50 text-gray-300 px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center cursor-not-allowed border border-gray-100">
                <Printer className="w-4 h-4 mr-3" /> Preencha para Habilitar
              </button>
            )}
          </div>
        </div>

        {/* Preview Visual Padronizado Manager */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 flex flex-col items-center justify-center text-center h-[750px] shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gray-50/50 pointer-events-none" />
            
            <div className="w-full max-w-sm bg-white shadow-2xl p-10 text-left text-[9px] text-gray-400 origin-top h-full overflow-hidden relative z-10 border border-gray-100">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0a192f]"></div>
              
              {/* Logo / Header Simulado */}
              <div className="flex justify-between items-start mb-8">
                <p className="font-black text-[#0a192f] text-xs tracking-tighter uppercase">Salomão Advogados</p>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
              </div>

              <p className="text-center font-black text-[#0a192f] text-[10px] uppercase tracking-[0.3em] my-8 border-y border-gray-50 py-2">Proposta de Honorários</p>
              
              <div className="space-y-4">
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="font-black uppercase tracking-tighter">Data de Emissão:</span>
                  <span className="text-[#0a192f] font-bold">{formData.date}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-gray-50 pb-1">
                  <span className="font-black uppercase tracking-tighter">Destinatário:</span>
                  <span className="text-[#0a192f] font-black text-[11px] uppercase tracking-tight">{formData.clientName || 'NOME DO CLIENTE'}</span>
                </div>
                
                <div className="flex flex-col gap-1 border-b border-gray-50 pb-1">
                  <span className="font-black uppercase tracking-tighter">A/C Sócios:</span>
                  <span className="text-[#0a192f] font-bold italic">{formData.partners || 'Representantes...'}</span>
                </div>
                
                <div className="mt-8">
                  <span className="font-black uppercase tracking-widest text-[8px] text-amber-600 block mb-2">Objeto Jurídico:</span>
                  <p className="text-[#0a192f] font-medium leading-relaxed bg-gray-50/50 p-3 rounded-lg border border-gray-100 line-clamp-4">{formData.object || 'Descrição detalhada do escopo...'}</p>
                </div>
                
                <div className="mt-6 p-4 bg-[#0a192f] rounded-xl">
                  <span className="font-black uppercase tracking-widest text-[7px] text-gray-400 block mb-1">Honorários Propostos:</span>
                  <p className="text-amber-500 font-black text-sm tracking-tight">{formData.value || 'R$ 0,00'}</p>
                </div>

                {formData.template && (
                  <div className="mt-6 pt-4 border-t border-dashed border-gray-200">
                    <p className="font-black uppercase text-[7px] text-gray-300 tracking-[0.2em] mb-2">Excerto da Minuta Anexa:</p>
                    <p className="text-gray-400 italic line-clamp-4 leading-normal">{formData.template}</p>
                  </div>
                )}
              </div>
            </div>
            <p className="mt-6 text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] relative z-10">Digital Preview Component</p>
        </div>
      </div>
    </div>
  );
}