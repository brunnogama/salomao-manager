import { useState, useEffect } from 'react';
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
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-2.5 sm:p-3 shadow-lg shrink-0">
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
            hideTitle={true}
            className="!p-0 !border-0 !shadow-none !bg-transparent"
          />
        </div>
      </div>

      {/* 4. GRÁFICOS E FUNCIONALIDADES DA CONTROLADORIA */}
      <div id="dashboard-content-to-capture" className="space-y-6 pb-12">
        {/* Visão Geral */}
        <div id="pdf-section-1" className="flex flex-col gap-6 bg-gray-50 pb-2">
          <EfficiencyFunnel funil={funil} evolucaoMensal={evolucaoMensal} />
          <PortfolioFinancialOverview metrics={metrics} />
          <div className="grid grid-cols-1 gap-6">
            <WeeklySummary metrics={metrics} />
            <MonthlySummary metrics={metrics} />
          </div>
        </div>

        {/* Financeiro & Evolução */}
        <div id="pdf-section-2" className="flex flex-col gap-6 bg-gray-50 pb-2">
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
        </div>

        {/* Operacional & Sócios */}
        <div id="pdf-section-3" className="flex flex-col gap-6 bg-gray-50 pb-2">
          <PartnerStats contractsByPartner={contractsByPartner} />
          <OperationalStats rejectionData={rejectionData} metrics={metrics} />
        </div>
      </div>

    </div>
  );
}