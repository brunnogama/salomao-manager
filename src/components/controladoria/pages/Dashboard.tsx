import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
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
        windowWidth: 1920,
        ignoreElements: (el) => el.id === 'dashboard-filters'
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Erro ao gerar imagem.');
          return;
        }
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]).then(() => {
          toast.success('Dashboard copiado para a área de transferência!');
        }).catch(err => {
          console.error("Erro ao copiar para clipboard:", err);
          toast.error('Erro ao copiar para a área de transferência.');
        });
      }, 'image/png');

    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error('Ocorreu um erro ao exportar o dashboard.');
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
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 sm:p-6 space-y-4 sm:space-y-6">

      {/* 1. Header - Salomão Design System */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-2 sm:p-3 shadow-lg shrink-0">
            <LayoutDashboard className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Dashboard</h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">Controladoria Jurídica</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
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

      {/* 4. GRÁFICOS E FUNCIONALIDADES DA CONTROLADORIA */}
      <div ref={dashboardRef} className="space-y-6 pb-12">
        {/* Visão Geral */}
        <EfficiencyFunnel funil={funil} />
        <PortfolioFinancialOverview metrics={metrics} />
        <div className="grid grid-cols-1 gap-6">
          <WeeklySummary metrics={metrics} />
          <MonthlySummary metrics={metrics} />
        </div>

        {/* Financeiro & Evolução */}
        <EvolutionCharts
          evolucaoMensal={evolucaoMensal}
          propostas12Meses={propostas12Meses}
          financeiro12Meses={financeiro12Meses}
          mediasPropostas={mediasPropostas}
          mediasFinanceiras={mediasFinanceiras}
          statsPropostas={statsPropostas}
          statsFinanceiro={statsFinanceiro}
          funilTotalEntrada={funil.totalEntrada}
        />

        {/* Operacional & Sócios */}
        <PartnerStats contractsByPartner={contractsByPartner} />
        <OperationalStats rejectionData={rejectionData} metrics={metrics} />
      </div>

    </div>
  );
}