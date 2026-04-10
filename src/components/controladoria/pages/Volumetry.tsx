import { useState, useEffect, useMemo, Fragment } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  BarChart3,
  Scale,
  FileText,
  PieChart,
  Activity,
  Layers,
  ShieldCheck,
  FileDown,
  Clock,
  AlertTriangle,
  MapPin,
  Briefcase,

  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { exportToStandardXLSX } from '../../../utils/exportUtils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

import { VolumetryProcesses } from './VolumetryProcesses';
import { FilterBar, FilterCategory } from '../../collaborators/components/FilterBar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';

// Helper para converter nome de Estado para Sigla UF
const stateToUf: Record<string, string> = {
  'ACRE': 'AC', 'ALAGOAS': 'AL', 'AMAPÁ': 'AP', 'AMAPA': 'AP', 'AMAZONAS': 'AM',
  'BAHIA': 'BA', 'CEARÁ': 'CE', 'CEARA': 'CE', 'DISTRITO FEDERAL': 'DF',
  'ESPÍRITO SANTO': 'ES', 'ESPIRITO SANTO': 'ES', 'GOIÁS': 'GO', 'GOIAS': 'GO',
  'MARANHÃO': 'MA', 'MARANHAO': 'MA', 'MATO GROSSO': 'MT', 'MATO GROSSO DO SUL': 'MS',
  'MINAS GERAIS': 'MG', 'PARÁ': 'PA', 'PARA': 'PA', 'PARAÍBA': 'PB', 'PARAIBA': 'PB',
  'PARANÁ': 'PR', 'PARANA': 'PR', 'PERNAMBUCO': 'PE', 'PIAUÍ': 'PI', 'PIAUI': 'PI',
  'RIO DE JANEIRO': 'RJ', 'RIO GRANDE DO NORTE': 'RN', 'RIO GRANDE DO SUL': 'RS',
  'RONDÔNIA': 'RO', 'RONDONIA': 'RO', 'RORAIMA': 'RR', 'SANTA CATARINA': 'SC',
  'SÃO PAULO': 'SP', 'SAO PAULO': 'SP', 'SERGIPE': 'SE', 'TOCANTINS': 'TO',
  'FEDERAL': 'FE'
};

const ufToState: Record<string, string> = {
  'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia',
  'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás',
  'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais',
  'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná', 'PE': 'Pernambuco', 'PI': 'Piauí',
  'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte', 'RS': 'Rio Grande do Sul',
  'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina', 'SP': 'São Paulo',
  'SE': 'Sergipe', 'TO': 'Tocantins', 'FE': 'Federal'
};

const getUfSigla = (name: string) => {
  const norm = name.toUpperCase().trim();
  if (norm.length === 2) return norm;
  return stateToUf[norm] || norm.substring(0, 2);
};

function LifeCycleSection({ processes }: { processes: any[] }) {
  const { valid, invalid, avgText, chartData, topUfs } = useMemo(() => {
    let validCount = 0, invalidCount = 0, totalDays = 0;
    const ufStats: Record<string, { count: number, totalDays: number, validForAvg: number }> = {};
    const buckets = [
      { name: '< 1 ano', ativos: 0, arquivados: 0 },
      { name: '1 a 3 anos', ativos: 0, arquivados: 0 },
      { name: '3 a 5 anos', ativos: 0, arquivados: 0 },
      { name: '5 a 10 anos', ativos: 0, arquivados: 0 },
      { name: '> 10 anos', ativos: 0, arquivados: 0 }
    ];

    processes.forEach(p => {
      let rawUf = p.uf?.toUpperCase().trim();
      let sigla = '';
      if (rawUf && rawUf !== '' && rawUf !== '-' && rawUf !== 'N/I') {
        sigla = getUfSigla(rawUf);
        if (!ufStats[sigla]) {
          ufStats[sigla] = { count: 0, totalDays: 0, validForAvg: 0 };
        }
        ufStats[sigla].count++;
      }

      if (!p.data_cadastro) {
        invalidCount++;
        return;
      }
      
      const start = new Date(p.data_cadastro).getTime();
      let end: number;
      const isAtivo = p.status?.toLowerCase() === 'ativo';

      if (isAtivo) {
        end = new Date().getTime();
      } else {
        if (!p.data_encerramento && !p.data_baixa) {
          invalidCount++;
          return;
        }
        end = new Date(p.data_encerramento || p.data_baixa).getTime();
      }

      if (end < start || isNaN(start) || isNaN(end)) {
        invalidCount++;
        return;
      }

      const days = (end - start) / 86400000;
      validCount++;
      totalDays += days;
      if (sigla) {
        ufStats[sigla].totalDays += days;
        ufStats[sigla].validForAvg++;
      }
      const years = days / 365.25;

      const category = isAtivo ? 'ativos' : 'arquivados';

      if (years < 1) buckets[0][category]++;
      else if (years <= 3) buckets[1][category]++;
      else if (years <= 5) buckets[2][category]++;
      else if (years <= 10) buckets[3][category]++;
      else buckets[4][category]++;
    });

    const avgDays = validCount > 0 ? (totalDays / validCount) : 0;
    const avgYears = Math.floor(avgDays / 365.25);
    const avgMonths = Math.floor((avgDays % 365.25) / 30.4);
    
    const topUfs = Object.entries(ufStats)
      .map(([s, stats]) => {
        const avgD = stats.validForAvg > 0 ? (stats.totalDays / stats.validForAvg) : 0;
        const avgY = Math.floor(avgD / 365.25);
        const avgM = Math.floor((avgD % 365.25) / 30.4);
        let timeStr = '-';
        if (stats.validForAvg > 0) {
          if (avgY > 0) timeStr = `${avgY}a ${avgM}m`;
          else if (avgM > 0) timeStr = `${avgM}m`;
          else timeStr = `${Math.floor(avgD)}d`;
        }
        return { sigla: s, count: stats.count, timeStr, avgDays: avgD };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      valid: validCount,
      invalid: invalidCount,
      avgText: validCount > 0 ? `${avgYears} ano${avgYears !== 1 ? 's' : ''} e ${avgMonths} ${avgMonths === 1 ? 'mês' : 'meses'}` : '-',
      chartData: buckets,
      topUfs
    };
  }, [processes]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col xl:flex-row gap-8 items-stretch mt-2">
      <div className="w-full xl:w-[280px] flex flex-col gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Tempo Médio de Tramitação</h3>
          </div>
          <p className="text-3xl font-black text-blue-900 tracking-tight leading-none mt-2">{avgText}</p>
          <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wide">Calculado da data de distribuição até o encerramento (ou data atual, se ativo)</p>
        </div>

        {invalid > 0 && (
          <div className="flex items-start gap-3 bg-red-50 p-4 rounded-xl border border-red-100 mt-auto min-h-[84px]">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-[10px] font-bold text-red-800 uppercase tracking-tight leading-relaxed">
              <span className="font-black text-red-900">{invalid.toLocaleString('pt-BR')} processos</span> não puderam ser calculados por falta de datas base.
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 w-full h-[250px] min-w-0 overflow-hidden self-center">
        {valid > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}
                itemStyle={{ fontSize: '12px', fontWeight: '900' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} iconType="circle" iconSize={6} />
              
              <Bar dataKey="ativos" name="Ativos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} animationDuration={1000}>
                <LabelList dataKey="ativos" position="top" formatter={(v: number) => v > 0 ? v.toLocaleString('pt-BR') : ''} style={{ fill: '#059669', fontSize: 13, fontWeight: 'black' }} />
              </Bar>
              <Bar dataKey="arquivados" name="Encerrados" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={30} animationDuration={1000}>
                <LabelList dataKey="arquivados" position="top" formatter={(v: number) => v > 0 ? v.toLocaleString('pt-BR') : ''} style={{ fill: '#d97706', fontSize: 13, fontWeight: 'black' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
            <Clock className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest text-center px-4">Filtragem não contém dados temporais para gerar histórico</p>
          </div>
        )}
      </div>

      <div className="w-full xl:w-[380px] flex flex-col gap-3 shrink-0 bg-gray-50/50 p-4 rounded-xl border border-gray-100 self-stretch">
        <div className="flex items-center gap-2 mb-1">
           <div className="p-1.5 bg-blue-100 rounded-md">
             <MapPin className="w-3.5 h-3.5 text-blue-700" />
           </div>
           <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-tight">Média/Top 5 UFs</h3>
        </div>
        
        <div className="flex flex-col gap-2">
          {topUfs.map((uf: any, idx: number) => (
            <div key={uf.sigla} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm group hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[10px] font-black text-gray-400 w-3 shrink-0">{idx + 1}º</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-black text-[#0a192f] leading-none truncate" title={ufToState[uf.sigla] || uf.sigla}>{ufToState[uf.sigla] || uf.sigla}</span>
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{uf.count.toLocaleString('pt-BR')} procs.</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-1.5 w-[80px] shrink-0 bg-blue-50/50 px-2.5 py-1 rounded border border-blue-100/50 group-hover:bg-blue-100 transition-colors">
                <Clock className="w-3 h-3 text-blue-500 shrink-0" />
                <span className="text-[10px] font-black text-blue-700 tracking-wider tooltip truncate" title={`Média de ${Math.floor(uf.avgDays)} dias`}>{uf.timeStr}</span>
              </div>
            </div>
          ))}
          {topUfs.length === 0 && (
             <div className="text-center p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Nenhum dado UF</p>
             </div>
          )}
        </div>
      </div>
    </div>
  )
}

const UfTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 min-w-[150px]">
        <p className="text-xs font-black text-gray-700 uppercase mb-2">
          {data.isOthers ? 'Outras UFs' : data.originalName} ({label})
        </p>
        {data.isOthers && (
          <p className="text-[9px] font-bold text-gray-400 uppercase leading-snug mb-3 max-w-[200px]">
            Agrupa: {data.ufsList}
          </p>
        )}
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">
              {entry.name}: <span className="text-gray-900 font-black">{entry.value.toLocaleString('pt-BR')}</span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const toTitleCase = (str: string) => {
  let n = str.trim().toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());
  if (n === 'Luiz Henrique Pavan') n = 'Luiz Henrique Miguel Pavan';
  return n;
};

function UfChartSection({ processes, isPartnerFiltered, leaderPartners }: { processes: any[], isPartnerFiltered: boolean, leaderPartners: Record<string, string> }) {
  const { valid, missingUf, chartData, validAtivos, validArquivados, socioMatrix, mainUfNames, hasSmallUfs } = useMemo(() => {
    let missingUfCount = 0;
    let validAtivosCount = 0;
    let validArquivadosCount = 0;

    const ufMap: Record<string, {ativos: number, arquivados: number, originalNames: Set<string>, bySocio: Record<string, number>}> = {};

    processes.forEach(p => {
      let rawUf = p.uf?.toUpperCase().trim();
      if (!rawUf || rawUf === '' || rawUf === '-' || rawUf === 'N/I') {
        missingUfCount++;
        return;
      }
      
      const sigla = getUfSigla(rawUf);
      const isAtivo = p.status?.toLowerCase() === 'ativo';
      const leaderName = toTitleCase(p.responsavel_principal || '');
      const socioStr = leaderPartners[leaderName] || "Sem Sócio Definido";

      if (!ufMap[sigla]) {
        ufMap[sigla] = { ativos: 0, arquivados: 0, originalNames: new Set(), bySocio: {} };
      }

      ufMap[sigla].originalNames.add(p.uf.trim());

      if (isAtivo) {
        ufMap[sigla].ativos++;
        validAtivosCount++;
        ufMap[sigla].bySocio[socioStr] = (ufMap[sigla].bySocio[socioStr] || 0) + 1;
      } else {
        ufMap[sigla].arquivados++;
        validArquivadosCount++;
      }
    });

    const sortedData = Object.entries(ufMap)
      .map(([sigla, data]) => ({
        name: sigla,
        originalName: Array.from(data.originalNames)[0],
        ativos: data.ativos,
        arquivados: data.arquivados,
        total: data.ativos + data.arquivados,
        isOthers: false,
        bySocio: data.bySocio
      }))
      .sort((a, b) => b.total - a.total);

    // Se estiver filtrado por líder, NÃO agrupa em Outros
    const THRESHOLD = isPartnerFiltered ? 0 : 200;
    const mainData = sortedData.filter(d => d.total >= THRESHOLD);
    const smallData = sortedData.filter(d => d.total < THRESHOLD);

    let socioMatrix: any[] = [];
    let mainUfNames: string[] = [];
    let hasSmallUfs = false;

    if (!isPartnerFiltered) {
       mainUfNames = mainData.map(d => d.name);
       hasSmallUfs = smallData.length > 0;
       
       const socioTotals: Record<string, any> = {};
       
       mainData.forEach(d => {
          Object.entries(d.bySocio || {}).forEach(([socio, count]) => {
             if (!socioTotals[socio]) socioTotals[socio] = { total: 0 };
             socioTotals[socio][d.name] = Number(count);
             socioTotals[socio].total += Number(count);
          });
       });
       
       smallData.forEach(d => {
          Object.entries(d.bySocio || {}).forEach(([socio, count]) => {
             if (!socioTotals[socio]) socioTotals[socio] = { total: 0 };
             socioTotals[socio]['Outros'] = (socioTotals[socio]['Outros'] || 0) + Number(count);
             socioTotals[socio].total += Number(count);
          });
       });

       socioMatrix = Object.entries(socioTotals).map(([socio, counts]) => ({
          socio,
          ...counts
       })).sort((a, b) => b.total - a.total);
    }

    if (smallData.length > 0) {
      const ufsList = smallData.map(d => d.name).join(', ');
      const sumAtivos = smallData.reduce((acc, d) => acc + d.ativos, 0);
      const sumArquivados = smallData.reduce((acc, d) => acc + d.arquivados, 0);
      
      mainData.push({
        name: `Outros`,
        originalName: 'Outros',
        ativos: sumAtivos,
        arquivados: sumArquivados,
        total: sumAtivos + sumArquivados,
        isOthers: true,
        ufsList,
        bySocio: {} 
      } as any);
    }

    return {
      valid: validAtivosCount + validArquivadosCount,
      validAtivos: validAtivosCount,
      validArquivados: validArquivadosCount,
      missingUf: missingUfCount,
      chartData: mainData,
      socioMatrix,
      mainUfNames,
      hasSmallUfs
    };
  }, [processes, isPartnerFiltered, leaderPartners]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col xl:flex-row gap-8 items-stretch mt-2">
      <div className="w-full xl:w-[280px] flex flex-col gap-4 shrink-0 h-full">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <MapPin className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Distribuição por UF</h3>
          </div>
          
          <div className="mt-3">
            <p className="text-3xl font-black text-[#0a192f] tracking-tight leading-none">{valid.toLocaleString('pt-BR')}</p>
            <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wide">Total Identificado</p>
          </div>

          <div className="flex items-center gap-2 xl:gap-3 mt-4 flex-wrap">
            <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100/50">
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
               <span className="text-sm font-black text-emerald-700">{validAtivos.toLocaleString('pt-BR')}</span>
               <span className="text-[9px] font-bold text-emerald-600/80 uppercase tracking-widest">Ativos</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100/50">
               <div className="w-2 h-2 rounded-full bg-amber-500"></div>
               <span className="text-sm font-black text-amber-700">{validArquivados.toLocaleString('pt-BR')}</span>
               <span className="text-[9px] font-bold text-amber-600/80 uppercase tracking-widest">Encerrados</span>
            </div>
          </div>
        </div>

        {missingUf > 0 && (
          <div className="flex items-start gap-3 bg-red-50 p-4 rounded-xl border border-red-100 mt-auto min-h-[84px]">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-[10px] font-bold text-red-800 uppercase tracking-tight leading-relaxed">
              <span className="font-black text-red-900">{missingUf.toLocaleString('pt-BR')} processos</span> não possuem UF preenchida.
            </p>
          </div>
        )}
      </div>

    <div className="flex-1 w-full h-[250px] min-w-0 overflow-hidden self-center">
      {valid > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 25, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} interval={0} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
              <Tooltip content={<UfTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} iconType="circle" iconSize={6} />
              
              <Bar dataKey="ativos" stackId="a" name="Ativos" fill="#10b981" maxBarSize={55} animationDuration={1000}>
                <LabelList dataKey="ativos" position="center" formatter={(v: number) => v >= 300 ? v.toLocaleString('pt-BR') : ''} style={{ fill: '#ffffff', textShadow: '0px 1px 2px rgba(0,0,0,0.5)', fontSize: 11, fontWeight: 'bold' }} />
              </Bar>
              <Bar dataKey="arquivados" stackId="a" name="Encerrados" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={55} animationDuration={1000}>
                <LabelList dataKey="arquivados" position="top" formatter={(v: number) => v >= 100 ? v.toLocaleString('pt-BR') : ''} style={{ fill: '#d97706', fontSize: 11, fontWeight: 'black' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
            <MapPin className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest text-center px-4">Nenhum dado de UF disponível para gerar o gráfico</p>
          </div>
        )}
      </div>

      {!isPartnerFiltered && (
      <div className="w-full xl:w-[620px] flex flex-col gap-3 shrink-0 bg-gray-50/50 p-4 rounded-xl border border-gray-100 self-stretch overflow-hidden">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200/60 shrink-0">
           <div className="p-1.5 bg-indigo-100 rounded-md">
             <Briefcase className="w-3.5 h-3.5 text-indigo-700" />
           </div>
           <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none flex items-center gap-1.5">
             Distribuição de Sócios {'>'} UFs
             <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[8px] font-black tracking-wider tooltip" title="Apenas considerando processos ativos">APENAS ATIVOS</span>
           </h3>
        </div>
        
        <div className="flex-1 overflow-auto styled-scrollbar custom-scrollbar max-h-[300px]">
          <table className="w-full text-left border-collapse min-w-[350px]">
            <thead className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 shadow-sm border-b border-gray-100/50">
              <tr>
                <th className="py-2.5 px-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100/30">Sócio</th>
                {mainUfNames.map((uf: string) => (
                  <th key={uf} className="py-2.5 px-2 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center border-r border-gray-100/30">{uf}</th>
                ))}
                {hasSmallUfs && <th className="py-2.5 px-2 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center border-r border-gray-100/30">Outros</th>}
                <th className="py-2.5 px-2 text-[9px] font-black text-indigo-500 uppercase tracking-widest text-center">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/60">
              {socioMatrix.map((row: any) => (
                <tr key={row.socio} className="hover:bg-white transition-colors group">
                  <td className="py-2 px-2 text-[10px] font-black text-[#0a192f] whitespace-nowrap max-w-[250px] truncate border-r border-gray-50" title={row.socio}>{row.socio}</td>
                  {mainUfNames.map((uf: string) => (
                    <td key={uf} className="py-2 px-2 text-[10px] font-bold text-gray-600 text-center border-r border-gray-50 group-hover:text-amber-600 transition-colors">
                      {row[uf] ? row[uf].toLocaleString('pt-BR') : '-'}
                    </td>
                  ))}
                  {hasSmallUfs && (
                    <td className="py-2 px-2 text-[10px] font-bold text-gray-500 text-center border-r border-gray-50">
                       {row['Outros'] ? row['Outros'].toLocaleString('pt-BR') : '-'}
                    </td>
                  )}
                  <td className="py-2 px-2 text-[10px] font-black text-indigo-700 text-center">
                     {row.total.toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {socioMatrix.length === 0 && (
             <div className="text-center p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Sem dados de sócios</p>
             </div>
          )}
        </div>
      </div>
      )}
    </div>
  )
}

export function Volumetry() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'processos'>('dashboard');
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Controle de Expansão dos Sócios
  const [expandedSocios, setExpandedSocios] = useState<Record<string, boolean>>({});

  const toggleSocio = (socioName: string) => {
    setExpandedSocios(prev => ({ ...prev, [socioName]: !prev[socioName] }));
  };

  // Filtros Globais para o Dashboard
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>(['Ativo']);
  const [partnerFilter, setPartnerFilter] = useState<string[]>([]); // Responsável Principal
  const [leaderPartners, setLeaderPartners] = useState<Record<string, string>>({});
  const [socioFilter, setSocioFilter] = useState<string[]>([]); // Sócio

  useEffect(() => {
    fetchProcesses();
    fetchCollaboratorsMapping();
  }, [activeTab]); // Recarrega quando muda de aba, caso a pessoa importe novos

  const fetchCollaboratorsMapping = async () => {
    const { data } = await supabase.from('collaborators').select('name, partner:partner_id(name)');
    if (data) {
        const map: Record<string, string> = {};
        data.forEach((c: any) => {
             const cName = toTitleCase(c.name);
             const pName = c.partner?.name ? toTitleCase(c.partner.name) : 'Sem Sócio Definido';
             map[cName] = pName;
        });
        setLeaderPartners(map);
    }
  };

  const fetchProcesses = async () => {
    if (activeTab === 'processos') return; // A aba de processos cuida do seu próprio fetch
    
    setLoading(true);
    try {
      let allData: any[] = [];
      let from = 0;
      const step = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from('processos')
          .select('cliente_principal,numero_cnj,pasta,status,responsavel_principal,data_cadastro,data_encerramento,data_baixa,uf,tipo,instancia')
          .range(from, from + step - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        
        const normalizedData = data.map(p => {
          let st = p.status || '';
          if (['arquivado', 'baixado', 'suspenso'].includes(st.toLowerCase())) {
            st = 'Encerrado';
          }
          return { ...p, status: st };
        });
        
        allData = [...allData, ...normalizedData];
        if (data.length < step) break;
        from += step;
      }

      setProcesses(allData);
    } catch (error) {
      console.error('Erro ao carregar volumetria de processos:', error);
    } finally {
      setLoading(false);
    }
  };

  // --------------- Lógica de Filtragem no Dashboard ---------------
  const matchesStatusFilter = (procStatus: string, filters: string[]) => {
    if (filters.length === 0) return true;
    return filters.some(f => procStatus?.toLowerCase() === f.toLowerCase());
  };

  const baseProcesses = processes.filter((proc: any) => {
    const matchesSearch =
      (proc.cliente_principal && proc.cliente_principal.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (proc.numero_cnj && proc.numero_cnj.includes(searchTerm)) ||
      (proc.pasta && proc.pasta.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = matchesStatusFilter(proc.status || '', statusFilter);

    return matchesSearch && matchesStatus;
  });

  const filteredProcesses = baseProcesses.filter((proc: any) => {
    const leaderName = toTitleCase(proc.responsavel_principal || '');
    const procSocio = leaderPartners[leaderName] || 'Sem Sócio Definido';
    
    const matchesPartner = partnerFilter.length > 0 ? partnerFilter.includes(leaderName) : true;
    const matchesSocio = socioFilter.length > 0 ? socioFilter.includes(procSocio) : true;
    
    return matchesPartner && matchesSocio;
  });

  const lifeCycleProcesses = processes.filter((proc: any) => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch =
      (proc.cliente_principal && proc.cliente_principal.toLowerCase().includes(searchLow)) ||
      (proc.numero_cnj && proc.numero_cnj.includes(searchTerm)) ||
      (proc.pasta && proc.pasta.toLowerCase().includes(searchLow));

    const leaderName = toTitleCase(proc.responsavel_principal || '');
    const procSocio = leaderPartners[leaderName] || 'Sem Sócio Definido';
    
    const matchesPartner = partnerFilter.length > 0 ? partnerFilter.includes(leaderName) : true;
    const matchesSocio = socioFilter.length > 0 ? socioFilter.includes(procSocio) : true;
    
    return matchesSearch && matchesPartner && matchesSocio;
  });

  // Métricas (independentes do statusFilter para os cards do topo)
  const topCardsProcesses = processes.filter((proc: any) => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch =
      (proc.cliente_principal && proc.cliente_principal.toLowerCase().includes(searchLow)) ||
      (proc.numero_cnj && proc.numero_cnj.includes(searchTerm)) ||
      (proc.pasta && proc.pasta.toLowerCase().includes(searchLow));
    
    const leaderName = toTitleCase(proc.responsavel_principal || '');
    const procSocio = leaderPartners[leaderName] || 'Sem Sócio Definido';
    
    const matchesPartner = partnerFilter.length > 0 ? partnerFilter.includes(leaderName) : true;
    const matchesSocio = socioFilter.length > 0 ? socioFilter.includes(procSocio) : true;
    
    return matchesSearch && matchesPartner && matchesSocio;
  });

  const totalProcesses = topCardsProcesses.length;
  
  const ativosCount = topCardsProcesses.filter(p => p.status?.toLowerCase() === 'ativo').length;
  const arquivadosCount = topCardsProcesses.filter(p => p.status?.toLowerCase() === 'encerrado').length;

  const uniqueClients = new Set(topCardsProcesses.map(p => p.cliente_principal).filter(Boolean)).size;

  // Calculo de processos duplicados pelo numero CNJ (Apenas tipo "Processo", ignorando "Recurso" e "Incidente")
  // A string salva no banco é 'Tipo - Tipo de Processo', logo separamos para checar estritamente a primeira coluna
  const processosParaDuplicatas = topCardsProcesses.filter(p => p.tipo?.split(' - ')[0].trim().toLowerCase() === 'processo');

  const cnjCounts = processosParaDuplicatas.reduce((acc: Record<string, number>, p: any) => {
    if (p.numero_cnj) {
      acc[p.numero_cnj] = (acc[p.numero_cnj] || 0) + 1;
    }
    return acc;
  }, {});
  const duplicadosCount = Object.values(cnjCounts).filter(count => (count as number) > 1).reduce((sum, count) => sum + ((count as number) - 1), 0);

  // Extrair lista de responsáveis únicos para o filtro
  const allPartners = Array.from(new Set(processes.map(p => toTitleCase(p.responsavel_principal || '')).filter(Boolean))).sort();
  // Extrair status únicos (Ativo, Arquivado, etc)
  const allStatuses = Array.from(new Set(processes.map(p => p.status).filter(Boolean))).sort();
  // Extrair lista de Sócios dinamicamente
  const allSocios = Array.from(new Set(allPartners.map(p => leaderPartners[p] || 'Sem Sócio Definido'))).sort();

  // --------------- Agrupamento por Responsável ---------------
  const baseForPercentage = baseProcesses.length;

  const volumetryByPartner = allPartners.map(partnerName => {
    const partnerProcs = filteredProcesses.filter(p => toTitleCase(p.responsavel_principal || '') === partnerName);
    const rawPartnerProcs = topCardsProcesses.filter(p => toTitleCase(p.responsavel_principal || '') === partnerName);
    
    const socioName = leaderPartners[partnerName] || 'Sem Sócio Definido';

    return {
      name: partnerName || 'Sem Responsável',
      socio: socioName,
      count: partnerProcs.length,
      percentage: baseForPercentage > 0 ? ((partnerProcs.length / baseForPercentage) * 100).toFixed(1) : "0",
      ativos: partnerProcs.filter(p => p.status?.toLowerCase() === 'ativo').length,
      arquivados: rawPartnerProcs.filter(p => p.status?.toLowerCase() === 'encerrado').length,
      administrativo: partnerProcs.filter(p => p.tipo?.toLowerCase().includes('administrativo')).length,
      judicial: partnerProcs.filter(p => p.tipo?.toLowerCase().includes('judicia')).length,
      arbitral: partnerProcs.filter(p => p.tipo?.toLowerCase().includes('arbitral')).length,
    };
  }).filter(p => p.count > 0 || p.arquivados > 0).sort((a, b) => b.count - a.count); // Mostra também se tiver arquivados fixos

  const volumetryBySocio = useMemo(() => {
     const grouped = volumetryByPartner.reduce((acc, curr) => {
         const socio = curr.socio;
         if (!acc[socio]) acc[socio] = [];
         acc[socio].push(curr);
         return acc;
     }, {} as Record<string, typeof volumetryByPartner>);

     return Object.entries(grouped).sort((a, b) => {
         const sumA = a[1].reduce((sum, p) => sum + p.count, 0);
         const sumB = b[1].reduce((sum, p) => sum + p.count, 0);
         if (a[0] === 'Sem Sócio Definido') return 1;
         if (b[0] === 'Sem Sócio Definido') return -1;
         return sumB - sumA;
     });
  }, [volumetryByPartner]);

  const handleExportDashboard = () => {
    const sheetsToExport: any[] = [];

    // 1. Aba Volumetria (Dashboard)
    const exportData = volumetryByPartner.map((m: any) => ({
      'Líder Responsável': m.name,
      'Sócio (Grupo)': m.socio,
      'Ativos': m.ativos,
      'Administrativo': m.administrativo,
      'Judicial': m.judicial,
      'Arbitral': m.arbitral,
      'Encerrados': m.arquivados,
      '% Representatividade': `${m.percentage}%`
    }));
    sheetsToExport.push({ sheetName: "Volumetria", data: exportData, colWidths: [40, 40, 15, 20, 15, 15, 15, 25] });

    // 2. Aba Processos Relacionados
    const exportProcesses = filteredProcesses.map((p: any) => ({
      'Pasta': p.pasta || '-',
      'Responsável Principal': p.responsavel_principal || '-',
      'Cliente Principal': p.cliente_principal || '-',
      'Adverso Principal': p.adverso_principal || '-',
      'Número de CNJ': p.numero_cnj || '-',
      'Status': p.status || '-',
      'Tipo': p.tipo || '-',
      'Fase': p.fase || '-',
      'Instância': p.instancia || '-',
      'Data de Cadastro': p.data_cadastro || '-',
      'Data da Baixa': p.data_baixa || '-',
    }));
    
    if (exportProcesses.length > 0) {
      sheetsToExport.push({ sheetName: "Processos Relacionados", data: exportProcesses, colWidths: [20, 35, 35, 35, 35, 15, 25, 25, 20, 20, 20] });
    }

    // 3. Aba Duplicados (se houver)
    const duplicatasCnjObj = processosParaDuplicatas.reduce((acc: Record<string, any[]>, p: any) => {
      if (p.numero_cnj) {
        if (!acc[p.numero_cnj]) acc[p.numero_cnj] = [];
        acc[p.numero_cnj].push(p);
      }
      return acc;
    }, {});
    
    const duplicateRowsRaw = Object.values(duplicatasCnjObj).filter(arr => arr.length > 1).flat();
    
    if (duplicateRowsRaw.length > 0) {
      const exportDuplicates = duplicateRowsRaw.map((p: any) => ({
        'Número de CNJ Duplicado': p.numero_cnj || '-',
        'Pasta Conflitante': p.pasta || '-',
        'Responsável': p.responsavel_principal || '-',
        'Cliente': p.cliente_principal || '-',
        'Adverso': p.adverso_principal || '-',
        'Status Atual': p.status || '-',
        'Data de Cadastro': p.data_cadastro || '-',
      }));
      sheetsToExport.push({ sheetName: "Processos Duplicados", data: exportDuplicates, colWidths: [35, 20, 35, 35, 35, 15, 20] });
    }

    const parts = ['Volumetria'];
    if (socioFilter.length > 0) parts.push(socioFilter.join(', '));
    if (partnerFilter.length > 0) parts.push(partnerFilter.join(', '));
    if (statusFilter.length > 0) parts.push(statusFilter.join(', '));

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const dateStr = `${dd}.${mm}.${yyyy}`;
    
    const filterStr = parts.length > 1 ? parts.join(' - ') : 'Geral';
    const filename = `${filterStr} - ${dateStr}.xlsx`;

    exportToStandardXLSX(sheetsToExport, filename);
    toast.success('Relatório Excel gerado com sucesso!', {
      description: duplicateRowsRaw.length > 0 ? 'Exportou 3 abas: Volumetria, Relacionados e Duplicados.' : 'Exportou 2 abas: Volumetria e Processos Relacionados.'
    });
  };

  const handleExportPDF = async () => {
    const targetElement = document.getElementById('volumetry-dashboard-content');
    if (!targetElement) return;

    setIsExportingPDF(true);
    const loadingToast = toast.loading('Gerando PDF do Dashboard... Isso pode levar alguns segundos.');

    // Save scroll pos and jump to top to avoid html2canvas bug
    const originalScrollY = window.scrollY;
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Dá tempo ao React e ao navegador para desenharem o novo cabeçalho elegante antes de capturar
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(targetElement, {
          scale: 4, // Aumentado para altíssima resolução
          useCORS: true,
          backgroundColor: '#f8fafc',
          scrollY: 0,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = 210; // A4 width in mm
        const expectedHeight = (canvas.height * pdfWidth) / canvas.width;
        const pdfHeight = Math.max(297, expectedHeight + 45);
        const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);

        try {
          const logoImg = new Image();
          logoImg.src = '/logo-salomao.png';
          await new Promise((resolve) => {
            logoImg.onload = resolve;
            logoImg.onerror = resolve;
          });

          if (logoImg.width && logoImg.height) {
            const logoWidth = 40;
            const logoHeight = (logoImg.height * logoWidth) / logoImg.width;
            pdf.addImage(logoImg, 'PNG', 10, 10, logoWidth, logoHeight);
          } else {
            pdf.addImage('/logo-salomao.png', 'PNG', 10, 10, 40, 15);
          }
        } catch (e) {
          console.warn('Could not load logo for PDF', e);
        }

        pdf.setFontSize(14);
        pdf.setTextColor(30, 58, 138); // #1e3a8a
        pdf.setFont("helvetica", "bold");
        pdf.text("Dashboard Analítico de Volumetria", 60, 20);

        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 60, 25);

        pdf.addImage(imgData, 'PNG', 10, 35, pdfWidth - 20, expectedHeight);

        const d = new Date();
        const fd = d.toLocaleDateString('pt-BR').replace(/\//g, '-');
        pdf.save(`Dashboard_Volumetria_${fd}.pdf`);
        toast.success('PDF gerado com sucesso!', { id: loadingToast });
      } catch (error) {
        console.error('Erro ao gerar PDF', error);
        toast.error('Erro ao gerar PDF do dashboard.', { id: loadingToast });
      } finally {
        setIsExportingPDF(false);
        window.scrollTo({ top: originalScrollY, behavior: 'instant' });
      }
    }, 300);
  };

  // FilterBar: categorias, chips, count
  const filterCategories = useMemo((): FilterCategory[] => [
    {
      key: 'partner',
      label: 'Líder Responsável',
      icon: Briefcase,
      type: 'multi',
      options: allPartners.map(p => ({ label: p as string, value: p as string })),
      value: partnerFilter,
      onChange: (val: string[]) => { setPartnerFilter(val); if (val.length > 0) setExpandedSocios({}); },
    },
    {
      key: 'socio',
      label: 'Sócio',
      icon: Scale,
      type: 'multi',
      options: allSocios.map(s => ({ label: s as string, value: s as string })),
      value: socioFilter,
      onChange: (val: string[]) => { setSocioFilter(val); if (val.length > 0) setExpandedSocios({}); },
    },
    {
      key: 'status',
      label: 'Status',
      icon: Activity,
      type: 'multi',
      options: allStatuses.map(s => ({ label: s as string, value: s as string })),
      value: statusFilter,
      onChange: setStatusFilter,
    },
  ], [partnerFilter, socioFilter, statusFilter, allPartners, allSocios, allStatuses]);

  const activeFilterCount = useMemo(() => {
    return partnerFilter.length + socioFilter.length + statusFilter.length;
  }, [partnerFilter, socioFilter, statusFilter]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    partnerFilter.forEach(p => {
      chips.push({ key: `partner-${p}`, label: `Líder: ${p}`, onClear: () => setPartnerFilter(prev => prev.filter(v => v !== p)) });
    });
    socioFilter.forEach(s => {
      chips.push({ key: `socio-${s}`, label: `Sócio: ${s}`, onClear: () => setSocioFilter(prev => prev.filter(v => v !== s)) });
    });
    statusFilter.forEach(s => {
      chips.push({ key: `status-${s}`, label: `Status: ${s}`, onClear: () => setStatusFilter(prev => prev.filter(v => v !== s)) });
    });
    return chips;
  }, [partnerFilter, socioFilter, statusFilter]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setPartnerFilter([]);
    setSocioFilter([]);
    setStatusFilter(['Ativo']);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6 overflow-hidden">

      {/* 1. Header - Salomão Design System (Padrão Colaboradores) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        {/* Left: Título e Ícone */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-2.5 sm:p-3 shadow-lg shrink-0">
            <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Volumetria</h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">Visão Analítica LegalOne</p>
          </div>
        </div>

        {/* Right: Tabs + Actions */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto justify-end mt-2 md:mt-0">
          {/* Abas */}
          <div className="flex items-center bg-gray-100/80 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <BarChart3 className="h-4 w-4" /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab('processos')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'processos' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Layers className="h-4 w-4" /> Base de Processos
            </button>
          </div>

          {/* Botões de Ação */}
          {activeTab === 'dashboard' && volumetryByPartner.length > 0 && (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportDashboard} 
                className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 text-[#00b87c] rounded-xl hover:bg-emerald-50 transition-all shadow-lg active:scale-95"
                title="Exportar em XLSX"
              >
                <FileDown className="w-5 h-5" />
              </button>
              
              <button 
                onClick={handleExportPDF} 
                disabled={isExportingPDF}
                className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 text-red-500 rounded-xl hover:bg-red-50 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                title="Exportar Dashboard em PDF"
              >
                {isExportingPDF ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
              </button>
            </div>
          )}
          <div id="volumetry-actions" className="flex items-center gap-2 empty:hidden"></div>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="flex flex-col space-y-6" id="volumetry-dashboard-content">
          {/* Dashboard Filters ou Cabeçalho Elegante de Relatório PDF */}
          {!isExportingPDF ? (
            <FilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              categories={filterCategories}
              activeFilterChips={activeFilterChips}
              activeFilterCount={activeFilterCount}
              onClearAll={clearAllFilters}
            />
          ) : (
            <div className="bg-gradient-to-r from-[#1e3a8a] to-[#112240] p-6 rounded-2xl shadow-sm text-white flex flex-col gap-4 border border-[#ffffff10]">
              <div className="border-b border-[#ffffff20] pb-4">
                <h2 className="text-xl font-black uppercase tracking-widest">Relatório de Volumetria Analítica</h2>
                <p className="text-xs font-bold text-blue-200 mt-1 uppercase tracking-widest">Posição em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="flex gap-10">
                 <div>
                   <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">Sócio(s)</p>
                   <p className="text-sm font-black uppercase tracking-tight">{socioFilter.length > 0 ? socioFilter.join(', ') : 'Todos os Sócios Gerais'}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">Líder(es)</p>
                   <p className="text-sm font-black uppercase tracking-tight">{partnerFilter.length > 0 ? partnerFilter.join(', ') : 'Todos os Líderes'}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">Status</p>
                   <p className="text-sm font-black uppercase tracking-tight">{statusFilter.length > 0 ? statusFilter.join(', ') : 'Geral / Base Total'}</p>
                 </div>
              </div>
            </div>
          )}

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-full w-1 bg-blue-600"></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total de Processos</p>
                <p className="text-2xl font-black text-blue-900 mt-1">{totalProcesses.toLocaleString('pt-BR')}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Scale className="h-6 w-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-full w-1 bg-emerald-600"></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Processos Ativos</p>
                <p className="text-2xl font-black text-emerald-900 mt-1">{ativosCount.toLocaleString('pt-BR')}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <Activity className="h-6 w-6 text-emerald-600" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-full w-1 bg-amber-500"></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Processos Encerrados</p>
                <p className="text-2xl font-black text-amber-900 mt-1">{arquivadosCount.toLocaleString('pt-BR')}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-full w-1 bg-purple-600"></div>
              <div className="flex items-center justify-between w-full">
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Clientes Únicos</p>
                   <p className="text-2xl font-black text-purple-900 mt-1">{uniqueClients.toLocaleString('pt-BR')}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl">
                  <PieChart className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden group md:col-span-4 lg:col-span-1">
              <div className="absolute right-0 top-0 h-full w-1 bg-rose-600"></div>
              <div className="flex items-center justify-between w-full">
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Processos Duplicados</p>
                   <p className="text-2xl font-black text-rose-900 mt-1">{(duplicadosCount as number).toLocaleString('pt-BR')}</p>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl">
                  <Layers className="h-6 w-6 text-rose-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Volumetria por Responsável */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <h2 className="text-sm font-black text-[#0a192f] uppercase tracking-widest flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#1e3a8a]" /> Distribuição por Sócio Responsável
                </h2>
                <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100/50 shadow-sm">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-sm font-black text-emerald-700">{ativosCount.toLocaleString('pt-BR')}</span>
                   <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Base Ativa Total</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-20 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin mx-auto mb-4" />
                Carregando visão analítica...
              </div>
            ) : volumetryByPartner.length === 0 ? (
              <div className="p-20 text-center">
                <EmptyState
                  icon={BarChart3}
                  title="Sem dados disponíveis"
                  description={processes.length === 0 ? "Nenhum processo foi importado na aba 'Base de Processos'." : "Ajuste os filtros de busca para visualizar os dados."}
                />
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar p-0 sm:p-5">
                <div className="min-w-[800px] rounded-t-2xl overflow-hidden border border-[#ffffff10] shadow-sm">
                  <table className="w-full text-left border-collapse">

                    <tbody className="divide-y divide-gray-50">
                      {volumetryBySocio.map(([socioName, lideres]) => {
                        const totalAtivos = lideres.reduce((sum, l) => sum + l.ativos, 0);
                        const totalArquivados = lideres.reduce((sum, l) => sum + l.arquivados, 0);
                        const totalAdmin = lideres.reduce((sum, l) => sum + l.administrativo, 0);
                        const totalJudic = lideres.reduce((sum, l) => sum + l.judicial, 0);
                        const totalArb = lideres.reduce((sum, l) => sum + l.arbitral, 0);
                        const isExpanded = expandedSocios[socioName] ?? (partnerFilter.length > 0 || socioFilter.length > 0);
                        
                        return (
                        <Fragment key={socioName}>
                          <tr 
                            className="bg-gray-50/80 cursor-pointer hover:bg-gray-100 transition-colors group"
                            onClick={() => toggleSocio(socioName)}
                          >
                            <td colSpan={7} className="p-4 border-b border-gray-100">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-4 shrink-0">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-sm transition-colors ${isExpanded ? 'bg-[#1e3a8a] text-white' : 'bg-blue-100 text-[#1e3a8a]'}`}>
                                    {socioName === 'Sem Sócio Definido' ? '?' : socioName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex flex-col w-[480px]">
                                    <span className="text-[13px] font-black text-[#0a192f] uppercase tracking-widest truncate" title={socioName}>{socioName}</span>
                                    {socioName === 'Sem Sócio Definido' && <span className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Líderes sem sócio atrelado</span>}
                                  </div>
                                  
                                  <div className="ml-4 w-[160px] px-3 py-1 bg-[#1e3a8a] text-white rounded-lg shadow-sm flex items-center justify-center gap-2 transform group-hover:scale-105 transition-all hidden md:flex">
                                    <Layers className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                                    <span className="text-xs font-black tracking-widest truncate">{totalAtivos.toLocaleString('pt-BR')} ATIVOS</span>
                                  </div>
                                </div>
                                {/* Badges de Resumo (Centro-Direita) */}
                                <div className="flex items-center justify-end gap-3 flex-1 pr-4 hidden lg:flex">
                                   <div className="flex items-center justify-center gap-3 w-[250px] bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm transition-transform hover:scale-105">
                                       <div className="flex items-center gap-1.5">
                                           <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Jud.</span>
                                           <span className="text-xs font-black">{totalJudic.toLocaleString('pt-BR')}</span>
                                       </div>
                                       <div className="w-px h-3 bg-gray-300"></div>
                                       <div className="flex items-center gap-1.5">
                                           <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Adm.</span>
                                           <span className="text-xs font-black">{totalAdmin.toLocaleString('pt-BR')}</span>
                                       </div>
                                       <div className="w-px h-3 bg-gray-300"></div>
                                       <div className="flex items-center gap-1.5">
                                           <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Arb.</span>
                                           <span className="text-xs font-black">{totalArb.toLocaleString('pt-BR')}</span>
                                       </div>
                                   </div>

                                   <div className="flex items-center justify-between w-[150px] bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm transition-transform hover:scale-105">
                                       <span className="text-[10px] uppercase font-black tracking-widest">Encerrados</span>
                                       <span className="text-xs font-black bg-amber-100/80 px-2 py-0.5 rounded-md">{totalArquivados.toLocaleString('pt-BR')}</span>
                                   </div>
                                </div>

                                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm transition-all ${isExpanded ? 'bg-blue-50 border-blue-200 text-[#1e3a8a]' : 'bg-white border-blue-100 text-[#1e3a8a] group-hover:bg-blue-50 group-hover:border-blue-300 group-hover:scale-110'}`} title={isExpanded ? "Recolher" : "Expandir"}>
                                  {isExpanded ? <ChevronUp className="w-5 h-5 stroke-[3]" /> : <ChevronDown className="w-5 h-5 stroke-[3]" />}
                                </div>
                              </div>
                            </td>
                          </tr>
                          
                          {isExpanded && (
                            <>
                              <tr className="bg-gradient-to-r from-[#1e3a8a]/5 to-transparent border-b border-gray-100">
                                <th className="py-3 px-4 pl-12 text-[10px] font-black text-blue-900 uppercase tracking-widest text-left">Líder Responsável</th>
                                <th className="py-3 px-4 text-center border-x border-gray-100 align-middle">
                                   <div className="text-[10px] font-black text-blue-900 uppercase tracking-widest leading-none">Ativos</div>
                                   <div className="text-[8px] font-bold text-gray-500 mt-0.5 uppercase tracking-tight">(Admin + Judic + Arb)</div>
                                </th>
                                <th className="py-3 px-4 text-center text-[10px] font-black text-blue-900 uppercase tracking-widest">Admin.</th>
                                <th className="py-3 px-4 text-center text-[10px] font-black text-blue-900 uppercase tracking-widest">Judic.</th>
                                <th className="py-3 px-4 text-center text-[10px] font-black text-blue-900 uppercase tracking-widest border-r border-gray-100">Arb.</th>
                                <th className="py-3 px-4 text-center text-[10px] font-black text-blue-900 uppercase tracking-widest border-r border-gray-100">Encerrados</th>
                                <th className="py-3 px-4 text-[10px] font-black text-blue-900 uppercase tracking-widest text-left">Representatividade na Base</th>
                              </tr>
                              {lideres.map((partner, idx) => (
                                <tr key={`${socioName}-${idx}`} className="hover:bg-blue-50/30 transition-colors group">
                              <td className="p-4 pl-12 border-l-[3px] border-transparent group-hover:border-blue-400">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-white text-[#1e3a8a] flex items-center justify-center font-black text-xs border border-gray-100 shadow-sm">
                                    {partner.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">{partner.name}</span>
                                </div>
                              </td>
                              <td className="p-4 text-center border-x border-gray-50 align-middle">
                                <div className="w-[52px] h-[24px] leading-[24px] text-center inline-block bg-emerald-50 text-emerald-700 rounded-lg font-black text-[10px] uppercase tracking-widest border border-emerald-100">
                                  {partner.ativos.toLocaleString('pt-BR')}
                                </div>
                              </td>
                              <td className="p-4 text-center align-middle">
                                <div className="w-[52px] h-[24px] leading-[24px] text-center inline-block bg-gray-100 text-gray-600 rounded-lg font-black text-[10px] uppercase tracking-widest border border-gray-200">
                                  {partner.administrativo.toLocaleString('pt-BR')}
                                </div>
                              </td>
                              <td className="p-4 text-center align-middle">
                                <div className="w-[52px] h-[24px] leading-[24px] text-center inline-block bg-gray-100 text-gray-600 rounded-lg font-black text-[10px] uppercase tracking-widest border border-gray-200">
                                  {partner.judicial.toLocaleString('pt-BR')}
                                </div>
                              </td>
                              <td className="p-4 text-center border-r border-gray-50 align-middle">
                                <div className="w-[52px] h-[24px] leading-[24px] text-center inline-block bg-gray-100 text-gray-600 rounded-lg font-black text-[10px] uppercase tracking-widest border border-gray-200">
                                  {partner.arbitral.toLocaleString('pt-BR')}
                                </div>
                              </td>
                              <td className="p-4 text-center border-r border-gray-50 align-middle">
                                <div className="w-[52px] h-[24px] leading-[24px] text-center inline-block bg-amber-50 text-amber-900 rounded-lg font-black text-[10px] uppercase tracking-widest border border-amber-200">
                                  {partner.arquivados.toLocaleString('pt-BR')}
                                </div>
                              </td>
                              <td className="p-4 align-middle">
                                <div className="flex items-center gap-4">
                                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden max-w-[200px] border border-gray-200/50 shadow-inner">
                                    {parseFloat(partner.percentage) > 0 ? (
                                      <div
                                        className="bg-gradient-to-r from-[#1e3a8a] to-[#112240] h-full rounded-full transition-all duration-500"
                                        style={{ width: `${Math.max(0.6, parseFloat(partner.percentage))}%` }}
                                      ></div>
                                    ) : null}
                                  </div>
                                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest w-12">{partner.percentage}%</span>
                                </div>
                              </td>
                                </tr>
                              ))}
                            </>
                          )}
                        </Fragment>
                      )})}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Tema e Tempo */}
          <LifeCycleSection processes={lifeCycleProcesses} />

          {/* Distribuição por UF */}
          <UfChartSection processes={lifeCycleProcesses} isPartnerFiltered={partnerFilter.length > 0} leaderPartners={leaderPartners} />

          {/* Qualidade da Base */}
          {!loading && processes.length > 0 && (
            <DataQualitySection processes={filteredProcesses} />
          )}

        </div>
      ) : (
        <VolumetryProcesses />
      )}
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);

function EmptyState({ icon: Icon, title, description }: any) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10">
      <div className="bg-gray-100 p-4 rounded-full mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-xs text-gray-400 uppercase font-bold">{description}</p>
    </div>
  );
}

function DataQualitySection({ processes }: { processes: any[] }) {
  const total = processes.length;
  if (total === 0) return null;

  const fields = [
    { key: 'responsavel_principal', label: 'Responsável Principal' },
    { key: 'cliente_principal', label: 'Cliente Principal' },
    { key: 'numero_cnj', label: 'Número CNJ' },
    { key: 'status', label: 'Status' },
    { key: 'data_cadastro', label: 'Data de Cadastro' },
    { key: 'data_encerramento', label: 'Data de Encerramento' },
    { key: 'uf', label: 'UF (Estado)' },
    { key: 'tipo', label: 'Tipo de Ação' },
    { key: 'instancia', label: 'Instância' },
    { key: 'pasta', label: 'Pasta' },
  ];

  const stats = fields.map(f => {
    let relevantProcesses = processes;
    if (f.key === 'data_encerramento') {
      relevantProcesses = processes.filter(p => p.status?.toLowerCase() === 'encerrado');
    }
    const fieldTotal = relevantProcesses.length;
    const filled = relevantProcesses.filter(p => p[f.key] != null && String(p[f.key]).trim() !== '').length;
    const pct = fieldTotal > 0 ? Math.round((filled / fieldTotal) * 100) : 100;
    return { ...f, filled, fieldTotal, pct };
  }).sort((a, b) => a.pct - b.pct);

  const overallScore = Math.round(stats.reduce((sum, s) => sum + s.pct, 0) / stats.length);

  const getColor = (pct: number) => {
    if (pct >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' };
    if (pct >= 50) return { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' };
    return { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' };
  };

  const scoreColor = getColor(overallScore);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-sm font-black text-[#0a192f] uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#1e3a8a]" /> Qualidade da Base
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Score Geral</span>
          <span className={`px-3 py-1 rounded-lg font-black text-sm border ${scoreColor.bg} ${scoreColor.text}`}>
            {overallScore}%
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {stats.map(s => {
            const color = getColor(s.pct);
            return (
              <div key={s.key} className="flex items-center gap-4">
                <div className="w-[140px] shrink-0">
                  <p className="text-[11px] font-black text-[#0a192f] uppercase tracking-tight leading-normal" title={s.label}>{s.label}</p>
                </div>
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200/50 shadow-inner">
                    <div
                      className={`${color.bar} h-full rounded-full transition-all duration-700`}
                      style={{ width: `${s.pct}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-[90px] justify-end">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${color.text}`}>{s.pct}%</span>
                    <span className="text-[9px] font-bold text-gray-400">
                      {s.filled.toLocaleString('pt-BR')}/{s.fieldTotal.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}


