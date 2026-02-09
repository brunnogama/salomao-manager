import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase'; // Caminho centralizado
import { useDashboardData } from '../hooks/useDashboardData'; // Caminho para hooks da controladoria

// --- COMPONENTES MODULARES (Caminhos ajustados para subpasta dashboard) ---
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { EfficiencyFunnel } from '../dashboard/EfficiencyFunnel';
import { PortfolioFinancialOverview } from '../dashboard/PortfolioFinancialOverview';
import { WeeklySummary } from '../dashboard/WeeklySummary';
import { MonthlySummary } from '../dashboard/MonthlySummary';
import { EvolutionCharts } from '../dashboard/EvolutionCharts';
import { PartnerStats } from '../dashboard/PartnerStats';
import { OperationalStats } from '../dashboard/OperationalStats';

export function Dashboard() {
  // --- ESTADOS DE FILTROS ---
  const [selectedPartner, setSelectedPartner] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  
  const [partnersList, setPartnersList] = useState<{id: string, name: string}[]>([]);
  const [locationsList, setLocationsList] = useState<string[]>([]);

  // Hook de Dados dinâmico
  const {
    loading, metrics, funil, evolucaoMensal, financeiro12Meses, statsFinanceiro,
    propostas12Meses, statsPropostas, mediasFinanceiras, mediasPropostas,
    rejectionData, contractsByPartner
  } = useDashboardData(selectedPartner, selectedLocation);

  const [exporting, setExporting] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // --- CARREGAMENTO DE OPÇÕES DOS FILTROS ---
  useEffect(() => {
    const fetchFilterOptions = async () => {
        const { data: partners } = await supabase.from('partners').select('id, name').eq('active', true).order('name');
        if (partners) setPartnersList(partners);

        const { data: contracts } = await supabase.from('contracts').select('billing_location');
        if (contracts) {
            const uniqueLocations = Array.from(new Set(contracts.map(c => c.billing_location).filter(Boolean)));
            setLocationsList(uniqueLocations.sort());
        }
    };
    fetchFilterOptions();
  }, []);

  // --- VERIFICAÇÃO DE PERMISSÕES ---
  useEffect(() => {
    const checkUserRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (profile) setUserRole(profile.role as 'admin' | 'editor' | 'viewer');
        }
    };
    checkUserRole();
  }, []);

  // --- ENGINE DE EXPORTAÇÃO (PNG/PDF) ---
  const handleExportAndEmail = async () => {
    if (!dashboardRef.current) return;
    setExporting(true);
    try {
        const canvas = await html2canvas(dashboardRef.current, {
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#F8FAFC',
            ignoreElements: (element) => element.id === 'export-button-container' || element.id === 'dashboard-filters'
        });

        const imgData = canvas.toDataURL('image/png');
        const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

        // Download PNG
        const linkPng = document.createElement('a');
        linkPng.href = imgData;
        linkPng.download = `Relatorio_BI_Salomao_${dateStr}.png`;
        linkPng.click();

        // Download PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Relatorio_BI_Salomao_${dateStr}.pdf`);

        // Disparo de E-mail
        const subject = encodeURIComponent(`Dashboard Controladoria - Panorama ${dateStr}`);
        const body = encodeURIComponent(`Prezados,\n\nSegue em anexo o Panorama Estratégico de Contratos (BI) atualizado em ${new Date().toLocaleDateString()}.\n\nAtenciosamente,\nControladoria - Salomão Advogados.`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;

    } catch (error) {
        console.error("Erro ao exportar:", error);
        alert("Houve um erro ao gerar o relatório.");
    } finally {
        setExporting(false);
    }
  };

  // State: Carregamento inicial ou base vazia
  if (loading || !metrics || metrics.geral.totalCasos === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-full gap-6 bg-white rounded-[2rem] border border-gray-100 p-20 shadow-inner">
        <Loader2 className="w-12 h-12 text-[#0a192f] animate-spin" />
        <div className="text-center">
          <p className="text-[11px] font-black text-[#0a192f] uppercase tracking-[0.3em]">Business Intelligence</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2">Sincronizando base de dados estratégica...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full min-h-screen overflow-x-hidden bg-[#f8fafc]'>
      <div className='max-w-[1920px] mx-auto px-4 sm:px-8 py-8 space-y-10 pb-20'>
        
        {/* Header de BI com Filtros Globais */}
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

        {/* Dashboard Ref Container - Capturado para exportação */}
        <div ref={dashboardRef} className="w-full space-y-10 bg-transparent rounded-[2.5rem]">
          
          {/* 1. Funil de Conversão */}
          <div className="w-full">
            <EfficiencyFunnel funil={funil} />
          </div>

          {/* 2. Overview de Carteira & Valuation */}
          <div className="w-full">
            <PortfolioFinancialOverview metrics={metrics} />
          </div>

          {/* 3. Performance Periódica (Semanal + Mensal) */}
          <div className="grid grid-cols-1 gap-10">
            <WeeklySummary metrics={metrics} />
            <MonthlySummary metrics={metrics} />
          </div>

          {/* 4. Evolução Temporal de Casos e Receita */}
          <div className="w-full space-y-10">
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

          {/* 5. KPIs por Unidade de Negócio (Sócios) */}
          <div className="w-full">
            <PartnerStats contractsByPartner={contractsByPartner} />
          </div>

          {/* 6. Indicadores Operacionais */}
          <div className="w-full pb-10">
            <OperationalStats 
              rejectionData={rejectionData} 
              metrics={metrics} 
            />
          </div>
          
        </div>
      </div>
    </div>
  );
}