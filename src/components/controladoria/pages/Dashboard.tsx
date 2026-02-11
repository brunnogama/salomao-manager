import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  Loader2, 
  UserCircle, 
  LogOut, 
  Grid,
  LayoutDashboard
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useDashboardData } from '../hooks/useDashboardData';

// --- COMPONENTES MODULARES DA CONTROLADORIA ---
// O caminho correto agora aponta para ../dashboard/ (dentro de controladoria)
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { EfficiencyFunnel } from '../dashboard/EfficiencyFunnel';
import { PortfolioFinancialOverview } from '../dashboard/PortfolioFinancialOverview';
import { WeeklySummary } from '../dashboard/WeeklySummary';
import { MonthlySummary } from '../dashboard/MonthlySummary';
import { EvolutionCharts } from '../dashboard/EvolutionCharts';
import { PartnerStats } from '../dashboard/PartnerStats';
import { OperationalStats } from '../dashboard/OperationalStats

interface Props {
  userName: string;
  onModuleHome: () => void;
  onLogout: () => void;
}

export function Dashboard({ userName, onModuleHome, onLogout }: Props) {
  // --- ESTADOS DE FILTROS E PERMISSÕES ---
  const [selectedPartner, setSelectedPartner] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [partnersList, setPartnersList] = useState<{id: string, name: string}[]>([]);
  const [locationsList, setLocationsList] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);
  const [exporting, setExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Hook de Dados da Controladoria
  const {
    loading, metrics, funil, evolucaoMensal, financeiro12Meses, statsFinanceiro,
    propostas12Meses, statsPropostas, mediasFinanceiras, mediasPropostas,
    rejectionData, contractsByPartner
  } = useDashboardData(selectedPartner, selectedLocation);

  // --- CARREGAMENTO DE OPÇÕES E ROLE ---
  useEffect(() => {
    const fetchOptions = async () => {
      const { data: partners } = await supabase.from('partners').select('id, name').eq('active', true).order('name');
      if (partners) setPartnersList(partners);

      const { data: contracts } = await supabase.from('contracts').select('billing_location');
      if (contracts) {
        const unique = Array.from(new Set(contracts.map(c => c.billing_location).filter(Boolean)));
        setLocationsList(unique.sort() as string[]);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile) setUserRole(profile.role as any);
      }
    };
    fetchOptions();
  }, []);

  // --- FUNÇÃO EXPORTAR (MANTIDA DA CONTROLADORIA) ---
  const handleExportAndEmail = async () => {
    if (!dashboardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#F8FAFC',
        ignoreElements: (el) => el.id === 'dashboard-filters'
      });

      const imgData = canvas.toDataURL('image/png');
      const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

      // Download PNG
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Relatorio_Controladoria_${dateStr}.png`;
      link.click();

      // Download PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Relatorio_Controladoria_${dateStr}.pdf`);

      // Email
      const subject = encodeURIComponent(`Panorama Controladoria - ${dateStr}`);
      const body = encodeURIComponent(`Caros,\n\nSegue em anexo o panorama atualizado.\n\nAtenciosamente,\n${userName} - Controladoria.`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    } catch (error) {
      console.error("Erro ao exportar:", error);
    } finally {
      setExporting(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 gap-4">
        <Loader2 className="w-10 h-10 text-[#1e3a8a] animate-spin" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carregando controladoria...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6">
      
      {/* 1. Header - Design Manager */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-3 shadow-lg">
            <LayoutDashboard className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Dashboard</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Controladoria Jurídica</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtros Integrados no Header */}
          <DashboardHeader 
            userRole={userRole}
            selectedPartner={selectedPartner}
            setSelectedPartner={setSelectedPartner}
            partnersList={partnersList}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            locationsList={locationsList}
            exporting={exporting}
            onExport={handleExportAndEmail}
            hideTitle={true} // Prop sugerida para não duplicar o título se o componente suportar
          />
          
          <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>

          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Online</span>
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

      {/* 2. Conteúdo do Dashboard (Ref para Exportação) */}
      <div ref={dashboardRef} className="space-y-6">
        
        {/* Funil de Eficiência */}
        <EfficiencyFunnel funil={funil} />

        {/* Snapshots da Carteira */}
        <PortfolioFinancialOverview metrics={metrics} />

        {/* Resumos Semanal e Mensal */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <WeeklySummary metrics={metrics} />
          <MonthlySummary metrics={metrics} />
        </div>

        {/* Gráficos de Evolução */}
        <EvolutionCharts 
          evolucaoMensal={evolucaoMensal}
          propostas12Meses={propostas12Meses}
          financeiro12Meses={financeiro12Meses}
          mediasPropostas={mediasPropostas}
          mediasFinanceiras={mediasFinanceiras}
          statsPropostas={statsPropostas}
          statsFinanceiro={statsFinanceiro}
        />

        {/* Estatísticas por Sócio */}
        <PartnerStats contractsByPartner={contractsByPartner} />

        {/* Operacional */}
        <OperationalStats 
          rejectionData={rejectionData} 
          metrics={metrics} 
        />

      </div>
    </div>
  );
}