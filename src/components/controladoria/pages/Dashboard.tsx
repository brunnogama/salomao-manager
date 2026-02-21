import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '../../../lib/supabase';
import {
  Loader2,
  LayoutDashboard
} from 'lucide-react';

// --- NOVOS IMPORTS DE DADOS E COMPONENTES ---
import { useDashboardData } from '../hooks/useDashboardData';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { EfficiencyFunnel } from '../dashboard/EfficiencyFunnel';
import { PortfolioFinancialOverview } from '../dashboard/PortfolioFinancialOverview';
import { WeeklySummary } from '../dashboard/WeeklySummary';
import { MonthlySummary } from '../dashboard/MonthlySummary';
import { EvolutionCharts } from '../dashboard/EvolutionCharts';
import { PartnerStats } from '../dashboard/PartnerStats';
import { OperationalStats } from '../dashboard/OperationalStats';

interface Props {
  userName: string;
  onModuleHome: () => void;
  onLogout: () => void;
}

export function Dashboard({ }: Props) {
  // --- NOVOS ESTADOS PARA FUNCIONALIDADES DA CONTROLADORIA ---
  const [selectedPartner, setSelectedPartner] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [partnersList, setPartnersList] = useState<{ id: string, name: string }[]>([]);
  const [locationsList, setLocationsList] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);
  const [exporting, setExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Hook de Dados Profundo da Controladoria
  const {
    loading: loadingData, metrics, funil, evolucaoMensal, financeiro12Meses, statsFinanceiro,
    propostas12Meses, statsPropostas, mediasFinanceiras, mediasPropostas,
    rejectionData, contractsByPartner
  } = useDashboardData(selectedPartner, selectedLocation);

  const [activeTab, setActiveTab] = useState<'geral' | 'financeiro' | 'operacional'>('geral');

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Busca de opções para os novos filtros
  const fetchFilterOptions = async () => {
    // Ajustado: Filtrando parceiros por status 'active' em vez do campo booleano antigo
    const { data: partners } = await supabase.from('partners').select('id, name').eq('status', 'active').order('name');
    if (partners) setPartnersList(partners);

    const { data: contracts } = await supabase.from('contracts').select('billing_location');
    if (contracts) {
      const unique = Array.from(new Set(contracts.map(c => (c as any).billing_location).filter(Boolean)));
      setLocationsList(unique.sort() as string[]);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).maybeSingle();
      if (profile) setUserRole(profile.role as any);
    }
  };

  // Função de Exportação da Controladoria
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

      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Relatorio_Controladoria_${dateStr}.png`;
      link.click();

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Relatorio_Controladoria_${dateStr}.pdf`);

      window.location.href = `mailto:?subject=Panorama%20Controladoria&body=Segue%20anexo.`;
    } catch (error) {
      console.error("Erro ao exportar:", error);
    } finally {
      setExporting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 gap-4">
        <Loader2 className="w-10 h-10 text-[#1e3a8a] animate-spin" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6">

      {/* 1. Header - Salomão Design System */}
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
          {/* Integração dos Filtros no Header */}
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
            hideTitle={true}
            className="!p-0 !border-0 !shadow-none !bg-transparent"
          />
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('geral')}
          className={`px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-colors border-b-2 ${activeTab === 'geral'
              ? 'border-blue-800 text-blue-900 bg-blue-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('financeiro')}
          className={`px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-colors border-b-2 ${activeTab === 'financeiro'
              ? 'border-blue-800 text-blue-900 bg-blue-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
        >
          Financeiro & Evolução
        </button>
        <button
          onClick={() => setActiveTab('operacional')}
          className={`px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-colors border-b-2 ${activeTab === 'operacional'
              ? 'border-blue-800 text-blue-900 bg-blue-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
        >
          Operacional & Sócios
        </button>
      </div>


      {/* 4. NOVOS GRÁFICOS E FUNCIONALIDADES DA CONTROLADORIA (Integrados abaixo do conteúdo original) */}
      <div ref={dashboardRef} className="space-y-6">

        {activeTab === 'geral' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <EfficiencyFunnel funil={funil} />
            <PortfolioFinancialOverview metrics={metrics} />
            <div className="grid grid-cols-1 gap-6">
              <WeeklySummary metrics={metrics} />
              <MonthlySummary metrics={metrics} />
            </div>
          </div>
        )}

        {activeTab === 'financeiro' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <EvolutionCharts
              evolucaoMensal={evolucaoMensal}
              propostas12Meses={propostas12Meses}
              financeiro12Meses={financeiro12Meses}
              mediasPropostas={mediasPropostas}
              mediasFinanceiras={mediasFinanceiras}
              statsPropostas={statsPropostas}
              statsFinanceiro={statsFinanceiro}
            />
          </div>
        )}

        {activeTab === 'operacional' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PartnerStats contractsByPartner={contractsByPartner} />
            <OperationalStats rejectionData={rejectionData} metrics={metrics} />
          </div>
        )}

      </div>

    </div>
  );
}