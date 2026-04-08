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
import { parseCurrency, safeDate } from '../utils/masks';

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'rascunho': return 'Rascunho';
    case 'active': return 'Contrato Fechado';
    case 'analysis': return 'Sob Análise';
    case 'proposal': return 'Proposta Enviada';
    case 'rejected': return 'Rejeitada';
    case 'probono': return 'Probono';
    case 'baixado': return 'Baixado';
    default: return status;
  }
};

const getPartnerDisplay = (c: any, partnersList: any[]) => {
  let text = c.partner_name || '-';
  if (!text || text === '-') {
      text = partnersList.find(p => p.id === c.partner_id)?.name || '-';
  }
  if (c.co_partner_ids && c.co_partner_ids.length > 0) {
    const coNames = c.co_partner_ids.map((id: string) => partnersList.find(p => p.id === id)?.name).filter(Boolean);
    if (coNames.length > 0) {
      text += ` + ${coNames.join(', ')}`;
    }
  }
  return text;
};

const getHonDisplay = (c: any) => {
  if (c.status === 'proposal') return c.proposal_code || '-';
  if (c.status === 'active') {
    if (!c.hon_number) return '-';
    return c.hon_number.toUpperCase().startsWith('HON') ? c.hon_number : `HON - ${c.hon_number}`;
  }
  return c.hon_number || c.proposal_code || '-';
};

const getRelevantDate = (c: any) => {
  const statusDates = [c.prospect_date, c.proposal_date, c.contract_date, c.rejection_date, c.probono_date]
    .map(d => safeDate(d))
    .filter((d): d is Date => d !== null);

  if (statusDates.length > 0) {
    return new Date(Math.min(...statusDates.map(d => d.getTime())));
  }
  return safeDate(c.created_at) || new Date();
};

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
    rejectionData, contractsByPartner, filteredContracts, partners
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

      // Planilha 1: Base de Dados (Lista Completa de Casos) idêntica à de Casos
      let sumPro = 0;
      let sumOther = 0;
      let sumFixed = 0;
      let sumFixedPontual = 0;
      let sumInter = 0;
      let sumFinal = 0;
      let sumTotalSuccess = 0;

      const baseHeader = [
        'ID', 'Status', 'Cliente', 'Sócio', 'HON/PROP', 'Data Relevante', 'Local Faturamento',
        'Timesheet',
        'Pró-Labore', 'Cláusula Pró-Labore',
        'Outros Honorários', 'Cláusula Outros',
        'Fixo Mensal', 'Cláusula Fixo Mensal',
        'Fixo Pontual', 'Cláusula Fixo Pontual',
        'Êxito Intermediário', 'Cláusula Intermediário',
        'Êxito Final', 'Cláusula Êxito Final',
        'Êxito (Total)',
        'Valores em %',
        'Posição do Cliente', 'Nº Processo', 'UF (Processo)', 'Tribunal', 'Comarca', 'Vara',
        'Autor', 'CNPJ Autor', 'Réu / Parte Adversa', 'CNPJ Réu', 'Assunto / Objeto',
        'Valor da Causa', 'Magistrados',
        'Observações'
      ];
      
      const baseRows: any[] = [];
      const baseContracts = filteredContracts || [];

      baseContracts.forEach((c: any) => {
        const percentsList: string[] = [];
        const processField = (val: string | undefined | null) => {
           if (!val) return 0;
           const str = String(val).trim();
           if (str === '0%' || str === '0' || str === '' || str === 'R$ 0,00') return 0;
           if (str.includes('%')) {
               percentsList.push(str);
               return 0; // Do not sum
           }
           return parseCurrency(str);
        };

        const vPro = processField(c.pro_labore);
        const vOther = processField(c.other_fees);
        const vFixed = processField(c.fixed_monthly_fee);
        const vFixedPontual = processField((c as any).fixed_fee) || processField((c as any).honorarios_fixos);
        const vFinal = processField(c.final_success_fee);

        const successPercentVal = (c as any).final_success_percent;
        if (successPercentVal && String(successPercentVal).trim() !== '0%') {
            if (String(successPercentVal).includes('%')) percentsList.push(String(successPercentVal));
            else percentsList.push(String(successPercentVal) + '%');
        }

        let vInter = 0;
        if (c.intermediate_fees && Array.isArray(c.intermediate_fees)) {
          c.intermediate_fees.forEach((f: string) => vInter += processField(f));
        }

        let vFinalExt = 0;
        if ((c as any).final_success_extras && Array.isArray((c as any).final_success_extras)) {
          (c as any).final_success_extras.forEach((f: string) => vFinalExt += processField(f));
        }
        
        if ((c as any).percent_extras && Array.isArray((c as any).percent_extras)) {
            (c as any).percent_extras.forEach((f: string) => {
                if (f && f !== '0%') {
                   if (f.includes('%')) percentsList.push(f);
                   else percentsList.push(f + '%');
                }
            });
        }

        const vTotalSuccess = vFinal + vInter + vFinalExt;
        const percentsStr = percentsList.length > 0 ? percentsList.join(' + ') : '-';

        sumPro += vPro;
        sumOther += vOther;
        sumFixed += vFixed;
        sumFixedPontual += vFixedPontual;
        sumInter += vInter;
        sumFinal += vFinal;
        sumTotalSuccess += vTotalSuccess;

        baseRows.push([
          c.display_id,
          getStatusLabel(c.status),
          c.client_name,
          getPartnerDisplay(c, partners || []),
          getHonDisplay(c),
          safeDate(getRelevantDate(c))?.toLocaleDateString('pt-BR') || '-',
          c.billing_location || '-',
          c.timesheet ? 'X' : '-',
          vPro,
          c.pro_labore_clause || '-',
          vOther,
          c.other_fees_clause || '-',
          vFixed,
          c.fixed_monthly_fee_clause || '-',
          vFixedPontual,
          (c as any).fixed_fee_clause || (c as any).honorarios_fixos_clause || '-',
          vInter,
          (c.intermediate_fees_clauses && c.intermediate_fees_clauses.length > 0) ? 'Ver detalhe abaixo' : '-',
          vFinal,
          c.final_success_fee_clause || '-',
          vTotalSuccess,
          percentsStr,
          c.client_position || '-',
          c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.process_number || '-').join('\n') : '-',
          c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.uf || '-').join('\n') : '-',
          c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.court || '-').join('\n') : '-',
          c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.comarca || '-').join('\n') : '-',
          c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.vara || '-').join('\n') : '-',
          c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.author || '-').join('\n') : '-',
          c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.author_cnpj || '-').join('\n') : '-',
          c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.opponent || '-').join('\n') : '-',
          c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.opponent_cnpj || '-').join('\n') : '-',
          c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.subject || '-').join('\n') : '-',
          c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.value_of_cause ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.value_of_cause) : '-').join('\n') : '-',
          c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.magistrates && Array.isArray(p.magistrates) && p.magistrates.length > 0 ? p.magistrates.map((m: any) => `${m.title || ''} ${m.name}`.trim()).join(' / ') : '-').join('\n') : '-',
          c.observations || '-'
        ]);

        const clauses: { type: string, text: string }[] = [];

        if (c.pro_labore_extras_clauses && Array.isArray(c.pro_labore_extras_clauses)) {
          c.pro_labore_extras_clauses.forEach((cl: string) => clauses.push({ type: 'Extra Pró-Labore', text: cl }));
        }
        if (c.intermediate_fees_clauses && Array.isArray(c.intermediate_fees_clauses)) {
          c.intermediate_fees_clauses.forEach((cl: string) => clauses.push({ type: 'Intermediário', text: cl }));
        }
        if (c.final_success_extras_clauses && Array.isArray(c.final_success_extras_clauses)) {
          c.final_success_extras_clauses.forEach((cl: string) => clauses.push({ type: 'Extra Êxito Final', text: cl }));
        }

        clauses.forEach(clause => {
          baseRows.push([
            c.display_id,
            '', '', '', '', '', '',
            '', // Timesheet
            '', clause.type === 'Extra Pró-Labore' ? clause.text : '',
            '', '',
            '', '',
            '', '',
            '', clause.type === 'Intermediário' ? clause.text : '',
            '', clause.type === 'Extra Êxito Final' ? clause.text : '',
            '',
            '', // %
            '', '', '', '', '', '', '', '', '', '', '', '', '',
            ''
          ]);
        });
      });

      const totalRow = [
        'TOTAIS', '', '', '', '', '', '',
        '',
        sumPro, '', sumOther, '', sumFixed, '', sumFixedPontual, '', sumInter, '', sumFinal, '', sumTotalSuccess,
        '',
        '', '', '', '', '', '', '', '', '', '', '', '', '',
        ''
      ];

      const dataWithHeader = [baseHeader, ...baseRows, [], totalRow];
      const wsBase = XLSX.utils.aoa_to_sheet(dataWithHeader);

      const currencyFormat = '"R$" #,##0.00';
      const rangeBase = XLSX.utils.decode_range(wsBase['!ref'] || 'A1:A1');
      const moneyCols = [8, 10, 12, 14, 16, 18, 20];

      for (let col = rangeBase.s.c; col <= rangeBase.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        if (wsBase[cellRef]) wsBase[cellRef].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0A192F" } }, alignment: { horizontal: "center", vertical: "center" } };
      }
      wsBase['!cols'] = baseHeader.map(h => ({ wch: Math.max(h.length + 5, 15) }));

      for (let R = rangeBase.s.r + 1; R <= rangeBase.e.r; ++R) {
        moneyCols.forEach(C => {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (wsBase[cellRef] && typeof wsBase[cellRef].v === 'number') {
            wsBase[cellRef].z = currencyFormat;
            wsBase[cellRef].t = 'n';
          }
        });
      }

      XLSX.utils.book_append_sheet(wb, wsBase, "Lista de Casos");

      // Planilha 2: Entrada de Casos
      const entradaData = evolucaoMensal.map(item => ({
        "Mês": item.mes,
        "Quantidade de Casos": item.qtd
      }));
      const wsEnt = XLSX.utils.json_to_sheet(entradaData);
      const entRange = XLSX.utils.decode_range(wsEnt['!ref'] || 'A1:A1');
      for (let col = entRange.s.c; col <= entRange.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        if (wsEnt[cellRef]) wsEnt[cellRef].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0A192F" } }, alignment: { horizontal: "center", vertical: "center" } };
      }
      wsEnt['!cols'] = [{ wch: 15 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, wsEnt, "Entrada de Casos");

      // Planilha 2: Evolução Financeira (Últimos 12 Meses)
      const finData = financeiro12Meses.map(item => ({
        "Mês": item.mes,
        "Data Ref.": item.data.toLocaleDateString(),
        "Pró-Labore": item.pl,
        "Fixo Recorrente": item.fixo,
        "Outros Honorários": item.outros,
        "Êxito": item.exito,
        "Total Fechado": item.pl + item.fixo + item.exito + item.outros
      }));
      const wsFin = XLSX.utils.json_to_sheet(finData);
      const finRange = XLSX.utils.decode_range(wsFin['!ref'] || 'A1:A1');
      for (let col = finRange.s.c; col <= finRange.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        if (wsFin[cellRef]) wsFin[cellRef].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0A192F" } }, alignment: { horizontal: "center", vertical: "center" } };
      }
      wsFin['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
      for (let R = 1; R <= finRange.e.r; ++R) {
        [2, 3, 4, 5, 6].forEach(C => {
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
        "Outros Estimados": item.outros,
        "Êxito Estimado": item.exito,
        "Total em Negociação": item.pl + item.fixo + item.exito + item.outros
      }));
      const wsProp = XLSX.utils.json_to_sheet(propData);
      const propRange = XLSX.utils.decode_range(wsProp['!ref'] || 'A1:A1');
      for (let col = propRange.s.c; col <= propRange.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        if (wsProp[cellRef]) wsProp[cellRef].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0A192F" } }, alignment: { horizontal: "center", vertical: "center" } };
      }
      wsProp['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
      for (let R = 1; R <= propRange.e.r; ++R) {
        [2, 3, 4, 5, 6].forEach(C => {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (wsProp[cellRef]) { wsProp[cellRef].t = 'n'; wsProp[cellRef].z = '"R$"#,##0.00;"R$"-#,##0.00'; }
        });
      }
      XLSX.utils.book_append_sheet(wb, wsProp, "Propostas");

      // Planilha 3: Dados Operacionais por Sócio
      const partnerData = contractsByPartner.map(item => ({
        "Sócio": item.name,
        "Timesheet": item.has_timesheet ? 'X' : '-',
        "Honorários em %": item.percentsStr,
        "Casos Totais": item.total,
        "Em Análise": item.analysis,
        "Propostas": item.proposal,
        "Fechados (Ativos)": item.active,
        "Rejeitados": item.rejected,
        "Probono": item.probono,
        "Pró-Labore Fechado": item.pl,
        "Fixo Recorrente Fechado": item.fixo,
        "Outros Honorários Fechados": item.outros,
        "Êxito Fechado": item.exito,
        "Receita Total": item.pl + item.fixo + item.exito + item.outros
      }));
      const wsPrt = XLSX.utils.json_to_sheet(partnerData);
      const prtRange = XLSX.utils.decode_range(wsPrt['!ref'] || 'A1:A1');
      for (let col = prtRange.s.c; col <= prtRange.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        if (wsPrt[cellRef]) wsPrt[cellRef].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0A192F" } }, alignment: { horizontal: "center", vertical: "center" } };
      }
      wsPrt['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
      for (let R = 1; R <= prtRange.e.r; ++R) {
        [9, 10, 11, 12, 13].forEach(C => {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (wsPrt[cellRef]) { wsPrt[cellRef].t = 'n'; wsPrt[cellRef].z = '"R$"#,##0.00;"R$"-#,##0.00'; }
        });
      }
      XLSX.utils.book_append_sheet(wb, wsPrt, "Performance por Sócio");

      // Planilha 5: Análise de Rejeições
      const rejectData = rejectionData.reasons.map(item => ({
        "Motivo da Rejeição": item.label,
        "Quantidade": item.value,
        "Percentual (%)": item.percent
      }));
      const wsRej = XLSX.utils.json_to_sheet(rejectData);
      const rejRange = XLSX.utils.decode_range(wsRej['!ref'] || 'A1:A1');
      for (let col = rejRange.s.c; col <= rejRange.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        if (wsRej[cellRef]) wsRej[cellRef].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0A192F" } }, alignment: { horizontal: "center", vertical: "center" } };
      }
      wsRej['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }];
      for (let R = 1; R <= rejRange.e.r; ++R) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: 2 });
        if (wsRej[cellRef]) { wsRej[cellRef].t = 'n'; wsRej[cellRef].z = '0.00'; }
      }
      XLSX.utils.book_append_sheet(wb, wsRej, "Motivos de Rejeição");

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

  let periodLabel = 'Histórico Geral';
  if (selectedPeriod.start || selectedPeriod.end) {
    if (selectedPeriod.start && selectedPeriod.end) {
      periodLabel = `${new Date(selectedPeriod.start + 'T12:00:00').toLocaleDateString('pt-BR')} até ${new Date(selectedPeriod.end + 'T12:00:00').toLocaleDateString('pt-BR')}`;
    } else if (selectedPeriod.start) {
      periodLabel = `A partir de ${new Date(selectedPeriod.start + 'T12:00:00').toLocaleDateString('pt-BR')}`;
    } else if (selectedPeriod.end) {
      periodLabel = `Até ${new Date(selectedPeriod.end + 'T12:00:00').toLocaleDateString('pt-BR')}`;
    }
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
          <EfficiencyFunnel funil={funil} evolucaoMensal={evolucaoMensal} periodLabel={periodLabel} />
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
            periodLabel={periodLabel}
          />
        </div>

        {/* Operacional & Sócios */}
        <div id="pdf-section-3" className="flex flex-col gap-6 bg-gray-50 pb-2">
          <PartnerStats contractsByPartner={contractsByPartner} periodLabel={periodLabel} />
          <OperationalStats rejectionData={rejectionData} metrics={metrics} periodLabel={periodLabel} />
        </div>
      </div>

    </div>
  );
}