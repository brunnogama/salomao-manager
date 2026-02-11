import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '../../../lib/supabase';
import { 
  Loader2, 
  TrendingUp, 
  FileText, 
  DollarSign, 
  Users, 
  Plane, 
  UserCircle, 
  LogOut, 
  Grid,
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

export function Dashboard({ userName, onModuleHome, onLogout }: Props) {
  // --- ESTADOS ORIGINAIS MANTIDOS ---
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    totalContracts: 0,
    activeContracts: 0,
    totalClients: 0,
    totalRevenue: 0
  });

  // --- NOVOS ESTADOS PARA FUNCIONALIDADES DA CONTROLADORIA ---
  const [selectedPartner, setSelectedPartner] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [partnersList, setPartnersList] = useState<{id: string, name: string}[]>([]);
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
    fetchStats();
    fetchFilterOptions();
  }, []);

  // Lógica de busca original mantida
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const { data: contracts } = await supabase.from('contracts').select('*');
      const { data: clients } = await supabase.from('clients').select('id');
      const totalContracts = contracts?.length || 0;
      const activeContracts = contracts?.filter(c => c.status === 'active').length || 0;
      const totalClients = clients?.length || 0;
      const totalRevenue = contracts
        ?.filter(c => c.status === 'active')
        .reduce((acc, c) => acc + (parseFloat(c.pro_labore) || 0), 0) || 0;

      setStats({ totalContracts, activeContracts, totalClients, totalRevenue });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoadingStats(false);
    }
  };

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
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
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

  if (loadingStats || loadingData) {
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
          />

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

      {/* 2. Cards de Estatísticas - Salomão Design System */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Casos */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-blue-600"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total de Casos</p>
            <p className="text-2xl font-black text-blue-900 mt-1">{stats.totalContracts}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        {/* Contratos Ativos */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-emerald-600"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contratos Ativos</p>
            <p className="text-2xl font-black text-emerald-900 mt-1">{stats.activeContracts}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl">
            <TrendingUp className="h-6 w-6 text-emerald-600" />
          </div>
        </div>

        {/* Total de Clientes */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-indigo-600"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total de Clientes</p>
            <p className="text-2xl font-black text-indigo-900 mt-1">{stats.totalClients}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Users className="h-6 w-6 text-indigo-600" />
          </div>
        </div>

        {/* Receita Total */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-amber-600"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Receita (Pró-Labore)</p>
            <p className="text-2xl font-black text-amber-900 mt-1">
              {stats.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl">
            <DollarSign className="h-6 w-6 text-amber-600" />
          </div>
        </div>
      </div>

      {/* 3. Mensagem de Boas-vindas */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-1 bg-[#1e3a8a]"></div>
        <h2 className="text-2xl font-black text-[#0a192f] mb-2 uppercase tracking-tight">
          Bem-vindo ao Sistema, {userName}!
        </h2>
        <p className="text-sm font-semibold text-gray-500 max-w-2xl">
          Sua visão geral da Controladoria Jurídica está atualizada. Utilize o menu lateral para gerenciar clientes, contratos e fluxos de trabalho.
        </p>
      </div>

      {/* 4. NOVOS GRÁFICOS E FUNCIONALIDADES DA CONTROLADORIA (Integrados abaixo do conteúdo original) */}
      <div ref={dashboardRef} className="space-y-6">
        <EfficiencyFunnel funil={funil} />
        <PortfolioFinancialOverview metrics={metrics} />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <WeeklySummary metrics={metrics} />
          <MonthlySummary metrics={metrics} />
        </div>
        <EvolutionCharts 
          evolucaoMensal={evolucaoMensal}
          propostas12Meses={propostas12Meses}
          financeiro12Meses={financeiro12Meses}
          mediasPropostas={mediasPropostas}
          mediasFinanceiras={mediasFinanceiras}
          statsPropostas={statsPropostas}
          statsFinanceiro={statsFinanceiro}
        />
        <PartnerStats contractsByPartner={contractsByPartner} />
        <OperationalStats rejectionData={rejectionData} metrics={metrics} />
      </div>

    </div>
  );
}