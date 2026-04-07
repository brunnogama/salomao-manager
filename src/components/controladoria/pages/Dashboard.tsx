import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import XLSX from 'xlsx-js-style';
import { toast } from 'sonner';
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
  const [selectedPeriod, setSelectedPeriod] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);

  // Hook de Dados Profundo da Controladoria
  const {
    loading: loadingData, metrics, funil, evolucaoMensal, financeiro12Meses, statsFinanceiro,
    propostas12Meses, statsPropostas, mediasFinanceiras, mediasPropostas,
    rejectionData, contractsByPartner
  } = useDashboardData(selectedPartner, selectedLocation, selectedPeriod);



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

  const handleExportXLSX = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Planilha 1: Evolução Financeira (Últimos 12 Meses)
      const finData = financeiro12Meses.map(item => ({
        "Mês": item.mes,
        "Data Ref.": item.data.toLocaleDateString(),
        "Pró-Labore": item.pl,
        "Fixo Recorrente": item.fixo,
        "Êxito": item.exito,
        "Total Fechado": item.pl + item.fixo + item.exito
      }));
      const wsFin = XLSX.utils.json_to_sheet(finData);
      const finRange = XLSX.utils.decode_range(wsFin['!ref'] || 'A1:A1');
      for (let col = finRange.s.c; col <= finRange.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        if (wsFin[cellRef]) wsFin[cellRef].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0A192F" } }, alignment: { horizontal: "center", vertical: "center" } };
      }
      wsFin['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
      for (let R = 1; R <= finRange.e.r; ++R) {
        [2, 3, 4, 5].forEach(C => {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (wsFin[cellRef]) { wsFin[cellRef].t = 'n'; wsFin[cellRef].z = '"R$"#,##0.00;"R$"-#,##0.00'; }
        });
      }
      XLSX.utils.book_append_sheet(wb, wsFin, "Receitas Fechadas");

      // Planilha 2: Evolução de Propostas
      const propData = propostas12Meses.map(item => ({
        "Mês": item.mes,
        "Data Ref.": item.data.toLocaleDateString(),
        "Pró-Labore Estimado": item.pl,
        "Fixo Estimado": item.fixo,
        "Êxito Estimado": item.exito,
        "Total em Negociação": item.pl + item.fixo + item.exito
      }));
      const wsProp = XLSX.utils.json_to_sheet(propData);
      const propRange = XLSX.utils.decode_range(wsProp['!ref'] || 'A1:A1');
      for (let col = propRange.s.c; col <= propRange.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        if (wsProp[cellRef]) wsProp[cellRef].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0A192F" } }, alignment: { horizontal: "center", vertical: "center" } };
      }
      wsProp['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
      for (let R = 1; R <= propRange.e.r; ++R) {
        [2, 3, 4, 5].forEach(C => {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (wsProp[cellRef]) { wsProp[cellRef].t = 'n'; wsProp[cellRef].z = '"R$"#,##0.00;"R$"-#,##0.00'; }
        });
      }
      XLSX.utils.book_append_sheet(wb, wsProp, "Propostas");

      // Planilha 3: Dados Operacionais por Sócio
      const partnerData = contractsByPartner.map(item => ({
        "Sócio": item.name,
        "Casos Totais": item.total,
        "Em Análise": item.analysis,
        "Propostas": item.proposal,
        "Fechados (Ativos)": item.active,
        "Rejeitados": item.rejected,
        "Probono": item.probono,
        "Pró-Labore Fechado": item.pl,
        "Fixo Recorrente Fechado": item.fixo,
        "Êxito Fechado": item.exito,
        "Receita Total": item.pl + item.fixo + item.exito
      }));
      const wsPrt = XLSX.utils.json_to_sheet(partnerData);
      const prtRange = XLSX.utils.decode_range(wsPrt['!ref'] || 'A1:A1');
      for (let col = prtRange.s.c; col <= prtRange.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        if (wsPrt[cellRef]) wsPrt[cellRef].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0A192F" } }, alignment: { horizontal: "center", vertical: "center" } };
      }
      wsPrt['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
      for (let R = 1; R <= prtRange.e.r; ++R) {
        [7, 8, 9, 10].forEach(C => {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (wsPrt[cellRef]) { wsPrt[cellRef].t = 'n'; wsPrt[cellRef].z = '"R$"#,##0.00;"R$"-#,##0.00'; }
        });
      }
      XLSX.utils.book_append_sheet(wb, wsPrt, "Performance por Sócio");

      XLSX.writeFile(wb, `Relatorio_Controladoria_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Relatório gerado com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Ocorreu um erro ao gerar o arquivo Excel.');
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
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            onExportXLSX={handleExportXLSX}
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