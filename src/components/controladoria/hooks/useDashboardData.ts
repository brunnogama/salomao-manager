// brunnogama/salomao-manager/salomao-manager-3e743876de4fb5af74c8aedf5b89ce1e3913c795/src/components/controladoria/hooks/useDashboardData.ts

import { useState, useEffect, useMemo } from 'react';
import { contractService } from '../services/contractService';
import { partnerService } from '../services/partnerService';
import { supabase } from '../../../lib/supabase';
import { Contract, Partner, ContractCase } from '../../../types/controladoria';
import { safeDate } from '../utils/masks';

// --- Funções Auxiliares de Parsing e Data ---

// Garante que o valor monetário (string 'R$ 1.000,00' ou number) seja convertido corretamente para float
const safeParseMoney = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;

  const strVal = String(value).trim();

  // NOVO: Impedir que valores em % sejam contados nas agregações monetárias (ex: 10% não virar R$ 10)
  if (strVal.includes('%')) return 0;

  // Se já for um número em string simples (ex: "1000.50"), retorna direto
  if (!strVal.includes('R$') && !strVal.includes(',') && !isNaN(Number(strVal))) {
    return parseFloat(strVal);
  }

  // Remove tudo que não for dígito, vírgula ou sinal de menos
  // Ex: "R$ 1.500,00" -> "1500,00"
  const cleanStr = strVal.replace(/[^\d,-]/g, '').replace(',', '.');

  const floatVal = parseFloat(cleanStr);
  return isNaN(floatVal) ? 0 : floatVal;
};

// Helpers de Data
const isValidDate = (d: any): boolean => {
  return d instanceof Date && !isNaN(d.getTime());
};

const isDateInCurrentWeek = (dateString?: string, refDate: Date = new Date()) => {
  const d = safeDate(dateString);
  if (!d) return false;
  const t = refDate;
  const cd = t.getDay();
  const s = new Date(t);
  s.setDate(t.getDate() - cd);
  s.setHours(0, 0, 0, 0);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return d >= s && d <= e;
};

const isDateInPreviousWeek = (dateString?: string, refDate: Date = new Date()) => {
  const d = safeDate(dateString);
  if (!d) return false;
  const t = refDate;
  const cd = t.getDay();
  const sc = new Date(t);
  sc.setDate(t.getDate() - cd);
  sc.setHours(0, 0, 0, 0);
  const sp = new Date(sc);
  sp.setDate(sc.getDate() - 7);
  const ep = new Date(sp);
  ep.setDate(sp.getDate() + 6);
  ep.setHours(23, 59, 59, 999);
  return d >= sp && d <= ep;
};

const isDateInCurrentMonth = (dateString?: string, refDate: Date = new Date()) => {
  const d = safeDate(dateString);
  if (!d) return false;
  const t = refDate;
  return d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
};

// Nova lógica MTD (Month to Date)
const isDateInLastMonthMTD = (dateString?: string, refDate: Date = new Date()) => {
  const d = safeDate(dateString);
  if (!d) return false;
  const today = refDate;

  // Define o mês anterior
  let lastMonth = today.getMonth() - 1;
  let lastYear = today.getFullYear();
  if (lastMonth < 0) { lastMonth = 11; lastYear--; }

  // Verifica se é do mês/ano anterior
  const isSameMonth = d.getMonth() === lastMonth && d.getFullYear() === lastYear;

  // Verifica se o dia é menor ou igual ao dia de hoje (Lógica MTD)
  // Ex: Se hoje é dia 15, considera apenas datas até dia 15 do mês anterior
  const isWithinDayLimit = d.getDate() <= today.getDate();

  return isSameMonth && isWithinDayLimit;
};

// Formata data curta (ex: 01/jan)
const formatDateShort = (d: Date) => {
  if (!isValidDate(d)) return '-';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
};

// ATUALIZAÇÃO: Hook aceita filtros opcionais
export function useDashboardData(selectedPartner?: string, selectedLocation?: string, selectedPeriod?: { start: string; end: string }) {
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [contratosData, sociosData, colabResp] = await Promise.all([
        contractService.getAll(),
        partnerService.getAll(),
        supabase.from('collaborators').select('name, foto_url')
      ]);

      setContracts(contratosData);
      setPartners(sociosData);
      if (colabResp.data) {
        setCollaborators(colabResp.data);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const unsubscribe = contractService.subscribe(() => { fetchDashboardData(); });
    return () => { unsubscribe(); };
  }, []);

  const dashboardData = useMemo(() => {
    let hoje = new Date();
    if (selectedPeriod && selectedPeriod.end) {
      const parsedEnd = safeDate(selectedPeriod.end);
      if (parsedEnd) {
        parsedEnd.setHours(23, 59, 59, 999);
        if (parsedEnd < hoje) {
          hoje = parsedEnd;
        }
      }
    }

    // Data de início para gráficos de 12 meses (forçando UTC local para não perder os primeiros casos do mês)
    let dataInicioFixo = new Date('2025-06-01T00:00:00');
    if (selectedPeriod && selectedPeriod.start) {
      const parsedStart = safeDate(selectedPeriod.start);
      if (parsedStart) {
        dataInicioFixo = new Date(parsedStart);
        dataInicioFixo.setDate(1);
        dataInicioFixo.setHours(0, 0, 0, 0);
      }
    }

    // --- FILTRAGEM DOS DADOS (BASEADA NA ENTRADA/PROSPECT) ---
    const getRelevantDate = (c: Contract) => {
      const statusDates = [c.prospect_date, c.proposal_date, c.contract_date, c.rejection_date, c.probono_date]
        .map(d => safeDate(d))
        .filter((d): d is Date => d !== null);

      if (statusDates.length > 0) {
        return new Date(Math.min(...statusDates.map(d => d.getTime())));
      }
      return safeDate(c.created_at) || new Date();
    };

    const filteredContracts = contracts.filter(c => {
      const matchesPartner = selectedPartner ? c.partner_id === selectedPartner : true;
      const matchesLocation = selectedLocation ? c.billing_location === selectedLocation : true;
      
      let matchesPeriod = true;
      if (selectedPeriod && (selectedPeriod.start || selectedPeriod.end)) {
        const relevantDateStr = getRelevantDate(c);
        if (relevantDateStr) {
          const relevantDate = safeDate(relevantDateStr);
          if (relevantDate) {
            relevantDate.setHours(0, 0, 0, 0);

            if (selectedPeriod.start) {
              const start = safeDate(selectedPeriod.start);
              if (start) {
                start.setHours(0, 0, 0, 0);
                if (relevantDate < start) matchesPeriod = false;
              }
            }

            if (selectedPeriod.end) {
              const end = safeDate(selectedPeriod.end);
              if (end) {
                end.setHours(23, 59, 59, 999);
                if (relevantDate > end) matchesPeriod = false;
              }
            }
          } else {
            matchesPeriod = false;
          }
        } else {
          matchesPeriod = false;
        }
      }

      return matchesPartner && matchesLocation && matchesPeriod;
    });
    // ---------------------------

    // --- GERAÇÃO DOS LABELS DE PERÍODO ---
    const primeiroDiaMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const periodoAtualStr = `${formatDateShort(primeiroDiaMesAtual)} - ${formatDateShort(hoje)}`;

    let lastMonth = hoje.getMonth() - 1;
    let lastYear = hoje.getFullYear();
    if (lastMonth < 0) { lastMonth = 11; lastYear--; }

    const primeiroDiaMesAnterior = new Date(lastYear, lastMonth, 1);
    const diaLimiteMesAnterior = new Date(lastYear, lastMonth, hoje.getDate());

    // Ajuste para não estourar o mês (ex: hoje é 31, e mês passado só tem 28)
    const maxDaysInLastMonth = new Date(lastYear, lastMonth + 1, 0).getDate();
    if (diaLimiteMesAnterior.getDate() > maxDaysInLastMonth) {
      diaLimiteMesAnterior.setDate(maxDaysInLastMonth);
    }

    const periodoAnteriorStr = `${formatDateShort(primeiroDiaMesAnterior)} - ${formatDateShort(diaLimiteMesAnterior)}`;
    // -------------------------------------

    // --- EXPANSÃO DINÂMICA DO EIXO X (GARANTIR QUE TODOS OS CASOS FILTRADOS APAREÇAM) ---
    let minChartDate = new Date(dataInicioFixo);
    filteredContracts.forEach(c => {
       const statusDates = [c.prospect_date, c.proposal_date, c.contract_date, c.rejection_date, c.probono_date]
         .map(d => safeDate(d)).filter((d): d is Date => d !== null);
       const dReal = statusDates.length > 0 ? new Date(Math.min(...statusDates.map(d => d.getTime()))) : safeDate(c.created_at);
       if (dReal && dReal < minChartDate) minChartDate = dReal;
       
       const dContrato = safeDate(c.contract_date);
       if (c.status === 'active' && dContrato && dContrato < minChartDate) minChartDate = dContrato;
       
       const dProposta = safeDate(c.proposal_date);
       if (dProposta && dProposta < minChartDate) minChartDate = dProposta;
    });

    dataInicioFixo = new Date(minChartDate);
    dataInicioFixo.setDate(1);
    dataInicioFixo.setHours(0, 0, 0, 0);
    // -------------------------------------

    const normalizeName = (name: string) => {
      if (!name) return '';
      return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .trim();
    };

    const partnerMap = partners.reduce((acc: any, s: Partner) => {
      const normalizedPartnerName = normalizeName(s.name);

      // Attempt 1: Exact match on normalized names
      let colab = collaborators.find((c: any) => normalizeName(c.name) === normalizedPartnerName);

      // Attempt 2: Partial match (e.g. "Rodrigo Figueiredo" in "Rodrigo Figueiredo da Silva Cotta")
      if (!colab) {
        const partnerParts = normalizedPartnerName.split(' ').filter(p => p.length > 2);
        colab = collaborators.find((c: any) => {
          const colabNormalized = normalizeName(c.name);
          if (!colabNormalized) return false;
          // Check if at least first and last name matches, or if it's a very close substring
          return partnerParts.length >= 2 && colabNormalized.includes(partnerParts[0]) && colabNormalized.includes(partnerParts[partnerParts.length - 1]);
        });
      }

      acc[s.id] = {
        name: s.name,
        photo_url: s.photo_url || s.foto_url || colab?.photo_url || colab?.foto_url
      }; // Atualizado com fallback seguro
      return acc;
    }, {});

    // Inicialização das Métricas
    let mSemana = { novos: 0, propQtd: 0, propPL: 0, propExito: 0, propMensal: 0, fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0, rejeitados: 0, probono: 0, totalUnico: 0 };
    let mSemanaAnterior = { propPL: 0, propExito: 0, propMensal: 0, fechPL: 0, fechExito: 0, fechMensal: 0 };
    let mMes = { novos: 0, propQtd: 0, propPL: 0, propExito: 0, propMensal: 0, fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0, totalUnico: 0, analysis: 0, rejected: 0, probono: 0 };

    // Adicionados os labels de período no objeto executivo
    let mExecutivo = {
      mesAtual: { novos: 0, propQtd: 0, propPL: 0, propExito: 0, propMensal: 0, fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0 },
      mesAnterior: { novos: 0, propQtd: 0, propPL: 0, propExito: 0, propMensal: 0, fechQtd: 0, fechPL: 0, fechExito: 0, fechMensal: 0 },
      periodoAtualLabel: periodoAtualStr,
      periodoAnteriorLabel: periodoAnteriorStr
    };

    // Estrutura atualizada com todos os campos necessários para a view detalhada
    let mGeral = {
      totalCasos: 0, emAnalise: 0, propostasAtivas: 0, fechados: 0, rejeitados: 0, probono: 0,

      // Propostas
      valorEmNegociacaoPL: 0,
      valorEmNegociacaoExito: 0,
      valorEmNegociacaoMensal: 0, // Novo
      valorEmNegociacaoOutros: 0, // Novo (Outros + Fixo Pontual)

      // Fechados
      receitaRecorrenteAtiva: 0, // Fixo Mensal
      totalFechadoPL: 0,
      totalFechadoExito: 0,
      totalFechadoOutros: 0, // Novo (Outros + Fixo Pontual)
      totalFechadoFixo: 0, // Legado

      assinados: 0, naoAssinados: 0,
      mediaMensalNegociacaoPL: 0, mediaMensalNegociacaoExito: 0,
      mediaMensalCarteiraPL: 0, mediaMensalCarteiraExito: 0
    };

    let fTotal = 0; let fQualificados = 0; let fFechados = 0;
    let fValorEntrada = 0; let fValorPropostas = 0; let fValorFechados = 0;
    let fPerdaAnalise = 0; let fPerdaNegociacao = 0;
    let somaDiasProspectProposta = 0; let qtdProspectProposta = 0;
    let somaDiasPropostaFechamento = 0; let qtdPropostaFechamento = 0;
    let somaDiasProspectRejeicao = 0; let qtdProspectRejeicao = 0;

    const mapaMeses: Record<string, number> = {};
    const financeiroMap: Record<string, { pl: number, fixo: number, exito: number, data: Date }> = {};
    const propostasMap: Record<string, { pl: number, fixo: number, exito: number, data: Date }> = {};

    const reasonCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};
    let totalRejected = 0;
    const partnerCounts: Record<string, any> = {};

    // Prepara mapa de meses vazio para os últimos 12 meses
    let iteradorMeses = new Date(dataInicioFixo);
    while (iteradorMeses <= hoje) {
      const key = iteradorMeses.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      financeiroMap[key] = { pl: 0, fixo: 0, exito: 0, outros: 0, data: new Date(iteradorMeses) };
      propostasMap[key] = { pl: 0, fixo: 0, exito: 0, outros: 0, data: new Date(iteradorMeses) };
      iteradorMeses.setMonth(iteradorMeses.getMonth() + 1);
    }
    const dataLimite12Meses = dataInicioFixo;

    // --- LOOP PRINCIPAL DE CÁLCULO (USANDO FILTRADOS) ---
    filteredContracts.forEach((c) => {
      // 1. LEITURA DOS VALORES (Foco nos totais do placeholder)
      let pl = safeParseMoney(c.pro_labore);
      let exito = safeParseMoney(c.final_success_fee);
      let mensal = safeParseMoney(c.fixed_monthly_fee);
      let outros = safeParseMoney(c.other_fees);

      // Tenta ler honorário fixo pontual
      let fixoPontual = safeParseMoney((c as any).fixed_fee);
      if (fixoPontual === 0) fixoPontual = safeParseMoney((c as any).honorarios_fixos);

      // 2. ADIÇÃO DE EXTRAS
      if (c.pro_labore_extras && Array.isArray(c.pro_labore_extras)) pl += c.pro_labore_extras.reduce((acc: number, val: string) => acc + safeParseMoney(val), 0);
      if (c.final_success_extras && Array.isArray(c.final_success_extras)) exito += c.final_success_extras.reduce((acc: number, val: string) => acc + safeParseMoney(val), 0);
      if (c.fixed_monthly_extras && Array.isArray(c.fixed_monthly_extras)) mensal += c.fixed_monthly_extras.reduce((acc: number, val: string) => acc + safeParseMoney(val), 0);
      if (c.other_fees_extras && Array.isArray(c.other_fees_extras)) outros += c.other_fees_extras.reduce((acc: number, val: string) => acc + safeParseMoney(val), 0);

      // Extras Intermediários somam ao Êxito
      if (c.intermediate_fees && Array.isArray(c.intermediate_fees)) exito += c.intermediate_fees.reduce((acc: number, val: string) => acc + safeParseMoney(val), 0);

      // Soma de casos anexados (se houver)
      if (c.cases && Array.isArray(c.cases)) {
        c.cases.forEach((caseItem: ContractCase) => {
          pl += safeParseMoney(caseItem.pro_labore);
          exito += safeParseMoney(caseItem.final_success_fee || caseItem.success_fee);
        });
      }

      // 3. DATAS E FLUXO (USANDO safeDate)
      const statusDates = [c.prospect_date, c.proposal_date, c.contract_date, c.rejection_date, c.probono_date]
        .map(d => safeDate(d))
        .filter((d): d is Date => d !== null);

      let dataEntradaReal: Date;
      if (statusDates.length > 0) {
        // Encontra a menor data válida
        dataEntradaReal = new Date(Math.min(...statusDates.map(d => d.getTime())));
      } else {
        // Fallback para created_at ou hoje, garantindo safeDate se possível
        const createdAt = safeDate(c.created_at);
        dataEntradaReal = createdAt || new Date();
      }

      // Setup para gráficos/mapas usando dataEntradaReal
      const mesAnoEntrada = dataEntradaReal.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (mapaMeses[mesAnoEntrada] !== undefined) mapaMeses[mesAnoEntrada]++;
      else { if (!mapaMeses[mesAnoEntrada]) mapaMeses[mesAnoEntrada] = 0; mapaMeses[mesAnoEntrada]++; }

      // Comparativo de Entrada (Novos) - LOGICA MTD
      const dataEntradaISO = dataEntradaReal.toISOString().split('T')[0];
      if (isDateInCurrentMonth(dataEntradaISO, hoje)) mExecutivo.mesAtual.novos++;
      if (isDateInLastMonthMTD(dataEntradaISO, hoje)) mExecutivo.mesAnterior.novos++;

      // 4. MÉTODOS DE CÁLCULO POR STATUS - LOGICA MTD
      if (c.proposal_date) {
        if (isDateInCurrentMonth(c.proposal_date, hoje)) {
          mExecutivo.mesAtual.propQtd++;
          mExecutivo.mesAtual.propPL += pl;
          mExecutivo.mesAtual.propExito += exito;
          mExecutivo.mesAtual.propMensal += mensal;
        }
        if (isDateInLastMonthMTD(c.proposal_date, hoje)) {
          mExecutivo.mesAnterior.propQtd++;
          mExecutivo.mesAnterior.propPL += pl;
          mExecutivo.mesAnterior.propExito += exito;
          mExecutivo.mesAnterior.propMensal += mensal;
        }
      }

      if (c.status === 'active' && c.contract_date) {
        if (isDateInCurrentMonth(c.contract_date, hoje)) {
          mExecutivo.mesAtual.fechQtd++;
          mExecutivo.mesAtual.fechPL += pl;
          mExecutivo.mesAtual.fechExito += exito;
          mExecutivo.mesAtual.fechMensal += mensal;
        }
        if (isDateInLastMonthMTD(c.contract_date, hoje)) {
          mExecutivo.mesAnterior.fechQtd++;
          mExecutivo.mesAnterior.fechPL += pl;
          mExecutivo.mesAnterior.fechExito += exito;
          mExecutivo.mesAnterior.fechMensal += mensal;
        }
      }

      // Contagem por Sócio e Financeiro
      const pName = (c.partner_id && partnerMap[c.partner_id]?.name) || c.responsavel_socio || 'Não Informado';
      const pPhotoUrl = (c.partner_id && partnerMap[c.partner_id]?.photo_url) || undefined;

      if (!partnerCounts[pName]) partnerCounts[pName] = {
        total: 0, analysis: 0, proposal: 0, active: 0, rejected: 0, probono: 0,
        pl: 0, exito: 0, fixo: 0, outros: 0, photo_url: pPhotoUrl,
        has_timesheet: false,
        percents: new Set<string>()
      };

      if ((c as any).timesheet) partnerCounts[pName].has_timesheet = true;
      
      const processFieldForPercent = (val: string | undefined | null) => {
         if (!val) return;
         const str = String(val).trim();
         if (str === '0%' || str === '0' || str === '' || str === 'R$ 0,00') return;
         if (str.includes('%')) partnerCounts[pName].percents.add(str);
      };

      processFieldForPercent(c.pro_labore);
      processFieldForPercent(c.other_fees);
      processFieldForPercent(c.fixed_monthly_fee);
      processFieldForPercent(c.final_success_fee);

      const successPercentVal = (c as any).final_success_percent;
      if (successPercentVal && String(successPercentVal).trim() !== '0%') {
          if (String(successPercentVal).includes('%')) partnerCounts[pName].percents.add(String(successPercentVal));
          else partnerCounts[pName].percents.add(String(successPercentVal) + '%');
      }

      if (c.intermediate_fees && Array.isArray(c.intermediate_fees)) {
        c.intermediate_fees.forEach((f: string) => processFieldForPercent(f));
      }

      if ((c as any).final_success_extras && Array.isArray((c as any).final_success_extras)) {
        (c as any).final_success_extras.forEach((f: string) => processFieldForPercent(f));
      }
      
      if ((c as any).percent_extras && Array.isArray((c as any).percent_extras)) {
          (c as any).percent_extras.forEach((f: string) => {
              if (f && f !== '0%') {
                 if (f.includes('%')) partnerCounts[pName].percents.add(f);
                 else partnerCounts[pName].percents.add(f + '%');
              }
          });
      }

      partnerCounts[pName].total++;
      if (c.status === 'analysis') partnerCounts[pName].analysis++;
      else if (c.status === 'proposal') partnerCounts[pName].proposal++;
      else if (c.status === 'active') {
        partnerCounts[pName].active++;
        partnerCounts[pName].pl += pl;
        partnerCounts[pName].exito += exito;
        partnerCounts[pName].fixo += mensal;
        partnerCounts[pName].outros += (outros + fixoPontual);
      }
      else if (c.status === 'rejected') partnerCounts[pName].rejected++;
      else if (c.status === 'probono') partnerCounts[pName].probono++;

      // Rejeições
      if (c.status === 'rejected') {
        totalRejected++;
        const reason = c.rejection_reason || 'Não informado';
        const source = c.rejection_source || c.rejection_by || 'Não informado';
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      }

      // Mapas Financeiros (Gráficos)
      // 1. Fechamentos (Evolução Financeira)
      // Considera TODOS que tem data de contrato e status active (fechado)
      if (c.status === 'active' && c.contract_date) {
        const dContrato = safeDate(c.contract_date);
        if (dContrato) {
          dContrato.setDate(1); dContrato.setHours(0, 0, 0, 0);
          if (dContrato >= dataLimite12Meses) {
            const key = dContrato.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            // Soma TUDO: PL + Fixo + Êxito + Outros
            if (financeiroMap[key]) {
              financeiroMap[key].pl += pl;
              financeiroMap[key].fixo += (mensal + fixoPontual); 
              financeiroMap[key].exito += exito;
              financeiroMap[key].outros += outros; 
            }
          }
        }
      }

      // 2. Propostas (Evolução de Propostas)
      // Considera TODOS que tiveram proposta (active, proposal, rejected com data)
      if (c.proposal_date) {
        const dProposta = safeDate(c.proposal_date);
        if (dProposta) {
          dProposta.setDate(1); dProposta.setHours(0, 0, 0, 0);
          if (dProposta >= dataLimite12Meses) {
            const key = dProposta.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            if (propostasMap[key]) {
              propostasMap[key].pl += pl;
              propostasMap[key].fixo += (mensal + fixoPontual);
              propostasMap[key].exito += exito;
              propostasMap[key].outros += outros;
            }
          }
        }
      }

      // Tempos Médios (Funil)
      const dProspect = safeDate(c.prospect_date);
      const dProposal = safeDate(c.proposal_date);
      const dContract = safeDate(c.contract_date);
      const dRejection = safeDate(c.rejection_date);

      if (dProspect && isValidDate(dProspect) && dProposal && isValidDate(dProposal) && dProposal >= dProspect) {
        const diffTime = Math.abs(dProposal.getTime() - dProspect.getTime());
        somaDiasProspectProposta += Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        qtdProspectProposta++;
      }
      if (dProposal && isValidDate(dProposal) && dContract && isValidDate(dContract) && dContract >= dProposal) {
        const diffTime = Math.abs(dContract.getTime() - dProposal.getTime());
        somaDiasPropostaFechamento += Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        qtdPropostaFechamento++;
      }
      if (c.status === 'rejected' && dProspect && isValidDate(dProspect) && dRejection && isValidDate(dRejection) && dRejection >= dProspect) {
        const diffTime = Math.abs(dRejection.getTime() - dProspect.getTime());
        somaDiasProspectRejeicao += Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        qtdProspectRejeicao++;
      }

      // Totais Gerais
      mGeral.totalCasos++;
      if (c.status === 'analysis') mGeral.emAnalise++;
      if (c.status === 'rejected') mGeral.rejeitados++;
      if (c.status === 'probono') mGeral.probono++;

      if (c.status === 'proposal') {
        mGeral.propostasAtivas++;

        mGeral.valorEmNegociacaoPL += pl;
        mGeral.valorEmNegociacaoExito += exito;
        mGeral.valorEmNegociacaoMensal += mensal;
        mGeral.valorEmNegociacaoOutros += (outros + fixoPontual);
      }

      if (c.status === 'active') {
        mGeral.fechados++;

        mGeral.receitaRecorrenteAtiva += mensal;
        mGeral.totalFechadoPL += pl;
        mGeral.totalFechadoExito += exito;

        // Agrupamento de Outros + Fixo Pontual
        mGeral.totalFechadoOutros += (outros + fixoPontual);
        mGeral.totalFechadoFixo += fixoPontual; // Mantido para legado se necessário

        c.physical_signature === true ? mGeral.assinados++ : mGeral.naoAssinados++;
      }

      // Semana Atual
      if (c.status === 'analysis' && isDateInCurrentWeek(c.prospect_date, hoje)) mSemana.novos++;
      if (c.status === 'proposal' && isDateInCurrentWeek(c.proposal_date, hoje)) { mSemana.propQtd++; mSemana.propPL += pl; mSemana.propExito += exito; mSemana.propMensal += mensal; }
      if (c.status === 'active' && isDateInCurrentWeek(c.contract_date, hoje)) { mSemana.fechQtd++; mSemana.fechPL += pl; mSemana.fechExito += exito; mSemana.fechMensal += mensal; }
      if (c.status === 'rejected' && isDateInCurrentWeek(c.rejection_date, hoje)) mSemana.rejeitados++;
      if (c.status === 'probono' && isDateInCurrentWeek(c.probono_date || c.contract_date, hoje)) mSemana.probono++;

      // Semana Anterior
      if (c.status === 'proposal' && isDateInPreviousWeek(c.proposal_date, hoje)) { mSemanaAnterior.propPL += pl; mSemanaAnterior.propExito += exito; mSemanaAnterior.propMensal += mensal; }
      if (c.status === 'active' && isDateInPreviousWeek(c.contract_date, hoje)) { mSemanaAnterior.fechPL += pl; mSemanaAnterior.fechExito += exito; mSemanaAnterior.fechMensal += mensal; }

      // Mês Atual (Geral - sem MTD, para resumo do mês)
      if (c.status === 'analysis' && isDateInCurrentMonth(c.prospect_date, hoje)) mMes.analysis++;
      if (c.status === 'proposal' && isDateInCurrentMonth(c.proposal_date, hoje)) { mMes.propQtd++; mMes.propPL += pl; mMes.propExito += exito; mMes.propMensal += mensal; }
      if (c.status === 'active' && isDateInCurrentMonth(c.contract_date, hoje)) { mMes.fechQtd++; mMes.fechPL += pl; mMes.fechExito += exito; mMes.fechMensal += mensal; }
      if (c.status === 'rejected' && isDateInCurrentMonth(c.rejection_date, hoje)) mMes.rejected++;
      if (c.status === 'probono' && isDateInCurrentMonth(c.probono_date || c.contract_date, hoje)) mMes.probono++;

      // Funil
      fTotal++;
      fValorEntrada += (pl + exito + mensal + outros + fixoPontual);
      const chegouEmProposta = c.status === 'proposal' || c.status === 'active' || c.status === 'probono' || (c.status === 'rejected' && c.proposal_date);
      if (chegouEmProposta) {
        fQualificados++;
        fValorPropostas += (pl + exito + mensal + outros + fixoPontual);
      }
      if (c.status === 'active' || c.status === 'probono') {
        fFechados++;
        fValorFechados += (pl + exito + mensal + outros + fixoPontual);
      }
      else if (c.status === 'rejected') c.proposal_date ? fPerdaNegociacao++ : fPerdaAnalise++;
    });

    // Totais Calculados
    mSemana.totalUnico = mSemana.novos + mSemana.propQtd + mSemana.fechQtd + mSemana.rejeitados + mSemana.probono;
    mMes.totalUnico = mMes.analysis + mMes.propQtd + mMes.fechQtd + mMes.rejected + mMes.probono;

    // Processamento dos Gráficos
    const finArray = Object.entries(financeiroMap).map(([mes, vals]) => ({ mes, ...vals })).sort((a, b) => a.data.getTime() - b.data.getTime());
    const totalPL12 = finArray.reduce((acc, curr) => acc + curr.pl + curr.fixo, 0); const totalExito12 = finArray.reduce((acc, curr) => acc + curr.exito, 0);
    const monthsCount = finArray.length || 1;
    const mediasFinanceiras = { pl: totalPL12 / monthsCount, exito: totalExito12 / monthsCount };
    const totalFechado12Meses = finArray.reduce((acc, curr) => acc + curr.pl + curr.fixo + curr.exito, 0);
    const mediaFechadoMes = finArray.length > 0 ? totalFechado12Meses / finArray.length : 0;
    const ultimoFechado = finArray.length > 0 ? finArray[finArray.length - 1].pl + finArray[finArray.length - 1].fixo + finArray[finArray.length - 1].exito : 0;
    const penultimoFechado = finArray.length > 1 ? finArray[finArray.length - 2].pl + finArray[finArray.length - 2].fixo + finArray[finArray.length - 2].exito : 0;
    const statsFinanceiro = { total: totalFechado12Meses, media: mediaFechadoMes, diff: ultimoFechado - penultimoFechado };
    const maxValFin = Math.max(...finArray.map(i => Math.max(i.pl, i.fixo, i.exito)), 1);
    const financeiro12Meses = finArray.map(i => ({ ...i, hPl: (i.pl / maxValFin) * 100, hFixo: (i.fixo / maxValFin) * 100, hExito: (i.exito / maxValFin) * 100 }));

    const propArray = Object.entries(propostasMap).map(([mes, vals]) => ({ mes, ...vals })).sort((a, b) => a.data.getTime() - b.data.getTime());
    const totalPropPL12 = propArray.reduce((acc, curr) => acc + curr.pl + curr.fixo, 0); const totalPropExito12 = propArray.reduce((acc, curr) => acc + curr.exito, 0);
    const monthsCountProp = propArray.length || 1;
    const mediasPropostas = { pl: totalPropPL12 / monthsCountProp, exito: totalPropExito12 / monthsCountProp };
    const totalPropostas12Meses = propArray.reduce((acc, curr) => acc + curr.pl + curr.fixo + curr.exito, 0);
    const mediaPropostasMes = propArray.length > 0 ? totalPropostas12Meses / propArray.length : 0;
    const ultimoProp = propArray.length > 0 ? propArray[propArray.length - 1].pl + propArray[propArray.length - 1].fixo + propArray[propArray.length - 1].exito : 0;
    const penultimoProp = propArray.length > 1 ? propArray[propArray.length - 2].pl + propArray[propArray.length - 2].fixo + propArray[propArray.length - 2].exito : 0;
    const statsPropostas = { total: totalPropostas12Meses, media: mediaPropostasMes, diff: ultimoProp - penultimoProp };
    const maxValProp = Math.max(...propArray.map(i => Math.max(i.pl, i.fixo, i.exito)), 1);
    const propostas12Meses = propArray.map(i => ({ ...i, hPl: (i.pl / maxValProp) * 100, hFixo: (i.fixo / maxValProp) * 100, hExito: (i.exito / maxValProp) * 100 }));

    const funil = {
      totalEntrada: fTotal,
      qualificadosProposta: fQualificados,
      fechados: fFechados,
      valorEntrada: fValorEntrada,
      valorPropostas: fValorPropostas,
      valorFechados: fValorFechados,
      perdaAnalise: fPerdaAnalise,
      perdaNegociacao: fPerdaNegociacao,
      taxaConversaoProposta: fTotal > 0 ? ((fQualificados / fTotal) * 100).toFixed(1) : '0',
      taxaConversaoFechamento: fQualificados > 0 ? ((fFechados / fQualificados) * 100).toFixed(1) : '0',
      taxaRejeicao: fTotal > 0 ? (((fPerdaAnalise + fPerdaNegociacao) / fTotal) * 100).toFixed(1) : '0',
      tempoMedioProspectProposta: qtdProspectProposta > 0 ? Math.round(somaDiasProspectProposta / qtdProspectProposta) : 0,
      tempoMedioPropostaFechamento: qtdPropostaFechamento > 0 ? Math.round(somaDiasPropostaFechamento / qtdPropostaFechamento) : 0,
      tempoMedioRejeicao: qtdProspectRejeicao > 0 ? Math.round(somaDiasProspectRejeicao / qtdProspectRejeicao) : 0,
      diffEntrada: mExecutivo.mesAtual.novos - mExecutivo.mesAnterior.novos,
      diffPropostas: mExecutivo.mesAtual.propQtd - mExecutivo.mesAnterior.propQtd,
      diffFechados: mExecutivo.mesAtual.fechQtd - mExecutivo.mesAnterior.fechQtd
    };

    const mesesGrafico = []; let iteradorGrafico = new Date(dataInicioFixo); while (iteradorGrafico <= hoje) { const key = iteradorGrafico.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }); mesesGrafico.push({ mes: key, qtd: mapaMeses[key] || 0, altura: 0 }); iteradorGrafico.setMonth(iteradorGrafico.getMonth() + 1); } const maxQtd = Math.max(...mesesGrafico.map((m) => m.qtd), 1); mesesGrafico.forEach((m) => (m.altura = (m.qtd / maxQtd) * 100));
    const evolucaoMensal = mesesGrafico;

    mGeral.mediaMensalNegociacaoPL = mGeral.valorEmNegociacaoPL / monthsCountProp; mGeral.mediaMensalNegociacaoExito = mGeral.valorEmNegociacaoExito / monthsCountProp; mGeral.mediaMensalCarteiraPL = mGeral.totalFechadoPL / monthsCount; mGeral.mediaMensalCarteiraExito = mGeral.totalFechadoExito / monthsCount;

    const metrics = { semana: mSemana, semanaAnterior: mSemanaAnterior, mes: mMes, executivo: mExecutivo, geral: mGeral };

    const formatRejection = (counts: Record<string, number>) => Object.entries(counts).map(([label, value]) => ({ label, value, percent: totalRejected > 0 ? (value / totalRejected) * 100 : 0 })).sort((a, b) => b.value - a.value);
    const rejectionData = { reasons: formatRejection(reasonCounts), sources: formatRejection(sourceCounts) };
    const contractsByPartner = Object.entries(partnerCounts).map(([name, stats]: any) => ({ 
      name, 
      ...stats,
      percentsStr: stats.percents && stats.percents.size > 0 ? Array.from(stats.percents).join(' + ') : '-'
    })).sort((a: any, b: any) => b.total - a.total);

    return { metrics, funil, evolucaoMensal, financeiro12Meses, statsFinanceiro, propostas12Meses, statsPropostas, mediasFinanceiras, mediasPropostas, rejectionData, contractsByPartner, filteredContracts, partners };
  }, [contracts, partners, collaborators, selectedPartner, selectedLocation, selectedPeriod]);

  return { loading, refresh: fetchDashboardData, ...dashboardData };
}