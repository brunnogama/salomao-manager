import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Download, 
  Printer, 
  Loader2, 
  Shield,
  Plane,
  UserCircle,
  LogOut,
  Grid
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { supabase } from '../../../lib/supabase';
import { ProposalDocument } from '../proposals/ProposalDocument';

interface ProposalsProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function Proposals({ 
  userName = 'Usuário', 
  onModuleHome, 
  onLogout 
}: ProposalsProps) {
  // --- ROLE STATE ---
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
            .from('user_profiles')
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
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6">
      
      {/* 1. Header - Salomão Design System */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-3 shadow-lg">
            <FileText className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Propostas</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Mala Direta & Minutas</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Online</span>
              {userRole && (
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                  • {userRole === 'admin' ? 'Administrador' : userRole === 'editor' ? 'Editor' : 'Visualizador'}
                </span>
              )}
            </div>
          </div>
          <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-[#1e3a8a]">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && (
            <button onClick={onModuleHome} className="p-2 text-gray-400 hover:text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-colors">
              <Grid className="h-5 w-5" />
            </button>
          )}
          {onLogout && (
            <button onClick={onLogout} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo da página */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Formulário */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1 bg-[#1e3a8a]"></div>
          
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#1e3a8a]" /> Dados da Proposta
          </h2>

          <div className="space-y-5">
            
            {/* Campo para Texto Padrão (Template) */}
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Modelo / Texto Padrão</label>
              <textarea 
                name="template"
                value={formData.template}
                onChange={handleChange}
                disabled={isViewer}
                rows={5}
                placeholder={isViewer ? "Visualização restrita" : "Insira aqui o texto base da sua minuta jurídica..."}
                className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:border-[#1e3a8a] outline-none resize-none bg-gray-50/50 transition-all disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Cliente Final</label>
              <input 
                type="text" 
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                disabled={isViewer}
                placeholder="Razão Social ou Nome Completo"
                className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:border-[#1e3a8a] outline-none bg-gray-50/50 transition-all disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Sócios / Representantes</label>
              <input 
                type="text" 
                name="partners"
                value={formData.partners}
                onChange={handleChange}
                disabled={isViewer}
                placeholder="Representantes legais para a mala direta"
                className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:border-[#1e3a8a] outline-none bg-gray-50/50 transition-all disabled:opacity-60"
              />
            </div>
            
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Objeto da Prestação de Serviço</label>
              <textarea 
                name="object"
                value={formData.object}
                onChange={handleChange}
                disabled={isViewer}
                rows={3}
                placeholder="Descreva detalhadamente o serviço jurídico..."
                className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:border-[#1e3a8a] outline-none resize-none bg-gray-50/50 transition-all disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Honorários Sugeridos</label>
                <input 
                  type="text" 
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  disabled={isViewer}
                  placeholder="R$ 0,00"
                  className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-bold text-[#0a192f] focus:border-[#1e3a8a] outline-none bg-gray-50/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Data de Emissão</label>
                <input 
                  type="text" 
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  disabled={isViewer}
                  className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-600 outline-none bg-gray-50/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
            {isViewer ? (
                <div className="bg-gray-100 text-gray-400 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center border border-gray-200">
                    <Shield className="w-4 h-4 mr-2" /> Acesso de Visualização
                </div>
            ) : formData.clientName && formData.object ? (
              <PDFDownloadLink
                document={<ProposalDocument data={formData} />}
                fileName={`Proposta_${formData.clientName.replace(/\s+/g, '_')}.pdf`}
                className="bg-[#1e3a8a] hover:bg-[#112240] text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md flex items-center transition-all active:scale-95 no-underline"
              >
                {({ loading }) => (
                  <div className="flex items-center">
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />} 
                    Gerar PDF
                  </div>
                )}
              </PDFDownloadLink>
            ) : (
              <button disabled className="bg-gray-100 text-gray-400 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center border border-gray-200 opacity-60">
                <Printer className="w-4 h-4 mr-2" /> Aguardando Dados
              </button>
            )}
          </div>
        </div>

        {/* Preview Visual */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden h-[750px]">
           <div className="absolute top-0 left-0 w-full h-1 bg-[#0a192f] opacity-20"></div>
           
           <div className="w-full max-w-[420px] bg-white shadow-2xl p-10 text-left border border-gray-100 h-full overflow-hidden relative transform scale-[0.9] origin-center">
              {/* Header Simulado do Escritório */}
              <div className="flex justify-between items-start mb-10 border-b border-gray-100 pb-4">
                <p className="font-black text-[#0a192f] text-sm uppercase tracking-tighter">SALOMÃO<span className="text-[#1e3a8a]">ADVOGADOS</span></p>
                <div className="text-[8px] font-bold text-gray-400 text-right uppercase tracking-widest">Controladoria<br/>Jurídica</div>
              </div>

              <h3 className="text-center font-black text-[#0a192f] text-xs mb-8 uppercase tracking-[0.2em] border-y border-gray-50 py-2">Proposta de Honorários</h3>
              
              <div className="space-y-4 text-[10px] leading-relaxed">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[8px]">Data de Emissão</span>
                  <span className="text-[#0a192f] font-bold">{formData.date}</span>
                </div>
                
                <div className="space-y-1">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[8px]">Destinatário</span>
                  <p className="text-[#0a192f] font-black text-sm uppercase tracking-tight">{formData.clientName || 'NOME DO CLIENTE'}</p>
                </div>
                
                <div className="space-y-1">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[8px]">A/C Sócios</span>
                  <p className="text-gray-700 font-semibold">{formData.partners || 'Representantes...'}</p>
                </div>
                
                <div className="mt-8 space-y-1 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[8px]">Objeto</span>
                  <p className="text-gray-600 font-medium line-clamp-4 italic">"{formData.object || 'Descrição dos serviços prestados...'}"</p>
                </div>
                
                <div className="mt-6 flex justify-between items-end border-t border-gray-100 pt-6">
                  <div>
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[8px]">Total de Honorários</span>
                    <p className="text-lg font-black text-emerald-600">{formData.value || 'R$ 0,00'}</p>
                  </div>
                  <div className="text-right">
                    <div className="w-24 h-px bg-gray-200 mb-2"></div>
                    <span className="text-[7px] font-black text-gray-300 uppercase tracking-widest">Assinatura Digital</span>
                  </div>
                </div>

                {formData.template && (
                  <div className="mt-6 opacity-30">
                    <span className="text-[7px] font-black text-gray-300 uppercase tracking-widest block mb-2">Trecho da Minuta:</span>
                    <p className="text-[8px] text-gray-400 line-clamp-3">{formData.template}</p>
                  </div>
                )}
              </div>
           </div>
           <p className="mt-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Visualização em Tempo Real</p>
        </div>
      </div>
    </div>
  );
}